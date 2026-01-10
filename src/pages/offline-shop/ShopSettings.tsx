import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Store,
  FileText,
  MessageSquare,
  Link2,
  Settings,
  Save,
  Upload,
  ImageIcon,
  X,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Zap,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { useSyncSettings } from "@/hooks/useSyncSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { offlineShopService } from "@/services/offlineShopService";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useSmsLimits } from "@/hooks/useSmsLimits";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import { useTheme } from "next-themes";

// Component to show platform SMS provider info with usage
const PlatformSmsInfo = ({ language }: { language: string }) => {
  const { settings } = useSiteSettings();
  const smsLimits = useSmsLimits();
  
  const getProviderName = (provider: string | null) => {
    switch (provider) {
      case "ssl_wireless": return "SSL Wireless";
      case "bulksms_bd": return "BulkSMS BD";
      case "twilio": return "Twilio";
      case "mim_sms": return "MIM SMS";
      case "greenweb": return "Green Web BD";
      default: return "SSL Wireless";
    }
  };

  const isEnabled = settings?.platform_sms_enabled;
  const providerName = getProviderName(settings?.platform_sms_provider);
  const usagePercent = smsLimits.isUnlimited ? 0 : smsLimits.dailyLimit > 0 ? (smsLimits.usedToday / smsLimits.dailyLimit) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          {language === "bn" ? "প্ল্যাটফর্ম SMS সার্ভিস সক্রিয়" : "Platform SMS Service Active"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {language === "bn" 
            ? `আপনি আমাদের প্ল্যাটফর্মের ডিফল্ট SMS সার্ভিস ব্যবহার করছেন। প্রোভাইডার: ${providerName}` 
            : `You are using our platform's default SMS service. Provider: ${providerName}`}
        </p>
        {!isEnabled && (
          <p className="text-xs text-amber-600 mt-1">
            {language === "bn" 
              ? "⚠️ প্ল্যাটফর্ম SMS সার্ভিস বর্তমানে নিষ্ক্রিয়। অ্যাডমিনের সাথে যোগাযোগ করুন।" 
              : "⚠️ Platform SMS service is currently disabled. Contact admin."}
          </p>
        )}
      </div>

      {/* SMS Usage Display */}
      {smsLimits.canSendSms && (
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {language === "bn" ? "আজকের SMS ব্যবহার" : "Today's SMS Usage"}
            </span>
            <Badge variant={smsLimits.isUnlimited ? "default" : usagePercent >= 80 ? "destructive" : "secondary"}>
              {smsLimits.isUnlimited 
                ? (language === "bn" ? "সীমাহীন" : "Unlimited")
                : `${smsLimits.usedToday} / ${smsLimits.dailyLimit}`
              }
            </Badge>
          </div>
          {!smsLimits.isUnlimited && (
            <>
              <Progress value={usagePercent} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>
                  {language === "bn" 
                    ? `বাকি আছে: ${smsLimits.remainingToday} SMS` 
                    : `Remaining: ${smsLimits.remainingToday} SMS`}
                </span>
                <span>
                  {language === "bn" ? "মধ্যরাতে রিসেট হবে" : "Resets at midnight"}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ShopSettings = () => {
  const { syncEnabled, masterInventory, isLoading, isSyncing, updateSyncSettings, canSyncBusiness } = useSyncSettings();
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { currentShop } = useShop();
  const { theme, setTheme } = useTheme();
  const smsLimits = useSmsLimits();
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingShop, setIsSavingShop] = useState(false);
  const [localSyncEnabled, setLocalSyncEnabled] = useState(syncEnabled);
  const [isLoadingShop, setIsLoadingShop] = useState(true);
  
  // Check if user can use platform SMS
  const userPlan = (user?.subscriptionPlan || 'none') as string;
  const canUsePlatformSms = smsLimits.canSendSms;
  const isTrialOrNoPlan = userPlan === 'trial' || userPlan === 'none';
  
  const [shopSettings, setShopSettings] = useState({
    shop_name: "",
    shop_address: "",
    shop_phone: "",
    shop_email: "",
    currency: "BDT",
    tax_rate: 0,
    invoice_prefix: "INV",
    invoice_footer: "",
    logo_url: "",
    terms_and_conditions: "",
    invoice_format: "simple" as "simple" | "better",
    due_reminder_sms_template: "প্রিয় {customer_name}, আপনার কাছে {shop_name} এ মোট {due_amount} টাকা বাকি আছে। অনুগ্রহ করে পরিশোধ করুন।",
    sms_api_key: "",
    sms_sender_id: "",
    use_platform_sms: true,
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const loadShopSettings = async () => {
    setIsLoadingShop(true);
    try {
      const result = await offlineShopService.getSettings();
      if (result.settings) {
        setShopSettings({
          shop_name: result.settings.shop_name || "",
          shop_address: result.settings.shop_address || "",
          shop_phone: result.settings.shop_phone || "",
          shop_email: result.settings.shop_email || "",
          currency: result.settings.currency || "BDT",
          tax_rate: result.settings.tax_rate || 0,
          invoice_prefix: result.settings.invoice_prefix || "INV",
          invoice_footer: result.settings.invoice_footer || "",
          logo_url: result.settings.logo_url || "",
          terms_and_conditions: result.settings.terms_and_conditions || "",
          invoice_format: result.settings.invoice_format || "simple",
          due_reminder_sms_template: result.settings.due_reminder_sms_template || "প্রিয় {customer_name}, আপনার কাছে {shop_name} এ মোট {due_amount} টাকা বাকি আছে। অনুগ্রহ করে পরিশোধ করুন।",
          sms_api_key: result.settings.sms_api_key || "",
          sms_sender_id: result.settings.sms_sender_id || "",
          use_platform_sms: result.settings.use_platform_sms !== false,
        });
      }
    } catch (error) {
      // Settings might not exist yet
    } finally {
      setIsLoadingShop(false);
    }
  };

  useEffect(() => {
    setLocalSyncEnabled(syncEnabled);
  }, [syncEnabled]);

  useEffect(() => {
    loadShopSettings();
  }, [currentShop?.id]);

  const handleToggleSync = async () => {
    if (!canSyncBusiness && !localSyncEnabled) {
      toast.error(
        language === "bn" 
          ? "আপনার Business Sync করার অনুমতি নেই। অনুগ্রহ করে Admin এর সাথে যোগাযোগ করুন।" 
          : "You do not have permission to enable Business Sync. Please contact admin."
      );
      return;
    }

    setIsSaving(true);
    try {
      const wasDisabled = !localSyncEnabled;
      const response = await updateSyncSettings({ sync_enabled: !localSyncEnabled });
      
      if (response) {
        if (response.canSyncBusiness === false && wasDisabled) {
          toast.error(
            language === "bn" 
              ? "আপনার Business Sync করার অনুমতি নেই।" 
              : "You do not have permission to enable Business Sync."
          );
          return;
        }

        setLocalSyncEnabled(!localSyncEnabled);
        
        if (wasDisabled && response.syncStats) {
          const stats = response.syncStats;
          const totalSynced = stats.offlineToOnline + stats.onlineToOffline + stats.stockUpdated;
          
          if (totalSynced > 0) {
            toast.success(
              language === "bn" 
                ? `Sync সম্পন্ন! ${stats.offlineToOnline} offline থেকে online, ${stats.onlineToOffline} online থেকে offline, ${stats.stockUpdated} স্টক আপডেট।`
                : `Sync complete! ${stats.offlineToOnline} offline to online, ${stats.onlineToOffline} online to offline, ${stats.stockUpdated} stock updated.`,
              { duration: 5000 }
            );
          } else {
            toast.success(
              language === "bn" 
                ? "Sync সক্রিয়! Online এবং Offline inventory এখন সংযুক্ত।"
                : "Sync enabled! Online and Offline inventory are now connected."
            );
          }
        } else if (!wasDisabled) {
          toast.success(
            language === "bn"
              ? "Sync নিষ্ক্রিয়। Inventory গুলি এখন আলাদা।"
              : "Sync disabled. Inventories are now separate."
          );
        } else {
          toast.success(
            language === "bn" 
              ? "Sync সক্রিয়!"
              : "Sync enabled!"
          );
        }
      } else {
        toast.error(language === "bn" ? "Sync সেটিংস আপডেট করতে ব্যর্থ" : "Failed to update sync settings");
      }
    } catch (error) {
      toast.error(language === "bn" ? "Sync সেটিংস আপডেট করতে ব্যর্থ" : "Failed to update sync settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveShopSettings = async () => {
    setIsSavingShop(true);
    try {
      await offlineShopService.saveSettings(shopSettings);
      toast.success(language === "bn" ? "সেটিংস সংরক্ষিত হয়েছে" : "Settings saved");
    } catch (error) {
      toast.error(language === "bn" ? "সেটিংস সংরক্ষণে সমস্যা" : "Error saving settings");
    } finally {
      setIsSavingShop(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(language === "bn" ? "শুধুমাত্র ছবি আপলোড করুন" : "Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === "bn" ? "ছবির সাইজ ২MB এর কম হতে হবে" : "Image size must be less than 2MB");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setShopSettings({ ...shopSettings, logo_url: base64 });
        await offlineShopService.saveSettings({ ...shopSettings, logo_url: base64 });
        toast.success(language === "bn" ? "লোগো আপলোড হয়েছে" : "Logo uploaded");
        setIsUploadingLogo(false);
      };
      reader.onerror = () => {
        toast.error(language === "bn" ? "আপলোডে সমস্যা" : "Upload error");
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(language === "bn" ? "আপলোডে সমস্যা" : "Upload error");
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setShopSettings({ ...shopSettings, logo_url: "" });
    await offlineShopService.saveSettings({ ...shopSettings, logo_url: "" });
    toast.success(language === "bn" ? "লোগো মুছে ফেলা হয়েছে" : "Logo removed");
  };

  return (
    <ShopLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            {language === "bn" ? "সেটিংস" : "Settings"}
          </h1>
          <p className="text-muted-foreground">
            {language === "bn" ? "আপনার দোকানের সেটিংস পরিচালনা করুন" : "Manage your shop settings"}
          </p>
          {currentShop && (
            <Badge variant="secondary" className="mt-2">
              <Store className="w-3 h-3 mr-1" />
              {language === "bn" ? "বর্তমান শপ:" : "Current Shop:"} {currentShop.name}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="shop-info" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="shop-info" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">{language === "bn" ? "শপ তথ্য" : "Shop Info"}</span>
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{language === "bn" ? "ইনভয়েস" : "Invoice"}</span>
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">SMS</span>
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">{language === "bn" ? "সিঙ্ক" : "Sync"}</span>
            </TabsTrigger>
            <TabsTrigger value="app" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{language === "bn" ? "অ্যাপ" : "App"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Shop Info Tab */}
          <TabsContent value="shop-info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  {language === "bn" ? "দোকানের তথ্য" : "Shop Information"}
                </CardTitle>
                <CardDescription>
                  {language === "bn" ? "আপনার দোকানের মৌলিক তথ্য" : "Basic information about your shop"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingShop ? (
                  <p className="text-muted-foreground">{language === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>
                ) : (
                  <>
                    {/* Logo Upload */}
                    <div className="space-y-3">
                      <Label>{language === "bn" ? "দোকানের লোগো" : "Shop Logo"}</Label>
                      <div className="flex items-center gap-4">
                        {shopSettings.logo_url ? (
                          <div className="relative">
                            <img 
                              src={shopSettings.logo_url} 
                              alt="Shop Logo" 
                              className="w-20 h-20 rounded-xl border bg-muted object-contain p-2"
                            />
                            <button
                              onClick={handleRemoveLogo}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                        )}
                        <div>
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={isUploadingLogo}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploadingLogo 
                              ? (language === "bn" ? "আপলোড হচ্ছে..." : "Uploading...")
                              : (language === "bn" ? "লোগো আপলোড করুন" : "Upload Logo")
                            }
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            {language === "bn" ? "সর্বোচ্চ ২MB, PNG/JPG" : "Max 2MB, PNG/JPG"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{language === "bn" ? "দোকানের নাম" : "Shop Name"}</Label>
                        <Input
                          value={shopSettings.shop_name}
                          onChange={(e) => setShopSettings({ ...shopSettings, shop_name: e.target.value })}
                          placeholder={language === "bn" ? "আপনার দোকানের নাম" : "Your shop name"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === "bn" ? "ফোন নম্বর" : "Phone Number"}</Label>
                        <Input
                          value={shopSettings.shop_phone}
                          onChange={(e) => setShopSettings({ ...shopSettings, shop_phone: e.target.value })}
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === "bn" ? "ইমেইল" : "Email"}</Label>
                        <Input
                          type="email"
                          value={shopSettings.shop_email}
                          onChange={(e) => setShopSettings({ ...shopSettings, shop_email: e.target.value })}
                          placeholder="shop@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === "bn" ? "মুদ্রা" : "Currency"}</Label>
                        <Select
                          value={shopSettings.currency}
                          onValueChange={(value) => setShopSettings({ ...shopSettings, currency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BDT">৳ BDT</SelectItem>
                            <SelectItem value="USD">$ USD</SelectItem>
                            <SelectItem value="INR">₹ INR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{language === "bn" ? "ঠিকানা" : "Address"}</Label>
                      <Textarea
                        value={shopSettings.shop_address}
                        onChange={(e) => setShopSettings({ ...shopSettings, shop_address: e.target.value })}
                        placeholder={language === "bn" ? "আপনার দোকানের ঠিকানা" : "Your shop address"}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === "bn" ? "ট্যাক্স রেট (%)" : "Tax Rate (%)"}</Label>
                      <Input
                        type="number"
                        value={shopSettings.tax_rate}
                        onChange={(e) => setShopSettings({ ...shopSettings, tax_rate: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>

                    <Button onClick={handleSaveShopSettings} disabled={isSavingShop} className="w-full sm:w-auto">
                      <Save className="w-4 h-4 mr-2" />
                      {isSavingShop 
                        ? (language === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving...")
                        : (language === "bn" ? "সংরক্ষণ করুন" : "Save Changes")
                      }
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Tab */}
          <TabsContent value="invoice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {language === "bn" ? "ইনভয়েস সেটিংস" : "Invoice Settings"}
                </CardTitle>
                <CardDescription>
                  {language === "bn" ? "ইনভয়েস ফর্ম্যাট ও টেমপ্লেট কাস্টমাইজ করুন" : "Customize invoice format and template"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "bn" ? "ইনভয়েস প্রিফিক্স" : "Invoice Prefix"}</Label>
                    <Input
                      value={shopSettings.invoice_prefix}
                      onChange={(e) => setShopSettings({ ...shopSettings, invoice_prefix: e.target.value })}
                      placeholder="INV"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "bn" ? "ইনভয়েস ফর্ম্যাট" : "Invoice Format"}</Label>
                    <Select
                      value={shopSettings.invoice_format}
                      onValueChange={(value: "simple" | "better") => setShopSettings({ ...shopSettings, invoice_format: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">{language === "bn" ? "সিম্পল" : "Simple"}</SelectItem>
                        <SelectItem value="better">{language === "bn" ? "বেটার" : "Better"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === "bn" ? "ইনভয়েস ফুটার" : "Invoice Footer"}</Label>
                  <Textarea
                    value={shopSettings.invoice_footer}
                    onChange={(e) => setShopSettings({ ...shopSettings, invoice_footer: e.target.value })}
                    placeholder={language === "bn" ? "ধন্যবাদ, আবার আসবেন!" : "Thank you, visit again!"}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === "bn" ? "শর্তাবলী" : "Terms & Conditions"}</Label>
                  <Textarea
                    value={shopSettings.terms_and_conditions}
                    onChange={(e) => setShopSettings({ ...shopSettings, terms_and_conditions: e.target.value })}
                    placeholder={language === "bn" ? "পণ্য ক্রয়ের ৭ দিনের মধ্যে ফেরত দেওয়া যাবে..." : "Products can be returned within 7 days..."}
                    rows={3}
                  />
                </div>

                <Button onClick={handleSaveShopSettings} disabled={isSavingShop} className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingShop 
                    ? (language === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving...")
                    : (language === "bn" ? "সংরক্ষণ করুন" : "Save Changes")
                  }
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {language === "bn" ? "SMS সেটিংস" : "SMS Settings"}
                </CardTitle>
                <CardDescription>
                  {language === "bn" ? "বাকি রিমাইন্ডার ও ফলোআপ SMS সেটিংস" : "Due reminder and followup SMS settings"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Platform SMS Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      {language === "bn" ? "প্ল্যাটফর্ম SMS ব্যবহার করুন" : "Use Platform SMS"}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {language === "bn" 
                        ? "আমাদের প্ল্যাটফর্মের SMS সার্ভিস ব্যবহার করুন" 
                        : "Use our platform's SMS service"}
                    </p>
                  </div>
                  <Switch
                    checked={shopSettings.use_platform_sms}
                    onCheckedChange={(checked) => setShopSettings({ ...shopSettings, use_platform_sms: checked })}
                  />
                </div>

                {shopSettings.use_platform_sms ? (
                  <PlatformSmsInfo language={language} />
                ) : (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      {language === "bn" 
                        ? "নিজের SMS API ব্যবহার করতে চাইলে নিচে API তথ্য দিন" 
                        : "Enter your SMS API details below to use your own service"}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{language === "bn" ? "SMS API Key" : "SMS API Key"}</Label>
                        <Input
                          value={shopSettings.sms_api_key}
                          onChange={(e) => setShopSettings({ ...shopSettings, sms_api_key: e.target.value })}
                          placeholder="Your API Key"
                          type="password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === "bn" ? "Sender ID" : "Sender ID"}</Label>
                        <Input
                          value={shopSettings.sms_sender_id}
                          onChange={(e) => setShopSettings({ ...shopSettings, sms_sender_id: e.target.value })}
                          placeholder="MYSHOP"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{language === "bn" ? "বাকি রিমাইন্ডার SMS টেমপ্লেট" : "Due Reminder SMS Template"}</Label>
                  <Textarea
                    value={shopSettings.due_reminder_sms_template}
                    onChange={(e) => setShopSettings({ ...shopSettings, due_reminder_sms_template: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" 
                      ? "ভেরিয়েবল: {customer_name}, {shop_name}, {due_amount}, {phone}" 
                      : "Variables: {customer_name}, {shop_name}, {due_amount}, {phone}"}
                  </p>
                </div>

                <Button onClick={handleSaveShopSettings} disabled={isSavingShop} className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingShop 
                    ? (language === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving...")
                    : (language === "bn" ? "সংরক্ষণ করুন" : "Save Changes")
                  }
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync Tab */}
          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  {language === "bn" ? "Online-Offline সিঙ্ক" : "Online-Offline Sync"}
                </CardTitle>
                <CardDescription>
                  {language === "bn" 
                    ? "Online এবং Offline inventory এর মধ্যে সিঙ্ক সেটিংস" 
                    : "Sync settings between online and offline inventory"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <p className="text-muted-foreground">{language === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base">
                          {language === "bn" ? "Business Sync সক্রিয় করুন" : "Enable Business Sync"}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {language === "bn" 
                            ? "Online এবং Offline inventory একসাথে সিঙ্ক করুন" 
                            : "Sync online and offline inventory together"}
                        </p>
                      </div>
                      <Switch
                        checked={localSyncEnabled}
                        onCheckedChange={handleToggleSync}
                        disabled={isSaving || isSyncing}
                      />
                    </div>

                    {localSyncEnabled && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>
                          {language === "bn" ? "সিঙ্ক সক্রিয়" : "Sync Enabled"}
                        </AlertTitle>
                        <AlertDescription>
                          {language === "bn" 
                            ? "আপনার Online এবং Offline inventory এখন সংযুক্ত।" 
                            : "Your online and offline inventory are now connected."}
                        </AlertDescription>
                      </Alert>
                    )}

                    {!canSyncBusiness && !localSyncEnabled && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>
                          {language === "bn" ? "অনুমতি নেই" : "No Permission"}
                        </AlertTitle>
                        <AlertDescription>
                          {language === "bn" 
                            ? "Business Sync সক্রিয় করতে হলে প্ল্যান আপগ্রেড করুন।" 
                            : "Upgrade your plan to enable Business Sync."}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* App Settings Tab */}
          <TabsContent value="app" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {language === "bn" ? "অ্যাপ সেটিংস" : "App Settings"}
                </CardTitle>
                <CardDescription>
                  {language === "bn" ? "থিম ও ভাষা সেটিংস" : "Theme and language settings"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div className="space-y-3">
                  <Label>{language === "bn" ? "থিম" : "Theme"}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="flex items-center gap-2"
                    >
                      <Sun className="w-4 h-4" />
                      {language === "bn" ? "লাইট" : "Light"}
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="flex items-center gap-2"
                    >
                      <Moon className="w-4 h-4" />
                      {language === "bn" ? "ডার্ক" : "Dark"}
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("system")}
                      className="flex items-center gap-2"
                    >
                      <Monitor className="w-4 h-4" />
                      {language === "bn" ? "সিস্টেম" : "System"}
                    </Button>
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-3">
                  <Label>{language === "bn" ? "ভাষা" : "Language"}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={language === "bn" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLanguage("bn")}
                    >
                      বাংলা
                    </Button>
                    <Button
                      variant={language === "en" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLanguage("en")}
                    >
                      English
                    </Button>
                  </div>
                </div>

                {/* App Version Info */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">
                    {language === "bn" ? "অ্যাপ ভার্সন" : "App Version"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Autofloy Offline Shop v1.0.0
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ShopLayout>
  );
};

export default ShopSettings;
