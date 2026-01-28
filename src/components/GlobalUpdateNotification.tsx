/**
 * Global Update Notification Component
 * 
 * Shows update notification across ALL pages (not just offline shop).
 * Uses multiple strategies to detect new deployments:
 * 1. Service Worker update events
 * 2. HTML/JS hash comparison
 * 3. App version comparison
 * 4. Periodic checks with aggressive cache-busting
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';

// App version - MUST be updated with each deployment
// This is the most reliable way to detect updates
const APP_VERSION = '2.0.1';
const VERSION_KEY = 'autofloy_app_version';
const BUILD_HASH_KEY = 'autofloy_build_hash';
const VERSION_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds
const LAST_CHECK_KEY = 'autofloy_last_version_check';

export const GlobalUpdateNotification = () => {
  const { language } = useLanguage();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const hasCheckedRef = useRef(false);
  const isCheckingRef = useRef(false);

  // Extract build hash from current page's script tags
  const getCurrentBuildHash = useCallback((): string | null => {
    try {
      // Look for main JS file hash in the page
      const scripts = document.querySelectorAll('script[src*="/assets/"]');
      for (const script of scripts) {
        const src = script.getAttribute('src');
        // Match patterns like index-abc123.js or main-xyz789.js
        const match = src?.match(/\/assets\/(?:index|main)-([a-zA-Z0-9]+)\.js/);
        if (match) {
          return match[1];
        }
      }
      
      // Also check CSS files for hash
      const links = document.querySelectorAll('link[rel="stylesheet"][href*="/assets/"]');
      for (const link of links) {
        const href = link.getAttribute('href');
        const match = href?.match(/\/assets\/index-([a-zA-Z0-9]+)\.css/);
        if (match) {
          return match[1];
        }
      }
    } catch (e) {
      console.debug('[UpdateCheck] Error getting current hash:', e);
    }
    return null;
  }, []);

  // Check for new version using multiple strategies
  const checkForNewVersion = useCallback(async () => {
    if (isCheckingRef.current || dismissed) return;
    isCheckingRef.current = true;
    
    try {
      // Strategy 1: Check APP_VERSION constant (most reliable)
      const storedVersion = localStorage.getItem(VERSION_KEY);
      if (storedVersion && storedVersion !== APP_VERSION) {
        console.log('[UpdateCheck] Version mismatch:', { stored: storedVersion, current: APP_VERSION });
        setHasUpdate(true);
        isCheckingRef.current = false;
        return;
      }
      
      // Store current version if not set
      if (!storedVersion) {
        localStorage.setItem(VERSION_KEY, APP_VERSION);
      }

      // Strategy 2: Fetch fresh HTML and compare build hashes
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const response = await fetch(`/?_v=${timestamp}&_r=${randomStr}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        isCheckingRef.current = false;
        return;
      }
      
      const html = await response.text();
      
      // Look for build hash in fetched HTML
      const scriptMatch = html.match(/\/assets\/(?:index|main)-([a-zA-Z0-9]+)\.js/);
      const cssMatch = html.match(/\/assets\/index-([a-zA-Z0-9]+)\.css/);
      const newHash = scriptMatch?.[1] || cssMatch?.[1];
      
      if (newHash) {
        const currentHash = getCurrentBuildHash();
        const storedHash = localStorage.getItem(BUILD_HASH_KEY);
        
        // If we have a stored hash and it's different from new hash
        if (storedHash && storedHash !== newHash) {
          console.log('[UpdateCheck] Build hash mismatch:', { stored: storedHash, fetched: newHash, current: currentHash });
          setHasUpdate(true);
        }
        // If current page hash is different from fetched hash
        else if (currentHash && currentHash !== newHash) {
          console.log('[UpdateCheck] Current vs fetched hash mismatch:', { current: currentHash, fetched: newHash });
          setHasUpdate(true);
        }
        // Store the hash for next comparison
        else if (!storedHash) {
          localStorage.setItem(BUILD_HASH_KEY, newHash);
        }
      }
      
      localStorage.setItem(LAST_CHECK_KEY, timestamp.toString());
      
    } catch (error) {
      console.debug('[UpdateCheck] Check failed:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [dismissed, getCurrentBuildHash]);

  // Listen for service worker updates
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    const handleControllerChange = () => {
      console.log('[UpdateCheck] Service worker controller changed');
      if (!dismissed) {
        setHasUpdate(true);
      }
    };
    
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    
    // Also check for waiting service worker
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
    // Initial hash storage
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      const currentHash = getCurrentBuildHash();
      if (currentHash && !localStorage.getItem(BUILD_HASH_KEY)) {
        localStorage.setItem(BUILD_HASH_KEY, currentHash);
      }
      if (!localStorage.getItem(VERSION_KEY)) {
        localStorage.setItem(VERSION_KEY, APP_VERSION);
      }
    }

    // Periodic version check
    const interval = setInterval(checkForNewVersion, VERSION_CHECK_INTERVAL);
    
    // Check on tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Small delay to avoid immediate check
        setTimeout(checkForNewVersion, 2000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check after 5 seconds
    const initialTimeout = setTimeout(checkForNewVersion, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForNewVersion, getCurrentBuildHash]);

  // Check for dismissed state
  useEffect(() => {
    if (sessionStorage.getItem('update_dismissed') === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
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
      
      // Clear version storage to force fresh check after reload
      localStorage.removeItem(VERSION_KEY);
      localStorage.removeItem(BUILD_HASH_KEY);
      localStorage.removeItem(LAST_CHECK_KEY);
      localStorage.removeItem('autofloy_cache_version');
      
      // Clear any cached data
      localStorage.removeItem('autofloy_dashboard_cache');
      localStorage.removeItem('autofloy_offline_shop_data');
      
      // Small delay to ensure everything is cleared
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Force hard reload
      window.location.href = window.location.pathname + '?_refresh=' + Date.now();
    } catch (error) {
      console.error('[UpdateCheck] Update failed:', error);
      // Still try to reload
      window.location.reload();
    }
  };

  const handleDismiss = () => {
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
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleDismiss}
            disabled={isUpdating}
            className="px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default GlobalUpdateNotification;
