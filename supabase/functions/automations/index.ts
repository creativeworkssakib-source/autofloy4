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
  free: {
    maxFacebookPages: 10,
    maxWhatsappAccounts: 5,
    maxAutomationsPerMonth: null, // Trial period - unlimited
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
  trial: {
    maxFacebookPages: 10,
    maxWhatsappAccounts: 5,
    maxAutomationsPerMonth: null, // Unlimited
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
    maxAutomationsPerMonth: null, // Unlimited per screenshot
    features: { 
      messageAutoReply: true, 
      commentAutoReply: true,   // Enabled per screenshot
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
    maxAutomationsPerMonth: null, // Unlimited per screenshot
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
    maxFacebookPages: 2,  // Per screenshot
    maxWhatsappAccounts: 1, // Per screenshot
    maxAutomationsPerMonth: null, // Unlimited
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
    maxAutomationsPerMonth: null, // Unlimited
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
  const plan = user.subscription_plan?.toLowerCase() || "free";
  
  // Check trial (both "trial" and "free" with active trial)
  if (plan === "trial" || plan === "free") {
    if (user.is_trial_active && user.trial_end_date) {
      const trialEnd = new Date(user.trial_end_date);
      if (trialEnd > now) {
        return { plan: "trial", isActive: true, capabilities: PLAN_CAPABILITIES.trial };
      }
    }
    // Even if trial expired, "free" plan with trial period should check trial_end_date
    if (user.trial_end_date) {
      const trialEnd = new Date(user.trial_end_date);
      if (trialEnd > now) {
        return { plan: "free", isActive: true, capabilities: PLAN_CAPABILITIES.free };
      }
    }
    return { plan: "none", isActive: false, reason: "Your free trial has ended.", capabilities: PLAN_CAPABILITIES.none };
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

// Check if user has active subscription or valid trial
async function checkUserAccess(supabase: any, userId: string): Promise<{ 
  hasAccess: boolean; 
  reason?: string;
  plan: string;
  capabilities: typeof PLAN_CAPABILITIES["none"];
  runsThisMonth: number;
}> {
  const [userPlan, runsThisMonth] = await Promise.all([
    getUserPlan(supabase, userId),
    getMonthlyAutomationRuns(supabase, userId),
  ]);

  if (!userPlan.isActive) {
    return { 
      hasAccess: false, 
      reason: userPlan.reason || "No active subscription or trial.",
      plan: userPlan.plan,
      capabilities: userPlan.capabilities,
      runsThisMonth,
    };
  }

  // Check monthly automation limit
  const maxRuns = userPlan.capabilities.maxAutomationsPerMonth;
  if (maxRuns !== null && runsThisMonth >= maxRuns) {
    return { 
      hasAccess: false, 
      reason: `You have used all ${maxRuns} automations for this month on your ${userPlan.plan} plan.`,
      plan: userPlan.plan,
      capabilities: userPlan.capabilities,
      runsThisMonth,
    };
  }

  return { 
    hasAccess: true, 
    plan: userPlan.plan,
    capabilities: userPlan.capabilities,
    runsThisMonth,
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

  // GET - Fetch automations (always allowed - just viewing)
  if (req.method === "GET") {
    try {
      // Also return trial status for frontend
      const accessCheck = await checkUserAccess(supabase, userId);
      
      const { data: automations, error } = await supabase
        .from("automations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch automations error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch automations" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get today's run count from execution_logs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayLogs, error: logsError } = await supabase
        .from("execution_logs")
        .select("automation_id")
        .eq("user_id", userId)
        .gte("created_at", today.toISOString());

      const runsPerAutomation: Record<string, number> = {};
      if (!logsError && todayLogs) {
        todayLogs.forEach(log => {
          if (log.automation_id) {
            runsPerAutomation[log.automation_id] = (runsPerAutomation[log.automation_id] || 0) + 1;
          }
        });
      }

      // Enrich automations with runs today
      const enrichedAutomations = automations?.map(auto => ({
        ...auto,
        runsToday: runsPerAutomation[auto.id] || 0,
      })) || [];

      return new Response(JSON.stringify({ 
        automations: enrichedAutomations,
        hasAccess: accessCheck.hasAccess,
        accessDeniedReason: accessCheck.reason,
        planLimits: {
          plan: accessCheck.plan,
          maxAutomationsPerMonth: accessCheck.capabilities.maxAutomationsPerMonth,
          runsThisMonth: accessCheck.runsThisMonth,
          features: accessCheck.capabilities.features,
        },
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("GET automations error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // For all mutation operations (POST, PUT, DELETE), check trial/subscription status first
  const accessCheck = await checkUserAccess(supabase, userId);
  if (!accessCheck.hasAccess) {
    console.warn(`[ACCESS DENIED] User ${userId} tried to modify automations - ${accessCheck.reason}`);
    return new Response(JSON.stringify({ 
      error: accessCheck.reason,
      trialExpired: true,
      planLimits: {
        plan: accessCheck.plan,
        maxAutomationsPerMonth: accessCheck.capabilities.maxAutomationsPerMonth,
        runsThisMonth: accessCheck.runsThisMonth,
      },
    }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // POST - Create automation
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { name, type, account_id, trigger_keywords, response_template, config, is_enabled } = body;

      if (!name || !type || !account_id) {
        return new Response(JSON.stringify({ error: "name, type, and account_id are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if automation type is allowed by plan
      const features = accessCheck.capabilities.features;
      const typeFeatureMap: Record<string, keyof typeof features> = {
        "message": "messageAutoReply",
        "comment": "commentAutoReply",
        "image": "imageAutoReply",
        "voice": "voiceAutoReply",
      };

      if (typeFeatureMap[type] && !features[typeFeatureMap[type]]) {
        const planName = accessCheck.plan.charAt(0).toUpperCase() + accessCheck.plan.slice(1);
        return new Response(JSON.stringify({ 
          error: `${type} automation is not available on your ${planName} plan. Please upgrade to use this feature.`,
          featureBlocked: true,
        }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // SECURITY: Verify account_id belongs to the authenticated user
      const { data: account, error: accountError } = await supabase
        .from("connected_accounts")
        .select("id")
        .eq("id", account_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (accountError || !account) {
        console.warn(`Account ownership check failed: user ${userId} tried to use account ${account_id}`);
        return new Response(JSON.stringify({ error: "Account not found or access denied" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: automation, error } = await supabase
        .from("automations")
        .insert({
          user_id: userId,
          name,
          type,
          account_id,
          trigger_keywords: trigger_keywords || [],
          response_template: response_template || "",
          config: config || {},
          is_enabled: is_enabled ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error("Create automation error:", error);
        return new Response(JSON.stringify({ error: "Failed to create automation" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[AUTOMATION CREATED] User ${userId} created automation ${automation.id}`);

      return new Response(JSON.stringify({ automation }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("POST automations error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // PUT - Update automation
  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const { id, account_id, ...updates } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: "id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If changing automation type, check if allowed
      if (updates.type) {
        const features = accessCheck.capabilities.features;
        const typeFeatureMap: Record<string, keyof typeof features> = {
          "message": "messageAutoReply",
          "comment": "commentAutoReply",
          "image": "imageAutoReply",
          "voice": "voiceAutoReply",
        };

        if (typeFeatureMap[updates.type] && !features[typeFeatureMap[updates.type]]) {
          const planName = accessCheck.plan.charAt(0).toUpperCase() + accessCheck.plan.slice(1);
          return new Response(JSON.stringify({ 
            error: `${updates.type} automation is not available on your ${planName} plan. Please upgrade to use this feature.`,
            featureBlocked: true,
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // If account_id is being updated, verify ownership
      if (account_id) {
        const { data: account, error: accountError } = await supabase
          .from("connected_accounts")
          .select("id")
          .eq("id", account_id)
          .eq("user_id", userId)
          .maybeSingle();

        if (accountError || !account) {
          console.warn(`Account ownership check failed on update: user ${userId} tried to use account ${account_id}`);
          return new Response(JSON.stringify({ error: "Account not found or access denied" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const updateData = account_id 
        ? { ...updates, account_id, updated_at: new Date().toISOString() }
        : { ...updates, updated_at: new Date().toISOString() };

      const { data: automation, error } = await supabase
        .from("automations")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Update automation error:", error);
        return new Response(JSON.stringify({ error: "Failed to update automation" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[AUTOMATION UPDATED] User ${userId} updated automation ${id}`);

      return new Response(JSON.stringify({ automation }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("PUT automations error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // DELETE - Delete automation
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
        .from("automations")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Delete automation error:", error);
        return new Response(JSON.stringify({ error: "Failed to delete automation" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[AUTOMATION DELETED] User ${userId} deleted automation ${id}`);

      return new Response(JSON.stringify({ message: "Automation deleted" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("DELETE automations error:", error);
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
