import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  XCircle, 
  Link, 
  Settings, 
  Zap 
} from "lucide-react";

export type AutomationStatus = 
  | "not_connected" 
  | "connected_no_automation" 
  | "automation_ready" 
  | "automation_running";

interface PageStatusBadgeProps {
  status: AutomationStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const statusConfig: Record<AutomationStatus, {
  label: string;
  icon: React.ElementType;
  className: string;
  description: string;
}> = {
  not_connected: {
    label: "Not Connected",
    icon: XCircle,
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
    description: "Facebook page is not connected",
  },
  connected_no_automation: {
    label: "Connected (No Automation)",
    icon: Link,
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    description: "Connected but automation not configured",
  },
  automation_ready: {
    label: "Automation Ready",
    icon: Settings,
    className: "bg-warning/10 text-warning border-warning/20",
    description: "Settings saved, waiting for toggles",
  },
  automation_running: {
    label: "Automation Running",
    icon: Zap,
    className: "bg-success/10 text-success border-success/20",
    description: "AI is actively responding",
  },
};

export function getAutomationStatus(
  isConnected: boolean,
  hasSettings: boolean,
  hasTogglesOn: boolean
): AutomationStatus {
  if (!isConnected) return "not_connected";
  if (!hasSettings) return "connected_no_automation";
  if (!hasTogglesOn) return "automation_ready";
  return "automation_running";
}

const PageStatusBadge = ({ 
  status, 
  size = "md",
  showIcon = true 
}: PageStatusBadgeProps) => {
  const config = statusConfig[status];
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 font-medium border",
        config.className,
        sizeClasses[size]
      )}
    >
      {showIcon && <IconComponent className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
};

export default PageStatusBadge;
export { statusConfig };
