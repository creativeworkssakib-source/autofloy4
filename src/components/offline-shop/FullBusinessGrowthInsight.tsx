import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Lightbulb,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  DollarSign,
  ShoppingCart,
  PieChart,
  Activity,
  Brain,
  LineChart as LineChartIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShop } from "@/contexts/ShopContext";
import { offlineShopService } from "@/services/offlineShopService";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface GrowthInsightData {
  currentMonthSales: number;
  lastMonthSales: number;
  salesGrowthPercent: number;
  dailyAverage: number;
  topCustomers: Array<{ name: string; totalPurchases: number; percentage: number }>;
  monthlyTrend: Array<{ month: string; sales: number }>;
  insights: string[];
  bestMonth: { month: string; sales: number } | null;
  worstMonth: { month: string; sales: number } | null;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export const FullBusinessGrowthInsight = () => {
  const { language } = useLanguage();
  const { currentShop } = useShop();
  const [data, setData] = useState<GrowthInsightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const t = {
    title: language === "bn" ? "ব্যবসা বৃদ্ধি বিশ্লেষণ" : "Business Growth Analysis",
    subtitle: language === "bn" ? "আপনার ব্যবসার সম্পূর্ণ বিশ্লেষণ দেখুন" : "View complete analysis of your business",
    overview: language === "bn" ? "সামগ্রিক দৃশ্য" : "Overview",
    trends: language === "bn" ? "ট্রেন্ড" : "Trends",
    customers: language === "bn" ? "কাস্টমার" : "Customers",
    insights: language === "bn" ? "ইনসাইট" : "Insights",
    
    thisMonth: language === "bn" ? "এই মাসে বিক্রি" : "This Month Sales",
    lastMonth: language === "bn" ? "গত মাসে বিক্রি" : "Last Month Sales",
    growth: language === "bn" ? "প্রবৃদ্ধি" : "Growth",
    dailyAverage: language === "bn" ? "দৈনিক গড়" : "Daily Average",
    
    monthlyTrend: language === "bn" ? "মাসিক বিক্রি ট্রেন্ড" : "Monthly Sales Trend",
    monthlyTrendDesc: language === "bn" ? "গত ৬ মাসের বিক্রির প্রবণতা" : "Sales trend over the last 6 months",
    
    topCustomers: language === "bn" ? "টপ কাস্টমার" : "Top Customers",
    topCustomersDesc: language === "bn" ? "সবচেয়ে বেশি কেনাকাটা করা কাস্টমার" : "Customers with highest purchases",
    contribution: language === "bn" ? "মোট বিক্রির অবদান" : "Contribution to total sales",
    
    smartInsights: language === "bn" ? "স্মার্ট ইনসাইট" : "Smart Insights",
    smartInsightsDesc: language === "bn" ? "আপনার ব্যবসার জন্য AI বিশ্লেষণ" : "AI analysis for your business",
    
    bestMonth: language === "bn" ? "সেরা মাস" : "Best Month",
    worstMonth: language === "bn" ? "দুর্বল মাস" : "Weakest Month",
    
    noData: language === "bn" ? "পর্যাপ্ত ডেটা নেই বিশ্লেষণের জন্য। আরও বিক্রি করুন!" : "Not enough data for analysis. Make more sales!",
    
    salesAmount: language === "bn" ? "বিক্রি (৳)" : "Sales (৳)",
    month: language === "bn" ? "মাস" : "Month",
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `৳${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `৳${(amount / 1000).toFixed(1)}K`;
    }
    return `৳${amount}`;
  };

  useEffect(() => {
    const fetchGrowthInsights = async () => {
      if (!currentShop?.id) return;
      
      setIsLoading(true);
      try {
        const result = await offlineShopService.getGrowthInsights();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch growth insights:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrowthInsights();
  }, [currentShop?.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!data || (data.currentMonthSales === 0 && data.lastMonthSales === 0 && data.monthlyTrend.length === 0)) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center text-muted-foreground">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">{t.noData}</p>
        </CardContent>
      </Card>
    );
  }

  const isGrowth = data.salesGrowthPercent >= 0;

  // Prepare pie chart data for top customers
  const pieData = data.topCustomers?.slice(0, 5).map((c, i) => ({
    name: c.name,
    value: c.totalPurchases,
    percentage: c.percentage,
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-purple-500/15 to-cyan-500/10 border border-primary/20 shadow-lg shadow-primary/5">
          <LineChartIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="overview">{t.overview}</TabsTrigger>
          <TabsTrigger value="trends">{t.trends}</TabsTrigger>
          <TabsTrigger value="customers">{t.customers}</TabsTrigger>
          <TabsTrigger value="insights">{t.insights}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* This Month Sales */}
            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">{t.thisMonth}</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(data.currentMonthSales)}
                </p>
              </CardContent>
            </Card>

            {/* Last Month Sales */}
            <Card className="border-slate-500/20 bg-gradient-to-br from-slate-500/5 to-transparent">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-slate-500/10">
                    <Calendar className="h-4 w-4 text-slate-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">{t.lastMonth}</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.lastMonthSales)}
                </p>
              </CardContent>
            </Card>

            {/* Growth */}
            <Card className={`border-${isGrowth ? 'green' : 'red'}-500/20 bg-gradient-to-br from-${isGrowth ? 'green' : 'red'}-500/5 to-transparent`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${isGrowth ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {isGrowth ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{t.growth}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${isGrowth ? 'text-green-500' : 'text-red-500'}`}>
                    {isGrowth ? '+' : ''}{data.salesGrowthPercent.toFixed(1)}%
                  </p>
                  {isGrowth ? (
                    <ArrowUpRight className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daily Average */}
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">{t.dailyAverage}</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(data.dailyAverage)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Best/Worst Month */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.bestMonth && (
              <Card className="border-green-500/20 bg-gradient-to-r from-green-500/5 to-transparent">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">{t.bestMonth}</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {data.bestMonth.month}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(data.bestMonth.sales)}
                      </p>
                    </div>
                    <div className="p-4 rounded-full bg-green-500/10">
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.worstMonth && (
              <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-transparent">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">{t.worstMonth}</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {data.worstMonth.month}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(data.worstMonth.sales)}
                      </p>
                    </div>
                    <div className="p-4 rounded-full bg-orange-500/10">
                      <TrendingDown className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t.monthlyTrend}
              </CardTitle>
              <CardDescription>{t.monthlyTrendDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.monthlyTrend.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tickFormatter={formatCompactCurrency}
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), t.salesAmount]}
                        labelFormatter={(label) => `${t.month}: ${label}`}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="sales" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">{t.noData}</p>
              )}
            </CardContent>
          </Card>

          {/* Line Chart for Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-500" />
                {language === "bn" ? "বিক্রি প্রবাহ" : "Sales Flow"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.monthlyTrend.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={formatCompactCurrency} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), t.salesAmount]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#06b6d4" 
                        strokeWidth={3}
                        dot={{ fill: '#06b6d4', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">{t.noData}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Customers List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  {t.topCustomers}
                </CardTitle>
                <CardDescription>{t.topCustomersDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topCustomers && data.topCustomers.length > 0 ? (
                  <div className="space-y-4">
                    {data.topCustomers.map((customer, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-sm font-semibold">
                              {formatCurrency(customer.totalPurchases)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={customer.percentage} 
                              className="h-2 flex-1"
                            />
                            <span className="text-xs text-muted-foreground w-12 text-right">
                              {customer.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">{t.noData}</p>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-amber-500" />
                  {t.contribution}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percentage }) => `${name.split(' ')[0]} (${percentage.toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">{t.noData}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-amber-500" />
                {t.smartInsights}
              </CardTitle>
              <CardDescription>{t.smartInsightsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {data.insights && data.insights.length > 0 ? (
                <div className="space-y-4">
                  {data.insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20"
                    >
                      <Sparkles className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">{t.noData}</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "bn" ? "দ্রুত সারাংশ" : "Quick Summary"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/50">
                  <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{formatCurrency(data.currentMonthSales)}</p>
                  <p className="text-xs text-muted-foreground">{t.thisMonth}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className={`text-2xl font-bold ${isGrowth ? 'text-green-500' : 'text-red-500'}`}>
                    {isGrowth ? '+' : ''}{data.salesGrowthPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">{t.growth}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Users className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{data.topCustomers?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">{t.topCustomers}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-cyan-500" />
                  <p className="text-2xl font-bold">{data.monthlyTrend?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">{language === "bn" ? "মাস ট্র্যাক" : "Months Tracked"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
