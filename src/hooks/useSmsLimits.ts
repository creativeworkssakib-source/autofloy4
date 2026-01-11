import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { PlanId } from '@/data/planCapabilities';

interface SmsUsageData {
  usedToday: number;
  dailyLimit: number;
  isUnlimited: boolean;
  platformSmsEnabled: boolean;
  canSendSms: boolean;
  remainingToday: number;
  planId: PlanId;
}

const SUPABASE_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co";

export const useSmsLimits = () => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [usageData, setUsageData] = useState<SmsUsageData>({
    usedToday: 0,
    dailyLimit: 0,
    isUnlimited: false,
    platformSmsEnabled: false,
    canSendSms: false,
    remainingToday: 0,
    planId: 'none',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsageData({
        usedToday: 0,
        dailyLimit: 0,
        isUnlimited: false,
        platformSmsEnabled: false,
        canSendSms: false,
        remainingToday: 0,
        planId: 'none',
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("autofloy_token");
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/offline-shop/sms-usage`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch SMS usage');
      }

      const data = await response.json();
      setUsageData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching SMS usage:', err);
      // Fallback: use plan capabilities from user context
      const plan = (user?.subscriptionPlan || 'none') as PlanId;
      const limitFromSettings = getSmsLimitFromSettings(plan, settings);
      
      setUsageData({
        usedToday: 0,
        dailyLimit: limitFromSettings,
        isUnlimited: limitFromSettings === -1,
        platformSmsEnabled: settings?.platform_sms_enabled || false,
        canSendSms: limitFromSettings !== 0 && (settings?.platform_sms_enabled || false),
        remainingToday: limitFromSettings === -1 ? Infinity : limitFromSettings,
        planId: plan,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, settings]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const refetch = useCallback(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { ...usageData, isLoading, error, refetch };
};

// Helper function to get SMS limit from settings based on plan
function getSmsLimitFromSettings(plan: PlanId, settings: any): number {
  if (!settings) return 0;
  
  switch (plan) {
    case 'trial':
    case 'none':
      return settings.sms_limit_trial ?? 0;
    case 'starter':
      return settings.sms_limit_starter ?? 50;
    case 'professional':
      return settings.sms_limit_professional ?? 200;
    case 'business':
      return settings.sms_limit_business ?? 1000;
    case 'lifetime':
      return settings.sms_limit_lifetime ?? -1;
    default:
      return 0;
  }
}

// Export helper for getting limit text
export const getSmsLimitText = (limit: number, language: string = 'en'): string => {
  if (limit === -1) {
    return language === 'bn' ? 'সীমাহীন' : 'Unlimited';
  }
  if (limit === 0) {
    return language === 'bn' ? 'উপলব্ধ নয়' : 'Not available';
  }
  return `${limit} SMS/${language === 'bn' ? 'দিন' : 'day'}`;
};
