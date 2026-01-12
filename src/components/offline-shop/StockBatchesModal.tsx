import { useState, useEffect, forwardRef } from "react";
import { Package, Calendar, AlertCircle, Layers, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { offlineShopService } from "@/services/offlineShopService";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

interface StockBatch {
  id: string;
  product_id: string;
  quantity: number;
  remaining_quantity: number;
  unit_cost: number;
  batch_date: string;
  expiry_date?: string;
  is_initial_batch: boolean;
  notes?: string;
}

interface StockBatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    stock_quantity: number;
    purchase_price: number;
    average_cost?: number;
    selling_price: number;
  } | null;
}

const StockBatchesModal = forwardRef<HTMLDivElement, StockBatchesModalProps>(({ isOpen, onClose, product }, ref) => {
  const { language } = useLanguage();
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      loadBatches();
    }
  }, [isOpen, product]);

  const loadBatches = async () => {
    if (!product) return;
    setIsLoading(true);
    try {
      const result = await offlineShopService.getStockBatches(product.id);
      setBatches(result.batches || []);
    } catch (error) {
      console.error("Failed to load batches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const totalRemainingQty = batches.reduce((sum, b) => sum + b.remaining_quantity, 0);
  const totalRemainingValue = batches.reduce((sum, b) => sum + (b.remaining_quantity * b.unit_cost), 0);
  const calculatedAvgCost = totalRemainingQty > 0 ? totalRemainingValue / totalRemainingQty : 0;

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {language === "bn" ? "স্টক ব্যাচ" : "Stock Batches"}
          </DialogTitle>
          <DialogDescription>
            {product.name} - {language === "bn" ? "প্রতিটি ব্যাচের বিস্তারিত তথ্য" : "Details of each stock batch"}
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-b">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">
              {language === "bn" ? "মোট স্টক" : "Total Stock"}
            </div>
            <div className="text-lg font-bold">{totalRemainingQty}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">
              {language === "bn" ? "গড় খরচ" : "Avg. Cost"}
            </div>
            <div className="text-lg font-bold text-primary">
              {formatCurrency(product.average_cost || calculatedAvgCost)}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">
              {language === "bn" ? "বিক্রয় মূল্য" : "Sell Price"}
            </div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(product.selling_price)}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">
              {language === "bn" ? "স্টক মূল্য" : "Stock Value"}
            </div>
            <div className="text-lg font-bold">
              {formatCurrency(totalRemainingValue)}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {language === "bn" ? "কোন ব্যাচ নেই" : "No batches found"}
              </p>
              <p className="text-sm">
                {language === "bn"
                  ? "এই প্রোডাক্টের জন্য কোন স্টক ব্যাচ রেকর্ড করা হয়নি"
                  : "No stock batches have been recorded for this product"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>{language === "bn" ? "তারিখ" : "Date"}</TableHead>
                  <TableHead className="text-right">{language === "bn" ? "ইউনিট খরচ" : "Unit Cost"}</TableHead>
                  <TableHead className="text-right">{language === "bn" ? "মূল পরিমাণ" : "Original Qty"}</TableHead>
                  <TableHead className="text-right">{language === "bn" ? "বাকি" : "Remaining"}</TableHead>
                  <TableHead>{language === "bn" ? "মেয়াদ" : "Expiry"}</TableHead>
                  <TableHead>{language === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch, index) => (
                  <TableRow key={batch.id} className={batch.remaining_quantity === 0 ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(batch.batch_date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(batch.unit_cost)}
                    </TableCell>
                    <TableCell className="text-right">{batch.quantity}</TableCell>
                    <TableCell className="text-right font-bold">
                      {batch.remaining_quantity}
                    </TableCell>
                    <TableCell>
                      {batch.expiry_date ? (
                        <div className="flex items-center gap-1">
                          {isExpired(batch.expiry_date) ? (
                            <Badge variant="destructive" className="text-xs">
                              {language === "bn" ? "মেয়াদ শেষ" : "Expired"}
                            </Badge>
                          ) : isExpiringSoon(batch.expiry_date) ? (
                            <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {formatDate(batch.expiry_date)}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {formatDate(batch.expiry_date)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {batch.remaining_quantity === 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          {language === "bn" ? "শেষ" : "Depleted"}
                        </Badge>
                      ) : batch.is_initial_batch ? (
                        <Badge variant="outline" className="text-xs">
                          {language === "bn" ? "প্রাথমিক" : "Initial"}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs bg-green-600">
                          {language === "bn" ? "সক্রিয়" : "Active"}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {/* FIFO Explanation */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 mt-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <span className="font-medium">FIFO (First In, First Out):</span>{" "}
              {language === "bn"
                ? "বিক্রির সময় সবচেয়ে পুরানো ব্যাচ থেকে প্রথমে স্টক কাটা হয়। এতে সঠিক লাভ গণনা এবং মেয়াদ ম্যানেজমেন্ট সহজ হয়।"
                : "When selling, stock is deducted from the oldest batch first. This ensures accurate profit calculation and better expiry management."}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

StockBatchesModal.displayName = "StockBatchesModal";

export default StockBatchesModal;
