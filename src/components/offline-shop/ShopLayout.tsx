import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wallet, 
  Settings,
  Link2,
  Menu,
  Store,
  LogOut,
  ChevronDown,
  PackagePlus,
  Truck,
  AlertTriangle,
  Banknote,
  BarChart3,
  RotateCcw,
  Trash2,
  MessageSquareMore,
  Scan,
  Landmark,
  Receipt,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { DynamicDocumentTitle } from "@/components/DynamicDocumentTitle";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BusinessModeSwitcher } from "@/components/dashboard/BusinessModeSwitcher";
import { SyncStatusBadge } from "@/components/dashboard/SyncStatusBadge";
import { ShopSelector } from "@/components/offline-shop/ShopSelector";
import { useSyncSettings } from "@/hooks/useSyncSettings";
import { useOfflineShopTrial, useOfflineGracePeriod } from "@/hooks/useOfflineShopTrial";
import OfflineTrialBanner from "./OfflineTrialBanner";
import OfflineTrialExpiredOverlay from "./OfflineTrialExpiredOverlay";
import { FeatureDisabledOverlay } from "@/components/FeatureDisabledOverlay";
import { OfflineStatusBar } from "./OfflineStatusBar";
import { OfflineExpiredModal } from "./OfflineExpiredModal";
import { FloatingSyncIndicator } from "./SyncProgressIndicator";
import { offlineDataService } from "@/services/offlineDataService";
import { syncManager } from "@/services/syncManager";
import { appUpdateService } from "@/services/appUpdateService";
import { useShop } from "@/contexts/ShopContext";

interface ShopLayoutProps {
  children: ReactNode;
}

