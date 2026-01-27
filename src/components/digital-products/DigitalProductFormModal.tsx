import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { digitalProductService, DigitalProduct, CreateDigitalProductInput } from "@/services/digitalProductService";
import { toast } from "sonner";
import { Key, Globe, BookOpen, Download, FileCode, Loader2 } from "lucide-react";

interface DigitalProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: DigitalProduct | null;
  onSuccess: () => void;
}

const productTypes = [
  { value: "subscription", labelEn: "Subscription (Canva, Netflix, etc.)", labelBn: "সাবস্ক্রিপশন (ক্যানভা, নেটফ্লিক্স ইত্যাদি)", icon: Key },
  { value: "api", labelEn: "API Service", labelBn: "এপিআই সার্ভিস", icon: Globe },
  { value: "course", labelEn: "Course / Tutorial", labelBn: "কোর্স / টিউটোরিয়াল", icon: BookOpen },
  { value: "software", labelEn: "Software / APK", labelBn: "সফটওয়্যার / এপিকে", icon: Download },
  { value: "other", labelEn: "Other Digital Product", labelBn: "অন্যান্য ডিজিটাল প্রোডাক্ট", icon: FileCode },
];

export const DigitalProductFormModal = ({
  isOpen,
  onClose,
  product,
  onSuccess,
}: DigitalProductFormModalProps) => {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  const [formData, setFormData] = useState<CreateDigitalProductInput>({
    name: "",
    description: "",
    product_type: "subscription",
    price: 0,
    sale_price: undefined,
    credential_username: "",
    credential_password: "",
    credential_email: "",
    file_url: "",
    file_name: "",
    api_endpoint: "",
    api_key: "",
    api_documentation: "",
    access_url: "",
    access_instructions: "",
    stock_quantity: 1,
    is_unlimited_stock: false,
    is_active: true,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        product_type: product.product_type,
        price: product.price,
        sale_price: product.sale_price,
        credential_username: product.credential_username || "",
        credential_password: product.credential_password || "",
        credential_email: product.credential_email || "",
        file_url: product.file_url || "",
        file_name: product.file_name || "",
        api_endpoint: product.api_endpoint || "",
        api_key: product.api_key || "",
        api_documentation: product.api_documentation || "",
        access_url: product.access_url || "",
        access_instructions: product.access_instructions || "",
        stock_quantity: product.stock_quantity,
        is_unlimited_stock: product.is_unlimited_stock,
        is_active: product.is_active,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        product_type: "subscription",
        price: 0,
        sale_price: undefined,
        credential_username: "",
        credential_password: "",
        credential_email: "",
        file_url: "",
        file_name: "",
        api_endpoint: "",
        api_key: "",
        api_documentation: "",
        access_url: "",
        access_instructions: "",
        stock_quantity: 1,
        is_unlimited_stock: false,
        is_active: true,
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(language === "bn" ? "প্রোডাক্টের নাম দিন" : "Please enter product name");
      return;
    }

    setIsLoading(true);
    try {
      if (product) {
        await digitalProductService.updateProduct(product.id, formData);
        toast.success(language === "bn" ? "প্রোডাক্ট আপডেট হয়েছে" : "Product updated");
      } else {
        await digitalProductService.createProduct(formData);
        toast.success(language === "bn" ? "প্রোডাক্ট যোগ হয়েছে" : "Product added");
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(language === "bn" ? "কিছু সমস্যা হয়েছে" : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedType = productTypes.find(t => t.value === formData.product_type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedType && <selectedType.icon className="w-5 h-5 text-purple-600" />}
            {product
              ? language === "bn"
                ? "প্রোডাক্ট এডিট করুন"
                : "Edit Product"
              : language === "bn"
              ? "নতুন ডিজিটাল প্রোডাক্ট"
              : "New Digital Product"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">
              {language === "bn" ? "বেসিক" : "Basic"}
            </TabsTrigger>
            <TabsTrigger value="credentials">
              {language === "bn" ? "ক্রেডেনশিয়াল" : "Credentials"}
            </TabsTrigger>
            <TabsTrigger value="settings">
              {language === "bn" ? "সেটিংস" : "Settings"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{language === "bn" ? "প্রোডাক্ট টাইপ" : "Product Type"}</Label>
              <Select
                value={formData.product_type}
                onValueChange={(value: any) => setFormData({ ...formData, product_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {language === "bn" ? type.labelBn : type.labelEn}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === "bn" ? "প্রোডাক্টের নাম" : "Product Name"} *</Label>
              <Input
                placeholder={language === "bn" ? "যেমন: Canva Pro 1 Month" : "e.g., Canva Pro 1 Month"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === "bn" ? "বিবরণ" : "Description"}</Label>
              <Textarea
                placeholder={language === "bn" ? "প্রোডাক্টের বিবরণ লিখুন..." : "Describe your product..."}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "দাম (৳)" : "Price (৳)"}</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "সেল প্রাইস (৳)" : "Sale Price (৳)"}</Label>
                <Input
                  type="number"
                  placeholder={language === "bn" ? "অপশনাল" : "Optional"}
                  value={formData.sale_price || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, sale_price: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="credentials" className="space-y-4 mt-4">
            {/* Subscription/Account Credentials */}
            {(formData.product_type === "subscription" || formData.product_type === "other") && (
              <>
                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <p className="text-sm text-muted-foreground">
                    {language === "bn"
                      ? "সাবস্ক্রিপশন বা প্রিমিয়াম অ্যাকাউন্টের জন্য ইউজারনেম ও পাসওয়ার্ড দিন"
                      : "Enter username and password for subscription or premium accounts"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{language === "bn" ? "ইউজারনেম/ইমেইল" : "Username/Email"}</Label>
                  <Input
                    placeholder="username@example.com"
                    value={formData.credential_username}
                    onChange={(e) => setFormData({ ...formData, credential_username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "bn" ? "পাসওয়ার্ড" : "Password"}</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={formData.credential_password}
                    onChange={(e) => setFormData({ ...formData, credential_password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "bn" ? "অতিরিক্ত ইমেইল (যদি থাকে)" : "Additional Email (if any)"}</Label>
                  <Input
                    placeholder="recovery@example.com"
                    value={formData.credential_email}
                    onChange={(e) => setFormData({ ...formData, credential_email: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* API Credentials */}
            {formData.product_type === "api" && (
              <>
                <div className="space-y-2">
                  <Label>{language === "bn" ? "API Endpoint" : "API Endpoint"}</Label>
                  <Input
                    placeholder="https://api.example.com/v1"
                    value={formData.api_endpoint}
                    onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "bn" ? "API Key" : "API Key"}</Label>
                  <Input
                    placeholder="sk-xxxxxxxxxxxx"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "bn" ? "ডকুমেন্টেশন লিংক" : "Documentation Link"}</Label>
                  <Input
                    placeholder="https://docs.example.com"
                    value={formData.api_documentation}
                    onChange={(e) => setFormData({ ...formData, api_documentation: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Course/Content Access */}
            {formData.product_type === "course" && (
              <>
                <div className="space-y-2">
                  <Label>{language === "bn" ? "অ্যাক্সেস URL" : "Access URL"}</Label>
                  <Input
                    placeholder="https://course.example.com/access"
                    value={formData.access_url}
                    onChange={(e) => setFormData({ ...formData, access_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "bn" ? "অ্যাক্সেস নির্দেশনা" : "Access Instructions"}</Label>
                  <Textarea
                    placeholder={language === "bn" ? "কিভাবে কোর্সে অ্যাক্সেস করবেন..." : "How to access the course..."}
                    value={formData.access_instructions}
                    onChange={(e) => setFormData({ ...formData, access_instructions: e.target.value })}
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Software/File Download */}
            {formData.product_type === "software" && (
              <>
                <div className="space-y-2">
                  <Label>{language === "bn" ? "ডাউনলোড লিংক" : "Download Link"}</Label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "bn" ? "ফাইলের নাম" : "File Name"}</Label>
                  <Input
                    placeholder="app-v1.0.apk"
                    value={formData.file_name}
                    onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "স্টক পরিমাণ" : "Stock Quantity"}</Label>
                <Input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 1 })}
                  disabled={formData.is_unlimited_stock}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label className="cursor-pointer">{language === "bn" ? "আনলিমিটেড স্টক" : "Unlimited Stock"}</Label>
                <Switch
                  checked={formData.is_unlimited_stock}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_unlimited_stock: checked })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label className="cursor-pointer">{language === "bn" ? "প্রোডাক্ট সক্রিয়" : "Product Active"}</Label>
                <p className="text-xs text-muted-foreground">
                  {language === "bn" ? "নিষ্ক্রিয় করলে বিক্রির জন্য দেখাবে না" : "Inactive products won't be shown for sale"}
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            {language === "bn" ? "বাতিল" : "Cancel"}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {product
              ? language === "bn"
                ? "আপডেট করুন"
                : "Update"
              : language === "bn"
              ? "সেভ করুন"
              : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
