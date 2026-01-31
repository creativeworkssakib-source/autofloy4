import { Crown, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface NoSubscriptionOverlayProps {
  /** Type of restriction */
  type: "no_plan" | "trial_expired" | "subscription_expired" | "suspended";
  /** User's name for personalization */
  userName?: string;
}

export function NoSubscriptionOverlay({ 
  type, 
  userName 
}: NoSubscriptionOverlayProps) {
  const { language } = useLanguage();

  const getContent = () => {
    switch (type) {
      case "trial_expired":
        return {
          icon: Clock,
          iconColor: "text-amber-500",
          iconBg: "bg-amber-500/10 border-amber-500/20",
          title: language === "bn" ? "আপনার ট্রায়াল শেষ হয়ে গেছে" : "Your Free Trial Has Ended",
          subtitle: language === "bn" 
            ? "অটোমেশন চালু রাখতে এখনই প্ল্যান সিলেক্ট করুন" 
            : "Select a plan now to keep your automations running",
          buttonText: language === "bn" ? "প্ল্যান দেখুন" : "View Plans",
          buttonVariant: "gradient" as const,
        };
      case "subscription_expired":
        return {
          icon: AlertTriangle,
          iconColor: "text-destructive",
          iconBg: "bg-destructive/10 border-destructive/20",
          title: language === "bn" ? "আপনার সাবস্ক্রিপশন মেয়াদ শেষ" : "Your Subscription Has Expired",
          subtitle: language === "bn" 
            ? "সার্ভিস চালু রাখতে রিনিউ করুন" 
            : "Renew your subscription to continue using services",
          buttonText: language === "bn" ? "রিনিউ করুন" : "Renew Now",
          buttonVariant: "gradient" as const,
        };
      case "suspended":
        return {
          icon: AlertTriangle,
          iconColor: "text-destructive",
          iconBg: "bg-destructive/10 border-destructive/20",
          title: language === "bn" ? "আপনার অ্যাকাউন্ট সাসপেন্ড করা হয়েছে" : "Your Account Has Been Suspended",
          subtitle: language === "bn" 
            ? "সাহায্যের জন্য সাপোর্টে যোগাযোগ করুন" 
            : "Please contact support for assistance",
          buttonText: language === "bn" ? "সাপোর্টে যোগাযোগ" : "Contact Support",
          buttonVariant: "outline" as const,
          link: "/contact",
        };
      default: // no_plan
        return {
          icon: Crown,
          iconColor: "text-primary",
          iconBg: "bg-primary/10 border-primary/20",
          title: language === "bn" ? "কোনো অ্যাক্টিভ প্ল্যান নেই" : "No Active Plan",
          subtitle: language === "bn" 
            ? "ফিচার ব্যবহার করতে একটি প্ল্যান সিলেক্ট করুন" 
            : "Select a plan to access all features",
          buttonText: language === "bn" ? "প্ল্যান দেখুন" : "View Plans",
          buttonVariant: "gradient" as const,
        };
    }
  };

  const content = getContent();
  const IconComponent = content.icon;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-auto lg:left-64">
      {/* Blur + Grey overlay that blocks interactions */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-6">
          {/* Icon */}
          <div className={`w-20 h-20 mx-auto rounded-full ${content.iconBg} border-2 flex items-center justify-center`}>
            <IconComponent className={`h-10 w-10 ${content.iconColor}`} />
          </div>
          
          {/* Text */}
          <div className="space-y-2">
            {userName && (
              <p className="text-sm text-muted-foreground">
                {language === "bn" ? `হ্যালো, ${userName}` : `Hello, ${userName}`}
              </p>
            )}
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {content.title}
            </h2>
            <p className="text-muted-foreground">
              {content.subtitle}
            </p>
          </div>
          
          {/* Features preview */}
          {type !== "suspended" && (
            <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
              <p className="text-sm font-medium text-foreground mb-3">
                {language === "bn" ? "প্ল্যান নিলে পাবেন:" : "With a plan you get:"}
              </p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {language === "bn" ? "Facebook AI অটো-রিপ্লাই" : "Facebook AI Auto-Reply"}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {language === "bn" ? "অটোমেটিক অর্ডার কালেকশন" : "Automatic Order Collection"}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {language === "bn" ? "কাস্টমার ফলো-আপ" : "Customer Follow-ups"}
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {language === "bn" ? "বিজনেস রিপোর্ট ও অ্যানালিটিক্স" : "Business Reports & Analytics"}
                </li>
              </ul>
            </div>
          )}
          
          {/* CTA Button */}
          <Button 
            variant={content.buttonVariant}
            size="lg" 
            className="w-full gap-2"
            asChild
          >
            <Link to={content.link || "/pricing"}>
              {content.buttonText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          
          {/* Secondary action */}
          {type !== "suspended" && (
            <p className="text-xs text-muted-foreground">
              {language === "bn" 
                ? "প্রশ্ন আছে? " 
                : "Have questions? "}
              <Link to="/contact" className="text-primary hover:underline">
                {language === "bn" ? "সাপোর্টে যোগাযোগ করুন" : "Contact support"}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
