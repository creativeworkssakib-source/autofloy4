import { Link } from "react-router-dom";
import { Crown, Sparkles, CreditCard, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

interface User {
  subscriptionPlan: string;
  trialEndDate?: string;
  isTrialActive?: boolean;
  subscriptionStartedAt?: string;
  subscriptionEndsAt?: string;
}

interface SubscriptionCardProps {
  user: User | null;
}

const getPlanDisplayName = (plan: string): string => {
  const planNames: Record<string, string> = {
    trial: "Free Trial",
    starter: "Starter Plan",
    professional: "Professional Plan",
    business: "Business Plan",
    lifetime: "Lifetime Access",
    none: "No Plan",
  };
  return planNames[plan] || `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`;
};

const getHoursRemaining = (endDate?: string): number | null => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  return Math.max(0, diffHours);
};

const getTrialProgress = (hoursRemaining: number, totalHours: number = 24): number => {
  if (totalHours <= 0) return 0;
  return Math.max(0, Math.min(100, (hoursRemaining / totalHours) * 100));
};

export function SubscriptionCard({ user }: SubscriptionCardProps) {
  const plan = user?.subscriptionPlan || "none";
  const isTrialActive = user?.isTrialActive;
  const subscriptionEndsAt = user?.subscriptionEndsAt;
  const trialEndDate = user?.trialEndDate;
  
  // Calculate hours remaining - use subscriptionEndsAt first, fallback to trialEndDate for trials
  const endDate = subscriptionEndsAt || (plan === "trial" ? trialEndDate : undefined);
  const hoursRemaining = getHoursRemaining(endDate);
  
  // Trial plan
  if (plan === "trial" && isTrialActive) {
    const progress = hoursRemaining !== null ? getTrialProgress(hoursRemaining) : 0;
    
    return (
      <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Free Trial</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs text-muted-foreground mb-2 cursor-help">
                {hoursRemaining !== null && hoursRemaining > 0 
                  ? `${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} remaining` 
                  : "Trial expired"}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                {user?.subscriptionStartedAt && <p>Started: {format(new Date(user.subscriptionStartedAt), "PPP")}</p>}
                <p>{endDate ? `Ends: ${format(new Date(endDate), "PPP")}` : "No end date set"}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <Button variant="gradient" size="sm" className="w-full mt-3" asChild>
          <Link to="/pricing">Upgrade Now</Link>
        </Button>
      </div>
    );
  }
  
  // Lifetime plan
  if (plan === "lifetime") {
    return (
      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 truncate">
            Lifetime Access
          </span>
        </div>
        <div className="text-xs text-muted-foreground break-words">
          Enjoy all features forever
        </div>
      </div>
    );
  }
  
  // Paid plans (starter, professional, business)
  if (["starter", "professional", "business"].includes(plan)) {
    return (
      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {getPlanDisplayName(plan)}
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs text-muted-foreground mb-2 cursor-help">
                {hoursRemaining !== null 
                  ? `${Math.ceil(hoursRemaining / 24)} day${Math.ceil(hoursRemaining / 24) !== 1 ? 's' : ''} remaining`
                  : "Active subscription"}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                {user?.subscriptionStartedAt && <p>Started: {format(new Date(user.subscriptionStartedAt), "PPP")}</p>}
                <p>{endDate ? `Ends: ${format(new Date(endDate), "PPP")}` : "No end date set"}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/dashboard/settings">
            <CreditCard className="w-3 h-3 mr-1" />
            Manage Billing
          </Link>
        </Button>
      </div>
    );
  }
  
  // No plan or unknown
  return (
    <div className="p-3 rounded-xl bg-muted/50 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Crown className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold">No Active Plan</span>
      </div>
      <div className="text-xs text-muted-foreground mb-2">
        Choose a plan to get started
      </div>
      <Button variant="gradient" size="sm" className="w-full" asChild>
        <Link to="/pricing">View Plans</Link>
      </Button>
    </div>
  );
}
