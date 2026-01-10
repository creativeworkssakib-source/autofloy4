import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shop-id",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
  } catch {
    return null;
  }
}

interface ProductPerformance {
  productId: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalProfit: number;
  totalCost: number;
  returnCount: number;
  returnQuantity: number;
  lossAmount: number;
  netProfit: number;
  profitMargin: number;
  returnRate: number;
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
    const type = url.searchParams.get("type") || "offline"; // "online", "offline", or "combined"
    const shopId = url.searchParams.get("shop_id") || req.headers.get("X-Shop-Id");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Performance map that will be populated
    const performanceMap = new Map<string, ProductPerformance>();
    
    // Helper to get or create performance entry
    const getOrCreate = (key: string, name: string): ProductPerformance => {
      let perf = performanceMap.get(key);
      if (!perf) {
        perf = {
          productId: key,
          productName: name,
          totalQuantitySold: 0,
          totalRevenue: 0,
          totalProfit: 0,
          totalCost: 0,
          returnCount: 0,
          returnQuantity: 0,
          lossAmount: 0,
          netProfit: 0,
          profitMargin: 0,
          returnRate: 0,
        };
        performanceMap.set(key, perf);
      }
      return perf;
    };

    // ===== PROCESS OFFLINE DATA =====
    const processOfflineData = async (targetShopId: string | null) => {
      if (!targetShopId) return;
      
      // Get all products for this shop
      const { data: products } = await supabase
        .from("shop_products")
        .select("id, name, selling_price, purchase_price, stock_quantity, online_sku")
        .eq("user_id", userId)
        .eq("shop_id", targetShopId)
        .eq("is_active", true);
      
      // Get all sale items with sales data
      const { data: saleItems } = await supabase
        .from("shop_sale_items")
        .select(`
          product_id,
          product_name,
          quantity,
          unit_price,
          purchase_price,
          total,
          profit,
          sale:shop_sales!inner(user_id, shop_id)
        `)
        .eq("sale.user_id", userId)
        .eq("sale.shop_id", targetShopId);
      
      // Get all returns
      const { data: returns } = await supabase
        .from("shop_returns")
        .select("product_id, product_name, quantity, refund_amount, loss_amount")
        .eq("user_id", userId)
        .eq("shop_id", targetShopId);
      
      // Get damages
      const { data: damages } = await supabase
        .from("shop_damages")
        .select("product_id, product_name, quantity, loss_amount")
        .eq("user_id", userId)
        .eq("shop_id", targetShopId);
      
      // Initialize with products
      (products || []).forEach(p => {
        // For combined mode, use online_sku as key if available to merge with online product
        const key = type === "combined" && p.online_sku ? p.online_sku : p.id;
        getOrCreate(key, p.name);
      });
      
      // Aggregate sales
      (saleItems || []).forEach(item => {
        const baseKey = item.product_id || item.product_name;
        // Find product to get online_sku for combined mode
        const product = (products || []).find(p => p.id === item.product_id);
        const key = type === "combined" && product?.online_sku ? product.online_sku : baseKey;
        
        const perf = getOrCreate(key, item.product_name);
        perf.totalQuantitySold += item.quantity || 0;
        perf.totalRevenue += Number(item.total) || 0;
        perf.totalProfit += Number(item.profit) || 0;
        perf.totalCost += (Number(item.purchase_price) || 0) * (item.quantity || 0);
      });
      
      // Aggregate returns
      (returns || []).forEach(ret => {
        const baseKey = ret.product_id || ret.product_name;
        const product = (products || []).find(p => p.id === ret.product_id);
        const key = type === "combined" && product?.online_sku ? product.online_sku : baseKey;
        
        const perf = performanceMap.get(key);
        if (perf) {
          perf.returnCount += 1;
          perf.returnQuantity += ret.quantity || 0;
          perf.lossAmount += Number(ret.loss_amount) || Number(ret.refund_amount) || 0;
        }
      });
      
      // Aggregate damages
      (damages || []).forEach(dmg => {
        const baseKey = dmg.product_id || dmg.product_name;
        const product = (products || []).find(p => p.id === dmg.product_id);
        const key = type === "combined" && product?.online_sku ? product.online_sku : baseKey;
        
        const perf = performanceMap.get(key);
        if (perf) {
          perf.lossAmount += Number(dmg.loss_amount) || 0;
        }
      });
    };

