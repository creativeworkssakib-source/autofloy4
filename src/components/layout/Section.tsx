import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  /** Section ID for anchor links */
  id?: string;
  /** Vertical padding size */
  spacing?: "sm" | "md" | "lg" | "xl" | "none";
  /** Whether to include the container wrapper */
  container?: boolean;
  /** Container size when container is true */
  containerSize?: "default" | "wide" | "narrow";
}

/**
 * Consistent section component with standardized vertical spacing
 * - xl: py-20 lg:py-24 (80-96px) - Hero sections
 * - lg: py-16 lg:py-20 (64-80px) - Main sections
 * - md: py-12 lg:py-16 (48-64px) - Sub sections
 * - sm: py-8 lg:py-12 (32-48px) - Compact sections
 * - none: no padding
 */
const Section = ({ 
  children, 
  className,
  id,
  spacing = "lg",
  container = true,
  containerSize = "default"
}: SectionProps) => {
  const spacingClasses = {
    none: "",
    sm: "py-8 lg:py-12",
    md: "py-12 lg:py-16",
    lg: "py-16 lg:py-20",
    xl: "py-20 lg:py-24",
  };

  const containerClasses = {
    default: "max-w-7xl",
    wide: "max-w-screen-2xl",
    narrow: "max-w-md",
  };

  return (
    <section 
      id={id}
      className={cn(spacingClasses[spacing], className)}
    >
      {container ? (
        <div className={cn(
          "w-full mx-auto px-4 sm:px-6 lg:px-8",
          containerClasses[containerSize]
        )}>
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
};

export default Section;
