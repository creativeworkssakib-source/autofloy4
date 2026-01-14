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
    
    try {
      toast.info(
        language === 'bn' 
          ? 'আপডেট হচ্ছে...' 
          : 'Updating...'
      );
      
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

  // Don't show if no update needed or already dismissed
  if (!needRefresh || dismissed) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={handleDismiss}
      />
      
      {/* Compact notification card */}
      <div className="fixed bottom-4 right-4 z-50 w-72 bg-card border border-border rounded-lg shadow-xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">
              {language === 'bn' ? 'আপডেট পাওয়া গেছে!' : 'Update Available!'}
            </span>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleDismiss}
            disabled={isUpdating}
            className="h-6 w-6"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-3">
          <p className="text-xs text-muted-foreground mb-3">
            {language === 'bn' 
              ? 'নতুন ভার্সন পাওয়া গেছে। আপডেট করতে ক্লিক করুন।'
              : 'A new version is available. Click to update.'
            }
          </p>
          
          <Button 
            size="sm" 
            onClick={handleUpdate}
            disabled={isUpdating || !isOnline}
            className="w-full h-8 text-xs"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                {language === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...'}
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {language === 'bn' ? 'এখনই আপডেট করুন' : 'Update Now'}
              </>
            )}
          </Button>
          
          {!isOnline && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              {language === 'bn' 
                ? 'অফলাইন - অনলাইন হলে আপডেট করুন'
                : 'Offline - update when online'
              }
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default UpdateNotification;
