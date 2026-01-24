// Connected Accounts Edge Function - handles Facebook OAuth and account management
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, pragma",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;
const tokenEncryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
const facebookAppId = Deno.env.get("FACEBOOK_APP_ID");
const facebookAppSecret = Deno.env.get("FACEBOOK_APP_SECRET");
const facebookRedirectUri = Deno.env.get("FACEBOOK_REDIRECT_URI");

const FB_API_VERSION = "v21.0";

const FACEBOOK_SCOPES = [
  "pages_show_list",
  "pages_read_engagement", 
  "pages_manage_posts",
  "pages_manage_metadata",
  "pages_messaging",
  "pages_read_user_content",
  "pages_manage_engagement",
  "business_management",
];

// Fallback limits if database doesn't have the plan
const FALLBACK_LIMITS: Record<string, { maxFacebookPages: number; maxWhatsappAccounts: number }> = {
  none: { maxFacebookPages: 0, maxWhatsappAccounts: 0 },
  "free-trial": { maxFacebookPages: 10, maxWhatsappAccounts: 5 },
  trial: { maxFacebookPages: 10, maxWhatsappAccounts: 5 },
  starter: { maxFacebookPages: 1, maxWhatsappAccounts: 0 },
  professional: { maxFacebookPages: 2, maxWhatsappAccounts: 1 },
  business: { maxFacebookPages: 5, maxWhatsappAccounts: 2 },
  lifetime: { maxFacebookPages: 999, maxWhatsappAccounts: 99 },
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function encryptToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(tokenEncryptionKey),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  
  return `v2:${arrayBufferToBase64(salt.buffer)}:${arrayBufferToBase64(iv.buffer)}:${arrayBufferToBase64(encrypted)}`;
}

async function verifyJWT(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  
  const token = authHeader.substring(7);
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(payloadBase64));
    
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
    
    const signatureInput = encoder.encode(parts[0] + "." + parts[1]);
    const signatureBase64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (signatureBase64.length % 4)) % 4;
    const signatureBytes = Uint8Array.from(atob(signatureBase64 + "=".repeat(padding)), c => c.charCodeAt(0));
    
    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, signatureInput);
    return valid ? (payload.sub as string) : null;
  } catch {
    return null;
  }
}

interface PlanLimits {
  maxFacebookPages: number;
  maxWhatsappAccounts: number;
}

// deno-lint-ignore no-explicit-any
async function getPlanLimits(supabase: any, planId: string): Promise<PlanLimits> {
  const normalizedPlan = planId.toLowerCase();
  const dbPlanId = normalizedPlan === "trial" ? "free-trial" : normalizedPlan;

  const { data } = await supabase
    .from("pricing_plans")
    .select("max_facebook_pages")
    .eq("id", dbPlanId)
    .single();

  if (!data) return FALLBACK_LIMITS[normalizedPlan] || FALLBACK_LIMITS.none;

  const maxFbPages = typeof data.max_facebook_pages === 'number' ? data.max_facebook_pages : 0;

  return {
    maxFacebookPages: maxFbPages || FALLBACK_LIMITS[normalizedPlan]?.maxFacebookPages || 0,
    maxWhatsappAccounts: FALLBACK_LIMITS[normalizedPlan]?.maxWhatsappAccounts || 0,
  };
}

interface UserData {
  subscription_plan: string | null;
  is_trial_active: boolean | null;
  trial_end_date: string | null;
  subscription_ends_at: string | null;
}

interface UserPlanResult {
  plan: string;
  planName: string;
  isActive: boolean;
  reason?: string;
  maxFacebookPages: number;
  maxWhatsappAccounts: number;
}

