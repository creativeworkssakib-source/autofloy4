import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;
const tokenEncryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
const facebookAppId = Deno.env.get("FACEBOOK_APP_ID")!;

const FB_API_VERSION = "v21.0";
const GRAPH_API_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

// Fallback plan limits (used if database doesn't have the plan)
const FALLBACK_LIMITS: Record<string, number> = {
  none: 0,
  "free-trial": 10,
  trial: 10,
  starter: 1,
  professional: 2,
  business: 5,
  lifetime: 999,
};

// Decrypt v2 encrypted token
async function decryptToken(encryptedData: string): Promise<string> {
  if (!encryptedData.startsWith("v2:")) {
    throw new Error("Invalid token format - expected v2");
  }
  
  const parts = encryptedData.substring(3).split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid v2 token structure");
  }
  
  const [saltB64, ivB64, encryptedB64] = parts;
  
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const encrypted = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
  
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(tokenEncryptionKey),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

// Subscribe page to webhooks via Facebook Graph API
async function subscribePageToWebhooks(pageId: string, pageAccessToken: string): Promise<boolean> {
  try {
    console.log(`[Webhook Subscribe] Subscribing page ${pageId} to webhooks...`);
    
    // Subscribe to messages, feed, and messaging_postbacks
    const subscribeUrl = `${GRAPH_API_URL}/${pageId}/subscribed_apps`;
    
    const response = await fetch(subscribeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: pageAccessToken,
        subscribed_fields: ["messages", "feed", "messaging_postbacks"],
      }),
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.error(`[Webhook Subscribe] Error for page ${pageId}:`, result.error);
      return false;
    }
    
    console.log(`[Webhook Subscribe] Success for page ${pageId}:`, result);
    return result.success === true;
  } catch (error) {
    console.error(`[Webhook Subscribe] Exception for page ${pageId}:`, error);
    return false;
  }
}

// Unsubscribe page from webhooks
async function unsubscribePageFromWebhooks(pageId: string, pageAccessToken: string): Promise<boolean> {
  try {
    console.log(`[Webhook Unsubscribe] Unsubscribing page ${pageId} from webhooks...`);
    
    const unsubscribeUrl = `${GRAPH_API_URL}/${pageId}/subscribed_apps`;
    
    const response = await fetch(unsubscribeUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: pageAccessToken,
      }),
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.error(`[Webhook Unsubscribe] Error for page ${pageId}:`, result.error);
      return false;
    }
    
    console.log(`[Webhook Unsubscribe] Success for page ${pageId}:`, result);
    return result.success === true;
  } catch (error) {
    console.error(`[Webhook Unsubscribe] Exception for page ${pageId}:`, error);
    return false;
  }
}

// Simple JWT verification without external dependency
async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[verifyToken] No valid auth header");
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Decode JWT payload (base64url)
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.log("[verifyToken] Invalid JWT structure");
      return null;
    }
    
    // Decode payload
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log("[verifyToken] Token expired");
      return null;
    }
    
    // Verify signature using HMAC SHA-256
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    
    const signatureData = new TextEncoder().encode(parts[0] + "." + parts[1]);
    const signatureBytes = Uint8Array.from(
      atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );
    
    const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, signatureData);
    
    if (!isValid) {
      console.log("[verifyToken] Invalid signature");
      return null;
    }
    
    console.log(`[verifyToken] Valid token for user: ${payload.sub?.substring(0, 8)}...`);
    return payload.sub as string;
  } catch (error) {
    console.error("[verifyToken] Error:", error);
    return null;
  }
}

// deno-lint-ignore no-explicit-any
async function getPlanMaxPages(supabase: any, planId: string): Promise<number> {
  const normalizedPlan = planId.toLowerCase();
  const dbPlanId = normalizedPlan === "trial" ? "free-trial" : normalizedPlan;
  
  const { data, error } = await supabase
    .from("pricing_plans")
    .select("max_facebook_pages")
    .eq("id", dbPlanId)
    .single();

  if (error || !data) {
    console.log(`[getPlanMaxPages] Plan ${dbPlanId} not found, using fallback`);
    return FALLBACK_LIMITS[normalizedPlan] || 0;
  }

  const maxPages = data.max_facebook_pages as number | null;
  return maxPages || FALLBACK_LIMITS[normalizedPlan] || 0;
}

interface UserPlanResult {
  plan: string;
  maxPages: number;
  planName: string;
}

// deno-lint-ignore no-explicit-any
async function getUserPlan(supabase: any, userId: string): Promise<UserPlanResult> {
  const { data: user, error } = await supabase
    .from("users")
    .select("subscription_plan, is_trial_active, trial_end_date, subscription_ends_at")
    .eq("id", userId)
    .single();

  if (error || !user) {
    console.log(`[getUserPlan] User not found: ${userId}`);
    return { plan: "none", maxPages: 0, planName: "No Plan" };
  }

  const now = new Date();
  const subscriptionPlan = user.subscription_plan as string | null;
  const plan = subscriptionPlan?.toLowerCase() || "none";
  const isTrialActive = user.is_trial_active as boolean | null;
  const trialEndDate = user.trial_end_date as string | null;
  const subscriptionEndsAt = user.subscription_ends_at as string | null;
  
  // Check trial
  if (plan === "trial" || plan === "free-trial") {
    if (isTrialActive && trialEndDate) {
      const trialEnd = new Date(trialEndDate);
      if (trialEnd > now) {
        const maxPages = await getPlanMaxPages(supabase, "free-trial");
        return { plan: "trial", maxPages, planName: "Trial" };
      }
    }
    return { plan: "none", maxPages: 0, planName: "Expired" };
  }

  // Check paid plans
  if (["starter", "professional", "business", "lifetime"].includes(plan)) {
    if (plan === "lifetime") {
      const maxPages = await getPlanMaxPages(supabase, "lifetime");
      return { plan: "lifetime", maxPages, planName: "Lifetime" };
    }
    if (subscriptionEndsAt) {
      const subEnd = new Date(subscriptionEndsAt);
      if (subEnd > now) {
        const maxPages = await getPlanMaxPages(supabase, plan);
        const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
        return { plan, maxPages, planName };
      }
    }
    return { plan: "none", maxPages: 0, planName: "Expired" };
  }

  return { plan: "none", maxPages: 0, planName: "No Plan" };
}

