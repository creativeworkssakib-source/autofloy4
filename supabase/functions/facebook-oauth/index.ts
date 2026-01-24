import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

// Simple base64 encode for ArrayBuffer
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Secure AES-GCM encryption
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
  
  return `v2:${arrayBufferToBase64(salt.buffer)}:${arrayBufferToBase64(iv.buffer)}:${arrayBufferToBase64(encrypted)}`;
}

// JWT verification without external dependency
async function verifyJWT(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode payload
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log("[JWT] Token expired");
      return null;
    }
    
    // Verify signature using crypto.subtle
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
    
    // Pad base64 if needed
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

function getAppBaseUrl(): string {
  const appUrl = Deno.env.get("APP_BASE_URL");
  if (appUrl) {
    return appUrl.replace(/\/$/, "");
  }
  return "https://autofloy4.lovable.app";
}

function parseFacebookError(error: unknown): { code: string; message: string } {
  if (!error || typeof error !== "object") {
    return { code: "unknown_error", message: "An unknown error occurred" };
  }

  const err = error as Record<string, unknown>;
  const fbError = (err.error || err) as Record<string, unknown>;
  const code = String(fbError.code || "unknown");
  const type = String(fbError.type || "");
  const message = String(fbError.message || "Facebook returned an error");
  const subcode = String(fbError.error_subcode || "");

  if (code === "190" || type === "OAuthException") {
    if (subcode === "460") return { code: "password_changed", message: "The user changed their password. Please reconnect." };
    if (subcode === "463") return { code: "token_expired", message: "The access token has expired. Please reconnect." };
    if (subcode === "467") return { code: "token_invalid", message: "The access token is invalid. Please reconnect." };
    return { code: "auth_error", message: "Authentication failed. Please try again." };
  }

  if (code === "10" || message.toLowerCase().includes("permission")) {
    return { code: "permission_denied", message: "Required permissions were not granted." };
  }

  if (code === "4" || code === "17") {
    return { code: "rate_limit", message: "Too many requests. Please wait and try again." };
  }

  return { code: `fb_error_${code}`, message };
}

