import { forwardRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Deterministic color palette based on user name/id
const AVATAR_GRADIENTS = [
  "from-primary to-secondary",
  "from-secondary to-primary",
  "from-primary to-accent",
  "from-accent to-secondary",
  "from-secondary to-accent",
  "from-primary-glow to-primary",
  "from-success to-primary",
  "from-primary to-success",
];

/**
 * Generates initials from a name
 * - "John Doe" → "JD"
 * - "John" → "J"
 * - "MD Sakib" → "MS"
 */
function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return "U";
  
  const parts = name.trim().split(/\s+/).filter(Boolean);
  
  if (parts.length === 0) return "U";
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  // First letter of first name + first letter of last name
  const firstInitial = parts[0].charAt(0);
  const lastInitial = parts[parts.length - 1].charAt(0);
  
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

/**
 * Gets a deterministic gradient index based on name
 * Same name will always get the same color
 */
function getGradientIndex(name: string | null | undefined): number {
  if (!name) return 0;
  
  // Simple hash function to get a consistent number from a string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash) % AVATAR_GRADIENTS.length;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-24 w-24 text-2xl",
};

/**
 * UserAvatar - A consistent avatar component for the entire app
 * 
 * Features:
 * - Shows profile image when available
 * - Falls back to name initials with gradient background
 * - Deterministic colors (same user = same color)
 * - Properly centered text
 * - White text on brand gradient for high contrast
 */
export const UserAvatar = forwardRef<HTMLSpanElement, UserAvatarProps>(
  ({ name, avatarUrl, size = "md", className }, ref) => {
    const initials = getInitials(name);
    const gradientIndex = getGradientIndex(name);
    const gradient = AVATAR_GRADIENTS[gradientIndex];

    return (
      <Avatar ref={ref} className={cn(sizeClasses[size], className)}>
        {avatarUrl && (
          <AvatarImage 
            src={avatarUrl} 
            alt={name || "User"} 
            className="object-cover"
          />
        )}
        <AvatarFallback 
          className={cn(
            "bg-gradient-to-br text-white font-semibold",
            "flex items-center justify-center",
            gradient
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
    );
  }
);

UserAvatar.displayName = "UserAvatar";

export { getInitials };
