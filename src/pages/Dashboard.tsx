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
  ChevronLeft,
  ChevronRight,
  Crown,
  Gem,
  Sparkles,
  Star,
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  RefreshCw,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { TrialExpiryBanner } from "@/components/dashboard/TrialExpiryBanner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDashboardStats, fetchConnectedAccounts, fetchExecutionLogs, DashboardStats, ConnectedAccount, ExecutionLog } from "@/services/apiService";
import { offlineShopService } from "@/services/offlineShopService";
import { formatDistanceToNow } from "date-fns";
import AIOrdersSection from "@/components/dashboard/AIOrdersSection";

const LOGS_PER_PAGE = 5;

// Get plan icon and styling based on subscription
const getPlanBadge = (plan: string) => {
  switch (plan) {
    case "lifetime":
      return {
        icon: Crown,
        label: "Lifetime",
        className: "bg-gradient-to-r from-amber-500 to-yellow-400 text-white",
        iconColor: "text-white",
      };
    case "business":
      return {
        icon: Crown,
        label: "Business",
        className: "bg-gradient-to-r from-purple-600 to-pink-500 text-white",
        iconColor: "text-white",
      };
    case "professional":
      return {
        icon: Gem,
        label: "Professional",
        className: "bg-gradient-to-r from-primary to-secondary text-white",
        iconColor: "text-white",
      };
    case "starter":
      return {
        icon: Sparkles,
        label: "Starter",
        className: "bg-primary/10 text-primary border border-primary/20",
        iconColor: "text-primary",
      };
    case "trial":
      return {
        icon: Star,
        label: "Trial",
        className: "bg-success/10 text-success border border-success/20",
        iconColor: "text-success",
      };
    default:
      return null;
  }
};

