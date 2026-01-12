import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSyncContext } from '@/contexts/SyncContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const translations = {
  en: {
    online: 'Online',
    offline: 'Offline',
    syncing: 'Syncing...',
    synced: 'Synced',
    pendingChanges: 'pending changes',
    lastSync: 'Last sync',
    syncNow: 'Sync Now',
    pushingData: 'Uploading changes...',
    pullingData: 'Downloading updates...',
    syncError: 'Sync error',
    clickToSync: 'Click to sync now',
    offlineMode: 'Working offline. Changes will sync when online.',
    neverSynced: 'Never synced',
  },
  bn: {
    online: 'অনলাইন',
    offline: 'অফলাইন',
    syncing: 'সিঙ্ক হচ্ছে...',
    synced: 'সিঙ্ক হয়েছে',
    pendingChanges: 'টি পেন্ডিং পরিবর্তন',
    lastSync: 'সর্বশেষ সিঙ্ক',
    syncNow: 'এখনই সিঙ্ক করুন',
    pushingData: 'পরিবর্তন আপলোড হচ্ছে...',
    pullingData: 'আপডেট ডাউনলোড হচ্ছে...',
    syncError: 'সিঙ্ক ত্রুটি',
    clickToSync: 'এখনই সিঙ্ক করতে ক্লিক করুন',
    offlineMode: 'অফলাইনে কাজ করছেন। অনলাইন হলে পরিবর্তন সিঙ্ক হবে।',
    neverSynced: 'কখনো সিঙ্ক হয়নি',
  },
};

interface SyncStatusIndicatorProps {
  compact?: boolean;
  showButton?: boolean;
  className?: string;
}

export function SyncStatusIndicator({ compact = false, showButton = true, className }: SyncStatusIndicatorProps) {
  const { syncStatus, forceSync, isOfflineCapable } = useSyncContext();
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [isForcing, setIsForcing] = useState(false);

  const handleForceSync = async () => {
    if (isForcing || syncStatus.isSyncing) return;
    setIsForcing(true);
    try {
      await forceSync();
    } finally {
      setIsForcing(false);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return t.neverSynced;
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return language === 'bn' ? 'এইমাত্র' : 'Just now';
    if (minutes < 60) return language === 'bn' ? `${minutes} মিনিট আগে` : `${minutes}m ago`;
    if (hours < 24) return language === 'bn' ? `${hours} ঘণ্টা আগে` : `${hours}h ago`;
    return date.toLocaleDateString();
  };

  // Don't render if not offline capable (browser mode)
  if (!isOfflineCapable) {
    return null;
  }

  // Compact mode for header/toolbar
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleForceSync}
            disabled={!syncStatus.isOnline || syncStatus.isSyncing}
            className={cn("h-8 px-2 gap-1.5", className)}
          >
            {syncStatus.isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : syncStatus.isOnline ? (
              <Cloud className="h-4 w-4 text-green-500" />
            ) : (
              <CloudOff className="h-4 w-4 text-amber-500" />
            )}
            
            {syncStatus.pendingChanges > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {syncStatus.pendingChanges}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium flex items-center gap-2">
              {syncStatus.isOnline ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  {t.online}
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  {t.offline}
                </>
              )}
            </div>
            
            {syncStatus.isSyncing && (
              <div className="text-sm text-muted-foreground">
                {syncStatus.syncDirection === 'push' ? t.pushingData : t.pullingData}
              </div>
            )}
            
            {syncStatus.pendingChanges > 0 && (
              <div className="text-sm text-muted-foreground">
                {syncStatus.pendingChanges} {t.pendingChanges}
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              {t.lastSync}: {formatLastSync(syncStatus.lastSyncAt)}
            </div>
            
            {!syncStatus.isOnline && (
              <div className="text-xs text-amber-600">
                {t.offlineMode}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Full mode for dashboard or settings
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg border bg-card", className)}>
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {syncStatus.isSyncing ? (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : syncStatus.lastError ? (
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
        ) : syncStatus.isOnline ? (
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <Cloud className="h-5 w-5 text-green-500" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
            <CloudOff className="h-5 w-5 text-amber-500" />
          </div>
        )}
      </div>

      {/* Status Text */}
      <div className="flex-1 min-w-0">
        <div className="font-medium flex items-center gap-2">
          {syncStatus.isSyncing ? (
            t.syncing
          ) : syncStatus.lastError ? (
            <span className="text-destructive">{t.syncError}</span>
          ) : syncStatus.isOnline ? (
            <span className="text-green-600">{t.online}</span>
          ) : (
            <span className="text-amber-600">{t.offline}</span>
          )}
          
          {syncStatus.pendingChanges > 0 && (
            <Badge variant="outline" className="text-xs">
              {syncStatus.pendingChanges} {t.pendingChanges}
            </Badge>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground truncate">
          {syncStatus.isSyncing ? (
            <>
              {syncStatus.syncDirection === 'push' ? t.pushingData : t.pullingData}
              {syncStatus.syncProgress > 0 && ` (${syncStatus.syncProgress}%)`}
            </>
          ) : (
            <>
              {t.lastSync}: {formatLastSync(syncStatus.lastSyncAt)}
            </>
          )}
        </div>
        
        {syncStatus.lastError && (
          <div className="text-xs text-destructive mt-0.5 truncate">
            {syncStatus.lastError}
          </div>
        )}
      </div>

      {/* Sync Button */}
      {showButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleForceSync}
          disabled={!syncStatus.isOnline || syncStatus.isSyncing || isForcing}
          className="flex-shrink-0"
        >
          {syncStatus.isSyncing || isForcing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-1.5 hidden sm:inline">{t.syncNow}</span>
        </Button>
      )}
    </div>
  );
}

export default SyncStatusIndicator;
