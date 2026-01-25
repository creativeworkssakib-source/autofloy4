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
  Heart,
  Camera,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchPageMemory, savePageMemory } from "@/services/apiService";

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
  accountId?: string;
  onSettingsChange?: (settings: Record<string, boolean>) => void;
}

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
    id: "order_taking",
    name: "Order Taking",
    description: "AI can take orders from customers via Messenger",
    icon: ShoppingCart,
    iconColor: "text-success",
    iconBg: "bg-success/10",
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
    id: "reaction_on_comments",
    name: "Reaction on Comments",
    description: "Automatically react (Like/Love) to comments on your posts",
    icon: Heart,
    iconColor: "text-pink-500",
    iconBg: "bg-pink-500/10",
    category: "moderation",
  },
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
    id: "ai_media_understanding",
    name: "AI Media Understanding",
    description: "AI can understand and respond to images and voice messages",
    icon: Camera,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
    category: "intelligence",
  },
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

const FacebookAIAutomation = ({ pageId, pageName, accountId, onSettingsChange }: FacebookAIAutomationProps) => {
  const { toast } = useToast();
  const [options, setOptions] = useState<AIAutomationOption[]>(() => 
    defaultOptions.map(opt => ({ ...opt, enabled: false }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved settings from page_memory
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const result = await fetchPageMemory(pageId);
        // Handle both array and single object responses
        const memory = Array.isArray(result) 
          ? result.find(m => m.page_id === pageId) 
          : result;
        
        if (memory?.automation_settings) {
          const savedSettings = memory.automation_settings as Record<string, boolean>;
          setOptions(prev => prev.map(opt => ({
            ...opt,
            enabled: savedSettings[opt.id] ?? false
          })));
        }
      } catch (error) {
        console.error("Failed to load automation settings:", error);
        // Fallback to localStorage
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
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [pageId]);

  const handleToggle = async (optionId: string, enabled: boolean) => {
    // Optimistic update
    setOptions(prev => prev.map(opt => 
      opt.id === optionId ? { ...opt, enabled } : opt
    ));

    // Build new settings object
    const newSettings: Record<string, boolean> = {};
    options.forEach(opt => {
      newSettings[opt.id] = opt.id === optionId ? enabled : opt.enabled;
    });

    // Save to localStorage as backup
    localStorage.setItem(`fb_ai_automation_${pageId}`, JSON.stringify(newSettings));

    // Notify parent
    onSettingsChange?.(newSettings);

    // Save to page_memory
    if (accountId) {
      try {
        setIsSaving(true);
        await savePageMemory({
          account_id: accountId,
          page_id: pageId,
          page_name: pageName,
          automation_settings: newSettings,
        });
        
        toast({
          title: enabled ? "Automation Enabled" : "Automation Disabled",
          description: `${options.find(o => o.id === optionId)?.name} has been ${enabled ? "activated" : "paused"}.`,
        });
      } catch (error) {
        console.error("Failed to save settings:", error);
        toast({
          title: "Settings Saved Locally",
          description: "Changes saved locally. Will sync when connection is restored.",
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      toast({
        title: enabled ? "Automation Enabled" : "Automation Disabled",
        description: `${options.find(o => o.id === optionId)?.name} has been ${enabled ? "activated" : "paused"}.`,
      });
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
                disabled={isSaving}
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
            <div className="flex items-center gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <Badge 
                variant={enabledCount > 0 ? "default" : "secondary"}
                className={enabledCount > 0 ? "bg-success text-success-foreground" : ""}
              >
                {enabledCount} / {options.length} Active
              </Badge>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {renderOptionGroup("Reply Automations", replyOptions, 0)}
              {renderOptionGroup("Moderation", moderationOptions, replyOptions.length)}
              {renderOptionGroup("AI Intelligence", intelligenceOptions, replyOptions.length + moderationOptions.length)}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FacebookAIAutomation;
