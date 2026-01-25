import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  CheckCircle, 
  MessageSquare,
  Mail,
  ShoppingCart,
  Heart,
  Image,
  Sparkles,
  Building2,
  Languages,
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
import { Textarea } from "@/components/ui/textarea";
import RecentActivityLog from "./RecentActivityLog";
import { useToast } from "@/hooks/use-toast";
import { fetchPageMemory, savePageMemory, PageMemory } from "@/services/apiService";

interface FacebookAutomationSectionProps {
  pageId: string;
  pageName: string;
  accountId: string;
  onBack: () => void;
}

interface AutomationFeatures {
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

const FacebookAutomationSection = ({
  pageId,
  pageName,
  accountId,
  onBack,
}: FacebookAutomationSectionProps) => {
  const { toast } = useToast();
  const [pageMemory, setPageMemory] = useState<PageMemory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Automation features
  const [automationFeatures, setAutomationFeatures] = useState<AutomationFeatures>({
    autoCommentReply: false,
    autoInboxReply: false,
    orderTaking: false,
    reactionOnComments: false,
    aiMediaUnderstanding: false,
  });

  // Business Information
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

  // Load page memory from backend
  useEffect(() => {
    const loadPageMemory = async () => {
      setIsLoading(true);
      try {
        const memory = await fetchPageMemory(pageId) as PageMemory | null;
        if (memory) {
          setPageMemory(memory);
          
          // Load automation features
          if (memory.automation_settings) {
            setAutomationFeatures({
              autoCommentReply: memory.automation_settings.autoCommentReply ?? false,
              autoInboxReply: memory.automation_settings.autoInboxReply ?? false,
              orderTaking: memory.automation_settings.orderTaking ?? false,
              reactionOnComments: memory.automation_settings.reactionOnComments ?? false,
              aiMediaUnderstanding: memory.automation_settings.aiMediaUnderstanding ?? false,
            });
          }

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
        }
      } catch (error) {
        console.error("Failed to load page memory:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPageMemory();
  }, [pageId]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const memory = await savePageMemory({
        account_id: accountId,
        page_id: pageId,
        page_name: pageName,
        business_description: businessInfo.businessDescription,
        products_summary: businessInfo.servicesOffered,
        detected_language: businessInfo.preferredLanguage,
        preferred_tone: businessInfo.tone,
        automation_settings: automationFeatures as unknown as Record<string, boolean>,
        selling_rules: sellingRules,
        ai_behavior_rules: aiBehaviorRules,
        payment_rules: paymentRules,
      });

      if (memory) {
        setPageMemory(memory);
        toast({
          title: "Settings Saved",
          description: "Your automation settings have been updated successfully.",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeatureToggle = (feature: keyof AutomationFeatures) => {
    setAutomationFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  const enabledCount = Object.values(automationFeatures).filter(v => v).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Automation Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure AI automation for <span className="text-primary font-medium">{pageName}</span>
          </p>
        </div>
        
        <Button
          size="sm"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </motion.div>

      {/* Automation Features Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Automation Features
            </CardTitle>
            <CardDescription>
              Enable or disable AI automation features for this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto Comment Reply */}
            <div className="flex items-center justify-between py-3 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Auto Comment Reply</Label>
                  <p className="text-xs text-muted-foreground">AI will automatically reply to comments on your posts</p>
                </div>
              </div>
              <Switch
                checked={automationFeatures.autoCommentReply}
                onCheckedChange={() => handleFeatureToggle('autoCommentReply')}
              />
            </div>

            {/* Auto Inbox Reply */}
            <div className="flex items-center justify-between py-3 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Auto Inbox Reply</Label>
                  <p className="text-xs text-muted-foreground">AI will automatically respond to Messenger inbox messages</p>
                </div>
              </div>
              <Switch
                checked={automationFeatures.autoInboxReply}
                onCheckedChange={() => handleFeatureToggle('autoInboxReply')}
              />
            </div>

            {/* Order Taking */}
            <div className="flex items-center justify-between py-3 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <ShoppingCart className="h-4 w-4 text-success" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Order Taking</Label>
                  <p className="text-xs text-muted-foreground">AI can take orders from customers via Messenger</p>
                </div>
              </div>
              <Switch
                checked={automationFeatures.orderTaking}
                onCheckedChange={() => handleFeatureToggle('orderTaking')}
              />
            </div>

            {/* Reaction on Comments */}
            <div className="flex items-center justify-between py-3 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Heart className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Reaction on Comments</Label>
                  <p className="text-xs text-muted-foreground">Automatically react (Like/Love) to comments on your posts</p>
                </div>
              </div>
              <Switch
                checked={automationFeatures.reactionOnComments}
                onCheckedChange={() => handleFeatureToggle('reactionOnComments')}
              />
            </div>

            {/* AI Media Understanding */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/50">
                  <Image className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <Label className="text-sm font-medium">AI Media Understanding</Label>
                  <p className="text-xs text-muted-foreground">AI can understand and respond to images and voice messages</p>
                </div>
              </div>
              <Switch
                checked={automationFeatures.aiMediaUnderstanding}
                onCheckedChange={() => handleFeatureToggle('aiMediaUnderstanding')}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Business Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
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
              <Label className="text-sm font-medium">Business Description</Label>
              <Textarea
                placeholder="Describe your business, what you sell, and your unique selling points..."
                value={businessInfo.businessDescription}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessDescription: e.target.value }))}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Services/Products Offered */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Services / Products Offered</Label>
              <Textarea
                placeholder="List your main products or services, pricing info, etc..."
                value={businessInfo.servicesOffered}
                onChange={(e) => setBusinessInfo(prev => ({ ...prev, servicesOffered: e.target.value }))}
                className="min-h-[80px] resize-none"
              />
            </div>

            <Separator />

            {/* Language & Tone Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Preferred Language */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  Preferred Language
                </Label>
                <Select
                  value={businessInfo.preferredLanguage}
                  onValueChange={(value: "bangla" | "english" | "mixed") => 
                    setBusinessInfo(prev => ({ ...prev, preferredLanguage: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bangla">বাংলা (Bangla)</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="mixed">Mixed (Banglish)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Response Tone */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Response Tone
                </Label>
                <Select
                  value={businessInfo.tone}
                  onValueChange={(value: "friendly" | "professional") => 
                    setBusinessInfo(prev => ({ ...prev, tone: value }))
                  }
                >
                  <SelectTrigger>
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
        transition={{ delay: 0.15 }}
      >
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
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
                <DollarSign className="h-4 w-4 text-success" />
                Selling Rules
              </h4>
              <div className="grid gap-4 pl-4">
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
                  <div className="space-y-2 pl-4">
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

            <Separator className="my-4" />

            {/* AI Safety Rules */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning" />
                AI Safety Rules
              </h4>
              <div className="grid gap-4 pl-4">
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

            <Separator className="my-4" />

            {/* Payment Rules */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Rules
              </h4>
              <div className="grid gap-4 pl-4">
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

      {/* Webhook Status Badge */}
      {pageMemory?.webhook_subscribed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Badge variant="outline" className="gap-1 text-success border-success/30">
            <CheckCircle className="h-3 w-3" />
            Webhook Active - AI is listening
          </Badge>
        </motion.div>
      )}

      {/* Recent Activity Log */}
      <RecentActivityLog
        pageId={pageId}
        maxItems={10}
      />
    </div>
  );
};

export default FacebookAutomationSection;
