import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowRight,
  Calculator,
  Receipt,
  Wallet2
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
  netProfit: number;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  language: "en" | "bn";
}

export const ProfitBreakdownCard = ({
  grossProfit,
  totalExpenses,
  netProfit,
  isLoading,
  formatCurrency,
  language,
}: ProfitBreakdownCardProps) => {
  const isProfit = netProfit >= 0;
  const total = grossProfit + totalExpenses;
  const grossProfitPercent = total > 0 ? (grossProfit / total) * 100 : 50;
  const expensePercent = total > 0 ? (totalExpenses / total) * 100 : 50;

  const translations = {
    en: {
      title: "Profit Breakdown",
      subtitle: "This month's financial summary",
      grossProfit: "Gross Profit",
      grossProfitDesc: "Revenue from sales minus cost of goods sold",
      expenses: "Total Expenses",
      expensesDesc: "Rent, bills, salaries, and other expenses",
      netProfit: "Net Profit",
      netLoss: "Net Loss",
      netDesc: "Final profit/loss after all expenses",
      viewExpenses: "View Expenses",
      fromSales: "from sales",
      allExpenses: "all expenses",
      final: "final result",
    },
    bn: {
      title: "লাভ-লস বিবরণ",
      subtitle: "এই মাসের আর্থিক সারসংক্ষেপ",
      grossProfit: "মোট লাভ (বিক্রয় থেকে)",
      grossProfitDesc: "বিক্রয় থেকে আয় - পণ্যের ক্রয় মূল্য",
      expenses: "মোট খরচ",
      expensesDesc: "ভাড়া, বিল, বেতন ও অন্যান্য খরচ",
      netProfit: "নিট লাভ",
      netLoss: "নিট লস",
      netDesc: "সকল খরচ বাদে চূড়ান্ত লাভ/লস",
      viewExpenses: "খরচ দেখুন",
      fromSales: "বিক্রয় থেকে",
      allExpenses: "সকল খরচ",
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

        <CardHeader className="pb-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                className="p-2 rounded-xl bg-primary/10"
                whileHover={{ scale: 1.1 }}
              >
                <Calculator className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <CardTitle className="text-lg">{t.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>
            <Link to="/offline-shop/expenses">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                {t.viewExpenses} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 relative">
          {/* Gross Profit Row */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 cursor-help"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-600 dark:text-emerald-400">
                          {t.grossProfit}
                        </p>
                        <p className="text-xs text-muted-foreground">{t.fromSales}</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      + {formatCurrency(grossProfit)}
                    </p>
                  </div>
                  <Progress 
                    value={grossProfitPercent} 
                    className="h-2 bg-emerald-500/20" 
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
                  className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-help"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <Receipt className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-600 dark:text-amber-400">
                          {t.expenses}
                        </p>
                        <p className="text-xs text-muted-foreground">{t.allExpenses}</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                      - {formatCurrency(totalExpenses)}
                    </p>
                  </div>
                  <Progress 
                    value={expensePercent} 
                    className="h-2 bg-amber-500/20" 
                  />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p>{t.expensesDesc}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <Minus className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Net Profit/Loss Row */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className={`p-4 rounded-xl border cursor-help ${
                    isProfit
                      ? "bg-gradient-to-r from-emerald-500/15 to-green-500/10 border-emerald-500/30"
                      : "bg-gradient-to-r from-rose-500/15 to-red-500/10 border-rose-500/30"
                  }`}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className={`p-3 rounded-xl ${
                          isProfit ? "bg-emerald-500/20" : "bg-rose-500/20"
                        }`}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {isProfit ? (
                          <Wallet2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-rose-500" />
                        )}
                      </motion.div>
                      <div>
                        <p
                          className={`font-semibold ${
                            isProfit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isProfit ? t.netProfit : t.netLoss}
                        </p>
                        <p className="text-xs text-muted-foreground">{t.final}</p>
                      </div>
                    </div>
                    <motion.p
                      className={`text-2xl font-bold ${
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
