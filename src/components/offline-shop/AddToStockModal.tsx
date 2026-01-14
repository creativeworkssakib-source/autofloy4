import { useState, useEffect } from "react";
import { Package, Check, X, Edit2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { offlineShopService } from "@/services/offlineShopService";
import { useLanguage } from "@/contexts/LanguageContext";

export interface PurchasedProduct {
  id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  selling_price: number;
  supplier_name?: string;
  purchase_date?: string;
  product_id?: string;
  purchase_id?: string;
  // Editable fields
  sku?: string;
  barcode?: string;
  brand?: string;
  category_id?: string;
  custom_category?: string;
  description?: string;
  unit?: string;
  min_stock_alert?: number;
  expiry_date?: string;
}

interface Category {
  id: string;
  name: string;
}

interface AddToStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: PurchasedProduct[];
  onSuccess?: () => void;
}

const AddToStockModal = ({ isOpen, onClose, products, onSuccess }: AddToStockModalProps) => {
  const { language } = useLanguage();
  const [editableProducts, setEditableProducts] = useState<PurchasedProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingProducts, setExistingProducts] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Filter out products that already have product_id (already in stock)
      const newProducts = products.filter(p => !p.product_id);
      setEditableProducts(newProducts.map(p => ({
        ...p,
        sku: p.sku || "",
        barcode: p.barcode || "",
        brand: p.brand || "",
        category_id: p.category_id || "",
        custom_category: p.custom_category || "",
        description: p.description || "",
        unit: p.unit || "pcs",
        min_stock_alert: p.min_stock_alert ?? 5,
        expiry_date: p.expiry_date || "",
      })));
      setSelectedProducts([]);
      setEditingIndex(null);
      loadCategories();
      loadExistingProducts();
    }
  }, [isOpen, products]);

  const loadCategories = async () => {
    try {
      const result = await offlineShopService.getCategories();
      setCategories(result.categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadExistingProducts = async () => {
    try {
      const result = await offlineShopService.getProducts();
      const names = (result.products || []).map((p: any) => p.name.toLowerCase());
      setExistingProducts(names);
    } catch (error) {
      console.error("Failed to load existing products:", error);
    }
  };

  const updateProduct = (index: number, field: keyof PurchasedProduct, value: any) => {
    setEditableProducts(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const toggleSelection = (productName: string) => {
    setSelectedProducts(prev =>
      prev.includes(productName)
        ? prev.filter(n => n !== productName)
        : [...prev, productName]
    );
  };

  const selectAll = () => {
    if (selectedProducts.length === editableProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(editableProducts.map(p => p.name));
    }
  };

  const isProductReady = (product: PurchasedProduct) => {
    return (
      product.name?.trim() &&
      product.selling_price > 0 &&
      product.unit_price > 0 &&
      product.quantity > 0
    );
  };

  const isProductDuplicate = (product: PurchasedProduct) => {
    return existingProducts.includes(product.name.toLowerCase());
  };

  const handleAddToStock = async () => {
    const toAdd = editableProducts.filter(p => selectedProducts.includes(p.name));
    
    if (toAdd.length === 0) {
      toast.error(language === "bn" ? "কমপক্ষে একটি প্রোডাক্ট নির্বাচন করুন" : "Select at least one product");
      return;
    }

    // Validate selected products
    const invalidProducts = toAdd.filter(p => !isProductReady(p));
    if (invalidProducts.length > 0) {
      toast.error(
        language === "bn"
          ? `${invalidProducts.length}টি প্রোডাক্টের তথ্য অসম্পূর্ণ`
          : `${invalidProducts.length} products have incomplete information`
      );
      return;
    }

    // Check for duplicates
    const duplicates = toAdd.filter(p => isProductDuplicate(p));
    if (duplicates.length > 0) {
      const proceed = window.confirm(
        language === "bn"
          ? `${duplicates.map(d => d.name).join(", ")} ইতিমধ্যে স্টকে আছে। তারপরও যোগ করতে চান?`
          : `${duplicates.map(d => d.name).join(", ")} already exist in stock. Add anyway?`
      );
      if (!proceed) return;
    }

    setIsAdding(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const product of toAdd) {
        try {
          let categoryId = product.category_id;

          // If "others" is selected, create new category first
          if (product.category_id === "others" && product.custom_category?.trim()) {
            try {
              const result = await offlineShopService.createCategory({ name: product.custom_category.trim() });
              categoryId = result.category?.id || null;
              // Reload categories
              const categoriesRes = await offlineShopService.getCategories();
              setCategories(categoriesRes.categories || []);
            } catch (error) {
              console.error("Failed to create category:", error);
              categoryId = null;
            }
          } else if (product.category_id === "others") {
            categoryId = null;
          }

          await offlineShopService.createProduct({
            name: product.name,
            sku: product.sku || "",
            barcode: product.barcode || "",
            brand: product.brand || "",
            description: product.description || "",
            unit: product.unit || "pcs",
            purchase_price: product.unit_price,
            selling_price: product.selling_price,
            stock_quantity: product.quantity,
            min_stock_alert: product.min_stock_alert || 5,
            supplier_name: product.supplier_name || "",
            expiry_date: product.expiry_date || null,
            category_id: categoryId || null,
            is_active: true,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to add product ${product.name}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          language === "bn"
            ? `${successCount}টি প্রোডাক্ট স্টকে যোগ হয়েছে!`
            : `${successCount} products added to stock!`
        );
      }
      if (failCount > 0) {
        toast.warning(
          language === "bn"
            ? `${failCount}টি প্রোডাক্ট যোগ করা যায়নি`
            : `${failCount} products failed to add`
        );
      }

      if (successCount > 0) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      toast.error(language === "bn" ? "প্রোডাক্ট যোগ করতে সমস্যা হয়েছে" : "Failed to add products");
    } finally {
      setIsAdding(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (editableProducts.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {language === "bn" ? "স্টকে যোগ করুন" : "Add to Stock"}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? "ক্রয় থেকে নতুন প্রোডাক্ট স্টকে যোগ করুন"
                : "Add new products from purchases to stock"}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {language === "bn" ? "কোন নতুন প্রোডাক্ট নেই" : "No new products to add"}
            </p>
            <p className="text-sm">
              {language === "bn" 
                ? "সব প্রোডাক্ট ইতিমধ্যে স্টকে আছে বা ক্রয়ে নতুন প্রোডাক্ট যোগ করা হয়নি"
                : "All products are already in stock or no new products were added in purchases"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {language === "bn" ? "বন্ধ করুন" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {language === "bn" ? "স্টকে যোগ করুন" : "Add to Stock"}
          </DialogTitle>
          <DialogDescription>
            {language === "bn" 
              ? "ক্রয় থেকে প্রোডাক্টগুলো স্টকে যোগ করুন। সব তথ্য সঠিক কিনা যাচাই করুন।"
              : "Add purchased products to your stock. Verify all information is correct."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedProducts.length === editableProducts.length && editableProducts.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-sm">
              {language === "bn" ? "সব সিলেক্ট করুন" : "Select All"}
              {selectedProducts.length > 0 && ` (${selectedProducts.length}/${editableProducts.length})`}
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3 py-4">
            {editableProducts.map((product, index) => {
              const isReady = isProductReady(product);
              const isDuplicate = isProductDuplicate(product);
              const isEditing = editingIndex === index;
              const isSelected = selectedProducts.includes(product.name);

              return (
                <div
                  key={`${product.name}-${index}`}
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected ? "border-primary bg-primary/5" : ""
                  } ${!isReady ? "border-destructive/50 bg-destructive/5" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(product.name)}
                      disabled={!isReady}
                    />
                    
                    <div className="flex-1 space-y-3">
                      {isEditing ? (
                        // Edit mode
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">{language === "bn" ? "নাম *" : "Name *"}</Label>
                              <Input
                                value={product.name}
                                onChange={(e) => updateProduct(index, "name", e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "পরিমাণ *" : "Quantity *"}</Label>
                              <Input
                                type="number"
                                value={product.quantity}
                                onChange={(e) => updateProduct(index, "quantity", parseInt(e.target.value) || 0)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "ক্রয় মূল্য *" : "Purchase Price *"}</Label>
                              <Input
                                type="number"
                                value={product.unit_price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateProduct(index, "unit_price", val === "" ? 0 : parseFloat(val) || 0);
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "বিক্রয় মূল্য *" : "Selling Price *"}</Label>
                              <Input
                                type="number"
                                value={product.selling_price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateProduct(index, "selling_price", val === "" ? 0 : parseFloat(val) || 0);
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "ইউনিট" : "Unit"}</Label>
                              <Select
                                value={product.unit || "pcs"}
                                onValueChange={(value) => updateProduct(index, "unit", value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pcs">{language === "bn" ? "পিস" : "Pieces"}</SelectItem>
                                  <SelectItem value="kg">{language === "bn" ? "কেজি" : "Kg"}</SelectItem>
                                  <SelectItem value="g">{language === "bn" ? "গ্রাম" : "Gram"}</SelectItem>
                                  <SelectItem value="l">{language === "bn" ? "লিটার" : "Liter"}</SelectItem>
                                  <SelectItem value="ml">{language === "bn" ? "মিলি" : "ml"}</SelectItem>
                                  <SelectItem value="box">{language === "bn" ? "বক্স" : "Box"}</SelectItem>
                                  <SelectItem value="packet">{language === "bn" ? "প্যাকেট" : "Packet"}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "ক্যাটাগরি" : "Category"}</Label>
                              <Select
                                value={product.category_id || ""}
                                onValueChange={(value) => {
                                  updateProduct(index, "category_id", value);
                                  if (value !== "others") {
                                    updateProduct(index, "custom_category", "");
                                  }
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder={language === "bn" ? "নির্বাচন করুন" : "Select"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                  ))}
                                  <SelectItem value="others">
                                    {language === "bn" ? "অন্যান্য (নতুন)" : "Others (New)"}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {product.category_id === "others" && (
                                <Input
                                  placeholder={language === "bn" ? "নতুন ক্যাটাগরির নাম" : "New category name"}
                                  value={product.custom_category || ""}
                                  onChange={(e) => updateProduct(index, "custom_category", e.target.value)}
                                  className="mt-2"
                                />
                              )}
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "ব্র্যান্ড" : "Brand"}</Label>
                              <Input
                                value={product.brand || ""}
                                onChange={(e) => updateProduct(index, "brand", e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">{language === "bn" ? "মিনিমাম স্টক" : "Min Stock Alert"}</Label>
                              <Input
                                type="number"
                                value={product.min_stock_alert || 5}
                                onChange={(e) => updateProduct(index, "min_stock_alert", parseInt(e.target.value) || 5)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button size="sm" onClick={() => setEditingIndex(null)}>
                              <Check className="h-4 w-4 mr-1" />
                              {language === "bn" ? "সংরক্ষণ" : "Done"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.name}</span>
                              {isDuplicate && (
                                <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                                  {language === "bn" ? "ডুপ্লিকেট" : "Duplicate"}
                                </Badge>
                              )}
                              {isReady ? (
                                <Badge variant="default" className="text-xs bg-green-600">
                                  <Check className="h-3 w-3 mr-1" />
                                  {language === "bn" ? "প্রস্তুত" : "Ready"}
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {language === "bn" ? "তথ্য দরকার" : "Needs Info"}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                              <span>{language === "bn" ? "পরিমাণ:" : "Qty:"} {product.quantity}</span>
                              <span>{language === "bn" ? "ক্রয়:" : "Buy:"} {formatCurrency(product.unit_price)}</span>
                              <span>{language === "bn" ? "বিক্রয়:" : "Sell:"} {formatCurrency(product.selling_price)}</span>
                              {product.supplier_name && (
                                <span>{language === "bn" ? "সরবরাহকারী:" : "Supplier:"} {product.supplier_name}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingIndex(index)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {language === "bn" 
                ? `${selectedProducts.length}টি প্রোডাক্ট সিলেক্টেড`
                : `${selectedProducts.length} products selected`}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                {language === "bn" ? "বাতিল" : "Cancel"}
              </Button>
              <Button 
                onClick={handleAddToStock}
                disabled={isAdding || selectedProducts.length === 0}
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Package className="h-4 w-4 mr-2" />
                )}
                {language === "bn" ? "স্টকে যোগ করুন" : "Add to Stock"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToStockModal;
