import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, UserCog, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { offlineShopService } from "@/services/offlineShopService";
import { useLanguage } from "@/contexts/LanguageContext";

interface StaffUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  permissions: {
    can_see_reports: boolean;
    can_edit_products: boolean;
    can_record_purchases: boolean;
    can_record_sales: boolean;
    can_see_profit: boolean;
    can_manage_staff: boolean;
  };
  is_active: boolean;
  created_at: string;
}

const ShopStaff = () => {
  const { t } = useLanguage();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);

  const roleLabels: Record<string, { label: string; color: string }> = {
    owner: { label: t("shop.owner"), color: "default" },
    manager: { label: t("shop.manager"), color: "secondary" },
    cashier: { label: t("shop.cashier"), color: "outline" },
    staff: { label: t("shop.staffMember"), color: "outline" },
  };

  const permissionLabels: Record<string, string> = {
    can_see_reports: t("shop.canSeeReports"),
    can_edit_products: t("shop.canEditProducts"),
    can_record_purchases: t("shop.canRecordPurchases"),
    can_record_sales: t("shop.canRecordSales"),
    can_see_profit: t("shop.canSeeProfit"),
    can_manage_staff: t("shop.canManageStaff"),
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "staff",
    permissions: {
      can_see_reports: false,
      can_edit_products: false,
      can_record_purchases: false,
      can_record_sales: true,
      can_see_profit: false,
      can_manage_staff: false,
    },
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await offlineShopService.getStaff();
      setStaff(result.staff || []);
    } catch (error) {
      toast.error(t("shop.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await offlineShopService.updateStaff({ id: editingStaff.id, ...formData });
        toast.success(t("shop.staffUpdated"));
      } else {
        await offlineShopService.createStaff(formData);
        toast.success(t("shop.staffAdded"));
      }
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("shop.deleteConfirm"))) return;
    try {
      await offlineShopService.deleteStaff(id);
      toast.success(t("shop.staffMovedToTrash") || "Staff moved to trash");
      loadData();
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    }
  };

  const handleEdit = (staffUser: StaffUser) => {
    setEditingStaff(staffUser);
    setFormData({ name: staffUser.name, email: staffUser.email || "", phone: staffUser.phone || "", role: staffUser.role, permissions: staffUser.permissions });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingStaff(null);
    setFormData({ name: "", email: "", phone: "", role: "staff", permissions: { can_see_reports: false, can_edit_products: false, can_record_purchases: false, can_record_sales: true, can_see_profit: false, can_manage_staff: false } });
  };

  const updatePermission = (key: string, value: boolean) => {
    setFormData({ ...formData, permissions: { ...formData.permissions, [key]: value } });
  };

  const applyRolePreset = (role: string) => {
    let permissions = { ...formData.permissions };
    if (role === "owner") permissions = { can_see_reports: true, can_edit_products: true, can_record_purchases: true, can_record_sales: true, can_see_profit: true, can_manage_staff: true };
    else if (role === "manager") permissions = { can_see_reports: true, can_edit_products: true, can_record_purchases: true, can_record_sales: true, can_see_profit: true, can_manage_staff: false };
    else permissions = { can_see_reports: false, can_edit_products: false, can_record_purchases: false, can_record_sales: true, can_see_profit: false, can_manage_staff: false };
    setFormData({ ...formData, role, permissions });
  };

  return (
    <ShopLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t("shop.staffTitle")}</h1>
            <p className="text-muted-foreground">{t("shop.staffDesc")}</p>
          </div>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t("shop.newStaff")}
          </Button>
        </div>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-blue-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">{t("shop.staffAccessControl")}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t("shop.staffAccessDesc")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("shop.name")}</TableHead>
                  <TableHead>{t("shop.emailPhone")}</TableHead>
                  <TableHead>{t("shop.role")}</TableHead>
                  <TableHead>{t("shop.permissions")}</TableHead>
                  <TableHead>{t("shop.status")}</TableHead>
                  <TableHead className="text-right">{t("shop.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
                ) : staff.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><UserCog className="h-12 w-12 mx-auto text-muted-foreground mb-2" /><p>{t("shop.noStaff")}</p></TableCell></TableRow>
                ) : (
                  staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell><div className="text-sm">{s.email && <p>{s.email}</p>}{s.phone && <p className="text-muted-foreground">{s.phone}</p>}</div></TableCell>
                      <TableCell><Badge variant={roleLabels[s.role]?.color as any || "secondary"}>{roleLabels[s.role]?.label || s.role}</Badge></TableCell>
                      <TableCell><div className="flex flex-wrap gap-1">{Object.entries(s.permissions).filter(([_, v]) => v).slice(0, 2).map(([key]) => (<Badge key={key} variant="outline" className="text-xs">{permissionLabels[key]?.split(" ")[0]}</Badge>))}{Object.values(s.permissions).filter(v => v).length > 2 && (<Badge variant="outline" className="text-xs">+{Object.values(s.permissions).filter(v => v).length - 2}</Badge>)}</div></TableCell>
                      <TableCell><Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? t("common.active") : t("common.inactive")}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(s)}><Pencil className="mr-2 h-4 w-4" />{t("common.edit")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />{t("common.delete")}</DropdownMenuItem>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStaff ? t("shop.editStaff") : t("shop.newStaff")}</DialogTitle>
            <DialogDescription>{t("shop.staffDetails")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("shop.name")} *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>{t("shop.role")} *</Label><Select value={formData.role} onValueChange={applyRolePreset}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">{t("shop.owner")}</SelectItem><SelectItem value="manager">{t("shop.manager")}</SelectItem><SelectItem value="cashier">{t("shop.cashier")}</SelectItem><SelectItem value="staff">{t("shop.staffMember")}</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("shop.email")}</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("shop.phone")}</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            </div>
            <div className="space-y-3"><Label>{t("shop.permissions")}</Label><div className="space-y-3 border rounded-lg p-4">{Object.entries(permissionLabels).map(([key, label]) => (<div key={key} className="flex items-center justify-between"><Label htmlFor={key} className="font-normal cursor-pointer">{label}</Label><Switch id={key} checked={formData.permissions[key as keyof typeof formData.permissions]} onCheckedChange={(checked) => updatePermission(key, checked)} /></div>))}</div></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button><Button type="submit">{editingStaff ? t("shop.update") : t("common.add")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ShopLayout>
  );
};

export default ShopStaff;