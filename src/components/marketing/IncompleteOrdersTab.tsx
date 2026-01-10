import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ShoppingCart, 
  Search,
  Loader2,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  User,
  MapPin
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistanceToNow } from "date-fns";

interface IncompleteOrder {
  id: string;
  customer_name: string | null;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  cart_items: any;
  cart_total: number;
  step_reached: string | null;
  is_retargeted: boolean;
  retarget_count: number;
  last_retargeted_at: string | null;
  converted: boolean;
  created_at: string;
}

export function IncompleteOrdersTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currentShop } = useShop();
  const [orders, setOrders] = useState<IncompleteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [retargeting, setRetargeting] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "retargeted" | "converted">("all");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    retargeted: 0,
    converted: 0,
    potentialRevenue: 0,
    recoveredRevenue: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, [user, currentShop]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from("incomplete_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (currentShop) {
        query = query.eq("shop_id", currentShop.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setOrders(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const pending = data?.filter(o => !o.is_retargeted && !o.converted).length || 0;
      const retargeted = data?.filter(o => o.is_retargeted && !o.converted).length || 0;
      const converted = data?.filter(o => o.converted).length || 0;
      const potentialRevenue = data?.filter(o => !o.converted).reduce((sum, o) => sum + (o.cart_total || 0), 0) || 0;
      const recoveredRevenue = data?.filter(o => o.converted).reduce((sum, o) => sum + (o.cart_total || 0), 0) || 0;
      
      setStats({ total, pending, retargeted, converted, potentialRevenue, recoveredRevenue });
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetarget = async (order: IncompleteOrder) => {
    if (!order.phone_number) {
      toast.error(language === "bn" ? "ফোন নাম্বার নেই" : "No phone number");
      return;
    }

    setRetargeting(order.id);

    try {
      // Simulate sending WhatsApp message
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update order
      await supabase
        .from("incomplete_orders")
        .update({
          is_retargeted: true,
          retarget_count: (order.retarget_count || 0) + 1,
          last_retargeted_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      toast.success(
        language === "bn" 
          ? "রিটার্গেট মেসেজ পাঠানো হয়েছে!" 
          : "Retarget message sent!"
      );
      fetchOrders();
    } catch (error) {
      console.error("Error retargeting:", error);
      toast.error(language === "bn" ? "মেসেজ পাঠাতে ব্যর্থ" : "Failed to send message");
    } finally {
      setRetargeting(null);
    }
  };

  const handleMarkConverted = async (orderId: string) => {
    try {
      await supabase
        .from("incomplete_orders")
        .update({ converted: true })
        .eq("id", orderId);

      toast.success(language === "bn" ? "কনভার্টেড হিসেবে মার্ক করা হয়েছে" : "Marked as converted");
      fetchOrders();
    } catch (error) {
      console.error("Error marking converted:", error);
    }
  };

  const getStepBadge = (step: string | null) => {
    switch (step) {
      case "cart":
        return <Badge variant="outline"><ShoppingCart className="h-3 w-3 mr-1" /> Cart</Badge>;
      case "info":
        return <Badge variant="outline"><User className="h-3 w-3 mr-1" /> Info</Badge>;
      case "address":
        return <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" /> Address</Badge>;
      case "payment":
        return <Badge variant="outline" className="text-orange-500"><Clock className="h-3 w-3 mr-1" /> Payment</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone_number?.includes(searchQuery) ||
      order.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filter === "all" ||
      (filter === "pending" && !order.is_retargeted && !order.converted) ||
      (filter === "retargeted" && order.is_retargeted && !order.converted) ||
      (filter === "converted" && order.converted);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">
            {language === "bn" ? "মোট" : "Total"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
          <div className="text-sm text-muted-foreground">
            {language === "bn" ? "পেন্ডিং" : "Pending"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-500">{stats.retargeted}</div>
          <div className="text-sm text-muted-foreground">
            {language === "bn" ? "রিটার্গেটেড" : "Retargeted"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-500">{stats.converted}</div>
          <div className="text-sm text-muted-foreground">
            {language === "bn" ? "কনভার্টেড" : "Converted"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-500">৳{stats.potentialRevenue.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">
            {language === "bn" ? "হারানো সম্ভাবনা" : "Potential Loss"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-500">৳{stats.recoveredRevenue.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">
            {language === "bn" ? "উদ্ধারকৃত" : "Recovered"}
          </div>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
                {language === "bn" ? "অসম্পূর্ণ অর্ডার" : "Incomplete Orders"}
                <Badge variant="secondary">{filteredOrders.length}</Badge>
              </CardTitle>
              <CardDescription>
                {language === "bn" 
                  ? "যারা অর্ডার শুরু করে চলে গেছে তাদের রিটার্গেট করুন" 
                  : "Retarget customers who abandoned their orders"}
              </CardDescription>
            </div>
            <Button onClick={fetchOrders} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === "bn" ? "রিফ্রেশ" : "Refresh"}
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "bn" ? "নাম, ফোন বা ইমেইল খুঁজুন..." : "Search name, phone or email..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "pending", "retargeted", "converted"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? (language === "bn" ? "সব" : "All") :
                   f === "pending" ? (language === "bn" ? "পেন্ডিং" : "Pending") :
                   f === "retargeted" ? (language === "bn" ? "রিটার্গেটেড" : "Retargeted") :
                   (language === "bn" ? "কনভার্টেড" : "Converted")}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{language === "bn" ? "কোন অসম্পূর্ণ অর্ডার নেই" : "No incomplete orders"}</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 rounded-lg border ${
                      order.converted ? 'bg-green-500/5 border-green-500/30' :
                      order.is_retargeted ? 'bg-blue-500/5 border-blue-500/30' : ''
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStepBadge(order.step_reached)}
                          {order.converted ? (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Converted
                            </Badge>
                          ) : order.is_retargeted ? (
                            <Badge variant="secondary">
                              <MessageSquare className="h-3 w-3 mr-1" /> 
                              Retargeted ({order.retarget_count}x)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-500">
                              <Clock className="h-3 w-3 mr-1" /> Pending
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                          {order.customer_name && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate">{order.customer_name}</span>
                            </div>
                          )}
                          {order.phone_number && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono">{order.phone_number}</span>
                            </div>
                          )}
                          {order.address && (
                            <div className="flex items-center gap-1 col-span-2">
                              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{order.address}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">৳{order.cart_total?.toLocaleString() || 0}</span>
                          <span className="text-sm text-muted-foreground">
                            {Array.isArray(order.cart_items) ? order.cart_items.length : 0} {language === "bn" ? "আইটেম" : "items"}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {!order.converted && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetarget(order)}
                              disabled={retargeting === order.id || !order.phone_number}
                            >
                              {retargeting === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MessageSquare className="h-4 w-4 mr-1" />
                              )}
                              {language === "bn" ? "রিটার্গেট" : "Retarget"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-500"
                              onClick={() => handleMarkConverted(order.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              {language === "bn" ? "কনভার্টেড" : "Converted"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
