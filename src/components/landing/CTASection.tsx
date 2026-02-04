import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { memo, useRef } from "react";

const CTASection = memo(() => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const features = [
    "Setup in 60 seconds",
    "Cancel anytime",
    "24/7 support"
  ];

  return (
    <section ref={sectionRef} className="py-12 lg:py-16 relative overflow-hidden">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative rounded-2xl overflow-hidden"
        >
          {/* Premium Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary" />
          
          {/* Subtle Animated Gradient */}
          <motion.div 
            className="absolute inset-0 opacity-80"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 50%, hsl(var(--primary)) 100%)',
              backgroundSize: '200% 200%'
            }}
            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Premium Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px'
            }}
          />
          
          {/* Subtle Floating Orb */}
          <motion.div 
            className="absolute -top-16 -right-16 w-48 h-48 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Content - More Compact */}
          <div className="relative px-6 py-10 md:px-12 md:py-12 text-center">
            {/* Premium Badge - Smaller */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-white text-xs font-semibold mb-5 backdrop-blur-sm border border-white/25"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Sparkles className="w-3 h-3 text-white" />
              </motion.div>
              Limited Time Offer
            </motion.div>

            {/* Headline - Smaller */}
            <motion.h2
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 max-w-2xl mx-auto leading-tight"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.15)' }}
            >
              Ready to Transform Your Business?
            </motion.h2>

            {/* Subtitle - Smaller */}
            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-sm md:text-base text-white/85 max-w-xl mx-auto mb-7 leading-relaxed"
            >
              Online business with Facebook automation + Offline shop with POS system.
              Join 500+ sellers saving 50+ hours monthly.
            </motion.p>

            {/* CTA Buttons - Smaller */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mb-7"
            >
              <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="default"
                  className="bg-white text-primary hover:bg-white/95 shadow-xl hover:shadow-2xl transition-all duration-300 px-7 py-5 text-sm font-bold group rounded-full"
                  asChild
                >
                  <Link to="/signup" className="flex items-center gap-2">
                    Start Free Trial
                    <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="default"
                  variant="outline"
                  className="border-2 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:border-white/60 backdrop-blur-sm px-7 py-5 text-sm font-semibold rounded-full transition-all duration-300"
                  asChild
                >
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Features - Compact */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-4 md:gap-8"
            >
              {features.map((feature, index) => (
                <motion.span 
                  key={feature}
                  className="flex items-center gap-2 text-white/90 text-xs md:text-sm font-medium"
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                  transition={{ delay: 0.55 + index * 0.08 }}
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  {feature}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

CTASection.displayName = "CTASection";

export default CTASection;