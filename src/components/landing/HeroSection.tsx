import { useState, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  
  const isDemoEnabled = settings.demo_video_enabled && 
    ((settings.demo_video_type === 'youtube' && settings.demo_video_youtube_url) ||
     (settings.demo_video_type === 'upload' && settings.demo_video_upload_url));

  const benefits = useMemo(() => [
    t("hero.benefit1"),
    t("hero.benefit2"),
    t("hero.benefit3"),
  ], [t]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Simplified Static Background - No heavy animations */}
      <div className="absolute inset-0 bg-muted/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(217,100%,50%,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(262,100%,63%,0.08),transparent_50%)]" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10">
        <div className="flex flex-col items-center gap-12">
          {/* Top Content - Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {t("hero.badge")}
              <ArrowRight className="w-4 h-4" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              {t("hero.title1")}{" "}
              <span className="gradient-text">{t("hero.title2")}</span>{" "}
              {t("hero.title3")}
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {t("hero.subtitle")}
              <strong className="text-foreground"> {t("hero.subtitleBold")}</strong>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button variant="hero" size="xl" asChild className="group">
                <Link to="/signup">
                  {t("hero.cta")}
                  <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              {isDemoEnabled && (
                <Button 
                  variant="glass" 
                  size="xl"
                  onClick={() => setIsDemoModalOpen(true)}
                >
                  <Play className="w-5 h-5 mr-1" />
                  {t("hero.demo")}
                </Button>
              )}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 justify-center items-center">
              {benefits.map((benefit) => (
                <span key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  {benefit}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Bottom Content - Hero Conversation Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative flex justify-center"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-secondary/15 blur-3xl rounded-full scale-75" />
            
            {/* Main Illustration Container - Static, no mouse tracking */}
            <div className="relative w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl">
              <img
                src={heroConversation}
                alt="AI Robot and Human Conversation"
                className="relative w-full drop-shadow-2xl"
                loading="eager"
                width={1920}
                height={1080}
                decoding="async"
                fetchPriority="high"
              />

              {/* AI Label on Robot */}
              <div className="absolute top-[28%] left-[12%] sm:left-[15%] z-20">
                <div className="bg-card/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-md border border-border/50">
                  <span className="text-[10px] sm:text-xs font-bold text-primary">AI Bot</span>
                </div>
              </div>

              {/* Customer Label on Human */}
              <div className="absolute top-[28%] right-[6%] sm:right-[10%] z-20">
                <div className="bg-card/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-md border border-border/50">
                  <span className="text-[10px] sm:text-xs font-bold text-secondary">Customer</span>
                </div>
              </div>
            </div>

            {/* Static Stat Cards - No parallax */}
            <div className="absolute -top-4 -left-12 lg:-left-28 z-30 hidden md:block">
              <div className="bg-card/90 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">127 {t("hero.statsMessages")}</p>
                    <p className="text-xs text-muted-foreground">{t("hero.statsHandled")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 -right-12 lg:-right-28 z-30 hidden md:block">
              <div className="bg-card/90 backdrop-blur-md rounded-2xl shadow-xl p-4 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">92% {t("hero.statsSuccess")}</p>
                    <p className="text-xs text-muted-foreground">{t("hero.statsAutoReply")}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <div className="w-1.5 h-3 rounded-full bg-muted-foreground/50 animate-bounce" />
        </div>
      </div>
      
      {/* Demo Video Modal */}
      <DemoVideoModal open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen} />
    </section>
  );
});

HeroSection.displayName = "HeroSection";

export default HeroSection;