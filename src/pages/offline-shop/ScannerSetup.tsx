import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Scan, 
  Usb, 
  CheckCircle2, 
  XCircle, 
  Monitor,
  Zap,
  Settings,
  Volume2,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Loader2,
  Trash2,
  Power,
  Edit2,
  Save,
  Plug,
  Play,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { offlineShopService, ScannerDevice } from "@/services/offlineShopService";
import { useShop } from "@/contexts/ShopContext";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface ScanLog {
  id: string;
  barcode: string;
  product_name: string | null;
  is_matched: boolean;
  scan_speed: number | null;
  created_at: string;
}

const ScannerSetup = () => {
  const { language } = useLanguage();
  const { currentShop } = useShop();
  const [isTestMode, setIsTestMode] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scannerConnected, setScannerConnected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected' | 'waiting'>('waiting');
  const [testResults, setTestResults] = useState<{ code: string; product: string | null; time: Date }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [scanSpeed, setScanSpeed] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [savedDevices, setSavedDevices] = useState<ScannerDevice[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editingDeviceName, setEditingDeviceName] = useState("");
  
  const [scannerStats, setScannerStats] = useState({
    totalScans: 0,
    matchedScans: 0,
    unmatchedScans: 0,
    avgSpeed: 0,
    matchRate: 0,
  });
  const [recentLogs, setRecentLogs] = useState<ScanLog[]>([]);
  
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const scanTimesRef = useRef<number[]>([]);

  // Load products and devices
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, logsRes, devicesRes] = await Promise.all([
          offlineShopService.getProducts(),
          offlineShopService.getScannerLogs(),
          offlineShopService.getScannerDevices(),
        ]);
        
        setProducts(productsRes.products || []);
        setRecentLogs(logsRes.logs || []);
        setSavedDevices(devicesRes.devices || []);
        
        const activeDevice = devicesRes.devices?.find((d: ScannerDevice) => d.is_active);
        if (activeDevice) {
          setActiveDeviceId(activeDevice.id);
          setScannerConnected(true);
          setConnectionStatus('connected');
        }
      } catch (error) {
        console.error("Load data error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentShop?.id) {
      loadData();
    }
  }, [currentShop?.id]);

  // Register scanner device
  const registerScannerDevice = useCallback(async (deviceName: string) => {
    try {
      const result = await offlineShopService.saveScannerDevice({
        name: deviceName,
        device_name: deviceName,
        device_id: `scanner_${Date.now()}`,
        device_type: 'keyboard',
        is_active: true,
      });
      
      setSavedDevices(prev => {
        const existing = prev.find(d => d.id === result.device.id);
        if (existing) {
          return prev.map(d => d.id === result.device.id ? result.device : d);
        }
        return [result.device, ...prev];
      });
      
      setActiveDeviceId(result.device.id);
      setScannerConnected(true);
      setConnectionStatus('connected');
      
      toast.success(language === 'bn' ? '✓ স্ক্যানার সংযুক্ত' : '✓ Scanner connected');
      return result.device;
    } catch (error) {
      console.error("Failed to register scanner:", error);
      toast.error(language === 'bn' ? 'স্ক্যানার সংরক্ষণ ব্যর্থ' : 'Failed to save scanner');
      return null;
    }
  }, [language]);

  // Disconnect device
  const disconnectDevice = useCallback(async (deviceId: string) => {
    try {
      await offlineShopService.updateScannerDevice({ id: deviceId, is_active: false });
      setSavedDevices(prev => prev.map(d => 
        d.id === deviceId ? { ...d, is_active: false } : d
      ));
      
      if (activeDeviceId === deviceId) {
        setActiveDeviceId(null);
        setScannerConnected(false);
        setConnectionStatus('waiting');
      }
      
      toast.success(language === 'bn' ? 'স্ক্যানার বিচ্ছিন্ন' : 'Scanner disconnected');
    } catch (error) {
      toast.error(language === 'bn' ? 'বিচ্ছিন্ন করতে ব্যর্থ' : 'Failed to disconnect');
    }
  }, [activeDeviceId, language]);

  // Delete device
  const deleteDevice = useCallback(async (deviceId: string) => {
    try {
      await offlineShopService.deleteScannerDevice(deviceId);
      setSavedDevices(prev => prev.filter(d => d.id !== deviceId));
      
      if (activeDeviceId === deviceId) {
        setActiveDeviceId(null);
        setScannerConnected(false);
        setConnectionStatus('waiting');
      }
      
      toast.success(language === 'bn' ? 'স্ক্যানার মুছে ফেলা হয়েছে' : 'Scanner deleted');
    } catch (error) {
      toast.error(language === 'bn' ? 'মুছতে ব্যর্থ' : 'Failed to delete');
    }
  }, [activeDeviceId, language]);

  // Rename device
  const saveDeviceName = useCallback(async () => {
    if (!editingDeviceId || !editingDeviceName.trim()) return;
    
    try {
      await offlineShopService.updateScannerDevice({
        id: editingDeviceId,
        name: editingDeviceName.trim(),
        device_name: editingDeviceName.trim(),
      });
      
      setSavedDevices(prev => prev.map(d => 
        d.id === editingDeviceId 
          ? { ...d, name: editingDeviceName.trim(), device_name: editingDeviceName.trim() } 
          : d
      ));
      
      setEditingDeviceId(null);
      setEditingDeviceName("");
      toast.success(language === 'bn' ? 'নাম সংরক্ষিত' : 'Name saved');
    } catch (error) {
      toast.error(language === 'bn' ? 'সংরক্ষণ ব্যর্থ' : 'Failed to save');
    }
  }, [editingDeviceId, editingDeviceName, language]);

  // Reconnect a saved device
  const reconnectDevice = useCallback(async (device: ScannerDevice) => {
    try {
      await offlineShopService.updateScannerDevice({ id: device.id, is_active: true });
      
      setSavedDevices(prev => prev.map(d => 
        d.id === device.id 
          ? { ...d, is_active: true } 
          : { ...d, is_active: false }
      ));
      
      setActiveDeviceId(device.id);
      setScannerConnected(true);
      setConnectionStatus('connected');
      
      const displayName = device.device_name || device.name;
      toast.success(language === 'bn' ? `✓ ${displayName} সক্রিয়` : `✓ ${displayName} activated`);
    } catch (error) {
      toast.error(language === 'bn' ? 'সংযোগ ব্যর্থ' : 'Connection failed');
    }
  }, [language]);

  // Start scanner detection
  const startScannerDetection = useCallback(() => {
    setIsDetecting(true);
    setConnectionStatus('checking');
    setIsTestMode(true);
    
    toast.info(
      language === 'bn'
        ? '🔍 স্ক্যানার সনাক্তকরণ চালু! এখন স্ক্যান করুন...'
        : '🔍 Scanner detection active! Scan now...',
      { duration: 10000 }
    );
    
    setTimeout(() => {
      if (!scannerConnected) {
        setIsDetecting(false);
        setConnectionStatus('waiting');
        toast.warning(
          language === 'bn'
            ? 'কোনো স্ক্যানার সনাক্ত হয়নি।'
            : 'No scanner detected.'
        );
      }
    }, 30000);
  }, [language, scannerConnected]);

  // USB Scanner listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      
      if (timeDiff > 100) {
        barcodeBufferRef.current = "";
        scanTimesRef.current = [];
      }
      
      if (e.key === 'Enter' && barcodeBufferRef.current.length >= 4) {
        const scannedCode = barcodeBufferRef.current;
        const totalTime = currentTime - (scanTimesRef.current[0] || currentTime);
        const speed = totalTime > 0 ? (scannedCode.length / (totalTime / 1000)) : 0;
        
        setScanSpeed(speed);
        setLastScannedCode(scannedCode);
        
        // Find product
        const product = products.find(p => 
          p.barcode === scannedCode || 
          p.sku === scannedCode
        );
        
        // Auto-detect scanner on first fast scan
        if (speed >= 25 && !scannerConnected && isDetecting) {
          const deviceName = language === 'bn' 
            ? `USB স্ক্যানার (${Math.round(speed)} c/s)` 
            : `USB Scanner (${Math.round(speed)} c/s)`;
          registerScannerDevice(deviceName);
          setIsDetecting(false);
        }
        
        // Update stats
        setScannerStats(prev => ({
          ...prev,
          totalScans: prev.totalScans + 1,
          matchedScans: product ? prev.matchedScans + 1 : prev.matchedScans,
          unmatchedScans: product ? prev.unmatchedScans : prev.unmatchedScans + 1,
          avgSpeed: Math.round((prev.avgSpeed * prev.totalScans + speed) / (prev.totalScans + 1)),
          matchRate: Math.round(((product ? prev.matchedScans + 1 : prev.matchedScans) / (prev.totalScans + 1)) * 100),
        }));
        
        // Add to test results in test mode
        if (isTestMode) {
          setTestResults(prev => [{
            code: scannedCode,
            product: product?.name || null,
            time: new Date(),
          }, ...prev.slice(0, 9)]);
          
          if (product) {
            toast.success(
              language === 'bn' 
                ? `✓ পাওয়া গেছে: ${product.name}`
                : `✓ Found: ${product.name}`
            );
          } else {
            toast.warning(
              language === 'bn'
                ? `✗ পাওয়া যায়নি: ${scannedCode}`
                : `✗ Not found: ${scannedCode}`
            );
          }
        }
        
        barcodeBufferRef.current = "";
        scanTimesRef.current = [];
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
        scanTimesRef.current.push(currentTime);
      }
      
      lastKeyTimeRef.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, isTestMode, language, scannerConnected, isDetecting, registerScannerDevice]);

  const clearLogs = async () => {
    setRecentLogs([]);
    setScannerStats({
      totalScans: 0,
      matchedScans: 0,
      unmatchedScans: 0,
      avgSpeed: 0,
      matchRate: 0,
    });
    toast.success(language === 'bn' ? 'লগ মুছে ফেলা হয়েছে' : 'Logs cleared');
  };

  if (isLoading) {
    return (
      <ShopLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Scan className="h-6 w-6" />
              {language === 'bn' ? 'বারকোড স্ক্যানার সেটআপ' : 'Barcode Scanner Setup'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'bn' 
                ? 'আপনার USB বারকোড স্ক্যানার কনফিগার করুন' 
                : 'Configure your USB barcode scanner'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={scannerConnected ? "default" : "secondary"}
              className={cn(
                "gap-1",
                scannerConnected ? "bg-green-600" : ""
              )}
            >
              {scannerConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  {language === 'bn' ? 'সংযুক্ত' : 'Connected'}
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  {language === 'bn' ? 'সংযুক্ত নয়' : 'Not Connected'}
                </>
              )}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Scanner Detection Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Usb className="h-5 w-5" />
                {language === 'bn' ? 'স্ক্যানার সনাক্তকরণ' : 'Scanner Detection'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' 
                  ? 'আপনার USB স্ক্যানার স্বয়ংক্রিয়ভাবে সনাক্ত করুন'
                  : 'Automatically detect your USB scanner'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!scannerConnected ? (
                <div className="text-center py-6">
                  <Monitor className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    {language === 'bn' 
                      ? 'কোনো স্ক্যানার সংযুক্ত নেই'
                      : 'No scanner connected'}
                  </p>
                  <Button 
                    onClick={startScannerDetection}
                    disabled={isDetecting}
                    className="gap-2"
                  >
                    {isDetecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {language === 'bn' ? 'সনাক্ত করা হচ্ছে...' : 'Detecting...'}
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        {language === 'bn' ? 'সনাক্তকরণ শুরু করুন' : 'Start Detection'}
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">
                      {language === 'bn' ? 'স্ক্যানার সক্রিয়' : 'Scanner Active'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'bn' 
                        ? 'আপনার স্ক্যানার ব্যবহারের জন্য প্রস্তুত'
                        : 'Your scanner is ready to use'}
                    </p>
                  </div>
                </div>
              )}

              {/* Test Mode */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">
                    {language === 'bn' ? 'টেস্ট মোড' : 'Test Mode'}
                  </h4>
                  <Button
                    variant={isTestMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsTestMode(!isTestMode)}
                  >
                    {isTestMode 
                      ? (language === 'bn' ? 'বন্ধ করুন' : 'Stop')
                      : (language === 'bn' ? 'শুরু করুন' : 'Start')}
                  </Button>
                </div>
                
                {isTestMode && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        {language === 'bn' ? 'সর্বশেষ স্ক্যান:' : 'Last Scan:'}
                      </p>
                      <p className="font-mono text-lg font-bold">
                        {lastScannedCode || '-'}
                      </p>
                      {scanSpeed > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {Math.round(scanSpeed)} {language === 'bn' ? 'অক্ষর/সেকেন্ড' : 'chars/sec'}
                        </p>
                      )}
                    </div>
                    
                    {testResults.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {testResults.map((result, i) => (
                          <div 
                            key={i}
                            className={cn(
                              "p-2 rounded flex items-center justify-between text-sm",
                              result.product 
                                ? "bg-green-500/10 border border-green-500/30" 
                                : "bg-red-500/10 border border-red-500/30"
                            )}
                          >
                            <span className="font-mono">{result.code}</span>
                            <span className={result.product ? "text-green-600" : "text-red-600"}>
                              {result.product || (language === 'bn' ? 'পাওয়া যায়নি' : 'Not found')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Saved Devices Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {language === 'bn' ? 'সংরক্ষিত স্ক্যানার' : 'Saved Scanners'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' 
                  ? 'আপনার সংযুক্ত স্ক্যানার ডিভাইসগুলি পরিচালনা করুন'
                  : 'Manage your connected scanner devices'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedDevices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>{language === 'bn' ? 'কোনো স্ক্যানার সংরক্ষিত নেই' : 'No scanners saved'}</p>
                  <p className="text-sm mt-1">
                    {language === 'bn' 
                      ? 'স্ক্যান করলে স্বয়ংক্রিয়ভাবে সংরক্ষণ হবে'
                      : 'Scanners will be saved automatically when detected'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedDevices.map((device) => {
                    const displayName = device.device_name || device.name;
                    return (
                      <div 
                        key={device.id}
                        className={cn(
                          "p-3 rounded-lg border flex items-center justify-between",
                          device.is_active && device.id === activeDeviceId
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Usb className={cn(
                            "h-5 w-5",
                            device.is_active && device.id === activeDeviceId
                              ? "text-green-600"
                              : "text-muted-foreground"
                          )} />
                          <div>
                            {editingDeviceId === device.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingDeviceName}
                                  onChange={(e) => setEditingDeviceName(e.target.value)}
                                  className="h-7 w-40"
                                  autoFocus
                                />
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveDeviceName}>
                                  <Save className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <p className="font-medium text-sm">{displayName}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant={device.is_active && device.id === activeDeviceId ? "default" : "secondary"}
                            className={cn(
                              "text-xs",
                              device.is_active && device.id === activeDeviceId && "bg-green-600"
                            )}
                          >
                            {device.is_active && device.id === activeDeviceId
                              ? (language === 'bn' ? 'সক্রিয়' : 'Active')
                              : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}
                          </Badge>
                          
                          {!(device.is_active && device.id === activeDeviceId) && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-7 px-2 text-xs text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => reconnectDevice(device)}
                            >
                              <Plug className="h-3 w-3 mr-1" />
                              {language === 'bn' ? 'সংযুক্ত' : 'Connect'}
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setEditingDeviceId(device.id);
                              setEditingDeviceName(displayName);
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          
                          {device.is_active && device.id === activeDeviceId ? (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0 text-orange-600"
                              onClick={() => disconnectDevice(device.id)}
                            >
                              <Power className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0 text-red-600"
                              onClick={() => deleteDevice(device.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {language === 'bn' ? 'স্ক্যান পরিসংখ্যান' : 'Scan Statistics'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' ? 'আজকের স্ক্যান কার্যকলাপ' : "Today's scan activity"}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === 'bn' ? 'রিসেট' : 'Reset'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{scannerStats.totalScans}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মোট স্ক্যান' : 'Total Scans'}
                </p>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{scannerStats.matchedScans}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মিলেছে' : 'Matched'}
                </p>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{scannerStats.unmatchedScans}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মিলেনি' : 'Unmatched'}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{scannerStats.avgSpeed}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'গড় গতি (c/s)' : 'Avg Speed (c/s)'}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{scannerStats.matchRate}%</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'মিল হার' : 'Match Rate'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {language === 'bn' ? 'সেটআপ নির্দেশাবলী' : 'Setup Instructions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
              <li>
                {language === 'bn' 
                  ? 'আপনার USB বারকোড স্ক্যানার কম্পিউটারে প্লাগ ইন করুন'
                  : 'Plug your USB barcode scanner into your computer'}
              </li>
              <li>
                {language === 'bn' 
                  ? '"সনাক্তকরণ শুরু করুন" বাটনে ক্লিক করুন'
                  : 'Click "Start Detection" button'}
              </li>
              <li>
                {language === 'bn' 
                  ? 'যেকোনো বারকোড স্ক্যান করুন - স্ক্যানার স্বয়ংক্রিয়ভাবে সনাক্ত হবে'
                  : 'Scan any barcode - the scanner will be detected automatically'}
              </li>
              <li>
                {language === 'bn' 
                  ? 'টেস্ট মোডে স্ক্যান করে পণ্য খোঁজা পরীক্ষা করুন'
                  : 'Test product lookup by scanning in test mode'}
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </ShopLayout>
  );
};

export default ScannerSetup;
