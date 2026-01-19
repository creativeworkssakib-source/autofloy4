import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Truck,
  Upload,
  X,
  Eye,
  Trash2,
  Package,
  Filter,
  RefreshCw,
} from "lucide-react";

interface SupplierReturn {
  id: string;
  supplier_id: string | null;
  supplier_name: string | null;
  purchase_id: string | null;
  product_id: string | null;
  product_name: string;
  quantity: number;
  return_reason: string;
  return_date: string;
  refund_amount: number;
  unit_cost: number;
  status: string;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
}

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
}

interface Purchase {
  id: string;
  invoice_number: string;
  supplier_name: string | null;
  purchase_date: string;
  total_amount: number;
  items: PurchaseItem[];
}

interface PurchaseItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const SUPPLIER_RETURN_REASONS = [
  "Defective/Damaged",
  "Wrong Item",
  "Size/Fit Issue",
  "Quality Issue",
  "Expired/Near Expiry",
  "Wrong Quantity",
  "Other",
];

const STATUS_OPTIONS = ["pending", "processed", "refunded", "rejected"];

const SUPABASE_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co";

export default function SupplierReturnsTab() {
  const [returns, setReturns] = useState<SupplierReturn[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
const [isViewOpen, setIsViewOpen] = useState(false);
const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SupplierReturn | null>(null);
  const [uploading, setUploading] = useState(false);

  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [selectedSupplierPurchases, setSelectedSupplierPurchases] = useState<Purchase[]>([]);
  const [isPurchasesOpen, setIsPurchasesOpen] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    supplier_id: "",
    supplier_name: "",
    purchase_id: "",
    product_id: "",
    product_name: "",
    quantity: 1,
    return_reason: "",
    return_date: new Date().toISOString().split("T")[0],
    refund_amount: 0,
    unit_cost: 0,
    notes: "",
    photo_url: "",
    status: "pending",
  });

  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [processFormData, setProcessFormData] = useState({
    return_id: "",
    refund_received: false,
    notes: "",
  });

  const getToken = () => authService.getToken();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchReturns();
      fetchSuppliers();
      fetchPurchases();
    }
  }, []);

  const fetchReturns = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/shop-returns/supplier-returns`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.returns) {
        setReturns(data.returns);
      }
    } catch (error) {
      console.error("Fetch supplier returns error:", error);
      toast.error("Failed to fetch supplier returns");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    const token = getToken();
    if (!token) return;

    try {
      // Fetch from shop_suppliers table
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/offline-shop/suppliers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      const registeredSuppliers: Supplier[] = data.suppliers || [];
      
      // Also fetch unique suppliers from shop_products (Excel imported products)
      const productsResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/offline-shop/products`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const productsData = await productsResponse.json();
      const products = productsData.products || [];
      
      // Extract unique suppliers from products
      const productSupplierMap = new Map<string, { name: string; phone: string | null }>();
      products.forEach((product: { supplier_name?: string; supplier_contact?: string }) => {
        if (product.supplier_name && product.supplier_name.trim()) {
          const key = product.supplier_name.toLowerCase().trim();
          if (!productSupplierMap.has(key)) {
            productSupplierMap.set(key, {
              name: product.supplier_name.trim(),
              phone: product.supplier_contact || null,
            });
          }
        }
      });
      
      // Merge: registered suppliers + product suppliers (avoid duplicates)
      const registeredNames = new Set(registeredSuppliers.map(s => s.name.toLowerCase().trim()));
      const productSuppliers: Supplier[] = [];
      
      productSupplierMap.forEach((value, key) => {
        if (!registeredNames.has(key)) {
          productSuppliers.push({
            id: `product-supplier-${key}`, // Unique ID for product suppliers
            name: value.name,
            phone: value.phone,
          });
        }
      });
      
      setSuppliers([...registeredSuppliers, ...productSuppliers]);
    } catch (error) {
      console.error("Fetch suppliers error:", error);
    }
  };

  const fetchPurchases = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/offline-shop/purchases`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.purchases) {
        // Ensure items have proper quantity parsed as numbers
        const parsedPurchases = data.purchases.map((purchase: any) => ({
          ...purchase,
          items: (purchase.items || []).map((item: any) => ({
            ...item,
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
            total: Number(item.total) || 0,
          })),
        }));
        console.log("Parsed purchases:", parsedPurchases);
        setPurchases(parsedPurchases);
      }
    } catch (error) {
      console.error("Fetch purchases error:", error);
    }
  };

  const handleSupplierSelect = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (supplier) {
      setFormData({
        ...formData,
        supplier_id: supplierId,
        supplier_name: supplier.name,
      });
      
      // Filter purchases by this supplier
      const supplierPurchases = purchases.filter(
        (p) => p.supplier_name?.toLowerCase() === supplier.name.toLowerCase()
      );
      setSelectedSupplierPurchases(supplierPurchases);
      if (supplierPurchases.length > 0) {
        setIsPurchasesOpen(true);
      }
    }
  };

  const selectPurchaseItem = async (purchase: Purchase, item: PurchaseItem) => {
    const itemUnitPrice = Number(item.unit_price) || 0;
    
    // Fetch current stock quantity from products list
    let stockQuantity = Number(item.quantity) || 1;
    let matchedProductId = item.product_id || "";
    
    const token = getToken();
    const shopId = localStorage.getItem("autofloy_current_shop_id");
    if (token) {
      try {
        const url = new URL(`${SUPABASE_URL}/functions/v1/offline-shop/products`);
        if (shopId) url.searchParams.set("shop_id", shopId);
        
        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(shopId ? { "X-Shop-Id": shopId } : {}),
          },
        });
        const data = await response.json();
        
        if (data.products && Array.isArray(data.products)) {
          // Find product by name and matching purchase price
          const matchingProducts = data.products.filter(
            (p: any) => p.name?.toLowerCase() === item.product_name?.toLowerCase()
          );
          
          if (matchingProducts.length > 0) {
            // Find the one with the closest purchase price
            let bestMatch = matchingProducts[0];
            let smallestDiff = Math.abs(Number(bestMatch.purchase_price || 0) - itemUnitPrice);
            
            for (const p of matchingProducts) {
              const diff = Math.abs(Number(p.purchase_price || 0) - itemUnitPrice);
              if (diff < smallestDiff) {
                smallestDiff = diff;
                bestMatch = p;
              }
            }
            
            stockQuantity = Number(bestMatch.stock_quantity) || 1;
            matchedProductId = bestMatch.id;
            console.log("Matched product by name+price:", bestMatch.name, "Price:", bestMatch.purchase_price, "Stock:", stockQuantity);
          }
        }
      } catch (error) {
        console.error("Error fetching product stock:", error);
      }
    }
    
    console.log("Selected item:", item, "Stock quantity:", stockQuantity);
    
    // Start with 1, max is the product's current stock
    const qty = Math.min(1, stockQuantity);
    setMaxQuantity(stockQuantity);
    setFormData({
      ...formData,
      purchase_id: purchase.id,
      product_id: matchedProductId,
      product_name: item.product_name,
      quantity: qty,
      unit_cost: itemUnitPrice,
      refund_amount: itemUnitPrice * qty,
    });
    setIsPurchasesOpen(false);
    toast.success(`Selected: ${item.product_name} (max: ${stockQuantity})`);
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
      formDataUpload.append("folder", "supplier-returns");

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
      toast.success("Photo uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const token = getToken();
    if (!token) return;

    if (!formData.product_name || !formData.return_reason) {
      toast.error("Product name and return reason are required");
      return;
    }

    try {
      // Prepare payload - if supplier_id starts with "product-supplier-", it's from products table, not a real UUID
      const payload = {
        ...formData,
        // Set supplier_id to null if it's a product-based supplier (not a real UUID)
        supplier_id: formData.supplier_id && !formData.supplier_id.startsWith("product-supplier-") 
          ? formData.supplier_id 
          : null,
        // Set product_id to null if empty
        product_id: formData.product_id || null,
        // Set purchase_id to null if empty
        purchase_id: formData.purchase_id || null,
      };

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/shop-returns/supplier-returns`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (data.return) {
        setReturns([data.return, ...returns]);
        toast.success("Supplier return added successfully");
        setIsAddOpen(false);
        resetForm();
      } else {
        toast.error(data.error || "Failed to add supplier return");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to add supplier return");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/shop-returns/supplier-returns`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id, status: newStatus }),
        }
      );

      const data = await response.json();
      if (data.return) {
        setReturns(returns.map((r) => (r.id === id ? data.return : r)));
        toast.success("Status updated");
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    const token = getToken();
    if (!token) return;

    if (!confirm("Are you sure you want to delete this return? It will be moved to Trash for 7 days.")) return;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/shop-returns/supplier-returns?id=${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setReturns(returns.filter((r) => r.id !== id));
        toast.success("Supplier return moved to trash");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete return");
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      supplier_name: "",
      purchase_id: "",
      product_id: "",
      product_name: "",
      quantity: 1,
      return_reason: "",
      return_date: new Date().toISOString().split("T")[0],
      refund_amount: 0,
      unit_cost: 0,
      notes: "",
      photo_url: "",
      status: "pending",
    });
    setSelectedSupplierPurchases([]);
    setMaxQuantity(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processed: "default",
      refunded: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const openProcessDialog = (ret: SupplierReturn) => {
    setProcessFormData({
      return_id: ret.id,
      refund_received: false,
      notes: "",
    });
    setSelectedReturn(ret);
    setIsProcessOpen(true);
  };

  const handleProcessReturn = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const newStatus = processFormData.refund_received ? "refunded" : "processed";
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/shop-returns/supplier-returns`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            id: processFormData.return_id, 
            status: newStatus,
            notes: processFormData.notes || selectedReturn?.notes,
          }),
        }
      );

      const data = await response.json();
      if (data.return) {
        setReturns(returns.map((r) => (r.id === processFormData.return_id ? data.return : r)));
        toast.success(`Return ${processFormData.refund_received ? "refunded" : "processed"} successfully`);
        setIsProcessOpen(false);
      }
    } catch (error) {
      console.error("Process return error:", error);
      toast.error("Failed to process return");
    }
  };

  const filteredReturns = returns.filter(
    (r) => {
      const matchesSearch = r.product_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.supplier_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        r.return_reason.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesStatus = !statusFilter || r.status === statusFilter;
      const matchesReason = !reasonFilter || r.return_reason === reasonFilter;
      return matchesSearch && matchesStatus && matchesReason;
    }
  );

  // Calculate summary
  const totalReturns = returns.length;
  const totalRefundValue = returns.reduce((sum, r) => sum + (r.refund_amount || 0), 0);
  const pendingCount = returns.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-muted-foreground">Total Supplier Returns</p>
            <p className="text-2xl font-bold">{totalReturns}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-amber-700">Expected Refund</p>
            <p className="text-2xl font-bold text-amber-700">৳{totalRefundValue.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-orange-700">Pending Returns</p>
            <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge
            variant={statusFilter === "" ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/80 transition-colors"
            onClick={() => setStatusFilter("")}
          >
            All
          </Badge>
          {STATUS_OPTIONS.map((status) => {
            const isSelected = statusFilter === status;
            const getStatusColor = () => {
              if (!isSelected) return "hover:bg-muted";
              switch (status) {
                case "pending": return "bg-amber-500 hover:bg-amber-600 text-white";
                case "processed": return "bg-green-500 hover:bg-green-600 text-white";
                case "refunded": return "bg-blue-500 hover:bg-blue-600 text-white";
                default: return "bg-destructive hover:bg-destructive/80 text-white";
              }
            };
            return (
              <Badge
                key={status}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer transition-colors capitalize ${getStatusColor()}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Reason Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">Reason:</span>
        <Badge
          variant={reasonFilter === "" ? "default" : "outline"}
          className="cursor-pointer hover:bg-primary/80 transition-colors"
          onClick={() => setReasonFilter("")}
        >
          All
        </Badge>
        {SUPPLIER_RETURN_REASONS.slice(0, 5).map((reason) => (
          <Badge
            key={reason}
            variant={reasonFilter === reason ? "secondary" : "outline"}
            className="cursor-pointer hover:bg-secondary/80 transition-colors"
            onClick={() => setReasonFilter(reason)}
          >
            {reason}
          </Badge>
        ))}
        {SUPPLIER_RETURN_REASONS.length > 5 && (
          <Popover>
            <PopoverTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-muted transition-colors"
              >
                +{SUPPLIER_RETURN_REASONS.length - 5} more
              </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex flex-col gap-1">
                {SUPPLIER_RETURN_REASONS.slice(5).map((reason) => (
                  <Badge
                    key={reason}
                    variant={reasonFilter === reason ? "secondary" : "outline"}
                    className="cursor-pointer hover:bg-secondary/80 transition-colors justify-start"
                    onClick={() => setReasonFilter(reason)}
                  >
                    {reason}
                  </Badge>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Add Button & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search supplier returns..."
            className="pl-10"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier Return
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Return Product to Supplier
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Step 1: Select Supplier */}
              <Card className="border-2 border-primary/40 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="font-medium">Select Supplier</span>
                  </div>
                  <Select value={formData.supplier_id} onValueChange={handleSupplierSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No suppliers found. Add suppliers first.
                        </div>
                      ) : (
                        suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} {s.phone ? `(${s.phone})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formData.supplier_name && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: <span className="font-medium text-foreground">{formData.supplier_name}</span>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Product Details */}
              <Card className="border border-dashed">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">2</div>
                    <Package className="h-4 w-4" />
                    <span className="font-medium">Product Details</span>
                  </div>
                  
                  {/* Select from purchase if supplier is selected and has purchases */}
                  {formData.supplier_id && selectedSupplierPurchases.length > 0 && (
                    <div className="mb-4">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setIsPurchasesOpen(true)}
                      >
                        Select from purchases...
                      </Button>
                    </div>
                  )}
                  
                  {/* Always show product name and quantity fields */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Product Name *</Label>
                      <Input
                        placeholder="Enter product name"
                        value={formData.product_name}
                        onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Return Quantity * {maxQuantity && <span className="text-xs text-muted-foreground">(max: {maxQuantity})</span>}</Label>
                        <Input
                          type="number"
                          min={1}
                          max={maxQuantity || undefined}
                          value={formData.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            let qty = val === "" ? 1 : parseInt(val) || 1;
                            // Enforce max quantity limit
                            if (maxQuantity && qty > maxQuantity) {
                              qty = maxQuantity;
                              toast.error(`Maximum return quantity is ${maxQuantity}`);
                            }
                            if (qty < 1) qty = 1;
                            setFormData({ 
                              ...formData, 
                              quantity: qty,
                              refund_amount: formData.unit_cost * qty,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Cost (৳)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.unit_cost}
                          onChange={(e) => {
                            const val = e.target.value;
                            const cost = val === "" ? 0 : parseFloat(val) || 0;
                            setFormData({ 
                              ...formData, 
                              unit_cost: cost,
                              refund_amount: cost * formData.quantity,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Refund Amount (৳)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.refund_amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ ...formData, refund_amount: val === "" ? 0 : parseFloat(val) || 0 });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {formData.product_name && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">
                        <span className="font-medium">{formData.product_name}</span>
                        <span className="text-muted-foreground"> × {formData.quantity} @ ৳{formData.unit_cost}</span>
                      </p>
                      <p className="text-lg font-bold mt-1">Total Refund: ৳{formData.refund_amount}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Return Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Return Date</Label>
                  <Input
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Return Reason *</Label>
                  <Select
                    value={formData.return_reason}
                    onValueChange={(val) => setFormData({ ...formData, return_reason: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_RETURN_REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the return..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Photo (optional)</Label>
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
                      onClick={() => setFormData({ ...formData, photo_url: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      className="hidden"
                      id="supplier-photo-upload"
                    />
                    <Label
                      htmlFor="supplier-photo-upload"
                      className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors inline-block"
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
                <Button onClick={handleSubmit}>Add Supplier Return</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Returns Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">Loading supplier returns...</div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No supplier returns found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Refund</TableHead>
                    <TableHead>Status</TableHead>
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
                        {ret.supplier_name || "-"}
                      </TableCell>
                      <TableCell>{ret.product_name}</TableCell>
                      <TableCell>{ret.quantity}</TableCell>
                      <TableCell>
                        <span className="text-sm">{ret.return_reason}</span>
                      </TableCell>
                      <TableCell>৳{ret.refund_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Select
                          value={ret.status}
                          onValueChange={(val) => handleUpdateStatus(ret.id, val)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {ret.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => openProcessDialog(ret)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Process
                            </Button>
                          )}
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
                            onClick={() => handleDelete(ret.id)}
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
            <DialogTitle>Supplier Return Details</DialogTitle>
            <DialogDescription>View detailed information about this supplier return</DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Supplier</Label>
                  <p className="font-medium">{selectedReturn.supplier_name || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-medium">{selectedReturn.product_name}</p>
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
                  <p className="font-medium">৳{selectedReturn.refund_amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedReturn.status)}</div>
                </div>
              </div>
              {selectedReturn.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1">{selectedReturn.notes}</p>
                </div>
              )}
              {selectedReturn.photo_url && (
                <div>
                  <Label className="text-muted-foreground">Photo</Label>
                  <img
                    src={selectedReturn.photo_url}
                    alt="Return photo"
                    className="mt-2 w-full max-h-64 object-contain rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsPhotoOpen(true)}
                    title="Click to enlarge"
                  />
                </div>
              )}

              {/* Photo Full View Dialog */}
              <Dialog open={isPhotoOpen} onOpenChange={setIsPhotoOpen}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-2">
                  <img
                    src={selectedReturn.photo_url}
                    alt="Return photo"
                    className="w-full h-full object-contain max-h-[85vh]"
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Selection Dialog */}
      <Dialog open={isPurchasesOpen} onOpenChange={setIsPurchasesOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Product from Purchases</DialogTitle>
          </DialogHeader>
          {selectedSupplierPurchases.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No purchases found</p>
          ) : (
            <div className="space-y-4">
              {selectedSupplierPurchases.map((purchase) => (
                <Card key={purchase.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="font-medium">{purchase.invoice_number || "No Invoice"}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(purchase.purchase_date), "dd/MM/yyyy")} • ৳{purchase.total_amount}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {purchase.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-2 hover:bg-muted/50 rounded cursor-pointer"
                          onClick={() => selectPurchaseItem(purchase, item)}
                        >
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × ৳{item.unit_price}
                            </p>
                          </div>
                          <Button size="sm">Select</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Return Dialog */}
      <Dialog open={isProcessOpen} onOpenChange={setIsProcessOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Process Supplier Return
            </DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedReturn.product_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedReturn.quantity} pcs × ৳{selectedReturn.unit_cost} = ৳{selectedReturn.refund_amount}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supplier: {selectedReturn.supplier_name || "N/A"}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="refund-received"
                  checked={processFormData.refund_received}
                  onChange={(e) => setProcessFormData({ ...processFormData, refund_received: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="refund-received" className="text-sm font-medium">
                  Refund received from supplier
                </label>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={processFormData.notes}
                  onChange={(e) => setProcessFormData({ ...processFormData, notes: e.target.value })}
                  placeholder="Add any notes about this return..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsProcessOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleProcessReturn}>
                  {processFormData.refund_received ? "Mark as Refunded" : "Mark as Processed"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
