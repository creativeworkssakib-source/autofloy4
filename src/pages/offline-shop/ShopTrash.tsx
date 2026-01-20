import { useState, useEffect } from "react";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, RotateCcw, Search, Loader2, AlertTriangle, Lock, KeyRound, Package, ShoppingCart, Users, Truck, Receipt, RotateCw, AlertCircle, Settings, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { offlineShopService } from "@/services/offlineShopService";
import { format, differenceInDays } from "date-fns";

interface TrashItem {
  id: string;
  original_id: string;
  original_table: string;
  data: any;
  deleted_at: string;
  expires_at: string;
  restored_at: string | null;
  permanently_deleted_at: string | null;
}

const ShopTrash = () => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTable, setFilterTable] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Passcode states
  const [hasPasscode, setHasPasscode] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [showSetPasscodeModal, setShowSetPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [passcodeLoading, setPasscodeLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);

  const loadTrashItems = async () => {
    try {
      setLoading(true);
      const result = await offlineShopService.getTrash();
      setTrashItems(result.trash || result.items || []);
      
      // Check if user has passcode set
      const settingsResult = await offlineShopService.getSettings();
      setHasPasscode(settingsResult.settings?.has_trash_passcode || false);
    } catch (error) {
      console.error("Error loading trash items:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "ট্র্যাশ লোড করতে সমস্যা হয়েছে" : "Failed to load trash items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrashItems();
  }, []);

  const getTableLabel = (table: string) => {
    const labels: Record<string, { en: string; bn: string }> = {
      shop_purchases: { en: "Purchases", bn: "ক্রয়সমূহ" },
      shop_sales: { en: "Sales", bn: "বিক্রয়সমূহ" },
      shop_products: { en: "Products", bn: "পণ্যসমূহ" },
      shop_expenses: { en: "Expenses", bn: "খরচসমূহ" },
      shop_customers: { en: "Customers", bn: "গ্রাহকসমূহ" },
      shop_suppliers: { en: "Suppliers", bn: "সরবরাহকারীসমূহ" },
      shop_returns: { en: "Customer Returns", bn: "গ্রাহক রিটার্নসমূহ" },
      shop_supplier_returns: { en: "Supplier Returns", bn: "সরবরাহকারী রিটার্নসমূহ" },
      shop_damages: { en: "Damages", bn: "ক্ষতিসমূহ" },
      shop_stock_adjustments: { en: "Stock Adjustments", bn: "স্টক সমন্বয়সমূহ" },
      shop_staff_users: { en: "Staff", bn: "কর্মীসমূহ" },
      shop_categories: { en: "Categories", bn: "ক্যাটাগরিসমূহ" },
    };
    return labels[table]?.[language] || table;
  };

  const getTableIcon = (table: string) => {
    const icons: Record<string, React.ReactNode> = {
      shop_purchases: <ShoppingCart className="h-5 w-5" />,
      shop_sales: <Receipt className="h-5 w-5" />,
      shop_products: <Package className="h-5 w-5" />,
      shop_expenses: <Receipt className="h-5 w-5" />,
      shop_customers: <Users className="h-5 w-5" />,
      shop_suppliers: <Truck className="h-5 w-5" />,
      shop_returns: <RotateCw className="h-5 w-5" />,
      shop_supplier_returns: <RotateCw className="h-5 w-5" />,
      shop_damages: <AlertCircle className="h-5 w-5" />,
      shop_stock_adjustments: <Settings className="h-5 w-5" />,
      shop_staff_users: <Users className="h-5 w-5" />,
      shop_categories: <Package className="h-5 w-5" />,
    };
    return icons[table] || <Trash2 className="h-5 w-5" />;
  };

  const getTableColor = (table: string) => {
    const colors: Record<string, string> = {
      shop_purchases: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      shop_sales: "bg-green-500/10 text-green-600 border-green-500/30",
      shop_products: "bg-purple-500/10 text-purple-600 border-purple-500/30",
      shop_expenses: "bg-red-500/10 text-red-600 border-red-500/30",
      shop_customers: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
      shop_suppliers: "bg-orange-500/10 text-orange-600 border-orange-500/30",
      shop_returns: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      shop_supplier_returns: "bg-pink-500/10 text-pink-600 border-pink-500/30",
      shop_damages: "bg-rose-500/10 text-rose-600 border-rose-500/30",
      shop_stock_adjustments: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
      shop_staff_users: "bg-teal-500/10 text-teal-600 border-teal-500/30",
      shop_categories: "bg-violet-500/10 text-violet-600 border-violet-500/30",
    };
    return colors[table] || "bg-muted text-muted-foreground border-border";
  };

  const getItemName = (item: TrashItem) => {
    const data = item.data;
    if (data.name) return data.name;
    if (data.product_name) return data.product_name;
    if (data.invoice_number) return data.invoice_number;
    if (data.supplier_name) return data.supplier_name;
    if (data.customer_name) return data.customer_name;
    if (data.category) return data.category;
    return item.original_id.slice(0, 8);
  };

  const getDaysRemaining = (expiresAt: string) => {
    const days = differenceInDays(new Date(expiresAt), new Date());
    return Math.max(0, days);
  };

  const filteredItems = trashItems.filter((item) => {
    const matchesSearch = getItemName(item).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTable = filterTable === "all" || item.original_table === filterTable;
    return matchesSearch && matchesTable && !item.restored_at && !item.permanently_deleted_at;
  });

  // Group items by table
  const groupedItems = filteredItems.reduce((acc, item) => {
    const table = item.original_table;
    if (!acc[table]) {
      acc[table] = [];
    }
    acc[table].push(item);
    return acc;
  }, {} as Record<string, TrashItem[]>);

  // State for collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const uniqueTables = Object.keys(groupedItems);

  const toggleSection = (table: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [table]: !prev[table]
    }));
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRestore = async (id: string) => {
    try {
      setActionLoading(true);
      const item = trashItems.find(i => i.id === id);
      await offlineShopService.restoreFromTrash(id, item?.original_table || "");
      toast({
        title: language === "bn" ? "সফল" : "Success",
        description: language === "bn" ? "আইটেম পুনরুদ্ধার করা হয়েছে" : "Item restored successfully",
      });
      loadTrashItems();
    } catch (error) {
      console.error("Error restoring item:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "পুনরুদ্ধার করতে সমস্যা হয়েছে" : "Failed to restore item",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetPasscode = async () => {
    if (newPasscode.length < 4) {
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "পাসকোড কমপক্ষে ৪ অক্ষরের হতে হবে" : "Passcode must be at least 4 characters",
        variant: "destructive",
      });
      return;
    }
    
    if (newPasscode !== confirmPasscode) {
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "পাসকোড মিলছে না" : "Passcodes do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      setPasscodeLoading(true);
      await offlineShopService.updateSettings({ trash_passcode: newPasscode });
      setHasPasscode(true);
      setShowSetPasscodeModal(false);
      setNewPasscode("");
      setConfirmPasscode("");
      toast({
        title: language === "bn" ? "সফল" : "Success",
        description: language === "bn" ? "পাসকোড সেট করা হয়েছে" : "Passcode set successfully",
      });
    } catch (error: any) {
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: error.message || "Failed to set passcode",
        variant: "destructive",
      });
    } finally {
      setPasscodeLoading(false);
    }
  };

  const handlePermanentDeleteClick = (id: string) => {
    if (hasPasscode) {
      setPendingDeleteId(id);
      setShowPasscodeModal(true);
    } else {
      // Show option to set passcode first
      setShowSetPasscodeModal(true);
    }
  };

  const handlePasscodeVerifyAndDelete = async () => {
    if (!passcodeInput) {
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "পাসকোড দিন" : "Enter passcode",
        variant: "destructive",
      });
      return;
    }

    try {
      setPasscodeLoading(true);
      
      if (pendingBulkDelete) {
        // Bulk delete (single request)
        const idsToDelete = filteredItems
          .filter((i) => selectedItems.includes(i.id))
          .map((i) => i.id);

        // Delete items one by one
        let bulkDeletedCount = 0;
        const bulkDeletedIds: string[] = [];
        for (const id of idsToDelete) {
          try {
            const item = trashItems.find(i => i.id === id);
            await offlineShopService.permanentDelete(id, item?.original_table || "");
            bulkDeletedCount++;
            bulkDeletedIds.push(id);
          } catch {
            // Skip failures
          }
        }
        const notDeleted = Math.max(0, idsToDelete.length - bulkDeletedCount);
        
        if (bulkDeletedCount > 0) {
          toast({
            title: language === "bn" ? "সফল" : "Success",
            description:
              language === "bn"
                ? `${bulkDeletedCount}টি আইটেম স্থায়ীভাবে মুছে ফেলা হয়েছে`
                : `${bulkDeletedCount} items permanently deleted`,
          });
        }

        if (notDeleted > 0) {
          toast({
            title: language === "bn" ? "নোট" : "Note",
            description:
              language === "bn"
                ? `${notDeleted}টি আইটেম মুছে ফেলা যায়নি (হয়তো ইতিমধ্যে মুছে গেছে/রিস্টোর হয়েছে)`
                : `${notDeleted} item(s) could not be deleted (may already be deleted/restored)`,
          });
        }

        setSelectedItems([]);
      } else if (pendingDeleteId) {
        // Single delete
        const item = trashItems.find(i => i.id === pendingDeleteId);
        await offlineShopService.permanentDelete(pendingDeleteId, item?.original_table || "");
        toast({
          title: language === "bn" ? "সফল" : "Success",
          description: language === "bn" ? "আইটেম স্থায়ীভাবে মুছে ফেলা হয়েছে" : "Item permanently deleted",
        });
      }

      setShowPasscodeModal(false);
      setPasscodeInput("");
      setPendingDeleteId(null);
      setPendingBulkDelete(false);
      loadTrashItems();
    } catch (error: any) {
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setPasscodeLoading(false);
    }
  };

  const handleBulkDeleteClick = () => {
    if (hasPasscode) {
      setPendingBulkDelete(true);
      setShowPasscodeModal(true);
    } else {
      setShowSetPasscodeModal(true);
    }
  };

  const handleBulkRestore = async () => {
    try {
      setActionLoading(true);
      for (const id of selectedItems) {
        const item = trashItems.find(i => i.id === id);
        await offlineShopService.restoreFromTrash(id, item?.original_table || "");
      }
      toast({
        title: language === "bn" ? "সফল" : "Success",
        description: language === "bn" 
          ? `${selectedItems.length}টি আইটেম পুনরুদ্ধার করা হয়েছে` 
          : `${selectedItems.length} items restored`,
      });
      setSelectedItems([]);
      loadTrashItems();
    } catch (error) {
      console.error("Error bulk restoring:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "পুনরুদ্ধার করতে সমস্যা হয়েছে" : "Failed to restore items",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <ShopLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {language === "bn" ? "ট্র্যাশ বিন" : "Trash Bin"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {language === "bn" 
                ? "মুছে ফেলা আইটেমগুলো ৭ দিন পর্যন্ত এখানে থাকবে" 
                : "Deleted items are kept here for 7 days before permanent deletion"}
            </p>
          </div>
          
          {/* Passcode Status */}
          <div className="flex flex-wrap items-center gap-2">
            {hasPasscode ? (
              <Badge variant="outline" className="gap-1 text-xs sm:text-sm">
                <Lock className="h-3 w-3" />
                {language === "bn" ? "পাসকোড সেট আছে" : "Passcode Set"}
              </Badge>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowSetPasscodeModal(true)} className="text-xs sm:text-sm">
                <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {language === "bn" ? "পাসকোড সেট করুন" : "Set Passcode"}
              </Button>
            )}
          </div>
        </div>

        {/* Warning Card */}
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p>
                  {language === "bn" 
                    ? "স্থায়ীভাবে মুছে ফেলা আইটেম পুনরুদ্ধার করা যাবে না। সতর্কতার সাথে মুছুন।" 
                    : "Permanently deleted items cannot be recovered. Delete with caution."}
                </p>
                {!hasPasscode && (
                  <p className="mt-1 font-medium">
                    {language === "bn"
                      ? "ইনস্ট্যান্ট ডিলিটের জন্য প্রথমে পাসকোড সেট করুন। পাসকোড ভুলে গেলে অ্যাডমিনের সাথে যোগাযোগ করুন।"
                      : "Set a passcode first for instant delete. Contact admin if you forget it."}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === "bn" ? "অনুসন্ধান করুন..." : "Search..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filter by Type */}
                <Select value={filterTable} onValueChange={setFilterTable}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={language === "bn" ? "সব ধরন" : "All Types"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {language === "bn" ? "সব ধরন" : "All Types"}
                    </SelectItem>
                    {uniqueTables.map(table => (
                      <SelectItem key={table} value={table}>
                        {getTableLabel(table)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions */}
              {selectedItems.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkRestore}
                    disabled={actionLoading}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {language === "bn" ? `${selectedItems.length}টি পুনরুদ্ধার` : `Restore ${selectedItems.length}`}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    disabled={actionLoading}
                    onClick={handleBulkDeleteClick}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {language === "bn" ? `${selectedItems.length}টি মুছুন` : `Delete ${selectedItems.length}`}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Trash2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">
                  {language === "bn" ? "ট্র্যাশ খালি" : "Trash is empty"}
                </p>
                <p className="text-muted-foreground">
                  {language === "bn" ? "কোনো মুছে ফেলা আইটেম নেই" : "No deleted items found"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select All */}
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Checkbox
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {language === "bn" ? "সব সিলেক্ট করুন" : "Select All"}
                  </span>
                </div>

                {/* Grouped Sections */}
                {Object.entries(groupedItems).map(([table, items]) => (
                  <Collapsible
                    key={table}
                    open={!collapsedSections[table]}
                    onOpenChange={() => toggleSection(table)}
                  >
                    <Card className={`border ${getTableColor(table).split(' ')[2]}`}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className={`cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg ${getTableColor(table).split(' ').slice(0, 2).join(' ')}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${getTableColor(table)}`}>
                                {getTableIcon(table)}
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  {getTableLabel(table)}
                                </CardTitle>
                                <CardDescription>
                                  {items.length} {language === "bn" ? "টি আইটেম" : items.length === 1 ? "item" : "items"}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {items.filter(i => getDaysRemaining(i.expires_at) <= 3).length} {language === "bn" ? "শীঘ্রই মুছে যাবে" : "expiring soon"}
                              </Badge>
                              {collapsedSections[table] ? (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[50px]"></TableHead>
                                  <TableHead>{language === "bn" ? "নাম" : "Name"}</TableHead>
                                  <TableHead>{language === "bn" ? "মুছার তারিখ" : "Deleted At"}</TableHead>
                                  <TableHead>{language === "bn" ? "বাকি দিন" : "Days Left"}</TableHead>
                                  <TableHead>{language === "bn" ? "মূল্য" : "Amount"}</TableHead>
                                  <TableHead className="text-right">{language === "bn" ? "অ্যাকশন" : "Actions"}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {items.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedItems.includes(item.id)}
                                        onCheckedChange={() => toggleSelectItem(item.id)}
                                      />
                                    </TableCell>
                                    <TableCell className="font-medium">{getItemName(item)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {format(new Date(item.deleted_at), "dd MMM yyyy, hh:mm a")}
                                    </TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant={getDaysRemaining(item.expires_at) <= 3 ? "destructive" : "secondary"}
                                      >
                                        {getDaysRemaining(item.expires_at)} {language === "bn" ? "দিন" : "days"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {item.data.total_amount 
                                        ? formatCurrency(item.data.total_amount)
                                        : item.data.total 
                                          ? formatCurrency(item.data.total)
                                          : item.data.amount 
                                            ? formatCurrency(item.data.amount)
                                            : item.data.selling_price
                                              ? formatCurrency(item.data.selling_price)
                                              : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex gap-2 justify-end">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleRestore(item.id)}
                                          disabled={actionLoading}
                                        >
                                          <RotateCcw className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="destructive" 
                                          size="sm" 
                                          disabled={actionLoading}
                                          onClick={() => handlePermanentDeleteClick(item.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{filteredItems.length}</p>
                <p className="text-sm text-muted-foreground">
                  {language === "bn" ? "মোট আইটেম" : "Total Items"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">
                  {filteredItems.filter(i => getDaysRemaining(i.expires_at) <= 3).length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "bn" ? "৩ দিনের মধ্যে মুছে যাবে" : "Expiring in 3 days"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">
                  {filteredItems.filter(i => getDaysRemaining(i.expires_at) <= 1).length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "bn" ? "আজকে মুছে যাবে" : "Expiring today"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Set Passcode Modal */}
      <Dialog open={showSetPasscodeModal} onOpenChange={setShowSetPasscodeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              {language === "bn" ? "ট্র্যাশ পাসকোড সেট করুন" : "Set Trash Passcode"}
            </DialogTitle>
            <DialogDescription>
              {language === "bn"
                ? "ইনস্ট্যান্ট ডিলিটের জন্য পাসকোড সেট করুন। এই পাসকোড পরে পরিবর্তন করা যাবে না। ভুলে গেলে অ্যাডমিনের সাথে যোগাযোগ করুন।"
                : "Set a passcode for instant delete. This cannot be changed later. Contact admin if you forget it."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === "bn" ? "নতুন পাসকোড" : "New Passcode"}</Label>
              <Input
                type="password"
                placeholder={language === "bn" ? "কমপক্ষে ৪ অক্ষর" : "At least 4 characters"}
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "bn" ? "পাসকোড নিশ্চিত করুন" : "Confirm Passcode"}</Label>
              <Input
                type="password"
                placeholder={language === "bn" ? "আবার পাসকোড লিখুন" : "Enter passcode again"}
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetPasscodeModal(false)}>
              {language === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button onClick={handleSetPasscode} disabled={passcodeLoading}>
              {passcodeLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "bn" ? "সেট করুন" : "Set Passcode"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Passcode Modal */}
      <Dialog open={showPasscodeModal} onOpenChange={(open) => {
        if (!open) {
          setShowPasscodeModal(false);
          setPasscodeInput("");
          setPendingDeleteId(null);
          setPendingBulkDelete(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {language === "bn" ? "পাসকোড দিন" : "Enter Passcode"}
            </DialogTitle>
            <DialogDescription>
              {language === "bn"
                ? "স্থায়ীভাবে মুছে ফেলতে আপনার পাসকোড দিন।"
                : "Enter your passcode to permanently delete."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label>{language === "bn" ? "পাসকোড" : "Passcode"}</Label>
              <Input
                type="password"
                placeholder="••••"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePasscodeVerifyAndDelete();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasscodeModal(false)}>
              {language === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handlePasscodeVerifyAndDelete} disabled={passcodeLoading}>
              {passcodeLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {language === "bn" ? "মুছে ফেলুন" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ShopLayout>
  );
};

export default ShopTrash;
