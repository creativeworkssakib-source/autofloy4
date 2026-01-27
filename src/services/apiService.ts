const SUPABASE_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("autofloy_token");
  return {
    "Content-Type": "application/json",
    // Prevent caching for all API calls
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  email: string;
  phone: string | null;
  subscription_plan: string;
  trial_end_date: string | null;
  is_trial_active: boolean | null;
  email_verified: boolean | null;
  phone_verified: boolean | null;
  avatar_url: string | null;
  created_at: string | null;
}

export interface ConnectedAccount {
  id: string;
  external_id: string;
  name: string | null;
  platform: "facebook" | "whatsapp" | "email";
  category: string | null;
  is_connected: boolean | null;
  created_at: string | null;
  picture_url: string | null;
}

export interface Automation {
  id: string;
  name: string;
  type: "message" | "comment" | "image" | "voice" | "mixed";
  trigger_keywords: string[] | null;
  response_template: string | null;
  config: Record<string, unknown> | null;
  is_enabled: boolean | null;
  account_id: string;
  created_at: string | null;
  updated_at: string | null;
  runsToday?: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  is_read: boolean | null;
  created_at: string | null;
  notification_type?: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionLog {
  id: string;
  event_type: string | null;
  status: "success" | "failed" | null;
  source_platform: "facebook" | "whatsapp" | "email" | null;
  processing_time_ms: number | null;
  created_at: string | null;
  automation_id: string | null;
  incoming_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  automations?: {
    name: string;
  } | null;
}

export interface DashboardStats {
  messagesHandled: number;
  messagesDiff: string;
  autoRepliesSent: number;
  successRate: string;
  activeAutomations: number;
  totalAutomations: number;
  hoursSaved: number;
  estimatedValue: number;
  connectedPages: number;
  todayOrders: number;
  todayRevenue: number;
}

export interface BusinessOverviewStats {
  todaysSales: number;
  todaysOrders: number;
  confirmedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalOrders: number;
  messagesHandled: number;
  autoRepliesSent: number;
  totalSalesAmount: number;
  totalBuyCost: number;
  profit: number;
  damagedOrLost: number;
  // Product inventory stats
  totalProducts?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
  totalStockValue?: number;
  potentialRevenue?: number;
  potentialProfit?: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  min_stock_alert: number;
}

export interface DailyStats {
  date: string;
  sales: number;
  orders: number;
  cost?: number;
  profit?: number;
}

export interface Order {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  items: unknown;
  subtotal: number;
  discount: number | null;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned" | "damaged" | "expired" | null;
  source_platform: "facebook" | "whatsapp" | "email" | null;
  created_at: string | null;
  currency: string | null;
  external_id?: string | null;
  order_date?: string | null;
}

export interface ImportResult {
  success: boolean;
  message: string;
  inserted: number;
  errors: number;
  totalRows: number;
}

// User Profile
export async function fetchUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
}

// Plan limits info returned with connected accounts
export interface PlanLimitsData {
  plan: string;
  planName: string;
  isActive: boolean;
  maxFacebookPages: number;
  maxWhatsappAccounts: number;
  connectedFacebookPages: number;
  connectedWhatsapp: number;
  canConnectMoreFacebook: boolean;
}

export interface ConnectedAccountsResponse {
  accounts: ConnectedAccount[];
  planLimits: PlanLimitsData;
}

// Connected Accounts
export async function fetchConnectedAccounts(platform?: string): Promise<ConnectedAccount[]> {
  try {
    const url = new URL(`${SUPABASE_URL}/functions/v1/connected-accounts`);
    if (platform) url.searchParams.set("platform", platform);
    // Add cache busting timestamp
    url.searchParams.set("_t", Date.now().toString());
    
    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.accounts || [];
  } catch (error) {
    console.error("Failed to fetch connected accounts:", error);
    return [];
  }
}

