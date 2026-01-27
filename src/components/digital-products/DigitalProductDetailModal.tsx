import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { DigitalProduct } from "@/services/digitalProductService";
import { toast } from "sonner";
import { Copy, Key, Globe, BookOpen, Download, FileCode, ExternalLink, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface DigitalProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: DigitalProduct | null;
}

const productTypeIcons: Record<string, typeof FileCode> = {
  subscription: Key,
  api: Globe,
  course: BookOpen,
  software: Download,
  other: FileCode,
};

const productTypeLabels: Record<string, { en: string; bn: string }> = {
  subscription: { en: "Subscription", bn: "সাবস্ক্রিপশন" },
  api: { en: "API", bn: "এপিআই" },
  course: { en: "Course", bn: "কোর্স" },
  software: { en: "Software/APK", bn: "সফটওয়্যার/এপিকে" },
  other: { en: "Other", bn: "অন্যান্য" },
};

export const DigitalProductDetailModal = ({
  isOpen,
  onClose,
  product,
}: DigitalProductDetailModalProps) => {
  const { language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  if (!product) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const TypeIcon = productTypeIcons[product.product_type] || FileCode;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="w-5 h-5 text-purple-600" />
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Badge variant="outline">
                {productTypeLabels[product.product_type]?.[language] || product.product_type}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-600">
                {formatCurrency(product.sale_price || product.price)}
              </div>
              {product.sale_price && (
                <div className="text-xs text-muted-foreground line-through">
                  {formatCurrency(product.price)}
                </div>
              )}
            </div>
          </div>

          {product.description && (
            <div>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>
          )}

          {/* Credentials Section */}
          {(product.credential_username || product.credential_password) && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">
                {language === "bn" ? "লগইন ক্রেডেনশিয়াল" : "Login Credentials"}
              </h4>
              <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 space-y-2">
                {product.credential_username && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {language === "bn" ? "ইউজারনেম:" : "Username:"}
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {product.credential_username}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(product.credential_username!, "Username")}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                {product.credential_password && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {language === "bn" ? "পাসওয়ার্ড:" : "Password:"}
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {showPassword ? product.credential_password : "••••••••"}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(product.credential_password!, "Password")}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                {product.credential_email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {language === "bn" ? "ইমেইল:" : "Email:"}
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {product.credential_email}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(product.credential_email!, "Email")}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* API Section */}
          {product.product_type === "api" && product.api_endpoint && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{language === "bn" ? "API তথ্য" : "API Details"}</h4>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Endpoint:</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px]">
                      {product.api_endpoint}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(product.api_endpoint!, "Endpoint")}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {product.api_key && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">API Key:</span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {showApiKey ? product.api_key : "sk-••••••••"}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(product.api_key!, "API Key")}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                {product.api_documentation && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={product.api_documentation} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {language === "bn" ? "ডকুমেন্টেশন দেখুন" : "View Documentation"}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Course Access */}
          {product.product_type === "course" && product.access_url && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{language === "bn" ? "কোর্স অ্যাক্সেস" : "Course Access"}</h4>
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={product.access_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {language === "bn" ? "কোর্সে অ্যাক্সেস করুন" : "Access Course"}
                  </a>
                </Button>
                {product.access_instructions && (
                  <p className="text-xs text-muted-foreground">{product.access_instructions}</p>
                )}
              </div>
            </div>
          )}

          {/* Software Download */}
          {product.product_type === "software" && product.file_url && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{language === "bn" ? "ডাউনলোড" : "Download"}</h4>
              <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={product.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    {product.file_name || (language === "bn" ? "ডাউনলোড করুন" : "Download File")}
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <Badge
                variant={product.is_active ? "default" : "secondary"}
                className={product.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
              >
                {product.is_active
                  ? language === "bn"
                    ? "সক্রিয়"
                    : "Active"
                  : language === "bn"
                  ? "নিষ্ক্রিয়"
                  : "Inactive"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {product.is_unlimited_stock
                  ? language === "bn"
                    ? "আনলিমিটেড স্টক"
                    : "Unlimited Stock"
                  : `${product.stock_quantity} ${language === "bn" ? "বাকি" : "left"}`}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">{product.total_sold}</span>{" "}
              <span className="text-muted-foreground">{language === "bn" ? "বিক্রি" : "sold"}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            {language === "bn" ? "বন্ধ করুন" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
