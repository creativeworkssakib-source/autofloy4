import { useState, useEffect } from "react";
import { AlertTriangle, X, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Track failed fetches globally
let failedFetchCount = 0;
let lastResetTime = Date.now();
const FAILURE_THRESHOLD = 3; // Number of failures before showing warning
const RESET_INTERVAL = 30000; // Reset count every 30 seconds

// Intercept fetch to detect failures
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);
    return response;
  } catch (error) {
    // Reset counter if enough time has passed
    if (Date.now() - lastResetTime > RESET_INTERVAL) {
      failedFetchCount = 0;
      lastResetTime = Date.now();
    }
    
    // Only count failures to our API
    const firstArg = args[0];
    let url = '';
    if (typeof firstArg === 'string') {
      url = firstArg;
    } else if (firstArg instanceof Request) {
      url = firstArg.url;
    } else if (firstArg instanceof URL) {
      url = firstArg.href;
    }
    
    if (url.includes('supabase.co/functions')) {
      failedFetchCount++;
      // Dispatch custom event when threshold reached
      if (failedFetchCount >= FAILURE_THRESHOLD) {
        window.dispatchEvent(new CustomEvent('extension-blocking-detected'));
      }
    }
    throw error;
  }
};

export const ExtensionBlockerDetector = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    const wasDismissed = sessionStorage.getItem('extension-warning-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    const handleBlockingDetected = () => {
      if (!dismissed) {
        setShowWarning(true);
      }
    };

    window.addEventListener('extension-blocking-detected', handleBlockingDetected);
    return () => {
      window.removeEventListener('extension-blocking-detected', handleBlockingDetected);
    };
  }, [dismissed]);

  const handleDismiss = () => {
    setShowWarning(false);
    setDismissed(true);
    sessionStorage.setItem('extension-warning-dismissed', 'true');
    // Reset counter
    failedFetchCount = 0;
  };

  const handleOpenIncognito = () => {
    // Copy current URL to clipboard
    navigator.clipboard.writeText(window.location.href);
    alert('URL copied! Open an Incognito window (Ctrl+Shift+N) and paste it there.');
  };

  if (!showWarning || dismissed) {
    return null;
  }

  return (
    <Alert 
      variant="destructive" 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[450px] z-50 shadow-lg border-warning bg-warning/10"
    >
      <AlertTriangle className="h-5 w-5 text-warning" />
      <AlertTitle className="text-warning-foreground flex items-center justify-between">
        <span>Browser Extension Blocking Detected</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 -mr-2" 
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="text-muted-foreground mt-2 space-y-3">
        <p>
          আপনার browser-এ কোনো extension (Ad blocker, VPN, etc.) API requests block করছে।
        </p>
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleOpenIncognito}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Incognito Mode ব্যবহার করুন
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleDismiss}
          >
            Ignore
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
