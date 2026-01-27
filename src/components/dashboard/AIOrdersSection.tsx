import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Phone,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Search,
  Filter,
  Eye,
  MoreVertical,
  RefreshCw,
  ArrowUpRight,
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface AIOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  products: any;
  total: number;
  subtotal: number;
  delivery_charge: number | null;
  advance_amount: number | null;
  order_status: string | null;
  payment_method: string | null;
  fake_order_score: number | null;
  invoice_number: string | null;
  notes: string | null;
  page_id: string;
  created_at: string;
  updated_at: string;
}

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", icon: Clock },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: CheckCircle2 },
  { value: "processing", label: "Processing", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", icon: Package },
  { value: "shipped", label: "Shipped", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", icon: Truck },
  { value: "delivered", label: "Delivered", color: "bg-green-500/10 text-green-600 dark:text-green-400", icon: CheckCircle2 },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: XCircle },
];

const ITEMS_PER_PAGE = 5;

const AIOrdersSection = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<AIOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<AIOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<AIOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });

  const fetchOrders = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      
      // Calculate stats
      const newStats = {
        total: data?.length || 0,
        pending: data?.filter(o => o.order_status === "pending").length || 0,
        confirmed: data?.filter(o => o.order_status === "confirmed").length || 0,
        shipped: data?.filter(o => o.order_status === "shipped").length || 0,
        delivered: data?.filter(o => o.order_status === "delivered").length || 0,
        cancelled: data?.filter(o => o.order_status === "cancelled").length || 0,
      };
      setStats(newStats);
    } catch (error) {
      console.error("Failed to fetch AI orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  // Filter orders
  useEffect(() => {
    let result = [...orders];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (order) =>
          order.customer_name?.toLowerCase().includes(query) ||
          order.customer_phone?.includes(query) ||
          order.invoice_number?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((order) => order.order_status === statusFilter);
    }

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [orders, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const { error } = await supabase
        .from("ai_orders")
        .update({ order_status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusConfig = (status: string | null) => {
    return ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProductsDisplay = (products: any) => {
    if (Array.isArray(products)) {
      return products.map((p: any) => p.name || p.product_name || "Product").join(", ");
    }
    if (typeof products === "object" && products !== null) {
      return products.name || products.product_name || "Product";
    }
    return "Product";
  };

  const getFakeOrderBadge = (score: number | null) => {
    if (score === null || score === undefined) return null;
    if (score >= 70) {
      return (
        <Badge variant="destructive" className="text-xs flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          High Risk ({score}%)
        </Badge>
      );
    }
    if (score >= 40) {
      return (
        <Badge variant="outline" className="text-xs flex items-center gap-1 border-yellow-500 text-yellow-600">
          <AlertTriangle className="w-3 h-3" />
          Medium Risk ({score}%)
        </Badge>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <CardTitle>AI Orders</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {stats.total} total
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: "Pending", value: stats.pending, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
              { label: "Confirmed", value: stats.confirmed, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
              { label: "Processing", value: orders.filter(o => o.order_status === "processing").length, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
              { label: "Shipped", value: stats.shipped, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
              { label: "Delivered", value: stats.delivered, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
              { label: "Cancelled", value: stats.cancelled, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
            ].map((stat) => (
              <div key={stat.label} className={`p-3 rounded-lg ${stat.bg} text-center`}>
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : paginatedOrders.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {paginatedOrders.map((order, index) => {
                  const statusConfig = getStatusConfig(order.order_status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{order.customer_name}</span>
                            <Badge className={statusConfig.color} variant="secondary">
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            {getFakeOrderBadge(order.fake_order_score)}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {order.customer_phone}
                            </span>
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {order.customer_address}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{getProductsDisplay(order.products)}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              {formatCurrency(order.total)}
                            </div>
                            {order.payment_method && (
                              <div className="text-xs text-muted-foreground capitalize">
                                {order.payment_method}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={updatingStatus === order.id}
                                >
                                  {updatingStatus === order.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="w-4 h-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {ORDER_STATUSES.map((status) => (
                                  <DropdownMenuItem
                                    key={status.value}
                                    onClick={() => updateOrderStatus(order.id, status.value)}
                                    disabled={order.order_status === status.value}
                                  >
                                    <status.icon className="w-4 h-4 mr-2" />
                                    Mark as {status.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No orders yet</p>
              <p className="text-sm">Orders from AI conversations will appear here</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of{" "}
                {filteredOrders.length} orders
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Order Details
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Header */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice</p>
                  <p className="font-mono text-lg font-bold">
                    {selectedOrder.invoice_number || `#${selectedOrder.id.slice(0, 8)}`}
                  </p>
                </div>
                <Badge className={getStatusConfig(selectedOrder.order_status).color}>
                  {getStatusConfig(selectedOrder.order_status).label}
                </Badge>
              </div>

              {getFakeOrderBadge(selectedOrder.fake_order_score) && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">
                      Fake Order Risk: {selectedOrder.fake_order_score}%
                    </span>
                  </div>
                  <p className="text-xs text-red-500 mt-1">
                    This order may be fake based on conversation analysis
                  </p>
                </div>
              )}

              <Separator />

              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Information
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{selectedOrder.customer_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium text-right max-w-[60%]">
                      {selectedOrder.customer_address}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Products */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Products
                </h4>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">{getProductsDisplay(selectedOrder.products)}</p>
                </div>
              </div>

              <Separator />

              {/* Payment Info */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.delivery_charge !== null && selectedOrder.delivery_charge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>{formatCurrency(selectedOrder.delivery_charge)}</span>
                  </div>
                )}
                {selectedOrder.advance_amount !== null && selectedOrder.advance_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Advance Paid</span>
                    <span className="text-green-600">-{formatCurrency(selectedOrder.advance_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(selectedOrder.total)}</span>
                </div>
                {selectedOrder.payment_method && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Method</span>
                    <Badge variant="outline" className="capitalize">
                      {selectedOrder.payment_method}
                    </Badge>
                  </div>
                )}
              </div>

              {selectedOrder.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Notes</h4>
                    <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                      {selectedOrder.notes}
                    </p>
                  </div>
                </>
              )}

              {/* Quick Status Change */}
              <div className="pt-4 space-y-2">
                <h4 className="font-medium text-sm">Change Status</h4>
                <div className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map((status) => (
                    <Button
                      key={status.value}
                      variant={selectedOrder.order_status === status.value ? "default" : "outline"}
                      size="sm"
                      disabled={selectedOrder.order_status === status.value || updatingStatus === selectedOrder.id}
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, status.value);
                        setSelectedOrder({ ...selectedOrder, order_status: status.value });
                      }}
                    >
                      <status.icon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AIOrdersSection;
