/**
 * PWA Silent Auto-Update
 * 
 * Automatically updates the PWA in the background when online.
 * No user interaction needed - completely silent.
 */

// Check if we're in development mode
const isDev = import.meta.env.DEV;

// Initialize silent auto-update
export function initPWAAutoUpdate() {
  if (isDev || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('[PWA] Service Worker registered');
      
      // Auto-update when new version is found
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New version available, auto-updating...');
            // Silently activate new service worker
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
      
      // Listen for controller change and reload
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Controller changed, reloading...');
        window.location.reload();
      });
      
      // Check for updates every 30 minutes
      setInterval(() => {
        registration.update().catch(() => {});
      }, 30 * 60 * 1000);
      
      // Check immediately if there's a waiting worker
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    })
    .catch((error) => {
      console.error('[PWA] Registration failed:', error);
    });
}

// UpdateNotification component - returns null (no UI)
export const UpdateNotification = () => null;

export default UpdateNotification;
