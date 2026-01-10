import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Event types for n8n webhook integration
export const EVENT_TYPES = {
  // User events
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  
  // Subscription events
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_UPDATED: "subscription.updated",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",
  PLAN_CHANGED: "plan.changed",
  
  // Billing events
  BILLING_INVOICE_GENERATED: "billing.invoice_generated",
  BILLING_PAYMENT_SUCCEEDED: "billing.payment_succeeded",
  BILLING_PAYMENT_FAILED: "billing.payment_failed",
  TRIAL_STARTED: "trial.started",
  TRIAL_ENDED: "trial.ended",
  
  // Service/Integration events
  SERVICE_SETTINGS_UPDATED: "service.settings_updated",
  FACEBOOK_PAGE_CONNECTED: "facebook.page_connected",
  FACEBOOK_PAGE_DISCONNECTED: "facebook.page_disconnected",
  WHATSAPP_CONNECTED: "whatsapp.connected",
  WHATSAPP_DISCONNECTED: "whatsapp.disconnected",
  INSTAGRAM_CONNECTED: "instagram.connected",
  INSTAGRAM_DISCONNECTED: "instagram.disconnected",
  
  // Automation events
  AUTOMATION_RULE_CREATED: "automation.rule_created",
  AUTOMATION_RULE_UPDATED: "automation.rule_updated",
  AUTOMATION_RULE_DELETED: "automation.rule_deleted",
  AUTOMATION_EXECUTED: "automation.executed",
  
  // Product events
  PRODUCT_CREATED: "product.created",
  PRODUCT_UPDATED: "product.updated",
  PRODUCT_DELETED: "product.deleted",
  
  // Order events
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_STATUS_CHANGED: "order.status_changed",
  
  // Site settings events
  SITE_SETTINGS_UPDATED: "site_settings.updated",
  
  // Dashboard snapshots
  DASHBOARD_SNAPSHOT: "dashboard.snapshot",
} as const;

interface CreateEventPayload {
  event_type: string;
  user_id?: string;
  account_id?: string;
  payload: Record<string, unknown>;
}

interface DispatchResult {
  processed: number;
  sent: number;
  errors: number;
}

interface OutgoingEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  account_id: string | null;
  payload: unknown;
  created_at: string;
  retry_count: number;
  status: string;
  last_error: string | null;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string | null;
  category: string;
  is_active: boolean;
}

