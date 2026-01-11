import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = new Date();
  
  try {
    // Get all active loans
    const { data: loans, error: loansError } = await supabase
      .from("shop_loans")
      .select("*")
      .eq("status", "active")
      .not("next_payment_date", "is", null);

    if (loansError) throw loansError;

    const notifications = [];
    const updates = [];

    for (const loan of loans || []) {
      const paymentDate = new Date(loan.next_payment_date);
      const diffDays = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // 3 days before reminder
      if (diffDays === 3) {
        notifications.push({
          user_id: loan.user_id,
          title: "⏰ কিস্তি পেমেন্ট রিমাইন্ডার",
          body: `${loan.lender_name} - ৳${Number(loan.installment_amount).toLocaleString()} কিস্তি ৩ দিন পরে (${paymentDate.toLocaleDateString('bn-BD')})`,
          notification_type: "loan_reminder",
          metadata: { loan_id: loan.id, days_until: 3 }
        });
      }

      // 1 day before reminder
      if (diffDays === 1) {
        notifications.push({
          user_id: loan.user_id,
          title: "⚠️ আগামীকাল কিস্তি পেমেন্ট",
          body: `${loan.lender_name} - ৳${Number(loan.installment_amount).toLocaleString()} কিস্তি আগামীকাল দিতে হবে!`,
          notification_type: "loan_reminder",
          metadata: { loan_id: loan.id, days_until: 1 }
        });
      }

      // Payment day reminder
      if (diffDays === 0) {
        notifications.push({
          user_id: loan.user_id,
          title: "🔔 আজকে কিস্তি পেমেন্ট",
          body: `${loan.lender_name} - ৳${Number(loan.installment_amount).toLocaleString()} কিস্তি আজকে দিতে হবে!`,
          notification_type: "loan_due",
          metadata: { loan_id: loan.id, days_until: 0 }
        });
      }

      // Overdue alert
      if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);
        
        // Update loan status to defaulted if more than 30 days overdue
        if (overdueDays > 30 && loan.status !== 'defaulted') {
          updates.push({
            id: loan.id,
            status: 'defaulted'
          });
        }

        // Send overdue notification (once per day for first 7 days, then weekly)
        if (overdueDays <= 7 || overdueDays % 7 === 0) {
          notifications.push({
            user_id: loan.user_id,
            title: "🚨 কিস্তি বাকি পড়েছে!",
            body: `${loan.lender_name} - ৳${Number(loan.installment_amount).toLocaleString()} কিস্তি ${overdueDays} দিন বাকি আছে!`,
            notification_type: "loan_overdue",
            metadata: { loan_id: loan.id, overdue_days: overdueDays }
          });
        }
      }
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notifications);
      
      if (notifError) {
        console.error("Failed to insert notifications:", notifError);
      }
    }

    // Update defaulted loans
    for (const update of updates) {
      await supabase
        .from("shop_loans")
        .update({ status: update.status, updated_at: new Date().toISOString() })
        .eq("id", update.id);
    }

    return new Response(JSON.stringify({ 
      success: true,
      processed: loans?.length || 0,
      notifications_sent: notifications.length,
      loans_updated: updates.length
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Loan reminders error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
