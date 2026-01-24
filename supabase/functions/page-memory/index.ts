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
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    // Decode payload
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log("[JWT] Token expired");
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const userId = await verifyJWT(req.headers.get("Authorization"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const pageId = url.searchParams.get("page_id");

  // GET - Fetch page memory
  if (req.method === "GET") {
    try {
      let query = supabase
        .from("page_memory")
        .select("*")
        .eq("user_id", userId);

      if (pageId) {
        query = query.eq("page_id", pageId);
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

  // POST - Create or update page memory
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { 
        account_id,
        page_id,
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
      } = body;

      if (!page_id || !account_id) {
        return new Response(JSON.stringify({ error: "page_id and account_id are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

      // Upsert page memory
      const { data: memory, error } = await supabase
        .from("page_memory")
        .upsert({
          user_id: userId,
          account_id,
          page_id,
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
        page_id,
        page_name: page_name || account.name,
        business_type,
        preferred_tone,
        automation_settings,
      });

      console.log(`[Page Memory] Updated memory for page ${page_id}`);

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
