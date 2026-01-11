/**
 * Sync Progress Indicator
 * 
 * Shows real-time sync progress with animated visual feedback.
 */

import { Cloud, CloudOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useSyncStatus } from '@/hooks/useOfflineData';
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
  const { isSyncing, progress, lastError, pendingCount } = useSyncStatus();
  const { t, language } = useLanguage();
  
  if (!isSyncing && pendingCount === 0 && !lastError) {
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
  
  if (isSyncing) {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {showLabel && (
            <span className="text-sm text-muted-foreground">
              {t('offline.syncing')}... {progress}%
            </span>
          )}
        </div>
        <Progress value={progress} className="h-1" />
      </div>
    );
  }
  
  // Has pending items but not syncing
  return (
    <div className={cn('flex items-center gap-2 text-yellow-500', className)}>
      <CloudOff className="h-4 w-4" />
      {showLabel && (
        <span className="text-sm">
          {pendingCount} {t('offline.pending')}
        </span>
      )}
    </div>
  );
}

/**
 * Floating sync indicator for corner of screen
 */
export function FloatingSyncIndicator() {
  const { isSyncing, progress, pendingCount } = useSyncStatus();
  
  if (!isSyncing && pendingCount === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border rounded-full shadow-lg p-3 flex items-center gap-2">
        {isSyncing ? (
          <>
            <div className="relative">
              <Cloud className="h-5 w-5 text-primary" />
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ fontSize: '8px' }}
              >
                <span className="font-bold text-primary">{progress}</span>
              </div>
            </div>
            <Progress value={progress} className="w-16 h-1.5" />
          </>
        ) : (
          <>
            <CloudOff className="h-5 w-5 text-yellow-500" />
            <span className="text-xs font-medium">{pendingCount}</span>
          </>
        )}
      </div>
    </div>
  );
}
