/**
 * Offline Status Bar Component
 * 
 * INVISIBLE when online and synced - user doesn't see anything!
 * Only shows when offline, or if there are persistent errors.
 * Syncing happens silently in background.
 */

import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncStatus, usePendingSyncCount } from '@/hooks/useOfflineData';
import { useOfflineGracePeriod } from '@/hooks/useOfflineShopTrial';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface OfflineStatusBarProps {
  className?: string;
  compact?: boolean;
}

export function OfflineStatusBar({ className, compact = false }: OfflineStatusBarProps) {
  const { isOnline } = useOnlineStatus();
  const { isSyncing, lastError, triggerSync } = useSyncStatus();
  const pendingCount = usePendingSyncCount();
  const { daysRemaining, isExpired } = useOfflineGracePeriod();
  const { t, language } = useLanguage();
  
  // INVISIBLE when online and no errors - user doesn't see anything
  // Only show if offline, or if there's an error, or if subscription expired
  const shouldShow = !isOnline || lastError || isExpired;
  
  if (!shouldShow && !compact) {
    return null;
  }
  
  // Status color
  const statusColor = isOnline
    ? 'text-green-500' 
    : isExpired 
      ? 'text-red-500' 
      : 'text-yellow-500';
  
  const bgColor = isOnline
    ? 'bg-green-500/10'
    : isExpired
      ? 'bg-red-500/10'
      : 'bg-yellow-500/10';
  
  if (compact) {
    // Compact mode: only show if offline or has errors
    if (isOnline && !lastError && pendingCount === 0) {
      return null;
    }
    
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-2', className)}>
          {!isOnline && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn('p-1.5 rounded-full', bgColor)}>
                  <WifiOff className={cn('h-4 w-4', statusColor)} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{`${t('offline.offlineMode')} - ${daysRemaining} ${t('offline.daysRemaining')}`}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {lastError && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Error
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{lastError}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }
  
  // Full bar: only shows when offline or has errors (not when online and synced)
  const { getTimeSinceOnline } = useOnlineStatus();
  const timeSinceOnline = getTimeSinceOnline(language);
  
  return (
    <div className={cn('rounded-lg border p-3', bgColor, className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Online/Offline Status */}
          <div className={cn('p-2 rounded-full', isOnline ? 'bg-green-500/20' : 'bg-yellow-500/20')}>
            <WifiOff className={cn('h-5 w-5', statusColor)} />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('font-medium', statusColor)}>
                {isOnline ? (lastError ? 'Sync Error' : t('offline.online')) : t('offline.offlineMode')}
              </span>
              
              {!isOnline && !isExpired && (
                <Badge variant="outline" className="text-xs">
                  {daysRemaining} {t('offline.daysRemaining')}
                </Badge>
              )}
              
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {t('offline.subscriptionExpired')}
                </Badge>
              )}
            </div>
            
            {!isOnline && timeSinceOnline && (
              <p className="text-xs text-muted-foreground">
                {t('offline.lastOnline')}: {timeSinceOnline}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Manual Sync Button - Only show if there are errors */}
          {isOnline && lastError && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerSync()}
              disabled={isSyncing}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
              {isSyncing ? t('offline.syncing') : t('offline.syncNow')}
            </Button>
          )}
        </div>
      </div>
      
      {/* Error */}
      {lastError && (
        <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3" />
          {lastError}
        </div>
      )}
    </div>
  );
}
