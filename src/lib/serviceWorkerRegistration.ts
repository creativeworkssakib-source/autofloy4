/**
 * Service Worker Registration for PWA
 * 
 * Works with vite-plugin-pwa generated service worker
 * Handles registration, updates, and offline readiness
 */

import { registerSW } from 'virtual:pwa-register';

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
  onRegistrationError?: (error: Error) => void;
};

// Store the update function globally for manual updates
let updateSWInstance: ((reloadPage?: boolean) => Promise<void>) | null = null;

/**
 * Register the PWA service worker
 * Uses vite-plugin-pwa's registerSW
 */
export function register(config?: Config): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  try {
    updateSWInstance = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('[PWA] New content available, refresh needed');
        // Store that an update is available
        localStorage.setItem('pwa_update_available', 'true');
        localStorage.setItem('pwa_update_time', new Date().toISOString());
        
        // Get the service worker registration to pass to callback
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            config?.onUpdate?.(registration);
          }).catch(console.error);
        }
      },
      onOfflineReady() {
        console.log('[PWA] App is ready to work offline');
        localStorage.setItem('pwa_offline_ready', 'true');
        localStorage.setItem('pwa_offline_ready_time', new Date().toISOString());
        
        config?.onOfflineReady?.();
        
        // Also trigger onSuccess
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            config?.onSuccess?.(registration);
          }).catch(console.error);
        }
      },
      onRegisteredSW(swUrl, registration) {
        console.log('[PWA] Service Worker registered at:', swUrl);
        
        if (registration) {
          // Initial update check after 10 seconds
          setTimeout(() => {
            registration.update().catch(console.error);
          }, 10000);
          
          // Check for updates every 30 minutes
          setInterval(() => {
            console.log('[PWA] Checking for updates...');
            registration.update().catch(console.error);
          }, 30 * 60 * 1000);
        }
      },
      onRegisterError(error) {
        console.error('[PWA] Service Worker registration failed:', error);
        config?.onRegistrationError?.(error);
      },
    });

    // Return cleanup function
    return () => {
      updateSWInstance = null;
    };
  } catch (error) {
    console.error('[PWA] Failed to initialize service worker:', error);
    return () => {};
  }
}

/**
 * Unregister all service workers
 */
export async function unregister(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[PWA] Service Worker unregistered');
      }
    } catch (error) {
      console.error('[PWA] Service Worker unregistration failed:', error);
    }
  }
}

/**
 * Manually trigger an update check
 */
export async function checkForUpdates(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      console.log('[PWA] Update check completed');
      return true;
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
      return false;
    }
  }
  return false;
}

/**
 * Apply a pending update (reload the page with new content)
 */
export async function applyUpdate(): Promise<void> {
  if (updateSWInstance) {
    console.log('[PWA] Applying update...');
    localStorage.removeItem('pwa_update_available');
    await updateSWInstance(true); // true = reload page
  } else {
    // Fallback: just reload
    window.location.reload();
  }
}

/**
 * Skip waiting and activate new service worker immediately
 */
export async function skipWaiting(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}

/**
 * Check if the app is running in standalone mode (installed PWA)
 */
export function isStandalone(): boolean {
  // Check various ways an app can be "installed"
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as any).standalone === true // iOS Safari
  );
}

/**
 * Check if the PWA is installable
 */
export function isInstallable(): boolean {
  return 'serviceWorker' in navigator && 
    'BeforeInstallPromptEvent' in window;
}

/**
 * Check if offline ready (service worker has cached content)
 */
export function isOfflineReady(): boolean {
  return localStorage.getItem('pwa_offline_ready') === 'true';
}

/**
 * Check if an update is available
 */
export function hasUpdateAvailable(): boolean {
  return localStorage.getItem('pwa_update_available') === 'true';
}

/**
 * Get the service worker registration status
 */
export async function getRegistrationStatus(): Promise<{
  registered: boolean;
  active: boolean;
  waiting: boolean;
  installing: boolean;
}> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        registered: !!registration,
        active: !!registration?.active,
        waiting: !!registration?.waiting,
        installing: !!registration?.installing,
      };
    } catch {
      return { registered: false, active: false, waiting: false, installing: false };
    }
  }
  return { registered: false, active: false, waiting: false, installing: false };
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
      console.log('[PWA] All caches cleared');
    } catch (error) {
      console.error('[PWA] Failed to clear caches:', error);
    }
  }
}

/**
 * Get cache storage usage
 */
export async function getCacheUsage(): Promise<{
  used: number;
  quota: number;
  percentage: number;
} | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      return {
        used,
        quota,
        percentage: quota > 0 ? Math.round((used / quota) * 100) : 0,
      };
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Request persistent storage (prevents browser from clearing cache)
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log('[PWA] Persistent storage:', isPersisted ? 'granted' : 'denied');
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Check if storage is persisted
 */
export async function isStoragePersisted(): Promise<boolean> {
  if ('storage' in navigator && 'persisted' in navigator.storage) {
    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }
  return false;
}