interface ShopDashboardData {
  period: {
    totalSales: number;
    totalProfit: number;
    totalPurchases: number;
    totalExpenses: number;
  };
  lifetime: {
    totalSales: number;
    totalProfit: number;
    totalDue: number;
  };
  totalProducts: number;
  totalCustomers: number;
  totalSuppliers: number;
  lowStockProducts: Array<{ id: string; name: string; stock_quantity: number }>;
  recentSales: any[];
  returns?: {
    totalCount: number;
    totalRefund: number;
    processed: number;
    pending: number;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [shopData, setShopData] = useState<ShopDashboardData | null>(null);
  const [connectedPages, setConnectedPages] = useState<ConnectedAccount[]>([]);
  const [allLogs, setAllLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shopLoading, setShopLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setIsLoading(true);
    setShopLoading(true);
    try {
      const [statsData, pagesData, logsData] = await Promise.all([
        fetchDashboardStats(),
        fetchConnectedAccounts("facebook"),
        fetchExecutionLogs(50),
      ]);
      setStats(statsData);
      setConnectedPages(pagesData.filter(p => p.is_connected));
      setAllLogs(logsData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }

    // Load shop data separately
    try {
      const shopDashboard = await offlineShopService.getDashboard("month");
      setShopData(shopDashboard);
    } catch (error) {
      console.error("Failed to load shop data:", error);
    } finally {
      setShopLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPages = Math.ceil(allLogs.length / LOGS_PER_PAGE);
  const paginatedLogs = allLogs.slice(
    (currentPage - 1) * LOGS_PER_PAGE,
    currentPage * LOGS_PER_PAGE
  );

  // Calculate trial hours remaining (24-hour trial)
  const getTrialHoursLeft = () => {
    if (!user?.trialEndDate) return 0;
    const endDate = new Date(user.trialEndDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
  };

  const trialHoursLeft = getTrialHoursLeft();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // AI Automation Stats
  const automationCards = [
    {
      title: "Messages Handled",
      value: stats?.messagesHandled?.toString() || "0",
      change: stats?.messagesDiff || "+0",
      changeLabel: "from yesterday",
      icon: MessageSquare,
      color: "from-primary to-primary-glow",
    },
    {
      title: "Auto-Replies Sent",
      value: stats?.autoRepliesSent?.toString() || "0",
      change: stats?.successRate || "0%",
      changeLabel: "success rate",
      icon: Zap,
      color: "from-success to-primary",
    },
    {
      title: "Active Automations",
      value: stats?.activeAutomations?.toString() || "0",
      change: stats?.totalAutomations?.toString() || "0",
      changeLabel: "total",
      icon: Bot,
      color: "from-secondary to-primary",
    },
    {
      title: "Hours Saved",
      value: stats?.hoursSaved?.toString() || "0",
      change: `৳${stats?.estimatedValue || 0}`,
      changeLabel: "value",
      icon: Clock,
      color: "from-accent to-secondary",
    },
  ];

  // Shop Business Stats (Real Data)
  const shopStatCards = [
    {
      title: "This Month's Sales",
      value: formatCurrency(shopData?.period?.totalSales || 0),
      icon: ShoppingCart,
      color: "from-blue-500 to-blue-600",
      link: "/offline-shop/sales",
    },
    {
      title: "This Month's Profit",
      value: formatCurrency(shopData?.period?.totalProfit || 0),
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
      link: "/offline-shop/reports",
    },
    {
      title: "Total Due",
      value: formatCurrency(shopData?.lifetime?.totalDue || 0),
      icon: DollarSign,
      color: "from-orange-500 to-amber-600",
      link: "/offline-shop/due-customers",
    },
    {
      title: "Total Products",
      value: shopData?.totalProducts?.toString() || "0",
      icon: Package,
      color: "from-purple-500 to-violet-600",
      link: "/offline-shop/products",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Trial Expiry Banner */}
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
                Welcome back, <span className="font-semibold text-foreground">{user?.name || 'User'}</span>!
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
                        <IconComponent className={`w-3.5 h-3.5 ${badge.iconColor}`} />
                        {badge.label}
                      </span>
                    );
                  })()}
                </motion.div>
              )}
            </div>
            <p className="text-muted-foreground">
              {user?.isTrialActive && trialHoursLeft > 0 ? (
                <>You have <span className="text-primary font-medium">{trialHoursLeft} hour{trialHoursLeft !== 1 ? 's' : ''}</span> left in your trial.</>
              ) : (
                "Here's what's happening with your business today."
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} disabled={isLoading || shopLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${(isLoading || shopLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="gradient" asChild>
              <Link to="/dashboard/automations">
                <Plus className="w-4 h-4 mr-2" />
                New Automation
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Shop Business Stats - Real Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Business Overview</h2>
            <Badge variant="outline" className="text-xs">Real-time</Badge>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shopStatCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Link to={stat.link}>
                  <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="mt-4">
                        {shopLoading ? (
                          <div className="h-7 w-24 bg-muted animate-pulse rounded" />
                        ) : (
                          <div className="text-2xl font-bold">{stat.value}</div>
                        )}
                        <div className="text-sm text-muted-foreground mt-1">{stat.title}</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          <Card className="bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Customers</div>
                {shopLoading ? (
                  <div className="h-6 w-12 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <div className="text-xl font-bold">{shopData?.totalCustomers || 0}</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Suppliers</div>
                {shopLoading ? (
                  <div className="h-6 w-12 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <div className="text-xl font-bold">{shopData?.totalSuppliers || 0}</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${(shopData?.lowStockProducts?.length || 0) > 0 ? 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800' : 'from-background to-muted/30'}`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${(shopData?.lowStockProducts?.length || 0) > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                <AlertTriangle className={`w-6 h-6 ${(shopData?.lowStockProducts?.length || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Low Stock Alert</div>
                {shopLoading ? (
                  <div className="h-6 w-12 bg-muted animate-pulse rounded mt-1" />
                ) : (
                  <div className={`text-xl font-bold ${(shopData?.lowStockProducts?.length || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600'}`}>
                    {shopData?.lowStockProducts?.length || 0} items
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Returns Summary */}
        {shopData?.returns && (shopData.returns.totalCount > 0 || shopData.returns.pending > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Returns Summary
                </CardTitle>
                <Link to="/offline-shop/returns">
                  <Button variant="ghost" size="sm">
                    View All <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">Total Returns</div>
                    <div className="text-xl font-bold">{shopData.returns.totalCount}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="text-sm text-muted-foreground">Total Refunds</div>
                    <div className="text-xl font-bold text-red-600">{formatCurrency(shopData.returns.totalRefund)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="text-sm text-muted-foreground">Processed</div>
                    <div className="text-xl font-bold text-green-600">{shopData.returns.processed}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="text-sm text-muted-foreground">Pending</div>
                    <div className="text-xl font-bold text-yellow-600">{shopData.returns.pending}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI Automation Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Automation Stats</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {automationCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">
                          {isLoading ? (
                            <div className="h-6 w-10 bg-muted animate-pulse rounded" />
                          ) : (
                            stat.value
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          {stat.change}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{stat.title}</div>
                      <div className="text-xs text-muted-foreground">{stat.changeLabel}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Orders Section */}
        <AIOrdersSection />

        {/* Connected Platforms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Connected Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex gap-4">
                  <div className="h-20 w-64 bg-muted animate-pulse rounded-xl" />
                </div>
              ) : connectedPages.length > 0 ? (
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {connectedPages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border bg-card min-w-0"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0">
                        <Facebook className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm sm:text-base truncate">{page.name || "Facebook Page"}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Connected</div>
                      </div>
                    </div>
                  ))}
                  {/* Add more platforms button */}
                  <Link
                    to="/dashboard/automations"
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-medium text-sm sm:text-base">Connect More</div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">Instagram, WhatsApp & more</div>
                    </div>
                  </Link>
                </div>
              ) : (
                <Link
                  to="/dashboard/automations"
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all w-fit"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm sm:text-base">Connect Your First Platform</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Facebook, Instagram, WhatsApp & more</div>
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/logs">
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : paginatedLogs.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {paginatedLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          log.status === "success" 
                            ? "bg-success/10 text-success" 
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {log.status === "success" ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {log.automations?.name || log.event_type || "Automation Event"}
                            </p>
                            <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-xs">
                              {log.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {log.source_platform && (
                              <span className="capitalize">{log.source_platform}</span>
                            )}
                            {log.processing_time_ms && (
                              <span>• {log.processing_time_ms}ms</span>
                            )}
                            {log.created_at && (
                              <span>• {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No activity yet</p>
                  <p className="text-sm">Connect a page and create an automation to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
