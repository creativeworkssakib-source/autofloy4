import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  MessageSquare,
  HelpCircle,
  ShoppingCart,
  HeadphonesIcon,
  Languages,
  ShieldAlert,
  Brain,
  Sparkles,
  Trash2,
  Ban,
  Package,
  Bot,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendToWebhook, isWebhookActive } from "@/services/webhookService";

interface AIAutomationOption {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  iconColor: string;
  iconBg: string;
  category: "reply" | "moderation" | "intelligence";
}

interface FacebookAIAutomationProps {
  pageId: string;
  pageName: string;
  onSettingsChange?: (settings: Record<string, boolean>) => void;
}

// Webhook ID from database - this matches the webhook_configs table
const FACEBOOK_WEBHOOK_ID = "facebook";

const defaultOptions: Omit<AIAutomationOption, "enabled">[] = [
  // Reply Automations
  {
    id: "inbox_auto_reply",
    name: "AI Inbox Auto Reply",
    description: "Automatically reply to Facebook inbox messages with human-like responses",
    icon: MessageCircle,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    category: "reply",
  },
  {
    id: "comment_auto_reply",
    name: "AI Comment Auto Reply",
    description: "Reply to post comments with context-aware and spam-safe responses",
    icon: MessageSquare,
    iconColor: "text-secondary",
    iconBg: "bg-secondary/10",
    category: "reply",
  },
  {
    id: "faq_auto_answer",
    name: "AI FAQ Auto Answer",
    description: "Detect common questions and instantly answer FAQs",
    icon: HelpCircle,
    iconColor: "text-accent",
    iconBg: "bg-accent/10",
    category: "reply",
  },
  {
    id: "sales_assistant",
    name: "AI Sales Assistant",
    description: "Handle price & order inquiries with a sales-friendly tone",
    icon: ShoppingCart,
    iconColor: "text-success",
    iconBg: "bg-success/10",
    category: "reply",
  },
  {
    id: "support_assistant",
    name: "AI Support Assistant",
    description: "Handle complaints & support questions professionally",
    icon: HeadphonesIcon,
    iconColor: "text-warning",
    iconBg: "bg-warning/10",
    category: "reply",
  },
  {
    id: "product_inventory_reply",
    name: "Product & Inventory Replies",
    description: "AI responds based on your product catalog and stock availability",
    icon: Package,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    category: "reply",
  },
  // Moderation Automations
  {
    id: "spam_filter",
    name: "AI Spam & Abuse Filter",
    description: "Detect and filter spam, scams, and abusive content",
    icon: ShieldAlert,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    category: "moderation",
  },
  {
    id: "comment_deletion",
    name: "Auto Delete Spam Comments",
    description: "Automatically delete detected spam and abusive comments",
    icon: Trash2,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    category: "moderation",
  },
  {
    id: "user_blocking",
    name: "Auto Block Abusive Users",
    description: "Block users who repeatedly post spam or abusive content",
    icon: Ban,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
    category: "moderation",
  },
  // Intelligence Features
  {
    id: "language_tone_matching",
    name: "AI Language & Tone Matching",
    description: "Detect Bangla/English automatically and match your page personality",
    icon: Languages,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    category: "intelligence",
  },
  {
    id: "business_memory",
    name: "AI Business Memory",
    description: "Remember page info and conversations for contextual responses",
    icon: Brain,
    iconColor: "text-secondary",
    iconBg: "bg-secondary/10",
    category: "intelligence",
  },
  {
    id: "human_like_responses",
    name: "Human-Like AI Responses",
    description: "Generate natural, conversational responses that feel human",
    icon: Bot,
    iconColor: "text-accent",
    iconBg: "bg-accent/10",
    category: "intelligence",
  },
];

