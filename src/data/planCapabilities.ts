// Plan capabilities configuration - defines what each plan can do

export type PlanId = "trial" | "none" | "starter" | "professional" | "business" | "lifetime";

export interface PlanCapabilities {
  // Connection limits
  maxFacebookPages: number;
  maxWhatsappAccounts: number;
  
  // Automation limits
  maxAutomationsPerMonth: number | null; // null = unlimited
  
  // SMS limits
  dailySmsLimit: number; // 0 = not allowed, -1 = unlimited
  platformSmsEnabled: boolean;
  
  // Feature flags
  features: {
    // Automation types
    messageAutoReply: boolean;
    commentAutoReply: boolean;
    imageAutoReply: boolean;
    voiceAutoReply: boolean;
    deleteNegativeComments: boolean;
    
    // Analytics
    basicAnalytics: boolean;
    advancedAnalytics: boolean;
    businessAnalyticsDashboard: boolean;
    
    // Support
    emailSupport: boolean;
    priorityEmailSupport: boolean;
    phoneSupport247: boolean;
    
    // Platform integrations
    whatsappEnabled: boolean;
    instagramAutomation: boolean;
    tiktokAutomation: boolean;
    emailAutomation: boolean;
    ecommerceIntegration: boolean;
    
    // Advanced features
    bengaliAiResponses: boolean;
    orderManagementSystem: boolean;
    invoiceSystem: boolean;
    customTraining: boolean;
    vipOnboarding: boolean;
    customIntegrations: boolean;
    prioritySupportForever: boolean;
    lifetimeUpdates: boolean;
    allFutureFeaturesFree: boolean;
  };
}

