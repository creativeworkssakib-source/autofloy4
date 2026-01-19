import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
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
  Info,
  Camera,
  Bluetooth,
  Smartphone,
  Laptop,
  HelpCircle,
  CheckCircle,
  Circle,
  ChevronRight
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState<"usb" | "camera" | "bluetooth">("usb");
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
  
  // Camera scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const cameraScannerRef = useRef<Html5Qrcode | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
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

  // Handle scan result - unified for all scanner types
  const handleScanResult = useCallback((scannedCode: string, speed?: number) => {
    setLastScannedCode(scannedCode);
    if (speed) setScanSpeed(speed);
    
    // Find product
    const product = products.find(p => 
      p.barcode === scannedCode || 
      p.sku === scannedCode
    );
    
    // Update stats
    setScannerStats(prev => ({
      ...prev,
      totalScans: prev.totalScans + 1,
      matchedScans: product ? prev.matchedScans + 1 : prev.matchedScans,
      unmatchedScans: product ? prev.unmatchedScans : prev.unmatchedScans + 1,
      avgSpeed: speed ? Math.round((prev.avgSpeed * prev.totalScans + speed) / (prev.totalScans + 1)) : prev.avgSpeed,
      matchRate: Math.round(((product ? prev.matchedScans + 1 : prev.matchedScans) / (prev.totalScans + 1)) * 100),
    }));
    
    // Add to test results
    setTestResults(prev => [{
      code: scannedCode,
      product: product?.name || null,
      time: new Date(),
    }, ...prev.slice(0, 9)]);
    
    // Play sound feedback
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = product ? 800 : 300;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Sound not available
    }
    
    // Vibrate on mobile
    if (navigator.vibrate) {
      navigator.vibrate(product ? [100] : [50, 50, 50]);
    }
    
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
    
    return product;
  }, [products, language]);

  // Register scanner device
  const registerScannerDevice = useCallback(async (deviceName: string, deviceType: 'keyboard' | 'camera' | 'bluetooth' = 'keyboard') => {
    try {
      const result = await offlineShopService.saveScannerDevice({
        name: deviceName,
        device_name: deviceName,
        device_id: `scanner_${Date.now()}`,
        device_type: deviceType,
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

  // Start scanner detection (USB/Bluetooth)
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

  // USB/Bluetooth Scanner listener (both work via keyboard events)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
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
        
        // Auto-detect scanner on first fast scan
        if (speed >= 25 && !scannerConnected && isDetecting) {
          const scannerType = activeTab === 'bluetooth' ? 'bluetooth' : 'keyboard';
          const deviceName = language === 'bn' 
            ? `${activeTab === 'bluetooth' ? 'Bluetooth' : 'USB'} স্ক্যানার (${Math.round(speed)} c/s)` 
            : `${activeTab === 'bluetooth' ? 'Bluetooth' : 'USB'} Scanner (${Math.round(speed)} c/s)`;
          registerScannerDevice(deviceName, scannerType);
          setIsDetecting(false);
        }
        
        handleScanResult(scannedCode, speed);
        
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
  }, [products, language, scannerConnected, isDetecting, registerScannerDevice, handleScanResult, activeTab]);

  // Camera Scanner Functions
  const initCameraScanner = useCallback(async () => {
    if (cameraScannerRef.current) return;
    
    setCameraLoading(true);
    setCameraError(null);
    setIsCameraActive(true);

    // Wait a bit for container to render
    await new Promise(resolve => setTimeout(resolve, 100));

    const containerId = "camera-scanner-container";
    const container = document.getElementById(containerId);
    
    if (!container) {
      setCameraError(language === 'bn' ? 'ক্যামেরা কন্টেইনার পাওয়া যায়নি' : 'Camera container not found');
      setCameraLoading(false);
      setIsCameraActive(false);
      return;
    }

    try {
      const html5Qrcode = new Html5Qrcode(containerId);
      cameraScannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: "environment" }, // Prefer back camera
        {
          fps: 15,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.777778, // 16:9
        },
        (decodedText) => {
          handleScanResult(decodedText);
        },
        () => {
          // Ignore QR code scan errors (happens constantly when no code is in view)
        }
      );

      setCameraLoading(false);

      // Register camera as scanner device
      if (!savedDevices.some(d => d.device_type === 'camera')) {
        registerScannerDevice(
          language === 'bn' ? 'ক্যামেরা স্ক্যানার' : 'Camera Scanner',
          'camera'
        );
      }

      toast.success(language === 'bn' ? 'ক্যামেরা চালু হয়েছে!' : 'Camera started!');
    } catch (err: any) {
      console.error("Failed to start camera:", err);
      setCameraLoading(false);
      setIsCameraActive(false);
      
      if (err?.message?.includes("Permission")) {
        setCameraError(language === 'bn' ? 'ক্যামেরা permission দেননি। ব্রাউজার সেটিংস থেকে permission দিন।' : 'Camera permission denied. Allow camera access in browser settings.');
      } else if (err?.message?.includes("NotFound") || err?.message?.includes("Requested device not found")) {
        setCameraError(language === 'bn' ? 'কোনো ক্যামেরা পাওয়া যায়নি। ক্যামেরা সংযুক্ত আছে কিনা দেখুন।' : 'No camera found. Make sure a camera is connected.');
      } else {
        setCameraError(language === 'bn' ? 'ক্যামেরা চালু করা যায়নি। আবার চেষ্টা করুন।' : 'Failed to start camera. Please try again.');
      }
    }
  }, [handleScanResult, language, savedDevices, registerScannerDevice]);

  const stopCameraScanner = useCallback(async () => {
    if (cameraScannerRef.current) {
      try {
        if (cameraScannerRef.current.isScanning) {
          await cameraScannerRef.current.stop();
        }
        cameraScannerRef.current.clear();
      } catch (e) {
        console.debug("Camera cleanup error:", e);
      }
      cameraScannerRef.current = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  }, []);

  // Cleanup camera on tab change or unmount
  useEffect(() => {
    if (activeTab !== 'camera') {
      stopCameraScanner();
    }
    return () => {
      // Cleanup on unmount - use void to handle async
      void stopCameraScanner();
    };
  }, [activeTab, stopCameraScanner]);

  const clearLogs = async () => {
    setRecentLogs([]);
    setTestResults([]);
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
                ? 'USB, ক্যামেরা বা Bluetooth স্ক্যানার কনফিগার করুন' 
                : 'Configure USB, Camera or Bluetooth scanner'}
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

        {/* Scanner Type Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="usb" className="gap-2">
              <Usb className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'bn' ? 'USB স্ক্যানার' : 'USB Scanner'}</span>
              <span className="sm:hidden">USB</span>
            </TabsTrigger>
            <TabsTrigger value="camera" className="gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'bn' ? 'ক্যামেরা' : 'Camera'}</span>
              <span className="sm:hidden">{language === 'bn' ? 'ক্যামেরা' : 'Cam'}</span>
            </TabsTrigger>
            <TabsTrigger value="bluetooth" className="gap-2">
              <Bluetooth className="h-4 w-4" />
              <span className="hidden sm:inline">Bluetooth</span>
              <span className="sm:hidden">BT</span>
            </TabsTrigger>
          </TabsList>

          {/* USB Scanner Tab */}
          <TabsContent value="usb" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* USB Scanner Detection Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Usb className="h-5 w-5" />
                    {language === 'bn' ? 'USB স্ক্যানার সনাক্তকরণ' : 'USB Scanner Detection'}
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
                      <div className="relative mx-auto w-24 h-16 mb-4">
                        <div className="absolute inset-0 border-4 border-primary/40 rounded-lg flex items-center justify-center animate-pulse">
                          <div className="flex gap-0.5">
                            {[...Array(12)].map((_, i) => (
                              <div
                                key={i}
                                className="bg-primary/60 rounded-full"
                                style={{
                                  width: i % 3 === 0 ? "3px" : "2px",
                                  height: `${15 + Math.random() * 15}px`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
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

                  {/* Quick Setup Steps */}
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      {language === 'bn' ? 'দ্রুত সেটআপ' : 'Quick Setup'}
                    </h4>
                    <div className="space-y-2">
                      {[
                        language === 'bn' ? 'USB স্ক্যানার কম্পিউটারে লাগান' : 'Plug USB scanner into computer',
                        language === 'bn' ? '"সনাক্তকরণ শুরু করুন" চাপুন' : 'Click "Start Detection"',
                        language === 'bn' ? 'যেকোনো বারকোড স্ক্যান করুন' : 'Scan any barcode',
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {i + 1}
                          </div>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
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
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {savedDevices.map((device) => {
                        const displayName = device.device_name || device.name;
                        const DeviceIcon = device.device_type === 'camera' ? Camera : 
                                          device.device_type === 'bluetooth' ? Bluetooth : Usb;
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
                              <DeviceIcon className={cn(
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
          </TabsContent>

          {/* Camera Scanner Tab */}
          <TabsContent value="camera" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    {language === 'bn' ? 'ক্যামেরা স্ক্যানার' : 'Camera Scanner'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'bn' 
                      ? 'মোবাইল বা ল্যাপটপ ক্যামেরা দিয়ে বারকোড স্ক্যান করুন'
                      : 'Scan barcodes using your mobile or laptop camera'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isCameraActive ? (
                    <div className="text-center py-6">
                      <div className="relative mx-auto w-20 h-20 mb-4 bg-muted rounded-full flex items-center justify-center">
                        <Camera className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">
                        {language === 'bn' 
                          ? 'ক্যামেরা স্ক্যানার শুরু করতে নিচের বাটনে ক্লিক করুন'
                          : 'Click the button below to start camera scanner'}
                      </p>
                      <Button onClick={initCameraScanner} disabled={cameraLoading} className="gap-2">
                        {cameraLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        {cameraLoading 
                          ? (language === 'bn' ? 'চালু হচ্ছে...' : 'Starting...')
                          : (language === 'bn' ? 'ক্যামেরা চালু করুন' : 'Start Camera')
                        }
                      </Button>
                      
                      {cameraError && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <p className="text-sm text-red-500 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {cameraError}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Live Camera Feed Container */}
                      <div className="relative">
                        <div 
                          id="camera-scanner-container"
                          ref={videoContainerRef}
                          className="w-full min-h-[280px] bg-black rounded-lg overflow-hidden"
                        />
                        
                        {/* Scanning overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="relative w-[280px] h-[150px] border-2 border-primary rounded-lg">
                            {/* Scanning line animation */}
                            <div className="absolute left-0 right-0 h-0.5 bg-red-500 animate-pulse" 
                                 style={{ 
                                   animation: 'scan-line 2s ease-in-out infinite',
                                   top: '50%'
                                 }} 
                            />
                            {/* Corner markers */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br" />
                          </div>
                        </div>

                        {/* Live indicator */}
                        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-2 py-1 rounded text-white text-xs">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          LIVE
                        </div>
                      </div>

                      <div className="text-center text-sm text-muted-foreground">
                        {language === 'bn' 
                          ? 'বারকোডটি বক্সের মধ্যে রাখুন'
                          : 'Position barcode inside the box'}
                      </div>

                      <div className="flex justify-center">
                        <Button variant="outline" onClick={stopCameraScanner} className="gap-2">
                          <XCircle className="h-4 w-4" />
                          {language === 'bn' ? 'ক্যামেরা বন্ধ করুন' : 'Stop Camera'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Camera Tips */}
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      {language === 'bn' ? 'ভালো স্ক্যানের জন্য টিপস' : 'Tips for better scanning'}
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                        {language === 'bn' ? 'পর্যাপ্ত আলো রাখুন' : 'Ensure good lighting'}
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                        {language === 'bn' ? 'বারকোড সোজা ধরুন' : 'Hold barcode straight'}
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                        {language === 'bn' ? '১০-১৫ সেমি দূরত্ব রাখুন' : 'Keep 10-15cm distance'}
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Scan Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="h-5 w-5" />
                    {language === 'bn' ? 'স্ক্যান ফলাফল' : 'Scan Results'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'bn' ? 'সাম্প্রতিক স্ক্যান করা বারকোড' : 'Recently scanned barcodes'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {testResults.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Scan className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>{language === 'bn' ? 'এখনো কিছু স্ক্যান করা হয়নি' : 'No scans yet'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {testResults.map((result, i) => (
                        <div 
                          key={i}
                          className={cn(
                            "p-3 rounded-lg flex items-center justify-between",
                            result.product 
                              ? "bg-green-500/10 border border-green-500/30" 
                              : "bg-red-500/10 border border-red-500/30"
                          )}
                        >
                          <div>
                            <p className="font-mono text-sm">{result.code}</p>
                            <p className={cn(
                              "text-sm",
                              result.product ? "text-green-600" : "text-red-600"
                            )}>
                              {result.product || (language === 'bn' ? 'প্রোডাক্ট পাওয়া যায়নি' : 'Product not found')}
                            </p>
                          </div>
                          {result.product ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bluetooth Scanner Tab */}
          <TabsContent value="bluetooth" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Bluetooth Pairing Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bluetooth className="h-5 w-5" />
                    {language === 'bn' ? 'Bluetooth স্ক্যানার সেটআপ' : 'Bluetooth Scanner Setup'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'bn' 
                      ? 'Bluetooth স্ক্যানার কিভাবে সংযুক্ত করবেন তা দেখুন'
                      : 'Learn how to connect your Bluetooth scanner'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pairing Steps */}
                  <div className="space-y-4">
                    <h4 className="font-medium">
                      {language === 'bn' ? 'সংযোগ নির্দেশাবলী' : 'Connection Instructions'}
                    </h4>
                    
                    <div className="space-y-3">
                      {[
                        {
                          icon: Power,
                          title: language === 'bn' ? 'স্ক্যানার চালু করুন' : 'Turn on scanner',
                          desc: language === 'bn' ? 'Bluetooth স্ক্যানারের পাওয়ার বাটন চাপুন' : 'Press the power button on your Bluetooth scanner'
                        },
                        {
                          icon: Bluetooth,
                          title: language === 'bn' ? 'Pairing মোডে রাখুন' : 'Enable pairing mode',
                          desc: language === 'bn' ? 'সাধারণত ৫ সেকেন্ড পাওয়ার বাটন ধরে রাখুন' : 'Usually hold power button for 5 seconds'
                        },
                        {
                          icon: Smartphone,
                          title: language === 'bn' ? 'ডিভাইসে Bluetooth খুলুন' : 'Open device Bluetooth',
                          desc: language === 'bn' ? 'ফোন/ল্যাপটপের Bluetooth সেটিংস খুলুন' : 'Open Bluetooth settings on your phone/laptop'
                        },
                        {
                          icon: Plug,
                          title: language === 'bn' ? 'স্ক্যানার Pair করুন' : 'Pair the scanner',
                          desc: language === 'bn' ? 'নতুন ডিভাইস লিস্টে স্ক্যানার সিলেক্ট করুন' : 'Select scanner from new devices list'
                        },
                        {
                          icon: CheckCircle2,
                          title: language === 'bn' ? 'সংযোগ সম্পন্ন!' : 'Connected!',
                          desc: language === 'bn' ? 'এখন USB স্ক্যানারের মতোই কাজ করবে' : 'Now works just like a USB scanner'
                        }
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <step.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{step.title}</p>
                            <p className="text-xs text-muted-foreground">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Test Bluetooth Scanner */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">
                        {language === 'bn' ? 'Bluetooth স্ক্যানার টেস্ট' : 'Test Bluetooth Scanner'}
                      </h4>
                    </div>
                    <Button 
                      onClick={startScannerDetection}
                      disabled={isDetecting}
                      className="w-full gap-2"
                    >
                      {isDetecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {language === 'bn' ? 'স্ক্যান করুন...' : 'Waiting for scan...'}
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          {language === 'bn' ? 'টেস্ট শুরু করুন' : 'Start Test'}
                        </>
                      )}
                    </Button>
                    {lastScannedCode && (
                      <div className="mt-4 p-3 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">
                          {language === 'bn' ? 'শেষ স্ক্যান:' : 'Last scan:'}
                        </p>
                        <p className="font-mono font-bold">{lastScannedCode}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Supported Brands */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    {language === 'bn' ? 'সাপোর্টেড ব্র্যান্ড' : 'Supported Brands'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'bn' 
                      ? 'এই Bluetooth স্ক্যানারগুলো সাপোর্ট করা হয়'
                      : 'These Bluetooth scanners are supported'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Honeywell', models: 'Voyager 1602g, 1902g' },
                      { name: 'Zebra/Symbol', models: 'CS4070, DS2278' },
                      { name: 'Datalogic', models: 'Gryphon GBT4500' },
                      { name: 'Socket Mobile', models: 'SocketScan S700' },
                      { name: 'Tera', models: 'HW0002, HW0006' },
                      { name: 'Eyoyo', models: 'EY-015, EY-017' },
                    ].map((brand, i) => (
                      <div key={i} className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium text-sm">{brand.name}</p>
                        <p className="text-xs text-muted-foreground">{brand.models}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      <Info className="h-4 w-4 inline mr-2" />
                      {language === 'bn' 
                        ? 'যেকোনো HID মোড সাপোর্টিং Bluetooth স্ক্যানার কাজ করবে।'
                        : 'Any Bluetooth scanner with HID mode support will work.'}
                    </p>
                  </div>

                  {/* Troubleshooting */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      {language === 'bn' ? 'সমস্যা সমাধান' : 'Troubleshooting'}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="font-medium">{language === 'bn' ? 'স্ক্যানার দেখাচ্ছে না?' : 'Scanner not showing?'}</p>
                        <p className="text-muted-foreground text-xs">
                          {language === 'bn' 
                            ? 'স্ক্যানার pairing মোডে আছে কিনা নিশ্চিত করুন'
                            : 'Make sure scanner is in pairing mode'}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="font-medium">{language === 'bn' ? 'সংযোগ বিচ্ছিন্ন হচ্ছে?' : 'Connection dropping?'}</p>
                        <p className="text-muted-foreground text-xs">
                          {language === 'bn' 
                            ? 'স্ক্যানার চার্জ করুন এবং ডিভাইসের কাছে রাখুন'
                            : 'Charge scanner and keep it close to device'}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="font-medium">{language === 'bn' ? 'স্ক্যান কাজ করছে না?' : 'Scans not working?'}</p>
                        <p className="text-muted-foreground text-xs">
                          {language === 'bn' 
                            ? 'স্ক্যানার HID/Keyboard মোডে সেট করুন'
                            : 'Set scanner to HID/Keyboard mode'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

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
      </div>
    </ShopLayout>
  );
};

export default ScannerSetup;
