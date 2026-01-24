import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

const WEBHOOK_URL = "https://server3.automationlearners.pro/webhook-test/facebookautomation";

// JWT verification without external dependency
async function verifyJWT(authHeader: string | null): Promise<string | null> {
  console.log("[JWT] Auth header received:", authHeader ? `Present (${authHeader.length} chars)` : "Missing");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[JWT] No auth header or invalid format. Starts with Bearer:", authHeader?.startsWith("Bearer "));
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.log("[JWT] Invalid token format - not 3 parts");
      return null;
    }
    
    // Decode payload
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if needed
    const payloadPadding = (4 - (payloadBase64.length % 4)) % 4;
    const paddedPayload = payloadBase64 + "=".repeat(payloadPadding);
    const payloadJson = atob(paddedPayload);
    const payload = JSON.parse(payloadJson);
    
    console.log("[JWT] Payload:", { sub: payload.sub, email: payload.email, exp: payload.exp });
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log("[JWT] Token expired at:", new Date(payload.exp * 1000).toISOString());
      return null;
    }
    
    // Verify signature
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
    
    console.log("[JWT] Token verified successfully for user:", payload.sub);
    return payload.sub as string;
  } catch (error) {
    console.error("[JWT] Verification failed:", error);
    return null;
  }
}

// Send webhook notification for page events
async function notifyWebhook(eventType: string, data: Record<string, unknown>) {
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        timestamp: new Date().toISOString(),
        ...data,
      }),
    });
    console.log(`[Webhook] Sent ${eventType} event`);
  } catch (error) {
    console.error("[Webhook] Failed to send event:", error);
  }
}