// Fetch connected accounts with plan limits
export async function fetchConnectedAccountsWithLimits(platform?: string): Promise<ConnectedAccountsResponse> {
  try {
    const url = new URL(`${SUPABASE_URL}/functions/v1/connected-accounts`);
    if (platform) url.searchParams.set("platform", platform);
    // Add cache busting timestamp
    url.searchParams.set("_t", Date.now().toString());
    
    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!response.ok) {
      return { 
        accounts: [], 
        planLimits: {
          plan: "none",
          planName: "No Plan",
          isActive: false,
          maxFacebookPages: 0,
          maxWhatsappAccounts: 0,
          connectedFacebookPages: 0,
          connectedWhatsapp: 0,
          canConnectMoreFacebook: false,
        }
      };
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch connected accounts with limits:", error);
    return { 
      accounts: [], 
      planLimits: {
        plan: "none",
        planName: "No Plan",
        isActive: false,
        maxFacebookPages: 0,
        maxWhatsappAccounts: 0,
        connectedFacebookPages: 0,
        connectedWhatsapp: 0,
        canConnectMoreFacebook: false,
      }
    };
  }
}

export async function disconnectAccount(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/connected-accounts?id=${id}&action=disconnect`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to disconnect account:", error);
    return { success: false, message: "Network error" };
  }
}

export async function removeAccount(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/connected-accounts?id=${id}&action=remove`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to remove account:", error);
    return { success: false, message: "Network error" };
  }
}

// Facebook OAuth
export async function getFacebookOAuthUrl(): Promise<{ url?: string; configured: boolean; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/connected-accounts?action=fb-start`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      console.error("Facebook OAuth URL failed:", response.status);
      return { configured: false, error: "Failed to connect to server" };
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to get Facebook OAuth URL:", error);
    return { configured: false, error: "Failed to connect" };
  }
}

// Toggle page automation (enable/disable)
export interface TogglePageResult {
  success: boolean;
  message?: string;
  error?: string;
  upgrade_required?: boolean;
  is_connected?: boolean;
  connectedFacebookPages?: number;
}

export async function togglePageAutomation(pageId: string, enabled: boolean): Promise<TogglePageResult> {
  try {
    const token = localStorage.getItem("autofloy_token");
    if (!token) {
      console.error("[togglePageAutomation] No auth token found");
      return { success: false, error: "Not authenticated" };
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/toggle-page-automation`, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ page_id: pageId, enabled }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[togglePageAutomation] Server error:", response.status, errorData);
      return { 
        success: false, 
        error: errorData.error || `Server error: ${response.status}`,
        upgrade_required: errorData.upgrade_required,
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error("[togglePageAutomation] Fetch failed:", error);
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: "Request timed out. Please try again." };
    }
    return { success: false, error: "Network error. Please check your connection and try again." };
  }
}

// Automations response with access info
export interface PlanLimitsInfo {
  plan: string;
  maxAutomationsPerMonth: number | null;
  runsThisMonth: number;
  features: {
    messageAutoReply: boolean;
    commentAutoReply: boolean;
    imageAutoReply: boolean;
    voiceAutoReply: boolean;
    whatsappEnabled: boolean;
  };
}

export interface AutomationsResponse {
  automations: Automation[];
  hasAccess: boolean;
  accessDeniedReason?: string;
  planLimits?: PlanLimitsInfo;
}

export async function fetchAutomations(): Promise<Automation[]> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/automations`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.automations || [];
  } catch (error) {
    console.error("Failed to fetch automations:", error);
    return [];
  }
}

export async function fetchAutomationsWithAccess(): Promise<AutomationsResponse> {
  try {
    // Add cache-busting timestamp to prevent stale cached responses
    const cacheBuster = `_t=${Date.now()}`;
    const response = await fetch(`${SUPABASE_URL}/functions/v1/automations?${cacheBuster}`, {
      headers: {
        ...getAuthHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    if (!response.ok) {
      // Check if it's an auth/access error vs server error
      if (response.status === 401) {
        return { automations: [], hasAccess: false, accessDeniedReason: "Please log in to access automations" };
      }
      if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        return { 
          automations: [], 
          hasAccess: false, 
          accessDeniedReason: data.error || "Access denied" 
        };
      }
      // For other errors, still show content but with error message
      console.error("Automations API error:", response.status);
      return { automations: [], hasAccess: true, accessDeniedReason: undefined };
    }
    const data = await response.json();
    return {
      automations: data.automations || [],
      hasAccess: data.hasAccess ?? true,
      accessDeniedReason: data.accessDeniedReason,
      planLimits: data.planLimits,
    };
  } catch (error) {
    console.error("Failed to fetch automations:", error);
    // Network error - don't block access, just show empty state
    // The user might have connectivity issues but still have valid subscription
    return { automations: [], hasAccess: true, accessDeniedReason: undefined };
  }
}

export interface AutomationMutationResult {
  automation: Automation | null;
  error?: string;
  trialExpired?: boolean;
}

export async function createAutomation(automation: Partial<Automation>): Promise<AutomationMutationResult> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/automations`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(automation),
    });
    const data = await response.json();
    if (!response.ok) {
      return { 
        automation: null, 
        error: data.error || "Failed to create automation",
        trialExpired: data.trialExpired,
      };
    }
    return { automation: data.automation };
  } catch (error) {
    console.error("Failed to create automation:", error);
    return { automation: null, error: "Network error" };
  }
}

