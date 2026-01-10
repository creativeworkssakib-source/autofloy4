import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Globe, 
  Palette, 
  Save, 
  Loader2, 
  CheckCircle,
  Zap,
  Clock,
  MessageCircle,
  FileText,
  Brain,
  Sparkles,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AutomationActivityMonitor from "./AutomationActivityMonitor";
import { sendToWebhook, isWebhookActive } from "@/services/webhookService";

// Platform-specific automation options
const platformAutomationOptions: Record<string, { id: string; name: string; description: string; category: string }[]> = {
  facebook: [
    { id: "inbox_auto_reply", name: "AI Inbox Auto Reply", description: "Auto-reply to Facebook Messenger messages", category: "reply" },
    { id: "comment_auto_reply", name: "AI Comment Auto Reply", description: "Reply to post comments automatically", category: "reply" },
    { id: "faq_auto_answer", name: "AI FAQ Auto Answer", description: "Detect and answer common questions", category: "reply" },
    { id: "sales_assistant", name: "AI Sales Assistant", description: "Handle price & order inquiries", category: "reply" },
    { id: "support_assistant", name: "AI Support Assistant", description: "Handle complaints professionally", category: "reply" },
    { id: "spam_filter", name: "AI Spam Filter", description: "Filter spam and abusive content", category: "moderation" },
    { id: "auto_delete_spam", name: "Auto Delete Spam", description: "Automatically delete spam comments", category: "moderation" },
    { id: "language_detection", name: "Language Detection", description: "Detect and respond in user's language", category: "intelligence" },
    { id: "business_memory", name: "Business Memory", description: "Remember conversations for context", category: "intelligence" },
  ],
  instagram: [
    { id: "dm_auto_reply", name: "AI DM Auto Reply", description: "Auto-reply to Instagram Direct Messages", category: "reply" },
    { id: "story_mention_reply", name: "Story Mention Reply", description: "Reply when mentioned in stories", category: "reply" },
    { id: "comment_auto_reply", name: "Comment Auto Reply", description: "Reply to post comments", category: "reply" },
    { id: "reel_comment_reply", name: "Reel Comment Reply", description: "Reply to reel comments", category: "reply" },
    { id: "spam_filter", name: "Spam Filter", description: "Filter spam and abusive DMs", category: "moderation" },
    { id: "keyword_trigger", name: "Keyword Triggers", description: "Trigger replies based on keywords", category: "intelligence" },
  ],
  whatsapp: [
    { id: "message_auto_reply", name: "AI Message Auto Reply", description: "Auto-reply to WhatsApp messages", category: "reply" },
    { id: "broadcast_messages", name: "Broadcast Messages", description: "Send broadcast messages to contacts", category: "marketing" },
    { id: "order_notifications", name: "Order Notifications", description: "Send order status updates", category: "notifications" },
    { id: "appointment_reminders", name: "Appointment Reminders", description: "Send appointment reminders", category: "notifications" },
    { id: "catalog_integration", name: "Catalog Integration", description: "Share product catalog", category: "sales" },
    { id: "quick_replies", name: "Quick Replies", description: "Pre-configured quick response buttons", category: "reply" },
  ],
  youtube: [
    { id: "comment_auto_reply", name: "Comment Auto Reply", description: "Reply to video comments", category: "reply" },
    { id: "spam_moderation", name: "Spam Moderation", description: "Hide spam comments automatically", category: "moderation" },
    { id: "subscriber_thank", name: "Subscriber Thank You", description: "Thank new subscribers", category: "engagement" },
    { id: "keyword_alerts", name: "Keyword Alerts", description: "Get alerts for specific keywords", category: "intelligence" },
  ],
  email: [
    { id: "auto_responder", name: "Auto Responder", description: "Automatic email responses", category: "reply" },
    { id: "order_confirmations", name: "Order Confirmations", description: "Send order confirmation emails", category: "notifications" },
    { id: "shipping_updates", name: "Shipping Updates", description: "Send shipping status emails", category: "notifications" },
    { id: "abandoned_cart", name: "Abandoned Cart Emails", description: "Recover abandoned carts", category: "marketing" },
    { id: "newsletter", name: "Newsletter Automation", description: "Automated newsletter campaigns", category: "marketing" },
    { id: "follow_up", name: "Follow-up Emails", description: "Automated follow-up sequences", category: "marketing" },
  ],
  ecommerce: [
    { id: "order_sync", name: "Order Sync", description: "Sync orders across platforms", category: "sync" },
    { id: "inventory_sync", name: "Inventory Sync", description: "Real-time inventory updates", category: "sync" },
    { id: "product_sync", name: "Product Sync", description: "Sync product listings", category: "sync" },
    { id: "price_sync", name: "Price Sync", description: "Sync prices across channels", category: "sync" },
    { id: "low_stock_alerts", name: "Low Stock Alerts", description: "Get alerts for low stock", category: "notifications" },
    { id: "order_notifications", name: "Order Notifications", description: "Notify on new orders", category: "notifications" },
  ],
};

interface PlatformAutomationSectionProps {
  platformId: string;
  platformName: string;
  accountId?: string;
  accountName?: string;
  onBack: () => void;
}

