import { Link2, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SyncStatusBadgeProps {
  syncEnabled: boolean;
  mode: "online" | "offline";
  className?: string;
}

export const SyncStatusBadge = ({ syncEnabled, mode, className }: SyncStatusBadgeProps) => {
  if (!syncEnabled) return null;

  const message =
    mode === "online"
      ? "Using Offline Shop inventory"
      : "Inventory shared with Online Business";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "gap-1.5 text-xs font-medium cursor-help",
            "bg-success/10 text-success border-success/20",
            className
          )}
        >
          <Link2 className="w-3 h-3" />
          Sync: ON
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{message}</p>
      </TooltipContent>
    </Tooltip>
  );
};
