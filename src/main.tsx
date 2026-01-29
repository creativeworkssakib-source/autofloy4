import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { register as registerSW, forceUpdate } from "./lib/serviceWorkerRegistration";

// CLEANUP: Remove old extension blocker warning state and stale cached data
// This runs once on app load to ensure clean slate
try {
  localStorage.removeItem('extension-warning-dismissed');
  localStorage.removeItem('rpc-fallback-success');
  localStorage.removeItem('extension-blocker-detected');
  
  // Clear stale dashboard cache on app startup to ensure fresh data
  const dashboardCache = localStorage.getItem('autofloy_dashboard_stats_cache');
  if (dashboardCache) {
    try {
      const { timestamp } = JSON.parse(dashboardCache);
      // Clear cache if older than 10 minutes
      if (Date.now() - timestamp > 10 * 60 * 1000) {
        localStorage.removeItem('autofloy_dashboard_stats_cache');
        console.log('[App] Cleared stale dashboard cache');
      }
    } catch {
      // If parse fails, clear it
      localStorage.removeItem('autofloy_dashboard_stats_cache');
    }
  }
} catch {
  // Ignore storage errors
}

// Check for forced refresh parameter (used after update)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('_refresh') || urlParams.has('_force')) {
  // Clean up the URL without reloading
  const cleanUrl = window.location.pathname + window.location.hash;
  window.history.replaceState({}, document.title, cleanUrl);
  console.log('[App] Cleaned up refresh URL parameter');
}

// Register service worker for offline support
// Updates are handled by GlobalUpdateNotification component
registerSW({
  onSuccess: () => {
    console.log("[App] Service worker registered - app ready for offline use");
  },
  onUpdate: (registration) => {
    console.log("[App] New version available via service worker");
    // The GlobalUpdateNotification will detect this via controllerchange event
  },
  onOfflineReady: () => {
    console.log("[App] App is cached and ready to work offline");
  },
});

// Expose forceUpdate globally for debugging
(window as any).forceAppUpdate = forceUpdate;

createRoot(document.getElementById("root")!).render(<App />);
