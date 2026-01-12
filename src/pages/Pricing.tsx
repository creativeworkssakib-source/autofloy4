import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles, Crown, Zap, Star, ArrowRight, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useRef } from "react";
import { plans as staticPlans, Plan } from "@/data/plans";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import ContactLifetimeModal from "@/components/pricing/ContactLifetimeModal";
import TrialCountdown from "@/components/pricing/TrialCountdown";
import { supabase } from "@/integrations/supabase/client";

interface DbPricingPlan {
  id: string;
  name: string;
  name_bn?: string;
  badge?: string;
  badge_color?: string;
  price_numeric: number;
  currency: string;
  period?: string;
  description?: string;
  description_bn?: string;
  features: string[];
  cta_text?: string;
  cta_variant?: string;
  is_popular: boolean;
  is_active: boolean;
  original_price_numeric?: number;
  discount_percent?: number;
  display_order: number;
}

const Pricing = () => {
  const { settings } = useSiteSettings();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(1);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>(staticPlans);
  const [loading, setLoading] = useState(true);
  
  // Fetch plans from database
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('pricing_plans' as any)
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) {
          console.warn('Could not fetch pricing plans:', error);
          setPlans(staticPlans);
        } else if (data && data.length > 0) {
          // Transform database plans to match Plan interface
          const dbPlans: Plan[] = (data as unknown as DbPricingPlan[]).map((p) => ({
            id: p.id,
            name: p.name,
            badge: p.badge || p.name.toUpperCase(),
            badgeColor: p.badge_color || "bg-primary/10 text-primary",
            price: p.price_numeric === 0 ? (p.id === 'lifetime' ? '' : '৳0') : `${p.currency}${p.price_numeric.toLocaleString()}`,
            priceNumeric: p.price_numeric,
            // Lifetime plan should have no period
            period: p.id === 'lifetime' ? '' : (p.period || '/month'),
            description: p.description || '',
            features: p.features || [],
            cta: p.cta_text || `Choose ${p.name}`,
            ctaVariant: (p.cta_variant as "default" | "gradient" | "success") || "default",
            note: p.id === 'free-trial' ? 'No credit card required' : undefined,
            popular: p.is_popular,
            originalPrice: p.original_price_numeric ? `${p.currency}${p.original_price_numeric.toLocaleString()}` : undefined,
            originalPriceNumeric: p.original_price_numeric || undefined,
            savings: p.original_price_numeric && p.price_numeric 
              ? `Save ${p.currency}${(p.original_price_numeric - p.price_numeric).toLocaleString()}`
              : undefined,
            discountPercent: p.discount_percent || undefined,
          }));
          setPlans(dbPlans);
        }
      } catch (err) {
        console.warn('Error fetching plans:', err);
        setPlans(staticPlans);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);
  
  // Check if user has active trial
  const hasActiveTrial = user?.isTrialActive && user?.trialEndDate;

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.offsetWidth * 0.85;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(index);
    }
  };

  const scrollToCard = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.offsetWidth * 0.85;
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: "smooth",
      });
    }
  };

  // Find max features count for equal height
  const maxFeatures = Math.max(...plans.map(p => p.features.length));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Header Section - Compact */}
        <section className="py-8 lg:py-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(217,100%,50%,0.08),transparent_50%)]" />
          
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                <Sparkles className="w-4 h-4" />
                Simple, Transparent Pricing
              </span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
                Choose Your{" "}
                <span className="gradient-text">Perfect Plan</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Start with a 24-hour free trial. Upgrade anytime. Cancel anytime.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-10 lg:pb-12">
          <div className="w-full max-w-[1340px] mx-auto px-4 sm:px-6">
            {/* Mobile Slider */}
            <div className="lg:hidden">
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 px-1 pt-4 pb-4 -mx-1"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`relative flex-shrink-0 w-[280px] snap-center bg-card rounded-xl border transition-all duration-300 flex flex-col ${
                      plan.popular
                        ? "border-primary shadow-[0_0_30px_-10px_hsl(var(--primary))]"
                        : "border-border/50"
                    }`}
                  >
                    <div className="p-4 flex flex-col h-full">
                      {/* Badge */}
                      <div className="mb-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${plan.badgeColor}`}>
                          {plan.name === "Lifetime" && <Crown className="w-2.5 h-2.5" />}
                          {plan.name === "Business" && <Star className="w-2.5 h-2.5" />}
                          {plan.badge}
                        </span>
                      </div>

                      <h3 className="text-base font-bold mb-0.5">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>

                      {/* Price */}
                      <div className="mb-4 min-h-[70px]">
                        {plan.id === "free-trial" && hasActiveTrial ? (
                          <TrialCountdown trialEndDate={user.trialEndDate!} />
                        ) : (
                          <>
                            {plan.originalPrice && (
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-xs text-muted-foreground line-through">{plan.originalPrice}</span>
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-destructive/10 text-destructive">
                                  <Gift className="w-2.5 h-2.5" />{plan.discountPercent}% OFF
                                </span>
                              </div>
                            )}
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-2xl font-extrabold text-primary">{plan.price}</span>
                              <span className="text-xs text-muted-foreground">{plan.period}</span>
                            </div>
                            {plan.savings && (
                              <p className="text-xs font-medium text-success mt-0.5">{plan.savings}</p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-1.5 flex-1 mb-4">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-1.5 text-xs">
                            <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <div className="mt-auto pt-3 border-t border-border/30">
                        {plan.id === "lifetime" ? (
                          <Button
                            variant={plan.ctaVariant}
                            className="w-full h-9 text-xs"
                            onClick={() => setIsContactModalOpen(true)}
                          >
                            {plan.cta}
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        ) : (
                          <Button variant={plan.ctaVariant} className="w-full h-9 text-xs" asChild>
                            <Link to={plan.id === "free-trial" ? "/trial-start" : `/checkout?plan=${plan.id}`}>
                              {plan.cta}
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Link>
                          </Button>
                        )}
                        {plan.note && (
                          <p className="text-[10px] text-muted-foreground text-center mt-1.5">{plan.note}</p>
                        )}
                      </div>
                    </div>

                    {plan.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground shadow-md">
                          <Zap className="w-2.5 h-2.5" />Most Popular
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Dot Indicators */}
              <div className="flex justify-center gap-1.5 mt-1" role="tablist" aria-label="Pricing plans navigation">
                {plans.map((plan, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToCard(index)}
                    aria-label={`Go to ${plan.name} plan`}
                    aria-selected={activeIndex === index}
                    role="tab"
                    className={`transition-all duration-300 rounded-full ${
                      activeIndex === index
                        ? "w-6 h-1.5 bg-gradient-to-r from-primary to-secondary"
                        : "w-1.5 h-1.5 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Grid - Balanced Cards */}
            <div className="hidden lg:grid lg:grid-cols-5 gap-5 pt-2">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  className={`relative bg-card rounded-xl border transition-all duration-300 hover:shadow-lg flex flex-col ${
                    plan.popular
                      ? "border-primary shadow-[0_2px_30px_-8px_hsl(var(--primary))] scale-[1.02] z-10"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  <div className="p-6 flex flex-col h-full">
                    {/* Badge */}
                    <div className="h-7 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${plan.badgeColor}`}>
                        {plan.name === "Lifetime" && <Crown className="w-3 h-3" />}
                        {plan.name === "Business" && <Star className="w-3 h-3" />}
                        {plan.badge}
                      </span>
                    </div>

                    {/* Plan Name */}
                    <h3 className="text-lg font-bold mb-0.5">{plan.name}</h3>
                    <p className="text-[13px] text-muted-foreground mb-3 h-9 line-clamp-2">{plan.description}</p>

                    {/* Price - Fixed height */}
                    <div className="mb-5 h-[85px]">
                      {plan.id === "free-trial" && hasActiveTrial ? (
                        <div className="pt-2">
                          <TrialCountdown trialEndDate={user.trialEndDate!} />
                        </div>
                      ) : plan.originalPrice ? (
                        <>
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-sm text-muted-foreground line-through">{plan.originalPrice}</span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive">
                              <Gift className="w-2.5 h-2.5" />{plan.discountPercent}% OFF
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[26px] font-extrabold text-primary">{plan.price}</span>
                            <span className="text-sm text-muted-foreground">{plan.period}</span>
                          </div>
                          <p className="text-[13px] font-medium text-success mt-1">{plan.savings}</p>
                        </>
                      ) : (
                        <>
                          <div className="h-5" />
                          <div className="flex items-baseline gap-1">
                            <span className="text-[26px] font-extrabold text-primary">{plan.price}</span>
                            <span className="text-sm text-muted-foreground">{plan.period}</span>
                          </div>
                          <div className="h-5" />
                        </>
                      )}
                    </div>

                    {/* Features - Minimum height for alignment */}
                    <ul className="space-y-2.5 flex-1 mb-5" style={{ minHeight: `${maxFeatures * 26}px` }}>
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span className="text-[13px] text-muted-foreground leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA - Always at bottom */}
                    <div className="mt-auto pt-4 border-t border-border/30">
                      {plan.id === "lifetime" ? (
                        <Button
                          variant={plan.ctaVariant}
                          className="w-full h-11 text-sm"
                          onClick={() => setIsContactModalOpen(true)}
                        >
                          {plan.cta}
                          <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                      ) : (
                        <Button variant={plan.ctaVariant} className="w-full h-11 text-sm" asChild>
                          <Link to={plan.id === "free-trial" ? "/trial-start" : `/checkout?plan=${plan.id}`}>
                            {plan.cta}
                            <ArrowRight className="w-4 h-4 ml-1.5" />
                          </Link>
                        </Button>
                      )}
                      <div className="h-5 mt-2 flex items-center justify-center">
                        {plan.note && (
                          <p className="text-[11px] text-muted-foreground text-center">{plan.note}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-md whitespace-nowrap">
                        <Zap className="w-3.5 h-3.5" />Most Popular
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-10 lg:py-14">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl font-bold mb-3">Pricing Questions?</h2>
              <p className="text-muted-foreground">
                We're here to help. Contact us at{" "}
                <a href={`mailto:${settings.support_email}`} className="text-primary hover:underline">
                  {settings.support_email}
                </a>
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Can I switch plans?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! Upgrade or downgrade anytime. Pro-rated billing applies.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-success/10 flex items-center justify-center">
                  <Check className="w-6 h-6 text-success" />
                </div>
                <h3 className="font-semibold mb-2">Money-back guarantee?</h3>
                <p className="text-sm text-muted-foreground">
                  30-day money-back guarantee on all paid plans. No questions asked.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold mb-2">Enterprise pricing?</h3>
                <p className="text-sm text-muted-foreground">
                  Need a custom solution? Contact us for enterprise pricing.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      
      <ContactLifetimeModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </div>
  );
};

export default Pricing;
