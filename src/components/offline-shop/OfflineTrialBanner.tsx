import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Crown, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOfflineShopTrial } from "@/hooks/useOfflineShopTrial";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface OfflineTrialBannerProps {
  onTrialStart?: () => void;
}

const OfflineTrialBanner = ({ onTrialStart }: OfflineTrialBannerProps) => {
  const { 
    isTrialUser, 
    isOfflineTrialActive, 
    isOfflineTrialExpired,
    daysRemaining, 
    hoursRemaining, 
    minutesRemaining,
    startOfflineTrial,
    trialEndDate
  } = useOfflineShopTrial();
  const { language } = useLanguage();
  const [hasStarted, setHasStarted] = useState(false);

  // Auto-start trial when user enters offline shop
  useEffect(() => {
    if (isTrialUser && !isOfflineTrialActive && !isOfflineTrialExpired && !hasStarted) {
      startOfflineTrial();
      setHasStarted(true);
      onTrialStart?.();
    }
  }, [isTrialUser, isOfflineTrialActive, isOfflineTrialExpired, hasStarted, startOfflineTrial, onTrialStart]);

  // Not a trial user - no banner needed
  if (!isTrialUser) return null;

  // Trial expired
  if (isOfflineTrialExpired) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h4 className="font-semibold text-destructive text-sm sm:text-base">
                {language === "bn" ? "অফলাইন শপ ট্রায়াল শেষ" : "Offline Shop Trial Expired"}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {language === "bn" 
                  ? "অফলাইন শপ ফিচার ব্যবহার করতে একটি পেইড প্ল্যান আপগ্রেড করুন।"
                  : "Upgrade to a paid plan to continue using Offline Shop features."}
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link to="/pricing">
              <Crown className="h-4 w-4 mr-2" />
              {language === "bn" ? "আপগ্রেড করুন" : "Upgrade Now"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Trial active - show countdown
  if (isOfflineTrialActive) {
    const isLowTime = daysRemaining <= 1;
    
    return (
      <div className={cn(
        "rounded-lg p-3 sm:p-4 mb-4 border",
        isLowTime 
          ? "bg-warning/10 border-warning/30" 
          : "bg-primary/5 border-primary/20"
      )}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              isLowTime ? "bg-warning/20" : "bg-primary/10"
            )}>
              <Clock className={cn(
                "h-5 w-5",
                isLowTime ? "text-warning" : "text-primary"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  "font-semibold text-sm sm:text-base",
                  isLowTime ? "text-warning" : "text-primary"
                )}>
                  {language === "bn" ? "অফলাইন শপ ফ্রি ট্রায়াল" : "Offline Shop Free Trial"}
                </h4>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <span className={cn(
                    "font-bold",
                    isLowTime ? "text-warning" : "text-primary"
                  )}>
                    {daysRemaining}
                  </span>
                  <span className="text-muted-foreground">
                    {language === "bn" ? "দিন" : "days"}
                  </span>
                  <span className={cn(
                    "font-bold",
                    isLowTime ? "text-warning" : "text-primary"
                  )}>
                    {hoursRemaining}
                  </span>
                  <span className="text-muted-foreground">
                    {language === "bn" ? "ঘন্টা" : "hrs"}
                  </span>
                  <span className={cn(
                    "font-bold",
                    isLowTime ? "text-warning" : "text-primary"
                  )}>
                    {minutesRemaining}
                  </span>
                  <span className="text-muted-foreground">
                    {language === "bn" ? "মিনিট" : "min"}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {language === "bn" ? "বাকি আছে" : "remaining"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link to="/pricing">
              <Crown className="h-4 w-4 mr-2" />
              {language === "bn" ? "আপগ্রেড করুন" : "Upgrade"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default OfflineTrialBanner;
