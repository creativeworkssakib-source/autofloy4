/**
 * Offline Sync Status Indicator
 * Shows sync status and pending changes count
 */

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useSyncStatus } from '@/hooks/useOfflineFirst';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SyncStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export function SyncStatusIndicator({ 
  className, 
  showLabel = true,
  compact = false 
}: SyncStatusIndicatorProps) {
  const { status, pendingCount, isOnline, isSyncing, forceSync } = useSyncStatus();
  const { language } = useLanguage();
  const [showPulse, setShowPulse] = useState(false);

  // Pulse animation when pending count changes
  useEffect(() => {
    if (pendingCount > 0) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [pendingCount]);

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: CloudOff,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        label: language === 'bn' ? 'অফলাইন' : 'Offline',
        description: language === 'bn' 
          ? `${pendingCount > 0 ? `${pendingCount}টি পরিবর্তন অপেক্ষায়` : 'ডাটা লোকালি সেভ হচ্ছে'}`
          : `${pendingCount > 0 ? `${pendingCount} changes pending` : 'Data saving locally'}`,
      };
    }

    if (isSyncing) {
      return {
        icon: Loader2,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        label: language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...',
        description: language === 'bn' ? 'ডাটা সার্ভারে আপলোড হচ্ছে' : 'Uploading data to server',
        animate: true,
      };
    }

    if (status === 'error') {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        label: language === 'bn' ? 'সিঙ্ক ত্রুটি' : 'Sync Error',
        description: language === 'bn' 
          ? 'কিছু ডাটা সিঙ্ক হয়নি। পরে চেষ্টা করুন।'
          : 'Some data failed to sync. Will retry.',
      };
    }

    if (pendingCount > 0) {
      return {
        icon: RefreshCw,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        label: language === 'bn' ? `${pendingCount}টি পেন্ডিং` : `${pendingCount} Pending`,
        description: language === 'bn' 
          ? 'সিঙ্ক করতে ক্লিক করুন'
          : 'Click to sync now',
      };
    }

    return {
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      label: language === 'bn' ? 'সিঙ্ক সম্পন্ন' : 'Synced',
      description: language === 'bn' ? 'সব ডাটা আপডেটেড' : 'All data up to date',
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'relative h-8 w-8',
                config.bgColor,
                config.color,
                className
              )}
              onClick={pendingCount > 0 && isOnline ? forceSync : undefined}
              disabled={isSyncing}
            >
              <Icon className={cn('h-4 w-4', config.animate && 'animate-spin')} />
              {pendingCount > 0 && !isSyncing && (
                <span className={cn(
                  'absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-[10px] text-white flex items-center justify-center font-medium',
                  showPulse && 'animate-pulse'
                )}>
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div 
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all',
        config.bgColor,
        config.borderColor,
        pendingCount > 0 && isOnline && !isSyncing && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={pendingCount > 0 && isOnline && !isSyncing ? forceSync : undefined}
    >
      <Icon className={cn('h-4 w-4', config.color, config.animate && 'animate-spin')} />
      {showLabel && (
        <span className={cn('text-sm font-medium', config.color)}>
          {config.label}
        </span>
      )}
      {pendingCount > 0 && !isSyncing && (
        <span className={cn(
          'h-5 min-w-5 px-1 rounded-full bg-amber-500 text-xs text-white flex items-center justify-center font-medium',
          showPulse && 'animate-pulse'
        )}>
          {pendingCount}
        </span>
      )}
    </div>
  );
}

// Floating indicator for mobile
export function FloatingSyncStatus({ className }: { className?: string }) {
  const { pendingCount, isOnline, isSyncing, forceSync } = useSyncStatus();
  const { language } = useLanguage();

  // Only show when offline or has pending changes
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div 
      className={cn(
        'fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all',
        !isOnline ? 'bg-amber-500' : isSyncing ? 'bg-blue-500' : 'bg-primary',
        className
      )}
      onClick={pendingCount > 0 && isOnline && !isSyncing ? forceSync : undefined}
    >
      {!isOnline ? (
        <>
          <CloudOff className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">
            {language === 'bn' ? 'অফলাইন মোড' : 'Offline Mode'}
          </span>
          {pendingCount > 0 && (
            <span className="h-5 min-w-5 px-1 rounded-full bg-white text-amber-500 text-xs flex items-center justify-center font-medium">
              {pendingCount}
            </span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 text-white animate-spin" />
          <span className="text-sm font-medium text-white">
            {language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...'}
          </span>
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">
            {language === 'bn' ? `${pendingCount}টি সিঙ্ক করুন` : `Sync ${pendingCount}`}
          </span>
        </>
      )}
    </div>
  );
}