const FacebookAIAutomation = ({ pageId, pageName, onSettingsChange }: FacebookAIAutomationProps) => {
  const { toast } = useToast();
  const [options, setOptions] = useState<AIAutomationOption[]>(() => 
    defaultOptions.map(opt => ({ ...opt, enabled: false }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [webhookActive, setWebhookActive] = useState<boolean | null>(null);

  // Check if Facebook webhook is active
  useEffect(() => {
    async function checkWebhook() {
      const active = await isWebhookActive(FACEBOOK_WEBHOOK_ID);
      setWebhookActive(active);
    }
    checkWebhook();
  }, []);

  // Load saved settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`fb_ai_automation_${pageId}`);
    if (saved) {
      try {
        const savedSettings = JSON.parse(saved);
        setOptions(prev => prev.map(opt => ({
          ...opt,
          enabled: savedSettings[opt.id] ?? false
        })));
      } catch (e) {
        console.error("Failed to parse saved settings:", e);
      }
    }
  }, [pageId]);

  const handleToggle = async (optionId: string, enabled: boolean) => {
    // Check webhook status
    if (webhookActive === false) {
      toast({
        title: "Webhook Not Configured",
        description: "Facebook automation webhook is not active. Contact admin to configure it.",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update
    setOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, enabled } : opt
    ));

    // Save to localStorage
    const newSettings: Record<string, boolean> = {};
    options.forEach(opt => {
      newSettings[opt.id] = opt.id === optionId ? enabled : opt.enabled;
    });
    localStorage.setItem(`fb_ai_automation_${pageId}`, JSON.stringify(newSettings));

    // Notify parent
    onSettingsChange?.(newSettings);

    // Send to webhook using database URL
    try {
      setIsSaving(true);
      const result = await sendToWebhook(FACEBOOK_WEBHOOK_ID, {
        page_id: pageId,
        page_name: pageName,
        event_type: "automation_toggle",
        setting_id: optionId,
        enabled,
        all_settings: newSettings,
      });

      if (result.success) {
        toast({
          title: enabled ? "Automation Enabled" : "Automation Disabled",
          description: `${options.find(o => o.id === optionId)?.name} has been ${enabled ? "activated" : "paused"}.`,
        });
      } else {
        toast({
          title: "Settings Saved Locally",
          description: result.error || "Changes saved. Will sync when connection is restored.",
        });
      }
    } catch (error) {
      console.error("Failed to sync settings:", error);
      toast({
        title: "Settings Saved Locally",
        description: "Changes saved. Will sync when connection is restored.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const enabledCount = options.filter(o => o.enabled).length;
  const replyOptions = options.filter(o => o.category === "reply");
  const moderationOptions = options.filter(o => o.category === "moderation");
  const intelligenceOptions = options.filter(o => o.category === "intelligence");

  const renderOptionGroup = (title: string, groupOptions: AIAutomationOption[], startIndex: number) => (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground px-1">{title}</h4>
      {groupOptions.map((option, index) => {
        const Icon = option.icon;
        return (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (startIndex + index) * 0.03 }}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all ${
              option.enabled 
                ? "border-primary/30 bg-primary/5" 
                : "border-border/50 bg-muted/30 hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${option.iconBg}`}>
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${option.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-xs sm:text-sm truncate">{option.name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-none">
                  {option.description}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
              <span className={`text-[10px] sm:text-xs font-medium ${option.enabled ? "text-success" : "text-muted-foreground"}`}>
                {option.enabled ? "ON" : "OFF"}
              </span>
              <Switch
                checked={option.enabled}
                onCheckedChange={(checked) => handleToggle(option.id, checked)}
                disabled={isSaving || webhookActive === false}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Automation Controls</CardTitle>
                <CardDescription>
                  Toggle AI-powered features for {pageName}
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant={enabledCount > 0 ? "default" : "secondary"}
              className={enabledCount > 0 ? "bg-success text-success-foreground" : ""}
            >
              {enabledCount} / {options.length} Active
            </Badge>
          </div>
          
          {/* Webhook Status Banner */}
          {webhookActive === false && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">
                Facebook webhook is not configured. Automations won't work until an admin sets up the webhook URL in Admin Panel → Webhooks.
              </p>
            </div>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="pt-6 space-y-6">
          {renderOptionGroup("Reply Automations", replyOptions, 0)}
          {renderOptionGroup("Moderation", moderationOptions, replyOptions.length)}
          {renderOptionGroup("AI Intelligence", intelligenceOptions, replyOptions.length + moderationOptions.length)}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FacebookAIAutomation;
