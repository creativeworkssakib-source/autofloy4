import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get company name from site settings
    const { data: siteSettings } = await supabase.from("site_settings").select("company_name").limit(1).maybeSingle();
    const companyName = (siteSettings?.company_name as string) || "Company";

    // Find user by email
    const { data: user } = await supabase
      .from("users")
      .select("id, email, display_name")
      .eq("email", email)
      .maybeSingle();

    // Always return success to prevent email enumeration
    if (!user) {
      console.log("Password reset requested for non-existent email:", email);
      return new Response(JSON.stringify({ message: "If an account with that email exists, a reset link has been sent." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Delete any existing password reset OTPs for this user
    await supabase
      .from("verification_otps")
      .delete()
      .eq("user_id", user.id)
      .eq("type", "password_reset");

    // Insert new OTP
    const { error: insertError } = await supabase
      .from("verification_otps")
      .insert({
        user_id: user.id,
        type: "password_reset",
        email_otp: otp,
      });

    if (insertError) {
      console.error("Insert OTP error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to generate reset code" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email via Resend
    const resend = new Resend(resendApiKey);
    const { error: emailError } = await resend.emails.send({
      from: `${companyName} <noreply@autofloy.online>`,
      to: [user.email],
      subject: `Reset Your Password - ${companyName}`,
      html: `
        <h1>Password Reset Request</h1>
        <p>Hi ${user.display_name || 'there'},</p>
        <p>You requested to reset your password. Use the code below:</p>
        <h2 style="font-size: 32px; letter-spacing: 4px; background: #f4f4f4; padding: 16px; text-align: center;">${otp}</h2>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The ${companyName} Team</p>
      `,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      return new Response(JSON.stringify({ error: "Failed to send reset email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Password reset OTP sent to:", user.email);

    return new Response(JSON.stringify({ message: "If an account with that email exists, a reset link has been sent." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Request password reset error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
