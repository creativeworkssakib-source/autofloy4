import { useEffect } from 'react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

interface OrganizationSchema {
  type: 'Organization';
  name?: string;
  url?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  socialLinks?: string[];
}

interface WebsiteSchema {
  type: 'WebSite';
  name?: string;
  url?: string;
  searchUrl?: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchema {
  type: 'BreadcrumbList';
  items: BreadcrumbItem[];
}

interface BlogPostSchema {
  type: 'BlogPosting';
  title: string;
  description?: string;
  image?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  url?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchema {
  type: 'FAQPage';
  items: FAQItem[];
}

type SchemaType = OrganizationSchema | WebsiteSchema | BreadcrumbSchema | BlogPostSchema | FAQSchema;

interface StructuredDataProps {
  schema: SchemaType | SchemaType[];
}

const SITE_URL = 'https://autofloy.com';

/**
 * StructuredData component - Injects JSON-LD structured data for SEO
 */
const StructuredData = ({ schema }: StructuredDataProps) => {
  const { settings } = useSiteSettings();

  useEffect(() => {
    const schemas = Array.isArray(schema) ? schema : [schema];
    const scriptId = 'structured-data-' + schemas.map(s => s.type).join('-');
    
    // Remove existing script with same ID
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.remove();
    }

    const jsonLd = schemas.map(s => {
      switch (s.type) {
        case 'Organization':
          return {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: s.name || settings.company_name || 'AutoFloy',
            url: s.url || SITE_URL,
            logo: s.logo || `${SITE_URL}/og-image.png`,
            email: s.email || settings.support_email,
            telephone: s.phone || settings.phone_number,
            address: s.address ? {
              '@type': 'PostalAddress',
              streetAddress: s.address,
            } : undefined,
            sameAs: s.socialLinks || [
              settings.facebook_url,
              settings.twitter_url,
              settings.linkedin_url,
              settings.youtube_url,
            ].filter(Boolean),
          };

        case 'WebSite':
          return {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: s.name || settings.company_name || 'AutoFloy',
            url: s.url || SITE_URL,
            potentialAction: s.searchUrl ? {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: s.searchUrl,
              },
              'query-input': 'required name=search_term_string',
            } : undefined,
          };

        case 'BreadcrumbList':
          return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: s.items.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
            })),
          };

        case 'BlogPosting':
          return {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: s.title,
            description: s.description,
            image: s.image,
            author: {
              '@type': 'Person',
              name: s.author || 'AutoFloy Team',
            },
            publisher: {
              '@type': 'Organization',
              name: settings.company_name || 'AutoFloy',
              logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/og-image.png`,
              },
            },
            datePublished: s.datePublished,
            dateModified: s.dateModified || s.datePublished,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': s.url || window.location.href,
            },
          };

        case 'FAQPage':
          return {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: s.items.map(item => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          };

        default:
          return null;
      }
    }).filter(Boolean);

    // Create and inject script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [schema, settings]);

  return null;
};

export default StructuredData;
