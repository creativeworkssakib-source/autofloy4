import { Lock, ArrowLeft, Globe, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

interface FeatureDisabledOverlayProps {
  featureName: string;
  /** Type of feature that is disabled */
  featureType: "online" | "offline";
  /** Custom message to show instead of default */
  customMessage?: string;
}

export const FeatureDisabledOverlay = ({ 
  featureName, 
  featureType,
  customMessage
}: FeatureDisabledOverlayProps) => {
  const { language } = useLanguage();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  // Determine where to navigate based on which feature is enabled
  const canGoToOnline = featureType === "offline" && settings.online_business_enabled !== false;
  const canGoToOffline = featureType === "online" && settings.offline_shop_enabled !== false;

  const handleNavigate = () => {
    if (canGoToOnline) {
      navigate("/dashboard");
    } else if (canGoToOffline) {
      navigate("/offline-shop");
    } else {
      navigate("/business");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] pointer-events-auto lg:left-64">
      {/* Blur + Grey overlay that blocks interactions on content */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[3px]" />
      
      {/* Watermark in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-20 h-20 rounded-full bg-muted/80 border-2 border-muted-foreground/20 flex items-center justify-center">
            <Lock className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-muted-foreground/60">
              {featureName}
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground/40 max-w-md">
              {customMessage || (language === "bn" 
                ? "এই ফিচারটি বর্তমানে অনুপলব্ধ"
                : "This feature is currently unavailable")}
            </p>
          </div>
          
          {/* Navigation button to go to enabled feature */}
          <div className="mt-4">
            <Button 
              onClick={handleNavigate}
              className="gap-2"
              size="lg"
            >
              {canGoToOnline ? (
                <>
                  <Globe className="h-5 w-5" />
                  {language === "bn" ? "অনলাইন বিজনেসে যান" : "Go to Online Business"}
                </>
              ) : canGoToOffline ? (
                <>
                  <Store className="h-5 w-5" />
                  {language === "bn" ? "অফলাইন শপে যান" : "Go to Offline Shop"}
                </>
              ) : (
                <>
                  <ArrowLeft className="h-5 w-5" />
                  {language === "bn" ? "বিজনেস সিলেক্টরে যান" : "Go to Business Selector"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
