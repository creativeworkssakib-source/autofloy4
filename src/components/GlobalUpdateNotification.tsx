/**
 * Global Update Notification Component
 * 
 * Shows update notification across ALL pages (not just offline shop).
 * Uses API-based version checking for reliable PWA updates.
 * 
 * KEY FIX: Uses Supabase Edge Function for version check instead of
 * fetching HTML (which gets cached by service worker).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

// Current app version - MUST match the edge function version
const APP_VERSION = '2.0.2';
const VERSION_KEY = 'autofloy_app_version';
const VERSION_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

export const GlobalUpdateNotification = () => {
  const { language } = useLanguage();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const isCheckingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Check for new version via API (never cached!)
  const checkForNewVersion = useCallback(async () => {
    if (isCheckingRef.current || dismissed) return;
    isCheckingRef.current = true;
    
    try {
      // Call the app-version edge function - this is NEVER cached
      const { data, error } = await supabase.functions.invoke('app-version', {
        method: 'GET',
      });
      
      if (error) {
        console.debug('[UpdateCheck] API error:', error);
        isCheckingRef.current = false;
        return;
      }
      
      if (data?.version) {
        const serverVersion = data.version;
        const serverBuildNumber = data.buildNumber || 0;
        
        console.log('[UpdateCheck] Version check:', { 
          current: APP_VERSION, 
          server: serverVersion,
          buildNumber: serverBuildNumber 
        });
        
        // Compare versions
        if (serverVersion !== APP_VERSION) {
          console.log('[UpdateCheck] Update available!', { current: APP_VERSION, server: serverVersion });
          setHasUpdate(true);
          setForceUpdate(data.forceUpdate === true);
          
          // Store that we detected an update
          localStorage.setItem('autofloy_update_available', 'true');
        }
        
        // Store current version
        localStorage.setItem(VERSION_KEY, APP_VERSION);
      }
      
    } catch (error) {
      console.debug('[UpdateCheck] Check failed:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [dismissed]);

  // Listen for service worker updates (backup detection)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    const handleControllerChange = () => {
      console.log('[UpdateCheck] Service worker controller changed');
      if (!dismissed) {
        setHasUpdate(true);
      }
    };
    
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    
    // Check for waiting service worker
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) {
        console.log('[UpdateCheck] Service worker waiting to activate');
        setHasUpdate(true);
      }
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[UpdateCheck] New service worker installed');
              if (!dismissed) {
                setHasUpdate(true);
              }
            }
          });
        }
      });
    }).catch(err => {
      console.debug('[UpdateCheck] SW ready error:', err);
    });
    
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [dismissed]);

  // Initial setup and periodic checks
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    // Check if we already detected an update
    if (localStorage.getItem('autofloy_update_available') === 'true') {
      setHasUpdate(true);
    }
    
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
    
    // Check on online event (reconnect)
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

  // Check for dismissed state
  useEffect(() => {
    if (sessionStorage.getItem('update_dismissed') === 'true' && !forceUpdate) {
      setDismissed(true);
    }
  }, [forceUpdate]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Clear update available flag
      localStorage.removeItem('autofloy_update_available');
      
      // Clear ALL caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('[UpdateCheck] Clearing', cacheNames.length, 'caches');
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Unregister ALL service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('[UpdateCheck] Unregistering', registrations.length, 'service workers');
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      
      // Clear version storage
      localStorage.removeItem(VERSION_KEY);
      localStorage.removeItem('autofloy_build_hash');
      localStorage.removeItem('autofloy_cache_version');
      localStorage.removeItem('autofloy_last_version_check');
      
      // Small delay to ensure everything is cleared
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Force hard reload with cache busting
      window.location.href = window.location.pathname + '?_refresh=' + Date.now();
    } catch (error) {
      console.error('[UpdateCheck] Update failed:', error);
      // Still try to reload
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    if (forceUpdate) return; // Can't dismiss forced updates
    setDismissed(true);
    setHasUpdate(false);
    sessionStorage.setItem('update_dismissed', 'true');
  };

  if (!hasUpdate || dismissed) return null;

  return (
    <Alert className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-[9999] bg-gradient-to-r from-primary/20 to-primary/10 border-primary shadow-xl animate-in slide-in-from-bottom-4 backdrop-blur-sm">
      <Sparkles className="h-4 w-4 text-primary" />
      <AlertTitle className="font-semibold text-primary">
        {language === 'bn' ? '🎉 নতুন আপডেট!' : '🎉 New Update!'}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm text-muted-foreground mb-3">
          {language === 'bn' 
            ? 'অ্যাপের নতুন ভার্সন প্রস্তুত। নতুন ফিচার ও বাগ ফিক্স পেতে এখনই আপডেট করুন।'
            : 'A new version is ready. Update now to get new features and bug fixes.'
          }
        </p>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {language === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...'}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'এখনই আপডেট করুন' : 'Update Now'}
              </>
            )}
          </Button>
          {!forceUpdate && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
              disabled={isUpdating}
              className="px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default GlobalUpdateNotification;
