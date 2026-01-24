import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Save, 
  MessageSquare, 
  Inbox, 
  ShoppingCart, 
  Heart, 
  ImageIcon,
  Bot,
  Building2,
  Languages,
  Sparkles,
  DollarSign,
  Percent,
  Brain,
  HelpCircle,
  Camera,
  CheckCircle2,
  CreditCard,
  Banknote,
  AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import FacebookPostsManager from "@/components/automations/FacebookPostsManager";
import { useAuth } from "@/contexts/AuthContext";

interface AutomationSettings {
  autoCommentReply: boolean;
  autoInboxReply: boolean;
  orderTaking: boolean;
  reactionOnComments: boolean;
  aiMediaUnderstanding: boolean;
}

interface BusinessInfo {
  businessDescription: string;
  servicesOffered: string;
  preferredLanguage: "bangla" | "english" | "mixed";
  tone: "friendly" | "professional";
}

interface SellingRules {
  usePriceFromProduct: boolean;
  allowDiscount: boolean;
  maxDiscountPercent: number;
  allowLowProfitSale: boolean;
}

interface AIBehaviorRules {
  neverHallucinate: boolean;
  askClarificationIfUnsure: boolean;
  askForClearerPhotoIfNeeded: boolean;
  confirmBeforeOrder: boolean;
}

interface PaymentRules {
  codAvailable: boolean;
  advanceRequiredAbove: number;
  advancePercentage: number;
}

