import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Helper to get company name
async function getCompanyName(supabase: any): Promise<string> {
  try {
    const { data } = await supabase.from("site_settings").select("company_name").limit(1).maybeSingle();
    return data?.company_name || "AutoFloy";
  } catch {
    return "AutoFloy";
  }
}

// Email template for expiry reminder
function getExpiryReminderTemplate(userName: string, planName: string, daysLeft: number, companyName: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; font-size: 28px; margin: 0;">⏰ Subscription Expiring Soon</h1>
      </div>
      
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">Hello ${userName},</p>
      
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
        Your <strong>${planName}</strong> subscription will expire in <strong style="color: #f59e0b;">${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>.
      </p>
      
      <div style="background: linear-gradient(135deg, #fef3c7, #fef9c3); padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="color: #92400e; font-size: 14px; margin: 0;">
          <strong>What happens when it expires?</strong><br>
          • You'll lose access to premium features<br>
          • Your automation will stop working<br>
          • Sales data will still be saved
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://autofloy.com/upgrade" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          Renew Now
        </a>
      </div>
      
      <p style="color: #888; font-size: 14px; margin-top: 30px;">
        Best regards,<br>
        The ${companyName} Team
      </p>
    </div>
  `;
}

// Email template for expired subscription
function getExpiredTemplate(userName: string, planName: string, companyName: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ef4444; font-size: 28px; margin: 0;">❌ Subscription Expired</h1>
      </div>
      
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">Hello ${userName},</p>
      
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
        Your <strong>${planName}</strong> subscription has expired. Your premium features are now disabled.
      </p>
      
      <div style="background: linear-gradient(135deg, #fee2e2, #fecaca); padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="color: #991b1b; font-size: 14px; margin: 0;">
          <strong>What's affected:</strong><br>
          • Automation features are paused<br>
          • Premium reports are limited<br>
          • Multi-page support is disabled
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://autofloy.com/upgrade" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          Renew Your Plan
        </a>
      </div>
      
      <p style="color: #888; font-size: 14px; margin-top: 30px;">
        Best regards,<br>
        The ${companyName} Team
      </p>
    </div>
  `;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const companyName = await getCompanyName(supabase);
  
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  let expiredCount = 0;
  let reminderCount = 0;
  let trialExpiredCount = 0;

  try {
    // 1. Find and process expired subscriptions
    const { data: expiredUsers, error: expiredError } = await supabase
      .from("users")
      .select("id, email, display_name, subscription_plan, subscription_ends_at")
      .neq("subscription_plan", "none")
      .neq("subscription_plan", "lifetime")
      .neq("subscription_plan", "trial")
      .lt("subscription_ends_at", now.toISOString())
      .not("subscription_ends_at", "is", null);

    if (expiredError) {
      console.error("[Expiry Check] Error fetching expired users:", expiredError);
    } else if (expiredUsers && expiredUsers.length > 0) {
      console.log(`[Expiry Check] Found ${expiredUsers.length} expired subscriptions`);

      for (const user of expiredUsers) {
        // Update user's plan to 'none'
        await supabase
          .from("users")
          .update({ 
            subscription_plan: "none",
            subscription_ends_at: null,
            subscription_started_at: null
          })
          .eq("id", user.id);

        // Send expiry notification email
        const userName = user.display_name || user.email.split("@")[0];
        try {
          await resend.emails.send({
            from: `${companyName} <noreply@autofloy.com>`,
            to: [user.email],
            subject: `❌ Your ${user.subscription_plan} Plan Has Expired - ${companyName}`,
            html: getExpiredTemplate(userName, user.subscription_plan, companyName),
          });
          console.log(`[Expiry Check] Sent expiry email to ${user.email}`);
        } catch (emailError) {
          console.error(`[Expiry Check] Failed to send email to ${user.email}:`, emailError);
        }

        expiredCount++;
      }
    }

    // 2. Find users with subscriptions expiring in 1 day and send reminder
    const { data: oneDayUsers, error: oneDayError } = await supabase
      .from("users")
      .select("id, email, display_name, subscription_plan, subscription_ends_at")
      .neq("subscription_plan", "none")
      .neq("subscription_plan", "lifetime")
      .neq("subscription_plan", "trial")
      .gt("subscription_ends_at", now.toISOString())
      .lt("subscription_ends_at", oneDayFromNow.toISOString())
      .not("subscription_ends_at", "is", null);

    if (oneDayError) {
      console.error("[Expiry Check] Error fetching 1-day expiry users:", oneDayError);
    } else if (oneDayUsers && oneDayUsers.length > 0) {
      console.log(`[Expiry Check] Found ${oneDayUsers.length} subscriptions expiring in 1 day`);

      for (const user of oneDayUsers) {
        const userName = user.display_name || user.email.split("@")[0];
        try {
          await resend.emails.send({
            from: `${companyName} <noreply@autofloy.com>`,
            to: [user.email],
            subject: `⚠️ URGENT: Your ${user.subscription_plan} Plan Expires Tomorrow! - ${companyName}`,
            html: getExpiryReminderTemplate(userName, user.subscription_plan, 1, companyName),
          });
          console.log(`[Expiry Check] Sent 1-day reminder to ${user.email}`);
          reminderCount++;
        } catch (emailError) {
          console.error(`[Expiry Check] Failed to send reminder to ${user.email}:`, emailError);
        }
      }
    }

    // 3. Find users with subscriptions expiring in 3 days and send reminder
    const { data: threeDayUsers, error: threeDayError } = await supabase
      .from("users")
      .select("id, email, display_name, subscription_plan, subscription_ends_at")
      .neq("subscription_plan", "none")
      .neq("subscription_plan", "lifetime")
      .neq("subscription_plan", "trial")
      .gt("subscription_ends_at", oneDayFromNow.toISOString())
      .lt("subscription_ends_at", threeDaysFromNow.toISOString())
      .not("subscription_ends_at", "is", null);

    if (threeDayError) {
      console.error("[Expiry Check] Error fetching 3-day expiry users:", threeDayError);
    } else if (threeDayUsers && threeDayUsers.length > 0) {
      console.log(`[Expiry Check] Found ${threeDayUsers.length} subscriptions expiring in 3 days`);

      for (const user of threeDayUsers) {
        const userName = user.display_name || user.email.split("@")[0];
        try {
          await resend.emails.send({
            from: `${companyName} <noreply@autofloy.com>`,
            to: [user.email],
            subject: `⏰ Your ${user.subscription_plan} Plan Expires in 3 Days - ${companyName}`,
            html: getExpiryReminderTemplate(userName, user.subscription_plan, 3, companyName),
          });
          console.log(`[Expiry Check] Sent 3-day reminder to ${user.email}`);
          reminderCount++;
        } catch (emailError) {
          console.error(`[Expiry Check] Failed to send reminder to ${user.email}:`, emailError);
        }
      }
    }

    // 4. Check and expire trials
    const { data: expiredTrials, error: trialError } = await supabase
      .from("users")
      .select("id, email, display_name")
      .eq("is_trial_active", true)
      .lt("trial_end_date", now.toISOString())
      .not("trial_end_date", "is", null);

    if (trialError) {
      console.error("[Expiry Check] Error fetching expired trials:", trialError);
    } else if (expiredTrials && expiredTrials.length > 0) {
      console.log(`[Expiry Check] Found ${expiredTrials.length} expired trials`);

      for (const user of expiredTrials) {
        await supabase
          .from("users")
          .update({ 
            is_trial_active: false,
            subscription_plan: "none"
          })
          .eq("id", user.id);

        const userName = user.display_name || user.email.split("@")[0];
        try {
          await resend.emails.send({
            from: `${companyName} <noreply@autofloy.com>`,
            to: [user.email],
            subject: `⏰ Your Free Trial Has Ended - ${companyName}`,
            html: getExpiredTemplate(userName, "Free Trial", companyName),
          });
          console.log(`[Expiry Check] Sent trial expiry email to ${user.email}`);
        } catch (emailError) {
          console.error(`[Expiry Check] Failed to send trial expiry email to ${user.email}:`, emailError);
        }

        trialExpiredCount++;
      }
    }

    console.log(`[Expiry Check] Summary: ${expiredCount} expired, ${reminderCount} reminders sent, ${trialExpiredCount} trials expired`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          expired: expiredCount,
          remindersSent: reminderCount,
          trialsExpired: trialExpiredCount,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Expiry Check] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
