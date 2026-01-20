import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Search, 
  ArrowLeft,
  Send,
  MessageSquareMore,
  Users,
  ShoppingBag,
  Filter,
  Eye,
  X,
  Sparkles,
  Tag,
  Percent,
  Gift,
  Calendar,
  Package,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { offlineShopService } from "@/services/offlineShopService";

interface CustomerWithPurchases {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  totalPurchases: number;
  totalAmount: number;
  lastPurchaseDate: string | null;
  purchasedProducts: string[];
  salesCount: number;
}

interface SmsTemplate {
  id: string;
  name: string;
  nameBn: string;
  icon: React.ReactNode;
  template: string;
  templateBn: string;
}

const smsTemplates: SmsTemplate[] = [
  {
    id: "new_product",
    name: "New Product Arrival",
    nameBn: "নতুন পণ্য এসেছে",
    icon: <Package className="h-4 w-4" />,
    template: "Dear {customerName}, New products have arrived at our store! Visit us to check out the latest collection. Thank you for being a valued customer.",
    templateBn: "প্রিয় {customerName}, আমাদের দোকানে নতুন পণ্য এসেছে! সর্বশেষ কালেকশন দেখতে আমাদের দোকানে আসুন। আমাদের মূল্যবান গ্রাহক হওয়ার জন্য ধন্যবাদ।",
  },
  {
    id: "discount",
    name: "Special Discount",
    nameBn: "বিশেষ ছাড়",
    icon: <Percent className="h-4 w-4" />,
    template: "Dear {customerName}, Great news! We're offering special discounts just for you. Visit our store today and save big on your favorite products!",
    templateBn: "প্রিয় {customerName}, দারুণ খবর! আমরা শুধুমাত্র আপনার জন্য বিশেষ ছাড় দিচ্ছি। আজই আমাদের দোকানে আসুন এবং আপনার পছন্দের পণ্যে বড় সেভ করুন!",
  },
  {
    id: "offer",
    name: "Special Offer",
    nameBn: "বিশেষ অফার",
    icon: <Gift className="h-4 w-4" />,
    template: "Dear {customerName}, Exclusive offer alert! Don't miss out on our limited-time special offer. Visit us today to avail this amazing deal!",
    templateBn: "প্রিয় {customerName}, এক্সক্লুসিভ অফার এলার্ট! আমাদের সীমিত সময়ের বিশেষ অফার মিস করবেন না। এই দারুণ ডিল পেতে আজই আমাদের কাছে আসুন!",
  },
  {
    id: "event",
    name: "Event Invitation",
    nameBn: "ইভেন্ট আমন্ত্রণ",
    icon: <Calendar className="h-4 w-4" />,
    template: "Dear {customerName}, You're invited! We're hosting a special event at our store. Join us for an exciting experience and exclusive deals!",
    templateBn: "প্রিয় {customerName}, আপনাকে আমন্ত্রণ! আমাদের দোকানে একটি বিশেষ ইভেন্ট হচ্ছে। এক্সাইটিং অভিজ্ঞতা এবং এক্সক্লুসিভ ডিলের জন্য আমাদের সাথে যোগ দিন!",
  },
  {
    id: "restock",
    name: "Product Restock",
    nameBn: "পণ্য রিস্টক",
    icon: <RefreshCw className="h-4 w-4" />,
    template: "Dear {customerName}, Good news! The products you love are back in stock. Visit our store before they sell out again!",
    templateBn: "প্রিয় {customerName}, সুখবর! আপনার পছন্দের পণ্যগুলো আবার স্টকে এসেছে। আবার শেষ হওয়ার আগে আমাদের দোকানে আসুন!",
  },
  {
    id: "custom",
    name: "Custom Message",
    nameBn: "কাস্টম মেসেজ",
    icon: <Sparkles className="h-4 w-4" />,
    template: "",
    templateBn: "",
  },
];

