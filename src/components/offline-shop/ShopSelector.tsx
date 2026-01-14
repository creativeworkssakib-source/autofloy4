import { useState } from "react";
import { Store, ChevronDown, Plus, Settings, Check, Trash2, AlertTriangle } from "lucide-react";
import { useShop, Shop } from "@/contexts/ShopContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export function ShopSelector() {
  const { shops, currentShop, isLoading, shopLimits, selectShop, createShop, updateShop, deleteShop } = useShop();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [deletingShop, setDeletingShop] = useState<Shop | null>(null);
  const [formData, setFormData] = useState({ name: "", address: "", phone: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    const result = await createShop({
      name: formData.name.trim(),
      address: formData.address.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
    });
    setIsSubmitting(false);
    if (result) {
      setIsCreateOpen(false);
      setFormData({ name: "", address: "", phone: "", email: "" });
    }
  };

  const handleEdit = async () => {
    if (!editingShop || !formData.name.trim()) return;
    setIsSubmitting(true);
    const result = await updateShop(editingShop.id, {
      name: formData.name.trim(),
      address: formData.address.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
    });
    setIsSubmitting(false);
    if (result) {
      setIsEditOpen(false);
      setEditingShop(null);
      setFormData({ name: "", address: "", phone: "", email: "" });
    }
  };

  const handleDelete = async () => {
    if (!deletingShop) return;
    setIsDeleting(true);
    const success = await deleteShop(deletingShop.id, true);
    setIsDeleting(false);
    if (success) {
      setIsDeleteOpen(false);
      setDeletingShop(null);
    }
  };

  const openEditModal = (shop: Shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      address: shop.address || "",
      phone: shop.phone || "",
      email: shop.email || "",
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (shop: Shop) => {
    setDeletingShop(shop);
    setIsDeleteOpen(true);
  };

  if (isLoading) {
    return <Skeleton className="h-10 w-[200px]" />;
  }

  const canCreateMore = shopLimits?.canCreateMore ?? false;
  const maxShops = shopLimits?.maxShops ?? 1;
  const isUnlimited = maxShops === -1;
  const canDelete = shops.length > 1;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 min-w-[160px] max-w-[200px] justify-between">
            <div className="flex items-center gap-2 truncate">
              <Store className="h-4 w-4 shrink-0" />
              <span className="truncate">{currentShop?.name || "Select Shop"}</span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px]">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>আপনার শপসমূহ</span>
            <Badge variant="secondary" className="text-xs">
              {shops.length}/{isUnlimited ? "∞" : maxShops}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {shops.map((shop) => (
            <DropdownMenuItem
              key={shop.id}
              className="flex items-center justify-between cursor-pointer"
              onClick={() => selectShop(shop.id)}
            >
              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                <Store className="h-4 w-4 shrink-0" />
                <span className="truncate">{shop.name}</span>
                {shop.is_default && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">ডিফল্ট</Badge>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0 ml-2">
                {currentShop?.id === shop.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(shop);
                  }}
                >
                  <Settings className="h-3 w-3" />
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(shop);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            className="cursor-pointer"
            disabled={!canCreateMore}
            onClick={() => {
              if (canCreateMore) {
                setFormData({ name: "", address: "", phone: "", email: "" });
                setIsCreateOpen(true);
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>নতুন শপ যোগ করুন</span>
          </DropdownMenuItem>
          
          {!canCreateMore && !isUnlimited && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              সর্বোচ্চ {maxShops}টি শপ। আপগ্রেড করুন।
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Shop Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>নতুন শপ তৈরি করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">শপের নাম *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="আপনার শপের নাম"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">ঠিকানা</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="শপের ঠিকানা"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">ফোন</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="shop@example.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>বাতিল</Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? "তৈরি হচ্ছে..." : "তৈরি করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shop Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>শপ সম্পাদনা করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">শপের নাম *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="আপনার শপের নাম"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">ঠিকানা</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="শপের ঠিকানা"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">ফোন</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">ইমেইল</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="shop@example.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>বাতিল</Button>
            <Button onClick={handleEdit} disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Shop Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              শপ মুছে ফেলতে চান?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                <strong className="text-foreground">{deletingShop?.name}</strong> শপ মুছে ফেলতে চাইছেন।
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm">
                <p className="font-medium text-destructive mb-2">⚠️ সতর্কতা:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>এই শপের সব বিক্রয় ডাটা মুছে যাবে</li>
                  <li>সব পণ্য এবং স্টক মুছে যাবে</li>
                  <li>সব গ্রাহক এবং সাপ্লায়ার মুছে যাবে</li>
                  <li>সব ক্রয়, খরচ, ক্যাশ ট্রানজাকশন মুছে যাবে</li>
                  <li>এই ডাটা আর ফিরে পাবেন না!</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}