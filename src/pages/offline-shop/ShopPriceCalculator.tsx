import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Scale,
  Percent,
  DollarSign,
  Package,
  RefreshCw,
  History,
  BookOpen,
  WifiOff,
  Wifi
} from "lucide-react";
import { useOfflineProductsSimple } from "@/hooks/useOfflineShopData";
import { toast } from "sonner";

// Bangladesh Consumer Protection Law - Maximum Markup Rates
const BD_MARKUP_RATES = {
  essential: {
    name: { en: "Essential Goods", bn: "অত্যাবশ্যকীয় পণ্য" },
    maxMarkup: 20,
    description: { 
      en: "Rice, Dal, Oil, Sugar, Salt, Onion, Garlic, Ginger etc.", 
      bn: "চাল, ডাল, তেল, চিনি, লবণ, পেঁয়াজ, রসুন, আদা ইত্যাদি" 
    },
    examples: ["চাল", "ডাল", "তেল", "চিনি", "লবণ", "পেঁয়াজ", "রসুন", "আদা", "মসলা"]
  },
  medicine: {
    name: { en: "Medicine & Pharmacy", bn: "ঔষধ ও ফার্মেসি" },
    maxMarkup: 15,
    description: { 
      en: "All pharmaceutical products and medicines", 
      bn: "সকল ওষুধ ও ফার্মাসিউটিক্যাল পণ্য" 
    },
    examples: ["ঔষধ", "ট্যাবলেট", "সিরাপ", "ইনজেকশন"]
  },
  grocery: {
    name: { en: "Grocery Items", bn: "মুদি পণ্য" },
    maxMarkup: 25,
    description: { 
      en: "Biscuits, Snacks, Beverages, Packaged foods etc.", 
      bn: "বিস্কুট, স্ন্যাকস, পানীয়, প্যাকেটজাত খাবার ইত্যাদি" 
    },
    examples: ["বিস্কুট", "চিপস", "জুস", "কোমল পানীয়", "চা", "কফি"]
  },
  cosmetics: {
    name: { en: "Cosmetics & Toiletries", bn: "প্রসাধনী ও টয়লেট্রিজ" },
    maxMarkup: 35,
    description: { 
      en: "Soap, Shampoo, Cream, Lotion etc.", 
      bn: "সাবান, শ্যাম্পু, ক্রিম, লোশন ইত্যাদি" 
    },
    examples: ["সাবান", "শ্যাম্পু", "ক্রিম", "লোশন", "পাউডার"]
  },
  electronics: {
    name: { en: "Electronics", bn: "ইলেকট্রনিক্স" },
    maxMarkup: 30,
    description: { 
      en: "Mobile accessories, Chargers, Cables etc.", 
      bn: "মোবাইল আনুষঙ্গিক, চার্জার, ক্যাবল ইত্যাদি" 
    },
    examples: ["চার্জার", "ক্যাবল", "হেডফোন", "কেস"]
  },
  clothing: {
    name: { en: "Clothing & Textiles", bn: "পোশাক ও বস্ত্র" },
    maxMarkup: 40,
    description: { 
      en: "Readymade garments, Fabrics, Accessories", 
      bn: "তৈরি পোশাক, কাপড়, আনুষঙ্গিক" 
    },
    examples: ["শার্ট", "প্যান্ট", "শাড়ি", "থ্রি-পিস"]
  },
  stationery: {
    name: { en: "Stationery & Books", bn: "স্টেশনারি ও বই" },
    maxMarkup: 25,
    description: { 
      en: "Notebooks, Pens, Books, Educational materials", 
      bn: "নোটবুক, কলম, বই, শিক্ষা উপকরণ" 
    },
    examples: ["খাতা", "কলম", "পেন্সিল", "বই"]
  },
  hardware: {
    name: { en: "Hardware & Tools", bn: "হার্ডওয়্যার ও টুলস" },
    maxMarkup: 35,
    description: { 
      en: "Tools, Equipment, Building materials", 
      bn: "সরঞ্জাম, যন্ত্রপাতি, নির্মাণ সামগ্রী" 
    },
    examples: ["স্ক্রু", "তার", "পাইপ", "রং"]
  },
  general: {
    name: { en: "General Goods", bn: "সাধারণ পণ্য" },
    maxMarkup: 30,
    description: { 
      en: "Other miscellaneous items", 
      bn: "অন্যান্য বিবিধ পণ্য" 
    },
    examples: ["বিবিধ"]
  }
};

