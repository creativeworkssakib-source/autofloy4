import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles, Zap, CheckCircle2 } from "lucide-react";
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
    <section ref={sectionRef} className="py-10 lg:py-14 relative overflow-hidden">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Animated Background Gradient */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary"
            animate={{
              background: [
                "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)",
                "linear-gradient(225deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)",
                "linear-gradient(315deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)",
                "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)"
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Animated Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          
          {/* Floating Orbs */}
          <motion.div 
            className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
            animate={{ 
              x: [0, 30, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
            animate={{ 
              x: [0, -30, 0],
              y: [0, 30, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Shimmer Effect */}
          <motion.div 
            className="absolute inset-0 opacity-20"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)"
            }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
          />

          {/* Content */}
          <div className="relative px-6 py-12 md:px-12 md:py-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-primary-foreground text-sm font-medium mb-6 backdrop-blur-sm border border-white/20"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shadow-inner"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </motion.div>
              Limited Time Offer
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary-foreground mb-4 max-w-2xl mx-auto"
            >
              Ready to Transform Your Business?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-base md:text-lg text-primary-foreground/90 max-w-xl mx-auto mb-8"
            >
              Online business with Facebook automation + Offline shop with POS system.
              Join 500+ sellers saving 50+ hours monthly — start your free trial today.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all px-8 py-6 text-lg font-semibold group"
                  asChild
                >
                  <Link to="/signup">
                    Start Free Trial
                    <motion.span
                      className="ml-2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.span>
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20 backdrop-blur-sm px-8 py-6 text-lg"
                  asChild
                >
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 text-primary-foreground/90"
            >
              {features.map((feature, index) => (
                <motion.span 
                  key={feature}
                  className="flex items-center gap-2 text-sm font-medium"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                    className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shadow-inner"
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