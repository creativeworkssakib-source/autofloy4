import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Bot,
  FileText,
  Settings,
  Zap,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Crown,
  BarChart3,
  Package,
  Shield,
  Store,
  Globe,
  Link2,
  MessageSquare,
  ShoppingBag,
  FileCode,
  Key,
  DollarSign,
  ImageIcon,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProductType } from "@/contexts/ProductTypeContext";
import { UserAvatar } from "@/components/UserAvatar";
import { SubscriptionCard } from "./SubscriptionCard";
import { BusinessModeSwitcher } from "./BusinessModeSwitcher";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { ProductTypeSwitcher } from "./ProductTypeSwitcher";
import { useSyncSettings } from "@/hooks/useSyncSettings";
import { checkAdminRole } from "@/services/adminService";
import Footer from "@/components/layout/Footer";
import { FeatureDisabledOverlay } from "@/components/FeatureDisabledOverlay";
import { NoSubscriptionOverlay } from "@/components/NoSubscriptionOverlay";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();
  const { syncEnabled } = useSyncSettings();
  const { t, language } = useLanguage();
  const { isDigitalMode } = useProductType();
  const { hasOnlineAccess, hasActiveSubscription, isTrialExpired, planId } = usePlanLimits();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationContext();

  // Physical product menu items
  const physicalNavItems = [
    { name: t("sidebar.dashboard"), href: "/dashboard", icon: LayoutDashboard, pageTitle: t("sidebar.dashboard"), subtitle: t("dashboard.overview") },
    { name: t("sidebar.automations"), href: "/dashboard/automations", icon: Bot, pageTitle: t("sidebar.automations"), subtitle: t("dashboard.automationsAnalytics") },
    { name: language === "bn" ? "AI অর্ডার" : "AI Orders", href: "/dashboard/orders", icon: ShoppingBag, pageTitle: language === "bn" ? "AI অর্ডার" : "AI Orders", subtitle: language === "bn" ? "AI থেকে অর্ডার" : "Orders from AI" },
    { name: t("sidebar.products"), href: "/dashboard/products", icon: Package, pageTitle: t("sidebar.products"), subtitle: t("dashboard.totalProducts") },
    { name: language === "bn" ? "AI মিডিয়া" : "AI Media", href: "/dashboard/ai-media", icon: ImageIcon, pageTitle: language === "bn" ? "AI মিডিয়া লাইব্রেরি" : "AI Media Library", subtitle: language === "bn" ? "প্রোডাক্টের ফটো/ভিডিও" : "Product Photos/Videos" },
    { name: language === "bn" ? "ফলো-আপ" : "Follow-ups", href: "/dashboard/customer-followups", icon: Users, pageTitle: language === "bn" ? "কাস্টমার ফলো-আপ" : "Customer Follow-ups", subtitle: language === "bn" ? "AI কাস্টমার ফলো-আপ" : "AI Customer Follow-ups" },
    { name: t("sidebar.businessOverview"), href: "/dashboard/business", icon: BarChart3, pageTitle: t("sidebar.businessOverview"), subtitle: t("dashboard.overview") },
    { name: t("sidebar.globalReports"), href: "/dashboard/reports", icon: BarChart3, pageTitle: t("sidebar.globalReports"), subtitle: t("dashboard.onlineOffline") },
    { name: t("sidebar.logs"), href: "/dashboard/logs", icon: FileText, pageTitle: t("sidebar.logs"), subtitle: t("dashboard.recentActivity") },
    { name: t("sidebar.syncSettings"), href: "/dashboard/sync", icon: Link2, pageTitle: t("sidebar.syncSettings"), subtitle: t("sync.desc") },
    { name: language === "bn" ? "মার্কেটিং" : "Marketing", href: "/dashboard/marketing", icon: MessageSquare, pageTitle: language === "bn" ? "মার্কেটিং টুলস" : "Marketing Tools", subtitle: language === "bn" ? "WhatsApp মার্কেটিং" : "WhatsApp Marketing" },
    { name: t("sidebar.settings"), href: "/dashboard/settings", icon: Settings, pageTitle: t("sidebar.settings"), subtitle: t("settings.profileDesc") },
  ];

  // Digital product menu items
  const digitalNavItems = [
    { name: t("sidebar.dashboard"), href: "/dashboard", icon: LayoutDashboard, pageTitle: t("sidebar.dashboard"), subtitle: language === "bn" ? "ডিজিটাল বিজনেস ওভারভিউ" : "Digital Business Overview" },
    { name: t("sidebar.automations"), href: "/dashboard/automations", icon: Bot, pageTitle: t("sidebar.automations"), subtitle: language === "bn" ? "AI অটোমেশন সেটআপ" : "AI Automation Setup" },
    { name: language === "bn" ? "ডিজিটাল অর্ডার" : "Digital Orders", href: "/dashboard/orders", icon: ShoppingBag, pageTitle: language === "bn" ? "ডিজিটাল অর্ডার" : "Digital Orders", subtitle: language === "bn" ? "AI থেকে ডিজিটাল সেল" : "Digital sales from AI" },
    { name: language === "bn" ? "ডিজিটাল প্রোডাক্ট" : "Digital Products", href: "/dashboard/digital-products", icon: FileCode, pageTitle: language === "bn" ? "ডিজিটাল প্রোডাক্ট" : "Digital Products", subtitle: language === "bn" ? "সাবস্ক্রিপশন, API, কোর্স" : "Subscriptions, APIs, Courses" },
    { name: language === "bn" ? "AI মিডিয়া" : "AI Media", href: "/dashboard/ai-media", icon: ImageIcon, pageTitle: language === "bn" ? "AI মিডিয়া লাইব্রেরি" : "AI Media Library", subtitle: language === "bn" ? "প্রোডাক্টের ফটো/ভিডিও" : "Product Photos/Videos" },
    { name: language === "bn" ? "ফলো-আপ" : "Follow-ups", href: "/dashboard/customer-followups", icon: Users, pageTitle: language === "bn" ? "কাস্টমার ফলো-আপ" : "Customer Follow-ups", subtitle: language === "bn" ? "AI কাস্টমার ফলো-আপ" : "AI Customer Follow-ups" },
    { name: language === "bn" ? "সেলস রিপোর্ট" : "Sales Report", href: "/dashboard/reports", icon: DollarSign, pageTitle: language === "bn" ? "সেলস রিপোর্ট" : "Sales Report", subtitle: language === "bn" ? "ডিজিটাল সেলস এনালাইটিক্স" : "Digital Sales Analytics" },
    { name: t("sidebar.logs"), href: "/dashboard/logs", icon: FileText, pageTitle: t("sidebar.logs"), subtitle: t("dashboard.recentActivity") },
    { name: t("sidebar.settings"), href: "/dashboard/settings", icon: Settings, pageTitle: t("sidebar.settings"), subtitle: t("settings.profileDesc") },
  ];

  // Use the appropriate nav items based on mode
  const navItems = isDigitalMode ? digitalNavItems : physicalNavItems;

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const result = await checkAdminRole();
          setIsAdmin(result.isAdmin);
        } catch {
          setIsAdmin(false);
        }
      }
    };
    checkAdmin();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  // Check if online business is disabled by admin
  const isOnlineBusinessDisabled = settings.online_business_enabled === false;
  
  // Check if account is suspended
  const isSuspended = user?.is_suspended === true;
  
  // Routes that should still work even without active subscription (settings, sync, pricing navigation)
  const allowedRoutesWhenNoSub = ['/dashboard/settings'];
  const isAllowedRoute = allowedRoutesWhenNoSub.some(route => location.pathname.startsWith(route));
  
  // Determine which overlay to show for no subscription
  const getNoSubType = (): "no_plan" | "trial_expired" | "subscription_expired" | "suspended" | null => {
    // Priority 0: Suspended account - block everything
    if (isSuspended) return "suspended";
    
    // Priority 1: Trial expired
    if (isTrialExpired) return "trial_expired";
    
    // Priority 2: No active subscription at all
    if (!hasActiveSubscription) {
      // Check if it was a paid plan that expired
      if (planId !== "none" && planId !== "trial") {
        return "subscription_expired";
      }
      // No plan at all
      return "no_plan";
    }
    
    return null;
  };
  const noSubType = getNoSubType();
  
  // First priority: Suspended or no active subscription - block access (except settings)
  const shouldShowNoSubscriptionOverlay = noSubType !== null && !isAllowedRoute;
  
  // Second priority: Show overlay for users without online access (offline-only subscription)
  const noOnlineAccess = !hasOnlineAccess;
  const shouldShowNoAccessOverlay = !shouldShowNoSubscriptionOverlay && noOnlineAccess && !isAllowedRoute;
  
  // Third priority: Only show admin-disabled overlay for online business features
  const shouldShowDisabledOverlay = !shouldShowNoSubscriptionOverlay && !noOnlineAccess && isOnlineBusinessDisabled && !isAllowedRoute;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-card via-card to-card/95 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/5">
        {/* Top row - Logo, notifications, menu */}
        <div className="h-14 flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt={settings.company_name} className="w-6 h-6 rounded-lg object-contain" />
              ) : (
                <Zap className="w-5 h-5 text-primary-foreground" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight">{settings.company_name}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Dashboard</span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onRemove={removeNotification}
              onClearAll={clearAll}
            />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 hover:bg-muted/80 rounded-xl transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Bottom row - Unified elegant switcher bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            {/* Business Mode - Compact elegant button */}
            <BusinessModeSwitcher syncEnabled={syncEnabled} />
            
            {/* Separator dot */}
            <div className="w-1 h-1 rounded-full bg-border/80" />
            
            {/* Product Type - Compact elegant toggle */}
            <ProductTypeSwitcher />
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-full sm:w-72 lg:w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </motion.div>
              <span className="text-lg sm:text-xl font-bold">
                Auto<span className="gradient-text">Floy</span>
              </span>
            </Link>
            {/* Mobile close button inside sidebar */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subscription Card */}
          <div className="p-3 sm:p-4 overflow-hidden">
            <SubscriptionCard user={user} />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 sm:px-3 py-3 sm:py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm sm:text-base ${
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}

            {/* Admin Link - Only shown to admins */}
            {isAdmin && (
              <div className="pt-3 sm:pt-4 border-t border-border mt-3 sm:mt-4">
                <Link
                  to="/admin/users"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm sm:text-base"
                >
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{t("sidebar.adminPanel")}</span>
                </Link>
              </div>
            )}
          </nav>

          {/* User Menu */}
          <div className="p-3 sm:p-4 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-muted transition-colors">
                  <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size="md" />
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-xs sm:text-sm truncate">{user?.name || "User"}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email || ""}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t("sidebar.profileSettings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/pricing" className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    {t("sidebar.upgradePlan")}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/users" className="flex items-center gap-2 text-destructive">
                        <Shield className="w-4 h-4" />
                        {t("sidebar.adminPanel")}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  {t("sidebar.logOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-[6.5rem] lg:pt-0 min-h-screen flex flex-col">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">
              {navItems.find((item) => isActive(item.href))?.pageTitle || "Dashboard"}
            </h1>
            
            {/* Business Mode Switcher */}
            <BusinessModeSwitcher syncEnabled={syncEnabled} />
            
            {/* Product Type Switcher - Physical vs Digital */}
            <ProductTypeSwitcher />
            
            {/* Sync Status */}
            <SyncStatusBadge syncEnabled={syncEnabled} mode="online" />
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onRemove={removeNotification}
              onClearAll={clearAll}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted transition-colors">
                  <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size="sm" />
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t("sidebar.profileSettings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/pricing" className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    {t("sidebar.upgradePlan")}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/users" className="flex items-center gap-2 text-destructive">
                        <Shield className="w-4 h-4" />
                        {t("sidebar.adminPanel")}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  {t("sidebar.logOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 relative">
          {/* Priority 1: Show overlay if user has no active subscription */}
          {shouldShowNoSubscriptionOverlay && noSubType && (
            <NoSubscriptionOverlay 
              type={noSubType}
              userName={user?.name}
            />
          )}
          
          {/* Priority 2: Show frozen overlay if user doesn't have online access (except for sync/settings pages) */}
          {!shouldShowNoSubscriptionOverlay && shouldShowNoAccessOverlay && (
            <FeatureDisabledOverlay 
              featureName={language === "bn" ? "অনলাইন বিজনেস" : "Online Business"} 
              featureType="online"
              customMessage={language === "bn" 
                ? "আপনার শুধু Offline Shop subscription আছে। Online Business ফিচার ব্যবহার করতে Online plan upgrade করুন।"
                : "You have an Offline Shop subscription only. Please upgrade to an Online plan to use Online Business features."
              }
            />
          )}
          
          {/* Priority 3: Show frozen overlay if feature is disabled by admin (except for sync/settings pages) */}
          {!shouldShowNoSubscriptionOverlay && !shouldShowNoAccessOverlay && shouldShowDisabledOverlay && (
            <FeatureDisabledOverlay featureName={language === "bn" ? "অনলাইন বিজনেস" : "Online Business"} featureType="online" />
          )}
          {children}
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default DashboardLayout;
