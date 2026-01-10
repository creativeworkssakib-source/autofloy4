import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Globe, Palette, Save, Loader2, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import FacebookAIAutomation from "./FacebookAIAutomation";
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

const FacebookAutomationSection = ({
  pageId,
  pageName,
  accountId,
  onBack,
}: FacebookAutomationSectionProps) => {
  const { toast } = useToast();
  const [aiSettings, setAiSettings] = useState<Record<string, boolean>>({});
  const [pageMemory, setPageMemory] = useState<PageMemory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editable memory fields
  const [preferredTone, setPreferredTone] = useState("friendly");
  const [detectedLanguage, setDetectedLanguage] = useState("auto");
  const [businessDescription, setBusinessDescription] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  // Load page memory from backend
  useEffect(() => {
    const loadPageMemory = async () => {
      setIsLoading(true);
      try {
        const memory = await fetchPageMemory(pageId) as PageMemory | null;
        if (memory) {
          setPageMemory(memory);
          setPreferredTone(memory.preferred_tone || "friendly");
          setDetectedLanguage(memory.detected_language || "auto");
          setBusinessDescription(memory.business_description || "");
          setCustomInstructions(memory.custom_instructions || "");
          setAiSettings(memory.automation_settings || {});
        }
      } catch (error) {
        console.error("Failed to load page memory:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPageMemory();
  }, [pageId]);

  // Also load from localStorage as fallback
  useEffect(() => {
    const saved = localStorage.getItem(`fb_ai_automation_${pageId}`);
    if (saved && Object.keys(aiSettings).length === 0) {
      try {
        setAiSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved settings:", e);
      }
    }
  }, [pageId]);

  const handleSaveMemory = async () => {
    setIsSaving(true);
    try {
      const memory = await savePageMemory({
        account_id: accountId,
        page_id: pageId,
        page_name: pageName,
        preferred_tone: preferredTone,
        detected_language: detectedLanguage,
        business_description: businessDescription,
        custom_instructions: customInstructions,
        automation_settings: aiSettings,
      });

      if (memory) {
        setPageMemory(memory);
        toast({
          title: "Settings Saved",
          description: "Your AI memory settings have been updated.",
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

  const handleSettingsChange = (settings: Record<string, boolean>) => {
    setAiSettings(settings);
    // Also sync to backend
    savePageMemory({
      account_id: accountId,
      page_id: pageId,
      automation_settings: settings,
    }).catch(console.error);
  };

  const enabledCount = Object.values(aiSettings).filter(v => v).length;

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
          Back to Platforms
        </Button>
        
        {pageMemory?.webhook_subscribed && (
          <Badge variant="outline" className="gap-1 text-success border-success/30">
            <CheckCircle className="h-3 w-3" />
            Webhook Active
          </Badge>
        )}
      </motion.div>

      {/* Status Card */}
      <AutomationStatusCard
        isActive={enabledCount > 0}
        pageName={pageName}
        pageId={pageId}
        repliesToday={0}
        lastActivityTime={null}
        enabledAutomationsCount={enabledCount}
        totalAutomations={12}
      />

      {/* AI Memory Settings */}
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
                AI Memory & Preferences
              </CardTitle>
              <Button
                size="sm"
                onClick={handleSaveMemory}
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
                    Save
                  </>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Select value={detectedLanguage} onValueChange={setDetectedLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                placeholder="Describe your business... (e.g., We sell handmade jewelry and accessories. Our specialty is custom designs.)"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                AI will use this to understand your business and provide relevant responses.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Instructions (Optional)</label>
              <Textarea
                placeholder="Any special instructions for AI... (e.g., Always mention free shipping on orders over ৳1000)"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Automation Controls */}
      <FacebookAIAutomation
        pageId={pageId}
        pageName={pageName}
        onSettingsChange={handleSettingsChange}
      />

      {/* Recent Activity Log */}
      <RecentActivityLog
        pageId={pageId}
        maxItems={10}
      />
    </div>
  );
};

export default FacebookAutomationSection;
