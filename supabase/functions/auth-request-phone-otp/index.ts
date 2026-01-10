import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

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
      .eq("type", "phone")
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
      .eq("type", "phone")
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

    // Get user phone
    const { data: user } = await supabase
      .from("users")
      .select("phone")
      .eq("id", userId)
      .single();

    if (!user || !user.phone) {
      return new Response(JSON.stringify({ error: "No phone number associated with this account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Delete any existing phone OTPs for this user
    await supabase
      .from("verification_otps")
      .delete()
      .eq("user_id", userId)
      .eq("type", "phone");

    // Insert new OTP
    const { error: insertError } = await supabase
      .from("verification_otps")
      .insert({
        user_id: userId,
        type: "phone",
        phone_otp: otp,
      });

    if (insertError) {
      console.error("Insert OTP error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to generate OTP" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log OTP request (without sensitive OTP value)
    console.log(`[PHONE OTP] OTP sent to user ${userId.substring(0, 8)}...`);

    return new Response(JSON.stringify({ message: "OTP sent successfully (check server logs)" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Request phone OTP error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
