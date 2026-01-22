/**
 * Service Worker Registration
 * 
 * Registers the PWA service worker and handles updates
 * Auto-updates when new version is available
 */

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
};

export function register(config?: Config): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('Service Worker registered successfully');

          // Check for updates more frequently - every 5 minutes
          setInterval(() => {
            registration.update();
          }, 5 * 60 * 1000); // Check every 5 minutes

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available - force refresh
                  console.log('New content is available; auto-updating...');
                  
                  // Skip waiting and claim clients immediately
                  if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                  }
                  
                  if (config?.onUpdate) {
                    config.onUpdate(registration);
                  }
                  
                  // Auto reload after short delay to get new version
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
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

      // Listen for controller change and reload
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New service worker activated, reloading...');
        window.location.reload();
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