serve(async (req) => {
  console.log(`[toggle-page-automation] ${req.method} request received`);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("[toggle-page-automation] CORS preflight");
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const userId = await verifyToken(req.headers.get("Authorization"));
    if (!userId) {
      console.log("[toggle-page-automation] Unauthorized - no valid token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // POST - Toggle page automation
    if (req.method === "POST") {
      const { page_id, enabled } = await req.json();

      if (!page_id || typeof enabled !== "boolean") {
        console.log("[toggle-page-automation] Bad request - missing params");
        return new Response(JSON.stringify({ error: "page_id and enabled (boolean) are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[Toggle Page] user=${userId.substring(0, 8)}... page=${page_id} enabled=${enabled}`);

      // Verify user owns this page and get encrypted token
      const { data: page, error: pageError } = await supabase
        .from("connected_accounts")
        .select("id, external_id, name, platform, is_connected, access_token_encrypted, encryption_version")
        .eq("id", page_id)
        .eq("user_id", userId)
        .eq("platform", "facebook")
        .single();

      if (pageError || !page) {
        console.log("[Toggle Page] Page not found:", pageError);
        return new Response(JSON.stringify({ error: "Page not found or access denied" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const externalPageId = page.external_id as string;
      const pageName = page.name as string;
      const encryptedToken = page.access_token_encrypted as string;

      // Decrypt the page access token
      let pageAccessToken: string;
      try {
        pageAccessToken = await decryptToken(encryptedToken);
        console.log(`[Toggle Page] Decrypted token for page ${pageName}`);
      } catch (decryptError) {
        console.error("[Toggle Page] Failed to decrypt token:", decryptError);
        return new Response(JSON.stringify({ error: "Failed to decrypt page token. Please reconnect Facebook." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If enabling, check plan limits
      if (enabled) {
        const userPlan = await getUserPlan(supabase, userId);
        console.log(`[Toggle Page] User plan: ${userPlan.planName}, max pages: ${userPlan.maxPages}`);
        
        if (userPlan.maxPages === 0) {
          return new Response(JSON.stringify({ 
            error: "Your subscription has expired. Please upgrade to enable automation.",
            upgrade_required: true,
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Count currently enabled pages (excluding this one)
        const { count: enabledCount } = await supabase
          .from("connected_accounts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("platform", "facebook")
          .eq("is_connected", true)
          .neq("id", page_id);

        const currentEnabled = enabledCount || 0;
        console.log(`[Toggle Page] Current enabled: ${currentEnabled}, max: ${userPlan.maxPages}`);

        if (currentEnabled >= userPlan.maxPages) {
          return new Response(JSON.stringify({ 
            error: `Your ${userPlan.planName} plan allows only ${userPlan.maxPages} Facebook page(s). Disable another page first or upgrade.`,
            upgrade_required: true,
            current_enabled: currentEnabled,
            max_allowed: userPlan.maxPages,
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // *** CRITICAL: Subscribe page to Facebook webhooks ***
        const webhookSubscribed = await subscribePageToWebhooks(externalPageId, pageAccessToken);
        if (!webhookSubscribed) {
          console.error(`[Toggle Page] Failed to subscribe page ${pageName} to webhooks`);
          return new Response(JSON.stringify({ 
            error: "Failed to subscribe page to Facebook webhooks. Please try again or reconnect Facebook.",
            webhook_error: true,
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log(`[Toggle Page] Successfully subscribed ${pageName} to Facebook webhooks`);
      } else {
        // If disabling, unsubscribe from webhooks
        const webhookUnsubscribed = await unsubscribePageFromWebhooks(externalPageId, pageAccessToken);
        console.log(`[Toggle Page] Webhook unsubscribe result for ${pageName}: ${webhookUnsubscribed}`);
      }

      // Update the page connection status
      const { error: updateError } = await supabase
        .from("connected_accounts")
        .update({ is_connected: enabled })
        .eq("id", page_id)
        .eq("user_id", userId);

      if (updateError) {
        console.error("[Toggle Page] Update error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update page status" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update page_memory
      await supabase.from("page_memory").upsert({
        user_id: userId,
        account_id: page.id,
        page_id: externalPageId,
        page_name: pageName,
        detected_language: "auto",
        preferred_tone: "friendly",
        webhook_subscribed: enabled,
        webhook_subscribed_at: enabled ? new Date().toISOString() : null,
        automation_settings: {},
      }, {
        onConflict: "user_id,page_id",
      });
      console.log(`[Toggle Page] Updated page_memory for: ${pageName}`);

      console.log(`[Toggle Page] Successfully ${enabled ? "enabled" : "disabled"} automation for: ${pageName}`);

      // Get updated connected count for live update
      const { count: newEnabledCount } = await supabase
        .from("connected_accounts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("platform", "facebook")
        .eq("is_connected", true);

      return new Response(JSON.stringify({ 
        success: true, 
        message: enabled 
          ? `Automation enabled for ${pageName} (Webhook subscribed)` 
          : `Automation disabled for ${pageName}`,
        is_connected: enabled,
        webhook_subscribed: enabled,
        connectedFacebookPages: newEnabledCount || 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[toggle-page-automation] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
