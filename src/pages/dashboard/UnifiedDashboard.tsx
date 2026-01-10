import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Zap,
  Bot,
  Clock,
  TrendingUp,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Facebook,
  ShoppingCart,
  Package,
  Wallet,
  AlertTriangle,
  Users,
  Crown,
  Gem,
  Sparkles,
  Star,
  Link2,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { TrialExpiryBanner } from "@/components/dashboard/TrialExpiryBanner";
import { SyncStatusBadge } from "@/components/dashboard/SyncStatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSyncSettings } from "@/hooks/useSyncSettings";
import { fetchDashboardStats, fetchConnectedAccounts, fetchExecutionLogs, DashboardStats, ConnectedAccount, ExecutionLog } from "@/services/apiService";
import { ProductPerformanceSection } from "@/components/analytics/ProductPerformanceSection";
import { offlineShopService } from "@/services/offlineShopService";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

const getPlanBadge = (plan: string) => {
  switch (plan) {
    case "lifetime":
      return { icon: Crown, label: "Lifetime", className: "bg-gradient-to-r from-amber-500 to-yellow-400 text-white" };
    case "business":
      return { icon: Crown, label: "Business", className: "bg-gradient-to-r from-purple-600 to-pink-500 text-white" };
    case "professional":
      return { icon: Gem, label: "Professional", className: "bg-gradient-to-r from-primary to-secondary text-white" };
    case "starter":
      return { icon: Sparkles, label: "Starter", className: "bg-primary/10 text-primary border border-primary/20" };
    case "trial":
      return { icon: Star, label: "Trial", className: "bg-success/10 text-success border border-success/20" };
    default:
      return null;
  }
};

