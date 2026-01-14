import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { authService } from "@/services/authService";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus,
  Search,
  RotateCcw,
  Upload,
  X,
  Eye,
  Trash2,
  Filter,
  User,
  ShoppingBag,
  Package,
  History,
  TrendingDown,
  BarChart3,
  Calendar,
  AlertTriangle,
  Truck,
  Users,
  WifiOff,
  Cloud,
} from "lucide-react";
import SupplierReturnsTab from "@/components/offline-shop/SupplierReturnsTab";
import { DeleteConfirmDialog } from "@/components/offline-shop/DeleteConfirmDialog";
import { useOfflineReturns, useOfflineProductsSimple } from "@/hooks/useOfflineShopData";
import { offlineDataService } from "@/services/offlineDataService";
import { offlineShopService } from "@/services/offlineShopService";


interface ShopReturn {
  id: string;
  product_id: string | null;
  product_name: string;
  customer_id: string | null;
  customer_name: string | null;
  quantity: number;
  return_reason: string;
  return_date: string;
  refund_amount: number;
  notes: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
  is_resellable?: boolean;
  loss_amount?: number;
  original_sale_id?: string | null;
  original_sale_date?: string | null;
  original_unit_price?: number;
  stock_restored?: boolean;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  total_purchases?: number;
  is_walk_in?: boolean;
  sale_ids?: string[];
}

interface SaleItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface CustomerSale {
  id: string;
  invoice_number: string;
  total: number;
  sale_date: string;
  payment_status: string;
  items: SaleItem[];
}

const RETURN_REASONS = [
  "Defective/Damaged",
  "Wrong Item",
  "Size/Fit Issue",
  "Quality Issue",
  "Customer Changed Mind",
  "Expired Product",
  "Other",
];

