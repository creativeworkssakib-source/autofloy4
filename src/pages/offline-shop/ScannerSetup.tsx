import { useState, useEffect, useRef } from "react";
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
  AlertCircle
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

const ScannerSetup = () => {
  const { language } = useLanguage();
  const { currentShop } = useShop();
  const [isTestMode, setIsTestMode] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scannerConnected, setScannerConnected] = useState(false);
  const [testResults, setTestResults] = useState<{ code: string; product: string | null; time: Date }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

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

  // USB Scanner listener in test mode
  useEffect(() => {
    if (!isTestMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // Reset buffer if too much time has passed (typing vs scanning)
      if (currentTime - lastKeyTimeRef.current > 100) {
        barcodeBufferRef.current = "";
      }
      lastKeyTimeRef.current = currentTime;

      if (e.key === "Enter" && barcodeBufferRef.current.length >= 4) {
        const scannedCode = barcodeBufferRef.current;
        setLastScannedCode(scannedCode);
        setScannerConnected(true);
        
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
        
        barcodeBufferRef.current = "";
        e.preventDefault();
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTestMode, products, language]);

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
          scannerConnected 
            ? "border-green-500 bg-green-50 dark:bg-green-950/20" 
            : "border-dashed border-muted-foreground/30"
        )}>
          <CardContent className="flex items-center gap-4 py-6">
            <div className={cn(
              "p-3 rounded-full",
              scannerConnected ? "bg-green-100 dark:bg-green-900" : "bg-muted"
            )}>
              {scannerConnected ? (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              ) : (
                <Usb className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {scannerConnected 
                  ? (language === "bn" ? "✓ স্ক্যানার সংযুক্ত আছে!" : "✓ Scanner Connected!")
                  : (language === "bn" ? "স্ক্যানার সংযোগের অপেক্ষায়..." : "Waiting for scanner connection...")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {scannerConnected
                  ? (language === "bn" 
                      ? `সর্বশেষ স্ক্যান: ${lastScannedCode}` 
                      : `Last scan: ${lastScannedCode}`)
                  : (language === "bn"
                      ? "USB স্ক্যানার লাগিয়ে টেস্ট মোড চালু করুন"
                      : "Plug in USB scanner and enable test mode")}
              </p>
            </div>
            <Badge variant={scannerConnected ? "default" : "secondary"} className="text-sm">
              {scannerConnected 
                ? (language === "bn" ? "অনলাইন" : "Online")
                : (language === "bn" ? "অফলাইন" : "Offline")}
            </Badge>
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
