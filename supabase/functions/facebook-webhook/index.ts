import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Webhook verification token - must match what's in Facebook Developer Console
const VERIFY_TOKEN = "autofloy_fb_verify_2024";

// Create Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET request = Facebook webhook verification
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      console.log("[Webhook] Verification request:", { mode, token: token?.substring(0, 5) + "..." });

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("[Webhook] Verification successful");
        return new Response(challenge, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      } else {
        console.error("[Webhook] Verification failed - invalid token");
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }
    }

    // POST request = Incoming webhook event from Facebook
    if (req.method === "POST") {
      const body = await req.json();
      console.log("[Webhook] Received event:", JSON.stringify(body, null, 2));

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Process Facebook webhook events
      if (body.object === "page") {
        for (const entry of body.entry || []) {
          const pageId = entry.id;
          const time = entry.time;

          // Process messaging events
          if (entry.messaging) {
            for (const event of entry.messaging) {
              await processMessagingEvent(supabase, pageId, event);
            }
          }

          // Process feed/comment events
          if (entry.changes) {
            for (const change of entry.changes) {
              await processFeedChange(supabase, pageId, change);
            }
          }
        }
      }

      // Always return 200 OK to acknowledge receipt
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    // Still return 200 to prevent Facebook from retrying
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Process incoming messages
async function processMessagingEvent(supabase: any, pageId: string, event: any) {
  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  const timestamp = event.timestamp;

  console.log(`[Webhook] Messaging event for page ${pageId}:`, { senderId, recipientId });

  // Skip if the message is from the page itself (echo)
  if (senderId === pageId) {
    console.log("[Webhook] Skipping echo message");
    return;
  }

  // Get the connected account for this page
  const { data: account, error: accountError } = await supabase
    .from("connected_accounts")
    .select("id, user_id, is_connected, name")
    .eq("external_id", pageId)
    .eq("platform", "facebook")
    .eq("is_connected", true)
    .single();

  if (accountError || !account) {
    console.log("[Webhook] No active account found for page:", pageId);
    return;
  }

  // Get page memory for AI context
  const { data: pageMemory } = await supabase
    .from("page_memory")
    .select("*")
    .eq("page_id", pageId)
    .eq("user_id", account.user_id)
    .single();

  // Handle different message types
  if (event.message) {
    const message = event.message;
    console.log(`[Webhook] Received message: "${message.text?.substring(0, 50)}..."`);

    // Log the execution
    await supabase.from("execution_logs").insert({
      user_id: account.user_id,
      automation_id: null,
      source_platform: "facebook",
      event_type: "message_received",
      status: "success",
      incoming_payload: {
        sender_id: senderId,
        page_id: pageId,
        message_text: message.text,
        message_id: message.mid,
        timestamp,
      },
      response_payload: { status: "logged" },
      processing_time_ms: 0,
    });

    // TODO: Implement AI auto-reply logic here
    // For now, just log the message
    console.log("[Webhook] Message logged for page:", account.name);
  }

  // Handle postback (button clicks)
  if (event.postback) {
    console.log(`[Webhook] Received postback: ${event.postback.payload}`);
    
    await supabase.from("execution_logs").insert({
      user_id: account.user_id,
      automation_id: null,
      source_platform: "facebook",
      event_type: "postback_received",
      status: "success",
      incoming_payload: {
        sender_id: senderId,
        page_id: pageId,
        payload: event.postback.payload,
        timestamp,
      },
      response_payload: { status: "logged" },
      processing_time_ms: 0,
    });
  }
}

// Process feed changes (comments, posts)
async function processFeedChange(supabase: any, pageId: string, change: any) {
  console.log(`[Webhook] Feed change for page ${pageId}:`, change.field);

  if (change.field !== "feed") {
    return;
  }

  const value = change.value;
  const item = value.item;

  // Get the connected account
  const { data: account, error } = await supabase
    .from("connected_accounts")
    .select("id, user_id, is_connected, name")
    .eq("external_id", pageId)
    .eq("platform", "facebook")
    .eq("is_connected", true)
    .single();

  if (error || !account) {
    console.log("[Webhook] No active account for page:", pageId);
    return;
  }

  // Handle comments
  if (item === "comment") {
    console.log(`[Webhook] Comment on page ${pageId}:`, value.message?.substring(0, 50));

    await supabase.from("execution_logs").insert({
      user_id: account.user_id,
      automation_id: null,
      source_platform: "facebook",
      event_type: "comment_received",
      status: "success",
      incoming_payload: {
        page_id: pageId,
        post_id: value.post_id,
        comment_id: value.comment_id,
        message: value.message,
        from: value.from,
        created_time: value.created_time,
      },
      response_payload: { status: "logged" },
      processing_time_ms: 0,
    });

    // TODO: Implement AI auto-reply for comments
  }
}
