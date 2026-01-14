import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Printer,
  ShoppingCart,
  Trash2,
  Eye,
  RotateCcw,
  X,
  ScanBarcode,
  WifiOff
} from "lucide-react";
import { 
  generateSimplePrintHTML, 
  generateBetterPrintHTML,
} from "@/components/offline-shop/invoice-templates";
import { generateThermalReceiptHTML, ThermalReceiptPreview } from "@/components/offline-shop/thermal-receipt-template";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DeleteConfirmDialog } from "@/components/offline-shop/DeleteConfirmDialog";
import { BarcodeScanner } from "@/components/offline-shop/BarcodeScanner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { offlineShopService } from "@/services/offlineShopService";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShop } from "@/contexts/ShopContext";
import { useOfflineProducts, useOfflineSales, useOfflineSettings } from "@/hooks/useOfflineData";
import DateRangeFilter, { DateRangePreset, DateRange, getDateRangeFromPreset } from "@/components/offline-shop/DateRangeFilter";
import { isWithinInterval, format } from "date-fns";

interface Product {
  id: string;
  name: string;
  selling_price: number;
  purchase_price: number;
  stock_quantity: number;
  unit: string;
  barcode?: string;
}

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  purchase_price: number;
  discount: number;
  total: number;
}

interface ShopSettings {
  shop_name: string;
  branch_name?: string;
  shop_address: string;
  shop_phone: string;
  shop_email: string;
  currency: string;
  tax_rate: number;
  invoice_prefix: string;
  invoice_footer: string;
  logo_url?: string;
  terms_and_conditions?: string;
  invoice_format?: 'simple' | 'better';
  // Receipt/Invoice settings from Invoice Settings page
  receipt_size?: '80mm' | '58mm' | 'a4';
  receipt_font_size?: 'small' | 'medium' | 'large';
  show_logo_on_receipt?: boolean;
  thank_you_message?: string;
  show_tax_on_receipt?: boolean;
  show_payment_method?: boolean;
  receipt_header_text?: string;
  receipt_footer_text?: string;
}

interface Sale {
  id: string;
  invoice_number: string;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  paid_amount: number;
  due_amount: number;
  payment_method: string;
  payment_status: string;
  sale_date: string;
  notes?: string;
  customer?: { id?: string; name: string; phone?: string; email?: string; address?: string };
  items?: Array<{
    product_id?: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount: number;
    total: number;
  }>;
}

// Helper to extract customer info from sale (from linked customer or notes)
const getCustomerInfo = (sale: Sale): { name: string; phone?: string; email?: string; address?: string } => {
  if (sale.customer?.name) {
    return { 
      name: sale.customer.name, 
      phone: sale.customer.phone,
      email: sale.customer.email,
      address: sale.customer.address
    };
  }
  
  // Try to parse from notes (format: "Customer: Name (Phone)")
  if (sale.notes) {
    const match = sale.notes.match(/Customer:\s*(.+?)(?:\s*\((.+?)\))?$/);
    if (match) {
      return { name: match[1].trim(), phone: match[2]?.trim() };
    }
  }
  
  return { name: "" };
};

