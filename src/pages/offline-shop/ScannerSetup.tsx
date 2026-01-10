import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Scan, 
  Usb, 
  CheckCircle2, 
  XCircle, 
  Monitor,
  Zap,
  ShoppingCart,
  Settings,
  Volume2,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Loader2,
  Trash2,
  BarChart3,
  Power,
  Edit2,
  Save
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

interface ScannerStats {
  totalScans: number;
  matchedScans: number;
  unmatchedScans: number;
  avgSpeed: number;
  matchRate: number;
}

interface ScanLog {
  id: string;
  barcode: string;
  product_id: string | null;
  product_name: string | null;
  scan_type: string;
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
  
  // Real database-backed devices
  const [savedDevices, setSavedDevices] = useState<ScannerDevice[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editingDeviceName, setEditingDeviceName] = useState("");
  
  // Real data from database
  const [scannerStats, setScannerStats] = useState<ScannerStats>({
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

  // Load products, devices, and scanner stats
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, logsRes, devicesRes] = await Promise.all([
          offlineShopService.getProducts(),
          offlineShopService.getScannerLogs(10),
          offlineShopService.getScannerDevices(),
        ]);
        
        setProducts(productsRes.products || []);
        setScannerStats(logsRes.stats);
        setRecentLogs(logsRes.logs || []);
        setSavedDevices(devicesRes.devices || []);
        
        // Check if any device is active
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

  // Register or update scanner device in database
  const registerScannerDevice = useCallback(async (
    deviceName: string,
    deviceType: string = 'keyboard',
    vendorId?: string,
    productId?: string
  ) => {
    try {
      const result = await offlineShopService.registerScannerDevice({
        device_name: deviceName,
        device_type: deviceType,
        vendor_id: vendorId,
        product_id: productId,
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
      
      if (result.isNew) {
        toast.success(
          language === 'bn' 
            ? `✓ নতুন স্ক্যানার সংযুক্ত: ${deviceName}` 
            : `✓ New scanner connected: ${deviceName}`
        );
      } else {
        toast.success(
          language === 'bn' 
            ? `✓ স্ক্যানার পুনঃসংযুক্ত: ${deviceName}` 
            : `✓ Scanner reconnected: ${deviceName}`
        );
      }
      
      return result.device;
    } catch (error) {
      console.error("Failed to register scanner:", error);
      toast.error(language === 'bn' ? 'স্ক্যানার সংরক্ষণ ব্যর্থ' : 'Failed to save scanner');
      return null;
    }
  }, [language]);

  // Update device scan stats
  const updateDeviceStats = useCallback(async (deviceId: string, speed: number) => {
    try {
      const device = savedDevices.find(d => d.id === deviceId);
      if (!device) return;
      
      const newTotalScans = device.total_scans + 1;
      const newAvgSpeed = Math.round(
        ((device.avg_scan_speed * device.total_scans) + speed) / newTotalScans
      );
      
      await offlineShopService.updateScannerDevice(deviceId, {
        total_scans: newTotalScans,
        avg_scan_speed: newAvgSpeed,
        last_connected_at: new Date().toISOString(),
      });
      
      setSavedDevices(prev => prev.map(d => 
        d.id === deviceId 
          ? { ...d, total_scans: newTotalScans, avg_scan_speed: newAvgSpeed, last_connected_at: new Date().toISOString() } 
          : d
      ));
    } catch (error) {
      console.error("Failed to update device stats:", error);
    }
  }, [savedDevices]);

  // Disconnect device
  const disconnectDevice = useCallback(async (deviceId: string) => {
    try {
      await offlineShopService.disconnectScannerDevice(deviceId);
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
      await offlineShopService.updateScannerDevice(editingDeviceId, {
        device_name: editingDeviceName.trim(),
      });
      
      setSavedDevices(prev => prev.map(d => 
        d.id === editingDeviceId ? { ...d, device_name: editingDeviceName.trim() } : d
      ));
      
      setEditingDeviceId(null);
      setEditingDeviceName("");
      toast.success(language === 'bn' ? 'নাম সংরক্ষিত' : 'Name saved');
    } catch (error) {
      toast.error(language === 'bn' ? 'সংরক্ষণ ব্যর্থ' : 'Failed to save');
    }
  }, [editingDeviceId, editingDeviceName, language]);

  // Detect scanner from input pattern
  const detectScannerFromInput = useCallback(async (scannedCode: string, inputSpeed: number) => {
    const isScannerInput = inputSpeed > 30;
    
    if (isScannerInput) {
      const deviceName = language === 'bn' ? 'USB বারকোড স্ক্যানার (HID)' : 'USB Barcode Scanner (HID)';
      const device = await registerScannerDevice(deviceName, 'keyboard');
      
      if (device) {
        setActiveDeviceId(device.id);
      }
    }
  }, [language, registerScannerDevice]);

  // Log scan to database
  const logScanToDatabase = useCallback(async (
    barcode: string,
    product: any | null,
    speed: number
  ) => {
    try {
      await offlineShopService.logScan({
        barcode,
        product_id: product?.id,
        product_name: product?.name,
        scan_type: 'usb',
        is_matched: !!product,
        scan_speed: speed,
      });
      
      // Update local stats
      setScannerStats(prev => ({
        ...prev,
        totalScans: prev.totalScans + 1,
        matchedScans: product ? prev.matchedScans + 1 : prev.matchedScans,
        unmatchedScans: product ? prev.unmatchedScans : prev.unmatchedScans + 1,
        avgSpeed: Math.round((prev.avgSpeed * prev.totalScans + speed) / (prev.totalScans + 1)),
        matchRate: Math.round(((product ? prev.matchedScans + 1 : prev.matchedScans) / (prev.totalScans + 1)) * 100),
      }));
      
      // Add to recent logs
      setRecentLogs(prev => [{
        id: crypto.randomUUID(),
        barcode,
        product_id: product?.id || null,
        product_name: product?.name || null,
        scan_type: 'usb',
        is_matched: !!product,
        scan_speed: speed,
        created_at: new Date().toISOString(),
      }, ...prev.slice(0, 9)]);
      
      // Update active device stats
      if (activeDeviceId) {
        updateDeviceStats(activeDeviceId, speed);
      }
    } catch (error) {
      console.error("Failed to log scan:", error);
    }
  }, [activeDeviceId, updateDeviceStats]);

  // Real-time USB device detection via WebHID API
  const checkUSBDevices = useCallback(async () => {
    setIsDetecting(true);
    setConnectionStatus('checking');
    
    try {
      if ('hid' in navigator) {
        const devices = await (navigator as any).hid.getDevices();
        const scannerVendorIds = [0x05e0, 0x0c2e, 0x1504, 0x1eab, 0x05f9];
        const scannerDevices = devices.filter((device: any) => 
          scannerVendorIds.includes(device.vendorId)
        );
        
        if (scannerDevices.length > 0) {
          for (const d of scannerDevices) {
            const deviceName = d.productName || (language === 'bn' ? 'USB স্ক্যানার' : 'USB Scanner');
            await registerScannerDevice(deviceName, 'usb', String(d.vendorId), String(d.productId));
          }
          setScannerConnected(true);
          setConnectionStatus('connected');
          toast.success(language === 'bn' ? 'USB স্ক্যানার পাওয়া গেছে!' : 'USB scanner found!');
        }
      }
      
      setTimeout(() => {
        if (!scannerConnected) {
          setConnectionStatus('waiting');
        }
        setIsDetecting(false);
      }, 2000);
      
    } catch (error) {
      console.log('USB detection fallback to keyboard mode');
      setConnectionStatus('waiting');
      setIsDetecting(false);
    }
  }, [language, scannerConnected, registerScannerDevice]);

  useEffect(() => {
    checkUSBDevices();
  }, []);

  // USB Scanner listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      
      if (timeDiff > 100) {
        barcodeBufferRef.current = "";
        scanTimesRef.current = [];
      }
      
      lastKeyTimeRef.current = currentTime;
      scanTimesRef.current.push(currentTime);

      if (e.key === "Enter" && barcodeBufferRef.current.length >= 4) {
        const scannedCode = barcodeBufferRef.current;
        
        const times = scanTimesRef.current;
        let speed = 0;
        if (times.length > 1) {
          const totalTime = (times[times.length - 1] - times[0]) / 1000;
          speed = Math.round(barcodeBufferRef.current.length / totalTime);
          setScanSpeed(speed);
          detectScannerFromInput(scannedCode, speed);
        }
        
        setLastScannedCode(scannedCode);
        
        // Check if product exists
        const matchedProduct = products.find(p => p.barcode === scannedCode);
        
        // Log scan to database
        logScanToDatabase(scannedCode, matchedProduct, speed);
        
        if (isTestMode) {
          setTestResults(prev => [{
            code: scannedCode,
            product: matchedProduct?.name || null,
            time: new Date()
          }, ...prev.slice(0, 9)]);
          
          if (matchedProduct) {
            toast.success(
              language === "bn" 
                ? `✓ প্রোডাক্ট পাওয়া গেছে: ${matchedProduct.name}`
                : `✓ Product found: ${matchedProduct.name}`
            );
          } else {
            toast.warning(
              language === "bn"
                ? `⚠ এই বারকোডের প্রোডাক্ট নেই: ${scannedCode}`
                : `⚠ No product found for: ${scannedCode}`
            );
          }
        }
        
        barcodeBufferRef.current = "";
        scanTimesRef.current = [];
        e.preventDefault();
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTestMode, products, language, detectScannerFromInput, logScanToDatabase]);

  // Monitor active device
  useEffect(() => {
    if (!scannerConnected || !activeDeviceId) return;
    
    const interval = setInterval(() => {
      const activeDevice = savedDevices.find(d => d.id === activeDeviceId);
      if (activeDevice?.last_connected_at) {
        const inactiveTime = Date.now() - new Date(activeDevice.last_connected_at).getTime();
        // If inactive for more than 5 minutes, mark as disconnected
        if (inactiveTime > 300000) {
          setConnectionStatus('waiting');
          setScannerConnected(false);
        }
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [scannerConnected, activeDeviceId, savedDevices]);

  const clearLogs = async () => {
    try {
      await offlineShopService.clearScannerLogs();
      setRecentLogs([]);
      setScannerStats({
        totalScans: 0,
        matchedScans: 0,
        unmatchedScans: 0,
        avgSpeed: 0,
        matchRate: 0,
      });
      toast.success(language === 'bn' ? 'লগ মুছে ফেলা হয়েছে' : 'Logs cleared');
    } catch (error) {
      toast.error(language === 'bn' ? 'মুছতে ব্যর্থ' : 'Failed to clear');
    }
  };

  const steps = language === "bn" ? [
    {
      step: 1,
      title: "স্ক্যানার কানেক্ট করুন",
      description: "USB বারকোড স্ক্যানার কম্পিউটারের USB পোর্টে লাগান। স্ক্যানারের LED লাইট জ্বলে উঠবে।",
      icon: Usb
    },
    {
      step: 2,
      title: "ড্রাইভার অটো ইনস্টল",
      description: "Windows/Mac স্বয়ংক্রিয়ভাবে ড্রাইভার ইনস্টল করবে। কোনো আলাদা সফটওয়্যার লাগবে না।",
      icon: Settings
    },
    {
      step: 3,
      title: "টেস্ট মোড চালু করুন",
      description: "নিচের 'টেস্ট স্ক্যান' বাটনে ক্লিক করে স্ক্যানার কাজ করছে কিনা পরীক্ষা করুন।",
      icon: Zap
    },
    {
      step: 4,
      title: "বিক্রয় শুরু করুন",
      description: "টেস্ট সফল হলে Sales (Sell/POS) পেজে গিয়ে স্ক্যান করে বিক্রয় শুরু করুন।",
      icon: ShoppingCart
    }
  ] : [
    {
      step: 1,
      title: "Connect Scanner",
      description: "Plug your USB barcode scanner into any USB port on your computer. The scanner LED will light up.",
      icon: Usb
    },
    {
      step: 2,
      title: "Auto Driver Install",
      description: "Windows/Mac will automatically install the required drivers. No additional software needed.",
      icon: Settings
    },
    {
      step: 3,
      title: "Enable Test Mode",
      description: "Click the 'Test Scan' button below to verify your scanner is working properly.",
      icon: Zap
    },
    {
      step: 4,
      title: "Start Selling",
      description: "Once test is successful, go to Sales (Sell/POS) page and start scanning to sell products.",
      icon: ShoppingCart
    }
  ];

  return (
    <ShopLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            {language === "bn" ? "স্ক্যানার সেটআপ" : "Scanner Setup"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "bn" 
              ? "USB বারকোড স্ক্যানার সংযুক্ত করুন এবং সিস্টেমের সাথে টেস্ট করুন"
              : "Connect your USB barcode scanner and test it with the system"}
          </p>
        </div>

        {/* Scanner Stats - Real Data */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{scannerStats.totalScans}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'মোট স্ক্যান' : 'Total Scans'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{scannerStats.matchedScans}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'মিলেছে' : 'Matched'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{scannerStats.unmatchedScans}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'মেলেনি' : 'Unmatched'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{scannerStats.matchRate}%</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'সাফল্যের হার' : 'Match Rate'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connection Status */}
        <Card className={cn(
          "border-2 transition-all",
          connectionStatus === 'connected'
            ? "border-green-500 bg-green-50 dark:bg-green-950/20"
            : connectionStatus === 'checking'
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-dashed border-muted-foreground/30"
        )}>
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-full relative",
                connectionStatus === 'connected' ? "bg-green-100 dark:bg-green-900" : 
                connectionStatus === 'checking' ? "bg-blue-100 dark:bg-blue-900" : "bg-muted"
              )}>
                {connectionStatus === 'checking' ? (
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                ) : connectionStatus === 'connected' ? (
                  <>
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full animate-pulse" />
                  </>
                ) : (
                  <Usb className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {connectionStatus === 'checking'
                    ? (language === "bn" ? "🔍 স্ক্যানার খোঁজা হচ্ছে..." : "🔍 Searching for scanner...")
                    : connectionStatus === 'connected'
                    ? (language === "bn" ? "✓ স্ক্যানার সংযুক্ত আছে!" : "✓ Scanner Connected!")
                    : (language === "bn" ? "স্ক্যানার সংযোগের অপেক্ষায়..." : "Waiting for scanner connection...")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {connectionStatus === 'connected'
                    ? (language === "bn" 
                        ? `সর্বশেষ স্ক্যান: ${lastScannedCode || 'কোনো স্ক্যান নেই'} • গড় গতি: ${scannerStats.avgSpeed} অক্ষর/সে` 
                        : `Last scan: ${lastScannedCode || 'None'} • Avg speed: ${scannerStats.avgSpeed} chars/sec`)
                    : connectionStatus === 'checking'
                    ? (language === "bn"
                        ? "USB পোর্ট চেক করা হচ্ছে..."
                        : "Checking USB ports...")
                    : (language === "bn"
                        ? "USB স্ক্যানার লাগিয়ে যেকোনো প্রোডাক্ট স্ক্যান করুন"
                        : "Plug in USB scanner and scan any product")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' && scanSpeed > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {scanSpeed} {language === 'bn' ? 'অক্ষর/সেকেন্ড' : 'chars/sec'}
                  </Badge>
                )}
                <Badge 
                  variant={connectionStatus === 'connected' ? "default" : connectionStatus === 'checking' ? "secondary" : "outline"} 
                  className={cn(
                    "text-sm",
                    connectionStatus === 'connected' && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {connectionStatus === 'connected' ? (
                    <><Wifi className="h-3 w-3 mr-1" /> {language === "bn" ? "অনলাইন" : "Online"}</>
                  ) : connectionStatus === 'checking' ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> {language === "bn" ? "চেক হচ্ছে" : "Checking"}</>
                  ) : (
                    <><WifiOff className="h-3 w-3 mr-1" /> {language === "bn" ? "অফলাইন" : "Offline"}</>
                  )}
                </Badge>
              </div>
            </div>
            
            {/* Saved Devices from Database */}
            {savedDevices.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Usb className="h-4 w-4" />
                  {language === 'bn' ? 'সংরক্ষিত স্ক্যানার ডিভাইস' : 'Saved Scanner Devices'}
                </h4>
                <div className="space-y-2">
                  {savedDevices.map(device => (
                    <div 
                      key={device.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        device.is_active && device.id === activeDeviceId
                          ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700"
                          : "bg-card border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-full",
                          device.is_active && device.id === activeDeviceId
                            ? "bg-green-100 dark:bg-green-900"
                            : "bg-muted"
                        )}>
                          {device.is_active && device.id === activeDeviceId ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Usb className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          {editingDeviceId === device.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingDeviceName}
                                onChange={(e) => setEditingDeviceName(e.target.value)}
                                className="h-7 text-sm w-48"
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveDeviceName}>
                                <Save className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <p className="font-medium text-sm">{device.device_name}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{device.total_scans} {language === 'bn' ? 'স্ক্যান' : 'scans'}</span>
                            {device.avg_scan_speed > 0 && (
                              <>
                                <span>•</span>
                                <span>{Math.round(device.avg_scan_speed)} {language === 'bn' ? 'অক্ষর/সে' : 'c/s'}</span>
                              </>
                            )}
                            {device.last_connected_at && (
                              <>
                                <span>•</span>
                                <span>
                                  {language === 'bn' ? 'সর্বশেষ:' : 'Last:'} {new Date(device.last_connected_at).toLocaleString()}
                                </span>
                              </>
                            )}
                          </div>
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
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditingDeviceId(device.id);
                            setEditingDeviceName(device.device_name);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        {device.is_active && device.id === activeDeviceId ? (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 text-orange-600 hover:text-orange-700"
                            onClick={() => disconnectDevice(device.id)}
                          >
                            <Power className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => deleteDevice(device.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Refresh Button */}
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={checkUSBDevices}
                disabled={isDetecting}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isDetecting && "animate-spin")} />
                {language === 'bn' ? 'পুনরায় খোঁজুন' : 'Refresh Detection'}
              </Button>
              {!scannerConnected && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {language === 'bn' 
                    ? 'স্ক্যানার স্বয়ংক্রিয়ভাবে সনাক্ত হবে যখন আপনি কিছু স্ক্যান করবেন'
                    : 'Scanner will auto-detect when you scan something'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Setup Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              {language === "bn" ? "সেটআপ নির্দেশিকা" : "Setup Guide"}
            </CardTitle>
            <CardDescription>
              {language === "bn" 
                ? "USB স্ক্যানার কীবোর্ডের মতো কাজ করে - কোনো বিশেষ সফটওয়্যার লাগে না"
                : "USB scanners work like keyboards - no special software needed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">{item.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Scanner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              {language === "bn" ? "স্ক্যানার টেস্ট" : "Scanner Test"}
            </CardTitle>
            <CardDescription>
              {language === "bn"
                ? "টেস্ট মোড চালু করে যেকোনো প্রোডাক্ট স্ক্যান করুন"
                : "Enable test mode and scan any product to verify connection"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setIsTestMode(!isTestMode)}
              size="lg"
              variant={isTestMode ? "destructive" : "default"}
              className="w-full md:w-auto"
            >
              {isTestMode ? (
                <>
                  <XCircle className="mr-2 h-5 w-5" />
                  {language === "bn" ? "টেস্ট মোড বন্ধ করুন" : "Stop Test Mode"}
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  {language === "bn" ? "টেস্ট মোড চালু করুন" : "Start Test Mode"}
                </>
              )}
            </Button>

            {isTestMode && (
              <div className="p-6 border-2 border-dashed border-primary rounded-lg bg-primary/5 text-center animate-pulse">
                <Scan className="h-16 w-16 mx-auto mb-4 text-primary" />
                <p className="text-lg font-medium">
                  {language === "bn" 
                    ? "🎯 এখন স্ক্যান করুন! স্ক্যানার প্রস্তুত আছে..."
                    : "🎯 Scan Now! Scanner is ready..."}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {language === "bn"
                    ? "যেকোনো প্রোডাক্টের বারকোড স্ক্যান করুন"
                    : "Scan any product barcode to test"}
                </p>
                
                {/* Animated scan line */}
                <div className="relative h-2 bg-muted rounded-full mt-4 overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-1/3 bg-primary rounded-full animate-scan-line" />
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  {language === "bn" ? "টেস্ট ফলাফল" : "Test Results"}
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testResults.map((result, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        result.product 
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                          : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {result.product ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-mono font-medium">{result.code}</p>
                          <p className="text-sm text-muted-foreground">
                            {result.product || (language === "bn" ? "প্রোডাক্ট পাওয়া যায়নি" : "Product not found")}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {result.time.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scan Logs - Real Data */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {language === "bn" ? "সাম্প্রতিক স্ক্যান লগ" : "Recent Scan Logs"}
              </CardTitle>
              <CardDescription>
                {language === "bn" 
                  ? "ডাটাবেসে সংরক্ষিত স্ক্যান ইতিহাস"
                  : "Scan history saved in database"}
              </CardDescription>
            </div>
            {recentLogs.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearLogs}>
                <Trash2 className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'লগ মুছুন' : 'Clear Logs'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scan className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{language === 'bn' ? 'কোনো স্ক্যান লগ নেই' : 'No scan logs yet'}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      log.is_matched 
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {log.is_matched ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      <div>
                        <p className="font-mono font-medium">{log.barcode}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.product_name || (language === "bn" ? "প্রোডাক্ট পাওয়া যায়নি" : "Product not found")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {log.scan_speed && (
                        <Badge variant="outline" className="text-xs mb-1">
                          {log.scan_speed} {language === 'bn' ? 'অক্ষর/সে' : 'c/s'}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {language === "bn" ? "টিপস ও সমস্যা সমাধান" : "Tips & Troubleshooting"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(language === "bn" ? [
                "স্ক্যানার কাজ না করলে অন্য USB পোর্টে লাগিয়ে দেখুন",
                "কিছু স্ক্যানারে Enter কী সেটআপ করতে হয় - ম্যানুয়াল দেখুন",
                "বারকোড ছাড়া প্রোডাক্টে 'বারকোড তৈরি করুন' থেকে বারকোড যোগ করুন",
                "টেস্ট সফল হলে Sales পেজে গিয়ে 'স্ক্যান' বাটনে ক্লিক করুন",
                "মোবাইল/ট্যাবলেটে ক্যামেরা স্ক্যানার ব্যবহার করুন"
              ] : [
                "If scanner doesn't work, try a different USB port",
                "Some scanners need Enter key configuration - check manual",
                "Generate barcodes for products without them from Products page",
                "After successful test, go to Sales page and click 'Scan' button",
                "On mobile/tablet, use the camera scanner option"
              ]).map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span className="text-sm text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </ShopLayout>
  );
};

export default ScannerSetup;
