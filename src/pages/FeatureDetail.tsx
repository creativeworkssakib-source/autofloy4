import { useParams, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FeatureDetailLayout from "@/components/features/FeatureDetailLayout";
import { getFeatureBySlug } from "@/data/featuresDetails";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

const FeatureDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const feature = slug ? getFeatureBySlug(slug) : undefined;
  const { settings } = useSiteSettings();

  // Update document title and meta description for SEO
  useEffect(() => {
    if (feature) {
      document.title = `${feature.title} | ${settings.company_name}`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', feature.subtitle);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = feature.subtitle;
        document.head.appendChild(meta);
      }
    }

    return () => {
      document.title = settings.company_name;
    };
  }, [feature, settings.company_name]);

  if (!feature) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16">
        <FeatureDetailLayout feature={feature} />
      </main>
      <Footer />
    </div>
  );
};

export default FeatureDetail;
