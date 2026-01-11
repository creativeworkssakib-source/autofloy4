import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { register as registerSW } from "./lib/serviceWorkerRegistration";

// Register service worker for offline support
registerSW({
  onSuccess: () => {
    console.log("App ready for offline use");
  },
  onUpdate: () => {
    console.log("New version available! Refresh to update.");
  },
  onOfflineReady: () => {
    console.log("App is ready to work offline");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
