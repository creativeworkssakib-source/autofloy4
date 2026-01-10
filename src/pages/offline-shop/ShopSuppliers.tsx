import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Truck, Phone, Mail, Eye, Building2, MapPin, CreditCard, Calendar, FileText, Package, DollarSign, TrendingUp, Clock, Info, ShoppingCart, Check, X, Banknote, Timer, AlertTriangle, PackagePlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DateRangeFilter, { DateRangePreset, DateRange, getDateRangeFromPreset } from "@/components/offline-shop/DateRangeFilter";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { offlineShopService } from "@/services/offlineShopService";
import { useLanguage } from "@/contexts/LanguageContext";

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
  purchase_date: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  invoice_number?: string;
  items?: PurchaseItem[];
}

interface PurchaseItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  expiry_date?: string;
  product_id?: string;
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Date filter state
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('this_year');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset('this_year'));
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);


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
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [isOrder, setIsOrder] = useState(false);
  const [orderStatus, setOrderStatus] = useState<"pending" | "confirmed" | "received" | "cancelled">("pending");
  const [duePaymentDate, setDuePaymentDate] = useState("");
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState("cash");

  // Add to stock modal state
  const [isAddToStockModalOpen, setIsAddToStockModalOpen] = useState(false);
  const [allPurchasedProducts, setAllPurchasedProducts] = useState<{
    name: string; 
    quantity: number; 
    unit_price: number; 
    selling_price: number; 
    supplier_name: string; 
    purchase_date: string; 
    product_id?: string;
    // Editable fields
    sku?: string;
    barcode?: string;
    brand?: string;
    category?: string;
    description?: string;
    unit?: string;
    min_stock_alert?: number;
    expiry_date?: string;
  }[]>([]);
  const [selectedProductsToAdd, setSelectedProductsToAdd] = useState<string[]>([]);
  const [isAddingToStock, setIsAddingToStock] = useState(false);
  const [editingStockProduct, setEditingStockProduct] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await offlineShopService.getSuppliers();
      setSuppliers(result.suppliers || []);
    } catch (error) {
      toast.error(t("shop.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone?.includes(searchQuery);
      
      // Filter by date (based on created_at or last_purchase_date)
      const dateToCheck = s.last_purchase_date ? new Date(s.last_purchase_date) : new Date(s.created_at);
      const matchesDate = isWithinInterval(dateToCheck, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
      
      return matchesSearch && matchesDate;
    });
  }, [suppliers, searchQuery, dateRange]);

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSuppliers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSuppliers.map((s) => s.id));
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
      const result = await offlineShopService.deleteSuppliers(selectedIds);
      const deletedCount = result.deleted?.length || 0;
      toast.success(
        language === "bn"
          ? `${deletedCount}টি সরবরাহকারী ট্র্যাশে সরানো হয়েছে`
          : `${deletedCount} supplier(s) moved to trash`
      );
      setSelectedIds([]);
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
    try {
      let supplierId = editingSupplier?.id || selectedPreviousSupplier?.id;

      if (editingSupplier) {
        await offlineShopService.updateSupplier({ id: editingSupplier.id, ...formData });
        toast.success(t("shop.supplierUpdated"));
      } else if (selectedPreviousSupplier) {
        // Using existing supplier - no need to create, just use their ID for purchase
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
            payment_method: purchasePaymentMethod,
            due_payment_date: duePaymentDate || null,
            notes: purchaseNotes + (isOrder ? ` [${language === "bn" ? "অর্ডার স্ট্যাটাস" : "Order Status"}: ${ORDER_STATUS.find(s => s.value === orderStatus)?.[language === "bn" ? "label_bn" : "label_en"]}]` : ""),
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
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await offlineShopService.deleteSupplier(id);
      toast.success(language === "bn" ? "সরবরাহকারী ট্র্যাশে সরানো হয়েছে" : "Supplier moved to trash");
      loadData();
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    }
  };

  const handleView = async (supplier: Supplier) => {
    setViewingSupplier(supplier);
    setActiveTab("info");
    try {
      const result = await offlineShopService.getSupplier(supplier.id);
      setSupplierPurchases(result.purchases || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
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
    setPurchaseNotes("");
    setIsOrder(false);
    setOrderStatus("pending");
    setDuePaymentDate("");
    setPurchasePaymentMethod("cash");
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

  // Detect matching supplier based on contact info
  const detectMatchingSupplier = () => {
    const { name, phone, email } = formData;
    if (!name && !phone && !email) return null;
    
    return suppliers.find((s) => {
      const nameMatch = name && s.name.toLowerCase() === name.toLowerCase();
      const phoneMatch = phone && s.phone === phone;
      const emailMatch = email && s.email?.toLowerCase() === email.toLowerCase();
      return nameMatch || phoneMatch || emailMatch;
    });
  };

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

  // Pay Due Handler
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

  // Load all purchased products from all suppliers
  const loadAllPurchasedProducts = async () => {
    try {
      const allProducts: typeof allPurchasedProducts = [];
      
      for (const supplier of suppliers) {
        const result = await offlineShopService.getSupplier(supplier.id);
        const purchases = result.purchases || [];
        
        purchases.forEach((purchase: Purchase) => {
          if (purchase.items) {
            purchase.items.forEach((item) => {
              // Check if this product already exists in allProducts (aggregate by name)
              const existing = allProducts.find(p => p.name.toLowerCase() === item.product_name.toLowerCase());
              if (existing) {
                existing.quantity += Number(item.quantity);
              } else {
                allProducts.push({
                  name: item.product_name,
                  quantity: Number(item.quantity),
                  unit_price: Number(item.unit_price || 0),
                  selling_price: Number((item as any).selling_price || item.unit_price * 1.2),
                  supplier_name: supplier.name,
                  purchase_date: purchase.purchase_date,
                  product_id: item.product_id || undefined,
                  // Default values for editable fields
                  sku: "",
                  barcode: "",
                  brand: "",
                  category: "",
                  description: "",
                  unit: "pcs",
                  min_stock_alert: 5,
                  expiry_date: "",
                });
              }
            });
          }
        });
      }
      
      setAllPurchasedProducts(allProducts);
    } catch (error) {
      console.error("Error loading purchased products:", error);
    }
  };

  // Update product field
  const updateProductField = (index: number, field: string, value: any) => {
    setAllPurchasedProducts(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  // Handle opening the Add to Stock modal
  const handleOpenAddToStockModal = async () => {
    setIsAddToStockModalOpen(true);
    setSelectedProductsToAdd([]);
    await loadAllPurchasedProducts();
  };

  // Toggle product selection for adding to stock
  const toggleProductSelection = (productName: string) => {
    setSelectedProductsToAdd(prev => 
      prev.includes(productName) 
        ? prev.filter(p => p !== productName)
        : [...prev, productName]
    );
  };

  // Select all products
  const selectAllProducts = () => {
    if (selectedProductsToAdd.length === allPurchasedProducts.length) {
      setSelectedProductsToAdd([]);
    } else {
      setSelectedProductsToAdd(allPurchasedProducts.map(p => p.name));
    }
  };

  // Add selected products to stock
  const handleAddToStock = async () => {
    if (selectedProductsToAdd.length === 0) {
      toast.error(language === "bn" ? "কমপক্ষে একটি প্রোডাক্ট নির্বাচন করুন" : "Please select at least one product");
      return;
    }

    const productsToAdd = allPurchasedProducts.filter(p => selectedProductsToAdd.includes(p.name));
    
    // Validate required fields for each selected product
    const invalidProducts: string[] = [];
    for (const product of productsToAdd) {
      if (!product.name?.trim()) {
        invalidProducts.push(language === "bn" ? "(নাম নেই)" : "(no name)");
      } else if (!product.selling_price || product.selling_price <= 0) {
        invalidProducts.push(product.name);
      } else if (!product.unit_price || product.unit_price <= 0) {
        invalidProducts.push(product.name);
      }
    }
    
    if (invalidProducts.length > 0) {
      toast.error(
        language === "bn" 
          ? `এই প্রোডাক্টগুলোর বিক্রয় মূল্য বা ক্রয় মূল্য দেওয়া হয়নি: ${invalidProducts.slice(0, 3).join(", ")}${invalidProducts.length > 3 ? '...' : ''}`
          : `Missing selling or purchase price for: ${invalidProducts.slice(0, 3).join(", ")}${invalidProducts.length > 3 ? '...' : ''}`
      );
      return;
    }

    setIsAddingToStock(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const product of productsToAdd) {
        try {
          await offlineShopService.createProduct({
            name: product.name,
            sku: product.sku || "",
            barcode: product.barcode || "",
            brand: product.brand || "",
            description: product.description || "",
            unit: product.unit || "pcs",
            purchase_price: product.unit_price,
            selling_price: product.selling_price,
            stock_quantity: product.quantity,
            min_stock_alert: product.min_stock_alert || 5,
            supplier_name: product.supplier_name,
            expiry_date: product.expiry_date || null,
            category_id: null, // Will be set if category name matches
            is_active: true,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to add product ${product.name}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          language === "bn"
            ? `${successCount}টি প্রোডাক্ট Products & Stock পেজে যোগ হয়েছে!`
            : `${successCount} products added to Products & Stock!`
        );
      }
      if (failCount > 0) {
        toast.warning(
          language === "bn"
            ? `${failCount}টি প্রোডাক্ট যোগ করা যায়নি`
            : `${failCount} products failed to add`
        );
      }

      setIsAddToStockModalOpen(false);
      setSelectedProductsToAdd([]);
      setEditingStockProduct(null);
    } catch (error) {
      toast.error(language === "bn" ? "প্রোডাক্ট যোগ করতে সমস্যা হয়েছে" : "Failed to add products");
    } finally {
      setIsAddingToStock(false);
    }
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

  const totalUniqueProducts = productSummary.length;
  const totalItemsPurchased = productSummary.reduce((sum, p) => sum + p.totalQuantity, 0);

  return (
    <ShopLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t("shop.suppliersTitle")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("shop.suppliersDesc")} • {suppliers.length} {language === "bn" ? "টি সরবরাহকারী" : "suppliers"}
              {selectedIds.length > 0 && (
                <span className="ml-2 text-primary">
                  ({selectedIds.length} {language === "bn" ? "টি নির্বাচিত" : "selected"})
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" disabled={isBulkDeleting} onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {language === "bn" ? "মুছুন" : "Delete"} ({selectedIds.length})
              </Button>
            )}

            <Button variant="outline" onClick={handleOpenAddToStockModal} size="sm" className="text-xs sm:text-sm">
              <PackagePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">{language === "bn" ? "স্টকে যোগ করুন" : "Add to Stock"}</span>
              <span className="xs:hidden">{language === "bn" ? "স্টক" : "Stock"}</span>
            </Button>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} size="sm" className="text-xs sm:text-sm">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {t("shop.newSupplier")}
            </Button>
          </div>
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
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                      onCheckedChange={toggleSelectAll}
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
                      <TableRow key={supplier.id} className={selectedIds.includes(supplier.id) ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(supplier.id)}
                            onCheckedChange={() => toggleSelectOne(supplier.id)}
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
                                <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t("common.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(supplier.id)} className="text-destructive">
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

      {/* Add/Edit Modal - Simplified */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle className="text-xl">{editingSupplier ? t("shop.editSupplier") : t("shop.newSupplier")}</DialogTitle>
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
                  {/* Previous Supplier Search - Only show when adding new supplier */}
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={clearPreviousSupplier}
                            >
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
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === "bn"
                            ? "আগে থেকে থাকা সরবরাহকারী নির্বাচন করলে তার তথ্য ও বাকি স্বয়ংক্রিয়ভাবে পূরণ হবে"
                            : "Selecting an existing supplier will auto-fill their info and outstanding due"
                          }
                        </p>
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

                  {/* Financial Info - Simplified */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
                      <CreditCard className="h-4 w-4" />
                      {language === "bn" ? "আর্থিক তথ্য" : "Financial Info"}
                    </h3>
                    
                    {/* Show previous supplier due info */}
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
                                ? `এই সরবরাহকারীর কাছে ${formatCurrency(Number(selectedPreviousSupplier.total_due))} বাকি আছে। এই বাকি পরবর্তী ক্রয়ে যোগ হবে।`
                                : `This supplier has ${formatCurrency(Number(selectedPreviousSupplier.total_due))} outstanding. This will be added to future purchases.`
                              }
                            </p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {language === "bn" ? "মোট ক্রয়:" : "Total Purchases:"} {formatCurrency(Number(selectedPreviousSupplier.total_purchases))}
                              </span>
                              {selectedPreviousSupplier.last_purchase_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {language === "bn" ? "সর্বশেষ:" : "Last:"} {formatDate(selectedPreviousSupplier.last_purchase_date)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="opening_balance">
                          {selectedPreviousSupplier 
                            ? (language === "bn" ? "আগের বাকি (স্বয়ংক্রিয়)" : "Previous Due (Auto)")
                            : (language === "bn" ? "সরবরাহকারী পাওনা (আগের বাকি)" : "Supplier Payable (Previous Due)")
                          }
                        </Label>
                        <Input
                          id="opening_balance"
                          type="number"
                          min="0"
                          value={formData.opening_balance}
                          onChange={(e) => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
                          placeholder={language === "bn" ? "আগে থেকে বাকি থাকলে লিখুন" : "Any previous due amount"}
                          disabled={!!selectedPreviousSupplier}
                          className={selectedPreviousSupplier && Number(selectedPreviousSupplier.total_due) > 0 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 font-semibold text-amber-700 dark:text-amber-300" : ""}
                        />
                        <p className="text-xs text-muted-foreground">
                          {selectedPreviousSupplier
                            ? (language === "bn" 
                              ? "এই বাকি আগের সরবরাহকারী থেকে স্বয়ংক্রিয়ভাবে নেওয়া হয়েছে"
                              : "This due is automatically loaded from the selected supplier"
                            )
                            : (language === "bn" 
                              ? "এই সরবরাহকারীর কাছে আগে থেকে বাকি থাকলে এখানে লিখুন"
                              : "Enter any previous outstanding amount owed to this supplier"
                            )
                          }
                        </p>
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
                        <Button
                          type="button"
                          variant={!isOrder ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsOrder(false)}
                        >
                          {language === "bn" ? "সরাসরি ক্রয়" : "Direct Purchase"}
                        </Button>
                        <Button
                          type="button"
                          variant={isOrder ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsOrder(true)}
                        >
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
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
                        <Package className="h-4 w-4" />
                        {language === "bn" ? "প্রোডাক্ট তালিকা" : "Product List"}
                      </h3>
                      <Button type="button" variant="outline" size="sm" onClick={addPurchaseItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        {language === "bn" ? "প্রোডাক্ট যোগ করুন" : "Add Product"}
                      </Button>
                    </div>

                    {purchaseItems.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          {language === "bn" ? "কোন প্রোডাক্ট যোগ করা হয়নি" : "No products added"}
                        </p>
                        <Button type="button" variant="ghost" size="sm" onClick={addPurchaseItem} className="mt-2">
                          <Plus className="h-4 w-4 mr-1" />
                          {language === "bn" ? "প্রথম প্রোডাক্ট যোগ করুন" : "Add first product"}
                        </Button>
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
                              <TableHead className="w-[150px]">{language === "bn" ? "কোথা থেকে কিনলেন" : "Location"}</TableHead>
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
                                  <Input
                                    value={item.location || ""}
                                    onChange={(e) => updatePurchaseItem(item.id, "location", e.target.value)}
                                    placeholder={language === "bn" ? "জায়গা/মার্কেট" : "Place/Market"}
                                    className="h-8"
                                  />
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
                          {includePreviousDue && previousDueAmount > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              {language === "bn" 
                                ? `এই ক্রয়ে আগের বাকি ${formatCurrency(previousDueAmount)} যোগ হয়েছে` 
                                : `Previous due of ${formatCurrency(previousDueAmount)} included in this purchase`}
                            </p>
                          )}
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
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label>{language === "bn" ? "নোট/মন্তব্য" : "Notes"}</Label>
                        <Textarea
                          value={purchaseNotes}
                          onChange={(e) => setPurchaseNotes(e.target.value)}
                          placeholder={language === "bn" ? "অর্ডার বা ক্রয় সম্পর্কে যেকোন মন্তব্য..." : "Any notes about this order/purchase..."}
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>

              <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit">
                  {editingSupplier ? t("shop.update") : (
                    purchaseItems.length > 0 
                      ? (language === "bn" ? "সরবরাহকারী ও ক্রয় সেভ করুন" : "Save Supplier & Purchase")
                      : t("common.add")
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Pay Due Modal */}
      <Dialog open={payDueModalOpen} onOpenChange={setPayDueModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-green-600" />
              {language === "bn" ? "বাকি পরিশোধ করুন" : "Pay Due Amount"}
            </DialogTitle>
            <DialogDescription>
              {payingSupplier?.name} - {language === "bn" ? "মোট বাকি:" : "Total Due:"} {formatCurrency(Number(payingSupplier?.total_due) || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === "bn" ? "পরিশোধের পরিমাণ" : "Payment Amount"}</Label>
              <Input
                type="number"
                min="0"
                max={Number(payingSupplier?.total_due) || 0}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(Number(payingSupplier?.total_due) || 0)}
                >
                  {language === "bn" ? "সম্পূর্ণ বাকি" : "Full Due"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(Math.floor((Number(payingSupplier?.total_due) || 0) / 2))}
                >
                  {language === "bn" ? "অর্ধেক" : "Half"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === "bn" ? "পেমেন্ট মাধ্যম" : "Payment Method"}</Label>
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
              <Label>{language === "bn" ? "নোট (ঐচ্ছিক)" : "Notes (Optional)"}</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder={language === "bn" ? "পেমেন্ট সম্পর্কে মন্তব্য..." : "Payment notes..."}
                rows={2}
              />
            </div>

            {paymentAmount > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex justify-between text-sm">
                  <span>{language === "bn" ? "পরিশোধ করবেন:" : "You will pay:"}</span>
                  <span className="font-bold text-green-600">{formatCurrency(paymentAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>{language === "bn" ? "অবশিষ্ট বাকি থাকবে:" : "Remaining due:"}</span>
                  <span>{formatCurrency(Math.max(0, (Number(payingSupplier?.total_due) || 0) - paymentAmount))}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDueModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button 
              onClick={handlePayDue} 
              disabled={paymentAmount <= 0 || isPayingDue}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPayingDue ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {language === "bn" ? "পরিশোধ করুন" : "Confirm Payment"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewingSupplier} onOpenChange={() => setViewingSupplier(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">{viewingSupplier?.name}</DialogTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  {getCategoryLabel(viewingSupplier?.category || "local")} • {getBusinessTypeLabel(viewingSupplier?.business_type || "wholesale")}
                </p>
              </div>
              <Badge variant={viewingSupplier?.is_active !== false ? "default" : "secondary"}>
                {viewingSupplier?.is_active !== false
                  ? (language === "bn" ? "সক্রিয়" : "Active")
                  : (language === "bn" ? "নিষ্ক্রিয়" : "Inactive")
                }
              </Badge>
            </div>
          </DialogHeader>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <DollarSign className="h-4 w-4" />
                  {language === "bn" ? "মোট ক্রয়" : "Total Purchases"}
                </div>
                <p className="text-xl font-bold mt-1">{formatCurrency(supplierStats?.totalPurchases || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CreditCard className="h-4 w-4" />
                  {language === "bn" ? "বকেয়া" : "Due Amount"}
                </div>
                <p className="text-xl font-bold mt-1 text-destructive">{formatCurrency(supplierStats?.totalDue || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Package className="h-4 w-4" />
                  {language === "bn" ? "মোট অর্ডার" : "Total Orders"}
                </div>
                <p className="text-xl font-bold mt-1">{supplierStats?.purchaseCount || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <TrendingUp className="h-4 w-4" />
                  {language === "bn" ? "মোট আইটেম" : "Total Items"}
                </div>
                <p className="text-xl font-bold mt-1">{totalItemsPurchased}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">
                <Building2 className="h-4 w-4 mr-2" />
                {language === "bn" ? "তথ্য" : "Info"}
              </TabsTrigger>
              <TabsTrigger value="products">
                <Package className="h-4 w-4 mr-2" />
                {language === "bn" ? "প্রোডাক্ট" : "Products"}
              </TabsTrigger>
              <TabsTrigger value="purchases">
                <Calendar className="h-4 w-4 mr-2" />
                {language === "bn" ? "ক্রয়" : "Purchases"}
              </TabsTrigger>
              <TabsTrigger value="notes">
                <FileText className="h-4 w-4 mr-2" />
                {language === "bn" ? "নোট" : "Notes"}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[350px] mt-4">
              <TabsContent value="info" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{language === "bn" ? "যোগাযোগের তথ্য" : "Contact Information"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      {viewingSupplier?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{viewingSupplier.phone}</span>
                        </div>
                      )}
                      {viewingSupplier?.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{viewingSupplier.email}</span>
                        </div>
                      )}
                    </div>
                    {viewingSupplier?.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm">{viewingSupplier.address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{language === "bn" ? "আর্থিক তথ্য" : "Financial Info"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{language === "bn" ? "পেমেন্ট শর্ত" : "Payment Terms"}</span>
                      <span className="text-sm font-medium">{getPaymentTermsLabel(viewingSupplier?.payment_terms || "immediate")}</span>
                    </div>
                    {Number(viewingSupplier?.opening_balance) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{language === "bn" ? "প্রারম্ভিক বাকি" : "Opening Balance"}</span>
                        <span className="text-sm font-medium">{formatCurrency(Number(viewingSupplier?.opening_balance) || 0)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products" className="mt-0">
                {productSummary.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">{language === "bn" ? "কোন প্রোডাক্ট নেই" : "No products yet"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {productSummary.map((product, index) => (
                      <Card key={index}>
                        <CardContent className="py-3 px-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {language === "bn" ? "শেষ ক্রয়:" : "Last:"} {formatDate(product.lastPurchaseDate)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{product.totalQuantity} {language === "bn" ? "পিস" : "pcs"}</p>
                              <p className="text-sm text-muted-foreground">{formatCurrency(product.totalAmount)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="purchases" className="mt-0">
                {supplierPurchases.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">{language === "bn" ? "কোন ক্রয় নেই" : "No purchases yet"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {supplierPurchases.map((purchase) => (
                      <Card key={purchase.id}>
                        <CardContent className="py-3 px-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{purchase.invoice_number || formatDate(purchase.purchase_date)}</p>
                              <p className="text-xs text-muted-foreground">
                                {purchase.items?.length || 0} {language === "bn" ? "টি আইটেম" : "items"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(Number(purchase.total_amount))}</p>
                              <Badge variant={purchase.payment_status === "paid" ? "default" : "destructive"} className="text-xs">
                                {purchase.payment_status === "paid" 
                                  ? (language === "bn" ? "পরিশোধিত" : "Paid")
                                  : (language === "bn" ? `বাকি: ${formatCurrency(Number(purchase.due_amount))}` : `Due: ${formatCurrency(Number(purchase.due_amount))}`)
                                }
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <Card>
                  <CardContent className="py-4">
                    {viewingSupplier?.notes ? (
                      <p className="text-sm whitespace-pre-wrap">{viewingSupplier.notes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">
                        {language === "bn" ? "কোন নোট নেই" : "No notes added"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add to Stock Modal */}
      <Dialog open={isAddToStockModalOpen} onOpenChange={(open) => {
        setIsAddToStockModalOpen(open);
        if (!open) setEditingStockProduct(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5" />
              {language === "bn" ? "স্টকে প্রোডাক্ট যোগ করুন" : "Add Products to Stock"}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? "সাপ্লায়ারদের কাছ থেকে কেনা প্রোডাক্ট সরাসরি Products & Stock পেজে যোগ করুন। এডিট করতে প্রোডাক্টে ক্লিক করুন।" 
                : "Add products purchased from suppliers directly to Products & Stock page. Click on a product to edit details."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {allPurchasedProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {language === "bn" 
                    ? "কোনো সাপ্লায়ারের কাছ থেকে এখনো প্রোডাক্ট কেনা হয়নি" 
                    : "No products purchased from suppliers yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "bn" 
                    ? "প্রথমে সাপ্লায়ার যোগ করুন এবং প্রোডাক্ট কিনুন" 
                    : "Add a supplier and make purchases first"}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-shrink-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedProductsToAdd.length === allPurchasedProducts.length}
                      onCheckedChange={selectAllProducts}
                    />
                    <span className="text-sm font-medium">
                      {language === "bn" ? "সব নির্বাচন করুন" : "Select All"}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {selectedProductsToAdd.length} / {allPurchasedProducts.length} {language === "bn" ? "নির্বাচিত" : "selected"}
                  </Badge>
                </div>

                <ScrollArea className="h-[50vh] border rounded-lg">
                  <div className="p-2 space-y-2 pb-4">
                    {allPurchasedProducts.map((product, index) => {
                      const hasValidPrices = product.selling_price > 0 && product.unit_price > 0;
                      const isSelected = selectedProductsToAdd.includes(product.name);
                      
                      return (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg border transition-colors ${
                            isSelected 
                              ? hasValidPrices 
                                ? 'bg-primary/10 border-primary' 
                                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-400'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => toggleProductSelection(product.name)}
                            />
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => setEditingStockProduct(editingStockProduct === index ? null : index)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{product.name}</p>
                                  {isSelected && !hasValidPrices && (
                                    <Badge variant="outline" className="text-xs border-amber-400 text-amber-600 bg-amber-100 dark:bg-amber-900/30">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      {language === "bn" ? "তথ্য দিন" : "Needs Info"}
                                    </Badge>
                                  )}
                                  {isSelected && hasValidPrices && (
                                    <Badge variant="outline" className="text-xs border-green-400 text-green-600 bg-green-100 dark:bg-green-900/30">
                                      <Check className="h-3 w-3 mr-1" />
                                      {language === "bn" ? "প্রস্তুত" : "Ready"}
                                    </Badge>
                                  )}
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 px-2">
                                  <Pencil className="h-3 w-3 mr-1" />
                                  {language === "bn" ? "এডিট" : "Edit"}
                                </Button>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Truck className="h-3 w-3" />
                                  {product.supplier_name}
                                </span>
                                <span>
                                  {language === "bn" ? "পরিমাণ:" : "Qty:"} {product.quantity}
                                </span>
                                <span className={product.unit_price > 0 ? "" : "text-amber-600 font-medium"}>
                                  {language === "bn" ? "ক্রয়:" : "Cost:"} {product.unit_price > 0 ? formatCurrency(product.unit_price) : (language === "bn" ? "দরকার" : "Required")}
                                </span>
                                <span className={product.selling_price > 0 ? "" : "text-amber-600 font-medium"}>
                                  {language === "bn" ? "বিক্রয়:" : "Sell:"} {product.selling_price > 0 ? formatCurrency(product.selling_price) : (language === "bn" ? "দরকার" : "Required")}
                                </span>
                              </div>
                            </div>
                          </div>

                        {/* Expanded Edit Form */}
                        {editingStockProduct === index && (
                          <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs">{language === "bn" ? "প্রোডাক্ট নাম *" : "Product Name *"}</Label>
                              <Input
                                value={product.name}
                                onChange={(e) => updateProductField(index, 'name', e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">SKU</Label>
                              <Input
                                value={product.sku || ""}
                                onChange={(e) => updateProductField(index, 'sku', e.target.value)}
                                placeholder="SKU-001"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "বারকোড" : "Barcode"}</Label>
                              <Input
                                value={product.barcode || ""}
                                onChange={(e) => updateProductField(index, 'barcode', e.target.value)}
                                placeholder="1234567890"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "ব্র্যান্ড" : "Brand"}</Label>
                              <Input
                                value={product.brand || ""}
                                onChange={(e) => updateProductField(index, 'brand', e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "ক্যাটাগরি" : "Category"}</Label>
                              <Input
                                value={product.category || ""}
                                onChange={(e) => updateProductField(index, 'category', e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "ইউনিট" : "Unit"}</Label>
                              <Select
                                value={product.unit || "pcs"}
                                onValueChange={(value) => updateProductField(index, 'unit', value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pcs">pcs</SelectItem>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="ltr">ltr</SelectItem>
                                  <SelectItem value="box">box</SelectItem>
                                  <SelectItem value="pack">pack</SelectItem>
                                  <SelectItem value="dozen">dozen</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "ক্রয় মূল্য *" : "Purchase Price *"}</Label>
                              <Input
                                type="number"
                                value={product.unit_price}
                                onChange={(e) => updateProductField(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "বিক্রয় মূল্য *" : "Selling Price *"}</Label>
                              <Input
                                type="number"
                                value={product.selling_price}
                                onChange={(e) => updateProductField(index, 'selling_price', parseFloat(e.target.value) || 0)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "স্টক পরিমাণ *" : "Stock Qty *"}</Label>
                              <Input
                                type="number"
                                value={product.quantity}
                                onChange={(e) => updateProductField(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "মিনিমাম স্টক" : "Min Stock Alert"}</Label>
                              <Input
                                type="number"
                                value={product.min_stock_alert || 5}
                                onChange={(e) => updateProductField(index, 'min_stock_alert', parseInt(e.target.value) || 5)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "সাপ্লায়ার" : "Supplier"}</Label>
                              <Input
                                value={product.supplier_name}
                                onChange={(e) => updateProductField(index, 'supplier_name', e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "মেয়াদ উত্তীর্ণ" : "Expiry Date"}</Label>
                              <Input
                                type="date"
                                value={product.expiry_date || ""}
                                onChange={(e) => updateProductField(index, 'expiry_date', e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-2 md:col-span-4">
                              <Label className="text-xs">{language === "bn" ? "বিবরণ" : "Description"}</Label>
                              <Textarea
                                value={product.description || ""}
                                onChange={(e) => updateProductField(index, 'description', e.target.value)}
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg flex-shrink-0 mt-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    {language === "bn" 
                      ? "প্রোডাক্টে ক্লিক করে সব তথ্য এডিট করতে পারবেন। * চিহ্নিত ফিল্ডগুলো আবশ্যক।" 
                      : "Click on a product to edit all details. Fields marked with * are required."}
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 flex-shrink-0">
            <Button variant="outline" onClick={() => {
              setIsAddToStockModalOpen(false);
              setEditingStockProduct(null);
            }}>
              {language === "bn" ? "বন্ধ করুন" : "Close"}
            </Button>
            {allPurchasedProducts.length > 0 && (
              <Button 
                onClick={handleAddToStock} 
                disabled={selectedProductsToAdd.length === 0 || isAddingToStock}
              >
                {isAddingToStock ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {language === "bn" ? "যোগ হচ্ছে..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <PackagePlus className="h-4 w-4 mr-2" />
                    {language === "bn" ? `${selectedProductsToAdd.length}টি যোগ করুন` : `Add ${selectedProductsToAdd.length} Products`}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          handleBulkDelete();
          setDeleteDialogOpen(false);
        }}
        title={language === "en" ? "suppliers" : "সরবরাহকারী"}
        itemCount={selectedIds.length}
        isSoftDelete={true}
        isLoading={isBulkDeleting}
      />
    </ShopLayout>
  );

};

export default ShopSuppliers;

