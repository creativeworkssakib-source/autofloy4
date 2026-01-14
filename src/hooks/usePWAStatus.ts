/**
 * usePWAStatus Hook
 * 
 * Simple hook for PWA status - installation and online/offline only
 * Update notifications removed - PWA auto-updates silently
 */

import { useState, useEffect, useCallback } from 'react';

interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isOfflineReady: boolean;
  install: () => Promise<boolean>;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let storedInstallPrompt: BeforeInstallPromptEvent | null = null;

export function usePWAStatus(): PWAStatus {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

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

  // Check if SW is active (offline ready)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsOfflineReady(true);
      }).catch(() => {});
    }
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

  return {
    isInstalled,
    isInstallable,
    isOnline,
    isOfflineReady,
    install,
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
