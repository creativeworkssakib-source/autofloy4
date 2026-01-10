import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight, Sparkles, Crown, Zap } from "lucide-react";
import { plans, Plan } from "@/data/plans";
import { Link } from "react-router-dom";

interface PlanComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  targetPlan?: string;
}

const allFeatures = [
  { key: "pages", label: "Facebook Pages", values: { trial: "Unlimited", starter: "1", professional: "5", business: "Unlimited", lifetime: "Unlimited" } },
  { key: "automations", label: "Automations/month", values: { trial: "Unlimited", starter: "100", professional: "1000", business: "Unlimited", lifetime: "Unlimited" } },
  { key: "messageReply", label: "Message Auto-reply", values: { trial: true, starter: true, professional: true, business: true, lifetime: true } },
  { key: "commentReply", label: "Comment Auto-reply", values: { trial: true, starter: false, professional: true, business: true, lifetime: true } },
  { key: "imageAI", label: "Image AI Analysis", values: { trial: true, starter: false, professional: true, business: true, lifetime: true } },
  { key: "voiceAI", label: "Voice AI Response", values: { trial: true, starter: false, professional: true, business: true, lifetime: true } },
  { key: "analytics", label: "Analytics", values: { trial: "Basic", starter: "Basic", professional: "Advanced", business: "Advanced", lifetime: "Advanced" } },
  { key: "support", label: "Support", values: { trial: "Email", starter: "Email", professional: "Priority Email", business: "24/7 Phone + Email", lifetime: "Priority Forever" } },
  { key: "whatsapp", label: "WhatsApp (Coming Soon)", values: { trial: false, starter: false, professional: false, business: true, lifetime: true } },
  { key: "training", label: "Custom Training", values: { trial: false, starter: false, professional: false, business: true, lifetime: true } },
];

const getPlanOrder = (planId: string): number => {
  const order: Record<string, number> = { trial: 0, none: 0, starter: 1, professional: 2, business: 3, lifetime: 4 };
  return order[planId] ?? 0;
};

export function PlanComparisonModal({ open, onOpenChange, currentPlan, targetPlan }: PlanComparisonModalProps) {
  const currentPlanData = plans.find(p => p.id === currentPlan || p.id === `free-${currentPlan}`) || plans[0];
  const targetPlanData = targetPlan ? plans.find(p => p.id === targetPlan) : null;
  
  const upgradePlans = plans.filter(p => 
    p.id !== "free-trial" && 
    getPlanOrder(p.id) > getPlanOrder(currentPlan)
  );

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="w-4 h-4 text-success" />
      ) : (
        <X className="w-4 h-4 text-muted-foreground/50" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  const getPlanIcon = (planId: string) => {
    if (planId === "lifetime") return <Crown className="w-4 h-4" />;
    if (planId === "business") return <Sparkles className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            Compare features and choose the best plan for your business
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Current Plan Badge */}
          <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="font-semibold text-lg capitalize">{currentPlan === "none" ? "No Plan" : currentPlan}</p>
              </div>
              {currentPlan !== "lifetime" && (
                <Badge variant="secondary">
                  {currentPlan === "trial" ? "Trial Active" : "Active"}
                </Badge>
              )}
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Feature</th>
                  {upgradePlans.map(plan => (
                    <th key={plan.id} className="text-center py-3 px-2">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1 font-semibold">
                          {getPlanIcon(plan.id)}
                          {plan.name}
                        </div>
                        <div className="text-primary font-bold">{plan.price}</div>
                        <div className="text-xs text-muted-foreground">{plan.period}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature, idx) => (
                  <tr key={feature.key} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                    <td className="py-3 px-2 text-sm font-medium">{feature.label}</td>
                    {upgradePlans.map(plan => (
                      <td key={plan.id} className="text-center py-3 px-2">
                        {renderFeatureValue(feature.values[plan.id as keyof typeof feature.values] ?? false)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA Buttons */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {upgradePlans.map(plan => (
              <Button
                key={plan.id}
                variant={plan.popular ? "gradient" : "outline"}
                className="w-full gap-2"
                asChild
              >
                <Link to={`/checkout?plan=${plan.id}`} onClick={() => onOpenChange(false)}>
                  Choose {plan.name}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            ))}
          </div>

          {/* Money Back Guarantee */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            30-day money-back guarantee on all paid plans
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
