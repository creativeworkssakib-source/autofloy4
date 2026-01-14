import { useState, useEffect } from "react";
import { Save, Upload, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { offlineShopService } from "@/services/offlineShopService";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShop } from "@/contexts/ShopContext";
import { ThermalReceiptPreview } from "@/components/offline-shop/thermal-receipt-template";

interface InvoiceSettings {
  shop_name: string;
  branch_name: string;
  shop_address: string;
  shop_phone: string;
  shop_email: string;
  logo_url: string;
  currency: string;
  invoice_prefix: string;
  tax_rate: number;
  invoice_format: 'simple' | 'better';
  receipt_size: '80mm' | '58mm' | 'a4';
  receipt_font_size: 'small' | 'medium' | 'large';
  show_logo_on_receipt: boolean;
  thank_you_message: string;
  show_tax_on_receipt: boolean;
  show_payment_method: boolean;
  receipt_header_text: string;
  receipt_footer_text: string;
  terms_and_conditions: string;
  invoice_footer: string;
}

const defaultSettings: InvoiceSettings = {
  shop_name: '',
  branch_name: '',
  shop_address: '',
  shop_phone: '',
  shop_email: '',
  logo_url: '',
  currency: '৳',
  invoice_prefix: 'INV',
  tax_rate: 0,
  invoice_format: 'simple',
  receipt_size: '80mm',
  receipt_font_size: 'small',
  show_logo_on_receipt: true,
  thank_you_message: 'Thank you for shopping with us!',
  show_tax_on_receipt: true,
  show_payment_method: true,
  receipt_header_text: '',
  receipt_footer_text: '',
  terms_and_conditions: '',
  invoice_footer: '',
};

// Sample invoice data for preview
const sampleInvoiceData = {
  invoice_number: 'INV-2025-0001',
  sale_date: new Date().toISOString(),
  items: [
    { product_name: 'Rice (5kg)', quantity: 2, unit_price: 350, total: 700 },
    { product_name: 'Cooking Oil (1L)', quantity: 1, unit_price: 180, total: 180 },
    { product_name: 'Sugar (1kg)', quantity: 3, unit_price: 95, total: 285 },
    { product_name: 'Salt (500g)', quantity: 2, unit_price: 25, total: 50 },
  ],
  subtotal: 1215,
  discount: 15,
  tax: 0,
  total: 1200,
  paid_amount: 1000,
  due_amount: 200,
  payment_method: 'cash',
};

