export interface ValueComparisonItem {
  icon: string;
  text: string;
  textBn: string;
}

export interface ValueComparison {
  title: string;
  titleBn: string;
  items: ValueComparisonItem[];
  highlight: string;
  highlightBn: string;
}

export interface Plan {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  price: string;
  priceNumeric: number;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaVariant: "default" | "gradient" | "success";
  note?: string;
  popular: boolean;
  originalPrice?: string;
  originalPriceNumeric?: number;
  savings?: string;
  discountPercent?: number;
  valueComparison?: ValueComparison;
}

export const plans: Plan[] = [
  {
    id: "free-trial",
    name: "Free Trial",
    badge: "TRY FREE",
    badgeColor: "bg-success/10 text-success",
    price: "৳0",
    priceNumeric: 0,
    period: "/ trial",
    description: "Try AutoFloy risk-free",
    features: [
      "Online Business: 24 hours full access",
      "Offline Shop: 7 days full access",
      "AI auto-reply (Bengali & English)",
      "Image & voice message support",
      "Complete POS & inventory system",
      "Invoice generation",
      "Email support",
    ],
    cta: "Start Free Trial",
    ctaVariant: "success",
    note: "No credit card required",
    popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    badge: "POPULAR",
    badgeColor: "bg-primary/10 text-primary",
    price: "৳499",
    priceNumeric: 499,
    period: "/month",
    description: "Perfect for small businesses",
    features: [
      "1 Facebook Page automation",
      "AI auto-reply (Bengali & English)",
      "Auto reply to comments",
      "Delete bad/negative comments",
      "Full Offline Shop access",
      "Inventory & sales tracking",
      "Professional invoicing",
      "Basic analytics",
      "Email support",
    ],
    cta: "Choose Starter",
    ctaVariant: "default",
    popular: true,
    originalPrice: "৳1,996",
    originalPriceNumeric: 1996,
    savings: "Save ৳1,497",
    discountPercent: 75,
  },
  {
    id: "professional",
    name: "Professional",
    badge: "BEST VALUE",
    badgeColor: "bg-secondary/10 text-secondary",
    price: "৳6,999",
    priceNumeric: 6999,
    period: "/month",
    description: "Most popular choice",
    features: [
      "Everything in Starter",
      "2 Facebook Pages",
      "1 WhatsApp automation",
      "Image recognition & auto-reply",
      "Voice message understanding",
      "Online-Offline inventory sync",
      "Customer due management",
      "Advanced reports & analytics",
      "Priority email support",
    ],
    cta: "Choose Professional",
    ctaVariant: "gradient",
    popular: false,
    originalPrice: "৳9,999",
    originalPriceNumeric: 9999,
    savings: "Save ৳3,000",
    discountPercent: 30,
  },
  {
    id: "business",
    name: "Business",
    badge: "ULTIMATE",
    badgeColor: "bg-accent/10 text-accent",
    price: "৳19,999",
    priceNumeric: 19999,
    period: "/month",
    description: "For serious sellers",
    features: [
      "Everything in Professional",
      "5 Facebook Pages",
      "2 WhatsApp automations",
      "Instagram automation",
      "TikTok automation (Coming)",
      "Multi-branch support",
      "Staff accounts & permissions",
      "Expense & cash management",
      "Supplier due tracking",
      "24/7 Phone + Email support",
      "Custom training session",
    ],
    cta: "Choose Business",
    ctaVariant: "default",
    popular: false,
    originalPrice: "৳39,998",
    originalPriceNumeric: 39998,
    savings: "Save ৳19,999",
    discountPercent: 50,
  },
  {
    id: "lifetime",
    name: "Lifetime",
    badge: "EXCLUSIVE",
    badgeColor: "bg-gradient-to-r from-primary to-secondary text-primary-foreground",
    price: "",
    priceNumeric: 0,
    period: "",
    description: "Pay once, use forever",
    features: [
      "Everything in Business",
      "Unlimited Facebook Pages",
      "Unlimited WhatsApp",
      "Lifetime updates",
      "All future features free",
      "Priority support forever",
      "VIP onboarding",
      "Custom integrations",
      "Dedicated account manager",
    ],
    cta: "Contact Us",
    ctaVariant: "gradient",
    popular: false,
  },
];

export const getPlanById = (id: string): Plan | undefined => {
  return plans.find((plan) => plan.id === id);
};
