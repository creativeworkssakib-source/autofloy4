import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ProductVariant,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";

interface VariantManagerProps {
  productId: string;
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  currency: string;
  basePrice: number;
}

interface EditingVariant {
  id?: string;
  name: string;
  sku: string;
  size: string;
  color: string;
  price_adjustment: number;
  stock_quantity: number | null;
  is_active: boolean;
}

const emptyVariant: EditingVariant = {
  name: "",
  sku: "",
  size: "",
  color: "",
  price_adjustment: 0,
  stock_quantity: null,
  is_active: true,
};

export function VariantManager({
  productId,
  variants,
  onVariantsChange,
  currency,
  basePrice,
}: VariantManagerProps) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditingVariant>(emptyVariant);
  const [isSaving, setIsSaving] = useState(false);

  const getCurrencySymbol = () => {
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      default: return "৳";
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setForm(emptyVariant);
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingId(variant.id);
    setIsAdding(false);
    setForm({
      id: variant.id,
      name: variant.name,
      sku: variant.sku || "",
      size: variant.size || "",
      color: variant.color || "",
      price_adjustment: variant.price_adjustment,
      stock_quantity: variant.stock_quantity,
      is_active: variant.is_active,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm(emptyVariant);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Variant name is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        // Update existing
        const updated = await updateProductVariant(editingId, {
          name: form.name,
          sku: form.sku || null,
          size: form.size || null,
          color: form.color || null,
          price_adjustment: form.price_adjustment,
          stock_quantity: form.stock_quantity,
          is_active: form.is_active,
        });
        if (updated) {
          onVariantsChange(
            variants.map((v) => (v.id === editingId ? updated : v))
          );
          toast({ title: "Variant updated" });
        } else {
          toast({ title: "Failed to update variant", variant: "destructive" });
        }
      } else {
        // Create new
        const created = await createProductVariant({
          product_id: productId,
          name: form.name,
          sku: form.sku || null,
          size: form.size || null,
          color: form.color || null,
          price_adjustment: form.price_adjustment,
          stock_quantity: form.stock_quantity,
          is_active: form.is_active,
        });
        if (created) {
          onVariantsChange([...variants, created]);
          toast({ title: "Variant added" });
        } else {
          toast({ title: "Failed to add variant", variant: "destructive" });
        }
      }
      handleCancel();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteProductVariant(id);
    if (success) {
      onVariantsChange(variants.filter((v) => v.id !== id));
      toast({ title: "Variant deleted" });
    } else {
      toast({ title: "Failed to delete variant", variant: "destructive" });
    }
  };

  const renderForm = () => (
    <TableRow>
      <TableCell>
        <Input
          placeholder="e.g., Large Red"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          placeholder="Size"
          value={form.size}
          onChange={(e) => setForm({ ...form, size: e.target.value })}
          className="h-8 w-16"
        />
      </TableCell>
      <TableCell>
        <Input
          placeholder="Color"
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
          className="h-8 w-20"
        />
      </TableCell>
      <TableCell>
        <Input
          placeholder="SKU"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
          className="h-8 w-20"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          placeholder="0"
          value={form.price_adjustment}
          onChange={(e) =>
            setForm({ ...form, price_adjustment: parseFloat(e.target.value) || 0 })
          }
          className="h-8 w-16"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          placeholder="∞"
          value={form.stock_quantity ?? ""}
          onChange={(e) =>
            setForm({
              ...form,
              stock_quantity: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          className="h-8 w-16"
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={form.is_active}
          onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
        />
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4 text-success" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          Variants ({variants.length})
        </h4>
        {!isAdding && !editingId && (
          <Button size="sm" variant="outline" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add Variant
          </Button>
        )}
      </div>

      {(variants.length > 0 || isAdding) && (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price +/-</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isAdding && renderForm()}
              {variants.map((variant) =>
                editingId === variant.id ? (
                  renderForm()
                ) : (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">{variant.name}</TableCell>
                    <TableCell>
                      {variant.size ? (
                        <Badge variant="outline" className="text-xs">
                          {variant.size}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {variant.color ? (
                        <Badge variant="outline" className="text-xs">
                          {variant.color}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {variant.sku || "—"}
                    </TableCell>
                    <TableCell>
                      {variant.price_adjustment !== 0 && (
                        <span
                          className={
                            variant.price_adjustment > 0
                              ? "text-success"
                              : "text-destructive"
                          }
                        >
                          {variant.price_adjustment > 0 ? "+" : ""}
                          {getCurrencySymbol()}
                          {variant.price_adjustment}
                        </span>
                      )}
                      {variant.price_adjustment === 0 && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {variant.stock_quantity !== null ? (
                        <span
                          className={
                            variant.stock_quantity === 0
                              ? "text-destructive font-medium"
                              : variant.stock_quantity < 10
                              ? "text-warning font-medium"
                              : ""
                          }
                        >
                          {variant.stock_quantity}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">∞</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={variant.is_active ? "default" : "secondary"}
                        className={
                          variant.is_active
                            ? "bg-success/10 text-success hover:bg-success/20"
                            : ""
                        }
                      >
                        {variant.is_active ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleEdit(variant)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(variant.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {variants.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
          No variants yet. Add variants for sizes, colors, etc.
        </p>
      )}
    </div>
  );
}
