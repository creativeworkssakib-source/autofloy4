import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
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

// JWT verification using native Web Crypto API (no external dependencies)
async function verifyJWT(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    // Decode payload
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log("[JWT] Token expired");
      return null;
    }
    
    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const signatureInput = encoder.encode(parts[0] + "." + parts[1]);
    const signatureBase64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (signatureBase64.length % 4)) % 4;
    const paddedSignature = signatureBase64 + "=".repeat(padding);
    const signatureBytes = Uint8Array.from(atob(paddedSignature), c => c.charCodeAt(0));
    
    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, signatureInput);
    if (!valid) {
      console.log("[JWT] Invalid signature");
      return null;
    }
    
    return payload.sub as string;
  } catch (error) {
    console.error("[JWT] Verification failed:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await verifyJWT(req.headers.get("Authorization"));
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
        from: "AutoFloy <noreply@fileforge.site>",
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

      console.log("[send-welcome-email] Email sent successfully:", emailData);
      
      return new Response(JSON.stringify({ 
        message: "Welcome email sent successfully" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (emailErr: unknown) {
      console.error("[send-welcome-email] Email send exception:", emailErr);
      return new Response(JSON.stringify({ 
        error: "Failed to send welcome email",
        code: "EMAIL_SEND_FAILED"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("[send-welcome-email] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
