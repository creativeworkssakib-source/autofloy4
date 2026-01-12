/**
 * Sync Progress Indicator
 * 
 * Shows real-time sync progress with animated visual feedback.
 * Uses the new SyncContext (offlineSyncOrchestrator) for consistent sync status.
 */

import { Cloud, CloudOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useSyncContext } from '@/contexts/SyncContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface SyncProgressIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export function SyncProgressIndicator({ 
  className, 
  showLabel = true 
}: SyncProgressIndicatorProps) {
  const { syncStatus } = useSyncContext();
  const { t } = useLanguage();
  
  const { isSyncing, syncProgress, lastError, pendingChanges, isOnline } = syncStatus;
  
  // All synced - green checkmark
  if (!isSyncing && pendingChanges === 0 && !lastError) {
    return (
      <div className={cn('flex items-center gap-2 text-green-500', className)}>
        <CheckCircle2 className="h-4 w-4" />
        {showLabel && (
          <span className="text-sm">
            {t('offline.allSynced')}
          </span>
        )}
      </div>
    );
  }
  
  // Error state
  if (lastError) {
    return (
      <div className={cn('flex items-center gap-2 text-destructive', className)}>
        <AlertCircle className="h-4 w-4" />
        {showLabel && (
          <span className="text-sm">
            {t('offline.syncFailed')}
          </span>
        )}
      </div>
    );
  }
  
  // Actively syncing
  if (isSyncing) {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {showLabel && (
            <span className="text-sm text-muted-foreground">
              {t('offline.syncing')}... {syncProgress}%
            </span>
          )}
        </div>
        <Progress value={syncProgress} className="h-1" />
      </div>
    );
  }
  
  // Has pending items but not syncing - only show if offline
  if (!isOnline && pendingChanges > 0) {
    return (
      <div className={cn('flex items-center gap-2 text-yellow-500', className)}>
        <CloudOff className="h-4 w-4" />
        {showLabel && (
          <span className="text-sm">
            {pendingChanges} {t('offline.pending')}
          </span>
        )}
      </div>
    );
  }
  
  // Online with pending changes - will sync soon
  if (isOnline && pendingChanges > 0) {
    return (
      <div className={cn('flex items-center gap-2 text-blue-500', className)}>
        <Cloud className="h-4 w-4" />
        {showLabel && (
          <span className="text-sm">
            {pendingChanges} {t('offline.pending')}
          </span>
        )}
      </div>
    );
  }
  
  // Online and synced (default state)
  return (
    <div className={cn('flex items-center gap-2 text-green-500', className)}>
      <CheckCircle2 className="h-4 w-4" />
      {showLabel && (
        <span className="text-sm">
          {t('offline.allSynced')}
        </span>
      )}
    </div>
  );
}

/**
 * Floating sync indicator for corner of screen
 * COMPLETELY INVISIBLE during normal operation
 * Only shows if there's a persistent error (retry count > 2)
 * User should never see sync happening - it's all background magic
 */
export function FloatingSyncIndicator() {
  const { syncStatus } = useSyncContext();
  
  // Only show if there's a persistent sync error
  // Normal syncing, pending items = completely invisible to user
  // User doesn't need to know about sync - it just works
  if (!syncStatus.lastError) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg shadow-lg p-2 px-3 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-xs font-medium text-destructive">
          Sync error - check connection
        </span>
      </div>
    </div>
  );
}