export const planCapabilities: Record<PlanId, PlanCapabilities> = {
  // No plan / expired
  none: {
    maxFacebookPages: 0,
    maxWhatsappAccounts: 0,
    maxAutomationsPerMonth: 0,
    dailySmsLimit: 0, // Not allowed
    platformSmsEnabled: false,
    features: {
      messageAutoReply: false,
      commentAutoReply: false,
      imageAutoReply: false,
      voiceAutoReply: false,
      deleteNegativeComments: false,
      basicAnalytics: false,
      advancedAnalytics: false,
      businessAnalyticsDashboard: false,
      emailSupport: false,
      priorityEmailSupport: false,
      phoneSupport247: false,
      whatsappEnabled: false,
      instagramAutomation: false,
      tiktokAutomation: false,
      emailAutomation: false,
      ecommerceIntegration: false,
      bengaliAiResponses: false,
      orderManagementSystem: false,
      invoiceSystem: false,
      customTraining: false,
      vipOnboarding: false,
      customIntegrations: false,
      prioritySupportForever: false,
      lifetimeUpdates: false,
      allFutureFeaturesFree: false,
    },
  },

  // Free Trial - 24 hours with full access but NO platform SMS
  trial: {
    maxFacebookPages: 10, // Unlimited during trial
    maxWhatsappAccounts: 5,
    maxAutomationsPerMonth: null, // Unlimited during trial
    dailySmsLimit: 0, // Trial users cannot use Platform SMS
    platformSmsEnabled: false,
    features: {
      messageAutoReply: true,
      commentAutoReply: true,
      imageAutoReply: true,
      voiceAutoReply: true,
      deleteNegativeComments: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      businessAnalyticsDashboard: true,
      emailSupport: true,
      priorityEmailSupport: false,
      phoneSupport247: false,
      whatsappEnabled: true,
      instagramAutomation: true,
      tiktokAutomation: true,
      emailAutomation: true,
      ecommerceIntegration: true,
      bengaliAiResponses: true,
      orderManagementSystem: true,
      invoiceSystem: true,
      customTraining: false,
      vipOnboarding: false,
      customIntegrations: false,
      prioritySupportForever: false,
      lifetimeUpdates: false,
      allFutureFeaturesFree: false,
    },
  },

  // Starter - Basic plan (৳499/month) - 50 SMS/day
  starter: {
    maxFacebookPages: 1,
    maxWhatsappAccounts: 0,
    maxAutomationsPerMonth: null, // Unlimited per screenshot
    dailySmsLimit: 50, // 50 SMS per day
    platformSmsEnabled: true,
    features: {
      messageAutoReply: true,        // Auto SMS reply
      commentAutoReply: true,        // Auto reply to comments
      imageAutoReply: false,
      voiceAutoReply: false,
      basicAnalytics: true,          // Basic analytics
      advancedAnalytics: false,
      businessAnalyticsDashboard: true,  // Business analytics dashboard
      emailSupport: true,            // Email support
      priorityEmailSupport: false,
      phoneSupport247: false,
      whatsappEnabled: false,
      instagramAutomation: false,
      tiktokAutomation: false,
      emailAutomation: false,
      ecommerceIntegration: false,
      bengaliAiResponses: false,
      orderManagementSystem: false,
      invoiceSystem: false,
      customTraining: false,
      vipOnboarding: false,
      customIntegrations: false,
      prioritySupportForever: false,
      lifetimeUpdates: false,
      allFutureFeaturesFree: false,
      deleteNegativeComments: true,  // Delete bad/negative comments
    },
  },

  // Professional - Best value (৳6,999/month) - 200 SMS/day
  professional: {
    maxFacebookPages: 2,
    maxWhatsappAccounts: 1,
    maxAutomationsPerMonth: null, // Unlimited per screenshot
    dailySmsLimit: 200, // 200 SMS per day
    platformSmsEnabled: true,
    features: {
      messageAutoReply: true,        // Everything in Starter
      commentAutoReply: true,        // Auto reply to comments
      imageAutoReply: true,          // Image auto-reply
      voiceAutoReply: true,          // Voice message understanding & reply
      basicAnalytics: true,
      advancedAnalytics: true,       // Advanced analytics
      businessAnalyticsDashboard: true,
      emailSupport: true,
      priorityEmailSupport: true,    // Priority email support
      phoneSupport247: false,
      whatsappEnabled: true,         // 1 WhatsApp automation
      instagramAutomation: false,
      tiktokAutomation: false,
      emailAutomation: false,
      ecommerceIntegration: false,
      bengaliAiResponses: true,
      orderManagementSystem: false,
      invoiceSystem: false,
      customTraining: false,
      vipOnboarding: false,
      customIntegrations: false,
      prioritySupportForever: false,
      lifetimeUpdates: false,
      allFutureFeaturesFree: false,
      deleteNegativeComments: true,
    },
  },

  // Business - Ultimate (৳19,999/month) - 1000 SMS/day
  business: {
    maxFacebookPages: 2,             // 2 Facebook Pages per screenshot
    maxWhatsappAccounts: 1,          // 1 WhatsApp automation per screenshot
    maxAutomationsPerMonth: null,    // Unlimited
    dailySmsLimit: 1000, // 1000 SMS per day
    platformSmsEnabled: true,
    features: {
      messageAutoReply: true,        // Everything in Professional
      commentAutoReply: true,
      imageAutoReply: true,
      voiceAutoReply: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      businessAnalyticsDashboard: true,
      emailSupport: true,
      priorityEmailSupport: true,
      phoneSupport247: true,         // 24/7 Phone + Email support
      whatsappEnabled: true,         // 1 WhatsApp automation
      instagramAutomation: true,     // Instagram automation
      tiktokAutomation: true,        // TikTok automation
      emailAutomation: true,         // Email automation (Coming)
      ecommerceIntegration: true,    // E-commerce integration (Coming)
      bengaliAiResponses: true,
      orderManagementSystem: true,   // Order management system
      invoiceSystem: true,           // Invoice creation & sending
      customTraining: true,          // Custom training session
      vipOnboarding: false,
      customIntegrations: false,
      prioritySupportForever: false,
      lifetimeUpdates: false,
      allFutureFeaturesFree: false,
      deleteNegativeComments: true,
    },
  },

  // Lifetime - Everything forever - Unlimited SMS
  lifetime: {
    maxFacebookPages: 10, // High limit / effectively unlimited
    maxWhatsappAccounts: 5,
    maxAutomationsPerMonth: null, // Unlimited
    dailySmsLimit: -1, // -1 means unlimited
    platformSmsEnabled: true,
    features: {
      messageAutoReply: true,
      commentAutoReply: true,
      imageAutoReply: true,
      voiceAutoReply: true,
      deleteNegativeComments: true,
      basicAnalytics: true,
      advancedAnalytics: true,
      businessAnalyticsDashboard: true,
      emailSupport: true,
      priorityEmailSupport: true,
      phoneSupport247: true,
      whatsappEnabled: true,
      instagramAutomation: true,
      tiktokAutomation: true,
      emailAutomation: true,
      ecommerceIntegration: true,
      bengaliAiResponses: true,
      orderManagementSystem: true,
      invoiceSystem: true,
      customTraining: true,
      vipOnboarding: true,
      customIntegrations: true,
      prioritySupportForever: true,
      lifetimeUpdates: true,
      allFutureFeaturesFree: true,
    },
  },
};

