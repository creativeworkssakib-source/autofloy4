import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  FileCode,
  Key,
  Globe,
  BookOpen,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Package,
  TrendingUp,
  Users,
  DollarSign,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { digitalProductService, DigitalProduct } from "@/services/digitalProductService";
import { toast } from "sonner";
import { DigitalProductFormModal } from "@/components/digital-products/DigitalProductFormModal";
import { DigitalProductDetailModal } from "@/components/digital-products/DigitalProductDetailModal";
import { DigitalProductBulkUploadModal } from "@/components/digital-products/DigitalProductBulkUploadModal";

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

const DigitalProducts = () => {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [stats, setStats] = useState({ totalProducts: 0, totalSales: 0, totalRevenue: 0, pendingDeliveries: 0 });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsData, statsData] = await Promise.all([
        digitalProductService.getProducts(),
        digitalProductService.getStats(),
      ]);
      setProducts(productsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading digital products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(language === "bn" ? "আপনি কি এই প্রোডাক্ট মুছে ফেলতে চান?" : "Are you sure you want to delete this product?")) {
      return;
    }
    const success = await digitalProductService.deleteProduct(id);
    if (success) {
      toast.success(language === "bn" ? "প্রোডাক্ট মুছে ফেলা হয়েছে" : "Product deleted");
      loadData();
    } else {
      toast.error(language === "bn" ? "মুছে ফেলতে ব্যর্থ" : "Failed to delete");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || p.product_type === filterType;
    return matchesSearch && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      title: language === "bn" ? "মোট প্রোডাক্ট" : "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: language === "bn" ? "মোট বিক্রি" : "Total Sales",
      value: stats.totalSales,
      icon: TrendingUp,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: language === "bn" ? "মোট আয়" : "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "from-emerald-500 to-green-500",
    },
    {
      title: language === "bn" ? "পেন্ডিং ডেলিভারি" : "Pending Deliveries",
      value: stats.pendingDeliveries,
      icon: Users,
      color: "from-orange-500 to-yellow-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {language === "bn" ? "ডিজিটাল প্রোডাক্ট" : "Digital Products"}
              </h1>
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-muted-foreground">
              {language === "bn"
                ? "সাবস্ক্রিপশন, API, কোর্স, সফটওয়্যার বিক্রি করুন"
                : "Sell subscriptions, APIs, courses, software"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkUploadOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              {language === "bn" ? "বাল্ক আপলোড" : "Bulk Upload"}
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                setSelectedProduct(null);
                setIsFormModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {language === "bn" ? "নতুন প্রোডাক্ট" : "Add Product"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-card transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                    >
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    <div className="text-xl font-bold">{stat.value}</div>
                  )}
                  <div className="text-xs text-muted-foreground">{stat.title}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={language === "bn" ? "প্রোডাক্ট খুঁজুন..." : "Search products..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "subscription", "api", "course", "software", "other"].map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type)}
                className={filterType === type ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                {type === "all"
                  ? language === "bn"
                    ? "সব"
                    : "All"
                  : productTypeLabels[type]?.[language] || type}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                <FileCode className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {language === "bn" ? "কোনো ডিজিটাল প্রোডাক্ট নেই" : "No digital products yet"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {language === "bn"
                  ? "আপনার প্রথম ডিজিটাল প্রোডাক্ট যোগ করুন"
                  : "Add your first digital product to start selling"}
              </p>
              <Button
                onClick={() => {
                  setSelectedProduct(null);
                  setIsFormModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                {language === "bn" ? "প্রোডাক্ট যোগ করুন" : "Add Product"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredProducts.map((product, index) => {
                const TypeIcon = productTypeIcons[product.product_type] || FileCode;
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="group hover:shadow-card transition-all hover:border-purple-500/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                              <TypeIcon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <CardTitle className="text-base line-clamp-1">{product.name}</CardTitle>
                              <Badge variant="outline" className="text-xs mt-1">
                                {productTypeLabels[product.product_type]?.[language] || product.product_type}
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsDetailModalOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                {language === "bn" ? "বিস্তারিত দেখুন" : "View Details"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsFormModalOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                {language === "bn" ? "এডিট করুন" : "Edit"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(product.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {language === "bn" ? "মুছে ফেলুন" : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {product.description}
                          </p>
                        )}

                        {/* Credentials Preview */}
                        {product.credential_username && (
                          <div className="p-2 rounded-lg bg-muted/50 mb-3 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">User:</span>
                              <div className="flex items-center gap-1">
                                <code className="font-mono">{product.credential_username}</code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => copyToClipboard(product.credential_username!, "Username")}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {product.credential_password && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Pass:</span>
                                <div className="flex items-center gap-1">
                                  <code className="font-mono">••••••••</code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => copyToClipboard(product.credential_password!, "Password")}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-purple-600">
                              {formatCurrency(product.sale_price || product.price)}
                            </div>
                            {product.sale_price && (
                              <div className="text-xs text-muted-foreground line-through">
                                {formatCurrency(product.price)}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{product.total_sold}</div>
                            <div className="text-xs text-muted-foreground">
                              {language === "bn" ? "বিক্রি হয়েছে" : "sold"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
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
                          <span className="text-xs text-muted-foreground">
                            {product.is_unlimited_stock
                              ? language === "bn"
                                ? "আনলিমিটেড"
                                : "Unlimited"
                              : `${product.stock_quantity} ${language === "bn" ? "বাকি" : "left"}`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      <DigitalProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSuccess={() => {
          loadData();
          setIsFormModalOpen(false);
          setSelectedProduct(null);
        }}
      />

      <DigitalProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      <DigitalProductBulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={() => {
          loadData();
          setIsBulkUploadOpen(false);
        }}
      />
    </DashboardLayout>
  );
};

export default DigitalProducts;
