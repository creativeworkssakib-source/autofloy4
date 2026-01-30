/**
 * useNotifications Hook
 * 
 * Re-exports from the new Realtime-based implementation.
 * This file is kept for backwards compatibility with existing imports.
 * 
 * Migration note: The new implementation uses Supabase Realtime
 * instead of polling, reducing API calls by 99%+
 */

export { useNotificationsRealtime as useNotifications, type Notification } from './useNotificationsRealtime';
