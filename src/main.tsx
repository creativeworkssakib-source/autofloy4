import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { register as registerSW, requestPersistentStorage } from "./lib/serviceWorkerRegistration";

// Request persistent storage for better offline support
requestPersistentStorage().then((persisted) => {
  console.log('[App] Persistent storage:', persisted ? 'granted' : 'not available');
});

// Register service worker for offline support
registerSW({
  onSuccess: () => {
    console.log("[App] PWA registered successfully");
  },
  onUpdate: () => {
    console.log("[App] New version available! Refresh to update.");
    // The UpdateNotification component will handle showing the update prompt
  },
  onOfflineReady: () => {
    console.log("[App] App is ready to work offline");
  },
  onRegistrationError: (error) => {
    console.error("[App] PWA registration failed:", error);
  },
});

createRoot(document.getElementById("root")!).render(<App />);
