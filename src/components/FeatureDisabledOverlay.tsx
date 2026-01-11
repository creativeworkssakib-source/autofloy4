import { Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FeatureDisabledOverlayProps {
  featureName: string;
}

export const FeatureDisabledOverlay = ({ featureName }: FeatureDisabledOverlayProps) => {
  const { language } = useLanguage();

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto">
      {/* Blur + Grey overlay that blocks interactions */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
      
      {/* Watermark in center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-20 h-20 rounded-full bg-muted/80 border-2 border-muted-foreground/20 flex items-center justify-center">
            <Lock className="h-10 w-10 text-muted-foreground/60" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-muted-foreground/70">
              {featureName}
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground/50 max-w-md">
              {language === "bn" 
                ? "এই ফিচারটি বর্তমানে অনুপলব্ধ"
                : "This feature is currently unavailable"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
