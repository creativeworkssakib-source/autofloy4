import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getAccountSuspendedEmailTemplate, getAccountActivatedEmailTemplate, getPlanPurchaseEmailTemplate, getAccountUpdateEmailTemplate, getPlanExpiredEmailTemplate, getTrialAssignedEmailTemplate } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Helper to get company name from site settings
async function getCompanyName(): Promise<string> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data } = await supabase.from("site_settings").select("company_name").limit(1).maybeSingle();
    return data?.company_name || "AutoFloy";
  } catch {
    return "AutoFloy";
  }
}

// Helper to mask secrets for display
function maskSecret(secret: string): string {
  if (!secret || secret.length < 8) return "••••••••";
  return secret.slice(0, 4) + "••••••••" + secret.slice(-4);
}

// Email notification helper
async function sendAdminNotification(
  type: "password_reset" | "account_suspended" | "account_activated" | "role_changed",
  userEmail: string,
  userName?: string,
  additionalData?: Record<string, string>
) {
  const name = userName || "User";
  const companyName = await getCompanyName();
  let subject = "";
  let html = "";

  switch (type) {
    case "password_reset":
      subject = "Your Password Has Been Reset";
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Password Reset Notification</h1>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">Hello ${name},</p>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">Your account password has been reset by an administrator.</p>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">If you did not request this change, please contact our support team immediately.</p>
          <p style="color: #888; font-size: 14px; margin-top: 30px;">Best regards,<br>The ${companyName} Team</p>
        </div>
      `;
      break;
    case "account_suspended":
      subject = "⚠️ Your Account Has Been Suspended";
      html = getAccountSuspendedEmailTemplate(name, companyName);
      break;
    case "account_activated":
      subject = "✅ Your Account Has Been Reactivated";
      html = getAccountActivatedEmailTemplate(name, companyName);
      break;
    case "role_changed":
      const newRole = additionalData?.newRole || "user";
      subject = "Your Account Role Has Been Updated";
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">Role Update Notification</h1>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">Hello ${name},</p>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">Your account role has been updated to <strong style="color: #2563eb;">${newRole}</strong>.</p>
          <p style="color: #888; font-size: 14px; margin-top: 30px;">Best regards,<br>The ${companyName} Team</p>
        </div>
      `;
      break;
  }

  try {
    const result = await resend.emails.send({
      from: `${companyName} <noreply@autofloy.com>`,
      to: [userEmail],
      subject,
      html,
    });
    console.log(`[Admin Notification] ${type} email sent to ${userEmail}:`, result);
    return result;
  } catch (error) {
    console.error(`[Admin Notification] Failed to send ${type} email to ${userEmail}:`, error);
    return null;
  }
}

