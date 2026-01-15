import { useState, useEffect } from "react";
import { Plus, Search, Users, Phone, MapPin, MoreHorizontal, Pencil, Trash2, WifiOff, Cloud } from "lucide-react";
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/offline-shop/DeleteConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { useOfflineCustomers, useOfflineSettings } from "@/hooks/useOfflineData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShop } from "@/contexts/ShopContext";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  total_purchases: number;
  total_due: number;
}

const ShopCustomers = () => {
  const { t, language } = useLanguage();
  const { currentShop } = useShop();
  const { customers, loading: isLoading, refetch, createCustomer, updateCustomer, deleteCustomer } = useOfflineCustomers();
  const { settings } = useOfflineSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  // Refetch when shop changes
  useEffect(() => {
    if (currentShop?.id) {
      refetch();
    }
  }, [currentShop?.id, refetch]);

  const filteredCustomers = (customers as Customer[]).filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map((c) => c.id));
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
      for (const id of selectedIds) {
        await deleteCustomer(id);
      }
      toast.success(
        language === "bn"
          ? `${selectedIds.length}টি গ্রাহক ট্র্যাশে সরানো হয়েছে`
          : `${selectedIds.length} customer(s) moved to trash`
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
    try {
      if (editingCustomer) {
        await updateCustomer({ id: editingCustomer.id, ...formData });
        toast.success(t("shop.customerUpdated"));
      } else {
        await createCustomer(formData);
        toast.success(t("shop.customerAdded"));
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setIsModalOpen(true);
  };

  const openSingleDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleSingleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteCustomer(deletingId);
      toast.success(language === "bn" ? "গ্রাহক ট্র্যাশে সরানো হয়েছে" : "Customer moved to trash");
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    } finally {
      setIsDeleting(false);
    }
  };


  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({ name: "", phone: "", email: "", address: "", notes: "" });
  };

  const currency = settings?.currency || "BDT";
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ShopLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{t("shop.customersTitle")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t("shop.customersDesc")} • {customers.length} {language === "bn" ? "জন গ্রাহক" : "customers"}
                {selectedIds.length > 0 && ` • ${selectedIds.length} ${language === "bn" ? "টি নির্বাচিত" : "selected"}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" disabled={isBulkDeleting} onClick={() => setDeleteDialogOpen(true)} className="text-xs sm:text-sm">
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {language === "bn" ? "মুছুন" : "Delete"} ({selectedIds.length})
              </Button>
            )}

            <Button onClick={() => { resetForm(); setIsModalOpen(true); }} size="sm" className="text-xs sm:text-sm">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {t("shop.newCustomer")}
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("shop.searchCustomers")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[650px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredCustomers.length > 0 && selectedIds.length === filteredCustomers.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>{t("shop.name")}</TableHead>
                  <TableHead>{t("shop.phone")}</TableHead>
                  <TableHead>{t("shop.address")}</TableHead>
                  <TableHead>{t("shop.totalPurchases")}</TableHead>
                  <TableHead>{t("common.due")}</TableHead>
                  <TableHead className="text-right">{t("shop.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">{t("common.loading")}</TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p>{t("shop.noCustomers")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className={selectedIds.includes(customer.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(customer.id)}
                          onCheckedChange={() => toggleSelectOne(customer.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.address && (
                          <div className="flex items-center gap-1 max-w-[200px] truncate">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {customer.address}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(Number(customer.total_purchases))}</TableCell>
                      <TableCell className={Number(customer.total_due) > 0 ? "text-red-500" : ""}>
                        {formatCurrency(Number(customer.total_due))}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(customer)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openSingleDeleteDialog(customer.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("common.delete")}
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
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
            <DialogTitle>{editingCustomer ? t("shop.editCustomer") : t("shop.newCustomer")}</DialogTitle>
            <DialogDescription>{t("shop.customerDetails")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("shop.name")} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("shop.phone")}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("shop.email")}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("shop.address")}</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{editingCustomer ? t("shop.update") : t("common.add")}</Button>
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
        onConfirm={() => {
          if (deletingId) {
            handleSingleDelete();
          } else {
            handleBulkDelete();
            setDeleteDialogOpen(false);
          }
        }}
        title={language === "en" ? "customers" : "গ্রাহক"}
        itemCount={deletingId ? 1 : selectedIds.length}
        isSoftDelete={true}
        isLoading={isDeleting || isBulkDeleting}
      />

    </ShopLayout>

  );
};

export default ShopCustomers;