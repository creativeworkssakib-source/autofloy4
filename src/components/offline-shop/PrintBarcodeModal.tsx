import { useState, useRef } from "react";
import Barcode from "react-barcode";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProductForPrint {
  id: string;
  name: string;
  barcode: string;
  selling_price: number;
}

interface PrintBarcodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductForPrint[];
  currency?: string;
}

const sizePresets = {
  small: { width: 1, height: 30, fontSize: 8, label: { en: "Small (30x20mm)", bn: "ছোট (30x20mm)" } },
  medium: { width: 1.3, height: 40, fontSize: 10, label: { en: "Medium (50x30mm)", bn: "মাঝারি (50x30mm)" } },
  large: { width: 1.8, height: 60, fontSize: 12, label: { en: "Large (70x40mm)", bn: "বড় (70x40mm)" } },
};

export function PrintBarcodeModal({
  open,
  onOpenChange,
  products,
  currency = "BDT",
}: PrintBarcodeModalProps) {
  const { language } = useLanguage();
  const [size, setSize] = useState<"small" | "medium" | "large">("medium");
  const [showName, setShowName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [copiesPerProduct, setCopiesPerProduct] = useState(1);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const config = sizePresets[size];

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) return;

    const barcodeItems = products.flatMap((product) =>
      Array.from({ length: copiesPerProduct }, () => product)
    );

    const barcodeHTML = barcodeItems
      .map(
        (product) => `
        <div class="barcode-item">
          ${showName ? `<div class="product-name">${product.name}</div>` : ""}
          <svg id="barcode-${product.id}-${Math.random()}"></svg>
          <div class="barcode-number">${product.barcode}</div>
          ${showPrice ? `<div class="product-price">${formatPrice(product.selling_price)}</div>` : ""}
        </div>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcodes</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              padding: 10mm;
            }
            .barcode-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 5mm;
              justify-content: flex-start;
            }
            .barcode-item {
              text-align: center;
              padding: 3mm;
              border: 1px dashed #ccc;
              break-inside: avoid;
            }
            .product-name {
              font-size: ${config.fontSize}px;
              font-weight: 600;
              margin-bottom: 2px;
              max-width: 100px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .barcode-number {
              font-size: ${config.fontSize - 2}px;
              font-family: monospace;
            }
            .product-price {
              font-size: ${config.fontSize - 1}px;
              color: #333;
              font-weight: 500;
              margin-top: 2px;
            }
            @media print {
              @page { margin: 5mm; }
              .barcode-item { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-grid">
            ${barcodeHTML}
          </div>
          <script>
            document.querySelectorAll('svg[id^="barcode-"]').forEach((svg, index) => {
              const products = ${JSON.stringify(barcodeItems)};
              const product = products[index];
              if (product && product.barcode) {
                JsBarcode(svg, product.barcode, {
                  width: ${config.width},
                  height: ${config.height},
                  displayValue: false,
                  margin: 2
                });
              }
            });
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const validProducts = products.filter((p) => p.barcode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {language === "bn" ? "বারকোড প্রিন্ট করুন" : "Print Barcodes"}
          </DialogTitle>
          <DialogDescription>
            {language === "bn"
              ? `${validProducts.length}টি প্রোডাক্টের বারকোড প্রিন্ট করুন`
              : `Print barcodes for ${validProducts.length} product(s)`}
          </DialogDescription>
        </DialogHeader>

        {validProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === "bn"
              ? "নির্বাচিত প্রোডাক্টে কোনো বারকোড নেই"
              : "No barcodes found for selected products"}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="border rounded-lg p-4 bg-muted/30" ref={printContainerRef}>
              <div className="flex flex-wrap gap-3 justify-center">
                {validProducts.slice(0, 3).map((product) => (
                  <div
                    key={product.id}
                    className="bg-white p-2 rounded shadow-sm text-center"
                  >
                    {showName && (
                      <p
                        className="font-medium truncate max-w-[100px]"
                        style={{ fontSize: config.fontSize }}
                      >
                        {product.name}
                      </p>
                    )}
                    <Barcode
                      value={product.barcode}
                      width={config.width}
                      height={config.height}
                      fontSize={config.fontSize}
                      displayValue={true}
                      margin={2}
                    />
                    {showPrice && (
                      <p style={{ fontSize: config.fontSize - 1 }} className="font-medium">
                        {formatPrice(product.selling_price)}
                      </p>
                    )}
                  </div>
                ))}
                {validProducts.length > 3 && (
                  <div className="flex items-center text-muted-foreground text-sm">
                    +{validProducts.length - 3} {language === "bn" ? "আরো" : "more"}
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "সাইজ" : "Size"}</Label>
                <Select value={size} onValueChange={(v) => setSize(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sizePresets).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        {preset.label[language]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === "bn" ? "কপি সংখ্যা" : "Copies"}</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={copiesPerProduct}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCopiesPerProduct(val === "" ? 1 : parseInt(val) || 1);
                  }}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showName"
                  checked={showName}
                  onCheckedChange={(checked) => setShowName(!!checked)}
                />
                <Label htmlFor="showName" className="cursor-pointer">
                  {language === "bn" ? "নাম দেখান" : "Show Name"}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="showPrice"
                  checked={showPrice}
                  onCheckedChange={(checked) => setShowPrice(!!checked)}
                />
                <Label htmlFor="showPrice" className="cursor-pointer">
                  {language === "bn" ? "দাম দেখান" : "Show Price"}
                </Label>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "bn" ? "বাতিল" : "Cancel"}
          </Button>
          <Button onClick={handlePrint} disabled={validProducts.length === 0}>
            <Printer className="h-4 w-4 mr-2" />
            {language === "bn" ? "প্রিন্ট করুন" : "Print"} ({validProducts.length * copiesPerProduct})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
