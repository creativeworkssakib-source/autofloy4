import { useAuth } from "@/contexts/AuthContext";
import { 
  getPlanCapabilities, 
  PlanCapabilities, 
  PlanId, 
  getNextUpgradePlan,
  planDisplayNames 
} from "@/data/planCapabilities";

export type SubscriptionType = 'online' | 'offline' | 'both';

export interface PlanLimitsResult {
  // Current plan info
  planId: PlanId;
  planName: string;
  subscriptionType: SubscriptionType;
  capabilities: PlanCapabilities;
  
  // Access checks
  isTrialExpired: boolean;
  hasActiveSubscription: boolean;
  
  // Subscription type checks
  hasOnlineAccess: boolean;  // Can access Facebook/WhatsApp automation
  hasOfflineAccess: boolean; // Can access Offline Shop POS
  
  // Limit checking functions
  canConnectFacebookPage: (currentCount: number) => { allowed: boolean; message?: string };
  canConnectWhatsapp: (currentCount: number) => { allowed: boolean; message?: string };
  canRunAutomation: (runsThisMonth: number) => { allowed: boolean; message?: string };
  canAccessOfflineShop: () => { allowed: boolean; message?: string };
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
  let subscriptionType: SubscriptionType = 'online';
  
  if (user) {
    const subPlan = user.subscriptionPlan?.toLowerCase() as PlanId;
    subscriptionType = user.subscriptionType || 'online';
    
    // Check if trial is still active
    if (subPlan === "trial") {
      if (user.isTrialActive && user.trialEndDate) {
        const trialEnd = new Date(user.trialEndDate);
        if (trialEnd > new Date()) {
          planId = "trial";
          hasActiveSubscription = true;
          subscriptionType = 'both'; // Trial gets access to both
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
  
  // Determine access based on subscription type AND active subscription
  // User must have active subscription to have any access
  const hasOnlineAccess = hasActiveSubscription && (subscriptionType === 'online' || subscriptionType === 'both');
  const hasOfflineAccess = hasActiveSubscription && (subscriptionType === 'offline' || subscriptionType === 'both');
  
  const capabilities = getPlanCapabilities(planId);
  const planName = planDisplayNames[planId];
  const nextUpgradePlan = getNextUpgradePlan(planId);
  const nextUpgradePlanName = nextUpgradePlan ? planDisplayNames[nextUpgradePlan] : null;
  
  // Facebook page limit check - requires online access
  const canConnectFacebookPage = (currentCount: number): { allowed: boolean; message?: string } => {
    // Check if user has online access
    if (!hasOnlineAccess) {
      return { 
        allowed: false, 
        message: "আপনার শুধু Offline Shop subscription আছে। Facebook automation ব্যবহার করতে Online plan upgrade করুন।" 
      };
    }
    
    if (!hasActiveSubscription && !isTrialExpired) {
      return { 
        allowed: false, 
        message: "Please subscribe to connect Facebook pages." 
      };
    }
    
    if (isTrialExpired) {
      return { 
        allowed: false, 
        message: "Your free trial has ended. Please upgrade to connect pages." 
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
  
  // WhatsApp limit check - requires online access
  const canConnectWhatsapp = (currentCount: number): { allowed: boolean; message?: string } => {
    // Check if user has online access
    if (!hasOnlineAccess) {
      return { 
        allowed: false, 
        message: "আপনার শুধু Offline Shop subscription আছে। WhatsApp automation ব্যবহার করতে Online plan upgrade করুন।" 
      };
    }
    
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
  
  // Automation run limit check - requires online access
  const canRunAutomation = (runsThisMonth: number): { allowed: boolean; message?: string } => {
    // Check if user has online access
    if (!hasOnlineAccess) {
      return { 
        allowed: false, 
        message: "আপনার শুধু Offline Shop subscription আছে। Automation ব্যবহার করতে Online plan upgrade করুন।" 
      };
    }
    
    if (!hasActiveSubscription && planId !== "trial") {
      return { 
        allowed: false, 
        message: "Please subscribe to run automations." 
      };
    }
    
    if (isTrialExpired) {
      return { 
        allowed: false, 
        message: "Your free trial has ended. Please upgrade to continue using automations." 
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
  
  // Offline shop access check
  const canAccessOfflineShop = (): { allowed: boolean; message?: string } => {
    if (!hasOfflineAccess) {
      return { 
        allowed: false, 
        message: "আপনার শুধু Online Business subscription আছে। Offline Shop ব্যবহার করতে Offline plan কিনুন।" 
      };
    }
    
    if (!hasActiveSubscription && planId !== "trial") {
      return { 
        allowed: false, 
        message: "Please subscribe to access the Offline Shop." 
      };
    }
    
    if (isTrialExpired) {
      return { 
        allowed: false, 
        message: "Your free trial has ended. Please upgrade to access the Offline Shop." 
      };
    }
    
    return { allowed: true };
  };
  
  // Feature check - considers subscription type
  const hasFeature = (feature: keyof PlanCapabilities["features"]): boolean => {
    if (!hasActiveSubscription && planId !== "trial") {
      return false;
    }
    if (isTrialExpired) {
      return false;
    }
    
    // Online-specific features require online access
    const onlineFeatures: (keyof PlanCapabilities["features"])[] = [
      'messageAutoReply', 'commentAutoReply', 'imageAutoReply', 'voiceAutoReply',
      'deleteNegativeComments', 'whatsappEnabled', 'instagramAutomation', 
      'tiktokAutomation', 'emailAutomation', 'ecommerceIntegration'
    ];
    
    if (onlineFeatures.includes(feature) && !hasOnlineAccess) {
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
    subscriptionType,
    capabilities,
    isTrialExpired,
    hasActiveSubscription,
    hasOnlineAccess,
    hasOfflineAccess,
    canConnectFacebookPage,
    canConnectWhatsapp,
    canRunAutomation,
    canAccessOfflineShop,
    hasFeature,
    nextUpgradePlan,
    nextUpgradePlanName,
    getUpgradeMessage,
  };
}
