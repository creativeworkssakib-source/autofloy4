import { useRef } from "react";
import Barcode from "react-barcode";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BarcodeGeneratorProps {
  value: string;
  productName?: string;
  price?: number;
  currency?: string;
  showPrintButton?: boolean;
  size?: "small" | "medium" | "large";
  showName?: boolean;
  showPrice?: boolean;
}

const sizeConfig = {
  small: { width: 1.2, height: 40, fontSize: 10 },
  medium: { width: 1.5, height: 50, fontSize: 12 },
  large: { width: 2, height: 70, fontSize: 14 },
};

export function BarcodeGenerator({
  value,
  productName,
  price,
  currency = "BDT",
  showPrintButton = false,
  size = "medium",
  showName = true,
  showPrice = true,
}: BarcodeGeneratorProps) {
  const { language } = useLanguage();
  const barcodeRef = useRef<HTMLDivElement>(null);
  const config = sizeConfig[size];

  const handlePrint = () => {
    if (!barcodeRef.current) return;

    const printWindow = window.open("", "", "width=400,height=300");
    if (!printWindow) return;

    const formatPrice = (amount: number) => {
      return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
      }).format(amount);
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode - ${productName || value}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .barcode-container {
              text-align: center;
              padding: 10px;
            }
            .product-name {
              font-size: ${config.fontSize}px;
              font-weight: 600;
              margin-bottom: 5px;
              max-width: 150px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .product-price {
              font-size: ${config.fontSize - 2}px;
              color: #666;
              margin-top: 3px;
            }
            @media print {
              @page { margin: 0; }
              body { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            ${showName && productName ? `<div class="product-name">${productName}</div>` : ""}
            ${barcodeRef.current.innerHTML}
            ${showPrice && price ? `<div class="product-price">${formatPrice(price)}</div>` : ""}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!value) {
    return (
      <div className="text-center text-muted-foreground text-sm p-4">
        {language === "bn" ? "বারকোড নেই" : "No barcode"}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={barcodeRef} className="bg-white p-2 rounded">
        <Barcode
          value={value}
          width={config.width}
          height={config.height}
          fontSize={config.fontSize}
          margin={5}
          displayValue={true}
        />
      </div>
      
      {showPrintButton && (
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          {language === "bn" ? "প্রিন্ট" : "Print"}
        </Button>
      )}
    </div>
  );
}
