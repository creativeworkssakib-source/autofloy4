import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ShopProvider } from "@/contexts/ShopContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import { DynamicDocumentTitle } from "@/components/DynamicDocumentTitle";
import { DynamicAppearance } from "@/components/DynamicAppearance";
import { Loader2 } from "lucide-react";

// Eagerly loaded routes (small, critical)
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Lazy loaded routes
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Offline Shop pages
const ShopDashboard = lazy(() => import("./pages/offline-shop/ShopDashboard"));
const ShopProducts = lazy(() => import("./pages/offline-shop/ShopProducts"));
const ShopSales = lazy(() => import("./pages/offline-shop/ShopSales"));
const ShopExpenses = lazy(() => import("./pages/offline-shop/ShopExpenses"));
const ShopReports = lazy(() => import("./pages/offline-shop/ShopReports"));
const ShopPurchases = lazy(() => import("./pages/offline-shop/ShopPurchases"));
const ShopSuppliers = lazy(() => import("./pages/offline-shop/ShopSuppliers"));
const SupplierProfile = lazy(() => import("./pages/offline-shop/SupplierProfile"));
const ShopAdjustments = lazy(() => import("./pages/offline-shop/ShopAdjustments"));
const ShopCash = lazy(() => import("./pages/offline-shop/ShopCash"));
const ShopReturns = lazy(() => import("./pages/offline-shop/ShopReturns"));
const ShopTrash = lazy(() => import("./pages/offline-shop/ShopTrash"));
const ShopDueCustomers = lazy(() => import("./pages/offline-shop/ShopDueCustomers"));
const ShopCustomers = lazy(() => import("./pages/offline-shop/ShopCustomers"));
const ShopStaff = lazy(() => import("./pages/offline-shop/ShopStaff"));
const ShopFollowupSms = lazy(() => import("./pages/offline-shop/ShopFollowupSms"));
const ScannerSetup = lazy(() => import("./pages/offline-shop/ScannerSetup"));
const ShopPriceCalculator = lazy(() => import("./pages/offline-shop/ShopPriceCalculator"));
const ShopSettings = lazy(() => import("./pages/offline-shop/ShopSettings"));

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminSiteSettings = lazy(() => import("./pages/admin/AdminSiteSettings"));
const AdminPricingPlans = lazy(() => import("./pages/admin/AdminPricingPlans"));
const AdminAppearance = lazy(() => import("./pages/admin/AdminAppearance"));
const AdminPaymentRequests = lazy(() => import("./pages/admin/AdminPaymentRequests"));

// User pages
const UpgradePlan = lazy(() => import("./pages/UpgradePlan"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);

// Smart Index component - redirects to appropriate page
const SmartIndex = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (user && user.emailVerified) {
    return <Navigate to="/offline-shop" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

// Configure React Query with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
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
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<SmartIndex />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* Offline Shop Routes */}
                  <Route path="/offline-shop" element={
                    <ProtectedRoute>
                      <ShopDashboard />
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
                  <Route path="/offline-shop/purchases" element={
                    <ProtectedRoute>
                      <ShopPurchases />
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
                  <Route path="/offline-shop/staff" element={
                    <ProtectedRoute>
                      <ShopStaff />
                    </ProtectedRoute>
                  } />
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
                  <Route path="/offline-shop/settings" element={
                    <ProtectedRoute>
                      <ShopSettings />
                    </ProtectedRoute>
                  } />
                  
                  {/* Legacy redirects */}
                  <Route path="/dashboard" element={<Navigate to="/offline-shop" replace />} />
                  <Route path="/dashboard/*" element={<Navigate to="/offline-shop" replace />} />
                  
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
                  <Route path="/admin/payment-requests" element={
                    <AdminProtectedRoute>
                      <AdminPaymentRequests />
                    </AdminProtectedRoute>
                  } />
                  
                  {/* User Payment Routes */}
                  <Route path="/upgrade" element={
                    <ProtectedRoute>
                      <UpgradePlan />
                    </ProtectedRoute>
                  } />
                  <Route path="/payment-history" element={
                    <ProtectedRoute>
                      <PaymentHistory />
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch-all */}
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
