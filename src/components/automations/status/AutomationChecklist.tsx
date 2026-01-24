import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  XCircle, 
  Facebook, 
  Bot, 
  Building2, 
  ToggleRight, 
  DollarSign,
  AlertTriangle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  isComplete: boolean;
  icon: React.ElementType;
}

interface AutomationChecklistProps {
  isConnected: boolean;
  isPageSelected: boolean;
  hasBusinessInfo: boolean;
  hasAutomationsEnabled: boolean;
  hasPricingRules: boolean;
  onItemClick?: (itemId: string) => void;
}

const AutomationChecklist = ({
  isConnected,
  isPageSelected,
  hasBusinessInfo,
  hasAutomationsEnabled,
  hasPricingRules,
  onItemClick,
}: AutomationChecklistProps) => {
  const checklistItems: ChecklistItem[] = [
    {
      id: "facebook_connected",
      label: "Facebook Connected",
      description: "Your Facebook account is linked",
      isComplete: isConnected,
      icon: Facebook,
    },
    {
      id: "page_selected",
      label: "Page Selected for Automation",
      description: "A Facebook page is enabled for AI automation",
      isComplete: isPageSelected,
      icon: Bot,
    },
    {
      id: "business_info",
      label: "Business Info Added",
      description: "Business description and services are configured",
      isComplete: hasBusinessInfo,
      icon: Building2,
    },
    {
      id: "automations_enabled",
      label: "Automation Toggles Enabled",
      description: "At least one automation feature is turned on",
      isComplete: hasAutomationsEnabled,
      icon: ToggleRight,
    },
    {
      id: "pricing_rules",
      label: "Pricing Rules Configured",
      description: "Selling and payment rules are set up",
      isComplete: hasPricingRules,
      icon: DollarSign,
    },
  ];

  const completedCount = checklistItems.filter(item => item.isComplete).length;
  const allComplete = completedCount === checklistItems.length;
  const progress = (completedCount / checklistItems.length) * 100;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {allComplete ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-warning" />
            )}
            Automation Checklist
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{checklistItems.length} completed
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              allComplete 
                ? "bg-success" 
                : "bg-gradient-to-r from-warning to-primary"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {checklistItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => !item.isComplete && onItemClick?.(item.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all",
              item.isComplete 
                ? "bg-success/5 border-success/20" 
                : "bg-destructive/5 border-destructive/20 cursor-pointer hover:bg-destructive/10"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg",
              item.isComplete ? "bg-success/10" : "bg-destructive/10"
            )}>
              <item.icon className={cn(
                "h-4 w-4",
                item.isComplete ? "text-success" : "text-destructive"
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium text-sm",
                item.isComplete ? "text-foreground" : "text-destructive"
              )}>
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {item.description}
              </p>
            </div>
            
            {item.isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
            )}
          </motion.div>
        ))}

        {/* Warning message if not complete */}
        {!allComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30"
          >
            <p className="text-sm text-warning font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Automation not fully ready – please complete setup
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutomationChecklist;
