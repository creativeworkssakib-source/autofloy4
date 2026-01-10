import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Scan, 
  Usb, 
  Monitor, 
  CheckCircle2, 
  ArrowRight,
  ShoppingCart,
  Printer,
  Barcode
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ScannerSetupGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScannerSetupGuide({ open, onOpenChange }: ScannerSetupGuideProps) {
  const { language } = useLanguage();
  const [activeStep, setActiveStep] = useState(0);

  const steps = language === "bn" ? [
    {
      title: "USB স্ক্যানার কিনুন",
      description: "যেকোনো সুপারশপ বা অনলাইনে USB বারকোড স্ক্যানার কিনতে পারবেন। দাম ৫০০-২০০০ টাকা।",
      icon: Scan,
      tips: [
        "Honeywell, Symbol, বা Zebra ব্র্যান্ড ভালো",
        "Laser বা 2D স্ক্যানার দুটোই কাজ করবে",
        "USB ক্যাবল যুক্ত স্ক্যানার কিনুন"
      ]
    },
    {
      title: "কম্পিউটারে লাগান",
      description: "USB স্ক্যানার কম্পিউটারের USB পোর্টে লাগান। কোনো সফটওয়্যার ইনস্টল লাগবে না।",
      icon: Usb,
      tips: [
        "Plug & Play - এমনিতেই কাজ করবে",
        "কোনো ড্রাইভার দরকার নেই",
        "স্ক্যানার লাগানোর পর লাইট জ্বলবে"
      ]
    },
    {
      title: "বারকোড প্রিন্ট করুন",
      description: "Products পেজ থেকে বারকোড তৈরি করে স্টিকার প্রিন্ট করুন।",
      icon: Printer,
      tips: [
        "'বারকোড তৈরি করুন' বাটন চাপুন",
        "প্রোডাক্ট সিলেক্ট করে প্রিন্ট করুন",
        "স্টিকার পেপারে প্রিন্ট করে প্রোডাক্টে লাগান"
      ]
    },
    {
      title: "বিক্রয়ের সময় স্ক্যান করুন",
      description: "New Sale মোডালে 'স্ক্যান' বাটন চাপুন এবং USB স্ক্যানার দিয়ে বারকোড স্ক্যান করুন।",
      icon: ShoppingCart,
      tips: [
        "স্ক্যান করলে প্রোডাক্ট অটো cart এ যোগ হবে",
        "একই প্রোডাক্ট বারবার স্ক্যান করলে quantity বাড়বে",
        "সুপারশপের মতো দ্রুত বিক্রয় করুন!"
      ]
    }
  ] : [
    {
      title: "Buy USB Scanner",
      description: "Purchase a USB barcode scanner from any electronics store or online. Price: $5-$30.",
      icon: Scan,
      tips: [
        "Honeywell, Symbol, or Zebra brands work well",
        "Both Laser and 2D scanners work",
        "Get one with USB cable"
      ]
    },
    {
      title: "Connect to Computer",
      description: "Plug the USB scanner into your computer's USB port. No software installation needed.",
      icon: Usb,
      tips: [
        "Plug & Play - works automatically",
        "No drivers needed",
        "Light will turn on when connected"
      ]
    },
    {
      title: "Print Barcodes",
      description: "Generate and print barcodes from the Products page.",
      icon: Printer,
      tips: [
        "Click 'Generate Barcodes' button",
        "Select products and print",
        "Print on sticker paper and attach to products"
      ]
    },
    {
      title: "Scan During Sale",
      description: "Click 'Scan' button in New Sale modal and scan barcodes with your USB scanner.",
      icon: ShoppingCart,
      tips: [
        "Product auto-adds to cart on scan",
        "Scanning same product increases quantity",
        "Fast checkout like supermarkets!"
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            {language === "bn" ? "USB বারকোড স্ক্যানার সেটআপ" : "USB Barcode Scanner Setup"}
          </DialogTitle>
          <DialogDescription>
            {language === "bn" 
              ? "সুপারশপের মতো বারকোড স্ক্যান করে দ্রুত বিক্রয় করুন" 
              : "Scan barcodes like supermarkets for fast checkout"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-between px-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <button
                  onClick={() => setActiveStep(index)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    index === activeStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : index < activeStep
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {index < activeStep ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-1 ${
                    index < activeStep ? "bg-green-500" : "bg-muted-foreground/30"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Active step content */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
            <div className="flex items-start gap-4">
              <div className="bg-primary/20 rounded-xl p-4">
                {(() => {
                  const StepIcon = steps[activeStep].icon;
                  return <StepIcon className="h-8 w-8 text-primary" />;
                })()}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  {steps[activeStep].title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {steps[activeStep].description}
                </p>
                
                <div className="space-y-2">
                  {steps[activeStep].tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
            >
              {language === "bn" ? "আগের ধাপ" : "Previous"}
            </Button>
            
            {activeStep < steps.length - 1 ? (
              <Button
                onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
                className="gap-2"
              >
                {language === "bn" ? "পরের ধাপ" : "Next Step"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => onOpenChange(false)} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {language === "bn" ? "বুঝেছি" : "Got it!"}
              </Button>
            )}
          </div>

          {/* Quick info */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
            <Badge variant="secondary" className="shrink-0">
              {language === "bn" ? "টিপস" : "Tip"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {language === "bn" 
                ? "USB স্ক্যানার keyboard এর মতো কাজ করে - স্ক্যান করলে বারকোড নম্বর টাইপ করে Enter চাপে। তাই কোনো সফটওয়্যার লাগে না!" 
                : "USB scanners work like keyboards - they type the barcode number and press Enter. No special software needed!"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
