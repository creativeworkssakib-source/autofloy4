import { useAuth } from "@/contexts/AuthContext";
import { 
  getPlanCapabilities, 
  PlanCapabilities, 
  PlanId, 
  getNextUpgradePlan,
  planDisplayNames 
} from "@/data/planCapabilities";

export interface PlanLimitsResult {
  // Current plan info
  planId: PlanId;
  planName: string;
  capabilities: PlanCapabilities;
  
  // Access checks
  isTrialExpired: boolean;
  hasActiveSubscription: boolean;
  
  // Limit checking functions
  canConnectFacebookPage: (currentCount: number) => { allowed: boolean; message?: string };
  canConnectWhatsapp: (currentCount: number) => { allowed: boolean; message?: string };
  canRunAutomation: (runsThisMonth: number) => { allowed: boolean; message?: string };
  hasFeature: (feature: keyof PlanCapabilities["features"]) => boolean;
  
  // Upgrade info
  nextUpgradePlan: PlanId | null;
  nextUpgradePlanName: string | null;
  getUpgradeMessage: (feature: string) => string;
}

export function usePlanLimits(): PlanLimitsResult {
  const { user } = useAuth();
  
  // Determine effective plan
  let planId: PlanId = "none";
  let isTrialExpired = false;
  let hasActiveSubscription = false;
  
  if (user) {
    const subPlan = user.subscriptionPlan?.toLowerCase() as PlanId;
    
    // Check if trial is still active
    if (subPlan === "trial") {
      if (user.isTrialActive && user.trialEndDate) {
        const trialEnd = new Date(user.trialEndDate);
        if (trialEnd > new Date()) {
          planId = "trial";
          hasActiveSubscription = true;
        } else {
          isTrialExpired = true;
        }
      } else {
        isTrialExpired = true;
      }
    }
    // Check paid subscription
    else if (["starter", "professional", "business", "lifetime"].includes(subPlan)) {
      if (subPlan === "lifetime") {
        planId = "lifetime";
        hasActiveSubscription = true;
      } else if (user.subscriptionEndsAt) {
        const subEnd = new Date(user.subscriptionEndsAt);
        if (subEnd > new Date()) {
          planId = subPlan;
          hasActiveSubscription = true;
        }
      }
    }
  }
  
  const capabilities = getPlanCapabilities(planId);
  const planName = planDisplayNames[planId];
  const nextUpgradePlan = getNextUpgradePlan(planId);
  const nextUpgradePlanName = nextUpgradePlan ? planDisplayNames[nextUpgradePlan] : null;
  
  // Facebook page limit check
  const canConnectFacebookPage = (currentCount: number): { allowed: boolean; message?: string } => {
    if (!hasActiveSubscription && !isTrialExpired) {
      return { 
        allowed: false, 
        message: "Please subscribe to connect Facebook pages." 
      };
    }
    
    if (isTrialExpired) {
      return { 
        allowed: false, 
        message: "Your 24-hour free trial has ended. Please upgrade to connect pages." 
      };
    }
    
    if (currentCount >= capabilities.maxFacebookPages) {
      return { 
        allowed: false, 
        message: `Your ${planName} plan allows connecting only ${capabilities.maxFacebookPages} Facebook Page(s). Upgrade to connect more.` 
      };
    }
    
    return { allowed: true };
  };
  
  // WhatsApp limit check
  const canConnectWhatsapp = (currentCount: number): { allowed: boolean; message?: string } => {
    if (!capabilities.features.whatsappEnabled || capabilities.maxWhatsappAccounts === 0) {
      return { 
        allowed: false, 
        message: "WhatsApp automation is available on Professional and above." 
      };
    }
    
    if (!hasActiveSubscription) {
      return { 
        allowed: false, 
        message: "Please subscribe to connect WhatsApp." 
      };
    }
    
    if (currentCount >= capabilities.maxWhatsappAccounts) {
      return { 
        allowed: false, 
        message: `Your ${planName} plan allows only ${capabilities.maxWhatsappAccounts} WhatsApp account(s).` 
      };
    }
    
    return { allowed: true };
  };
  
  // Automation run limit check
  const canRunAutomation = (runsThisMonth: number): { allowed: boolean; message?: string } => {
    if (!hasActiveSubscription && planId !== "trial") {
      return { 
        allowed: false, 
        message: "Please subscribe to run automations." 
      };
    }
    
    if (isTrialExpired) {
      return { 
        allowed: false, 
        message: "Your 24-hour free trial has ended. Please upgrade to continue using automations." 
      };
    }
    
    // null = unlimited
    if (capabilities.maxAutomationsPerMonth === null) {
      return { allowed: true };
    }
    
    if (runsThisMonth >= capabilities.maxAutomationsPerMonth) {
      return { 
        allowed: false, 
        message: `You have used all ${capabilities.maxAutomationsPerMonth} automations for this month on your ${planName} plan.` 
      };
    }
    
    return { allowed: true };
  };
  
  // Feature check
  const hasFeature = (feature: keyof PlanCapabilities["features"]): boolean => {
    if (!hasActiveSubscription && planId !== "trial") {
      return false;
    }
    if (isTrialExpired) {
      return false;
    }
    return capabilities.features[feature];
  };
  
  // Upgrade message helper
  const getUpgradeMessage = (feature: string): string => {
    if (nextUpgradePlanName) {
      return `Upgrade to ${nextUpgradePlanName} to use ${feature}.`;
    }
    return `This feature is not available on your current plan.`;
  };
  
  return {
    planId,
    planName,
    capabilities,
    isTrialExpired,
    hasActiveSubscription,
    canConnectFacebookPage,
    canConnectWhatsapp,
    canRunAutomation,
    hasFeature,
    nextUpgradePlan,
    nextUpgradePlanName,
    getUpgradeMessage,
  };
}
