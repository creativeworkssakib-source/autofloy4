import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getWelcomeEmailTemplate } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!

async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    const payload = await verify(token, key);
    return payload.sub as string;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await verifyToken(req.headers.get("Authorization"));
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { otp } = await req.json();

    if (!otp) {
      return new Response(JSON.stringify({ error: "OTP is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get latest email OTP for this user
    const { data: otpRecord, error: fetchError } = await supabase
      .from("verification_otps")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "email")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !otpRecord) {
      return new Response(JSON.stringify({ error: "No OTP found. Please request a new one." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if OTP is expired (10 minutes)
    const createdAt = new Date(otpRecord.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (diffMinutes > 10) {
      // Delete expired OTP
      await supabase.from("verification_otps").delete().eq("id", otpRecord.id);
      return new Response(JSON.stringify({ error: "OTP has expired. Please request a new one." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify OTP
    if (otpRecord.email_otp !== parseInt(otp)) {
      return new Response(JSON.stringify({ error: "Invalid OTP" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update user email_verified status
    const { error: updateError } = await supabase
      .from("users")
      .update({ email_verified: true })
      .eq("id", userId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to verify email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete used OTP
    await supabase.from("verification_otps").delete().eq("id", otpRecord.id);

    console.log("Email verified for user:", userId);

    // Get user details for welcome email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, display_name, subscription_plan")
      .eq("id", userId)
      .single();

    if (!userError && user) {
      // Send welcome/congratulations email
      try {
        const resend = new Resend(resendApiKey);
        const userName = user.display_name || user.email.split("@")[0];
        const emailHtml = getWelcomeEmailTemplate(userName, user.email);

        const { error: emailError } = await resend.emails.send({
          from: "AutoFloy <noreply@autofloy.online>",
          to: [user.email],
          subject: "🎉 Welcome to AutoFloy - Your Account is Verified!",
          html: emailHtml,
        });

        if (emailError) {
          console.error("Welcome email error:", emailError);
        } else {
          console.log("Welcome email sent to:", user.email);
        }
      } catch (emailErr) {
        console.error("Welcome email exception:", emailErr);
      }
    }

    return new Response(JSON.stringify({ message: "Email verified successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Verify email OTP error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
