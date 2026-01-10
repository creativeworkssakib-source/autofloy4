// Site Settings Context - provides global company branding and contact info
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  id: string;
  company_name: string;
  tagline: string | null;
  about_us: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  support_email: string | null;
  billing_email: string | null;
  legal_contact_email: string | null;
  phone_number: string | null;
  company_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  website_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  copyright_text: string | null;
  // Platform SMS settings
  platform_sms_enabled: boolean | null;
  platform_sms_api_key: string | null;
  platform_sms_sender_id: string | null;
  platform_sms_provider: string | null;
  // SMS limits per plan (admin configurable)
  sms_limit_trial: number | null;
  sms_limit_starter: number | null;
  sms_limit_professional: number | null;
  sms_limit_business: number | null;
  sms_limit_lifetime: number | null;
  // Demo video settings
  demo_video_type: 'youtube' | 'upload' | null;
  demo_video_youtube_url: string | null;
  demo_video_upload_url: string | null;
  demo_video_enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

const defaultSettings: SiteSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  company_name: 'Company',
  tagline: 'AI-powered automation for your business',
  about_us: 'A SaaS tool for businesses that helps automate inbox replies, comments, and posting through Facebook and WhatsApp integration.',
  logo_url: null,
  favicon_url: null,
  support_email: 'support@company.com',
  billing_email: 'billing@company.com',
  legal_contact_email: 'legal@company.com',
  phone_number: '+1 234-567-8900',
  company_address: '123 Business Street',
  city: 'City',
  state: null,
  country: 'Country',
  postal_code: null,
  website_url: null,
  facebook_url: null,
  twitter_url: null,
  instagram_url: null,
  linkedin_url: null,
  youtube_url: null,
  copyright_text: '© {year} Company. All rights reserved.',
  // Platform SMS settings
  platform_sms_enabled: false,
  platform_sms_api_key: null,
  platform_sms_sender_id: null,
  platform_sms_provider: 'ssl_wireless',
  // SMS limits per plan (defaults)
  sms_limit_trial: 0,
  sms_limit_starter: 50,
  sms_limit_professional: 200,
  sms_limit_business: 1000,
  sms_limit_lifetime: -1, // -1 = unlimited
  // Demo video settings
  demo_video_type: 'youtube',
  demo_video_youtube_url: null,
  demo_video_upload_url: null,
  demo_video_enabled: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

// Cache settings in memory - reduced to 30 seconds for faster updates
let cachedSettings: SiteSettings | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds for faster admin updates

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings || defaultSettings);
  const [isLoading, setIsLoading] = useState(!cachedSettings);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    // Check cache validity
    if (cachedSettings && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setSettings(cachedSettings);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Use raw query since table might not be in types yet
      const { data, error: fetchError } = await supabase
        .from('site_settings' as any)
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.warn('Site settings table may not exist yet:', fetchError.message);
        setError(null); // Don't show error to user, just use defaults
        setSettings(defaultSettings);
      } else if (data) {
        const fetchedSettings = data as unknown as SiteSettings;
        cachedSettings = fetchedSettings;
        cacheTimestamp = Date.now();
        setSettings(fetchedSettings);
        setError(null);
      } else {
        // No data found, use defaults
        setSettings(defaultSettings);
      }
    } catch (err) {
      console.warn('Error in fetchSettings:', err);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async () => {
    cachedSettings = null;
    cacheTimestamp = null;
    await fetchSettings();
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Helper to format copyright text with current year
  const formattedSettings: SiteSettings = {
    ...settings,
    copyright_text: settings.copyright_text?.replace('{year}', new Date().getFullYear().toString()) || null,
  };

  return (
    <SiteSettingsContext.Provider value={{ settings: formattedSettings, isLoading, error, refetch }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);

  // If provider isn't mounted (or HMR duplicated modules), fall back to defaults
  // instead of crashing the whole app.
  if (context === undefined) {
    console.warn("useSiteSettings called without SiteSettingsProvider; falling back to default settings.");
    return {
      settings: defaultSettings,
      isLoading: false,
      error: null,
      refetch: async () => {},
    } as SiteSettingsContextType;
  }

  return context;
};

// Hook for admin to update settings
export const useUpdateSiteSettings = () => {
  const { refetch } = useSiteSettings();

  const updateSettings = async (updates: Partial<SiteSettings>) => {
    // Use edge function (this app does NOT use supabase-js auth on the client)
    const { updateSiteSettings } = await import('@/services/adminService');
    const { settings: updated } = await updateSiteSettings(updates as Record<string, unknown>);

    await refetch();
    return updated;
  };

  return { updateSettings };
};