// API URL for online-only operations (photo upload)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function ShopReturns() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("customer");
  const [returns, setReturns] = useState<ShopReturn[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ShopReturn | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  // Customer search and history states
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [searchedCustomers, setSearchedCustomers] = useState<Customer[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<CustomerSale[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedSaleItem, setSelectedSaleItem] = useState<SaleItem | null>(null);
  const [selectedSale, setSelectedSale] = useState<CustomerSale | null>(null);
  const [customerReturnStats, setCustomerReturnStats] = useState<{
    total_returns: number;
    total_refund_value: number;
    customer_name: string;
  } | null>(null);

  // Resellable return states
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [processFormData, setProcessFormData] = useState({
    return_id: "",
    loss_amount: 0,
    restore_stock: false,
  });

  const [formData, setFormData] = useState({
    product_id: "",
    product_name: "",
    customer_id: "",
    customer_name: "",
    quantity: 1,
    return_reason: "",
    return_date: new Date().toISOString().split("T")[0],
    refund_amount: 0,
    notes: "",
    photo_url: "",
    status: "pending",
    original_sale_id: "",
    original_sale_date: "",
    original_unit_price: 0,
    is_resellable: false,
    loss_amount: 0,
  });

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    status: "",
    search: "",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showReportSection, setShowReportSection] = useState(true);
  const [selectedReportMonth, setSelectedReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const getToken = () => authService.getToken();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchReturns();
      fetchProducts();
      fetchCustomers();
    }
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const result = await offlineDataService.getReturns();
      setReturns((result.returns as unknown as ShopReturn[]) || []);
    } catch (error) {
      console.error("Fetch returns error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const result = await offlineDataService.getProducts();
      setProducts(result.products.map((p: any) => ({ id: p.id, name: p.name, selling_price: p.selling_price })) || []);
    } catch (error) {
      console.error("Fetch products error:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const result = await offlineDataService.getCustomers();
      if (result.customers) {
        setCustomers(result.customers.map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          total_purchases: c.total_purchases,
        })));
      }
    } catch (error) {
      console.error("Fetch customers error:", error);
    }
  };

  // Search customers by name or phone for returns - offline supported
  const searchCustomersForReturn = async (query: string) => {
    if (!query.trim()) {
      setSearchedCustomers([]);
      return;
    }

    setIsSearchingCustomers(true);
    try {
      // Use local offline data for customer search
      const result = await offlineDataService.getCustomers();
      const allCustomers = result.customers || [];
      const salesResult = await offlineDataService.getSales();
      const allSales = salesResult.sales || [];
      
      const queryLower = query.toLowerCase();
      
      // Filter customers by name or phone
      const matchedCustomers = allCustomers.filter((c: any) => 
        c.name?.toLowerCase().includes(queryLower) ||
        c.phone?.includes(query)
      );

      // Also search for walk-in customers from sales
      const walkInSales = allSales.filter((s: any) => 
        !s.customer_id && (
          s.customer_name?.toLowerCase().includes(queryLower) ||
          s.customer_phone?.includes(query)
        )
      );

      // Group walk-in sales by customer name
      const walkInCustomers = new Map<string, any>();
      for (const sale of walkInSales) {
        const key = `${sale.customer_name}-${sale.customer_phone || ''}`;
        if (!walkInCustomers.has(key)) {
          walkInCustomers.set(key, {
            id: key,
            name: sale.customer_name || "Walk-in Customer",
            phone: sale.customer_phone,
            is_walk_in: true,
            sale_ids: [sale.id],
            total_purchases: sale.total,
          });
        } else {
          const existing = walkInCustomers.get(key);
          existing.sale_ids.push(sale.id);
          existing.total_purchases += sale.total;
        }
      }

      const results = [
        ...matchedCustomers.map((c: any) => ({ ...c, is_walk_in: false })),
        ...Array.from(walkInCustomers.values()),
      ];

      setSearchedCustomers(results);
    } catch (error) {
      console.error("Search customers error:", error);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  // Fetch customer purchase history - offline supported
  const fetchCustomerHistory = async (customer: Customer) => {
    try {
      const salesResult = await offlineDataService.getSales();
      const allSales = salesResult.sales || [];
      
      let customerSales: any[] = [];
      
      if (customer.is_walk_in && customer.sale_ids && customer.sale_ids.length > 0) {
        // For walk-in customers, filter by sale IDs
        customerSales = allSales.filter((s: any) => customer.sale_ids?.includes(s.id));
      } else {
        // For registered customers, filter by customer_id
        customerSales = allSales.filter((s: any) => s.customer_id === customer.id);
      }

      const history = customerSales.map((s: any) => ({
        id: s.id,
        invoice_number: s.invoice_number,
        total: s.total,
        sale_date: s.sale_date,
        payment_status: s.payment_status,
        items: s.items || [],
      }));

      setSelectedCustomerHistory(history);
      setCustomerReturnStats({
        total_returns: 0,
        total_refund_value: 0,
        customer_name: customer.name,
      });
      setIsHistoryOpen(true);
    } catch (error) {
      console.error("Fetch customer history error:", error);
      toast.error("Failed to fetch purchase history");
    }
  };

  // Select a sale item for return - auto-fills everything including customer info
  const selectSaleItemForReturn = (sale: CustomerSale, item: SaleItem, customerName?: string, customerId?: string) => {
    setSelectedSale(sale);
    setSelectedSaleItem(item);
    setFormData({
      ...formData,
      product_id: item.product_id || "",
      product_name: item.product_name,
      customer_id: customerId || formData.customer_id,
      customer_name: customerName || formData.customer_name,
      quantity: item.quantity,
      refund_amount: item.unit_price,
      original_sale_id: sale.id,
      original_sale_date: sale.sale_date,
      original_unit_price: item.unit_price,
      return_date: new Date().toISOString().split("T")[0], // Current date
    });
    setIsHistoryOpen(false);
    setCustomerSearchQuery("");
    setSearchedCustomers([]);
    toast.success(`Selected: ${item.product_name} from ${format(new Date(sale.sale_date), "dd/MM/yyyy")}`);
  };

  // Quick add return from search results - offline supported
  const [pendingReturnCustomer, setPendingReturnCustomer] = useState<Customer | null>(null);

  const quickAddReturnForCustomer = async (customer: Customer) => {
    setPendingReturnCustomer(customer);
    
    // Set customer info immediately
    setFormData({
      ...formData,
      customer_id: customer.is_walk_in ? "" : customer.id,
      customer_name: customer.name,
      return_date: new Date().toISOString().split("T")[0],
    });

    // Fetch customer history using local data
    try {
      const salesResult = await offlineDataService.getSales();
      const allSales = salesResult.sales || [];
      
      let customerSales: any[] = [];
      
      if (customer.is_walk_in && customer.sale_ids && customer.sale_ids.length > 0) {
        customerSales = allSales.filter((s: any) => customer.sale_ids?.includes(s.id));
      } else {
        customerSales = allSales.filter((s: any) => s.customer_id === customer.id);
      }

      const history = customerSales.map((s: any) => ({
        id: s.id,
        invoice_number: s.invoice_number,
        total: s.total,
        sale_date: s.sale_date,
        payment_status: s.payment_status,
        items: s.items || [],
      }));

      setSelectedCustomerHistory(history);
      setCustomerReturnStats({
        total_returns: 0,
        total_refund_value: 0,
        customer_name: customer.name,
      });
      setIsHistoryOpen(true);
      setCustomerSearchQuery("");
      setSearchedCustomers([]);
    } catch (error) {
      console.error("Fetch customer history error:", error);
      toast.error("Failed to fetch purchase history");
    }
  };

  // Process resellable return - offline supported
  const processResellableReturn = async () => {
    try {
      // For offline, we just update the local return status
      const returnToUpdate = returns.find(r => r.id === processFormData.return_id);
      if (returnToUpdate) {
        const updatedReturn = {
          ...returnToUpdate,
          status: 'processed',
          loss_amount: processFormData.loss_amount,
          stock_restored: processFormData.restore_stock,
        };
        setReturns(returns.map((r) => (r.id === updatedReturn.id ? updatedReturn : r)));
        toast.success(language === "bn" ? "রিটার্ন প্রসেস হয়েছে" : "Return processed successfully");
        setIsProcessOpen(false);
        setProcessFormData({ return_id: "", loss_amount: 0, restore_stock: false });
      }
    } catch (error) {
      console.error("Process resellable error:", error);
      toast.error("Failed to process return");
    }
  };

  // Open process dialog
  const openProcessDialog = (ret: ShopReturn) => {
    setProcessFormData({
      return_id: ret.id,
      loss_amount: 0,
      restore_stock: false,
    });
    setSelectedReturn(ret);
    setIsProcessOpen(true);
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setFormData({
      ...formData,
      product_id: productId,
      product_name: product?.name || "",
      refund_amount: product?.selling_price || 0,
    });
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setFormData({
      ...formData,
      customer_id: customerId,
      customer_name: customer?.name || "",
    });
    // Fetch customer's purchase history
    if (customer) {
      fetchCustomerHistory(customer);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getToken();
    if (!token) {
      toast.error("Please log in to upload photos");
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("bucket", "return-photos");
      formDataUpload.append("folder", "returns");

      const response = await fetch(`${SUPABASE_URL}/functions/v1/storage-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setFormData({ ...formData, photo_url: data.url });
      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    if (!formData.photo_url) return;

    const token = getToken();
    if (!token) return;

    try {
      // Extract file path from signed URL
      const urlObj = new URL(formData.photo_url);
      const pathMatch = urlObj.pathname.match(/\/return-photos\/(.+?)(?:\?|$)/);
      if (!pathMatch) {
        setFormData({ ...formData, photo_url: "" });
        return;
      }
      const filePath = decodeURIComponent(pathMatch[1]);

      await fetch(`${SUPABASE_URL}/functions/v1/storage-upload`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath, bucket: "return-photos" }),
      });
      setFormData({ ...formData, photo_url: "" });
      toast.success("Photo removed");
    } catch (error) {
      console.error("Remove photo error:", error);
      setFormData({ ...formData, photo_url: "" });
    }
  };

  const handleSubmit = async () => {
    if (!formData.product_name || !formData.return_reason) {
      toast.error("Product name and return reason are required");
      return;
    }

    try {
      // Use offlineDataService for offline-first return creation
      const returnData = {
        return_type: 'sale' as const,
        reference_id: formData.original_sale_id || '',
        reference_invoice: '',
        product_id: formData.product_id,
        product_name: formData.product_name,
        quantity: formData.quantity,
        unit_price: formData.refund_amount,
        total_amount: formData.refund_amount * formData.quantity,
        reason: formData.return_reason,
        notes: formData.notes,
        return_date: formData.return_date,
        customer_id: formData.customer_id,
        customer_name: formData.customer_name,
        photo_url: formData.photo_url,
        status: formData.status,
        is_resellable: formData.is_resellable,
        loss_amount: formData.loss_amount,
      };

      const result = await offlineDataService.createReturn(returnData);
      
      if (result.return) {
        // Convert to the local interface format
        const newReturn: ShopReturn = {
          id: result.return.id,
          product_id: result.return.product_id,
          product_name: result.return.product_name,
          customer_id: formData.customer_id || null,
          customer_name: formData.customer_name || null,
          quantity: result.return.quantity,
          return_reason: result.return.reason || '',
          return_date: result.return.return_date,
          refund_amount: result.return.total_amount,
          notes: result.return.notes || null,
          photo_url: formData.photo_url || null,
          status: formData.status,
          created_at: result.return.created_at,
          is_resellable: formData.is_resellable,
          loss_amount: formData.loss_amount,
          original_sale_id: formData.original_sale_id || null,
          original_sale_date: formData.original_sale_date || null,
          original_unit_price: formData.original_unit_price,
          stock_restored: false,
        };
        
        setReturns([newReturn, ...returns]);
        toast.success(result.offline 
          ? (language === "bn" ? "রিটার্ন যোগ হয়েছে (অফলাইন)" : "Return added (offline)")
          : (language === "bn" ? "রিটার্ন যোগ হয়েছে" : "Return added successfully")
        );
        setIsAddOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to add return");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      // Update locally
      setReturns(returns.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      toast.success(language === "bn" ? "স্ট্যাটাস আপডেট হয়েছে" : "Status updated");
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Failed to update status");
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    
    setIsDeleting(true);
    try {
      // Delete from local state and sync queue will handle server deletion
      setReturns(returns.filter((r) => r.id !== deletingId));
      toast.success(language === "bn" ? "রিটার্ন ট্র্যাশে সরানো হয়েছে" : "Return moved to trash");
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete return. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };


  const resetForm = () => {
    setFormData({
      product_id: "",
      product_name: "",
      customer_id: "",
      customer_name: "",
      quantity: 1,
      return_reason: "",
      return_date: new Date().toISOString().split("T")[0],
      refund_amount: 0,
      notes: "",
      photo_url: "",
      status: "pending",
      original_sale_id: "",
      original_sale_date: "",
      original_unit_price: 0,
      is_resellable: false,
      loss_amount: 0,
    });
    setCustomerSearchQuery("");
    setSearchedCustomers([]);
    setSelectedCustomerHistory([]);
    setSelectedSaleItem(null);
    setSelectedSale(null);
    setCustomerReturnStats(null);
    setPendingReturnCustomer(null);
  };

  const applyFilters = () => {
    fetchReturns();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      reason: "",
      status: "",
      search: "",
    });
    setTimeout(() => fetchReturns(), 100);
  };


  const filteredReturns = returns.filter(
    (r) =>
      r.product_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      r.customer_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      r.return_reason.toLowerCase().includes(filters.search.toLowerCase())
  );

  // Monthly Report Calculations
  const getMonthlyReportData = () => {
    const [year, month] = selectedReportMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const monthlyReturns = returns.filter((r) => {
      const returnDate = new Date(r.return_date);
      return returnDate >= monthStart && returnDate <= monthEnd;
    });

    // Calculate total stats
    const totalReturns = monthlyReturns.length;
    const totalRefundValue = monthlyReturns.reduce((sum, r) => sum + (r.refund_amount || 0), 0);
    const totalLoss = monthlyReturns.reduce((sum, r) => sum + (r.loss_amount || 0), 0);
    const resellableCount = monthlyReturns.filter((r) => r.is_resellable || r.stock_restored).length;
    const damagedCount = monthlyReturns.filter((r) => !r.is_resellable && !r.stock_restored).length;

    // Group by product
    const productMap = new Map<string, { name: string; count: number; refund: number; loss: number }>();
    monthlyReturns.forEach((r) => {
      const key = r.product_id || r.product_name;
      const existing = productMap.get(key) || { name: r.product_name, count: 0, refund: 0, loss: 0 };
      existing.count += r.quantity;
      existing.refund += r.refund_amount || 0;
      existing.loss += r.loss_amount || 0;
      productMap.set(key, existing);
    });

    const topReturnedProducts = Array.from(productMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Group by reason
    const reasonMap = new Map<string, number>();
    monthlyReturns.forEach((r) => {
      reasonMap.set(r.return_reason, (reasonMap.get(r.return_reason) || 0) + 1);
    });

    const returnsByReason = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalReturns,
      totalRefundValue,
      totalLoss,
      resellableCount,
      damagedCount,
      topReturnedProducts,
      returnsByReason,
      monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  };

  const reportData = getMonthlyReportData();

  return (
    <ShopLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Product Returns</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage returns from customers & to suppliers</p>
          </div>
        </div>

        {/* Tabs for Customer vs Supplier Returns */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="customer" className="gap-2">
              <Users className="h-4 w-4" />
              Customer Returns
            </TabsTrigger>
            <TabsTrigger value="supplier" className="gap-2">
              <Truck className="h-4 w-4" />
              Supplier Returns
            </TabsTrigger>
          </TabsList>

          {/* Customer Returns Tab */}
          <TabsContent value="customer" className="mt-6 space-y-6">
            <div className="flex justify-end gap-2">
              <Button
                variant={showReportSection ? "default" : "outline"}
                onClick={() => setShowReportSection(!showReportSection)}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                {showReportSection ? "Hide Report" : "Show Report"}
              </Button>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Return
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Product Return</DialogTitle>
                <DialogDescription>Record a product return from a customer</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                
                {/* Step 1: Customer Search - Primary Action */}
                <Card className="border-2 border-primary/40 bg-primary/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium">Search Customer (Name or Phone)</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={customerSearchQuery}
                          onChange={(e) => {
                            setCustomerSearchQuery(e.target.value);
                            searchCustomersForReturn(e.target.value);
                          }}
                          placeholder="Type customer name or phone to find purchase history..."
                          className="pl-9"
                        />
                      </div>
                    </div>
                    
                    {/* Search Results */}
                    {searchedCustomers.length > 0 && (
                      <div className="mt-3 border rounded-lg divide-y max-h-64 overflow-y-auto bg-background">
                        {searchedCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium flex items-center gap-2">
                                  {customer.name}
                                  {customer.is_walk_in && (
                                    <Badge variant="outline" className="text-xs">Walk-in</Badge>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">{customer.phone || "No phone"}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="gap-1"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      customer_id: customer.is_walk_in ? "" : customer.id,
                                      customer_name: customer.name,
                                    });
                                    fetchCustomerHistory(customer);
                                    setCustomerSearchQuery("");
                                    setSearchedCustomers([]);
                                  }}
                                >
                                  <History className="h-4 w-4" />
                                  View Purchases
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="gap-1 bg-primary"
                                  onClick={() => quickAddReturnForCustomer(customer)}
                                >
                                  <Plus className="h-4 w-4" />
                                  Add Return
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {isSearchingCustomers && (
                      <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                    )}

                    {/* Selected Customer Badge with Remove Option */}
                    {formData.customer_name && !searchedCustomers.length && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="gap-1 pr-1">
                          <User className="h-3 w-3" />
                          {formData.customer_name}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 ml-1 hover:bg-destructive/20 rounded-full"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                customer_id: "",
                                customer_name: "",
                              });
                              setSelectedSaleItem(null);
                              setSelectedSale(null);
                              setPendingReturnCustomer(null);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                        {!selectedSaleItem && (formData.customer_id || pendingReturnCustomer) && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const customer = pendingReturnCustomer || customers.find(c => c.id === formData.customer_id);
                              if (customer) fetchCustomerHistory(customer);
                            }}
                          >
                            <History className="h-4 w-4 mr-1" />
                            View Purchase History
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Step 2: Selected Sale Info - Shows after selecting from history */}
                {selectedSaleItem && selectedSale ? (
                  <Card className="border-2 border-green-500/40 bg-green-500/5">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold">2</div>
                          <ShoppingBag className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700">Selected Product from Purchase</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setSelectedSaleItem(null);
                            setSelectedSale(null);
                            setFormData({
                              ...formData,
                              product_id: "",
                              product_name: "",
                              quantity: 1,
                              refund_amount: 0,
                              original_sale_id: "",
                              original_sale_date: "",
                              original_unit_price: 0,
                            });
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Change
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Invoice</p>
                          <p className="font-medium">{selectedSale.invoice_number}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Sale Date</p>
                          <p className="font-medium">{format(new Date(selectedSale.sale_date), "dd/MM/yyyy")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Product</p>
                          <p className="font-medium">{selectedSaleItem.product_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Sold Qty × Price</p>
                          <p className="font-medium">{selectedSaleItem.quantity} × ৳{selectedSaleItem.unit_price}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  /* Alternative: Manual Entry if no history */
                  <Card className="border border-dashed">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">2</div>
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">Or Enter Product Manually (if no purchase history)</span>
                      </div>
                      <div className="space-y-2">
                        <Label>Select or Type Product Name</Label>
                        <div className="relative">
                          <Input
                            value={formData.product_name}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                product_name: e.target.value,
                                product_id: "",
                              });
                            }}
                            placeholder="Type product name or select from list..."
                            list="product-options"
                          />
                          <datalist id="product-options">
                            {products.map((p) => (
                              <option key={p.id} value={p.name}>
                                {p.name} - ৳{p.selling_price}
                              </option>
                            ))}
                          </datalist>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {products.filter(p => 
                            formData.product_name && 
                            p.name.toLowerCase().includes(formData.product_name.toLowerCase())
                          ).slice(0, 5).map((p) => (
                            <Button
                              key={p.id}
                              type="button"
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleProductChange(p.id)}
                            >
                              {p.name} - ৳{p.selling_price}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {formData.product_id && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Selected: <span className="font-medium text-foreground">{formData.product_name}</span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Auto-filled Return Details */}
                <Card className={selectedSaleItem ? "border-2 border-blue-500/30 bg-blue-500/5" : "border border-dashed"}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">✓</div>
                      <span className="font-medium">Return Details</span>
                      {selectedSaleItem && <Badge variant="secondary" className="text-xs">Auto-filled</Badge>}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {/* Customer Name */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Customer</Label>
                        <div className="p-2 bg-muted/50 rounded-md text-sm font-medium">
                          {formData.customer_name || "—"}
                        </div>
                      </div>
                      
                      {/* Sale/Buy Date */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Sale Date</Label>
                        <div className="p-2 bg-muted/50 rounded-md text-sm font-medium">
                          {formData.original_sale_date 
                            ? format(new Date(formData.original_sale_date), "dd/MM/yyyy")
                            : "—"
                          }
                        </div>
                      </div>
                      
                      {/* Product Name */}
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs text-muted-foreground">Product</Label>
                        <div className="p-2 bg-muted/50 rounded-md text-sm font-medium truncate">
                          {formData.product_name || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Quantity - Editable */}
                      <div className="space-y-2">
                        <Label>Return Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          max={selectedSaleItem?.quantity || 999}
                          value={formData.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 1;
                            setFormData({
                              ...formData,
                              quantity: qty,
                              refund_amount: qty * formData.original_unit_price,
                            });
                          }}
                        />
                        {selectedSaleItem && (
                          <p className="text-xs text-muted-foreground">
                            Max: {selectedSaleItem.quantity} (sold qty)
                          </p>
                        )}
                      </div>
                      
                      {/* Return Date - Current date, editable */}
                      <div className="space-y-2">
                        <Label>Return Date</Label>
                        <Input
                          type="date"
                          value={formData.return_date}
                          onChange={(e) =>
                            setFormData({ ...formData, return_date: e.target.value })
                          }
                        />
                      </div>
                      
                      {/* Refund Amount - Auto-calculated */}
                      <div className="space-y-2">
                        <Label>Refund Amount (৳)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={formData.refund_amount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData({
                                ...formData,
                                refund_amount: val === "" ? 0 : parseFloat(val) || 0,
                              });
                            }}
                            className="font-bold text-lg"
                          />
                          {formData.original_unit_price > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              = {formData.quantity} × ৳{formData.original_unit_price}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Return Reason *</Label>
                  <Select
                    value={formData.return_reason}
                    onValueChange={(val) =>
                      setFormData({ ...formData, return_reason: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {RETURN_REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 3: Product Condition - Resellable or Damaged */}
                <Card className="border border-dashed">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">3</div>
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Product Condition</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.is_resellable 
                            ? 'border-green-500 bg-green-500/10' 
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                        onClick={() => setFormData({ ...formData, is_resellable: true, loss_amount: 0 })}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            formData.is_resellable ? 'border-green-500 bg-green-500' : 'border-muted-foreground'
                          }`}>
                            {formData.is_resellable && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div>
                            <p className="font-medium text-green-700">Resellable</p>
                            <p className="text-xs text-muted-foreground">Product will be added back to inventory</p>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          !formData.is_resellable 
                            ? 'border-destructive bg-destructive/10' 
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                        onClick={() => setFormData({ ...formData, is_resellable: false })}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            !formData.is_resellable ? 'border-destructive bg-destructive' : 'border-muted-foreground'
                          }`}>
                            {!formData.is_resellable && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div>
                            <p className="font-medium text-destructive">Damaged / Not Resellable</p>
                            <p className="text-xs text-muted-foreground">Product is completely damaged or lost</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!formData.is_resellable && (
                      <div className="mt-4 space-y-2">
                        <Label>Loss Amount (৳)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={formData.loss_amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({
                              ...formData,
                              loss_amount: val === "" ? 0 : parseFloat(val) || 0,
                            });
                          }}
                          placeholder="Enter loss amount to deduct from profit..."
                        />
                        <p className="text-xs text-muted-foreground">
                          This amount will be deducted from the original sale's profit
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Photo</Label>
                  {formData.photo_url ? (
                    <div className="relative inline-block">
                      <img
                        src={formData.photo_url}
                        alt="Return photo"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={removePhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploading}
                        className="hidden"
                        id="photo-upload"
                      />
                      <Label
                        htmlFor="photo-upload"
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload Photo"}
                      </Label>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>Add Return</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
            </div>

        {/* Monthly Returns Report */}
        {showReportSection && (
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Monthly Returns Report</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="month"
                    value={selectedReportMonth}
                    onChange={(e) => setSelectedReportMonth(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Card className="bg-muted/30">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-sm text-muted-foreground">Total Returns</p>
                    <p className="text-2xl font-bold">{reportData.totalReturns}</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/30">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-sm text-amber-700">Total Refunds</p>
                    <p className="text-2xl font-bold text-amber-700">৳{reportData.totalRefundValue.toFixed(0)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-destructive/10 border-destructive/30">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      <p className="text-sm text-destructive">Total Loss</p>
                    </div>
                    <p className="text-2xl font-bold text-destructive">৳{reportData.totalLoss.toFixed(0)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-sm text-green-700">Resellable</p>
                    <p className="text-2xl font-bold text-green-700">{reportData.resellableCount}</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-600">Damaged</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{reportData.damagedCount}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Returned Products */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Top Returned Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.topReturnedProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No returns this month</p>
                    ) : (
                      <div className="space-y-3">
                        {reportData.topReturnedProducts.map((product, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                index === 0 ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="text-sm font-medium truncate max-w-[150px]">{product.name}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{product.count} pcs</p>
                              <p className="text-xs text-muted-foreground">৳{product.refund.toFixed(0)} refund</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Returns by Reason */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Returns by Reason
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.returnsByReason.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No returns this month</p>
                    ) : (
                      <div className="space-y-2">
                        {reportData.returnsByReason.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{item.reason}</span>
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-2 bg-primary/60 rounded-full" 
                                style={{ 
                                  width: `${Math.max(20, (item.count / reportData.totalReturns) * 100)}px` 
                                }}
                              />
                              <span className="text-sm font-bold w-8 text-right">{item.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Only - No complex filters for customer returns */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search returns..."
                className="pl-10"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8">Loading returns...</div>
            ) : filteredReturns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RotateCcw className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No returns found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Refund</TableHead>
                      <TableHead>Resellable</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReturns.map((ret) => (
                      <TableRow key={ret.id}>
                        <TableCell>
                          {format(new Date(ret.return_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {ret.product_name}
                        </TableCell>
                        <TableCell>{ret.customer_name || "-"}</TableCell>
                        <TableCell>{ret.quantity}</TableCell>
                        <TableCell>
                          <span className="text-sm">{ret.return_reason}</span>
                        </TableCell>
                        <TableCell>৳{ret.refund_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          {ret.is_resellable || ret.stock_restored ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-destructive border-destructive">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedReturn(ret);
                                setIsViewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => openDeleteDialog(ret.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Return Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Return Details</DialogTitle>
              <DialogDescription>View detailed information about this return</DialogDescription>
            </DialogHeader>
            {selectedReturn && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Product</Label>
                    <p className="font-medium">{selectedReturn.product_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Customer</Label>
                    <p className="font-medium">
                      {selectedReturn.customer_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Return Date</Label>
                    <p className="font-medium">
                      {format(new Date(selectedReturn.return_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Quantity</Label>
                    <p className="font-medium">{selectedReturn.quantity}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Reason</Label>
                    <p className="font-medium">{selectedReturn.return_reason}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Refund Amount</Label>
                    <p className="font-medium">
                      ৳{selectedReturn.refund_amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                {selectedReturn.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="mt-1">{selectedReturn.notes}</p>
                  </div>
                )}
                {selectedReturn.original_sale_id && (
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-muted-foreground">Original Sale Info</Label>
                    <p className="text-sm mt-1">
                      Sale Date: {selectedReturn.original_sale_date ? format(new Date(selectedReturn.original_sale_date), "dd/MM/yyyy") : "N/A"}
                      {selectedReturn.original_unit_price ? ` | Original Price: ৳${selectedReturn.original_unit_price}` : ""}
                    </p>
                  </div>
                )}
                {selectedReturn.is_resellable !== undefined && (
                  <div className="flex items-center gap-4">
                    <Badge variant={selectedReturn.stock_restored ? "default" : "outline"}>
                      {selectedReturn.stock_restored ? "Stock Restored" : "Stock Not Restored"}
                    </Badge>
                    {(selectedReturn.loss_amount || 0) > 0 && (
                      <Badge variant="destructive">Loss: ৳{selectedReturn.loss_amount}</Badge>
                    )}
                  </div>
                )}
                {selectedReturn.photo_url && (
                  <div>
                    <Label className="text-muted-foreground">Photo</Label>
                    <img
                      src={selectedReturn.photo_url}
                      alt="Return photo"
                      className="mt-2 w-full max-h-64 object-contain rounded-lg border"
                    />
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Customer Purchase History Dialog */}
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Customer Purchase History
                {formData.customer_name && (
                  <Badge variant="secondary">{formData.customer_name}</Badge>
                )}
              </DialogTitle>
              <DialogDescription>View purchase history to process returns</DialogDescription>
            </DialogHeader>

            {/* Customer Return Stats */}
            {customerReturnStats && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700">Return History</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Total Returns</p>
                        <p className="font-bold text-lg text-amber-600">{customerReturnStats.total_returns}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Total Refunds</p>
                        <p className="font-bold text-lg text-amber-600">৳{customerReturnStats.total_refund_value.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedCustomerHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No purchase history found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedCustomerHistory.map((sale) => (
                  <Card key={sale.id}>
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-sm">{sale.invoice_number}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(sale.sale_date), "dd/MM/yyyy hh:mm a")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">৳{sale.total}</p>
                          <Badge variant={sale.payment_status === "paid" ? "default" : "secondary"}>
                            {sale.payment_status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-center">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sale.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.product_name}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-right">৳{item.unit_price}</TableCell>
                              <TableCell className="text-right">৳{item.total}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  className="gap-1 bg-primary"
                                  onClick={() => selectSaleItemForReturn(
                                    sale, 
                                    item, 
                                    pendingReturnCustomer?.name || formData.customer_name,
                                    pendingReturnCustomer?.is_walk_in ? "" : (pendingReturnCustomer?.id || formData.customer_id)
                                  )}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Return
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Process Resellable Return Dialog */}
        <Dialog open={isProcessOpen} onOpenChange={setIsProcessOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Process Return
              </DialogTitle>
              <DialogDescription>Process this return and update inventory</DialogDescription>
            </DialogHeader>
            {selectedReturn && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{selectedReturn.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {selectedReturn.quantity} | Refund: ৳{selectedReturn.refund_amount}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id="restore-stock"
                      checked={processFormData.restore_stock}
                      onCheckedChange={(checked) =>
                        setProcessFormData({
                          ...processFormData,
                          restore_stock: checked === true,
                        })
                      }
                    />
                    <div>
                      <Label htmlFor="restore-stock" className="font-medium cursor-pointer">
                        Product is resellable - Add back to inventory
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Stock will increase by {selectedReturn.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Loss Amount (৳)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={processFormData.loss_amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProcessFormData({
                          ...processFormData,
                          loss_amount: val === "" ? 0 : parseFloat(val) || 0,
                        });
                      }}
                      placeholder="Enter loss amount..."
                    />
                    <p className="text-xs text-muted-foreground">
                      This amount will be deducted from the original sale's profit
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsProcessOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={processResellableReturn}>
                    {processFormData.restore_stock ? "Process & Restore Stock" : "Process Return"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
          </TabsContent>

          {/* Supplier Returns Tab */}
          <TabsContent value="supplier" className="mt-6">
            <SupplierReturnsTab />
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeletingId(null);
        }}
        onConfirm={handleDelete}
        title={t("shop.return") || "return"}
        itemCount={1}
        isSoftDelete={true}
        isLoading={isDeleting}
      />
    </ShopLayout>
  );

}
