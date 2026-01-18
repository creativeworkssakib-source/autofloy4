import { Link } from "react-router-dom";
import { memo, useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
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
  ArrowRight,
  Wallet,
  RefreshCw,
  Truck,
  Landmark
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const FeatureCard = memo(({ 
  feature, 
  index, 
  variant = "default" 
}: { 
  feature: any; 
  index: number;
  variant?: "default" | "compact";
}) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ y: -8 }}
      className={`group relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden ${
        variant === "compact" ? "p-6" : "p-8"
      }`}
    >
      {/* Hover Gradient Overlay */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      />
      
      {/* Shimmer Effect on Hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
        <div className="absolute inset-0 animate-shimmer" />
      </div>
      
      {/* Icon */}
      <motion.div 
        className={`${variant === "compact" ? "w-12 h-12 mb-4" : "w-14 h-14 mb-6"} rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center relative overflow-hidden`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <feature.icon className={`${variant === "compact" ? "w-6 h-6" : "w-7 h-7"} text-primary-foreground relative z-10`} />
        <motion.div 
          className="absolute inset-0 bg-white/20"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
      
      {/* Content */}
      <h3 className={`${variant === "compact" ? "text-lg mb-2" : "text-xl mb-3"} font-bold group-hover:text-primary transition-colors duration-300 relative z-10`}>
        {feature.title}
      </h3>
      <p className={`text-muted-foreground ${variant === "compact" ? "text-sm mb-3" : "mb-4"} relative z-10`}>
        {feature.description}
      </p>
      
      {/* Link */}
      <Link
        to={`/features/${feature.slug}`}
        className={`inline-flex items-center ${variant === "compact" ? "text-success-accessible" : "text-primary"} font-medium text-sm group/link relative z-10`}
        aria-label={`Learn more about ${feature.title}`}
      >
        <span>Learn More</span>
        <motion.span
          className="ml-1"
          initial={{ x: 0 }}
          whileHover={{ x: 5 }}
        >
          <ArrowRight className="w-4 h-4" />
        </motion.span>
      </Link>
      
      {/* Border Glow on Hover */}
      <motion.div 
        className={`absolute inset-0 rounded-2xl border-2 ${variant === "compact" ? "border-success/30" : "border-primary/30"} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />
    </motion.div>
  );
});

FeatureCard.displayName = "FeatureCard";

const FeaturesSection = memo(() => {
  const { t } = useLanguage();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

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
    {
      icon: Wallet,
      title: t("features.expense.title"),
      description: t("features.expense.desc"),
      gradient: "from-secondary to-accent",
      slug: "expense-cash-management",
    },
    {
      icon: RefreshCw,
      title: t("features.sync.title"),
      description: t("features.sync.desc"),
      gradient: "from-success to-primary",
      slug: "online-offline-sync",
    },
    {
      icon: Truck,
      title: t("features.suppliers.title"),
      description: t("features.suppliers.desc"),
      gradient: "from-accent to-success",
      slug: "supplier-management",
    },
    {
      icon: Landmark,
      title: t("features.loans.title"),
      description: t("features.loans.desc"),
      gradient: "from-primary to-accent",
      slug: "loan-management",
    },
  ], [t]);

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  return (
    <section id="features" ref={sectionRef} className="py-16 lg:py-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-muted/30" />
      <motion.div 
        className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        animate={{ 
          x: [0, 50, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
        animate={{ 
          x: [0, -50, 0],
          y: [0, -30, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          variants={headerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.span 
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary-accessible text-sm font-medium mb-4"
            whileHover={{ scale: 1.05 }}
          >
            {t("features.badge")}
          </motion.span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {t("features.title1")}{" "}
            <span className="gradient-text">{t("features.title2")}</span>
          </h2>
          <p className="text-lg text-muted-foreground">{t("features.subtitle")}</p>
        </motion.div>

        {/* Online Business Features */}
        <div className="mb-12">
          <motion.h3 
            className="text-xl md:text-2xl font-bold mb-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
          >
            <motion.span 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary"
              whileHover={{ scale: 1.05 }}
            >
              <MessageSquare className="w-5 h-5" />
              {t("features.onlineBusiness")}
            </motion.span>
          </motion.h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {onlineFeatures.map((feature, index) => (
              <FeatureCard key={feature.slug} feature={feature} index={index} />
            ))}
          </div>
        </div>

        {/* Offline Shop Features */}
        <div>
          <motion.h3 
            className="text-xl md:text-2xl font-bold mb-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4 }}
          >
            <motion.span 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success-accessible"
              whileHover={{ scale: 1.05 }}
            >
              <Store className="w-5 h-5" />
              {t("features.offlineShopBusiness")}
            </motion.span>
          </motion.h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {offlineFeatures.map((feature, index) => (
              <FeatureCard key={feature.slug} feature={feature} index={index + 6} variant="compact" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

FeaturesSection.displayName = "FeaturesSection";

export default FeaturesSection;