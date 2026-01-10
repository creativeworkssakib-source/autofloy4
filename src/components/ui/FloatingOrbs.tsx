import { motion } from "framer-motion";
import { memo } from "react";

interface OrbProps {
  className?: string;
  delay?: number;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "accent";
}

const sizeClasses = {
  sm: "w-32 h-32",
  md: "w-48 h-48",
  lg: "w-64 h-64",
};

const colorClasses = {
  primary: "bg-primary/20",
  secondary: "bg-secondary/20",
  accent: "bg-accent/20",
};

const FloatingOrb = memo(({ 
  className = "", 
  delay = 0, 
  size = "md",
  color = "primary"
}: OrbProps) => {
  return (
    <div
      className={`absolute rounded-full blur-3xl ${sizeClasses[size]} ${colorClasses[color]} ${className} animate-float-slow`}
      style={{ 
        animationDelay: `${delay}s`,
        willChange: "transform, opacity",
      }}
    />
  );
});

FloatingOrb.displayName = "FloatingOrb";

export const FloatingOrbs = memo(() => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <FloatingOrb className="top-20 -left-20" size="lg" color="primary" delay={0} />
      <FloatingOrb className="bottom-1/3 right-0" size="md" color="secondary" delay={2} />
      <FloatingOrb className="bottom-20 left-1/4" size="sm" color="accent" delay={4} />
    </div>
  );
});

FloatingOrbs.displayName = "FloatingOrbs";

export default FloatingOrbs;
