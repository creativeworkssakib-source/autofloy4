/**
 * Notifications Hook with Supabase Realtime
 * 
 * Uses Supabase Realtime subscriptions instead of polling.
 * This dramatically reduces edge function invocations:
 * - Before: 1 call every 2 minutes = 21,600/month per user
 * - After: Only on-demand calls + realtime = ~100/month per user
 * 
 * 99.5% reduction in notification-related API calls!
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "@/services/apiService";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  timestamp: Date;
  read: boolean;
  automationId?: string;
  automationName?: string;
  metadata?: Record<string, unknown>;
}

// Cache configuration
const CACHE_KEY = 'autofloy_notifications_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

interface CacheData {
  notifications: Notification[];
  timestamp: number;
}

// Map notification_type from DB to UI type
const mapNotificationType = (dbType?: string): "success" | "error" | "warning" | "info" => {
  switch (dbType?.toLowerCase()) {
    case "success":
      return "success";
    case "error":
      return "error";
    case "warning":
      return "warning";
    case "info":
    default:
      return "info";
  }
};

// Load from cache
function loadFromCache(): Notification[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: CacheData = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    // Restore Date objects
    return data.notifications.map(n => ({
      ...n,
      timestamp: new Date(n.timestamp)
    }));
  } catch {
    return null;
  }
}

// Save to cache
function saveToCache(notifications: Notification[]): void {
  try {
    const data: CacheData = {
      notifications,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore cache errors
  }
}

export function useNotificationsRealtime() {
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromCache() || []);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Get user ID from token
  const getUserId = useCallback((): string | null => {
    const token = localStorage.getItem("autofloy_token");
    if (!token) return null;
    
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || null;
    } catch {
      return null;
    }
  }, []);

  const loadNotifications = useCallback(async (force = false) => {
    const token = localStorage.getItem("autofloy_token");
    if (!token) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    // Use cache if available and not forcing refresh
    if (!force && !hasLoadedRef.current) {
      const cached = loadFromCache();
      if (cached && cached.length > 0) {
        setNotifications(cached);
        setIsLoading(false);
        // Still load fresh data in background
        hasLoadedRef.current = true;
      }
    }

    try {
      const data = await fetchNotifications();
      const mapped: Notification[] = data.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.body,
        type: mapNotificationType(n.notification_type),
        timestamp: new Date(n.created_at || Date.now()),
        read: n.is_read || false,
        metadata: n.metadata || {},
      }));
      setNotifications(mapped);
      saveToCache(mapped);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveToCache(updated);
      return updated;
    });
    await markNotificationAsRead(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveToCache(updated);
      return updated;
    });
    await markAllNotificationsAsRead();
  }, []);

  const removeNotification = useCallback(async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveToCache(updated);
      return updated;
    });
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(CACHE_KEY);
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => {
      const updated = [newNotification, ...prev];
      saveToCache(updated);
      return updated;
    });
    return newNotification;
  }, []);

  // Setup Supabase Realtime subscription
  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Initial load
    loadNotifications();

    // Subscribe to realtime changes for this user's notifications
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[Realtime] New notification received:', payload);
          const newData = payload.new as {
            id: string;
            title: string;
            body: string;
            notification_type?: string;
            created_at?: string;
            is_read?: boolean;
            metadata?: Record<string, unknown>;
          };
          
          const newNotification: Notification = {
            id: newData.id,
            title: newData.title,
            message: newData.body,
            type: mapNotificationType(newData.notification_type),
            timestamp: new Date(newData.created_at || Date.now()),
            read: newData.is_read || false,
            metadata: newData.metadata || {},
          };
          
          setNotifications((prev) => {
            // Avoid duplicates
            if (prev.some(n => n.id === newNotification.id)) {
              return prev;
            }
            const updated = [newNotification, ...prev];
            saveToCache(updated);
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[Realtime] Notification updated:', payload);
          const updatedData = payload.new as {
            id: string;
            is_read?: boolean;
          };
          
          setNotifications((prev) => {
            const updated = prev.map((n) => 
              n.id === updatedData.id 
                ? { ...n, read: updatedData.is_read || false }
                : n
            );
            saveToCache(updated);
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[Realtime] Notification deleted:', payload);
          const deletedId = (payload.old as { id: string }).id;
          
          setNotifications((prev) => {
            const updated = prev.filter((n) => n.id !== deletedId);
            saveToCache(updated);
            return updated;
          });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Notification subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [getUserId, loadNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    addNotification,
    refresh: () => loadNotifications(true),
  };
}

// Export the old interface for backwards compatibility
export { useNotificationsRealtime as useNotifications };
