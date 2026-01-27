import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, X, ExternalLink, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

// Check if already dismissed (persist for 24 hours)
const DISMISS_KEY = 'extension-warning-dismissed';
const DISMISS_EXPIRY_KEY = 'extension-warning-dismissed-expiry';

const isDismissed = () => {
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    const expiry = localStorage.getItem(DISMISS_EXPIRY_KEY);
    
    if (dismissed === 'true' && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime) {
        return true;
      }
      // Expired, clear the storage
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

// Check if running in a context where extensions are likely not the issue
const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
};

export const ExtensionBlockerDetector = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Skip if already dismissed, not logged in, or on a real mobile device
    // Mobile devices typically don't have browser extensions that block requests
    if (isDismissed() || !isAuthenticated()) {
      return;
    }

    // On real mobile devices, skip detection as they rarely have blocking extensions
    if (isMobileDevice()) {
      console.log('[ExtensionBlockerDetector] Skipping - mobile device detected');
      return;
    }

    setIsChecking(true);

    // Wait longer before checking to avoid race conditions
    const checkTimer = setTimeout(async () => {
      // Re-check auth status after delay
      if (!isAuthenticated() || isDismissed()) {
        setIsChecking(false);
        return;
      }

      const testUrls = [
        'https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/dashboard-stats',
        'https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/execution-logs',
        'https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/automations'
      ];
      
      let blockedCount = 0;
      let successCount = 0;
      let timeoutCount = 0;
      
      for (const testUrl of testUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
          
          const response = await fetch(testUrl, {
            method: 'OPTIONS',
            signal: controller.signal,
            cache: 'no-store',
          });
          
          clearTimeout(timeoutId);
          
          // If we get any response (even error status), the request went through
          successCount++;
          console.log('[ExtensionBlockerDetector] Success for:', testUrl, response.status);
        } catch (error) {
          // Only count as blocked if it's a specific network error (Failed to fetch)
          // This happens when extensions block the request entirely
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            blockedCount++;
            console.log('[ExtensionBlockerDetector] Blocked:', testUrl);
          } else if (error instanceof DOMException && error.name === 'AbortError') {
            // Timeout - could be slow network, don't count as blocked
            timeoutCount++;
            console.log('[ExtensionBlockerDetector] Timeout for:', testUrl);
          } else {
            // Other errors (CORS, etc.) mean the request reached the server
            successCount++;
            console.log('[ExtensionBlockerDetector] Other error (counted as success):', testUrl, error);
          }
        }
      }
      
      setIsChecking(false);
      
      // Only show warning if ALL 3 endpoints are blocked AND no successful requests
      // AND not just timeouts (which could be network issues)
      const isBlocked = blockedCount === 3 && successCount === 0 && timeoutCount === 0;
      
      if (isBlocked && !isDismissed()) {
        console.log('[ExtensionBlockerDetector] All endpoints blocked - showing warning');
        setShowWarning(true);
      } else {
        console.log('[ExtensionBlockerDetector] Not blocked:', { blockedCount, successCount, timeoutCount });
      }
    }, 5000); // Wait 5 seconds to let the page fully load

    return () => {
      clearTimeout(checkTimer);
      setIsChecking(false);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setShowWarning(false);
    // Dismiss for 24 hours
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
      localStorage.setItem(DISMISS_EXPIRY_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    } catch {
      // Ignore localStorage errors
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

  // Don't show anything if not warning
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
