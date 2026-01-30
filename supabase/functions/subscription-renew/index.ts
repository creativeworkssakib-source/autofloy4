import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getPlanPurchaseEmailTemplate } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

// Plan display names
const planDisplayNames: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  business: "Business",
  lifetime: "Lifetime",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Plan durations in days
const PLAN_DURATIONS: Record<string, number | null> = {
  trial: 1, // 24 hours
  starter: 30,
  professional: 30,
  business: 30,
  lifetime: null, // No end date for lifetime
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const userId = await verifyToken(req.headers.get("Authorization"));
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { plan, payment_id, extend_days } = body;

    // Validate plan
    if (!plan || !PLAN_DURATIONS.hasOwnProperty(plan)) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("subscription_plan, subscription_ends_at, has_used_trial")
      .eq("id", userId)
      .single();

    if (fetchError || !currentUser) {
      console.error("User fetch error:", fetchError);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent trial re-use if user has already used trial
    if (plan === "trial" && currentUser.has_used_trial) {
      return new Response(JSON.stringify({ 
        error: "Trial already used",
        message: "You have already used your free trial. Please choose a paid plan to continue."
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    let subscriptionEndsAt: string | null = null;

    // Calculate new end date
    const planDuration = extend_days || PLAN_DURATIONS[plan];
    
    if (planDuration !== null) {
      // For time-limited plans, calculate end date
      let startDate = now;
      
      // If user has an active subscription with remaining time, extend from that date
      if (currentUser.subscription_ends_at) {
        const currentEndDate = new Date(currentUser.subscription_ends_at);
        if (currentEndDate > now) {
          startDate = currentEndDate;
        }
      }
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + planDuration);
      subscriptionEndsAt = endDate.toISOString();
    }

    // Update user subscription
    const updateData: Record<string, any> = {
      subscription_plan: plan,
      subscription_started_at: now.toISOString(),
      subscription_ends_at: subscriptionEndsAt,
      is_trial_active: plan === "trial",
    };

    // If getting trial, mark has_used_trial
    if (plan === "trial") {
      updateData.has_used_trial = true;
      updateData.trial_started_at = now.toISOString();
      updateData.trial_end_date = subscriptionEndsAt;
    }

    // If upgrading from trial, clear trial fields
    if (plan !== "trial") {
      updateData.is_trial_active = false;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select("id, subscription_plan, subscription_started_at, subscription_ends_at")
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update subscription" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log to subscriptions table for history
    const { error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan: plan,
        status: "active",
        started_at: now.toISOString(),
        ends_at: subscriptionEndsAt,
        last_payment_id: payment_id || null,
      });

    if (subError) {
      console.warn("Failed to log subscription:", subError.message);
    }

    console.log(`Subscription renewed for user ${userId}: ${plan}, ends at ${subscriptionEndsAt}`);

    // Send plan purchase confirmation email
    if (plan !== "trial") {
      try {
        const { data: user } = await supabase
          .from("users")
          .select("email, display_name")
          .eq("id", userId)
          .single();

        if (user) {
          const resend = new Resend(resendApiKey);
          const userName = user.display_name || user.email.split("@")[0];
          const planName = planDisplayNames[plan] || plan;
          
          const emailHtml = getPlanPurchaseEmailTemplate(
            userName,
            planName,
            body.amount?.toString() || "0",
            body.currency || "BDT",
            formatDate(now.toISOString()),
            formatDate(subscriptionEndsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
            payment_id
          );

          const { error: emailError } = await resend.emails.send({
            from: "AutoFloy <noreply@autofloy.online>",
            to: [user.email],
            subject: `🎉 Congratulations! Your ${planName} Plan is Now Active!`,
            html: emailHtml,
          });

          if (emailError) {
            console.error("Plan purchase email error:", emailError);
          } else {
            console.log("Plan purchase confirmation email sent to:", user.email);
          }
        }
      } catch (emailErr) {
        console.error("Plan purchase email exception:", emailErr);
      }
    }

    return new Response(JSON.stringify({
      message: "Subscription renewed successfully",
      subscription: {
        plan: updatedUser.subscription_plan,
        started_at: updatedUser.subscription_started_at,
        ends_at: updatedUser.subscription_ends_at,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Subscription renew error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
