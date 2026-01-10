import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OutgoingEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  account_id: string | null;
  payload: unknown;
  created_at: string;
  retry_count: number;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string | null;
  category: string;
  is_active: boolean;
}

// Map event types to webhook config IDs
function getWebhookIdsForEvent(eventType: string): string[] {
  const webhookIds: string[] = [];
  
  // Always include n8n_main for all events (central webhook)
  webhookIds.push("n8n_main");
  
  // Map specific events to platform webhooks
  if (eventType.startsWith("facebook.")) {
    webhookIds.push("facebook");
  } else if (eventType.startsWith("whatsapp.")) {
    webhookIds.push("whatsapp");
  } else if (eventType.startsWith("instagram.")) {
    webhookIds.push("instagram");
  } else if (eventType.startsWith("user.") || eventType.startsWith("subscription.") || eventType.startsWith("plan.") || eventType.startsWith("trial.")) {
    webhookIds.push("user_events");
    webhookIds.push("subscription");
  } else if (eventType.startsWith("billing.") || eventType.startsWith("payment.")) {
    webhookIds.push("payment");
  } else if (eventType.startsWith("order.") || eventType.startsWith("product.")) {
    webhookIds.push("ecommerce");
  } else if (eventType.startsWith("automation.")) {
    webhookIds.push("automation_events");
  } else if (eventType.startsWith("email.")) {
    webhookIds.push("email");
  }
  
  return webhookIds;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting webhook dispatch cron job...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("WEBHOOK_SIGNING_SECRET") || "autofloy-webhook-secret";

    // deno-lint-ignore no-explicit-any
    const supabase = createClient(supabaseUrl, serviceRoleKey) as any;

    // Fetch all active webhook configurations from database
    const { data: webhookConfigs, error: configError } = await supabase
      .from("webhook_configs")
      .select("id, name, url, category, is_active")
      .eq("is_active", true)
      .not("url", "is", null);

    if (configError) {
      console.error("Failed to fetch webhook configs:", configError);
    }

    const activeWebhooks: WebhookConfig[] = webhookConfigs || [];
    console.log(`Found ${activeWebhooks.length} active webhooks with URLs`);

    // Fetch pending events
    const { data: events, error } = await supabase
      .from("outgoing_events")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Failed to fetch pending events:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch events" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!events || events.length === 0) {
      console.log("No pending events to dispatch");
      return new Response(
        JSON.stringify({ processed: 0, sent: 0, errors: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${events.length} pending events`);

    let sent = 0;
    let errors = 0;

    for (const event of events as OutgoingEvent[]) {
      // Get relevant webhook IDs for this event type
      const relevantWebhookIds = getWebhookIdsForEvent(event.event_type);
      
      // Filter to only active webhooks with URLs that match our event type
      const targetWebhooks = activeWebhooks.filter(w => 
        relevantWebhookIds.includes(w.id) && w.url
      );

      if (targetWebhooks.length === 0) {
        // No webhooks configured for this event type, mark as sent
        await supabase
          .from("outgoing_events")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            last_error: "No active webhooks configured for this event type",
          })
          .eq("id", event.id);
        
        console.log(`Event ${event.id} (${event.event_type}) - no webhooks configured`);
        sent++;
        continue;
      }

      const webhookBody = {
        event_id: event.id,
        event_type: event.event_type,
        user_id: event.user_id,
        account_id: event.account_id,
        occurred_at: event.created_at,
        payload: event.payload,
      };

      // Create HMAC signature
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(JSON.stringify(webhookBody))
      );
      const signatureHex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      let allSuccess = true;
      const errorMessages: string[] = [];

      // Send to all relevant webhooks
      for (const webhook of targetWebhooks) {
        try {
          console.log(`Dispatching event ${event.id} to ${webhook.name} (${webhook.url})`);
          
          const response = await fetch(webhook.url!, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Autofloy-Signature": signatureHex,
              "X-Autofloy-Event-Type": event.event_type,
              "X-Autofloy-Webhook-Id": webhook.id,
            },
            body: JSON.stringify(webhookBody),
          });

          if (response.ok) {
            console.log(`Event ${event.id} sent to ${webhook.name} successfully`);
          } else {
            const errorText = await response.text();
            errorMessages.push(`${webhook.name}: HTTP ${response.status}`);
            allSuccess = false;
          }
        } catch (err) {
          const fetchError = err as Error;
          errorMessages.push(`${webhook.name}: ${fetchError.message}`);
          allSuccess = false;
        }
      }

      // Update event status
      if (allSuccess) {
        await supabase
          .from("outgoing_events")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", event.id);

        console.log(`Event ${event.id} (${event.event_type}) sent successfully to ${targetWebhooks.length} webhook(s)`);
        sent++;
      } else {
        await supabase
          .from("outgoing_events")
          .update({
            status: "error",
            last_error: errorMessages.join("; ").substring(0, 500),
            retry_count: (event.retry_count || 0) + 1,
          })
          .eq("id", event.id);

        console.error(`Event ${event.id} failed: ${errorMessages.join("; ")}`);
        errors++;
      }
    }

    console.log(`Dispatch complete: ${sent} sent, ${errors} errors`);

    return new Response(
      JSON.stringify({ processed: events.length, sent, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Cron job error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
