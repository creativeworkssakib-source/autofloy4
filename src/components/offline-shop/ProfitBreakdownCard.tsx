import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowRight,
  Calculator,
  Receipt,
  Wallet2,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfitBreakdownCardProps {
  grossProfit: number;
  totalExpenses: number;
  adjustmentLoss: number;
  netProfit: number;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  language: "en" | "bn";
}

export const ProfitBreakdownCard = ({
  grossProfit,
  totalExpenses,
  adjustmentLoss,
  netProfit,
  isLoading,
  formatCurrency,
  language,
}: ProfitBreakdownCardProps) => {
  const isProfit = netProfit >= 0;
  const total = grossProfit + totalExpenses + adjustmentLoss;
  const grossProfitPercent = total > 0 ? (grossProfit / total) * 100 : 50;
  const expensePercent = total > 0 ? (totalExpenses / total) * 100 : 25;
  const adjustmentPercent = total > 0 ? (adjustmentLoss / total) * 100 : 25;

  const translations = {
    en: {
      title: "Profit Breakdown",
      subtitle: "This month's financial summary",
      grossProfit: "Gross Profit",
      grossProfitDesc: "Revenue from sales minus cost of goods sold",
      expenses: "Total Expenses",
      expensesDesc: "Rent, bills, salaries, and other expenses",
      adjustmentLoss: "Stock Loss",
      adjustmentLossDesc: "Damage, expired, theft, and other stock losses",
      netProfit: "Net Profit",
      netLoss: "Net Loss",
      netDesc: "Final profit/loss after all expenses and losses",
      viewExpenses: "View Expenses",
      viewAdjustments: "View",
      fromSales: "from sales",
      allExpenses: "all expenses",
      stockLosses: "stock losses",
      final: "final result",
    },
    bn: {
      title: "লাভ-লস বিবরণ",
      subtitle: "এই মাসের আর্থিক সারসংক্ষেপ",
      grossProfit: "মোট লাভ (বিক্রয় থেকে)",
      grossProfitDesc: "বিক্রয় থেকে আয় - পণ্যের ক্রয় মূল্য",
      expenses: "মোট খরচ",
      expensesDesc: "ভাড়া, বিল, বেতন ও অন্যান্য খরচ",
      adjustmentLoss: "স্টক ক্ষতি",
      adjustmentLossDesc: "নষ্ট, মেয়াদ উত্তীর্ণ, চুরি ও অন্যান্য স্টক ক্ষতি",
      netProfit: "নিট লাভ",
      netLoss: "নিট লস",
      netDesc: "সকল খরচ ও ক্ষতি বাদে চূড়ান্ত লাভ/লস",
      viewExpenses: "খরচ দেখুন",
      viewAdjustments: "দেখুন",
      fromSales: "বিক্রয় থেকে",
      allExpenses: "সকল খরচ",
      stockLosses: "স্টক ক্ষতি",
      final: "চূড়ান্ত ফলাফল",
    },
  };

  const t = translations[language];

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20 shadow-lg backdrop-blur-xl">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-primary/5 blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            style={{ top: "-20%", right: "-10%" }}
          />
        </div>

        <CardHeader className="pb-2 px-3 sm:px-6 relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <motion.div
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-primary/10 shrink-0"
                whileHover={{ scale: 1.1 }}
              >
                <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </motion.div>
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-lg truncate">{t.title}</CardTitle>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t.subtitle}</p>
              </div>
            </div>
            <Link to="/offline-shop/expenses" className="shrink-0">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs sm:text-sm px-2 sm:px-3">
                <span className="hidden sm:inline">{t.viewExpenses}</span>
                <ArrowRight className="sm:ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 relative">
          {/* Gross Profit Row */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20 cursor-help"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-emerald-500/20 shrink-0">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 truncate">
                          {t.grossProfit}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t.fromSales}</p>
                      </div>
                    </div>
                    <p className="text-sm sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      + {formatCurrency(grossProfit)}
                    </p>
                  </div>
                  <Progress 
                    value={grossProfitPercent} 
                    className="h-1.5 sm:h-2 bg-emerald-500/20" 
                  />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>{t.grossProfitDesc}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Expenses Row */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-help"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-amber-500/20 shrink-0">
                        <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400 truncate">
                          {t.expenses}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t.allExpenses}</p>
                      </div>
                    </div>
                    <p className="text-sm sm:text-xl font-bold text-amber-600 dark:text-amber-400 shrink-0">
                      - {formatCurrency(totalExpenses)}
                    </p>
                  </div>
                  <Progress 
                    value={expensePercent} 
                    className="h-1.5 sm:h-2 bg-amber-500/20" 
                  />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>{t.expensesDesc}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Adjustment Loss Row - Only show if there are losses */}
          {adjustmentLoss > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/offline-shop/adjustments">
                    <motion.div
                      className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-rose-500/10 border border-rose-500/20 cursor-pointer hover:bg-rose-500/15 transition-colors"
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-rose-500/20 shrink-0">
                            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-rose-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400 truncate">
                              {t.adjustmentLoss}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">{t.stockLosses}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-sm sm:text-xl font-bold text-rose-600 dark:text-rose-400">
                            - {formatCurrency(adjustmentLoss)}
                          </p>
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-rose-500" />
                        </div>
                      </div>
                      <Progress 
                        value={adjustmentPercent} 
                        className="h-1.5 sm:h-2 bg-rose-500/20" 
                      />
                    </motion.div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>{t.adjustmentLossDesc}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Divider */}
          <div className="flex items-center gap-2 sm:gap-3 py-0.5 sm:py-1">
            <div className="flex-1 h-px bg-border" />
            <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Net Profit/Loss Row */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className={`p-2.5 sm:p-4 rounded-lg sm:rounded-xl border cursor-help ${
                    isProfit
                      ? "bg-gradient-to-r from-emerald-500/15 to-green-500/10 border-emerald-500/30"
                      : "bg-gradient-to-r from-rose-500/15 to-red-500/10 border-rose-500/30"
                  }`}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <motion.div
                        className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 ${
                          isProfit ? "bg-emerald-500/20" : "bg-rose-500/20"
                        }`}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {isProfit ? (
                          <Wallet2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
                        )}
                      </motion.div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs sm:text-base font-semibold truncate ${
                            isProfit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isProfit ? t.netProfit : t.netLoss}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t.final}</p>
                      </div>
                    </div>
                    <motion.p
                      className={`text-base sm:text-2xl font-bold shrink-0 ${
                        isProfit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      {isProfit ? "+" : ""}{formatCurrency(netProfit)}
                    </motion.p>
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>{t.netDesc}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>
    </motion.div>
  );
};
