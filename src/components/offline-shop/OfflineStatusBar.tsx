/**
 * Offline Status Bar Component
 * 
 * Shows current online/offline status, sync status, and pending changes.
 */

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  const { isOnline, getTimeSinceOnline } = useOnlineStatus();
  const { isSyncing, progress, lastSyncAt, lastError, triggerSync } = useSyncStatus();
  const pendingCount = usePendingSyncCount();
  const { daysRemaining, isExpired } = useOfflineGracePeriod();
  const { t, language } = useLanguage();
  
  const [showDetails, setShowDetails] = useState(false);
  
  const timeSinceOnline = getTimeSinceOnline(language);
  
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
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-2', className)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn('p-1.5 rounded-full', bgColor)}>
                {isOnline ? (
                  <Wifi className={cn('h-4 w-4', statusColor)} />
                ) : (
                  <WifiOff className={cn('h-4 w-4', statusColor)} />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isOnline 
                  ? t('offline.online') 
                  : `${t('offline.offlineMode')} - ${daysRemaining} ${t('offline.daysRemaining')}`
                }
              </p>
            </TooltipContent>
          </Tooltip>
          
          {pendingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1">
                  <Cloud className="h-3 w-3" />
                  {pendingCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{pendingCount} {t('offline.syncPending')}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {isSyncing && (
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
          )}
        </div>
      </TooltipProvider>
    );
  }
  
  return (
    <div className={cn('rounded-lg border p-3', bgColor, className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Online/Offline Status */}
          <div className={cn('p-2 rounded-full', isOnline ? 'bg-green-500/20' : 'bg-yellow-500/20')}>
            {isOnline ? (
              <Wifi className={cn('h-5 w-5', statusColor)} />
            ) : (
              <WifiOff className={cn('h-5 w-5', statusColor)} />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('font-medium', statusColor)}>
                {isOnline ? t('offline.online') : t('offline.offlineMode')}
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
          {/* Pending Changes */}
          {pendingCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <CloudOff className="h-3 w-3" />
              {pendingCount} {t('offline.pendingChanges')}
            </Badge>
          )}
          
          {/* Sync Button */}
          {isOnline && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerSync()}
              disabled={isSyncing || pendingCount === 0}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
              {isSyncing ? t('offline.syncing') : t('offline.syncNow')}
            </Button>
          )}
        </div>
      </div>
      
      {/* Sync Progress */}
      {isSyncing && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{t('offline.syncing')}...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}
      
      {/* Last Sync Info */}
      {lastSyncAt && !isSyncing && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          {t('offline.lastSynced')}: {lastSyncAt.toLocaleTimeString()}
        </div>
      )}
      
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
