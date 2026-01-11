import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Link2,
  Unlink,
  CheckCircle2,
  Info,
  Globe,
  Store,
  Package,
  ArrowRight,
  Save,
  Upload,
  ImageIcon,
  X,
  MessageSquare,
  AlertTriangle,
  Crown,
  Zap,
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
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useSyncSettings } from "@/hooks/useSyncSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { offlineShopService } from "@/services/offlineShopService";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useSmsLimits, getSmsLimitText } from "@/hooks/useSmsLimits";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";

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

// Get plan display name
const getPlanDisplayName = (plan: string, language: string): string => {
  const planNames: Record<string, { en: string; bn: string }> = {
    trial: { en: "Free Trial", bn: "ফ্রি ট্রায়াল" },
    none: { en: "No Plan", bn: "কোনো প্ল্যান নেই" },
    starter: { en: "Starter", bn: "স্টার্টার" },
    professional: { en: "Professional", bn: "প্রফেশনাল" },
    business: { en: "Business", bn: "বিজনেস" },
    lifetime: { en: "Lifetime", bn: "লাইফটাইম" },
  };
  return planNames[plan]?.[language === "bn" ? "bn" : "en"] || plan;
};

const SyncSettings = () => {
  const { syncEnabled, masterInventory, isLoading, isSyncing, updateSyncSettings, canSyncBusiness } = useSyncSettings();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { currentShop } = useShop();
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
    logo_url: "",
    // SMS Settings
    due_reminder_sms_template: "প্রিয় {customer_name}, আপনার কাছে {shop_name} এ মোট {due_amount} টাকা বাকি আছে। আপনি {total_purchases}টি কেনাকাটায় {product_list} কিনেছেন। প্রথম বাকি {oldest_due_date} তারিখে ({days_overdue} দিন আগে)। বিস্তারিত: {purchase_details}। যোগাযোগ: {phone}। অনুগ্রহ করে পরিশোধ করুন।",
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
          logo_url: result.settings.logo_url || "",
          // SMS Settings
          due_reminder_sms_template: result.settings.due_reminder_sms_template || "প্রিয় {customer_name}, আপনার কাছে {shop_name} এ মোট {due_amount} টাকা বাকি আছে। আপনি {total_purchases}টি কেনাকাটায় {product_list} কিনেছেন। প্রথম বাকি {oldest_due_date} তারিখে ({days_overdue} দিন আগে)। বিস্তারিত: {purchase_details}। যোগাযোগ: {phone}। অনুগ্রহ করে পরিশোধ করুন।",
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

  // Reload shop settings when current shop changes
  useEffect(() => {
    loadShopSettings();
  }, [currentShop?.id]);

  const handleToggleSync = async () => {
    // Check if user has permission to sync
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
        // Check if permission was denied
        if (response.canSyncBusiness === false && wasDisabled) {
          toast.error(
            language === "bn" 
              ? "আপনার Business Sync করার অনুমতি নেই। অনুগ্রহ করে Admin এর সাথে যোগাযোগ করুন।" 
              : "You do not have permission to enable Business Sync. Please contact admin."
          );
          return;
        }

        setLocalSyncEnabled(!localSyncEnabled);
        
        // Show appropriate message based on whether products were synced
        if (wasDisabled && response.syncStats) {
          const stats = response.syncStats;
          const totalSynced = stats.offlineToOnline + stats.onlineToOffline + stats.stockUpdated;
          
          if (totalSynced > 0) {
            toast.success(
              t("sync.syncCompleteWithStats")
                .replace("{offlineToOnline}", String(stats.offlineToOnline))
                .replace("{onlineToOffline}", String(stats.onlineToOffline))
                .replace("{stockUpdated}", String(stats.stockUpdated)),
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
              ? "Sync সক্রিয়! Online এবং Offline inventory এখন সংযুক্ত।"
              : "Sync enabled! Online and Offline inventory are now connected."
          );
        }
      } else {
        toast.error(
          language === "bn" 
            ? "Sync সেটিংস আপডেট করতে ব্যর্থ" 
            : "Failed to update sync settings"
        );
      }
    } catch (error) {
      toast.error(
        language === "bn" 
          ? "Sync সেটিংস আপডেট করতে ব্যর্থ" 
          : "Failed to update sync settings"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveShopSettings = async () => {
    setIsSavingShop(true);
    try {
      await offlineShopService.saveSettings(shopSettings);
      toast.success(t("shop.settingsSaved"));
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
    } finally {
      setIsSavingShop(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("shop.invalidImageType"));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("shop.imageTooLarge"));
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Convert to base64 for simple storage
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setShopSettings({ ...shopSettings, logo_url: base64 });
        // Auto-save when logo is uploaded
        await offlineShopService.saveSettings({ ...shopSettings, logo_url: base64 });
        toast.success(t("shop.logoUploaded"));
        setIsUploadingLogo(false);
      };
      reader.onerror = () => {
        toast.error(t("shop.errorOccurred"));
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(t("shop.errorOccurred"));
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setShopSettings({ ...shopSettings, logo_url: "" });
    await offlineShopService.saveSettings({ ...shopSettings, logo_url: "" });
    toast.success(t("shop.logoRemoved"));
  };


  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="w-6 h-6 text-primary" />
            {t("sync.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("sync.desc")}
          </p>
          {currentShop && (
            <Badge variant="secondary" className="mt-2">
              <Store className="w-3 h-3 mr-1" />
              {language === "bn" ? "বর্তমান শপ:" : "Current Shop:"} {currentShop.name}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="shop-info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shop-info" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">{t("shop.shopInfo")}</span>
              <span className="sm:hidden">Shop</span>
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">SMS</span>
              <span className="sm:hidden">SMS</span>
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t("sync.syncTab")}</span>
              <span className="sm:hidden">Sync</span>
            </TabsTrigger>
          </TabsList>

          {/* Shop Info Tab */}
          <TabsContent value="shop-info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  {t("shop.shopInfo")}
                </CardTitle>
                <CardDescription>{t("shop.shopInfoDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingShop ? (
                  <p className="text-muted-foreground">{t("common.loading")}</p>
                ) : (
                  <>
                    {/* Logo Upload Section */}
                    <div className="space-y-3">
                      <Label>{t("shop.shopLogo")}</Label>
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
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={isUploadingLogo}
                            className="w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploadingLogo ? t("shop.uploading") : t("shop.uploadLogo")}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            {t("shop.logoHint")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("shop.shopName")}</Label>
                      <Input
                        value={shopSettings.shop_name}
                        onChange={(e) => setShopSettings({ ...shopSettings, shop_name: e.target.value })}
                        placeholder={t("shop.shopNamePlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("shop.shopAddress")}</Label>
                      <Textarea
                        value={shopSettings.shop_address}
                        onChange={(e) => setShopSettings({ ...shopSettings, shop_address: e.target.value })}
                        placeholder={t("shop.shopAddressPlaceholder")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("shop.shopPhone")}</Label>
                        <Input
                          value={shopSettings.shop_phone}
                          onChange={(e) => setShopSettings({ ...shopSettings, shop_phone: e.target.value })}
                          placeholder={t("shop.phone")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("shop.shopEmail")}</Label>
                        <Input
                          type="email"
                          value={shopSettings.shop_email}
                          onChange={(e) => setShopSettings({ ...shopSettings, shop_email: e.target.value })}
                          placeholder={t("shop.email")}
                        />
                      </div>
                    </div>

                    <Button onClick={handleSaveShopSettings} disabled={isSavingShop} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      {isSavingShop ? t("shop.saving") : t("common.save")}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Tab */}

          {/* SMS Settings Tab */}
          <TabsContent value="sms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  {t("shop.smsSettings") || "SMS Settings"}
                </CardTitle>
                <CardDescription>
                  {t("shop.smsSettingsDesc") || "Configure SMS reminders for due customers"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingShop ? (
                  <p className="text-muted-foreground">{t("common.loading")}</p>
                ) : (
                  <>
                    {/* Plan Info Banner */}
                    <div className={`p-4 rounded-lg border ${
                      isTrialOrNoPlan 
                        ? "bg-amber-500/10 border-amber-500/30" 
                        : "bg-primary/5 border-primary/20"
                    }`}>
                      <div className="flex items-center gap-3">
                        {isTrialOrNoPlan ? (
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                        ) : (
                          <Crown className="h-5 w-5 text-primary" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">
                            {language === "bn" 
                              ? `আপনার প্ল্যান: ${getPlanDisplayName(userPlan, language)}`
                              : `Your Plan: ${getPlanDisplayName(userPlan, language)}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isTrialOrNoPlan 
                              ? (language === "bn" 
                                  ? "Platform SMS ব্যবহার করতে Starter বা উচ্চতর প্ল্যানে আপগ্রেড করুন" 
                                  : "Upgrade to Starter or higher plan to use Platform SMS")
                              : (language === "bn" 
                                  ? `দৈনিক SMS লিমিট: ${getSmsLimitText(smsLimits.dailyLimit, language)}`
                                  : `Daily SMS Limit: ${getSmsLimitText(smsLimits.dailyLimit, language)}`)
                            }
                          </p>
                        </div>
                        {isTrialOrNoPlan && (
                          <Link to="/pricing">
                            <Button size="sm" className="gap-1">
                              <Zap className="h-3 w-3" />
                              {language === "bn" ? "আপগ্রেড" : "Upgrade"}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* SMS Provider Choice */}
                    <div className="space-y-3">
                      <Label>{language === "bn" ? "SMS প্রদানকারী নির্বাচন করুন" : "Select SMS Provider"}</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Platform SMS Option */}
                        <div 
                          className={`border-2 rounded-lg p-4 transition-all relative ${
                            isTrialOrNoPlan 
                              ? "border-muted bg-muted/30 cursor-not-allowed opacity-60" 
                              : shopSettings.use_platform_sms 
                                ? "border-green-500 bg-green-500/5 cursor-pointer" 
                                : "border-muted hover:border-muted-foreground/50 cursor-pointer"
                          }`}
                          onClick={() => {
                            if (!isTrialOrNoPlan) {
                              setShopSettings({ ...shopSettings, use_platform_sms: true });
                            }
                          }}
                        >
                          {isTrialOrNoPlan && (
                            <div className="absolute -top-2 -right-2">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                {language === "bn" ? "আপগ্রেড প্রয়োজন" : "Upgrade Required"}
                              </Badge>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isTrialOrNoPlan 
                                ? "border-muted-foreground/30" 
                                : shopSettings.use_platform_sms ? "border-green-500" : "border-muted-foreground/50"
                            }`}>
                              {shopSettings.use_platform_sms && !isTrialOrNoPlan && (
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                              )}
                            </div>
                            <span className={`font-medium ${isTrialOrNoPlan ? "text-muted-foreground" : ""}`}>
                              {language === "bn" ? "প্ল্যাটফর্ম SMS" : "Platform SMS"}
                            </span>
                            {!isTrialOrNoPlan && (
                              <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30">
                                {language === "bn" ? "ফ্রি" : "Free"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {language === "bn" 
                              ? "আমাদের প্ল্যাটফর্মের ডিফল্ট SMS সার্ভিস ব্যবহার করুন। কোনো API কী লাগবে না।" 
                              : "Use our platform's default SMS service. No API key needed."}
                          </p>
                          {!isTrialOrNoPlan && canUsePlatformSms && (
                            <div className="mt-2 pt-2 border-t border-dashed">
                              <p className="text-xs font-medium text-green-600">
                                {language === "bn" 
                                  ? `দৈনিক: ${getSmsLimitText(smsLimits.dailyLimit, language)}` 
                                  : `Daily: ${getSmsLimitText(smsLimits.dailyLimit, language)}`}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Own SMS API Option */}
                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            !shopSettings.use_platform_sms 
                              ? "border-primary bg-primary/5" 
                              : "border-muted hover:border-muted-foreground/50"
                          }`}
                          onClick={() => setShopSettings({ ...shopSettings, use_platform_sms: false })}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              !shopSettings.use_platform_sms ? "border-primary" : "border-muted-foreground/50"
                            }`}>
                              {!shopSettings.use_platform_sms && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <span className="font-medium">{language === "bn" ? "নিজস্ব SMS API" : "Own SMS API"}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {language === "bn" 
                              ? "SSL Wireless বা অন্য প্রোভাইডারের নিজস্ব API ব্যবহার করুন।" 
                              : "Use your own SSL Wireless or other provider API."}
                          </p>
                          <div className="mt-2 pt-2 border-t border-dashed">
                            <p className="text-xs text-muted-foreground">
                              {language === "bn" ? "সীমাহীন SMS" : "Unlimited SMS"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Own SMS API Settings - Only show if not using platform SMS */}
                    {!shopSettings.use_platform_sms && (
                      <>
                        <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            {language === "bn" ? "নিজস্ব SMS API সেটআপ" : "Own SMS API Setup"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {language === "bn" 
                              ? "SSL Wireless বা অন্য প্রোভাইডারের ড্যাশবোর্ড থেকে API credentials সংগ্রহ করুন" 
                              : "Get your API credentials from SSL Wireless or your provider's dashboard"}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>{language === "bn" ? "API Key / Token" : "API Key / Token"}</Label>
                          <Input
                            type="password"
                            value={shopSettings.sms_api_key}
                            onChange={(e) => setShopSettings({ ...shopSettings, sms_api_key: e.target.value })}
                            placeholder={language === "bn" ? "আপনার API key লিখুন" : "Enter your API key"}
                          />
                          <p className="text-xs text-muted-foreground">
                            {language === "bn" 
                              ? "আপনার প্রোভাইডারের API key বা token" 
                              : "Your provider's API key or token"}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>{language === "bn" ? "সেন্ডার আইডি" : "Sender ID"}</Label>
                          <Input
                            value={shopSettings.sms_sender_id}
                            onChange={(e) => setShopSettings({ ...shopSettings, sms_sender_id: e.target.value })}
                            placeholder="e.g., MYSHOP"
                          />
                          <p className="text-xs text-muted-foreground">
                            {language === "bn" 
                              ? "প্রোভাইডার থেকে পাওয়া আপনার রেজিস্টার্ড সেন্ডার আইডি" 
                              : "Your registered sender ID from the provider"}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Platform SMS Info */}
                    {shopSettings.use_platform_sms && (
                      <PlatformSmsInfo language={language} />
                    )}

                    <div className="space-y-2">
                      <Label>{language === "bn" ? "বাকি টাকার রিমাইন্ডার SMS টেমপ্লেট" : "Due Reminder SMS Template"}</Label>
                      <Textarea
                        value={shopSettings.due_reminder_sms_template}
                        onChange={(e) => setShopSettings({ ...shopSettings, due_reminder_sms_template: e.target.value })}
                        rows={6}
                        placeholder={language === "bn" ? "আপনার SMS টেমপ্লেট লিখুন..." : "Write your SMS template..."}
                      />
                      <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-2">
                        <p className="font-medium">{language === "bn" ? "ব্যবহারযোগ্য প্লেসহোল্ডার:" : "Available Placeholders:"}</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                          <li><code className="bg-background px-1 rounded">{"{customer_name}"}</code> - {language === "bn" ? "গ্রাহকের নাম" : "Customer name"}</li>
                          <li><code className="bg-background px-1 rounded">{"{shop_name}"}</code> - {language === "bn" ? "দোকানের নাম" : "Your shop name"}</li>
                          <li><code className="bg-background px-1 rounded">{"{due_amount}"}</code> - {language === "bn" ? "মোট বাকি টাকা" : "Total due amount"}</li>
                          <li><code className="bg-background px-1 rounded">{"{total_purchases}"}</code> - {language === "bn" ? "মোট কেনাকাটার সংখ্যা" : "Total number of purchases"}</li>
                          <li><code className="bg-background px-1 rounded">{"{oldest_due_date}"}</code> - {language === "bn" ? "সবচেয়ে পুরানো বাকির তারিখ" : "Oldest due date"}</li>
                          <li><code className="bg-background px-1 rounded">{"{days_overdue}"}</code> - {language === "bn" ? "কত দিন বাকি আছে" : "Days overdue"}</li>
                          <li><code className="bg-background px-1 rounded">{"{product_list}"}</code> - {language === "bn" ? "কি কি কিনেছে (প্রোডাক্ট লিস্ট)" : "Products purchased"}</li>
                          <li><code className="bg-background px-1 rounded">{"{invoice_list}"}</code> - {language === "bn" ? "ইনভয়েস নম্বর সমূহ" : "Invoice numbers"}</li>
                          <li><code className="bg-background px-1 rounded">{"{purchase_details}"}</code> - {language === "bn" ? "সম্পূর্ণ কেনাকাটার বিবরণ (তারিখ, প্রোডাক্ট, টাকা)" : "Full purchase details"}</li>
                          <li><code className="bg-background px-1 rounded">{"{phone}"}</code> - {language === "bn" ? "দোকানের ফোন নম্বর" : "Shop phone number"}</li>
                        </ul>
                        
                        <div className="mt-3 p-2 bg-primary/10 rounded border border-primary/20">
                          <p className="font-medium text-primary mb-1">{language === "bn" ? "উদাহরণ টেমপ্লেট:" : "Example Template:"}</p>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            {language === "bn" 
                              ? "প্রিয় {customer_name}, আপনার কাছে {shop_name} এ মোট {due_amount} টাকা বাকি আছে। আপনি {total_purchases}টি কেনাকাটায় {product_list} কিনেছেন। প্রথম বাকি {oldest_due_date} তারিখে ({days_overdue} দিন আগে)। বিস্তারিত: {purchase_details}। অনুগ্রহ করে যোগাযোগ করুন: {phone}"
                              : "Dear {customer_name}, you have {due_amount} BDT due at {shop_name}. You purchased {product_list} in {total_purchases} orders. First due on {oldest_due_date} ({days_overdue} days ago). Details: {purchase_details}. Contact: {phone}"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        {t("shop.howToUseSms") || "How to Send SMS Reminders"}
                      </p>
                      <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                        <li>{t("shop.smsStep1") || "Go to Due Customers page from Offline Shop"}</li>
                        <li>{t("shop.smsStep2") || "Select one or more customers with outstanding dues"}</li>
                        <li>{t("shop.smsStep3") || "Click 'SMS Reminder' button"}</li>
                        <li>{t("shop.smsStep4") || "Review and send SMS to all selected customers"}</li>
                      </ol>
                    </div>

                    <Button onClick={handleSaveShopSettings} disabled={isSavingShop} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      {isSavingShop ? t("shop.saving") : t("common.save")}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync Tab */}
          <TabsContent value="sync" className="space-y-4">
            {/* Main Sync Toggle */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {localSyncEnabled ? (
                        <Link2 className="w-5 h-5 text-success" />
                      ) : (
                        <Unlink className="w-5 h-5 text-muted-foreground" />
                      )}
                      {t("sync.syncOnlineOffline")}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {t("sync.enableUnifiedSync")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={localSyncEnabled ? "default" : "secondary"}
                      className={localSyncEnabled ? "bg-success" : ""}
                    >
                      {localSyncEnabled ? t("sync.enabled") : t("sync.disabled")}
                    </Badge>
                    <Switch
                      checked={localSyncEnabled}
                      onCheckedChange={handleToggleSync}
                      disabled={isSaving || isLoading || isSyncing}
                    />
                  </div>
                  {isSyncing && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      {language === "bn" ? "পণ্য সিংক হচ্ছে..." : "Syncing products..."}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <motion.div
                  initial={false}
                  animate={{ height: localSyncEnabled ? "auto" : 0, opacity: localSyncEnabled ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <Alert className="bg-success/10 border-success/20">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <AlertTitle>{t("sync.syncActive")}</AlertTitle>
                    <AlertDescription>
                      {t("sync.syncActiveDesc")}
                    </AlertDescription>
                  </Alert>

                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Store className="w-6 h-6 text-emerald-600" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{t("sync.offlineMaster")}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("sync.offlineMasterDesc")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-primary" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{t("sync.onlineToReports")}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("sync.onlineToReportsDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {!localSyncEnabled && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>{t("sync.whyEnable")}</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        <li>{t("sync.benefit1")}</li>
                        <li>{t("sync.benefit2")}</li>
                        <li>{t("sync.benefit3")}</li>
                        <li>{t("sync.benefit4")}</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>


            {/* Product Mapping Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t("sync.productLinking")}
                </CardTitle>
                <CardDescription>
                  {t("sync.productLinkingDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>{t("sync.howToLink")}</AlertTitle>
                  <AlertDescription>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                      <li>{t("sync.linkStep1")}</li>
                      <li>{t("sync.linkStep2")}</li>
                      <li>{t("sync.linkStep3")}</li>
                      <li>{t("sync.linkStep4")}</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <Link to="/offline-shop/products">
                      <Package className="w-4 h-4 mr-2" />
                      {t("sync.goToProducts")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SyncSettings;
