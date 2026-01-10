import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getTrialExpiringEmailTemplate, getSubscriptionExpiredEmailTemplate } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

interface UserToRemind {
  id: string;
  email: string;
  display_name: string | null;
  trial_end_date: string;
  subscription_plan: string;
}

const reminderTypes = {
  TRIAL_6_HOURS: "trial_6_hours",
  TRIAL_1_HOUR: "trial_1_hour",
  TRIAL_EXPIRED: "trial_expired",
} as const;

// Helper to get company name from site settings
async function getCompanyName(supabase: any): Promise<string> {
  try {
    const { data } = await supabase.from("site_settings").select("company_name").limit(1).maybeSingle();
    return (data?.company_name as string) || "Company";
  } catch {
    return "Company";
  }
}

async function sendReminderEmail(
  resend: InstanceType<typeof Resend>,
  supabase: any,
  user: UserToRemind,
  reminderType: string,
  hoursRemaining: number
): Promise<boolean> {
  const name = user.display_name || user.email.split("@")[0];
  const companyName = await getCompanyName(supabase);
  
  let subject: string;
  let htmlContent: string;
  
  switch (reminderType) {
    case reminderTypes.TRIAL_6_HOURS:
      subject = `⏰ Your ${companyName} trial expires in 6 hours`;
      htmlContent = getTrialExpiringEmailTemplate(name, 6);
      break;
      
    case reminderTypes.TRIAL_1_HOUR:
      subject = `🔔 Last hour of your ${companyName} trial!`;
      htmlContent = getTrialExpiringEmailTemplate(name, 1);
      break;
      
    case reminderTypes.TRIAL_EXPIRED:
      subject = `😢 Your ${companyName} trial has ended`;
      htmlContent = getSubscriptionExpiredEmailTemplate(name);
      break;
      
    default:
      return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: `${companyName} <noreply@autofloy.com>`,
      to: [user.email],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error(`Failed to send ${reminderType} email to ${user.email}:`, error);
      return false;
    }

    console.log(`Successfully sent ${reminderType} email to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`Error sending ${reminderType} email to ${user.email}:`, error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting subscription reminder check (24-hour trial)...");

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);
    
    const now = new Date();
    
    // Calculate times for reminders (for 24-hour trial)
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);

    const results = {
      trial_6_hours: { checked: 0, sent: 0, skipped: 0 },
      trial_1_hour: { checked: 0, sent: 0, skipped: 0 },
      trial_expired: { checked: 0, sent: 0, skipped: 0 },
    };

    // 1. Check for trials expiring in ~6 hours (5-7 hour window)
    const sixHoursMin = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const sixHoursMax = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    
    const { data: users6Hours, error: error6Hours } = await supabase
      .from("users")
      .select("id, email, display_name, trial_end_date, subscription_plan")
      .eq("subscription_plan", "trial")
      .eq("is_trial_active", true)
      .gte("trial_end_date", sixHoursMin.toISOString())
      .lt("trial_end_date", sixHoursMax.toISOString());

    if (error6Hours) {
      console.error("Error fetching 6-hour users:", error6Hours);
    } else if (users6Hours) {
      results.trial_6_hours.checked = users6Hours.length;
      
      for (const user of users6Hours) {
        // Check if reminder already sent
        const { data: existing } = await supabase
          .from("subscription_reminders")
          .select("id")
          .eq("user_id", user.id)
          .eq("reminder_type", reminderTypes.TRIAL_6_HOURS)
          .single();

        if (existing) {
          results.trial_6_hours.skipped++;
          continue;
        }

        const sent = await sendReminderEmail(resend, supabase, user as UserToRemind, reminderTypes.TRIAL_6_HOURS, 6);
        if (sent) {
          await supabase.from("subscription_reminders").insert({
            user_id: user.id,
            reminder_type: reminderTypes.TRIAL_6_HOURS,
          });
          results.trial_6_hours.sent++;
        }
      }
    }

    // 2. Check for trials expiring in ~1 hour (30 min to 1.5 hour window)
    const oneHourMin = new Date(now.getTime() + 30 * 60 * 1000);
    const oneHourMax = new Date(now.getTime() + 90 * 60 * 1000);
    
    const { data: users1Hour, error: error1Hour } = await supabase
      .from("users")
      .select("id, email, display_name, trial_end_date, subscription_plan")
      .eq("subscription_plan", "trial")
      .eq("is_trial_active", true)
      .gte("trial_end_date", oneHourMin.toISOString())
      .lt("trial_end_date", oneHourMax.toISOString());

    if (error1Hour) {
      console.error("Error fetching 1-hour users:", error1Hour);
    } else if (users1Hour) {
      results.trial_1_hour.checked = users1Hour.length;
      
      for (const user of users1Hour) {
        const { data: existing } = await supabase
          .from("subscription_reminders")
          .select("id")
          .eq("user_id", user.id)
          .eq("reminder_type", reminderTypes.TRIAL_1_HOUR)
          .single();

        if (existing) {
          results.trial_1_hour.skipped++;
          continue;
        }

        const sent = await sendReminderEmail(resend, supabase, user as UserToRemind, reminderTypes.TRIAL_1_HOUR, 1);
        if (sent) {
          await supabase.from("subscription_reminders").insert({
            user_id: user.id,
            reminder_type: reminderTypes.TRIAL_1_HOUR,
          });
          results.trial_1_hour.sent++;
        }
      }
    }

    // 3. Check for expired trials
    const { data: usersExpired, error: errorExpired } = await supabase
      .from("users")
      .select("id, email, display_name, trial_end_date, subscription_plan")
      .eq("subscription_plan", "trial")
      .eq("is_trial_active", true)
      .lt("trial_end_date", now.toISOString());

    if (errorExpired) {
      console.error("Error fetching expired users:", errorExpired);
    } else if (usersExpired) {
      results.trial_expired.checked = usersExpired.length;
      
      for (const user of usersExpired) {
        const { data: existing } = await supabase
          .from("subscription_reminders")
          .select("id")
          .eq("user_id", user.id)
          .eq("reminder_type", reminderTypes.TRIAL_EXPIRED)
          .single();

        if (existing) {
          results.trial_expired.skipped++;
          continue;
        }

        const sent = await sendReminderEmail(resend, supabase, user as UserToRemind, reminderTypes.TRIAL_EXPIRED, 0);
        if (sent) {
          // Mark trial as inactive
          await supabase
            .from("users")
            .update({ is_trial_active: false })
            .eq("id", user.id);
            
          await supabase.from("subscription_reminders").insert({
            user_id: user.id,
            reminder_type: reminderTypes.TRIAL_EXPIRED,
          });
          results.trial_expired.sent++;
        }
      }
    }

    console.log("Subscription reminder results:", results);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Subscription reminders processed (24-hour trial)",
      results 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Subscription reminder error:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to process subscription reminders",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});