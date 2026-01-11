import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays, differenceInHours, differenceInMinutes, addDays, parseISO, isPast } from "date-fns";
import { useOnlineStatus } from "./useOnlineStatus";

const OFFLINE_TRIAL_KEY = "autofloy_offline_trial_start";
const OFFLINE_TRIAL_DAYS = 7;
const OFFLINE_GRACE_PERIOD_DAYS = 7;

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

export function useOfflineShopTrial(): OfflineTrialStatus {
  const { user } = useAuth();
  const [trialStartDate, setTrialStartDate] = useState<string | null>(null);

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

  // Load trial start date from localStorage
  useEffect(() => {
    if (user && isTrialUser) {
      const storedStart = localStorage.getItem(`${OFFLINE_TRIAL_KEY}_${user.id}`);
      setTrialStartDate(storedStart);
    }
  }, [user, isTrialUser]);

  // Calculate trial status
  const trialStatus = useMemo(() => {
    // Paid users always have access
    if (isPaidUser) {
      return {
        isOfflineTrialActive: false,
        isOfflineTrialExpired: false,
        trialEndDate: null,
        daysRemaining: 999,
        hoursRemaining: 0,
        minutesRemaining: 0,
      };
    }

    // Trial users - check offline trial
    if (isTrialUser && trialStartDate) {
      const startDate = parseISO(trialStartDate);
      const endDate = addDays(startDate, OFFLINE_TRIAL_DAYS);
      const now = new Date();

      if (isPast(endDate)) {
        return {
          isOfflineTrialActive: false,
          isOfflineTrialExpired: true,
          trialEndDate: endDate,
          daysRemaining: 0,
          hoursRemaining: 0,
          minutesRemaining: 0,
        };
      }

      const daysRemaining = differenceInDays(endDate, now);
      const hoursRemaining = differenceInHours(endDate, now) % 24;
      const minutesRemaining = differenceInMinutes(endDate, now) % 60;

      return {
        isOfflineTrialActive: true,
        isOfflineTrialExpired: false,
        trialEndDate: endDate,
        daysRemaining,
        hoursRemaining,
        minutesRemaining,
      };
    }

    // Trial user but haven't started offline trial yet
    if (isTrialUser && !trialStartDate) {
      return {
        isOfflineTrialActive: false,
        isOfflineTrialExpired: false,
        trialEndDate: null,
        daysRemaining: OFFLINE_TRIAL_DAYS,
        hoursRemaining: 0,
        minutesRemaining: 0,
      };
    }

    // No user or unknown state
    return {
      isOfflineTrialActive: false,
      isOfflineTrialExpired: false,
      trialEndDate: null,
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
    };
  }, [isPaidUser, isTrialUser, trialStartDate]);

  // Function to start the offline trial
  const startOfflineTrial = () => {
    if (user && isTrialUser && !trialStartDate) {
      const now = new Date().toISOString();
      localStorage.setItem(`${OFFLINE_TRIAL_KEY}_${user.id}`, now);
      setTrialStartDate(now);
    }
  };

  // Determine if user has access to offline shop
  const hasOfflineAccess = useMemo(() => {
    if (isPaidUser) return true;
    if (isTrialUser) {
      // If trial hasn't started, they can start it (grant access)
      if (!trialStartDate) return true;
      // If trial is active, grant access
      return trialStatus.isOfflineTrialActive;
    }
    return false;
  }, [isPaidUser, isTrialUser, trialStartDate, trialStatus.isOfflineTrialActive]);

  return {
    isTrialUser,
    hasOfflineAccess,
    isOfflineTrialActive: trialStatus.isOfflineTrialActive,
    isOfflineTrialExpired: trialStatus.isOfflineTrialExpired,
    trialEndDate: trialStatus.trialEndDate,
    daysRemaining: trialStatus.daysRemaining,
    hoursRemaining: trialStatus.hoursRemaining,
    minutesRemaining: trialStatus.minutesRemaining,
    startOfflineTrial,
  };
}

/**
 * Simple hook to check if offline mode is expired (7+ days offline)
 */
export function useOfflineExpired(): boolean {
  const { hasBeenOfflineForDays } = useOnlineStatus();
  return hasBeenOfflineForDays(OFFLINE_GRACE_PERIOD_DAYS);
}

/**
 * Hook to get days remaining in offline grace period
 */
export function useOfflineGracePeriod(): {
  daysRemaining: number;
  isExpired: boolean;
  totalDays: number;
} {
  const { lastOnlineAt, isOnline } = useOnlineStatus();
  
  const daysRemaining = useMemo(() => {
    if (isOnline) return OFFLINE_GRACE_PERIOD_DAYS;
    if (!lastOnlineAt) return OFFLINE_GRACE_PERIOD_DAYS;
    
    const daysSinceOnline = Math.floor(
      (Date.now() - lastOnlineAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return Math.max(0, OFFLINE_GRACE_PERIOD_DAYS - daysSinceOnline);
  }, [lastOnlineAt, isOnline]);
  
  return {
    daysRemaining,
    isExpired: daysRemaining === 0 && !isOnline,
    totalDays: OFFLINE_GRACE_PERIOD_DAYS,
  };
}
