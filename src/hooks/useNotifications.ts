import { useState, useCallback, useEffect, useRef } from "react";
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

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem("autofloy_token");
    if (!token) {
      setNotifications([]);
      setIsLoading(false);
      return;
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
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await markNotificationAsRead(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsAsRead();
  }, []);

  const removeNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
    return newNotification;
  }, []);

  // Initial load and polling for real-time updates
  useEffect(() => {
    loadNotifications();
    
    // Poll every 2 minutes for new notifications (reduced from 30s to save edge function invocations)
    // For truly real-time notifications, consider using Supabase Realtime subscriptions
    intervalRef.current = setInterval(loadNotifications, 2 * 60 * 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    addNotification,
    refresh: loadNotifications,
  };
}
