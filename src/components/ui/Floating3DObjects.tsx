import { memo } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, Mail, Settings, Bot, Sparkles } from "lucide-react";

interface FloatingObjectProps {
  className?: string;
  delay?: number;
  icon: "chat" | "mail" | "gear" | "bot" | "sparkle";
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "accent";
}

const sizes = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};

const iconSizes = {
  sm: "w-5 h-5",
  md: "w-7 h-7",
  lg: "w-10 h-10",
};

const variants = {
  primary: "bg-primary/20 border-primary/30 text-primary",
  secondary: "bg-secondary/20 border-secondary/30 text-secondary",
  accent: "bg-accent/20 border-accent/30 text-accent-foreground",
};

const icons = {
  chat: MessageSquare,
  mail: Mail,
  gear: Settings,
  bot: Bot,
  sparkle: Sparkles,
};

const FloatingObject = memo(({ className, delay = 0, icon, size = "md", variant = "primary" }: FloatingObjectProps) => {
  const Icon = icons[icon];
  
  return (
    <div
      className={cn(
        "absolute rounded-xl border backdrop-blur-sm flex items-center justify-center shadow-lg animate-float-3d will-change-transform",
        sizes[size],
        variants[variant],
        className
      )}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden="true"
    >
      <Icon className={cn(iconSizes[size], "opacity-80")} />
    </div>
  );
});

FloatingObject.displayName = "FloatingObject";

// Floating Gear component with rotation
const FloatingGear = memo(({ className, delay = 0, size = "md", variant = "secondary" }: Omit<FloatingObjectProps, "icon">) => {
  return (
    <div
      className={cn(
        "absolute flex items-center justify-center will-change-transform",
        sizes[size],
        className
      )}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn(
          iconSizes[size],
          "animate-spin-slow",
          variant === "primary" ? "text-primary/60" : variant === "secondary" ? "text-secondary/60" : "text-accent/60"
        )}
        style={{ animationDelay: `${delay}s` }}
      >
        <path
          d="M12 15a3 3 0 100-6 3 3 0 000 6z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});

FloatingGear.displayName = "FloatingGear";

// Chat bubble component
const FloatingChatBubble = memo(({ className, delay = 0, variant = "primary" }: Omit<FloatingObjectProps, "icon" | "size">) => {
  return (
    <div
      className={cn(
        "absolute animate-float-3d will-change-transform",
        className
      )}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden="true"
    >
      <div className={cn(
        "px-4 py-2 rounded-2xl rounded-bl-sm backdrop-blur-sm border shadow-lg",
        variant === "primary" 
          ? "bg-primary/20 border-primary/30" 
          : variant === "secondary"
          ? "bg-secondary/20 border-secondary/30"
          : "bg-card/80 border-border/50"
      )}>
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-pulse" style={{ animationDelay: "0s" }} />
          <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-pulse" style={{ animationDelay: "0.2s" }} />
          <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
});

FloatingChatBubble.displayName = "FloatingChatBubble";

// Main floating 3D objects container for hero
export const Floating3DObjects = memo(() => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Left side objects - positioned away from center */}
      <FloatingGear 
        className="top-32 left-[2%] opacity-70" 
        size="lg" 
        variant="secondary" 
        delay={0}
      />
      <FloatingGear 
        className="top-[55%] left-[3%] opacity-50" 
        size="md" 
        variant="primary" 
        delay={1.5}
      />
      <FloatingObject 
        icon="mail" 
        className="top-[75%] left-[5%] opacity-60" 
        size="md" 
        variant="accent" 
        delay={0.8}
      />
      
      {/* Right side objects - positioned away from center */}
      <FloatingGear 
        className="bottom-[15%] right-[2%] opacity-60" 
        size="lg" 
        variant="secondary" 
        delay={0.5}
      />
      <FloatingGear 
        className="top-[40%] right-[3%] opacity-40" 
        size="md" 
        variant="primary" 
        delay={2}
      />
      <FloatingObject 
        icon="sparkle" 
        className="top-[25%] right-[5%] opacity-50" 
        size="sm" 
        variant="secondary" 
        delay={1}
      />
    </div>
  );
});

Floating3DObjects.displayName = "Floating3DObjects";

export { FloatingObject, FloatingGear, FloatingChatBubble };