const UnifiedDashboard = () => {
  // Component initialized
  const { user } = useAuth();
  const { syncEnabled, isLoading: syncLoading } = useSyncSettings();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  // Online data
  const [onlineStats, setOnlineStats] = useState<DashboardStats | null>(null);
  const [connectedPages, setConnectedPages] = useState<ConnectedAccount[]>([]);
  const [recentLogs, setRecentLogs] = useState<ExecutionLog[]>([]);
  
  // Offline data (always loaded to show in both modes)
  const [offlineData, setOfflineData] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<"online" | "offline">("online");

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        // Load all data in parallel - online and offline
        const [statsData, pagesData, logsData, shopData] = await Promise.all([
          fetchDashboardStats(),
          fetchConnectedAccounts("facebook"),
          fetchExecutionLogs(5),
          offlineShopService.getDashboard("today").catch(() => null),
        ]);
        
        setOnlineStats(statsData);
        setConnectedPages(pagesData.filter(p => p.is_connected));
        setRecentLogs(logsData);
        setOfflineData(shopData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!syncLoading) {
      loadAllData();
    }
  }, [syncLoading]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Online-only KPIs (when sync is disabled)
  const onlineOnlyKPIs = [
    {
      title: t("dashboard.messagesHandled"),
      value: onlineStats?.messagesHandled?.toString() || "0",
      subtitle: t("dashboard.total"),
      icon: MessageSquare,
      color: "from-primary to-primary-glow",
    },
    {
      title: t("dashboard.autoReplies"),
      value: onlineStats?.autoRepliesSent?.toString() || "0",
      subtitle: t("common.today"),
      icon: Bot,
      color: "from-blue-500 to-blue-400",
    },
    {
      title: t("dashboard.onlineOrders"),
      value: onlineStats?.todayOrders?.toString() || "0",
      subtitle: t("common.today"),
      icon: ShoppingCart,
      color: "from-emerald-500 to-emerald-400",
    },
    {
      title: t("dashboard.activeAutomations"),
      value: onlineStats?.activeAutomations?.toString() || "0",
      subtitle: t("dashboard.running"),
      icon: Zap,
      color: "from-orange-500 to-orange-400",
    },
  ];

  // Combined KPIs (when sync is enabled)
  const combinedKPIs = [
    {
      title: t("dashboard.totalSalesToday"),
      value: formatCurrency((onlineStats?.todayOrders || 0) * 100 + (offlineData?.period?.totalSales || 0)),
      subtitle: t("dashboard.onlineOffline"),
      icon: TrendingUp,
      color: "from-primary to-primary-glow",
    },
    {
      title: t("dashboard.onlineOrders"),
      value: onlineStats?.todayOrders?.toString() || "0",
      subtitle: t("common.today"),
      icon: ShoppingCart,
      color: "from-blue-500 to-blue-400",
    },
    {
      title: t("dashboard.offlineSales"),
      value: offlineData?.period?.customersServed?.toString() || "0",
      subtitle: t("dashboard.transactionsToday"),
      icon: Wallet,
      color: "from-emerald-500 to-emerald-400",
    },
    {
      title: t("dashboard.stockValue"),
      value: formatCurrency(offlineData?.lifetime?.totalProducts * 500 || 0),
      subtitle: `${offlineData?.totalProducts || 0} ${t("dashboard.products")}`,
      icon: Package,
      color: "from-purple-500 to-purple-400",
    },
    {
      title: t("dashboard.activeAutomations"),
      value: onlineStats?.activeAutomations?.toString() || "0",
      subtitle: t("dashboard.running"),
      icon: Bot,
      color: "from-orange-500 to-orange-400",
    },
  ];

  // Choose KPIs based on sync status
  const displayKPIs = syncEnabled ? combinedKPIs : onlineOnlyKPIs;

  const OnlineSummary = () => (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            {t("dashboard.onlineBusiness")}
          </CardTitle>
          {syncEnabled && <SyncStatusBadge syncEnabled={syncEnabled} mode="online" />}
        </div>
        <CardDescription>{t("dashboard.automationsAnalytics")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats - Same layout as offline */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-primary/5">
            <p className="text-xs text-muted-foreground">{t("dashboard.todayOrders")}</p>
            {isLoading ? <Skeleton className="h-6 w-16" /> : (
              <p className="text-lg font-bold text-primary">{onlineStats?.todayOrders || 0}</p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-primary/5">
            <p className="text-xs text-muted-foreground">{t("dashboard.messagesHandled")}</p>
            {isLoading ? <Skeleton className="h-6 w-16" /> : (
              <p className="text-lg font-bold text-primary">{onlineStats?.messagesHandled || 0}</p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-primary/5">
            <p className="text-xs text-muted-foreground">{t("dashboard.autoReplies")}</p>
            {isLoading ? <Skeleton className="h-6 w-16" /> : (
              <p className="text-lg font-bold text-primary">{onlineStats?.autoRepliesSent || 0}</p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-primary/5">
            <p className="text-xs text-muted-foreground">{t("dashboard.activeAutomations")}</p>
            {isLoading ? <Skeleton className="h-6 w-16" /> : (
              <p className="text-lg font-bold text-primary">{onlineStats?.activeAutomations || 0}</p>
            )}
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{t("dashboard.connectedPlatforms")}</span>
          </div>
          {isLoading ? <Skeleton className="h-5 w-10" /> : (
            <span className="font-medium">{connectedPages.length}</span>
          )}
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{t("dashboard.successRate")}</span>
          </div>
          {isLoading ? <Skeleton className="h-5 w-10" /> : (
            <span className="font-medium">{onlineStats?.successRate || "0%"}</span>
          )}
        </div>

        {/* Recent Activity - Similar to Recent Sales */}
        <Card className="border-0 shadow-none bg-muted/30">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t("dashboard.recentActivity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-2">
              {isLoading ? (
                [...Array(2)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : recentLogs.length > 0 ? (
                recentLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex items-center gap-2 p-2 rounded-lg bg-background text-sm">
                    {log.status === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    )}
                    <span className="truncate flex-1">{log.event_type || "Automation"}</span>
                    <span className="text-xs text-muted-foreground">
                      {log.created_at && formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t("dashboard.noActivity")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full" asChild>
          <Link to="/dashboard/automations">
            {t("dashboard.manageAutomations")}
            <ArrowUpRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  const OfflineSummary = () => (
    <Card className="border-emerald-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Store className="w-4 h-4 text-emerald-600" />
            </div>
            {t("dashboard.offlineShopBusiness")}
          </CardTitle>
          {syncEnabled && <SyncStatusBadge syncEnabled={syncEnabled} mode="offline" />}
        </div>
        <CardDescription>{t("dashboard.completeShopManagement")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats - Same 2x2 grid as online */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/5">
            <p className="text-xs text-muted-foreground">{t("dashboard.todaySales")}</p>
            {isLoading ? <Skeleton className="h-6 w-20" /> : (
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(offlineData?.period?.totalSales || 0)}
              </p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5">
            <p className="text-xs text-muted-foreground">{t("dashboard.monthSales")}</p>
            {isLoading ? <Skeleton className="h-6 w-20" /> : (
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(offlineData?.lifetime?.totalSales || 0)}
              </p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5">
            <p className="text-xs text-muted-foreground">{t("dashboard.monthExpenses")}</p>
            {isLoading ? <Skeleton className="h-6 w-20" /> : (
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(offlineData?.period?.totalExpenses || 0)}
              </p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5">
            <p className="text-xs text-muted-foreground">{t("dashboard.monthProfit")}</p>
            {isLoading ? <Skeleton className="h-6 w-20" /> : (
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(offlineData?.lifetime?.netProfit || 0)}
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats - Same as online */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{t("dashboard.totalProducts")}</span>
          </div>
          {isLoading ? <Skeleton className="h-5 w-10" /> : (
            <span className="font-medium">{offlineData?.totalProducts || 0}</span>
          )}
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{t("dashboard.totalCustomers")}</span>
          </div>
          {isLoading ? <Skeleton className="h-5 w-10" /> : (
            <span className="font-medium">{offlineData?.totalCustomers || 0}</span>
          )}
        </div>

        {/* Low Stock Alert - Similar to Recent Activity */}
        <Card className="border-0 shadow-none bg-orange-500/5">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
              Shop Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : offlineData?.lowStockProducts?.length > 0 ? (
              <div className="space-y-2">
                {offlineData.lowStockProducts.slice(0, 3).map((product: any) => (
                  <Link 
                    key={product.id} 
                    to="/offline-shop/products" 
                    className="flex items-center justify-between p-2 rounded-lg bg-background text-sm hover:bg-muted/50 transition-colors cursor-pointer group"
                  >
                    <span className="truncate flex-1 group-hover:text-orange-600 transition-colors">{product.name}</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-500/20">
                      {product.stock_quantity} {t("shop.left")}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No low stock items</p>
            )}
          </CardContent>
        </Card>

        <Button 
          variant="outline" 
          className="w-full bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" 
          asChild
        >
          <Link to="/offline-shop">
            {t("dashboard.goToOfflineShop")}
            <ArrowUpRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <TrialExpiryBanner />

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-lg text-muted-foreground">
                {t("dashboard.welcome")}, <span className="font-semibold text-foreground">{user?.name || 'User'}</span>!
              </span>
              {user?.subscriptionPlan && getPlanBadge(user.subscriptionPlan) && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {(() => {
                    const badge = getPlanBadge(user.subscriptionPlan);
                    if (!badge) return null;
                    const IconComponent = badge.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>
                    );
                  })()}
                </motion.div>
              )}
            </div>
            <p className="text-muted-foreground">
              {syncEnabled 
                ? t("dashboard.unifiedOverview")
                : t("dashboard.onlineOverview")
              }
            </p>
          </div>
          <Button variant="gradient" asChild>
            <Link to="/dashboard/automations">
              <Plus className="w-4 h-4 mr-2" />
              {t("dashboard.newAutomation")}
            </Link>
          </Button>
        </motion.div>

        {/* KPIs */}
        <div className={`grid gap-4 ${syncEnabled ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {displayKPIs.map((kpi, index) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-card transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                      <kpi.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-6 w-20 mb-1" />
                    ) : (
                      <div className="text-xl font-bold">{kpi.value}</div>
                    )}
                    <div className="text-xs text-muted-foreground">{kpi.title}</div>
                    <div className="text-xs text-muted-foreground/70">{kpi.subtitle}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Single Product Performance Section - Shows combined when synced, online when not */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <ProductPerformanceSection 
            type={syncEnabled ? "combined" : "online"} 
            shopId={offlineData?.shopId || null}
            syncEnabled={syncEnabled}
          />
        </motion.div>

        {/* Content Area - Business Summary Cards */}
        {isMobile ? (
          <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as "online" | "offline")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="online" className="gap-2">
                <Zap className="w-4 h-4" />
                {t("dashboard.online")}
              </TabsTrigger>
              <TabsTrigger value="offline" className="gap-2">
                <Store className="w-4 h-4" />
                {t("dashboard.offline")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="online" className="mt-4">
              <OnlineSummary />
            </TabsContent>
            <TabsContent value="offline" className="mt-4">
              <OfflineSummary />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <OnlineSummary />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <OfflineSummary />
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UnifiedDashboard;
