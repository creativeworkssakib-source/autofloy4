import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOfflineCashRegister } from "@/hooks/useOfflineShopData";
import { offlineShopService } from "@/services/offlineShopService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
  ShoppingCart,
  Receipt,
  History,
  Play,
  Square,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Banknote,
  CircleDollarSign,
  BarChart3,
  Plus,
  Trash2,
  Coins,
  X,
  WifiOff,
  Wifi,
  Package,
  RefreshCcw,
} from "lucide-react";

interface CashRegister {
  id: string;
  register_date: string;
  opening_cash: number;
  opening_time: string;
  closing_cash: number | null;
  closing_time: string | null;
  total_sales: number;
  total_cash_sales: number;
  total_due_collected: number;
  total_expenses: number;
  total_withdrawals: number;
  total_deposits: number;
  total_change_returns?: number;
  total_cash_in?: number;
  total_cash_out?: number;
  expected_cash: number;
  cash_difference: number;
  notes: string | null;
  status: "open" | "closed";
  quick_expenses?: QuickExpense[];
  total_quick_expenses?: number;
}

interface QuickExpense {
  id: string;
  amount: number;
  description: string;
  created_at: string;
}

export function DailyCashRegister() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const {
    register: todayRegister,
    registers,
    loading: isLoading,
    refetch,
    openRegister,
    closeRegister,
  } = useOfflineCashRegister();
  
  const hasOpenRegister = todayRegister?.status === 'open';
  
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false);
  const [showCashInModal, setShowCashInModal] = useState(false);
  const [showDueCollectedModal, setShowDueCollectedModal] = useState(false);
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [cashInBreakdown, setCashInBreakdown] = useState<any>(null);
  const [dueCollectedBreakdown, setDueCollectedBreakdown] = useState<any>(null);
  const [cashOutBreakdown, setCashOutBreakdown] = useState<any>(null);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [returnsData, setReturnsData] = useState<any[]>([]);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickExpenseAmount, setQuickExpenseAmount] = useState("");
  const [quickExpenseDescription, setQuickExpenseDescription] = useState("");
  const [quickExpenseCategory, setQuickExpenseCategory] = useState("other");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  
  // Get suggested opening cash from last closed register
  const suggestedOpening = registers.find((r: CashRegister) => r.status === "closed")?.closing_cash || 0;

  const t = {
    title: language === "bn" ? "দৈনিক ক্যাশ রেজিস্টার" : "Daily Cash Register",
    subtitle: language === "bn" ? "প্রতিদিনের ক্যাশ ট্র্যাক করুন - শপ খোলা থেকে বন্ধ পর্যন্ত" : "Track daily cash flow - from opening to closing",
    openRegister: language === "bn" ? "শপ খুলুন" : "Open Shop",
    closeRegister: language === "bn" ? "শপ বন্ধ করুন" : "Close Shop",
    shopOpen: language === "bn" ? "শপ খোলা আছে" : "Shop is Open",
    shopClosed: language === "bn" ? "শপ বন্ধ" : "Shop Closed",
    openingCash: language === "bn" ? "শুরুর ক্যাশ" : "Opening Cash",
    closingCash: language === "bn" ? "ক্লোজিং ক্যাশ" : "Closing Cash",
    expectedCash: language === "bn" ? "প্রত্যাশিত ক্যাশ" : "Expected Cash",
    cashDifference: language === "bn" ? "তফাৎ" : "Difference",
    todaySales: language === "bn" ? "আজকের বিক্রি" : "Today's Sales",
    cashSales: language === "bn" ? "ক্যাশ বিক্রি" : "Cash Sales",
    dueCollected: language === "bn" ? "বাকি আদায়" : "Due Collected",
    expenses: language === "bn" ? "খরচ" : "Expenses",
    notes: language === "bn" ? "নোট" : "Notes",
    history: language === "bn" ? "ইতিহাস" : "History",
    suggestedFromYesterday: language === "bn" ? "গতকালের ক্লোজিং থেকে" : "From yesterday's closing",
    confirmOpen: language === "bn" ? "শপ খুলুন" : "Open Shop",
    confirmClose: language === "bn" ? "শপ বন্ধ করুন" : "Close Shop",
    cancel: language === "bn" ? "বাতিল" : "Cancel",
    noHistory: language === "bn" ? "কোনো ইতিহাস নেই" : "No history found",
    cashIn: language === "bn" ? "ক্যাশ ইন" : "Cash In",
    cashOut: language === "bn" ? "ক্যাশ আউট" : "Cash Out",
    currentBalance: language === "bn" ? "বর্তমান ব্যালেন্স" : "Current Balance",
    openShopFirst: language === "bn" ? "প্রথমে শপ খুলুন" : "Open shop first",
    enterOpeningAmount: language === "bn" ? "শুরুর টাকার পরিমাণ দিন" : "Enter opening cash amount",
    enterClosingAmount: language === "bn" ? "ক্লোজিং টাকার পরিমাণ দিন" : "Enter closing cash amount",
    summaryTitle: language === "bn" ? "দিন শেষের সারাংশ" : "End of Day Summary",
    matchIcon: language === "bn" ? "মিল হয়েছে" : "Matched",
    excessIcon: language === "bn" ? "বেশি" : "Excess",
    shortIcon: language === "bn" ? "কম" : "Short",
    last7Days: language === "bn" ? "গত ৭ দিন" : "Last 7 Days",
    quickExpense: language === "bn" ? "ছোট খরচ" : "Quick Expense",
    quickExpenseTitle: language === "bn" ? "ছোট খরচ যোগ করুন" : "Add Quick Expense",
    quickExpenseDesc: language === "bn" ? "চা-নাস্তা, ভিক্ষা, টুকটাক জিনিস - এসব ছোট খরচ। শপ বন্ধ করলে এগুলো মুছে যাবে।" : "Tea, snacks, donations, small items. These will be deleted when shop closes.",
    amount: language === "bn" ? "টাকা" : "Amount",
    description: language === "bn" ? "বিবরণ" : "Description",
    add: language === "bn" ? "যোগ করুন" : "Add",
    noQuickExpenses: language === "bn" ? "কোনো ছোট খরচ নেই" : "No quick expenses",
    cashInDetails: language === "bn" ? "ক্যাশ ইন বিস্তারিত" : "Cash In Details",
    dueCollectedDetails: language === "bn" ? "বাকি আদায় বিস্তারিত" : "Due Collected Details",
    customer: language === "bn" ? "কাস্টমার" : "Customer",
    invoice: language === "bn" ? "ইনভয়েস" : "Invoice",
    time: language === "bn" ? "সময়" : "Time",
    noData: language === "bn" ? "কোনো ডাটা নেই" : "No data",
    clickToViewDetails: language === "bn" ? "বিস্তারিত দেখতে ক্লিক করুন" : "Click to view details",
    keepInRegister: language === "bn" ? "রেজিস্টারে রাখবো" : "Keep in Register",
    takeHome: language === "bn" ? "বাকি টাকা নিয়ে যাবো" : "Taking Home",
    daySummary: language === "bn" ? "দিনের সারাংশ" : "Day Summary",
    totalCashIn: language === "bn" ? "মোট ক্যাশ ইন" : "Total Cash In",
    totalCashOut: language === "bn" ? "মোট খরচ" : "Total Cash Out",
    todaysEarning: language === "bn" ? "আজকের আয়" : "Today's Earning",
    cashOutDetails: language === "bn" ? "ক্যাশ আউট বিস্তারিত" : "Cash Out Details",
    purchase: language === "bn" ? "ক্রয়" : "Purchase",
    withdrawal: language === "bn" ? "উত্তোলন" : "Withdrawal",
    changeReturn: language === "bn" ? "ফেরত দেওয়া চেঞ্জ" : "Change Return",
    quickExpenses: language === "bn" ? "ছোট খরচ" : "Quick Expenses",
    supplier: language === "bn" ? "সাপ্লায়ার" : "Supplier",
    returns: language === "bn" ? "রিটার্ন" : "Returns",
    returnDetails: language === "bn" ? "রিটার্ন বিস্তারিত" : "Return Details",
    refund: language === "bn" ? "ফেরত" : "Refund",
    loss: language === "bn" ? "লস" : "Loss",
    product: language === "bn" ? "পণ্য" : "Product",
    reason: language === "bn" ? "কারণ" : "Reason",
    noReturns: language === "bn" ? "আজকে কোনো রিটার্ন থেকে ক্যাশ আউট হয়নি" : "No cash out from returns today",
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleOpenRegister = async () => {
    if (!openingCash && openingCash !== "0") {
      toast.error(t.enterOpeningAmount);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await openRegister(parseFloat(openingCash));
      toast.success(result.message);
      setShowOpenModal(false);
      setOpeningCash("");
      setNotes("");
    } catch (error: any) {
      toast.error(error.message || "Failed to open register");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseRegister = async () => {
    if (!closingCash && closingCash !== "0") {
      toast.error(t.enterClosingAmount);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await closeRegister(parseFloat(closingCash), notes);
      toast.success(language === "bn" ? "রেজিস্টার বন্ধ হয়েছে" : "Register closed successfully");
      setShowCloseModal(false);
      setClosingCash("");
      setNotes("");
    } catch (error: any) {
      toast.error(error.message || "Failed to close register");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddQuickExpense = async () => {
    if (!quickExpenseAmount || parseFloat(quickExpenseAmount) <= 0) {
      toast.error(language === "bn" ? "টাকার পরিমাণ দিন" : "Please enter amount");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await offlineShopService.addQuickExpense({
        amount: parseFloat(quickExpenseAmount),
        description: quickExpenseDescription || "",
        category: quickExpenseCategory,
      });
      toast.success(language === "bn" ? "খরচ যোগ হয়েছে" : "Expense added");
      setQuickExpenseAmount("");
      setQuickExpenseDescription("");
      setQuickExpenseCategory("other");
      setShowQuickExpenseModal(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuickExpense = async (expenseId: string) => {
    try {
      await offlineShopService.deleteQuickExpense(expenseId);
      toast.success(language === "bn" ? "খরচ মুছে ফেলা হয়েছে" : "Expense deleted");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete expense");
    }
  };

  const getCurrentCashBalance = () => {
    if (!todayRegister) return 0;
    // Use new total_cash_in/out if available, otherwise fallback to old calculation
    if (todayRegister.total_cash_in !== undefined && todayRegister.total_cash_out !== undefined) {
      return Number(todayRegister.opening_cash) + 
             Number(todayRegister.total_cash_in || 0) - 
             Number(todayRegister.total_cash_out || 0);
    }
    // Fallback for old data
    return Number(todayRegister.opening_cash) + 
           Number(todayRegister.total_cash_sales || 0) + 
           Number(todayRegister.total_due_collected || 0) + 
           Number(todayRegister.total_deposits || 0) - 
           Number(todayRegister.total_expenses || 0) - 
           Number(todayRegister.total_withdrawals || 0);
  };

  const handleShowCashInDetails = async () => {
    setShowCashInModal(true);
    setLoadingBreakdown(true);
    try {
      const data = await offlineShopService.getCashFlowBreakdown('cash_in');
      setCashInBreakdown(data);
    } catch (error) {
      console.error("Failed to load cash in breakdown:", error);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const handleShowDueCollectedDetails = async () => {
    setShowDueCollectedModal(true);
    setLoadingBreakdown(true);
    try {
      const data = await offlineShopService.getCashFlowBreakdown('due_collected');
      setDueCollectedBreakdown(data);
    } catch (error) {
      console.error("Failed to load due collected breakdown:", error);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const handleShowCashOutDetails = async () => {
    setShowCashOutModal(true);
    setLoadingBreakdown(true);
    try {
      const data = await offlineShopService.getCashFlowBreakdown('cash_out');
      setCashOutBreakdown(data);
    } catch (error) {
      console.error("Failed to load cash out breakdown:", error);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // Functions already defined above with refetch() instead of loadData()

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                  {t.title}
                  {hasOpenRegister ? (
                    <Badge variant="default" className="bg-success/90 text-success-foreground">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {t.shopOpen}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {t.shopClosed}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{t.subtitle}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistoryModal(true)}
                className="gap-1"
              >
                <History className="h-4 w-4" />
                {t.history}
              </Button>
              {hasOpenRegister ? (
                <Button
                  onClick={() => {
                    setClosingCash("");
                    setWithdrawalAmount("");
                    setNotes("");
                    setShowCloseModal(true);
                  }}
                  className="gap-1 bg-destructive hover:bg-destructive/90"
                  size="sm"
                >
                  <Square className="h-4 w-4" />
                  {t.closeRegister}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setOpeningCash(suggestedOpening.toString());
                    setShowOpenModal(true);
                  }}
                  className="gap-1 bg-success hover:bg-success/90"
                  size="sm"
                >
                  <Play className="h-4 w-4" />
                  {t.openRegister}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Balance Card */}
          {hasOpenRegister && todayRegister && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Opening Cash */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Banknote className="h-3.5 w-3.5" />
                    {t.openingCash}
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {formatCurrency(Number(todayRegister.opening_cash))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {todayRegister.opening_time && format(new Date(todayRegister.opening_time), "hh:mm a")}
                  </div>
                </CardContent>
              </Card>

              {/* Cash In - Clickable */}
              <Card 
                className="border-success/20 bg-success/5 cursor-pointer hover:shadow-md hover:border-success/40 transition-all"
                onClick={handleShowCashInDetails}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <ArrowDownRight className="h-3.5 w-3.5 text-success" />
                    {t.cashIn}
                  </div>
                  <div className="text-xl font-bold text-success">
                    {formatCurrency(
                      todayRegister.total_cash_in !== undefined 
                        ? Number(todayRegister.total_cash_in || 0)
                        : Number(todayRegister.total_cash_sales || 0) + 
                          Number(todayRegister.total_due_collected || 0) + 
                          Number(todayRegister.total_deposits || 0)
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" />
                    {formatCurrency(Number(todayRegister.total_cash_sales || 0))}
                  </div>
                </CardContent>
              </Card>

              {/* Cash Out - Clickable */}
              <Card 
                className="border-destructive/20 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
                onClick={handleShowCashOutDetails}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                    {t.cashOut}
                  </div>
                  <div className="text-xl font-bold text-destructive">
                    {formatCurrency(
                      todayRegister.total_cash_out !== undefined
                        ? Number(todayRegister.total_cash_out || 0)
                        : Number(todayRegister.total_expenses || 0) + 
                          Number(todayRegister.total_withdrawals || 0)
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Receipt className="h-3 w-3" />
                    {formatCurrency(Number(todayRegister.total_expenses || 0))}
                  </div>
                </CardContent>
              </Card>

              {/* Current Balance */}
              <Card className="border-secondary/30 bg-gradient-to-br from-secondary/10 to-primary/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <CircleDollarSign className="h-3.5 w-3.5" />
                    {t.currentBalance}
                  </div>
                  <div className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {formatCurrency(getCurrentCashBalance())}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t.expectedCash}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Today's Breakdown - Simplified */}
          {hasOpenRegister && todayRegister && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">{t.todaySales}</div>
                  <div className="font-semibold text-sm">{formatCurrency(Number(todayRegister.total_sales || 0))}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Banknote className="h-4 w-4 text-success" />
                <div>
                  <div className="text-xs text-muted-foreground">{t.cashSales}</div>
                  <div className="font-semibold text-sm">{formatCurrency(Number(todayRegister.total_cash_sales || 0))}</div>
                </div>
              </div>
              <div 
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                onClick={handleShowDueCollectedDetails}
              >
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <div>
                  <div className="text-xs text-muted-foreground">{t.dueCollected}</div>
                  <div className="font-semibold text-sm">{formatCurrency(Number(todayRegister.total_due_collected || 0))}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <div>
                  <div className="text-xs text-muted-foreground">{t.expenses}</div>
                  <div className="font-semibold text-sm">{formatCurrency(Number(todayRegister.total_expenses || 0))}</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Expenses Section */}
          {hasOpenRegister && todayRegister && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-600" />
                    <CardTitle className="text-sm">{t.quickExpense}</CardTitle>
                    {Number(todayRegister.total_quick_expenses || 0) > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {formatCurrency(Number(todayRegister.total_quick_expenses || 0))}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuickExpenseModal(true)}
                    className="h-7 gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    {t.add}
                  </Button>
                </div>
              </CardHeader>
              {todayRegister.quick_expenses && todayRegister.quick_expenses.length > 0 && (
                <CardContent className="pt-0 px-4 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {todayRegister.quick_expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center gap-2 px-2 py-1 rounded-full bg-background border text-xs"
                      >
                        <span className="font-medium">{formatCurrency(expense.amount)}</span>
                        {expense.description && (
                          <span className="text-muted-foreground">{expense.description}</span>
                        )}
                        <button
                          onClick={() => handleDeleteQuickExpense(expense.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Prompt to open if not open */}
          {!hasOpenRegister && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">{t.openShopFirst}</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                {language === "bn" 
                  ? "শপ চালু করতে এবং আজকের ক্যাশ ট্র্যাক করা শুরু করতে 'শপ খুলুন' বাটনে ক্লিক করুন।"
                  : "Click 'Open Shop' to start tracking today's cash flow."}
              </p>
              <Button
                onClick={() => {
                  setOpeningCash(suggestedOpening.toString());
                  setShowOpenModal(true);
                }}
                className="gap-2 bg-success hover:bg-success/90"
              >
                <Play className="h-4 w-4" />
                {t.openRegister}
              </Button>
              {suggestedOpening > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t.suggestedFromYesterday}: {formatCurrency(suggestedOpening)}
                </p>
              )}
            </div>
          )}

          {/* Closed Register Summary */}
          {todayRegister && todayRegister.status === "closed" && (
            <Card className="border-secondary/30 bg-secondary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {t.summaryTitle}
                  </h4>
                  <Badge variant={todayRegister.cash_difference === 0 ? "default" : todayRegister.cash_difference > 0 ? "secondary" : "destructive"}>
                    {todayRegister.cash_difference === 0 ? t.matchIcon : todayRegister.cash_difference > 0 ? `${t.excessIcon} ${formatCurrency(todayRegister.cash_difference)}` : `${t.shortIcon} ${formatCurrency(Math.abs(todayRegister.cash_difference))}`}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">{t.openingCash}</div>
                    <div className="font-bold">{formatCurrency(Number(todayRegister.opening_cash))}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t.expectedCash}</div>
                    <div className="font-bold">{formatCurrency(Number(todayRegister.expected_cash))}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t.closingCash}</div>
                    <div className="font-bold">{formatCurrency(Number(todayRegister.closing_cash))}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Open Register Modal */}
      <Dialog open={showOpenModal} onOpenChange={setShowOpenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-success" />
              {t.openRegister}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? "আজকের জন্য ক্যাশ রেজিস্টার খুলুন এবং শুরুর টাকার পরিমাণ দিন।"
                : "Open the cash register for today and enter the opening cash amount."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="opening-cash">{t.openingCash} (৳)</Label>
              <Input
                id="opening-cash"
                type="number"
                placeholder="0"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="text-lg font-semibold"
              />
              {suggestedOpening > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t.suggestedFromYesterday}: {formatCurrency(suggestedOpening)}
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 ml-2"
                    onClick={() => setOpeningCash(suggestedOpening.toString())}
                  >
                    {language === "bn" ? "ব্যবহার করুন" : "Use this"}
                  </Button>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t.notes}</Label>
              <Textarea
                id="notes"
                placeholder={language === "bn" ? "ঐচ্ছিক নোট..." : "Optional notes..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenModal(false)}>
              {t.cancel}
            </Button>
            <Button 
              onClick={handleOpenRegister} 
              disabled={isSubmitting}
              className="bg-success hover:bg-success/90"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {t.confirmOpen}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Register Modal */}
      <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Square className="h-5 w-5 text-destructive" />
              {t.closeRegister}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? "দিনশেষে কত টাকা রেজিস্টারে রাখবেন এবং কত টাকা নিয়ে যাবেন সেটি নির্ধারণ করুন।"
                : "Decide how much to keep in register and how much to take home."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Day Summary */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t.daySummary}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground">{t.openingCash}</span>
                    <span className="font-semibold">{formatCurrency(Number(todayRegister?.opening_cash || 0))}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-success/10 rounded">
                    <span className="text-muted-foreground">{t.totalCashIn}</span>
                    <span className="font-semibold text-success">
                      +{formatCurrency(
                        Number(todayRegister?.total_cash_sales || 0) + 
                        Number(todayRegister?.total_due_collected || 0) + 
                        Number(todayRegister?.total_deposits || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-destructive/10 rounded">
                    <span className="text-muted-foreground">{t.totalCashOut}</span>
                    <span className="font-semibold text-destructive">
                      -{formatCurrency(
                        Number(todayRegister?.total_expenses || 0) + 
                        Number(todayRegister?.total_withdrawals || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-primary/10 rounded">
                    <span className="text-muted-foreground font-medium">{t.todaysEarning}</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(
                        Number(todayRegister?.total_cash_sales || 0) + 
                        Number(todayRegister?.total_due_collected || 0) + 
                        Number(todayRegister?.total_deposits || 0) -
                        Number(todayRegister?.total_expenses || 0) - 
                        Number(todayRegister?.total_withdrawals || 0)
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Keep in Register */}
            <div className="space-y-2">
              <Label htmlFor="closing-cash" className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-success" />
                {t.keepInRegister} (৳)
              </Label>
              <Input
                id="closing-cash"
                type="number"
                placeholder={language === "bn" ? "রেজিস্টারে রাখবো..." : "Amount to keep..."}
                value={closingCash}
                onChange={(e) => {
                  const val = e.target.value;
                  setClosingCash(val);
                  // Auto-calculate withdrawal
                  if (val && !isNaN(parseFloat(val))) {
                    const withdrawal = getCurrentCashBalance() - parseFloat(val);
                    setWithdrawalAmount(withdrawal > 0 ? withdrawal.toString() : "0");
                  } else {
                    setWithdrawalAmount("");
                  }
                }}
                className="text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                {language === "bn" ? "আগামীকাল শপ এই টাকা দিয়ে শুরু হবে" : "Shop will start with this amount tomorrow"}
              </p>
            </div>

            {/* Taking Home (Auto-calculated) */}
            <div className="space-y-2">
              <Label htmlFor="withdrawal-amount" className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-blue-500" />
                {t.takeHome} (৳)
              </Label>
              <Input
                id="withdrawal-amount"
                type="number"
                placeholder={language === "bn" ? "নিয়ে যাবো..." : "Taking home..."}
                value={withdrawalAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  setWithdrawalAmount(val);
                  // Auto-calculate closing cash
                  if (val && !isNaN(parseFloat(val))) {
                    const closing = getCurrentCashBalance() - parseFloat(val);
                    setClosingCash(closing > 0 ? closing.toString() : "0");
                  } else {
                    setClosingCash("");
                  }
                }}
                className="text-lg font-semibold border-blue-500/30 focus:border-blue-500"
              />
              {withdrawalAmount && parseFloat(withdrawalAmount) > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  💰 {language === "bn" ? "এই টাকা নিয়ে যাচ্ছেন" : "You're taking this amount"}
                </p>
              )}
            </div>

            {/* Validation Message */}
            {closingCash && (
              <Card className={`${
                // Allow closing if: balance is negative (user can close with 0) OR keeping amount is valid
                getCurrentCashBalance() < 0 || parseFloat(closingCash) <= getCurrentCashBalance() 
                  ? "border-success/30 bg-success/5" 
                  : "border-destructive/30 bg-destructive/5"
              }`}>
                <CardContent className="p-3 flex items-center justify-between">
                  <span className="text-sm">
                    {getCurrentCashBalance() < 0 
                      ? (language === "bn" ? "⚠ ক্যাশ ব্যালেন্স নেগেটিভ - শপ বন্ধ করতে পারবেন" : "⚠ Negative cash balance - you can still close")
                      : parseFloat(closingCash) <= getCurrentCashBalance() 
                        ? (language === "bn" ? "✓ ঠিক আছে" : "✓ Valid")
                        : (language === "bn" ? "⚠ রেজিস্টারে এত টাকা নেই" : "⚠ Not enough cash in register")}
                  </span>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="close-notes">{t.notes}</Label>
              <Textarea
                id="close-notes"
                placeholder={language === "bn" ? "ঐচ্ছিক নোট..." : "Optional notes..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseModal(false)}>
              {t.cancel}
            </Button>
            <Button 
              onClick={handleCloseRegister} 
              disabled={isSubmitting || !closingCash || (getCurrentCashBalance() >= 0 && parseFloat(closingCash) > getCurrentCashBalance())}
              variant="destructive"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Square className="h-4 w-4 mr-2" />}
              {t.confirmClose}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Expense Modal */}
      <Dialog open={showQuickExpenseModal} onOpenChange={setShowQuickExpenseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-600" />
              {t.quickExpenseTitle}
            </DialogTitle>
            <DialogDescription>
              {t.quickExpenseDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Expense Type Selection */}
            <div className="space-y-2">
              <Label>{language === "bn" ? "খরচের ধরন" : "Expense Type"}</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "tea", label: language === "bn" ? "চা/নাস্তা" : "Tea/Snacks", icon: "🍵" },
                  { id: "transport", label: language === "bn" ? "যাতায়াত" : "Transport", icon: "🚗" },
                  { id: "donation", label: language === "bn" ? "ভিক্ষা/দান" : "Donation", icon: "🤲" },
                  { id: "supplies", label: language === "bn" ? "সরঞ্জাম" : "Supplies", icon: "📦" },
                  { id: "utilities", label: language === "bn" ? "বিল" : "Utilities", icon: "💡" },
                  { id: "other", label: language === "bn" ? "অন্যান্য" : "Other", icon: "💰" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setQuickExpenseCategory(type.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      quickExpenseCategory === type.id
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                        : "border-muted hover:border-amber-300"
                    }`}
                  >
                    <span className="text-xl mb-1">{type.icon}</span>
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-amount">{t.amount} (৳)</Label>
              <Input
                id="quick-amount"
                type="number"
                placeholder="0"
                value={quickExpenseAmount}
                onChange={(e) => setQuickExpenseAmount(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-desc">{t.description}</Label>
              <Input
                id="quick-desc"
                placeholder={language === "bn" ? "বিস্তারিত লিখুন (ঐচ্ছিক)" : "Add details (optional)"}
                value={quickExpenseDescription}
                onChange={(e) => setQuickExpenseDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickExpenseModal(false)}>
              {t.cancel}
            </Button>
            <Button 
              onClick={handleAddQuickExpense} 
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {t.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cash In Details Modal */}
      <Dialog open={showCashInModal} onOpenChange={setShowCashInModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-success" />
              {t.cashInDetails}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? "আজকে কোথা থেকে কত টাকা এসেছে সব বিস্তারিত দেখুন।"
                : "View all cash inflow details for today."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingBreakdown ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : cashInBreakdown ? (
              <>
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border-success/20 bg-success/5">
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground">{t.cashSales}</div>
                      <div className="text-lg font-bold text-success">{formatCurrency(cashInBreakdown.total_sales || 0)}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-500/20 bg-emerald-500/5">
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground">{t.dueCollected}</div>
                      <div className="text-lg font-bold text-emerald-600">{formatCurrency(cashInBreakdown.total_due_collected || 0)}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Cash Sales List */}
                {cashInBreakdown.sales && cashInBreakdown.sales.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-success flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      {t.cashSales} ({cashInBreakdown.sales.length})
                    </h4>
                    <div className="space-y-2 max-h-[25vh] overflow-y-auto border rounded-lg p-2">
                      {cashInBreakdown.sales.map((sale: any) => (
                        <div key={sale.id} className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {sale.customer_name || (language === "bn" ? "অজানা" : "Unknown")}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Receipt className="h-3 w-3" />
                                {sale.invoice_number}
                              </span>
                              <span>•</span>
                              <span>{sale.sale_date && format(new Date(sale.sale_date), "hh:mm a")}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {language === "bn" ? "পণ্য মূল্য" : "Product"}: {formatCurrency(Number(sale.sale_total || 0))}
                              {sale.change_given > 0 && (
                                <span className="text-destructive ml-2">
                                  | {language === "bn" ? "ফেরত" : "Change"}: {formatCurrency(sale.change_given)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-success font-semibold">
                            {formatCurrency(Number(sale.received_amount || sale.paid_amount || 0))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Due Collections List */}
                {cashInBreakdown.due_collections && cashInBreakdown.due_collections.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {t.dueCollected} ({cashInBreakdown.due_collections.length})
                    </h4>
                    <div className="space-y-2 max-h-[25vh] overflow-y-auto border rounded-lg p-2">
                      {cashInBreakdown.due_collections.map((collection: any) => (
                        <div key={collection.id} className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {collection.customer_name || (language === "bn" ? "অজানা" : "Unknown")}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {collection.invoice_number && (
                                <>
                                  <span className="flex items-center gap-1">
                                    <Receipt className="h-3 w-3" />
                                    {collection.invoice_number}
                                  </span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{collection.created_at && format(new Date(collection.created_at), "hh:mm a")}</span>
                            </div>
                          </div>
                          <div className="text-emerald-600 font-semibold">
                            {formatCurrency(Number(collection.amount || 0))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!cashInBreakdown.sales || cashInBreakdown.sales.length === 0) && 
                 (!cashInBreakdown.due_collections || cashInBreakdown.due_collections.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">{t.noData}</p>
                )}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">{t.noData}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Due Collected Details Modal */}
      <Dialog open={showDueCollectedModal} onOpenChange={setShowDueCollectedModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              {t.dueCollectedDetails}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? "আজকে কে কত টাকা বাকি শোধ করেছে দেখুন।"
                : "View all due payments collected today."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingBreakdown ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : dueCollectedBreakdown && dueCollectedBreakdown.collections ? (
              <>
                {/* Summary */}
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">{t.dueCollected}</div>
                    <div className="text-lg font-bold text-emerald-600">{formatCurrency(dueCollectedBreakdown.total || 0)}</div>
                  </CardContent>
                </Card>

                {/* Collections List */}
                {dueCollectedBreakdown.collections.length > 0 ? (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {dueCollectedBreakdown.collections.map((collection: any) => (
                      <div key={collection.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {collection.customer_name || (language === "bn" ? "অজানা" : "Unknown")}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {collection.invoice_number && (
                              <>
                                <span className="flex items-center gap-1">
                                  <Receipt className="h-3 w-3" />
                                  {collection.invoice_number}
                                </span>
                                <span>•</span>
                              </>
                            )}
                            <span>{collection.created_at && format(new Date(collection.created_at), "hh:mm a")}</span>
                          </div>
                        </div>
                        <div className="text-emerald-600 font-semibold">
                          {formatCurrency(Number(collection.amount || 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">{t.noData}</p>
                )}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">{t.noData}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cash Out Details Modal */}
      <Dialog open={showCashOutModal} onOpenChange={setShowCashOutModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-destructive" />
              {t.cashOutDetails}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? "আজকে কোথায় কত টাকা খরচ হয়েছে সব বিস্তারিত দেখুন।"
                : "View all cash outflow details for today."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingBreakdown ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : cashOutBreakdown ? (
              <>
                {/* Summary - Clickable Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card 
                    className="border-destructive/20 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
                    onClick={() => {
                      setExpensesData(cashOutBreakdown.expenses || []);
                      setShowExpensesModal(true);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground">{t.expenses}</div>
                      <div className="text-lg font-bold text-destructive">{formatCurrency(cashOutBreakdown.total_expenses || 0)}</div>
                      {cashOutBreakdown.total_cash_expenses !== undefined && cashOutBreakdown.total_cash_expenses !== cashOutBreakdown.total_expenses && (
                        <div className="text-[10px] text-green-600 mt-0.5">
                          {language === "bn" ? `ক্যাশ থেকে: ${formatCurrency(cashOutBreakdown.total_cash_expenses)}` : `From cash: ${formatCurrency(cashOutBreakdown.total_cash_expenses)}`}
                        </div>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-1">{language === "bn" ? "বিস্তারিত দেখুন →" : "View details →"}</div>
                    </CardContent>
                  </Card>
                  <Card 
                    className="border-orange-500/20 bg-orange-500/5 cursor-pointer hover:bg-orange-500/10 transition-colors"
                    onClick={() => {
                      setShowCashOutModal(false);
                      navigate("/offline-shop/purchases");
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground">{t.purchase}</div>
                      <div className="text-lg font-bold text-orange-600">{formatCurrency(cashOutBreakdown.total_purchases || 0)}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{language === "bn" ? "বিস্তারিত দেখুন →" : "View details →"}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground">{t.quickExpenses}</div>
                      <div className="text-lg font-bold text-amber-600">{formatCurrency(cashOutBreakdown.total_quick_expenses || 0)}</div>
                    </CardContent>
                  </Card>
                  <Card 
                    className="border-purple-500/20 bg-purple-500/5 cursor-pointer hover:bg-purple-500/10 transition-colors"
                    onClick={() => {
                      setReturnsData(cashOutBreakdown.returns || []);
                      setShowReturnsModal(true);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="text-xs text-muted-foreground">{t.returns}</div>
                      <div className="text-lg font-bold text-purple-600">{formatCurrency(cashOutBreakdown.total_returns || 0)}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{language === "bn" ? "বিস্তারিত দেখুন →" : "View details →"}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Total Summary */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {language === "bn" ? "মোট ক্যাশ আউট" : "Total Cash Out"}
                    </span>
                    <span className="text-lg font-bold text-destructive">
                      {formatCurrency(cashOutBreakdown.total || 0)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">{t.noData}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Expenses Details Modal */}
      <Dialog open={showExpensesModal} onOpenChange={setShowExpensesModal}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-destructive" />
              {language === "bn" ? "খরচের বিস্তারিত" : "Expenses Details"}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" ? "আজকে ক্যাশ থেকে কত খরচ হয়েছে দেখুন।" : "View all cash expenses for today."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {(() => {
              const cashExpenses = expensesData?.filter((exp: any) => exp.payment_method === 'cash') || [];
              return cashExpenses.length > 0 ? (
                <div className="space-y-2">
                  {cashExpenses.map((expense: any, index: number) => (
                    <div 
                      key={expense.id || index}
                      className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/10"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Receipt className="h-3.5 w-3.5 text-destructive" />
                          {expense.description || expense.category || (language === "bn" ? "খরচ" : "Expense")}
                        </div>
                        {expense.category && expense.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {expense.category}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{expense.created_at && format(new Date(expense.created_at), "hh:mm a")}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-green-500 text-green-600">
                            {language === "bn" ? "ক্যাশ" : "Cash"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-destructive">
                          {formatCurrency(Number(expense.amount || 0))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {language === "bn" ? "মোট ক্যাশ খরচ" : "Total Cash Expenses"}
                      </span>
                      <span className="text-lg font-bold text-destructive">
                        {formatCurrency(cashExpenses.reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{language === "bn" ? "আজকে ক্যাশে কোনো খরচ হয়নি" : "No cash expenses today"}</p>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Returns Details Modal */}
      <Dialog open={showReturnsModal} onOpenChange={setShowReturnsModal}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-purple-600" />
              {t.returnDetails}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" ? "আজকে রিটার্ন থেকে কত টাকা দেওয়া হয়েছে দেখুন।" : "View all return refunds/losses for today."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {returnsData && returnsData.length > 0 ? (
              <div className="space-y-2">
                {returnsData.map((returnItem: any, index: number) => (
                  <div 
                    key={returnItem.id || index}
                    className="flex items-center justify-between p-3 bg-purple-500/5 rounded-lg border border-purple-500/10"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Package className="h-3.5 w-3.5 text-purple-600" />
                        {returnItem.product_name || (language === "bn" ? "পণ্য" : "Product")}
                      </div>
                      {returnItem.reason && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t.reason}: {returnItem.reason}
                        </div>
                      )}
                      {returnItem.customer_name && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t.customer}: {returnItem.customer_name}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{returnItem.created_at && format(new Date(returnItem.created_at), "hh:mm a")}</span>
                        <span>•</span>
                        <Badge variant="outline" className={`text-[10px] px-1 py-0 ${returnItem.is_resellable ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}`}>
                          {returnItem.is_resellable ? t.refund : t.loss}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {formatCurrency(Number(returnItem.cash_amount || 0))}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {language === "bn" ? "মোট রিটার্ন ক্যাশ আউট" : "Total Return Cash Out"}
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      {formatCurrency(returnsData.reduce((sum: number, r: any) => sum + Number(r.cash_amount || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCcw className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{t.noReturns}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
