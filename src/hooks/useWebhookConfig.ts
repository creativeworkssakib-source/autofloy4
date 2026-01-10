import { useState, useEffect, useCallback } from "react";
import { 
  fetchWebhookConfigs, 
  getWebhookUrl, 
  isWebhookActive, 
  sendToWebhook,
  clearWebhookCache,
  type WebhookConfig 
} from "@/services/webhookService";

/**
 * Hook to access webhook configurations
 */
export function useWebhookConfigs() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      clearWebhookCache();
      const configs = await fetchWebhookConfigs();
      setWebhooks(configs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch webhooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { webhooks, loading, error, refresh };
}

/**
 * Hook to check if a specific webhook is active
 */
export function useWebhookStatus(webhookId: string) {
  const [isActive, setIsActive] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      setLoading(true);
      const active = await isWebhookActive(webhookId);
      setIsActive(active);
      if (active) {
        const webhookUrl = await getWebhookUrl(webhookId);
        setUrl(webhookUrl);
      }
      setLoading(false);
    }
    check();
  }, [webhookId]);

  return { isActive, url, loading };
}

/**
 * Hook to send data to a webhook
 */
export function useWebhookSender(webhookId: string) {
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; error?: string } | null>(null);

  const send = useCallback(async (data: Record<string, unknown>) => {
    setSending(true);
    try {
      const result = await sendToWebhook(webhookId, data);
      setLastResult(result);
      return result;
    } finally {
      setSending(false);
    }
  }, [webhookId]);

  return { send, sending, lastResult };
}

/**
 * Hook to get webhooks by category
 */
export function useWebhooksByCategory(category: string) {
  const { webhooks, loading, error, refresh } = useWebhookConfigs();
  
  const filtered = webhooks.filter(w => w.category === category);
  const active = filtered.filter(w => w.is_active && w.url && !w.is_coming_soon);
  
  return { 
    webhooks: filtered, 
    activeWebhooks: active,
    loading, 
    error, 
    refresh 
  };
}
