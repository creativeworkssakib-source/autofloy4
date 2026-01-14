/**
 * PWA Status Badge Component
 * 
 * Shows current PWA status (online/offline, sync status)
 */

import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePWAStatus } from '@/hooks/usePWAStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePendingSyncCount } from '@/hooks/useOfflineData';

interface PWAStatusBadgeProps {
  showPendingCount?: boolean;
  className?: string;
}

export function PWAStatusBadge({ 
  showPendingCount = true,
  className = '' 
}: PWAStatusBadgeProps) {
  const { language } = useLanguage();
  const { isOnline, isOfflineReady } = usePWAStatus();
  const pendingCount = usePendingSyncCount();

  // Online with pending sync
  if (isOnline && showPendingCount && pendingCount > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`border-amber-500 text-amber-500 ${className}`}>
              <Cloud className="h-3 w-3 mr-1" />
              {pendingCount} {language === 'bn' ? 'সিঙ্ক বাকি' : 'pending'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'bn' ? `${pendingCount}টি আইটেম সিঙ্ক হচ্ছে` : `${pendingCount} items syncing`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Online
  if (isOnline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`border-green-500 text-green-500 ${className}`}>
              <Wifi className="h-3 w-3 mr-1" />
              {language === 'bn' ? 'অনলাইন' : 'Online'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'bn' ? 'ইন্টারনেট সংযুক্ত' : 'Connected to internet'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Offline but ready
  if (isOfflineReady) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`border-amber-500 text-amber-500 ${className}`}>
              <CloudOff className="h-3 w-3 mr-1" />
              {language === 'bn' ? 'অফলাইন' : 'Offline'}
              {showPendingCount && pendingCount > 0 && ` (${pendingCount})`}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {language === 'bn' 
                ? 'অফলাইনে কাজ করছে। অনলাইন হলে সিঙ্ক হবে।' 
                : 'Working offline. Will sync when online.'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Offline and not ready
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className={className}>
            <WifiOff className="h-3 w-3 mr-1" />
            {language === 'bn' ? 'অফলাইন' : 'Offline'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {language === 'bn' 
              ? 'ইন্টারনেট নেই। কিছু ফিচার কাজ নাও করতে পারে।' 
              : 'No internet. Some features may not work.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default PWAStatusBadge;
