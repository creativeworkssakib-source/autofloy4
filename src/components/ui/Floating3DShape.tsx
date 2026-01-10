import { memo } from "react";
import { cn } from "@/lib/utils";

type ShapeVariant = "cube" | "ring";
type ShapeSize = "sm" | "md" | "lg";
type ShapeColor = "primary" | "secondary" | "accent";

interface Floating3DShapeProps {
  className?: string;
  delay?: number;
  variant?: ShapeVariant;
  size?: ShapeSize;
  color?: ShapeColor;
}

const cubeSizes: Record<ShapeSize, string> = {
  sm: "w-14 h-14",
  md: "w-20 h-20",
  lg: "w-28 h-28",
};

const ringSizes: Record<ShapeSize, string> = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

const palettes: Record<ShapeColor, { bg: string; border: string; gradient: string } > = {
  primary: {
    bg: "bg-primary/10",
    border: "border-primary/25",
    gradient: "from-primary/25 to-secondary/10",
  },
  secondary: {
    bg: "bg-secondary/10",
    border: "border-secondary/25",
    gradient: "from-secondary/25 to-primary/10",
  },
  accent: {
    bg: "bg-accent/10",
    border: "border-accent/25",
    gradient: "from-accent/25 to-secondary/10",
  },
};

export const Floating3DShape = memo(({
  className,
  delay = 0,
  variant = "cube",
  size = "md",
  color = "primary",
}: Floating3DShapeProps) => {
  const palette = palettes[color];

  if (variant === "ring") {
    return (
      <div className={cn("absolute pointer-events-none preserve-3d", className)}>
        <div
          className={cn(
            "relative rounded-full border backdrop-blur-sm",
            ringSizes[size],
            palette.border,
            "animate-ring-3d will-change-transform"
          )}
          style={{ animationDelay: `${delay}s` }}
          aria-hidden="true"
        >
          <div
            className={cn(
              "absolute inset-4 rounded-full border",
              palette.border,
              "opacity-60"
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("absolute pointer-events-none preserve-3d", className)}>
      <div
        className={cn(
          "relative rounded-2xl border backdrop-blur-sm shadow-lg",
          cubeSizes[size],
          palette.bg,
          palette.border,
          "animate-cube-3d will-change-transform"
        )}
        style={{ animationDelay: `${delay}s` }}
        aria-hidden="true"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-2xl bg-gradient-to-br",
            palette.gradient,
            "opacity-70"
          )}
        />
      </div>
    </div>
  );
});

Floating3DShape.displayName = "Floating3DShape";

export default Floating3DShape;
