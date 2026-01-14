/**
 * usePWAStatus Hook
 * 
 * React hook to track PWA installation, offline, and update status
 * Works safely in both development and production environments
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface PWAStatus {
  // Installation status
  isInstalled: boolean;
  isInstallable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  
  // Offline status
  isOnline: boolean;
  isOfflineReady: boolean;
  
  // Update status
  needRefresh: boolean;
  hasVerifiedUpdate: boolean;
  
  // Methods
  install: () => Promise<boolean>;
  update: () => Promise<void>;
  dismissUpdate: () => void;
}

// Extend the Window interface for install prompt
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Check if we're in development mode
const isDev = import.meta.env.DEV;

export function usePWAStatus(): PWAStatus {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [hasVerifiedUpdate, setHasVerifiedUpdate] = useState(false);
  const initialLoadRef = useRef(true);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Register service worker manually (safer than vite-plugin-pwa hook in some environments)
  useEffect(() => {
    // Skip in development or if service workers aren't supported
    if (isDev || !('serviceWorker' in navigator)) {
      console.log('[PWA Hook] Skipping SW registration (dev mode or unsupported)');
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { 
          scope: '/',
          type: 'classic'
        });
        
        console.log('[PWA Hook] Service Worker registered');
        registrationRef.current = registration;
        
        // Check if there's already a waiting worker
        if (registration.waiting) {
          console.log('[PWA Hook] Found waiting service worker');
          setNeedRefresh(true);
        }
        
        // Listen for new service workers
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA Hook] New service worker installed, update available');
              setNeedRefresh(true);
            } else if (newWorker.state === 'activated') {
              console.log('[PWA Hook] Service worker activated, offline ready');
              setIsOfflineReady(true);
            }
          });
        });
        
        // If there's an active worker, we're offline ready
        if (registration.active) {
          setIsOfflineReady(true);
        }
        
        // Check for updates periodically (every 30 minutes)
        setInterval(() => {
          console.log('[PWA Hook] Checking for updates...');
          registration.update().catch(console.error);
        }, 30 * 60 * 1000);
        
        // Initial check after 60 seconds
        setTimeout(() => {
          registration.update().catch(console.error);
        }, 60000);
        
      } catch (error) {
        console.error('[PWA Hook] SW registration failed:', error);
      }
    };

    registerSW();
  }, []);

  // Verify that needRefresh represents a real update (waiting SW exists)
  useEffect(() => {
    // Skip verification during initial load (first 30 seconds)
    if (initialLoadRef.current) {
      const timer = setTimeout(() => {
        initialLoadRef.current = false;
      }, 30000);
      return () => clearTimeout(timer);
    }

    // In development, never show update notification
    if (isDev) {
      setHasVerifiedUpdate(false);
      return;
    }

    if (needRefresh) {
      // Verify there's actually a waiting service worker
      const verifyUpdate = async () => {
        try {
          const registration = registrationRef.current || await navigator.serviceWorker?.ready;
          if (registration?.waiting) {
            console.log('[PWA Hook] Verified: waiting service worker exists');
            setHasVerifiedUpdate(true);
          } else {
            console.log('[PWA Hook] No waiting service worker found, dismissing false positive');
            setHasVerifiedUpdate(false);
            setNeedRefresh(false);
          }
        } catch (error) {
          console.error('[PWA Hook] Error verifying update:', error);
          setHasVerifiedUpdate(false);
        }
      };
      
      verifyUpdate();
    } else {
      setHasVerifiedUpdate(false);
    }
  }, [needRefresh]);

  // Check if app is installed
  useEffect(() => {
    const checkInstalled = () => {
      const installed = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        (window.navigator as any).standalone === true;
      
      setIsInstalled(installed);
    };

    checkInstalled();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handler = () => checkInstalled();
    
    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('[PWA Hook] Install prompt captured');
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      console.log('[PWA Hook] App was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      localStorage.setItem('lastOnlineAt', new Date().toISOString());
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Install the app
  const install = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      console.log('[PWA Hook] No install prompt available');
      return false;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      console.log('[PWA Hook] Install choice:', outcome);
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setIsInstallable(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PWA Hook] Install error:', error);
      return false;
    }
  }, [installPrompt]);

  // Update the app
  const update = useCallback(async (): Promise<void> => {
    try {
      const registration = registrationRef.current || await navigator.serviceWorker?.ready;
      
      if (registration?.waiting) {
        // Tell the waiting service worker to activate
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Listen for the controlling service worker changing
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        }, { once: true });
      } else {
        // Fallback: just reload
        window.location.reload();
      }
    } catch (error) {
      console.error('[PWA Hook] Update error:', error);
      // Fallback: just reload
      window.location.reload();
    }
  }, []);

  // Dismiss update notification
  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
    setHasVerifiedUpdate(false);
  }, []);

  return {
    isInstalled,
    isInstallable,
    installPrompt,
    isOnline,
    isOfflineReady,
    needRefresh: hasVerifiedUpdate, // Only return true if verified
    hasVerifiedUpdate,
    install,
    update,
    dismissUpdate,
  };
}

/**
 * Simple hook just for online status
 */
export function useSimpleOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default usePWAStatus;
