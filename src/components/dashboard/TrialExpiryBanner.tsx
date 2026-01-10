import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";

export function TrialExpiryBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!user) return null;
  if (user.subscriptionPlan !== "trial" || !user.isTrialActive) return null;

  const trialEndDate = user.trialEndDate ? new Date(user.trialEndDate) : null;
  if (!trialEndDate) return null;

  const now = new Date();
  const diffMs = trialEndDate.getTime() - now.getTime();
  const hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));

  // Always show for 24-hour trial
  const isUrgent = hoursRemaining <= 0;
  const isWarning = hoursRemaining <= 6; // Warning when 6 hours or less

  let bgColor = "bg-amber-500/10 border-amber-500/30";
  let textColor = "text-amber-600 dark:text-amber-400";
  let icon = <Clock className="h-4 w-4" />;
  let message = `Your free trial expires in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}`;

  if (isUrgent) {
    bgColor = "bg-destructive/10 border-destructive/30";
    textColor = "text-destructive";
    icon = <AlertTriangle className="h-4 w-4" />;
    message = "Your trial has expired!";
  } else if (isWarning) {
    bgColor = "bg-destructive/10 border-destructive/30";
    textColor = "text-destructive";
    icon = <AlertTriangle className="h-4 w-4" />;
  }

  return (
    <div className={`relative flex items-center justify-between gap-4 px-4 py-3 rounded-lg border ${bgColor} mb-4`}>
      <div className={`flex items-center gap-3 ${textColor}`}>
        {icon}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="gradient" size="sm" asChild>
          <Link to="/pricing">Upgrade Now</Link>
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-muted/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
