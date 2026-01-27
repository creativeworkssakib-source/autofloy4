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

    console.log("Starting execution logs cleanup cron job...");

    // Delete logs older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: oldLogs, error: oldLogsError } = await supabase
      .from("execution_logs")
      .select("id")
      .lt("created_at", thirtyDaysAgo.toISOString());

    if (oldLogsError) {
      console.error("Error fetching old logs:", oldLogsError);
    }

    let deletedOldCount = 0;
    if (oldLogs && oldLogs.length > 0) {
      const { error: deleteOldError } = await supabase
        .from("execution_logs")
        .delete()
        .in("id", oldLogs.map((l) => l.id));

      if (deleteOldError) {
        console.error("Error deleting old logs:", deleteOldError);
      } else {
        deletedOldCount = oldLogs.length;
        console.log(`Deleted ${deletedOldCount} logs older than 30 days`);
      }
    }

    // For each user, keep only the latest 500 logs
    const { data: userIds } = await supabase
      .from("execution_logs")
      .select("user_id")
      .limit(1000);

    const uniqueUserIds = [...new Set(userIds?.map((u) => u.user_id) || [])];
    let deletedExcessCount = 0;

    for (const userId of uniqueUserIds) {
      // Get logs beyond the 500th for this user
      const { data: excessLogs } = await supabase
        .from("execution_logs")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(500, 10000); // Get logs beyond position 500

      if (excessLogs && excessLogs.length > 0) {
        const { error: deleteExcessError } = await supabase
          .from("execution_logs")
          .delete()
          .in("id", excessLogs.map((l) => l.id));

        if (!deleteExcessError) {
          deletedExcessCount += excessLogs.length;
        }
      }
    }

    if (deletedExcessCount > 0) {
      console.log(`Deleted ${deletedExcessCount} excess logs (keeping max 500 per user)`);
    }

    const totalDeleted = deletedOldCount + deletedExcessCount;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Logs cleanup completed. ${totalDeleted} logs deleted.`,
        deletedOldLogs: deletedOldCount,
        deletedExcessLogs: deletedExcessCount,
        totalDeleted,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Logs cleanup cron error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
