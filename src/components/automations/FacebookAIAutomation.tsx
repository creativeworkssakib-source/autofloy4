import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  MessageCircle,
  ShoppingCart,
  Heart,
  Image,
  Sparkles,
  Loader2,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchPageMemory, savePageMemory } from "@/services/apiService";

interface AutomationFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  iconColor: string;
  iconBg: string;
}

interface FacebookAIAutomationProps {
  pageId: string;
  pageName: string;
  accountId?: string;
  onSettingsChange?: (settings: Record<string, boolean>) => void;
  onBack?: () => void;
}

const defaultFeatures: Omit<AutomationFeature, "enabled">[] = [
  {
    id: "comment_auto_reply",
    name: "Auto Comment Reply",
    description: "AI will automatically reply to comments on your posts",
    icon: MessageSquare,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    id: "inbox_auto_reply",
    name: "Auto Inbox Reply",
    description: "AI will automatically respond to Messenger inbox messages",
    icon: MessageCircle,
    iconColor: "text-secondary",
    iconBg: "bg-secondary/10",
  },
  {
    id: "order_taking",
    name: "Order Taking",
    description: "AI can take orders from customers via Messenger",
    icon: ShoppingCart,
    iconColor: "text-success",
    iconBg: "bg-success/10",
  },
  {
    id: "reaction_on_comments",
    name: "Reaction on Comments",
    description: "Automatically react (Like/Love) to comments on your posts",
    icon: Heart,
    iconColor: "text-destructive",
    iconBg: "bg-destructive/10",
  },
  {
    id: "ai_media_understanding",
    name: "AI Media Understanding",
    description: "AI can understand and respond to images and voice messages",
    icon: Image,
    iconColor: "text-accent",
    iconBg: "bg-accent/10",
  },
];

const FacebookAIAutomation = ({ pageId, pageName, accountId, onSettingsChange, onBack }: FacebookAIAutomationProps) => {
  const { toast } = useToast();
  const [features, setFeatures] = useState<AutomationFeature[]>(() => 
    defaultFeatures.map(f => ({ ...f, enabled: false }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved settings from page_memory
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const result = await fetchPageMemory(pageId);
        const memory = Array.isArray(result) 
          ? result.find(m => m.page_id === pageId) 
          : result;
        
        if (memory?.automation_settings) {
          const savedSettings = memory.automation_settings as Record<string, boolean>;
          setFeatures(prev => prev.map(f => ({
            ...f,
            enabled: savedSettings[f.id] ?? false
          })));
        }
      } catch (error) {
        console.error("Failed to load automation settings:", error);
        const saved = localStorage.getItem(`fb_ai_automation_${pageId}`);
        if (saved) {
          try {
            const savedSettings = JSON.parse(saved);
            setFeatures(prev => prev.map(f => ({
              ...f,
              enabled: savedSettings[f.id] ?? false
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

  const handleToggle = (featureId: string, enabled: boolean) => {
    setFeatures(prev => prev.map(f => 
      f.id === featureId ? { ...f, enabled } : f
    ));
  };

  const handleSaveSettings = async () => {
    const newSettings: Record<string, boolean> = {};
    features.forEach(f => {
      newSettings[f.id] = f.enabled;
    });

    localStorage.setItem(`fb_ai_automation_${pageId}`, JSON.stringify(newSettings));
    onSettingsChange?.(newSettings);

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
          title: "Settings Saved",
          description: "Your automation settings have been saved successfully.",
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
        title: "Settings Saved",
        description: "Your automation settings have been saved.",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Automation Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure AI automation for {pageName}
            </p>
          </div>
        </div>
        <Button 
          onClick={handleSaveSettings} 
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>

      {/* Automation Features Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Automation Features</CardTitle>
              <CardDescription>
                Enable or disable AI automation features for this page
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-1">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between py-4 border-b border-border/30 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-lg ${feature.iconBg}`}>
                        <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{feature.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={(checked) => handleToggle(feature.id, checked)}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FacebookAIAutomation;
