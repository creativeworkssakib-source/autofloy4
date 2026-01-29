/**
 * Global Auto-Update Component
 * 
 * AUTOMATICALLY updates the PWA without user intervention.
 * Shows a brief "Updating..." message and reloads.
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Current app version - MUST match the edge function version
const APP_VERSION = '2.0.5';
const VERSION_KEY = 'autofloy_app_version';
const VERSION_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds
const LAST_AUTO_UPDATE_KEY = 'autofloy_last_auto_update';

export const GlobalUpdateNotification = () => {
  const isCheckingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const isUpdatingRef = useRef(false);

  // Perform automatic update silently in background
  const performAutoUpdate = useCallback(async () => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    
    console.log('[AutoUpdate] Starting silent background update...');
    
    try {
      // Mark update time to prevent rapid re-updates
      localStorage.setItem(LAST_AUTO_UPDATE_KEY, Date.now().toString());
      localStorage.removeItem('autofloy_update_available');
      
      // Clear ALL caches silently
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('[AutoUpdate] Clearing', cacheNames.length, 'caches');
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Unregister ALL service workers silently
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('[AutoUpdate] Unregistering', registrations.length, 'service workers');
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      
      // Clear version storage
      localStorage.removeItem(VERSION_KEY);
      localStorage.removeItem('autofloy_build_hash');
      localStorage.removeItem('autofloy_cache_version');
      
      // Small delay to ensure everything is cleared
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Force silent reload
      window.location.href = window.location.pathname + '?_refresh=' + Date.now();
    } catch (error) {
      console.error('[AutoUpdate] Update failed:', error);
      isUpdatingRef.current = false;
      // Still try to reload silently
      window.location.reload();
    }
  }, []);

  // Check for new version via API
  const checkForNewVersion = useCallback(async () => {
    if (isCheckingRef.current || isUpdatingRef.current) return;
    isCheckingRef.current = true;
    
    try {
      // Prevent rapid re-updates (wait at least 60 seconds between updates)
      const lastUpdate = localStorage.getItem(LAST_AUTO_UPDATE_KEY);
      if (lastUpdate && Date.now() - parseInt(lastUpdate) < 60000) {
        isCheckingRef.current = false;
        return;
      }
      
      // Call the app-version edge function
      const { data, error } = await supabase.functions.invoke('app-version', {
        method: 'GET',
      });
      
      if (error) {
        console.debug('[AutoUpdate] API error:', error);
        isCheckingRef.current = false;
        return;
      }
      
      if (data?.version) {
        const serverVersion = data.version;
        
        console.log('[AutoUpdate] Version check:', { 
          current: APP_VERSION, 
          server: serverVersion 
        });
        
        // If versions don't match, auto-update immediately
        if (serverVersion !== APP_VERSION) {
          console.log('[AutoUpdate] New version detected! Auto-updating...', { 
            current: APP_VERSION, 
            server: serverVersion 
          });
          await performAutoUpdate();
        }
        
        // Store current version
        localStorage.setItem(VERSION_KEY, APP_VERSION);
      }
      
    } catch (error) {
      console.debug('[AutoUpdate] Check failed:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [performAutoUpdate]);

  // Listen for service worker updates
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    const handleControllerChange = () => {
      console.log('[AutoUpdate] Service worker changed - auto-updating');
      performAutoUpdate();
    };
    
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    
    // Check for waiting service worker
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) {
        console.log('[AutoUpdate] Service worker waiting - auto-updating');
        performAutoUpdate();
      }
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[AutoUpdate] New service worker installed - auto-updating');
              performAutoUpdate();
            }
          });
        }
      });
    }).catch(err => {
      console.debug('[AutoUpdate] SW ready error:', err);
    });
    
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [performAutoUpdate]);

  // Initial setup and periodic checks
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    // Store current version on first load
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    
    // Initial check after 3 seconds
    const initialTimeout = setTimeout(checkForNewVersion, 3000);
    
    // Periodic version check
    const interval = setInterval(checkForNewVersion, VERSION_CHECK_INTERVAL);
    
    // Check on tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(checkForNewVersion, 1000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check on online event
    const handleOnline = () => {
      setTimeout(checkForNewVersion, 2000);
    };
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkForNewVersion]);

  // This component renders nothing - updates happen automatically
  return null;
};

export default GlobalUpdateNotification;