    // ===== PROCESS ONLINE DATA =====
    const processOnlineData = async () => {
      // Get all products
      const { data: products } = await supabase
        .from("products")
        .select("id, name, sku, price, purchase_price, stock_quantity")
        .eq("user_id", userId)
        .eq("is_active", true);
      
      // Get all orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, items, status, total")
        .eq("user_id", userId);
      
      // Initialize with products - use SKU as key for potential merging
      (products || []).forEach(p => {
        const key = type === "combined" && p.sku ? p.sku : p.id;
        getOrCreate(key, p.name);
      });
      
      // Aggregate from orders
      (orders || []).forEach(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        const isReturned = order.status === "returned" || order.status === "cancelled";
        const isDelivered = order.status === "delivered";
        
        items.forEach((item: any) => {
          const productId = item.product_id || item.id;
          const productName = item.name || item.product_name || "Unknown";
          const productSku = item.sku;
          const qty = item.quantity || item.qty || 1;
          const sellPrice = item.sell_price || item.price || 0;
          const buyPrice = item.buy_price || item.cost || item.purchase_price || 0;
          
          // For combined mode, try to use SKU to match with offline products
          const key = type === "combined" && productSku ? productSku : (productId || productName);
          const perf = getOrCreate(key, productName);
          
          if (isDelivered) {
            perf.totalQuantitySold += qty;
            perf.totalRevenue += sellPrice * qty;
            perf.totalCost += buyPrice * qty;
            perf.totalProfit += (sellPrice - buyPrice) * qty;
          }
          
          if (isReturned) {
            perf.returnCount += 1;
            perf.returnQuantity += qty;
            perf.lossAmount += sellPrice * qty;
          }
        });
      });
    };

    // For offline/combined type, if no shopId provided, try to get user's default/first shop
    let effectiveShopId = shopId;
    if ((type === "offline" || type === "combined") && !effectiveShopId) {
      const { data: defaultShop } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .single();
      effectiveShopId = defaultShop?.id || null;
    }

    // Process data based on type
    if (type === "offline") {
      if (effectiveShopId) {
        await processOfflineData(effectiveShopId);
      }
      // If no shop, returns empty data (handled gracefully by frontend)
    } else if (type === "online") {
      await processOnlineData();
    } else if (type === "combined") {
      // Process both and merge by SKU/online_sku
      await Promise.all([
        processOnlineData(),
        processOfflineData(effectiveShopId),
      ]);
    }

    // Calculate derived metrics
    const allProducts = Array.from(performanceMap.values());
    allProducts.forEach(p => {
      p.netProfit = p.totalProfit - p.lossAmount;
      p.profitMargin = p.totalRevenue > 0 ? (p.netProfit / p.totalRevenue) * 100 : 0;
      p.returnRate = p.totalQuantitySold > 0 ? (p.returnQuantity / p.totalQuantitySold) * 100 : 0;
    });
    
    // Summary
    const summary = {
      totalProducts: allProducts.length,
      totalSold: allProducts.reduce((sum, p) => sum + p.totalQuantitySold, 0),
      totalRevenue: allProducts.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalProfit: allProducts.reduce((sum, p) => sum + p.netProfit, 0),
      totalReturns: allProducts.reduce((sum, p) => sum + p.returnQuantity, 0),
      totalLoss: allProducts.reduce((sum, p) => sum + p.lossAmount, 0),
    };
    
    // Sort for different categories
    const soldProducts = allProducts.filter(p => p.totalQuantitySold > 0);
    
    const topSellers = [...soldProducts]
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
      .slice(0, limit);
    
    const lowPerformers = [...allProducts]
      .filter(p => p.totalQuantitySold === 0 || p.netProfit < 0)
      .sort((a, b) => a.netProfit - b.netProfit)
      .slice(0, limit);
    
    const highReturns = [...allProducts]
      .filter(p => p.returnCount > 0)
      .sort((a, b) => b.returnRate - a.returnRate)
      .slice(0, limit);
    
    const highLoss = [...allProducts]
      .filter(p => p.lossAmount > 0 || p.netProfit < 0)
      .sort((a, b) => b.lossAmount - a.lossAmount)
      .slice(0, limit);

    console.log(`[product-performance] type=${type} user=${userId} shop=${shopId} products=${allProducts.length} topSellers=${topSellers.length}`);

    return new Response(JSON.stringify({
      summary,
      topSellers,
      lowPerformers,
      highReturns,
      highLoss,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Product performance error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
