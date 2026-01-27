/**
 * Global Update Notification Component
 * 
 * Shows update notification across ALL pages (not just offline shop).
 * Uses build timestamp to detect new deployments instantly.
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';

// Build timestamp is injected at build time
const BUILD_TIMESTAMP = import.meta.env.VITE_BUILD_TIME || Date.now().toString();
const VERSION_CHECK_INTERVAL = 60 * 1000; // Check every 1 minute
const VERSION_KEY = 'autofloy_build_version';

export const GlobalUpdateNotification = () => {
  const { language } = useLanguage();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if there's a new version available
  const checkForNewVersion = useCallback(async () => {
    try {
      // Fetch the main HTML with cache-busting
      const response = await fetch(`/?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) return;
      
      const html = await response.text();
      
      // Look for the build timestamp in the HTML or JS files
      // Vite injects different hashes for each build
      const scriptMatch = html.match(/src="\/assets\/index-([a-zA-Z0-9]+)\.js"/);
      const currentHash = scriptMatch?.[1];
      
      if (currentHash) {
        const storedHash = localStorage.getItem(VERSION_KEY);
        
        if (!storedHash) {
          // First visit - store current version
          localStorage.setItem(VERSION_KEY, currentHash);
        } else if (storedHash !== currentHash && !dismissed) {
          // New version detected!
          console.log('New version detected:', { stored: storedHash, current: currentHash });
          setHasUpdate(true);
        }
      }
    } catch (error) {
      // Silently fail - network issues shouldn't show errors
      console.debug('Version check failed:', error);
    }
  }, [dismissed]);

  useEffect(() => {
    // Store current version on first load
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (!storedVersion) {
      // Try to get current hash from page
      const scripts = document.querySelectorAll('script[src*="/assets/index-"]');
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        const match = src?.match(/index-([a-zA-Z0-9]+)\.js/);
        if (match) {
          localStorage.setItem(VERSION_KEY, match[1]);
        }
      });
    }

    // Check for updates periodically
    const interval = setInterval(checkForNewVersion, VERSION_CHECK_INTERVAL);
    
    // Also check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForNewVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check immediately after a short delay
    const initialCheck = setTimeout(checkForNewVersion, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialCheck);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForNewVersion]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Unregister service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      
      // Clear the stored version so it gets updated on reload
      localStorage.removeItem(VERSION_KEY);
      
      // Force reload from server
      window.location.reload();
    } catch (error) {
      console.error('Update failed:', error);
      // Still try to reload
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setHasUpdate(false);
    // Remember dismissal for this session only
    sessionStorage.setItem('update_dismissed', 'true');
  };

  // Don't show if dismissed this session
  useEffect(() => {
    if (sessionStorage.getItem('update_dismissed') === 'true') {
      setDismissed(true);
    }
  }, []);

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
