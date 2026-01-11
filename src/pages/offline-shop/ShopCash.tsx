import { useState, useEffect, useMemo } from "react";
import { Download, TrendingUp, TrendingDown, DollarSign, Wallet, Users, Truck, ArrowUpRight, ArrowDownRight, Calculator, PiggyBank, Receipt, ShoppingBag, Package, Warehouse, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { offlineShopService } from "@/services/offlineShopService";
import * as XLSX from "xlsx";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShop } from "@/contexts/ShopContext";
import { useNavigate } from "react-router-dom";
import DateRangeFilter, { DateRangePreset, DateRange, getDateRangeFromPreset } from "@/components/offline-shop/DateRangeFilter";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { FullBusinessGrowthInsight } from "@/components/offline-shop/FullBusinessGrowthInsight";

interface SummaryData {
  totalSales: number;
  totalSalesCount: number;
  totalPurchases: number;
  totalPurchasesCount: number;
  totalExpenses: number;
  totalExpensesCount: number;
  totalProfit: number;
  totalCustomerDue: number;
  totalSupplierDue: number;
  customersWithDue: any[];
  suppliersWithDue: any[];
  recentSales: any[];
  recentPurchases: any[];
  recentExpenses: any[];
  // Stock values
  totalStockPurchaseValue: number;
  totalStockSellingValue: number;
  totalProductsCount: number;
}

interface RawData {
  sales: any[];
  purchases: any[];
  expenses: any[];
  customers: any[];
  suppliers: any[];
  products: any[];
}

