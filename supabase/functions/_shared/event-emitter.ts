// Event emitter utility for n8n webhook integration
// This module provides functions to create outgoing events

// Webhook ID for n8n integration in webhook_configs table
const N8N_WEBHOOK_CONFIG_ID = "n8n_main";

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

// Plan limits for enriching payloads
export function getPlanLimits(plan: string) {
  const limits: Record<string, { 
    maxFacebookPages: number; 
    maxWhatsappAccounts: number; 
    maxAutomationsPerMonth: number | null;
    features: Record<string, boolean>;
  }> = {
    none: { 
      maxFacebookPages: 0, 
      maxWhatsappAccounts: 0, 
      maxAutomationsPerMonth: 0,
      features: {}
    },
    trial: { 
      maxFacebookPages: 10, 
      maxWhatsappAccounts: 5, 
      maxAutomationsPerMonth: null,
      features: {
        messageAutoReply: true,
        commentAutoReply: true,
        imageAutoReply: true,
        voiceAutoReply: true,
        whatsappEnabled: true,
      }
    },
    starter: { 
      maxFacebookPages: 1, 
      maxWhatsappAccounts: 0, 
      maxAutomationsPerMonth: null,
      features: {
        messageAutoReply: true,
        commentAutoReply: true,
        imageAutoReply: false,
        voiceAutoReply: false,
        whatsappEnabled: false,
      }
    },
    professional: { 
      maxFacebookPages: 2, 
      maxWhatsappAccounts: 1, 
      maxAutomationsPerMonth: null,
      features: {
        messageAutoReply: true,
        commentAutoReply: true,
        imageAutoReply: true,
        voiceAutoReply: true,
        whatsappEnabled: true,
      }
    },
    business: { 
      maxFacebookPages: 2, 
      maxWhatsappAccounts: 1, 
      maxAutomationsPerMonth: null,
      features: {
        messageAutoReply: true,
        commentAutoReply: true,
        imageAutoReply: true,
        voiceAutoReply: true,
        whatsappEnabled: true,
        orderManagementSystem: true,
        invoiceSystem: true,
      }
    },
    lifetime: { 
      maxFacebookPages: 10, 
      maxWhatsappAccounts: 5, 
      maxAutomationsPerMonth: null,
      features: {
        messageAutoReply: true,
        commentAutoReply: true,
        imageAutoReply: true,
        voiceAutoReply: true,
        whatsappEnabled: true,
        orderManagementSystem: true,
        invoiceSystem: true,
        allFutureFeaturesFree: true,
      }
    },
  };
  return limits[plan?.toLowerCase()] || limits.none;
}

interface EmitEventOptions {
  event_type: string;
  user_id?: string;
  account_id?: string;
  payload: Record<string, unknown>;
}

// Fetch n8n webhook URL from webhook_configs table
// deno-lint-ignore no-explicit-any
async function getN8nWebhookUrl(supabase: any): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("webhook_configs")
      .select("url, is_active")
      .eq("id", N8N_WEBHOOK_CONFIG_ID)
      .single();

    if (error || !data) {
      console.log(`[EventEmitter] n8n webhook config not found or error:`, error?.message);
      return null;
    }

    if (!data.is_active || !data.url) {
      console.log(`[EventEmitter] n8n webhook is inactive or URL not set`);
      return null;
    }

    return data.url;
  } catch (error) {
    console.error(`[EventEmitter] Error fetching n8n webhook URL:`, error);
    return null;
  }
}

// deno-lint-ignore no-explicit-any
export async function emitEvent(supabase: any, options: EmitEventOptions): Promise<string | null> {
  const { event_type, user_id, account_id, payload } = options;

  try {
    // Enrich payload with user and plan info if user_id provided
    let enrichedPayload = { ...payload };
    
    if (user_id) {
      const { data: user } = await supabase
        .from("users")
        .select("id, email, display_name, subscription_plan, is_trial_active, trial_end_date, subscription_started_at, subscription_ends_at")
        .eq("id", user_id)
        .single();

      if (user) {
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
        event_type,
        user_id: user_id || null,
        account_id: account_id || null,
        payload: enrichedPayload,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[EventEmitter] Failed to create event ${event_type}:`, insertError);
      return null;
    }

    console.log(`[EventEmitter] Event created: ${event_type} (${event.id})`);

    // Try to dispatch immediately (non-blocking)
    dispatchEventBackground(supabase, event, enrichedPayload);

    return event.id;
  } catch (error) {
    console.error(`[EventEmitter] Error creating event ${event_type}:`, error);
    return null;
  }
}

// Dispatch event in background without blocking
function dispatchEventBackground(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  event: { id: string; event_type: string; user_id: string | null; account_id: string | null; created_at: string },
  payload: unknown
): void {
  const webhookSecret = Deno.env.get("WEBHOOK_SIGNING_SECRET") || "autofloy-webhook-secret";
  
  (async () => {
    try {
      // Get webhook URL from database
      const webhookUrl = await getN8nWebhookUrl(supabase);
      
      if (!webhookUrl) {
        console.log(`[EventEmitter] Skipping dispatch for event ${event.id} - no webhook URL configured`);
        return;
      }

      const webhookBody = {
        event_id: event.id,
        event_type: event.event_type,
        user_id: event.user_id,
        account_id: event.account_id,
        occurred_at: event.created_at,
        payload,
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

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Autofloy-Signature": signatureHex,
          "X-Autofloy-Event-Type": event.event_type,
        },
        body: JSON.stringify(webhookBody),
      });

      if (response.ok) {
        console.log(`[EventEmitter] Event ${event.id} dispatched successfully`);
      } else {
        console.warn(`[EventEmitter] Event ${event.id} dispatch failed: HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn(`[EventEmitter] Event ${event.id} dispatch failed:`, error);
    }
  })().catch(console.error);
}
