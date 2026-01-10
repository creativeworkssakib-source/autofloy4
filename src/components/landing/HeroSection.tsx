import { useEffect, useRef, useState, useMemo, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Check, Zap, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroConversation from "@/assets/hero-conversation-clean.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import FloatingOrbs from "@/components/ui/FloatingOrbs";
import Floating3DShape from "@/components/ui/Floating3DShape";
import { Floating3DObjects } from "@/components/ui/Floating3DObjects";
import DemoVideoModal from "./DemoVideoModal";
// Interactive floating element that reacts to mouse
interface ParallaxElementProps {
  children: React.ReactNode;
  mousePosition: { x: number; y: number };
  intensity?: number;
  className?: string;
  delay?: number;
}

const ParallaxElement = memo(({ children, mousePosition, intensity = 1, className, delay = 0 }: ParallaxElementProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.5, type: "spring" }}
    className={className}
    style={{
      transform: `translate3d(${mousePosition.x * intensity}px, ${mousePosition.y * intensity}px, 0)`,
      transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
    }}
  >
    {children}
  </motion.div>
));

ParallaxElement.displayName = "ParallaxElement";

// Typing text animation component
interface TypingTextProps {
  text: string;
  delay?: number;
  className?: string;
}

const TypingText = memo(({ text, delay = 0, className }: TypingTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let charIndex = 0;
    
    const startTyping = () => {
      if (charIndex < text.length) {
        setDisplayedText(text.slice(0, charIndex + 1));
        charIndex++;
        timeout = setTimeout(startTyping, 80 + Math.random() * 40);
      } else {
        // Reset and restart after a pause
        setTimeout(() => {
          setDisplayedText("");
          charIndex = 0;
          timeout = setTimeout(startTyping, 500);
        }, 3000);
      }
    };

    const initialDelay = setTimeout(() => {
      startTyping();
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(initialDelay);
    };
  }, [text, delay]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span className={className}>
      {displayedText}
      <span className={showCursor ? "opacity-100" : "opacity-0"}>|</span>
    </span>
  );
});

TypingText.displayName = "TypingText";

const HeroSection = memo(() => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const rafRef = useRef<number>();
  
  const isDemoEnabled = settings.demo_video_enabled && 
    ((settings.demo_video_type === 'youtube' && settings.demo_video_youtube_url) ||
     (settings.demo_video_type === 'upload' && settings.demo_video_upload_url));
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafRef.current) return;
    
    rafRef.current = requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      setMousePosition({ x, y });
      rafRef.current = undefined;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove]);

  const benefits = useMemo(() => [
    t("hero.benefit1"),
    t("hero.benefit2"),
    t("hero.benefit3"),
  ], [t]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Simplified Grid Background */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"
        style={{ maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, black 70%, transparent 110%)" }}
      />

      {/* Static Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(217,100%,50%,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(262,100%,63%,0.1),transparent_50%)]" />

      {/* Floating 3D Objects - Gears, Chat bubbles, Icons */}
      <Floating3DObjects />
      <FloatingOrbs />
      
      {/* 3D Shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Floating3DShape
          variant="cube"
          size="md"
          color="secondary"
          delay={0.5}
          className="top-24 right-6 sm:right-12"
        />
        <Floating3DShape
          variant="ring"
          size="lg"
          color="primary"
          delay={1.2}
          className="bottom-16 left-4 sm:left-10"
        />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10">
        <div className="flex flex-col items-center gap-12">
          {/* Top Content - Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center gpu-accelerated max-w-4xl"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              {t("hero.badge")}
              <ArrowRight className="w-4 h-4" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              {t("hero.title1")}{" "}
              <span className="gradient-text">{t("hero.title2")}</span>{" "}
              {t("hero.title3")}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            >
              {t("hero.subtitle")}
              <strong className="text-foreground"> {t("hero.subtitleBold")}</strong>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
            >
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
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 justify-center items-center"
            >
              {benefits.map((benefit) => (
                <span key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  {benefit}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Bottom Content - Hero Conversation Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative flex justify-center gpu-accelerated"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl rounded-full scale-75" />
            
            {/* Main Illustration Container */}
            <div
              className="relative w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl"
              style={{
                transform: `perspective(1000px) rotateY(${mousePosition.x * 0.2}deg) rotateX(${-mousePosition.y * 0.2}deg)`,
                transition: "transform 0.3s ease-out",
              }}
            >
              <img
                src={heroConversation}
                alt="AI Robot and Human Conversation"
                className="relative w-full drop-shadow-2xl"
              />

              {/* Flying Message Lines Between Robot and Human */}
              <div className="absolute top-[32%] left-1/2 -translate-x-1/2 z-10 hidden sm:block">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                      left: `${-60 + i * 30}px`,
                    }}
                    animate={{ 
                      x: i % 2 === 0 ? [0, 60, 120] : [120, 60, 0],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.4,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>

              {/* AI Label on Robot - Above Head */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.4 }}
                className="absolute top-[28%] left-[12%] sm:left-[15%] z-20"
              >
                <div className="bg-card/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-md border border-border/50">
                  <span className="text-[10px] sm:text-xs font-bold text-primary">AI Bot</span>
                </div>
              </motion.div>

              {/* Customer Label on Human - Above Head */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, duration: 0.4 }}
                className="absolute top-[28%] right-[6%] sm:right-[10%] z-20"
              >
                <div className="bg-card/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-md border border-border/50">
                  <span className="text-[10px] sm:text-xs font-bold text-secondary">Customer</span>
                </div>
              </motion.div>
            </div>

            {/* Floating Stat Cards with Parallax */}
            <ParallaxElement
              mousePosition={mousePosition}
              intensity={-1.5}
              delay={0.8}
              className="absolute -top-4 -left-12 lg:-left-28 z-30 hidden md:block"
            >
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
            </ParallaxElement>

            <ParallaxElement
              mousePosition={mousePosition}
              intensity={1.8}
              delay={1}
              className="absolute bottom-4 -right-12 lg:-right-28 z-30 hidden md:block"
            >
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
            </ParallaxElement>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <div className="w-1.5 h-3 rounded-full bg-muted-foreground/50 animate-bounce" />
        </div>
      </motion.div>
      
      {/* Demo Video Modal */}
      <DemoVideoModal open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen} />
    </section>
  );
});

HeroSection.displayName = "HeroSection";

export default HeroSection;