const ShopFollowupSms = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerWithPurchases[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("new_product");
  const [customMessage, setCustomMessage] = useState("");
  const [viewCustomerModal, setViewCustomerModal] = useState(false);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<CustomerWithPurchases | null>(null);
  const [filterHasPhone, setFilterHasPhone] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const fetchCustomersWithPurchases = async () => {
    setLoading(true);
    try {
      // Fetch all customers
      const customersResponse = await offlineShopService.getCustomers();
      const allCustomers = customersResponse.customers || [];
      
      // Fetch all sales to get purchase history
      const salesResponse = await offlineShopService.getSales();
      const allSales = salesResponse.sales || [];
      
      // Build customer purchase data
      const customerMap = new Map<string, CustomerWithPurchases>();
      
      // First, add all registered customers
      for (const customer of allCustomers) {
        customerMap.set(customer.id, {
          id: customer.id,
          name: customer.name,
          phone: customer.phone || null,
          email: customer.email || null,
          totalPurchases: 0,
          totalAmount: 0,
          lastPurchaseDate: null,
          purchasedProducts: [],
          salesCount: 0,
        });
      }
      
      // Now process sales to add purchase info - including walk-in customers
      for (const sale of allSales) {
        const customerId = sale.customer_id;
        // Get customer info from direct fields OR nested customer object
        const customerName = sale.customer_name || sale.customer?.name || null;
        const customerPhone = sale.customer_phone || sale.customer?.phone || null;
        
        // If we have a customer_id and it exists in our map
        if (customerId && customerMap.has(customerId)) {
          const customer = customerMap.get(customerId)!;
          customer.totalAmount += Number(sale.total) || 0;
          customer.salesCount += 1;
          
          if (!customer.lastPurchaseDate || new Date(sale.sale_date) > new Date(customer.lastPurchaseDate)) {
            customer.lastPurchaseDate = sale.sale_date;
          }
          
          if (sale.items && Array.isArray(sale.items)) {
            for (const item of sale.items) {
              if (item.product_name && !customer.purchasedProducts.includes(item.product_name)) {
                customer.purchasedProducts.push(item.product_name);
              }
            }
          }
          customer.totalPurchases = customer.purchasedProducts.length;
        } 
        // For walk-in customers with name and/or phone
        else if (customerName) {
          // Use phone as key if available, otherwise use name
          const key = customerPhone 
            ? `walk-in-${customerPhone.replace(/\D/g, '')}` 
            : `walk-in-name-${customerName.toLowerCase().trim()}`;
          
          if (!customerMap.has(key)) {
            customerMap.set(key, {
              id: key,
              name: customerName,
              phone: customerPhone,
              email: null,
              totalPurchases: 0,
              totalAmount: 0,
              lastPurchaseDate: null,
              purchasedProducts: [],
              salesCount: 0,
            });
          }
          
          const customer = customerMap.get(key)!;
          customer.totalAmount += Number(sale.total) || 0;
          customer.salesCount += 1;
          
          if (!customer.lastPurchaseDate || new Date(sale.sale_date) > new Date(customer.lastPurchaseDate)) {
            customer.lastPurchaseDate = sale.sale_date;
          }
          
          if (sale.items && Array.isArray(sale.items)) {
            for (const item of sale.items) {
              if (item.product_name && !customer.purchasedProducts.includes(item.product_name)) {
                customer.purchasedProducts.push(item.product_name);
              }
            }
          }
          customer.totalPurchases = customer.purchasedProducts.length;
        }
      }
      
      // Convert to array - include registered customers and walk-in customers with purchases
      const customersArray = Array.from(customerMap.values())
        .filter(c => c.salesCount > 0 || c.phone) // Show customers with purchases OR those with phone numbers
        .sort((a, b) => b.totalAmount - a.totalAmount);
      
      setCustomers(customersArray);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error(language === "bn" ? "ডাটা লোড করতে সমস্যা হয়েছে" : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersWithPurchases();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        customer.name.toLowerCase().includes(query) ||
        (customer.phone && customer.phone.includes(query)) ||
        (customer.email && customer.email.toLowerCase().includes(query));
      
      const matchesPhoneFilter = filterHasPhone ? customer.phone : true;
      
      return matchesSearch && matchesPhoneFilter;
    });
  }, [customers, searchQuery, filterHasPhone]);

  const customersWithPhone = useMemo(() => {
    return customers.filter(c => c.phone);
  }, [customers]);

  const handleSelectAll = () => {
    const selectableCustomers = filteredCustomers.filter(c => c.phone);
    if (selectedCustomers.length === selectableCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(selectableCustomers.map(c => c.id));
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleViewCustomer = (customer: CustomerWithPurchases) => {
    setSelectedCustomerDetails(customer);
    setViewCustomerModal(true);
  };

  const handleOpenSmsModal = () => {
    if (selectedCustomers.length === 0) {
      toast.error(language === "bn" ? "গ্রাহক সিলেক্ট করুন" : "Select customers first");
      return;
    }
    
    const selectedWithPhone = selectedCustomers.filter(id => {
      const customer = customers.find(c => c.id === id);
      return customer?.phone;
    });
    
    if (selectedWithPhone.length === 0) {
      toast.error(language === "bn" 
        ? "সিলেক্টেড গ্রাহকদের ফোন নম্বর নেই" 
        : "Selected customers have no phone numbers");
      return;
    }
    
    setSmsModalOpen(true);
  };

  const getMessageText = () => {
    if (selectedTemplate === "custom") {
      return customMessage;
    }
    const template = smsTemplates.find(t => t.id === selectedTemplate);
    return language === "bn" ? template?.templateBn || "" : template?.template || "";
  };

  const handleSendFollowupSms = async () => {
    const messageText = getMessageText();
    if (!messageText.trim()) {
      toast.error(language === "bn" ? "মেসেজ লিখুন" : "Please enter a message");
      return;
    }
    
    setSendingSms(true);
    try {
      const selectedCustomerData = selectedCustomers
        .map(id => customers.find(c => c.id === id))
        .filter((c): c is CustomerWithPurchases => c !== undefined && c.phone !== null);
      
      const customersData = selectedCustomerData.map(customer => ({
        customerName: customer.name,
        customerPhone: customer.phone!,
        message: messageText.replace("{customerName}", customer.name),
        purchasedProducts: customer.purchasedProducts.slice(0, 5).join(", "),
        totalPurchases: customer.salesCount,
        lastPurchaseDate: customer.lastPurchaseDate 
          ? format(new Date(customer.lastPurchaseDate), "dd/MM/yyyy") 
          : "N/A",
      }));

      // Send SMS for each customer
      let totalSent = 0;
      let totalFailed = 0;
      
      for (const customer of customersData) {
        try {
          await offlineShopService.sendFollowupSms({
            customerId: customer.customerPhone || "",
            customerPhone: customer.customerPhone,
            customerName: customer.customerName,
            message: customer.message,
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
      setSelectedCustomers([]);
      setCustomMessage("");
      setSelectedTemplate("new_product");
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      toast.error(error.message || (language === "bn" ? "SMS পাঠাতে সমস্যা হয়েছে" : "Failed to send SMS"));
    } finally {
      setSendingSms(false);
    }
  };

  const selectedCount = selectedCustomers.length;
  const selectableCount = filteredCustomers.filter(c => c.phone).length;

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
              {language === "bn" ? "ফলোআপ SMS" : "Followup SMS"}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {language === "bn" 
                ? "গ্রাহকদের নতুন পণ্য, অফার বা ইভেন্ট সম্পর্কে SMS পাঠান" 
                : "Send SMS to customers about new products, offers, or events"}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "মোট গ্রাহক" : "Total Customers"}
                  </p>
                  <p className="text-xl font-bold">{customers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <MessageSquareMore className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "ফোন সহ" : "With Phone"}
                  </p>
                  <p className="text-xl font-bold">{customersWithPhone.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "মোট বিক্রয়" : "Total Sales"}
                  </p>
                  <p className="text-xl font-bold">
                    {customers.reduce((sum, c) => sum + c.salesCount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Send className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "সিলেক্টেড" : "Selected"}
                  </p>
                  <p className="text-xl font-bold">{selectedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search + Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "bn" ? "গ্রাহক খুঁজুন..." : "Search customers..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="filterPhone"
                checked={filterHasPhone}
                onCheckedChange={(checked) => setFilterHasPhone(checked === true)}
              />
              <Label htmlFor="filterPhone" className="text-sm cursor-pointer">
                {language === "bn" ? "শুধু ফোন সহ" : "Only with phone"}
              </Label>
            </div>
          </div>
          
          <Button 
            onClick={handleOpenSmsModal}
            disabled={selectedCount === 0}
            className="w-full sm:w-auto"
          >
            <Send className="h-4 w-4 mr-2" />
            {language === "bn" 
              ? `SMS পাঠান (${selectedCount})` 
              : `Send SMS (${selectedCount})`}
          </Button>
        </div>

        {/* Customers Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{language === "bn" ? "কোন গ্রাহক পাওয়া যায়নি" : "No customers found"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedCount === selectableCount && selectableCount > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>{language === "bn" ? "গ্রাহক" : "Customer"}</TableHead>
                      <TableHead className="hidden sm:table-cell">{language === "bn" ? "ফোন" : "Phone"}</TableHead>
                      <TableHead className="text-right">{language === "bn" ? "মোট ক্রয়" : "Total Purchases"}</TableHead>
                      <TableHead className="text-right hidden md:table-cell">{language === "bn" ? "মোট টাকা" : "Total Amount"}</TableHead>
                      <TableHead className="hidden lg:table-cell">{language === "bn" ? "শেষ ক্রয়" : "Last Purchase"}</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCustomers.includes(customer.id)}
                            onCheckedChange={() => handleSelectCustomer(customer.id)}
                            disabled={!customer.phone}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {customer.phone || (language === "bn" ? "ফোন নেই" : "No phone")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {customer.phone ? (
                            <span className="text-sm">{customer.phone}</span>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {language === "bn" ? "নেই" : "N/A"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">
                            {customer.salesCount} {language === "bn" ? "বার" : "times"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell font-medium">
                          {formatCurrency(customer.totalAmount)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {customer.lastPurchaseDate 
                            ? format(new Date(customer.lastPurchaseDate), "dd MMM yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SMS Compose Modal */}
        <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquareMore className="h-5 w-5" />
                {language === "bn" ? "ফলোআপ SMS পাঠান" : "Send Followup SMS"}
              </DialogTitle>
              <DialogDescription>
                {language === "bn" 
                  ? `${selectedCount} জন গ্রাহককে SMS পাঠানো হবে`
                  : `SMS will be sent to ${selectedCount} customers`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label>{language === "bn" ? "টেমপ্লেট নির্বাচন করুন" : "Select Template"}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {smsTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? "default" : "outline"}
                      className="h-auto py-3 justify-start gap-2"
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      {template.icon}
                      <span className="text-xs">
                        {language === "bn" ? template.nameBn : template.name}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Message Preview/Edit */}
              <div className="space-y-2">
                <Label>
                  {selectedTemplate === "custom" 
                    ? (language === "bn" ? "কাস্টম মেসেজ" : "Custom Message")
                    : (language === "bn" ? "মেসেজ প্রিভিউ" : "Message Preview")}
                </Label>
                <Textarea
                  value={selectedTemplate === "custom" ? customMessage : getMessageText()}
                  onChange={(e) => {
                    if (selectedTemplate === "custom") {
                      setCustomMessage(e.target.value);
                    }
                  }}
                  readOnly={selectedTemplate !== "custom"}
                  rows={4}
                  placeholder={language === "bn" ? "আপনার মেসেজ লিখুন..." : "Write your message..."}
                  className={selectedTemplate !== "custom" ? "bg-muted" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  {language === "bn" 
                    ? "{customerName} দিয়ে গ্রাহকের নাম বসবে"
                    : "Use {customerName} for customer's name"}
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSmsModalOpen(false)}>
                {language === "bn" ? "বাতিল" : "Cancel"}
              </Button>
              <Button 
                onClick={handleSendFollowupSms} 
                disabled={sendingSms || !getMessageText().trim()}
              >
                {sendingSms ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {language === "bn" ? "পাঠানো হচ্ছে..." : "Sending..."}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {language === "bn" ? "SMS পাঠান" : "Send SMS"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Customer Details Modal */}
        <Dialog open={viewCustomerModal} onOpenChange={setViewCustomerModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{language === "bn" ? "গ্রাহকের তথ্য" : "Customer Details"}</DialogTitle>
            </DialogHeader>
            
            {selectedCustomerDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{language === "bn" ? "নাম" : "Name"}</p>
                    <p className="font-medium">{selectedCustomerDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{language === "bn" ? "ফোন" : "Phone"}</p>
                    <p className="font-medium">{selectedCustomerDetails.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{language === "bn" ? "মোট ক্রয়" : "Total Purchases"}</p>
                    <p className="font-medium">{selectedCustomerDetails.salesCount} {language === "bn" ? "বার" : "times"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{language === "bn" ? "মোট টাকা" : "Total Amount"}</p>
                    <p className="font-medium">{formatCurrency(selectedCustomerDetails.totalAmount)}</p>
                  </div>
                </div>
                
                {selectedCustomerDetails.purchasedProducts.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === "bn" ? "ক্রয়কৃত পণ্য" : "Purchased Products"}
                    </p>
                    <ScrollArea className="h-32">
                      <div className="flex flex-wrap gap-1">
                        {selectedCustomerDetails.purchasedProducts.map((product, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewCustomerModal(false)}>
                {language === "bn" ? "বন্ধ করুন" : "Close"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ShopLayout>
  );
};

export default ShopFollowupSms;
