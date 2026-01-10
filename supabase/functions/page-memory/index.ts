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

const WEBHOOK_URL = "https://server3.automationlearners.pro/webhook-test/facebookautomation";

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

// Send webhook notification for page events
async function notifyWebhook(eventType: string, data: Record<string, any>) {
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

  const userId = await verifyToken(req.headers.get("Authorization"));
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
