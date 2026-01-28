const SUPABASE_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co";

function getAuthHeaders() {
  const token = localStorage.getItem("autofloy_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export interface AdminUser {
  id: string;
  display_name: string | null;
  email: string;
  status: string;
  role: string;
  created_at: string;
  subscription_plan: string;
  subscription_type?: 'online' | 'offline' | 'both';
  trial_end_date: string | null;
  is_trial_active: boolean;
  phone: string | null;
  avatar_url: string | null;
}

export interface UserDetails {
  user: AdminUser & {
    email_verified: boolean;
    phone_verified: boolean;
    can_sync_business: boolean;
  };
  connectedAccounts: Array<{
    id: string;
    platform: string;
    name: string | null;
    external_id: string;
    is_connected: boolean;
    created_at: string;
  }>;
  stats: {
    ordersCount: number;
    automationsCount: number;
    messagesHandled: number;
  };
  subscription: {
    plan: string;
    status: string;
    started_at: string;
    ends_at: string | null;
    amount: number | null;
  } | null;
}

export interface SubscriptionStats {
  planStats: Record<string, number>;
  upcomingTrialExpirations: Array<{
    id: string;
    display_name: string | null;
    email: string;
    trial_end_date: string;
  }>;
  recentUpgrades: Array<{
    id: string;
    plan: string;
    status: string;
    started_at: string;
    amount: number | null;
    user: {
      id: string;
      display_name: string | null;
      email: string;
    } | null;
  }>;
}

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  usersWithFacebook: number;
  // New stats
  totalAutomations: number;
  totalProducts: number;
  totalShopProducts: number;
  totalShopSales: number;
  totalShopCustomers: number;
  totalBlogPosts: number;
  publishedBlogPosts: number;
  totalCMSPages: number;
  totalExecutionLogs: number;
  totalOrders: number;
  totalNotifications: number;
  totalShopSuppliers: number;
  totalShopPurchases: number;
  totalReviews: number;
  // Existing
  planCounts: Record<string, number>;
  signupsPerDay: Array<{ date: string; count: number }>;
  topActiveUsers: Array<{
    id: string;
    display_name: string | null;
    email: string;
    automation_runs: number;
    orders_count: number;
  }>;
}

export interface CreateUserData {
  email: string;
  password: string;
  display_name?: string;
  role?: "admin" | "user";
  subscription_plan?: string;
  status?: "active" | "suspended";
}

export interface UpdateUserData {
  display_name?: string;
  subscription_plan?: string;
  subscription_type?: 'online' | 'offline' | 'both';
  status?: "active" | "suspended";
  trial_end_date?: string | null;
  is_trial_active?: boolean;
  email?: string;
  can_sync_business?: boolean;
}

export async function checkAdminRole(): Promise<{ isAdmin: boolean; userId: string }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/check-role`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 403) {
      return { isAdmin: false, userId: "" };
    }
    throw new Error("Failed to check admin role");
  }

  return response.json();
}

export async function updateSiteSettings(
  settings: Record<string, unknown>
): Promise<{ settings: any }> {
  const url = `${SUPABASE_URL}/functions/v1/site-settings`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: `Failed to update site settings (HTTP ${response.status})` }));

      throw new Error(error?.error || `Failed to update site settings (HTTP ${response.status})`);
    }

    return response.json();
  } catch (e) {
    // Fetch throws TypeError on network/CORS failures
    if (e instanceof TypeError) {
      throw new Error(`Network error calling ${url}. Please hard-refresh and try again.`);
    }
    throw e;
  }
}

export async function fetchAdminUsers(
  page = 1,
  limit = 20,
  search = ""
): Promise<{ users: AdminUser[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams({ 
    page: String(page), 
    limit: String(limit),
    ...(search && { search })
  });
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/users?${params}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch users");
  }

  return response.json();
}

export async function fetchUserDetails(userId: string): Promise<UserDetails> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/${userId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch user details");
  }

  return response.json();
}

export async function updateUserRole(userId: string, role: "admin" | "user"): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/${userId}/role`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update role");
  }
}

export async function updateUserStatus(userId: string, status: "active" | "suspended"): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/${userId}/status`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update status");
  }
}

export async function fetchSubscriptionStats(): Promise<SubscriptionStats> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/subscriptions`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch subscription stats");
  }

  return response.json();
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/overview`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch admin overview");
  }

  return response.json();
}

export async function createUser(data: CreateUserData): Promise<{ user: AdminUser }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create user");
  }

  return response.json();
}

export async function updateUserSyncPermission(userId: string, canSync: boolean): Promise<void> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/${userId}/sync-permission`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ can_sync_business: canSync }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to update sync permission" }));
      throw new Error(error.error || "Failed to update sync permission");
    }
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error - please check your connection");
    }
    throw error;
  }
}

export async function updateUser(userId: string, data: UpdateUserData): Promise<{ user: AdminUser }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/${userId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to update user" }));
      throw new Error(error.error || "Failed to update user");
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error - please check your connection");
    }
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to delete user" }));
      throw new Error(error.error || "Failed to delete user");
    }
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error - please check your connection");
    }
    throw error;
  }
}

export async function resetUserPassword(userId: string, password: string): Promise<void> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/${userId}/password`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to reset password" }));
      throw new Error(error.error || "Failed to reset password");
    }
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error - please check your connection");
    }
    throw error;
  }
}

export async function unlockUser(userId: string): Promise<void> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/${userId}/unlock`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to unlock user" }));
      throw new Error(error.error || "Failed to unlock user");
    }
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error - please check your connection");
    }
    throw error;
  }
}

export interface UserPasscodeInfo {
  id: string;
  email: string;
  display_name: string | null;
  has_trash_passcode: boolean;
}

export async function searchUserPasscode(email: string): Promise<{ users: UserPasscodeInfo[] }> {
  try {
    const params = new URLSearchParams({ email });
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/search-user-passcode?${params}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Search failed" }));
      throw new Error(error.error || "Search failed");
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error - please check your connection");
    }
    throw error;
  }
}

export async function resetTrashPasscode(email: string): Promise<{ success: boolean; message: string; user?: { id: string; email: string; display_name: string | null } }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/reset-trash-passcode`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to reset passcode" }));
      throw new Error(error.error || "Failed to reset passcode");
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error - please check your connection");
    }
    throw error;
  }
}

// Payment Requests
export interface PaymentRequest {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_method_account: string | null;
  transaction_id: string | null;
  screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  subscription_type?: 'online' | 'offline' | 'both';
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    display_name: string | null;
    email: string;
  };
}

export async function fetchPaymentRequests(
  page = 1,
  limit = 20,
  search = "",
  status = "all"
): Promise<{ requests: PaymentRequest[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search && { search }),
    ...(status !== "all" && { status }),
  });

  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/payment-requests?${params}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch payment requests");
  }

  return response.json();
}

export async function updatePaymentRequest(
  requestId: string,
  status: "approved" | "rejected",
  adminNotes?: string
): Promise<{ request: PaymentRequest }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/payment-requests/${requestId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to update payment request" }));
      throw new Error(error.error || "Failed to update payment request");
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error - please check your connection");
    }
    throw error;
  }
}

export async function deletePaymentRequest(requestId: string): Promise<void> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/payment-requests/${requestId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to delete payment request" }));
      throw new Error(error.error || "Failed to delete payment request");
    }
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Network error - please check your connection");
    }
    throw error;
  }
}
