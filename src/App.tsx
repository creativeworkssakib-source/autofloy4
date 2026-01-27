import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ShopProvider } from "@/contexts/ShopContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { DynamicDocumentTitle } from "@/components/DynamicDocumentTitle";
import { DynamicAppearance } from "@/components/DynamicAppearance";
import BackToTopButton from "@/components/ui/BackToTopButton";
import { OfflineReadyIndicator } from "@/components/OfflineIndicators";
// ExtensionBlockerDetector removed - was causing false positives
import { Loader2 } from "lucide-react";

// Eagerly loaded routes (small, critical)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Lazy loaded routes (larger bundles)
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const Careers = lazy(() => import("./pages/Careers"));
const Documentation = lazy(() => import("./pages/Documentation"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const HelpArticle = lazy(() => import("./pages/HelpArticle"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const GDPR = lazy(() => import("./pages/GDPR"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const FeatureDetail = lazy(() => import("./pages/FeatureDetail"));
const TrialStart = lazy(() => import("./pages/TrialStart"));
const Dashboard = lazy(() => import("./pages/dashboard/UnifiedDashboard"));
const BusinessOverview = lazy(() => import("./pages/BusinessOverview"));
const GlobalReports = lazy(() => import("./pages/dashboard/GlobalReports"));
const SyncSettings = lazy(() => import("./pages/dashboard/SyncSettings"));
const Products = lazy(() => import("./pages/Products"));
const Logs = lazy(() => import("./pages/Logs"));
const Settings = lazy(() => import("./pages/Settings"));
const Automations = lazy(() => import("./pages/Automations"));
const ConnectFacebook = lazy(() => import("./pages/ConnectFacebook"));
const AuthFacebookCallback = lazy(() => import("./pages/AuthFacebookCallback"));
const AuthGoogleCallback = lazy(() => import("./pages/AuthGoogleCallback"));
// FacebookPageSettings removed - functionality moved to FacebookAutomationSection
const AutomationStatus = lazy(() => import("./pages/dashboard/AutomationStatus"));
const Marketing = lazy(() => import("./pages/dashboard/Marketing"));

// Business Selector & Offline Shop pages
const BusinessSelector = lazy(() => import("./pages/BusinessSelector"));
const ShopDashboard = lazy(() => import("./pages/offline-shop/ShopDashboard"));
const ShopProducts = lazy(() => import("./pages/offline-shop/ShopProducts"));
const ShopSales = lazy(() => import("./pages/offline-shop/ShopSales"));
const ShopExpenses = lazy(() => import("./pages/offline-shop/ShopExpenses"));
const ShopReports = lazy(() => import("./pages/offline-shop/ShopReports"));
// ShopPurchases merged into ShopSuppliers

const ShopSuppliers = lazy(() => import("./pages/offline-shop/ShopSuppliers"));
const SupplierProfile = lazy(() => import("./pages/offline-shop/SupplierProfile"));
const ShopAdjustments = lazy(() => import("./pages/offline-shop/ShopAdjustments"));
const ShopCash = lazy(() => import("./pages/offline-shop/ShopCash"));
const ShopReturns = lazy(() => import("./pages/offline-shop/ShopReturns"));
const ShopTrash = lazy(() => import("./pages/offline-shop/ShopTrash"));
const ShopDueCustomers = lazy(() => import("./pages/offline-shop/ShopDueCustomers"));
const ShopCustomers = lazy(() => import("./pages/offline-shop/ShopCustomers"));
// ShopStaff removed - not used in menu
const ShopFollowupSms = lazy(() => import("./pages/offline-shop/ShopFollowupSms"));
const ScannerSetup = lazy(() => import("./pages/offline-shop/ScannerSetup"));
const ShopPriceCalculator = lazy(() => import("./pages/offline-shop/ShopPriceCalculator"));
const ShopLoans = lazy(() => import("./pages/offline-shop/ShopLoans"));
const ShopCashRegister = lazy(() => import("./pages/offline-shop/ShopCashRegister"));
const InvoiceSettings = lazy(() => import("./pages/offline-shop/InvoiceSettings"));

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));
const AdminUserSettings = lazy(() => import("./pages/admin/AdminUserSettings"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminSiteSettings = lazy(() => import("./pages/admin/AdminSiteSettings"));
const AdminWebhooks = lazy(() => import("./pages/admin/AdminWebhooks"));
const AdminPasscodeReset = lazy(() => import("./pages/admin/AdminPasscodeReset"));

const AdminBlogPosts = lazy(() => import("./pages/admin/AdminBlogPosts"));
const AdminPricingPlans = lazy(() => import("./pages/admin/AdminPricingPlans"));
const AdminAppearance = lazy(() => import("./pages/admin/AdminAppearance"));
const AdminSEO = lazy(() => import("./pages/admin/AdminSEO"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const AdminApiIntegrations = lazy(() => import("./pages/admin/AdminApiIntegrations"));
const AdminPaymentRequests = lazy(() => import("./pages/admin/AdminPaymentRequests"));
const AdminPaymentMethods = lazy(() => import("./pages/admin/AdminPaymentMethods"));
const AdminSmsSettings = lazy(() => import("./pages/admin/AdminSmsSettings"));


// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Configure React Query - NO CACHING for always fresh data
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always consider data stale - refetch immediately
      gcTime: 0, // Don't cache - always get fresh data
      refetchOnWindowFocus: true, // Refetch when tab gains focus
      refetchOnMount: true, // Always refetch on component mount
      refetchOnReconnect: true, // Refetch when network reconnects
      retry: 1, // Only retry once on failure
    },
  },
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SiteSettingsProvider>
          <LanguageProvider>
            <NotificationProvider>
              <ShopProvider>
              <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <DynamicDocumentTitle />
              <DynamicAppearance />
              <CookieConsentBanner />
              <BackToTopButton />
              <OfflineReadyIndicator />
              {/* ExtensionBlockerDetector removed - was causing false positives */}
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/docs" element={<Documentation />} />
                  <Route path="/help" element={<HelpCenter />} />
                  <Route path="/help/:slug" element={<HelpArticle />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/gdpr" element={<GDPR />} />
                  <Route path="/cookies" element={<CookiePolicy />} />
                  <Route path="/features/:slug" element={<FeatureDetail />} />
                  
                  {/* OAuth callback routes - public but redirects internally */}
                  <Route path="/auth/facebook/callback" element={<AuthFacebookCallback />} />
                  <Route path="/auth/google/callback" element={<AuthGoogleCallback />} />
                  
                  {/* Protected routes */}
                  <Route path="/checkout" element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } />
                  <Route path="/trial-start" element={
                    <ProtectedRoute requireEmailVerification={false}>
                      <TrialStart />
                    </ProtectedRoute>
                  } />
                  <Route path="/connect-facebook" element={
                    <ProtectedRoute>
                      <ConnectFacebook />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/business" element={
                    <ProtectedRoute>
                      <BusinessOverview />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/logs" element={
                    <ProtectedRoute>
                      <Logs />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/automations" element={
                    <ProtectedRoute>
                      <Automations />
                    </ProtectedRoute>
                  } />
                  {/* FacebookPageSettings routes removed - functionality moved to FacebookAutomationSection */}
                  <Route path="/dashboard/automation-status" element={
                    <ProtectedRoute>
                      <AutomationStatus />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/automation-status/:pageId" element={
                    <ProtectedRoute>
                      <AutomationStatus />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/products" element={
                    <ProtectedRoute>
                      <Products />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/reports" element={
                    <ProtectedRoute>
                      <GlobalReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/sync" element={
                    <ProtectedRoute>
                      <SyncSettings />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/marketing" element={
                    <ProtectedRoute>
                      <Marketing />
                    </ProtectedRoute>
                  } />
                  
                  {/* Business Selector */}
                  <Route path="/business-selector" element={
                    <ProtectedRoute>
                      <BusinessSelector />
                    </ProtectedRoute>
                  } />
                  
                  {/* Offline Shop Routes */}
                  <Route path="/offline-shop" element={
                    <ProtectedRoute>
                      <ShopDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/cash-register" element={
                    <ProtectedRoute>
                      <ShopCashRegister />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/products" element={
                    <ProtectedRoute>
                      <ShopProducts />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/sales" element={
                    <ProtectedRoute>
                      <ShopSales />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/expenses" element={
                    <ProtectedRoute>
                      <ShopExpenses />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/reports" element={
                    <ProtectedRoute>
                      <ShopReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/suppliers" element={
                    <ProtectedRoute>
                      <ShopSuppliers />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/suppliers/:id" element={
                    <ProtectedRoute>
                      <SupplierProfile />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/adjustments" element={
                    <ProtectedRoute>
                      <ShopAdjustments />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/cash" element={
                    <ProtectedRoute>
                      <ShopCash />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/returns" element={
                    <ProtectedRoute>
                      <ShopReturns />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/trash" element={
                    <ProtectedRoute>
                      <ShopTrash />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/due-customers" element={
                    <ProtectedRoute>
                      <ShopDueCustomers />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/followup-sms" element={
                    <ProtectedRoute>
                      <ShopFollowupSms />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/customers" element={
                    <ProtectedRoute>
                      <ShopCustomers />
                    </ProtectedRoute>
                  } />
                  {/* Staff route removed - not used in menu */}
                  <Route path="/offline-shop/scanner-setup" element={
                    <ProtectedRoute>
                      <ScannerSetup />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/price-calculator" element={
                    <ProtectedRoute>
                      <ShopPriceCalculator />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/loans" element={
                    <ProtectedRoute>
                      <ShopLoans />
                    </ProtectedRoute>
                  } />
                  <Route path="/offline-shop/invoice-settings" element={
                    <ProtectedRoute>
                      <InvoiceSettings />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <AdminProtectedRoute>
                      <AdminUsers />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/users/:id" element={
                    <AdminProtectedRoute>
                      <AdminUserDetail />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/user-settings" element={
                    <AdminProtectedRoute>
                      <AdminUserSettings />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/subscriptions" element={
                    <AdminProtectedRoute>
                      <AdminSubscriptions />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/settings" element={
                    <AdminProtectedRoute>
                      <AdminSiteSettings />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/webhooks" element={
                    <AdminProtectedRoute>
                      <AdminWebhooks />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/passcode-reset" element={
                    <AdminProtectedRoute>
                      <AdminPasscodeReset />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/blog-posts" element={
                    <AdminProtectedRoute>
                      <AdminBlogPosts />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/pricing-plans" element={
                    <AdminProtectedRoute>
                      <AdminPricingPlans />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/appearance" element={
                    <AdminProtectedRoute>
                      <AdminAppearance />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/seo" element={
                    <AdminProtectedRoute>
                      <AdminSEO />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/email-templates" element={
                    <AdminProtectedRoute>
                      <AdminEmailTemplates />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/api-integrations" element={
                    <AdminProtectedRoute>
                      <AdminApiIntegrations />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/payment-requests" element={
                    <AdminProtectedRoute>
                      <AdminPaymentRequests />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/payment-methods" element={
                    <AdminProtectedRoute>
                      <AdminPaymentMethods />
                    </AdminProtectedRoute>
                  } />
                  <Route path="/admin/sms-settings" element={
                    <AdminProtectedRoute>
                      <AdminSmsSettings />
                    </AdminProtectedRoute>
                  } />
                  
                  {/* Catch-all 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </BrowserRouter>
              </TooltipProvider>
              </ShopProvider>
            </NotificationProvider>
          </LanguageProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
