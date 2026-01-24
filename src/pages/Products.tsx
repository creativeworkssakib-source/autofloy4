import { useState, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import {
  Search,
  Package,
  Loader2,
  Upload,
  Download,
  Plus,
  Pencil,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchProducts,
  importProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  exportProducts,
  Product,
} from "@/services/apiService";
import { useLanguage } from "@/contexts/LanguageContext";
import * as XLSX from "xlsx";

const Products = () => {
  const { toast: toastHook } = useToast();
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    brand: "",
    unit: "pcs",
    purchase_price: "",
    price: "",
    stock_quantity: "",
    min_stock_alert: "5",
    expiry_date: "",
    supplier_name: "",
    category: "",
    image_url: "",
    currency: "BDT",
    is_active: true,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data.products);
      setCategories(data.categories);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error(language === "en" ? "Failed to load products" : "প্রোডাক্ট লোড হয়নি");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [products, searchQuery]);

  const allSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    try {
      setIsBulkDeleting(true);
      const ids = Array.from(selectedIds);
      const result = await bulkDeleteProducts(ids);

      if (result.success) {
        toast.success(
          language === "en"
            ? `${result.deleted} products deleted`
            : `${result.deleted}টি প্রোডাক্ট ডিলিট হয়েছে`
        );
        setSelectedIds(new Set());
        loadProducts();
      } else {
        toast.error(language === "en" ? "Failed to delete products" : "প্রোডাক্ট ডিলিট হয়নি");
      }
    } catch (error) {
      toast.error(language === "en" ? "An error occurred" : "একটি সমস্যা হয়েছে");
    } finally {
      setIsBulkDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        price: parseFloat(formData.price) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_alert: parseInt(formData.min_stock_alert) || 5,
        category: formData.category || null,
        expiry_date: formData.expiry_date || null,
      };

      if (editingProduct) {
        const result = await updateProduct(editingProduct.id, productData);
        if (result) {
          toast.success(language === "en" ? "Product updated" : "প্রোডাক্ট আপডেট হয়েছে");
        } else {
          toast.error(language === "en" ? "Failed to update" : "আপডেট হয়নি");
        }
      } else {
        const result = await createProduct(productData);
        if (result) {
          toast.success(language === "en" ? "Product added" : "প্রোডাক্ট যোগ হয়েছে");
        } else {
          toast.error(language === "en" ? "Failed to add" : "যোগ হয়নি");
        }
      }

      setIsModalOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error(language === "en" ? "An error occurred" : "একটি সমস্যা হয়েছে");
    }
  };

  const handleDelete = async () => {
    if (!deleteProductId) return;
    try {
      const success = await deleteProduct(deleteProductId);
      if (success) {
        toast.success(language === "en" ? "Product deleted" : "প্রোডাক্ট ডিলিট হয়েছে");
        loadProducts();
      } else {
        toast.error(language === "en" ? "Failed to delete" : "ডিলিট হয়নি");
      }
    } catch (error) {
      toast.error(language === "en" ? "An error occurred" : "একটি সমস্যা হয়েছে");
    }
    setDeleteProductId(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      sku: product.sku || "",
      barcode: (product as any).barcode || "",
      brand: product.brand || "",
      unit: (product as any).unit || "pcs",
      purchase_price: ((product as any).purchase_price || 0).toString(),
      price: product.price.toString(),
      stock_quantity: (product.stock_quantity || 0).toString(),
      min_stock_alert: ((product as any).min_stock_alert || 5).toString(),
      expiry_date: (product as any).expiry_date || "",
      supplier_name: (product as any).supplier_name || "",
      category: product.category || "",
      image_url: product.image_url || "",
      currency: product.currency || "BDT",
      is_active: product.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      sku: "",
      barcode: "",
      brand: "",
      unit: "pcs",
      purchase_price: "",
      price: "",
      stock_quantity: "",
      min_stock_alert: "5",
      expiry_date: "",
      supplier_name: "",
      category: "",
      image_url: "",
      currency: "BDT",
      is_active: true,
    });
  };

  // Download blank template
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

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
        "Expiry Date": "2025-12-31",
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
        "Expiry Date": "",
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
        "মেয়াদ উত্তীর্ণ": "2025-12-31",
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
        "মেয়াদ উত্তীর্ণ": "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = [
      { wch: 6 }, { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
      { wch: 35 }, { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, language === "en" ? "Products" : "প্রোডাক্ট");

    const fileName = language === "en" ? "product_import_template.xlsx" : "প্রোডাক্ট_আমদানি_টেমপ্লেট.xlsx";
    XLSX.writeFile(wb, fileName);
    toast.success(language === "en" ? "Template downloaded" : "টেমপ্লেট ডাউনলোড হয়েছে");
  };

  const handleExport = () => {
    const exportData = products.map((p, index) => {
      const purchasePrice = (p as any).purchase_price || 0;
      const sellingPrice = p.price || 0;
      const stockValue = purchasePrice * (p.stock_quantity || 0);
      const potentialRevenue = sellingPrice * (p.stock_quantity || 0);
      const profitMargin = sellingPrice - purchasePrice;
      const profitPercentage = purchasePrice > 0 ? ((profitMargin / purchasePrice) * 100).toFixed(2) : "0";
      const minStockAlert = (p as any).min_stock_alert || 5;
      const stockStatus = (p.stock_quantity || 0) <= 0 
        ? (language === "en" ? "Out of Stock" : "স্টক শেষ") 
        : (p.stock_quantity || 0) <= minStockAlert 
        ? (language === "en" ? "Low Stock" : "স্টক কম") 
        : (language === "en" ? "In Stock" : "স্টক আছে");

      return language === "en" ? {
        "S/N": index + 1,
        "Product Name": p.name,
        "SKU": p.sku || "",
        "Barcode": (p as any).barcode || "",
        "Brand": p.brand || "",
        "Category": p.category || "",
        "Description": p.description || "",
        "Unit": (p as any).unit || "pcs",
        "Purchase Price (BDT)": purchasePrice,
        "Selling Price (BDT)": sellingPrice,
        "Profit Margin (BDT)": profitMargin,
        "Profit (%)": profitPercentage + "%",
        "Current Stock": p.stock_quantity || 0,
        "Min Stock Alert": minStockAlert,
        "Stock Status": stockStatus,
        "Stock Value (BDT)": stockValue,
        "Potential Revenue (BDT)": potentialRevenue,
        "Supplier": (p as any).supplier_name || "",
        "Expiry Date": (p as any).expiry_date || "",
        "Status": p.is_active ? "Active" : "Inactive",
        "Created Date": p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
      } : {
        "ক্রমিক": index + 1,
        "প্রোডাক্ট নাম": p.name,
        "SKU": p.sku || "",
        "বারকোড": (p as any).barcode || "",
        "ব্র্যান্ড": p.brand || "",
        "ক্যাটাগরি": p.category || "",
        "বিবরণ": p.description || "",
        "ইউনিট": (p as any).unit || "pcs",
        "ক্রয় মূল্য (টাকা)": purchasePrice,
        "বিক্রয় মূল্য (টাকা)": sellingPrice,
        "লাভ (টাকা)": profitMargin,
        "লাভ (%)": profitPercentage + "%",
        "বর্তমান স্টক": p.stock_quantity || 0,
        "মিনিমাম স্টক": minStockAlert,
        "স্টক অবস্থা": stockStatus,
        "স্টক মূল্য (টাকা)": stockValue,
        "সম্ভাব্য আয় (টাকা)": potentialRevenue,
        "সাপ্লায়ার": (p as any).supplier_name || "",
        "মেয়াদ": (p as any).expiry_date || "",
        "স্ট্যাটাস": p.is_active ? "সক্রিয়" : "নিষ্ক্রিয়",
        "তৈরির তারিখ": p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
      };
    });

    // Calculate summary
    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, p) => sum + ((p as any).purchase_price || 0) * (p.stock_quantity || 0), 0);
    const totalPotentialRevenue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock_quantity || 0), 0);
    const lowStockCount = products.filter(p => (p.stock_quantity || 0) <= ((p as any).min_stock_alert || 5) && (p.stock_quantity || 0) > 0).length;
    const outOfStockCount = products.filter(p => (p.stock_quantity || 0) <= 0).length;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
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
    XLSX.utils.book_append_sheet(wb, summaryWs, language === "en" ? "Summary" : "সারসংক্ষেপ");

    const fileName = `products_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(language === "en" ? "Export completed" : "এক্সপোর্ট সম্পন্ন");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Parse all products first
      const productsToImport = (jsonData as any[])
        .map((row) => ({
          name: row["Product Name"] || row["প্রোডাক্ট নাম"] || row["Product Name *"] || row["প্রোডাক্ট নাম *"] || row["name"],
          sku: row["SKU"] || row["sku"] || null,
          barcode: row["Barcode"] || row["বারকোড"] || null,
          brand: row["Brand"] || row["ব্র্যান্ড"] || null,
          category: row["Category"] || row["ক্যাটাগরি"] || null,
          purchase_price: parseFloat(row["Purchase Price (BDT)"] || row["ক্রয় মূল্য (টাকা)"] || row["Purchase Price (BDT) *"] || row["ক্রয় মূল্য (টাকা) *"] || 0),
          price: parseFloat(row["Selling Price (BDT)"] || row["বিক্রয় মূল্য (টাকা)"] || row["Selling Price (BDT) *"] || row["বিক্রয় মূল্য (টাকা) *"] || 0),
          stock_quantity: parseInt(row["Current Stock"] || row["বর্তমান স্টক"] || row["Current Stock *"] || row["বর্তমান স্টক *"] || 0),
          min_stock_alert: parseInt(row["Min Stock Alert"] || row["মিনিমাম স্টক"] || 5),
          unit: row["Unit"] || row["ইউনিট"] || "pcs",
          expiry_date: row["Expiry Date"] || row["মেয়াদ উত্তীর্ণ"] || null,
          supplier_name: row["Supplier Name"] || row["সাপ্লায়ার নাম"] || row["Supplier"] || row["সাপ্লায়ার"] || null,
          description: row["Description"] || row["বিবরণ"] || null,
          currency: "BDT",
          is_active: true,
        }))
        .filter((p) => p.name);

      if (productsToImport.length === 0) {
        toast.error(language === "en" ? "No valid products found" : "কোনো প্রোডাক্ট পাওয়া যায়নি");
        return;
      }

      // Send bulk import request
      const token = localStorage.getItem("autofloy_token");
      console.log("[Products Import] Token available:", !!token, "Token length:", token?.length || 0);
      console.log("[Products Import] Products to import:", productsToImport.length);
      
      if (!token) {
        toast.error(language === "en" ? "Please login again" : "আবার লগইন করুন");
        return;
      }
      
      const response = await fetch(
        "https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsa3J6Znd2cm1mZnFrbWt5cXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTE4MjcsImV4cCI6MjA4MTQ2NzgyN30.ZArRZTr6tGhhnptPXvq7Onn4OhMLxrF7FvKkYC26nXg",
          },
          body: JSON.stringify({
            action: "bulk_import",
            products: productsToImport,
          }),
        }
      );

      console.log("[Products Import] Response status:", response.status);
      const result = await response.json();
      console.log("[Products Import] Response body:", result);

      if (!response.ok) {
        console.error("[Products Import] HTTP Error:", response.status, result);
        toast.error(result.error || (language === "en" ? `Import failed (${response.status})` : `ইম্পোর্ট হয়নি (${response.status})`));
        return;
      }

      if (result.success) {
        toast.success(
          language === "en"
            ? `${result.inserted} products imported successfully`
            : `${result.inserted}টি প্রোডাক্ট ইম্পোর্ট হয়েছে`
        );
        if (result.errors > 0) {
          toast.warning(
            language === "en"
              ? `${result.errors} products failed to import`
              : `${result.errors}টি প্রোডাক্ট ইম্পোর্ট হয়নি`
          );
        }
        loadProducts();
      } else {
        toast.error(result.error || (language === "en" ? "Import failed" : "ইম্পোর্ট হয়নি"));
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error(language === "en" ? "Import failed" : "ইম্পোর্ট হয়নি");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {language === "en" ? "Products" : "প্রোডাক্ট"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {language === "en" ? "Manage your online store products" : "আপনার অনলাইন স্টোরের প্রোডাক্ট ম্যানেজ করুন"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={handleDownloadTemplate} 
              size="sm" 
              className="text-xs sm:text-sm border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">{language === "en" ? "Download Template" : "টেমপ্লেট ডাউনলোড"}</span>
              <span className="xs:hidden">{language === "en" ? "Template" : "টেমপ্লেট"}</span>
            </Button>
            <Button variant="outline" onClick={handleExport} size="sm" className="text-xs sm:text-sm" disabled={products.length === 0}>
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {language === "en" ? "Export" : "এক্সপোর্ট"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()} 
              size="sm" 
              className="text-xs sm:text-sm"
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              )}
              {language === "en" ? "Import" : "ইম্পোর্ট"}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} size="sm" className="text-xs sm:text-sm">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {language === "en" ? "Add Product" : "প্রোডাক্ট যোগ"}
            </Button>
          </div>
        </div>

        {/* Search + Bulk actions */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "en" ? "Search products..." : "প্রোডাক্ট খুঁজুন..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {selectedIds.size > 0 && (
              <Button variant="destructive" disabled={isBulkDeleting} onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                {language === "en"
                  ? `Delete (${selectedIds.size})`
                  : `ডিলিট (${selectedIds.size})`}
              </Button>
            )}
          </div>

          {/* Bulk delete dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {language === "en" ? "Delete products?" : "প্রোডাক্ট ডিলিট করবেন?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {language === "en"
                    ? `Are you sure you want to delete ${selectedIds.size} products? This action cannot be undone.`
                    : `আপনি কি ${selectedIds.size}টি প্রোডাক্ট ডিলিট করতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না।`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{language === "en" ? "Cancel" : "বাতিল"}</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete} disabled={isBulkDeleting} className="bg-destructive text-destructive-foreground">
                  {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {language === "en" ? "Delete" : "ডিলিট"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <p className="text-sm text-muted-foreground">
            {language === "en"
              ? `${filteredProducts.length} products`
              : `${filteredProducts.length}টি প্রোডাক্ট`}
            {selectedIds.size > 0 && (
              <span>
                {language === "en"
                  ? ` • ${selectedIds.size} selected`
                  : ` • ${selectedIds.size}টি সিলেক্টেড`}
              </span>
            )}
          </p>
        </div>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 p-2">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm">{language === "en" ? "Product Name" : "প্রোডাক্ট নাম"}</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">{language === "en" ? "Purchase Price" : "ক্রয় মূল্য"}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{language === "en" ? "Selling Price" : "বিক্রয় মূল্য"}</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">{language === "en" ? "Profit" : "লাভ"}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{language === "en" ? "Stock" : "স্টক"}</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">{language === "en" ? "Category" : "ক্যাটাগরি"}</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm w-16">{language === "en" ? "Actions" : "অ্যাকশন"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      {language === "en" ? "Loading..." : "লোড হচ্ছে..."}
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p>{language === "en" ? "No products found" : "কোনো প্রোডাক্ট পাওয়া যায়নি"}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const purchasePrice = (product as any).purchase_price || 0;
                    const sellingPrice = product.price || 0;
                    const profitMargin = sellingPrice - purchasePrice;
                    const minStockAlert = (product as any).min_stock_alert || 5;
                    const stock = product.stock_quantity || 0;

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="p-2">
                          <Checkbox
                            checked={selectedIds.has(product.id)}
                            onCheckedChange={() => toggleSelect(product.id)}
                          />
                        </TableCell>
                        <TableCell className="p-2 sm:p-4">
                          <div className="max-w-[150px] sm:max-w-none">
                            <p className="font-medium text-xs sm:text-sm truncate">{product.name}</p>
                            {product.sku && (
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">SKU: {product.sku}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground sm:hidden">
                              {formatCurrency(purchasePrice)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 hidden sm:table-cell text-xs sm:text-sm">
                          {formatCurrency(purchasePrice)}
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 text-xs sm:text-sm font-medium">
                          {formatCurrency(sellingPrice)}
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 hidden md:table-cell">
                          <span className={`text-xs sm:text-sm font-medium ${profitMargin >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {formatCurrency(profitMargin)}
                          </span>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4">
                          <div className="flex items-center gap-1">
                            <span className="text-xs sm:text-sm whitespace-nowrap">
                              {stock} <span className="hidden sm:inline">{getUnitLabel((product as any).unit || "pcs")}</span>
                            </span>
                            {stock <= minStockAlert && stock > 0 && (
                              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                            )}
                            {stock <= 0 && (
                              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 hidden lg:table-cell">
                          {product.category ? (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs">{product.category}</Badge>
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
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                {language === "en" ? "Edit" : "এডিট"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteProductId(product.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {language === "en" ? "Delete" : "ডিলিট"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct 
                ? (language === "en" ? "Edit Product" : "প্রোডাক্ট এডিট") 
                : (language === "en" ? "Add Product" : "প্রোডাক্ট যোগ")}
            </DialogTitle>
            <DialogDescription>
              {language === "en" ? "Enter product details" : "প্রোডাক্টের তথ্য দিন"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{language === "en" ? "Product Name" : "প্রোডাক্ট নাম"} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">{language === "en" ? "Barcode" : "বারকোড"}</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">{language === "en" ? "Brand" : "ব্র্যান্ড"}</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_price">{language === "en" ? "Purchase Price" : "ক্রয় মূল্য"} *</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">{language === "en" ? "Selling Price" : "বিক্রয় মূল্য"} *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock_quantity">{language === "en" ? "Stock" : "স্টক"}</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">{language === "en" ? "Unit" : "ইউনিট"}</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">{language === "en" ? "Pieces" : "পিস"}</SelectItem>
                    <SelectItem value="kg">{language === "en" ? "KG" : "কেজি"}</SelectItem>
                    <SelectItem value="ltr">{language === "en" ? "Liter" : "লিটার"}</SelectItem>
                    <SelectItem value="box">{language === "en" ? "Box" : "বক্স"}</SelectItem>
                    <SelectItem value="pack">{language === "en" ? "Pack" : "প্যাক"}</SelectItem>
                    <SelectItem value="dozen">{language === "en" ? "Dozen" : "ডজন"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_stock_alert">{language === "en" ? "Min Stock Alert" : "মিনিমাম স্টক"}</Label>
                <Input
                  id="min_stock_alert"
                  type="number"
                  value={formData.min_stock_alert}
                  onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date">{language === "en" ? "Expiry Date" : "মেয়াদ"}</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_name">{language === "en" ? "Supplier" : "সাপ্লায়ার"}</Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{language === "en" ? "Category" : "ক্যাটাগরি"}</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder={language === "en" ? "e.g., Electronics" : "যেমন: ইলেকট্রনিক্স"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{language === "en" ? "Description" : "বিবরণ"}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                {language === "en" ? "Cancel" : "বাতিল"}
              </Button>
              <Button type="submit">
                {editingProduct 
                  ? (language === "en" ? "Save" : "সেভ") 
                  : (language === "en" ? "Add" : "যোগ করুন")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteProductId}
        onOpenChange={() => setDeleteProductId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "en" ? "Delete product?" : "প্রোডাক্ট ডিলিট করবেন?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === "en" 
                ? "This action cannot be undone. This will permanently delete the product."
                : "এই অ্যাকশন পূর্বাবস্থায় ফেরানো যাবে না। প্রোডাক্ট স্থায়ীভাবে ডিলিট হবে।"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "en" ? "Cancel" : "বাতিল"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "en" ? "Delete" : "ডিলিট"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Products;
