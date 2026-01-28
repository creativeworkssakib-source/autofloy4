import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { register as registerSW } from "./lib/serviceWorkerRegistration";

// CLEANUP: Remove old extension blocker warning state that caused false positives
// This runs once on app load to ensure clean slate
try {
  localStorage.removeItem('extension-warning-dismissed');
  localStorage.removeItem('rpc-fallback-success');
  localStorage.removeItem('extension-blocker-detected');
} catch {
  // Ignore storage errors
}

// Register service worker for offline support
// Updates are handled by GlobalUpdateNotification component
registerSW({
  onSuccess: () => {
    console.log("App ready for offline use");
  },
  onUpdate: () => {
    console.log("New version available - update notification will appear");
  },
  onOfflineReady: () => {
    console.log("App is ready to work offline");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
