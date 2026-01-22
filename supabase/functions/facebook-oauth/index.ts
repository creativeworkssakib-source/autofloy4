import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;
const tokenEncryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
const facebookAppId = Deno.env.get("FACEBOOK_APP_ID");
const facebookAppSecret = Deno.env.get("FACEBOOK_APP_SECRET");
const facebookRedirectUri = Deno.env.get("FACEBOOK_REDIRECT_URI");

// Facebook Graph API version
const FB_API_VERSION = "v21.0";

/**
 * FACEBOOK_SCOPES - Valid permissions for Page management
 * 
 * These scopes are required for automation features:
 * - pages_show_list: List pages the user manages (REQUIRED, no dependencies)
 * - pages_read_engagement: Read page content, followers, metadata (depends on pages_show_list)
 * - pages_manage_posts: Create/edit/delete posts (depends on pages_read_engagement, pages_show_list)
 * - pages_manage_metadata: Subscribe to webhooks, update settings (depends on pages_show_list)
 * - pages_messaging: Manage Messenger conversations (depends on pages_manage_metadata, pages_show_list)
 * 
 * IMPORTANT: These permissions require App Review for production use.
 * In development mode, only test users (app admins/developers/testers) can grant them.
 * 
 * Reference: https://developers.facebook.com/docs/permissions
 */
const FACEBOOK_SCOPES = [
  // Core permission - required to list pages
  "pages_show_list",
  // Read page content and metadata
  "pages_read_engagement",
  // Create and manage posts (for posting automation)
  "pages_manage_posts",
  // Manage page settings and webhooks
  "pages_manage_metadata",
  // Messenger inbox access (for DM automation)
  "pages_messaging",
  // Read user content and comments on page
  "pages_read_user_content",
  // Manage comments (reply, delete, hide)
  "pages_manage_engagement",
];

// Secure AES-GCM encryption with PBKDF2 key derivation (v2 format)
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
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );
  
  return `v2:${base64Encode(salt.buffer)}:${base64Encode(iv.buffer)}:${base64Encode(encrypted)}`;
}

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
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

function getAppBaseUrl(): string {
  // Always redirect to the published app URL
  // The FACEBOOK_REDIRECT_URI is the edge function URL, not the app URL
  const appUrl = Deno.env.get("APP_BASE_URL");
  if (appUrl) {
    return appUrl.replace(/\/$/, ""); // Remove trailing slash if any
  }
  // Fallback to hardcoded production URL
  return "https://autofloy4.lovable.app";
}

