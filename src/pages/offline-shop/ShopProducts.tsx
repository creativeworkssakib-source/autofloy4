import { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Search, 
  Upload, 
  Download, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  History,
  Calendar,
  X,
  Barcode,
  Printer,
  Wand2,
  Layers,
  WifiOff
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ScrollArea } from "@/components/ui/scroll-area";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useOfflineProducts, useOfflineCategories } from "@/hooks/useOfflineData";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { BarcodeGenerator } from "@/components/offline-shop/BarcodeGenerator";
import { PrintBarcodeModal } from "@/components/offline-shop/PrintBarcodeModal";
import StockBatchesModal from "@/components/offline-shop/StockBatchesModal";

interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  brand?: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_alert: number;
  expiry_date?: string;
  supplier_name?: string;
  category_id?: string;
  category?: { id: string; name: string };
  is_active: boolean;
  average_cost?: number;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductHistoryItem {
  id: string;
  product_name: string;
  quantity_added: number;
  purchase_price: number;
  selling_price: number;
  action_type: string;
  created_at: string;
}

interface ProductHistorySummary {
  date: string;
  count: number;
  products: ProductHistoryItem[];
}

const ShopProducts = () => {
  const { t, language } = useLanguage();
  const { currentShop } = useShop();
  
  // Use offline-first hooks
  const { 
    products, 
    loading: isLoading, 
    fromCache,
    isOnline,
    refetch: loadData,
    createProduct: createOfflineProduct,
    updateProduct: updateOfflineProduct,
    deleteProduct: deleteOfflineProduct,
    deleteProducts: deleteOfflineProducts,
  } = useOfflineProducts();
  
  const {
    categories,
    refetch: refetchCategories,
    createCategory: createOfflineCategory,
  } = useOfflineCategories();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product history state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [productHistory, setProductHistory] = useState<ProductHistorySummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

  // Barcode state
  const [printBarcodeOpen, setPrintBarcodeOpen] = useState(false);
  const [viewBarcodeProduct, setViewBarcodeProduct] = useState<Product | null>(null);
  const [isGeneratingBarcodes, setIsGeneratingBarcodes] = useState(false);
  
  // Stock batches state
  const [batchesModalOpen, setBatchesModalOpen] = useState(false);
  const [selectedProductForBatches, setSelectedProductForBatches] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    brand: "",
    unit: "pcs",
    purchase_price: "",
    selling_price: "",
    stock_quantity: "",
    min_stock_alert: "5",
    expiry_date: "",
    supplier_name: "",
    category_id: "",
    custom_category: "",
  });

  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // Clear selection when products change
  useEffect(() => {
    setSelectedProductIds([]);
  }, [products]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProductIds.includes(p.id));

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    try {
      setIsBulkDeleting(true);
      const res = await deleteOfflineProducts(selectedProductIds);

      const deletedCount = res.deleted?.length ?? 0;

      if (deletedCount > 0) {
        toast.success(
          language === "en"
            ? `${deletedCount} products moved to Trash`
            : `${deletedCount}টি প্রোডাক্ট ট্র্যাশে গেছে`
        );
      }
      setSelectedProductIds([]);
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    } finally {
      setIsBulkDeleting(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let categoryId = formData.category_id;

      // If "others" is selected, create new category first
      if (formData.category_id === "others" && formData.custom_category.trim()) {
        try {
          const result = await createOfflineCategory({ name: formData.custom_category.trim() });
          categoryId = result.category?.id || null;
          // Categories will auto-refresh via hook
          await refetchCategories();
        } catch (error) {
          console.error("Failed to create category:", error);
          toast.error(language === "bn" ? "ক্যাটাগরি তৈরি করতে সমস্যা" : "Failed to create category");
          return;
        }
      } else if (formData.category_id === "others") {
        categoryId = null;
      }

      const productData = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_alert: parseInt(formData.min_stock_alert) || 5,
        category_id: categoryId || null,
        expiry_date: formData.expiry_date || null,
      };

      if (editingProduct) {
        await updateOfflineProduct({ id: editingProduct.id, ...productData });
        toast.success(t("shop.productUpdated"));
      } else {
        await createOfflineProduct(productData);
        toast.success(t("shop.productAdded"));
      }

      setIsModalOpen(false);
      resetForm();
      // Products will auto-refresh via hook
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("shop.deleteConfirm"))) return;
    try {
      await deleteOfflineProduct(id);
      setSelectedProductIds((prev) => prev.filter((x) => x !== id));
      toast.success(
        language === "en" ? "Product moved to Trash" : "প্রোডাক্ট ট্র্যাশে গেছে"
      );
      // Products will auto-refresh via hook
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowCustomCategory(false);
    setFormData({
      name: product.name,
      description: product.description || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      brand: product.brand || "",
      unit: product.unit,
      purchase_price: product.purchase_price.toString(),
      selling_price: product.selling_price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      min_stock_alert: product.min_stock_alert.toString(),
      expiry_date: product.expiry_date || "",
      supplier_name: product.supplier_name || "",
      category_id: product.category_id || "",
      custom_category: "",
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setShowCustomCategory(false);
    setFormData({
      name: "",
      description: "",
      sku: "",
      barcode: "",
      brand: "",
      unit: "pcs",
      purchase_price: "",
      selling_price: "",
      stock_quantity: "",
      min_stock_alert: "5",
      expiry_date: "",
      supplier_name: "",
      category_id: "",
      custom_category: "",
    });
  };

  // Load product history
  const loadProductHistory = async () => {
    setLoadingHistory(true);
    try {
      const result = await offlineShopService.getProductHistory();
      setProductHistory(result.summary || []);
    } catch (error) {
      console.error("Load history error:", error);
      toast.error(language === "bn" ? "হিস্টোরি লোড করতে সমস্যা" : "Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Clear product history
  const handleClearHistory = async () => {
    if (!confirm(language === "bn" 
      ? "আপনি কি নিশ্চিত যে সব প্রোডাক্ট হিস্টোরি মুছে ফেলতে চান?"
      : "Are you sure you want to clear all product history?")) {
      return;
    }
    
    setClearingHistory(true);
    try {
      await offlineShopService.clearProductHistory();
      setProductHistory([]);
      toast.success(language === "bn" ? "হিস্টোরি মুছে ফেলা হয়েছে" : "History cleared");
    } catch (error) {
      console.error("Clear history error:", error);
      toast.error(language === "bn" ? "হিস্টোরি মুছতে সমস্যা" : "Failed to clear history");
    } finally {
      setClearingHistory(false);
    }
  };

  // Open history modal
  const handleOpenHistory = () => {
    setHistoryModalOpen(true);
    loadProductHistory();
  };

  // Helper to check if product has valid barcode
  const hasValidBarcode = (barcode: string | null | undefined): boolean => {
    return !!barcode && barcode !== "" && barcode !== "N/A" && barcode.trim() !== "";
  };

  // Generate missing barcodes
  const handleGenerateBarcodes = async () => {
    const productsWithoutBarcode = products.filter(p => !hasValidBarcode(p.barcode));
    if (productsWithoutBarcode.length === 0) {
      toast.info(language === "bn" ? "সব প্রোডাক্টে বারকোড আছে" : "All products have barcodes");
      return;
    }
    
    setIsGeneratingBarcodes(true);
    try {
      const result = await offlineShopService.generateBarcodes();
      toast.success(
        language === "bn" 
          ? `${result.generated}টি প্রোডাক্টে বারকোড যোগ হয়েছে` 
          : `Generated barcodes for ${result.generated} products`
      );
      loadData();
    } catch (error) {
      console.error("Generate barcodes error:", error);
      toast.error(language === "bn" ? "বারকোড তৈরি করতে সমস্যা" : "Failed to generate barcodes");
    } finally {
      setIsGeneratingBarcodes(false);
    }
  };

  // Get products for print
  const getProductsForPrint = () => {
    if (selectedProductIds.length > 0) {
      return products.filter(p => selectedProductIds.includes(p.id));
    }
    return products;
  };

  // Count products without valid barcode
  const productsWithoutBarcodeCount = products.filter(p => !hasValidBarcode(p.barcode)).length;

  // Download blank template for users to fill in
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Template headers with sample data
    const templateData = language === "en" ? [
      {
        "S/N": 1,
        "Product Name *": "Example Product 1",
        "SKU": "SKU-001",
        "Barcode": "1234567890123",
        "Brand": "Brand Name",
        "Category": "Electronics",
        "Description": "Product description here",
        "Unit": "pcs",
        "Purchase Price (BDT) *": 500,
        "Selling Price (BDT) *": 700,
        "Current Stock *": 100,
        "Min Stock Alert": 10,
        "Supplier Name": "ABC Supplier",
        "Supplier Phone": "01712345678",
        "Expiry Date": "2025-12-31",
        "Notes": "Additional notes",
      },
      {
        "S/N": 2,
        "Product Name *": "Example Product 2",
        "SKU": "SKU-002",
        "Barcode": "1234567890124",
        "Brand": "Another Brand",
        "Category": "Clothing",
        "Description": "Another product description",
        "Unit": "pcs",
        "Purchase Price (BDT) *": 200,
        "Selling Price (BDT) *": 350,
        "Current Stock *": 50,
        "Min Stock Alert": 5,
        "Supplier Name": "XYZ Trading",
        "Supplier Phone": "01812345678",
        "Expiry Date": "",
        "Notes": "",
      },
    ] : [
      {
        "ক্রমিক": 1,
        "প্রোডাক্ট নাম *": "উদাহরণ প্রোডাক্ট ১",
        "SKU": "SKU-001",
        "বারকোড": "1234567890123",
        "ব্র্যান্ড": "ব্র্যান্ড নাম",
        "ক্যাটাগরি": "ইলেকট্রনিক্স",
        "বিবরণ": "প্রোডাক্টের বিবরণ এখানে",
        "ইউনিট": "pcs",
        "ক্রয় মূল্য (টাকা) *": 500,
        "বিক্রয় মূল্য (টাকা) *": 700,
        "বর্তমান স্টক *": 100,
        "মিনিমাম স্টক": 10,
        "সাপ্লায়ার নাম": "ABC সাপ্লায়ার",
        "সাপ্লায়ার ফোন": "01712345678",
        "মেয়াদ উত্তীর্ণ": "2025-12-31",
        "নোট": "অতিরিক্ত নোট",
      },
      {
        "ক্রমিক": 2,
        "প্রোডাক্ট নাম *": "উদাহরণ প্রোডাক্ট ২",
        "SKU": "SKU-002",
        "বারকোড": "1234567890124",
        "ব্র্যান্ড": "অন্য ব্র্যান্ড",
        "ক্যাটাগরি": "পোশাক",
        "বিবরণ": "আরেকটি প্রোডাক্ট বিবরণ",
        "ইউনিট": "pcs",
        "ক্রয় মূল্য (টাকা) *": 200,
        "বিক্রয় মূল্য (টাকা) *": 350,
        "বর্তমান স্টক *": 50,
        "মিনিমাম স্টক": 5,
        "সাপ্লায়ার নাম": "XYZ ট্রেডিং",
        "সাপ্লায়ার ফোন": "01812345678",
        "মেয়াদ উত্তীর্ণ": "",
        "নোট": "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    ws["!cols"] = [
      { wch: 6 },  // S/N
      { wch: 30 }, // Product Name
      { wch: 15 }, // SKU
      { wch: 18 }, // Barcode
      { wch: 15 }, // Brand
      { wch: 15 }, // Category
      { wch: 35 }, // Description
      { wch: 8 },  // Unit
      { wch: 20 }, // Purchase Price
      { wch: 20 }, // Selling Price
      { wch: 15 }, // Current Stock
      { wch: 15 }, // Min Stock Alert
      { wch: 20 }, // Supplier Name
      { wch: 15 }, // Supplier Phone
      { wch: 12 }, // Expiry Date
      { wch: 25 }, // Notes
    ];

    XLSX.utils.book_append_sheet(wb, ws, language === "en" ? "Products" : "প্রোডাক্ট");

    // Instructions sheet
    const instructionsData = language === "en" ? [
      { "Instructions": "HOW TO USE THIS TEMPLATE" },
      { "Instructions": "" },
      { "Instructions": "1. Fill in your product information in the 'Products' sheet" },
      { "Instructions": "2. Fields marked with * are required" },
      { "Instructions": "3. Do not change the column headers" },
      { "Instructions": "4. You can add as many rows as needed" },
      { "Instructions": "5. Delete the example rows before importing" },
      { "Instructions": "" },
      { "Instructions": "COLUMN DESCRIPTIONS:" },
      { "Instructions": "" },
      { "Instructions": "S/N: Serial number (optional, auto-generated)" },
      { "Instructions": "Product Name *: Name of your product (REQUIRED)" },
      { "Instructions": "SKU: Stock Keeping Unit code (optional)" },
      { "Instructions": "Barcode: Product barcode number (optional)" },
      { "Instructions": "Brand: Product brand name (optional)" },
      { "Instructions": "Category: Product category (optional)" },
      { "Instructions": "Description: Detailed product description (optional)" },
      { "Instructions": "Unit: pcs, kg, ltr, box, pack, dozen" },
      { "Instructions": "Purchase Price (BDT) *: Cost price per unit (REQUIRED)" },
      { "Instructions": "Selling Price (BDT) *: Selling price per unit (REQUIRED)" },
      { "Instructions": "Current Stock *: Available quantity (REQUIRED)" },
      { "Instructions": "Min Stock Alert: Low stock warning threshold" },
      { "Instructions": "Supplier Name: Name of supplier (optional)" },
      { "Instructions": "Supplier Phone: Supplier contact number (optional)" },
      { "Instructions": "Expiry Date: Format YYYY-MM-DD (optional)" },
      { "Instructions": "Notes: Any additional notes (optional)" },
    ] : [
      { "নির্দেশনা": "এই টেমপ্লেট কিভাবে ব্যবহার করবেন" },
      { "নির্দেশনা": "" },
      { "নির্দেশনা": "১. 'প্রোডাক্ট' শীটে আপনার প্রোডাক্টের তথ্য পূরণ করুন" },
      { "নির্দেশনা": "২. * চিহ্নিত ফিল্ডগুলো বাধ্যতামূলক" },
      { "নির্দেশনা": "৩. কলাম হেডার পরিবর্তন করবেন না" },
      { "নির্দেশনা": "৪. প্রয়োজনমতো রো যোগ করতে পারবেন" },
      { "নির্দেশনা": "৫. ইম্পোর্ট করার আগে উদাহরণ রো গুলো ডিলিট করুন" },
      { "নির্দেশনা": "" },
      { "নির্দেশনা": "কলাম বিবরণ:" },
      { "নির্দেশনা": "" },
      { "নির্দেশনা": "ক্রমিক: সিরিয়াল নম্বর (ঐচ্ছিক)" },
      { "নির্দেশনা": "প্রোডাক্ট নাম *: আপনার প্রোডাক্টের নাম (আবশ্যক)" },
      { "নির্দেশনা": "SKU: স্টক কিপিং ইউনিট কোড (ঐচ্ছিক)" },
      { "নির্দেশনা": "বারকোড: প্রোডাক্ট বারকোড নম্বর (ঐচ্ছিক)" },
      { "নির্দেশনা": "ব্র্যান্ড: প্রোডাক্ট ব্র্যান্ড নাম (ঐচ্ছিক)" },
      { "নির্দেশনা": "ক্যাটাগরি: প্রোডাক্ট ক্যাটাগরি (ঐচ্ছিক)" },
      { "নির্দেশনা": "বিবরণ: বিস্তারিত বিবরণ (ঐচ্ছিক)" },
      { "নির্দেশনা": "ইউনিট: pcs, kg, ltr, box, pack, dozen" },
      { "নির্দেশনা": "ক্রয় মূল্য (টাকা) *: প্রতি ইউনিট কেনার দাম (আবশ্যক)" },
      { "নির্দেশনা": "বিক্রয় মূল্য (টাকা) *: প্রতি ইউনিট বিক্রয় দাম (আবশ্যক)" },
      { "নির্দেশনা": "বর্তমান স্টক *: বর্তমান পরিমাণ (আবশ্যক)" },
      { "নির্দেশনা": "মিনিমাম স্টক: স্টক কম হলে সতর্কতা" },
      { "নির্দেশনা": "সাপ্লায়ার নাম: সাপ্লায়ারের নাম (ঐচ্ছিক)" },
      { "নির্দেশনা": "সাপ্লায়ার ফোন: সাপ্লায়ার ফোন নম্বর (ঐচ্ছিক)" },
      { "নির্দেশনা": "মেয়াদ উত্তীর্ণ: YYYY-MM-DD ফরম্যাট (ঐচ্ছিক)" },
      { "নির্দেশনা": "নোট: অতিরিক্ত কোনো নোট (ঐচ্ছিক)" },
    ];

    const instructionsWs = XLSX.utils.json_to_sheet(instructionsData);
    instructionsWs["!cols"] = [{ wch: 60 }];
    XLSX.utils.book_append_sheet(wb, instructionsWs, language === "en" ? "Instructions" : "নির্দেশনা");

    const fileName = language === "en" ? "product_import_template.xlsx" : "প্রোডাক্ট_আমদানি_টেমপ্লেট.xlsx";
    XLSX.writeFile(wb, fileName);
    toast.success(language === "en" ? "Template downloaded" : "টেমপ্লেট ডাউনলোড হয়েছে");
  };

  const handleExport = () => {
    // Calculate additional fields for each product
    const exportData = products.map((p, index) => {
      const stockValue = p.purchase_price * p.stock_quantity;
      const potentialRevenue = p.selling_price * p.stock_quantity;
      const profitMargin = p.selling_price - p.purchase_price;
      const profitPercentage = p.purchase_price > 0 ? ((profitMargin / p.purchase_price) * 100).toFixed(2) : "0";
      const stockStatus = p.stock_quantity <= 0 ? (language === "en" ? "Out of Stock" : "স্টক শেষ") : 
                          p.stock_quantity <= p.min_stock_alert ? (language === "en" ? "Low Stock" : "স্টক কম") : 
                          (language === "en" ? "In Stock" : "স্টক আছে");
      
      return language === "en" ? {
        "S/N": index + 1,
        "Product Name": p.name,
        "SKU": p.sku || "",
        "Barcode": p.barcode || "",
        "Brand": p.brand || "",
        "Category": p.category?.name || "",
        "Description": p.description || "",
        "Unit": p.unit,
        "Purchase Price (BDT)": p.purchase_price,
        "Selling Price (BDT)": p.selling_price,
        "Profit Margin (BDT)": profitMargin,
        "Profit (%)": profitPercentage + "%",
        "Current Stock": p.stock_quantity,
        "Min Stock Alert": p.min_stock_alert,
        "Stock Status": stockStatus,
        "Stock Value (BDT)": stockValue,
        "Potential Revenue (BDT)": potentialRevenue,
        "Supplier": p.supplier_name || "",
        "Expiry Date": p.expiry_date || "",
        "Status": p.is_active ? "Active" : "Inactive",
        "Created Date": p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
        "Last Updated": p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "",
      } : {
        "ক্রমিক": index + 1,
        "প্রোডাক্ট নাম": p.name,
        "SKU": p.sku || "",
        "বারকোড": p.barcode || "",
        "ব্র্যান্ড": p.brand || "",
        "ক্যাটাগরি": p.category?.name || "",
        "বিবরণ": p.description || "",
        "ইউনিট": p.unit,
        "ক্রয় মূল্য (টাকা)": p.purchase_price,
        "বিক্রয় মূল্য (টাকা)": p.selling_price,
        "লাভ (টাকা)": profitMargin,
        "লাভ (%)": profitPercentage + "%",
        "বর্তমান স্টক": p.stock_quantity,
        "মিনিমাম স্টক": p.min_stock_alert,
        "স্টক অবস্থা": stockStatus,
        "স্টক মূল্য (টাকা)": stockValue,
        "সম্ভাব্য আয় (টাকা)": potentialRevenue,
        "সাপ্লায়ার": p.supplier_name || "",
        "মেয়াদ": p.expiry_date || "",
        "স্ট্যাটাস": p.is_active ? "সক্রিয়" : "নিষ্ক্রিয়",
        "তৈরির তারিখ": p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
        "আপডেটের তারিখ": p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "",
      };
    });

    // Calculate summary data
    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, p) => sum + (p.purchase_price * p.stock_quantity), 0);
    const totalPotentialRevenue = products.reduce((sum, p) => sum + (p.selling_price * p.stock_quantity), 0);
    const lowStockCount = products.filter(p => p.stock_quantity <= p.min_stock_alert && p.stock_quantity > 0).length;
    const outOfStockCount = products.filter(p => p.stock_quantity <= 0).length;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Products sheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths for better readability
    const colWidths = language === "en" ? [
      { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 30 }, { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 20 },
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
    ] : [
      { wch: 6 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 25 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 8 },
      { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
      { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }
    ];
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, language === "en" ? "Products" : "প্রোডাক্ট");

    // Summary sheet
    const summaryData = language === "en" ? [
      { "Summary": "Total Products", "Value": totalProducts },
      { "Summary": "Total Stock Value", "Value": `৳${totalStockValue.toLocaleString()}` },
      { "Summary": "Potential Revenue", "Value": `৳${totalPotentialRevenue.toLocaleString()}` },
      { "Summary": "Potential Profit", "Value": `৳${(totalPotentialRevenue - totalStockValue).toLocaleString()}` },
      { "Summary": "Low Stock Items", "Value": lowStockCount },
      { "Summary": "Out of Stock Items", "Value": outOfStockCount },
      { "Summary": "Report Date", "Value": new Date().toLocaleDateString() },
    ] : [
      { "সারসংক্ষেপ": "মোট প্রোডাক্ট", "মান": totalProducts },
      { "সারসংক্ষেপ": "মোট স্টক মূল্য", "মান": `৳${totalStockValue.toLocaleString()}` },
      { "সারসংক্ষেপ": "সম্ভাব্য আয়", "মান": `৳${totalPotentialRevenue.toLocaleString()}` },
      { "সারসংক্ষেপ": "সম্ভাব্য লাভ", "মান": `৳${(totalPotentialRevenue - totalStockValue).toLocaleString()}` },
      { "সারসংক্ষেপ": "স্টক কম আইটেম", "মান": lowStockCount },
      { "সারসংক্ষেপ": "স্টক শেষ আইটেম", "মান": outOfStockCount },
      { "সারসংক্ষেপ": "রিপোর্ট তারিখ", "মান": new Date().toLocaleDateString() },
    ];

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs["!cols"] = [{ wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, language === "en" ? "Summary" : "সারসংক্ষেপ");

    // Download file
    const fileName = `products_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(t("shop.excelDownloaded"));
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const importProducts = jsonData.map((row: any) => ({
        name: row["Product Name"] || row["প্রোডাক্ট নাম"] || row["Product Name *"] || row["প্রোডাক্ট নাম *"] || row["name"] || row["Name"],
        sku: row["SKU"] || row["sku"],
        barcode: row["Barcode"] || row["বারকোড"] || row["barcode"],
        brand: row["Brand"] || row["ব্র্যান্ড"] || row["brand"],
        category: row["Category"] || row["ক্যাটাগরি"] || row["category"],
        purchase_price: parseFloat(row["Purchase Price (BDT)"] || row["ক্রয় মূল্য (টাকা)"] || row["Purchase Price (BDT) *"] || row["ক্রয় মূল্য (টাকা) *"] || row["purchase_price"] || 0),
        selling_price: parseFloat(row["Selling Price (BDT)"] || row["বিক্রয় মূল্য (টাকা)"] || row["Selling Price (BDT) *"] || row["বিক্রয় মূল্য (টাকা) *"] || row["selling_price"] || 0),
        stock_quantity: parseInt(row["Current Stock"] || row["বর্তমান স্টক"] || row["Current Stock *"] || row["বর্তমান স্টক *"] || row["stock_quantity"] || 0),
        min_stock_alert: parseInt(row["Min Stock Alert"] || row["মিনিমাম স্টক"] || row["min_stock_alert"] || 5),
        unit: row["Unit"] || row["ইউনিট"] || row["unit"] || "pcs",
        expiry_date: row["Expiry Date"] || row["মেয়াদ উত্তীর্ণ"] || row["মেয়াদ"] || row["expiry_date"],
        supplier_name: row["Supplier Name"] || row["সাপ্লায়ার নাম"] || row["Supplier"] || row["সাপ্লায়ার"] || row["supplier_name"],
        description: row["Description"] || row["বিবরণ"] || row["description"],
      }));

      const result = await offlineShopService.importProducts(importProducts);
      toast.success(`${result.results.success} ${t("shop.importSuccess")}`);
      if (result.results.failed > 0) {
        toast.warning(`${result.results.failed} ${t("shop.importFailed")}`);
      }
      loadData();
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("bn-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getUnitLabel = (unit: string) => {
    const units: Record<string, { en: string; bn: string }> = {
      pcs: { en: "Pcs", bn: "পিস" },
      kg: { en: "KG", bn: "কেজি" },
      ltr: { en: "Liter", bn: "লিটার" },
      box: { en: "Box", bn: "বক্স" },
      pack: { en: "Pack", bn: "প্যাক" },
      dozen: { en: "Dozen", bn: "ডজন" },
    };
    return units[unit]?.[language] || unit;
  };

  return (
    <ShopLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{t("shop.productsTitle")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{t("shop.productsDesc")}</p>
            </div>
            {(fromCache || !isOnline) && (
              <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950 flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                {t('offline.usingCache')}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleOpenHistory} size="sm" className="text-xs sm:text-sm border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950">
              <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">{language === "en" ? "History" : "হিস্টোরি"}</span>
              <span className="xs:hidden">{language === "en" ? "History" : "হিস্টোরি"}</span>
            </Button>
            <Button variant="outline" onClick={handleDownloadTemplate} size="sm" className="text-xs sm:text-sm border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950">
              <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">{language === "en" ? "Download Template" : "টেমপ্লেট ডাউনলোড"}</span>
              <span className="xs:hidden">{language === "en" ? "Template" : "টেমপ্লেট"}</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExport} 
              size="sm" 
              className="text-xs sm:text-sm"
              disabled={products.length === 0}
              title={products.length === 0 ? (language === "en" ? "No products to export" : "এক্সপোর্ট করার প্রোডাক্ট নেই") : ""}
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {t("common.export")}
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} size="sm" className="text-xs sm:text-sm">
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {t("common.import")}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            {productsWithoutBarcodeCount > 0 && (
              <Button 
                variant="outline" 
                onClick={handleGenerateBarcodes} 
                size="sm" 
                className="text-xs sm:text-sm border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                disabled={isGeneratingBarcodes}
              >
                <Wand2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {language === "bn" ? `বারকোড তৈরি (${productsWithoutBarcodeCount})` : `Generate Barcodes (${productsWithoutBarcodeCount})`}
              </Button>
            )}
            {selectedProductIds.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setPrintBarcodeOpen(true)} 
                size="sm" 
                className="text-xs sm:text-sm border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {language === "bn" ? `বারকোড প্রিন্ট (${selectedProductIds.length})` : `Print Barcodes (${selectedProductIds.length})`}
              </Button>
            )}
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} size="sm" className="text-xs sm:text-sm">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {t("shop.newProduct")}
            </Button>
          </div>
        </div>

        {/* Search + Bulk actions */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("shop.searchProducts")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {selectedProductIds.length > 0 && (
              <Button variant="destructive" disabled={isBulkDeleting} onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                {language === "en"
                  ? `Delete (${selectedProductIds.length})`
                  : `ডিলিট (${selectedProductIds.length})`}
              </Button>
            )}
          </div>

          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={() => {
              handleBulkDelete();
              setDeleteDialogOpen(false);
            }}
            title={language === "en" ? "products" : "প্রোডাক্ট"}
            itemCount={selectedProductIds.length}
            isSoftDelete={true}
            isLoading={isBulkDeleting}
          />


          <p className="text-sm text-muted-foreground">
            {language === "en"
              ? `${filteredProducts.length} products`
              : `${filteredProducts.length}টি প্রোডাক্ট`}
            {selectedProductIds.length > 0 && (
              <span>
                {language === "en"
                  ? ` • ${selectedProductIds.length} selected`
                  : ` • ${selectedProductIds.length}টি সিলেক্টেড`}
              </span>
            )}
          </p>
        </div>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[550px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 p-2">
                    <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("shop.productName")}</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">{t("shop.purchasePrice")}</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">{language === "bn" ? "গড় মূল্য" : "Avg Cost"}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("shop.sellingPrice")}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("shop.stock")}</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">{t("shop.category")}</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm w-16">{t("shop.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      {t("common.loading")}
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p>{t("shop.noProducts")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="p-2">
                        <Checkbox
                          checked={selectedProductIds.includes(product.id)}
                          onCheckedChange={() => toggleSelectOne(product.id)}
                        />
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <div className="max-w-[120px] sm:max-w-none">
                          <p className="font-medium text-xs sm:text-sm truncate">{product.name}</p>
                          {product.sku && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">SKU: {product.sku}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground sm:hidden">
                            {formatCurrency(product.purchase_price)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4 hidden sm:table-cell text-xs sm:text-sm">{formatCurrency(product.purchase_price)}</TableCell>
                      <TableCell className="p-2 sm:p-4 hidden lg:table-cell text-xs sm:text-sm text-muted-foreground">
                        {product.average_cost ? formatCurrency(product.average_cost) : "-"}
                      </TableCell>
                      <TableCell className="p-2 sm:p-4 text-xs sm:text-sm font-medium">{formatCurrency(product.selling_price)}</TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <div className="flex items-center gap-1">
                          <span className="text-xs sm:text-sm whitespace-nowrap">
                            {product.stock_quantity} <span className="hidden sm:inline">{getUnitLabel(product.unit)}</span>
                          </span>
                          {product.stock_quantity <= product.min_stock_alert && (
                            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4 hidden md:table-cell">
                        {product.category?.name ? (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">{product.category.name}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedProductForBatches(product);
                              setBatchesModalOpen(true);
                            }}>
                              <Layers className="mr-2 h-4 w-4" />
                              {language === "bn" ? "স্টক ব্যাচ" : "Stock Batches"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewBarcodeProduct(product)}>
                              <Barcode className="mr-2 h-4 w-4" />
                              {language === "bn" ? "বারকোড" : "Barcode"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(product)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(product.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("common.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? t("shop.editProduct") : t("shop.newProduct")}
            </DialogTitle>
            <DialogDescription>
              {t("shop.productDetails")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("shop.productName")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">{t("shop.sku")}</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">{t("shop.barcode")}</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_price">{t("shop.purchasePrice")} *</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selling_price">{t("shop.sellingPrice")} *</Label>
                <Input
                  id="selling_price"
                  type="number"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock_quantity">{t("shop.stock")}</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">{t("shop.unit")}</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">{t("shop.pcs")}</SelectItem>
                    <SelectItem value="kg">{t("shop.kg")}</SelectItem>
                    <SelectItem value="ltr">{t("shop.liter")}</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="dozen">{t("shop.dozen")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_stock_alert">{t("shop.minStockAlert")}</Label>
                <Input
                  id="min_stock_alert"
                  type="number"
                  value={formData.min_stock_alert}
                  onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date">{t("shop.expiryDate")}</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_name">{t("shop.supplier")}</Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t("shop.category")}</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, category_id: value, custom_category: "" });
                    setShowCustomCategory(value === "others");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("shop.select")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="others">
                      {language === "bn" ? "অন্যান্য (নতুন ক্যাটাগরি)" : "Others (New Category)"}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {showCustomCategory && (
                  <Input
                    placeholder={language === "bn" ? "নতুন ক্যাটাগরির নাম লিখুন" : "Enter new category name"}
                    value={formData.custom_category}
                    onChange={(e) => setFormData({ ...formData, custom_category: e.target.value })}
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("shop.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>


            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">
                {editingProduct ? t("common.save") : t("common.add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-purple-500" />
              {language === "bn" ? "প্রোডাক্ট এন্ট্রি হিস্টোরি" : "Product Entry History"}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? "কবে কয়টি প্রোডাক্ট যোগ করা হয়েছে তার তালিকা" 
                : "History of products added to your shop"}
            </DialogDescription>
          </DialogHeader>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : productHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mb-2 opacity-50" />
              <p>{language === "bn" ? "কোনো হিস্টোরি নেই" : "No history found"}</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4">
                {productHistory.map((day) => (
                  <Card key={day.date} className="overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-muted/50">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          {format(new Date(day.date), "dd MMM yyyy")}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {language === "bn" 
                            ? `${day.count}টি প্রোডাক্ট` 
                            : `${day.count} product${day.count > 1 ? 's' : ''}`}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {day.products.map((product) => (
                          <div key={product.id} className="px-4 py-2 flex items-center justify-between text-sm">
                            <div className="flex-1">
                              <p className="font-medium">{product.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(product.created_at), "hh:mm a")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs">
                                {language === "bn" ? "পরিমাণ:" : "Qty:"} {product.quantity_added}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ৳{product.selling_price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="mt-4">
            <Button
              variant="destructive"
              onClick={handleClearHistory}
              disabled={clearingHistory || productHistory.length === 0}
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {clearingHistory 
                ? (language === "bn" ? "মুছছে..." : "Clearing...") 
                : (language === "bn" ? "হিস্টোরি মুছুন" : "Clear History")}
            </Button>
            <Button variant="outline" onClick={() => setHistoryModalOpen(false)} size="sm">
              {language === "bn" ? "বন্ধ করুন" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Barcode Modal */}
      <PrintBarcodeModal
        open={printBarcodeOpen}
        onOpenChange={setPrintBarcodeOpen}
        products={getProductsForPrint().map(p => ({
          id: p.id,
          name: p.name,
          barcode: p.barcode || "",
          selling_price: p.selling_price,
        }))}
      />

      {/* View Single Barcode Modal */}
      <Dialog open={!!viewBarcodeProduct} onOpenChange={() => setViewBarcodeProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{language === "bn" ? "বারকোড দেখুন" : "View Barcode"}</DialogTitle>
          </DialogHeader>
          {viewBarcodeProduct && (
            <div className="flex flex-col items-center py-4">
              <p className="font-medium mb-2">{viewBarcodeProduct.name}</p>
              <BarcodeGenerator
                value={viewBarcodeProduct.barcode || ""}
                productName={viewBarcodeProduct.name}
                price={viewBarcodeProduct.selling_price}
                showPrintButton={true}
                size="large"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Batches Modal */}
      <StockBatchesModal
        isOpen={batchesModalOpen}
        onClose={() => setBatchesModalOpen(false)}
        product={selectedProductForBatches}
      />
    </ShopLayout>
  );
};

export default ShopProducts;
