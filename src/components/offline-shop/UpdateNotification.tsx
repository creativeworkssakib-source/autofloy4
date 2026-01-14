/**
 * PWA Update Notification Component
 * 
 * Shows a notification when app updates are available.
 * Disabled in development mode.
 */

import { useState, useEffect, Component, ReactNode } from 'react';
import { RefreshCw, X, Download, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { syncManager } from '@/services/syncManager';
import { toast } from 'sonner';

// Check if we're in development mode
const isDev = import.meta.env.DEV;

// Error boundary to prevent crashes
class UpdateNotificationErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[UpdateNotification] Error caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return null; // Silently fail - update notification is not critical
    }
    return this.props.children;
  }
}

// Inner component that uses hooks
const UpdateNotificationInner = () => {
  const { language } = useLanguage();
  
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('pwa_update_dismissed') === 'true');

  // Listen for online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for service worker updates (only in production, after 30 seconds)
  useEffect(() => {
    if (isDev || !('serviceWorker' in navigator)) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration?.waiting) {
          setHasUpdate(true);
        }
        
        // Listen for future updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setHasUpdate(true);
            }
          });
        });
      } catch (error) {
        console.error('[UpdateNotification] SW check failed:', error);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      if (isOnline) {
        toast.info(language === 'bn' ? 'ডেটা সিঙ্ক করা হচ্ছে...' : 'Syncing data...');
        await syncManager.sync();
      }
      
      const registration = await navigator.serviceWorker.ready;
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        }, { once: true });
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('[UpdateNotification] Update failed:', error);
      toast.error(language === 'bn' ? 'আপডেট করতে সমস্যা হয়েছে' : 'Update failed');
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_update_dismissed', 'true');
  };

  // Don't show in development or if dismissed or no update
  if (isDev || dismissed || !hasUpdate) {
    return null;
  }

  return (
    <Alert className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-primary/10 border-primary shadow-lg animate-in slide-in-from-bottom-4">
      <Download className="h-4 w-4" />
      <AlertTitle className="font-semibold">
        {language === 'bn' ? 'নতুন আপডেট পাওয়া গেছে!' : 'Update Available!'}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm text-muted-foreground mb-3">
          {language === 'bn' 
            ? 'অ্যাপের নতুন ভার্সন পাওয়া গেছে। আপডেট করতে নিচের বাটনে ক্লিক করুন।'
            : 'A new version is available. Click the button below to update.'
          }
        </p>
        
        {!isOnline && (
          <div className="flex items-center gap-2 text-sm text-amber-600 mb-3">
            <WifiOff className="h-4 w-4" />
            {language === 'bn' 
              ? 'অফলাইন আছেন - অনলাইন হলে আপডেট করুন'
              : 'You are offline - update when online'
            }
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handleUpdate}
            disabled={isUpdating || !isOnline}
            className="flex-1"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {language === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...'}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'এখনই আপডেট করুন' : 'Update Now'}
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleDismiss}
            disabled={isUpdating}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Export with error boundary wrapper
export const UpdateNotification = () => {
  // Skip entirely in development
  if (isDev) return null;
  
  return (
    <UpdateNotificationErrorBoundary>
      <UpdateNotificationInner />
    </UpdateNotificationErrorBoundary>
  );
};

export default UpdateNotification;
