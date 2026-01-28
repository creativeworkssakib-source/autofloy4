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
  Landmark,
  Bot,
  Handshake,
  Receipt,
  ShoppingCart,
  ScanLine,
  Calculator,
  CreditCard,
  Undo2,
  Target,
  Bell,
  Smartphone
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
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ y: -8 }}
      className={`group relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden card-professional ${
        variant === "compact" ? "p-5" : "p-6"
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
      
      {/* Premium Icon Container */}
      <motion.div 
        className={`${variant === "compact" ? "w-11 h-11 mb-3" : "w-14 h-14 mb-4"} rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center relative overflow-hidden shadow-lg icon-container-premium`}
        whileHover={{ scale: 1.1, rotate: 5, y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        {/* Inner shine */}
        <div className="premium-icon-shine" />
        {/* Top highlight */}
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl pointer-events-none" />
        {/* Bottom shadow */}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/15 to-transparent rounded-b-xl pointer-events-none" />
        
        <feature.icon className={`${variant === "compact" ? "w-5 h-5" : "w-6 h-6"} text-white relative z-10 drop-shadow-sm`} />
      </motion.div>
      
      {/* Content */}
      <h3 className={`${variant === "compact" ? "text-base mb-1.5" : "text-lg mb-2"} font-bold group-hover:text-primary transition-colors duration-300 relative z-10`}>
        {feature.title}
      </h3>
      <p className={`text-muted-foreground ${variant === "compact" ? "text-xs mb-2 line-clamp-2" : "text-sm mb-3 line-clamp-3"} relative z-10`}>
        {feature.description}
      </p>
      
      {/* Link */}
      <Link
        to={`/features/${feature.slug}`}
        className={`inline-flex items-center ${variant === "compact" ? "text-success-accessible text-xs" : "text-primary text-sm"} font-medium group/link relative z-10`}
        aria-label={`Learn more about ${feature.title}`}
      >
        <span>Learn More</span>
        <motion.span
          className="ml-1"
          initial={{ x: 0 }}
          whileHover={{ x: 5 }}
        >
          <ArrowRight className="w-3.5 h-3.5" />
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

  // Complete Online Business Features - 9 Features
  const onlineFeatures = useMemo(() => [
    {
      icon: MessageSquare,
      title: "AI Auto-Reply (Inbox & Comments)",
      description: "AI responds to customer messages in Bengali instantly with natural human-like conversation. Never miss a sale - even at 3 AM. Handles inquiries, shares prices, and guides customers to purchase.",
      gradient: "from-primary to-primary-glow",
      slug: "message-auto-reply",
    },
    {
      icon: Image,
      title: "Smart Image Recognition",
      description: "Customers send product images? AI identifies and prices them automatically from your catalog. No manual lookup needed - instant product matching with 95%+ accuracy.",
      gradient: "from-secondary to-primary",
      slug: "image-recognition",
    },
    {
      icon: Mic,
      title: "Voice Message Processing",
      description: "We transcribe and respond to voice messages automatically in seconds. Bengali voice messages converted to text, understood, and answered - saving hours of listening time.",
      gradient: "from-accent to-secondary",
      slug: "voice-support",
    },
    {
      icon: Shield,
      title: "Comment Moderation & Auto-Reply",
      description: "Spam detection, auto-delete bad comments, ban abusive users instantly. Plus auto-reply to product inquiries in comments to convert browsers into buyers.",
      gradient: "from-success to-primary",
      slug: "comment-management",
    },
    {
      icon: FileText,
      title: "Auto-Invoice Generation",
      description: "Generate professional invoices automatically after every order confirmation. Branded templates, sequential numbering, instant delivery via Messenger - zero manual work.",
      gradient: "from-primary to-accent",
      slug: "auto-invoice",
    },
    {
      icon: Clock,
      title: "24/7 AI Customer Support",
      description: "Your shop never sleeps. AI responds to customers anytime - day or night. Handle multiple conversations simultaneously while you focus on growing your business.",
      gradient: "from-secondary to-success",
      slug: "247-support",
    },
    {
      icon: Bot,
      title: "AI Sales Agent",
      description: "Not just auto-reply - a complete AI sales representative. Uses 10+ persuasion techniques, handles objections, creates urgency, and closes deals like your best salesperson.",
      gradient: "from-primary to-secondary",
      slug: "message-auto-reply",
    },
    {
      icon: Handshake,
      title: "AI Bargaining Power",
      description: "Let AI negotiate prices intelligently! Set your minimum acceptable discount and watch AI handle price negotiations professionally - protecting your margins while closing more deals.",
      gradient: "from-accent to-primary",
      slug: "message-auto-reply",
    },
    {
      icon: ShoppingCart,
      title: "Automatic Order Taking",
      description: "AI collects customer details (name, phone, address) conversationally and creates orders automatically. Complete order management without lifting a finger.",
      gradient: "from-success to-secondary",
      slug: "auto-invoice",
    },
  ], []);

  // Complete Offline Shop Features - 12 Features
  const offlineFeatures = useMemo(() => [
    {
      icon: Store,
      title: "Complete POS System",
      description: "Full Point of Sale with inventory, sales, and expense tracking. Works offline - sync when connected.",
      gradient: "from-primary to-secondary",
      slug: "offline-shop-management",
    },
    {
      icon: Package,
      title: "Inventory Control",
      description: "Track stock levels, expiry dates, batch numbers, and get automatic low stock alerts. Never run out of bestsellers.",
      gradient: "from-accent to-primary",
      slug: "inventory-management",
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Build customer relationships with due tracking, purchase history, and SMS reminders for collections.",
      gradient: "from-success to-secondary",
      slug: "customer-management",
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description: "Sales, profit, expense reports with charts. Export to Excel. Make data-driven business decisions.",
      gradient: "from-primary to-success",
      slug: "reports-analytics",
    },
    {
      icon: Wallet,
      title: "Expense & Cash Register",
      description: "Track expenses by category, manage cash flow, daily closing reports. Know where every taka goes.",
      gradient: "from-secondary to-accent",
      slug: "expense-cash-management",
    },
    {
      icon: RefreshCw,
      title: "Online-Offline Sync",
      description: "Unify inventory across online and offline sales. Prevent overselling with real-time stock sync.",
      gradient: "from-success to-primary",
      slug: "online-offline-sync",
    },
    {
      icon: Truck,
      title: "Supplier & Purchase",
      description: "Track supplier purchases, dues, and payment history. Manage credit relationships professionally.",
      gradient: "from-accent to-success",
      slug: "supplier-management",
    },
    {
      icon: Landmark,
      title: "Loan Management",
      description: "Track business loans with installments and payment reminders. Never miss a payment deadline.",
      gradient: "from-primary to-accent",
      slug: "loan-management",
    },
    {
      icon: ScanLine,
      title: "Barcode Scanner",
      description: "Scan product barcodes for instant checkout. Print custom barcodes for your products.",
      gradient: "from-secondary to-primary",
      slug: "offline-shop-management",
    },
    {
      icon: Calculator,
      title: "Price Calculator",
      description: "Calculate selling prices with profit margins. Set markup percentages for consistent pricing.",
      gradient: "from-success to-accent",
      slug: "offline-shop-management",
    },
    {
      icon: Undo2,
      title: "Returns & Adjustments",
      description: "Handle customer returns, damaged stock, and inventory adjustments with full audit trail.",
      gradient: "from-primary to-success",
      slug: "offline-shop-management",
    },
    {
      icon: Receipt,
      title: "Thermal Printing",
      description: "Print professional receipts on thermal printers. Customizable templates with your shop branding.",
      gradient: "from-accent to-secondary",
      slug: "offline-shop-management",
    },
  ], []);

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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/15 to-secondary/10 text-primary-accessible text-sm font-semibold mb-4 border border-primary/20 shadow-sm"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-lg">🚀</span> Complete Business Solution
          </motion.span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Every Feature You Need{" "}
            <span className="gradient-text">In One Platform</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            21+ powerful features for both online automation and offline shop management. 
            From AI sales agents to complete POS system - everything to run your business efficiently.
          </p>
        </motion.div>

        {/* Online Business Features */}
        <div className="mb-16">
          <motion.h3 
            className="text-xl md:text-2xl font-bold mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.2 }}
          >
            <motion.span 
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-secondary/15 to-primary/10 text-secondary border border-secondary/20 shadow-sm"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-md relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-lg pointer-events-none" />
                <MessageSquare className="w-4 h-4 text-white relative z-10" />
              </div>
              <span className="font-semibold">Online Business Automation (9 Features)</span>
            </motion.span>
          </motion.h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {onlineFeatures.map((feature, index) => (
              <FeatureCard key={`${feature.slug}-${index}`} feature={feature} index={index} />
            ))}
          </div>
        </div>

        {/* Offline Shop Features */}
        <div>
          <motion.h3 
            className="text-xl md:text-2xl font-bold mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4 }}
          >
            <motion.span 
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-success/15 to-primary/10 text-success-accessible border border-success/20 shadow-sm"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-success to-primary flex items-center justify-center shadow-md relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-lg pointer-events-none" />
                <Store className="w-4 h-4 text-white relative z-10" />
              </div>
              <span className="font-semibold">Offline Shop Management (12 Features)</span>
            </motion.span>
          </motion.h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {offlineFeatures.map((feature, index) => (
              <FeatureCard key={`${feature.slug}-${index}`} feature={feature} index={index + 9} variant="compact" />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
});

FeaturesSection.displayName = "FeaturesSection";

export default FeaturesSection;
