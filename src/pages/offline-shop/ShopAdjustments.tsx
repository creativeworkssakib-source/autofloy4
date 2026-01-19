import { useState, useEffect } from "react";
import { Plus, Search, AlertTriangle, Download, Trash2, WifiOff, Wifi, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DeleteConfirmDialog } from "@/components/offline-shop/DeleteConfirmDialog";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import * as XLSX from "xlsx";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShop } from "@/contexts/ShopContext";
import DateRangeFilter, { DateRangePreset, DateRange, getDateRangeFromPreset } from "@/components/offline-shop/DateRangeFilter";
import { isWithinInterval } from "date-fns";
import { useOfflineAdjustments } from "@/hooks/useOfflineShopData";
import { useOfflineProducts, useOfflineSettings } from "@/hooks/useOfflineData";

interface Adjustment {
  id: string;
  product_id?: string;
  product_name: string;
  type: string;
  quantity: number;
  adjustment_date: string;
  reason?: string;
  cost_impact: number;
  notes?: string;
  created_at: string;
}

const ShopAdjustments = () => {
  const { t, language } = useLanguage();
  const { currentShop } = useShop();
  
  const adjustmentTypes = [
    { value: "damage", label: t("shop.damage"), color: "destructive" },
    { value: "loss", label: t("shop.loss"), color: "destructive" },
    { value: "expired", label: t("shop.expired"), color: "secondary" },
    { value: "theft", label: t("shop.theft"), color: "destructive" },
    { value: "manual_increase", label: t("shop.manualIncrease"), color: "default" },
    { value: "manual_decrease", label: t("shop.manualDecrease"), color: "secondary" },
    { value: "return", label: t("shop.return"), color: "default" },
  ];
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("");

  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRangePreset>('this_month');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use offline hooks
  const { adjustments, loading: isLoading, refetch, createAdjustment, deleteAdjustments } = useOfflineAdjustments(filterType);
  const { products } = useOfflineProducts();
  const { settings } = useOfflineSettings();
  const currency = settings?.currency || "BDT";

  const [formData, setFormData] = useState({
    product_id: "",
    product_name: "",
    type: "damage",
    quantity: 1,
    adjustment_date: new Date().toISOString().split("T")[0],
    reason: "",
    notes: "",
  });

  // Filter adjustments by date range and search
  const currentDateRange = getDateRangeFromPreset(dateRange, customDateRange);
  const filteredAdjustments = adjustments.filter(
    (a) => {
      const matchesSearch = a.product_name.toLowerCase().includes(searchQuery.toLowerCase());
      const adjustmentDate = new Date(a.adjustment_date);
      const matchesDate = isWithinInterval(adjustmentDate, { start: currentDateRange.from, end: currentDateRange.to });
      return matchesSearch && matchesDate;
    }
  );

  const handleDateRangeChange = (range: DateRangePreset, dates: DateRange) => {
    setDateRange(range);
    if (range === 'custom') {
      setCustomDateRange(dates);
    }
  };

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAdjustments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAdjustments.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const result = await deleteAdjustments(selectedIds);
      const deletedCount = result.deleted?.length || 0;
      toast.success(
        language === "bn"
          ? `${deletedCount}টি এডজাস্টমেন্ট ট্র্যাশে সরানো হয়েছে`
          : `${deletedCount} adjustment(s) moved to trash`
      );
      setSelectedIds([]);
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id) {
      toast.error(t("shop.selectProductAdj"));
      return;
    }
    setIsSubmitting(true);
    try {
      const selectedProduct = products.find((p: any) => p.id === formData.product_id);
      const adjustmentData = {
        product_id: formData.product_id,
        product_name: selectedProduct?.name || formData.product_name,
        type: formData.type,
        quantity: formData.quantity,
        adjustment_date: formData.adjustment_date,
        reason: formData.reason,
        notes: formData.notes,
      };
      console.log("Creating adjustment:", adjustmentData);
      await createAdjustment(adjustmentData);
      toast.success(t("shop.adjustmentSaved"));
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Adjustment error:", error);
      toast.error(error.message || t("shop.errorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      product_name: "",
      type: "damage",
      quantity: 1,
      adjustment_date: new Date().toISOString().split("T")[0],
      reason: "",
      notes: "",
    });
  };

  const handleExport = () => {
    const exportData = adjustments.map((a) => ({
      [t("shop.date")]: new Date(a.adjustment_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US"),
      [t("shop.productName")]: a.product_name,
      [t("shop.type")]: adjustmentTypes.find(at => at.value === a.type)?.label || a.type,
      [t("shop.quantity")]: a.quantity,
      [t("shop.costImpact")]: a.cost_impact,
      [t("shop.reason")]: a.reason || "",
      [t("shop.notes")]: a.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Adjustments");
    XLSX.writeFile(wb, "stock-adjustments.xlsx");
    toast.success(t("shop.excelDownloaded"));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTypeInfo = (type: string) => {
    return adjustmentTypes.find(at => at.value === type) || { label: type, color: "secondary" };
  };

  // Calculate summary
  const totalLoss = adjustments
    .filter(a => ["damage", "loss", "expired", "theft", "manual_decrease"].includes(a.type))
    .reduce((sum, a) => sum + Number(a.cost_impact), 0);

  return (
    <ShopLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{t("shop.adjustmentsTitle")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t("shop.adjustmentsDesc")} • {filteredAdjustments.length} {language === "bn" ? "টি" : "items"}
                {selectedIds.length > 0 && ` • ${selectedIds.length} ${language === "bn" ? "টি নির্বাচিত" : "selected"}`}
              </p>
            </div>
            <DateRangeFilter
              selectedRange={dateRange}
              onRangeChange={handleDateRangeChange}
              customDateRange={customDateRange}
              compact
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" disabled={isBulkDeleting} onClick={() => setDeleteDialogOpen(true)} className="text-xs sm:text-sm">
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {language === "bn" ? "মুছুন" : "Delete"} ({selectedIds.length})
              </Button>
            )}

            <Button variant="outline" onClick={handleExport} size="sm" className="text-xs sm:text-sm">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {t("common.export")}
            </Button>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} size="sm" className="text-xs sm:text-sm">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {t("shop.newAdjustment")}
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("shop.totalLoss")}</p>
                <p className="text-3xl font-bold text-destructive">{formatCurrency(totalLoss)}</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-destructive/50" />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("shop.searchProducts")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType || "all"} onValueChange={(val) => setFilterType(val === "all" ? "" : val)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("shop.allTypes")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("shop.allTypes")}</SelectItem>
              {adjustmentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredAdjustments.length > 0 && selectedIds.length === filteredAdjustments.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>{t("shop.date")}</TableHead>
                  <TableHead>{t("shop.productName")}</TableHead>
                  <TableHead>{t("shop.type")}</TableHead>
                  <TableHead>{t("shop.quantity")}</TableHead>
                  <TableHead>{t("shop.costImpact")}</TableHead>
                  <TableHead>{t("shop.reason")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">{t("common.loading")}</TableCell>
                  </TableRow>
                ) : filteredAdjustments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p>{t("shop.noAdjustments")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdjustments.map((adjustment) => {
                    const typeInfo = getTypeInfo(adjustment.type);
                    return (
                      <TableRow key={adjustment.id} className={selectedIds.includes(adjustment.id) ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(adjustment.id)}
                            onCheckedChange={() => toggleSelectOne(adjustment.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(adjustment.adjustment_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                        </TableCell>
                        <TableCell className="font-medium">{adjustment.product_name}</TableCell>
                        <TableCell>
                          <Badge variant={typeInfo.color as any}>{typeInfo.label}</Badge>
                        </TableCell>
                        <TableCell>{adjustment.quantity}</TableCell>
                        <TableCell className="text-destructive">
                          {formatCurrency(Number(adjustment.cost_impact))}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {adjustment.reason || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("shop.stockAdjustment")}</DialogTitle>
            <DialogDescription>{t("shop.adjustmentDetails")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("shop.productName")} *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => {
                  const product = products.find(p => p.id === value);
                  setFormData({ 
                    ...formData, 
                    product_id: value,
                    product_name: product?.name || ""
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("shop.selectProductAdj")} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({t("shop.stock")}: {product.stock_quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("shop.type")} *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {adjustmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">{t("shop.quantity")} *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={formData.quantity === 0 ? "" : formData.quantity}
                  onChange={(e) => { 
                    const val = e.target.value;
                    setFormData({ ...formData, quantity: val === "" ? 0 : parseInt(val) || 0 }); 
                  }}
                  onBlur={(e) => {
                    if (!e.target.value || parseInt(e.target.value) < 1) {
                      setFormData({ ...formData, quantity: 1 });
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustment_date">{t("shop.date")}</Label>
              <Input
                id="adjustment_date"
                type="date"
                value={formData.adjustment_date}
                onChange={(e) => setFormData({ ...formData, adjustment_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">{t("shop.reason")}</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={t("shop.reasonPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("shop.notes")}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={!formData.product_id || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {language === "bn" ? "প্রক্রিয়াকরণ..." : "Processing..."}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          handleBulkDelete();
          setDeleteDialogOpen(false);
        }}
        title={language === "en" ? "adjustments" : "এডজাস্টমেন্ট"}
        itemCount={selectedIds.length}
        isSoftDelete={true}
        isLoading={isBulkDeleting}
      />
    </ShopLayout>

  );
};

export default ShopAdjustments;
