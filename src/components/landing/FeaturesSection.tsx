import { Link } from "react-router-dom";
import { memo, useMemo } from "react";
import { 
  MessageSquare, 
  Image, 
  Mic, 
  Shield, 
  FileText, 
  Clock,
  Store,
  Package,
  Users,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FeaturesSection = memo(() => {
  const { t } = useLanguage();

  const onlineFeatures = useMemo(() => [
    {
      icon: MessageSquare,
      title: t("features.messageReply.title"),
      description: t("features.messageReply.desc"),
      gradient: "from-primary to-primary-glow",
      slug: "message-auto-reply",
    },
    {
      icon: Image,
      title: t("features.imageRecognition.title"),
      description: t("features.imageRecognition.desc"),
      gradient: "from-secondary to-primary",
      slug: "image-recognition",
    },
    {
      icon: Mic,
      title: t("features.voiceSupport.title"),
      description: t("features.voiceSupport.desc"),
      gradient: "from-accent to-secondary",
      slug: "voice-support",
    },
    {
      icon: Shield,
      title: t("features.commentManagement.title"),
      description: t("features.commentManagement.desc"),
      gradient: "from-success to-primary",
      slug: "comment-management",
    },
    {
      icon: FileText,
      title: t("features.autoInvoice.title"),
      description: t("features.autoInvoice.desc"),
      gradient: "from-primary to-accent",
      slug: "auto-invoice",
    },
    {
      icon: Clock,
      title: t("features.support247.title"),
      description: t("features.support247.desc"),
      gradient: "from-secondary to-success",
      slug: "247-support",
    },
  ], [t]);

  const offlineFeatures = useMemo(() => [
    {
      icon: Store,
      title: t("features.offlineShop.title"),
      description: t("features.offlineShop.desc"),
      gradient: "from-primary to-secondary",
      slug: "offline-shop-management",
    },
    {
      icon: Package,
      title: t("features.inventory.title"),
      description: t("features.inventory.desc"),
      gradient: "from-accent to-primary",
      slug: "inventory-management",
    },
    {
      icon: Users,
      title: t("features.customers.title"),
      description: t("features.customers.desc"),
      gradient: "from-success to-secondary",
      slug: "customer-management",
    },
    {
      icon: BarChart3,
      title: t("features.reports.title"),
      description: t("features.reports.desc"),
      gradient: "from-primary to-success",
      slug: "reports-analytics",
    },
  ], [t]);

  return (
    <section id="features" className="py-16 lg:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-muted/30" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t("features.badge")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {t("features.title1")}{" "}
            <span className="gradient-text">{t("features.title2")}</span>
          </h2>
          <p className="text-lg text-muted-foreground">{t("features.subtitle")}</p>
        </div>

        {/* Online Business Features */}
        <div className="mb-12">
          <h3 className="text-xl md:text-2xl font-bold mb-6 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary">
              <MessageSquare className="w-5 h-5" />
              {t("features.onlineBusiness")}
            </span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {onlineFeatures.map((feature) => (
              <div
                key={feature.slug}
                className="group relative bg-card/80 backdrop-blur-sm rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-colors h-full"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-4">{feature.description}</p>
                <Link
                  to={`/features/${feature.slug}`}
                  className="inline-flex items-center text-primary font-medium text-sm group/link"
                  aria-label={`${t("features.learnMore")} ${feature.title}`}
                >
                  <span>{t("features.learnMore")}</span>
                  <span className="sr-only"> {feature.title}</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Offline Shop Features */}
        <div>
          <h3 className="text-xl md:text-2xl font-bold mb-6 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success">
              <Store className="w-5 h-5" />
              {t("features.offlineShopBusiness")}
            </span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {offlineFeatures.map((feature) => (
              <div
                key={feature.slug}
                className="group relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-success/30 transition-colors h-full"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-success transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-3">{feature.description}</p>
                <Link
                  to={`/features/${feature.slug}`}
                  className="inline-flex items-center text-success font-medium text-sm group/link"
                  aria-label={`${t("features.learnMore")} ${feature.title}`}
                >
                  <span>{t("features.learnMore")}</span>
                  <span className="sr-only"> {feature.title}</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

FeaturesSection.displayName = "FeaturesSection";

export default FeaturesSection;