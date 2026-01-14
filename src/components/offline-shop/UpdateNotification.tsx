/**
 * PWA Update Notification Component
 * 
 * Shows a compact notification when app updates are available.
 * Works with vite-plugin-pwa.
 */

import { useState } from 'react';
import { RefreshCw, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAStatus } from '@/hooks/usePWAStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export const UpdateNotification = () => {
  const { language } = useLanguage();
  const { needRefresh, isOnline, update, dismissUpdate } = usePWAStatus();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleUpdate = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    toast.info(
      language === 'bn' 
        ? 'আপডেট হচ্ছে, পেজ রিলোড হবে...' 
        : 'Updating, page will reload...'
    );
    
    try {
      await update();
      // If update() doesn't reload, force reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Update failed:', error);
      // Force reload as fallback
      window.location.reload();
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    dismissUpdate();
  };

  // Don't show if no update needed or already dismissed
  if (!needRefresh || dismissed) return null;

  return (
    <>
      {/* Backdrop with strong blur */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9998]"
        onClick={handleDismiss}
        aria-hidden="true"
      />
      
      {/* Compact notification card */}
      <div 
        className="fixed bottom-4 right-4 left-4 sm:left-auto z-[9999] w-auto sm:w-80 bg-card border-2 border-primary/20 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-title"
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-full">
              <Download className="h-4 w-4 text-primary" />
            </div>
            <span id="update-title" className="font-semibold text-sm text-foreground">
              {language === 'bn' ? 'আপডেট পাওয়া গেছে!' : 'Update Available!'}
            </span>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleDismiss}
            disabled={isUpdating}
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
            aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            {language === 'bn' 
              ? 'নতুন ভার্সন পাওয়া গেছে। আপডেট করতে ক্লিক করুন।'
              : 'A new version is available. Click to update now.'
            }
          </p>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm" 
              onClick={handleDismiss}
              disabled={isUpdating}
              className="flex-1 h-10"
            >
              {language === 'bn' ? 'পরে' : 'Later'}
            </Button>
            
            <Button 
              size="sm" 
              onClick={handleUpdate}
              disabled={isUpdating || !isOnline}
              className="flex-1 h-10"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {language === 'bn' ? 'আপডেট' : 'Update'}
                </>
              )}
            </Button>
          </div>
          
          {!isOnline && (
            <p className="text-xs text-amber-600 mt-3 text-center bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md">
              {language === 'bn' 
                ? '⚠️ অফলাইন - অনলাইন হলে আপডেট করুন'
                : '⚠️ Offline - update when online'
              }
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default UpdateNotification;
