import { useState, useEffect, useMemo } from "react";
import { Plus, Wallet, Trash2, Calendar, WifiOff, Cloud, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { useOfflineExpenses, useOfflineSettings } from "@/hooks/useOfflineData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShop } from "@/contexts/ShopContext";
import { DeleteConfirmDialog } from "@/components/offline-shop/DeleteConfirmDialog";
import DateRangeFilter, { DateRangePreset, DateRange, getDateRangeFromPreset } from "@/components/offline-shop/DateRangeFilter";
import { isWithinInterval } from "date-fns";

interface Expense {
  id: string;
  category: string;
  description?: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  notes?: string;
}

const ShopExpenses = () => {
  const { t, language } = useLanguage();
  const { currentShop } = useShop();
  const { expenses, loading: isLoading, refetch, createExpense, deleteExpense } = useOfflineExpenses();
  const { settings } = useOfflineSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRangePreset>('this_month');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  const expenseCategories = [
    { value: "ভাড়া", label: t("shop.rent") },
    { value: "বিদ্যুৎ বিল", label: t("shop.electricity") },
    { value: "পানির বিল", label: t("shop.water") },
    { value: "ইন্টারনেট", label: t("shop.internet") },
    { value: "কর্মচারী বেতন", label: t("shop.salary") },
    { value: "পরিবহন", label: t("shop.transport") },
    { value: "মার্কেটিং", label: t("shop.marketing") },
    { value: "রক্ষণাবেক্ষণ", label: t("shop.maintenance") },
    { value: "অফিস সাপ্লাই", label: t("shop.officeSupply") },
    { value: "অন্যান্য", label: t("shop.other") },
  ];

  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    notes: "",
    paid_from_cash: true, // New field for cash deduction
  });

  useEffect(() => {
    if (currentShop?.id) {
      refetch();
    }
  }, [currentShop?.id, refetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExpense({
        ...formData,
        amount: parseFloat(formData.amount) || 0,
      });
      toast.success(t("shop.expenseAdded"));
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteExpense(deletingId);
      toast.success(language === "bn" ? "খরচ ট্র্যাশে সরানো হয়েছে" : "Expense moved to trash");
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    } finally {
      setIsDeleting(false);
    }
  };


  const resetForm = () => {
    setFormData({
      category: "",
      description: "",
      amount: "",
      expense_date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      notes: "",
      paid_from_cash: true,
    });
  };

  const currency = settings?.currency || "BDT";
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filter expenses by date range
  const currentDateRange = getDateRangeFromPreset(dateRange, customDateRange);
  const filteredExpenses = (expenses as Expense[]).filter(expense => {
    const expenseDate = new Date(expense.expense_date);
    return isWithinInterval(expenseDate, { start: currentDateRange.from, end: currentDateRange.to });
  });

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const handleDateRangeChange = (range: DateRangePreset, dates: DateRange) => {
    setDateRange(range);
    if (range === 'custom') {
      setCustomDateRange(dates);
    }
  };

  return (
    <ShopLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{t("shop.expensesTitle")}</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t("shop.expensesDesc")} • {filteredExpenses.length} {language === "bn" ? "টি খরচ" : "expenses"}
                </p>
              </div>
            </div>
            <DateRangeFilter
              selectedRange={dateRange}
              onRangeChange={handleDateRangeChange}
              customDateRange={customDateRange}
              compact
            />
          </div>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} size="sm" className="w-fit text-xs sm:text-sm">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            {t("shop.newExpense")}
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-full bg-orange-500/10">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">{t("shop.totalExpenses")}</p>
                <p className="text-xl sm:text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[450px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">{t("shop.date")}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("shop.category")}</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">{t("shop.description")}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("shop.amount")}</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">{t("shop.payment")}</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm w-16">{t("shop.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">{t("common.loading")}</TableCell>
                  </TableRow>
                ) : filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p>{t("shop.noExpenses")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="p-2 sm:p-4 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 hidden sm:inline" />
                          {new Date(expense.expense_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <Badge variant="outline" className="text-[10px] sm:text-xs">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4 hidden sm:table-cell text-xs sm:text-sm max-w-[150px] truncate">{expense.description || "-"}</TableCell>
                      <TableCell className="p-2 sm:p-4 font-medium text-xs sm:text-sm whitespace-nowrap">{formatCurrency(Number(expense.amount))}</TableCell>
                      <TableCell className="p-2 sm:p-4 hidden md:table-cell text-xs sm:text-sm">{expense.payment_method}</TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => openDeleteDialog(expense.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                        </Button>

                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("shop.newExpense")}</DialogTitle>
            <DialogDescription>{t("shop.expenseDetails")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("shop.category")} *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("shop.select")} />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("shop.description")}</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("shop.amount")} *</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("shop.date")}</Label>
                <Input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("shop.paymentMethod")}</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t("shop.cashPayment")}</SelectItem>
                  <SelectItem value="bkash">{t("shop.bkash")}</SelectItem>
                  <SelectItem value="nagad">{t("shop.nagad")}</SelectItem>
                  <SelectItem value="bank">{t("shop.bank")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Paid from Cash Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <Checkbox
                id="paid_from_cash"
                checked={formData.paid_from_cash}
                onCheckedChange={(checked) => setFormData({ ...formData, paid_from_cash: !!checked })}
              />
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-green-600" />
                <Label htmlFor="paid_from_cash" className="text-sm font-medium cursor-pointer">
                  {language === "bn" ? "ক্যাশ থেকে টাকা কাটা হবে" : "Deduct from Cash"}
                </Label>
              </div>
            </div>
            {formData.paid_from_cash && (
              <p className="text-xs text-muted-foreground -mt-2">
                {language === "bn" 
                  ? "এই খরচ ক্যাশ আউট হিসাবে রেকর্ড হবে এবং আপনার ক্যাশ ব্যালেন্স থেকে কমে যাবে"
                  : "This expense will be recorded as Cash Out and deducted from your cash balance"}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("common.add")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeletingId(null);
        }}
        onConfirm={handleDelete}
        title={language === "en" ? "expense" : "খরচ"}
        itemCount={1}
        isSoftDelete={true}
        isLoading={isDeleting}
      />
    </ShopLayout>

  );
};

export default ShopExpenses;