// Helper to get capabilities for a plan
export function getPlanCapabilities(planId: string): PlanCapabilities {
  const normalizedPlan = planId.toLowerCase() as PlanId;
  return planCapabilities[normalizedPlan] || planCapabilities.none;
}

// Get display name for features
export const featureDisplayNames: Record<keyof PlanCapabilities["features"], string> = {
  messageAutoReply: "Auto SMS Reply",
  commentAutoReply: "Auto Reply to Comments",
  imageAutoReply: "Image Auto-Reply",
  voiceAutoReply: "Voice Message Understanding & Reply",
  deleteNegativeComments: "Delete Bad/Negative Comments",
  basicAnalytics: "Basic Analytics",
  advancedAnalytics: "Advanced Analytics",
  businessAnalyticsDashboard: "Business Analytics Dashboard",
  emailSupport: "Email Support",
  priorityEmailSupport: "Priority Email Support",
  phoneSupport247: "24/7 Phone + Email Support",
  whatsappEnabled: "WhatsApp Automation",
  instagramAutomation: "Instagram Automation",
  tiktokAutomation: "TikTok Automation",
  emailAutomation: "Email Automation",
  ecommerceIntegration: "E-commerce Integration",
  bengaliAiResponses: "Bengali AI Responses",
  orderManagementSystem: "Order Management System",
  invoiceSystem: "Invoice Creation & Sending",
  customTraining: "Custom Training Session",
  vipOnboarding: "VIP Onboarding",
  customIntegrations: "Custom Integrations",
  prioritySupportForever: "Priority Support Forever",
  lifetimeUpdates: "Lifetime Updates",
  allFutureFeaturesFree: "All Future Features Free",
};

// Get the next upgrade plan
export function getNextUpgradePlan(currentPlan: PlanId): PlanId | null {
  const upgradeOrder: PlanId[] = ["none", "trial", "starter", "professional", "business", "lifetime"];
  const currentIndex = upgradeOrder.indexOf(currentPlan);
  if (currentIndex === -1 || currentIndex >= upgradeOrder.length - 1) {
    return null;
  }
  // Skip trial when suggesting upgrades
  const nextIndex = currentPlan === "trial" ? 2 : currentIndex + 1;
  return upgradeOrder[nextIndex] || null;
}

// Get display name for plan
export const planDisplayNames: Record<PlanId, string> = {
  none: "No Plan",
  trial: "Free Trial",
  starter: "Starter",
  professional: "Professional",
  business: "Business",
  lifetime: "Lifetime",
};
