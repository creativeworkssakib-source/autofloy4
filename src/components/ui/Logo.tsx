import autofloyLogoIcon from "@/assets/autofloy-logo-icon.png";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showCustomLogo?: boolean;
}

const sizeClasses = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-9 h-9 sm:w-10 sm:h-10",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
};

const Logo = ({ size = "md", className = "", showCustomLogo = true }: LogoProps) => {
  const { settings } = useSiteSettings();

  // If admin has set a custom logo, use that
  if (showCustomLogo && settings.logo_url) {
    return (
      <img 
        src={settings.logo_url} 
        alt={settings.company_name} 
        className={`${sizeClasses[size]} rounded-lg object-contain ${className}`}
      />
    );
  }

  // Default AutoFloy logo
  return (
    <img 
      src={autofloyLogoIcon} 
      alt="AutoFloy" 
      className={`${sizeClasses[size]} rounded-lg object-contain ${className}`}
    />
  );
};

export default Logo;
