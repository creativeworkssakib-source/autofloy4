/**
 * Offline System Test Page
 * 
 * Comprehensive testing page for offline functionality.
 * Shows real-time status of all offline features.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Wifi, WifiOff, Database, RefreshCw, CheckCircle2, 
  XCircle, AlertCircle, HardDrive, Cloud, CloudOff,
  Package, Users, Truck, ShoppingCart, Banknote
} from 'lucide-react';
import ShopLayout from '@/components/offline-shop/ShopLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsOnline } from '@/hooks/useOnlineStatus';
import { useSyncStatus, useOfflineDataSize, usePendingSyncCount } from '@/hooks/useOfflineData';
import { useOfflineShopTrial, useOfflineGracePeriod, useOfflineExpired } from '@/hooks/useOfflineShopTrial';
import { offlineDataService } from '@/services/offlineDataService';
import { syncManager } from '@/services/syncManager';
import { offlineDB } from '@/lib/offlineDB';
import { syncQueue } from '@/lib/syncQueue';
import { formatBytes, getStorageEstimate } from '@/lib/offlineUtils';
import { toast } from 'sonner';

export default function OfflineTestPage() {
  const { t, language } = useLanguage();
  const isOnline = useIsOnline();
  const { isSyncing, pendingCount, lastSyncAt, lastError, progress, triggerSync, triggerFullSync } = useSyncStatus();
  const { dataSize, loading: dataSizeLoading } = useOfflineDataSize();
  const pendingSyncCount = usePendingSyncCount();
  const { isOfflineTrialActive, daysRemaining, isOfflineTrialExpired } = useOfflineShopTrial();
  const { daysRemaining: graceDaysRemaining, isExpired: isGraceExpired } = useOfflineGracePeriod();
  
  const [storageInfo, setStorageInfo] = useState<{ used: number; quota: number; percentUsed: number } | null>(null);
  const [dbStats, setDbStats] = useState<Record<string, number>>({});
  const [syncSummary, setSyncSummary] = useState<any>(null);
  const [isTestingOffline, setIsTestingOffline] = useState(false);

  // Load storage and database stats
  useEffect(() => {
    const loadStats = async () => {
      // Storage estimate
      const storage = await getStorageEstimate();
      if (storage) setStorageInfo(storage);
      
      // Database counts
      const shopId = offlineDataService.getShopId();
      if (shopId) {
        const [products, customers, suppliers, sales, expenses] = await Promise.all([
          offlineDB.getProducts(shopId),
          offlineDB.getCustomers(shopId),
          offlineDB.getSuppliers(shopId),
          offlineDB.getSales(shopId),
          offlineDB.getExpenses(shopId),
        ]);
        setDbStats({
          products: products.length,
          customers: customers.length,
          suppliers: suppliers.length,
          sales: sales.length,
          expenses: expenses.length,
        });
      }
      
      // Sync queue summary
      const summary = await syncQueue.getSummary();
      setSyncSummary(summary);
    };
    
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    const result = await triggerSync();
    if (result.success) {
      toast.success(language === 'bn' ? `${result.synced} আইটেম সিঙ্ক হয়েছে` : `${result.synced} items synced`);
    } else {
      toast.error(language === 'bn' ? 'সিঙ্ক ব্যর্থ হয়েছে' : 'Sync failed');
    }
  };

  const handleFullSync = async () => {
    const shopId = offlineDataService.getShopId();
    if (!shopId) {
      toast.error(language === 'bn' ? 'দোকান নির্বাচন করুন' : 'Please select a shop');
      return;
    }
    const result = await triggerFullSync(shopId);
    if (result.success) {
      toast.success(language === 'bn' ? 'সম্পূর্ণ সিঙ্ক সম্পন্ন' : 'Full sync completed');
    }
  };

  const testOfflineMode = async () => {
    setIsTestingOffline(true);
    toast.info(language === 'bn' ? 'অফলাইন মোড পরীক্ষা হচ্ছে...' : 'Testing offline mode...');
    
    try {
      // Create a test product
      const result = await offlineDataService.createProduct({
        name: `Test Product ${Date.now()}`,
        selling_price: 100,
        purchase_price: 80,
        stock_quantity: 10,
      });
      
      if (result.offline) {
        toast.success(language === 'bn' ? 'অফলাইন সেভ সফল!' : 'Offline save successful!');
      } else {
        toast.success(language === 'bn' ? 'সার্ভারে সেভ হয়েছে' : 'Saved to server');
      }
    } catch (error) {
      toast.error(language === 'bn' ? 'টেস্ট ব্যর্থ হয়েছে' : 'Test failed');
    } finally {
      setIsTestingOffline(false);
    }
  };

  const clearAllLocalData = async () => {
    if (!confirm(language === 'bn' ? 'সব লোকাল ডাটা মুছে ফেলতে চান?' : 'Clear all local data?')) return;
    
    try {
      await offlineDB.clearAllData();
      toast.success(language === 'bn' ? 'লোকাল ডাটা মুছে ফেলা হয়েছে' : 'Local data cleared');
      window.location.reload();
    } catch (error) {
      toast.error(language === 'bn' ? 'ডাটা মুছতে ব্যর্থ' : 'Failed to clear data');
    }
  };

  return (
    <ShopLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'bn' ? 'অফলাইন সিস্টেম টেস্ট' : 'Offline System Test'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'bn' ? 'অফলাইন ফিচারগুলো পরীক্ষা করুন' : 'Test all offline features'}
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isOnline ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
              {language === 'bn' ? 'কানেকশন স্ট্যাটাস' : 'Connection Status'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant={isOnline ? 'default' : 'destructive'} className="text-sm">
                {isOnline 
                  ? (language === 'bn' ? 'অনলাইন' : 'Online')
                  : (language === 'bn' ? 'অফলাইন' : 'Offline')
                }
              </Badge>
              {lastSyncAt && (
                <span className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'শেষ সিঙ্ক:' : 'Last sync:'} {new Date(lastSyncAt).toLocaleString()}
                </span>
              )}
            </div>
            
            {lastError && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{lastError}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              {language === 'bn' ? 'সিঙ্ক স্ট্যাটাস' : 'Sync Status'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{syncSummary?.failedCount || 0}</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'ব্যর্থ' : 'Failed'}
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{progress}%</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'প্রগ্রেস' : 'Progress'}
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold flex items-center justify-center">
                  {isSyncing ? (
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isSyncing 
                    ? (language === 'bn' ? 'সিঙ্কিং' : 'Syncing')
                    : (language === 'bn' ? 'আইডল' : 'Idle')
                  }
                </div>
              </div>
            </div>

            {isSyncing && <Progress value={progress} className="h-2" />}

            <div className="flex gap-2">
              <Button onClick={handleManualSync} disabled={isSyncing || !isOnline}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {language === 'bn' ? 'ম্যানুয়াল সিঙ্ক' : 'Manual Sync'}
              </Button>
              <Button variant="outline" onClick={handleFullSync} disabled={isSyncing || !isOnline}>
                <Cloud className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'সম্পূর্ণ সিঙ্ক' : 'Full Sync'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {language === 'bn' ? 'লোকাল ডাটাবেস' : 'Local Database'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-semibold">{dbStats.products || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'পণ্য' : 'Products'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-semibold">{dbStats.customers || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'গ্রাহক' : 'Customers'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Truck className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="font-semibold">{dbStats.suppliers || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'সরবরাহকারী' : 'Suppliers'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <ShoppingCart className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="font-semibold">{dbStats.sales || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'বিক্রয়' : 'Sales'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Banknote className="h-5 w-5 text-red-500" />
                <div>
                  <div className="font-semibold">{dbStats.expenses || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'খরচ' : 'Expenses'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              {language === 'bn' ? 'স্টোরেজ তথ্য' : 'Storage Info'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {storageInfo ? (
              <>
                <div className="flex justify-between text-sm">
                  <span>{language === 'bn' ? 'ব্যবহৃত:' : 'Used:'} {formatBytes(storageInfo.used)}</span>
                  <span>{language === 'bn' ? 'মোট:' : 'Total:'} {formatBytes(storageInfo.quota)}</span>
                </div>
                <Progress value={storageInfo.percentUsed} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {storageInfo.percentUsed.toFixed(1)}% {language === 'bn' ? 'ব্যবহৃত' : 'used'}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {language === 'bn' ? 'স্টোরেজ তথ্য লোড হচ্ছে...' : 'Loading storage info...'}
              </p>
            )}

            {!dataSizeLoading && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">
                  {language === 'bn' ? 'টেবিল সাইজ:' : 'Table sizes:'}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(dataSize.tables).map(([table, size]) => (
                    <div key={table} className="flex justify-between">
                      <span className="capitalize">{table}:</span>
                      <span>{formatBytes(size)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>{language === 'bn' ? 'মোট:' : 'Total:'}</span>
                  <span>{formatBytes(dataSize.total)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trial & Grace Period */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'bn' ? 'ট্রায়াল ও গ্রেস পিরিয়ড' : 'Trial & Grace Period'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">
                  {language === 'bn' ? 'ট্রায়াল অ্যাক্টিভ' : 'Trial Active'}
                </div>
                <Badge variant={isOfflineTrialActive ? 'default' : 'secondary'}>
                  {isOfflineTrialActive ? (language === 'bn' ? 'হ্যাঁ' : 'Yes') : (language === 'bn' ? 'না' : 'No')}
                </Badge>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">
                  {language === 'bn' ? 'ট্রায়াল বাকি' : 'Trial Days Left'}
                </div>
                <div className="font-semibold">{daysRemaining} {language === 'bn' ? 'দিন' : 'days'}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">
                  {language === 'bn' ? 'গ্রেস পিরিয়ড' : 'Grace Period Left'}
                </div>
                <div className="font-semibold">{graceDaysRemaining} {language === 'bn' ? 'দিন' : 'days'}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">
                  {language === 'bn' ? 'এক্সপায়ার্ড' : 'Expired'}
                </div>
                <Badge variant={isGraceExpired ? 'destructive' : 'secondary'}>
                  {isGraceExpired ? (language === 'bn' ? 'হ্যাঁ' : 'Yes') : (language === 'bn' ? 'না' : 'No')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'bn' ? 'টেস্ট অ্যাকশন' : 'Test Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={testOfflineMode} disabled={isTestingOffline}>
                {isTestingOffline ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                {language === 'bn' ? 'অফলাইন সেভ টেস্ট' : 'Test Offline Save'}
              </Button>
              <Button variant="destructive" onClick={clearAllLocalData}>
                <XCircle className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'লোকাল ডাটা মুছুন' : 'Clear Local Data'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ShopLayout>
  );
}
