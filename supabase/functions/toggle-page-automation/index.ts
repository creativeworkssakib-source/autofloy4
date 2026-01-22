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

// Fallback plan limits (used if database doesn't have the plan)
const FALLBACK_LIMITS: Record<string, number> = {
  none: 0,
  "free-trial": 10,
  trial: 10,
  starter: 1,
  professional: 2,
  business: 5,
  lifetime: 999,
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

// Get max pages for a plan from database
async function getPlanMaxPages(supabase: any, planId: string): Promise<number> {
  // Normalize plan ID
  const normalizedPlan = planId.toLowerCase();
  const dbPlanId = normalizedPlan === "trial" ? "free-trial" : normalizedPlan;
  
  const { data, error } = await supabase
    .from("pricing_plans")
    .select("max_facebook_pages")
    .eq("id", dbPlanId)
    .single();

  if (error || !data) {
    console.log(`[getPlanMaxPages] Plan ${dbPlanId} not found, using fallback`);
    return FALLBACK_LIMITS[normalizedPlan] || 0;
  }

  return data.max_facebook_pages || FALLBACK_LIMITS[normalizedPlan] || 0;
}

// Get user's effective plan
async function getUserPlan(supabase: any, userId: string): Promise<{ 
  plan: string; 
  maxPages: number;
  planName: string;
}> {
  const { data: user, error } = await supabase
    .from("users")
    .select("subscription_plan, is_trial_active, trial_end_date, subscription_ends_at")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return { plan: "none", maxPages: 0, planName: "No Plan" };
  }

  const now = new Date();
  const plan = user.subscription_plan?.toLowerCase() || "none";
  
  // Check trial
  if (plan === "trial" || plan === "free-trial") {
    if (user.is_trial_active && user.trial_end_date) {
      const trialEnd = new Date(user.trial_end_date);
      if (trialEnd > now) {
        const maxPages = await getPlanMaxPages(supabase, "free-trial");
        return { plan: "trial", maxPages, planName: "Trial" };
      }
    }
    return { plan: "none", maxPages: 0, planName: "Expired" };
  }

  // Check paid plans
  if (["starter", "professional", "business", "lifetime"].includes(plan)) {
    if (plan === "lifetime") {
      const maxPages = await getPlanMaxPages(supabase, "lifetime");
      return { plan: "lifetime", maxPages, planName: "Lifetime" };
    }
    if (user.subscription_ends_at) {
      const subEnd = new Date(user.subscription_ends_at);
      if (subEnd > now) {
        const maxPages = await getPlanMaxPages(supabase, plan);
        const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
        return { plan, maxPages, planName };
      }
    }
    return { plan: "none", maxPages: 0, planName: "Expired" };
  }

  return { plan: "none", maxPages: 0, planName: "No Plan" };
}

serve(async (req) => {
  // Handle CORS preflight
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

  // POST - Toggle page automation
  if (req.method === "POST") {
    try {
      const { page_id, enabled } = await req.json();

      if (!page_id || typeof enabled !== "boolean") {
        return new Response(JSON.stringify({ error: "page_id and enabled (boolean) are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[Toggle Page] user=${userId.substring(0, 8)}... page=${page_id} enabled=${enabled}`);

      // Verify user owns this page
      const { data: page, error: pageError } = await supabase
        .from("connected_accounts")
        .select("id, external_id, name, platform, is_connected")
        .eq("id", page_id)
        .eq("user_id", userId)
        .eq("platform", "facebook")
        .single();

      if (pageError || !page) {
        return new Response(JSON.stringify({ error: "Page not found or access denied" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If enabling, check plan limits
      if (enabled) {
        const userPlan = await getUserPlan(supabase, userId);
        
        if (userPlan.maxPages === 0) {
          return new Response(JSON.stringify({ 
            error: "Your subscription has expired. Please upgrade to enable automation.",
            upgrade_required: true,
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Count currently enabled pages (excluding this one)
        const { count: enabledCount } = await supabase
          .from("connected_accounts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("platform", "facebook")
          .eq("is_connected", true)
          .neq("id", page_id);

        const currentEnabled = enabledCount || 0;

        if (currentEnabled >= userPlan.maxPages) {
          return new Response(JSON.stringify({ 
            error: `Your ${userPlan.planName} plan allows only ${userPlan.maxPages} Facebook page(s). Disable another page first or upgrade.`,
            upgrade_required: true,
            current_enabled: currentEnabled,
            max_allowed: userPlan.maxPages,
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Update the page connection status
      const { error: updateError } = await supabase
        .from("connected_accounts")
        .update({ is_connected: enabled })
        .eq("id", page_id)
        .eq("user_id", userId);

      if (updateError) {
        console.error("[Toggle Page] Update error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update page status" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If enabling, create/update page_memory
      if (enabled) {
        await supabase.from("page_memory").upsert({
          user_id: userId,
          account_id: page.id,
          page_id: page.external_id,
          page_name: page.name,
          detected_language: "auto",
          preferred_tone: "friendly",
          webhook_subscribed: true,
          webhook_subscribed_at: new Date().toISOString(),
          automation_settings: {},
        }, {
          onConflict: "user_id,page_id",
        });
        console.log(`[Toggle Page] Created/updated page_memory for: ${page.name}`);
      }

      console.log(`[Toggle Page] Successfully ${enabled ? "enabled" : "disabled"} automation for: ${page.name}`);

      return new Response(JSON.stringify({ 
        success: true, 
        message: enabled 
          ? `Automation enabled for ${page.name}` 
          : `Automation disabled for ${page.name}`,
        is_connected: enabled,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("[Toggle Page] Error:", error);
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