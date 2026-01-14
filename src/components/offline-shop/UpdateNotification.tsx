/**
 * PWA Update Notification Component
 * 
 * Shows a notification when app updates are available.
 * Works with vite-plugin-pwa.
 */

import { useEffect, useState } from 'react';
import { RefreshCw, X, Download, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePWAStatus } from '@/hooks/usePWAStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { syncManager } from '@/services/syncManager';
import { toast } from 'sonner';

export const UpdateNotification = () => {
  const { language } = useLanguage();
  const { needRefresh, isOnline, isOfflineReady, update, dismissUpdate } = usePWAStatus();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showOfflineReady, setShowOfflineReady] = useState(false);

  // Show offline ready notification once
  useEffect(() => {
    if (isOfflineReady && !localStorage.getItem('pwa_offline_ready_shown')) {
      setShowOfflineReady(true);
      localStorage.setItem('pwa_offline_ready_shown', 'true');
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowOfflineReady(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOfflineReady]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // First sync any pending data
      if (isOnline) {
        toast.info(
          language === 'bn' 
            ? 'ডেটা সিঙ্ক করা হচ্ছে...' 
            : 'Syncing data...'
        );
        
        await syncManager.sync();
      }
      
      // Then apply the update
      await update();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(
        language === 'bn'
          ? 'আপডেট করতে সমস্যা হয়েছে'
          : 'Update failed'
      );
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    dismissUpdate();
  };

  // Show offline ready notification
  if (showOfflineReady && !needRefresh) {
    return (
      <Alert className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-green-500/10 border-green-500 shadow-lg animate-in slide-in-from-bottom-4">
        <Wifi className="h-4 w-4 text-green-500" />
        <AlertTitle className="font-semibold text-green-600">
          {language === 'bn' ? 'অফলাইন রেডি!' : 'Offline Ready!'}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm text-muted-foreground">
            {language === 'bn' 
              ? 'অ্যাপ এখন অফলাইনে কাজ করতে প্রস্তুত। ইন্টারনেট ছাড়াও ব্যবহার করতে পারবেন।'
              : 'App is now ready to work offline. You can use it without internet.'
            }
          </p>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowOfflineReady(false)}
            className="mt-2"
          >
            <X className="h-4 w-4 mr-1" />
            {language === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show update notification
  if (!needRefresh || dismissed) return null;

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

export default UpdateNotification;
