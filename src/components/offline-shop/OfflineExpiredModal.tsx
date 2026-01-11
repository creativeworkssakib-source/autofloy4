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
import { syncManager } from '@/services/syncManager';
import { cn } from '@/lib/utils';

interface OfflineExpiredModalProps {
  onDismiss?: () => void;
}

export function OfflineExpiredModal({ onDismiss }: OfflineExpiredModalProps) {
  const { isOnline, refreshStatus, getTimeSinceOnline } = useOnlineStatus();
  const { isExpired, totalDays } = useOfflineGracePeriod();
  const { t, language } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const isOpen = isExpired && !isOnline;
  
  const handleCheckConnection = async () => {
    setIsChecking(true);
    refreshStatus();
    
    // Wait a bit to see if we're online
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (navigator.onLine) {
      // We're online! Start sync
      setIsSyncing(true);
      try {
        await syncManager.sync();
        onDismiss?.();
      } catch (error) {
        console.error('Sync failed:', error);
      } finally {
        setIsSyncing(false);
      }
    }
    
    setIsChecking(false);
  };
  
  const timeSinceOnline = getTimeSinceOnline(language);
  
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
            <WifiOff className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-xl">
            {language === 'bn' ? 'অফলাইন সময়সীমা শেষ' : 'Offline Period Expired'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {language === 'bn' 
              ? `আপনি ${totalDays} দিনের বেশি সময় ধরে অফলাইন আছেন। কিছু ফিচার সীমাবদ্ধ করা হয়েছে।`
              : `You've been offline for more than ${totalDays} days. Some features have been restricted.`
            }
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
                    {language === 'bn' ? 'শেষ অনলাইন' : 'Last Online'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeSinceOnline || (language === 'bn' ? 'অজানা' : 'Unknown')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Restricted Features */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              {language === 'bn' ? 'সীমাবদ্ধ ফিচার:' : 'Restricted Features:'}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• {language === 'bn' ? 'রিপোর্ট দেখা' : 'View Reports'}</li>
              <li>• {language === 'bn' ? 'নতুন ক্রয়' : 'New Purchases'}</li>
              <li>• {language === 'bn' ? 'লোন ম্যানেজমেন্ট' : 'Loan Management'}</li>
              <li>• {language === 'bn' ? 'স্টাফ ম্যানেজমেন্ট' : 'Staff Management'}</li>
            </ul>
          </div>
          
          {/* Available Features */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              {language === 'bn' ? 'ব্যবহারযোগ্য ফিচার:' : 'Available Features:'}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• {language === 'bn' ? 'পণ্য দেখুন' : 'View Products'}</li>
              <li>• {language === 'bn' ? 'বিক্রয় করুন' : 'Make Sales'}</li>
              <li>• {language === 'bn' ? 'কাস্টমার তালিকা' : 'Customer List'}</li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleCheckConnection}
            disabled={isChecking || isSyncing}
            className="w-full"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', (isChecking || isSyncing) && 'animate-spin')} />
            {isChecking 
              ? (language === 'bn' ? 'চেক করা হচ্ছে...' : 'Checking...')
              : isSyncing
                ? (language === 'bn' ? 'সিংক হচ্ছে...' : 'Syncing...')
                : (language === 'bn' ? 'কানেকশন চেক করুন' : 'Check Connection')
            }
          </Button>
          
          <Button
            variant="outline"
            onClick={onDismiss}
            className="w-full"
          >
            {language === 'bn' ? 'সীমিত মোডে চালিয়ে যান' : 'Continue in Limited Mode'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