const ShopSales = () => {
  const { t, language } = useLanguage();
  const { currentShop } = useShop();
  
  // Date range filter state (needed before hooks for date filtering)
  const [dateRange, setDateRange] = useState<DateRangePreset>('this_month');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  
  // Calculate date range for hook
  const currentDateRange = useMemo(() => getDateRangeFromPreset(dateRange, customDateRange), [dateRange, customDateRange]);
  
  // Use offline-first hooks
  const { 
    sales, 
    loading: isLoading, 
    fromCache,
    isOnline,
    refetch: loadData,
    createSale: createOfflineSale,
    deleteSales: deleteOfflineSales,
  } = useOfflineSales(
    currentDateRange.from.toISOString().split('T')[0],
    currentDateRange.to.toISOString().split('T')[0]
  );
  
  const {
    products,
    refetch: refetchProducts,
  } = useOfflineProducts();
  
  const {
    settings: shopSettings,
  } = useOfflineSettings();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Return modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returningSale, setReturningSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<Array<{ product_id: string; product_name: string; max_qty: number; quantity: number; unit_price: number }>>([]);
  const [returnReason, setReturnReason] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number | "">("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSales.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSales.map((s) => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const result = await deleteOfflineSales(selectedIds);
      const deletedCount = result.deleted?.length || 0;
      toast.success(
        language === "bn"
          ? `${deletedCount}টি বিক্রয় ট্র্যাশে সরানো হয়েছে`
          : `${deletedCount} sale(s) moved to trash`
      );
      setSelectedIds([]);
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product_id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast.error(t("shop.noStock"));
        return;
      }
      setCart(
        cart.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unit_price - item.discount,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: product.selling_price,
          purchase_price: product.purchase_price,
          discount: 0,
          total: product.selling_price,
        },
      ]);
    }
  };

  // Handle barcode scan - find product and add to cart
  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      if (product.stock_quantity <= 0) {
        toast.error(language === "bn" ? "এই পণ্য স্টকে নেই" : "This product is out of stock");
        return;
      }
      addToCart(product);
      toast.success(language === "bn" ? `${product.name} যোগ করা হয়েছে` : `${product.name} added to cart`);
    } else {
      toast.error(language === "bn" ? "পণ্য পাওয়া যায়নি" : "Product not found with this barcode");
    }
  };

  const updateCartItem = (productId: string, field: string, value: number) => {
    setCart(
      cart.map((item) => {
        if (item.product_id === productId) {
          const updated = { ...item, [field]: value };
          updated.total = updated.quantity * updated.unit_price - updated.discount;
          return updated;
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = shopSettings?.tax_rate ? (subtotal * shopSettings.tax_rate) / 100 : 0;
  const discountValue = discount === "" ? 0 : discount;
  const discountAmount = discountType === "percent" ? (subtotal * discountValue) / 100 : discountValue;
  const total = subtotal + taxAmount - discountAmount;
  const paidValue = paidAmount === "" ? 0 : paidAmount;
  const dueAmount = total - (paidValue || total);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error(t("shop.noProductsInCart"));
      return;
    }

    try {
      const result = await createOfflineSale({
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        items: cart,
        discount: discountAmount,
        tax: taxAmount,
        paid_amount: paidValue || total,
        payment_method: paymentMethod,
      });

      toast.success(`${t("shop.saleComplete")} ${t("shop.invoice")}: ${result.sale?.invoice_number || 'OFFLINE'}`);
      
      // Create the sale object for viewing
      const newSale: Sale = {
        id: result.sale?.id || '',
        invoice_number: result.sale?.invoice_number || `OFF-${Date.now()}`,
        total,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        paid_amount: paidValue || total,
        due_amount: dueAmount,
        payment_method: paymentMethod,
        payment_status: dueAmount > 0 ? 'partial' : 'paid',
        sale_date: new Date().toISOString(),
        customer: customerName ? { name: customerName, phone: customerPhone } : undefined,
        items: cart.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          total: item.total
        }))
      };

      // Show the invoice immediately after sale - faster UX
      setViewingSale(newSale);
      setIsModalOpen(false);
      resetForm();
      
      // Refresh products to update stock (hook will auto-refresh)
      refetchProducts();
    } catch (error) {
      console.error("Sale error:", error);
      toast.error(t("shop.errorOccurred"));
    }
  };

  const resetForm = () => {
    setCart([]);
    setDiscount("");
    setDiscountType("fixed");
    setPaidAmount("");
    setPaymentMethod("cash");
    setCustomerName("");
    setCustomerPhone("");
    setSearchTerm("");
  };

  const handlePrint = () => {
    if (!viewingSale) return;
    const printWindow = window.open("", "", "width=800,height=600");
    const customerInfo = getCustomerInfo(viewingSale);
    
    const invoiceData = {
      sale: {
        invoice_number: viewingSale.invoice_number,
        sale_date: viewingSale.sale_date,
        items: viewingSale.items || [],
        subtotal: Number(viewingSale.subtotal),
        discount: Number(viewingSale.discount),
        tax: Number(viewingSale.tax),
        total: Number(viewingSale.total),
        paid_amount: Number(viewingSale.paid_amount),
        due_amount: Number(viewingSale.due_amount),
        payment_method: viewingSale.payment_method,
      },
      shopSettings: shopSettings,
      customerInfo: customerInfo,
      t: t,
    };

    // Use thermal receipt for 80mm/58mm, otherwise use regular invoice templates
    const receiptSize = (shopSettings as any)?.receipt_size || '80mm';
    let htmlContent: string;
    
    if (receiptSize === '80mm' || receiptSize === '58mm') {
      htmlContent = generateThermalReceiptHTML(invoiceData);
    } else if (shopSettings?.invoice_format === 'better') {
      htmlContent = generateBetterPrintHTML(invoiceData);
    } else {
      htmlContent = generateSimplePrintHTML(invoiceData);
    }
    
    printWindow?.document.write(htmlContent);
    printWindow?.document.close();
    printWindow?.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: shopSettings?.currency || "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredProducts = products.filter(p => 
    p.stock_quantity > 0 && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter sales by date range (already filtered by hook, but apply local filtering too)
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.sale_date);
    return isWithinInterval(saleDate, { start: currentDateRange.from, end: currentDateRange.to });
  });

  const handleDateRangeChange = (range: DateRangePreset, dates: DateRange) => {
    setDateRange(range);
    if (range === 'custom') {
      setCustomDateRange(dates);
    }
  };

  // Open return modal for a sale
  const openReturnModal = (sale: Sale) => {
    setReturningSale(sale);
    // Initialize return items from sale items
    const items = (sale.items || []).map(item => ({
      product_id: (item as any).product_id || "",
      product_name: item.product_name,
      max_qty: item.quantity,
      quantity: 0,
      unit_price: item.unit_price,
    }));
    setReturnItems(items);
    setReturnReason("");
    setReturnNotes("");
    setIsReturnModalOpen(true);
  };

  // Update return item quantity
  const updateReturnQuantity = (productId: string, quantity: number) => {
    setReturnItems(items =>
      items.map(item =>
        item.product_id === productId
          ? { ...item, quantity: Math.min(Math.max(0, quantity), item.max_qty) }
          : item
      )
    );
  };

  // Calculate total refund
  const totalRefund = returnItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  // Process return
  const handleProcessReturn = async () => {
    if (!returningSale) return;

    const itemsToReturn = returnItems.filter(item => item.quantity > 0);
    if (itemsToReturn.length === 0) {
      toast.error(t("shop.selectAtLeastOne"));
      return;
    }

    setIsProcessingReturn(true);
    try {
      const result = await offlineShopService.processReturn({
        sale_id: returningSale.id,
        items: itemsToReturn.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        refund_amount: totalRefund,
        reason: returnReason,
        notes: returnNotes,
      });

      toast.success(`${t("shop.returnComplete")} ${t("shop.invoice")}: ${result.return_invoice}`);
      setIsReturnModalOpen(false);
      setReturningSale(null);
      loadData();
    } catch (error) {
      console.error("Return error:", error);
      toast.error(t("shop.errorOccurred"));
    } finally {
      setIsProcessingReturn(false);
    }
  };

  return (
    <ShopLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-start gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{t("shop.salesTitle")}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("shop.salesDesc")} • {filteredSales.length} {language === "bn" ? "টি বিক্রয়" : "sales"}
                  {selectedIds.length > 0 && ` • ${selectedIds.length} ${language === "bn" ? "টি নির্বাচিত" : "selected"}`}
                </p>
              </div>
              {(fromCache || !isOnline) && (
                <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950 flex items-center gap-1 shrink-0">
                  <WifiOff className="h-3 w-3" />
                  {t('offline.usingCache')}
                </Badge>
              )}
            </div>
            <DateRangeFilter
              selectedRange={dateRange}
              onRangeChange={handleDateRangeChange}
              customDateRange={customDateRange}
              compact
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedIds.length > 0 && (
              <Button variant="destructive" disabled={isBulkDeleting} onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                {language === "bn" ? "মুছুন" : "Delete"} ({selectedIds.length})
              </Button>
            )}
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("shop.newSale")}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsModalOpen(true);
                // Small delay to ensure modal is open before starting scanner
                setTimeout(() => setScannerOpen(true), 100);
              }}
            >
              <ScanBarcode className="h-4 w-4 mr-2" />
              {language === "bn" ? "স্ক্যান" : "Scan"}
            </Button>
          </div>
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={() => {
              handleBulkDelete();
              setDeleteDialogOpen(false);
            }}
            title={language === "en" ? "sales" : "বিক্রয়"}
            itemCount={selectedIds.length}
            isSoftDelete={true}
            isLoading={isBulkDeleting}
          />
        </div>


        {/* Sales Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 p-2">
                    <Checkbox
                      checked={sales.length > 0 && selectedIds.length === sales.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("shop.invoice")}</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">{t("shop.customer")}</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">{t("shop.date")}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("shop.total")}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("common.due")}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("shop.status")}</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm w-20">{t("shop.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      {t("common.loading")}
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p>{t("shop.noSales")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id} className={selectedIds.includes(sale.id) ? "bg-muted/50" : ""}>
                      <TableCell className="p-2">
                        <Checkbox
                          checked={selectedIds.includes(sale.id)}
                          onCheckedChange={() => toggleSelectOne(sale.id)}
                        />
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <div>
                          <p className="font-medium text-xs sm:text-sm">{sale.invoice_number}</p>
                          <p className="text-[10px] text-muted-foreground sm:hidden truncate max-w-[80px]">
                            {getCustomerInfo(sale).name || t("shop.walkInCustomer")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4 hidden sm:table-cell">
                        <div className="max-w-[100px]">
                          <p className="font-medium text-xs sm:text-sm truncate">
                            {getCustomerInfo(sale).name || t("shop.walkInCustomer")}
                          </p>
                          {getCustomerInfo(sale).phone && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {getCustomerInfo(sale).phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4 hidden md:table-cell text-xs sm:text-sm">{formatDate(sale.sale_date)}</TableCell>
                      <TableCell className="p-2 sm:p-4 text-xs sm:text-sm font-medium whitespace-nowrap">{formatCurrency(Number(sale.total))}</TableCell>
                      <TableCell className={`p-2 sm:p-4 text-xs sm:text-sm whitespace-nowrap ${Number(sale.due_amount) > 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        {formatCurrency(Number(sale.due_amount || 0))}
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <Badge 
                          variant={sale.payment_status === "paid" ? "default" : Number(sale.due_amount) > 0 ? "destructive" : "secondary"}
                          className="text-[10px] sm:text-xs"
                        >
                          {sale.payment_status === "paid" ? t("common.paid") : t("common.due")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => setViewingSale(sale)}
                            title={t("shop.view")}
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => openReturnModal(sale)}
                            title={t("shop.return")}
                          >
                            <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* New Sale Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("shop.newSale")}</DialogTitle>
            <DialogDescription>{t("shop.selectProductComplete")}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Products */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("shop.searchProducts")}</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setScannerOpen(true)}
                    className="gap-2"
                  >
                    <ScanBarcode className="h-4 w-4" />
                    {language === "bn" ? "স্ক্যান" : "Scan"}
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("shop.searchProducts")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">
                    {language === "bn" ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}
                  </p>
                ) : (
                  <div className="divide-y">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => addToCart(product)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("shop.stock")}: {product.stock_quantity} {product.unit || "pcs"}
                          </p>
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          <p className="font-semibold text-sm text-primary">
                            {formatCurrency(product.selling_price)}
                          </p>
                          <Plus className="h-4 w-4 text-muted-foreground ml-auto" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart */}
            <div className="space-y-4">
              <Label>{t("shop.cart")} ({cart.length} {t("shop.item")})</Label>
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t("shop.cartEmpty")}</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.unit_price)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateCartItem(item.product_id, "quantity", parseInt(e.target.value) || 1)
                          }
                          className="w-16 h-8"
                          min={1}
                        />
                        <p className="font-medium w-20 text-right">{formatCurrency(item.total)}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFromCart(item.product_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("shop.customerNameOptional")}</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t("shop.name")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("shop.phoneOptional")}</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("shop.discount")}</Label>
                  <div className="flex gap-2">
                    <Select value={discountType} onValueChange={(v) => setDiscountType(v as "fixed" | "percent")}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">{shopSettings?.currency || "BDT"}</SelectItem>
                        <SelectItem value="percent">%</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDiscount(val === "" ? "" : parseFloat(val) || 0);
                      }}
                      className="flex-1"
                      min={0}
                      max={discountType === "percent" ? 100 : undefined}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("shop.paymentMethod")}</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{t("shop.cashPayment")}</SelectItem>
                      <SelectItem value="bkash">{t("shop.bkash")}</SelectItem>
                      <SelectItem value="nagad">{t("shop.nagad")}</SelectItem>
                      <SelectItem value="card">{t("shop.card")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("shop.paidAmount")}</Label>
                <Input
                  type="number"
                  value={paidAmount === "" ? "" : (paidAmount || total)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPaidAmount(val === "" ? "" : parseFloat(val) || 0);
                  }}
                />
              </div>

              {/* Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>{t("shop.subtotal")}:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {shopSettings?.tax_rate ? (
                  <div className="flex justify-between">
                    <span>{t("shop.tax")} ({shopSettings.tax_rate}%):</span>
                    <span>+{formatCurrency(taxAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span>{t("shop.discount")}{discountType === "percent" ? ` (${discount}%)` : ""}:</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>{t("shop.total")}:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {paidValue > 0 && paidValue < total && (
                  <div className="flex justify-between text-destructive">
                    <span>{t("common.due")}:</span>
                    <span>{formatCurrency(total - paidValue)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={cart.length === 0}>
              {t("shop.completeSale")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Print Invoice Modal - Uses Thermal Receipt Preview from Invoice Settings */}
      <Dialog open={!!viewingSale} onOpenChange={() => setViewingSale(null)}>
        <DialogContent className="max-w-md max-h-[95vh] overflow-auto p-4">
          {viewingSale && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <ThermalReceiptPreview
                  sale={{
                    invoice_number: viewingSale.invoice_number,
                    sale_date: viewingSale.sale_date,
                    items: viewingSale.items || [],
                    subtotal: Number(viewingSale.subtotal),
                    discount: Number(viewingSale.discount),
                    tax: Number(viewingSale.tax),
                    total: Number(viewingSale.total),
                    paid_amount: Number(viewingSale.paid_amount),
                    due_amount: Number(viewingSale.due_amount),
                    payment_method: viewingSale.payment_method,
                  }}
                  shopSettings={{
                    shop_name: shopSettings?.shop_name || '',
                    shop_address: shopSettings?.shop_address || '',
                    shop_phone: shopSettings?.shop_phone || '',
                    shop_email: shopSettings?.shop_email || '',
                    currency: shopSettings?.currency || 'BDT',
                    logo_url: shopSettings?.logo_url,
                    receipt_size: (shopSettings as any)?.receipt_size || '80mm',
                    receipt_font_size: (shopSettings as any)?.receipt_font_size || 'small',
                    show_logo_on_receipt: (shopSettings as any)?.show_logo_on_receipt ?? true,
                    thank_you_message: (shopSettings as any)?.thank_you_message || (language === 'bn' ? 'ধন্যবাদ! আবার আসবেন' : 'Thank you! Please Come Again'),
                    show_tax_on_receipt: (shopSettings as any)?.show_tax_on_receipt ?? true,
                    show_payment_method: (shopSettings as any)?.show_payment_method ?? true,
                    receipt_header_text: (shopSettings as any)?.receipt_header_text,
                    receipt_footer_text: (shopSettings as any)?.receipt_footer_text,
                    tax_rate: shopSettings?.tax_rate,
                    invoice_format: shopSettings?.invoice_format,
                  }}
                  customerInfo={getCustomerInfo(viewingSale)}
                  t={t}
                  previewScale={1.5}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setViewingSale(null)}>
                  {t("shop.close")}
                </Button>
                <Button size="sm" onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  {t("shop.print")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Modal */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("shop.productReturn")}</DialogTitle>
            <DialogDescription>
              {returningSale && `${t("shop.invoice")}: ${returningSale.invoice_number}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Return Items */}
            <div className="space-y-2">
              <Label>{t("shop.selectReturnItems")}</Label>
              <div className="border rounded-md divide-y max-h-[250px] overflow-y-auto">
                {returnItems.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between p-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("shop.max")}: {item.max_qty} | {t("shop.price")}: {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateReturnQuantity(item.product_id, parseInt(e.target.value) || 0)}
                        className="w-20 h-8"
                        min={0}
                        max={item.max_qty}
                      />
                      <p className="text-sm font-medium w-24 text-right">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>{t("shop.returnReason")}</Label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger>
                  <SelectValue placeholder={t("shop.selectReason")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defective">{t("shop.defective")}</SelectItem>
                  <SelectItem value="wrong_item">{t("shop.wrongItem")}</SelectItem>
                  <SelectItem value="not_satisfied">{t("shop.notSatisfied")}</SelectItem>
                  <SelectItem value="size_issue">{t("shop.sizeIssue")}</SelectItem>
                  <SelectItem value="other">{t("shop.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>{t("shop.notesOptional")}</Label>
              <Input
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder={t("shop.notes")}
              />
            </div>

            {/* Total Refund */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t("shop.totalRefund")}:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(totalRefund)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button 
              onClick={handleProcessReturn} 
              disabled={isProcessingReturn || totalRefund === 0}
            >
              {isProcessingReturn ? t("common.loading") : t("shop.confirmReturn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
      />
    </ShopLayout>
  );
};

export default ShopSales;
