import { memo, forwardRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
type IconVariant = "default" | "gradient" | "glass" | "solid" | "outlined" | "glow" | "3d";
type IconColor = "primary" | "secondary" | "accent" | "success" | "warning" | "destructive" | "muted";

interface PremiumIconProps {
  icon: LucideIcon;
  size?: IconSize;
  variant?: IconVariant;
  color?: IconColor;
  animated?: boolean;
  pulse?: boolean;
  className?: string;
  iconClassName?: string;
}

const sizeConfig: Record<IconSize, { container: string; icon: string }> = {
  xs: { container: "w-6 h-6", icon: "w-3 h-3" },
  sm: { container: "w-8 h-8", icon: "w-4 h-4" },
  md: { container: "w-10 h-10", icon: "w-5 h-5" },
  lg: { container: "w-12 h-12", icon: "w-6 h-6" },
  xl: { container: "w-14 h-14", icon: "w-7 h-7" },
  "2xl": { container: "w-16 h-16", icon: "w-8 h-8" },
};

const colorConfig: Record<IconColor, { bg: string; text: string; gradient: string; border: string; glow: string }> = {
  primary: {
    bg: "bg-primary/15",
    text: "text-primary",
    gradient: "from-primary to-primary-glow",
    border: "border-primary/30",
    glow: "shadow-[0_0_20px_hsl(var(--primary)/0.4)]",
  },
  secondary: {
    bg: "bg-secondary/15",
    text: "text-secondary",
    gradient: "from-secondary to-primary",
    border: "border-secondary/30",
    glow: "shadow-[0_0_20px_hsl(var(--secondary)/0.4)]",
  },
  accent: {
    bg: "bg-accent/15",
    text: "text-accent",
    gradient: "from-accent to-secondary",
    border: "border-accent/30",
    glow: "shadow-[0_0_20px_hsl(var(--accent)/0.4)]",
  },
  success: {
    bg: "bg-success/15",
    text: "text-success",
    gradient: "from-success to-primary",
    border: "border-success/30",
    glow: "shadow-[0_0_20px_hsl(var(--success)/0.4)]",
  },
  warning: {
    bg: "bg-warning/15",
    text: "text-warning",
    gradient: "from-warning to-accent",
    border: "border-warning/30",
    glow: "shadow-[0_0_20px_hsl(var(--warning)/0.4)]",
  },
  destructive: {
    bg: "bg-destructive/15",
    text: "text-destructive",
    gradient: "from-destructive to-accent",
    border: "border-destructive/30",
    glow: "shadow-[0_0_20px_hsl(var(--destructive)/0.4)]",
  },
  muted: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    gradient: "from-muted to-background",
    border: "border-border",
    glow: "shadow-md",
  },
};

const getVariantStyle = (variant: IconVariant, color: IconColor): string => {
  const c = colorConfig[color];
  
  switch (variant) {
    case "default":
      return cn(c.bg, c.text, "rounded-xl");
    case "gradient":
      return cn(`bg-gradient-to-br ${c.gradient}`, "text-white rounded-xl shadow-lg");
    case "glass":
      return cn("bg-card/60 backdrop-blur-xl border", c.border, c.text, "rounded-xl");
    case "solid":
      return cn(
        color === "primary" ? "bg-primary" :
        color === "secondary" ? "bg-secondary" :
        color === "accent" ? "bg-accent" :
        color === "success" ? "bg-success" :
        color === "warning" ? "bg-warning" :
        color === "destructive" ? "bg-destructive" : "bg-muted",
        "text-white rounded-xl shadow-lg"
      );
    case "outlined":
      return cn("bg-transparent border-2", c.border, c.text, "rounded-xl");
    case "glow":
      return cn(`bg-gradient-to-br ${c.gradient}`, "text-white rounded-xl", c.glow);
    case "3d":
      return cn(`bg-gradient-to-br ${c.gradient}`, "text-white rounded-xl shadow-xl premium-icon-3d");
    default:
      return cn(c.bg, c.text, "rounded-xl");
  }
};

export const PremiumIcon = memo(forwardRef<HTMLDivElement, PremiumIconProps>(({
  icon: Icon,
  size = "md",
  variant = "gradient",
  color = "primary",
  animated = false,
  pulse = false,
  className,
  iconClassName,
}, ref) => {
  const sizeStyles = sizeConfig[size];
  const variantStyle = getVariantStyle(variant, color);

  return (
    <motion.div
      ref={ref}
      className={cn(
        "premium-icon relative flex items-center justify-center overflow-hidden",
        sizeStyles.container,
        variantStyle,
        pulse && "animate-pulse-subtle",
        className
      )}
      whileHover={animated ? { scale: 1.1, rotate: 5 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Inner shine effect for 3D variant */}
      {variant === "3d" && (
        <div className="premium-icon-shine" />
      )}
      
      {/* Top highlight for gradient/3d */}
      {(variant === "gradient" || variant === "3d" || variant === "glow") && (
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent rounded-t-xl pointer-events-none" />
      )}
      
      <Icon className={cn(sizeStyles.icon, "relative z-10", iconClassName)} />
    </motion.div>
  );
}));

PremiumIcon.displayName = "PremiumIcon";

// Premium Icon Wrapper for simple icon enhancement
interface IconWrapperProps {
  children: ReactNode;
  gradient?: string;
  size?: IconSize;
  className?: string;
  animated?: boolean;
}

export const IconWrapper = memo(({
  children,
  gradient = "from-primary to-secondary",
  size = "md",
  className,
  animated = true,
}: IconWrapperProps) => {
  return (
    <motion.div
      className={cn(
        "premium-icon relative flex items-center justify-center rounded-xl overflow-hidden",
        `bg-gradient-to-br ${gradient}`,
        "shadow-lg",
        sizeConfig[size].container,
        className
      )}
      whileHover={animated ? { scale: 1.1, rotate: 5 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {/* Shine effect */}
      <div className="premium-icon-shine" />
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl pointer-events-none" />
      
      <div className="relative z-10 text-white">
        {children}
      </div>
    </motion.div>
  );
});

IconWrapper.displayName = "IconWrapper";

export default PremiumIcon;
