import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Receipt,
  AlertTriangle,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ShoppingCart,
} from "lucide-react";
import { offlineShopService } from "@/services/offlineShopService";
import { useShop } from "@/contexts/ShopContext";

interface SaleWithProfit {
  id: string;
  invoice_number: string;
  sale_date: string;
  total: number;
  total_profit: number;
  customer_name?: string;
  items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    purchase_price: number;
    profit: number;
  }>;
}

interface ProductProfit {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  avg_margin: number;
}

interface ProfitDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  formatCurrency: (amount: number) => string;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
}

export const ProfitDetailsModal = ({
  isOpen,
  onClose,
  language,
  formatCurrency,
  grossProfit,
  totalExpenses,
  netProfit,
}: ProfitDetailsModalProps) => {
  const { currentShop } = useShop();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SaleWithProfit[]>([]);
  const [productProfits, setProductProfits] = useState<ProductProfit[]>([]);
  const [expenses, setExpenses] = useState<Array<{ id: string; title: string; amount: number; expense_date: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      loadProfitDetails();
    }
  }, [isOpen, currentShop?.id]);

  const loadProfitDetails = async () => {
    setLoading(true);
    try {
      // Get this month's date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // Fetch sales with items for this month
      const salesResult = await offlineShopService.getSales({ startDate: startOfMonth, endDate: endOfMonth });
      const salesData = salesResult?.sales || [];
      setSales(salesData);

      // Fetch expenses for this month
      const expensesResult = await offlineShopService.getExpenses({ startDate: startOfMonth, endDate: endOfMonth });
      const expensesData = expensesResult?.expenses || [];
      setExpenses(expensesData);

      // Aggregate product profits
      const productMap = new Map<string, ProductProfit>();
      
      salesData.forEach((sale: any) => {
        (sale.items || []).forEach((item: any) => {
          const productId = item.product_id;
          const existing = productMap.get(productId);
          const profit = (item.unit_price - (item.purchase_price || 0)) * item.quantity;
          
          if (existing) {
            existing.total_quantity += item.quantity;
            existing.total_revenue += item.unit_price * item.quantity;
            existing.total_cost += (item.purchase_price || 0) * item.quantity;
            existing.total_profit += profit;
          } else {
            productMap.set(productId, {
              product_id: productId,
              product_name: item.product_name,
              total_quantity: item.quantity,
              total_revenue: item.unit_price * item.quantity,
              total_cost: (item.purchase_price || 0) * item.quantity,
              total_profit: profit,
              avg_margin: 0,
            });
          }
        });
      });

      // Calculate average margin
      const products = Array.from(productMap.values()).map(p => ({
        ...p,
        avg_margin: p.total_revenue > 0 ? (p.total_profit / p.total_revenue) * 100 : 0,
      }));

      // Sort by profit (highest first for positive, lowest first for negative)
      products.sort((a, b) => b.total_profit - a.total_profit);
      setProductProfits(products);
    } catch (error) {
      console.error("Error loading profit details:", error);
    } finally {
      setLoading(false);
    }
  };

  const profitableProducts = productProfits.filter(p => p.total_profit > 0);
  const lossProducts = productProfits.filter(p => p.total_profit < 0);
  const totalLoss = lossProducts.reduce((sum, p) => sum + Math.abs(p.total_profit), 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CircleDollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
            {language === "bn" ? "এই মাসের মুনাফার বিবরণ" : "This Month's Profit Details"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-80px)]">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mx-auto mb-1" />
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {language === "bn" ? "মোট বিক্রয় লাভ" : "Gross Profit"}
                    </p>
                    <p className="text-sm sm:text-lg font-bold text-emerald-600">
                      {formatCurrency(grossProfit)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 bg-gradient-to-br from-rose-500/10 to-orange-500/5">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500 mx-auto mb-1" />
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {language === "bn" ? "মোট খরচ" : "Expenses"}
                    </p>
                    <p className="text-sm sm:text-lg font-bold text-rose-600">
                      - {formatCurrency(totalExpenses)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className={`border-0 bg-gradient-to-br ${netProfit >= 0 ? 'from-green-500/10 to-emerald-500/5' : 'from-red-500/10 to-rose-500/5'}`}>
                  <CardContent className="p-3 sm:p-4 text-center">
                    {netProfit >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mx-auto mb-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mx-auto mb-1" />
                    )}
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {language === "bn" ? "নিট মুনাফা" : "Net Profit"}
                    </p>
                    <p className={`text-sm sm:text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netProfit)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Loss Products Alert */}
            {lossProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-rose-500/30 bg-rose-500/5">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400">
                          {language === "bn" 
                            ? `${lossProducts.length}টি পণ্য থেকে লোকসান হচ্ছে!`
                            : `${lossProducts.length} product(s) causing loss!`
                          }
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                          {language === "bn" 
                            ? `মোট লোকসান: ${formatCurrency(totalLoss)}`
                            : `Total loss: ${formatCurrency(totalLoss)}`
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Products Profit Breakdown */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                {language === "bn" ? "পণ্য অনুযায়ী মুনাফা" : "Profit by Product"}
              </h3>
              
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : productProfits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {language === "bn" ? "এই মাসে কোনো বিক্রি নেই" : "No sales this month"}
                </p>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {productProfits.map((product, index) => (
                      <motion.div
                        key={product.product_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`border ${product.total_profit < 0 ? 'border-rose-500/30 bg-rose-500/5' : 'border-border'}`}>
                          <CardContent className="p-2 sm:p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs sm:text-sm font-medium truncate">
                                    {product.product_name}
                                  </p>
                                  {product.total_profit < 0 && (
                                    <Badge variant="destructive" className="text-[8px] px-1.5 py-0">
                                      {language === "bn" ? "লোকসান" : "Loss"}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4 mt-0.5 text-[10px] sm:text-xs text-muted-foreground">
                                  <span>
                                    {language === "bn" ? "বিক্রি" : "Sold"}: {product.total_quantity}
                                  </span>
                                  <span>
                                    {language === "bn" ? "খরচ" : "Cost"}: {formatCurrency(product.total_cost)}
                                  </span>
                                  <span>
                                    {language === "bn" ? "বিক্রয়" : "Revenue"}: {formatCurrency(product.total_revenue)}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-xs sm:text-sm font-bold ${product.total_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {product.total_profit >= 0 ? '+' : ''}{formatCurrency(product.total_profit)}
                                </p>
                                <p className={`text-[10px] sm:text-xs ${product.avg_margin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {product.avg_margin.toFixed(1)}% {language === "bn" ? "মার্জিন" : "margin"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Expenses Breakdown */}
            {expenses.length > 0 && (
              <div>
                <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-rose-500" />
                  {language === "bn" ? "খরচের বিবরণ" : "Expenses Breakdown"}
                </h3>
                
                <div className="space-y-2">
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <AnimatePresence>
                      {expenses.slice(0, 10).map((expense, index) => (
                        <motion.div
                          key={expense.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="border">
                            <CardContent className="p-2 sm:p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-medium truncate">
                                    {expense.title}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                                    {new Date(expense.expense_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                                  </p>
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-rose-600 shrink-0">
                                  - {formatCurrency(expense.amount)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            )}

            {/* Recent Sales with Profit */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-500" />
                {language === "bn" ? "সাম্প্রতিক বিক্রয়ের মুনাফা" : "Recent Sales Profit"}
              </h3>
              
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : sales.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {language === "bn" ? "এই মাসে কোনো বিক্রি নেই" : "No sales this month"}
                </p>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {sales.slice(0, 10).map((sale, index) => (
                      <motion.div
                        key={sale.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`border ${(sale.total_profit || 0) < 0 ? 'border-rose-500/30 bg-rose-500/5' : 'border-border'}`}>
                          <CardContent className="p-2 sm:p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs sm:text-sm font-medium">
                                    {sale.invoice_number}
                                  </p>
                                  {(sale.total_profit || 0) < 0 && (
                                    <Badge variant="destructive" className="text-[8px] px-1.5 py-0">
                                      {language === "bn" ? "লোকসান" : "Loss"}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs text-muted-foreground">
                                  <span>{sale.customer_name || (language === "bn" ? "সাধারণ গ্রাহক" : "Walk-in")}</span>
                                  <span>•</span>
                                  <span>{new Date(sale.sale_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                  {language === "bn" ? "বিক্রয়" : "Sale"}: {formatCurrency(sale.total)}
                                </p>
                                <p className={`text-xs sm:text-sm font-bold ${(sale.total_profit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {(sale.total_profit || 0) >= 0 ? '+' : ''}{formatCurrency(sale.total_profit || 0)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
