/**
 * Smart Update Checker Component
 * 
 * Replaces aggressive version polling with a smart, cache-first approach.
 * 
 * Cost savings:
 * - Before: Check every 5 min + visibility change + online = ~50+ calls/day per user
 * - After: Check only on visibility (with 30min cooldown) = ~3 calls/day per user
 * 
 * That's 94% reduction in version check API calls!
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Current app version - MUST match the edge function version
const APP_VERSION = '2.0.5';
const VERSION_KEY = 'autofloy_app_version';
const LAST_CHECK_KEY = 'autofloy_last_version_check';
const LAST_AUTO_UPDATE_KEY = 'autofloy_last_auto_update';

// Check at most once every 30 minutes (dramatically reduced from 5 min)
const MIN_CHECK_INTERVAL = 30 * 60 * 1000;

// Cross-tab coordination to prevent multiple tabs from checking
const TAB_ID = Math.random().toString(36).substr(2, 9);
const LEADER_KEY = 'autofloy_version_check_leader';
const LEADER_TIMEOUT = 10000; // 10 seconds to become leader

export const SmartUpdateChecker = () => {
  const isCheckingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const isUpdatingRef = useRef(false);

  // Check if this tab should be the leader for version checks
  const shouldCheck = useCallback((): boolean => {
    try {
      const leaderData = localStorage.getItem(LEADER_KEY);
      if (leaderData) {
        const { tabId, timestamp } = JSON.parse(leaderData);
        // If leader is recent and it's not us, don't check
        if (Date.now() - timestamp < LEADER_TIMEOUT && tabId !== TAB_ID) {
          return false;
        }
      }
      
      // Become the leader
      localStorage.setItem(LEADER_KEY, JSON.stringify({
        tabId: TAB_ID,
        timestamp: Date.now()
      }));
      
      return true;
    } catch {
      return true; // Default to checking if localStorage fails
    }
  }, []);

  // Check if enough time has passed since last check
  const canCheck = useCallback((): boolean => {
    try {
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
      if (!lastCheck) return true;
      
      return Date.now() - parseInt(lastCheck) > MIN_CHECK_INTERVAL;
    } catch {
      return true;
    }
  }, []);

  // Perform automatic update silently in background - NO VISIBLE RELOAD
  const performAutoUpdate = useCallback(async () => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    
    console.log('[SmartUpdate] Starting silent background update (no reload)...');
    
    try {
      localStorage.setItem(LAST_AUTO_UPDATE_KEY, Date.now().toString());
      localStorage.removeItem('autofloy_update_available');
      
      // Clear ALL caches silently in background
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[SmartUpdate] Caches cleared silently');
      }
      
      // Unregister ALL service workers silently
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('[SmartUpdate] Service workers unregistered silently');
      }
      
      // Clear version storage
      localStorage.removeItem(VERSION_KEY);
      localStorage.removeItem('autofloy_build_hash');
      localStorage.removeItem('autofloy_cache_version');
      
      // Clear React Query cache to force fresh data fetch
      localStorage.removeItem('dashboard_cache');
      localStorage.removeItem('automations_cache');
      localStorage.removeItem('notifications_cache');
      
      // Update the stored version without reloading
      localStorage.setItem(VERSION_KEY, APP_VERSION);
      
      console.log('[SmartUpdate] Background update complete - no reload needed');
      
      // Dispatch custom event so React Query hooks can refetch
      window.dispatchEvent(new CustomEvent('app-updated', { 
        detail: { version: APP_VERSION } 
      }));
      
    } catch (error) {
      console.error('[SmartUpdate] Background update failed:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, []);

  // Check for new version via API (with all guards)
  const checkForNewVersion = useCallback(async () => {
    // Guard: Already checking or updating
    if (isCheckingRef.current || isUpdatingRef.current) return;
    
    // Guard: Not enough time since last check
    if (!canCheck()) {
      console.log('[SmartUpdate] Skipping check - cooldown active');
      return;
    }
    
    // Guard: Another tab is the leader
    if (!shouldCheck()) {
      console.log('[SmartUpdate] Skipping check - another tab is leader');
      return;
    }
    
    isCheckingRef.current = true;
    
    try {
      // Record this check
      localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
      
      const { data, error } = await supabase.functions.invoke('app-version', {
        method: 'GET',
      });
      
      if (error) {
        console.debug('[SmartUpdate] API error:', error);
        return;
      }
      
      if (data?.version) {
        const serverVersion = data.version;
        
        console.log('[SmartUpdate] Version check:', { 
          current: APP_VERSION, 
          server: serverVersion 
        });
        
        if (serverVersion !== APP_VERSION) {
          console.log('[SmartUpdate] New version detected! Auto-updating...');
          await performAutoUpdate();
        }
        
        localStorage.setItem(VERSION_KEY, APP_VERSION);
      }
      
    } catch (error) {
      console.debug('[SmartUpdate] Check failed:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [canCheck, shouldCheck, performAutoUpdate]);

  // Listen for service worker updates
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    const handleControllerChange = () => {
      console.log('[SmartUpdate] Service worker changed - auto-updating');
      performAutoUpdate();
    };
    
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) {
        performAutoUpdate();
      }
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              performAutoUpdate();
            }
          });
        }
      });
    }).catch(err => {
      console.debug('[SmartUpdate] SW ready error:', err);
    });
    
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [performAutoUpdate]);

  // Initial setup
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    
    // Only check on visibility change (when user returns to tab)
    // This is more meaningful than periodic checks
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Small delay to avoid race conditions
        setTimeout(checkForNewVersion, 2000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial check after 5 seconds (reduced urgency)
    const initialTimeout = setTimeout(checkForNewVersion, 5000);
    
    // Cleanup leader status on unload
    const handleUnload = () => {
      try {
        const leaderData = localStorage.getItem(LEADER_KEY);
        if (leaderData) {
          const { tabId } = JSON.parse(leaderData);
          if (tabId === TAB_ID) {
            localStorage.removeItem(LEADER_KEY);
          }
        }
      } catch {
        // Ignore
      }
    };
    
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearTimeout(initialTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [checkForNewVersion]);

  return null;
};

export default SmartUpdateChecker;
