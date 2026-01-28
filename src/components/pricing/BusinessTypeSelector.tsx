import { useState } from "react";
import { motion } from "framer-motion";
import { Store, Globe, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export type BusinessType = "online" | "offline" | "both";

interface BusinessTypeSelectorProps {
  value: BusinessType;
  onChange: (type: BusinessType) => void;
  className?: string;
  compact?: boolean;
}

const options = [
  { 
    id: "online" as const, 
    label: "Online", 
    icon: Globe,
  },
  { 
    id: "offline" as const, 
    label: "Offline", 
    icon: Store,
  },
  { 
    id: "both" as const, 
    label: "Both", 
    icon: Layers,
  },
];

export const BusinessTypeSelector = ({ 
  value, 
  onChange, 
  className,
  compact = false 
}: BusinessTypeSelectorProps) => {
  return (
    <div className={cn(
      "grid grid-cols-3 rounded-lg p-0.5 bg-muted/50 border border-border/50 gap-0.5",
      className
    )}>
      {options.map((option) => {
        const isActive = value === option.id;
        const Icon = option.icon;
        
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative flex items-center justify-center gap-1 rounded-md transition-all duration-200 whitespace-nowrap overflow-hidden",
              compact ? "px-1.5 py-1.5 text-[9px]" : "px-2 py-1.5 text-[10px]",
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span className="font-medium truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BusinessTypeSelector;
