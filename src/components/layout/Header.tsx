import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Zap, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/UserAvatar";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuth();
  const { settings } = useSiteSettings();
  const { t } = useLanguage();

  const navLinks = [
    { name: t("nav.features"), href: "/#features" },
    { name: t("nav.pricing"), href: "/pricing" },
    { name: t("nav.faq"), href: "/#faq" },
    { name: t("nav.contact"), href: "/contact" },
  ];

  // Handle hash link navigation with smooth scroll
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      e.preventDefault();
      const targetId = href.substring(2); // Remove "/#"
      
      if (location.pathname === "/") {
        // Already on home page, just scroll
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        // Navigate to home first, then scroll
        navigate("/");
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, navigate]);

  // Check scroll position on mount, route change, and scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    // Check immediately on mount/route change
    handleScroll();
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]); // Re-run when route changes

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 will-change-transform animate-fade-in ${
        isScrolled
          ? "bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo - redirects to dashboard if logged in */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-[360deg] relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl pointer-events-none" />
              <Zap className="w-5 h-5 text-white relative z-10 drop-shadow-sm" />
            </div>
            <span className="text-2xl font-bold">
              Auto<span className="gradient-text">Floy</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = link.href.startsWith("/#") 
                ? location.pathname === "/" && location.hash === link.href.substring(1)
                : location.pathname === link.href || location.pathname.startsWith(link.href + "/");
              
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`transition-colors duration-200 font-medium relative group ${
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.name}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`} />
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <Button variant="ghost" asChild>
                      <Link to="/dashboard">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        {t("nav.dashboard")}
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="md" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <div className="flex items-center justify-start gap-2 p-2">
                          <div className="flex flex-col space-y-1 leading-none">
                            <p className="font-medium">{user.name}</p>
                            <p className="w-[200px] truncate text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard" className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            {t("nav.dashboard")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/settings" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            {t("nav.settings")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                          <LogOut className="mr-2 h-4 w-4" />
                          {t("nav.logout")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild>
                      <Link to="/login">{t("nav.login")}</Link>
                    </Button>
                    <Button variant="gradient" asChild>
                      <Link to="/signup">{t("nav.startTrial")}</Link>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border animate-accordion-down overflow-hidden">
          <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = link.href.startsWith("/#") 
                ? location.pathname === "/" && location.hash === link.href.substring(1)
                : location.pathname === link.href || location.pathname.startsWith(link.href + "/");
              
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`py-3 px-4 rounded-lg transition-all ${
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-muted-foreground">{t("nav.language")}</span>
                <LanguageToggle />
              </div>
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm text-muted-foreground">{t("nav.theme")}</span>
                <ThemeToggle />
              </div>
              {!isLoading && (
                <>
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-2">
                        <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/dashboard">
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          {t("nav.dashboard")}
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/dashboard/settings">
                          <Settings className="w-4 h-4 mr-2" />
                          {t("nav.settings")}
                        </Link>
                      </Button>
                      <Button variant="destructive" onClick={handleLogout} className="w-full">
                        <LogOut className="w-4 h-4 mr-2" />
                        {t("nav.logout")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/login">{t("nav.login")}</Link>
                      </Button>
                      <Button variant="gradient" asChild className="w-full">
                        <Link to="/signup">{t("nav.startTrial")}</Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
