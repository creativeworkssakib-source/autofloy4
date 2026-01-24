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
import { fetchPageMemory, savePageMemory } from "@/services/apiService";
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
  Sparkles
} from "lucide-react";

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

const FacebookPageSettings = () => {
  const { pageId, accountId } = useParams<{ pageId: string; accountId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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

  useEffect(() => {
    const loadSettings = async () => {
      if (!pageId) return;
      
      setIsLoading(true);
      try {
        const memory = await fetchPageMemory(pageId);
        
        if (memory && !Array.isArray(memory)) {
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
      const result = await savePageMemory({
        account_id: accountId,
        page_id: pageId,
        page_name: pageName,
        business_description: businessInfo.businessDescription,
        products_summary: businessInfo.servicesOffered,
        detected_language: businessInfo.preferredLanguage,
        preferred_tone: businessInfo.tone,
        automation_settings: automationSettings as unknown as Record<string, boolean>,
      });
      
      if (result) {
        toast({
          title: "Settings Saved",
          description: "Your automation settings have been saved successfully.",
        });
      } else {
        throw new Error("Failed to save");
      }
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

        {/* Save Button (Mobile) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
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
