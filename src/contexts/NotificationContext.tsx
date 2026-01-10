import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from "react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { toast } from "sonner";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => Notification;
  triggerAlert: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  refresh: () => void;
  soundEnabled: boolean;
  updateSoundEnabled: (enabled: boolean) => void;
  isLoading: boolean;
}

// Create context with a default value to avoid undefined issues
const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    addNotification,
    refresh,
  } = useNotifications();

  const { playSound, soundEnabled, updateSoundEnabled } = useNotificationSound();
  
  // Track previous unread count to detect new notifications
  const prevUnreadCountRef = useRef(unreadCount);
  const prevNotificationIdsRef = useRef<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Mark as initialized after first render
  useEffect(() => {
    setIsInitialized(true);
  }, []);
  
  // Play sound when new notifications arrive (from database polling)
  useEffect(() => {
    if (!isInitialized) return;
    
    const currentIds = new Set(notifications.map(n => n.id));
    const prevIds = prevNotificationIdsRef.current;
    
    // Check if there are genuinely new notifications (not just re-render)
    let hasNewNotifications = false;
    for (const id of currentIds) {
      if (!prevIds.has(id)) {
        hasNewNotifications = true;
        break;
      }
    }
    
    // Only play sound if we have new unread notifications and not initial load
    if (hasNewNotifications && prevIds.size > 0 && unreadCount > prevUnreadCountRef.current) {
      console.log("[Notification] New notification detected, playing sound");
      playSound();
    }
    
    prevUnreadCountRef.current = unreadCount;
    prevNotificationIdsRef.current = currentIds;
  }, [notifications, unreadCount, playSound, isInitialized]);

  const triggerAlert = useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification = addNotification(notification);
    
    // Play sound for triggered alerts
    playSound();
    
    // Show toast based on type
    const toastOptions = {
      description: notification.message,
      duration: 5000,
    };

    switch (notification.type) {
      case "success":
        toast.success(notification.title, toastOptions);
        break;
      case "error":
        toast.error(notification.title, toastOptions);
        break;
      case "warning":
        toast.warning(notification.title, toastOptions);
        break;
      case "info":
      default:
        toast.info(notification.title, toastOptions);
        break;
    }

    return newNotification;
  }, [addNotification, playSound]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    addNotification,
    triggerAlert,
    refresh,
    soundEnabled,
    updateSoundEnabled,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === null) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
}
