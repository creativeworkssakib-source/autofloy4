import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

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

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = await verifyToken(req.headers.get("Authorization"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's execution logs (messages handled)
    const { data: todayLogs, error: logsError } = await supabase
      .from("execution_logs")
      .select("id, status")
      .eq("user_id", userId)
      .gte("created_at", today.toISOString());

    // Get yesterday's execution logs for comparison
    const { data: yesterdayLogs } = await supabase
      .from("execution_logs")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", yesterday.toISOString())
      .lt("created_at", today.toISOString());

    // Get active automations count
    const { data: automations } = await supabase
      .from("automations")
      .select("id, is_enabled")
      .eq("user_id", userId);

    // Get connected pages count
    const { data: connectedAccounts } = await supabase
      .from("connected_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("is_connected", true);

    // Get total orders and revenue from both orders tables
    const { data: orders } = await supabase
      .from("orders")
      .select("total, created_at")
      .eq("user_id", userId);

    // Get AI orders as well
    const { data: aiOrders } = await supabase
      .from("ai_orders")
      .select("total, created_at, order_status")
      .eq("user_id", userId);

    const todayOrders = orders?.filter(o => new Date(o.created_at!) >= today) || [];
    const todayAiOrders = aiOrders?.filter(o => new Date(o.created_at!) >= today) || [];
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const todayAiRevenue = todayAiOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    // Combined stats
    const totalTodayOrders = todayOrders.length + todayAiOrders.length;
    const totalTodayRevenue = todayRevenue + todayAiRevenue;
    
    // AI-specific stats
    const totalAiOrders = aiOrders?.length || 0;
    const pendingAiOrders = aiOrders?.filter(o => o.order_status === "pending").length || 0;
    const confirmedAiOrders = aiOrders?.filter(o => o.order_status === "confirmed" || o.order_status === "delivered").length || 0;
    const totalAiRevenue = aiOrders?.filter(o => o.order_status === "delivered").reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0;

    const messagesHandled = todayLogs?.length || 0;
    const messagesYesterday = yesterdayLogs?.length || 0;
    const messagesDiff = messagesHandled - messagesYesterday;

    const successfulReplies = todayLogs?.filter(l => l.status === "success").length || 0;
    const successRate = messagesHandled > 0 ? Math.round((successfulReplies / messagesHandled) * 100) : 0;

    const activeAutomations = automations?.filter(a => a.is_enabled).length || 0;

    // Estimate hours saved (assuming 2 minutes per message handled)
    const hoursSaved = Math.round((messagesHandled * 2) / 60 * 10) / 10;

    const stats = {
      messagesHandled,
      messagesDiff: messagesDiff > 0 ? `+${messagesDiff}` : messagesDiff.toString(),
      autoRepliesSent: successfulReplies,
      successRate: `${successRate}%`,
      activeAutomations,
      totalAutomations: automations?.length || 0,
      hoursSaved,
      estimatedValue: Math.round(hoursSaved * 100), // Assuming ৳100/hour value
      connectedPages: connectedAccounts?.length || 0,
      todayOrders: totalTodayOrders,
      todayRevenue: totalTodayRevenue,
      // AI-specific stats
      totalAiOrders,
      pendingAiOrders,
      confirmedAiOrders,
      totalAiRevenue,
      todayAiOrders: todayAiOrders.length,
      todayAiRevenue,
    };

    return new Response(JSON.stringify({ stats }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET dashboard-stats error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
