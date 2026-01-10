import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getTrialExpiringEmailTemplate } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

// Reminder thresholds in hours
const REMINDER_THRESHOLDS = [
  { hours: 12, type: "12h" },
  { hours: 6, type: "6h" },
  { hours: 2, type: "2h" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);
    const now = new Date();
    
    let emailsSent = 0;
    let errors: string[] = [];

    console.log(`[Trial Expiry Check] Starting at ${now.toISOString()}`);

    // Process each reminder threshold
    for (const threshold of REMINDER_THRESHOLDS) {
      const targetTime = new Date(now.getTime() + threshold.hours * 60 * 60 * 1000);
      const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000); // 30 min before
      const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000); // 30 min after

      // Find users whose trial ends within this window
      const { data: expiringUsers, error: fetchError } = await supabase
        .from("users")
        .select("id, email, display_name, trial_end_date")
        .eq("subscription_plan", "trial")
        .eq("is_trial_active", true)
        .gte("trial_end_date", windowStart.toISOString())
        .lte("trial_end_date", windowEnd.toISOString());

      if (fetchError) {
        console.error(`[Trial Expiry] Fetch error for ${threshold.type}:`, fetchError);
        errors.push(`Fetch error for ${threshold.type}: ${fetchError.message}`);
        continue;
      }

      if (!expiringUsers || expiringUsers.length === 0) {
        console.log(`[Trial Expiry] No users expiring in ${threshold.hours}h window`);
        continue;
      }

      console.log(`[Trial Expiry] Found ${expiringUsers.length} users expiring in ${threshold.hours}h`);

      // Process each user
      for (const user of expiringUsers) {
        // Check if we already sent this reminder
        const { data: existingReminder } = await supabase
          .from("subscription_reminders")
          .select("id")
          .eq("user_id", user.id)
          .eq("reminder_type", `trial_expiry_${threshold.type}`)
          .maybeSingle();

        if (existingReminder) {
          console.log(`[Trial Expiry] Already sent ${threshold.type} reminder to ${user.id}`);
          continue;
        }

        // Calculate actual hours remaining
        const trialEnd = new Date(user.trial_end_date);
        const hoursRemaining = Math.max(0, Math.round((trialEnd.getTime() - now.getTime()) / (60 * 60 * 1000)));

        // Send email
        const userName = user.display_name || user.email.split("@")[0];
        const emailHtml = getTrialExpiringEmailTemplate(userName, hoursRemaining);

        try {
          const { error: emailError } = await resend.emails.send({
            from: "AutoFloy <noreply@autofloy.com>",
            to: [user.email],
            subject: `⏰ Your AutoFloy Trial Expires in ${hoursRemaining} Hours!`,
            html: emailHtml,
          });

          if (emailError) {
            console.error(`[Trial Expiry] Email error for ${user.id}:`, emailError);
            errors.push(`Email error for ${user.id}: ${emailError.message}`);
            continue;
          }

          // Record that we sent this reminder
          await supabase.from("subscription_reminders").insert({
            user_id: user.id,
            reminder_type: `trial_expiry_${threshold.type}`,
          });

          emailsSent++;
          console.log(`[Trial Expiry] Sent ${threshold.type} reminder to ${user.email}`);
        } catch (emailErr: any) {
          console.error(`[Trial Expiry] Email exception for ${user.id}:`, emailErr);
          errors.push(`Email exception for ${user.id}: ${emailErr.message}`);
        }
      }
    }

    // Also check for expired trials that need to be deactivated
    const { data: expiredTrials, error: expiredError } = await supabase
      .from("users")
      .select("id, email")
      .eq("subscription_plan", "trial")
      .eq("is_trial_active", true)
      .lt("trial_end_date", now.toISOString());

    if (!expiredError && expiredTrials && expiredTrials.length > 0) {
      console.log(`[Trial Expiry] Deactivating ${expiredTrials.length} expired trials`);
      
      for (const user of expiredTrials) {
        const { error: deactivateError } = await supabase
          .from("users")
          .update({ 
            is_trial_active: false,
            subscription_plan: "none"
          })
          .eq("id", user.id);

        if (deactivateError) {
          console.error(`[Trial Expiry] Deactivate error for ${user.id}:`, deactivateError);
          errors.push(`Deactivate error for ${user.id}: ${deactivateError.message}`);
        } else {
          console.log(`[Trial Expiry] Deactivated trial for ${user.id}`);
        }
      }
    }

    const result = {
      success: true,
      emailsSent,
      expiredTrialsDeactivated: expiredTrials?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    };

    console.log(`[Trial Expiry] Completed:`, result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Trial Expiry] Fatal error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
