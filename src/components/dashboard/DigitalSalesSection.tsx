import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCode,
  Phone,
  Mail,
  Clock,
  ChevronLeft,
  ChevronRight,
  Package,
  CheckCircle2,
  XCircle,
  User,
  Search,
  Eye,
  MoreVertical,
  RefreshCw,
  Key,
  Globe,
  BookOpen,
  Download,
  DollarSign,
  Send,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { digitalProductService, DigitalProductSale } from "@/services/digitalProductService";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const DELIVERY_STATUSES = [
  { value: "pending", label: "Pending", labelBn: "পেন্ডিং", color: "bg-yellow-500/10 text-yellow-600", icon: Clock },
  { value: "delivered", label: "Delivered", labelBn: "ডেলিভারড", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  { value: "failed", label: "Failed", labelBn: "ব্যর্থ", color: "bg-red-500/10 text-red-600", icon: XCircle },
];

const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending", labelBn: "পেন্ডিং", color: "bg-yellow-500/10 text-yellow-600" },
  { value: "paid", label: "Paid", labelBn: "পেইড", color: "bg-green-500/10 text-green-600" },
  { value: "refunded", label: "Refunded", labelBn: "রিফান্ড", color: "bg-red-500/10 text-red-600" },
];

const productTypeIcons: Record<string, typeof FileCode> = {
  subscription: Key,
  api: Globe,
  course: BookOpen,
  software: Download,
  other: FileCode,
};

const ITEMS_PER_PAGE = 10;