// deno-lint-ignore no-explicit-any
async function getUserPlan(supabase: any, userId: string): Promise<UserPlanResult> {
  const { data, error } = await supabase
    .from("users")
    .select("subscription_plan, is_trial_active, trial_end_date, subscription_ends_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { plan: "none", planName: "No Plan", isActive: false, reason: "User not found", maxFacebookPages: 0, maxWhatsappAccounts: 0 };
  }

  const user = data as UserData;
  const now = new Date();
  const plan = (user.subscription_plan || "none").toLowerCase();
  
  if (plan === "trial" || plan === "free-trial") {
    if (user.is_trial_active && user.trial_end_date && new Date(user.trial_end_date) > now) {
      const limits = await getPlanLimits(supabase, "free-trial");
      return { plan: "trial", planName: "Trial", isActive: true, ...limits };
    }
    return { plan: "none", planName: "Expired", isActive: false, reason: "Trial ended.", maxFacebookPages: 0, maxWhatsappAccounts: 0 };
  }

  if (["starter", "professional", "business", "lifetime"].includes(plan)) {
    if (plan === "lifetime") {
      const limits = await getPlanLimits(supabase, "lifetime");
      return { plan: "lifetime", planName: "Lifetime", isActive: true, ...limits };
    }
    if (user.subscription_ends_at && new Date(user.subscription_ends_at) > now) {
      const limits = await getPlanLimits(supabase, plan);
      return { plan, planName: plan.charAt(0).toUpperCase() + plan.slice(1), isActive: true, ...limits };
    }
    return { plan: "none", planName: "Expired", isActive: false, reason: "Subscription expired.", maxFacebookPages: 0, maxWhatsappAccounts: 0 };
  }

  return { plan: "none", planName: "No Plan", isActive: false, reason: "No subscription.", maxFacebookPages: 0, maxWhatsappAccounts: 0 };
}

function getAppBaseUrl(): string {
  return Deno.env.get("APP_BASE_URL")?.replace(/\/$/, "") || "https://autofloy4.lovable.app";
}

