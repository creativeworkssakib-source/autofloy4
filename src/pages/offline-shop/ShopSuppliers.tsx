import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Truck, Phone, Mail, Eye, Building2, MapPin, CreditCard, Calendar, FileText, Package, DollarSign, TrendingUp, Clock, Info, ShoppingCart, Check, X, Banknote, Timer, AlertTriangle, PackagePlus, Upload, FileSpreadsheet, Loader2, History, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DateRangeFilter, { DateRangePreset, DateRange, getDateRangeFromPreset } from "@/components/offline-shop/DateRangeFilter";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import AddToStockModal, { PurchasedProduct } from "@/components/offline-shop/AddToStockModal";
import { offlineShopService } from "@/services/offlineShopService";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShop } from "@/contexts/ShopContext";
import * as XLSX from "xlsx";

interface Supplier {
  id: string;
  name: string;
  supplier_code?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  total_purchases: number;
  total_paid: number;
  total_due: number;
  last_purchase_date?: string;
  created_at: string;
  business_type?: string;
  category?: string;
  opening_balance?: number;
  payment_terms?: string;
  is_active?: boolean;
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
  invoice_number?: string;
  items?: PurchaseItem[];
}

interface PurchaseItem {
  id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  selling_price?: number;
  total: number;
  expiry_date?: string;
}

interface PurchasePayment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes?: string;
}

interface ProductSummary {
  name: string;
  totalQuantity: number;
  totalAmount: number;
  lastPurchaseDate: string;
}

interface FormPurchaseItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  selling_price: number;
  total: number;
  location?: string;
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

const BUSINESS_TYPES = [
  { value: "wholesale", label_en: "Wholesale", label_bn: "পাইকারি" },
  { value: "retail", label_en: "Retail", label_bn: "খুচরা" },
  { value: "manufacturer", label_en: "Manufacturer", label_bn: "প্রস্তুতকারক" },
  { value: "distributor", label_en: "Distributor", label_bn: "পরিবেশক" },
  { value: "importer", label_en: "Importer", label_bn: "আমদানিকারক" },
];

const PAYMENT_TERMS = [
  { value: "immediate", label_en: "Immediate Payment", label_bn: "তাৎক্ষণিক পেমেন্ট", days: 0 },
  { value: "7_days", label_en: "7 Days", label_bn: "৭ দিন", days: 7 },
  { value: "15_days", label_en: "15 Days", label_bn: "১৫ দিন", days: 15 },
  { value: "30_days", label_en: "30 Days", label_bn: "৩০ দিন", days: 30 },
  { value: "60_days", label_en: "60 Days", label_bn: "৬০ দিন", days: 60 },
  { value: "90_days", label_en: "90 Days", label_bn: "৯০ দিন", days: 90 },
];

const SUPPLIER_CATEGORIES = [
  { value: "local", label_en: "Local", label_bn: "স্থানীয়" },
  { value: "national", label_en: "National", label_bn: "জাতীয়" },
  { value: "import", label_en: "Import", label_bn: "আমদানি" },
];

const PAYMENT_METHODS = [
  { value: "cash", label_en: "Cash", label_bn: "নগদ" },
  { value: "bank", label_en: "Bank Transfer", label_bn: "ব্যাংক ট্রান্সফার" },
  { value: "bkash", label_en: "bKash", label_bn: "বিকাশ" },
  { value: "nagad", label_en: "Nagad", label_bn: "নগদ" },
  { value: "rocket", label_en: "Rocket", label_bn: "রকেট" },
  { value: "check", label_en: "Check", label_bn: "চেক" },
];

const ORDER_STATUS = [
  { value: "pending", label_en: "Order Placed", label_bn: "অর্ডার দেওয়া হয়েছে" },
  { value: "confirmed", label_en: "Confirmed", label_bn: "কনফার্ম হয়েছে" },
  { value: "received", label_en: "Received", label_bn: "পণ্য পাওয়া গেছে" },
  { value: "cancelled", label_en: "Cancelled", label_bn: "বাতিল" },
];