const ShopLayout = ({ children }: ShopLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();
  const { syncEnabled } = useSyncSettings();
  const { isTrialUser, isOfflineTrialExpired } = useOfflineShopTrial();
  const { isExpired: isOfflineExpired } = useOfflineGracePeriod();
  const { currentShop } = useShop();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOfflineExpiredModal, setShowOfflineExpiredModal] = useState(false);

  // Check if offline shop is disabled by admin
  const isOfflineShopDisabled = settings.offline_shop_enabled === false;

  // Initialize offline data service with shop and user IDs
  useEffect(() => {
    const initOfflineService = async () => {
      await offlineDataService.init();
      if (user?.id) {
        offlineDataService.setUserId(user.id);
      }
      if (currentShop?.id) {
        offlineDataService.setShopId(currentShop.id);
      }
      // Start auto sync (every 30 seconds)
      syncManager.startAutoSync(30000);
      
      // Start auto update check (every 30 minutes)
      // This ensures APK/EXE/PWA gets latest settings when admin makes changes
      appUpdateService.startAutoCheck();
    };
    
    initOfflineService();
    
    return () => {
      syncManager.stopAutoSync();
      appUpdateService.stopAutoCheck();
    };
  }, [user?.id, currentShop?.id]);

  // Show offline expired modal when needed
  useEffect(() => {
    if (isOfflineExpired) {
      setShowOfflineExpiredModal(true);
    }
  }, [isOfflineExpired]);

  const navigation = [
    { name: t("shop.overview"), href: "/offline-shop", icon: LayoutDashboard },
    { name: language === "bn" ? "ক্যাশ রেজিস্টার" : "Cash Register", href: "/offline-shop/cash-register", icon: Calculator },
    { name: t("shop.salesSellPOS"), href: "/offline-shop/sales", icon: ShoppingCart },
    { name: language === "bn" ? "বাকি গ্রাহক" : "Due Customers", href: "/offline-shop/due-customers", icon: Wallet },
    { name: t("shop.productsStock"), href: "/offline-shop/products", icon: Package },
    { name: t("shop.purchasesBuyImport"), href: "/offline-shop/purchases", icon: PackagePlus },
    { name: language === "bn" ? "স্ক্যানার সেটআপ" : "Scanner Setup", href: "/offline-shop/scanner-setup", icon: Scan },
    { name: language === "bn" ? "মূল্য ক্যালকুলেটর" : "Price Calculator", href: "/offline-shop/price-calculator", icon: Banknote },
    { name: t("shop.returns") || "Returns", href: "/offline-shop/returns", icon: RotateCcw },
    { name: t("shop.damageAdjustments"), href: "/offline-shop/adjustments", icon: AlertTriangle },
    { name: t("shop.suppliers"), href: "/offline-shop/suppliers", icon: Truck },
    { name: t("shop.expenses"), href: "/offline-shop/expenses", icon: Banknote },
    { name: language === "bn" ? "ব্যবসার সারাংশ" : "Business Summary", href: "/offline-shop/cash", icon: Banknote },
    { name: t("shop.reports"), href: "/offline-shop/reports", icon: BarChart3 },
    { name: language === "bn" ? "লোন / কিস্তি" : "Loans / EMI", href: "/offline-shop/loans", icon: Landmark },
    { name: language === "bn" ? "ফলোআপ SMS" : "Followup SMS", href: "/offline-shop/followup-sms", icon: MessageSquareMore },
    { name: language === "bn" ? "ইনভয়েস সেটিংস" : "Invoice Settings", href: "/offline-shop/invoice-settings", icon: Receipt },
    { name: language === "bn" ? "ট্র্যাশ বিন" : "Trash Bin", href: "/offline-shop/trash", icon: Trash2 },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => mobile && setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );


  return (
    <>
      <DynamicDocumentTitle />
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-card lg:block">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b px-4">
              <Store className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">{t("shop.offlineShop")}</span>
            </div>

            {/* Current Location Indicator with Sync Status */}
            <div className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{t("shop.youAreIn")}</p>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t("shop.offlineShopBusiness")}</p>
                </div>
                <SyncStatusBadge syncEnabled={syncEnabled} mode="offline" />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-3">
              <NavLinks />
            </div>

          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:pl-64">
          {/* Top Header */}
          <header className="sticky top-0 z-40 flex h-14 lg:h-16 items-center gap-2 sm:gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-4 lg:px-6">
            {/* Mobile Menu */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

            {/* Business Mode Switcher - Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              <BusinessModeSwitcher syncEnabled={syncEnabled} />
              <SyncStatusBadge syncEnabled={syncEnabled} mode="offline" />
            </div>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">{t("shop.offlineShop")} Menu</SheetTitle>
                <div className="flex h-full flex-col">
                  <div className="flex h-16 items-center gap-2 border-b px-4">
                    <Store className="h-6 w-6 text-primary" />
                    <span className="text-lg font-bold">{t("shop.offlineShop")}</span>
                  </div>
                  <div className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
                    <p className="text-xs text-muted-foreground">{t("shop.youAreIn")}</p>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{t("shop.offlineShopBusiness")}</p>
                  </div>
                  
                  {/* Switch to Online Business */}
                  <div className="p-3 border-b">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                      onClick={() => {
                        setSidebarOpen(false);
                        navigate("/dashboard");
                      }}
                    >
                      <Link2 className="h-4 w-4" />
                      {language === "bn" ? "অনলাইন বিজনেসে যান" : "Go to Online Business"}
                    </Button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3">
                    <NavLinks mobile />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t("shop.offlineShop")}</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">
                {navigation.find(n => n.href === location.pathname)?.name || t("shop.overview")}
              </span>
            </div>

            {/* Shop Selector */}
            <div className="ml-2">
              <ShopSelector />
            </div>

            <div className="flex-1" />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                    <AvatarImage src={user?.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs sm:text-sm">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block text-sm font-medium max-w-[100px] truncate">
                    {user?.name || user?.email}
                  </span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/dashboard/sync")}>
                  <Link2 className="mr-2 h-4 w-4" />
                  {language === "bn" ? "সিঙ্ক সেটিংস" : "Sync Settings"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t("nav.settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Page Content */}
          <main className="p-3 sm:p-4 lg:p-6 relative">
            {/* Offline Status Bar */}
            <OfflineStatusBar className="mb-4" />
            
            {/* Show frozen overlay if feature is disabled by admin */}
            {isOfflineShopDisabled && (
              <FeatureDisabledOverlay featureName={language === "bn" ? "অফলাইন শপ সিস্টেম" : "Offline Shop System"} featureType="offline" />
            )}
            
            {/* Trial Banner for trial users */}
            <OfflineTrialBanner />
            
            {/* Show overlay if trial expired */}
            {isTrialUser && isOfflineTrialExpired && <OfflineTrialExpiredOverlay />}
            
            {children}
          </main>
        </div>
        
        {/* Floating Sync Indicator */}
        <FloatingSyncIndicator />
        
        {/* Offline Expired Modal */}
        <OfflineExpiredModal 
          open={showOfflineExpiredModal} 
          onDismiss={() => setShowOfflineExpiredModal(false)} 
        />
      </div>
    </>
  );
};

export default ShopLayout;