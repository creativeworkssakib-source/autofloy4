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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { offlineShopService } from "@/services/offlineShopService";
import { useShop } from "@/contexts/ShopContext";
import { cn } from "@/lib/utils";

interface ScannerDevice {
  id: string;
  name: string;
  type: 'usb' | 'keyboard' | 'camera';
  connected: boolean;
  lastActivity?: Date;
}

const ScannerSetup = () => {
  const { language } = useLanguage();
  const { currentShop } = useShop();
  const [isTestMode, setIsTestMode] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scannerConnected, setScannerConnected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedDevices, setDetectedDevices] = useState<ScannerDevice[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected' | 'waiting'>('waiting');
  const [testResults, setTestResults] = useState<{ code: string; product: string | null; time: Date }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [scanSpeed, setScanSpeed] = useState<number>(0);
  const [totalScans, setTotalScans] = useState(0);
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const scanTimesRef = useRef<number[]>([]);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load products for barcode matching
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await offlineShopService.getProducts();
        setProducts(res.products || []);
      } catch (error) {
        console.error("Load products error:", error);
      }
    };
    if (currentShop?.id) {
      loadProducts();
    }
  }, [currentShop?.id]);

  // Detect USB devices using keyboard input patterns
  const detectScannerFromInput = useCallback((scannedCode: string, inputSpeed: number) => {
    // USB scanners typically input at 50-200 chars per second
    // Humans type at ~5-10 chars per second
    const isScannerInput = inputSpeed > 30; // chars per second
    
    if (isScannerInput && !scannerConnected) {
      setScannerConnected(true);
      setConnectionStatus('connected');
      
      // Add as detected device
      setDetectedDevices(prev => {
        const exists = prev.some(d => d.type === 'keyboard');
        if (exists) return prev;
        return [...prev, {
          id: 'usb-hid-scanner',
          name: language === 'bn' ? 'USB বারকোড স্ক্যানার (HID)' : 'USB Barcode Scanner (HID)',
          type: 'keyboard',
          connected: true,
          lastActivity: new Date()
        }];
      });
      
      toast.success(
        language === 'bn' 
          ? '✓ USB স্ক্যানার সনাক্ত হয়েছে!' 
          : '✓ USB Scanner Detected!'
      );
    }
    
    // Update last activity
    setDetectedDevices(prev => 
      prev.map(d => d.type === 'keyboard' ? { ...d, lastActivity: new Date() } : d)
    );
  }, [scannerConnected, language]);

  // Real-time USB device detection using WebHID (if supported)
  const checkUSBDevices = useCallback(async () => {
    setIsDetecting(true);
    setConnectionStatus('checking');
    
    try {
      // Check if WebHID is supported
      if ('hid' in navigator) {
        const devices = await (navigator as any).hid.getDevices();
        const scannerDevices = devices.filter((device: any) => {
          // Common barcode scanner vendor IDs
          const scannerVendorIds = [0x05e0, 0x0c2e, 0x1504, 0x1eab, 0x05f9];
          return scannerVendorIds.includes(device.vendorId);
        });
        
        if (scannerDevices.length > 0) {
          setDetectedDevices(scannerDevices.map((d: any) => ({
            id: `${d.vendorId}-${d.productId}`,
            name: d.productName || (language === 'bn' ? 'USB স্ক্যানার' : 'USB Scanner'),
            type: 'usb' as const,
            connected: true
          })));
          setScannerConnected(true);
          setConnectionStatus('connected');
          toast.success(language === 'bn' ? 'USB স্ক্যানার পাওয়া গেছে!' : 'USB scanner found!');
        }
      }
      
      // Fallback: Listen for keyboard-like input from scanner
      // Most USB scanners act as HID keyboards
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
  }, [language, scannerConnected]);

  // Initial USB check on mount
  useEffect(() => {
    checkUSBDevices();
  }, []);

  // USB Scanner listener - works both in test mode and always for detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      
      // Reset buffer if too much time has passed (typing vs scanning)
      if (timeDiff > 100) {
        barcodeBufferRef.current = "";
        scanTimesRef.current = [];
      }
      
      lastKeyTimeRef.current = currentTime;
      scanTimesRef.current.push(currentTime);

      if (e.key === "Enter" && barcodeBufferRef.current.length >= 4) {
        const scannedCode = barcodeBufferRef.current;
        
        // Calculate input speed (chars per second)
        const times = scanTimesRef.current;
        if (times.length > 1) {
          const totalTime = (times[times.length - 1] - times[0]) / 1000; // seconds
          const speed = barcodeBufferRef.current.length / totalTime;
          setScanSpeed(Math.round(speed));
          detectScannerFromInput(scannedCode, speed);
        }
        
        setLastScannedCode(scannedCode);
        setTotalScans(prev => prev + 1);
        
        if (isTestMode) {
          // Check if product exists
          const matchedProduct = products.find(p => p.barcode === scannedCode);
          
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
  }, [isTestMode, products, language, detectScannerFromInput]);

  // Monitor connection - set to disconnected if no activity for 30 seconds
  useEffect(() => {
    if (!scannerConnected) return;
    
    const interval = setInterval(() => {
      const lastDevice = detectedDevices.find(d => d.lastActivity);
      if (lastDevice?.lastActivity) {
        const inactiveTime = Date.now() - lastDevice.lastActivity.getTime();
        if (inactiveTime > 30000) { // 30 seconds
          // Don't disconnect, just show idle status
          setConnectionStatus('connected');
        }
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [scannerConnected, detectedDevices]);

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
                        ? `সর্বশেষ স্ক্যান: ${lastScannedCode || 'কোনো স্ক্যান নেই'} • মোট স্ক্যান: ${totalScans}` 
                        : `Last scan: ${lastScannedCode || 'None'} • Total scans: ${totalScans}`)
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
            
            {/* Detected Devices */}
            {detectedDevices.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Usb className="h-4 w-4" />
                  {language === 'bn' ? 'সনাক্তকৃত ডিভাইস' : 'Detected Devices'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {detectedDevices.map(device => (
                    <Badge 
                      key={device.id} 
                      variant="outline" 
                      className={cn(
                        "py-1.5 px-3",
                        device.connected && "border-green-500 text-green-700 dark:text-green-400"
                      )}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1.5" />
                      {device.name}
                      {device.lastActivity && (
                        <span className="ml-2 text-xs opacity-70">
                          {device.lastActivity.toLocaleTimeString()}
                        </span>
                      )}
                    </Badge>
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
                  {language === "bn" ? "স্ক্যান ফলাফল" : "Scan Results"}
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
