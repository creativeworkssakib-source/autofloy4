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

// Fallback limits if database doesn't have the plan
const FALLBACK_LIMITS: Record<string, { maxFacebookPages: number; maxWhatsappAccounts: number }> = {
  none: { maxFacebookPages: 0, maxWhatsappAccounts: 0 },
  "free-trial": { maxFacebookPages: 10, maxWhatsappAccounts: 5 },
  trial: { maxFacebookPages: 10, maxWhatsappAccounts: 5 },
  starter: { maxFacebookPages: 1, maxWhatsappAccounts: 0 },
  professional: { maxFacebookPages: 2, maxWhatsappAccounts: 1 },
  business: { maxFacebookPages: 5, maxWhatsappAccounts: 2 },
  lifetime: { maxFacebookPages: 999, maxWhatsappAccounts: 99 },
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

// Get plan limits from database
async function getPlanLimits(supabase: any, planId: string): Promise<{ maxFacebookPages: number; maxWhatsappAccounts: number }> {
  const normalizedPlan = planId.toLowerCase();
  const dbPlanId = normalizedPlan === "trial" ? "free-trial" : normalizedPlan;

  const { data, error } = await supabase
    .from("pricing_plans")
    .select("max_facebook_pages")
    .eq("id", dbPlanId)
    .single();

  if (error || !data) {
    console.log(`[getPlanLimits] Plan ${dbPlanId} not found, using fallback`);
    return FALLBACK_LIMITS[normalizedPlan] || FALLBACK_LIMITS.none;
  }

  return {
    maxFacebookPages: data.max_facebook_pages || FALLBACK_LIMITS[normalizedPlan]?.maxFacebookPages || 0,
    maxWhatsappAccounts: FALLBACK_LIMITS[normalizedPlan]?.maxWhatsappAccounts || 0,
  };
}

// Get user's effective plan and check if active
async function getUserPlan(supabase: any, userId: string): Promise<{ 
  plan: string; 
  planName: string;
  isActive: boolean; 
  reason?: string;
  maxFacebookPages: number;
  maxWhatsappAccounts: number;
}> {
  const { data: user, error } = await supabase
    .from("users")
    .select("subscription_plan, is_trial_active, trial_end_date, subscription_ends_at")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return { 
      plan: "none", 
      planName: "No Plan",
      isActive: false, 
      reason: "User not found", 
      maxFacebookPages: 0,
      maxWhatsappAccounts: 0 
    };
  }

  const now = new Date();
  const plan = user.subscription_plan?.toLowerCase() || "none";
  
  // Check trial
  if (plan === "trial" || plan === "free-trial") {
    if (user.is_trial_active && user.trial_end_date) {
      const trialEnd = new Date(user.trial_end_date);
      if (trialEnd > now) {
        const limits = await getPlanLimits(supabase, "free-trial");
        return { 
          plan: "trial", 
          planName: "Trial",
          isActive: true, 
          ...limits 
        };
      }
    }
    return { 
      plan: "none", 
      planName: "Expired",
      isActive: false, 
      reason: "Your 24-hour free trial has ended.", 
      maxFacebookPages: 0,
      maxWhatsappAccounts: 0 
    };
  }

  // Check paid plans
  if (["starter", "professional", "business", "lifetime"].includes(plan)) {
    if (plan === "lifetime") {
      const limits = await getPlanLimits(supabase, "lifetime");
      return { 
        plan: "lifetime", 
        planName: "Lifetime",
        isActive: true, 
        ...limits 
      };
    }
    if (user.subscription_ends_at) {
      const subEnd = new Date(user.subscription_ends_at);
      if (subEnd > now) {
        const limits = await getPlanLimits(supabase, plan);
        const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
        return { 
          plan, 
          planName,
          isActive: true, 
          ...limits 
        };
      }
    }
    return { 
      plan: "none", 
      planName: "Expired",
      isActive: false, 
      reason: "Your subscription has expired.", 
      maxFacebookPages: 0,
      maxWhatsappAccounts: 0 
    };
  }

  return { 
    plan: "none", 
    planName: "No Plan",
    isActive: false, 
    reason: "No active subscription.", 
    maxFacebookPages: 0,
    maxWhatsappAccounts: 0 
  };
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
          planName: userPlan.planName,
          isActive: userPlan.isActive,
          maxFacebookPages: userPlan.maxFacebookPages,
          maxWhatsappAccounts: userPlan.maxWhatsappAccounts,
          connectedFacebookPages,
          connectedWhatsapp,
          canConnectMoreFacebook: connectedFacebookPages < userPlan.maxFacebookPages,
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

  // DELETE - Completely remove account (not just disconnect)
  if (req.method === "DELETE") {
    try {
      const url = new URL(req.url);
      const id = url.searchParams.get("id");
      const action = url.searchParams.get("action"); // "disconnect" or "remove"

      if (!id) {
        return new Response(JSON.stringify({ error: "id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get the account first
      const { data: account, error: fetchError } = await supabase
        .from("connected_accounts")
        .select("id, name, external_id")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !account) {
        return new Response(JSON.stringify({ error: "Account not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "remove") {
        // Completely remove the account and related data
        // First, delete page_memory
        await supabase
          .from("page_memory")
          .delete()
          .eq("account_id", id)
          .eq("user_id", userId);

        // Delete automations linked to this account
        await supabase
          .from("automations")
          .delete()
          .eq("account_id", id)
          .eq("user_id", userId);

        // Finally, delete the connected account
        const { error: deleteError } = await supabase
          .from("connected_accounts")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (deleteError) {
          console.error("Remove account error:", deleteError);
          return new Response(JSON.stringify({ error: "Failed to remove account" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`[connected-accounts] Removed account: ${account.name} (${id})`);
        return new Response(JSON.stringify({ 
          success: true,
          message: `${account.name || "Account"} removed successfully` 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Just disconnect (set is_connected to false)
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

        console.log(`[connected-accounts] Disconnected account: ${account.name} (${id})`);
        return new Response(JSON.stringify({ 
          success: true,
          message: `${account.name || "Account"} disconnected` 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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