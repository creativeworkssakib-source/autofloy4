import { lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  Wallet,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  ArrowRight,
  Trash2,
  WifiOff,
  Plus,
  Clock,
  Target,
  CircleDollarSign,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { AnimatedStatCard } from "@/components/offline-shop/AnimatedStatCard";
import { PremiumTargetCard } from "@/components/offline-shop/PremiumTargetCard";
import { ProfitBreakdownCard } from "@/components/offline-shop/ProfitBreakdownCard";
import { PremiumQuickStats } from "@/components/offline-shop/PremiumQuickStats";
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
  monthly: {
    totalSales: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    salesTarget: number;
    targetProgress: number;
    inventoryValue: number;
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
  totalStockItems: number;
  totalStockValue: number;
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
  const { trash } = useOfflineTrash();
  const trashCount = trash?.length || 0;

  const isLoading = isTodayLoading;
  
  const loadDashboard = async () => {
    await loadTodayDashboard();
  };

  // Map hook data to expected format - API returns { period: {...}, monthly: {...}, lifetime: {...}, totalProducts, ... }
  const data: DashboardData | null = todayData ? {
    period: {
      totalSales: todayData?.period?.totalSales || 0,
      totalPurchases: todayData?.period?.totalPurchases || 0,
      grossProfit: todayData?.period?.grossProfit || 0,
      totalExpenses: todayData?.period?.totalExpenses || 0,
      netProfit: todayData?.period?.netProfit || 0,
      customersServed: todayData?.period?.customersServed || 0,
    },
    monthly: {
      totalSales: todayData?.monthly?.totalSales || 0,
      grossProfit: todayData?.monthly?.grossProfit || 0,
      totalExpenses: todayData?.monthly?.totalExpenses || 0,
      netProfit: todayData?.monthly?.netProfit || 0,
      salesTarget: todayData?.monthly?.salesTarget || 0,
      targetProgress: todayData?.monthly?.targetProgress || 0,
      inventoryValue: todayData?.monthly?.inventoryValue || 0,
    },
    lifetime: {
      totalSales: todayData?.lifetime?.totalSales || 0,
      totalProfit: todayData?.lifetime?.totalProfit || 0,
      totalProducts: todayData?.lifetime?.totalProducts || 0,
      totalSuppliers: todayData?.lifetime?.totalSuppliers || 0,
      totalDue: todayData?.lifetime?.totalDue || 0,
    },
    totalProducts: todayData?.totalProducts || 0,
    totalCustomers: todayData?.totalCustomers || 0,
    totalStockItems: todayData?.totalStockItems || 0,
    totalStockValue: todayData?.totalStockValue || 0,
    lowStockProducts: todayData?.lowStockProducts || [],
    recentSales: todayData?.recentSales || [],
    recentProducts: todayData?.recentProducts || [],
    returns: todayData?.returns || {
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

  // Get monthly profit and target for display
  const monthlyProfit = data?.monthly?.netProfit || 0;
  const salesTarget = data?.monthly?.salesTarget || 0;
  const targetProgress = data?.monthly?.targetProgress || 0;
  const monthSales = data?.monthly?.totalSales || 0;
  
  const statsCards = [
    {
      title: t("dashboard.todaySales"),
      value: periodSales,
      icon: ShoppingCart,
      color: "text-blue-500",
      bgColor: "bg-blue-500/15",
      gradientFrom: "from-blue-500/10",
      gradientTo: "to-cyan-500/5",
    },
    {
      title: t("dashboard.monthSales"),
      value: monthSales,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/15",
      gradientFrom: "from-emerald-500/10",
      gradientTo: "to-teal-500/5",
    },
    {
      title: t("dashboard.totalDue"),
      value: totalDue,
      icon: Wallet,
      color: "text-rose-500",
      bgColor: "bg-rose-500/15",
      gradientFrom: "from-rose-500/10",
      gradientTo: "to-orange-500/5",
      link: "/offline-shop/due-customers",
    },
    {
      title: t("dashboard.monthProfit"),
      value: monthlyProfit,
      icon: CircleDollarSign,
      color: monthlyProfit >= 0 ? "text-emerald-500" : "text-rose-500",
      bgColor: monthlyProfit >= 0 ? "bg-emerald-500/15" : "bg-rose-500/15",
      gradientFrom: monthlyProfit >= 0 ? "from-emerald-500/10" : "from-rose-500/10",
      gradientTo: monthlyProfit >= 0 ? "to-green-500/5" : "to-red-500/5",
      badge: monthlyProfit >= 0 ? (language === "bn" ? "লাভ" : "Profit") : (language === "bn" ? "লস" : "Loss"),
      badgeVariant: monthlyProfit >= 0 ? "default" : "destructive" as const,
    },
  ];

  // Check if target is achieved
  const isTargetAchieved = monthSales >= salesTarget && salesTarget > 0;

  return (
    <ShopLayout>
      <div className="space-y-6 relative">
        {/* Ambient background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            style={{ top: "-10%", right: "-10%" }}
          />
          <motion.div
            className="absolute w-72 h-72 rounded-full bg-secondary/5 blur-3xl"
            animate={{
              x: [0, -30, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            style={{ bottom: "20%", left: "-5%" }}
          />
        </div>

        {/* Premium Header */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <motion.h1 
                  className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {t("shop.dashboard")}
                </motion.h1>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                </motion.div>
              </div>
              <motion.p 
                className="text-sm sm:text-base text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {t("dashboard.overview")}
              </motion.p>
            </div>
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {!isOnline && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge variant="destructive" className="flex items-center gap-1 shadow-lg shadow-destructive/30">
                      <WifiOff className="h-3 w-3" />
                      {language === "bn" ? "অফলাইন" : "Offline"}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <motion.div 
            className="flex gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              variant="outline" 
              onClick={loadDashboard} 
              disabled={isLoading} 
              size="sm" 
              className="sm:size-default backdrop-blur-sm bg-card/50 hover:bg-card/80 border-border/50 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t("common.refresh")}
            </Button>
          </motion.div>
        </motion.div>

        {/* Premium Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsCards.map((stat, index) => {
            const isClickable = !!stat.link;
            const cardElement = (
              <AnimatedStatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                bgColor={stat.bgColor}
                gradientFrom={stat.gradientFrom}
                gradientTo={stat.gradientTo}
                delay={index * 0.1}
                isLoading={isLoading}
                formatValue={formatCurrency}
                badge={stat.badge}
                badgeVariant={stat.badgeVariant as "default" | "destructive" | "outline" | "secondary" | undefined}
                isClickable={isClickable}
              />
            );
            
            return isClickable ? (
              <Link key={stat.title} to={stat.link!}>{cardElement}</Link>
            ) : (
              <div key={stat.title}>{cardElement}</div>
            );
          })}
        </div>

        {/* Profit Breakdown Card */}
        <ProfitBreakdownCard
          grossProfit={data?.monthly?.grossProfit || 0}
          totalExpenses={data?.monthly?.totalExpenses || 0}
          netProfit={data?.monthly?.netProfit || 0}
          isLoading={isLoading}
          formatCurrency={formatCurrency}
          language={language}
        />

        {/* Premium Sales Target Card */}
        <PremiumTargetCard
          monthSales={monthSales}
          salesTarget={salesTarget}
          targetProgress={targetProgress}
          isTargetAchieved={isTargetAchieved}
          isLoading={isLoading}
          formatCurrency={formatCurrency}
          language={language}
        />

        {/* Premium Trash Bin Alert */}
        <AnimatePresence>
          {trashCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Link to="/offline-shop/trash">
                <Card className="border-0 bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-amber-500/10 hover:from-orange-500/15 hover:to-amber-500/15 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl backdrop-blur-xl overflow-hidden">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                      className="absolute w-20 sm:w-32 h-20 sm:h-32 rounded-full bg-orange-500/20 blur-2xl"
                      animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      style={{ top: "-30%", right: "10%" }}
                    />
                  </div>
                  <CardContent className="py-3 sm:py-4 px-3 sm:px-6 relative">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <motion.div 
                          className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-orange-500/20 backdrop-blur-sm shrink-0"
                          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Trash2 className="h-4 w-4 sm:h-6 sm:w-6 text-orange-500" />
                        </motion.div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-base font-semibold text-orange-600 dark:text-orange-400 truncate">
                            {language === "bn" ? "ট্র্যাশ বিনে আইটেম আছে" : "Items in Trash Bin"}
                          </p>
                          <p className="text-[10px] sm:text-sm text-muted-foreground truncate">
                            {language === "bn" 
                              ? `${trashCount}টি আইটেম ডিলিটের অপেক্ষায়`
                              : `${trashCount} item(s) waiting`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 hover:bg-orange-500/30 shadow-sm text-xs sm:text-sm">
                          {trashCount}
                        </Badge>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Quick Stats */}
        <PremiumQuickStats
          totalProducts={data?.totalProducts || 0}
          totalStockItems={data?.totalStockItems || 0}
          totalStockValue={data?.totalStockValue || 0}
          isLoading={isLoading}
          formatCurrency={formatCurrency}
          language={language}
        />

        {/* Returns Summary Section */}
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
                <CardTitle className="text-sm sm:text-lg truncate">{t("dashboard.returnsSummary")}</CardTitle>
              </div>
              <Link to="/offline-shop/returns" className="shrink-0">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden sm:inline">{t("dashboard.viewAll")}</span>
                  <ArrowRight className="sm:ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </div>
            <CardDescription className="text-xs sm:text-sm">{t("dashboard.returnsOverview")}</CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 sm:h-20" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                  <div className="p-2.5 sm:p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-[10px] sm:text-sm text-muted-foreground">{t("dashboard.totalReturns")}</p>
                    <p className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {data?.returns?.totalCount || 0}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-[10px] sm:text-sm text-muted-foreground">{t("dashboard.totalRefunds")}</p>
                    <p className="text-sm sm:text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(data?.returns?.totalRefundAmount || 0)}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-[10px] sm:text-sm text-muted-foreground">{t("dashboard.processed")}</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      {data?.returns?.processedCount || 0}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-[10px] sm:text-sm text-muted-foreground">{t("dashboard.pending")}</p>
                    <p className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {data?.returns?.pendingCount || 0}
                    </p>
                  </div>
                </div>

                {/* Top Return Reasons */}
                {data?.returns?.topReasons && data.returns.topReasons.length > 0 && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">{t("dashboard.topReturnReasons")}</h4>
                    <div className="space-y-2 sm:space-y-3">
                      {data.returns.topReasons.map((item, index) => {
                        const maxCount = data.returns?.topReasons?.[0]?.count || 1;
                        const percentage = (item.count / maxCount) * 100;
                        return (
                          <div key={item.reason} className="space-y-1">
                            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                              <span className="flex items-center gap-1 sm:gap-2 min-w-0 truncate">
                                <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
                                  #{index + 1}
                                </Badge>
                                <span className="truncate">{item.reason}</span>
                              </span>
                              <span className="text-muted-foreground shrink-0 text-[10px] sm:text-sm">
                                {item.count} • {formatCurrency(item.amount)}
                              </span>
                            </div>
                            <Progress value={percentage} className="h-1.5 sm:h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(!data?.returns?.topReasons || data.returns.topReasons.length === 0) && (
                  <div className="text-center py-3 sm:py-4 text-muted-foreground">
                    <RotateCcw className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">{t("dashboard.noReturns")}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Low Stock Alert */}
          <Card>
            <CardHeader className="px-3 sm:px-6 pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 shrink-0" />
                <span className="truncate">{t("dashboard.lowStockAlert")}</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t("dashboard.lowStockAlert")}</CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {isLoading ? (
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 sm:h-12 w-full" />
                  ))}
                </div>
              ) : data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {data.lowStockProducts.slice(0, 5).map((product) => (
                    <Link
                      key={product.id}
                      to="/offline-shop/products"
                      className="flex items-center justify-between gap-2 p-2 sm:p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/10 transition-colors group"
                    >
                      <span className="text-xs sm:text-sm font-medium group-hover:text-primary transition-colors truncate">{product.name}</span>
                      <Badge variant="destructive" className="text-[10px] sm:text-xs shrink-0">
                        {product.stock_quantity} {t("dashboard.remaining")}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6 sm:py-8 text-xs sm:text-sm">
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
