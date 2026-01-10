import { Link } from "react-router-dom";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const OfflineTrialExpiredOverlay = () => {
  const { language } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-card border rounded-2xl p-6 sm:p-8 text-center shadow-xl"
      >
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        
        <h2 className="text-xl sm:text-2xl font-bold mb-3">
          {language === "bn" 
            ? "অফলাইন শপ ট্রায়াল শেষ হয়েছে" 
            : "Offline Shop Trial Expired"}
        </h2>
        
        <p className="text-muted-foreground mb-6 text-sm sm:text-base">
          {language === "bn" 
            ? "আপনার ৭ দিনের ফ্রি ট্রায়াল শেষ হয়েছে। অফলাইন শপ ফিচার ব্যবহার চালিয়ে যেতে একটি পেইড প্ল্যানে আপগ্রেড করুন।"
            : "Your 7-day free trial has ended. Upgrade to a paid plan to continue using Offline Shop features."}
        </p>

        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link to="/pricing">
              <Crown className="h-5 w-5 mr-2" />
              {language === "bn" ? "প্ল্যান দেখুন ও আপগ্রেড করুন" : "View Plans & Upgrade"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link to="/dashboard">
              {language === "bn" ? "অনলাইন বিজনেসে ফিরে যান" : "Back to Online Business"}
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          {language === "bn" 
            ? "অনলাইন বিজনেস ফিচার এখনও আপনার ট্রায়াল প্ল্যানে পাওয়া যাবে।"
            : "Online Business features are still available on your trial plan."}
        </p>
      </motion.div>
    </div>
  );
};

export default OfflineTrialExpiredOverlay;
