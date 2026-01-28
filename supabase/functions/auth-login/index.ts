import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { create } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

// Rate limiting constants
const MAX_LOGIN_ATTEMPTS_PER_IP = 10;
const MAX_LOGIN_ATTEMPTS_PER_EMAIL = 5;
const WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 15;

// Password verification using PBKDF2 (Web Crypto API - Edge Runtime compatible)
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
    
    // Extract salt (first 16 bytes) and hash (remaining bytes)
    const salt = combined.slice(0, 16);
    const storedHashBytes = combined.slice(16);
    
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    
    const derivedHash = new Uint8Array(derivedBits);
    
    // Constant-time comparison
    if (derivedHash.length !== storedHashBytes.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < derivedHash.length; i++) {
      result |= derivedHash[i] ^ storedHashBytes[i];
    }
    
    return result === 0;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

// Dummy hash for constant-time verification when user doesn't exist
const DUMMY_HASH = "AAAAAAAAAAAAAAAAAAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const emailLower = email.toLowerCase();
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60000).toISOString();
    
    // Check IP-based rate limit
    const { data: ipLimit } = await supabase
      .from("auth_rate_limits")
      .select("id, attempt_count, locked_until, window_start")
      .eq("identifier", clientIp)
      .eq("endpoint", "login")
      .gte("window_start", windowStart)
      .maybeSingle();

    if (ipLimit?.locked_until && new Date(ipLimit.locked_until as string) > new Date()) {
      console.warn(`[RATE LIMIT] IP blocked`);
      return new Response(JSON.stringify({ 
        error: "Too many login attempts from this location. Please try again later." 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ipLimit && (ipLimit.attempt_count as number) >= MAX_LOGIN_ATTEMPTS_PER_IP) {
      const lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString();
      await supabase
        .from("auth_rate_limits")
        .update({ locked_until: lockUntil })
        .eq("id", ipLimit.id);
      return new Response(JSON.stringify({ 
        error: "Too many login attempts from this location. Please try again later." 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Check email-based rate limit
    const { data: emailLimit } = await supabase
      .from("auth_rate_limits")
      .select("id, attempt_count, locked_until, window_start")
      .eq("identifier", emailLower)
      .eq("endpoint", "login")
      .gte("window_start", windowStart)
      .maybeSingle();

    if (emailLimit?.locked_until && new Date(emailLimit.locked_until as string) > new Date()) {
      console.warn(`[RATE LIMIT] Email rate limited`);
      return new Response(JSON.stringify({ 
        error: "Account temporarily locked due to too many failed attempts. Please try again later." 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (emailLimit && (emailLimit.attempt_count as number) >= MAX_LOGIN_ATTEMPTS_PER_EMAIL) {
      const lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString();
      await supabase
        .from("auth_rate_limits")
        .update({ locked_until: lockUntil })
        .eq("id", emailLimit.id);
      return new Response(JSON.stringify({ 
        error: "Account temporarily locked due to too many failed attempts. Please try again later." 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    // SECURITY: Always perform password verification to prevent timing attacks
    const hashToCompare = user?.password_hash || DUMMY_HASH;
    const isValidPassword = await verifyPassword(password, hashToCompare);

    // Add small random jitter (0-50ms) to mask any remaining timing differences
    const jitter = Math.floor(Math.random() * 50);
    await new Promise(resolve => setTimeout(resolve, jitter));

    // Return same error for both invalid user and invalid password
    if (findError || !user || !isValidPassword) {
      // Increment rate limits on failed attempt
      if (ipLimit) {
        await supabase
          .from("auth_rate_limits")
          .update({ attempt_count: (ipLimit.attempt_count as number) + 1 })
          .eq("id", ipLimit.id);
      } else {
        await supabase.from("auth_rate_limits").insert({
          identifier: clientIp,
          endpoint: "login",
          attempt_count: 1,
          window_start: new Date().toISOString(),
        });
      }

      if (emailLimit) {
        await supabase
          .from("auth_rate_limits")
          .update({ attempt_count: (emailLimit.attempt_count as number) + 1 })
          .eq("id", emailLimit.id);
      } else {
        await supabase.from("auth_rate_limits").insert({
          identifier: emailLower,
          endpoint: "login",
          attempt_count: 1,
          window_start: new Date().toISOString(),
        });
      }
      
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clear rate limits on successful login
    if (ipLimit) {
      await supabase.from("auth_rate_limits").delete().eq("id", ipLimit.id);
    }
    if (emailLimit) {
      await supabase.from("auth_rate_limits").delete().eq("id", emailLimit.id);
    }

    // Create JWT token
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const token = await create(
      { alg: "HS256", typ: "JWT" },
      {
        sub: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours (1 day)
      },
      key
    );

    const userResponse = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      subscription_plan: user.subscription_plan,
      subscription_type: user.subscription_type || 'online', // IMPORTANT: Include subscription_type
      trial_end_date: user.trial_end_date,
      is_trial_active: user.is_trial_active,
      subscription_started_at: user.subscription_started_at,
      subscription_ends_at: user.subscription_ends_at,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
    };

    console.log(`User logged in: ${user.id.substring(0, 8)}...`);

    return new Response(JSON.stringify({ token, user: userResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
