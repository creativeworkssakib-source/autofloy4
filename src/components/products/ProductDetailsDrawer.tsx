import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Package,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Box,
  Calendar,
  Tag,
} from "lucide-react";
import { Product, ProductVariant, fetchProductVariants } from "@/services/apiService";

interface ProductDetailsDrawerProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export function ProductDetailsDrawer({
  product,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ProductDetailsDrawerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  useEffect(() => {
    if (product && open) {
      loadVariants();
    }
  }, [product, open]);

  const loadVariants = async () => {
    if (!product) return;
    setLoadingVariants(true);
    try {
      const data = await fetchProductVariants(product.id);
      setVariants(data);
    } catch (error) {
      console.error("Failed to load variants:", error);
    } finally {
      setLoadingVariants(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      default:
        return "৳";
    }
  };

  const totalVariantStock = variants
    .filter((v) => v.is_active)
    .reduce((sum, v) => sum + (v.stock_quantity || 0), 0);

  const displayStock = variants.length > 0 ? totalVariantStock : product?.stock_quantity;

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-bold truncate">
                {product.name}
              </SheetTitle>
              {product.sku && (
                <p className="text-sm text-muted-foreground mt-1">
                  SKU: {product.sku}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(product);
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(product.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Product Image */}
            {product.image_url ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
              </div>
            )}

            {/* Status and Category */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={product.is_active ? "default" : "secondary"}
                className={
                  product.is_active
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-muted text-muted-foreground"
                }
              >
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
              {product.category && (
                <Badge variant="outline">
                  <Tag className="w-3 h-3 mr-1" />
                  {product.category}
                </Badge>
              )}
              {product.brand && (
                <Badge variant="outline" className="bg-primary/5">
                  {product.brand}
                </Badge>
              )}
            </div>

            {/* Key Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Price
                </p>
                <p className="text-2xl font-bold">
                  {getCurrencySymbol(product.currency)}
                  {product.price.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Stock
                </p>
                <p className="text-2xl font-bold">
                  {displayStock ?? "—"}
                  {variants.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      (variants)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>
                  Added{" "}
                  {product.created_at
                    ? format(new Date(product.created_at), "MMM d, yyyy")
                    : "—"}
                </span>
              </div>
            </div>

            <Separator />

            {/* Variants Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  Variants
                  {variants.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {variants.length}
                    </Badge>
                  )}
                </h4>
              </div>

              {loadingVariants ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : variants.length > 0 ? (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs">Variant</TableHead>
                        <TableHead className="text-xs">Size</TableHead>
                        <TableHead className="text-xs">Color</TableHead>
                        <TableHead className="text-xs text-right">Adj.</TableHead>
                        <TableHead className="text-xs text-right">Stock</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell className="font-medium text-sm">
                            <div>
                              <p className="truncate max-w-[120px]">{variant.name}</p>
                              {variant.sku && (
                                <p className="text-xs text-muted-foreground">
                                  {variant.sku}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {variant.size || "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {variant.color ? (
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-3 h-3 rounded-full border"
                                  style={{
                                    backgroundColor: variant.color.toLowerCase(),
                                  }}
                                />
                                <span className="text-xs">{variant.color}</span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-right">
                            {variant.price_adjustment
                              ? `+${getCurrencySymbol(product.currency)}${variant.price_adjustment}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-right font-medium">
                            {variant.stock_quantity ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={variant.is_active ? "default" : "secondary"}
                              className={
                                variant.is_active
                                  ? "bg-green-500/10 text-green-600 border-green-500/20 text-xs"
                                  : "text-xs"
                              }
                            >
                              {variant.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No variants for this product</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