serve(async (req) => {
  console.log(`[Facebook OAuth] Request: ${req.method} ${req.url}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  let action = url.searchParams.get("action");
  
  // Auto-detect callback if 'code' parameter exists
  if (!action && url.searchParams.has("code")) {
    action = "callback";
    console.log("[Facebook OAuth] Auto-detected callback");
  }

  console.log(`[Facebook OAuth] action=${action}`);

  // GET ?action=start - Returns OAuth URL
  if (req.method === "GET" && action === "start") {
    const userId = await verifyJWT(req.headers.get("Authorization"));
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!facebookAppId || !facebookAppSecret || !facebookRedirectUri) {
      console.error("[Facebook OAuth] Missing config");
      return new Response(JSON.stringify({ 
        error: "Facebook OAuth not configured",
        configured: false 
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const state = btoa(JSON.stringify({ 
      userId, 
      timestamp: Date.now(),
      nonce: crypto.randomUUID(),
    }));
    
    const scopeString = FACEBOOK_SCOPES.join(",");

    const oauthUrl = new URL(`https://www.facebook.com/${FB_API_VERSION}/dialog/oauth`);
    oauthUrl.searchParams.set("client_id", facebookAppId);
    oauthUrl.searchParams.set("redirect_uri", facebookRedirectUri);
    oauthUrl.searchParams.set("scope", scopeString);
    oauthUrl.searchParams.set("state", state);
    oauthUrl.searchParams.set("response_type", "code");

    console.log(`[Facebook OAuth] Generated URL for user ${userId.substring(0, 8)}...`);

    return new Response(JSON.stringify({ 
      url: oauthUrl.toString(), 
      configured: true,
      scopes: FACEBOOK_SCOPES,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // GET ?action=callback - Handle Facebook redirect
  if (req.method === "GET" && action === "callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    const appBaseUrl = getAppBaseUrl();
    
    console.log(`[Facebook OAuth Callback] code=${!!code}, state=${!!state}, error=${error}`);

    if (error) {
      console.error(`[Facebook OAuth] Error: ${error} - ${errorDescription}`);
      const userMessage = errorDescription || "Connection was cancelled.";
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/connect-facebook?error=${encodeURIComponent(error)}&message=${encodeURIComponent(userMessage)}` },
      });
    }

    if (!code || !state) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/connect-facebook?error=missing_params&message=${encodeURIComponent("Missing code or state.")}` },
      });
    }

    try {
      let stateData;
      try {
        stateData = JSON.parse(atob(state));
      } catch {
        throw new Error("Invalid state token");
      }

      const userId = stateData.userId;
      if (!userId) throw new Error("Missing userId in state");

      if (stateData.timestamp && Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        throw new Error("Session expired");
      }

      console.log(`[Facebook OAuth] Processing for user ${userId.substring(0, 8)}...`);

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Exchange code for token
      const tokenUrl = new URL(`https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token`);
      tokenUrl.searchParams.set("client_id", facebookAppId!);
      tokenUrl.searchParams.set("redirect_uri", facebookRedirectUri!);
      tokenUrl.searchParams.set("client_secret", facebookAppSecret!);
      tokenUrl.searchParams.set("code", code);

      const tokenResponse = await fetch(tokenUrl.toString());
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error("[Facebook OAuth] Token error:", tokenData.error);
        throw new Error(parseFacebookError(tokenData).message);
      }

      const userAccessToken = tokenData.access_token;
      console.log("[Facebook OAuth] Got access token");

      // Check permissions
      const permissionsUrl = new URL(`https://graph.facebook.com/${FB_API_VERSION}/me/permissions`);
      permissionsUrl.searchParams.set("access_token", userAccessToken);

      const permissionsResponse = await fetch(permissionsUrl.toString());
      const permissionsData = await permissionsResponse.json();

      if (permissionsData.error) {
        throw new Error("Failed to verify permissions");
      }

      const grantedPermissions = (permissionsData.data || [])
        .filter((p: { status: string }) => p.status === "granted")
        .map((p: { permission: string }) => p.permission);

      console.log(`[Facebook OAuth] Granted: ${grantedPermissions.join(", ")}`);

      const missingPermissions = FACEBOOK_SCOPES.filter(scope => !grantedPermissions.includes(scope));

      if (missingPermissions.length > 0) {
        console.warn(`[Facebook OAuth] Missing: ${missingPermissions.join(", ")}`);
        
        const reAuthUrl = new URL(`https://www.facebook.com/${FB_API_VERSION}/dialog/oauth`);
        reAuthUrl.searchParams.set("client_id", facebookAppId!);
        reAuthUrl.searchParams.set("redirect_uri", facebookRedirectUri!);
        reAuthUrl.searchParams.set("scope", FACEBOOK_SCOPES.join(","));
        reAuthUrl.searchParams.set("state", btoa(JSON.stringify({ userId, timestamp: Date.now(), nonce: crypto.randomUUID() })));
        reAuthUrl.searchParams.set("response_type", "code");
        reAuthUrl.searchParams.set("auth_type", "rerequest");

        return new Response(null, {
          status: 302,
          headers: { 
            Location: `${appBaseUrl}/connect-facebook?error=missing_permissions&message=${encodeURIComponent(`Missing permissions: ${missingPermissions.join(", ")}`)}&reauth_url=${encodeURIComponent(reAuthUrl.toString())}` 
          },
        });
      }

      // Fetch pages with pagination
      const allPages: unknown[] = [];
      
      const pagesUrl = new URL(`https://graph.facebook.com/${FB_API_VERSION}/me/accounts`);
      pagesUrl.searchParams.set("access_token", userAccessToken);
      pagesUrl.searchParams.set("fields", "id,name,category,access_token,picture{url}");
      pagesUrl.searchParams.set("limit", "100");

      let pagesResponse = await fetch(pagesUrl.toString());
      let pagesData = await pagesResponse.json();

      if (pagesData.error) {
        throw new Error(parseFacebookError(pagesData).message);
      }

      if (pagesData.data) allPages.push(...pagesData.data);

      while (pagesData.paging?.next) {
        console.log(`[Facebook OAuth] Fetching more pages (${allPages.length})`);
        pagesResponse = await fetch(pagesData.paging.next);
        pagesData = await pagesResponse.json();
        if (pagesData.error) break;
        if (pagesData.data) allPages.push(...pagesData.data);
      }

      console.log(`[Facebook OAuth] Found ${allPages.length} pages`);

      if (allPages.length === 0) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${appBaseUrl}/connect-facebook?error=no_pages&message=${encodeURIComponent("No pages found.")}` },
        });
      }

      // Store pages
      let connectedCount = 0;

      for (const page of allPages) {
        try {
          const p = page as Record<string, unknown>;
          const encryptedToken = await encryptToken(p.access_token as string);
          const pictureData = p.picture as Record<string, unknown> | undefined;
          const pictureUrl = (pictureData?.data as Record<string, unknown> | undefined)?.url as string | undefined;

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
          }, {
            onConflict: "user_id,platform,external_id",
          });

          if (!upsertError) {
            connectedCount++;
            console.log(`[Facebook OAuth] Stored: ${p.name}`);
          }
        } catch (pageError) {
          console.error(`[Facebook OAuth] Error storing page:`, pageError);
        }
      }

      if (connectedCount === 0) {
        throw new Error("Failed to store pages");
      }

      console.log(`[Facebook OAuth] Stored ${connectedCount}/${allPages.length} pages`);

      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/connect-facebook?success=true&pages=${connectedCount}` },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      console.error("[Facebook OAuth] Error:", errorMessage);
      
      return new Response(null, {
        status: 302,
        headers: { Location: `${appBaseUrl}/connect-facebook?error=callback_failed&message=${encodeURIComponent(errorMessage)}` },
      });
    }
  }

  // GET ?action=scopes
  if (req.method === "GET" && action === "scopes") {
    return new Response(JSON.stringify({ 
      scopes: FACEBOOK_SCOPES,
      description: "Required Facebook permissions",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!action) {
    return new Response(JSON.stringify({ 
      error: "Missing action parameter",
      available_actions: ["start", "callback", "scopes"]
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
