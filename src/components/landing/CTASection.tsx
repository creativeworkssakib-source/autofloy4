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
    <section ref={sectionRef} className="py-16 lg:py-24 relative overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 60, scale: 0.9 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative rounded-[2rem] overflow-hidden"
        >
          {/* Premium Gradient Background - matching reference image */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary" />
          
          {/* Animated Gradient Shift */}
          <motion.div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 50%, hsl(var(--primary)) 100%)',
              backgroundSize: '200% 200%'
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Premium Grid Pattern Overlay - matching reference */}
          <div 
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Animated Floating Orbs */}
          <motion.div 
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }}
            animate={{ 
              x: [0, 30, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }}
            animate={{ 
              x: [0, -40, 0],
              y: [0, 40, 0],
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.7, 0.4]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Premium Shimmer Effect */}
          <motion.div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 60%, transparent 80%)',
              backgroundSize: '200% 100%'
            }}
            animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          />

          {/* Corner Glow Effects */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-white/10 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-radial from-secondary/30 to-transparent rounded-full blur-2xl" />

          {/* Content */}
          <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/20 text-white text-sm font-semibold mb-8 backdrop-blur-md border border-white/30 shadow-lg"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center"
              >
                <Sparkles className="w-4 h-4 text-white drop-shadow-sm" />
              </motion.div>
              Limited Time Offer
            </motion.div>

            {/* Premium Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 max-w-3xl mx-auto leading-tight"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.2)' }}
            >
              Ready to Transform Your Business?
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Online business with Facebook automation + Offline shop with POS system.
              Join 500+ sellers saving 50+ hours monthly — start your free trial today.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/95 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300 px-10 py-7 text-lg font-bold group rounded-full"
                  asChild
                >
                  <Link to="/signup" className="flex items-center gap-2">
                    Start Free Trial
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.span>
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/50 bg-white/10 text-white hover:bg-white/20 hover:border-white/70 backdrop-blur-md px-10 py-7 text-lg font-semibold rounded-full transition-all duration-300"
                  asChild
                >
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-6 md:gap-10"
            >
              {features.map((feature, index) => (
                <motion.span 
                  key={feature}
                  className="flex items-center gap-2.5 text-white/95 text-sm md:text-base font-medium"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                    className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </motion.div>
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