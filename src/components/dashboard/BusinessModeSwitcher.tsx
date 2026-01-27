import { useNavigate, useLocation } from "react-router-dom";
import { Globe, Store, ChevronDown, Link2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BusinessMode = "online" | "offline";

interface BusinessModeSwitcherProps {
  syncEnabled?: boolean;
  variant?: "pill" | "dropdown";
  className?: string;
}

export const BusinessModeSwitcher = ({
  syncEnabled = false,
  variant = "dropdown",
  className,
}: BusinessModeSwitcherProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isOfflineMode = location.pathname.startsWith("/offline-shop");
  const currentMode: BusinessMode = isOfflineMode ? "offline" : "online";

  const handleModeChange = (mode: BusinessMode) => {
    if (mode === "offline") {
      navigate("/offline-shop");
    } else {
      navigate("/dashboard");
    }
  };

  if (variant === "pill") {
    return (
      <div className={cn("inline-flex rounded-full p-1 bg-muted", className)}>
        <button
          onClick={() => handleModeChange("online")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            currentMode === "online"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Globe className="w-4 h-4" />
          Online Business
        </button>
        <button
          onClick={() => handleModeChange("offline")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            currentMode === "offline"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Store className="w-4 h-4" />
          Offline Shop
        </button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "group flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 text-xs font-semibold border shadow-sm",
            currentMode === "online"
              ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-primary/20 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10"
              : "bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/10",
            className
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
            currentMode === "online" 
              ? "bg-primary/15" 
              : "bg-emerald-500/15"
          )}>
            {currentMode === "online" ? (
              <Globe className="w-3 h-3" />
            ) : (
              <Store className="w-3 h-3" />
            )}
          </div>
          <span className="hidden xs:inline">
            {currentMode === "online" ? "Online" : "Offline"}
          </span>
          {syncEnabled && (
            <Link2 className="w-2.5 h-2.5 text-emerald-500" />
          )}
          <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2">
        <DropdownMenuItem
          onClick={() => handleModeChange("online")}
          className={cn(
            "flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-all",
            currentMode === "online" && "bg-primary/5 border border-primary/10"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
            currentMode === "online" 
              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25" 
              : "bg-primary/10 text-primary"
          )}>
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Online Business</div>
            <div className="text-xs text-muted-foreground">AI & Automation</div>
          </div>
          {currentMode === "online" && (
            <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/20 text-primary">Active</Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          onClick={() => handleModeChange("offline")}
          className={cn(
            "flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-all",
            currentMode === "offline" && "bg-emerald-500/5 border border-emerald-500/10"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
            currentMode === "offline" 
              ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25" 
              : "bg-emerald-500/10 text-emerald-600"
          )}>
            <Store className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Offline Shop</div>
            <div className="text-xs text-muted-foreground">Inventory & POS</div>
          </div>
          {currentMode === "offline" && (
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 border-emerald-500/20 text-emerald-600">Active</Badge>
          )}
        </DropdownMenuItem>

        {syncEnabled && (
          <>
            <DropdownMenuSeparator className="my-2" />
            <div className="px-3 py-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Link2 className="w-3 h-3" />
                </div>
                <span className="font-medium">Sync enabled – Inventory shared</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};