import { useState, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  ShoppingCart, 
  Wallet,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  ArrowRight,
  Plus,
  Clock,
  Trash2,
  WifiOff,
  Cloud
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { useOfflineDashboard, useOfflineTrash } from "@/hooks/useOfflineShopData";
import { useOfflineSettings } from "@/hooks/useOfflineData";
import { useIsOnline } from "@/hooks/useOnlineStatus";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShop } from "@/contexts/ShopContext";

// Lazy load heavy analytics components to improve initial load
const ProductPerformanceSection = lazy(() => import("@/components/analytics/ProductPerformanceSection").then(m => ({ default: m.ProductPerformanceSection })));
const BusinessGrowthInsight = lazy(() => import("@/components/offline-shop/BusinessGrowthInsight").then(m => ({ default: m.BusinessGrowthInsight })));

interface DashboardData {
  period: {
    totalSales: number;
    totalPurchases: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    customersServed: number;
  };
  lifetime: {
    totalSales: number;
    totalProfit: number;
    totalProducts: number;
    totalSuppliers: number;
    totalDue: number;
  };
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: Array<{ id: string; name: string; stock_quantity: number; min_stock_alert: number }>;
  recentSales: Array<{
    id: string;
    invoice_number: string;
    total: number;
    sale_date: string;
    payment_status: string;
    customer: { name: string } | null;
  }>;
  recentProducts: Array<{
    id: string;
    name: string;
    selling_price: number;
    stock_quantity: number;
    created_at: string;
  }>;
  returns: {
    totalCount: number;
    totalRefundAmount: number;
    processedCount: number;
    pendingCount: number;
    topReasons: Array<{ reason: string; count: number; amount: number }>;
  };
}

