// =============================================
// DATA CLEANUP CRON - Runs daily to optimize database size
// =============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[DATA-CLEANUP] Starting daily data cleanup...");

    // 1. Run master cleanup function
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('run_all_data_cleanups');

    if (cleanupError) {
      console.error("[DATA-CLEANUP] Master cleanup error:", cleanupError);
    } else {
      console.log("[DATA-CLEANUP] Master cleanup result:", cleanupResult);
    }

    // 2. Cleanup ai_message_buffer manually as backup
    const { error: bufferError } = await supabase
      .from('ai_message_buffer')
      .delete()
      .eq('is_processed', true)
      .lt('last_message_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (bufferError) {
      console.error("[DATA-CLEANUP] Buffer cleanup error:", bufferError);
    } else {
      console.log("[DATA-CLEANUP] Processed message buffers cleaned");
    }

    // 3. Delete old customer followups (older than 180 days with no orders)
    const { error: followupError } = await supabase
      .from('customer_followups')
      .delete()
      .eq('has_purchased', false)
      .eq('status', 'inactive')
      .lt('updated_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

    if (followupError) {
      console.error("[DATA-CLEANUP] Followup cleanup error:", followupError);
    } else {
      console.log("[DATA-CLEANUP] Old inactive followups cleaned");
    }

    // 4. Trim large ai_orders notes (keep only first 500 chars)
    const { data: largeOrders } = await supabase
      .from('ai_orders')
      .select('id, notes')
      .not('notes', 'is', null);

    if (largeOrders) {
      for (const order of largeOrders) {
        if (order.notes && order.notes.length > 500) {
          await supabase
            .from('ai_orders')
            .update({ notes: order.notes.substring(0, 500) + '...' })
            .eq('id', order.id);
        }
      }
      console.log("[DATA-CLEANUP] Large order notes trimmed");
    }

    // 5. Vacuum analyze hint (just log, actual VACUUM needs manual run)
    console.log("[DATA-CLEANUP] Consider running VACUUM ANALYZE on large tables manually");

    const summary = {
      success: true,
      cleanupResult,
      timestamp: new Date().toISOString(),
      message: "Daily cleanup completed successfully"
    };

    console.log("[DATA-CLEANUP] Cleanup completed:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[DATA-CLEANUP] Critical error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
