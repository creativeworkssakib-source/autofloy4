import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getOTPEmailTemplate } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

// Rate limiting constants
const OTP_COOLDOWN_MS = 60000; // 60 seconds between OTP requests
const OTP_HOURLY_LIMIT = 10; // Max 10 OTPs per hour

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

    // Rate limiting: Check most recent OTP creation time
    const { data: recentOTPs, error: otpCheckError } = await supabase
      .from("verification_otps")
      .select("created_at")
      .eq("user_id", userId)
      .eq("type", "email")
      .order("created_at", { ascending: false })
      .limit(1);

    if (otpCheckError) {
      console.error("OTP check error:", otpCheckError);
    }

    // Check cooldown (60 seconds between requests)
    if (recentOTPs && recentOTPs.length > 0) {
      const lastOTPTime = new Date(recentOTPs[0].created_at).getTime();
      const timeSinceLastOTP = Date.now() - lastOTPTime;
      
      if (timeSinceLastOTP < OTP_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((OTP_COOLDOWN_MS - timeSinceLastOTP) / 1000);
        return new Response(JSON.stringify({ 
          error: `Please wait ${waitSeconds} seconds before requesting another OTP` 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check hourly limit (max 10 per hour)
    const hourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count: hourlyCount, error: countError } = await supabase
      .from("verification_otps")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "email")
      .gte("created_at", hourAgo);

    if (!countError && hourlyCount !== null && hourlyCount >= OTP_HOURLY_LIMIT) {
      console.warn(`Rate limit exceeded for user ${userId}: ${hourlyCount} OTPs in last hour`);
      return new Response(JSON.stringify({ 
        error: "Too many OTP requests. Please try again later." 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email and name
    const { data: user } = await supabase
      .from("users")
      .select("email, display_name")
      .eq("id", userId)
      .single();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Delete any existing email OTPs for this user
    await supabase
      .from("verification_otps")
      .delete()
      .eq("user_id", userId)
      .eq("type", "email");

    // Insert new OTP
    const { error: insertError } = await supabase
      .from("verification_otps")
      .insert({
        user_id: userId,
        type: "email",
        email_otp: otp,
      });

    if (insertError) {
      console.error("Insert OTP error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to generate OTP" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send premium email via Resend
    const resend = new Resend(resendApiKey);
    const emailHtml = getOTPEmailTemplate(otp, user.display_name || undefined);
    
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "AutoFloy <noreply@fileforge.site>",
        to: [user.email],
        subject: "🔐 Your AutoFloy Verification Code",
        html: emailHtml,
      });

      if (emailError) {
        console.error("Resend API error:", JSON.stringify(emailError, null, 2));
        
        const errorMessage = emailError.message || "";
        
        if (errorMessage.includes("testing emails") || errorMessage.includes("verify a domain")) {
          return new Response(JSON.stringify({ 
            error: "Email service is in testing mode. Please verify a domain at resend.com/domains to send emails to other recipients.",
            code: "DOMAIN_NOT_VERIFIED"
          }), {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        if (errorMessage.includes("API key")) {
          return new Response(JSON.stringify({ 
            error: "Email service configuration error. Please contact support.",
            code: "INVALID_API_KEY"
          }), {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({ 
          error: "Failed to send verification email. Please try again later.",
          code: "EMAIL_SEND_FAILED"
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.log("Premium email sent successfully:", emailData);
    } catch (emailErr: any) {
      console.error("Email send exception:", emailErr);
      
      const errorBody = emailErr?.message || String(emailErr);
      
      if (errorBody.includes("testing emails") || errorBody.includes("verify a domain")) {
        return new Response(JSON.stringify({ 
          error: "Email service is in testing mode. Please verify a domain at resend.com/domains to send emails to other recipients.",
          code: "DOMAIN_NOT_VERIFIED"
        }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: "Failed to send verification email. Please try again later.",
        code: "EMAIL_SEND_FAILED"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Email OTP sent to:", user.email);

    return new Response(JSON.stringify({ message: "OTP sent successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Request email OTP error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
