import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

// Plan capabilities - must match frontend planCapabilities.ts
const PLAN_CAPABILITIES: Record<string, {
  maxFacebookPages: number;
  maxWhatsappAccounts: number;
  maxAutomationsPerMonth: number | null;
  features: {
    messageAutoReply: boolean;
    commentAutoReply: boolean;
    imageAutoReply: boolean;
    voiceAutoReply: boolean;
    deleteNegativeComments: boolean;
    whatsappEnabled: boolean;
    instagramAutomation: boolean;
    tiktokAutomation: boolean;
    orderManagementSystem: boolean;
    invoiceSystem: boolean;
  };
}> = {
  none: {
    maxFacebookPages: 0,
    maxWhatsappAccounts: 0,
    maxAutomationsPerMonth: 0,
    features: { 
      messageAutoReply: false, 
      commentAutoReply: false, 
      imageAutoReply: false, 
      voiceAutoReply: false, 
      deleteNegativeComments: false,
      whatsappEnabled: false,
      instagramAutomation: false,
      tiktokAutomation: false,
      orderManagementSystem: false,
      invoiceSystem: false,
    },
  },
  trial: {
    maxFacebookPages: 10,
    maxWhatsappAccounts: 5,
    maxAutomationsPerMonth: null,
    features: { 
      messageAutoReply: true, 
      commentAutoReply: true, 
      imageAutoReply: true, 
      voiceAutoReply: true, 
      deleteNegativeComments: true,
      whatsappEnabled: true,
      instagramAutomation: true,
      tiktokAutomation: true,
      orderManagementSystem: true,
      invoiceSystem: true,
    },
  },
  starter: {
    maxFacebookPages: 1,
    maxWhatsappAccounts: 0,
    maxAutomationsPerMonth: null,
    features: { 
      messageAutoReply: true, 
      commentAutoReply: true, 
      imageAutoReply: false, 
      voiceAutoReply: false, 
      deleteNegativeComments: true,
      whatsappEnabled: false,
      instagramAutomation: false,
      tiktokAutomation: false,
      orderManagementSystem: false,
      invoiceSystem: false,
    },
  },
  professional: {
    maxFacebookPages: 2,
    maxWhatsappAccounts: 1,
    maxAutomationsPerMonth: null,
    features: { 
      messageAutoReply: true, 
      commentAutoReply: true, 
      imageAutoReply: true, 
      voiceAutoReply: true, 
      deleteNegativeComments: true,
      whatsappEnabled: true,
      instagramAutomation: false,
      tiktokAutomation: false,
      orderManagementSystem: false,
      invoiceSystem: false,
    },
  },
  business: {
    maxFacebookPages: 2,
    maxWhatsappAccounts: 1,
    maxAutomationsPerMonth: null,
    features: { 
      messageAutoReply: true, 
      commentAutoReply: true, 
      imageAutoReply: true, 
      voiceAutoReply: true, 
      deleteNegativeComments: true,
      whatsappEnabled: true,
      instagramAutomation: true,
      tiktokAutomation: true,
      orderManagementSystem: true,
      invoiceSystem: true,
    },
  },
  lifetime: {
    maxFacebookPages: 10,
    maxWhatsappAccounts: 5,
    maxAutomationsPerMonth: null,
    features: { 
      messageAutoReply: true, 
      commentAutoReply: true, 
      imageAutoReply: true, 
      voiceAutoReply: true, 
      deleteNegativeComments: true,
      whatsappEnabled: true,
      instagramAutomation: true,
      tiktokAutomation: true,
      orderManagementSystem: true,
      invoiceSystem: true,
    },
  },
};

async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    const payload = await verify(token, key);
    return payload.sub as string;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// Get user's effective plan and check if active
async function getUserPlan(supabase: any, userId: string): Promise<{ 
  plan: string; 
  isActive: boolean; 
  reason?: string;
  capabilities: typeof PLAN_CAPABILITIES["none"];
}> {
  const { data: user, error } = await supabase
    .from("users")
    .select("subscription_plan, is_trial_active, trial_end_date, subscription_ends_at")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return { plan: "none", isActive: false, reason: "User not found", capabilities: PLAN_CAPABILITIES.none };
  }

  const now = new Date();
  const plan = user.subscription_plan?.toLowerCase() || "none";
  
  // Check trial
  if (plan === "trial") {
    if (user.is_trial_active && user.trial_end_date) {
      const trialEnd = new Date(user.trial_end_date);
      if (trialEnd > now) {
        return { plan: "trial", isActive: true, capabilities: PLAN_CAPABILITIES.trial };
      }
    }
    return { plan: "none", isActive: false, reason: "Your 24-hour free trial has ended.", capabilities: PLAN_CAPABILITIES.none };
  }

  // Check paid plans
  if (["starter", "professional", "business", "lifetime"].includes(plan)) {
    if (plan === "lifetime") {
      return { plan: "lifetime", isActive: true, capabilities: PLAN_CAPABILITIES.lifetime };
    }
    if (user.subscription_ends_at) {
      const subEnd = new Date(user.subscription_ends_at);
      if (subEnd > now) {
        return { plan, isActive: true, capabilities: PLAN_CAPABILITIES[plan] || PLAN_CAPABILITIES.none };
      }
    }
    return { plan: "none", isActive: false, reason: "Your subscription has expired.", capabilities: PLAN_CAPABILITIES.none };
  }

  return { plan: "none", isActive: false, reason: "No active subscription.", capabilities: PLAN_CAPABILITIES.none };
}

// Get monthly automation run count
async function getMonthlyAutomationRuns(supabase: any, userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("execution_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  return error ? 0 : (count || 0);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const userId = await verifyToken(req.headers.get("Authorization"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // GET - Fetch connected accounts with plan limits info
  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const platform = url.searchParams.get("platform");

      let query = supabase
        .from("connected_accounts")
        .select("id, external_id, name, platform, category, is_connected, created_at")
        .eq("user_id", userId);

      if (platform) {
        query = query.eq("platform", platform);
      }

      const [accountsResult, userPlan] = await Promise.all([
        query.order("created_at", { ascending: false }),
        getUserPlan(supabase, userId),
      ]);

      if (accountsResult.error) {
        console.error("Fetch connected accounts error:", accountsResult.error);
        return new Response(JSON.stringify({ error: "Failed to fetch connected accounts" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const accounts = accountsResult.data || [];
      const connectedFacebookPages = accounts.filter(a => a.platform === "facebook" && a.is_connected).length;
      const connectedWhatsapp = accounts.filter(a => a.platform === "whatsapp" && a.is_connected).length;

      return new Response(JSON.stringify({ 
        accounts,
        planLimits: {
          plan: userPlan.plan,
          isActive: userPlan.isActive,
          maxFacebookPages: userPlan.capabilities.maxFacebookPages,
          maxWhatsappAccounts: userPlan.capabilities.maxWhatsappAccounts,
          connectedFacebookPages,
          connectedWhatsapp,
          canConnectMoreFacebook: connectedFacebookPages < userPlan.capabilities.maxFacebookPages,
          canConnectWhatsapp: userPlan.capabilities.features.whatsappEnabled && connectedWhatsapp < userPlan.capabilities.maxWhatsappAccounts,
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("GET connected-accounts error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // DELETE - Disconnect account
  if (req.method === "DELETE") {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(JSON.stringify({ error: "id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("connected_accounts")
        .update({ is_connected: false })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Disconnect account error:", error);
        return new Response(JSON.stringify({ error: "Failed to disconnect account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "Account disconnected" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("DELETE connected-accounts error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