// Map event types to webhook config IDs
function getWebhookIdForEvent(eventType: string): string[] {
  const webhookIds: string[] = [];
  
  // Always include n8n_main for all events
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
  } else if (eventType.startsWith("billing.")) {
    webhookIds.push("payment");
  } else if (eventType.startsWith("order.")) {
    webhookIds.push("ecommerce");
  } else if (eventType.startsWith("automation.")) {
    webhookIds.push("automation_events");
  }
  
  return webhookIds;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookSecret = Deno.env.get("WEBHOOK_SIGNING_SECRET") || "autofloy-webhook-secret";
    
    // deno-lint-ignore no-explicit-any
    const supabase = createClient(supabaseUrl, serviceRoleKey) as any;

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "create";

    // Handle different actions
    switch (action) {
      case "create": {
        // Create a new event
        const body: CreateEventPayload = await req.json();
        
        if (!body.event_type || !body.payload) {
          return new Response(
            JSON.stringify({ error: "event_type and payload are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get user and plan info if user_id provided
        let enrichedPayload = { ...body.payload };
        
        if (body.user_id) {
          const { data: user } = await supabase
            .from("users")
            .select("id, email, display_name, subscription_plan, is_trial_active, trial_end_date, subscription_started_at, subscription_ends_at")
            .eq("id", body.user_id)
            .single();

          if (user) {
            // Get plan capabilities
            const planLimits = getPlanLimits(user.subscription_plan);
            
            enrichedPayload = {
              ...enrichedPayload,
              user: {
                id: user.id,
                email: user.email,
                display_name: user.display_name,
              },
              subscription: {
                plan: user.subscription_plan,
                is_trial_active: user.is_trial_active,
                trial_end_date: user.trial_end_date,
                started_at: user.subscription_started_at,
                ends_at: user.subscription_ends_at,
              },
              plan_limits: planLimits,
            };
          }
        }

        // Get site settings for context
        const { data: siteSettings } = await supabase
          .from("site_settings")
          .select("company_name, website_url, support_email")
          .limit(1)
          .single();

        if (siteSettings) {
          enrichedPayload.site_context = siteSettings;
        }

        // Insert the event
        const { data: event, error: insertError } = await supabase
          .from("outgoing_events")
          .insert({
            event_type: body.event_type,
            user_id: body.user_id || null,
            account_id: body.account_id || null,
            payload: enrichedPayload,
            status: "pending",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Failed to create event:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to create event", details: insertError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Event created: ${body.event_type}`, event.id);

        // Try to dispatch immediately (non-blocking using background task)
        dispatchSingleEventBackground(supabase, event as OutgoingEvent, webhookSecret);

        return new Response(
          JSON.stringify({ success: true, event_id: event.id }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "dispatch": {
        // Dispatch pending events (called by cron or manually)
        const result = await dispatchPendingEvents(supabase, webhookSecret);
        
        return new Response(
          JSON.stringify({ success: true, ...result }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "retry": {
        // Retry a specific event
        const { event_id } = await req.json();
        
        if (!event_id) {
          return new Response(
            JSON.stringify({ error: "event_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: updateError } = await supabase
          .from("outgoing_events")
          .update({ status: "pending", last_error: null })
          .eq("id", event_id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to retry event" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: "Event queued for retry" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list": {
        // List events (for admin)
        const status = url.searchParams.get("status");
        const event_type = url.searchParams.get("event_type");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");

        let query = supabase
          .from("outgoing_events")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq("status", status);
        }
        if (event_type) {
          query = query.eq("event_type", event_type);
        }

        const { data: events, count, error } = await query;

        if (error) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch events" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ events, total: count }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "test": {
        // Test webhook - send a test event to all active webhooks
        const { webhook_id } = await req.json().catch(() => ({}));
        
        // Get webhook configs
        let query = supabase
          .from("webhook_configs")
          .select("*")
          .eq("is_active", true)
          .not("url", "is", null);
        
        if (webhook_id) {
          query = query.eq("id", webhook_id);
        }
        
        const { data: webhooks, error: webhookError } = await query;
        
        if (webhookError || !webhooks || webhooks.length === 0) {
          return new Response(
            JSON.stringify({ error: "No active webhooks found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const results: { webhook_id: string; name: string; success: boolean; error?: string }[] = [];
        
        for (const webhook of webhooks) {
          if (!webhook.url) continue;
          
          try {
            const testPayload = {
              event_type: "test.webhook",
              webhook_id: webhook.id,
              webhook_name: webhook.name,
              timestamp: new Date().toISOString(),
              message: "This is a test event from AutoFloy webhook system",
            };
            
            const response = await fetch(webhook.url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Autofloy-Event-Type": "test.webhook",
              },
              body: JSON.stringify(testPayload),
            });
            
            results.push({
              webhook_id: webhook.id,
              name: webhook.name,
              success: response.ok,
              error: response.ok ? undefined : `HTTP ${response.status}`,
            });
          } catch (err) {
            const error = err as Error;
            results.push({
              webhook_id: webhook.id,
              name: webhook.name,
              success: false,
              error: error.message,
            });
          }
        }
        
        return new Response(
          JSON.stringify({ success: true, results }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    const error = err as Error;
    console.error("Webhook events error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Get active webhook URLs from database
// deno-lint-ignore no-explicit-any
async function getActiveWebhookUrls(supabase: any, webhookIds: string[]): Promise<WebhookConfig[]> {
  const { data: webhooks, error } = await supabase
    .from("webhook_configs")
    .select("id, name, url, category, is_active")
    .in("id", webhookIds)
    .eq("is_active", true)
    .not("url", "is", null);

  if (error) {
    console.error("Failed to fetch webhook configs:", error);
    return [];
  }

  return webhooks || [];
}

// Dispatch a single event to n8n (background, non-blocking)
// deno-lint-ignore no-explicit-any
function dispatchSingleEventBackground(supabase: any, event: OutgoingEvent, webhookSecret: string): void {
  // Run async without awaiting
  (async () => {
    await dispatchSingleEvent(supabase, event, webhookSecret);
  })().catch(console.error);
}

// Dispatch a single event to all relevant n8n webhooks
// deno-lint-ignore no-explicit-any
async function dispatchSingleEvent(supabase: any, event: OutgoingEvent, webhookSecret: string): Promise<boolean> {
  // Get relevant webhook IDs for this event type
  const webhookIds = getWebhookIdForEvent(event.event_type);
  
  // Fetch active webhook URLs from database
  const webhooks = await getActiveWebhookUrls(supabase, webhookIds);
  
  if (webhooks.length === 0) {
    console.log(`No active webhooks found for event type: ${event.event_type}`);
    // Mark as sent since there's nothing to dispatch to
    await supabase
      .from("outgoing_events")
      .update({ 
        status: "sent", 
        sent_at: new Date().toISOString(),
        last_error: "No active webhooks configured" 
      })
      .eq("id", event.id);
    return true;
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
  const errors: string[] = [];

  // Send to all relevant webhooks
  for (const webhook of webhooks) {
    if (!webhook.url) continue;
    
    try {
      console.log(`Dispatching event ${event.id} to webhook: ${webhook.name} (${webhook.url})`);
      
      const response = await fetch(webhook.url, {
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
        console.log(`Event ${event.id} sent successfully to ${webhook.name}`);
      } else {
        const errorText = await response.text();
        errors.push(`${webhook.name}: HTTP ${response.status} - ${errorText.substring(0, 100)}`);
        allSuccess = false;
      }
    } catch (err) {
      const error = err as Error;
      errors.push(`${webhook.name}: ${error.message}`);
      allSuccess = false;
    }
  }

  // Update event status based on results
  if (allSuccess) {
    await supabase
      .from("outgoing_events")
      .update({ 
        status: "sent", 
        sent_at: new Date().toISOString(),
        last_error: null 
      })
      .eq("id", event.id);
    
    console.log(`Event ${event.id} sent successfully to all webhooks`);
    return true;
  } else {
    await supabase
      .from("outgoing_events")
      .update({ 
        status: "error", 
        last_error: errors.join("; ").substring(0, 500),
        retry_count: (event.retry_count || 0) + 1
      })
      .eq("id", event.id);
    
    console.error(`Event ${event.id} failed for some webhooks:`, errors);
    return false;
  }
}

// Dispatch all pending events
// deno-lint-ignore no-explicit-any
async function dispatchPendingEvents(supabase: any, webhookSecret: string): Promise<DispatchResult> {
  const { data: events, error } = await supabase
    .from("outgoing_events")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error || !events) {
    console.error("Failed to fetch pending events:", error);
    return { processed: 0, sent: 0, errors: 0 };
  }

  let sent = 0;
  let errors = 0;

  for (const event of events) {
    const success = await dispatchSingleEvent(supabase, event as OutgoingEvent, webhookSecret);
    if (success) {
      sent++;
    } else {
      errors++;
    }
  }

  console.log(`Dispatched ${events.length} events: ${sent} sent, ${errors} errors`);
  return { processed: events.length, sent, errors };
}

// Get plan limits (replicated from planCapabilities for edge function)
function getPlanLimits(plan: string) {
  const limits: Record<string, { maxFacebookPages: number; maxWhatsappAccounts: number; maxAutomationsPerMonth: number | null }> = {
    none: { maxFacebookPages: 0, maxWhatsappAccounts: 0, maxAutomationsPerMonth: 0 },
    trial: { maxFacebookPages: 10, maxWhatsappAccounts: 5, maxAutomationsPerMonth: null },
    starter: { maxFacebookPages: 1, maxWhatsappAccounts: 0, maxAutomationsPerMonth: null },
    professional: { maxFacebookPages: 2, maxWhatsappAccounts: 1, maxAutomationsPerMonth: null },
    business: { maxFacebookPages: 2, maxWhatsappAccounts: 1, maxAutomationsPerMonth: null },
    lifetime: { maxFacebookPages: 10, maxWhatsappAccounts: 5, maxAutomationsPerMonth: null },
  };
  return limits[plan?.toLowerCase()] || limits.none;
}
