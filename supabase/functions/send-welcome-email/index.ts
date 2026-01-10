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
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user details
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, display_name, email_verified")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("User fetch error:", userError);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only send welcome email if email is verified
    if (!user.email_verified) {
      return new Response(JSON.stringify({ error: "Email not verified yet" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send welcome email
    const resend = new Resend(resendApiKey);
    const userName = user.display_name || user.email.split("@")[0];
    const emailHtml = getWelcomeEmailTemplate(userName, user.email);

    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "AutoFloy <noreply@autofloy.com>",
        to: [user.email],
        subject: "🎉 Welcome to AutoFloy - Your Account is Ready!",
        html: emailHtml,
      });

      if (emailError) {
        console.error("Resend API error:", JSON.stringify(emailError, null, 2));
        return new Response(JSON.stringify({ 
          error: "Failed to send welcome email",
          code: "EMAIL_SEND_FAILED"
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Welcome email sent successfully:", emailData);
      
      return new Response(JSON.stringify({ 
        message: "Welcome email sent successfully" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (emailErr: any) {
      console.error("Email send exception:", emailErr);
      return new Response(JSON.stringify({ 
        error: "Failed to send welcome email",
        code: "EMAIL_SEND_FAILED"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Send welcome email error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
