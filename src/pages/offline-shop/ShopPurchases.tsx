import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, PackagePlus, Eye, Upload, FileSpreadsheet, Check, X, Loader2, Search, Calendar, Trash2, CheckSquare, Square, CreditCard, History, RotateCcw, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DeleteConfirmDialog } from "@/components/offline-shop/DeleteConfirmDialog";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import AddToStockModal, { PurchasedProduct } from "@/components/offline-shop/AddToStockModal";
import { offlineShopService } from "@/services/offlineShopService";
import { offlineDataService } from "@/services/offlineDataService";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShop } from "@/contexts/ShopContext";
import * as XLSX from "xlsx";

interface Product {
  id: string;
  name: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
}

interface PurchaseItem {
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  selling_price: number;
  total: number;
  expiry_date?: string;
  isNew?: boolean;
}

interface Purchase {
  id: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_contact?: string;
  purchase_date: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  items?: PurchaseItem[];
}

interface PurchasePayment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes?: string;
}

interface ImportProgress {
  total: number;
  current: number;
  success: number;
  failed: number;
  currentProduct: string;
  errors: string[];
}

interface TrashItem {
  id: string;
  original_table: string;
  original_id: string;
  data: any;
  deleted_at: string;
  expires_at: string;
}

const ShopPurchases = () => {
  const { t, language } = useLanguage();
  const { currentShop } = useShop();
  const [searchParams] = useSearchParams();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openedFromSupplierParamRef = useRef(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);


  // Payment modal states
  const [paymentPurchase, setPaymentPurchase] = useState<Purchase | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PurchasePayment[]>([]);

  // Trash bin states
  const [showTrash, setShowTrash] = useState(false);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);

  // Add to Stock modal states
  const [isAddToStockModalOpen, setIsAddToStockModalOpen] = useState(false);
  const [productsToAddToStock, setProductsToAddToStock] = useState<PurchasedProduct[]>([]);

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string; company_name?: string; phone?: string; }[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [purchasesRes, productsRes, suppliersRes] = await Promise.all([
        offlineShopService.getPurchases(),
        offlineShopService.getProducts(),
        offlineShopService.getSuppliers(),
      ]);
      setPurchases(purchasesRes.purchases || []);
      setProducts(productsRes.products || []);
      setSuppliers(suppliersRes.suppliers || []);
    } catch (error) {
      toast.error(t("shop.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentShop?.id]);

  useEffect(() => {
    const supplierParam = searchParams.get("supplier");
    if (!supplierParam) return;

    const selected = suppliers.find((s) => s.id === supplierParam);
    if (selected) {
      setSupplierId(selected.id);
      setSupplierName(selected.name);
      setSupplierContact(selected.phone || "");
    }

    if (!openedFromSupplierParamRef.current) {
      openedFromSupplierParamRef.current = true;
      setIsModalOpen(true);
    }
  }, [searchParams, suppliers]);

  // Load trash items
  const loadTrash = async () => {
    setIsLoadingTrash(true);
    try {
      const res = await offlineShopService.getTrash("shop_purchases");
      setTrashItems(res.trash || []);
    } catch (error) {
      console.error("Failed to load trash:", error);
    } finally {
      setIsLoadingTrash(false);
    }
  };

  // Load payment history for a purchase
  const loadPaymentHistory = async (purchaseId: string) => {
    try {
      const res = await offlineShopService.getPurchasePayments(purchaseId);
      setPaymentHistory(res.payments || []);
    } catch (error) {
      console.error("Failed to load payment history:", error);
    }
  };

  // Handle adding a payment
  const handleAddPayment = async () => {
    if (!paymentPurchase || paymentAmount <= 0) return;
    
    setIsProcessingPayment(true);
    try {
      await offlineShopService.addPurchasePayment(
        paymentPurchase.id,
        paymentAmount,
        paymentMethod,
        paymentNotes
      );
      toast.success(language === "bn" ? "পেমেন্ট যোগ হয়েছে" : "Payment added");
      setPaymentPurchase(null);
      setPaymentAmount(0);
      setPaymentNotes("");
      loadData();
    } catch (error) {
      toast.error(language === "bn" ? "পেমেন্ট ব্যর্থ হয়েছে" : "Payment failed");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Open payment modal
  const openPaymentModal = async (purchase: Purchase) => {
    setPaymentPurchase(purchase);
    setPaymentAmount(Number(purchase.due_amount) || 0);
    await loadPaymentHistory(purchase.id);
  };

  // Restore from trash
  const handleRestore = async (id: string) => {
    try {
      await offlineShopService.restoreFromTrash(id);
      toast.success(language === "bn" ? "রিস্টোর হয়েছে" : "Restored successfully");
      loadTrash();
      loadData();
    } catch (error) {
      toast.error(language === "bn" ? "রিস্টোর ব্যর্থ হয়েছে" : "Restore failed");
    }
  };

  // Permanent delete
  const handlePermanentDelete = async (id: string) => {
    try {
      await offlineShopService.permanentDelete(id);
      toast.success(language === "bn" ? "স্থায়ীভাবে মুছে ফেলা হয়েছে" : "Permanently deleted");
      loadTrash();
    } catch (error) {
      toast.error(language === "bn" ? "মুছে ফেলা যায়নি" : "Delete failed");
    }
  };

  // Load all purchased products that don't have product_id (not yet in stock)
  const loadProductsForStock = async () => {
    const allProducts: PurchasedProduct[] = [];
    
    for (const purchase of purchases) {
      if (purchase.items) {
        for (const item of purchase.items) {
          // Only include items without product_id (new products not in stock)
          if (!item.product_id) {
            // Check if already in allProducts (aggregate by name)
            const existing = allProducts.find(p => p.name.toLowerCase() === item.product_name.toLowerCase());
            if (existing) {
              existing.quantity += Number(item.quantity);
            } else {
              allProducts.push({
                name: item.product_name,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price || 0),
                selling_price: Number(item.selling_price || item.unit_price * 1.2),
                supplier_name: purchase.supplier_name || "",
                purchase_date: purchase.purchase_date,
                purchase_id: purchase.id,
                unit: "pcs",
                min_stock_alert: 5,
              });
            }
          }
        }
      }
    }
    
    setProductsToAddToStock(allProducts);
  };

  // Open Add to Stock modal
  const handleOpenAddToStock = async () => {
    await loadProductsForStock();
    setIsAddToStockModalOpen(true);
  };

  const addItem = () => {
    setItems([...items, { product_id: "", product_name: "", quantity: 1, unit_price: 0, selling_price: 0, total: 0, isNew: false }]);
  };

  const addNewProductItem = () => {
    setItems([...items, { product_id: "", product_name: "", quantity: 1, unit_price: 0, selling_price: 0, total: 0, isNew: true }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      updated[index].total = updated[index].quantity * updated[index].unit_price;
    }
    if (field === "product_id" && !updated[index].isNew) {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].product_name = product.name;
        updated[index].unit_price = product.purchase_price;
        updated[index].selling_price = product.selling_price;
        updated[index].total = updated[index].quantity * product.purchase_price;
      }
    }
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Parse bulk text input (format: name, quantity, purchase_price, selling_price per line)
  const parseBulkText = () => {
    if (!bulkText.trim()) {
      toast.error(language === "bn" ? "টেক্সট দিন" : "Enter text");
      return;
    }

    const lines = bulkText.trim().split("\n");
    const newItems: PurchaseItem[] = [];

    for (const line of lines) {
      const parts = line.split(",").map(p => p.trim());
      if (parts.length >= 1) {
        const name = parts[0];
        const quantity = parseInt(parts[1]) || 1;
        const purchasePrice = parseFloat(parts[2]) || 0;
        const sellingPrice = parseFloat(parts[3]) || 0;

        newItems.push({
          product_name: name,
          quantity,
          unit_price: purchasePrice,
          selling_price: sellingPrice,
          total: quantity * purchasePrice,
          isNew: true,
        });
      }
    }

    if (newItems.length > 0) {
      setItems([...items, ...newItems]);
      setBulkText("");
      setShowBulkInput(false);
      toast.success(language === "bn" ? `${newItems.length}টি আইটেম যোগ হয়েছে` : `${newItems.length} items added`);
    }
  };

  const total = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error(t("shop.addItems"));
      return;
    }

    if (!supplierId && !supplierName.trim()) {
      toast.error(language === "bn" ? "সরবরাহকারী নির্বাচন করুন" : "Select a supplier");
      return;
    }

    try {
      let ensuredSupplierId = supplierId;
      const ensuredSupplierName = supplierName.trim();
      const ensuredSupplierContact = supplierContact.trim();

      // If user typed a new supplier, create it first so purchases are linked (transaction-based)
      if (!ensuredSupplierId) {
        const created = await offlineShopService.createSupplier({
          name: ensuredSupplierName,
          phone: ensuredSupplierContact || undefined,
          business_type: "wholesale",
          category: "local",
          opening_balance: 0,
          payment_terms: "immediate",
        });

        ensuredSupplierId = created.supplier?.id;
        if (!ensuredSupplierId) {
          toast.error(language === "bn" ? "নতুন সরবরাহকারী তৈরি হয়নি" : "Could not create supplier");
          return;
        }
      }

      // NOTE: Do NOT auto-create products for new items
      // Products should be manually added via "Add to Stock" with full details
      // Just save purchase record with product_name (without product_id)

      await offlineShopService.createPurchase({
        supplier_id: ensuredSupplierId,
        supplier_name: ensuredSupplierName,
        supplier_contact: ensuredSupplierContact,
        items: items.map((item) => ({
          // Only include product_id if selecting an existing product (not new)
          product_id: !item.isNew && item.product_id ? item.product_id : undefined,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          selling_price: item.selling_price, // Store selling price for later stock addition
          total: item.total,
          expiry_date: item.expiry_date,
        })),
        paid_amount: paidAmount || total,
        notes,
      });
      
      const hasNewItems = items.some(item => item.isNew);
      if (hasNewItems) {
        toast.success(
          language === "bn" 
            ? "ক্রয় সম্পন্ন! নতুন প্রোডাক্টগুলো স্টকে যোগ করতে 'স্টকে যোগ করুন' বাটন ব্যবহার করুন"
            : "Purchase complete! Use 'Add to Stock' to add new products to stock"
        );
      } else {
        toast.success(t("shop.purchaseComplete"));
      }
      
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    }
  };

  const resetForm = () => {
    setItems([]);
    setSupplierId("");
    setSupplierName("");
    setSupplierContact("");
    setPaidAmount(0);
    setNotes("");
    setBulkText("");
    setShowBulkInput(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filter purchases based on search and date
  const filteredPurchases = purchases.filter((purchase) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      (purchase.supplier_name?.toLowerCase().includes(searchLower)) ||
      (purchase.items?.some(item => item.product_name?.toLowerCase().includes(searchLower))) ||
      formatCurrency(Number(purchase.total_amount)).toLowerCase().includes(searchLower);

    // Date filter
    const purchaseDate = new Date(purchase.purchase_date);
    const matchesDateFrom = !dateFrom || purchaseDate >= dateFrom;
    const matchesDateTo = !dateTo || purchaseDate <= new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1);

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPurchases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPurchases.map(p => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const result = await offlineDataService.deletePurchases(ids);
      const successCount = result.deleted?.length || 0;
      
      if (successCount > 0) {
        toast.success(language === "bn" 
          ? `${successCount}টি পার্চেজ মুছে ফেলা হয়েছে${result.offline ? ' (অফলাইন)' : ''}` 
          : `${successCount} purchases deleted${result.offline ? ' (offline)' : ''}`);
      }
      
      setSelectedIds(new Set());
      loadData();
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedIds(new Set());
  };

  // Excel import handler for purchases
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv"
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
      toast.error(language === "bn" ? "শুধুমাত্র Excel বা CSV ফাইল সাপোর্টেড" : "Only Excel or CSV files are supported");
      return;
    }

    setIsImporting(true);
    setImportProgress({
      total: 0,
      current: 0,
      success: 0,
      failed: 0,
      currentProduct: "",
      errors: [],
    });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      if (rows.length < 2) {
        toast.error(language === "bn" ? "ফাইলে কোনো ডাটা নেই" : "No data found in file");
        setIsImporting(false);
        setImportProgress(null);
        return;
      }

      // Get header row and find column indices
      const headers = rows[0].map(h => String(h).toLowerCase().trim());
      const findColumn = (names: string[]) => headers.findIndex(h => names.some(n => h.includes(n)));

      const nameCol = findColumn(["name", "product", "নাম", "পণ্য"]);
      const purchasePriceCol = findColumn(["purchase", "cost", "buy", "কেনা", "ক্রয়"]);
      const sellingPriceCol = findColumn(["sell", "sale", "price", "বিক্রয়", "দাম"]);
      const quantityCol = findColumn(["quantity", "qty", "পরিমাণ", "সংখ্যা"]);
      const supplierCol = findColumn(["supplier", "সাপ্লায়ার"]);
      const expiryCol = findColumn(["expiry", "expire", "মেয়াদ"]);

      if (nameCol === -1) {
        toast.error(language === "bn" ? "'Name' কলাম পাওয়া যায়নি" : "Could not find 'Name' column");
        setIsImporting(false);
        setImportProgress(null);
        return;
      }

      const dataRows = rows.slice(1).filter(row => row[nameCol]);
      const totalItems = dataRows.length;

      setImportProgress(prev => prev ? { ...prev, total: totalItems } : null);

      // Group items by supplier to create separate purchases
      const purchasesBySupplier: Record<string, any[]> = {};

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const name = String(row[nameCol] || "").trim();
        const supplier = supplierCol !== -1 ? String(row[supplierCol] || "").trim() : "";

        if (!name) continue;

        setImportProgress(prev => prev ? {
          ...prev,
          current: i + 1,
          currentProduct: name,
        } : null);

        const quantity = quantityCol !== -1 ? parseInt(row[quantityCol]) || 1 : 1;
        const unitPrice = purchasePriceCol !== -1 ? parseFloat(row[purchasePriceCol]) || 0 : 0;
        const sellingPrice = sellingPriceCol !== -1 ? parseFloat(row[sellingPriceCol]) || 0 : 0;
        const expiryDate = expiryCol !== -1 && row[expiryCol] ? String(row[expiryCol]) : undefined;

        const item = {
          product_name: name,
          quantity,
          unit_price: unitPrice,
          selling_price: sellingPrice,
          total: quantity * unitPrice,
          expiry_date: expiryDate,
        };

        if (!purchasesBySupplier[supplier]) {
          purchasesBySupplier[supplier] = [];
        }
        purchasesBySupplier[supplier].push(item);

        // Small delay for visual progress
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      // Create purchases array
      const purchasesToImport = Object.entries(purchasesBySupplier).map(([supplierName, items]) => ({
        supplier_name: supplierName,
        items,
      }));

      // Import purchases
      const result = await offlineShopService.importPurchases(purchasesToImport);

      setImportProgress({
        total: totalItems,
        current: totalItems,
        success: result.results.success,
        failed: result.results.failed,
        currentProduct: language === "bn" ? "সম্পন্ন!" : "Complete!",
        errors: result.results.errors,
      });

      if (result.results.success > 0) {
        toast.success(
          language === "bn"
            ? `${result.results.success}টি পার্চেজ সফলভাবে যোগ হয়েছে`
            : `${result.results.success} purchases imported successfully`
        );
        loadData();
      }

      if (result.results.failed > 0) {
        toast.error(
          language === "bn"
            ? `${result.results.failed}টি পার্চেজ যোগ হয়নি`
            : `${result.results.failed} purchases failed to import`
        );
      }

      // Close after delay
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(null);
      }, 3000);

    } catch (error) {
      console.error("Import error:", error);
      toast.error(language === "bn" ? "ইম্পোর্ট ব্যর্থ হয়েছে" : "Import failed");
      setIsImporting(false);
      setImportProgress(null);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Download purchases template
  const downloadTemplate = () => {
    const isEnglish = language === "en";
    
    const headers = isEnglish
      ? ["Product Name", "Quantity", "Purchase Price", "Selling Price", "Supplier", "Expiry Date"]
      : ["পণ্যের নাম", "পরিমাণ", "ক্রয় মূল্য", "বিক্রয় মূল্য", "সাপ্লায়ার", "মেয়াদ"];

    const exampleData = isEnglish
      ? [
          ["Rice 5kg", 100, 450, 520, "ABC Supplier", "2025-12-31"],
          ["Sugar 1kg", 50, 85, 95, "ABC Supplier", "2025-06-30"],
          ["Oil 1ltr", 30, 180, 210, "XYZ Trading", "2025-09-15"],
        ]
      : [
          ["চাল ৫ কেজি", 100, 450, 520, "এবিসি সাপ্লায়ার", "২০২৫-১২-৩১"],
          ["চিনি ১ কেজি", 50, 85, 95, "এবিসি সাপ্লায়ার", "২০২৫-০৬-৩০"],
          ["তেল ১ লিটার", 30, 180, 210, "এক্সওয়াইজেড ট্রেডিং", "২০২৫-০৯-১৫"],
        ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isEnglish ? "Purchases" : "ক্রয়");

    // Add instructions sheet
    const instructions = isEnglish
      ? [
          ["Purchase Import Template - Instructions"],
          [""],
          ["Required Columns:"],
          ["- Product Name: The name of the product (required)"],
          ["- Quantity: Number of items purchased (required)"],
          ["- Purchase Price: Cost price per unit (required)"],
          [""],
          ["Optional Columns:"],
          ["- Selling Price: Selling price per unit"],
          ["- Supplier: Supplier name (items with same supplier will be grouped)"],
          ["- Expiry Date: Product expiry date (YYYY-MM-DD)"],
          [""],
          ["Note: Products will be automatically created if they don't exist."],
          ["Items with the same supplier will be grouped into one purchase."],
        ]
      : [
          ["ক্রয় ইম্পোর্ট টেমপ্লেট - নির্দেশনা"],
          [""],
          ["প্রয়োজনীয় কলাম:"],
          ["- পণ্যের নাম: পণ্যের নাম (আবশ্যক)"],
          ["- পরিমাণ: ক্রয় করা আইটেমের সংখ্যা (আবশ্যক)"],
          ["- ক্রয় মূল্য: প্রতি ইউনিট খরচ মূল্য (আবশ্যক)"],
          [""],
          ["ঐচ্ছিক কলাম:"],
          ["- বিক্রয় মূল্য: প্রতি ইউনিট বিক্রয় মূল্য"],
          ["- সাপ্লায়ার: সাপ্লায়ার নাম (একই সাপ্লায়ারের আইটেম গ্রুপ হবে)"],
          ["- মেয়াদ: পণ্যের মেয়াদ উত্তীর্ণের তারিখ (YYYY-MM-DD)"],
          [""],
          ["নোট: পণ্য না থাকলে স্বয়ংক্রিয়ভাবে তৈরি হবে।"],
          ["একই সাপ্লায়ারের আইটেম এক পার্চেজে গ্রুপ হবে।"],
        ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, isEnglish ? "Instructions" : "নির্দেশনা");

    XLSX.writeFile(wb, isEnglish ? "purchase_import_template.xlsx" : "ক্রয়_ইম্পোর্ট_টেমপ্লেট.xlsx");
  };

  return (
    <ShopLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t("shop.purchasesTitle")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t("shop.purchasesDesc")}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="text-xs sm:text-sm">
              <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {language === "bn" ? "টেমপ্লেট" : "Template"}
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {language === "bn" ? "Excel ইম্পোর্ট" : "Import"}
            </Button>
            <Button 
              variant="secondary"
              size="sm"
              className="text-xs sm:text-sm"
              onClick={handleOpenAddToStock}
            >
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {language === "bn" ? "স্টকে যোগ" : "Add to Stock"}
            </Button>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} size="sm" className="text-xs sm:text-sm">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {t("shop.newPurchase")}
            </Button>
          </div>
        </div>

        {/* Import Progress Card */}
        {isImporting && importProgress && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="font-medium">
                      {language === "bn" ? "পণ্য ইম্পোর্ট হচ্ছে..." : "Importing products..."}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {importProgress.current}/{importProgress.total}
                  </span>
                </div>
                <Progress value={(importProgress.current / importProgress.total) * 100} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[200px]">
                    {importProgress.currentProduct}
                  </span>
                  <div className="flex gap-3">
                    <span className="text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> {importProgress.success}
                    </span>
                    {importProgress.failed > 0 && (
                      <span className="text-destructive flex items-center gap-1">
                        <X className="h-3 w-3" /> {importProgress.failed}
                      </span>
                    )}
                  </div>
                </div>
                {importProgress.errors.length > 0 && (
                  <div className="text-xs text-destructive mt-2 max-h-20 overflow-y-auto">
                    {importProgress.errors.slice(0, 3).map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                    {importProgress.errors.length > 3 && (
                      <p>+{importProgress.errors.length - 3} more errors</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter Section */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === "bn" ? "সার্চ করুন..." : "Search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Date From */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[140px] justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : (language === "bn" ? "থেকে" : "From")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Date To */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[140px] justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : (language === "bn" ? "পর্যন্ত" : "To")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Clear Filters */}
              {(searchQuery || dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  {language === "bn" ? "ক্লিয়ার" : "Clear"}
                </Button>
              )}
            </div>

            {/* Bulk Delete */}
            {selectedIds.size > 0 && (
              <Button variant="destructive" size="sm" disabled={isDeleting} onClick={() => setDeleteDialogOpen(true)}>
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {language === "bn" 
                  ? `${selectedIds.size}টি মুছুন` 
                  : `Delete ${selectedIds.size}`}
              </Button>
            )}


            {/* Trash Bin Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setShowTrash(true);
                loadTrash();
              }}
            >
              <History className="h-4 w-4 mr-2" />
              {language === "bn" ? "ট্র্যাশ বিন" : "Trash Bin"}
            </Button>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-muted-foreground">
            {language === "bn" 
              ? `${filteredPurchases.length}টি পার্চেজ পাওয়া গেছে` 
              : `${filteredPurchases.length} purchases found`}
            {selectedIds.size > 0 && (
              <span className="ml-2">
                ({language === "bn" ? `${selectedIds.size}টি সিলেক্টেড` : `${selectedIds.size} selected`})
              </span>
            )}
          </div>
        </Card>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 p-2">
                    <Checkbox
                      checked={filteredPurchases.length > 0 && selectedIds.size === filteredPurchases.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("shop.date")}</TableHead>
                  <TableHead className="text-xs sm:text-sm max-w-[100px] sm:max-w-none">{t("shop.supplier")}</TableHead>
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm">{language === "bn" ? "পণ্য" : "Products"}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("shop.total")}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{language === "bn" ? "বাকি" : "Due"}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("shop.status")}</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm w-20">{t("shop.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">{t("common.loading")}</TableCell>
                  </TableRow>
                ) : filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <PackagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p>{t("shop.noPurchases")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id} className={selectedIds.has(purchase.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(purchase.id)}
                          onCheckedChange={() => toggleSelectOne(purchase.id)}
                        />
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                        <div>
                          <p className="whitespace-nowrap">{new Date(purchase.purchase_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                            {new Date(purchase.purchase_date).toLocaleTimeString(language === "bn" ? "bn-BD" : "en-US", { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4 max-w-[80px] sm:max-w-[150px]">
                        <span className="truncate block">{purchase.supplier_name || "-"}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-2 sm:p-4">
                        <div className="max-w-[150px]">
                          {purchase.items?.slice(0, 2).map((item, i) => (
                            <span key={i} className="text-xs">
                              {item.product_name}{i < Math.min(purchase.items!.length, 2) - 1 ? ", " : ""}
                            </span>
                          ))}
                          {purchase.items && purchase.items.length > 2 && (
                            <span className="text-xs text-muted-foreground"> +{purchase.items.length - 2}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4 font-medium whitespace-nowrap">{formatCurrency(Number(purchase.total_amount))}</TableCell>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                        {Number(purchase.due_amount) > 0 ? (
                          <span className="text-destructive font-medium whitespace-nowrap">
                            {formatCurrency(Number(purchase.due_amount))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <Badge variant={purchase.payment_status === "paid" ? "default" : purchase.payment_status === "partial" ? "secondary" : "destructive"} className="text-[10px] sm:text-xs">
                          {purchase.payment_status === "paid" 
                            ? (language === "bn" ? "পরিশোধিত" : "Paid") 
                            : purchase.payment_status === "partial"
                            ? (language === "bn" ? "আংশিক" : "Partial")
                            : (language === "bn" ? "বাকি" : "Due")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <div className="flex justify-end gap-0.5 sm:gap-1">
                          {Number(purchase.due_amount) > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => openPaymentModal(purchase)}
                              title={language === "bn" ? "পেমেন্ট করুন" : "Add Payment"}
                            >
                              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => setViewingPurchase(purchase)}
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

      {/* New Purchase Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("shop.newPurchase")}</DialogTitle>
            <DialogDescription>{t("shop.buyFromSupplier")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="supplier-select" className="text-sm font-medium">
                    {language === "bn" ? "সরবরাহকারী নির্বাচন করুন *" : "Select Supplier *"}
                  </Label>
                  <select
                    id="supplier-select"
                    value={supplierId}
                    onChange={(e) => {
                      const selected = suppliers.find(s => s.id === e.target.value);
                      setSupplierId(e.target.value);
                      if (selected) {
                        setSupplierName(selected.name);
                        setSupplierContact(selected.phone || "");
                      }
                    }}
                    className="w-full h-10 px-3 border rounded-md bg-background"
                  >
                    <option value="">{language === "bn" ? "সরবরাহকারী নির্বাচন করুন..." : "Select a supplier..."}</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}{supplier.company_name ? ` (${supplier.company_name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                
                {!supplierId && (
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {language === "bn" ? "অথবা নতুন সরবরাহকারী:" : "Or enter new supplier:"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder={language === "bn" ? "সরবরাহকারীর নাম" : "Supplier name"}
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                      />
                      <Input
                        placeholder={language === "bn" ? "যোগাযোগ নম্বর" : "Contact number"}
                        value={supplierContact}
                        onChange={(e) => setSupplierContact(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <Label>{t("shop.item")}</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowBulkInput(!showBulkInput)}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    {language === "bn" ? "বাল্ক যোগ" : "Bulk Add"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={addNewProductItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    {language === "bn" ? "নতুন পণ্য" : "New Product"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    {language === "bn" ? "বিদ্যমান পণ্য" : "Existing"}
                  </Button>
                </div>
              </div>

              {/* Bulk Input */}
              {showBulkInput && (
                <div className="border rounded-lg p-3 bg-muted/50 space-y-2">
                  <Label className="text-sm">
                    {language === "bn" 
                      ? "প্রতি লাইনে: নাম, পরিমাণ, ক্রয় মূল্য, বিক্রয় মূল্য" 
                      : "Per line: Name, Quantity, Purchase Price, Selling Price"}
                  </Label>
                  <Textarea
                    placeholder={language === "bn" 
                      ? "চাল ৫ কেজি, ৫০, ৪৫০, ৫২০\nডাল ১ কেজি, ১০০, ১২০, ১৫০"
                      : "Rice 5kg, 50, 450, 520\nLentils 1kg, 100, 120, 150"}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowBulkInput(false)}>
                      {language === "bn" ? "বাতিল" : "Cancel"}
                    </Button>
                    <Button type="button" size="sm" onClick={parseBulkText}>
                      {language === "bn" ? "যোগ করুন" : "Add Items"}
                    </Button>
                  </div>
                </div>
              )}

              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  {item.isNew ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="col-span-2">
                        <Input
                          placeholder={language === "bn" ? "পণ্যের নাম" : "Product Name"}
                          value={item.product_name}
                          onChange={(e) => updateItem(index, "product_name", e.target.value)}
                        />
                      </div>
                      <Input
                        type="number"
                        placeholder={language === "bn" ? "পরিমাণ" : "Qty"}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                      <Input
                        type="number"
                        placeholder={language === "bn" ? "ক্রয় মূল্য" : "Purchase"}
                        value={item.unit_price || ""}
                        onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                      />
                      <Input
                        type="number"
                        placeholder={language === "bn" ? "বিক্রয় মূল্য" : "Selling"}
                        value={item.selling_price || ""}
                        onChange={(e) => updateItem(index, "selling_price", parseFloat(e.target.value) || 0)}
                      />
                      <div className="text-sm text-muted-foreground flex items-center">
                        {language === "bn" ? "মোট:" : "Total:"} {formatCurrency(item.total)}
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="text-xs">
                          {language === "bn" ? "নতুন" : "New"}
                        </Badge>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-2 items-center">
                      <div className="col-span-2">
                        <select
                          className="w-full h-10 px-3 border rounded-md bg-background"
                          value={item.product_id}
                          onChange={(e) => updateItem(index, "product_id", e.target.value)}
                        >
                          <option value="">{t("shop.selectProduct")}</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <Input
                        type="number"
                        placeholder={t("shop.quantity")}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                      <Input
                        type="number"
                        placeholder={t("shop.price")}
                        value={item.unit_price || ""}
                        onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <PackagePlus className="h-8 w-8 mx-auto mb-2" />
                  <p>{language === "bn" ? "আইটেম যোগ করুন" : "Add items to purchase"}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("shop.paidAmount")}</Label>
              <Input
                type="number"
                value={paidAmount || total}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>{t("shop.total")}:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit}>{t("shop.completeSale")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Purchase Modal */}
      <Dialog open={!!viewingPurchase} onOpenChange={() => setViewingPurchase(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("shop.purchaseDetails")}</DialogTitle>
          </DialogHeader>
          {viewingPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("shop.supplier")}</p>
                  <p className="font-medium">{viewingPurchase.supplier_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("shop.date")}</p>
                  <p className="font-medium">
                    {new Date(viewingPurchase.purchase_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("shop.total")}</p>
                  <p className="font-bold text-lg">{formatCurrency(Number(viewingPurchase.total_amount))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "bn" ? "পরিশোধিত" : "Paid"}</p>
                  <p className="font-medium text-primary">{formatCurrency(Number(viewingPurchase.paid_amount))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "bn" ? "বাকি" : "Due"}</p>
                  <p className={`font-medium ${Number(viewingPurchase.due_amount) > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {formatCurrency(Number(viewingPurchase.due_amount))}
                  </p>
                </div>
              </div>

              {viewingPurchase.items && viewingPurchase.items.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{language === "bn" ? "আইটেম" : "Items"}</p>
                  <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                    {viewingPurchase.items.map((item, i) => (
                      <div key={i} className="p-2 flex justify-between text-sm">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span>{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {viewingPurchase && Number(viewingPurchase.due_amount) > 0 && (
              <Button variant="default" onClick={() => {
                setViewingPurchase(null);
                openPaymentModal(viewingPurchase);
              }}>
                <CreditCard className="h-4 w-4 mr-2" />
                {language === "bn" ? "পেমেন্ট করুন" : "Add Payment"}
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewingPurchase(null)}>{t("shop.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={!!paymentPurchase} onOpenChange={() => setPaymentPurchase(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "bn" ? "পেমেন্ট যোগ করুন" : "Add Payment"}</DialogTitle>
            <DialogDescription>
              {paymentPurchase && (
                <>
                  {language === "bn" ? "বাকি:" : "Due:"} {formatCurrency(Number(paymentPurchase.due_amount))}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="payment">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payment">{language === "bn" ? "পেমেন্ট" : "Payment"}</TabsTrigger>
              <TabsTrigger value="history">{language === "bn" ? "হিস্ট্রি" : "History"}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payment" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "পরিমাণ" : "Amount"}</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  max={paymentPurchase ? Number(paymentPurchase.due_amount) : undefined}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === "bn" ? "পেমেন্ট মেথড" : "Payment Method"}</Label>
                <select
                  className="w-full h-10 px-3 border rounded-md bg-background"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">{language === "bn" ? "নগদ" : "Cash"}</option>
                  <option value="bkash">{language === "bn" ? "বিকাশ" : "bKash"}</option>
                  <option value="nagad">{language === "bn" ? "নগদ" : "Nagad"}</option>
                  <option value="bank">{language === "bn" ? "ব্যাংক" : "Bank"}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>{language === "bn" ? "নোট" : "Notes"}</Label>
                <Textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={language === "bn" ? "ঐচ্ছিক নোট..." : "Optional notes..."}
                />
              </div>

              <Button 
                onClick={handleAddPayment} 
                className="w-full" 
                disabled={isProcessingPayment || paymentAmount <= 0}
              >
                {isProcessingPayment ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {language === "bn" ? "পেমেন্ট সংরক্ষণ করুন" : "Save Payment"}
              </Button>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2" />
                  <p>{language === "bn" ? "কোনো পেমেন্ট হিস্ট্রি নেই" : "No payment history"}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.payment_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                          {" • "}
                          {payment.payment_method}
                        </p>
                      </div>
                      <Badge variant="outline">{payment.payment_method}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Trash Bin Modal */}
      <Dialog open={showTrash} onOpenChange={setShowTrash}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              {language === "bn" ? "ট্র্যাশ বিন" : "Trash Bin"}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? "মুছে ফেলা পার্চেজগুলো ৭ দিন পর স্বয়ংক্রিয়ভাবে মুছে যাবে" 
                : "Deleted purchases will be permanently removed after 7 days"}
            </DialogDescription>
          </DialogHeader>

          {isLoadingTrash ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            </div>
          ) : trashItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trash2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{language === "bn" ? "ট্র্যাশ খালি" : "Trash is empty"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trashItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {item.data.purchase?.supplier_name || (language === "bn" ? "সাপ্লায়ার নেই" : "No supplier")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "bn" ? "মোট:" : "Total:"} {formatCurrency(Number(item.data.purchase?.total_amount || 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === "bn" ? "মুছে ফেলা হয়েছে:" : "Deleted:"} {new Date(item.deleted_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                      {" • "}
                      {language === "bn" ? "মেয়াদ:" : "Expires:"} {new Date(item.expires_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(item.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {language === "bn" ? "রিস্টোর" : "Restore"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {language === "bn" ? "স্থায়ীভাবে মুছুন?" : "Permanently Delete?"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {language === "bn" 
                              ? "এই অ্যাকশন পূর্বাবস্থায় ফেরানো যাবে না।" 
                              : "This action cannot be undone."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{language === "bn" ? "বাতিল" : "Cancel"}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handlePermanentDelete(item.id)}>
                            {language === "bn" ? "মুছে ফেলুন" : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          handleBulkDelete();
          setDeleteDialogOpen(false);
        }}
        title={language === "en" ? "purchases" : "পার্চেজ"}
        itemCount={selectedIds.size}
        isSoftDelete={true}
        isLoading={isDeleting}
      />

      {/* Add to Stock Modal */}
      <AddToStockModal
        isOpen={isAddToStockModalOpen}
        onClose={() => setIsAddToStockModalOpen(false)}
        products={productsToAddToStock}
        onSuccess={loadData}
      />
    </ShopLayout>

  );
};

export default ShopPurchases;
