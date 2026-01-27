import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Globe, Store, ChevronDown, Link2, Unlink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs sm:text-sm font-medium",
            currentMode === "online"
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
            className
          )}
        >
          {currentMode === "online" ? (
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
          <span className="hidden xs:inline sm:inline">
            {currentMode === "online" ? "Online" : "Offline"}
          </span>
          <span className="inline xs:hidden sm:hidden">
            {currentMode === "online" ? "On" : "Off"}
          </span>
          {syncEnabled && (
            <Link2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-success" />
          )}
          <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem
          onClick={() => handleModeChange("online")}
          className={cn(
            "flex items-center gap-3 py-3 cursor-pointer",
            currentMode === "online" && "bg-primary/5"
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Online Business</div>
            <div className="text-xs text-muted-foreground">AI & Automation</div>
          </div>
          {currentMode === "online" && (
            <Badge variant="outline" className="text-xs">Active</Badge>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleModeChange("offline")}
          className={cn(
            "flex items-center gap-3 py-3 cursor-pointer",
            currentMode === "offline" && "bg-emerald-500/5"
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <div className="font-medium">Offline Shop</div>
            <div className="text-xs text-muted-foreground">Inventory & POS</div>
          </div>
          {currentMode === "offline" && (
            <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/20">Active</Badge>
          )}
        </DropdownMenuItem>

        {syncEnabled && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-success">
                <Link2 className="w-3 h-3" />
                <span>Sync enabled – Inventory shared</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
