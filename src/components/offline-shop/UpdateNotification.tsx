/**
 * PWA Update Notification Component
 * 
 * Shows a compact notification when app updates are available.
 * Works with vite-plugin-pwa.
 */

import { useState, useEffect } from 'react';
import { RefreshCw, X, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAStatus } from '@/hooks/usePWAStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export const UpdateNotification = () => {
  const { language } = useLanguage();
  const { needRefresh, isOnline, update, dismissUpdate } = usePWAStatus();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Show notification when update is available
  useEffect(() => {
    if (needRefresh && !dismissed) {
      setShowNotification(true);
    }
  }, [needRefresh, dismissed]);

  const handleUpdate = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    toast.info(
      language === 'bn' 
        ? 'আপডেট হচ্ছে, পেজ রিলোড হবে...' 
        : 'Updating, page will reload...',
      { duration: 2000 }
    );
    
    // Small delay for toast to show
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      await update();
    } catch (error) {
      console.error('Update failed:', error);
    }
    
    // Force reload after 1 second as fallback
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDismissed(true);
    setShowNotification(false);
    dismissUpdate();
  };

  // Don't render if no update or dismissed
  if (!showNotification) return null;

  return (
    <>
      {/* Backdrop with strong blur - higher z-index */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-lg z-[99998] transition-opacity duration-300"
        onClick={handleDismiss}
        aria-hidden="true"
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      />
      
      {/* Centered modal-style notification */}
      <div 
        className="fixed inset-0 flex items-center justify-center z-[99999] p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-title"
      >
        <div 
          className="w-full max-w-sm bg-card border-2 border-primary/30 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/20 rounded-full animate-pulse">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 id="update-title" className="font-bold text-base text-foreground">
                  {language === 'bn' ? 'নতুন আপডেট!' : 'New Update!'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {language === 'bn' ? 'উন্নত ফিচার পাওয়া গেছে' : 'Improved features available'}
                </p>
              </div>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleDismiss}
              disabled={isUpdating}
              className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="p-5">
            <p className="text-sm text-muted-foreground mb-5 text-center">
              {language === 'bn' 
                ? 'অ্যাপের নতুন ভার্সন পাওয়া গেছে। আপডেট করলে নতুন ফিচার ও বাগ ফিক্স পাবেন।'
                : 'A new version of the app is available with new features and bug fixes.'
              }
            </p>
            
            <div className="flex gap-3">
              <Button 
                variant="outline"
                size="lg" 
                onClick={handleDismiss}
                disabled={isUpdating}
                className="flex-1 h-12 text-sm font-medium"
              >
                {language === 'bn' ? 'পরে করব' : 'Later'}
              </Button>
              
              <Button 
                size="lg" 
                onClick={handleUpdate}
                disabled={isUpdating || !isOnline}
                className="flex-1 h-12 text-sm font-medium bg-primary hover:bg-primary/90"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {language === 'bn' ? 'হচ্ছে...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {language === 'bn' ? 'আপডেট করুন' : 'Update Now'}
                  </>
                )}
              </Button>
            </div>
            
            {!isOnline && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-400 text-center font-medium">
                  ⚠️ {language === 'bn' 
                    ? 'আপনি অফলাইনে আছেন। অনলাইন হলে আপডেট করতে পারবেন।'
                    : 'You are offline. Please connect to update.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdateNotification;
