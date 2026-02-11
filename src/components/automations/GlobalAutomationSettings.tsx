import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Phone, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GlobalAutomationSettingsProps {
  className?: string;
}

const GlobalAutomationSettings = ({ className }: GlobalAutomationSettingsProps) => {
  const { toast } = useToast();
  const [supportWhatsappNumber, setSupportWhatsappNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load user's global settings
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("autofloy_token");
        if (!token) return;

        const response = await supabase.functions.invoke("me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.user) {
          setSupportWhatsappNumber(response.data.user.support_whatsapp_number || "");
        }
      } catch (error) {
        console.error("Failed to load global settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("autofloy_token");
      if (!token) throw new Error("Not authenticated");

      // Use direct fetch with PUT method instead of supabase.functions.invoke
      // because invoke() always uses POST
      const workerUrl = import.meta.env.VITE_WORKER_API_URL || "https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1";
      const response = await fetch(
        `${workerUrl}/me`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ support_whatsapp_number: supportWhatsappNumber || null }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save");
      }

      toast({
        title: "Settings Saved",
        description: "Your global automation settings have been updated.",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save Failed",
        description: "Could not save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={`border-border/50 bg-card/50 ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Global AI Settings
          </CardTitle>
          <CardDescription>
            These settings apply to AI across all platforms (Facebook, Instagram, WhatsApp)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Support WhatsApp Number */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-success" />
                Support WhatsApp Number
              </Label>
              <p className="text-xs text-muted-foreground">
                AI will share this number when customers ask to call or need urgent help
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="tel"
                placeholder="+880 1XXX XXXXXX"
                value={supportWhatsappNumber}
                onChange={(e) => setSupportWhatsappNumber(e.target.value)}
                className="max-w-[220px]"
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3" />
                    Save
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground italic">
              যখন customer কল করতে চাইবে বা urgent help লাগবে, AI এই নম্বরটি দিয়ে দিবে।
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GlobalAutomationSettings;
