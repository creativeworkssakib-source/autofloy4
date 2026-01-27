import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, X, ExternalLink, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

// Check if already dismissed (persist for 7 days now)
const DISMISS_KEY = 'extension-warning-dismissed';
const DISMISS_EXPIRY_KEY = 'extension-warning-dismissed-expiry';
const FALLBACK_SUCCESS_KEY = 'rpc-fallback-success';

const isDismissed = () => {
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    const expiry = localStorage.getItem(DISMISS_EXPIRY_KEY);
    
    if (dismissed === 'true' && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime) {
        return true;
      }
      localStorage.removeItem(DISMISS_KEY);
      localStorage.removeItem(DISMISS_EXPIRY_KEY);
    }
    return false;
  } catch {
    return false;
  }
};

// Check if user is authenticated
const isAuthenticated = () => {
  try {
    return !!localStorage.getItem('autofloy_token');
  } catch {
    return false;
  }
};

// Check if RPC fallback has worked successfully
// If RPC fallback works, we don't need to show the warning
const hasRpcFallbackSucceeded = () => {
  try {
    return localStorage.getItem(FALLBACK_SUCCESS_KEY) === 'true';
  } catch {
    return false;
  }
};

// Mark RPC fallback as successful - called from apiService
export const markRpcFallbackSuccess = () => {
  try {
    localStorage.setItem(FALLBACK_SUCCESS_KEY, 'true');
  } catch {
    // Ignore
  }
};

// Check if running in a context where extensions are likely not the issue
const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
};

// Check if running in PWA, APK or native app
const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  
  // PWA standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if ((navigator as any).standalone === true) return true;
  
  // Capacitor/Cordova
  if ((window as any).Capacitor?.isNativePlatform?.()) return true;
  
  // Electron
  if (navigator.userAgent.toLowerCase().includes('electron')) return true;
  if ((window as any).electron) return true;
  
  return false;
};

export const ExtensionBlockerDetector = () => {
  const [showWarning, setShowWarning] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Skip if already dismissed, not logged in, on mobile device, or in native app
    if (isDismissed() || !isAuthenticated() || isMobileDevice() || isNativeApp()) {
      return;
    }

    // Check after a longer delay to allow all fallbacks to complete
    const checkTimer = setTimeout(() => {
      // Re-check conditions - especially RPC fallback success
      if (!isAuthenticated() || isDismissed()) {
        return;
      }

      // If RPC fallback has worked, don't show warning
      // This is the most important check - if data loaded, don't warn
      if (hasRpcFallbackSucceeded()) {
        console.log('[ExtensionBlockerDetector] RPC fallback succeeded - skipping warning');
        return;
      }

      // Only run detection if RPC fallback hasn't been marked as successful yet
      // This means we wait a bit more and check again
      const secondCheck = setTimeout(() => {
        // Final check - if RPC worked by now, don't show
        if (hasRpcFallbackSucceeded() || isDismissed()) {
          console.log('[ExtensionBlockerDetector] RPC fallback succeeded on second check');
          return;
        }

        // Do a direct test to see if Supabase is reachable at all
        const checkBothFailing = async () => {
          try {
            // Try the REST API directly (not RPC) since that's more reliable
            const testUrl = `${window.location.protocol}//klkrzfwvrmffqkmkyqrh.supabase.co/rest/v1/`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(testUrl, {
              method: 'HEAD',
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsa3J6Znd2cm1mZnFrbWt5cXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTE4MjcsImV4cCI6MjA4MTQ2NzgyN30.ZArRZTr6tGhhnptPXvq7Onn4OhMLxrF7FvKkYC26nXg',
              },
              signal: controller.signal,
              cache: 'no-store',
            });
            
            clearTimeout(timeoutId);
            
            // Any response means Supabase is reachable
            console.log('[ExtensionBlockerDetector] Supabase reachable:', response.status);
            markRpcFallbackSuccess();
            // Don't show warning
            
          } catch (error) {
            // Only show warning if it's truly a "Failed to fetch" network error
            // AND the RPC fallback hasn't worked
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
              // Final check - maybe RPC succeeded while we were testing
              if (hasRpcFallbackSucceeded() || isDismissed()) {
                return;
              }
              console.log('[ExtensionBlockerDetector] All requests blocked - showing warning');
              setShowWarning(true);
            } else {
              // Timeout or other error - Supabase might still be reachable
              console.log('[ExtensionBlockerDetector] Non-blocking error:', error);
              markRpcFallbackSuccess();
            }
          }
        };

        checkBothFailing();
      }, 5000); // Wait another 5 seconds

      return () => clearTimeout(secondCheck);
    }, 10000); // Initial wait of 10 seconds for all page loads to complete

    return () => {
      clearTimeout(checkTimer);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setShowWarning(false);
    // Dismiss for 7 days now (longer to reduce annoyance)
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
      localStorage.setItem(DISMISS_EXPIRY_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    } catch {
      // Ignore
    }
  }, []);

  const handleOpenIncognito = useCallback(() => {
    try {
      navigator.clipboard.writeText(window.location.href);
      alert(isMobile 
        ? 'URL কপি হয়েছে! Incognito mode এ paste করুন।'
        : 'URL copied! Open an Incognito window (Ctrl+Shift+N) and paste it there.'
      );
    } catch {
      alert('Please copy the URL manually and open in Incognito mode.');
    }
  }, [isMobile]);

  if (!showWarning) {
    return null;
  }

  // Mobile-optimized compact view
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-card border-t-2 border-destructive shadow-lg safe-area-inset-bottom">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm text-foreground">
                Extension Block
              </p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 flex-shrink-0" 
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ad blocker/VPN API block করছে
            </p>
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleOpenIncognito}
                className="text-xs h-8"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Incognito
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs h-8"
              >
                বাদ দিন
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <Alert 
      className="fixed z-50 bottom-4 right-4 w-[420px] shadow-2xl border-2 border-destructive bg-card"
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
            বাদ দিন
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
