import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DeleteConfirmDialog } from "@/components/offline-shop/DeleteConfirmDialog";
import DateRangeFilter, { DateRangePreset, DateRange, getDateRangeFromPreset } from "@/components/offline-shop/DateRangeFilter";

import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Search, 
  User, 
  Phone, 
  Calendar, 
  Receipt,
  ArrowLeft,
  Banknote,
  Eye,
  CreditCard,
  Trash2,
  X,
  MessageSquare,
  Send,
  Settings,
  WifiOff,
  Wifi,
  RefreshCw,
} from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useOfflineDueCustomers } from "@/hooks/useOfflineShopData";
import { useOfflineSettings } from "@/hooks/useOfflineData";
import { offlineShopService } from "@/services/offlineShopService";

interface DueSale {
  id: string;
  invoice_number: string;
  sale_date: string;
  total: number;
  paid_amount: number;
  due_amount: number;
  customer_id: string | null;
  customer_name: string | null;
  notes: string | null;
  items?: Array<{
    product_name?: string;
    name?: string;
    quantity?: number;
    price?: number;
    total?: number;
  }>;
}

interface CustomerDueInfo {
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  totalSales: number;
  totalPaid: number;
  totalDue: number;
  salesCount: number;
  sales: DueSale[];
}

const ShopDueCustomers = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // Use offline hooks
  const { dueCustomers, loading, refetch, updateSalePayment, deleteSales } = useOfflineDueCustomers();
  const { settings } = useOfflineSettings();
  const currency = settings?.currency || "BDT";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDueInfo | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<DueSale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [selectedCustomersForSms, setSelectedCustomersForSms] = useState<CustomerDueInfo[]>([]);
  
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-BD", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filter by date range and search
  const filteredCustomers = useMemo(() => {
    return dueCustomers.filter((customer) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = customer.customerName.toLowerCase().includes(query) ||
        (customer.customerPhone && customer.customerPhone.includes(query));
      
      // Check if any sale is within date range
      const hasMatchingSale = customer.sales.some(sale => {
        const saleDate = new Date(sale.sale_date);
        return isWithinInterval(saleDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
      });
      
      return matchesSearch && hasMatchingSale;
    });
  }, [dueCustomers, searchQuery, dateRange]);

  const totalOverallDue = filteredCustomers.reduce((sum, c) => sum + c.totalDue, 0);

  // Get all sale IDs from filtered customers
  const allSaleIds = filteredCustomers.flatMap(c => c.sales.map(s => s.id));
  const isAllSelected = allSaleIds.length > 0 && allSaleIds.every(id => selectedSaleIds.includes(id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSaleIds([]);
    } else {
      setSelectedSaleIds(allSaleIds);
    }
  };

  const handleSelectCustomer = (customer: CustomerDueInfo) => {
    const customerSaleIds = customer.sales.map(s => s.id);
    const allSelected = customerSaleIds.every(id => selectedSaleIds.includes(id));
    
    if (allSelected) {
      setSelectedSaleIds(prev => prev.filter(id => !customerSaleIds.includes(id)));
    } else {
      setSelectedSaleIds(prev => [...new Set([...prev, ...customerSaleIds])]);
    }
  };

  const isCustomerSelected = (customer: CustomerDueInfo) => {
    return customer.sales.every(s => selectedSaleIds.includes(s.id));
  };

  const isCustomerPartiallySelected = (customer: CustomerDueInfo) => {
    const selected = customer.sales.filter(s => selectedSaleIds.includes(s.id));
    return selected.length > 0 && selected.length < customer.sales.length;
  };

  const handleViewCustomer = (customer: CustomerDueInfo) => {
    setSelectedCustomer(customer);
    setViewModalOpen(true);
  };

  const handleCollectPayment = (sale: DueSale) => {
    setSelectedSale(sale);
    setPaymentAmount(sale.due_amount.toString());
    setPaymentModalOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedSaleIds.length === 0) return;
    
    setDeleting(true);
    try {
      await deleteSales(selectedSaleIds);
      toast.success(
        language === "bn" 
          ? `${selectedSaleIds.length}টি বিক্রয় ট্র্যাশে সরানো হয়েছে` 
          : `${selectedSaleIds.length} sale(s) moved to trash`
      );
      
      setSelectedSaleIds([]);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting sales:", error);
      toast.error(
        language === "bn" 
          ? `ডিলিট করতে সমস্যা হয়েছে: ${error.message || "Unknown error"}` 
          : `Failed to delete: ${error.message || "Unknown error"}`
      );
    } finally {
      setDeleting(false);
    }
  };

  // Get selected customers from selected sale IDs
  const getSelectedCustomers = (): CustomerDueInfo[] => {
    const customerSet = new Set<string>();
    const result: CustomerDueInfo[] = [];
    
    for (const customer of dueCustomers) {
      const hasSelectedSale = customer.sales.some(s => selectedSaleIds.includes(s.id));
      if (hasSelectedSale && !customerSet.has(customer.customerId || customer.customerName)) {
        customerSet.add(customer.customerId || customer.customerName);
        result.push(customer);
      }
    }
    return result;
  };

  const handleOpenSmsModal = () => {
    const customers = getSelectedCustomers();
    if (customers.length === 0) {
      toast.error(language === "bn" ? "গ্রাহক সিলেক্ট করুন" : "Select customers first");
      return;
    }
    
    // Filter only customers with phone numbers
    const customersWithPhone = customers.filter(c => c.customerPhone);
    if (customersWithPhone.length === 0) {
      toast.error(language === "bn" 
        ? "সিলেক্টেড গ্রাহকদের ফোন নম্বর নেই" 
        : "Selected customers have no phone numbers");
      return;
    }
    
    setSelectedCustomersForSms(customersWithPhone);
    setSmsModalOpen(true);
  };

  const handleSendSmsReminders = async () => {
    if (selectedCustomersForSms.length === 0) return;
    
    setSendingSms(true);
    try {
      // Build detailed purchase info for each customer
      const customersData = selectedCustomersForSms.map(customer => {
        // Get all unique products from sale items
        const productNames: string[] = [];
        const invoiceNumbers: string[] = [];
        let oldestDate: Date | null = null;
        
        customer.sales.forEach(sale => {
          invoiceNumbers.push(sale.invoice_number);
          const saleDate = new Date(sale.sale_date);
          if (!oldestDate || saleDate < oldestDate) {
            oldestDate = saleDate;
          }
        });
        
        // Calculate days overdue
        const daysOverdue = oldestDate 
          ? Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        // Format oldest date
        const formattedOldestDate = oldestDate 
          ? format(oldestDate, "dd/MM/yyyy")
          : "N/A";
        
        // Create detailed purchase summary with dates
        const purchaseDetailsList = customer.sales.map(s => {
          const formattedAmount = new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-BD", {
            style: "currency",
            currency: "BDT",
            minimumFractionDigits: 0,
          }).format(s.due_amount);
          const saleDate = format(new Date(s.sale_date), "dd/MM");
          return `${s.invoice_number}(${saleDate}): ${formattedAmount}`;
        });
        
        const purchaseDetails = purchaseDetailsList.join(", ");
        
        // Get unique product list (from invoice numbers for now)
        const productList = invoiceNumbers.length > 3 
          ? `${invoiceNumbers.length}টি ইনভয়েস` 
          : invoiceNumbers.join(", ");
        
        return {
          customerName: customer.customerName,
          customerPhone: customer.customerPhone!,
          dueAmount: customer.totalDue,
          totalPurchases: customer.salesCount,
          oldestDueDate: formattedOldestDate,
          daysOverdue,
          productList,
          invoiceList: invoiceNumbers.join(", "),
          purchaseDetails,
        };
      });

      // Send SMS for each customer
      let totalSent = 0;
      let totalFailed = 0;
      
      for (const customer of customersData) {
        try {
          await offlineShopService.sendDueReminderSms({
            saleId: customer.invoiceList?.split(",")[0]?.trim() || "",
            customerId: customer.customerPhone || "",
            dueAmount: customer.dueAmount,
            customerPhone: customer.customerPhone,
          });
          totalSent++;
        } catch {
          totalFailed++;
        }
      }
      
      if (totalSent > 0) {
        toast.success(
          language === "bn" 
            ? `${totalSent}টি SMS পাঠানো হয়েছে` 
            : `${totalSent} SMS sent successfully`
        );
      }
      
      if (totalFailed > 0) {
        toast.warning(
          language === "bn" 
            ? `${totalFailed}টি SMS পাঠাতে ব্যর্থ` 
            : `${totalFailed} SMS failed to send`
        );
      }
      
      setSmsModalOpen(false);
      setSelectedCustomersForSms([]);
      setSelectedSaleIds([]);
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      toast.error(error.message || (language === "bn" ? "SMS পাঠাতে সমস্যা হয়েছে" : "Failed to send SMS"));
    } finally {
      setSendingSms(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedSale) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(language === "bn" ? "সঠিক পরিমাণ দিন" : "Enter valid amount");
      return;
    }
    
    if (amount > selectedSale.due_amount) {
      toast.error(language === "bn" ? "বাকির চেয়ে বেশি দেওয়া যাবে না" : "Cannot pay more than due");
      return;
    }
    
    setProcessingPayment(true);
    try {
      const newPaidAmount = selectedSale.paid_amount + amount;
      const newDueAmount = selectedSale.due_amount - amount;
      
      await updateSalePayment(selectedSale.id, newPaidAmount, newDueAmount);
      
      toast.success(language === "bn" ? "পেমেন্ট সফল হয়েছে" : "Payment recorded successfully");
      setPaymentModalOpen(false);
      setViewModalOpen(false);
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(language === "bn" ? "পেমেন্ট রেকর্ড করতে সমস্যা হয়েছে" : "Failed to record payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <ShopLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/offline-shop")}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              {language === "bn" ? "বাকি গ্রাহক" : "Due Customers"}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {language === "bn" 
                ? "সব গ্রাহকের বাকি তথ্য দেখুন" 
                : "View all customers with outstanding dues"}
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20">
          <CardContent className="p-4 sm:pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {language === "bn" ? "মোট বাকি" : "Total Due"}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-destructive">
                  {formatCurrency(totalOverallDue)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {language === "bn" ? "বাকি গ্রাহক" : "Due Customers"}
                </p>
                <p className="text-lg sm:text-2xl font-bold">
                  {dueCustomers.length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {language === "bn" ? "বাকি বিক্রয়" : "Due Sales"}
                </p>
                <p className="text-lg sm:text-2xl font-bold">
                  {dueCustomers.reduce((sum, c) => sum + c.salesCount, 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {language === "bn" ? "গড় বাকি" : "Avg. Due"}
                </p>
                <p className="text-lg sm:text-2xl font-bold">
                  {formatCurrency(dueCustomers.length > 0 ? totalOverallDue / dueCustomers.length : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search + Date Filter + Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center flex-1">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "bn" ? "নাম বা ফোন দিয়ে খুঁজুন..." : "Search by name or phone..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DateRangeFilter
              selectedRange={dateRangePreset}
              onRangeChange={handleDateRangeChange}
              customDateRange={customDateRange}
              compact
            />
          </div>
          
          {selectedSaleIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
              <span className="text-sm font-medium">
                {language === "bn" 
                  ? `${getSelectedCustomers().length}জন গ্রাহক নির্বাচিত` 
                  : `${getSelectedCustomers().length} customer(s) selected`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSaleIds([])}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleOpenSmsModal}
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                {language === "bn" ? "SMS রিমাইন্ডার" : "SMS Reminder"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {language === "bn" ? "ডিলিট" : "Delete"}
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[550px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 p-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm">{language === "bn" ? "গ্রাহক" : "Customer"}</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">{language === "bn" ? "ফোন" : "Phone"}</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm hidden lg:table-cell">{language === "bn" ? "মোট বিক্রয়" : "Total Sales"}</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm hidden sm:table-cell">{language === "bn" ? "পরিশোধিত" : "Paid"}</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">{language === "bn" ? "বাকি" : "Due"}</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm hidden sm:table-cell">{language === "bn" ? "বিক্রয়" : "Sales"}</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm w-20">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="p-2"><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell className="p-2"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="p-2 hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="p-2 hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="p-2 hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="p-2"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="p-2 hidden sm:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell className="p-2"><Skeleton className="h-7 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {language === "bn" ? "কোনো বাকি গ্রাহক নেই" : "No due customers found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <TableRow key={customer.customerId || index}>
                      <TableCell className="p-2">
                        <Checkbox
                          checked={isCustomerSelected(customer)}
                          onCheckedChange={() => handleSelectCustomer(customer)}
                          className={isCustomerPartiallySelected(customer) ? "data-[state=checked]:bg-primary/50" : ""}
                        />
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-xs sm:text-sm truncate block max-w-[80px] sm:max-w-none">{customer.customerName}</span>
                            <span className="text-[10px] text-muted-foreground md:hidden">{customer.customerPhone || ""}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4 hidden md:table-cell text-xs sm:text-sm">
                        {customer.customerPhone || "-"}
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4 font-medium text-xs sm:text-sm hidden lg:table-cell">
                        {formatCurrency(customer.totalSales)}
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4 text-green-600 text-xs sm:text-sm hidden sm:table-cell">
                        {formatCurrency(customer.totalPaid)}
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <span className="font-bold text-destructive text-xs sm:text-sm whitespace-nowrap">
                          {formatCurrency(customer.totalDue)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center p-2 sm:p-4 hidden sm:table-cell">
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">{customer.salesCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] sm:text-xs px-2 sm:px-3"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                          <span className="hidden sm:inline">{language === "bn" ? "বিস্তারিত" : "Details"}</span>
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          handleBulkDelete();
          setDeleteDialogOpen(false);
        }}
        title={language === "en" ? "sales" : "বিক্রয়"}
        itemCount={selectedSaleIds.length}
        isSoftDelete={true}
        isLoading={deleting}
      />


      {/* Customer Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedCustomer?.customerName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedCustomer.customerPhone || (language === "bn" ? "ফোন নেই" : "No phone")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedCustomer.salesCount} {language === "bn" ? "টি বিক্রয়" : "sales"}</span>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">{language === "bn" ? "মোট বিক্রয়" : "Total Sales"}</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedCustomer.totalSales)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">{language === "bn" ? "পরিশোধিত" : "Paid"}</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(selectedCustomer.totalPaid)}</p>
                  </CardContent>
                </Card>
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="pt-4 text-center">
                    <p className="text-xs text-muted-foreground">{language === "bn" ? "বাকি" : "Due"}</p>
                    <p className="text-lg font-bold text-destructive">{formatCurrency(selectedCustomer.totalDue)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sales List */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  {language === "bn" ? "বাকি বিক্রয় তালিকা" : "Due Sales List"}
                  <Badge variant="secondary" className="ml-auto">
                    {selectedCustomer.salesCount} {language === "bn" ? "টি" : "sales"}
                  </Badge>
                </h4>
                <div className="space-y-3">
                  {selectedCustomer.sales.map((sale) => (
                    <div 
                      key={sale.id} 
                      className="p-4 bg-muted/30 rounded-lg border space-y-3"
                    >
                      {/* Sale Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary">{sale.invoice_number}</span>
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(sale.sale_date), "dd MMM yyyy")}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCollectPayment(sale)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          {language === "bn" ? "আদায়" : "Collect"}
                        </Button>
                      </div>
                      
                      {/* Sale Items (if available) */}
                      {sale.items && Array.isArray(sale.items) && sale.items.length > 0 && (
                        <div className="pl-2 border-l-2 border-muted-foreground/20 space-y-1">
                          {sale.items.slice(0, 5).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm text-muted-foreground">
                              <span>{item.product_name || item.name || 'Product'} × {item.quantity || 1}</span>
                              <span>{formatCurrency(item.total || (item.price * (item.quantity || 1)))}</span>
                            </div>
                          ))}
                          {sale.items.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              +{sale.items.length - 5} {language === "bn" ? "আরও আইটেম" : "more items"}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Sale Summary */}
                      <div className="flex items-center justify-between pt-2 border-t border-dashed">
                        <div className="text-sm text-muted-foreground">
                          <span>{language === "bn" ? "মোট" : "Total"}: {formatCurrency(sale.total)}</span>
                          <span className="mx-2">|</span>
                          <span className="text-green-600">{language === "bn" ? "পরিশোধিত" : "Paid"}: {formatCurrency(sale.paid_amount)}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{language === "bn" ? "বাকি" : "Due"}</p>
                          <p className="font-bold text-destructive">{formatCurrency(sale.due_amount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Collection Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              {language === "bn" ? "বাকি আদায়" : "Collect Due Payment"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === "bn" ? "ইনভয়েস" : "Invoice"}:</span>
                  <span className="font-medium">{selectedSale.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === "bn" ? "মোট বিল" : "Total Bill"}:</span>
                  <span>{formatCurrency(selectedSale.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === "bn" ? "আগে পরিশোধ" : "Already Paid"}:</span>
                  <span className="text-green-600">{formatCurrency(selectedSale.paid_amount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">{language === "bn" ? "বাকি আছে" : "Remaining Due"}:</span>
                  <span className="font-bold text-destructive">{formatCurrency(selectedSale.due_amount)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === "bn" ? "আদায়ের পরিমাণ" : "Payment Amount"}</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                  max={selectedSale.due_amount}
                />
                <p className="text-xs text-muted-foreground">
                  {language === "bn" ? "সর্বোচ্চ" : "Max"}: {formatCurrency(selectedSale.due_amount)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmitPayment} disabled={processingPayment}>
              {processingPayment 
                ? (language === "bn" ? "প্রক্রিয়াকরণ..." : "Processing...") 
                : (language === "bn" ? "পেমেন্ট নিশ্চিত করুন" : "Confirm Payment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SMS Reminder Modal */}
      <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              {language === "bn" ? "SMS রিমাইন্ডার পাঠান" : "Send SMS Reminder"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                {language === "bn" 
                  ? `${selectedCustomersForSms.length}জন গ্রাহককে SMS পাঠানো হবে` 
                  : `SMS will be sent to ${selectedCustomersForSms.length} customer(s)`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "bn" 
                  ? "মোট বাকি: " 
                  : "Total Due: "}
                {formatCurrency(selectedCustomersForSms.reduce((sum, c) => sum + c.totalDue, 0))}
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium">
                {language === "bn" ? "গ্রাহক তালিকা:" : "Customer List:"}
              </p>
              {selectedCustomersForSms.map((customer, index) => (
                <div 
                  key={customer.customerId || index} 
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{customer.customerName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customer.customerPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">{formatCurrency(customer.totalDue)}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.salesCount} {language === "bn" ? "টি বিক্রয়" : "sales"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <div className="flex items-start gap-2">
                <Settings className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {language === "bn" ? "SMS টেমপ্লেট কাস্টমাইজ করুন" : "Customize SMS Template"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" 
                      ? "শপ সেটিংস এ গিয়ে SMS টেমপ্লেট ও API কনফিগার করুন" 
                      : "Go to Shop Settings to configure SMS template and API"}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-amber-600"
                    onClick={() => {
                      setSmsModalOpen(false);
                      navigate("/dashboard/sync");
                    }}
                  >
                    {language === "bn" ? "সেটিংস এ যান →" : "Go to Settings →"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button 
              onClick={handleSendSmsReminders} 
              disabled={sendingSms}
              className="bg-green-600 hover:bg-green-700"
            >
              {sendingSms ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  {language === "bn" ? "পাঠানো হচ্ছে..." : "Sending..."}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  {language === "bn" ? "SMS পাঠান" : "Send SMS"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ShopLayout>
  );
};

export default ShopDueCustomers;