const PlatformAutomationSection = ({
  platformId,
  platformName,
  accountId,
  accountName,
  onBack,
}: PlatformAutomationSectionProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [webhookActive, setWebhookActive] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  
  // AI Preferences
  const [preferredTone, setPreferredTone] = useState("friendly");
  const [responseLanguage, setResponseLanguage] = useState("auto");
  const [businessDescription, setBusinessDescription] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  const automationOptions = platformAutomationOptions[platformId] || [];

  // Check webhook status and load saved settings
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const active = await isWebhookActive(platformId);
        setWebhookActive(active);
        
        // Load saved settings from localStorage
        const saved = localStorage.getItem(`automation_settings_${platformId}_${accountId || 'default'}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings(parsed.toggles || {});
          setPreferredTone(parsed.preferredTone || "friendly");
          setResponseLanguage(parsed.responseLanguage || "auto");
          setBusinessDescription(parsed.businessDescription || "");
          setCustomInstructions(parsed.customInstructions || "");
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [platformId, accountId]);

  const handleToggle = async (optionId: string, enabled: boolean) => {
    const newSettings = { ...settings, [optionId]: enabled };
    setSettings(newSettings);
    
    // Save to localStorage
    const savedData = {
      toggles: newSettings,
      preferredTone,
      responseLanguage,
      businessDescription,
      customInstructions,
    };
    localStorage.setItem(`automation_settings_${platformId}_${accountId || 'default'}`, JSON.stringify(savedData));

    // Send to webhook if active
    if (webhookActive) {
      try {
        await sendToWebhook(platformId, {
          event_type: "automation_toggle",
          platform: platformId,
          account_id: accountId,
          setting_id: optionId,
          enabled,
          all_settings: newSettings,
        });
      } catch (error) {
        console.error("Failed to sync settings:", error);
      }
    }

    toast({
      title: enabled ? "Automation Enabled" : "Automation Disabled",
      description: `${automationOptions.find(o => o.id === optionId)?.name} has been ${enabled ? "activated" : "paused"}.`,
    });
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      const savedData = {
        toggles: settings,
        preferredTone,
        responseLanguage,
        businessDescription,
        customInstructions,
      };
      localStorage.setItem(`automation_settings_${platformId}_${accountId || 'default'}`, JSON.stringify(savedData));

      // Sync to webhook
      if (webhookActive) {
        await sendToWebhook(platformId, {
          event_type: "preferences_updated",
          platform: platformId,
          account_id: accountId,
          preferences: {
            preferredTone,
            responseLanguage,
            businessDescription,
            customInstructions,
          },
          all_settings: settings,
        });
      }

      toast({
        title: "Settings Saved",
        description: "Your AI preferences have been updated.",
      });
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

  const enabledCount = Object.values(settings).filter(Boolean).length;

  // Group options by category
  const groupedOptions = automationOptions.reduce((acc, opt) => {
    if (!acc[opt.category]) acc[opt.category] = [];
    acc[opt.category].push(opt);
    return acc;
  }, {} as Record<string, typeof automationOptions>);

  const categoryLabels: Record<string, string> = {
    reply: "Auto Reply",
    moderation: "Moderation",
    intelligence: "AI Intelligence",
    marketing: "Marketing",
    notifications: "Notifications",
    sales: "Sales",
    sync: "Sync & Integration",
    engagement: "Engagement",
  };

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Platforms
        </Button>
        
        {webhookActive && (
          <Badge variant="outline" className="gap-1 text-success border-success/30">
            <CheckCircle className="h-3 w-3" />
            Active
          </Badge>
        )}
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{platformName} Automation</CardTitle>
              </div>
              <Badge className={enabledCount > 0 ? "bg-success text-success-foreground" : ""}>
                {enabledCount > 0 ? "Active" : "Paused"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-success/10">
                    <Zap className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-xs text-muted-foreground">AI Engine</span>
                </div>
                <p className="font-semibold text-sm text-success">Ready</p>
              </div>
              
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Status</span>
                </div>
                <p className="font-semibold text-sm">{webhookActive ? "Connected" : "Pending"}</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-accent/10">
                    <MessageCircle className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
                <p className="font-semibold text-sm">0 replies</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-secondary/10">
                    <Brain className="h-4 w-4 text-secondary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <p className="font-semibold text-sm">{enabledCount} / {automationOptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                AI Preferences
              </CardTitle>
              <Button size="sm" onClick={handleSavePreferences} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4" />Save</>
                )}
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  Response Tone
                </label>
                <Select value={preferredTone} onValueChange={setPreferredTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly & Warm</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual & Fun</SelectItem>
                    <SelectItem value="formal">Formal & Respectful</SelectItem>
                    <SelectItem value="sales">Sales-Focused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Response Language
                </label>
                <Select value={responseLanguage} onValueChange={setResponseLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-Detect</SelectItem>
                    <SelectItem value="bengali">বাংলা (Bengali)</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="mixed">Mixed (Bengali + English)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Business Description</label>
              <Textarea
                placeholder="Describe your business... (helps AI understand context)"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Instructions (Optional)</label>
              <Textarea
                placeholder="Any special instructions for AI responses..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Automation Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Automation Controls</CardTitle>
                  <p className="text-sm text-muted-foreground">Toggle AI-powered features</p>
                </div>
              </div>
              <Badge variant={enabledCount > 0 ? "default" : "secondary"} className={enabledCount > 0 ? "bg-success text-success-foreground" : ""}>
                {enabledCount} / {automationOptions.length} Active
              </Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-6">
            {Object.entries(groupedOptions).map(([category, options]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground px-1">
                  {categoryLabels[category] || category}
                </h4>
                {options.map((option, index) => (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                      settings[option.id]
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/50 bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{option.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-medium ${settings[option.id] ? "text-success" : "text-muted-foreground"}`}>
                        {settings[option.id] ? "ON" : "OFF"}
                      </span>
                      <Switch
                        checked={settings[option.id] || false}
                        onCheckedChange={(checked) => handleToggle(option.id, checked)}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Monitor */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AutomationActivityMonitor 
          platformFilter={platformId as "whatsapp" | "instagram" | "facebook" | "all"} 
          maxItems={25}
        />
      </motion.div>
    </div>
  );
};

export default PlatformAutomationSection;