export async function updateAutomation(id: string, updates: Partial<Automation>): Promise<AutomationMutationResult> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/automations`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, ...updates }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { 
        automation: null, 
        error: data.error || "Failed to update automation",
        trialExpired: data.trialExpired,
      };
    }
    return { automation: data.automation };
  } catch (error) {
    console.error("Failed to update automation:", error);
    return { automation: null, error: "Network error" };
  }
}

export async function deleteAutomation(id: string): Promise<{ success: boolean; error?: string; trialExpired?: boolean }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/automations?id=${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error, trialExpired: data.trialExpired };
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to delete automation:", error);
    return { success: false, error: "Network error" };
  }
}

// Notifications
export async function fetchNotifications(): Promise<Notification[]> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/notifications`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.notifications || [];
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/notifications`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ notification_id: notificationId }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return false;
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/notifications`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ markAll: true }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return false;
  }
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/notifications`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: JSON.stringify({ notification_id: notificationId }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return false;
  }
}

// Dashboard Stats - with retry and timeout
export async function fetchDashboardStats(): Promise<DashboardStats | null> {
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/dashboard-stats`, {
        headers: getAuthHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`[dashboard-stats] Response not ok: ${response.status}`);
        if (attempt < maxRetries) continue;
        return null;
      }
      const data = await response.json();
      console.log("[dashboard-stats] Fetched successfully:", data.stats);
      return data.stats;
    } catch (error) {
      console.error(`[dashboard-stats] Attempt ${attempt + 1} failed:`, error);
      if (attempt >= maxRetries) return null;
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return null;
}

// Execution Logs - with retry and timeout
export async function fetchExecutionLogs(limit: number = 5): Promise<ExecutionLog[]> {
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/execution-logs?limit=${limit}`, {
        headers: getAuthHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (attempt < maxRetries) continue;
        return [];
      }
      const data = await response.json();
      console.log("[execution-logs] Fetched successfully:", data.logs?.length || 0, "logs");
      return data.logs || [];
    } catch (error) {
      console.error(`[execution-logs] Attempt ${attempt + 1} failed:`, error);
      if (attempt >= maxRetries) return [];
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return [];
}

// Business Overview
export async function fetchBusinessOverview(
  range: string = "this_month",
  customStart?: string,
  customEnd?: string
): Promise<{
  stats: BusinessOverviewStats;
  dailyStats: DailyStats[];
  orders: Order[];
} | null> {
  try {
    const url = new URL(`${SUPABASE_URL}/functions/v1/dashboard-overview`);
    url.searchParams.set("range", range);
    if (range === "custom" && customStart && customEnd) {
      url.searchParams.set("start", customStart);
      url.searchParams.set("end", customEnd);
    }
    
    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch business overview:", error);
    return null;
  }
}

// Products
export interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  purchase_price?: number;
  currency: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  category: string | null;
  brand: string | null;
  stock_quantity: number | null;
  min_stock_alert?: number;
  unit?: string;
  barcode?: string;
  expiry_date?: string;
  supplier_name?: string;
  created_at: string | null;
  updated_at: string | null;
  variants?: ProductVariant[];
  variantStock?: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price_adjustment: number;
  stock_quantity: number | null;
  is_active: boolean;
  size: string | null;
  color: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductImportResult {
  success: boolean;
  message: string;
  inserted: number;
  updated: number;
  errors: number;
  errorDetails?: string[];
  totalRows: number;
}

export async function fetchProducts(): Promise<{ products: Product[]; categories: string[] }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/products`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return { products: [], categories: [] };
    const data = await response.json();
    return { products: data.products || [], categories: data.categories || [] };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return { products: [], categories: [] };
  }
}