const ShopDashboard = () => {
  const { t, language } = useLanguage();
  const { currentShop } = useShop();
  const { settings } = useOfflineSettings();
  const isOnline = useIsOnline();
  
  // Use offline-first dashboard hooks - only 'today' for main dashboard data
  const { data: todayData, loading: isTodayLoading, refetch: loadTodayDashboard } = useOfflineDashboard('today');
  
  // Use trash hook but defer loading
  const { trash, refetch: refetchTrash } = useOfflineTrash();
  const trashCount = trash?.length || 0;

  const isLoading = isTodayLoading;
  
  const loadDashboard = async () => {
    await loadTodayDashboard();
  };

  // Map hook data to expected format - use only today's data (simpler, faster)
  const data: DashboardData | null = todayData ? {
    period: {
      totalSales: todayData?.totalSales || 0,
      totalPurchases: todayData?.totalPurchases || 0,
      grossProfit: todayData?.profit || 0,
      totalExpenses: todayData?.totalExpenses || 0,
      netProfit: todayData?.profit || 0,
      customersServed: todayData?.salesCount || 0,
    },
    lifetime: {
      totalSales: todayData?.totalSales || 0,
      totalProfit: todayData?.profit || 0,
      totalProducts: todayData?.productsCount || 0,
      totalSuppliers: 0,
      totalDue: todayData?.totalDue || 0,
    },
    totalProducts: todayData?.productsCount || 0,
    totalCustomers: todayData?.customersCount || 0,
    lowStockProducts: todayData?.lowStockItems || [],
    recentSales: todayData?.recentSales || [],
    recentProducts: todayData?.recentProducts || [],
    returns: todayData?.returnsSummary || {
      totalCount: 0,
      totalRefundAmount: 0,
      processedCount: 0,
      pendingCount: 0,
      topReasons: [],
    },
  } : null;

  const currency = settings?.currency || "BDT";
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const periodSales = data?.period?.totalSales || 0;
  const periodExpenses = data?.period?.totalExpenses || 0;
  const periodProfit = data?.period?.netProfit || 0;

  const totalDue = data?.lifetime?.totalDue || 0;

  const statsCards = [
    {
      title: t("dashboard.todaySales"),
      value: periodSales,
      icon: ShoppingCart,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: t("dashboard.monthSales"),
      value: data?.lifetime?.totalSales || 0,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: t("dashboard.totalDue"),
      value: totalDue,
      icon: Wallet,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: t("dashboard.monthProfit"),
      value: periodProfit,
      icon: periodProfit >= 0 ? TrendingUp : TrendingDown,
      color: periodProfit >= 0 ? "text-emerald-500" : "text-red-500",
      bgColor: periodProfit >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    },
  ];

  return (
    <ShopLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{t("shop.dashboard")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{t("dashboard.overview")}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isOnline && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  {language === "bn" ? "অফলাইন" : "Offline"}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDashboard} disabled={isLoading} size="sm" className="sm:size-default">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t("common.refresh")}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsCards.map((stat, index) => {
            const isClickable = stat.title === t("dashboard.totalDue");
            const cardContent = (
              <Card className={isClickable ? "cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50" : ""}>
                <CardContent className="p-3 sm:pt-6 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
                      {isLoading ? (
                        <Skeleton className="h-6 sm:h-8 w-16 sm:w-24 mt-1" />
                      ) : (
                        <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(stat.value)}</p>
                      )}
                    </div>
                    <div className={`p-2 sm:p-3 rounded-full ${stat.bgColor} shrink-0`}>
                      <stat.icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {isClickable ? (
                  <Link to="/offline-shop/due-customers">{cardContent}</Link>
                ) : (
                  cardContent
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Trash Bin Alert */}
        {trashCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link to="/offline-shop/trash">
              <Card className="border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-orange-500/20">
                        <Trash2 className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium text-orange-600 dark:text-orange-400">
                          {language === "bn" ? "ট্র্যাশ বিনে আইটেম আছে" : "Items in Trash Bin"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === "bn" 
                            ? `${trashCount}টি আইটেম স্থায়ীভাবে ডিলিট করার জন্য অপেক্ষা করছে`
                            : `${trashCount} item(s) waiting to be permanently deleted`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-orange-500/50 text-orange-600">
                        {trashCount}
                      </Badge>
                      <ArrowRight className="h-5 w-5 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-purple-500/10">
                    <Package className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("dashboard.totalProducts")}</p>
                    {isLoading ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <p className="text-xl font-bold">{data?.totalProducts || 0}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-cyan-500/10">
                    <Users className="h-6 w-6 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("dashboard.totalCustomers")}</p>
                    {isLoading ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <p className="text-xl font-bold">{data?.totalCustomers || 0}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Returns Summary Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-amber-500" />
                <CardTitle>{t("dashboard.returnsSummary")}</CardTitle>
              </div>
              <Link to="/offline-shop/returns">
                <Button variant="ghost" size="sm">
                  {t("dashboard.viewAll")} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <CardDescription>{t("dashboard.returnsOverview")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-muted-foreground">{t("dashboard.totalReturns")}</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {data?.returns?.totalCount || 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-muted-foreground">{t("dashboard.totalRefunds")}</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(data?.returns?.totalRefundAmount || 0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-muted-foreground">{t("dashboard.processed")}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {data?.returns?.processedCount || 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-sm text-muted-foreground">{t("dashboard.pending")}</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {data?.returns?.pendingCount || 0}
                    </p>
                  </div>
                </div>

                {/* Top Return Reasons */}
                {data?.returns?.topReasons && data.returns.topReasons.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">{t("dashboard.topReturnReasons")}</h4>
                    <div className="space-y-3">
                      {data.returns.topReasons.map((item, index) => {
                        const maxCount = data.returns?.topReasons?.[0]?.count || 1;
                        const percentage = (item.count / maxCount) * 100;
                        return (
                          <div key={item.reason} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  #{index + 1}
                                </Badge>
                                {item.reason}
                              </span>
                              <span className="text-muted-foreground">
                                {item.count} {t("dashboard.returns")} • {formatCurrency(item.amount)}
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(!data?.returns?.topReasons || data.returns.topReasons.length === 0) && (
                  <div className="text-center py-4 text-muted-foreground">
                    <RotateCcw className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>{t("dashboard.noReturns")}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                {t("dashboard.lowStockAlert")}
              </CardTitle>
              <CardDescription>{t("dashboard.lowStockAlert")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {data.lowStockProducts.slice(0, 5).map((product) => (
                    <Link
                      key={product.id}
                      to="/offline-shop/products"
                      className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/10 transition-colors group"
                    >
                      <span className="font-medium group-hover:text-primary transition-colors">{product.name}</span>
                      <Badge variant="destructive">
                        {product.stock_quantity} {t("dashboard.remaining")}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {t("dashboard.noLowStock")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                {t("dashboard.recentSales")}
              </CardTitle>
              <CardDescription>{t("dashboard.recentSales")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : data?.recentSales && data.recentSales.length > 0 ? (
                <div className="space-y-3">
                  {data.recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{sale.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.customer?.name || t("shop.walkInCustomer")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(Number(sale.total))}</p>
                        <Badge variant={sale.payment_status === "paid" ? "default" : "secondary"}>
                          {sale.payment_status === "paid" ? t("common.paid") : t("common.due")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {t("dashboard.noSales")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recently Added Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-500" />
                  <CardTitle>{t("dashboard.recentProducts")}</CardTitle>
                </div>
                <Link to="/offline-shop/products">
                  <Button variant="ghost" size="sm">
                    {t("dashboard.viewAll")} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>{t("dashboard.recentProductsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : data?.recentProducts && data.recentProducts.length > 0 ? (
                <div className="space-y-3">
                  {data.recentProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(product.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(Number(product.selling_price))}</p>
                        <Badge variant="outline">
                          {product.stock_quantity} {t("shop.stock")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {t("dashboard.noProducts")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Business Growth Insight - Lazy loaded */}
        <Suspense fallback={<Card className="h-48 animate-pulse bg-muted/30" />}>
          <BusinessGrowthInsight />
        </Suspense>

        {/* Product Performance Analytics - Lazy loaded */}
        <Suspense fallback={<Card className="h-64 animate-pulse bg-muted/30" />}>
          <ProductPerformanceSection type="offline" shopId={currentShop?.id} />
        </Suspense>
      </div>
    </ShopLayout>
  );
};

export default ShopDashboard;
