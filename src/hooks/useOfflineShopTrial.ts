import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface OfflineTrialStatus {
  isTrialUser: boolean;
  hasOfflineAccess: boolean;
  isOfflineTrialActive: boolean;
  isOfflineTrialExpired: boolean;
  trialEndDate: Date | null;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  startOfflineTrial: () => void;
}

/**
 * Simplified trial hook - checks subscription plan only
 * All data is live from Supabase, no local trial tracking
 */
export function useOfflineShopTrial(): OfflineTrialStatus {
  const { user } = useAuth();

  // Check if user is on trial plan
  const isTrialUser = useMemo(() => {
    if (!user) return false;
    return user.subscriptionPlan === "trial" || user.subscriptionPlan === "free-trial";
  }, [user]);

  // Paid users have full access
  const isPaidUser = useMemo(() => {
    if (!user) return false;
    const paidPlans = ["starter", "professional", "business", "lifetime"];
    return paidPlans.includes(user.subscriptionPlan);
  }, [user]);

  // Has access if paid or trial
  const hasAccess = isPaidUser || isTrialUser;

  return {
    isTrialUser,
    hasOfflineAccess: hasAccess,
    isOfflineTrialActive: isTrialUser,
    isOfflineTrialExpired: false,
    trialEndDate: user?.trialEndDate ? new Date(user.trialEndDate) : null,
    daysRemaining: isPaidUser ? 999 : 7,
    hoursRemaining: 0,
    minutesRemaining: 0,
    startOfflineTrial: () => {}, // No-op - trial is managed server-side
  };
}

/**
 * Simple check - always returns false since we don't track offline time
 */
export function useOfflineExpired(): boolean {
  return false;
}

/**
 * Simple grace period hook - always has full access
 */
export function useOfflineGracePeriod(): {
  daysRemaining: number;
  isExpired: boolean;
  totalDays: number;
} {
  return {
    daysRemaining: 7,
    isExpired: false,
    totalDays: 7,
  };
}
