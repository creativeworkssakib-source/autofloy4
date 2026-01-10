import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppearanceSettings {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  success_color?: string;
  warning_color?: string;
  destructive_color?: string;
  heading_font?: string;
  body_font?: string;
  custom_css?: string;
}

/**
 * Component that injects dynamic appearance settings (colors, fonts, custom CSS)
 * from the database into the document.
 */
export const DynamicAppearance = () => {
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);

  useEffect(() => {
    const fetchAppearance = async () => {
      try {
        const { data } = await supabase
          .from('appearance_settings' as any)
          .select('*')
          .limit(1)
          .maybeSingle();

        if (data) {
          setSettings(data as unknown as AppearanceSettings);
        }
      } catch (error) {
        console.warn('Could not fetch appearance settings:', error);
      }
    };

    fetchAppearance();
  }, []);

  useEffect(() => {
    if (!settings) return;

    // Create or update style element for dynamic theme
    let styleEl = document.getElementById('dynamic-appearance-styles') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-appearance-styles';
      document.head.appendChild(styleEl);
    }

    // Build CSS variables
    const cssVariables: string[] = [];

    if (settings.primary_color) {
      cssVariables.push(`--primary: ${settings.primary_color};`);
    }
    if (settings.secondary_color) {
      cssVariables.push(`--secondary: ${settings.secondary_color};`);
    }
    if (settings.accent_color) {
      cssVariables.push(`--accent: ${settings.accent_color};`);
    }
    if (settings.success_color) {
      cssVariables.push(`--success: ${settings.success_color};`);
    }
    if (settings.warning_color) {
      cssVariables.push(`--warning: ${settings.warning_color};`);
    }
    if (settings.destructive_color) {
      cssVariables.push(`--destructive: ${settings.destructive_color};`);
    }

    // Build font family rules
    let fontRules = '';
    if (settings.heading_font) {
      fontRules += `
        h1, h2, h3, h4, h5, h6 {
          font-family: "${settings.heading_font}", sans-serif !important;
        }
      `;
    }
    if (settings.body_font) {
      fontRules += `
        body {
          font-family: "${settings.body_font}", sans-serif !important;
        }
      `;
      // Load font from Google Fonts if needed
      const fontLink = document.getElementById('dynamic-font-link') as HTMLLinkElement;
      if (!fontLink && (settings.heading_font || settings.body_font)) {
        const fonts = [settings.heading_font, settings.body_font]
          .filter(Boolean)
          .map(f => f?.replace(/ /g, '+'))
          .join('|');
        
        const link = document.createElement('link');
        link.id = 'dynamic-font-link';
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fonts}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }

    // Combine all styles
    let cssContent = '';
    
    if (cssVariables.length > 0) {
      cssContent += `:root {\n  ${cssVariables.join('\n  ')}\n}\n`;
    }

    cssContent += fontRules;

    // Add custom CSS
    if (settings.custom_css) {
      cssContent += `\n/* Custom CSS */\n${settings.custom_css}`;
    }

    styleEl.textContent = cssContent;

    // Cleanup on unmount
    return () => {
      // We don't remove on unmount to avoid flashing
    };
  }, [settings]);

  return null;
};

export default DynamicAppearance;
