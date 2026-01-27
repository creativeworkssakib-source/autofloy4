import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, X, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

// Check if already dismissed (persist for 24 hours)
const DISMISS_KEY = 'extension-warning-dismissed';
const DISMISS_EXPIRY_KEY = 'extension-warning-dismissed-expiry';

const isDismissed = () => {
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
};

// Check if user is authenticated
const isAuthenticated = () => !!localStorage.getItem('autofloy_token');

export const ExtensionBlockerDetector = () => {
  const [showWarning, setShowWarning] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Skip if already dismissed or if user is not logged in
    if (isDismissed() || !isAuthenticated()) {
      return;
    }

    // Wait longer before checking to avoid race conditions
    const checkTimer = setTimeout(async () => {
      // Re-check auth status after delay
      if (!isAuthenticated()) return;

      const testUrls = [
        'https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/dashboard-stats',
        'https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/execution-logs',
        'https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/automations'
      ];
      
      let blockedCount = 0;
      let successCount = 0;
      
      for (const testUrl of testUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // Longer timeout
          
          const response = await fetch(testUrl, {
            method: 'OPTIONS',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          // If we get any response (even error status), the request went through
          successCount++;
        } catch (error) {
          // Only count as blocked if it's a network error (Failed to fetch)
          // NOT if it's an abort or timeout
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            blockedCount++;
          } else if (error instanceof DOMException && error.name === 'AbortError') {
            // Timeout - don't count as blocked, could be slow network
            console.log('[ExtensionBlockerDetector] Timeout for:', testUrl);
          }
        }
      }
      
      // Only show warning if ALL 3 endpoints are blocked AND no successful requests
      // This reduces false positives significantly
      if (blockedCount === 3 && successCount === 0 && !isDismissed()) {
        console.log('[ExtensionBlockerDetector] All endpoints blocked - showing warning');
        setShowWarning(true);
      }
    }, 4000); // Wait 4 seconds to let the page fully load

    return () => clearTimeout(checkTimer);
  }, []);

  const handleDismiss = useCallback(() => {
    setShowWarning(false);
    // Dismiss for 24 hours
    localStorage.setItem(DISMISS_KEY, 'true');
    localStorage.setItem(DISMISS_EXPIRY_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
  }, []);

  const handleOpenIncognito = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    alert('URL copied! Open an Incognito window (Ctrl+Shift+N) and paste it there.');
  }, []);

  if (!showWarning) {
    return null;
  }

  return (
    <Alert 
      className={`fixed z-50 shadow-2xl border-2 border-destructive bg-card ${
        isMobile 
          ? 'bottom-2 left-2 right-2 text-sm' 
          : 'bottom-4 left-auto right-4 w-[450px]'
      }`}
    >
      <AlertTriangle className={`text-destructive ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
      <AlertTitle className="text-foreground flex items-center justify-between font-semibold">
        <span className={isMobile ? 'text-sm' : ''}>
          {isMobile ? 'Extension Blocking' : 'Browser Extension Blocking Detected'}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 -mr-2" 
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className={`text-foreground mt-2 space-y-3 ${isMobile ? 'text-xs' : ''}`}>
        <p className="font-medium">
          {isMobile 
            ? 'Ad blocker/VPN API block করছে।'
            : 'আপনার browser-এ কোনো extension (Ad blocker, VPN, etc.) API requests block করছে।'
          }
        </p>
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleOpenIncognito}
            className={isMobile ? 'text-xs px-2 py-1 h-7' : ''}
          >
            <ExternalLink className={`mr-1 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            {isMobile ? 'Incognito' : 'Incognito Mode ব্যবহার করুন'}
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleDismiss}
            className={isMobile ? 'text-xs px-2 py-1 h-7' : ''}
          >
            Ignore
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
