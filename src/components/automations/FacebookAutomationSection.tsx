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
  Building2
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import AutomationStatusCard from "./AutomationStatusCard";
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
  const [businessDescription, setBusinessDescription] = useState("");

  // Load page memory from backend
  useEffect(() => {
    const loadPageMemory = async () => {
      setIsLoading(true);
      try {
        const memory = await fetchPageMemory(pageId) as PageMemory | null;
        if (memory) {
          setPageMemory(memory);
          setBusinessDescription(memory.business_description || "");
          
          // Load automation features from automation_settings
          if (memory.automation_settings) {
            setAutomationFeatures({
              autoCommentReply: memory.automation_settings.autoCommentReply ?? false,
              autoInboxReply: memory.automation_settings.autoInboxReply ?? false,
              orderTaking: memory.automation_settings.orderTaking ?? false,
              reactionOnComments: memory.automation_settings.reactionOnComments ?? false,
              aiMediaUnderstanding: memory.automation_settings.aiMediaUnderstanding ?? false,
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
        business_description: businessDescription,
        automation_settings: automationFeatures as unknown as Record<string, boolean>,
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Business Description</Label>
              <Textarea
                placeholder="Describe your business, what you sell, and your unique selling points..."
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Webhook Status Badge */}
      {pageMemory?.webhook_subscribed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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
