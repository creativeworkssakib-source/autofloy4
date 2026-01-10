import { supabase } from "@/integrations/supabase/client";

export interface WebhookConfig {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  category: string;
  icon: string | null;
  is_active: boolean;
  is_coming_soon: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// Cache for webhook configs
let webhookCache: WebhookConfig[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Fetch all webhook configurations from the database
 */
export async function fetchWebhookConfigs(): Promise<WebhookConfig[]> {
  // Return cached data if still valid
  if (webhookCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return webhookCache;
  }

  try {
    const { data, error } = await supabase
      .from("webhook_configs")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to fetch webhook configs:", error);
      return webhookCache || [];
    }

    webhookCache = data || [];
    cacheTimestamp = Date.now();
    return webhookCache;
  } catch (error) {
    console.error("Error fetching webhook configs:", error);
    return webhookCache || [];
  }
}

/**
 * Get a specific webhook URL by its ID
 * Returns null if webhook is not active or URL is not set
 */
export async function getWebhookUrl(webhookId: string): Promise<string | null> {
  const configs = await fetchWebhookConfigs();
  const webhook = configs.find(w => w.id === webhookId);
  
  if (!webhook || !webhook.is_active || !webhook.url || webhook.is_coming_soon) {
    return null;
  }
  
  return webhook.url;
}

/**
 * Get multiple webhook URLs by their IDs
 * Returns only active webhooks with valid URLs
 */
export async function getActiveWebhookUrls(webhookIds: string[]): Promise<WebhookConfig[]> {
  const configs = await fetchWebhookConfigs();
  return configs.filter(w => 
    webhookIds.includes(w.id) && 
    w.is_active && 
    w.url && 
    !w.is_coming_soon
  );
}

/**
 * Check if a specific webhook is active
 */
export async function isWebhookActive(webhookId: string): Promise<boolean> {
  const url = await getWebhookUrl(webhookId);
  return url !== null;
}

/**
 * Clear the webhook cache (call this after admin updates)
 */
export function clearWebhookCache(): void {
  webhookCache = null;
  cacheTimestamp = 0;
}

/**
 * Send data to a webhook
 * Returns true if successful, false otherwise
 */
export async function sendToWebhook(
  webhookId: string, 
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const url = await getWebhookUrl(webhookId);
  
  if (!url) {
    return { success: false, error: "Webhook is not active or URL not configured" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Autofloy-Event-Type": data.event_type as string || "webhook.data",
        "X-Autofloy-Webhook-Id": webhookId,
      },
      body: JSON.stringify({
        ...data,
        webhook_id: webhookId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send to webhook ${webhookId}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Send data to multiple webhooks
 */
export async function sendToWebhooks(
  webhookIds: string[],
  data: Record<string, unknown>
): Promise<{ webhookId: string; success: boolean; error?: string }[]> {
  const results = await Promise.all(
    webhookIds.map(async (webhookId) => {
      const result = await sendToWebhook(webhookId, data);
      return { webhookId, ...result };
    })
  );
  return results;
}

/**
 * Get webhooks by category
 */
export async function getWebhooksByCategory(category: string): Promise<WebhookConfig[]> {
  const configs = await fetchWebhookConfigs();
  return configs.filter(w => w.category === category);
}

/**
 * Get all active webhooks
 */
export async function getAllActiveWebhooks(): Promise<WebhookConfig[]> {
  const configs = await fetchWebhookConfigs();
  return configs.filter(w => w.is_active && w.url && !w.is_coming_soon);
}
