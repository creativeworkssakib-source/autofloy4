import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify, create } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

// Grace period: allow tokens expired up to 7 days ago to be refreshed
const REFRESH_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

async function getKey() {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(jwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function verifyTokenForRefresh(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const key = await getKey();
    // First try normal verification
    const payload = await verify(token, key);
    return payload.sub as string;
  } catch (error) {
    // If verification failed, try to decode and check if within grace period
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      
      const payloadBase64 = parts[1];
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);
      
      // Check if token has exp and sub
      if (!payload.exp || !payload.sub) return null;
      
      const expMs = payload.exp * 1000;
      const now = Date.now();
      
      // If expired but within grace period, allow refresh
      if (now > expMs && now - expMs < REFRESH_GRACE_PERIOD_MS) {
        console.log("Token expired but within grace period, allowing refresh");
        return payload.sub as string;
      }
      
      return null;
    } catch {
      return null;
    }
  }
}

async function createNewToken(userId: string, email: string): Promise<string> {
  const key = await getKey();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (24 * 60 * 60); // 24 hours
  
  return await create(
    { alg: "HS256", typ: "JWT" },
    { sub: userId, email, exp, iat: now },
    key
  );
}

function isUserActive(user: any): boolean {
  if (user.subscription_plan !== "none") {
    return true;
  }
  if (user.is_trial_active && user.trial_end_date) {
    const trialEnd = new Date(user.trial_end_date);
    return trialEnd > new Date();
  }
  return false;
}

function getRemainingTrialDays(user: any): number | null {
  if (!user.trial_end_date || !user.is_trial_active) {
    return null;
  }
  const trialEnd = new Date(user.trial_end_date);
  const now = new Date();
  const diff = trialEnd.getTime() - now.getTime();
  if (diff <= 0) {
    return 0;
  }
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await verifyTokenForRefresh(req.headers.get("Authorization"));
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if trial has expired and update if necessary
    if (user.is_trial_active && user.trial_end_date) {
      const trialEnd = new Date(user.trial_end_date);
      if (trialEnd < new Date()) {
        await supabase
          .from("users")
          .update({ is_trial_active: false })
          .eq("id", userId);
        user.is_trial_active = false;
      }
    }

    // Generate a fresh token
    const newToken = await createNewToken(user.id, user.email);

    const userResponse = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      subscription_plan: user.subscription_plan,
      trial_end_date: user.trial_end_date,
      is_trial_active: user.is_trial_active,
      subscription_started_at: user.subscription_started_at,
      subscription_ends_at: user.subscription_ends_at,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      is_active: isUserActive(user),
      remaining_trial_days: getRemainingTrialDays(user),
    };

    return new Response(JSON.stringify({ user: userResponse, token: newToken }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Refresh user error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
