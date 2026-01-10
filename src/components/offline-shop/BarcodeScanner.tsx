import { useState, useEffect, useRef, useCallback } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Scan } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const { language } = useLanguage();
  const [scanMode, setScanMode] = useState<"usb" | "camera">("usb");
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initCameraScanner = useCallback(() => {
    if (!containerRef.current || scannerRef.current) return;

    try {
      const scanner = new Html5QrcodeScanner(
        "barcode-scanner-container",
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          onScan(decodedText);
          scanner.clear();
          scannerRef.current = null;
          onOpenChange(false);
        },
        (errorMessage) => {
          console.debug("Scan error:", errorMessage);
        }
      );

      scannerRef.current = scanner;
      setIsScanning(true);
    } catch (err) {
      console.error("Failed to initialize scanner:", err);
      setScanMode("usb");
    }
  }, [onScan, onOpenChange]);

  const cleanupScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (e) {
        console.debug("Scanner cleanup error:", e);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (open && scanMode === "camera") {
      const timer = setTimeout(initCameraScanner, 100);
      return () => {
        clearTimeout(timer);
        cleanupScanner();
      };
    } else {
      cleanupScanner();
    }
  }, [open, scanMode, initCameraScanner, cleanupScanner]);

  // Handle USB barcode scanner input (works like keyboard)
  useEffect(() => {
    if (!open) {
      setLastScannedCode("");
      return;
    }

    let buffer = "";
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // USB scanners type very fast and end with Enter
      if (e.key === "Enter" && buffer.length > 3) {
        e.preventDefault();
        setLastScannedCode(buffer);
        onScan(buffer);
        buffer = "";
        onOpenChange(false);
        return;
      }

      // Accumulate characters (ignore special keys)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        buffer += e.key;
        clearTimeout(timeout);
        // Clear buffer if no input for 100ms (USB scanners are faster)
        timeout = setTimeout(() => {
          buffer = "";
        }, 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeout);
    };
  }, [open, onScan, onOpenChange]);

  // Reset last scanned code when modal opens
  useEffect(() => {
    if (open) {
      setLastScannedCode("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) cleanupScanner();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === "bn" ? "বারকোড স্ক্যান" : "Scan Barcode"}
          </DialogTitle>
          <DialogDescription>
            {language === "bn"
              ? "USB স্ক্যানার বা ক্যামেরা ব্যবহার করুন"
              : "Use USB scanner or camera"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={scanMode === "usb" ? "default" : "outline"}
              size="sm"
              onClick={() => setScanMode("usb")}
              className="flex-1"
            >
              <Scan className="h-4 w-4 mr-2" />
              {language === "bn" ? "USB স্ক্যানার" : "USB Scanner"}
            </Button>
            <Button
              variant={scanMode === "camera" ? "default" : "outline"}
              size="sm"
              onClick={() => setScanMode("camera")}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              {language === "bn" ? "ক্যামেরা" : "Camera"}
            </Button>
          </div>

          {/* USB Scanner Mode */}
          {scanMode === "usb" && (
            <div className="space-y-4">
              {/* Animated Scanner Graphic */}
              <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8 flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-primary/30">
                {/* Scanning Animation */}
                <div className="relative">
                  <div className="w-24 h-16 border-4 border-primary/40 rounded-lg flex items-center justify-center">
                    <div className="flex gap-0.5">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-primary/60 rounded-full animate-pulse"
                          style={{
                            width: i % 3 === 0 ? "3px" : "2px",
                            height: `${20 + Math.random() * 20}px`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Scanning Line Animation */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <div className="absolute left-0 right-0 h-0.5 bg-red-500 animate-scan-line" />
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-lg font-medium text-foreground">
                    {language === "bn" ? "স্ক্যানার রেডি!" : "Scanner Ready!"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === "bn" 
                      ? "এখন আপনার USB বারকোড স্ক্যানার দিয়ে স্ক্যান করুন" 
                      : "Now scan with your USB barcode scanner"}
                  </p>
                </div>

                {/* Pulsing indicator */}
                <div className="absolute top-4 right-4">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
              </div>

              {/* How it works */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">
                  {language === "bn" ? "কিভাবে কাজ করে:" : "How it works:"}
                </p>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>{language === "bn" ? "USB স্ক্যানার কম্পিউটারে লাগান" : "Connect USB scanner to computer"}</li>
                  <li>{language === "bn" ? "পণ্যের বারকোডে স্ক্যানার পয়েন্ট করুন" : "Point scanner at product barcode"}</li>
                  <li>{language === "bn" ? "স্ক্যান করলে অটো পণ্য cart এ যোগ হবে" : "Scan and product auto-adds to cart"}</li>
                </ol>
              </div>
            </div>
          )}

          {/* Camera Scanner */}
          {scanMode === "camera" && (
            <div className="space-y-2">
              <div
                id="barcode-scanner-container"
                ref={containerRef}
                className="w-full min-h-[250px] bg-muted rounded-lg overflow-hidden"
              />
              <p className="text-xs text-muted-foreground text-center">
                {language === "bn"
                  ? "বারকোড ক্যামেরার সামনে ধরুন"
                  : "Hold the barcode in front of the camera"}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