const ShopSuppliers = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { currentShop } = useShop();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Date filter state
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('this_year');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset('this_year'));
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  // Purchase date filters
  const [purchaseDateFrom, setPurchaseDateFrom] = useState<Date | undefined>(undefined);
  const [purchaseDateTo, setPurchaseDateTo] = useState<Date | undefined>(undefined);

  const handleDateRangeChange = (preset: DateRangePreset, dates: DateRange) => {
    setDateRangePreset(preset);
    setDateRange(dates);
    if (preset === 'custom') {
      setCustomDateRange(dates);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [supplierPurchases, setSupplierPurchases] = useState<Purchase[]>([]);
  const [activeTab, setActiveTab] = useState("info");
  const [modalTab, setModalTab] = useState("info");

  // Pay Due Modal state
  const [payDueModalOpen, setPayDueModalOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isPayingDue, setIsPayingDue] = useState(false);

  // Bulk selection state
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseDeleteDialogOpen, setPurchaseDeleteDialogOpen] = useState(false);

  // Import progress
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);

  // Purchase payment modal
  const [paymentPurchase, setPaymentPurchase] = useState<Purchase | null>(null);
  const [purchasePaymentAmount, setPurchasePaymentAmount] = useState(0);
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState("cash");
  const [purchasePaymentNotes, setPurchasePaymentNotes] = useState("");
  const [isProcessingPurchasePayment, setIsProcessingPurchasePayment] = useState(false);
  const [purchasePaymentHistory, setPurchasePaymentHistory] = useState<PurchasePayment[]>([]);

  // Trash bin states
  const [showTrash, setShowTrash] = useState(false);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);

  // Simplified form data - only essential fields
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    business_type: "wholesale",
    category: "local",
    opening_balance: 0,
    payment_terms: "immediate",
    is_active: true,
  });

  // Previous supplier detection state
  const [selectedPreviousSupplier, setSelectedPreviousSupplier] = useState<Supplier | null>(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [includePreviousDue, setIncludePreviousDue] = useState(false);

  // Purchase items state for the form
  const [purchaseItems, setPurchaseItems] = useState<FormPurchaseItem[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [purchaseNotesField, setPurchaseNotesField] = useState("");
  const [isOrder, setIsOrder] = useState(false);
  const [orderStatus, setOrderStatus] = useState<"pending" | "confirmed" | "received" | "cancelled">("pending");
  const [duePaymentDate, setDuePaymentDate] = useState("");
  const [formPurchasePaymentMethod, setFormPurchasePaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add to stock modal state
  const [isAddToStockModalOpen, setIsAddToStockModalOpen] = useState(false);
  const [productsToAddToStock, setProductsToAddToStock] = useState<PurchasedProduct[]>([]);

  // Existing products from supplier modal state
  const [showExistingProductsModal, setShowExistingProductsModal] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [isLoadingSupplierProducts, setIsLoadingSupplierProducts] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [suppliersRes, purchasesRes] = await Promise.all([
        offlineShopService.getSuppliers(),
        offlineShopService.getPurchases(),
      ]);
      setSuppliers(suppliersRes.suppliers || []);
      setPurchases(purchasesRes.purchases || []);
    } catch (error) {
      toast.error(t("shop.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentShop?.id]);

  // Handle supplier query param from other pages
  useEffect(() => {
    const supplierParam = searchParams.get("supplier");
    if (supplierParam && suppliers.length > 0) {
      const selected = suppliers.find((s) => s.id === supplierParam);
      if (selected) {
        handleSelectPreviousSupplier(selected);
        setModalTab("purchase");
        setIsModalOpen(true);
      }
    }
  }, [searchParams, suppliers]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone?.includes(searchQuery);
      
      const dateToCheck = s.last_purchase_date ? new Date(s.last_purchase_date) : new Date(s.created_at);
      const matchesDate = isWithinInterval(dateToCheck, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
      
      return matchesSearch && matchesDate;
    });
  }, [suppliers, searchQuery, dateRange]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        (purchase.supplier_name?.toLowerCase().includes(searchLower)) ||
        (purchase.items?.some(item => item.product_name?.toLowerCase().includes(searchLower)));

      const purchaseDate = new Date(purchase.purchase_date);
      const matchesDateFrom = !purchaseDateFrom || purchaseDate >= purchaseDateFrom;
      const matchesDateTo = !purchaseDateTo || purchaseDate <= new Date(purchaseDateTo.getTime() + 24 * 60 * 60 * 1000 - 1);

      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
  }, [purchases, searchQuery, purchaseDateFrom, purchaseDateTo]);

  // Supplier bulk selection handlers
  const toggleSelectAllSuppliers = () => {
    if (selectedSupplierIds.length === filteredSuppliers.length) {
      setSelectedSupplierIds([]);
    } else {
      setSelectedSupplierIds(filteredSuppliers.map((s) => s.id));
    }
  };

  const toggleSelectOneSupplier = (id: string) => {
    setSelectedSupplierIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteSuppliers = async () => {
    if (selectedSupplierIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const result = await offlineShopService.deleteSuppliers(selectedSupplierIds);
      const deletedCount = result.deleted?.length || 0;
      toast.success(
        language === "bn"
          ? `${deletedCount}টি সরবরাহকারী ট্র্যাশে সরানো হয়েছে`
          : `${deletedCount} supplier(s) moved to trash`
      );
      setSelectedSupplierIds([]);
      loadData();
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Purchase bulk selection handlers
  const toggleSelectAllPurchases = () => {
    if (selectedPurchaseIds.size === filteredPurchases.length) {
      setSelectedPurchaseIds(new Set());
    } else {
      setSelectedPurchaseIds(new Set(filteredPurchases.map(p => p.id)));
    }
  };

  const toggleSelectOnePurchase = (id: string) => {
    const newSet = new Set(selectedPurchaseIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPurchaseIds(newSet);
  };

  const handleBulkDeletePurchases = async () => {
    if (selectedPurchaseIds.size === 0) return;
    
    setIsBulkDeleting(true);
    try {
      const ids = Array.from(selectedPurchaseIds);
      let successCount = 0;
      for (const id of ids) {
        try {
          await offlineShopService.deletePurchase(id);
          successCount++;
        } catch (e) {
          console.error(`Failed to delete purchase ${id}:`, e);
        }
      }
      
      if (successCount > 0) {
        toast.success(language === "bn" 
          ? `${successCount}টি পার্চেজ মুছে ফেলা হয়েছে` 
          : `${successCount} purchases deleted`);
      }
      
      setSelectedPurchaseIds(new Set());
      loadData();
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Add new purchase item row
  const addPurchaseItem = () => {
    setPurchaseItems([
      ...purchaseItems,
      {
        id: crypto.randomUUID(),
        product_name: "",
        quantity: 1,
        unit_price: 0,
        selling_price: 0,
        total: 0,
        location: "",
      },
    ]);
  };

  // Load products from supplier's previous purchases
  const loadSupplierProducts = async () => {
    const supplierName = selectedPreviousSupplier?.name || formData.name;
    const supplierId = selectedPreviousSupplier?.id;
    
    if (!supplierId && !supplierName) {
      toast.error(language === "bn" ? "প্রথমে সাপ্লায়ার সিলেক্ট করুন" : "Please select a supplier first");
      return;
    }
    
    setIsLoadingSupplierProducts(true);
    try {
      const res = await offlineShopService.getSupplierProducts(supplierId, supplierName);
      setSupplierProducts(res.products || []);
      setShowExistingProductsModal(true);
    } catch (error) {
      console.error("Failed to load supplier products:", error);
      toast.error(language === "bn" ? "প্রোডাক্ট লোড করতে সমস্যা" : "Failed to load products");
    } finally {
      setIsLoadingSupplierProducts(false);
    }
  };

  // Add existing product to purchase items
  const addExistingProduct = (product: any) => {
    setPurchaseItems([
      ...purchaseItems,
      {
        id: crypto.randomUUID(),
        product_name: product.product_name,
        quantity: 1,
        unit_price: product.last_unit_price || 0,
        selling_price: product.last_selling_price || 0,
        total: product.last_unit_price || 0,
        location: "",
      },
    ]);
    toast.success(language === "bn" ? `${product.product_name} যোগ হয়েছে` : `${product.product_name} added`);
  };

  // Update purchase item
  const updatePurchaseItem = (id: string, field: keyof FormPurchaseItem, value: any) => {
    setPurchaseItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "unit_price") {
            updated.total = updated.quantity * updated.unit_price;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Remove purchase item
  const removePurchaseItem = (id: string) => {
    setPurchaseItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate total purchase amount
  const totalPurchaseAmount = purchaseItems.reduce((sum, item) => sum + item.total, 0);
  const previousDueAmount = selectedPreviousSupplier && includePreviousDue ? Number(selectedPreviousSupplier.total_due) || 0 : 0;
  const dueAmount = totalPurchaseAmount - paidAmount + previousDueAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let supplierId = editingSupplier?.id || selectedPreviousSupplier?.id;

      if (editingSupplier) {
        await offlineShopService.updateSupplier({ id: editingSupplier.id, ...formData });
        toast.success(t("shop.supplierUpdated"));
      } else if (selectedPreviousSupplier) {
        supplierId = selectedPreviousSupplier.id;
        toast.success(
          language === "bn"
            ? "আগের সরবরাহকারী নির্বাচিত হয়েছে"
            : "Existing supplier selected"
        );
      } else {
        const result = await offlineShopService.createSupplier(formData);
        supplierId = result.supplier?.id;
        toast.success(t("shop.supplierAdded"));
      }

      // If there are purchase items, create a purchase
      if (purchaseItems.length > 0 && purchaseItems.some(item => item.product_name && item.quantity > 0) && supplierId) {
        const validItems = purchaseItems.filter(item => item.product_name && item.quantity > 0);
        
        if (validItems.length > 0) {
          const purchaseData = {
            supplier_id: supplierId,
            supplier_name: formData.name,
            supplier_contact: formData.phone,
            items: validItems.map(item => ({
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              selling_price: item.selling_price || item.unit_price * 1.2,
              total: item.total,
            })),
            paid_amount: paidAmount,
            payment_method: formPurchasePaymentMethod,
            due_payment_date: duePaymentDate || null,
            notes: purchaseNotesField + (isOrder ? ` [${language === "bn" ? "অর্ডার স্ট্যাটাস" : "Order Status"}: ${ORDER_STATUS.find(s => s.value === orderStatus)?.[language === "bn" ? "label_bn" : "label_en"]}]` : ""),
          };

          await offlineShopService.createPurchase(purchaseData);
          toast.success(
            language === "bn"
              ? isOrder 
                ? selectedPreviousSupplier
                  ? "আগের সরবরাহকারীর অর্ডার সফলভাবে যোগ হয়েছে"
                  : "সরবরাহকারী এবং অর্ডার সফলভাবে যোগ হয়েছে"
                : selectedPreviousSupplier
                  ? "আগের সরবরাহকারীর ক্রয় সফলভাবে যোগ হয়েছে"
                  : "সরবরাহকারী এবং ক্রয় সফলভাবে যোগ হয়েছে"
              : isOrder
                ? selectedPreviousSupplier
                  ? "Order added to existing supplier"
                  : "Supplier and order added successfully"
                : selectedPreviousSupplier
                  ? "Purchase added to existing supplier"
                  : "Supplier and purchase added successfully"
          );
        }
      }

      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await offlineShopService.deleteSupplier(id);
      toast.success(
        language === "bn" 
          ? `সরবরাহকারী ট্র্যাশে সরানো হয়েছে` 
          : `Supplier moved to trash`
      );
      loadData();
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    }
  };

  const handleViewSupplier = async (supplier: Supplier) => {
    setViewingSupplier(supplier);
    setActiveTab("info");
    try {
      const result = await offlineShopService.getSupplier(supplier.id);
      setSupplierPurchases(result.purchases || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
      business_type: supplier.business_type || "wholesale",
      category: supplier.category || "local",
      opening_balance: Number(supplier.opening_balance) || 0,
      payment_terms: supplier.payment_terms || "immediate",
      is_active: supplier.is_active !== false,
    });
    setModalTab("info");
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      business_type: "wholesale",
      category: "local",
      opening_balance: 0,
      payment_terms: "immediate",
      is_active: true,
    });
    setPurchaseItems([]);
    setPaidAmount(0);
    setPurchaseNotesField("");
    setIsOrder(false);
    setOrderStatus("pending");
    setDuePaymentDate("");
    setFormPurchasePaymentMethod("cash");
    setModalTab("info");
    setSelectedPreviousSupplier(null);
    setSupplierSearchQuery("");
    setShowSupplierDropdown(false);
    setIncludePreviousDue(false);
  };

  // Filter suppliers for previous supplier search
  const filteredPreviousSuppliers = suppliers.filter((s) => {
    const query = supplierSearchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.phone?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query)
    );
  });

  // Handle selecting a previous supplier
  const handleSelectPreviousSupplier = (supplier: Supplier) => {
    setSelectedPreviousSupplier(supplier);
    setFormData((prev) => ({
      ...prev,
      name: supplier.name,
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      business_type: supplier.business_type || "wholesale",
      category: supplier.category || "local",
      payment_terms: supplier.payment_terms || "immediate",
      opening_balance: Number(supplier.total_due) || 0,
      notes: prev.notes,
    }));
    setSupplierSearchQuery("");
    setShowSupplierDropdown(false);
  };

  // Clear previous supplier selection
  const clearPreviousSupplier = () => {
    setSelectedPreviousSupplier(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      business_type: "wholesale",
      category: "local",
      opening_balance: 0,
      payment_terms: "immediate",
      is_active: true,
    });
  };

  // Pay Supplier Due Handler
  const handleOpenPayDue = (supplier: Supplier) => {
    setPayingSupplier(supplier);
    setPaymentAmount(Number(supplier.total_due) || 0);
    setPaymentMethod("cash");
    setPaymentNotes("");
    setPayDueModalOpen(true);
  };

  const handlePayDue = async () => {
    if (!payingSupplier || paymentAmount <= 0) return;
    
    setIsPayingDue(true);
    try {
      await offlineShopService.addSupplierPayment({
        supplier_id: payingSupplier.id,
        amount: paymentAmount,
        payment_method: paymentMethod,
        notes: paymentNotes,
      });
      
      toast.success(
        language === "bn"
          ? `${formatCurrency(paymentAmount)} সফলভাবে পরিশোধ করা হয়েছে`
          : `${formatCurrency(paymentAmount)} paid successfully`
      );
      
      setPayDueModalOpen(false);
      setPayingSupplier(null);
      loadData();
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    } finally {
      setIsPayingDue(false);
    }
  };

  // Purchase Payment handlers
  const loadPurchasePaymentHistory = async (purchaseId: string) => {
    try {
      const response = await offlineShopService.getPurchasePayments(purchaseId);
      const payments = response?.payments || [];
      setPurchasePaymentHistory(payments.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        payment_method: p.payment_method,
        payment_date: p.payment_date,
        notes: p.notes,
      })));
    } catch (error) {
      console.error("Failed to load payment history:", error);
      setPurchasePaymentHistory([]);
    }
  };

  const openPurchasePaymentModal = async (purchase: Purchase) => {
    setPurchasePaymentHistory([]);
    setPaymentPurchase(purchase);
    setPurchasePaymentAmount(Number(purchase.due_amount) || 0);
    setPurchasePaymentMethod("cash");
    setPurchasePaymentNotes("");
    loadPurchasePaymentHistory(purchase.id);
  };

  const handleAddPurchasePayment = async () => {
    if (!paymentPurchase || purchasePaymentAmount <= 0) return;
    
    setIsProcessingPurchasePayment(true);
    try {
      await offlineShopService.addPurchasePayment(
        paymentPurchase.id,
        purchasePaymentAmount,
        purchasePaymentMethod,
        purchasePaymentNotes
      );
      toast.success(language === "bn" ? "পেমেন্ট যোগ হয়েছে" : "Payment added");
      setPaymentPurchase(null);
      setPurchasePaymentAmount(0);
      setPurchasePaymentNotes("");
      loadData();
    } catch (error) {
      toast.error(language === "bn" ? "পেমেন্ট ব্যর্থ হয়েছে" : "Payment failed");
    } finally {
      setIsProcessingPurchasePayment(false);
    }
  };

  // Trash bin handlers
  const loadTrash = async () => {
    setIsLoadingTrash(true);
    try {
      const res = await offlineShopService.getTrash();
      const allTrash = res.trash || res.items || [];
      const purchaseTrash = allTrash.filter((item: any) => item.original_table === "shop_purchases");
      setTrashItems(purchaseTrash);
    } catch (error) {
      console.error("Failed to load trash:", error);
    } finally {
      setIsLoadingTrash(false);
    }
  };

  const handleRestoreFromTrash = async (id: string) => {
    try {
      await offlineShopService.restoreFromTrash(id, "shop_purchases");
      toast.success(language === "bn" ? "রিস্টোর হয়েছে" : "Restored successfully");
      loadTrash();
      loadData();
    } catch (error) {
      toast.error(language === "bn" ? "রিস্টোর ব্যর্থ হয়েছে" : "Restore failed");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await offlineShopService.permanentDelete(id, "shop_purchases");
      toast.success(language === "bn" ? "স্থায়ীভাবে মুছে ফেলা হয়েছে" : "Permanently deleted");
      loadTrash();
    } catch (error) {
      toast.error(language === "bn" ? "মুছে ফেলা যায়নি" : "Delete failed");
    }
  };

  // Excel import handler
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

        await new Promise(resolve => setTimeout(resolve, 30));
      }

      const purchasesToImport = Object.entries(purchasesBySupplier).map(([supplierName, items]) => ({
        supplier_name: supplierName,
        items,
      }));

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];
      for (const p of purchasesToImport) {
        try {
          await offlineShopService.createPurchase({
            supplier_name: p.supplier_name,
            items: p.items,
          });
          successCount++;
        } catch (err: any) {
          failedCount++;
          errors.push(err.message || "Unknown error");
        }
      }

      setImportProgress({
        total: totalItems,
        current: totalItems,
        success: successCount,
        failed: failedCount,
        currentProduct: language === "bn" ? "সম্পন্ন!" : "Complete!",
        errors,
      });

      if (successCount > 0) {
        toast.success(
          language === "bn"
            ? `${successCount}টি পার্চেজ সফলভাবে যোগ হয়েছে`
            : `${successCount} purchases imported successfully`
        );
        loadData();
      }

      if (failedCount > 0) {
        toast.error(
          language === "bn"
            ? `${failedCount}টি পার্চেজ যোগ হয়নি`
            : `${failedCount} purchases failed to import`
        );
      }

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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Download template
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

    XLSX.writeFile(wb, isEnglish ? "purchase_import_template.xlsx" : "ক্রয়_ইম্পোর্ট_টেমপ্লেট.xlsx");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
  }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Load all purchased products for Add to Stock
  const loadAllPurchasedProducts = async () => {
    try {
      const result = await offlineShopService.getPendingStockItems();
      setProductsToAddToStock(result.items || []);
    } catch (error) {
      console.error("Error loading pending stock items:", error);
      toast.error(language === "bn" ? "প্রোডাক্ট লোড করতে সমস্যা" : "Failed to load products");
    }
  };

  const handleOpenAddToStockModal = async () => {
    setIsAddToStockModalOpen(true);
    await loadAllPurchasedProducts();
  };

  const getBusinessTypeLabel = (type: string) => {
    const bt = BUSINESS_TYPES.find((b) => b.value === type);
    return bt ? (language === "bn" ? bt.label_bn : bt.label_en) : type;
  };

  const getPaymentTermsLabel = (terms: string) => {
    const pt = PAYMENT_TERMS.find((p) => p.value === terms);
    return pt ? (language === "bn" ? pt.label_bn : pt.label_en) : terms;
  };

  const getCategoryLabel = (category: string) => {
    const cat = SUPPLIER_CATEGORIES.find((c) => c.value === category);
    return cat ? (language === "bn" ? cat.label_bn : cat.label_en) : category;
  };

  // Calculate countdown for due payment
  const getDueCountdown = (supplier: Supplier) => {
    if (!supplier.total_due || supplier.total_due <= 0) return null;
    
    const paymentTerms = PAYMENT_TERMS.find(p => p.value === supplier.payment_terms);
    if (!paymentTerms || paymentTerms.days === 0) return null;
    
    const lastPurchase = supplier.last_purchase_date ? new Date(supplier.last_purchase_date) : new Date(supplier.created_at);
    const dueDate = new Date(lastPurchase);
    dueDate.setDate(dueDate.getDate() + paymentTerms.days);
    
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const overdue = Math.abs(diffDays);
      if (overdue > 365) return { text: language === "bn" ? `${Math.floor(overdue/365)} বছর আগে` : `${Math.floor(overdue/365)}y overdue`, overdue: true };
      if (overdue > 30) return { text: language === "bn" ? `${Math.floor(overdue/30)} মাস আগে` : `${Math.floor(overdue/30)}mo overdue`, overdue: true };
      if (overdue > 7) return { text: language === "bn" ? `${Math.floor(overdue/7)} সপ্তাহ আগে` : `${Math.floor(overdue/7)}w overdue`, overdue: true };
      return { text: language === "bn" ? `${overdue} দিন আগে` : `${overdue}d overdue`, overdue: true };
    }
    
    if (diffDays > 365) return { text: language === "bn" ? `${Math.floor(diffDays/365)} বছর বাকি` : `${Math.floor(diffDays/365)}y left`, overdue: false };
    if (diffDays > 30) return { text: language === "bn" ? `${Math.floor(diffDays/30)} মাস বাকি` : `${Math.floor(diffDays/30)}mo left`, overdue: false };
    if (diffDays > 7) return { text: language === "bn" ? `${Math.floor(diffDays/7)} সপ্তাহ বাকি` : `${Math.floor(diffDays/7)}w left`, overdue: false };
    return { text: language === "bn" ? `${diffDays} দিন বাকি` : `${diffDays}d left`, overdue: false };
  };

  // Calculate supplier statistics and product summary
  const supplierStats = viewingSupplier ? {
    totalPurchases: Number(viewingSupplier.total_purchases) || 0,
    totalDue: Number(viewingSupplier.total_due) || 0,
    purchaseCount: supplierPurchases.length,
    averageOrder: supplierPurchases.length > 0 
      ? supplierPurchases.reduce((sum, p) => sum + Number(p.total_amount), 0) / supplierPurchases.length 
      : 0,
  } : null;

  // Calculate product summary from all purchases
  const productSummary: ProductSummary[] = supplierPurchases.reduce((acc, purchase) => {
    if (purchase.items) {
      purchase.items.forEach((item) => {
        const existing = acc.find((p) => p.name === item.product_name);
        if (existing) {
          existing.totalQuantity += Number(item.quantity);
          existing.totalAmount += Number(item.total);
          if (new Date(purchase.purchase_date) > new Date(existing.lastPurchaseDate)) {
            existing.lastPurchaseDate = purchase.purchase_date;
          }
        } else {
          acc.push({
            name: item.product_name,
            totalQuantity: Number(item.quantity),
            totalAmount: Number(item.total),
            lastPurchaseDate: purchase.purchase_date,
          });
        }
      });
    }
    return acc;
  }, [] as ProductSummary[]);

  return (
    <ShopLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {language === "bn" ? "সরবরাহকারী ও ক্রয়" : "Suppliers & Purchases"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {language === "bn" 
                ? "সরবরাহকারী পরিচালনা এবং পণ্য ক্রয়" 
                : "Manage suppliers and product purchases"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
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
            <Button variant="outline" onClick={handleOpenAddToStockModal} size="sm" className="text-xs sm:text-sm">
              <PackagePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {language === "bn" ? "স্টকে যোগ" : "Add to Stock"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs sm:text-sm"
              onClick={() => { setShowTrash(true); loadTrash(); }}
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {language === "bn" ? "ট্র্যাশ" : "Trash"}
            </Button>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} size="sm" className="text-xs sm:text-sm">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {language === "bn" ? "নতুন সরবরাহকারী / ক্রয়" : "New Supplier / Purchase"}
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suppliers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {language === "bn" ? "সরবরাহকারী তালিকা" : "Supplier List"} ({filteredSuppliers.length})
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t("shop.searchSuppliers")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedSupplierIds.length > 0 && (
              <Button variant="destructive" size="sm" disabled={isBulkDeleting} onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {language === "bn" ? "মুছুন" : "Delete"} ({selectedSupplierIds.length})
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedSupplierIds.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                        onCheckedChange={toggleSelectAllSuppliers}
                      />
                    </TableHead>
                    <TableHead>{language === "bn" ? "সরবরাহকারী" : "Supplier"}</TableHead>
                    <TableHead>{language === "bn" ? "ধরন" : "Type"}</TableHead>
                    <TableHead>{language === "bn" ? "মোবাইল" : "Mobile"}</TableHead>
                    <TableHead className="text-right">{language === "bn" ? "মোট ক্রয়" : "Total Purchase"}</TableHead>
                    <TableHead className="text-right">{language === "bn" ? "পরিশোধিত" : "Paid"}</TableHead>
                    <TableHead className="text-right">{language === "bn" ? "বাকি" : "Due"}</TableHead>
                    <TableHead>{language === "bn" ? "সর্বশেষ ক্রয়" : "Last Purchase"}</TableHead>
                    <TableHead className="text-right">{language === "bn" ? "অ্যাকশন" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                          {t("common.loading")}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">{t("shop.noSuppliers")}</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map((supplier) => {
                      const dueCountdown = getDueCountdown(supplier);
                      return (
                        <TableRow key={supplier.id} className={selectedSupplierIds.includes(supplier.id) ? "bg-muted/50" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSupplierIds.includes(supplier.id)}
                              onCheckedChange={() => toggleSelectOneSupplier(supplier.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{supplier.name}</p>
                                <p className="text-xs text-muted-foreground">{getBusinessTypeLabel(supplier.business_type || "wholesale")}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getCategoryLabel(supplier.category || "local")}</Badge>
                          </TableCell>
                          <TableCell>
                            {supplier.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {supplier.phone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(Number(supplier.total_purchases) || 0)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency((Number(supplier.total_purchases) || 0) - (Number(supplier.total_due) || 0))}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              {Number(supplier.total_due) > 0 ? (
                                <>
                                  <Badge variant="destructive">{formatCurrency(Number(supplier.total_due))}</Badge>
                                  {dueCountdown && (
                                    <span className={`text-xs flex items-center gap-1 ${dueCountdown.overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                                      <Timer className="h-3 w-3" />
                                      {dueCountdown.text}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <Badge variant="secondary">{language === "bn" ? "০" : "0"}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {supplier.last_purchase_date 
                              ? formatDate(supplier.last_purchase_date)
                              : "-"
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {Number(supplier.total_due) > 0 && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleOpenPayDue(supplier)}
                                  className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                >
                                  <Banknote className="h-4 w-4 mr-1" />
                                  {language === "bn" ? "পরিশোধ" : "Pay"}
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigate(`/offline-shop/suppliers/${supplier.id}`)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t("shop.details")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditSupplier(supplier)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    {t("common.edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteSupplier(supplier.id)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("common.delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Purchases Section */}
        <div className="space-y-4 mt-8 pt-6 border-t">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {language === "bn" ? "ক্রয় তালিকা" : "Purchase List"} ({filteredPurchases.length})
            </h2>
          </div>
          
          {/* Search and Filter */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-[140px] justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {purchaseDateFrom ? format(purchaseDateFrom, "dd/MM/yyyy") : (language === "bn" ? "থেকে" : "From")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={purchaseDateFrom}
                      onSelect={setPurchaseDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-[140px] justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {purchaseDateTo ? format(purchaseDateTo, "dd/MM/yyyy") : (language === "bn" ? "পর্যন্ত" : "To")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={purchaseDateTo}
                      onSelect={setPurchaseDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {selectedPurchaseIds.size > 0 && (
                <Button variant="destructive" size="sm" disabled={isBulkDeleting} onClick={() => setPurchaseDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {language === "bn" ? "মুছুন" : "Delete"} ({selectedPurchaseIds.size})
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPurchaseIds.size === filteredPurchases.length && filteredPurchases.length > 0}
                        onCheckedChange={toggleSelectAllPurchases}
                      />
                    </TableHead>
                    <TableHead>{language === "bn" ? "তারিখ" : "Date"}</TableHead>
                    <TableHead>{language === "bn" ? "সরবরাহকারী" : "Supplier"}</TableHead>
                    <TableHead className="hidden md:table-cell">{language === "bn" ? "পণ্য" : "Products"}</TableHead>
                    <TableHead className="text-right">{language === "bn" ? "মোট" : "Total"}</TableHead>
                    <TableHead className="text-right">{language === "bn" ? "বাকি" : "Due"}</TableHead>
                    <TableHead>{language === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                    <TableHead className="text-right">{language === "bn" ? "অ্যাকশন" : "Actions"}</TableHead>
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
                        <p>{language === "bn" ? "কোনো ক্রয় পাওয়া যায়নি" : "No purchases found"}</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPurchases.map((purchase) => (
                      <TableRow key={purchase.id} className={selectedPurchaseIds.has(purchase.id) ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPurchaseIds.has(purchase.id)}
                            onCheckedChange={() => toggleSelectOnePurchase(purchase.id)}
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>
                            <p className="whitespace-nowrap">{new Date(purchase.purchase_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}</p>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                              {new Date(purchase.purchase_date).toLocaleTimeString(language === "bn" ? "bn-BD" : "en-US", { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[150px]">
                          <span className="truncate block">{purchase.supplier_name || "-"}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
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
                        <TableCell className="text-right font-medium whitespace-nowrap">{formatCurrency(Number(purchase.total_amount))}</TableCell>
                        <TableCell className="text-right">
                          {Number(purchase.due_amount) > 0 ? (
                            <span className="text-destructive font-medium whitespace-nowrap">
                              {formatCurrency(Number(purchase.due_amount))}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={purchase.payment_status === "paid" ? "default" : purchase.payment_status === "partial" ? "secondary" : "destructive"} className="text-xs">
                            {purchase.payment_status === "paid" 
                              ? (language === "bn" ? "পরিশোধিত" : "Paid") 
                              : purchase.payment_status === "partial"
                              ? (language === "bn" ? "আংশিক" : "Partial")
                              : (language === "bn" ? "বাকি" : "Due")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {Number(purchase.due_amount) > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openPurchasePaymentModal(purchase)}
                                title={language === "bn" ? "পেমেন্ট করুন" : "Add Payment"}
                              >
                                <CreditCard className="h-4 w-4 text-primary" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewingPurchase(purchase)}
                            >
                              <Eye className="h-4 w-4" />
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
      </div>

      {/* Add/Edit Supplier Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle className="text-xl">{editingSupplier ? t("shop.editSupplier") : (language === "bn" ? "নতুন সরবরাহকারী / ক্রয়" : "New Supplier / Purchase")}</DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? "সরবরাহকারীর তথ্য এবং প্রোডাক্ট ক্রয়/অর্ডার একসাথে যোগ করুন"
                : "Add supplier info and product purchases/orders together"
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs value={modalTab} onValueChange={setModalTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {language === "bn" ? "সরবরাহকারী তথ্য" : "Supplier Info"}
              </TabsTrigger>
              <TabsTrigger value="purchase" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                {language === "bn" ? "প্রোডাক্ট ক্রয়/অর্ডার" : "Product Purchase/Order"}
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden mt-4">
              <div className="flex-1 overflow-y-auto">
                <TabsContent value="info" className="mt-0 space-y-6">
                  {/* Previous Supplier Search */}
                  {!editingSupplier && (
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
                        <Search className="h-4 w-4" />
                        {language === "bn" ? "আগের সরবরাহকারী খুঁজুন" : "Find Previous Supplier"}
                      </h3>
                      <div className="relative">
                        {selectedPreviousSupplier ? (
                          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">{selectedPreviousSupplier.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {selectedPreviousSupplier.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {selectedPreviousSupplier.phone}
                                    </span>
                                  )}
                                  {Number(selectedPreviousSupplier.total_due) > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {language === "bn" ? "বাকি:" : "Due:"} {formatCurrency(Number(selectedPreviousSupplier.total_due))}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={clearPreviousSupplier}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              value={supplierSearchQuery}
                              onChange={(e) => {
                                setSupplierSearchQuery(e.target.value);
                                setShowSupplierDropdown(e.target.value.length > 0);
                              }}
                              onFocus={() => setShowSupplierDropdown(supplierSearchQuery.length > 0)}
                              placeholder={language === "bn" ? "নাম, মোবাইল বা ইমেইল দিয়ে খুঁজুন..." : "Search by name, mobile or email..."}
                              className="pl-10"
                            />
                            {showSupplierDropdown && filteredPreviousSuppliers.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredPreviousSuppliers.slice(0, 5).map((supplier) => (
                                  <button
                                    key={supplier.id}
                                    type="button"
                                    className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between gap-2"
                                    onClick={() => handleSelectPreviousSupplier(supplier)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <p className="font-medium text-sm">{supplier.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {supplier.phone || supplier.email || ""}
                                        </p>
                                      </div>
                                    </div>
                                    {Number(supplier.total_due) > 0 && (
                                      <Badge variant="destructive" className="text-xs">
                                        {formatCurrency(Number(supplier.total_due))}
                                      </Badge>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
                      <Building2 className="h-4 w-4" />
                      {language === "bn" ? "মৌলিক তথ্য" : "Basic Information"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">{t("shop.name")} *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={language === "bn" ? "সরবরাহকারীর নাম" : "Supplier name"}
                          required
                          disabled={!!selectedPreviousSupplier}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{language === "bn" ? "সরবরাহকারীর ধরন" : "Supplier Type"}</Label>
                        <Select value={formData.business_type} onValueChange={(v) => setFormData({ ...formData, business_type: v })} disabled={!!selectedPreviousSupplier}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {language === "bn" ? type.label_bn : type.label_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>{language === "bn" ? "ক্যাটাগরি" : "Category"}</Label>
                        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })} disabled={!!selectedPreviousSupplier}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPLIER_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {language === "bn" ? cat.label_bn : cat.label_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
                      <Phone className="h-4 w-4" />
                      {language === "bn" ? "যোগাযোগের তথ্য" : "Contact Information"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="phone">{t("shop.phone")}</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder={language === "bn" ? "ফোন নম্বর" : "Phone number"}
                          disabled={!!selectedPreviousSupplier}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">{t("shop.email")}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder={language === "bn" ? "ইমেইল" : "Email"}
                          disabled={!!selectedPreviousSupplier}
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label htmlFor="address">{t("shop.address")}</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder={language === "bn" ? "সম্পূর্ণ ঠিকানা" : "Full address"}
                          rows={2}
                          disabled={!!selectedPreviousSupplier}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
                      <CreditCard className="h-4 w-4" />
                      {language === "bn" ? "আর্থিক তথ্য" : "Financial Info"}
                    </h3>
                    
                    {selectedPreviousSupplier && Number(selectedPreviousSupplier.total_due) > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                              {language === "bn" ? "আগের বাকি পাওয়া গেছে" : "Previous Due Found"}
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              {language === "bn"
                                ? `এই সরবরাহকারীর কাছে ${formatCurrency(Number(selectedPreviousSupplier.total_due))} বাকি আছে।`
                                : `This supplier has ${formatCurrency(Number(selectedPreviousSupplier.total_due))} outstanding.`
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="opening_balance">
                          {selectedPreviousSupplier 
                            ? (language === "bn" ? "আগের বাকি (স্বয়ংক্রিয়)" : "Previous Due (Auto)")
                            : (language === "bn" ? "সরবরাহকারী পাওনা" : "Supplier Payable")
                          }
                        </Label>
                        <Input
                          id="opening_balance"
                          type="number"
                          min="0"
                          value={formData.opening_balance}
                          onChange={(e) => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
                          disabled={!!selectedPreviousSupplier}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{language === "bn" ? "পেমেন্ট শর্ত" : "Payment Terms"}</Label>
                        <Select value={formData.payment_terms} onValueChange={(v) => setFormData({ ...formData, payment_terms: v })} disabled={!!selectedPreviousSupplier}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_TERMS.map((term) => (
                              <SelectItem key={term.value} value={term.value}>
                                {language === "bn" ? term.label_bn : term.label_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">{language === "bn" ? "নোট" : "Notes"}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={language === "bn" ? "অতিরিক্ত মন্তব্য..." : "Additional notes..."}
                      rows={2}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="purchase" className="mt-0 space-y-6">
                  {/* Purchase Type Toggle */}
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium">{language === "bn" ? "ক্রয়ের ধরন:" : "Purchase Type:"}</Label>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant={!isOrder ? "default" : "outline"} size="sm" onClick={() => setIsOrder(false)}>
                          {language === "bn" ? "সরাসরি ক্রয়" : "Direct Purchase"}
                        </Button>
                        <Button type="button" variant={isOrder ? "default" : "outline"} size="sm" onClick={() => setIsOrder(true)}>
                          {language === "bn" ? "অর্ডার" : "Order"}
                        </Button>
                      </div>
                    </div>
                    {isOrder && (
                      <div className="flex items-center gap-2 mt-3">
                        <Label className="text-sm">{language === "bn" ? "অর্ডার স্ট্যাটাস:" : "Order Status:"}</Label>
                        <Select value={orderStatus} onValueChange={(v) => setOrderStatus(v as any)}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {language === "bn" ? status.label_bn : status.label_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Purchase Items Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
                        <Package className="h-4 w-4" />
                        {language === "bn" ? "প্রোডাক্ট তালিকা" : "Product List"}
                      </h3>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={loadSupplierProducts}
                          disabled={isLoadingSupplierProducts || (!selectedPreviousSupplier && !formData.name)}
                        >
                          {isLoadingSupplierProducts ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <History className="h-4 w-4 mr-1" />
                          )}
                          {language === "bn" ? "আগের প্রোডাক্ট" : "Add Existing Product"}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={addPurchaseItem}>
                          <Plus className="h-4 w-4 mr-1" />
                          {language === "bn" ? "নতুন প্রোডাক্ট" : "Add New Product"}
                        </Button>
                      </div>
                    </div>

                    {purchaseItems.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          {language === "bn" ? "কোন প্রোডাক্ট যোগ করা হয়নি" : "No products added"}
                        </p>
                        <div className="flex gap-2 justify-center mt-2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={loadSupplierProducts}
                            disabled={isLoadingSupplierProducts || (!selectedPreviousSupplier && !formData.name)}
                          >
                            <History className="h-4 w-4 mr-1" />
                            {language === "bn" ? "আগের প্রোডাক্ট" : "Add Existing"}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={addPurchaseItem}>
                            <Plus className="h-4 w-4 mr-1" />
                            {language === "bn" ? "নতুন প্রোডাক্ট" : "Add New"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">{language === "bn" ? "প্রোডাক্টের নাম" : "Product Name"} *</TableHead>
                              <TableHead className="w-[80px] text-center">{language === "bn" ? "পরিমাণ" : "Qty"}</TableHead>
                              <TableHead className="w-[100px] text-right">{language === "bn" ? "পাইকারি দাম" : "Unit Price"}</TableHead>
                              <TableHead className="w-[100px] text-right">{language === "bn" ? "বিক্রয় দাম" : "Sell Price"}</TableHead>
                              <TableHead className="w-[100px] text-right">{language === "bn" ? "মোট" : "Total"}</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {purchaseItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <Input
                                    value={item.product_name}
                                    onChange={(e) => updatePurchaseItem(item.id, "product_name", e.target.value)}
                                    placeholder={language === "bn" ? "প্রোডাক্টের নাম" : "Product name"}
                                    className="h-8"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updatePurchaseItem(item.id, "quantity", Number(e.target.value))}
                                    className="h-8 text-center"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={item.unit_price}
                                    onChange={(e) => updatePurchaseItem(item.id, "unit_price", Number(e.target.value))}
                                    className="h-8 text-right"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={item.selling_price}
                                    onChange={(e) => updatePurchaseItem(item.id, "selling_price", Number(e.target.value))}
                                    className="h-8 text-right"
                                  />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(item.total)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => removePurchaseItem(item.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Payment Section */}
                  {purchaseItems.length > 0 && (
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{language === "bn" ? "মোট ক্রয় মূল্য:" : "Total Purchase:"}</span>
                        <span className="text-xl font-bold">{formatCurrency(totalPurchaseAmount)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>{language === "bn" ? "পরিশোধিত টাকা" : "Paid Amount"}</Label>
                          <Input
                            type="number"
                            min="0"
                            max={totalPurchaseAmount}
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label>{language === "bn" ? "বাকি থাকবে" : "Due Amount"}</Label>
                            {selectedPreviousSupplier && Number(selectedPreviousSupplier.total_due) > 0 && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="includePreviousDue"
                                  checked={includePreviousDue}
                                  onCheckedChange={(checked) => setIncludePreviousDue(checked === true)}
                                />
                                <Label htmlFor="includePreviousDue" className="text-xs text-muted-foreground cursor-pointer">
                                  {language === "bn" 
                                    ? `আগের বাকি যোগ করুন (${formatCurrency(Number(selectedPreviousSupplier.total_due))})` 
                                    : `Add previous due (${formatCurrency(Number(selectedPreviousSupplier.total_due))})`}
                                </Label>
                              </div>
                            )}
                          </div>
                          <Input
                            value={formatCurrency(dueAmount)}
                            disabled
                            className={dueAmount > 0 ? "text-destructive font-medium" : "text-green-600"}
                          />
                        </div>
                      </div>

                      {dueAmount > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>{language === "bn" ? "বাকি শোধের তারিখ" : "Due Payment Date"}</Label>
                            <Input
                              type="date"
                              value={duePaymentDate}
                              onChange={(e) => setDuePaymentDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>{language === "bn" ? "পেমেন্ট মাধ্যম" : "Payment Method"}</Label>
                            <Select value={formPurchasePaymentMethod} onValueChange={setFormPurchasePaymentMethod}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PAYMENT_METHODS.map((method) => (
                                  <SelectItem key={method.value} value={method.value}>
                                    {language === "bn" ? method.label_bn : method.label_en}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label>{language === "bn" ? "নোট/মন্তব্য" : "Notes"}</Label>
                        <Textarea
                          value={purchaseNotesField}
                          onChange={(e) => setPurchaseNotesField(e.target.value)}
                          placeholder={language === "bn" ? "অর্ডার বা ক্রয় সম্পর্কে যেকোন মন্তব্য..." : "Any notes about this order/purchase..."}
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>

              <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === "bn" ? "প্রক্রিয়াকরণ..." : "Processing..."}
                    </>
                  ) : (
                    editingSupplier ? t("shop.update") : (
                      purchaseItems.length > 0 
                        ? (language === "bn" ? "সরবরাহকারী ও ক্রয় সেভ করুন" : "Save Supplier & Purchase")
                        : t("common.add")
                    )
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* View Purchase Details Modal */}
      <Dialog open={!!viewingPurchase} onOpenChange={() => setViewingPurchase(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === "bn" ? "ক্রয়ের বিস্তারিত" : "Purchase Details"}</DialogTitle>
          </DialogHeader>
          {viewingPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === "bn" ? "সরবরাহকারী" : "Supplier"}</p>
                  <p className="font-medium">{viewingPurchase.supplier_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "bn" ? "তারিখ" : "Date"}</p>
                  <p className="font-medium">{formatDate(viewingPurchase.purchase_date)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === "bn" ? "মোট" : "Total"}</p>
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
                openPurchasePaymentModal(viewingPurchase);
              }}>
                <CreditCard className="h-4 w-4 mr-2" />
                {language === "bn" ? "পেমেন্ট করুন" : "Add Payment"}
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewingPurchase(null)}>{t("shop.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Supplier Due Modal */}
      <Dialog open={payDueModalOpen} onOpenChange={setPayDueModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" />
              {language === "bn" ? "বাকি পরিশোধ করুন" : "Pay Outstanding Due"}
            </DialogTitle>
            <DialogDescription>
              {payingSupplier && (
                <>
                  {language === "bn" ? "সরবরাহকারী:" : "Supplier:"} <span className="font-medium">{payingSupplier.name}</span>
                  <br />
                  {language === "bn" ? "মোট বাকি:" : "Total Due:"}{" "}
                  <span className="font-bold text-destructive">{formatCurrency(Number(payingSupplier.total_due))}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "bn" ? "পরিমাণ" : "Amount"}</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                max={payingSupplier ? Number(payingSupplier.total_due) : undefined}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === "bn" ? "পেমেন্ট মেথড" : "Payment Method"}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {language === "bn" ? method.label_bn : method.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === "bn" ? "নোট" : "Notes"}</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder={language === "bn" ? "ঐচ্ছিক নোট..." : "Optional notes..."}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDueModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handlePayDue}
              disabled={isPayingDue || paymentAmount <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPayingDue ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {language === "bn" ? "পরিশোধ করুন" : "Pay Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Payment Modal */}
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
                  value={purchasePaymentAmount}
                  onChange={(e) => setPurchasePaymentAmount(Number(e.target.value))}
                  max={paymentPurchase ? Number(paymentPurchase.due_amount) : undefined}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === "bn" ? "পেমেন্ট মেথড" : "Payment Method"}</Label>
                <Select value={purchasePaymentMethod} onValueChange={setPurchasePaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {language === "bn" ? method.label_bn : method.label_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === "bn" ? "নোট" : "Notes"}</Label>
                <Textarea
                  value={purchasePaymentNotes}
                  onChange={(e) => setPurchasePaymentNotes(e.target.value)}
                  placeholder={language === "bn" ? "ঐচ্ছিক নোট..." : "Optional notes..."}
                />
              </div>

              <Button 
                onClick={handleAddPurchasePayment} 
                className="w-full" 
                disabled={isProcessingPurchasePayment || purchasePaymentAmount <= 0}
              >
                {isProcessingPurchasePayment ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {language === "bn" ? "পেমেন্ট সংরক্ষণ করুন" : "Save Payment"}
              </Button>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {purchasePaymentHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2" />
                  <p>{language === "bn" ? "কোনো পেমেন্ট হিস্ট্রি নেই" : "No payment history"}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {purchasePaymentHistory.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.payment_date)} • {payment.payment_method}
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
                      {language === "bn" ? "মুছে ফেলা হয়েছে:" : "Deleted:"} {formatDate(item.deleted_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleRestoreFromTrash(item.id)}>
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

      {/* Delete Confirm Dialogs */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          handleBulkDeleteSuppliers();
          setDeleteDialogOpen(false);
        }}
        title={language === "en" ? "suppliers" : "সরবরাহকারী"}
        itemCount={selectedSupplierIds.length}
        isSoftDelete={true}
        isLoading={isBulkDeleting}
      />

      <DeleteConfirmDialog
        open={purchaseDeleteDialogOpen}
        onOpenChange={setPurchaseDeleteDialogOpen}
        onConfirm={() => {
          handleBulkDeletePurchases();
          setPurchaseDeleteDialogOpen(false);
        }}
        title={language === "en" ? "purchases" : "পার্চেজ"}
        itemCount={selectedPurchaseIds.size}
        isSoftDelete={true}
        isLoading={isBulkDeleting}
      />

      {/* Add to Stock Modal */}
      <AddToStockModal
        isOpen={isAddToStockModalOpen}
        onClose={() => setIsAddToStockModalOpen(false)}
        products={productsToAddToStock}
        onSuccess={loadData}
      />

      {/* Existing Products from Supplier Modal */}
      <Dialog open={showExistingProductsModal} onOpenChange={setShowExistingProductsModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {language === "bn" ? "আগে কেনা প্রোডাক্ট" : "Previously Purchased Products"}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? `${selectedPreviousSupplier?.name || formData.name} থেকে আগে যা কেনা হয়েছে`
                : `Products previously bought from ${selectedPreviousSupplier?.name || formData.name}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-2 py-4">
              {supplierProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {language === "bn" ? "এই সাপ্লায়ার থেকে আগে কিছু কেনা হয়নি" : "No previous purchases from this supplier"}
                  </p>
                </div>
              ) : (
                supplierProducts.map((product, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{product.product_name}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {language === "bn" ? "পাইকারি" : "Cost"}: ৳{product.last_unit_price?.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {language === "bn" ? "বিক্রয়" : "Sell"}: ৳{product.last_selling_price?.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          {product.purchase_count}x
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => addExistingProduct(product)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {language === "bn" ? "যোগ করুন" : "Add"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExistingProductsModal(false)}>
              {language === "bn" ? "বন্ধ করুন" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ShopLayout>
  );
};

export default ShopSuppliers;
