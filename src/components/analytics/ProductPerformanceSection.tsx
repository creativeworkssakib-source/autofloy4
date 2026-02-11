import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  Flame,
  ThumbsDown,
  BarChart3,
  RefreshCw,
  PackageX,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface ProductPerformance {
  productId: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalProfit: number;
  totalCost: number;
  returnCount: number;
  returnQuantity: number;
  lossAmount: number;
  netProfit: number;
  profitMargin: number;
  returnRate: number;
  adjustmentLoss: number;
  adjustmentQuantity: number;
  sellingLoss: number;
  sellingLossQuantity: number;
}

interface PerformanceData {
  summary: {
    totalProducts: number;
    totalSold: number;
    totalRevenue: number;
    totalProfit: number;
    totalReturns: number;
    totalLoss: number;
    totalAdjustmentLoss: number;
    totalSellingLoss: number;
  };
  topSellers: ProductPerformance[];
  lowPerformers: ProductPerformance[];
  highReturns: ProductPerformance[];
  highLoss: ProductPerformance[];
  damages: ProductPerformance[];
}

interface ProductPerformanceSectionProps {
  type: "online" | "offline" | "combined";
  shopId?: string | null;
  syncEnabled?: boolean;
  title?: string;
}

export const ProductPerformanceSection = ({ type, shopId, syncEnabled, title }: ProductPerformanceSectionProps) => {
  const { t, language } = useLanguage();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("top-sellers");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("autofloy_token");
      const params = new URLSearchParams({ type, limit: "10" });
      if (shopId) params.append("shop_id", shopId);
      
      const workerUrl = import.meta.env.VITE_WORKER_API_URL || "https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1";
      const response = await fetch(
        `${workerUrl}/product-performance?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to load product performance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // For offline type, load data even if shopId is null (will use default shop on backend)
    // For online and combined types, always load
    if (type === "online" || type === "combined" || type === "offline") {
      loadData();
    }
  }, [type, shopId]);

  const getProfitColor = (profit: number) => {
    if (profit > 0) return "text-green-600 dark:text-green-400";
    if (profit < 0) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  const getReturnRateBadge = (rate: number) => {
    if (rate >= 20) return <Badge variant="destructive">{rate.toFixed(1)}%</Badge>;
    if (rate >= 10) return <Badge variant="outline" className="border-orange-500 text-orange-600">{rate.toFixed(1)}%</Badge>;
    if (rate > 0) return <Badge variant="outline" className="border-yellow-500 text-yellow-600">{rate.toFixed(1)}%</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">0%</Badge>;
  };

  const ProductRow = ({ product, rank, showMetric }: { 
    product: ProductPerformance; 
    rank: number; 
    showMetric: "sales" | "profit" | "returns" | "loss" | "damages"
  }) => {
    const maxValue = data?.topSellers[0]?.totalQuantitySold || 1;
    const percentage = showMetric === "sales" 
      ? (product.totalQuantitySold / maxValue) * 100
      : showMetric === "profit"
      ? Math.abs(product.netProfit) > 0 ? 50 + (product.netProfit / Math.abs(product.netProfit) * 25) : 50
      : showMetric === "returns"
      ? Math.min(product.returnRate, 100)
      : showMetric === "damages"
      ? product.adjustmentLoss > 0 ? 75 : 25
      : product.lossAmount > 0 ? 75 : 25;

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: rank * 0.05 }}
        className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
            {rank}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium truncate">{product.productName}</p>
              {showMetric === "sales" && (
                <Badge variant="secondary" className="shrink-0">
                  {product.totalQuantitySold} {language === "bn" ? "বিক্রি" : "sold"}
                </Badge>
              )}
              {showMetric === "returns" && getReturnRateBadge(product.returnRate)}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {formatCurrency(product.totalRevenue)}
              </span>
              <span className={`flex items-center gap-1 ${getProfitColor(product.netProfit)}`}>
                {product.netProfit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {formatCurrency(product.netProfit)}
              </span>
              {product.returnCount > 0 && (
                <span className="flex items-center gap-1 text-orange-600">
                  <RotateCcw className="w-3 h-3" />
                  {product.returnCount} {language === "bn" ? "রিটার্ন" : "returns"}
                </span>
              )}
              {product.adjustmentLoss > 0 && (
                <span className="flex items-center gap-1 text-rose-600">
                  <AlertTriangle className="w-3 h-3" />
                  {formatCurrency(product.adjustmentLoss)} {language === "bn" ? "ক্ষতি" : "loss"}
                </span>
              )}
              {product.sellingLoss > 0 && (
                <span className="flex items-center gap-1 text-red-600 font-medium">
                  <TrendingDown className="w-3 h-3" />
                  -{formatCurrency(product.sellingLoss)} {language === "bn" ? "(কম দামে বিক্রি)" : "(sold below cost)"}
                </span>
              )}
            </div>
            
            <Progress 
              value={percentage} 
              className={`h-1.5 ${
                showMetric === "sales" ? "[&>div]:bg-primary" :
                showMetric === "returns" || showMetric === "loss" || showMetric === "damages" ? "[&>div]:bg-red-500" :
                product.netProfit >= 0 ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500"
              }`}
            />
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary || {
    totalProducts: 0,
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalReturns: 0,
    totalLoss: 0,
    totalAdjustmentLoss: 0,
    totalSellingLoss: 0,
  };

  const getTitle = () => {
    if (title) return title;
    if (type === "combined") return language === "bn" ? "সম্মিলিত প্রোডাক্ট পারফরম্যান্স" : "Combined Product Performance";
    if (type === "online") return language === "bn" ? "অনলাইন প্রোডাক্ট পারফরম্যান্স" : "Online Product Performance";
    return language === "bn" ? "অফলাইন প্রোডাক্ট পারফরম্যান্স" : "Offline Product Performance";
  };

  const getDescription = () => {
    if (type === "combined") {
      return language === "bn" 
        ? "অনলাইন এবং অফলাইন উভয় চ্যানেলের সম্মিলিত পারফরম্যান্স"
        : "Combined performance from both online and offline channels";
    }
    return language === "bn" 
      ? "কোন প্রোডাক্ট বেশি বিক্রি হচ্ছে, কোনটা কম এবং কোথায় লস হচ্ছে দেখুন"
      : "See which products sell best, which perform poorly, and where you're losing money";
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>{getTitle()}</CardTitle>
            {type === "combined" && (
              <Badge variant="secondary" className="text-xs">
                {language === "bn" ? "সিঙ্কড" : "Synced"}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground">{language === "bn" ? "মোট বিক্রি" : "Total Sold"}</p>
            <p className="text-lg sm:text-xl font-bold text-primary">{summary.totalSold}</p>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-green-500/5 border border-green-500/10">
            <p className="text-xs text-muted-foreground">{language === "bn" ? "মোট লাভ" : "Total Profit"}</p>
            <p className={`text-lg sm:text-xl font-bold ${getProfitColor(summary.totalProfit)}`}>
              {formatCurrency(summary.totalProfit)}
            </p>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-red-500/5 border border-red-500/10">
            <p className="text-xs text-muted-foreground">{language === "bn" ? "মোট লস" : "Total Loss"}</p>
            <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(summary.totalLoss)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="top-sellers" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span className="hidden sm:inline">{language === "bn" ? "বেস্ট সেলার" : "Top Sellers"}</span>
              <span className="sm:hidden">{language === "bn" ? "সেলার" : "Top"}</span>
            </TabsTrigger>
            <TabsTrigger value="low-performers" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
              <ThumbsDown className="h-3.5 w-3.5 text-gray-500" />
              <span className="hidden sm:inline">{language === "bn" ? "কম বিক্রি" : "Low Sellers"}</span>
              <span className="sm:hidden">{language === "bn" ? "কম" : "Low"}</span>
            </TabsTrigger>
            <TabsTrigger value="high-returns" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
              <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden sm:inline">{language === "bn" ? "রিটার্ন" : "Returns"}</span>
              <span className="sm:hidden">{language === "bn" ? "রিটার্ন" : "Returns"}</span>
            </TabsTrigger>
            <TabsTrigger value="damages" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
              <PackageX className="h-3.5 w-3.5 text-rose-500" />
              <span className="hidden sm:inline">{language === "bn" ? "নষ্ট" : "Damages"}</span>
              <span className="sm:hidden">{language === "bn" ? "নষ্ট" : "Dmg"}</span>
            </TabsTrigger>
            <TabsTrigger value="high-loss" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span className="hidden sm:inline">{language === "bn" ? "লস হচ্ছে" : "High Loss"}</span>
              <span className="sm:hidden">{language === "bn" ? "লস" : "Loss"}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top-sellers" className="mt-4 space-y-2">
            {data?.topSellers && data.topSellers.length > 0 ? (
              data.topSellers.map((product, index) => (
                <ProductRow key={product.productId} product={product} rank={index + 1} showMetric="sales" />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>{language === "bn" ? "কোন বিক্রয় ডেটা নেই" : "No sales data available"}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="low-performers" className="mt-4 space-y-2">
            {data?.lowPerformers && data.lowPerformers.length > 0 ? (
              data.lowPerformers.map((product, index) => (
                <ProductRow key={product.productId} product={product} rank={index + 1} showMetric="profit" />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="mx-auto h-8 w-8 mb-2 opacity-50 text-green-500" />
                <p>{language === "bn" ? "সব প্রোডাক্ট ভালো পারফর্ম করছে!" : "All products performing well!"}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="high-returns" className="mt-4 space-y-2">
            {data?.highReturns && data.highReturns.length > 0 ? (
              data.highReturns.map((product, index) => (
                <ProductRow key={product.productId} product={product} rank={index + 1} showMetric="returns" />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <RotateCcw className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>{language === "bn" ? "কোন রিটার্ন নেই" : "No returns recorded"}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="damages" className="mt-4 space-y-2">
            {data?.damages && data.damages.length > 0 ? (
              <>
                {data.damages.map((product, index) => (
                  <ProductRow key={product.productId} product={product} rank={index + 1} showMetric="damages" />
                ))}
                <Link to="/offline-shop/adjustments" className="block">
                  <div className="flex items-center justify-center gap-2 p-3 mt-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer">
                    <PackageX className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {language === "bn" ? "সব নষ্ট দেখুন" : "View All Damages"}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Link>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="mx-auto h-8 w-8 mb-2 opacity-50 text-green-500" />
                <p>{language === "bn" ? "কোন নষ্ট নেই - দারুণ!" : "No damages - Great job!"}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="high-loss" className="mt-4 space-y-2">
            {data?.highLoss && data.highLoss.length > 0 ? (
              data.highLoss.map((product, index) => (
                <ProductRow key={product.productId} product={product} rank={index + 1} showMetric="loss" />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="mx-auto h-8 w-8 mb-2 opacity-50 text-green-500" />
                <p>{language === "bn" ? "কোন লস নেই - দারুণ!" : "No losses - Great job!"}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
