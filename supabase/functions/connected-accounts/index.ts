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

async function decryptToken(encryptedData: string): Promise<string> {
  try {
    // Check for v2 format
    if (encryptedData.startsWith("v2:")) {
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
    
    // Legacy v1 format fallback
    const [ivHex, encryptedHex] = encryptedData.split(":");
    const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const encrypted = new Uint8Array(encryptedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(tokenEncryptionKey.padEnd(32, "0").slice(0, 32));
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("[Decrypt] Failed to decrypt token:", error);
    throw error;
  }
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

      // Fetch pages with extended fields for AI automation
      const allPages: unknown[] = [];
      const pagesUrl = new URL(`https://graph.facebook.com/${FB_API_VERSION}/me/accounts`);
      pagesUrl.searchParams.set("access_token", userAccessToken);
      // Extended fields to auto-populate page_memory
      pagesUrl.searchParams.set("fields", "id,name,category,access_token,picture{url},about,description,bio,website,hours,phone,emails,location");
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

      // Store pages and auto-populate page_memory with Facebook data
      let connectedCount = 0;
      for (const page of allPages) {
        try {
          const p = page as Record<string, unknown>;
          const encryptedToken = await encryptToken(p.access_token as string);
          const pictureUrl = ((p.picture as Record<string, unknown>)?.data as Record<string, unknown>)?.url as string | undefined;

          // Extract extended page info for AI automation
          const pageAbout = p.about as string | undefined;
          const pageDescription = p.description as string | undefined;
          const pageBio = p.bio as string | undefined;
          const pageWebsite = p.website as string | undefined;
          const pagePhone = p.phone as string | undefined;
          const pageEmails = p.emails as string[] | undefined;
          const pageHours = p.hours as Record<string, unknown> | undefined;
          const pageLocation = p.location as Record<string, unknown> | undefined;

          // Build auto-generated business description from available Facebook data
          const autoBusinessDescription = [
            pageAbout,
            pageDescription,
            pageBio,
          ].filter(Boolean).join("\n\n") || null;

          // Build business context from location, website, etc.
          const locationStr = pageLocation ? 
            [pageLocation.street, pageLocation.city, pageLocation.country].filter(Boolean).join(", ") : null;
          
          const contactInfo = [
            pageWebsite ? `Website: ${pageWebsite}` : null,
            pagePhone ? `Phone: ${pagePhone}` : null,
            pageEmails?.length ? `Email: ${pageEmails[0]}` : null,
            locationStr ? `Location: ${locationStr}` : null,
          ].filter(Boolean).join("\n");

          const { data: insertedAccount, error: upsertError } = await supabase.from("connected_accounts").upsert({
            user_id: userId,
            platform: "facebook",
            external_id: p.id,
            name: p.name,
            category: p.category || null,
            access_token: "encrypted",
            access_token_encrypted: encryptedToken,
            is_connected: true, // Set to true immediately
            encryption_version: 2,
            picture_url: pictureUrl || null,
          }, { onConflict: "user_id,platform,external_id" }).select("id").single();

          if (!upsertError && insertedAccount) {
            connectedCount++;
            
            // Auto-create page_memory with fetched Facebook data and default automation settings
            const defaultAutomationSettings = {
              autoInboxReply: true,
              autoCommentReply: true,
              orderTaking: true,
              reactionOnComments: true,
              aiMediaUnderstanding: true,
            };
            
            const { error: memoryError } = await supabase.from("page_memory").upsert({
              user_id: userId,
              account_id: insertedAccount.id,
              page_id: p.id as string,
              page_name: p.name as string,
              business_category: p.category as string || null,
              business_description: autoBusinessDescription,
              custom_instructions: contactInfo || null,
              detected_language: "auto",
              preferred_tone: "friendly",
              automation_settings: defaultAutomationSettings,
              webhook_subscribed: true,
            }, { onConflict: "user_id,page_id" });

            if (memoryError) {
              console.error("[FB Callback] Error creating page_memory:", memoryError);
            } else {
              console.log(`[FB Callback] Auto-populated page_memory for ${p.name}`);
            }

            // Auto-create automation record for this page
            const { error: automationError } = await supabase.from("automations").upsert({
              user_id: userId,
              account_id: insertedAccount.id,
              name: `${p.name} - AI Auto Reply`,
              type: "message", // Use valid enum type
              is_enabled: true,
              config: defaultAutomationSettings,
            }, { onConflict: "user_id,account_id,type" });

            if (automationError) {
              console.error("[FB Callback] Error creating automation:", automationError);
            } else {
              console.log(`[FB Callback] Auto-created automation for ${p.name}`);
            }

            // Subscribe to Facebook Page webhooks
            try {
              const pageToken = p.access_token as string;
              const subscribeUrl = `https://graph.facebook.com/${FB_API_VERSION}/${p.id}/subscribed_apps`;
              const subscribeResponse = await fetch(subscribeUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                  access_token: pageToken,
                  subscribed_fields: "feed,messages,messaging_postbacks,message_reads,message_deliveries",
                }),
              });
              const subscribeResult = await subscribeResponse.json();
              if (subscribeResult.success) {
                console.log(`[FB Callback] Successfully subscribed to webhooks for ${p.name}`);
              } else {
                console.warn(`[FB Callback] Webhook subscription warning for ${p.name}:`, subscribeResult);
              }
            } catch (webhookError) {
              console.error(`[FB Callback] Webhook subscription error for ${p.name}:`, webhookError);
            }
          }
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
        // Get page_id from account for cleaning up page-related data
        const pageId = account.external_id;
        
        // Delete ALL related data for this page (complete cascade cleanup)
        console.log(`[Delete] Starting complete cleanup for page ${pageId} (account ${id})`);
        
        // 1. Delete AI conversations and orders for this page
        await supabase.from("ai_orders").delete().eq("page_id", pageId).eq("user_id", userId);
        await supabase.from("ai_conversations").delete().eq("page_id", pageId).eq("user_id", userId);
        
        // 2. Delete execution logs related to automations of this account
        const { data: accountAutomations } = await supabase
          .from("automations")
          .select("id")
          .eq("account_id", id)
          .eq("user_id", userId);
        
        if (accountAutomations && accountAutomations.length > 0) {
          const automationIds = accountAutomations.map(a => a.id);
          await supabase.from("execution_logs").delete().in("automation_id", automationIds);
        }
        
        // 3. Delete outgoing events for this account
        await supabase.from("outgoing_events").delete().eq("account_id", id).eq("user_id", userId);
        
        // 4. Delete page memory (AI context, business rules, etc.)
        await supabase.from("page_memory").delete().eq("account_id", id).eq("user_id", userId);
        
        // 5. Delete automations for this account
        await supabase.from("automations").delete().eq("account_id", id).eq("user_id", userId);
        
        // 6. Finally delete the connected account itself
        const { error: deleteError } = await supabase.from("connected_accounts").delete().eq("id", id).eq("user_id", userId);
        
        console.log(`[Delete] Cleanup complete for page ${pageId}`);

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

  // ========== POST - Re-subscribe webhooks ==========
  if (req.method === "POST" && action === "resubscribe-webhooks") {
    try {
      console.log("[Resubscribe] Starting webhook re-subscription for user:", userId);
      
      // Get all connected Facebook accounts with their encrypted tokens
      const { data: accounts, error: accountsError } = await supabase
        .from("connected_accounts")
        .select("id, external_id, name, access_token_encrypted")
        .eq("user_id", userId)
        .eq("platform", "facebook")
        .eq("is_connected", true);

      if (accountsError || !accounts || accounts.length === 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "No connected Facebook pages found" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: { pageId: string; pageName: string; success: boolean; error?: string }[] = [];

      for (const account of accounts) {
        try {
          // Decrypt the access token
          let pageToken: string;
          try {
            pageToken = await decryptToken(account.access_token_encrypted);
          } catch (decryptError) {
            console.error(`[Resubscribe] Failed to decrypt token for ${account.name}:`, decryptError);
            results.push({
              pageId: account.external_id,
              pageName: account.name || "Unknown",
              success: false,
              error: "Token decryption failed - please reconnect the page",
            });
            continue;
          }

          // Subscribe to Facebook Page webhooks
          const subscribeUrl = `https://graph.facebook.com/${FB_API_VERSION}/${account.external_id}/subscribed_apps`;
          const subscribeResponse = await fetch(subscribeUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              access_token: pageToken,
              subscribed_fields: "feed,messages,messaging_postbacks,message_reads,message_deliveries",
            }),
          });
          
          const subscribeResult = await subscribeResponse.json();
          
          if (subscribeResult.success) {
            console.log(`[Resubscribe] Successfully subscribed to webhooks for ${account.name}`);
            
            // Update page_memory to mark as subscribed
            await supabase.from("page_memory").update({
              webhook_subscribed: true,
            }).eq("page_id", account.external_id).eq("user_id", userId);
            
            results.push({
              pageId: account.external_id,
              pageName: account.name || "Unknown",
              success: true,
            });
          } else {
            console.error(`[Resubscribe] Webhook subscription failed for ${account.name}:`, subscribeResult);
            
            // Check if token is expired
            const errorCode = subscribeResult.error?.code;
            const errorMsg = errorCode === 190 
              ? "Token expired - please reconnect the page"
              : subscribeResult.error?.message || "Subscription failed";
            
            results.push({
              pageId: account.external_id,
              pageName: account.name || "Unknown",
              success: false,
              error: errorMsg,
            });
          }
        } catch (pageError) {
          console.error(`[Resubscribe] Error processing ${account.name}:`, pageError);
          results.push({
            pageId: account.external_id,
            pageName: account.name || "Unknown",
            success: false,
            error: "Processing error",
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      return new Response(JSON.stringify({ 
        success: successCount > 0,
        message: `Subscribed ${successCount} pages, ${failCount} failed`,
        results,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[Resubscribe] Error:", err);
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
