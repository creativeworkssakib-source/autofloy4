import { useState } from "react";
import { Download, FileText, Calendar, TrendingUp, Package, BarChart3, WifiOff, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { useOfflineReports } from "@/hooks/useOfflineShopData";
import { useLanguage } from "@/contexts/LanguageContext";
import * as XLSX from "xlsx";
import DateRangeFilter, { DateRangePreset, DateRange, getDateRangeFromPreset } from "@/components/offline-shop/DateRangeFilter";
import { format } from "date-fns";
import { FullBusinessGrowthInsight } from "@/components/offline-shop/FullBusinessGrowthInsight";

const ShopReports = () => {
  const { t, language } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRangePreset>('this_month');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'inventory'>('sales');

  const handleDateRangeChange = (range: DateRangePreset, dates: DateRange) => {
    setDateRange(range);
    if (range === 'custom') {
      setCustomDateRange(dates);
    }
  };

  const currentDates = getDateRangeFromPreset(dateRange, customDateRange);
  const startDate = format(currentDates.from, 'yyyy-MM-dd');
  const endDate = format(currentDates.to, 'yyyy-MM-dd');

  // Use offline-first reports hook
  const { reportData, loading: isLoading, fromCache, isOnline, refetch } = useOfflineReports(
    activeTab,
    startDate,
    endDate
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'sales' | 'expenses' | 'inventory');
  };

  const downloadReport = () => {
    if (!reportData) return;

    let data: any[] = [];
    let filename = "";
    const dateStr = `${format(currentDates.from, 'dd-MM-yyyy')}_to_${format(currentDates.to, 'dd-MM-yyyy')}`;

    if (activeTab === "sales") {
      const sales = reportData.records || [];
      data = sales.map((s: any) => {
        const customerName = s.customer?.name || (s.notes?.match(/Customer: ([^(]+)/)?.[1]?.trim()) || t("shop.walkInCustomer");
        const customerPhone = s.customer?.phone || (s.notes?.match(/\(([^)]+)\)/)?.[1]?.trim()) || "";
        
        // Get items details
        const itemsDetails = (s.items || []).map((item: any) => 
          `${item.product_name} x${item.quantity} @${item.unit_price}`
        ).join("; ");
        
        return {
          [language === "bn" ? "ইনভয়েস নম্বর" : "Invoice No"]: s.invoice_number,
          [language === "bn" ? "তারিখ" : "Date"]: format(new Date(s.sale_date), 'dd/MM/yyyy hh:mm a'),
          [language === "bn" ? "গ্রাহকের নাম" : "Customer Name"]: customerName,
          [language === "bn" ? "ফোন নম্বর" : "Phone"]: customerPhone,
          [language === "bn" ? "পণ্য বিবরণ" : "Items"]: itemsDetails,
          [language === "bn" ? "সাবটোটাল" : "Subtotal"]: Number(s.subtotal) || 0,
          [language === "bn" ? "ডিসকাউন্ট" : "Discount"]: Number(s.discount) || 0,
          [language === "bn" ? "ট্যাক্স" : "Tax"]: Number(s.tax) || 0,
          [language === "bn" ? "মোট" : "Total"]: Number(s.total) || 0,
          [language === "bn" ? "পেইড" : "Paid"]: Number(s.paid_amount) || 0,
          [language === "bn" ? "বাকি" : "Due"]: Number(s.due_amount) || 0,
          [language === "bn" ? "পেমেন্ট মেথড" : "Payment Method"]: s.payment_method || "cash",
          [language === "bn" ? "স্ট্যাটাস" : "Status"]: s.payment_status === "paid" 
            ? (language === "bn" ? "পরিশোধিত" : "Paid") 
            : (language === "bn" ? "বাকি" : "Due"),
        };
      });
      filename = `sales-report-${dateStr}.xlsx`;
    } else if (activeTab === "expenses") {
      const expenses = reportData.records || [];
      data = expenses.map((e: any) => ({
        [language === "bn" ? "তারিখ" : "Date"]: format(new Date(e.expense_date), 'dd/MM/yyyy'),
        [language === "bn" ? "ক্যাটাগরি" : "Category"]: e.category,
        [language === "bn" ? "বিবরণ" : "Description"]: e.description || "",
        [language === "bn" ? "পরিমাণ" : "Amount"]: Number(e.amount) || 0,
        [language === "bn" ? "পেমেন্ট মেথড" : "Payment Method"]: e.payment_method || "",
        [language === "bn" ? "নোট" : "Notes"]: e.notes || "",
      }));
      filename = `expenses-report-${dateStr}.xlsx`;
    } else if (activeTab === "inventory") {
      const products = reportData.records || [];
      data = products.map((p: any) => ({
        [language === "bn" ? "পণ্যের নাম" : "Product Name"]: p.name,
        [language === "bn" ? "SKU" : "SKU"]: p.sku || "",
        [language === "bn" ? "বারকোড" : "Barcode"]: p.barcode || "",
        [language === "bn" ? "ক্যাটাগরি" : "Category"]: p.category?.name || "",
        [language === "bn" ? "ক্রয় মূল্য" : "Purchase Price"]: Number(p.purchase_price) || 0,
        [language === "bn" ? "বিক্রয় মূল্য" : "Selling Price"]: Number(p.selling_price) || 0,
        [language === "bn" ? "স্টক পরিমাণ" : "Stock Qty"]: Number(p.stock_quantity) || 0,
        [language === "bn" ? "স্টক মূল্য" : "Stock Value"]: (Number(p.purchase_price) || 0) * (Number(p.stock_quantity) || 0),
        [language === "bn" ? "ইউনিট" : "Unit"]: p.unit || "",
        [language === "bn" ? "ন্যূনতম স্টক" : "Min Stock Alert"]: p.min_stock_alert || 0,
      }));
      filename = `inventory-report.xlsx`;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, filename);
    toast.success(t("shop.reportDownloaded"));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ShopLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t("shop.reportsTitle")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t("shop.reportsDesc")}</p>
          </div>
          <DateRangeFilter
            selectedRange={dateRange}
            onRangeChange={handleDateRangeChange}
            customDateRange={customDateRange}
          />
        </div>

        {/* Business Growth Insight Section */}
        <FullBusinessGrowthInsight />

        <Tabs defaultValue="sales" className="space-y-4" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="sales">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t("shop.sales")}
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <FileText className="h-4 w-4 mr-2" />
              {t("shop.expenses")}
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Package className="h-4 w-4 mr-2" />
              {t("shop.products")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("shop.salesReport")}</CardTitle>
                  <CardDescription>{t("shop.salesReportDesc")}</CardDescription>
                </div>
                <Button onClick={downloadReport} disabled={!reportData || activeTab !== "sales"}>
                  <Download className="h-4 w-4 mr-2" />
                  {t("shop.download")}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8">{t("common.loading")}</p>
                ) : reportData && activeTab === "sales" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{t("shop.totalSales")}</p>
                        <p className="text-2xl font-bold">{formatCurrency(reportData.summary.totalAmount || 0)}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{t("shop.averageSale")}</p>
                        <p className="text-2xl font-bold text-green-500">{formatCurrency(reportData.summary.avgSale || 0)}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{t("shop.totalOrders")}</p>
                        <p className="text-2xl font-bold">{reportData.summary.count || 0}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{language === "bn" ? "মোট আইটেম" : "Total Items"}</p>
                        <p className="text-2xl font-bold">{reportData.summary.totalItems || 0}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">{t("shop.clickToViewReport")}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("shop.expensesReport")}</CardTitle>
                  <CardDescription>{t("shop.expensesReportDesc")}</CardDescription>
                </div>
                <Button onClick={downloadReport} disabled={!reportData || activeTab !== "expenses"}>
                  <Download className="h-4 w-4 mr-2" />
                  {t("shop.download")}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8">{t("common.loading")}</p>
                ) : reportData && activeTab === "expenses" ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">{t("shop.totalExpenses")}</p>
                      <p className="text-2xl font-bold text-orange-500">{formatCurrency(reportData.summary.totalAmount || 0)}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(reportData.summary.byCategory || {}).map(([cat, amount]) => (
                        <div key={cat} className="p-3 bg-muted/50 rounded">
                          <p className="text-xs text-muted-foreground">{cat}</p>
                          <p className="font-medium">{formatCurrency(Number(amount))}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">{t("shop.clickToViewReport")}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("shop.inventoryReport")}</CardTitle>
                  <CardDescription>{t("shop.inventoryReportDesc")}</CardDescription>
                </div>
                <Button onClick={downloadReport} disabled={!reportData || activeTab !== "inventory"}>
                  <Download className="h-4 w-4 mr-2" />
                  {t("shop.download")}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-8">{t("common.loading")}</p>
                ) : reportData && activeTab === "inventory" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{t("dashboard.totalProducts")}</p>
                        <p className="text-2xl font-bold">{reportData.summary.totalProducts}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{t("shop.stockValue")}</p>
                        <p className="text-2xl font-bold">{formatCurrency(reportData.summary.totalValue)}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{t("shop.lowStock")}</p>
                        <p className="text-2xl font-bold text-orange-500">{reportData.summary.lowStockCount}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">{t("shop.clickToViewReport")}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ShopLayout>
  );
};

export default ShopReports;
