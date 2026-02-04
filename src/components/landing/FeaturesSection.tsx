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
  Undo2,
  Rocket
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
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ y: -10, scale: 1.02 }}
      className={`group relative bg-card/90 backdrop-blur-xl rounded-2xl border border-border/40 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ${
        variant === "compact" ? "p-5" : "p-6"
      }`}
    >
      {/* Animated Gradient Border */}
      <motion.div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--secondary) / 0.1) 100%)'
        }}
      />
      
      {/* Premium Shimmer Effect */}
      <motion.div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%)',
          backgroundSize: '200% 100%'
        }}
        animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
      />
      
      {/* Premium Icon Container with 3D Effect */}
      <motion.div 
        className={`${variant === "compact" ? "w-12 h-12 mb-3" : "w-14 h-14 mb-4"} rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center relative overflow-hidden shadow-xl`}
        whileHover={{ scale: 1.15, rotate: 8, y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 12 }}
        style={{
          boxShadow: '0 8px 25px -5px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)'
        }}
      >
        {/* Shine sweep effect */}
        <motion.div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 60%)'
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
        />
        {/* Top highlight */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-xl pointer-events-none" />
        
        <feature.icon className={`${variant === "compact" ? "w-5 h-5" : "w-6 h-6"} text-white relative z-10 drop-shadow-md`} />
      </motion.div>
      
      {/* Content */}
      <h3 className={`${variant === "compact" ? "text-base mb-1.5" : "text-lg mb-2"} font-bold group-hover:text-primary transition-colors duration-300 relative z-10`}>
        {feature.title}
      </h3>
      <p className={`text-muted-foreground ${variant === "compact" ? "text-xs mb-2 line-clamp-2" : "text-sm mb-3 line-clamp-3"} relative z-10`}>
        {feature.description}
      </p>
      
      {/* Premium Link with Arrow Animation */}
      <Link
        to={`/features/${feature.slug}`}
        className={`inline-flex items-center ${variant === "compact" ? "text-success-accessible text-xs" : "text-primary text-sm"} font-semibold group/link relative z-10 hover:gap-2 transition-all duration-300`}
      >
        <span>Learn More<span className="sr-only"> about {feature.title}</span></span>
        <motion.span
          className="ml-1 inline-block"
          whileHover={{ x: 5 }}
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.span>
      </Link>
      
      {/* Premium Border Glow on Hover */}
      <motion.div 
        className={`absolute inset-0 rounded-2xl border-2 ${variant === "compact" ? "border-success/40" : "border-primary/40"} opacity-0 group-hover:opacity-100 transition-all duration-300`}
        style={{
          boxShadow: variant === "compact" 
            ? '0 0 20px hsl(var(--success) / 0.2)' 
            : '0 0 25px hsl(var(--primary) / 0.2)'
        }}
      />
    </motion.div>
  );
});

FeatureCard.displayName = "FeatureCard";

