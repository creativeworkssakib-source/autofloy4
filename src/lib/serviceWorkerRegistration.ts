/**
 * Service Worker Registration
 * 
 * Registers the PWA service worker and handles updates
 * Auto-updates immediately when new version is available
 */

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
};

// Check interval - every 1 minute for faster updates
const UPDATE_CHECK_INTERVAL = 60 * 1000;

export function register(config?: Config): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('Service Worker registered successfully');

          // Check for updates frequently - every 1 minute
          setInterval(() => {
            registration.update().catch(err => {
              console.debug('SW update check failed:', err);
            });
          }, UPDATE_CHECK_INTERVAL);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available - force refresh immediately
                  console.log('New content is available; auto-updating...');
                  
                  // Skip waiting and claim clients immediately
                  if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                  }
                  
                  if (config?.onUpdate) {
                    config.onUpdate(registration);
                  }
                  
                  // Don't auto-reload here - let GlobalUpdateNotification handle it
                  // This prevents jarring reloads during user activity
                } else {
                  // Content cached for offline use
                  console.log('Content is cached for offline use.');
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
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for controller change - this means SW was updated
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        console.log('New service worker activated');
        // Don't auto-reload - let the update notification handle it
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
        console.error('Service Worker unregistration failed:', error);
      });
  }
}

// Force update check
export function checkForUpdates(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }
}

// Clear all caches and force update
export async function forceUpdate(): Promise<void> {
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
    
    // Reload
    window.location.reload();
  } catch (error) {
    console.error('Force update failed:', error);
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