const FacebookPageSettings = () => {
  const { pageId, accountId } = useParams<{ pageId: string; accountId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageName, setPageName] = useState("");
  
  // Automation toggles
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    autoCommentReply: false,
    autoInboxReply: false,
    orderTaking: false,
    reactionOnComments: false,
    aiMediaUnderstanding: false,
  });
  
  // Business info
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessDescription: "",
    servicesOffered: "",
    preferredLanguage: "mixed",
    tone: "friendly",
  });

  // Selling rules
  const [sellingRules, setSellingRules] = useState<SellingRules>({
    usePriceFromProduct: true,
    allowDiscount: false,
    maxDiscountPercent: 10,
    allowLowProfitSale: false,
  });

  // AI behavior rules
  const [aiBehaviorRules, setAiBehaviorRules] = useState<AIBehaviorRules>({
    neverHallucinate: true,
    askClarificationIfUnsure: true,
    askForClearerPhotoIfNeeded: true,
    confirmBeforeOrder: true,
  });

  // Payment rules
  const [paymentRules, setPaymentRules] = useState<PaymentRules>({
    codAvailable: true,
    advanceRequiredAbove: 5000,
    advancePercentage: 50,
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!pageId) return;
      
      setIsLoading(true);
      try {
        console.log("[FacebookPageSettings] Loading settings via edge function...");
        
        // Use fetch with query params for GET request
        const token = localStorage.getItem("autofloy_token");
        const response = await fetch(
          `https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/page-memory?page_id=${pageId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log("[FacebookPageSettings] Raw response:", data);
        
        // Find the memory for this page
        const memories = data?.memories || [];
        const memory = Array.isArray(memories) 
          ? memories.find((m: { page_id: string }) => m.page_id === pageId)
          : memories;
        
        if (memory) {
          console.log("[FacebookPageSettings] Loaded memory:", memory);
          setPageName(memory.page_name || "Facebook Page");
          
          // Load automation settings
          const savedSettings = memory.automation_settings as Record<string, boolean> || {};
          setAutomationSettings({
            autoCommentReply: savedSettings.autoCommentReply ?? savedSettings.comment_ai_reply ?? false,
            autoInboxReply: savedSettings.autoInboxReply ?? savedSettings.messenger_auto_reply ?? false,
            orderTaking: savedSettings.orderTaking ?? savedSettings.order_taking ?? false,
            reactionOnComments: savedSettings.reactionOnComments ?? savedSettings.auto_react ?? false,
            aiMediaUnderstanding: savedSettings.aiMediaUnderstanding ?? savedSettings.ai_image_analysis ?? false,
          });
          
          // Load business info
          setBusinessInfo({
            businessDescription: memory.business_description || "",
            servicesOffered: memory.products_summary || "",
            preferredLanguage: (memory.detected_language as "bangla" | "english" | "mixed") || "mixed",
            tone: (memory.preferred_tone as "friendly" | "professional") || "friendly",
          });

          // Load selling rules
          if (memory.selling_rules) {
            setSellingRules({
              usePriceFromProduct: memory.selling_rules.usePriceFromProduct ?? true,
              allowDiscount: memory.selling_rules.allowDiscount ?? false,
              maxDiscountPercent: memory.selling_rules.maxDiscountPercent ?? 10,
              allowLowProfitSale: memory.selling_rules.allowLowProfitSale ?? false,
            });
          }

          // Load AI behavior rules
          if (memory.ai_behavior_rules) {
            setAiBehaviorRules({
              neverHallucinate: memory.ai_behavior_rules.neverHallucinate ?? true,
              askClarificationIfUnsure: memory.ai_behavior_rules.askClarificationIfUnsure ?? true,
              askForClearerPhotoIfNeeded: memory.ai_behavior_rules.askForClearerPhotoIfNeeded ?? true,
              confirmBeforeOrder: memory.ai_behavior_rules.confirmBeforeOrder ?? true,
            });
          }

          // Load payment rules
          if (memory.payment_rules) {
            setPaymentRules({
              codAvailable: memory.payment_rules.codAvailable ?? true,
              advanceRequiredAbove: memory.payment_rules.advanceRequiredAbove ?? 5000,
              advancePercentage: memory.payment_rules.advancePercentage ?? 50,
            });
          }
        } else {
          console.log("[FacebookPageSettings] No memory found for page:", pageId);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast({
          title: "Error",
          description: "Failed to load page settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [pageId, toast]);

  const handleToggle = (key: keyof AutomationSettings) => {
    setAutomationSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    if (!pageId || !accountId) {
      toast({
        title: "Error",
        description: "Missing page or account information",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      console.log("[FacebookPageSettings] Saving via edge function...");
      
      const payload = {
        account_id: accountId,
        page_id: pageId,
        page_name: pageName,
        business_description: businessInfo.businessDescription,
        products_summary: businessInfo.servicesOffered,
        detected_language: businessInfo.preferredLanguage,
        preferred_tone: businessInfo.tone,
        automation_settings: automationSettings,
        selling_rules: sellingRules,
        ai_behavior_rules: aiBehaviorRules,
        payment_rules: paymentRules,
      };
      
      // Use supabase.functions.invoke which handles auth automatically
      const { data, error } = await supabase.functions.invoke("page-memory", {
        method: "POST",
        body: payload,
      });
      
      if (error) {
        console.error("[FacebookPageSettings] Edge function error:", error);
        throw new Error(error.message || "Failed to save");
      }
      
      console.log("[FacebookPageSettings] Saved successfully:", data);
      toast({
        title: "Settings Saved",
        description: "Your automation settings have been saved successfully.",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const automationOptions = [
    {
      key: "autoCommentReply" as keyof AutomationSettings,
      label: "Auto Comment Reply",
      description: "AI will automatically reply to comments on your posts",
      icon: MessageSquare,
      color: "text-blue-500",
    },
    {
      key: "autoInboxReply" as keyof AutomationSettings,
      label: "Auto Inbox Reply",
      description: "AI will automatically respond to Messenger inbox messages",
      icon: Inbox,
      color: "text-green-500",
    },
    {
      key: "orderTaking" as keyof AutomationSettings,
      label: "Order Taking",
      description: "AI can take orders from customers via Messenger",
      icon: ShoppingCart,
      color: "text-orange-500",
    },
    {
      key: "reactionOnComments" as keyof AutomationSettings,
      label: "Reaction on Comments",
      description: "Automatically react (Like/Love) to comments on your posts",
      icon: Heart,
      color: "text-pink-500",
    },
    {
      key: "aiMediaUnderstanding" as keyof AutomationSettings,
      label: "AI Media Understanding",
      description: "AI can understand and respond to images and voice messages",
      icon: ImageIcon,
      color: "text-purple-500",
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container max-w-4xl py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-6 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/connect-facebook")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Automation Settings
            </h1>
            <p className="text-muted-foreground">
              Configure AI automation for <span className="font-medium text-foreground">{pageName}</span>
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </motion.div>

        {/* Automation Toggles */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Automation Features
              </CardTitle>
              <CardDescription>
                Enable or disable AI automation features for this page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {automationOptions.map((option, index) => (
                <div key={option.key}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${option.color}`}>
                        <option.icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <Label htmlFor={option.key} className="text-base font-medium cursor-pointer">
                          {option.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={option.key}
                      checked={automationSettings[option.key]}
                      onCheckedChange={() => handleToggle(option.key)}
                    />
                  </div>
                  {index < automationOptions.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Business Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Business Information
              </CardTitle>
              <CardDescription>
                Help AI understand your business better for accurate responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Description */}
              <div className="space-y-2">
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  placeholder="Describe your business, what you sell, and your unique selling points..."
                  value={businessInfo.businessDescription}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessDescription: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Services Offered */}
              <div className="space-y-2">
                <Label htmlFor="servicesOffered">Services / Products Offered</Label>
                <Textarea
                  id="servicesOffered"
                  placeholder="List your main products or services, pricing info, etc..."
                  value={businessInfo.servicesOffered}
                  onChange={(e) => setBusinessInfo(prev => ({ ...prev, servicesOffered: e.target.value }))}
                  rows={3}
                />
              </div>

              <Separator />

              {/* Language & Tone Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preferred Language */}
                <div className="space-y-2">
                  <Label htmlFor="preferredLanguage" className="flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Preferred Language
                  </Label>
                  <Select
                    value={businessInfo.preferredLanguage}
                    onValueChange={(value: "bangla" | "english" | "mixed") => 
                      setBusinessInfo(prev => ({ ...prev, preferredLanguage: value }))
                    }
                  >
                    <SelectTrigger id="preferredLanguage">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bangla">বাংলা (Bangla)</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="mixed">Mixed (Banglish)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label htmlFor="tone" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Response Tone
                  </Label>
                  <Select
                    value={businessInfo.tone}
                    onValueChange={(value: "friendly" | "professional") => 
                      setBusinessInfo(prev => ({ ...prev, tone: value }))
                    }
                  >
                    <SelectTrigger id="tone">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">😊 Friendly</SelectItem>
                      <SelectItem value="professional">💼 Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Behavior Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Behavior Configuration
              </CardTitle>
              <CardDescription>
                Configure how AI should behave as a trained sales agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selling Rules */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Selling Rules
                </h4>
                <div className="grid gap-4 pl-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Use Price from Product Catalog</Label>
                      <p className="text-xs text-muted-foreground">AI will always quote prices from your product list</p>
                    </div>
                    <Switch
                      checked={sellingRules.usePriceFromProduct}
                      onCheckedChange={(checked) => setSellingRules(prev => ({ ...prev, usePriceFromProduct: checked }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Allow Discount</Label>
                      <p className="text-xs text-muted-foreground">AI can offer discounts to customers</p>
                    </div>
                    <Switch
                      checked={sellingRules.allowDiscount}
                      onCheckedChange={(checked) => setSellingRules(prev => ({ ...prev, allowDiscount: checked }))}
                    />
                  </div>

                  {sellingRules.allowDiscount && (
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <Percent className="h-3 w-3" />
                        Maximum Discount Percentage
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={sellingRules.maxDiscountPercent}
                          onChange={(e) => setSellingRules(prev => ({ ...prev, maxDiscountPercent: parseInt(e.target.value) || 0 }))}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Allow Low Profit Sale</Label>
                      <p className="text-xs text-muted-foreground">AI can agree to small profit if customer insists</p>
                    </div>
                    <Switch
                      checked={sellingRules.allowLowProfitSale}
                      onCheckedChange={(checked) => setSellingRules(prev => ({ ...prev, allowLowProfitSale: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* AI Behavior Rules */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  AI Safety Rules
                </h4>
                <div className="grid gap-4 pl-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Never Hallucinate Information</Label>
                      <p className="text-xs text-muted-foreground">AI will never make up product details or prices</p>
                    </div>
                    <Switch
                      checked={aiBehaviorRules.neverHallucinate}
                      onCheckedChange={(checked) => setAiBehaviorRules(prev => ({ ...prev, neverHallucinate: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" />
                        Ask Clarification if Unsure
                      </Label>
                      <p className="text-xs text-muted-foreground">AI will ask customer for clarification when needed</p>
                    </div>
                    <Switch
                      checked={aiBehaviorRules.askClarificationIfUnsure}
                      onCheckedChange={(checked) => setAiBehaviorRules(prev => ({ ...prev, askClarificationIfUnsure: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        Ask for Clearer Photo/Details
                      </Label>
                      <p className="text-xs text-muted-foreground">AI will request clearer product images if needed</p>
                    </div>
                    <Switch
                      checked={aiBehaviorRules.askForClearerPhotoIfNeeded}
                      onCheckedChange={(checked) => setAiBehaviorRules(prev => ({ ...prev, askForClearerPhotoIfNeeded: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Always Confirm Before Order
                      </Label>
                      <p className="text-xs text-muted-foreground">AI will confirm all details before placing an order</p>
                    </div>
                    <Switch
                      checked={aiBehaviorRules.confirmBeforeOrder}
                      onCheckedChange={(checked) => setAiBehaviorRules(prev => ({ ...prev, confirmBeforeOrder: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Payment Rules */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  Payment Rules
                </h4>
                <div className="grid gap-4 pl-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm flex items-center gap-1">
                        <Banknote className="h-3 w-3" />
                        Cash on Delivery (COD) Available
                      </Label>
                      <p className="text-xs text-muted-foreground">AI can offer COD as a payment option</p>
                    </div>
                    <Switch
                      checked={paymentRules.codAvailable}
                      onCheckedChange={(checked) => setPaymentRules(prev => ({ ...prev, codAvailable: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Advance Payment Required Above</Label>
                      <p className="text-xs text-muted-foreground">Orders above this amount require advance payment</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">৳</span>
                      <Input
                        type="number"
                        min={0}
                        value={paymentRules.advanceRequiredAbove}
                        onChange={(e) => setPaymentRules(prev => ({ ...prev, advanceRequiredAbove: parseInt(e.target.value) || 0 }))}
                        className="w-32"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Advance Percentage</Label>
                      <p className="text-xs text-muted-foreground">Percentage of order amount required as advance</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={paymentRules.advancePercentage}
                        onChange={(e) => setPaymentRules(prev => ({ ...prev, advancePercentage: parseInt(e.target.value) || 0 }))}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Post-Product Mapping */}
        {user?.id && pageId && accountId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <FacebookPostsManager 
              pageId={pageId} 
              accountId={accountId} 
              userId={user.id} 
            />
          </motion.div>
        )}

        {/* Save Button (Mobile) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="md:hidden"
        >
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default FacebookPageSettings;