const ShopCash = () => {
  const { t, language } = useLanguage();
  const { currentShop } = useShop();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [rawData, setRawData] = useState<RawData>({
    sales: [],
    purchases: [],
    expenses: [],
    customers: [],
    suppliers: [],
    products: [],
  });
  
  // Date filter state
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('this_year');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset('this_year'));
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  const handleDateRangeChange = (preset: DateRangePreset, dates: DateRange) => {
    setDateRangePreset(preset);
    setDateRange(dates);
    if (preset === 'custom') {
      setCustomDateRange(dates);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [salesRes, purchasesRes, expensesRes, customersRes, suppliersRes, productsRes] = await Promise.all([
        offlineShopService.getSales(),
        offlineShopService.getPurchases(),
        offlineShopService.getExpenses(),
        offlineShopService.getCustomers(),
        offlineShopService.getSuppliers(),
        offlineShopService.getProducts(),
      ]);

      setRawData({
        sales: salesRes.sales || [],
        purchases: purchasesRes.purchases || [],
        expenses: expensesRes.expenses || [],
        customers: customersRes.customers || [],
        suppliers: suppliersRes.suppliers || [],
        products: productsRes.products || [],
      });
    } catch (error) {
      toast.error(t("shop.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentShop?.id]);

  // Compute filtered summary based on date range
  const summaryData = useMemo<SummaryData>(() => {
    const { sales, purchases, expenses, customers, suppliers, products } = rawData;
    
    // Filter by date range
    const filteredSales = sales.filter((s: any) => {
      const saleDate = new Date(s.sale_date);
      return isWithinInterval(saleDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
    });
    
    const filteredPurchases = purchases.filter((p: any) => {
      const purchaseDate = new Date(p.purchase_date);
      return isWithinInterval(purchaseDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
    });
    
    const filteredExpenses = expenses.filter((e: any) => {
      const expenseDate = new Date(e.expense_date);
      return isWithinInterval(expenseDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
    });
    
    // Calculate totals
    const totalSales = filteredSales.reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);
    const totalPurchases = filteredPurchases.reduce((sum: number, p: any) => sum + Number(p.total_amount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const totalProfit = filteredSales.reduce((sum: number, s: any) => sum + Number(s.total_profit || 0), 0);

    // Due calculations (not date filtered - show all due)
    const customersWithDue = customers.filter((c: any) => Number(c.total_due) > 0);
    const suppliersWithDue = suppliers.filter((s: any) => Number(s.total_due) > 0);
    const totalCustomerDue = customersWithDue.reduce((sum: number, c: any) => sum + Number(c.total_due), 0);
    const totalSupplierDue = suppliersWithDue.reduce((sum: number, s: any) => sum + Number(s.total_due), 0);

    // Stock values (not date filtered - show current stock)
    const totalStockPurchaseValue = products.reduce((sum: number, p: any) => 
      sum + (Number(p.purchase_price || 0) * Number(p.stock_quantity || 0)), 0);
    const totalStockSellingValue = products.reduce((sum: number, p: any) => 
      sum + (Number(p.selling_price || 0) * Number(p.stock_quantity || 0)), 0);

    return {
      totalSales,
      totalSalesCount: filteredSales.length,
      totalPurchases,
      totalPurchasesCount: filteredPurchases.length,
      totalExpenses,
      totalExpensesCount: filteredExpenses.length,
      totalProfit,
      totalCustomerDue,
      totalSupplierDue,
      customersWithDue,
      suppliersWithDue,
      recentSales: filteredSales.slice(0, 10),
      recentPurchases: filteredPurchases.slice(0, 10),
      recentExpenses: filteredExpenses.slice(0, 10),
      totalStockPurchaseValue,
      totalStockSellingValue,
      totalProductsCount: products.length,
    };
  }, [rawData, dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = () => {
    const summarySheet = [
      { [language === "bn" ? "বিবরণ" : "Description"]: language === "bn" ? "মোট বিক্রয়" : "Total Sales", [language === "bn" ? "পরিমাণ" : "Amount"]: summaryData.totalSales },
      { [language === "bn" ? "বিবরণ" : "Description"]: language === "bn" ? "মোট লাভ" : "Total Profit", [language === "bn" ? "পরিমাণ" : "Amount"]: summaryData.totalProfit },
      { [language === "bn" ? "বিবরণ" : "Description"]: language === "bn" ? "মোট ক্রয়" : "Total Purchases", [language === "bn" ? "পরিমাণ" : "Amount"]: summaryData.totalPurchases },
      { [language === "bn" ? "বিবরণ" : "Description"]: language === "bn" ? "মোট খরচ" : "Total Expenses", [language === "bn" ? "পরিমাণ" : "Amount"]: summaryData.totalExpenses },
      { [language === "bn" ? "বিবরণ" : "Description"]: language === "bn" ? "গ্রাহক বাকি" : "Customer Due", [language === "bn" ? "পরিমাণ" : "Amount"]: summaryData.totalCustomerDue },
      { [language === "bn" ? "বিবরণ" : "Description"]: language === "bn" ? "সরবরাহকারী বাকি" : "Supplier Due", [language === "bn" ? "পরিমাণ" : "Amount"]: summaryData.totalSupplierDue },
    ];

    const ws = XLSX.utils.json_to_sheet(summarySheet);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, language === "bn" ? "ব্যবসার সারাংশ" : "Business Summary");
    XLSX.writeFile(wb, "business-summary.xlsx");
    toast.success(t("shop.excelDownloaded"));
  };

  // Net income = Sales - Purchases - Expenses
  const netIncome = summaryData.totalSales - summaryData.totalPurchases - summaryData.totalExpenses;

  return (
    <ShopLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {language === "bn" ? "ব্যবসার সারাংশ" : "Business Summary"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {language === "bn" ? "আয়, ব্যয়, লাভ ও বাকির সম্পূর্ণ হিসাব" : "Complete income, expense, profit & due overview"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter
              selectedRange={dateRangePreset}
              onRangeChange={handleDateRangeChange}
              customDateRange={customDateRange}
              compact
            />
            <Button variant="outline" onClick={handleExport} size="sm" className="text-xs sm:text-sm">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {t("common.export")}
            </Button>
          </div>
        </div>

        {/* Main Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Sales (Income) */}
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === "bn" ? "মোট বিক্রয় (আয়)" : "Total Sales (Income)"}
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summaryData.totalSales)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summaryData.totalSalesCount} {language === "bn" ? "টি বিক্রয়" : "sales"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Purchases */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === "bn" ? "মোট ক্রয়" : "Total Purchases"}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(summaryData.totalPurchases)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summaryData.totalPurchasesCount} {language === "bn" ? "টি ক্রয়" : "purchases"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === "bn" ? "মোট খরচ" : "Total Expenses"}
                  </p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(summaryData.totalExpenses)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summaryData.totalExpensesCount} {language === "bn" ? "টি খরচ" : "expenses"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card className={`bg-gradient-to-br ${summaryData.totalProfit >= 0 ? 'from-green-500/10 to-green-600/5 border-green-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === "bn" ? "মোট লাভ" : "Total Profit"}
                  </p>
                  <p className={`text-2xl font-bold ${summaryData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summaryData.totalProfit)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === "bn" ? "বিক্রয় থেকে লাভ" : "Profit from sales"}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full ${summaryData.totalProfit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                  <PiggyBank className={`h-6 w-6 ${summaryData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Value Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Stock Purchase Value */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === "bn" ? "মোট স্টক মূল্য (ক্রয়)" : "Total Stock Value (Purchases)"}
                  </p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(summaryData.totalStockPurchaseValue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summaryData.totalProductsCount} {language === "bn" ? "টি প্রোডাক্টের মোট ক্রয় মূল্য" : "products total purchase cost"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Warehouse className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Selling Value */}
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === "bn" ? "মোট স্টক মূল্য (বিক্রয়)" : "Total Stock Value (Selling)"}
                  </p>
                  <p className="text-2xl font-bold text-cyan-600">{formatCurrency(summaryData.totalStockSellingValue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === "bn" ? "বিক্রয়যোগ্য স্টকের মোট মূল্য" : "Total value for selling"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Tags className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Net Income Card */}
        <Card className={`${netIncome >= 0 ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 border-emerald-500/30' : 'bg-gradient-to-r from-red-500/20 to-orange-500/10 border-red-500/30'}`}>
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-full ${netIncome >= 0 ? 'bg-emerald-500/30' : 'bg-red-500/30'} flex items-center justify-center`}>
                  <Calculator className={`h-8 w-8 ${netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "bn" ? "নিট আয় (বিক্রয় - ক্রয় - খরচ)" : "Net Income (Sales - Purchases - Expenses)"}
                  </p>
                  <p className={`text-3xl font-bold ${netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(netIncome)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {netIncome >= 0 ? (
                  <Badge variant="default" className="bg-emerald-500 text-white">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {language === "bn" ? "লাভে আছেন" : "Profitable"}
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    {language === "bn" ? "লোকসানে আছেন" : "Loss"}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Due Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Due */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-lg">{language === "bn" ? "গ্রাহক বাকি" : "Customer Due"}</CardTitle>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  {summaryData.customersWithDue.length} {language === "bn" ? "জন" : "customers"}
                </Badge>
              </div>
              <CardDescription>
                {language === "bn" ? "গ্রাহকদের কাছে আপনার পাওনা" : "Amount owed to you by customers"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-500 mb-4">{formatCurrency(summaryData.totalCustomerDue)}</p>
              {summaryData.customersWithDue.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {summaryData.customersWithDue.slice(0, 5).map((c: any) => (
                    <div key={c.id} className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">{c.name}</span>
                      <span className="font-semibold text-amber-600">{formatCurrency(Number(c.total_due))}</span>
                    </div>
                  ))}
                  {summaryData.customersWithDue.length > 5 && (
                    <Button variant="link" className="w-full" onClick={() => navigate("/offline-shop/due-customers")}>
                      {language === "bn" ? `আরও ${summaryData.customersWithDue.length - 5} জন দেখুন` : `View ${summaryData.customersWithDue.length - 5} more`}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {language === "bn" ? "কোন গ্রাহকের বাকি নেই" : "No customer dues"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Supplier Due */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-lg">{language === "bn" ? "সরবরাহকারী বাকি" : "Supplier Due"}</CardTitle>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  {summaryData.suppliersWithDue.length} {language === "bn" ? "জন" : "suppliers"}
                </Badge>
              </div>
              <CardDescription>
                {language === "bn" ? "সরবরাহকারীদের কাছে আপনার দেনা" : "Amount you owe to suppliers"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-500 mb-4">{formatCurrency(summaryData.totalSupplierDue)}</p>
              {summaryData.suppliersWithDue.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {summaryData.suppliersWithDue.slice(0, 5).map((s: any) => (
                    <div key={s.id} className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">{s.name}</span>
                      <span className="font-semibold text-orange-600">{formatCurrency(Number(s.total_due))}</span>
                    </div>
                  ))}
                  {summaryData.suppliersWithDue.length > 5 && (
                    <Button variant="link" className="w-full" onClick={() => navigate("/offline-shop/suppliers")}>
                      {language === "bn" ? `আরও ${summaryData.suppliersWithDue.length - 5} জন দেখুন` : `View ${summaryData.suppliersWithDue.length - 5} more`}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {language === "bn" ? "কোন সরবরাহকারীর বাকি নেই" : "No supplier dues"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Business Growth Insight Section */}
        <FullBusinessGrowthInsight />

        {/* Recent Transactions Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "bn" ? "সাম্প্রতিক লেনদেন" : "Recent Transactions"}</CardTitle>
            <CardDescription>
              {language === "bn" ? "আপনার সাম্প্রতিক বিক্রয়, ক্রয় ও খরচ" : "Your recent sales, purchases and expenses"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sales" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  {language === "bn" ? "বিক্রয়" : "Sales"}
                </TabsTrigger>
                <TabsTrigger value="purchases" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {language === "bn" ? "ক্রয়" : "Purchases"}
                </TabsTrigger>
                <TabsTrigger value="expenses" className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  {language === "bn" ? "খরচ" : "Expenses"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sales" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "bn" ? "তারিখ" : "Date"}</TableHead>
                      <TableHead>{language === "bn" ? "ইনভয়েস" : "Invoice"}</TableHead>
                      <TableHead>{language === "bn" ? "পরিমাণ" : "Amount"}</TableHead>
                      <TableHead>{language === "bn" ? "লাভ" : "Profit"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">{t("common.loading")}</TableCell>
                      </TableRow>
                    ) : summaryData.recentSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {language === "bn" ? "কোন বিক্রয় নেই" : "No sales yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      summaryData.recentSales.map((sale: any) => (
                        <TableRow key={sale.id}>
                          <TableCell>{new Date(sale.sale_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}</TableCell>
                          <TableCell><Badge variant="outline">{sale.invoice_number}</Badge></TableCell>
                          <TableCell className="text-emerald-600 font-medium">
                            <ArrowUpRight className="h-4 w-4 inline mr-1" />
                            {formatCurrency(Number(sale.total))}
                          </TableCell>
                          <TableCell className="text-green-600">{formatCurrency(Number(sale.total_profit || 0))}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {summaryData.recentSales.length > 0 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={() => navigate("/offline-shop/sales")}>
                      {language === "bn" ? "সব বিক্রয় দেখুন" : "View All Sales"}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="purchases" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "bn" ? "তারিখ" : "Date"}</TableHead>
                      <TableHead>{language === "bn" ? "সরবরাহকারী" : "Supplier"}</TableHead>
                      <TableHead>{language === "bn" ? "পরিমাণ" : "Amount"}</TableHead>
                      <TableHead>{language === "bn" ? "বাকি" : "Due"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">{t("common.loading")}</TableCell>
                      </TableRow>
                    ) : summaryData.recentPurchases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {language === "bn" ? "কোন ক্রয় নেই" : "No purchases yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      summaryData.recentPurchases.map((purchase: any) => (
                        <TableRow key={purchase.id}>
                          <TableCell>{new Date(purchase.purchase_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}</TableCell>
                          <TableCell>{purchase.supplier_name || "-"}</TableCell>
                          <TableCell className="text-blue-600 font-medium">
                            <ArrowDownRight className="h-4 w-4 inline mr-1" />
                            {formatCurrency(Number(purchase.total_amount))}
                          </TableCell>
                          <TableCell>
                            {Number(purchase.due_amount) > 0 ? (
                              <Badge variant="destructive">{formatCurrency(Number(purchase.due_amount))}</Badge>
                            ) : (
                              <Badge variant="secondary">{language === "bn" ? "পরিশোধিত" : "Paid"}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {summaryData.recentPurchases.length > 0 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={() => navigate("/offline-shop/purchases")}>
                      {language === "bn" ? "সব ক্রয় দেখুন" : "View All Purchases"}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="expenses" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "bn" ? "তারিখ" : "Date"}</TableHead>
                      <TableHead>{language === "bn" ? "ক্যাটাগরি" : "Category"}</TableHead>
                      <TableHead>{language === "bn" ? "বিবরণ" : "Description"}</TableHead>
                      <TableHead>{language === "bn" ? "পরিমাণ" : "Amount"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">{t("common.loading")}</TableCell>
                      </TableRow>
                    ) : summaryData.recentExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {language === "bn" ? "কোন খরচ নেই" : "No expenses yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      summaryData.recentExpenses.map((expense: any) => (
                        <TableRow key={expense.id}>
                          <TableCell>{new Date(expense.expense_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}</TableCell>
                          <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                          <TableCell className="max-w-xs truncate">{expense.description || "-"}</TableCell>
                          <TableCell className="text-red-600 font-medium">
                            <ArrowDownRight className="h-4 w-4 inline mr-1" />
                            {formatCurrency(Number(expense.amount))}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {summaryData.recentExpenses.length > 0 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={() => navigate("/offline-shop/expenses")}>
                      {language === "bn" ? "সব খরচ দেখুন" : "View All Expenses"}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Info */}
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-emerald-500" />
                <span>{language === "bn" ? "বিক্রয়: Sales মডিউল থেকে" : "Sales: From Sales module"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span>{language === "bn" ? "ক্রয়: Purchases মডিউল থেকে" : "Purchases: From Purchases module"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-red-500" />
                <span>{language === "bn" ? "খরচ: Expenses মডিউল থেকে" : "Expenses: From Expenses module"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ShopLayout>
  );
};

export default ShopCash;
