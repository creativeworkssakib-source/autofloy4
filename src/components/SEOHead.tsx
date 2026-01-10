import { useEffect } from 'react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  canonicalUrl?: string;
  noIndex?: boolean;
}

/**
 * SEOHead component - Updates document meta tags for SEO
 * Use this on each page for custom SEO settings
 */
const SEOHead = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonicalUrl,
  noIndex = false,
}: SEOHeadProps) => {
  const { settings, isLoading } = useSiteSettings();

  useEffect(() => {
    if (isLoading) return;

    // Helper to update or create meta tag
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Helper to update or create link tag
    const updateLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      
      link.href = href;
    };

    // Update title
    const pageTitle = title 
      ? `${title} | ${settings.company_name || 'AutoFloy'}`
      : settings.company_name || 'AutoFloy';
    document.title = pageTitle;

    // Update meta tags
    if (description) {
      updateMetaTag('description', description);
      updateMetaTag('og:description', description, true);
      updateMetaTag('twitter:description', description);
    }

    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // OG tags
    updateMetaTag('og:title', title || settings.company_name || 'AutoFloy', true);
    updateMetaTag('og:type', ogType, true);
    
    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
      updateMetaTag('twitter:image', ogImage);
    }

    // Twitter tags
    updateMetaTag('twitter:card', twitterCard);
    if (title) {
      updateMetaTag('twitter:title', title);
    }

    // Canonical URL
    if (canonicalUrl) {
      updateLinkTag('canonical', canonicalUrl);
    } else {
      // Use current URL as canonical
      updateLinkTag('canonical', window.location.href.split('?')[0]);
    }

    // Robots
    if (noIndex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }

    // Cleanup function
    return () => {
      // We don't remove tags on unmount to avoid flickering
      // They'll be updated by the next page's SEOHead
    };
  }, [title, description, keywords, ogImage, ogType, twitterCard, canonicalUrl, noIndex, settings, isLoading]);

  return null;
};

export default SEOHead;
