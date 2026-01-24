import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  XCircle, 
  ArrowRight,
  Building2,
  Package,
  ToggleRight,
  Facebook,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Warning {
  id: string;
  severity: "error" | "warning";
  title: string;
  description: string;
  icon: React.ElementType;
  actionLabel?: string;
  actionPath?: string;
}

interface AutomationWarningsProps {
  isConnected: boolean;
  hasBusinessDescription: boolean;
  hasProducts: boolean;
  hasAutomationsEnabled: boolean;
  onNavigate?: (path: string) => void;
}

const AutomationWarnings = ({
  isConnected,
  hasBusinessDescription,
  hasProducts,
  hasAutomationsEnabled,
  onNavigate,
}: AutomationWarningsProps) => {
  const warnings: Warning[] = [];

  if (!isConnected) {
    warnings.push({
      id: "not_connected",
      severity: "error",
      title: "Facebook not connected",
      description: "Connect your Facebook account to enable automation",
      icon: Facebook,
      actionLabel: "Connect Facebook",
      actionPath: "/connect-facebook",
    });
  }

  if (!hasBusinessDescription) {
    warnings.push({
      id: "no_business_desc",
      severity: "warning",
      title: "Business description missing",
      description: "AI cannot understand your business without a description",
      icon: Building2,
      actionLabel: "Add Description",
      actionPath: "/dashboard/facebook-settings",
    });
  }

  if (!hasProducts) {
    warnings.push({
      id: "no_products",
      severity: "warning",
      title: "No products added",
      description: "AI cannot provide accurate pricing without product catalog",
      icon: Package,
      actionLabel: "Add Products",
      actionPath: "/dashboard/products",
    });
  }

  if (!hasAutomationsEnabled) {
    warnings.push({
      id: "automations_off",
      severity: "error",
      title: "Automation toggles OFF",
      description: "Enable at least one automation feature to start AI replies",
      icon: ToggleRight,
      actionLabel: "Enable Automation",
      actionPath: "/dashboard/facebook-settings",
    });
  }

  if (warnings.length === 0) {
    return null;
  }

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          AI will NOT reply because:
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        <AnimatePresence>
          {warnings.map((warning, index) => (
            <motion.div
              key={warning.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                warning.severity === "error" 
                  ? "bg-destructive/10 border-destructive/30" 
                  : "bg-warning/10 border-warning/30"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg shrink-0",
                warning.severity === "error" ? "bg-destructive/20" : "bg-warning/20"
              )}>
                <warning.icon className={cn(
                  "h-4 w-4",
                  warning.severity === "error" ? "text-destructive" : "text-warning"
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm",
                  warning.severity === "error" ? "text-destructive" : "text-warning"
                )}>
                  {warning.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {warning.description}
                </p>
              </div>
              
              {warning.actionLabel && warning.actionPath && (
                <Button
                  size="sm"
                  variant={warning.severity === "error" ? "destructive" : "outline"}
                  className="shrink-0 gap-1 text-xs"
                  onClick={() => onNavigate?.(warning.actionPath!)}
                >
                  {warning.actionLabel}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default AutomationWarnings;
