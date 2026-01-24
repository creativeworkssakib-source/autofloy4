import { useState, useEffect } from "react";
import { AlertTriangle, X, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Track failed fetches globally
let failedFetchCount = 0;
let successfulFetchCount = 0;
let lastResetTime = Date.now();
const FAILURE_THRESHOLD = 5; // Number of failures before showing warning
const RESET_INTERVAL = 60000; // Reset count every 60 seconds

// Check if already dismissed
const isDismissed = () => sessionStorage.getItem('extension-warning-dismissed') === 'true';

// Intercept fetch to detect failures
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);
    
    // Count successful API calls
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
      successfulFetchCount++;
      // If we have successful calls, reset failure count
      if (successfulFetchCount >= 2) {
        failedFetchCount = 0;
      }
    }
    
    return response;
  } catch (error) {
    // Reset counter if enough time has passed
    if (Date.now() - lastResetTime > RESET_INTERVAL) {
      failedFetchCount = 0;
      successfulFetchCount = 0;
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
      // Only dispatch event if:
      // 1. Threshold reached
      // 2. No successful calls (means all are failing)
      // 3. Not already dismissed
      if (failedFetchCount >= FAILURE_THRESHOLD && successfulFetchCount === 0 && !isDismissed()) {
        window.dispatchEvent(new CustomEvent('extension-blocking-detected'));
      }
    }
    throw error;
  }
};

export const ExtensionBlockerDetector = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed
    if (isDismissed()) {
      return;
    }

    const handleBlockingDetected = () => {
      if (!isDismissed()) {
        setShowWarning(true);
      }
    };

    window.addEventListener('extension-blocking-detected', handleBlockingDetected);
    return () => {
      window.removeEventListener('extension-blocking-detected', handleBlockingDetected);
    };
  }, []);

  const handleDismiss = () => {
    setShowWarning(false);
    sessionStorage.setItem('extension-warning-dismissed', 'true');
    // Reset counters
    failedFetchCount = 0;
    successfulFetchCount = 0;
  };

  const handleOpenIncognito = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('URL copied! Open an Incognito window (Ctrl+Shift+N) and paste it there.');
  };

  if (!showWarning) {
    return null;
  }

  return (
    <Alert 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[450px] z-50 shadow-2xl border-2 border-destructive bg-card"
    >
      <AlertTriangle className="h-5 w-5 text-destructive" />
      <AlertTitle className="text-foreground flex items-center justify-between font-semibold">
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
      <AlertDescription className="text-foreground mt-2 space-y-3">
        <p className="font-medium">
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