export async function createProduct(product: Partial<Product>): Promise<Product | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error("Failed to create product:", error);
    return null;
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/products`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ id, ...updates }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error("Failed to update product:", error);
    return null;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/products?id=${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to delete product:", error);
    return false;
  }
}

export async function bulkDeleteProducts(ids: string[]): Promise<{ success: boolean; deleted: number }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "bulk_delete", ids }),
    });
    if (!response.ok) return { success: false, deleted: 0 };
    return await response.json();
  } catch (error) {
    console.error("Failed to bulk delete products:", error);
    return { success: false, deleted: 0 };
  }
}

export async function bulkUpdateProducts(
  ids: string[],
  updates: { category?: string; is_active?: boolean }
): Promise<{ success: boolean; updated: number }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "bulk_update", ids, updates }),
    });
    if (!response.ok) return { success: false, updated: 0 };
    return await response.json();
  } catch (error) {
    console.error("Failed to bulk update products:", error);
    return { success: false, updated: 0 };
  }
}

export async function exportProducts(includeVariants = false): Promise<Blob | null> {
  try {
    const token = localStorage.getItem("autofloy_token");
    const url = `${SUPABASE_URL}/functions/v1/products?action=export${includeVariants ? "&include_variants=true" : ""}`;
    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!response.ok) return null;
    return await response.blob();
  } catch (error) {
    console.error("Failed to export products:", error);
    return null;
  }
}

// Product Variants
export async function fetchProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/products?action=variants&product_id=${productId}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.variants || [];
  } catch (error) {
    console.error("Failed to fetch variants:", error);
    return [];
  }
}

export async function createProductVariant(
  variant: Partial<ProductVariant> & { product_id: string }
): Promise<ProductVariant | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "create_variant", ...variant }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.variant;
  } catch (error) {
    console.error("Failed to create variant:", error);
    return null;
  }
}

export async function updateProductVariant(
  id: string,
  updates: Partial<ProductVariant>
): Promise<ProductVariant | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "update_variant", id, ...updates }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.variant;
  } catch (error) {
    console.error("Failed to update variant:", error);
    return null;
  }
}

export async function deleteProductVariant(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/products`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "delete_variant", id }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to delete variant:", error);
    return false;
  }
}

// Reports Import
export async function importSalesReport(file: File): Promise<ImportResult> {
  try {
    const token = localStorage.getItem("autofloy_token");
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/reports-import`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.error || "Import failed", inserted: 0, errors: 0, totalRows: 0 };
    }
    return data;
  } catch (error) {
    console.error("Failed to import sales report:", error);
    return { success: false, message: "Network error", inserted: 0, errors: 0, totalRows: 0 };
  }
}

// Reports Export
export async function exportSalesReport(fromDate: string, toDate: string, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob | null> {
  try {
    const token = localStorage.getItem("autofloy_token");
    const url = new URL(`${SUPABASE_URL}/functions/v1/reports-export`);
    url.searchParams.set("from", fromDate);
    url.searchParams.set("to", toDate);
    url.searchParams.set("format", format);
    
    const response = await fetch(url.toString(), {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) return null;
    return await response.blob();
  } catch (error) {
    console.error("Failed to export sales report:", error);
    return null;
  }
}

// Products Import
export async function importProducts(file: File): Promise<ProductImportResult> {
  try {
    const token = localStorage.getItem("autofloy_token");
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/products-import`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.error || "Import failed", inserted: 0, updated: 0, errors: 0, totalRows: 0 };
    }
    return data;
  } catch (error) {
    console.error("Failed to import products:", error);
    return { success: false, message: "Network error", inserted: 0, updated: 0, errors: 0, totalRows: 0 };
  }
}