const InvoiceSettings = () => {
  const { t, language } = useLanguage();
  const { currentShop } = useShop();
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await offlineShopService.getSettings();
      if (response.settings) {
        setSettings({
          ...defaultSettings,
          ...response.settings,
        });
      }
    } catch (error) {
      console.error("Load settings error:", error);
      toast.error(language === 'bn' ? 'সেটিংস লোড করতে সমস্যা হয়েছে' : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentShop?.id) {
      loadSettings();
    }
  }, [currentShop?.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Only send the fields that should be saved - exclude computed fields
      const settingsToSave = {
        shop_name: settings.shop_name,
        branch_name: settings.branch_name,
        shop_address: settings.shop_address,
        shop_phone: settings.shop_phone,
        shop_email: settings.shop_email,
        logo_url: settings.logo_url,
        currency: settings.currency,
        invoice_prefix: settings.invoice_prefix,
        tax_rate: settings.tax_rate,
        invoice_format: settings.invoice_format,
        receipt_size: settings.receipt_size,
        receipt_font_size: settings.receipt_font_size,
        show_logo_on_receipt: settings.show_logo_on_receipt,
        thank_you_message: settings.thank_you_message,
        show_tax_on_receipt: settings.show_tax_on_receipt,
        show_payment_method: settings.show_payment_method,
        receipt_header_text: settings.receipt_header_text,
        receipt_footer_text: settings.receipt_footer_text,
        terms_and_conditions: settings.terms_and_conditions,
        invoice_footer: settings.invoice_footer,
      };
      await offlineShopService.saveSettings(settingsToSave);
      toast.success(language === 'bn' ? 'সেটিংস সংরক্ষিত হয়েছে' : 'Settings saved successfully');
    } catch (error) {
      console.error("Save settings error:", error);
      toast.error(language === 'bn' ? 'সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে' : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <ShopLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'bn' ? 'ইনভয়েস সেটিংস' : 'Invoice Settings'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {language === 'bn' 
                ? 'আপনার রিসিপ্ট এবং ইনভয়েস কাস্টমাইজ করুন' 
                : 'Customize your receipts and invoices'}
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving 
              ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') 
              : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Settings')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Panel */}
          <div className="space-y-6">
            <Tabs defaultValue="business" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="business">
                  {language === 'bn' ? 'ব্যবসা' : 'Business'}
                </TabsTrigger>
                <TabsTrigger value="receipt">
                  {language === 'bn' ? 'রিসিপ্ট' : 'Receipt'}
                </TabsTrigger>
                <TabsTrigger value="content">
                  {language === 'bn' ? 'কন্টেন্ট' : 'Content'}
                </TabsTrigger>
              </TabsList>

              {/* Business Info Tab */}
              <TabsContent value="business" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {language === 'bn' ? 'ব্যবসার তথ্য' : 'Business Information'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'bn' 
                        ? 'রিসিপ্টে দেখানো হবে এমন তথ্য' 
                        : 'Information shown on receipts'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>{language === 'bn' ? 'দোকানের নাম' : 'Shop Name'}</Label>
                      <Input
                        value={settings.shop_name}
                        onChange={(e) => updateSetting('shop_name', e.target.value)}
                        placeholder={language === 'bn' ? 'আপনার দোকানের নাম' : 'Your shop name'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'bn' ? 'শাখার নাম' : 'Branch Name'}</Label>
                      <Input
                        value={settings.branch_name}
                        onChange={(e) => updateSetting('branch_name', e.target.value)}
                        placeholder={language === 'bn' ? 'শাখার নাম (ঐচ্ছিক)' : 'Branch name (optional)'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'bn' ? 'ঠিকানা' : 'Address'}</Label>
                      <Textarea
                        value={settings.shop_address}
                        onChange={(e) => updateSetting('shop_address', e.target.value)}
                        placeholder={language === 'bn' ? 'সম্পূর্ণ ঠিকানা' : 'Full address'}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'ফোন' : 'Phone'}</Label>
                        <Input
                          value={settings.shop_phone}
                          onChange={(e) => updateSetting('shop_phone', e.target.value)}
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'ইমেইল' : 'Email'}</Label>
                        <Input
                          type="email"
                          value={settings.shop_email}
                          onChange={(e) => updateSetting('shop_email', e.target.value)}
                          placeholder="shop@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'bn' ? 'লোগো URL' : 'Logo URL'}</Label>
                      <Input
                        value={settings.logo_url}
                        onChange={(e) => updateSetting('logo_url', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'মুদ্রা চিহ্ন' : 'Currency Symbol'}</Label>
                        <Input
                          value={settings.currency}
                          onChange={(e) => updateSetting('currency', e.target.value)}
                          placeholder="৳"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'ইনভয়েস প্রিফিক্স' : 'Invoice Prefix'}</Label>
                        <Input
                          value={settings.invoice_prefix}
                          onChange={(e) => updateSetting('invoice_prefix', e.target.value)}
                          placeholder="INV"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'bn' ? 'ট্যাক্স রেট (%)' : 'Tax Rate (%)'}</Label>
                      <Input
                        type="number"
                        value={settings.tax_rate}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSetting('tax_rate', val === "" ? 0 : parseFloat(val) || 0);
                        }}
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Receipt Settings Tab */}
              <TabsContent value="receipt" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {language === 'bn' ? 'রিসিপ্ট সেটিংস' : 'Receipt Settings'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'bn' 
                        ? 'থার্মাল প্রিন্টার এবং কাগজের সাইজ' 
                        : 'Thermal printer and paper size settings'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Invoice Format Selection */}
                    <div className="space-y-3">
                      <Label>{language === 'bn' ? 'ইনভয়েস ফরম্যাট' : 'Invoice Format'}</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            settings.invoice_format === "simple" 
                              ? "border-primary bg-primary/5" 
                              : "border-muted hover:border-muted-foreground/50"
                          }`}
                          onClick={() => updateSetting('invoice_format', 'simple')}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              settings.invoice_format === "simple" ? "border-primary" : "border-muted-foreground/50"
                            }`}>
                              {settings.invoice_format === "simple" && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <span className="font-medium">{language === 'bn' ? 'সিম্পল ইনভয়েস' : 'Simple Invoice'}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {language === 'bn' ? 'সাধারণ মিনিমাল ডিজাইন' : 'Clean minimal design with basic info'}
                          </p>
                        </div>
                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            settings.invoice_format === "better" 
                              ? "border-primary bg-primary/5" 
                              : "border-muted hover:border-muted-foreground/50"
                          }`}
                          onClick={() => updateSetting('invoice_format', 'better')}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              settings.invoice_format === "better" ? "border-primary" : "border-muted-foreground/50"
                            }`}>
                              {settings.invoice_format === "better" && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <span className="font-medium">{language === 'bn' ? 'বেটার ইনভয়েস' : 'Better Invoice'}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {language === 'bn' ? 'প্রফেশনাল ডিজাইন ডার্ক হেডার সহ' : 'Professional design with dark header & orange accents'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'bn' ? 'রিসিপ্ট সাইজ' : 'Receipt Size'}</Label>
                      <Select 
                        value={settings.receipt_size} 
                        onValueChange={(v) => updateSetting('receipt_size', v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="80mm">
                            80mm - {language === 'bn' ? 'স্ট্যান্ডার্ড থার্মাল' : 'Standard Thermal'}
                          </SelectItem>
                          <SelectItem value="58mm">
                            58mm - {language === 'bn' ? 'কম্প্যাক্ট থার্মাল' : 'Compact Thermal'}
                          </SelectItem>
                          <SelectItem value="a4">
                            A4 - {language === 'bn' ? 'ফুল পেজ ইনভয়েস' : 'Full Page Invoice'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'bn' ? 'ফন্ট সাইজ' : 'Font Size'}</Label>
                      <Select 
                        value={settings.receipt_font_size} 
                        onValueChange={(v) => updateSetting('receipt_font_size', v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">
                            {language === 'bn' ? 'ছোট (কাগজ বাঁচায়)' : 'Small (saves paper)'}
                          </SelectItem>
                          <SelectItem value="medium">
                            {language === 'bn' ? 'মাঝারি' : 'Medium'}
                          </SelectItem>
                          <SelectItem value="large">
                            {language === 'bn' ? 'বড়' : 'Large'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>{language === 'bn' ? 'লোগো দেখান' : 'Show Logo'}</Label>
                          <p className="text-xs text-muted-foreground">
                            {language === 'bn' ? 'রিসিপ্টে লোগো প্রিন্ট করুন' : 'Print logo on receipt'}
                          </p>
                        </div>
                        <Switch
                          checked={settings.show_logo_on_receipt}
                          onCheckedChange={(v) => updateSetting('show_logo_on_receipt', v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>{language === 'bn' ? 'ট্যাক্স দেখান' : 'Show Tax'}</Label>
                          <p className="text-xs text-muted-foreground">
                            {language === 'bn' ? 'ট্যাক্সের পরিমাণ দেখান' : 'Display tax amount'}
                          </p>
                        </div>
                        <Switch
                          checked={settings.show_tax_on_receipt}
                          onCheckedChange={(v) => updateSetting('show_tax_on_receipt', v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>{language === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Method'}</Label>
                          <p className="text-xs text-muted-foreground">
                            {language === 'bn' ? 'পেমেন্ট মেথড দেখান' : 'Show payment method'}
                          </p>
                        </div>
                        <Switch
                          checked={settings.show_payment_method}
                          onCheckedChange={(v) => updateSetting('show_payment_method', v)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {language === 'bn' ? 'রিসিপ্ট কন্টেন্ট' : 'Receipt Content'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'bn' 
                        ? 'কাস্টম টেক্সট এবং মেসেজ' 
                        : 'Custom text and messages'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>{language === 'bn' ? 'ধন্যবাদ মেসেজ' : 'Thank You Message'}</Label>
                      <Input
                        value={settings.thank_you_message}
                        onChange={(e) => updateSetting('thank_you_message', e.target.value)}
                        placeholder={language === 'bn' ? 'আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ!' : 'Thank you for shopping with us!'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'bn' ? 'হেডার টেক্সট' : 'Header Text'}</Label>
                      <Textarea
                        value={settings.receipt_header_text}
                        onChange={(e) => updateSetting('receipt_header_text', e.target.value)}
                        placeholder={language === 'bn' ? 'রিসিপ্টের উপরে অতিরিক্ত টেক্সট' : 'Additional text at top of receipt'}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'bn' ? 'ফুটার টেক্সট' : 'Footer Text'}</Label>
                      <Textarea
                        value={settings.receipt_footer_text}
                        onChange={(e) => updateSetting('receipt_footer_text', e.target.value)}
                        placeholder={language === 'bn' ? 'রিসিপ্টের নিচে অতিরিক্ত টেক্সট' : 'Additional text at bottom of receipt'}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === 'bn' ? 'শর্তাবলী' : 'Terms & Conditions'}</Label>
                      <Textarea
                        value={settings.terms_and_conditions}
                        onChange={(e) => updateSetting('terms_and_conditions', e.target.value)}
                        placeholder={language === 'bn' ? 'রিটার্ন পলিসি, ওয়ারেন্টি ইত্যাদি' : 'Return policy, warranty, etc.'}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {language === 'bn' ? 'লাইভ প্রিভিউ' : 'Live Preview'}
                </CardTitle>
                <CardDescription>
                  {language === 'bn' 
                    ? 'আপনার রিসিপ্ট এমন দেখাবে' 
                    : 'This is how your receipt will look'}
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-muted/30 rounded-lg p-4 overflow-auto max-h-[600px]">
                <ThermalReceiptPreview
                  sale={sampleInvoiceData}
                  shopSettings={settings}
                  customerInfo={{ name: 'John Doe', phone: '01712345678' }}
                  t={t}
                />
              </CardContent>
            </Card>

            {/* Paper Size Guide */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {language === 'bn' ? 'কাগজের সাইজ গাইড' : 'Paper Size Guide'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">80mm</span>
                  <span>{language === 'bn' ? 'স্ট্যান্ডার্ড POS প্রিন্টার' : 'Standard POS printers'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">58mm</span>
                  <span>{language === 'bn' ? 'মিনি/পোর্টেবল প্রিন্টার' : 'Mini/portable printers'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">A4</span>
                  <span>{language === 'bn' ? 'অফিস প্রিন্টার' : 'Office printers'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
};

export default InvoiceSettings;
