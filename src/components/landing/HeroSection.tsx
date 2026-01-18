import { useState, useMemo, memo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

import { ArrowRight, Play, Sparkles, Check, Zap, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroConversation from "@/assets/hero-conversation-clean.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import DemoVideoModal from "./DemoVideoModal";

const HeroSection = memo(() => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  
  const isDemoEnabled = settings.demo_video_enabled && 
    ((settings.demo_video_type === 'youtube' && settings.demo_video_youtube_url) ||
     (settings.demo_video_type === 'upload' && settings.demo_video_upload_url));

  const benefits = useMemo(() => [
    t("hero.benefit1"),
    t("hero.benefit2"),
    t("hero.benefit3"),
  ], [t]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  };

  const floatingCardVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1,
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        ease: "easeOut" as const,
        delay: 0.8
      }
    }
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <motion.div 
          className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary/10 to-secondary/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-tl from-secondary/10 to-primary/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        {/* Top Gradient Fade */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent" />
      </div>

      <motion.div 
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10"
      >
        <motion.div 
          className="flex flex-col items-center gap-12"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {/* Top Content - Text */}
          <div className="text-center max-w-4xl">
            {/* Headline */}
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight"
            >
              {t("hero.title1")}{" "}
              <span className="gradient-text relative inline-block">
                {t("hero.title2")}
                <motion.span 
                  className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                />
              </span>{" "}
              {t("hero.title3")}
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              {t("hero.subtitle")}
              <strong className="text-foreground font-semibold"> {t("hero.subtitleBold")}</strong>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
            >
              <Button variant="hero" size="xl" asChild className="group relative overflow-hidden">
                <Link to="/signup">
                  <span className="relative z-10 flex items-center">
                    {t("hero.cta")}
                    <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <motion.span 
                    className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </Link>
              </Button>
              {isDemoEnabled && (
                <Button 
                  variant="glass" 
                  size="xl"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="group"
                >
                  <Play className="w-5 h-5 mr-1 group-hover:scale-110 transition-transform" />
                  {t("hero.demo")}
                </Button>
              )}
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 justify-center items-center"
            >
              {benefits.map((benefit, index) => (
                <motion.span 
                  key={benefit} 
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                >
                  <motion.div 
                    className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0"
                    whileHover={{ scale: 1.2 }}
                  >
                    <Check className="w-3 h-3 text-success" />
                  </motion.div>
                  {benefit}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* Bottom Content - Hero Conversation Illustration */}
          <motion.div
            variants={itemVariants}
            className="relative flex justify-center"
          >
            {/* Main Illustration Container */}
            <motion.div 
              className="relative w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={heroConversation}
                alt="AI Robot and Human Conversation"
                className="relative w-full drop-shadow-xl"
                loading="eager"
                width={768}
                height={432}
                decoding="async"
                fetchPriority="high"
                sizes="(max-width: 640px) 384px, (max-width: 768px) 448px, (max-width: 1024px) 672px, 768px"
              />

              {/* AI Label on Robot */}
              <motion.div 
                className="absolute top-[28%] left-[12%] sm:left-[15%] z-20"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, type: "spring" }}
              >
                <div className="bg-card/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-md border border-border/50 animate-icon-bounce">
                  <span className="text-[10px] sm:text-xs font-bold text-primary">AI Bot</span>
                </div>
              </motion.div>

              {/* Customer Label on Human */}
              <motion.div 
                className="absolute top-[28%] right-[6%] sm:right-[10%] z-20"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3, type: "spring" }}
              >
                <div className="bg-card/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-md border border-border/50 animate-icon-bounce" style={{ animationDelay: "0.5s" }}>
                  <span className="text-[10px] sm:text-xs font-bold text-secondary">Customer</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating Stat Cards */}
            <motion.div 
              className="absolute -top-4 -left-12 lg:-left-28 z-30 hidden md:block"
              variants={floatingCardVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className="bg-card/90 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-border/50"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">127 {t("hero.statsMessages")}</p>
                    <p className="text-xs text-muted-foreground">{t("hero.statsHandled")}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="absolute bottom-4 -right-12 lg:-right-28 z-30 hidden md:block"
              variants={floatingCardVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className="bg-card/90 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-border/50"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">92% {t("hero.statsSuccess")}</p>
                    <p className="text-xs text-muted-foreground">{t("hero.statsAutoReply")}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div 
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div 
            className="w-1.5 h-3 rounded-full bg-gradient-to-b from-primary to-secondary"
            animate={{ y: [0, 8, 0], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
      
      {/* Demo Video Modal */}
      <DemoVideoModal open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen} />
    </section>
  );
});

HeroSection.displayName = "HeroSection";

export default HeroSection;