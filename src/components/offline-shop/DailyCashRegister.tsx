import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOfflineCashRegister } from "@/hooks/useOfflineShopData";
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
  Coffee,
  X,
  WifiOff,
  Wifi,
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
  const {
    register: todayRegister,
    loading: isLoading,
    refetch,
    openRegister,
    closeRegister,
  } = useOfflineCashRegister();
  
  const hasOpenRegister = todayRegister?.status === 'open';
  const registers: any[] = todayRegister ? [todayRegister] : [];
  
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickExpenseAmount, setQuickExpenseAmount] = useState("");
  const [quickExpenseDescription, setQuickExpenseDescription] = useState("");
  
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
      const result = await closeRegister(parseFloat(closingCash), notes);
      toast.success(result.message);
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
    toast.info(language === "bn" ? "এই ফিচারটি এখনো উপলব্ধ নয়" : "This feature is not available yet");
  };

  const handleDeleteQuickExpense = async (expenseId: string) => {
    toast.info(language === "bn" ? "এই ফিচারটি এখনো উপলব্ধ নয়" : "This feature is not available yet");
  };

  const getCurrentCashBalance = () => {
    if (!todayRegister) return 0;
    return Number(todayRegister.opening_cash) + 
           Number(todayRegister.total_cash_sales || 0) + 
           Number(todayRegister.total_due_collected || 0) + 
           Number(todayRegister.total_deposits || 0) - 
           Number(todayRegister.total_expenses || 0) - 
           Number(todayRegister.total_withdrawals || 0);
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
                    setClosingCash(getCurrentCashBalance().toString());
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

              {/* Cash In */}
              <Card className="border-success/20 bg-success/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <ArrowDownRight className="h-3.5 w-3.5 text-success" />
                    {t.cashIn}
                  </div>
                  <div className="text-xl font-bold text-success">
                    {formatCurrency(
                      Number(todayRegister.total_cash_sales || 0) + 
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

              {/* Cash Out */}
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                    {t.cashOut}
                  </div>
                  <div className="text-xl font-bold text-destructive">
                    {formatCurrency(
                      Number(todayRegister.total_expenses || 0) + 
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
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
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
                    <Coffee className="h-4 w-4 text-amber-600" />
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Square className="h-5 w-5 text-destructive" />
              {t.closeRegister}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? "আজকের ক্যাশ রেজিস্টার বন্ধ করুন এবং ক্লোজিং টাকার পরিমাণ দিন।"
                : "Close the cash register for today and enter the closing cash amount."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t.expectedCash}</span>
                  <span className="font-bold text-lg">{formatCurrency(getCurrentCashBalance())}</span>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-2">
              <Label htmlFor="closing-cash">{t.closingCash} (৳)</Label>
              <Input
                id="closing-cash"
                type="number"
                placeholder="0"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                className="text-lg font-semibold"
              />
              {closingCash && (
                <p className={`text-xs ${parseFloat(closingCash) === getCurrentCashBalance() ? "text-success" : parseFloat(closingCash) > getCurrentCashBalance() ? "text-blue-500" : "text-destructive"}`}>
                  {parseFloat(closingCash) === getCurrentCashBalance() 
                    ? `✓ ${t.matchIcon}`
                    : parseFloat(closingCash) > getCurrentCashBalance()
                    ? `↑ ${t.excessIcon}: ${formatCurrency(parseFloat(closingCash) - getCurrentCashBalance())}`
                    : `↓ ${t.shortIcon}: ${formatCurrency(getCurrentCashBalance() - parseFloat(closingCash))}`}
                </p>
              )}
            </div>
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
              disabled={isSubmitting}
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
              <Coffee className="h-5 w-5 text-amber-600" />
              {t.quickExpenseTitle}
            </DialogTitle>
            <DialogDescription>
              {t.quickExpenseDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                placeholder={language === "bn" ? "চা, নাস্তা, ভিক্ষা..." : "Tea, snacks, donation..."}
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

      {/* History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t.history} - {t.last7Days}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? "গত সাত দিনের ক্যাশ রেজিস্টার হিস্ট্রি দেখুন।"
                : "View cash register history for the last seven days."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {registers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t.noHistory}</p>
            ) : (
              registers.slice(0, 7).map((reg) => (
                <Card key={reg.id} className={`${reg.status === "open" ? "border-success/30 bg-success/5" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{format(new Date(reg.register_date), "dd MMM yyyy")}</span>
                        <Badge variant={reg.status === "open" ? "default" : "secondary"} className="text-xs">
                          {reg.status === "open" ? t.shopOpen : t.shopClosed}
                        </Badge>
                      </div>
                      {reg.cash_difference !== 0 && reg.status === "closed" && (
                        <Badge variant={reg.cash_difference > 0 ? "secondary" : "destructive"} className="text-xs">
                          {reg.cash_difference > 0 ? `+${formatCurrency(reg.cash_difference)}` : formatCurrency(reg.cash_difference)}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">{t.openingCash}</div>
                        <div className="font-semibold">{formatCurrency(Number(reg.opening_cash))}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">{t.todaySales}</div>
                        <div className="font-semibold text-success">{formatCurrency(Number(reg.total_sales || 0))}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">{t.expenses}</div>
                        <div className="font-semibold text-destructive">{formatCurrency(Number(reg.total_expenses || 0))}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">{t.closingCash}</div>
                        <div className="font-semibold">{reg.closing_cash !== null ? formatCurrency(Number(reg.closing_cash)) : "-"}</div>
                      </div>
                    </div>
                    {reg.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">"{reg.notes}"</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
