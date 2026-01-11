/**
 * Update Notification Component
 * 
 * Shows a notification when app updates are available.
 * Works with PWA, Capacitor APK, and Electron EXE.
 */

import { useState, useEffect } from 'react';
import { RefreshCw, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { appUpdateService } from '@/services/appUpdateService';
import { useLanguage } from '@/contexts/LanguageContext';

export const UpdateNotification = () => {
  const { language } = useLanguage();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState<string | undefined>();

  useEffect(() => {
    // Subscribe to update notifications
    const unsubscribe = appUpdateService.subscribe((result) => {
      if (result.hasUpdate && !dismissed) {
        setHasUpdate(true);
        setReleaseNotes(result.releaseNotes);
      }
    });

    return () => unsubscribe();
  }, [dismissed]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // First sync all data
      await appUpdateService.syncDataOnUpdate();
      
      // Then apply the update based on platform
      if (appUpdateService.isPWA()) {
        await appUpdateService.applyPWAUpdate();
      } else {
        // For APK/EXE, just refresh to get latest from server
        window.location.reload();
      }
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setHasUpdate(false);
  };

  if (!hasUpdate || dismissed) return null;

  return (
    <Alert className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-primary/10 border-primary shadow-lg animate-in slide-in-from-bottom-4">
      <Download className="h-4 w-4" />
      <AlertTitle className="font-semibold">
        {language === 'bn' ? 'নতুন আপডেট পাওয়া গেছে!' : 'Update Available!'}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm text-muted-foreground mb-3">
          {releaseNotes || (language === 'bn' 
            ? 'অ্যাপের নতুন ভার্সন পাওয়া গেছে। আপডেট করতে নিচের বাটনে ক্লিক করুন।'
            : 'A new version is available. Click the button below to update.'
          )}
        </p>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handleUpdate}
            disabled={isUpdating}
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