// User Settings
export interface UserSettings {
  id: string;
  user_id: string;
  default_tone: "friendly" | "professional" | "casual";
  response_language: "bengali" | "english" | "mixed";
  email_notifications: boolean;
  push_notifications: boolean;
  sound_alerts: boolean;
  daily_digest: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchUserSettings(): Promise<UserSettings | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/user-settings`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.settings;
  } catch (error) {
    console.error("Failed to fetch user settings:", error);
    return null;
  }
}

export async function updateUserSettings(settings: Partial<Omit<UserSettings, "id" | "user_id" | "created_at" | "updated_at">>): Promise<UserSettings | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/user-settings`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.settings;
  } catch (error) {
    console.error("Failed to update user settings:", error);
    return null;
  }
}

// Page Memory for Facebook AI automation
export interface PageMemory {
  id: string;
  user_id: string;
  account_id: string;
  page_id: string;
  page_name: string | null;
  business_type: string | null;
  business_category: string | null;
  detected_language: string;
  preferred_tone: string;
  business_description: string | null;
  products_summary: string | null;
  faq_context: string | null;
  custom_instructions: string | null;
  webhook_subscribed: boolean;
  webhook_subscribed_at: string | null;
  automation_settings: Record<string, boolean>;
  // AI Behavior Configuration
  selling_rules: {
    usePriceFromProduct: boolean;
    allowDiscount: boolean;
    maxDiscountPercent: number;
    allowLowProfitSale: boolean;
  } | null;
  ai_behavior_rules: {
    neverHallucinate: boolean;
    askClarificationIfUnsure: boolean;
    askForClearerPhotoIfNeeded: boolean;
    confirmBeforeOrder: boolean;
  } | null;
  payment_rules: {
    codAvailable: boolean;
    advanceRequiredAbove: number;
    advancePercentage: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export async function fetchPageMemory(pageId?: string): Promise<PageMemory | PageMemory[] | null> {
  try {
    const url = new URL(`${SUPABASE_URL}/functions/v1/page-memory`);
    if (pageId) url.searchParams.set("page_id", pageId);
    
    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.memories;
  } catch (error) {
    console.error("Failed to fetch page memory:", error);
    return null;
  }
}

export async function savePageMemory(memory: Partial<PageMemory>, retries = 3): Promise<PageMemory | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[savePageMemory] Attempt ${attempt}/${retries}`);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/page-memory`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(memory),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`[savePageMemory] Response not OK: ${response.status}`);
        if (attempt === retries) return null;
        await new Promise(r => setTimeout(r, 1000 * attempt)); // Wait before retry
        continue;
      }
      
      const data = await response.json();
      console.log("[savePageMemory] Success:", data);
      return data.memory;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[savePageMemory] Attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        // On final failure, try to save directly via supabase client as fallback
        console.log("[savePageMemory] Trying direct database fallback...");
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          
          const { data: existingMemory } = await supabase
            .from("page_memory")
            .select("id, user_id")
            .eq("page_id", memory.page_id || "")
            .maybeSingle();
          
          if (existingMemory) {
            const { data, error } = await supabase
              .from("page_memory")
              .update({
                page_name: memory.page_name,
                business_description: memory.business_description,
                products_summary: memory.products_summary,
                detected_language: memory.detected_language,
                preferred_tone: memory.preferred_tone,
                automation_settings: memory.automation_settings as Record<string, boolean>,
                selling_rules: memory.selling_rules,
                ai_behavior_rules: memory.ai_behavior_rules,
                payment_rules: memory.payment_rules,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingMemory.id)
              .select()
              .single();
            
            if (!error && data) {
              console.log("[savePageMemory] Direct fallback success");
              return data as unknown as PageMemory;
            }
          }
        } catch (fallbackError) {
          console.error("[savePageMemory] Fallback also failed:", fallbackError);
        }
        return null;
      }
      
      await new Promise(r => setTimeout(r, 1000 * attempt)); // Wait before retry
    }
  }
  
  return null;
}

export async function subscribePageToWebhook(pageId: string, subscribe: boolean = true): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/page-memory`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ page_id: pageId, subscribe }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to update webhook subscription:", error);
    return false;
  }
}
