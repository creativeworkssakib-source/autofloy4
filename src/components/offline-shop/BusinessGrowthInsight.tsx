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
  LineChart,
  Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShop } from "@/contexts/ShopContext";
import { offlineShopService } from "@/services/offlineShopService";

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

export const BusinessGrowthInsight = () => {
  const { language } = useLanguage();
  const { currentShop } = useShop();
  const [data, setData] = useState<GrowthInsightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const t = {
    title: language === "bn" ? "ব্যবসা বৃদ্ধি বিশ্লেষণ" : "Business Growth Insight",
    subtitle: language === "bn" ? "আপনার ব্যবসা কোন দিকে যাচ্ছে" : "Where your business is heading",
    monthlySales: language === "bn" ? "এই মাসে বিক্রি" : "This Month Sales",
    dailyAverage: language === "bn" ? "দৈনিক গড়" : "Daily Average",
    topCustomers: language === "bn" ? "টপ কাস্টমার" : "Top Customers",
    topCustomersContribution: language === "bn" ? "মোট বিক্রির অবদান" : "Contribution to total sales",
    monthlyTrend: language === "bn" ? "মাসিক ট্রেন্ড" : "Monthly Trend",
    smartInsights: language === "bn" ? "স্মার্ট ইনসাইট" : "Smart Insights",
    vsLastMonth: language === "bn" ? "গত মাসের তুলনায়" : "vs last month",
    bestMonth: language === "bn" ? "সেরা মাস" : "Best Month",
    worstMonth: language === "bn" ? "দুর্বল মাস" : "Weakest Month",
    noData: language === "bn" ? "পর্যাপ্ত ডেটা নেই বিশ্লেষণের জন্য" : "Not enough data for analysis",
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
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
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || (data.currentMonthSales === 0 && data.lastMonthSales === 0)) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-8 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{t.noData}</p>
        </CardContent>
      </Card>
    );
  }

  const isGrowth = data.salesGrowthPercent >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                <LineChart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{t.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>
            <Badge 
              variant={isGrowth ? "default" : "destructive"} 
              className={`flex items-center gap-1 ${isGrowth ? "bg-green-500" : ""}`}
            >
              {isGrowth ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(data.salesGrowthPercent).toFixed(1)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* This Month Sales */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">{t.monthlySales}</span>
              </div>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(data.currentMonthSales)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t.vsLastMonth}: {formatCurrency(data.lastMonthSales)}
              </p>
            </div>

            {/* Daily Average */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">{t.dailyAverage}</span>
              </div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(data.dailyAverage)}
              </p>
            </div>

            {/* Best Month */}
            {data.bestMonth && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">{t.bestMonth}</span>
                </div>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  {data.bestMonth.month}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(data.bestMonth.sales)}
                </p>
              </div>
            )}

            {/* Worst Month */}
            {data.worstMonth && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground">{t.worstMonth}</span>
                </div>
                <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                  {data.worstMonth.month}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(data.worstMonth.sales)}
                </p>
              </div>
            )}
          </div>

          {/* Top Customers */}
          {data.topCustomers && data.topCustomers.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">{t.topCustomers}</span>
                <span className="text-xs text-muted-foreground">• {t.topCustomersContribution}</span>
              </div>
              <div className="space-y-2">
                {data.topCustomers.slice(0, 5).map((customer, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs">
                      {index + 1}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{customer.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(customer.totalPurchases)} ({customer.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={customer.percentage} className="h-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Insights */}
          {data.insights && data.insights.length > 0 && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">{t.smartInsights}</span>
              </div>
              <ul className="space-y-1.5">
                {data.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
