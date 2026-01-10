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

    console.log("Starting trash cleanup cron job...");

    // Find all trash items that have expired (older than 7 days)
    const { data: expiredItems, error: fetchError } = await supabase
      .from("shop_trash")
      .select("*")
      .lt("expires_at", new Date().toISOString())
      .is("permanently_deleted_at", null)
      .is("restored_at", null);

    if (fetchError) {
      console.error("Error fetching expired trash items:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredItems?.length || 0} expired trash items to permanently delete`);

    let deletedCount = 0;

    if (expiredItems && expiredItems.length > 0) {
      // Hard delete expired items from DB
      const { error: deleteError } = await supabase
        .from("shop_trash")
        .delete()
        .in("id", expiredItems.map((item) => item.id));

      if (deleteError) {
        console.error("Error permanently deleting expired items:", deleteError);
        throw deleteError;
      }

      deletedCount = expiredItems.length;
      console.log(`Successfully deleted ${deletedCount} expired trash items`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Trash cleanup completed. ${deletedCount} items permanently deleted.`,
        deletedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Trash cleanup cron error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
