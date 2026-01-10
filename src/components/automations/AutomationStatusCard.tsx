import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Zap,
  Facebook,
  Clock,
  MessageCircle,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";

interface AutomationStatusCardProps {
  isActive: boolean;
  pageName: string;
  pageId: string;
  repliesToday: number;
  lastActivityTime: string | null;
  enabledAutomationsCount: number;
  totalAutomations: number;
}

const AutomationStatusCard = ({
  isActive,
  pageName,
  pageId,
  repliesToday,
  lastActivityTime,
  enabledAutomationsCount,
  totalAutomations,
}: AutomationStatusCardProps) => {
  const statusConfig = isActive
    ? {
        label: "Active",
        color: "text-success",
        bg: "bg-success/10",
        icon: CheckCircle2,
        badgeClass: "bg-success text-success-foreground",
      }
    : {
        label: "Paused",
        color: "text-muted-foreground",
        bg: "bg-muted/50",
        icon: PauseCircle,
        badgeClass: "bg-muted text-muted-foreground",
      };

  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Automation Status</CardTitle>
            </div>
            <Badge className={statusConfig.badgeClass}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* AI Engine Status */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-success/10">
                  <Zap className="h-4 w-4 text-success" />
                </div>
                <span className="text-xs text-muted-foreground">AI Engine</span>
              </div>
              <p className="font-semibold text-sm text-success">Running</p>
            </div>

            {/* Connected Page */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#1877F2]/10">
                  <Facebook className="h-4 w-4 text-[#1877F2]" />
                </div>
                <span className="text-xs text-muted-foreground">Page</span>
              </div>
              <p className="font-semibold text-sm truncate" title={pageName}>
                {pageName}
              </p>
            </div>

            {/* Last Activity */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-accent/10">
                  <Clock className="h-4 w-4 text-accent" />
                </div>
                <span className="text-xs text-muted-foreground">Last Activity</span>
              </div>
              <p className="font-semibold text-sm">
                {lastActivityTime || "No activity yet"}
              </p>
            </div>

            {/* Replies Today */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Replies Today</span>
              </div>
              <p className="font-semibold text-sm">{repliesToday}</p>
            </div>
          </div>

          {/* Automation Summary */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active Automations</span>
              <span className="font-medium">
                {enabledAutomationsCount} of {totalAutomations} enabled
              </span>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(enabledAutomationsCount / totalAutomations) * 100}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AutomationStatusCard;
