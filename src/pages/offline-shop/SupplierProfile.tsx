import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Building2, Phone, Mail, MapPin, Calendar, DollarSign, 
  TrendingUp, Package, FileText, CreditCard, Download, Plus, Banknote,
  ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { offlineShopService } from "@/services/offlineShopService";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

interface SupplierProfile {
  id: string;
  name: string;
  supplier_code?: string;
  company_name?: string;
  contact_person?: string;
  business_type?: string;
  category?: string;
  phone?: string;
  email?: string;
  address?: string;
  opening_balance: number;
  total_purchases: number;
  total_due: number;
  payment_terms?: string;
  notes?: string;
  is_active?: boolean;
  created_at: string;
}

interface Purchase {
  id: string;
  purchase_date: string;
  invoice_number?: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  transport_cost?: number;
  discount?: number;
  landing_cost?: number;
  items?: any[];
}

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: string;
  reference_id?: string;
}

interface ProductSummary {
  name: string;
  product_id?: string;
  totalQuantity: number;
  totalAmount: number;
  lastPurchaseDate: string;
  lastPrice: number;
  averagePrice: number;
}

const SupplierProfilePage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [productSummary, setProductSummary] = useState<ProductSummary[]>([]);
  const [summary, setSummary] = useState({
    totalPurchases: 0,
    totalPurchaseAmount: 0,
    totalPaid: 0,
    totalDue: 0,
    lastPurchaseDate: null as string | null,
    lastPaymentDate: null as string | null,
  });
  
  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_method: "cash",
    notes: "",
  });

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const result = await offlineShopService.getSupplierProfile(id);
      setSupplier(result.supplier);
      setPurchases(result.purchases || []);
      setLedger(result.ledger || []);
      setProductSummary(result.productSummary || []);
      setSummary(result.summary);
    } catch (error) {
      toast.error(language === "bn" ? "তথ্য লোড করতে সমস্যা হয়েছে" : "Failed to load data");
      navigate("/offline-shop/suppliers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddPayment = async () => {
    if (!supplier || paymentData.amount <= 0) {
      toast.error(language === "bn" ? "সঠিক পরিমাণ দিন" : "Enter valid amount");
      return;
    }

    try {
      await offlineShopService.addSupplierPayment({
        supplier_id: supplier.id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        notes: paymentData.notes,
      });
      toast.success(language === "bn" ? "পেমেন্ট যোগ হয়েছে" : "Payment added");
      setIsPaymentModalOpen(false);
      setPaymentData({ amount: 0, payment_method: "cash", notes: "" });
      loadData();
    } catch (error) {
      toast.error(language === "bn" ? "পেমেন্ট যোগ করতে সমস্যা হয়েছে" : "Failed to add payment");
    }
  };

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;
  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch {
      return date;
    }
  };

  const getBusinessTypeLabel = (type?: string) => {
    const types: Record<string, { en: string; bn: string }> = {
      wholesale: { en: "Wholesale", bn: "পাইকারি" },
      retail: { en: "Retail", bn: "খুচরা" },
      manufacturer: { en: "Manufacturer", bn: "প্রস্তুতকারক" },
      distributor: { en: "Distributor", bn: "পরিবেশক" },
      importer: { en: "Importer", bn: "আমদানিকারক" },
    };
    return types[type || "wholesale"]?.[language === "bn" ? "bn" : "en"] || type;
  };

  const getCategoryLabel = (cat?: string) => {
    const cats: Record<string, { en: string; bn: string }> = {
      local: { en: "Local", bn: "স্থানীয়" },
      national: { en: "National", bn: "জাতীয়" },
      import: { en: "Import", bn: "আমদানি" },
    };
    return cats[cat || "local"]?.[language === "bn" ? "bn" : "en"] || cat;
  };

  if (isLoading) {
    return (
      <ShopLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </ShopLayout>
    );
  }

  if (!supplier) {
    return (
      <ShopLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{language === "bn" ? "সরবরাহকারী পাওয়া যায়নি" : "Supplier not found"}</p>
          <Button onClick={() => navigate("/offline-shop/suppliers")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === "bn" ? "ফিরে যান" : "Go Back"}
          </Button>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/offline-shop/suppliers")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{supplier.name}</h1>
                {supplier.supplier_code && (
                  <Badge variant="outline">{supplier.supplier_code}</Badge>
                )}
              </div>
              {supplier.company_name && (
                <p className="text-muted-foreground">{supplier.company_name}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(true)}>
              <Banknote className="h-4 w-4 mr-2" />
              {language === "bn" ? "পেমেন্ট করুন" : "Add Payment"}
            </Button>
            <Button onClick={() => navigate(`/offline-shop/purchases?supplier=${supplier.id}`)}>
              <Plus className="h-4 w-4 mr-2" />
              {language === "bn" ? "নতুন কেনাকাটা" : "New Purchase"}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "bn" ? "মোট কেনাকাটা" : "Total Purchases"}
                  </p>
                  <p className="text-xl font-bold">{formatCurrency(summary.totalPurchaseAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "bn" ? "মোট পরিশোধ" : "Total Paid"}
                  </p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={summary.totalDue > 0 ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : ""}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${summary.totalDue > 0 ? "bg-red-500/10" : "bg-muted"}`}>
                  <AlertCircle className={`h-5 w-5 ${summary.totalDue > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "bn" ? "বকেয়া আছে" : "Outstanding Due"}
                  </p>
                  <p className={`text-xl font-bold ${summary.totalDue > 0 ? "text-red-600" : ""}`}>
                    {formatCurrency(summary.totalDue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "bn" ? "মোট অর্ডার" : "Total Orders"}
                  </p>
                  <p className="text-xl font-bold">{summary.totalPurchases}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{language === "bn" ? "সারসংক্ষেপ" : "Overview"}</TabsTrigger>
            <TabsTrigger value="purchases">{language === "bn" ? "কেনাকাটা" : "Purchases"}</TabsTrigger>
            <TabsTrigger value="due">{language === "bn" ? "বাকি/বকেয়া" : "Due/Baki"}</TabsTrigger>
            <TabsTrigger value="ledger">{language === "bn" ? "খতিয়ান" : "Ledger"}</TabsTrigger>
            <TabsTrigger value="products">{language === "bn" ? "পণ্য" : "Products"}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {language === "bn" ? "যোগাযোগ তথ্য" : "Contact Information"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supplier.contact_person && (
                    <div className="flex items-start gap-3">
                      <span className="text-muted-foreground w-24">{language === "bn" ? "যোগাযোগ:" : "Contact:"}</span>
                      <span>{supplier.contact_person}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                      <span>{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <span>{supplier.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {language === "bn" ? "ব্যবসায়িক তথ্য" : "Business Information"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{language === "bn" ? "ধরন:" : "Type:"}</span>
                    <Badge variant="secondary">{getBusinessTypeLabel(supplier.business_type)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{language === "bn" ? "ক্যাটাগরি:" : "Category:"}</span>
                    <Badge variant="outline">{getCategoryLabel(supplier.category)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{language === "bn" ? "পেমেন্ট শর্ত:" : "Payment Terms:"}</span>
                    <span>{supplier.payment_terms || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{language === "bn" ? "প্রারম্ভিক বাকি:" : "Opening Balance:"}</span>
                    <span>{formatCurrency(supplier.opening_balance || 0)}</span>
                  </div>
                  {summary.lastPurchaseDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{language === "bn" ? "শেষ কেনাকাটা:" : "Last Purchase:"}</span>
                      <span>{formatDate(summary.lastPurchaseDate)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {supplier.notes && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">{language === "bn" ? "নোট" : "Notes"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{supplier.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>{language === "bn" ? "কেনাকাটার ইতিহাস" : "Purchase History"}</CardTitle>
                <CardDescription>
                  {language === "bn" 
                    ? `মোট ${purchases.length}টি কেনাকাটা` 
                    : `Total ${purchases.length} purchases`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "bn" ? "তারিখ" : "Date"}</TableHead>
                        <TableHead>{language === "bn" ? "ইনভয়েস" : "Invoice"}</TableHead>
                        <TableHead className="text-right">{language === "bn" ? "মোট" : "Total"}</TableHead>
                        <TableHead className="text-right">{language === "bn" ? "পরিশোধ" : "Paid"}</TableHead>
                        <TableHead className="text-right">{language === "bn" ? "বাকি" : "Due"}</TableHead>
                        <TableHead>{language === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            {language === "bn" ? "কোন কেনাকাটা নেই" : "No purchases yet"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        purchases.map((purchase) => (
                          <>
                            <TableRow 
                              key={purchase.id} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setExpandedPurchase(expandedPurchase === purchase.id ? null : purchase.id)}
                            >
                              <TableCell>{formatDate(purchase.purchase_date)}</TableCell>
                              <TableCell className="font-mono">{purchase.invoice_number || "-"}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(purchase.total_amount)}</TableCell>
                              <TableCell className="text-right text-green-600">{formatCurrency(purchase.paid_amount)}</TableCell>
                              <TableCell className="text-right text-red-600">{formatCurrency(purchase.due_amount)}</TableCell>
                              <TableCell>
                                <Badge variant={purchase.payment_status === "paid" ? "default" : purchase.payment_status === "partial" ? "secondary" : "destructive"}>
                                  {purchase.payment_status === "paid" ? (language === "bn" ? "পরিশোধিত" : "Paid") 
                                    : purchase.payment_status === "partial" ? (language === "bn" ? "আংশিক" : "Partial")
                                    : (language === "bn" ? "বাকি" : "Due")}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {expandedPurchase === purchase.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </TableCell>
                            </TableRow>
                            {expandedPurchase === purchase.id && purchase.items && (
                              <TableRow>
                                <TableCell colSpan={7} className="bg-muted/30 p-4">
                                  <div className="space-y-2">
                                    <p className="font-medium text-sm">{language === "bn" ? "পণ্যসমূহ:" : "Items:"}</p>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>{language === "bn" ? "পণ্য" : "Product"}</TableHead>
                                          <TableHead className="text-right">{language === "bn" ? "পরিমাণ" : "Qty"}</TableHead>
                                          <TableHead className="text-right">{language === "bn" ? "দাম" : "Price"}</TableHead>
                                          <TableHead className="text-right">{language === "bn" ? "মোট" : "Total"}</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {purchase.items.map((item: any, idx: number) => (
                                          <TableRow key={idx}>
                                            <TableCell>{item.product_name}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Due/Baki Tab */}
          <TabsContent value="due">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{language === "bn" ? "বকেয়ার সারসংক্ষেপ" : "Due Summary"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>{language === "bn" ? "প্রারম্ভিক বাকি" : "Opening Balance"}</span>
                    <span className="font-medium">{formatCurrency(supplier.opening_balance || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>{language === "bn" ? "মোট কেনাকাটা" : "Total Purchases"}</span>
                    <span className="font-medium text-blue-600">+ {formatCurrency(summary.totalPurchaseAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>{language === "bn" ? "মোট পরিশোধ" : "Total Payments"}</span>
                    <span className="font-medium text-green-600">- {formatCurrency(summary.totalPaid)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center py-2">
                    <span className="text-lg font-semibold">{language === "bn" ? "বর্তমান বকেয়া" : "Current Due"}</span>
                    <span className={`text-xl font-bold ${summary.totalDue > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(summary.totalDue)}
                    </span>
                  </div>
                  
                  {summary.totalDue > 0 && (
                    <Button className="w-full" onClick={() => setIsPaymentModalOpen(true)}>
                      <Banknote className="h-4 w-4 mr-2" />
                      {language === "bn" ? "বাকি পরিশোধ করুন" : "Clear Due"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{language === "bn" ? "বাকি থাকা কেনাকাটা" : "Outstanding Purchases"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {purchases.filter(p => p.due_amount > 0).length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {language === "bn" ? "কোন বাকি নেই" : "No outstanding dues"}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {purchases.filter(p => p.due_amount > 0).map((purchase) => (
                          <div key={purchase.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{purchase.invoice_number || "N/A"}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(purchase.purchase_date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-600">{formatCurrency(purchase.due_amount)}</p>
                              <p className="text-xs text-muted-foreground">
                                {language === "bn" ? "মোট:" : "of"} {formatCurrency(purchase.total_amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ledger Tab */}
          <TabsContent value="ledger">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{language === "bn" ? "সরবরাহকারী খতিয়ান" : "Supplier Ledger"}</CardTitle>
                  <CardDescription>
                    {language === "bn" ? "সম্পূর্ণ লেনদেনের ইতিহাস" : "Complete transaction history"}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  {language === "bn" ? "এক্সপোর্ট" : "Export"}
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "bn" ? "তারিখ" : "Date"}</TableHead>
                        <TableHead>{language === "bn" ? "বিবরণ" : "Description"}</TableHead>
                        <TableHead className="text-right">{language === "bn" ? "ডেবিট" : "Debit"}</TableHead>
                        <TableHead className="text-right">{language === "bn" ? "ক্রেডিট" : "Credit"}</TableHead>
                        <TableHead className="text-right">{language === "bn" ? "ব্যালেন্স" : "Balance"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledger.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {language === "bn" ? "কোন লেনদেন নেই" : "No transactions"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        ledger.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell className="text-right text-blue-600">
                              {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${entry.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                              {formatCurrency(entry.balance)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>{language === "bn" ? "কেনা পণ্যসমূহ" : "Purchased Products"}</CardTitle>
                <CardDescription>
                  {language === "bn" 
                    ? `এই সরবরাহকারী থেকে ${productSummary.length}টি ভিন্ন পণ্য কেনা হয়েছে`
                    : `${productSummary.length} unique products purchased from this supplier`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "bn" ? "পণ্যের নাম" : "Product Name"}</TableHead>
                        <TableHead className="text-right">{language === "bn" ? "মোট পরিমাণ" : "Total Qty"}</TableHead>
                        <TableHead className="text-right">{language === "bn" ? "মোট খরচ" : "Total Cost"}</TableHead>
                        <TableHead className="text-right">{language === "bn" ? "গড় দাম" : "Avg Price"}</TableHead>
                        <TableHead className="text-right">{language === "bn" ? "শেষ দাম" : "Last Price"}</TableHead>
                        <TableHead>{language === "bn" ? "শেষ কেনা" : "Last Purchase"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productSummary.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            {language === "bn" ? "কোন পণ্য নেই" : "No products"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        productSummary.map((product, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-right">{product.totalQuantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(product.totalAmount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(product.averagePrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(product.lastPrice)}</TableCell>
                            <TableCell>{formatDate(product.lastPurchaseDate)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Modal */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === "bn" ? "সরবরাহকারীকে পেমেন্ট" : "Payment to Supplier"}</DialogTitle>
              <DialogDescription>
                {language === "bn" 
                  ? `বর্তমান বকেয়া: ${formatCurrency(summary.totalDue)}`
                  : `Current due: ${formatCurrency(summary.totalDue)}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "পরিমাণ" : "Amount"} *</Label>
                <Input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                  placeholder="0"
                />
                {summary.totalDue > 0 && (
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto"
                    onClick={() => setPaymentData({ ...paymentData, amount: summary.totalDue })}
                  >
                    {language === "bn" ? "সম্পূর্ণ বকেয়া দিন" : "Pay full due"}
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "পেমেন্ট পদ্ধতি" : "Payment Method"}</Label>
                <Select
                  value={paymentData.payment_method}
                  onValueChange={(value) => setPaymentData({ ...paymentData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{language === "bn" ? "নগদ" : "Cash"}</SelectItem>
                    <SelectItem value="bank">{language === "bn" ? "ব্যাংক" : "Bank"}</SelectItem>
                    <SelectItem value="bkash">{language === "bn" ? "বিকাশ" : "bKash"}</SelectItem>
                    <SelectItem value="nagad">{language === "bn" ? "নগদ" : "Nagad"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "নোট" : "Notes"}</Label>
                <Textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder={language === "bn" ? "অতিরিক্ত নোট..." : "Additional notes..."}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                {language === "bn" ? "বাতিল" : "Cancel"}
              </Button>
              <Button onClick={handleAddPayment}>
                <Banknote className="h-4 w-4 mr-2" />
                {language === "bn" ? "পেমেন্ট করুন" : "Add Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ShopLayout>
  );
};

export default SupplierProfilePage;
