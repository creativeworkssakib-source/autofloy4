import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, X, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Check if already dismissed
const isDismissed = () => sessionStorage.getItem('extension-warning-dismissed') === 'true';

export const ExtensionBlockerDetector = () => {
  const [showWarning, setShowWarning] = useState(false);

  // Only run detection once on mount
  useEffect(() => {
    if (isDismissed()) {
      return;
    }

    // Test multiple endpoints that are commonly blocked
    const checkTimer = setTimeout(async () => {
      const testUrls = [
        'https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/dashboard-stats',
        'https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/execution-logs',
        'https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/automations'
      ];
      
      let blockedCount = 0;
      
      for (const testUrl of testUrls) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          await fetch(testUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          clearTimeout(timeoutId);
        } catch (error) {
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            blockedCount++;
          }
        }
      }
      
      // Show warning if 2 or more endpoints are blocked
      if (blockedCount >= 2 && !isDismissed()) {
        setShowWarning(true);
      }
    }, 2000); // Wait 2 seconds before checking

    return () => clearTimeout(checkTimer);
  }, []);

  const handleDismiss = useCallback(() => {
    setShowWarning(false);
    sessionStorage.setItem('extension-warning-dismissed', 'true');
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
