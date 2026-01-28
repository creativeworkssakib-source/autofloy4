/**
 * Service Worker Registration
 * 
 * Registers the PWA service worker and handles updates
 * Implements aggressive update strategies for reliable PWA updates
 */

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
};

// Check interval - every 30 seconds for faster updates
const UPDATE_CHECK_INTERVAL = 30 * 1000;

// Version key to detect app updates and force cache clear
const APP_CACHE_VERSION = 'v2.0.1-enhanced-update';
const CACHE_VERSION_KEY = 'autofloy_cache_version';

// Force service worker update on version change
async function clearOldCachesIfNeeded(): Promise<boolean> {
  try {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (storedVersion !== APP_CACHE_VERSION) {
      console.log('[SW] App version changed from', storedVersion, 'to', APP_CACHE_VERSION);
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[SW] Cleared', cacheNames.length, 'caches');
      }
      
      // Update version
      localStorage.setItem(CACHE_VERSION_KEY, APP_CACHE_VERSION);
      return true; // Caches were cleared
    }
    return false;
  } catch (error) {
    console.warn('[SW] Error clearing old caches:', error);
    return false;
  }
}

// Skip waiting and activate new service worker immediately
function promptServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
  if (registration.waiting) {
    console.log('[SW] Telling waiting service worker to skip waiting');
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

export function register(config?: Config): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      // Clear old caches if app version changed
      const cachesCleared = await clearOldCachesIfNeeded();
      
      if (cachesCleared) {
        console.log('[SW] Caches cleared due to version change, will register fresh SW');
      }
      
      const swUrl = '/sw.js';

      try {
        const registration = await navigator.serviceWorker.register(swUrl, {
          updateViaCache: 'none' // Never cache the service worker file
        });
        
        console.log('[SW] Service Worker registered successfully');

        // Check for updates frequently
        const checkUpdate = () => {
          registration.update().catch(err => {
            console.debug('[SW] Update check failed:', err);
          });
        };
        
        // Check every 30 seconds
        setInterval(checkUpdate, UPDATE_CHECK_INTERVAL);
        
        // Also check on visibility change
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            setTimeout(checkUpdate, 1000);
          }
        });
        
        // Also check on online event (reconnect)
        window.addEventListener('online', () => {
          setTimeout(checkUpdate, 2000);
        });

        // Handle update found
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          
          console.log('[SW] New service worker installing...');
          
          installingWorker.onstatechange = () => {
            console.log('[SW] Installing worker state:', installingWorker.state);
            
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content available
                console.log('[SW] New content available - will activate immediately');
                
                // Tell the waiting service worker to skip waiting
                promptServiceWorkerUpdate(registration);
                
                if (config?.onUpdate) {
                  config.onUpdate(registration);
                }
              } else {
                // Content cached for first time (offline use)
                console.log('[SW] Content is cached for offline use');
                if (config?.onSuccess) {
                  config.onSuccess(registration);
                }
                if (config?.onOfflineReady) {
                  config.onOfflineReady();
                }
              }
            }
          };
        };
        
        // If there's already a waiting worker, prompt to update
        if (registration.waiting) {
          console.log('[SW] Found waiting service worker on registration');
          promptServiceWorkerUpdate(registration);
          if (config?.onUpdate) {
            config.onUpdate(registration);
          }
        }
        
      } catch (error) {
        console.error('[SW] Service Worker registration failed:', error);
      }

      // Listen for controller change - new SW activated
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Controller changed - new service worker activated');
        if (refreshing) return;
        refreshing = true;
        
        // The GlobalUpdateNotification component will handle showing the update prompt
        // We don't auto-reload to avoid disrupting user activity
      });
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_UPDATED') {
          console.log('[SW] Service worker reports update complete');
          if (config?.onUpdate && event.data.registration) {
            config.onUpdate(event.data.registration);
          }
        }
      });
    });
  }
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[SW] Unregistration failed:', error);
      });
  }
}

// Force update check
export function checkForUpdates(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      console.log('[SW] Manual update check triggered');
      registration.update();
    });
  }
}

// Clear all caches and force fresh load
export async function forceUpdate(): Promise<void> {
  console.log('[SW] Force update initiated');
  
  try {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[SW] Cleared', cacheNames.length, 'caches');
    }
    
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('[SW] Unregistered', registrations.length, 'service workers');
    }
    
    // Clear version keys
    localStorage.removeItem(CACHE_VERSION_KEY);
    localStorage.removeItem('autofloy_app_version');
    localStorage.removeItem('autofloy_build_hash');
    
    // Reload with cache-busting
    window.location.href = window.location.pathname + '?_force=' + Date.now();
  } catch (error) {
    console.error('[SW] Force update failed:', error);
    window.location.reload();
  }
}

// Check if app is running in standalone mode (installed PWA)
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}

// Check if app is installable
export function isInstallable(): boolean {
  return 'serviceWorker' in navigator && 
    'BeforeInstallPromptEvent' in window;
}

// Get the current service worker state
export async function getServiceWorkerState(): Promise<{
  hasController: boolean;
  hasWaiting: boolean;
  hasInstalling: boolean;
}> {
  if (!('serviceWorker' in navigator)) {
    return { hasController: false, hasWaiting: false, hasInstalling: false };
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    return {
      hasController: !!navigator.serviceWorker.controller,
      hasWaiting: !!registration.waiting,
      hasInstalling: !!registration.installing,
    };
  } catch {
    return { hasController: false, hasWaiting: false, hasInstalling: false };
  }
}