serve(async (req) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  
  console.log(`[connected-accounts] ${req.method} action=${action}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ========== FACEBOOK OAUTH: CALLBACK (no auth header, Facebook redirects here) ==========
  if (req.method === "GET" && action === "fb-callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    const appBaseUrl = getAppBaseUrl();

    console.log(`[FB Callback] code=${!!code}, state=${!!state}, error=${error}`);

    if (error) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/connect-facebook?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || "Connection cancelled")}` },
      });
    }

    if (!code || !state) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/connect-facebook?error=missing_params&message=${encodeURIComponent("Missing code or state")}` },
      });
    }

    try {
      let stateData;
      try { stateData = JSON.parse(atob(state)); } catch { throw new Error("Invalid state"); }

      const userId = stateData.userId;
      if (!userId) throw new Error("Missing userId");

      if (stateData.timestamp && Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        throw new Error("Session expired");
      }

      console.log(`[FB Callback] Processing for user ${userId.substring(0, 8)}...`);

      // Exchange code for token
      const tokenUrl = new URL(`https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token`);
      tokenUrl.searchParams.set("client_id", facebookAppId!);
      tokenUrl.searchParams.set("redirect_uri", facebookRedirectUri!);
      tokenUrl.searchParams.set("client_secret", facebookAppSecret!);
      tokenUrl.searchParams.set("code", code);

      const tokenResponse = await fetch(tokenUrl.toString());
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error("[FB Callback] Token error:", tokenData.error);
        throw new Error(tokenData.error.message || "Token exchange failed");
      }

      const userAccessToken = tokenData.access_token;
      console.log("[FB Callback] Got access token");

      // Fetch pages
      const allPages: unknown[] = [];
      const pagesUrl = new URL(`https://graph.facebook.com/${FB_API_VERSION}/me/accounts`);
      pagesUrl.searchParams.set("access_token", userAccessToken);
      pagesUrl.searchParams.set("fields", "id,name,category,access_token,picture{url}");
      pagesUrl.searchParams.set("limit", "100");

      let pagesResponse = await fetch(pagesUrl.toString());
      let pagesData = await pagesResponse.json();

      if (pagesData.error) throw new Error(pagesData.error.message || "Failed to fetch pages");
      if (pagesData.data) allPages.push(...pagesData.data);

      while (pagesData.paging?.next) {
        pagesResponse = await fetch(pagesData.paging.next);
        pagesData = await pagesResponse.json();
        if (pagesData.error) break;
        if (pagesData.data) allPages.push(...pagesData.data);
      }

      console.log(`[FB Callback] Found ${allPages.length} pages`);

      if (allPages.length === 0) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${appBaseUrl}/connect-facebook?error=no_pages&message=${encodeURIComponent("No pages found")}` },
        });
      }

      // Store pages
      let connectedCount = 0;
      for (const page of allPages) {
        try {
          const p = page as Record<string, unknown>;
          const encryptedToken = await encryptToken(p.access_token as string);
          const pictureUrl = ((p.picture as Record<string, unknown>)?.data as Record<string, unknown>)?.url as string | undefined;

          const { error: upsertError } = await supabase.from("connected_accounts").upsert({
            user_id: userId,
            platform: "facebook",
            external_id: p.id,
            name: p.name,
            category: p.category || null,
            access_token: "encrypted",
            access_token_encrypted: encryptedToken,
            is_connected: false,
            encryption_version: 2,
            picture_url: pictureUrl || null,
          }, { onConflict: "user_id,platform,external_id" });

          if (!upsertError) connectedCount++;
        } catch (e) {
          console.error("[FB Callback] Error storing page:", e);
        }
      }

      if (connectedCount === 0) throw new Error("Failed to store pages");

      console.log(`[FB Callback] Stored ${connectedCount} pages`);
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/connect-facebook?success=true&pages=${connectedCount}` },
      });

    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      console.error("[FB Callback] Error:", msg);
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/connect-facebook?error=callback_failed&message=${encodeURIComponent(msg)}` },
      });
    }
  }

  // ========== AUTHENTICATED ROUTES BELOW ==========
  const userId = await verifyJWT(req.headers.get("Authorization"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ========== FACEBOOK OAUTH: START ==========
  if (req.method === "GET" && action === "fb-start") {
    if (!facebookAppId || !facebookAppSecret || !facebookRedirectUri) {
      return new Response(JSON.stringify({ error: "Facebook OAuth not configured", configured: false }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const state = btoa(JSON.stringify({ userId, timestamp: Date.now(), nonce: crypto.randomUUID() }));
    const oauthUrl = new URL(`https://www.facebook.com/${FB_API_VERSION}/dialog/oauth`);
    oauthUrl.searchParams.set("client_id", facebookAppId);
    oauthUrl.searchParams.set("redirect_uri", facebookRedirectUri);
    oauthUrl.searchParams.set("scope", FACEBOOK_SCOPES.join(","));
    oauthUrl.searchParams.set("state", state);
    oauthUrl.searchParams.set("response_type", "code");

    console.log(`[FB OAuth] Generated URL for user ${userId.substring(0, 8)}...`);

    return new Response(JSON.stringify({ url: oauthUrl.toString(), configured: true, scopes: FACEBOOK_SCOPES }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ========== GET - Fetch connected accounts ==========
  if (req.method === "GET" && !action) {
    try {
      const platform = url.searchParams.get("platform");
      let query = supabase
        .from("connected_accounts")
        .select("id, external_id, name, platform, category, is_connected, created_at, picture_url")
        .eq("user_id", userId);

      if (platform) query = query.eq("platform", platform);

      const [accountsResult, userPlan] = await Promise.all([
        query.order("created_at", { ascending: false }),
        getUserPlan(supabase, userId),
      ]);

      if (accountsResult.error) {
        return new Response(JSON.stringify({ error: "Failed to fetch accounts" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const accounts = accountsResult.data || [];
      const connectedFacebookPages = accounts.filter(a => a.platform === "facebook" && a.is_connected).length;

      return new Response(JSON.stringify({
        accounts,
        planLimits: {
          plan: userPlan.plan,
          planName: userPlan.planName,
          isActive: userPlan.isActive,
          maxFacebookPages: userPlan.maxFacebookPages,
          maxWhatsappAccounts: userPlan.maxWhatsappAccounts,
          connectedFacebookPages,
          canConnectMoreFacebook: connectedFacebookPages < userPlan.maxFacebookPages,
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ========== DELETE - Remove account ==========
  if (req.method === "DELETE") {
    try {
      const id = url.searchParams.get("id");
      const deleteAction = url.searchParams.get("action");

      if (!id) {
        return new Response(JSON.stringify({ error: "id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: account, error: fetchError } = await supabase
        .from("connected_accounts")
        .select("id, name, external_id")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !account) {
        return new Response(JSON.stringify({ error: "Account not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (deleteAction === "remove") {
        await supabase.from("page_memory").delete().eq("account_id", id).eq("user_id", userId);
        await supabase.from("automations").delete().eq("account_id", id).eq("user_id", userId);
        const { error: deleteError } = await supabase.from("connected_accounts").delete().eq("id", id).eq("user_id", userId);

        if (deleteError) {
          return new Response(JSON.stringify({ error: "Failed to remove account" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, message: `${account.name || "Account"} removed` }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        const { error } = await supabase.from("connected_accounts").update({ is_connected: false }).eq("id", id).eq("user_id", userId);

        if (error) {
          return new Response(JSON.stringify({ error: "Failed to disconnect" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, message: `${account.name || "Account"} disconnected` }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
