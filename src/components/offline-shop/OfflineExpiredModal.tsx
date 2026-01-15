/**
 * Offline Expired Modal
 * 
 * Shows when user has been offline for more than 7 days.
 * Restricts access to premium features until they come online.
 */

import { useState } from 'react';
import { WifiOff, AlertTriangle, RefreshCw, Calendar, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useOfflineGracePeriod } from '@/hooks/useOfflineShopTrial';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface OfflineExpiredModalProps {
  open?: boolean;
  onDismiss?: () => void;
}

export function OfflineExpiredModal({ open, onDismiss }: OfflineExpiredModalProps) {
  const { isOnline, refreshStatus, getTimeSinceOnline } = useOnlineStatus();
  const { isExpired, totalDays } = useOfflineGracePeriod();
  const { t, language } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);
  
  // Use prop if provided, otherwise use internal logic
  const isOpen = open !== undefined ? open : (isExpired && !isOnline);
  
  const handleCheckConnection = async () => {
    setIsChecking(true);
    refreshStatus();
    
    // Wait a bit to see if we're online
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (navigator.onLine) {
      // We're online! Dismiss modal
      onDismiss?.();
    }
    
    setIsChecking(false);
  };
  
  const timeSinceOnline = getTimeSinceOnline ? getTimeSinceOnline() : null;
  
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
            <WifiOff className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-xl">
            {t('offline.periodExpired')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('offline.periodExpiredDesc').replace('{days}', String(totalDays))}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Status Card */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {t('offline.lastOnline')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeSinceOnline || t('offline.unknown')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Restricted Features */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              {t('offline.restrictedFeatures')}:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• {t('offline.viewReports')}</li>
              <li>• {t('offline.newPurchases')}</li>
              <li>• {t('offline.loanManagement')}</li>
              <li>• {t('offline.staffManagement')}</li>
            </ul>
          </div>
          
          {/* Available Features */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              {t('offline.availableFeatures')}:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• {t('offline.viewProducts')}</li>
              <li>• {t('offline.makeSales')}</li>
              <li>• {t('offline.customerList')}</li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleCheckConnection}
            disabled={isChecking}
            className="w-full"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isChecking && 'animate-spin')} />
            {isChecking 
              ? t('offline.checking')
              : t('offline.checkConnection')
            }
          </Button>
          
          <Button
            variant="outline"
            onClick={onDismiss}
            className="w-full"
          >
            {t('offline.continueInLimitedMode')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
