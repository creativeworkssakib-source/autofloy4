/**
 * usePWAStatus Hook
 * 
 * React hook to track PWA installation, offline, and update status
 */

import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

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

export function usePWAStatus(): PWAStatus {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Use vite-plugin-pwa's React hook
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('[PWA Hook] Service Worker registered');
      
      // Check for updates periodically
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Every hour
      }
    },
    onRegisterError(error) {
      console.error('[PWA Hook] SW registration error:', error);
    },
  });

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
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
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
      await updateServiceWorker(true); // true = reload page
    } catch (error) {
      console.error('[PWA Hook] Update error:', error);
      // Fallback: just reload
      window.location.reload();
    }
  }, [updateServiceWorker]);

  // Dismiss update notification
  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, [setNeedRefresh]);

  return {
    isInstalled,
    isInstallable,
    installPrompt,
    isOnline,
    isOfflineReady: offlineReady,
    needRefresh,
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