const FeaturesSection = memo(() => {
  const { t } = useLanguage();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  // Complete Online Business Features - 9 Features with unique colors
  const onlineFeatures = useMemo(() => [
    {
      icon: MessageSquare,
      title: "AI Auto-Reply (Inbox & Comments)",
      description: "AI responds to customer messages in Bengali instantly with natural human-like conversation. Never miss a sale - even at 3 AM. Handles inquiries, shares prices, and guides customers to purchase.",
      gradient: "from-[#3B82F6] to-[#1D4ED8]", // Blue - Communication
      slug: "message-auto-reply",
    },
    {
      icon: Image,
      title: "Smart Image Recognition",
      description: "Customers send product images? AI identifies and prices them automatically from your catalog. No manual lookup needed - instant product matching with 95%+ accuracy.",
      gradient: "from-[#8B5CF6] to-[#6D28D9]", // Purple - AI/Vision
      slug: "image-recognition",
    },
    {
      icon: Mic,
      title: "Voice Message Processing",
      description: "We transcribe and respond to voice messages automatically in seconds. Bengali voice messages converted to text, understood, and answered - saving hours of listening time.",
      gradient: "from-[#EC4899] to-[#BE185D]", // Pink - Audio
      slug: "voice-support",
    },
    {
      icon: Shield,
      title: "Comment Moderation & Auto-Reply",
      description: "Spam detection, auto-delete bad comments, ban abusive users instantly. Plus auto-reply to product inquiries in comments to convert browsers into buyers.",
      gradient: "from-[#10B981] to-[#047857]", // Green - Security
      slug: "comment-management",
    },
    {
      icon: FileText,
      title: "Auto-Invoice Generation",
      description: "Generate professional invoices automatically after every order confirmation. Branded templates, sequential numbering, instant delivery via Messenger - zero manual work.",
      gradient: "from-[#F59E0B] to-[#D97706]", // Amber - Documents
      slug: "auto-invoice",
    },
    {
      icon: Clock,
      title: "24/7 AI Customer Support",
      description: "Your shop never sleeps. AI responds to customers anytime - day or night. Handle multiple conversations simultaneously while you focus on growing your business.",
      gradient: "from-[#6366F1] to-[#4338CA]", // Indigo - Time
      slug: "247-support",
    },
    {
      icon: Bot,
      title: "AI Sales Agent",
      description: "Not just auto-reply - a complete AI sales representative. Uses 10+ persuasion techniques, handles objections, creates urgency, and closes deals like your best salesperson.",
      gradient: "from-[#14B8A6] to-[#0D9488]", // Teal - AI
      slug: "message-auto-reply",
    },
    {
      icon: Handshake,
      title: "AI Bargaining Power",
      description: "Let AI negotiate prices intelligently! Set your minimum acceptable discount and watch AI handle price negotiations professionally - protecting your margins while closing more deals.",
      gradient: "from-[#F97316] to-[#EA580C]", // Orange - Negotiation
      slug: "message-auto-reply",
    },
    {
      icon: ShoppingCart,
      title: "Automatic Order Taking",
      description: "AI collects customer details (name, phone, address) conversationally and creates orders automatically. Complete order management without lifting a finger.",
      gradient: "from-[#22C55E] to-[#16A34A]", // Green - Orders
      slug: "auto-invoice",
    },
  ], []);

  // Complete Offline Shop Features - 12 Features with unique colors
  const offlineFeatures = useMemo(() => [
    {
      icon: Store,
      title: "Complete POS System",
      description: "Full Point of Sale with inventory, sales, and expense tracking. Works offline - sync when connected.",
      gradient: "from-[#3B82F6] to-[#1D4ED8]", // Blue - Main POS
      slug: "offline-shop-management",
    },
    {
      icon: Package,
      title: "Inventory Control",
      description: "Track stock levels, expiry dates, batch numbers, and get automatic low stock alerts. Never run out of bestsellers.",
      gradient: "from-[#8B5CF6] to-[#6D28D9]", // Purple - Inventory
      slug: "inventory-management",
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Build customer relationships with due tracking, purchase history, and SMS reminders for collections.",
      gradient: "from-[#06B6D4] to-[#0891B2]", // Cyan - Customers
      slug: "customer-management",
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description: "Sales, profit, expense reports with charts. Export to Excel. Make data-driven business decisions.",
      gradient: "from-[#10B981] to-[#047857]", // Emerald - Analytics
      slug: "reports-analytics",
    },
    {
      icon: Wallet,
      title: "Expense & Cash Register",
      description: "Track expenses by category, manage cash flow, daily closing reports. Know where every taka goes.",
      gradient: "from-[#F59E0B] to-[#D97706]", // Amber - Money
      slug: "expense-cash-management",
    },
    {
      icon: RefreshCw,
      title: "Online-Offline Sync",
      description: "Unify inventory across online and offline sales. Prevent overselling with real-time stock sync.",
      gradient: "from-[#14B8A6] to-[#0D9488]", // Teal - Sync
      slug: "online-offline-sync",
    },
    {
      icon: Truck,
      title: "Supplier & Purchase",
      description: "Track supplier purchases, dues, and payment history. Manage credit relationships professionally.",
      gradient: "from-[#F97316] to-[#EA580C]", // Orange - Delivery
      slug: "supplier-management",
    },
    {
      icon: Landmark,
      title: "Loan Management",
      description: "Track business loans with installments and payment reminders. Never miss a payment deadline.",
      gradient: "from-[#EF4444] to-[#DC2626]", // Red - Finance
      slug: "loan-management",
    },
    {
      icon: ScanLine,
      title: "Barcode Scanner",
      description: "Scan product barcodes for instant checkout. Print custom barcodes for your products.",
      gradient: "from-[#6366F1] to-[#4338CA]", // Indigo - Scanner
      slug: "offline-shop-management",
    },
    {
      icon: Calculator,
      title: "Price Calculator",
      description: "Calculate selling prices with profit margins. Set markup percentages for consistent pricing.",
      gradient: "from-[#84CC16] to-[#65A30D]", // Lime - Calculator
      slug: "offline-shop-management",
    },
    {
      icon: Undo2,
      title: "Returns & Adjustments",
      description: "Handle customer returns, damaged stock, and inventory adjustments with full audit trail.",
      gradient: "from-[#EC4899] to-[#BE185D]", // Pink - Returns
      slug: "offline-shop-management",
    },
    {
      icon: Receipt,
      title: "Thermal Printing",
      description: "Print professional receipts on thermal printers. Customizable templates with your shop branding.",
      gradient: "from-[#78716C] to-[#57534E]", // Stone - Print
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
    <section id="features" ref={sectionRef} className="py-20 lg:py-32 relative overflow-hidden">
      {/* Premium Background with Mesh Gradient */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--muted) / 0.4) 20%, hsl(var(--muted) / 0.4) 80%, transparent 100%)'
        }}
      />
      
      {/* Animated Floating Orbs */}
      <motion.div 
        className="absolute top-20 left-[10%] w-[500px] h-[500px] rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)' }}
        animate={{ 
          x: [0, 80, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-20 right-[10%] w-[600px] h-[600px] rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--secondary) / 0.12) 0%, transparent 70%)' }}
        animate={{ 
          x: [0, -60, 0],
          y: [0, -40, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Premium Section Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-20"
          variants={headerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.span 
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary/15 via-secondary/10 to-primary/15 text-primary-accessible text-sm font-bold mb-6 border border-primary/25 shadow-xl backdrop-blur-sm"
            whileHover={{ scale: 1.05, y: -2 }}
            style={{ boxShadow: '0 10px 40px -10px hsl(var(--primary) / 0.3)' }}
          >
            <motion.div 
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center shadow-lg relative overflow-hidden"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-lg" />
              <Rocket className="w-4 h-4 text-white relative z-10 drop-shadow-sm" />
            </motion.div>
            Complete Business Solution
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-8 leading-tight">
            Every Feature You Need{" "}
            <span className="text-gradient-premium">In One Platform</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
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
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-md">
                <MessageSquare className="w-4 h-4 text-white" />
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
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-success to-primary flex items-center justify-center shadow-md">
                <Store className="w-4 h-4 text-white" />
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
