import { useEffect, useState } from 'react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';

interface SEOData {
  default_title?: string;
  default_description?: string;
  default_keywords?: string;
  og_image_url?: string;
  google_verification_code?: string;
  bing_verification_code?: string;
  custom_head_scripts?: string;
  google_analytics_id?: string;
  google_tag_manager_id?: string;
  facebook_pixel_id?: string;
}

/**
 * Component that dynamically updates the document title, meta tags,
 * verification codes, and analytics scripts based on site settings.
 */
export const DynamicDocumentTitle = () => {
  const { settings, isLoading } = useSiteSettings();
  const [seoData, setSeoData] = useState<SEOData>({});

  // Fetch SEO settings
  useEffect(() => {
    const fetchSEO = async () => {
      try {
        const { data } = await supabase
          .from('seo_settings' as any)
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (data) {
          setSeoData(data as unknown as SEOData);
        }
      } catch (error) {
        console.warn('Could not fetch SEO settings:', error);
      }
    };
    
    fetchSEO();
  }, []);

  useEffect(() => {
    if (!isLoading && settings.company_name) {
      // Update document title
      const baseTitle = seoData.default_title || 
        `${settings.company_name} - ${settings.tagline || 'AI-powered automation for your business'}`;
      document.title = baseTitle;

      // Helper to update or create meta tag
      const updateMetaTag = (name: string, content: string, isProperty = false) => {
        if (!content) return;
        const attr = isProperty ? 'property' : 'name';
        let meta = document.querySelector(`meta[${attr}="${name}"]`);
        
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute(attr, name);
          document.head.appendChild(meta);
        }
        
        meta.setAttribute('content', content);
      };

      // Update meta description
      const description = seoData.default_description || 
        `${settings.tagline || 'AI-powered automation for your business'}. Auto-reply to messages, recognize product images, manage comments - 24 hours free, no credit card needed.`;
      updateMetaTag('description', description);
      updateMetaTag('og:description', description, true);
      updateMetaTag('twitter:description', description);

      // Update keywords
      if (seoData.default_keywords) {
        updateMetaTag('keywords', seoData.default_keywords);
      }

      // Update OG image
      if (seoData.og_image_url) {
        updateMetaTag('og:image', seoData.og_image_url, true);
        updateMetaTag('twitter:image', seoData.og_image_url);
      }

      // Update OG title
      updateMetaTag('og:title', baseTitle, true);
      updateMetaTag('twitter:title', baseTitle);

      // Update author meta
      updateMetaTag('author', settings.company_name);

      // Update Twitter site if available
      if (settings.twitter_url) {
        const twitterHandle = settings.twitter_url.split('/').pop();
        if (twitterHandle) {
          updateMetaTag('twitter:site', `@${twitterHandle}`);
        }
      }

      // Add Google Search Console verification
      if (seoData.google_verification_code) {
        updateMetaTag('google-site-verification', seoData.google_verification_code);
      }

      // Add Bing Webmaster verification
      if (seoData.bing_verification_code) {
        updateMetaTag('msvalidate.01', seoData.bing_verification_code);
      }

      // Inject Google Analytics
      if (seoData.google_analytics_id && !document.getElementById('ga-script')) {
        const gaScript = document.createElement('script');
        gaScript.id = 'ga-script';
        gaScript.async = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${seoData.google_analytics_id}`;
        document.head.appendChild(gaScript);

        const gaInit = document.createElement('script');
        gaInit.id = 'ga-init';
        gaInit.textContent = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${seoData.google_analytics_id}');
        `;
        document.head.appendChild(gaInit);
      }

      // Inject Google Tag Manager
      if (seoData.google_tag_manager_id && !document.getElementById('gtm-script')) {
        const gtmScript = document.createElement('script');
        gtmScript.id = 'gtm-script';
        gtmScript.textContent = `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${seoData.google_tag_manager_id}');
        `;
        document.head.appendChild(gtmScript);
      }

      // Inject Facebook Pixel
      if (seoData.facebook_pixel_id && !document.getElementById('fb-pixel')) {
        const fbPixel = document.createElement('script');
        fbPixel.id = 'fb-pixel';
        fbPixel.textContent = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${seoData.facebook_pixel_id}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(fbPixel);
      }

      // Inject custom head scripts
      if (seoData.custom_head_scripts && !document.getElementById('custom-head-scripts')) {
        const customScript = document.createElement('div');
        customScript.id = 'custom-head-scripts';
        customScript.innerHTML = seoData.custom_head_scripts;
        // Move script contents to head
        Array.from(customScript.children).forEach(child => {
          document.head.appendChild(child.cloneNode(true));
        });
      }
    }
  }, [settings, isLoading, seoData]);

  return null;
};
