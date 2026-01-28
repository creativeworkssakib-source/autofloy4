import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Crown, Zap, Star, ArrowRight, Gift, Store, Globe, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import BusinessTypeSelector, { BusinessType } from "./BusinessTypeSelector";

export interface PricingPlan {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  price: string;
  priceNumeric: number;
  period: string;
  description: string;
  features: string[]; // Legacy - used as fallback
  cta: string;
  ctaVariant: "default" | "gradient" | "success";
  note?: string;
  popular?: boolean;
  originalPrice?: string;
  originalPriceNumeric?: number;
  savings?: string;
  discountPercent?: number;
  // Offline shop pricing
  offlineShopPrice?: number;
  offlineShopBundlePrice?: number;
  hasOfflineShopOption?: boolean;
  // Separate feature lists for each business type
  onlineFeatures?: string[];
  offlineFeatures?: string[];
}

interface PricingCardProps {
  plan: PricingPlan;
  index: number;
  businessType: BusinessType;
  onBusinessTypeChange: (type: BusinessType) => void;
  maxFeatures: number;
  hasActiveTrial?: boolean;
  trialEndDate?: string;
  onContactClick?: () => void;
  isMobile?: boolean;
}

export const PricingCard = ({
  plan,
  index,
  businessType,
  onBusinessTypeChange,
  maxFeatures,
  hasActiveTrial,
  trialEndDate,
  onContactClick,
  isMobile = false,
}: PricingCardProps) => {
  // Calculate price based on business type
  const getDisplayPrice = () => {
    if (plan.id === "free-trial") return plan.price;
    if (plan.id === "lifetime") return plan.price;
    
    const offlinePrice = plan.offlineShopPrice || 999;
    const bundlePrice = plan.offlineShopBundlePrice || 500;
    
    if (businessType === "offline") {
      return `৳${offlinePrice.toLocaleString()}`;
    }
    if (businessType === "both") {
      const totalPrice = plan.priceNumeric + bundlePrice;
      return `৳${totalPrice.toLocaleString()}`;
    }
    return plan.price;
  };

  const getOriginalPrice = () => {
    if (!plan.originalPriceNumeric || plan.id === "free-trial" || plan.id === "lifetime") {
      return plan.originalPrice;
    }
    
    const offlinePrice = plan.offlineShopPrice || 999;
    const bundlePrice = plan.offlineShopBundlePrice || 500;
    
    if (businessType === "offline") {
      // Offline standalone - show original as ~1500 or similar
      return `৳${(offlinePrice * 1.5).toLocaleString()}`;
    }
    if (businessType === "both") {
      const totalOriginal = plan.originalPriceNumeric + offlinePrice;
      return `৳${totalOriginal.toLocaleString()}`;
    }
    return plan.originalPrice;
  };

  const getSavings = () => {
    if (plan.id === "free-trial" || plan.id === "lifetime") return plan.savings;
    
    const offlinePrice = plan.offlineShopPrice || 999;
    const bundlePrice = plan.offlineShopBundlePrice || 500;
    
    if (businessType === "offline") {
      const saved = Math.round(offlinePrice * 0.5);
      return `Save ৳${saved.toLocaleString()}`;
    }
    if (businessType === "both") {
      // Show savings from bundle discount
      const savedFromBundle = offlinePrice - bundlePrice;
      const baseSavings = plan.originalPriceNumeric ? plan.originalPriceNumeric - plan.priceNumeric : 0;
      const totalSaved = baseSavings + savedFromBundle;
      return `Save ৳${totalSaved.toLocaleString()}`;
    }
    return plan.savings;
  };

  // Get features based on business type
  const getFeatures = () => {
    // Use separate feature lists from database
    const onlineFeats = plan.onlineFeatures || plan.features || [];
    const offlineFeats = plan.offlineFeatures || [];
    
    if (businessType === "offline") {
      return offlineFeats.length > 0 ? offlineFeats : plan.features;
    }
    if (businessType === "both") {
      // Combine online features + offline highlights
      const offlineHighlights = offlineFeats.slice(0, 3).map(f => `+ ${f}`);
      return [...onlineFeats.slice(0, 5), ...offlineHighlights];
    }
    // Online mode - show only online features
    return onlineFeats.length > 0 ? onlineFeats : plan.features;
  };

  // Get checkout URL with business type
  const getCheckoutUrl = () => {
    if (plan.id === "free-trial") return "/trial-start";
    const baseUrl = `/checkout?plan=${plan.id}`;
    if (businessType === "offline") return `${baseUrl}&type=offline`;
    if (businessType === "both") return `${baseUrl}&type=both`;
    return baseUrl;
  };

  const features = getFeatures();
  const displayPrice = getDisplayPrice();
  const originalPrice = getOriginalPrice();
  const savings = getSavings();
  
  // Show business type badge
  const getBusinessTypeBadge = () => {
    if (businessType === "offline") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          <Store className="w-2.5 h-2.5" />
          Offline Only
        </span>
      );
    }
    if (businessType === "both") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-gradient-to-r from-primary/10 to-orange-100 text-primary dark:from-primary/20 dark:to-orange-900/30">
          <Layers className="w-2.5 h-2.5" />
          Complete Bundle
        </span>
      );
    }
    return null;
  };

  // Skip showing selector for free trial
  const showBusinessTypeSelector = plan.id !== "free-trial" && plan.id !== "lifetime" && plan.hasOfflineShopOption !== false;

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={cn(
          "relative flex-shrink-0 w-[280px] snap-center bg-card rounded-xl border transition-all duration-300 flex flex-col",
          plan.popular
            ? "border-primary shadow-[0_0_30px_-10px_hsl(var(--primary))]"
            : "border-border/50"
        )}
      >
        <div className="p-4 flex flex-col h-full">
          {/* Badge */}
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold", plan.badgeColor)}>
              {plan.name === "Lifetime" && <Crown className="w-2.5 h-2.5" />}
              {plan.name === "Business" && <Star className="w-2.5 h-2.5" />}
              {plan.badge}
            </span>
            {getBusinessTypeBadge()}
          </div>

          <h3 className="text-base font-bold mb-0.5">{plan.name}</h3>
          <p className="text-xs text-muted-foreground mb-2">{plan.description}</p>

          {/* Business Type Selector */}
          {showBusinessTypeSelector && (
            <div className="mb-3">
              <BusinessTypeSelector
                value={businessType}
                onChange={onBusinessTypeChange}
                compact
              />
            </div>
          )}

          {/* Price */}
          <div className="mb-3 min-h-[60px]">
            {originalPrice && businessType !== "online" && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs text-muted-foreground line-through">{originalPrice}</span>
                {plan.discountPercent && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-destructive/10 text-destructive">
                    <Gift className="w-2.5 h-2.5" />SAVE
                  </span>
                )}
              </div>
            )}
            {!originalPrice && plan.originalPrice && (
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs text-muted-foreground line-through">{plan.originalPrice}</span>
                {plan.discountPercent && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-destructive/10 text-destructive">
                    <Gift className="w-2.5 h-2.5" />{plan.discountPercent}% OFF
                  </span>
                )}
              </div>
            )}
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-extrabold text-primary">{displayPrice}</span>
              <span className="text-xs text-muted-foreground">{plan.period}</span>
            </div>
            {savings && (
              <p className="text-xs font-medium text-success mt-0.5">{savings}</p>
            )}
            {businessType === "both" && plan.id !== "free-trial" && plan.id !== "lifetime" && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                (Online ৳{plan.priceNumeric} + Offline ৳{plan.offlineShopBundlePrice || 500})
              </p>
            )}
          </div>

          {/* Features */}
          <ul className="space-y-1.5 flex-1 mb-4">
            {features.map((feature) => (
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
                onClick={onContactClick}
              >
                {plan.cta}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button variant={plan.ctaVariant} className="w-full h-9 text-xs" asChild>
                <Link to={getCheckoutUrl()}>
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
    );
  }

  // Desktop version
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={cn(
        "relative bg-card rounded-xl border transition-all duration-300 hover:shadow-lg flex flex-col",
        plan.popular
          ? "border-primary shadow-[0_2px_30px_-8px_hsl(var(--primary))] scale-[1.02] z-10"
          : "border-border/50 hover:border-primary/30"
      )}
    >
      <div className="p-6 flex flex-col h-full">
        {/* Badge */}
        <div className="h-7 mb-2 flex items-center gap-2 flex-wrap">
          <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold", plan.badgeColor)}>
            {plan.name === "Lifetime" && <Crown className="w-3 h-3" />}
            {plan.name === "Business" && <Star className="w-3 h-3" />}
            {plan.badge}
          </span>
          {getBusinessTypeBadge()}
        </div>

        {/* Plan Name */}
        <h3 className="text-lg font-bold mb-0.5">{plan.name}</h3>
        <p className="text-[13px] text-muted-foreground mb-3 h-9 line-clamp-2">{plan.description}</p>

        {/* Business Type Selector */}
        {showBusinessTypeSelector && (
          <div className="mb-4">
            <BusinessTypeSelector
              value={businessType}
              onChange={onBusinessTypeChange}
            />
          </div>
        )}

        {/* Price - Fixed height */}
        <div className="mb-5 min-h-[85px]">
          {(originalPrice || plan.originalPrice) && (
            <>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="text-sm text-muted-foreground line-through">
                  {originalPrice || plan.originalPrice}
                </span>
                {plan.discountPercent && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive">
                    <Gift className="w-2.5 h-2.5" />
                    {businessType === "both" ? "BUNDLE DEAL" : `${plan.discountPercent}% OFF`}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[26px] font-extrabold text-primary">{displayPrice}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <p className="text-[13px] font-medium text-success mt-1">{savings || plan.savings}</p>
              {businessType === "both" && plan.id !== "free-trial" && plan.id !== "lifetime" && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  (Online ৳{plan.priceNumeric} + Offline ৳{plan.offlineShopBundlePrice || 500})
                </p>
              )}
            </>
          )}
          {!originalPrice && !plan.originalPrice && (
            <>
              <div className="h-5" />
              <div className="flex items-baseline gap-1">
                <span className="text-[26px] font-extrabold text-primary">{displayPrice}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <div className="h-5" />
            </>
          )}
        </div>

        {/* Features - Minimum height for alignment */}
        <ul className="space-y-2.5 flex-1 mb-5" style={{ minHeight: `${maxFeatures * 26}px` }}>
          {features.map((feature) => (
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
              onClick={onContactClick}
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button variant={plan.ctaVariant} className="w-full h-11 text-sm" asChild>
              <Link to={getCheckoutUrl()}>
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
  );
};

export default PricingCard;