serve(async (req) => {
  console.log("[page-memory] Request received:", req.method, req.url);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  
  // Get page_id from URL params OR from body (for POST requests from SDK)
  let pageId = url.searchParams.get("page_id");
  let bodyData: Record<string, unknown> = {};
  
  // Try to parse body for POST/PUT requests
  if (req.method === "POST" || req.method === "PUT") {
    try {
      const text = await req.text();
      if (text) {
        bodyData = JSON.parse(text);
        // If page_id is in body, use it (for SDK invoke calls)
        if (bodyData.page_id && !pageId) {
          pageId = String(bodyData.page_id);
        }
      }
    } catch (e) {
      console.log("[page-memory] Failed to parse body:", e);
    }
  }
  
  console.log("[page-memory] page_id:", pageId, "method:", req.method);

  // Try to verify JWT first, but allow fallback to page_id based lookup
  let userId = await verifyJWT(req.headers.get("Authorization"));
  
  // If no JWT, try to get user from page_id (for internal calls)
  if (!userId && pageId) {
    console.log("[page-memory] No JWT, trying page_id lookup:", pageId);
    const { data: pageData } = await supabase
      .from("page_memory")
      .select("user_id")
      .eq("page_id", pageId)
      .maybeSingle();
    
    if (pageData?.user_id) {
      userId = pageData.user_id;
      console.log("[page-memory] Found user from page_id:", userId);
    }
  }

  // GET - Fetch page memory (allow with just page_id for read operations)
  // Also handle POST with action=fetch for SDK invoke calls
  const isFetchRequest = req.method === "GET" || (req.method === "POST" && (!bodyData.account_id || bodyData.action === "fetch"));
  
  if (isFetchRequest) {
    try {
      let query = supabase.from("page_memory").select("*");

      if (userId) {
        query = query.eq("user_id", userId);
      }
      
      if (pageId) {
        query = query.eq("page_id", pageId);
      }

      // Require at least one filter
      if (!userId && !pageId) {
        return new Response(JSON.stringify({ error: "page_id or auth required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await query;

      if (error) {
        console.error("Fetch page memory error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch page memory" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        memories: pageId ? (data?.[0] || null) : data 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("GET page-memory error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // POST - Create or update page memory (when account_id is provided)
  if (req.method === "POST") {
    try {
      // Use already-parsed bodyData
      const { 
        account_id,
        page_id: bodyPageId,
        page_name,
        business_type,
        business_category,
        detected_language,
        preferred_tone,
        business_description,
        products_summary,
        faq_context,
        custom_instructions,
        automation_settings,
        selling_rules,
        ai_behavior_rules,
        payment_rules,
      } = bodyData as Record<string, unknown>;
      
      const finalPageId = bodyPageId || pageId;

      console.log("[page-memory] POST body:", { account_id, page_id: finalPageId, page_name, automation_settings });

      if (!finalPageId || !account_id) {
        return new Response(JSON.stringify({ error: "page_id and account_id are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // If no userId from JWT, look it up from account_id
      if (!userId) {
        console.log("[page-memory] No JWT userId, looking up from account:", account_id);
        const { data: accountData } = await supabase
          .from("connected_accounts")
          .select("user_id")
          .eq("id", account_id)
          .maybeSingle();
        
        if (accountData?.user_id) {
          userId = accountData.user_id;
          console.log("[page-memory] Found user from account:", userId);
        } else {
          return new Response(JSON.stringify({ error: "Account not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Verify account ownership
      const { data: account, error: accountError } = await supabase
        .from("connected_accounts")
        .select("id, name, external_id")
        .eq("id", account_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (accountError || !account) {
        return new Response(JSON.stringify({ error: "Account not found or access denied" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upsert page memory with AI behavior configuration
      const { data: memory, error } = await supabase
        .from("page_memory")
        .upsert({
          user_id: userId,
          account_id,
          page_id: finalPageId,
          page_name: page_name || account.name,
          business_type,
          business_category,
          detected_language: detected_language || "auto",
          preferred_tone: preferred_tone || "friendly",
          business_description,
          products_summary,
          faq_context,
          custom_instructions,
          automation_settings: automation_settings || {},
          selling_rules: selling_rules || null,
          ai_behavior_rules: ai_behavior_rules || null,
          payment_rules: payment_rules || null,
        }, {
          onConflict: "user_id,page_id",
        })
        .select()
        .single();

      if (error) {
        console.error("Upsert page memory error:", error);
        return new Response(JSON.stringify({ error: "Failed to save page memory" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Notify webhook about page memory update
      notifyWebhook("page_memory_updated", {
        user_id: userId,
        page_id: finalPageId,
        page_name: page_name || account.name,
        business_type,
        preferred_tone,
        automation_settings,
      });

      console.log(`[Page Memory] Updated memory for page ${finalPageId}`);

      return new Response(JSON.stringify({ memory }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("POST page-memory error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // PUT - Subscribe page to webhooks
  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const { page_id: reqPageId, subscribe } = body;

      if (!reqPageId) {
        return new Response(JSON.stringify({ error: "page_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify ownership
      const { data: memory, error: memError } = await supabase
        .from("page_memory")
        .select("id, account_id")
        .eq("user_id", userId)
        .eq("page_id", reqPageId)
        .maybeSingle();

      if (memError || !memory) {
        return new Response(JSON.stringify({ error: "Page memory not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update webhook subscription status
      const { error: updateError } = await supabase
        .from("page_memory")
        .update({
          webhook_subscribed: subscribe !== false,
          webhook_subscribed_at: subscribe !== false ? new Date().toISOString() : null,
        })
        .eq("id", memory.id);

      if (updateError) {
        console.error("Update webhook subscription error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update subscription" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Notify webhook about subscription change
      notifyWebhook("page_webhook_subscription", {
        user_id: userId,
        page_id: reqPageId,
        subscribed: subscribe !== false,
      });

      console.log(`[Page Memory] Webhook ${subscribe !== false ? "subscribed" : "unsubscribed"} for page ${reqPageId}`);

      return new Response(JSON.stringify({ 
        success: true, 
        subscribed: subscribe !== false 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("PUT page-memory error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
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