// Verify JWT and get user ID
async function verifyAdminToken(authHeader: string | null): Promise<{ userId: string; isAdmin: boolean } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[Admin] No valid auth header");
    return null;
  }
  
  const token = authHeader.replace("Bearer ", "");
  const jwtSecret = Deno.env.get("JWT_SECRET");
  
  if (!jwtSecret) {
    console.error("[Admin] JWT_SECRET not configured");
    return null;
  }
  
  try {
    const { verify } = await import("https://deno.land/x/djwt@v3.0.2/mod.ts");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    
    const payload = await verify(token, key);
    const userId = payload.sub as string;
    
    // Check if user has admin role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    const isAdmin = roleData?.role === "admin";
    console.log(`[Admin Check] User ${userId} - isAdmin: ${isAdmin}`);
    
    return { userId, isAdmin };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const fullPath = url.pathname;

  // Parse path after /admin (e.g. /functions/v1/admin/site-settings => site-settings)
  const afterAdmin = fullPath.split("/admin/")[1] ?? "";
  const [path = "", subPath = ""] = afterAdmin.split("/").filter(Boolean);
  
  // Check if this is a site-settings request (match various URL patterns)
  const isSiteSettingsPath = 
    path === "site-settings" || 
    afterAdmin === "site-settings" ||
    fullPath.endsWith("/site-settings") ||
    fullPath.includes("/site-settings");
  
  console.log(`[Admin] ${req.method} ${fullPath} | afterAdmin="${afterAdmin}" path="${path}" subPath="${subPath}" isSiteSettings=${isSiteSettingsPath}`);
  
  // Verify admin access for ALL requests
  const authResult = await verifyAdminToken(req.headers.get("Authorization"));
  
  if (!authResult) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  // Special case: check-role endpoint should return isAdmin status for any authenticated user
  if (req.method === "GET" && path === "check-role") {
    return new Response(
      JSON.stringify({ isAdmin: authResult.isAdmin, userId: authResult.userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  if (!authResult.isAdmin) {
    console.log(`[Admin] Access denied for user ${authResult.userId}`);
    return new Response(
      JSON.stringify({ error: "Forbidden - Admin access required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // GET /admin/site-settings - Fetch site settings (admin only)
    if (req.method === "GET" && isSiteSettingsPath) {
      console.log("[Admin] ✓ Matched site-settings GET route");
      
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[Admin] Failed to fetch site settings:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch site settings: " + error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ settings: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUT /admin/site-settings - Update singleton site settings (admin only)
    if (req.method === "PUT" && isSiteSettingsPath) {
      console.log("[Admin] ✓ Matched site-settings PUT route");
      const body = await req.json().catch(() => ({}));

      // Prevent overriding immutable fields
      const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...updates } = body ?? {};

      const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

      console.log("[Admin] Upserting site_settings with:", Object.keys(updates));

      const { data, error } = await supabase
        .from("site_settings")
        .upsert({ id: SETTINGS_ID, ...updates }, { onConflict: "id" })
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("[Admin] Failed to update site settings:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update site settings: " + error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[Admin] Site settings updated successfully");
      return new Response(
        JSON.stringify({ settings: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Note: check-role is handled earlier, before admin check

    if (req.method === "GET" && path === "overview") {
      // Total users count
      const { count: totalUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      // Active users count
      const { count: activeUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Suspended users count
      const { count: suspendedUsers } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("status", "suspended");

      // Users with connected Facebook pages
      const { data: connectedAccountUsers } = await supabase
        .from("connected_accounts")
        .select("user_id")
        .eq("platform", "facebook")
        .eq("is_connected", true);
      
      const uniqueConnectedUsers = new Set(connectedAccountUsers?.map(a => a.user_id) || []);
      const usersWithFacebook = uniqueConnectedUsers.size;

      // === NEW STATS ===
      
      // Total automations count
      const { count: totalAutomations } = await supabase
        .from("automations")
        .select("*", { count: "exact", head: true });

      // Total products count (online products)
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Total shop products count (offline shop)
      const { count: totalShopProducts } = await supabase
        .from("shop_products")
        .select("*", { count: "exact", head: true });

      // Total shop sales count
      const { count: totalShopSales } = await supabase
        .from("shop_sales")
        .select("*", { count: "exact", head: true });

      // Total shop customers
      const { count: totalShopCustomers } = await supabase
        .from("shop_customers")
        .select("*", { count: "exact", head: true });

      // Total blog posts
      const { count: totalBlogPosts } = await supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true });

      // Published blog posts
      const { count: publishedBlogPosts } = await supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true);

      // Total CMS pages
      const { count: totalCMSPages } = await supabase
        .from("cms_pages")
        .select("*", { count: "exact", head: true });

      // Total execution logs (automation runs)
      const { count: totalExecutionLogs } = await supabase
        .from("execution_logs")
        .select("*", { count: "exact", head: true });

      // Total orders (online)
      const { count: totalOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      // Total notifications
      const { count: totalNotifications } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true });

      // Total shop suppliers
      const { count: totalShopSuppliers } = await supabase
        .from("shop_suppliers")
        .select("*", { count: "exact", head: true });

      // Total shop purchases
      const { count: totalShopPurchases } = await supabase
        .from("shop_purchases")
        .select("*", { count: "exact", head: true });

      // Total reviews
      const { count: totalReviews } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true });

      // Users by subscription plan
      const { data: planData } = await supabase
        .from("users")
        .select("subscription_plan");
      
      const planCounts: Record<string, number> = {};
      planData?.forEach(u => {
        planCounts[u.subscription_plan] = (planCounts[u.subscription_plan] || 0) + 1;
      });

      // Signups per day for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentUsers } = await supabase
        .from("users")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      const signupsPerDay: Record<string, number> = {};
      recentUsers?.forEach(u => {
        const date = new Date(u.created_at).toISOString().split("T")[0];
        signupsPerDay[date] = (signupsPerDay[date] || 0) + 1;
      });

      // Fill in missing days with 0
      const signupsArray = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        signupsArray.push({ date: dateStr, count: signupsPerDay[dateStr] || 0 });
      }

      // Top 10 most active users by automation runs
      const { data: executionCounts } = await supabase
        .from("execution_logs")
        .select("user_id");

      const userActivityMap: Record<string, number> = {};
      executionCounts?.forEach(e => {
        userActivityMap[e.user_id] = (userActivityMap[e.user_id] || 0) + 1;
      });

      const topUserIds = Object.entries(userActivityMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId]) => userId);

      let topActiveUsers: Array<{ id: string; display_name: string | null; email: string; automation_runs: number; orders_count: number }> = [];
      
      if (topUserIds.length > 0) {
        const { data: topUsersData } = await supabase
          .from("users")
          .select("id, display_name, email")
          .in("id", topUserIds);

        // Get order counts for top users
        const { data: orderCounts } = await supabase
          .from("orders")
          .select("user_id")
          .in("user_id", topUserIds);

        const orderCountMap: Record<string, number> = {};
        orderCounts?.forEach(o => {
          orderCountMap[o.user_id] = (orderCountMap[o.user_id] || 0) + 1;
        });

        topActiveUsers = (topUsersData || []).map(u => ({
          id: u.id,
          display_name: u.display_name,
          email: u.email,
          automation_runs: userActivityMap[u.id] || 0,
          orders_count: orderCountMap[u.id] || 0
        })).sort((a, b) => b.automation_runs - a.automation_runs);
      }

      console.log(`[Admin Overview] Stats fetched by ${authResult.userId}`);

      return new Response(
        JSON.stringify({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          suspendedUsers: suspendedUsers || 0,
          usersWithFacebook,
          // New stats
          totalAutomations: totalAutomations || 0,
          totalProducts: totalProducts || 0,
          totalShopProducts: totalShopProducts || 0,
          totalShopSales: totalShopSales || 0,
          totalShopCustomers: totalShopCustomers || 0,
          totalBlogPosts: totalBlogPosts || 0,
          publishedBlogPosts: publishedBlogPosts || 0,
          totalCMSPages: totalCMSPages || 0,
          totalExecutionLogs: totalExecutionLogs || 0,
          totalOrders: totalOrders || 0,
          totalNotifications: totalNotifications || 0,
          totalShopSuppliers: totalShopSuppliers || 0,
          totalShopPurchases: totalShopPurchases || 0,
          totalReviews: totalReviews || 0,
          // Existing
          planCounts,
          signupsPerDay: signupsArray,
          topActiveUsers
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

// GET /admin/users - List users with pagination and search
    if (req.method === "GET" && path === "users") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const search = url.searchParams.get("search") || "";
      const offset = (page - 1) * limit;

      // Validate search input length to prevent abuse
      if (search.length > 100) {
        return new Response(
          JSON.stringify({ error: "Search term too long (max 100 characters)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Escape special ILIKE characters to prevent SQL injection
      const escapeILikePattern = (input: string): string => {
        return input.replace(/[%_\\]/g, '\\$&');
      };

      let query = supabase
        .from("users")
        .select("id, display_name, email, status, created_at, subscription_plan, trial_end_date, is_trial_active, phone, avatar_url", { count: "exact" });

      if (search) {
        const sanitizedSearch = escapeILikePattern(search);
        query = query.or(`email.ilike.%${sanitizedSearch}%,display_name.ilike.%${sanitizedSearch}%`);
      }

      const { data: users, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get roles for these users
      const userIds = users?.map(u => u.id) || [];
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      
      const usersWithRoles = users?.map(u => ({
        ...u,
        role: rolesMap.get(u.id) || "user"
      }));

      return new Response(
        JSON.stringify({ 
          users: usersWithRoles, 
          total: count,
          page,
          totalPages: Math.ceil((count || 0) / limit)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /admin/user/:id - Get single user details
    if (req.method === "GET" && path.match(/^[0-9a-f-]{36}$/) && !subPath) {
      const userId = path;

      // Get user info
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      // Get connected accounts
      const { data: connectedAccounts } = await supabase
        .from("connected_accounts")
        .select("id, platform, name, external_id, is_connected, created_at")
        .eq("user_id", userId);

      // Get usage stats
      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      const { count: automationsCount } = await supabase
        .from("automations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      const { count: executionLogsCount } = await supabase
        .from("execution_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Get subscription info
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return new Response(
        JSON.stringify({
          user: {
            ...user,
            role: roleData?.role || "user",
            password_hash: undefined // Never expose password hash
          },
          connectedAccounts: connectedAccounts || [],
          stats: {
            ordersCount: ordersCount || 0,
            automationsCount: automationsCount || 0,
            messagesHandled: executionLogsCount || 0
          },
          subscription
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /admin/users - Create new user
    if (req.method === "POST" && path === "users") {
      const body = await req.json();
      const { email, display_name, role, subscription_plan, status, password } = body;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email and password are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: "User with this email already exists" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Hash password using PBKDF2 (same format as auth-signup)
      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
      );
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256"
        },
        keyMaterial,
        256
      );
      const hashArray = new Uint8Array(derivedBits);
      const combined = new Uint8Array(salt.length + hashArray.length);
      combined.set(salt);
      combined.set(hashArray, salt.length);
      const passwordHash = btoa(String.fromCharCode(...combined));

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          email,
          display_name: display_name || null,
          password_hash: passwordHash,
          subscription_plan: subscription_plan || "trial",
          status: status || "active",
          email_verified: true, // Admin-created users are pre-verified
        })
        .select()
        .single();

      if (createError) {
        console.error("[Admin] Create user error:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Set role if specified
      if (role && role !== "user") {
        await supabase
          .from("user_roles")
          .insert({ user_id: newUser.id, role });
      }

      console.log(`[Admin] User ${authResult.userId} created new user ${newUser.id}`);

      return new Response(
        JSON.stringify({ success: true, user: { ...newUser, role: role || "user" } }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUT /admin/user/:id - Update user
    if (req.method === "PUT" && path.match(/^[0-9a-f-]{36}$/) && !subPath) {
      const userId = path;
      const body = await req.json();
      const { display_name, subscription_plan, status, trial_end_date, is_trial_active, email, subscription_started_at, subscription_ends_at } = body;

      // Get current user data before update (for notification)
      const { data: currentUser } = await supabase
        .from("users")
        .select("email, display_name, subscription_plan, status, is_trial_active, trial_end_date")
        .eq("id", userId)
        .single();

      const previousPlan = currentUser?.subscription_plan;
      const previousStatus = currentUser?.status;
      const previousName = currentUser?.display_name;

      // Plan durations in days
      const PLAN_DURATIONS: Record<string, number | null> = {
        trial: 7,
        starter: 30,
        professional: 30,
        business: 30,
        lifetime: null,
        none: 0,
      };

      const PLAN_DISPLAY_NAMES: Record<string, string> = {
        trial: "Trial",
        starter: "Starter",
        professional: "Professional",
        business: "Business",
        lifetime: "Lifetime",
        none: "None",
      };


      const updateData: Record<string, unknown> = {};
      if (display_name !== undefined) updateData.display_name = display_name;
      if (status !== undefined) updateData.status = status;
      if (trial_end_date !== undefined) updateData.trial_end_date = trial_end_date;
      if (is_trial_active !== undefined) updateData.is_trial_active = is_trial_active;
      
      // Handle subscription plan change with automatic date setting
      let newEndDate: Date | null = null;
      if (subscription_plan !== undefined) {
        updateData.subscription_plan = subscription_plan;
        
        // If explicit dates are provided, use them
        if (subscription_started_at !== undefined) {
          updateData.subscription_started_at = subscription_started_at;
        }
        if (subscription_ends_at !== undefined) {
          updateData.subscription_ends_at = subscription_ends_at;
          newEndDate = subscription_ends_at ? new Date(subscription_ends_at) : null;
        }
        
        // If no explicit dates and plan is changing to a paid plan, set default dates
        if (subscription_started_at === undefined && subscription_ends_at === undefined) {
          const paidPlans = ['starter', 'professional', 'business'];
          if (paidPlans.includes(subscription_plan)) {
            const now = new Date();
            const duration = PLAN_DURATIONS[subscription_plan] || 30;
            newEndDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
            updateData.subscription_started_at = now.toISOString();
            updateData.subscription_ends_at = newEndDate.toISOString();
            updateData.is_trial_active = false;
          } else if (subscription_plan === 'lifetime') {
            updateData.subscription_started_at = new Date().toISOString();
            updateData.subscription_ends_at = null;
            updateData.is_trial_active = false;
          } else if (subscription_plan === 'none') {
            updateData.subscription_started_at = null;
            updateData.subscription_ends_at = null;
            updateData.is_trial_active = false;
          }
        }
      }
      
      // Handle email change
      if (email !== undefined) {
        // Check if email is already in use by another user
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .neq("id", userId)
          .maybeSingle();
        
        if (existingUser) {
          return new Response(
            JSON.stringify({ error: "Email already in use by another user" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        updateData.email = email;
      }

      if (Object.keys(updateData).length === 0) {
        return new Response(
          JSON.stringify({ error: "No fields to update" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: updatedUser, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select("id, display_name, email, status, created_at, subscription_plan, trial_end_date, is_trial_active, phone, avatar_url, subscription_started_at, subscription_ends_at")
        .single();

      if (error) {
        console.error("[Admin] Update user error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Admin] User ${authResult.userId} updated user ${userId}`, updateData);

      // Send notification emails for changes
      if (currentUser?.email) {
        const userName = currentUser.display_name || currentUser.email.split("@")[0];
        const companyName = await getCompanyName();
        
        try {
          // 1. Status change notifications (suspended/activated)
          if (status !== undefined && previousStatus !== status) {
            if (status === "suspended") {
              await sendAdminNotification("account_suspended", currentUser.email, userName);
              console.log(`[Admin] Account suspended email sent to ${currentUser.email}`);
            } else if (status === "active" && previousStatus === "suspended") {
              await sendAdminNotification("account_activated", currentUser.email, userName);
              console.log(`[Admin] Account activated email sent to ${currentUser.email}`);
            }
          }

          // 2. Plan change notification
          if (subscription_plan !== undefined && previousPlan !== subscription_plan) {
            const newPlanName = PLAN_DISPLAY_NAMES[subscription_plan] || subscription_plan;
            const previousPlanName = PLAN_DISPLAY_NAMES[previousPlan] || previousPlan || "Unknown";
            
            // Check if plan is being set to "none" (expired/cancelled)
            if (subscription_plan === "none") {
              // Send plan expired notification instead of purchase email
              const emailHtml = getPlanExpiredEmailTemplate(userName, previousPlanName, companyName);
              
              await resend.emails.send({
                from: `${companyName} <noreply@autofloy.com>`,
                to: [currentUser.email],
                subject: `⏰ Your ${previousPlanName} Plan Has Expired - ${companyName}`,
                html: emailHtml,
              });
              console.log(`[Admin] Plan expired email sent to ${currentUser.email} (was ${previousPlanName})`);
            } else if (subscription_plan === "trial") {
              // Send trial assigned email (no payment mention)
              const formatDate = (date: Date | null) => {
                if (!date) return "N/A";
                return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
              };
              
              const trialDays = 1; // 24 hours trial
              const endDate = formatDate(newEndDate || new Date(Date.now() + 24 * 60 * 60 * 1000));
              
              const emailHtml = getTrialAssignedEmailTemplate(userName, trialDays, endDate, companyName);
              
              await resend.emails.send({
                from: `${companyName} <noreply@autofloy.com>`,
                to: [currentUser.email],
                subject: `🎁 Free Trial Activated - ${companyName}`,
                html: emailHtml,
              });
              console.log(`[Admin] Trial assigned email sent to ${currentUser.email}`);
            } else {
              // Send plan purchase/upgrade email for paid plans only
              const formatDate = (date: Date | null) => {
                if (!date) return "N/A";
                return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
              };

              const startDate = formatDate(new Date());
              const endDate = subscription_plan === "lifetime" ? "Lifetime Access" : formatDate(newEndDate);

              const emailHtml = getPlanPurchaseEmailTemplate(
                userName,
                newPlanName,
                "Admin Assigned",
                "BDT",
                startDate,
                endDate
              );

              await resend.emails.send({
                from: `${companyName} <noreply@autofloy.com>`,
                to: [currentUser.email],
                subject: `🎉 Your ${newPlanName} Plan is Now Active - ${companyName}`,
                html: emailHtml,
              });
              console.log(`[Admin] Plan change email sent to ${currentUser.email} for plan ${newPlanName}`);
            }
          }

          // 3. Other profile changes notification (name, email, trial settings)
          const otherChanges: { field: string; oldValue?: string; newValue: string }[] = [];
          
          if (display_name !== undefined && previousName !== display_name) {
            otherChanges.push({
              field: "Display Name",
              oldValue: previousName || "Not set",
              newValue: display_name || "Not set"
            });
          }
          
          if (email !== undefined && currentUser.email !== email) {
            otherChanges.push({
              field: "Email Address",
              oldValue: currentUser.email,
              newValue: email
            });
          }
          
          if (is_trial_active !== undefined && currentUser.is_trial_active !== is_trial_active) {
            otherChanges.push({
              field: "Trial Status",
              oldValue: currentUser.is_trial_active ? "Active" : "Inactive",
              newValue: is_trial_active ? "Active" : "Inactive"
            });
          }
          
          if (trial_end_date !== undefined && currentUser.trial_end_date !== trial_end_date) {
            otherChanges.push({
              field: "Trial End Date",
              oldValue: currentUser.trial_end_date ? new Date(currentUser.trial_end_date).toLocaleDateString() : "Not set",
              newValue: trial_end_date ? new Date(trial_end_date).toLocaleDateString() : "Not set"
            });
          }

          // Only send if there are changes that weren't already covered by plan/status notifications
          if (otherChanges.length > 0 && 
              !(subscription_plan !== undefined && previousPlan !== subscription_plan) &&
              !(status !== undefined && previousStatus !== status)) {
            const emailHtml = getAccountUpdateEmailTemplate(userName, otherChanges, companyName);
            
            await resend.emails.send({
              from: `${companyName} <noreply@autofloy.com>`,
              to: [currentUser.email],
              subject: `📝 Your Account Has Been Updated - ${companyName}`,
              html: emailHtml,
            });
            console.log(`[Admin] Account update email sent to ${currentUser.email} with ${otherChanges.length} changes`);
          }
        } catch (emailError) {
          console.error("[Admin] Failed to send notification email:", emailError);
          // Don't fail the update if email fails
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "User updated", user: updatedUser }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE /admin/user/:id - Delete user
    if (req.method === "DELETE" && path.match(/^[0-9a-f-]{36}$/) && !subPath) {
      const userId = path;

      // Prevent self-deletion
      if (userId === authResult.userId) {
        return new Response(
          JSON.stringify({ error: "Cannot delete yourself" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete user (cascading will handle related records)
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) {
        console.error("[Admin] Delete user error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to delete user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Admin] User ${authResult.userId} deleted user ${userId}`);

      return new Response(
        JSON.stringify({ success: true, message: "User deleted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /admin/user/:id/password - Reset user password
    if (req.method === "POST" && subPath === "password" && path.match(/^[0-9a-f-]{36}$/)) {
      const userId = path;
      
      const body = await req.json();
      const { password } = body;

      if (!password || password.length < 8) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 8 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Hash new password using PBKDF2 (same format as auth-signup)
      const encoder = new TextEncoder();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
      );
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256"
        },
        keyMaterial,
        256
      );
      const hashArray = new Uint8Array(derivedBits);
      const combined = new Uint8Array(salt.length + hashArray.length);
      combined.set(salt);
      combined.set(hashArray, salt.length);
      const passwordHash = btoa(String.fromCharCode(...combined));

      // Get user info for notification
      const { data: targetUser } = await supabase
        .from("users")
        .select("email, display_name")
        .eq("id", userId)
        .single();

      const { error } = await supabase
        .from("users")
        .update({ password_hash: passwordHash })
        .eq("id", userId);

      if (error) {
        console.error("[Admin] Password reset error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to reset password" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send email notification
      if (targetUser?.email) {
        await sendAdminNotification("password_reset", targetUser.email, targetUser.display_name || undefined);
      }

      console.log(`[Admin] User ${authResult.userId} reset password for ${userId}`);

      return new Response(
        JSON.stringify({ success: true, message: "Password reset successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /admin/user/:id/role - Change user role
    if (req.method === "POST" && subPath === "role" && path.match(/^[0-9a-f-]{36}$/)) {
      const userId = path;
      
      const body = await req.json();
      const { role, reason } = body;

      if (!["admin", "user"].includes(role)) {
        return new Response(
          JSON.stringify({ error: "Invalid role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prevent self-demotion
      if (userId === authResult.userId && role !== "admin") {
        return new Response(
          JSON.stringify({ error: "Cannot demote yourself" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get current role for audit logging
      const { data: currentRoleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      
      const oldRole = currentRoleData?.role || "user";

      // Skip if role is not actually changing
      if (oldRole === role) {
        return new Response(
          JSON.stringify({ success: true, message: `Role is already ${role}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upsert role
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id" });

      if (error) throw error;

      // Audit log: notify user about role change
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Account Role Changed",
        body: `Your account role has been changed from ${oldRole} to ${role} by an administrator.${reason ? ` Reason: ${reason}` : ""}`
      });

      // Get user info for email notification
      const { data: targetUserRole } = await supabase
        .from("users")
        .select("email, display_name")
        .eq("id", userId)
        .single();

      // Send email notification
      if (targetUserRole?.email) {
        await sendAdminNotification("role_changed", targetUserRole.email, targetUserRole.display_name || undefined, { newRole: role });
      }

      console.log(`[Admin Audit] User ${authResult.userId} changed role of ${userId} from ${oldRole} to ${role}. Reason: ${reason || "Not provided"}`);

      return new Response(
        JSON.stringify({ success: true, message: `Role updated to ${role}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /admin/user/:id/sync-permission - Update user sync permission
    if (req.method === "POST" && subPath === "sync-permission" && path.match(/^[0-9a-f-]{36}$/)) {
      const userId = path;
      
      const body = await req.json();
      const { can_sync_business } = body;

      if (typeof can_sync_business !== "boolean") {
        return new Response(
          JSON.stringify({ error: "Invalid can_sync_business value - must be boolean" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update user's sync permission
      const { error } = await supabase
        .from("users")
        .update({ can_sync_business })
        .eq("id", userId);

      if (error) {
        console.error("[Admin] Failed to update sync permission:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update sync permission" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create notification for user
      await supabase.from("notifications").insert({
        user_id: userId,
        title: can_sync_business ? "Business Sync Enabled" : "Business Sync Disabled",
        body: can_sync_business 
          ? "An administrator has enabled business sync for your account. You can now connect your offline shop with online business."
          : "An administrator has disabled business sync for your account."
      });

      console.log(`[Admin Audit] User ${authResult.userId} ${can_sync_business ? "enabled" : "disabled"} sync permission for ${userId}`);

      return new Response(
        JSON.stringify({ success: true, message: `Sync permission ${can_sync_business ? "enabled" : "disabled"}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /admin/user/:id/status - Suspend/Activate user
    if (req.method === "POST" && subPath === "status" && path.match(/^[0-9a-f-]{36}$/)) {
      const userId = path;
      
      const body = await req.json();
      const { status } = body;

      if (!["active", "suspended"].includes(status)) {
        return new Response(
          JSON.stringify({ error: "Invalid status" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prevent self-suspension
      if (userId === authResult.userId && status === "suspended") {
        return new Response(
          JSON.stringify({ error: "Cannot suspend yourself" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user info for notification
      const { data: targetUserStatus } = await supabase
        .from("users")
        .select("email, display_name")
        .eq("id", userId)
        .single();

      const { error } = await supabase
        .from("users")
        .update({ status })
        .eq("id", userId);

      if (error) throw error;

      // Send email notification
      if (targetUserStatus?.email) {
        const notificationType = status === "suspended" ? "account_suspended" : "account_activated";
        await sendAdminNotification(notificationType, targetUserStatus.email, targetUserStatus.display_name || undefined);
      }

      console.log(`[Admin] User ${authResult.userId} changed status of ${userId} to ${status}`);

      return new Response(
        JSON.stringify({ success: true, message: `User ${status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /admin/subscriptions - Subscription statistics
    if (req.method === "GET" && path === "subscriptions") {
      // Count users by plan
      const { data: planCounts } = await supabase
        .from("users")
        .select("subscription_plan");

      const planStats: Record<string, number> = {};
      planCounts?.forEach(u => {
        planStats[u.subscription_plan] = (planStats[u.subscription_plan] || 0) + 1;
      });

      // Get upcoming trial expirations (next 24 hours)
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const { data: upcomingExpirations } = await supabase
        .from("users")
        .select("id, display_name, email, trial_end_date")
        .eq("is_trial_active", true)
        .gte("trial_end_date", now.toISOString())
        .lte("trial_end_date", next24Hours.toISOString())
        .order("trial_end_date", { ascending: true });

      // Get recent upgrades (subscriptions created in last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const { data: recentUpgrades } = await supabase
        .from("subscriptions")
        .select("id, user_id, plan, status, started_at, amount")
        .gte("started_at", thirtyDaysAgo.toISOString())
        .order("started_at", { ascending: false })
        .limit(20);

      // Get user details for recent upgrades
      const upgradeUserIds = recentUpgrades?.map(s => s.user_id) || [];
      const { data: upgradeUsers } = await supabase
        .from("users")
        .select("id, display_name, email")
        .in("id", upgradeUserIds);

      const usersMap = new Map(upgradeUsers?.map(u => [u.id, u]) || []);
      
      const upgradesWithUsers = recentUpgrades?.map(s => ({
        ...s,
        user: usersMap.get(s.user_id)
      }));

      return new Response(
        JSON.stringify({
          planStats,
          upcomingTrialExpirations: upcomingExpirations || [],
          recentUpgrades: upgradesWithUsers || []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /admin/:userId/unlock - Unlock user rate limit
    if (req.method === "POST" && subPath === "unlock" && path) {
      const userId = path;

      // Get user email
      const { data: targetUser, error: userError } = await supabase
        .from("users")
        .select("email, display_name")
        .eq("id", userId)
        .single();

      if (userError || !targetUser) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete all rate limit entries for this user's email
      const { error: deleteError } = await supabase
        .from("auth_rate_limits")
        .delete()
        .eq("identifier", targetUser.email.toLowerCase());

      if (deleteError) {
        console.error("[Admin] Failed to unlock user:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to unlock user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Admin] User ${authResult.userId} unlocked rate limit for ${userId} (${targetUser.email})`);

      return new Response(
        JSON.stringify({ success: true, message: "User unlocked successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /admin/reset-trash-passcode - Reset user's trash passcode (admin only)
    if (req.method === "POST" && (path === "reset-trash-passcode" || afterAdmin === "reset-trash-passcode")) {
      const body = await req.json().catch(() => ({}));
      const { email } = body;

      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find user by email
      const { data: targetUser, error: userError } = await supabase
        .from("users")
        .select("id, display_name, email")
        .ilike("email", email)
        .maybeSingle();

      if (userError || !targetUser) {
        return new Response(
          JSON.stringify({ error: "User not found with this email" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Reset the trash passcode in shop_settings
      const { data: existingSettings } = await supabase
        .from("shop_settings")
        .select("id, trash_passcode_hash")
        .eq("user_id", targetUser.id)
        .maybeSingle();

      if (!existingSettings?.trash_passcode_hash) {
        return new Response(
          JSON.stringify({ error: "User has no trash passcode set", user: { id: targetUser.id, email: targetUser.email, display_name: targetUser.display_name } }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Clear the passcode
      const { error: updateError } = await supabase
        .from("shop_settings")
        .update({ trash_passcode_hash: null, updated_at: new Date().toISOString() })
        .eq("user_id", targetUser.id);

      if (updateError) {
        console.error("[Admin] Failed to reset trash passcode:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to reset passcode" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Admin] User ${authResult.userId} reset trash passcode for ${targetUser.id} (${targetUser.email})`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Trash passcode reset successfully",
          user: { id: targetUser.id, email: targetUser.email, display_name: targetUser.display_name }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /admin/search-user-passcode - Search user and check if they have passcode
    if (req.method === "GET" && (path === "search-user-passcode" || afterAdmin.startsWith("search-user-passcode"))) {
      const searchEmail = url.searchParams.get("email");

      if (!searchEmail) {
        return new Response(
          JSON.stringify({ error: "Email parameter is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find user by email
      const { data: targetUser, error: userError } = await supabase
        .from("users")
        .select("id, display_name, email")
        .ilike("email", `%${searchEmail}%`)
        .limit(10);

      if (userError) {
        return new Response(
          JSON.stringify({ error: "Search failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!targetUser || targetUser.length === 0) {
        return new Response(
          JSON.stringify({ users: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check which users have passcode set
      const userIds = targetUser.map(u => u.id);
      const { data: settings } = await supabase
        .from("shop_settings")
        .select("user_id, trash_passcode_hash")
        .in("user_id", userIds);

      const passcodeMap = new Map(
        (settings || []).map(s => [s.user_id, !!s.trash_passcode_hash])
      );

      const usersWithPasscodeInfo = targetUser.map(u => ({
        id: u.id,
        email: u.email,
        display_name: u.display_name,
        has_trash_passcode: passcodeMap.get(u.id) || false
      }));

      return new Response(
        JSON.stringify({ users: usersWithPasscodeInfo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /admin/:userId/settings - Get user's shop settings, SMS settings, notifications
    if (req.method === "GET" && subPath === "settings" && path.match(/^[0-9a-f-]{36}$/)) {
      const userId = path;

      // Get user info
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, display_name, email")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get shop settings
      const { data: shopSettings } = await supabase
        .from("shop_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Get user settings (AI tone, language, notifications)
      const { data: userSettings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Get notifications preferences (check if any recent notifications exist)
      const { count: notificationsCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({
          user,
          shopSettings: shopSettings || null,
          userSettings: userSettings || null,
          notificationsCount: notificationsCount || 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUT /admin/:userId/settings - Update user's shop settings
    if (req.method === "PUT" && subPath === "settings" && path.match(/^[0-9a-f-]{36}$/)) {
      const userId = path;
      const body = await req.json().catch(() => ({}));

      // Verify user exists
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, email")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { shopSettings, userSettings, resetPasscode } = body;

      // Handle passcode reset
      if (resetPasscode === true) {
        const { error: passcodeError } = await supabase
          .from("shop_settings")
          .update({ trash_passcode_hash: null, updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        if (passcodeError) {
          console.error("[Admin] Failed to reset passcode:", passcodeError);
        } else {
          console.log(`[Admin] User ${authResult.userId} reset trash passcode for ${userId}`);
        }
      }

      // Update shop settings if provided
      if (shopSettings && typeof shopSettings === "object") {
        const { id: _id, user_id: _userId, created_at: _createdAt, trash_passcode_hash: _passcode, ...updateData } = shopSettings;
        
        // Check if settings exist
        const { data: existingSettings } = await supabase
          .from("shop_settings")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingSettings) {
          // Update existing
          const { error: updateError } = await supabase
            .from("shop_settings")
            .update({ ...updateData, updated_at: new Date().toISOString() })
            .eq("user_id", userId);

          if (updateError) {
            console.error("[Admin] Failed to update shop settings:", updateError);
            return new Response(
              JSON.stringify({ error: "Failed to update shop settings" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          // Create new
          const { error: insertError } = await supabase
            .from("shop_settings")
            .insert({ user_id: userId, ...updateData });

          if (insertError) {
            console.error("[Admin] Failed to create shop settings:", insertError);
            return new Response(
              JSON.stringify({ error: "Failed to create shop settings" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        console.log(`[Admin] User ${authResult.userId} updated shop settings for ${userId}`);
      }

      // Update user settings (AI tone, language) if provided
      if (userSettings && typeof userSettings === "object") {
        const { id: _id, user_id: _userId, created_at: _createdAt, ...userUpdateData } = userSettings;
        
        // Check if user settings exist
        const { data: existingUserSettings } = await supabase
          .from("user_settings")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingUserSettings) {
          // Update existing
          const { error: updateError } = await supabase
            .from("user_settings")
            .update({ ...userUpdateData, updated_at: new Date().toISOString() })
            .eq("user_id", userId);

          if (updateError) {
            console.error("[Admin] Failed to update user settings:", updateError);
            return new Response(
              JSON.stringify({ error: "Failed to update user settings" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          // Create new
          const { error: insertError } = await supabase
            .from("user_settings")
            .insert({ user_id: userId, ...userUpdateData });

          if (insertError) {
            console.error("[Admin] Failed to create user settings:", insertError);
            return new Response(
              JSON.stringify({ error: "Failed to create user settings" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        console.log(`[Admin] User ${authResult.userId} updated user settings for ${userId}`);

        // Sync tone/language to page_memory
        if (userUpdateData.default_tone || userUpdateData.response_language) {
          const pageMemoryUpdate: Record<string, unknown> = {};
          if (userUpdateData.default_tone) {
            pageMemoryUpdate.preferred_tone = userUpdateData.default_tone;
          }
          if (userUpdateData.response_language) {
            pageMemoryUpdate.detected_language = userUpdateData.response_language;
          }

          const { error: syncError } = await supabase
            .from("page_memory")
            .update(pageMemoryUpdate)
            .eq("user_id", userId);

          if (syncError) {
            console.warn(`[Admin] Failed to sync settings to page_memory:`, syncError);
          } else {
            console.log(`[Admin] Synced tone/language settings to all page_memory for user ${userId}`);
          }
        }

        // Send to n8n webhook if configured
        const { data: webhookConfig } = await supabase
          .from("webhook_configs")
          .select("url, is_active")
          .eq("id", "n8n_main")
          .maybeSingle();

        if (webhookConfig?.is_active && webhookConfig?.url) {
          try {
            // Get user email for webhook payload
            const webhookPayload = {
              event_type: "user.settings_updated",
              user_id: userId,
              user_email: user.email,
              settings: {
                default_tone: userUpdateData.default_tone || null,
                response_language: userUpdateData.response_language || null
              },
              updated_by: authResult.userId,
              updated_at: new Date().toISOString()
            };

            const webhookSecret = Deno.env.get("WEBHOOK_SECRET") || "";
            const payload = JSON.stringify(webhookPayload);
            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
              "raw",
              encoder.encode(webhookSecret),
              { name: "HMAC", hash: "SHA-256" },
              false,
              ["sign"]
            );
            const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
            const signatureHex = Array.from(new Uint8Array(signature))
              .map(b => b.toString(16).padStart(2, "0"))
              .join("");

            fetch(webhookConfig.url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Webhook-Signature": signatureHex
              },
              body: payload
            }).then(res => {
              console.log(`[Admin] Webhook sent to n8n, status: ${res.status}`);
            }).catch(err => {
              console.error(`[Admin] Failed to send webhook to n8n:`, err);
            });
          } catch (webhookError) {
            console.error(`[Admin] Error preparing webhook:`, webhookError);
          }
        }
      }

      // Fetch updated settings
      const { data: updatedShopSettings } = await supabase
        .from("shop_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: updatedUserSettings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      return new Response(
        JSON.stringify({ success: true, shopSettings: updatedShopSettings, userSettings: updatedUserSettings }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /admin/test-sms - Test SMS sending
    if (req.method === "POST" && path === "test-sms") {
      const body = await req.json().catch(() => ({}));
      const { phone, message } = body;

      if (!phone || !message) {
        return new Response(
          JSON.stringify({ error: "Phone number and message are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get platform SMS settings
      const { data: siteSettings } = await supabase
        .from("site_settings")
        .select("platform_sms_enabled, platform_sms_api_key, platform_sms_sender_id, platform_sms_provider")
        .limit(1)
        .maybeSingle();

      if (!siteSettings?.platform_sms_enabled) {
        return new Response(
          JSON.stringify({ error: "Platform SMS is not enabled. Enable it first in Site Settings." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!siteSettings.platform_sms_api_key) {
        return new Response(
          JSON.stringify({ error: "Platform SMS API key is not configured" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const provider = siteSettings.platform_sms_provider || "ssl_wireless";
      const apiKey = siteSettings.platform_sms_api_key;
      const senderId = siteSettings.platform_sms_sender_id || "AutoFloy";

      console.log(`[Admin] Testing SMS to ${phone} via ${provider}`);

      try {
        let smsResult: { success: boolean; message?: string; error?: string } = { success: false };

        // Format phone number (remove spaces, ensure + prefix)
        let formattedPhone = phone.replace(/\s+/g, "");
        if (!formattedPhone.startsWith("+")) {
          formattedPhone = "+88" + formattedPhone; // Default to BD
        }

        if (provider === "ssl_wireless") {
          // SSL Wireless API
          const sslUrl = "https://sms.sslwireless.com/pushapi/dynamic/server.php";
          const params = new URLSearchParams({
            api_token: apiKey,
            sid: senderId,
            msisdn: formattedPhone.replace("+", ""),
            sms: message,
            csms_id: `TEST_${Date.now()}`,
          });

          const response = await fetch(`${sslUrl}?${params.toString()}`);
          const responseText = await response.text();
          console.log("[Admin] SSL Wireless response:", responseText);

          // SSL returns JSON with status
          try {
            const jsonResponse = JSON.parse(responseText);
            if (jsonResponse.status === "SUCCESS" || jsonResponse.status_code === "200") {
              smsResult = { success: true, message: "SMS sent successfully via SSL Wireless" };
            } else {
              smsResult = { success: false, error: jsonResponse.message || "SSL Wireless error" };
            }
          } catch {
            smsResult = { success: false, error: responseText || "Unknown SSL Wireless error" };
          }
        } else if (provider === "twilio") {
          // Twilio API
          const [accountSid, authToken] = apiKey.split(":");
          if (!accountSid || !authToken) {
            return new Response(
              JSON.stringify({ error: "Invalid Twilio credentials format. Use ACCOUNT_SID:AUTH_TOKEN" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          const response = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: senderId,
              To: formattedPhone,
              Body: message,
            }),
          });

          const twilioResult = await response.json();
          console.log("[Admin] Twilio response:", twilioResult);

          if (response.ok) {
            smsResult = { success: true, message: `SMS sent successfully via Twilio (SID: ${twilioResult.sid})` };
          } else {
            smsResult = { success: false, error: twilioResult.message || "Twilio error" };
          }
        } else if (provider === "bulksms_bd") {
          // BulkSMS BD API
          const bulkUrl = "https://bulksmsbd.net/api/smsapi";
          const params = new URLSearchParams({
            api_key: apiKey,
            type: "text",
            number: formattedPhone.replace("+88", ""),
            senderid: senderId,
            message: message,
          });

          const response = await fetch(`${bulkUrl}?${params.toString()}`);
          const responseText = await response.text();
          console.log("[Admin] BulkSMS BD response:", responseText);

          try {
            const jsonResponse = JSON.parse(responseText);
            if (jsonResponse.response_code === "202" || jsonResponse.success) {
              smsResult = { success: true, message: "SMS sent successfully via BulkSMS BD" };
            } else {
              smsResult = { success: false, error: jsonResponse.message || "BulkSMS BD error" };
            }
          } catch {
            smsResult = { success: false, error: responseText || "Unknown BulkSMS BD error" };
          }
        } else if (provider === "greenweb") {
          // Green Web BD API
          const greenUrl = "https://api.greenweb.com.bd/api.php";
          const params = new URLSearchParams({
            token: apiKey,
            to: formattedPhone.replace("+88", ""),
            message: message,
          });

          const response = await fetch(`${greenUrl}?${params.toString()}`);
          const responseText = await response.text();
          console.log("[Admin] Green Web response:", responseText);

          if (responseText.includes("Ok") || responseText.includes("ok")) {
            smsResult = { success: true, message: "SMS sent successfully via Green Web BD" };
          } else {
            smsResult = { success: false, error: responseText || "Green Web BD error" };
          }
        } else if (provider === "mim_sms") {
          // MIM SMS API
          const mimUrl = "https://esms.mimsms.com/smsapi";
          const params = new URLSearchParams({
            api_key: apiKey,
            type: "text",
            contacts: formattedPhone.replace("+88", ""),
            senderid: senderId,
            msg: message,
          });

          const response = await fetch(`${mimUrl}?${params.toString()}`);
          const responseText = await response.text();
          console.log("[Admin] MIM SMS response:", responseText);

          try {
            const jsonResponse = JSON.parse(responseText);
            if (jsonResponse.status === "success" || jsonResponse.error === "0") {
              smsResult = { success: true, message: "SMS sent successfully via MIM SMS" };
            } else {
              smsResult = { success: false, error: jsonResponse.message || "MIM SMS error" };
            }
          } catch {
            smsResult = { success: false, error: responseText || "Unknown MIM SMS error" };
          }
        } else {
          smsResult = { success: false, error: `Unknown SMS provider: ${provider}` };
        }

        if (smsResult.success) {
          console.log(`[Admin] Test SMS sent successfully to ${phone}`);
          return new Response(
            JSON.stringify({ success: true, message: smsResult.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          console.error(`[Admin] Test SMS failed:`, smsResult.error);
          return new Response(
            JSON.stringify({ error: smsResult.error || "Failed to send test SMS" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (smsError: unknown) {
        const errorMessage = smsError instanceof Error ? smsError.message : "Unknown error";
        console.error("[Admin] SMS error:", smsError);
        return new Response(
          JSON.stringify({ error: `SMS sending failed: ${errorMessage}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // GET /admin/webhooks - List all webhook configurations
    if (req.method === "GET" && path === "webhooks") {
      console.log("[Admin] Fetching webhook configs");
      
      const { data, error } = await supabase
        .from("webhook_configs")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("[Admin] Failed to fetch webhooks:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch webhooks: " + error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ webhooks: data || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUT /admin/webhooks/:id - Update a webhook configuration
    if (req.method === "PUT" && path === "webhooks" && subPath) {
      const webhookId = subPath;
      console.log(`[Admin] Updating webhook: ${webhookId}`);
      
      const body = await req.json().catch(() => ({}));
      const { url, is_active, is_coming_soon, name, description } = body;

      const updates: Record<string, unknown> = {};
      if (url !== undefined) updates.url = url;
      if (is_active !== undefined) updates.is_active = is_active;
      if (is_coming_soon !== undefined) updates.is_coming_soon = is_coming_soon;
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;

      const { data, error } = await supabase
        .from("webhook_configs")
        .update(updates)
        .eq("id", webhookId)
        .select()
        .single();

      if (error) {
        console.error("[Admin] Failed to update webhook:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update webhook: " + error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Admin] Webhook ${webhookId} updated successfully`);
      return new Response(
        JSON.stringify({ webhook: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /admin/webhooks - Create a new webhook configuration
    if (req.method === "POST" && path === "webhooks") {
      console.log("[Admin] Creating new webhook");
      
      const body = await req.json().catch(() => ({}));
      const { id, name, description, url, category, icon, is_active, is_coming_soon } = body;

      if (!id || !name || !category) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: id, name, category" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("webhook_configs")
        .insert({
          id,
          name,
          description: description || null,
          url: url || null,
          category,
          icon: icon || "Webhook",
          is_active: is_active || false,
          is_coming_soon: is_coming_soon !== false
        })
        .select()
        .single();

      if (error) {
        console.error("[Admin] Failed to create webhook:", error);
        return new Response(
          JSON.stringify({ error: "Failed to create webhook: " + error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Admin] Webhook ${id} created successfully`);
      return new Response(
        JSON.stringify({ webhook: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE /admin/webhooks/:id - Delete a webhook configuration
    if (req.method === "DELETE" && path === "webhooks" && subPath) {
      const webhookId = subPath;
      console.log(`[Admin] Deleting webhook: ${webhookId}`);

      const { error } = await supabase
        .from("webhook_configs")
        .delete()
        .eq("id", webhookId);

      if (error) {
        console.error("[Admin] Failed to delete webhook:", error);
        return new Response(
          JSON.stringify({ error: "Failed to delete webhook: " + error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Admin] Webhook ${webhookId} deleted successfully`);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE /admin/user/:id - Permanently delete a user and all their data
    if (req.method === "DELETE" && path.match(/^[0-9a-f-]{36}$/)) {
      const userId = path;
      console.log(`[Admin] Permanently deleting user: ${userId}`);

      // Prevent self-deletion
      if (userId === authResult.userId) {
        return new Response(
          JSON.stringify({ error: "Cannot delete your own account from admin panel" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user info before deletion for logging
      const { data: targetUser } = await supabase
        .from("users")
        .select("email, display_name")
        .eq("id", userId)
        .single();

      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Use the database function to completely delete user
      const { data: deleteResult, error: deleteError } = await supabase
        .rpc("delete_user_completely", { 
          p_user_id: userId, 
          p_preserve_email_history: true 
        });

      if (deleteError) {
        console.error("[Admin] Failed to delete user:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to delete user: " + deleteError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!deleteResult.success) {
        console.error("[Admin] Delete function failed:", deleteResult.error);
        return new Response(
          JSON.stringify({ error: deleteResult.error || "Failed to delete user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Admin Audit] User ${authResult.userId} permanently deleted user ${userId} (${targetUser.email})`);

      return new Response(
        JSON.stringify({ success: true, message: "User permanently deleted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /admin/api-integrations - Fetch all API integrations
    if (req.method === "GET" && path === "api-integrations") {
      const { data, error } = await supabase
        .from("api_integrations")
        .select("*")
        .order("provider");

      if (error) {
        console.error("[Admin] Failed to fetch API integrations:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch API integrations: " + error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mask API keys for security (show only first 4 and last 4 chars)
      const maskedData = data.map(int => ({
        ...int,
        api_key: int.api_key ? maskSecret(int.api_key) : null,
        api_secret: int.api_secret ? maskSecret(int.api_secret) : null,
      }));

      return new Response(
        JSON.stringify({ integrations: maskedData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUT /admin/api-integrations - Update an API integration
    if (req.method === "PUT" && path === "api-integrations") {
      const body = await req.json().catch(() => ({}));
      const { provider, api_key, api_secret, is_enabled } = body;

      if (!provider) {
        return new Response(
          JSON.stringify({ error: "Provider is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build update object - only include fields that aren't masked values
      const updateData: Record<string, unknown> = {
        is_enabled: is_enabled ?? false,
        updated_at: new Date().toISOString(),
      };

      // Only update api_key if it's not a masked value
      if (api_key !== null && api_key !== undefined && !api_key.includes("••••")) {
        updateData.api_key = api_key || null;
      }

      if (api_secret !== null && api_secret !== undefined && !api_secret.includes("••••")) {
        updateData.api_secret = api_secret || null;
      }

      const { data, error } = await supabase
        .from("api_integrations")
        .update(updateData)
        .eq("provider", provider)
        .select()
        .single();

      if (error) {
        console.error("[Admin] Failed to update API integration:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update API integration: " + error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Admin Audit] User ${authResult.userId} updated API integration: ${provider}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          integration: {
            ...data,
            api_key: data.api_key ? maskSecret(data.api_key) : null,
            api_secret: data.api_secret ? maskSecret(data.api_secret) : null,
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /admin/payment-requests - Fetch payment requests with pagination
    if (req.method === "GET" && path === "payment-requests") {
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const search = url.searchParams.get("search") || "";
      const statusFilter = url.searchParams.get("status") || "all";
      const offset = (page - 1) * limit;

      let query = supabase
        .from("payment_requests")
        .select("*", { count: "exact" });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (search) {
        query = query.or(`transaction_id.ilike.%${search}%`);
      }

      const { data: requests, count, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("[Admin] Failed to fetch payment requests:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch payment requests: " + error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch user details for each request
      const userIds = [...new Set(requests?.map(r => r.user_id) || [])];
      const { data: users } = await supabase
        .from("users")
        .select("id, display_name, email")
        .in("id", userIds);

      const usersMap = new Map(users?.map(u => [u.id, u]) || []);

      const enrichedRequests = requests?.map(r => ({
        ...r,
        user: usersMap.get(r.user_id) || null,
      }));

      return new Response(
        JSON.stringify({
          requests: enrichedRequests,
          total: count || 0,
          page,
          totalPages: Math.ceil((count || 0) / limit),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUT /admin/payment-requests/:id - Approve or reject a payment request
    if (req.method === "PUT" && path === "payment-requests" && subPath) {
      const requestId = subPath;
      const body = await req.json().catch(() => ({}));
      const { status, admin_notes } = body;

      if (!["approved", "rejected"].includes(status)) {
        return new Response(
          JSON.stringify({ error: "Status must be 'approved' or 'rejected'" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the payment request
      const { data: request, error: fetchError } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (fetchError || !request) {
        return new Response(
          JSON.stringify({ error: "Payment request not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (request.status !== "pending") {
        return new Response(
          JSON.stringify({ error: "This request has already been processed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update the payment request
      const { data: updatedRequest, error: updateError } = await supabase
        .from("payment_requests")
        .update({
          status,
          admin_notes: admin_notes || null,
          approved_at: new Date().toISOString(),
          approved_by: authResult.userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (updateError) {
        console.error("[Admin] Failed to update payment request:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update payment request: " + updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If approved, update user's subscription
      if (status === "approved") {
        const now = new Date();
        const endDate = new Date();
        
        // Normalize plan name to lowercase for enum compatibility
        const normalizedPlanName = (request.plan_name || "starter").toLowerCase();
        console.log(`[Admin] Approving payment for plan: ${request.plan_name} -> ${normalizedPlanName}`);
        
        // Set subscription end date based on plan
        if (normalizedPlanName === "lifetime") {
          endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime = 100 years
        } else {
          endDate.setMonth(endDate.getMonth() + 1); // Monthly plans
        }

        // Update user subscription
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            subscription_plan: normalizedPlanName,
            is_trial_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", request.user_id);

        if (userUpdateError) {
          console.error("[Admin] Failed to update user subscription_plan:", userUpdateError);
        } else {
          console.log(`[Admin] Successfully updated user ${request.user_id} to plan: ${normalizedPlanName}`);
        }

        // Create/update subscription record
        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: request.user_id,
            plan: normalizedPlanName,
            status: "active",
            started_at: now.toISOString(),
            ends_at: endDate.toISOString(),
            amount: request.amount,
          }, { onConflict: "user_id" });

        if (subscriptionError) {
          console.error("[Admin] Failed to upsert subscription:", subscriptionError);
        } else {
          console.log(`[Admin] Successfully created/updated subscription for user ${request.user_id}`);
        }

        // Get user email for notification
        const { data: userData } = await supabase
          .from("users")
          .select("email, display_name")
          .eq("id", request.user_id)
          .single();

        if (userData?.email) {
          const companyName = await getCompanyName();
          const html = getPlanPurchaseEmailTemplate(
            userData.display_name || "User",
            request.plan_name,
            `${request.amount}`,
            request.currency,
            now.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );
          
          try {
            await resend.emails.send({
              from: `${companyName} <noreply@autofloy.com>`,
              to: [userData.email],
              subject: `🎉 ${request.plan_name} Plan Activated!`,
              html,
            });
          } catch (emailError) {
            console.error("[Admin] Failed to send plan activation email:", emailError);
          }
        }

        // Create notification for user
        await supabase.from("notifications").insert({
          user_id: request.user_id,
          title: "Payment Approved!",
          body: `Your ${request.plan_name} plan has been activated successfully.`,
          notification_type: "subscription",
        });
      } else {
        // If rejected, send notification
        await supabase.from("notifications").insert({
          user_id: request.user_id,
          title: "Payment Request Update",
          body: `Your payment request for ${request.plan_name} plan was not approved. ${admin_notes || "Please contact support for more details."}`,
          notification_type: "subscription",
        });
      }

      console.log(`[Admin Audit] User ${authResult.userId} ${status} payment request ${requestId}`);

      return new Response(
        JSON.stringify({ request: updatedRequest }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE /admin/payment-requests/:id - Delete a payment request
    if (req.method === "DELETE" && path === "payment-requests" && subPath) {
      const requestId = subPath;
      
      // Check if request exists
      const { data: existingRequest, error: fetchError } = await supabase
        .from("payment_requests")
        .select("id")
        .eq("id", requestId)
        .single();

      if (fetchError || !existingRequest) {
        return new Response(
          JSON.stringify({ error: "Payment request not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete the payment request
      const { error: deleteError } = await supabase
        .from("payment_requests")
        .delete()
        .eq("id", requestId);

      if (deleteError) {
        console.error("[Admin] Failed to delete payment request:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to delete payment request: " + deleteError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Admin Audit] User ${authResult.userId} deleted payment request ${requestId}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Admin] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
