/**
 * Offline Sync Status Indicator
 * Shows users their sync status and pending changes
 */

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { offlineFirstService } from '@/services/offlineFirstService';
import { cn } from '@/lib/utils';

export function OfflineSyncIndicator() {
  const { language } = useLanguage();
  const [status, setStatus] = useState(offlineFirstService.getSyncStatus());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineFirstService.subscribeSyncStatus((newStatus) => {
      setStatus(newStatus);
      setIsSyncing(newStatus.status === 'syncing');
    });
    return unsubscribe;
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await offlineFirstService.forceSyncNow();
    } finally {
      setIsSyncing(false);
    }
  };

  const isOnline = status.isOnline;
  const pendingCount = status.pendingCount;

  // Don't show if online with no pending changes
  if (isOnline && pendingCount === 0 && status.status === 'idle') {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {/* Status Icon */}
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all",
              !isOnline ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : 
              pendingCount > 0 ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" :
              "bg-green-500/20 text-green-600 dark:text-green-400"
            )}>
              {!isOnline ? (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>{language === 'bn' ? 'অফলাইন' : 'Offline'}</span>
                </>
              ) : isSyncing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>{language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...'}</span>
                </>
              ) : pendingCount > 0 ? (
                <>
                  <Cloud className="h-3.5 w-3.5" />
                  <span>
                    {pendingCount} {language === 'bn' ? 'পেন্ডিং' : 'pending'}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{language === 'bn' ? 'সিঙ্ক হয়েছে' : 'Synced'}</span>
                </>
              )}
            </div>

            {/* Sync Button - only show if online with pending changes */}
            {isOnline && pendingCount > 0 && !isSyncing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleForceSync}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {!isOnline ? (
            <p>
              {language === 'bn' 
                ? 'আপনি অফলাইনে আছেন। সব পরিবর্তন লোকালি সেভ হচ্ছে এবং অনলাইন হলে সিঙ্ক হবে।'
                : 'You are offline. Changes are saved locally and will sync when online.'}
            </p>
          ) : pendingCount > 0 ? (
            <p>
              {language === 'bn'
                ? `${pendingCount}টি পরিবর্তন সার্ভারে আপলোড হওয়ার অপেক্ষায়।`
                : `${pendingCount} changes waiting to upload to server.`}
            </p>
          ) : (
            <p>
              {language === 'bn'
                ? 'সব ডেটা সার্ভারের সাথে সিঙ্ক হয়েছে।'
                : 'All data is synced with the server.'}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Floating indicator for pages
export function FloatingOfflineSyncIndicator() {
  const { language } = useLanguage();
  const [status, setStatus] = useState(offlineFirstService.getSyncStatus());

  useEffect(() => {
    const unsubscribe = offlineFirstService.subscribeSyncStatus(setStatus);
    return unsubscribe;
  }, []);

  const isOnline = status.isOnline;
  const pendingCount = status.pendingCount;

  // Only show when offline or has pending changes
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-20 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all",
      "backdrop-blur-sm border",
      !isOnline 
        ? "bg-amber-500/90 text-white border-amber-600" 
        : "bg-blue-500/90 text-white border-blue-600"
    )}>
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">
            {language === 'bn' ? 'অফলাইন মোড' : 'Offline Mode'}
          </span>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-white/20 text-white text-xs">
              {pendingCount}
            </Badge>
          )}
        </>
      ) : (
        <>
          <Cloud className="h-4 w-4" />
          <span className="text-sm font-medium">
            {pendingCount} {language === 'bn' ? 'সিঙ্ক হবে' : 'to sync'}
          </span>
        </>
      )}
    </div>
  );
}
