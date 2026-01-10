import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Use 'default' for standard content, 'wide' for full dashboard, 'narrow' for auth pages */
  size?: "default" | "wide" | "narrow";
}

/**
 * Consistent page container with standardized max-width and padding
 * - max-width: 1280px (default), 1536px (wide), 480px (narrow)
 * - horizontal padding: 24px desktop, 16px mobile
 * - centered content
 */
const PageContainer = ({ 
  children, 
  className,
  size = "default" 
}: PageContainerProps) => {
  const sizeClasses = {
    default: "max-w-7xl", // 1280px
    wide: "max-w-screen-2xl", // 1536px
    narrow: "max-w-md", // 480px
  };

  return (
    <div 
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8",
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageContainer;
