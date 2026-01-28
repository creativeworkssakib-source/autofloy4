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
    labelBn: "অনলাইন",
    icon: Globe,
    description: "Facebook/Instagram automation"
  },
  { 
    id: "offline" as const, 
    label: "Offline Shop", 
    labelBn: "অফলাইন শপ",
    icon: Store,
    description: "POS & inventory system"
  },
  { 
    id: "both" as const, 
    label: "Both", 
    labelBn: "দুটোই",
    icon: Layers,
    description: "Complete solution"
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
      "flex rounded-lg p-0.5 bg-muted/50 border border-border/50",
      compact ? "gap-0.5" : "gap-1",
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
              "relative flex-1 flex items-center justify-center gap-1 rounded-md transition-all duration-200",
              compact ? "px-2 py-1.5 text-[10px]" : "px-3 py-2 text-xs",
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
            <span className="font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BusinessTypeSelector;
