import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { requestPersistentStorage } from "./lib/serviceWorkerRegistration";

// Request persistent storage for better offline support
requestPersistentStorage().then((persisted) => {
  console.log('[App] Persistent storage:', persisted ? 'granted' : 'not available');
});

// Service worker registration is now handled by usePWAStatus hook
// using virtual:pwa-register/react from vite-plugin-pwa

createRoot(document.getElementById("root")!).render(<App />);