// Parse Facebook error for user-friendly messages
function parseFacebookError(error: any): { code: string; message: string } {
  if (!error) {
    return { code: "unknown_error", message: "An unknown error occurred" };
  }

  const fbError = error.error || error;
  const code = fbError.code?.toString() || "unknown";
  const type = fbError.type || "";
  const message = fbError.message || "Facebook returned an error";
  const subcode = fbError.error_subcode?.toString() || "";

  // Common Facebook error codes
  if (code === "190" || type === "OAuthException") {
    if (subcode === "460") {
      return { code: "password_changed", message: "The user changed their password. Please reconnect." };
    }
    if (subcode === "463") {
      return { code: "token_expired", message: "The access token has expired. Please reconnect." };
    }
    if (subcode === "467") {
      return { code: "token_invalid", message: "The access token is invalid. Please reconnect." };
    }
    return { code: "auth_error", message: "Authentication failed. Please try again." };
  }

  if (code === "10" || message.toLowerCase().includes("permission")) {
    return { 
      code: "permission_denied", 
      message: "Required permissions were not granted. Please allow all requested permissions." 
    };
  }

  if (code === "4" || code === "17") {
    return { code: "rate_limit", message: "Too many requests. Please wait a moment and try again." };
  }

  return { code: `fb_error_${code}`, message };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  let action = url.searchParams.get("action");
  
  // Auto-detect callback if 'code' parameter exists (Facebook redirect)
  if (!action && url.searchParams.has("code")) {
    action = "callback";
    console.log("[Facebook OAuth] Auto-detected callback from Facebook redirect");
  }

  console.log(`[Facebook OAuth] action=${action}`);

  // GET oauth/start - Returns the Facebook OAuth URL
  if (req.method === "GET" && action === "start") {
    const userId = await verifyToken(req.headers.get("Authorization"));
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!facebookAppId || !facebookAppSecret || !facebookRedirectUri) {
      console.error("[Facebook OAuth] Missing configuration:", {
        hasAppId: !!facebookAppId,
        hasAppSecret: !!facebookAppSecret,
        hasRedirectUri: !!facebookRedirectUri,
      });
      return new Response(JSON.stringify({ 
        error: "Facebook OAuth is not configured. Please add FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, and FACEBOOK_REDIRECT_URI secrets.",
        configured: false 
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate CSRF state token with user ID
    const state = btoa(JSON.stringify({ 
      userId, 
      timestamp: Date.now(),
      nonce: crypto.randomUUID(),
    }));
    
    // Join scopes with comma (Facebook's expected format)
    const scopeString = FACEBOOK_SCOPES.join(",");

    const oauthUrl = new URL(`https://www.facebook.com/${FB_API_VERSION}/dialog/oauth`);
    oauthUrl.searchParams.set("client_id", facebookAppId);
    oauthUrl.searchParams.set("redirect_uri", facebookRedirectUri);
    oauthUrl.searchParams.set("scope", scopeString);
    oauthUrl.searchParams.set("state", state);
    oauthUrl.searchParams.set("response_type", "code");

    console.log(`[Facebook OAuth] Generated OAuth URL for user ${userId.substring(0, 8)}...`);
    console.log(`[Facebook OAuth] Requested scopes: ${scopeString}`);

    return new Response(JSON.stringify({ 
      url: oauthUrl.toString(), 
      configured: true,
      scopes: FACEBOOK_SCOPES,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // GET oauth/callback - Handles the OAuth callback from Facebook
  if (req.method === "GET" && action === "callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorReason = url.searchParams.get("error_reason");
    const errorDescription = url.searchParams.get("error_description");

    const appBaseUrl = getAppBaseUrl();
    
    console.log(`[Facebook OAuth Callback] code=${!!code}, state=${!!state}, error=${error}`);

    // Handle OAuth errors from Facebook
    if (error) {
      console.error(`[Facebook OAuth] Error from Facebook: ${error} - ${errorReason} - ${errorDescription}`);
      
      let userMessage = errorDescription || "Facebook connection was cancelled or denied.";
      let errorCode = error;

      if (error === "access_denied") {
        userMessage = "You cancelled the Facebook connection or denied the required permissions.";
        errorCode = "access_denied";
      }

      return new Response(null, {
        status: 302,
        headers: { 
          Location: `${appBaseUrl}/connect-facebook?error=${encodeURIComponent(errorCode)}&message=${encodeURIComponent(userMessage)}` 
        },
      });
    }

    if (!code || !state) {
      console.error("[Facebook OAuth] Missing code or state in callback");
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/connect-facebook?error=missing_params&message=${encodeURIComponent("Missing authorization code or state. Please try again.")}` },
      });
    }

    try {
      // Decode and validate state
      let stateData;
      try {
        stateData = JSON.parse(atob(state));
      } catch {
        throw new Error("Invalid state token");
      }

      const userId = stateData.userId;
      if (!userId) {
        throw new Error("Invalid state: missing userId");
      }

      // Check state timestamp (expire after 10 minutes)
      if (stateData.timestamp && Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        throw new Error("Authorization session expired. Please try again.");
      }

      console.log(`[Facebook OAuth] Processing callback for user ${userId.substring(0, 8)}...`);

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Variables for page tracking
      let connectedCount = 0;
      const connectedPageNames: string[] = [];

      // Exchange code for user access token
      const tokenUrl = new URL(`https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token`);
      tokenUrl.searchParams.set("client_id", facebookAppId!);
      tokenUrl.searchParams.set("redirect_uri", facebookRedirectUri!);
      tokenUrl.searchParams.set("client_secret", facebookAppSecret!);
      tokenUrl.searchParams.set("code", code);

      const tokenResponse = await fetch(tokenUrl.toString());
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error("[Facebook OAuth] Token exchange error:", tokenData.error);
        const parsed = parseFacebookError(tokenData);
        throw new Error(parsed.message);
      }

      const userAccessToken = tokenData.access_token;
      console.log("[Facebook OAuth] Successfully exchanged code for user access token");

      // Get user's Facebook pages with page access tokens
      const pagesUrl = new URL(`https://graph.facebook.com/${FB_API_VERSION}/me/accounts`);
      pagesUrl.searchParams.set("access_token", userAccessToken);
      pagesUrl.searchParams.set("fields", "id,name,category,fan_count,access_token,tasks,picture{url}");

      const pagesResponse = await fetch(pagesUrl.toString());
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        console.error("[Facebook OAuth] Pages fetch error:", pagesData.error);
        const parsed = parseFacebookError(pagesData);
        throw new Error(parsed.message);
      }

      const pages = pagesData.data || [];
      console.log(`[Facebook OAuth] Found ${pages.length} pages for user`);

      if (pages.length === 0) {
        console.warn("[Facebook OAuth] No pages found for user");
        return new Response(null, {
          status: 302,
          headers: { 
            Location: `${appBaseUrl}/connect-facebook?error=no_pages&message=${encodeURIComponent("No Facebook Pages found. Make sure you have admin access to at least one Facebook Page and granted all permissions.")}` 
          },
        });
      }

      // Store ALL pages with automation disabled - user will enable manually

      // Store ALL pages with is_connected = false (user must enable manually)
      for (const page of pages) {
        try {
          const encryptedToken = await encryptToken(page.access_token);
          
          // Store the page with is_connected = FALSE (automation disabled by default)
          // Extract picture URL from Facebook response
          const pictureUrl = page.picture?.data?.url || null;

          const { data: accountData, error: upsertError } = await supabase.from("connected_accounts").upsert({
            user_id: userId,
            platform: "facebook",
            external_id: page.id,
            name: page.name,
            category: page.category || null,
            access_token: "encrypted",
            access_token_encrypted: encryptedToken,
            is_connected: false, // User must manually enable automation
            encryption_version: 2,
            picture_url: pictureUrl, // Store page profile picture
          }, {
            onConflict: "user_id,platform,external_id",
          }).select("id").single();

          if (upsertError || !accountData) {
            console.error(`[Facebook OAuth] Failed to store page ${page.id}:`, upsertError);
            continue;
          }

          connectedCount++;
          connectedPageNames.push(page.name);
          console.log(`[Facebook OAuth] Stored page (disabled): ${page.name} (${page.id})`);
        } catch (pageError) {
          console.error(`[Facebook OAuth] Error processing page ${page.id}:`, pageError);
        }
      }

      if (connectedCount === 0) {
        throw new Error("Failed to store any Facebook pages. Please try again.");
      }

      console.log(`[Facebook OAuth] Stored ${connectedCount}/${pages.length} pages (disabled) for user ${userId.substring(0, 8)}...`);

      // Redirect to connect-facebook page with success - user will enable pages there
      return new Response(null, {
        status: 302,
        headers: { 
          Location: `${appBaseUrl}/connect-facebook?success=true&pages=${connectedCount}` 
        },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      console.error("[Facebook OAuth] Callback error:", errorMessage);
      
      return new Response(null, {
        status: 302,
        headers: { 
          Location: `${appBaseUrl}/connect-facebook?error=callback_failed&message=${encodeURIComponent(errorMessage)}` 
        },
      });
    }
  }

  // Return available scopes (for documentation/debugging)
  if (req.method === "GET" && action === "scopes") {
    return new Response(JSON.stringify({ 
      scopes: FACEBOOK_SCOPES,
      description: "These are the Facebook permissions requested by this app.",
      note: "These permissions require App Review for production use. In development mode, only test users can grant them.",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Handle case when action is missing but no code either
  if (!action) {
    return new Response(JSON.stringify({ 
      error: "Missing action parameter",
      hint: "Use action=start to begin OAuth, or this endpoint will auto-detect callback when Facebook redirects with 'code' parameter",
      available_actions: ["start", "callback", "scopes"]
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ 
    error: "Invalid action. Use action=start, action=callback, or action=scopes" 
  }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
