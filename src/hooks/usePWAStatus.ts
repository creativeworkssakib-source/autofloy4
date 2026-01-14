/**
 * usePWAStatus Hook
 * 
 * React hook to track PWA installation, offline, and update status
 * Works safely in both development and production environments
 */

import { useState, useEffect, useCallback } from 'react';

interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isOfflineReady: boolean;
  needRefresh: boolean;
  hasVerifiedUpdate: boolean;
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

// Store for install prompt (outside React to avoid HMR issues)
let storedInstallPrompt: BeforeInstallPromptEvent | null = null;
let swRegistration: ServiceWorkerRegistration | null = null;

export function usePWAStatus(): PWAStatus {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [hasVerifiedUpdate, setHasVerifiedUpdate] = useState(false);

  // Register service worker (only once)
  useEffect(() => {
    if (isDev || !('serviceWorker' in navigator)) {
      return;
    }

    let mounted = true;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        swRegistration = registration;
        
        if (!mounted) return;
        
        if (registration.waiting) {
          setNeedRefresh(true);
        }
        
        if (registration.active) {
          setIsOfflineReady(true);
        }
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener('statechange', () => {
            if (!mounted) return;
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setNeedRefresh(true);
            } else if (newWorker.state === 'activated') {
              setIsOfflineReady(true);
            }
          });
        });
      } catch (error) {
        console.error('[PWA] SW registration failed:', error);
      }
    };

    registerSW();

    return () => { mounted = false; };
  }, []);

  // Verify update
  useEffect(() => {
    if (isDev || !needRefresh) {
      setHasVerifiedUpdate(false);
      return;
    }

    // Wait 30 seconds before showing update notification
    const timer = setTimeout(async () => {
      try {
        const reg = swRegistration || await navigator.serviceWorker?.ready;
        if (reg?.waiting) {
          setHasVerifiedUpdate(true);
        }
      } catch {
        setHasVerifiedUpdate(false);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [needRefresh]);

  // Check if app is installed
  useEffect(() => {
    const checkInstalled = () => {
      const installed = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(installed);
    };

    checkInstalled();
    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener('change', checkInstalled);
    return () => mq.removeEventListener('change', checkInstalled);
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      storedInstallPrompt = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };

    const handleInstalled = () => {
      storedInstallPrompt = null;
      setIsInstallable(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  // Handle online/offline status
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

  const install = useCallback(async (): Promise<boolean> => {
    if (!storedInstallPrompt) return false;
    try {
      await storedInstallPrompt.prompt();
      const { outcome } = await storedInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        storedInstallPrompt = null;
        setIsInstallable(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const update = useCallback(async (): Promise<void> => {
    try {
      const reg = swRegistration || await navigator.serviceWorker?.ready;
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        }, { once: true });
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
    setHasVerifiedUpdate(false);
  }, []);

  return {
    isInstalled,
    isInstallable,
    isOnline,
    isOfflineReady,
    needRefresh: hasVerifiedUpdate,
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
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

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
