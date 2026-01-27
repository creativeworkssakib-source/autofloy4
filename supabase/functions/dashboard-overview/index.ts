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

function getDateRange(range: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case "today":
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    case "yesterday":
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday,
        end: new Date(today.getTime() - 1),
      };
    case "this_week":
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      return {
        start: startOfWeek,
        end: now,
      };
    case "last_7_days":
      return {
        start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now,
      };
    case "this_month":
    default:
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: startOfMonth,
        end: now,
      };
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
    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "this_month";
    const customStart = url.searchParams.get("start");
    const customEnd = url.searchParams.get("end");

    let dateRange: { start: Date; end: Date };
    
    if (range === "custom" && customStart && customEnd) {
      dateRange = {
        start: new Date(customStart),
        end: new Date(customEnd),
      };
    } else {
      dateRange = getDateRange(range);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get orders for the date range (regular orders)
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", dateRange.start.toISOString())
      .lte("created_at", dateRange.end.toISOString());

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
    }

    // Get AI orders for the date range
    const { data: aiOrders, error: aiOrdersError } = await supabase
      .from("ai_orders")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", dateRange.start.toISOString())
      .lte("created_at", dateRange.end.toISOString());

    if (aiOrdersError) {
      console.error("Error fetching AI orders:", aiOrdersError);
    }

    // Get products for inventory stats
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, name, stock_quantity, min_stock_alert, price, purchase_price, is_active")
      .eq("user_id", userId);

    if (productsError) {
      console.error("Error fetching products:", productsError);
    }

    const productsList = productsData || [];

    const ordersList = orders || [];
    const aiOrdersList = aiOrders || [];

    // Calculate order stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaysOrders = ordersList.filter(
      (o) => new Date(o.created_at) >= todayStart && new Date(o.created_at) <= todayEnd
    );
    const todaysAiOrders = aiOrdersList.filter(
      (o) => new Date(o.created_at) >= todayStart && new Date(o.created_at) <= todayEnd
    );

    // Calculate totals from items (regular orders)
    let totalSalesAmount = 0;
    let totalBuyCost = 0;
    
    ordersList.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const qty = item.quantity || item.qty || 1;
        const sellPrice = item.sell_price || item.price || 0;
        const buyPrice = item.buy_price || item.cost || 0;
        
        // Only count delivered orders for revenue
        if (order.status === 'delivered') {
          totalSalesAmount += sellPrice * qty;
          totalBuyCost += buyPrice * qty;
        }
      });
    });
    
    // If no items with sell_price, fall back to order totals
    if (totalSalesAmount === 0) {
      totalSalesAmount = ordersList
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + Number(o.total || 0), 0);
    }
    
    // Add AI orders revenue (delivered orders only)
    const aiSalesAmount = aiOrdersList
      .filter(o => o.order_status === 'delivered')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    totalSalesAmount += aiSalesAmount;
    
    const profit = totalSalesAmount - totalBuyCost;

    // Combined stats for regular orders
    const totalRevenue = ordersList.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const todaysSales = todaysOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const confirmedOrders = ordersList.filter((o) => o.status === "confirmed" || o.status === "delivered").length;
    const pendingOrders = ordersList.filter((o) => o.status === "pending").length;
    const damagedOrLost = ordersList.filter((o) => 
      o.status === "damaged" || o.status === "expired" || o.status === "returned"
    ).length;
    
    // AI orders stats
    const aiTotalRevenue = aiOrdersList.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const todaysAiSales = todaysAiOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const aiConfirmedOrders = aiOrdersList.filter((o) => o.order_status === "confirmed" || o.order_status === "delivered").length;
    const aiPendingOrders = aiOrdersList.filter((o) => o.order_status === "pending").length;
    const aiCancelledOrders = aiOrdersList.filter((o) => o.order_status === "cancelled").length;

    // Get execution logs for messages handled
    const { data: logs, error: logsError } = await supabase
      .from("execution_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", dateRange.start.toISOString())
      .lte("created_at", dateRange.end.toISOString());

    if (logsError) {
      console.error("Error fetching logs:", logsError);
    }

    const logsList = logs || [];
    const messagesHandled = logsList.length;
    const autoRepliesSent = logsList.filter((l) => l.status === "success").length;

    // Build daily stats for chart (combined regular + AI orders)
    const dailyStatsMap = new Map<string, { sales: number; orders: number; cost: number; aiSales: number; aiOrders: number }>();
    
    // Add regular orders
    ordersList.forEach((order) => {
      const dateKey = new Date(order.created_at).toISOString().split("T")[0];
      const existing = dailyStatsMap.get(dateKey) || { sales: 0, orders: 0, cost: 0, aiSales: 0, aiOrders: 0 };
      existing.sales += Number(order.total || 0);
      existing.orders += 1;
      
      // Calculate cost from items
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const qty = item.quantity || item.qty || 1;
        const buyPrice = item.buy_price || item.cost || 0;
        existing.cost += buyPrice * qty;
      });
      
      dailyStatsMap.set(dateKey, existing);
    });
    
    // Add AI orders to daily stats
    aiOrdersList.forEach((order) => {
      const dateKey = new Date(order.created_at).toISOString().split("T")[0];
      const existing = dailyStatsMap.get(dateKey) || { sales: 0, orders: 0, cost: 0, aiSales: 0, aiOrders: 0 };
      existing.aiSales += Number(order.total || 0);
      existing.aiOrders += 1;
      dailyStatsMap.set(dateKey, existing);
    });

    const dailyStats = Array.from(dailyStatsMap.entries())
      .map(([date, stats]) => ({
        date,
        sales: stats.sales + stats.aiSales, // Combined sales
        orders: stats.orders + stats.aiOrders, // Combined orders
        cost: stats.cost,
        profit: (stats.sales + stats.aiSales) - stats.cost,
        aiSales: stats.aiSales,
        aiOrders: stats.aiOrders,
        regularSales: stats.sales,
        regularOrders: stats.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate product inventory stats
    const activeProducts = productsList.filter(p => p.is_active !== false);
    const totalProducts = activeProducts.length;
    const lowStockProducts = activeProducts.filter(
      p => p.stock_quantity !== null && p.min_stock_alert !== null && p.stock_quantity <= p.min_stock_alert && p.stock_quantity > 0
    );
    const outOfStockProducts = activeProducts.filter(p => p.stock_quantity !== null && p.stock_quantity <= 0);
    
    // Calculate stock value
    let totalStockValue = 0;
    let potentialRevenue = 0;
    activeProducts.forEach(p => {
      const stock = p.stock_quantity || 0;
      const purchasePrice = p.purchase_price || 0;
      const sellingPrice = p.price || 0;
      totalStockValue += purchasePrice * stock;
      potentialRevenue += sellingPrice * stock;
    });

    const stats = {
      // Combined stats (regular + AI)
      todaysSales: todaysSales + todaysAiSales,
      todaysOrders: todaysOrders.length + todaysAiOrders.length,
      confirmedOrders: confirmedOrders + aiConfirmedOrders,
      pendingOrders: pendingOrders + aiPendingOrders,
      totalRevenue: totalRevenue + aiTotalRevenue,
      totalOrders: ordersList.length + aiOrdersList.length,
      messagesHandled,
      autoRepliesSent,
      totalSalesAmount,
      totalBuyCost,
      profit,
      damagedOrLost,
      // AI-specific stats
      aiTotalOrders: aiOrdersList.length,
      aiPendingOrders,
      aiConfirmedOrders,
      aiCancelledOrders,
      aiTotalRevenue,
      todaysAiOrders: todaysAiOrders.length,
      todaysAiSales,
      // Product inventory stats
      totalProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      totalStockValue,
      potentialRevenue,
      potentialProfit: potentialRevenue - totalStockValue,
    };

    // Get low stock products list
    const lowStockList = lowStockProducts.map(p => ({
      id: p.id,
      name: p.name,
      stock_quantity: p.stock_quantity,
      min_stock_alert: p.min_stock_alert,
    }));

    console.log(`Dashboard overview for user ${userId}:`, stats);

    return new Response(JSON.stringify({ stats, dailyStats, orders: ordersList, aiOrders: aiOrdersList, lowStockProducts: lowStockList }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
