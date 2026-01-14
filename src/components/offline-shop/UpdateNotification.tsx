/**
 * PWA Silent Auto-Update (No UI)
 * 
 * PWA auto-updates silently via vite-plugin-pwa with:
 * - registerType: 'autoUpdate'
 * - skipWaiting: true
 * - clientsClaim: true
 * 
 * No user interaction needed.
 */

// Empty init function - PWA handles updates automatically
export function initPWAAutoUpdate() {
  // PWA auto-updates are handled by vite-plugin-pwa configuration
  // No manual registration needed with registerType: 'autoUpdate'
  console.log('[PWA] Auto-update enabled via vite-plugin-pwa');
}

// Empty component - no UI needed
export const UpdateNotification = () => null;

export default UpdateNotification;