export const DigitalSalesSection = () => {
  const { language } = useLanguage();
  const [sales, setSales] = useState<DigitalProductSale[]>([]);
  const [filteredSales, setFilteredSales] = useState<DigitalProductSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<DigitalProductSale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    revenue: 0,
  });

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await digitalProductService.getSales();
      setSales(data);
      setFilteredSales(data);

      // Calculate stats
      setStats({
        total: data.length,
        pending: data.filter(s => s.delivery_status === "pending").length,
        delivered: data.filter(s => s.delivery_status === "delivered").length,
        revenue: data.filter(s => s.payment_status === "paid").reduce((sum, s) => sum + s.sale_price, 0),
      });
    } catch (error) {
      console.error("Error loading digital sales:", error);
      toast.error(language === "bn" ? "ডাটা লোড করতে ব্যর্থ" : "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    let result = [...sales];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        s =>
          s.customer_name?.toLowerCase().includes(query) ||
          s.customer_phone?.toLowerCase().includes(query) ||
          s.product?.name?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(s => s.delivery_status === statusFilter);
    }

    setFilteredSales(result);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sales]);

  const handleUpdateStatus = async (saleId: string, field: "payment_status" | "delivery_status", value: string) => {
    try {
      const updateData: any = { [field]: value };
      if (field === "delivery_status" && value === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }
      
      await digitalProductService.updateSale(saleId, updateData);
      toast.success(language === "bn" ? "স্ট্যাটাস আপডেট হয়েছে" : "Status updated");
      loadSales();
    } catch (error) {
      toast.error(language === "bn" ? "আপডেট ব্যর্থ" : "Failed to update");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusInfo = (status: string, type: "delivery" | "payment") => {
    const list = type === "delivery" ? DELIVERY_STATUSES : PAYMENT_STATUSES;
    return list.find(s => s.value === status) || list[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileCode className="w-6 h-6 text-purple-500" />
            {language === "bn" ? "ডিজিটাল সেলস" : "Digital Sales"}
          </h2>
          <p className="text-muted-foreground">
            {language === "bn" ? "AI থেকে আসা ডিজিটাল প্রোডাক্ট অর্ডার" : "Digital product orders from AI"}
          </p>
        </div>
        <Button onClick={loadSales} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {language === "bn" ? "রিফ্রেশ" : "Refresh"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">
              {language === "bn" ? "মোট সেলস" : "Total Sales"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">
              {language === "bn" ? "পেন্ডিং" : "Pending"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-sm text-muted-foreground">
              {language === "bn" ? "ডেলিভারড" : "Delivered"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.revenue)}</div>
            <div className="text-sm text-muted-foreground">
              {language === "bn" ? "মোট আয়" : "Revenue"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={language === "bn" ? "কাস্টমার বা প্রোডাক্ট খুঁজুন..." : "Search customer or product..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "bn" ? "সব" : "All"}</SelectItem>
            {DELIVERY_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {language === "bn" ? status.labelBn : status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sales List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSales.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCode className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {language === "bn" ? "কোনো ডিজিটাল সেল নেই" : "No digital sales yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {paginatedSales.map((sale, index) => {
              const product = sale.product;
              const TypeIcon = productTypeIcons[product?.product_type || "other"] || FileCode;
              const deliveryStatus = getStatusInfo(sale.delivery_status, "delivery");
              const paymentStatus = getStatusInfo(sale.payment_status, "payment");

              return (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-card transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <TypeIcon className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-semibold">{product?.name || "Unknown Product"}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <User className="w-3 h-3" />
                              {sale.customer_name || "No name"}
                              {sale.customer_phone && (
                                <>
                                  <span className="text-muted-foreground/50">•</span>
                                  <Phone className="w-3 h-3" />
                                  {sale.customer_phone}
                                </>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(sale.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={deliveryStatus.color}>
                            {language === "bn" ? (deliveryStatus as any).labelBn : deliveryStatus.label}
                          </Badge>
                          <Badge className={paymentStatus.color}>
                            {language === "bn" ? (paymentStatus as any).labelBn : paymentStatus.label}
                          </Badge>
                          <div className="text-lg font-bold text-purple-600">
                            {formatCurrency(sale.sale_price)}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedSale(sale);
                                setIsDetailOpen(true);
                              }}>
                                <Eye className="w-4 h-4 mr-2" />
                                {language === "bn" ? "বিস্তারিত" : "View Details"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(sale.id, "delivery_status", "delivered")}
                                disabled={sale.delivery_status === "delivered"}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                {language === "bn" ? "ডেলিভার করুন" : "Mark Delivered"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(sale.id, "payment_status", "paid")}
                                disabled={sale.payment_status === "paid"}
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                {language === "bn" ? "পেইড করুন" : "Mark Paid"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "bn" ? "সেল বিস্তারিত" : "Sale Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {language === "bn" ? "প্রোডাক্ট" : "Product"}
                </div>
                <div className="font-medium">{selectedSale.product?.name}</div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    {language === "bn" ? "কাস্টমার" : "Customer"}
                  </div>
                  <div className="font-medium">{selectedSale.customer_name || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    {language === "bn" ? "ফোন" : "Phone"}
                  </div>
                  <div className="font-medium">{selectedSale.customer_phone || "-"}</div>
                </div>
              </div>

              <Separator />

              {/* Show credentials if delivered */}
              {selectedSale.delivery_status === "delivered" && selectedSale.product && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-sm font-medium text-green-600 mb-2">
                    {language === "bn" ? "ডেলিভারি তথ্য" : "Delivery Info"}
                  </div>
                  {selectedSale.product.credential_username && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Username:</span>
                      <div className="flex items-center gap-1">
                        <code>{selectedSale.product.credential_username}</code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedSale.product!.credential_username!, "Username")}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedSale.product.credential_password && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span>Password:</span>
                      <div className="flex items-center gap-1">
                        <code>{selectedSale.product.credential_password}</code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedSale.product!.credential_password!, "Password")}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedSale.product.access_url && (
                    <div className="text-sm mt-1">
                      <span>Access URL: </span>
                      <a href={selectedSale.product.access_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {selectedSale.product.access_url}
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(selectedSale.sale_price)}
                </div>
                <div className="flex gap-2">
                  <Select 
                    value={selectedSale.payment_status} 
                    onValueChange={(v) => handleUpdateStatus(selectedSale.id, "payment_status", v)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          {language === "bn" ? s.labelBn : s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={selectedSale.delivery_status} 
                    onValueChange={(v) => handleUpdateStatus(selectedSale.id, "delivery_status", v)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERY_STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          {language === "bn" ? s.labelBn : s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