interface CalculationHistory {
  id: string;
  productName: string;
  purchasePrice: number;
  category: string;
  suggestedPrice: number;
  maxPrice: number;
  timestamp: Date;
}

const ShopPriceCalculator = () => {
  const { language } = useLanguage();
  const { products, loading, fromCache, isOnline } = useOfflineProductsSimple();
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [category, setCategory] = useState<string>("general");
  const [customMarkup, setCustomMarkup] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistory[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("price_calc_history");
    if (savedHistory) {
      setCalculationHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setProductName(product.name);
      setPurchasePrice(product.purchase_price?.toString() || "");
      // Try to auto-detect category based on product name
      detectCategory(product.name);
    }
  };

  const detectCategory = (name: string) => {
    const lowerName = name.toLowerCase();
    for (const [key, value] of Object.entries(BD_MARKUP_RATES)) {
      if (value.examples.some(ex => lowerName.includes(ex.toLowerCase()))) {
        setCategory(key);
        return;
      }
    }
    setCategory("general");
  };

  const calculatePrices = () => {
    const purchase = parseFloat(purchasePrice);
    if (isNaN(purchase) || purchase <= 0) {
      return null;
    }

    const categoryData = BD_MARKUP_RATES[category as keyof typeof BD_MARKUP_RATES];
    const maxMarkup = categoryData.maxMarkup;
    const customMarkupValue = customMarkup ? parseFloat(customMarkup) : null;

    // Calculate max legal price
    const maxLegalPrice = purchase * (1 + maxMarkup / 100);
    
    // Suggested markup tiers
    const minProfit = purchase * 1.05; // 5% minimum
    const normalProfit = purchase * (1 + maxMarkup / 100 * 0.7); // 70% of max markup
    const maxProfit = maxLegalPrice;

    // Custom markup price if provided
    const customPrice = customMarkupValue ? purchase * (1 + customMarkupValue / 100) : null;
    const isCustomLegal = customMarkupValue ? customMarkupValue <= maxMarkup : true;

    return {
      purchasePrice: purchase,
      maxMarkup,
      minProfit: Math.ceil(minProfit),
      normalProfit: Math.ceil(normalProfit),
      maxProfit: Math.ceil(maxProfit),
      customPrice: customPrice ? Math.ceil(customPrice) : null,
      isCustomLegal,
      suggestedPrice: Math.ceil(normalProfit),
      profitAtSuggested: Math.ceil(normalProfit - purchase),
      profitPercentAtSuggested: ((normalProfit - purchase) / purchase * 100).toFixed(1)
    };
  };

  const saveToHistory = () => {
    const calculation = calculatePrices();
    if (!calculation || !productName) {
      toast.error(language === "bn" ? "পণ্যের নাম ও দাম দিন" : "Enter product name and price");
      return;
    }

    const historyItem: CalculationHistory = {
      id: Date.now().toString(),
      productName,
      purchasePrice: calculation.purchasePrice,
      category,
      suggestedPrice: calculation.suggestedPrice,
      maxPrice: calculation.maxProfit,
      timestamp: new Date()
    };

    const newHistory = [historyItem, ...calculationHistory].slice(0, 50);
    setCalculationHistory(newHistory);
    localStorage.setItem("price_calc_history", JSON.stringify(newHistory));
    toast.success(language === "bn" ? "ইতিহাসে সংরক্ষিত" : "Saved to history");
  };

  const clearHistory = () => {
    setCalculationHistory([]);
    localStorage.removeItem("price_calc_history");
    toast.success(language === "bn" ? "ইতিহাস মুছে ফেলা হয়েছে" : "History cleared");
  };

  const calculation = calculatePrices();
  const categoryData = BD_MARKUP_RATES[category as keyof typeof BD_MARKUP_RATES];

  return (
    <ShopLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" />
              {language === "bn" ? "মূল্য ক্যালকুলেটর" : "Price Calculator"}
              {!isOnline && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                  <WifiOff className="h-3 w-3 mr-1" />
                  {language === "bn" ? "অফলাইন" : "Offline"}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "bn" 
                ? "বাংলাদেশের ভোক্তা অধিকার আইন অনুযায়ী সঠিক বিক্রয় মূল্য নির্ধারণ করুন" 
                : "Calculate selling price according to Bangladesh Consumer Protection Law"}
            </p>
          </div>
        </div>

        <Tabs defaultValue="calculator" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              {language === "bn" ? "ক্যালকুলেটর" : "Calculator"}
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              {language === "bn" ? "আইন ও নিয়ম" : "Laws & Rules"}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {language === "bn" ? "ইতিহাস" : "History"}
            </TabsTrigger>
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {language === "bn" ? "পণ্যের তথ্য" : "Product Information"}
                  </CardTitle>
                  <CardDescription>
                    {language === "bn" ? "কেনা দাম ও ক্যাটাগরি নির্বাচন করুন" : "Enter purchase price and select category"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Select from existing products */}
                  {products.length > 0 && (
                    <div className="space-y-2">
                      <Label>{language === "bn" ? "বিদ্যমান পণ্য থেকে নির্বাচন" : "Select from existing products"}</Label>
                      <Select value={selectedProduct} onValueChange={handleProductSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "bn" ? "পণ্য নির্বাচন করুন..." : "Select a product..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - ৳{product.purchase_price || 0}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Separator />

                  {/* Manual Entry */}
                  <div className="space-y-2">
                    <Label htmlFor="productName">{language === "bn" ? "পণ্যের নাম" : "Product Name"}</Label>
                    <Input
                      id="productName"
                      value={productName}
                      onChange={(e) => {
                        setProductName(e.target.value);
                        detectCategory(e.target.value);
                      }}
                      placeholder={language === "bn" ? "পণ্যের নাম লিখুন" : "Enter product name"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">{language === "bn" ? "কেনা দাম (৳)" : "Purchase Price (৳)"}</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="0.00"
                      className="text-lg font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === "bn" ? "পণ্যের ক্যাটাগরি" : "Product Category"}</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BD_MARKUP_RATES).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <span>{language === "bn" ? value.name.bn : value.name.en}</span>
                              <Badge variant="outline" className="text-xs">
                                {value.maxMarkup}%
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {language === "bn" ? categoryData.description.bn : categoryData.description.en}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customMarkup">{language === "bn" ? "কাস্টম মার্কআপ % (ঐচ্ছিক)" : "Custom Markup % (Optional)"}</Label>
                    <Input
                      id="customMarkup"
                      type="number"
                      value={customMarkup}
                      onChange={(e) => setCustomMarkup(e.target.value)}
                      placeholder={`সর্বোচ্চ ${categoryData.maxMarkup}%`}
                    />
                  </div>

                  <Button onClick={saveToHistory} variant="outline" className="w-full">
                    <History className="h-4 w-4 mr-2" />
                    {language === "bn" ? "ইতিহাসে সংরক্ষণ" : "Save to History"}
                  </Button>
                </CardContent>
              </Card>

              {/* Results Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    {language === "bn" ? "বিক্রয় মূল্য পরামর্শ" : "Selling Price Suggestion"}
                  </CardTitle>
                  <CardDescription>
                    {language === "bn" 
                      ? `${categoryData.name.bn} - সর্বোচ্চ ${categoryData.maxMarkup}% মার্কআপ অনুমোদিত`
                      : `${categoryData.name.en} - Maximum ${categoryData.maxMarkup}% markup allowed`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {calculation ? (
                    <>
                      {/* Legal Max Price */}
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <span className="font-medium text-red-600 dark:text-red-400">
                              {language === "bn" ? "সর্বোচ্চ আইনি মূল্য" : "Maximum Legal Price"}
                            </span>
                          </div>
                          <span className="text-xl font-bold text-red-600 dark:text-red-400">
                            ৳ {calculation.maxProfit.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === "bn" 
                            ? `এর বেশি মূল্যে বিক্রি আইনত দণ্ডনীয় (${categoryData.maxMarkup}% মার্কআপ)`
                            : `Selling above this is legally punishable (${categoryData.maxMarkup}% markup)`}
                        </p>
                      </div>

                      {/* Suggested Price */}
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {language === "bn" ? "প্রস্তাবিত মূল্য" : "Suggested Price"}
                            </span>
                          </div>
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            ৳ {calculation.suggestedPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">
                            {language === "bn" ? "লাভ:" : "Profit:"}
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            ৳ {calculation.profitAtSuggested.toLocaleString()} ({calculation.profitPercentAtSuggested}%)
                          </span>
                        </div>
                      </div>

                      {/* Price Tiers */}
                      <div className="space-y-2">
                        <Label className="text-sm">{language === "bn" ? "মূল্য পরিসীমা" : "Price Range"}</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">{language === "bn" ? "সর্বনিম্ন" : "Minimum"}</p>
                            <p className="font-semibold">৳ {calculation.minProfit.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">5%</p>
                          </div>
                          <div className="p-3 bg-primary/10 rounded-lg text-center border-2 border-primary">
                            <p className="text-xs text-muted-foreground">{language === "bn" ? "প্রস্তাবিত" : "Suggested"}</p>
                            <p className="font-semibold text-primary">৳ {calculation.normalProfit.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{(categoryData.maxMarkup * 0.7).toFixed(0)}%</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">{language === "bn" ? "সর্বোচ্চ" : "Maximum"}</p>
                            <p className="font-semibold">৳ {calculation.maxProfit.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{categoryData.maxMarkup}%</p>
                          </div>
                        </div>
                      </div>

                      {/* Custom Markup Result */}
                      {calculation.customPrice && (
                        <div className={`p-4 rounded-lg border ${calculation.isCustomLegal ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {calculation.isCustomLegal ? (
                                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                              )}
                              <span className={`font-medium ${calculation.isCustomLegal ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                {language === "bn" ? "কাস্টম মার্কআপ মূল্য" : "Custom Markup Price"}
                              </span>
                            </div>
                            <span className={`text-xl font-bold ${calculation.isCustomLegal ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                              ৳ {calculation.customPrice.toLocaleString()}
                            </span>
                          </div>
                          {!calculation.isCustomLegal && (
                            <p className="text-xs text-red-500 mt-1">
                              {language === "bn" 
                                ? "⚠️ এই মার্কআপ আইনি সীমা অতিক্রম করেছে!"
                                : "⚠️ This markup exceeds the legal limit!"}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Summary */}
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{language === "bn" ? "সারসংক্ষেপ" : "Summary"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{language === "bn" ? "কেনা দাম:" : "Purchase:"}</span>
                            <span className="font-medium">৳ {calculation.purchasePrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{language === "bn" ? "বিক্রয় দাম:" : "Selling:"}</span>
                            <span className="font-medium">৳ {calculation.suggestedPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{language === "bn" ? "লাভ:" : "Profit:"}</span>
                            <span className="font-medium text-green-600">৳ {calculation.profitAtSuggested.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{language === "bn" ? "মার্কআপ:" : "Markup:"}</span>
                            <span className="font-medium">{calculation.profitPercentAtSuggested}%</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Calculator className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">
                        {language === "bn" 
                          ? "কেনা দাম দিন হিসাব দেখতে"
                          : "Enter purchase price to see calculations"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-4">
            <Alert>
              <Scale className="h-4 w-4" />
              <AlertTitle>{language === "bn" ? "বাংলাদেশ ভোক্তা অধিকার সংরক্ষণ আইন, ২০০৯" : "Bangladesh Consumer Rights Protection Act, 2009"}</AlertTitle>
              <AlertDescription>
                {language === "bn" 
                  ? "এই আইন অনুযায়ী বিভিন্ন পণ্যের জন্য সর্বোচ্চ মুনাফা হার নির্ধারিত আছে। এর বেশি মূল্যে পণ্য বিক্রি দণ্ডনীয় অপরাধ।"
                  : "According to this act, maximum profit margins are set for different products. Selling above these limits is a punishable offense."}
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(BD_MARKUP_RATES).map(([key, value]) => (
                <Card key={key} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {language === "bn" ? value.name.bn : value.name.en}
                      </CardTitle>
                      <Badge variant={value.maxMarkup <= 20 ? "destructive" : value.maxMarkup <= 30 ? "default" : "secondary"}>
                        <Percent className="h-3 w-3 mr-1" />
                        {value.maxMarkup}%
                      </Badge>
                    </div>
                    <CardDescription>
                      {language === "bn" ? value.description.bn : value.description.en}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {value.examples.slice(0, 5).map((ex, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {ex}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {language === "bn" ? "গুরুত্বপূর্ণ তথ্য" : "Important Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">{language === "bn" ? "অপরাধের শাস্তি:" : "Penalties for Violation:"}</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>{language === "bn" ? "প্রথম অপরাধে: সর্বোচ্চ ১ বছর কারাদণ্ড বা ৫০,০০০ টাকা জরিমানা" : "First offense: Up to 1 year imprisonment or ৳50,000 fine"}</li>
                    <li>{language === "bn" ? "পুনরায় অপরাধে: সর্বোচ্চ ৩ বছর কারাদণ্ড বা ২,০০,০০০ টাকা জরিমানা" : "Repeat offense: Up to 3 years imprisonment or ৳200,000 fine"}</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">{language === "bn" ? "মূল্য নির্ধারণের সূত্র:" : "Price Calculation Formula:"}</h4>
                  <div className="p-3 bg-muted rounded-lg font-mono text-sm">
                    {language === "bn" 
                      ? "বিক্রয় মূল্য = কেনা দাম × (১ + মার্কআপ%/১০০)"
                      : "Selling Price = Purchase Price × (1 + Markup%/100)"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {language === "bn" ? "গণনার ইতিহাস" : "Calculation History"}
              </h3>
              {calculationHistory.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {language === "bn" ? "ইতিহাস মুছুন" : "Clear History"}
                </Button>
              )}
            </div>

            {calculationHistory.length > 0 ? (
              <div className="space-y-2">
                {calculationHistory.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{item.productName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {language === "bn" ? BD_MARKUP_RATES[item.category as keyof typeof BD_MARKUP_RATES]?.name.bn : BD_MARKUP_RATES[item.category as keyof typeof BD_MARKUP_RATES]?.name.en}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {language === "bn" ? "কেনা:" : "Purchase:"} ৳{item.purchasePrice.toLocaleString()}
                        </p>
                        <p className="font-medium text-green-600">
                          {language === "bn" ? "বিক্রয়:" : "Sell:"} ৳{item.suggestedPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(item.timestamp).toLocaleString(language === "bn" ? "bn-BD" : "en-US")}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {language === "bn" 
                      ? "কোনো গণনার ইতিহাস নেই"
                      : "No calculation history yet"}
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ShopLayout>
  );
};

export default ShopPriceCalculator;
