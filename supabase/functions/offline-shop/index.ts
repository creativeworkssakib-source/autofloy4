import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shop-id",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

// ===== HELPER: Calculate Weighted Average Cost =====
function calculateWeightedAverageCost(
  currentQty: number,
  currentAvgCost: number,
  newQty: number,
  newUnitCost: number
): number {
  if (currentQty + newQty === 0) return 0;
  const totalCost = (currentQty * currentAvgCost) + (newQty * newUnitCost);
  return totalCost / (currentQty + newQty);
}

// ===== HELPER: Create Stock Batch =====
async function createStockBatch(
  supabase: any,
  productId: string,
  userId: string,
  shopId: string | null,
  quantity: number,
  unitCost: number,
  purchaseId?: string,
  purchaseItemId?: string,
  expiryDate?: string,
  isInitialBatch: boolean = false
) {
  const { data, error } = await supabase
    .from("shop_stock_batches")
    .insert({
      product_id: productId,
      user_id: userId,
      shop_id: shopId,
      quantity,
      remaining_quantity: quantity,
      unit_cost: unitCost,
      purchase_id: purchaseId || null,
      purchase_item_id: purchaseItemId || null,
      expiry_date: expiryDate || null,
      is_initial_batch: isInitialBatch,
      batch_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create stock batch:", error);
    throw error;
  }
  return data;
}

// ===== HELPER: Update Product Average Cost =====
async function updateProductAverageCost(
  supabase: any,
  productId: string,
  userId: string
) {
  // Get all active batches for this product
  const { data: batches } = await supabase
    .from("shop_stock_batches")
    .select("remaining_quantity, unit_cost")
    .eq("product_id", productId)
    .gt("remaining_quantity", 0);

  if (!batches || batches.length === 0) {
    // No batches, set average cost to 0
    await supabase
      .from("shop_products")
      .update({ average_cost: 0 })
      .eq("id", productId)
      .eq("user_id", userId);
    return 0;
  }

  // Calculate weighted average
  let totalQty = 0;
  let totalCost = 0;
  for (const batch of batches) {
    totalQty += batch.remaining_quantity;
    totalCost += batch.remaining_quantity * Number(batch.unit_cost);
  }

  const avgCost = totalQty > 0 ? totalCost / totalQty : 0;

  await supabase
    .from("shop_products")
    .update({ average_cost: avgCost })
    .eq("id", productId)
    .eq("user_id", userId);

  return avgCost;
}

// ===== HELPER: Deduct Stock Using FIFO =====
async function deductStockFIFO(
  supabase: any,
  productId: string,
  quantityToDeduct: number
): Promise<{ totalCost: number; batchesUsed: Array<{ batchId: string; quantity: number; unitCost: number }> }> {
  // Get batches ordered by batch_date (oldest first) - FIFO
  const { data: batches, error } = await supabase
    .from("shop_stock_batches")
    .select("id, remaining_quantity, unit_cost, batch_date")
    .eq("product_id", productId)
    .gt("remaining_quantity", 0)
    .order("batch_date", { ascending: true });

  if (error) throw error;

  let remaining = quantityToDeduct;
  let totalCost = 0;
  const batchesUsed: Array<{ batchId: string; quantity: number; unitCost: number }> = [];
  const batchUpdates: Array<{ id: string; newRemaining: number }> = [];

  for (const batch of batches || []) {
    if (remaining <= 0) break;

    const deductFromBatch = Math.min(remaining, batch.remaining_quantity);
    totalCost += deductFromBatch * Number(batch.unit_cost);
    batchesUsed.push({
      batchId: batch.id,
      quantity: deductFromBatch,
      unitCost: Number(batch.unit_cost),
    });

    // Collect batch updates for parallel execution
    batchUpdates.push({
      id: batch.id,
      newRemaining: batch.remaining_quantity - deductFromBatch
    });

    remaining -= deductFromBatch;
  }

  // Update all batches in parallel
  await Promise.all(batchUpdates.map(update => 
    supabase
      .from("shop_stock_batches")
      .update({ remaining_quantity: update.newRemaining, updated_at: new Date().toISOString() })
      .eq("id", update.id)
  ));

  return { totalCost, batchesUsed };
}

// Generate EAN-13 like barcode
function generateBarcode(shopId: string, sequence: number): string {
  const prefix = "890"; // Region code prefix
  // Use last 4 chars of shop ID (after removing dashes)
  const shopPart = shopId.replace(/-/g, "").slice(-4).padStart(4, "0").replace(/[^0-9]/g, "0");
  const productPart = String(sequence).padStart(5, "0");
  const baseCode = prefix + shopPart + productPart;
  
  // Calculate EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(baseCode[i] || "0");
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return baseCode + checkDigit;
}

// Get next barcode sequence for a shop
async function getNextBarcodeSequence(supabase: any, userId: string, shopId: string | null): Promise<number> {
  let query = supabase
    .from("shop_products")
    .select("barcode", { count: "exact" })
    .eq("user_id", userId)
    .not("barcode", "is", null);
  
  if (shopId) query = query.eq("shop_id", shopId);
  
  const { count } = await query;
  return (count || 0) + 1;
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const userId = await verifyToken(req.headers.get("Authorization"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Find resource after "offline-shop" in the path
  const offlineShopIndex = pathParts.findIndex(p => p === "offline-shop");
  const resource = offlineShopIndex >= 0 && pathParts.length > offlineShopIndex + 1
    ? pathParts[offlineShopIndex + 1]
    : pathParts[pathParts.length - 1] || "dashboard";
  
  // Get shop_id from query params or header
  const shopId = url.searchParams.get("shop_id") || req.headers.get("X-Shop-Id");
  
  console.log(`[offline-shop] ${req.method} path=${url.pathname} resource=${resource} shop_id=${shopId} parts=${JSON.stringify(pathParts)}`);

  try {
    // ===== SHOPS CRUD (Multi-shop support) =====
    if (resource === "shops") {
      if (req.method === "GET") {
        // Get user's plan limits
        const { data: userData } = await supabase
          .from("users")
          .select("subscription_plan")
          .eq("id", userId)
          .single();
        
        const planId = userData?.subscription_plan || "none";
        
        // Get max_shops from pricing_plans
        const { data: planData } = await supabase
          .from("pricing_plans")
          .select("max_shops, name")
          .eq("id", planId)
          .maybeSingle();
        
        const maxShops = planData?.max_shops ?? 1;
        const planName = planData?.name || planId;
        
        // Get user's shops
        const { data: shops, error } = await supabase
          .from("shops")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: true });
        
        if (error) throw error;
        
        // If no shops exist, create a default one
        if (!shops || shops.length === 0) {
          const { data: newShop, error: createErr } = await supabase
            .from("shops")
            .insert({
              user_id: userId,
              name: "My Shop",
              is_default: true,
              is_active: true,
            })
            .select()
            .single();
          
          if (createErr) throw createErr;
          
          return new Response(JSON.stringify({
            shops: [newShop],
            limits: {
              maxShops,
              currentShopCount: 1,
              canCreateMore: maxShops === -1 || 1 < maxShops,
              planName,
            }
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({
          shops,
          limits: {
            maxShops,
            currentShopCount: shops.length,
            canCreateMore: maxShops === -1 || shops.length < maxShops,
            planName,
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "POST") {
        const body = await req.json();
        
        // Check plan limits
        const { data: userData } = await supabase
          .from("users")
          .select("subscription_plan")
          .eq("id", userId)
          .single();
        
        const planId = userData?.subscription_plan || "none";
        
        const { data: planData } = await supabase
          .from("pricing_plans")
          .select("max_shops, name")
          .eq("id", planId)
          .maybeSingle();
        
        const maxShops = planData?.max_shops ?? 1;
        
        // Count existing shops
        const { count } = await supabase
          .from("shops")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_active", true);
        
        if (maxShops !== -1 && (count || 0) >= maxShops) {
          return new Response(JSON.stringify({
            error: `আপনার প্ল্যানে সর্বোচ্চ ${maxShops}টি শপ তৈরি করতে পারবেন। আরও শপ যোগ করতে প্ল্যান আপগ্রেড করুন।`
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const { data: shop, error } = await supabase
          .from("shops")
          .insert({
            user_id: userId,
            name: body.name,
            address: body.address,
            phone: body.phone,
            email: body.email,
            is_active: true,
            is_default: false,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ shop }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "PUT") {
        const body = await req.json();
        const { id, ...updates } = body;
        
        const { data: shop, error } = await supabase
          .from("shops")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ shop }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "DELETE") {
        const { id, cascade } = await req.json();
        
        // Check if this is the only shop
        const { count } = await supabase
          .from("shops")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_active", true);
        
        if ((count || 0) <= 1) {
          return new Response(JSON.stringify({ error: "আপনার কমপক্ষে একটি শপ থাকতে হবে" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // If cascade delete, remove all related data permanently
        if (cascade) {
          console.log(`Cascade deleting shop: ${id}`);
          
          // Get all sales for this shop to handle their related data
          const { data: shopSales } = await supabase
            .from("shop_sales")
            .select("id")
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          const saleIds = (shopSales || []).map(s => s.id);
          
          // Delete in correct order to avoid FK constraints
          if (saleIds.length > 0) {
            // Nullify shop_returns references
            await supabase
              .from("shop_returns")
              .update({ original_sale_id: null })
              .in("original_sale_id", saleIds);
            
            // Delete sale items
            await supabase
              .from("shop_sale_items")
              .delete()
              .in("sale_id", saleIds);
          }
          
          // Delete shop_returns for this shop
          await supabase
            .from("shop_returns")
            .delete()
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          // Delete shop_damages for this shop
          await supabase
            .from("shop_damages")
            .delete()
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          // Delete cash transactions for this shop
          await supabase
            .from("shop_cash_transactions")
            .delete()
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          // Delete shop_sales for this shop
          await supabase
            .from("shop_sales")
            .delete()
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          // Get all purchases for this shop
          const { data: shopPurchases } = await supabase
            .from("shop_purchases")
            .select("id")
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          const purchaseIds = (shopPurchases || []).map(p => p.id);
          
          if (purchaseIds.length > 0) {
            // Delete purchase items
            await supabase
              .from("shop_purchase_items")
              .delete()
              .in("purchase_id", purchaseIds);
            
            // Delete purchase payments
            await supabase
              .from("shop_purchase_payments")
              .delete()
              .in("purchase_id", purchaseIds);
          }
          
          // Delete shop_purchases for this shop
          await supabase
            .from("shop_purchases")
            .delete()
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          // Delete shop_expenses for this shop
          await supabase
            .from("shop_expenses")
            .delete()
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          // Delete shop_products for this shop
          await supabase
            .from("shop_products")
            .delete()
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          // Delete shop_categories for this shop
          await supabase
            .from("shop_categories")
            .delete()
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          // Delete shop_customers for this shop
          await supabase
            .from("shop_customers")
            .delete()
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          // Delete shop_suppliers for this shop
          await supabase
            .from("shop_suppliers")
            .delete()
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          // Delete shop_staff_users for this shop
          await supabase
            .from("shop_staff_users")
            .delete()
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          // Delete shop_settings for this shop
          await supabase
            .from("shop_settings")
            .delete()
            .eq("shop_id", id)
            .eq("user_id", userId);
          
          // Finally delete the shop permanently
          const { error } = await supabase
            .from("shops")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);
          
          if (error) throw error;
          
          console.log(`Shop ${id} and all related data permanently deleted`);
          
          return new Response(JSON.stringify({ message: "Shop and all data permanently deleted" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Soft delete - just mark as inactive
        const { error } = await supabase
          .from("shops")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId);
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ message: "Shop deleted" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== DASHBOARD OVERVIEW =====
    if (req.method === "GET" && resource === "dashboard") {
      const dateRange = url.searchParams.get("range") || "today";
      const today = new Date().toISOString().split("T")[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
      const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      let startDate = today;
      if (dateRange === "week") startDate = startOfWeek;
      if (dateRange === "month") startDate = startOfMonth;

      // Get sales for selected period
      let periodSalesQuery = supabase
        .from("shop_sales")
        .select("total, total_cost, total_profit, items:shop_sale_items(profit)")
        .eq("user_id", userId)
        .gte("sale_date", startDate);
      if (shopId) periodSalesQuery = periodSalesQuery.eq("shop_id", shopId);
      const { data: periodSales } = await periodSalesQuery;

      // Get purchases for selected period
      let periodPurchasesQuery = supabase
        .from("shop_purchases")
        .select("total_amount")
        .eq("user_id", userId)
        .gte("purchase_date", startDate);
      if (shopId) periodPurchasesQuery = periodPurchasesQuery.eq("shop_id", shopId);
      const { data: periodPurchases } = await periodPurchasesQuery;

      // Get expenses for selected period
      let periodExpensesQuery = supabase
        .from("shop_expenses")
        .select("amount")
        .eq("user_id", userId)
        .gte("expense_date", startDate);
      if (shopId) periodExpensesQuery = periodExpensesQuery.eq("shop_id", shopId);
      const { data: periodExpenses } = await periodExpensesQuery;

      // Get lifetime totals
      let lifetimeSalesQuery = supabase
        .from("shop_sales")
        .select("total, total_profit, due_amount")
        .eq("user_id", userId);
      if (shopId) lifetimeSalesQuery = lifetimeSalesQuery.eq("shop_id", shopId);
      const { data: lifetimeSales } = await lifetimeSalesQuery;

      // Get total due amounts (all sales with outstanding balance)
      let dueDataQuery = supabase
        .from("shop_sales")
        .select("due_amount")
        .eq("user_id", userId)
        .gt("due_amount", 0);
      if (shopId) dueDataQuery = dueDataQuery.eq("shop_id", shopId);
      const { data: dueData } = await dueDataQuery;

      // Get total products count
      let totalProductsQuery = supabase
        .from("shop_products")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_active", true);
      if (shopId) totalProductsQuery = totalProductsQuery.eq("shop_id", shopId);
      const { count: totalProducts } = await totalProductsQuery;

      // Get total customers count
      let totalCustomersQuery = supabase
        .from("shop_customers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (shopId) totalCustomersQuery = totalCustomersQuery.eq("shop_id", shopId);
      const { count: totalCustomers } = await totalCustomersQuery;

      // Get total suppliers count
      let totalSuppliersQuery = supabase
        .from("shop_suppliers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (shopId) totalSuppliersQuery = totalSuppliersQuery.eq("shop_id", shopId);
      const { count: totalSuppliers } = await totalSuppliersQuery;

      // Get low stock products
      let lowStockQuery = supabase
        .from("shop_products")
        .select("id, name, stock_quantity, min_stock_alert")
        .eq("user_id", userId)
        .eq("is_active", true);
      if (shopId) lowStockQuery = lowStockQuery.eq("shop_id", shopId);
      const { data: lowStock } = await lowStockQuery;

      const lowStockProducts = (lowStock || []).filter(
        (p: any) => p.stock_quantity <= p.min_stock_alert
      );

      // Get recent sales
      let recentSalesQuery = supabase
        .from("shop_sales")
        .select(`
          id, invoice_number, total, total_profit, sale_date, payment_status,
          customer:shop_customers(name)
        `)
        .eq("user_id", userId)
        .order("sale_date", { ascending: false })
        .limit(5);
      if (shopId) recentSalesQuery = recentSalesQuery.eq("shop_id", shopId);
      const { data: recentSales } = await recentSalesQuery;

      // Get recently added products
      let recentProductsQuery = supabase
        .from("shop_products")
        .select("id, name, selling_price, stock_quantity, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (shopId) recentProductsQuery = recentProductsQuery.eq("shop_id", shopId);
      const { data: recentProducts } = await recentProductsQuery;

      // Get daily sales data for chart (last 7 days)
      let dailySalesQuery = supabase
        .from("shop_sales")
        .select("total, total_profit, sale_date")
        .eq("user_id", userId)
        .gte("sale_date", startOfWeek)
        .order("sale_date", { ascending: true });
      if (shopId) dailySalesQuery = dailySalesQuery.eq("shop_id", shopId);
      const { data: dailySales } = await dailySalesQuery;

      // Get top products
      const { data: topProducts } = await supabase
        .from("shop_sale_items")
        .select("product_name, quantity, total")
        .in("sale_id", recentSales?.map((s: any) => s.id) || []);

      // Get expense by category
      let expensesByCategoryQuery = supabase
        .from("shop_expenses")
        .select("category, amount")
        .eq("user_id", userId)
        .gte("expense_date", startOfMonth);
      if (shopId) expensesByCategoryQuery = expensesByCategoryQuery.eq("shop_id", shopId);
      const { data: expensesByCategory } = await expensesByCategoryQuery;

      // Get returns data for period
      let periodReturnsQuery = supabase
        .from("shop_returns")
        .select("id, refund_amount, return_reason, status")
        .eq("user_id", userId)
        .gte("return_date", startDate);
      if (shopId) periodReturnsQuery = periodReturnsQuery.eq("shop_id", shopId);
      const { data: periodReturns } = await periodReturnsQuery;

      // Get all-time returns for top reasons
      let allReturnsQuery = supabase
        .from("shop_returns")
        .select("return_reason, refund_amount")
        .eq("user_id", userId);
      if (shopId) allReturnsQuery = allReturnsQuery.eq("shop_id", shopId);
      const { data: allReturns } = await allReturnsQuery;

      // Calculate returns totals
      const totalReturnsCount = periodReturns?.length || 0;
      const totalRefundAmount = (periodReturns || []).reduce((sum: number, r: any) => sum + Number(r.refund_amount), 0);
      const processedReturns = (periodReturns || []).filter((r: any) => r.status === 'processed' || r.status === 'refunded').length;
      const pendingReturns = (periodReturns || []).filter((r: any) => r.status === 'pending').length;

      // Calculate top return reasons
      const reasonCounts: Record<string, { count: number; amount: number }> = {};
      (allReturns || []).forEach((r: any) => {
        if (!reasonCounts[r.return_reason]) {
          reasonCounts[r.return_reason] = { count: 0, amount: 0 };
        }
        reasonCounts[r.return_reason].count += 1;
        reasonCounts[r.return_reason].amount += Number(r.refund_amount);
      });

      const topReturnReasons = Object.entries(reasonCounts)
        .map(([reason, data]) => ({ reason, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate period totals - use actual profit from sales (total_profit = selling - cost)
      const periodTotalSales = (periodSales || []).reduce((sum: number, s: any) => sum + Number(s.total), 0);
      const periodTotalPurchases = (periodPurchases || []).reduce((sum: number, p: any) => sum + Number(p.total_amount), 0);
      const periodTotalExpenses = (periodExpenses || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      // Use actual profit from each sale (stored as total_profit) instead of Sales - Purchases
      const periodActualProfit = (periodSales || []).reduce((sum: number, s: any) => sum + Number(s.total_profit || 0), 0);
      const periodGrossProfit = periodActualProfit;
      const periodNetProfit = periodGrossProfit - periodTotalExpenses;

      // === THIS MONTH'S DATA (always from start of current month) ===
      let monthSalesQuery = supabase
        .from("shop_sales")
        .select("total, total_profit")
        .eq("user_id", userId)
        .gte("sale_date", startOfMonth);
      if (shopId) monthSalesQuery = monthSalesQuery.eq("shop_id", shopId);
      const { data: monthSales } = await monthSalesQuery;

      let monthExpensesQuery = supabase
        .from("shop_expenses")
        .select("amount")
        .eq("user_id", userId)
        .gte("expense_date", startOfMonth);
      if (shopId) monthExpensesQuery = monthExpensesQuery.eq("shop_id", shopId);
      const { data: monthExpenses } = await monthExpensesQuery;

      // Calculate this month's totals using actual profit from sales
      const monthTotalSales = (monthSales || []).reduce((sum: number, s: any) => sum + Number(s.total), 0);
      const monthGrossProfit = (monthSales || []).reduce((sum: number, s: any) => sum + Number(s.total_profit || 0), 0);
      const monthTotalExpenses = (monthExpenses || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      const monthNetProfit = monthGrossProfit - monthTotalExpenses;

      // === MONTHLY TARGET CALCULATION ===
      // Calculate total inventory value based on selling price (how much worth of products you have)
      // Then divide by 12 to get monthly sales target for healthy business cash flow
      let inventoryValueQuery = supabase
        .from("shop_products")
        .select("selling_price, stock_quantity")
        .eq("user_id", userId)
        .eq("is_active", true);
      if (shopId) inventoryValueQuery = inventoryValueQuery.eq("shop_id", shopId);
      const { data: inventoryProducts } = await inventoryValueQuery;
      
      const totalInventoryValue = (inventoryProducts || []).reduce(
        (sum: number, p: any) => sum + (Number(p.selling_price || 0) * Number(p.stock_quantity || 0)), 0
      );
      const monthlyTarget = Math.round(totalInventoryValue / 12); // Target per month to sell all inventory in a year
      const targetProgress = monthlyTarget > 0 ? Math.min(100, Math.round((monthTotalSales / monthlyTarget) * 100)) : 0;

      const lifetimeTotalSales = (lifetimeSales || []).reduce((sum: number, s: any) => sum + Number(s.total), 0);
      const lifetimeTotalProfit = (lifetimeSales || []).reduce((sum: number, s: any) => sum + Number(s.total_profit || 0), 0);
      const totalDueAmount = (dueData || []).reduce((sum: number, s: any) => sum + Number(s.due_amount || 0), 0);

      // Aggregate expense by category
      const expenseByCategoryMap: Record<string, number> = {};
      (expensesByCategory || []).forEach((e: any) => {
        expenseByCategoryMap[e.category] = (expenseByCategoryMap[e.category] || 0) + Number(e.amount);
      });

      // Get customers served in period
      let customersServedQuery = supabase
        .from("shop_sales")
        .select("customer_id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("sale_date", startDate)
        .not("customer_id", "is", null);
      if (shopId) customersServedQuery = customersServedQuery.eq("shop_id", shopId);
      const { count: customersServed } = await customersServedQuery;

      return new Response(JSON.stringify({
        period: {
          totalSales: periodTotalSales,
          totalPurchases: periodTotalPurchases,
          grossProfit: periodGrossProfit,
          totalExpenses: periodTotalExpenses,
          netProfit: periodNetProfit,
          customersServed: customersServed || 0,
        },
        monthly: {
          totalSales: monthTotalSales,
          grossProfit: monthGrossProfit,
          totalExpenses: monthTotalExpenses,
          netProfit: monthNetProfit,
          salesTarget: monthlyTarget,
          targetProgress: targetProgress,
          inventoryValue: totalInventoryValue,
        },
        lifetime: {
          totalSales: lifetimeTotalSales,
          totalProfit: lifetimeTotalProfit,
          totalProducts: totalProducts || 0,
          totalSuppliers: totalSuppliers || 0,
          totalDue: totalDueAmount,
        },
        returns: {
          totalCount: totalReturnsCount,
          totalRefundAmount,
          processedCount: processedReturns,
          pendingCount: pendingReturns,
          topReasons: topReturnReasons,
        },
        totalProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
        totalSuppliers: totalSuppliers || 0,
        lowStockProducts,
        recentSales: recentSales || [],
        recentProducts: recentProducts || [],
        dailySales: dailySales || [],
        expenseByCategory: expenseByCategoryMap,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== GROWTH INSIGHTS =====
    if (req.method === "GET" && resource === "growth-insights") {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split("T")[0];

      // Current month sales
      let currentMonthQuery = supabase
        .from("shop_sales")
        .select("total, sale_date")
        .eq("user_id", userId)
        .gte("sale_date", currentMonthStart);
      if (shopId) currentMonthQuery = currentMonthQuery.eq("shop_id", shopId);
      const { data: currentMonthSales } = await currentMonthQuery;

      // Last month sales
      let lastMonthQuery = supabase
        .from("shop_sales")
        .select("total")
        .eq("user_id", userId)
        .gte("sale_date", lastMonthStart)
        .lte("sale_date", lastMonthEnd);
      if (shopId) lastMonthQuery = lastMonthQuery.eq("shop_id", shopId);
      const { data: lastMonthSales } = await lastMonthQuery;

      // Monthly sales for last 6 months
      let monthlySalesQuery = supabase
        .from("shop_sales")
        .select("total, sale_date")
        .eq("user_id", userId)
        .gte("sale_date", sixMonthsAgo);
      if (shopId) monthlySalesQuery = monthlySalesQuery.eq("shop_id", shopId);
      const { data: allSales } = await monthlySalesQuery;

      // Top customers by purchases
      let customersQuery = supabase
        .from("shop_sales")
        .select("customer_id, total, customer:shop_customers(name)")
        .eq("user_id", userId)
        .not("customer_id", "is", null);
      if (shopId) customersQuery = customersQuery.eq("shop_id", shopId);
      const { data: customerSales } = await customersQuery;

      // Calculate totals
      const currentTotal = (currentMonthSales || []).reduce((sum: number, s: any) => sum + Number(s.total), 0);
      const lastTotal = (lastMonthSales || []).reduce((sum: number, s: any) => sum + Number(s.total), 0);
      const growthPercent = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : (currentTotal > 0 ? 100 : 0);

      // Daily average for current month
      const daysInMonth = now.getDate();
      const dailyAverage = daysInMonth > 0 ? currentTotal / daysInMonth : 0;

      // Monthly trend
      const monthlyMap: Record<string, number> = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthNamesBn = ["জান", "ফেব", "মার্চ", "এপ্রি", "মে", "জুন", "জুলা", "আগ", "সেপ্ট", "অক্টো", "নভে", "ডিসে"];
      
      (allSales || []).forEach((sale: any) => {
        const saleDate = new Date(sale.sale_date);
        const monthKey = `${saleDate.getFullYear()}-${saleDate.getMonth()}`;
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + Number(sale.total);
      });

      const monthlyTrend = Object.entries(monthlyMap)
        .map(([key, sales]) => {
          const [year, month] = key.split("-").map(Number);
          return {
            month: monthNames[month],
            monthBn: monthNamesBn[month],
            sales,
            sortKey: year * 12 + month
          };
        })
        .sort((a, b) => a.sortKey - b.sortKey);

      // Find best and worst months
      let bestMonth = null;
      let worstMonth = null;
      if (monthlyTrend.length > 0) {
        const sorted = [...monthlyTrend].sort((a, b) => b.sales - a.sales);
        bestMonth = { month: sorted[0].month, monthBn: sorted[0].monthBn, sales: sorted[0].sales };
        worstMonth = { month: sorted[sorted.length - 1].month, monthBn: sorted[sorted.length - 1].monthBn, sales: sorted[sorted.length - 1].sales };
      }

      // Top customers calculation
      const customerMap: Record<string, { name: string; total: number }> = {};
      let totalAllSales = 0;
      (customerSales || []).forEach((sale: any) => {
        if (sale.customer?.name) {
          if (!customerMap[sale.customer_id]) {
            customerMap[sale.customer_id] = { name: sale.customer.name, total: 0 };
          }
          customerMap[sale.customer_id].total += Number(sale.total);
          totalAllSales += Number(sale.total);
        }
      });

      const topCustomers = Object.values(customerMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map(c => ({
          name: c.name,
          totalPurchases: c.total,
          percentage: totalAllSales > 0 ? (c.total / totalAllSales) * 100 : 0
        }));

      // Generate smart insights
      const insights: string[] = [];
      const lang = req.headers.get("Accept-Language")?.includes("bn") ? "bn" : "en";

      if (growthPercent > 0) {
        insights.push(lang === "bn" 
          ? `📈 এই মাসে বিক্রি ${Math.abs(growthPercent).toFixed(1)}% বেড়েছে!`
          : `📈 Sales increased by ${Math.abs(growthPercent).toFixed(1)}% this month!`);
      } else if (growthPercent < 0) {
        insights.push(lang === "bn"
          ? `📉 এই মাসে বিক্রি ${Math.abs(growthPercent).toFixed(1)}% কমেছে`
          : `📉 Sales decreased by ${Math.abs(growthPercent).toFixed(1)}% this month`);
      }

      if (topCustomers.length > 0) {
        const topContribution = topCustomers.slice(0, 5).reduce((sum, c) => sum + c.percentage, 0);
        insights.push(lang === "bn"
          ? `👥 টপ ${Math.min(5, topCustomers.length)} কাস্টমার ${topContribution.toFixed(0)}% বিক্রি করছে`
          : `👥 Top ${Math.min(5, topCustomers.length)} customers account for ${topContribution.toFixed(0)}% of sales`);
      }

      if (dailyAverage > 0) {
        insights.push(lang === "bn"
          ? `💰 দৈনিক গড় বিক্রি ৳${dailyAverage.toLocaleString("bn-BD", { maximumFractionDigits: 0 })}`
          : `💰 Daily average sale: ৳${dailyAverage.toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
      }

      if (bestMonth && monthlyTrend.length > 2) {
        const bestMonthName = lang === "bn" ? bestMonth.monthBn : bestMonth.month;
        insights.push(lang === "bn"
          ? `🏆 সবচেয়ে বেশি বিক্রি হয়েছে ${bestMonthName} মাসে`
          : `🏆 Best performing month was ${bestMonthName}`);
      }

      return new Response(JSON.stringify({
        currentMonthSales: currentTotal,
        lastMonthSales: lastTotal,
        salesGrowthPercent: growthPercent,
        dailyAverage,
        topCustomers,
        monthlyTrend: monthlyTrend.map(m => ({ month: m.month, sales: m.sales })),
        insights,
        bestMonth: bestMonth ? { month: bestMonth.month, sales: bestMonth.sales } : null,
        worstMonth: worstMonth ? { month: worstMonth.month, sales: worstMonth.sales } : null,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== PRODUCTS CRUD =====
    if (resource === "products") {
      if (req.method === "GET") {
        let query = supabase
          .from("shop_products")
          .select(`*, category:shop_categories(id, name)`)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (shopId) query = query.eq("shop_id", shopId);
        const { data, error } = await query;

        if (error) throw error;
        return new Response(JSON.stringify({ products: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const body = await req.json();
        
        // Auto-generate barcode if not provided
        let barcode = body.barcode;
        if (!barcode) {
          const sequence = await getNextBarcodeSequence(supabase, userId, shopId);
          barcode = generateBarcode(shopId || userId, sequence);
        }
        
        // Set initial average_cost equal to purchase_price
        const purchasePrice = Number(body.purchase_price) || 0;
        const stockQuantity = Number(body.stock_quantity) || 0;
        
        const { data, error } = await supabase
          .from("shop_products")
          .insert({ 
            ...body, 
            barcode, 
            user_id: userId, 
            shop_id: shopId,
            average_cost: purchasePrice // Initialize average cost
          })
          .select()
          .single();

        if (error) throw error;
        
        // Create initial stock batch if stock quantity > 0
        if (stockQuantity > 0 && purchasePrice > 0) {
          try {
            await createStockBatch(
              supabase,
              data.id,
              userId,
              shopId,
              stockQuantity,
              purchasePrice,
              undefined,
              undefined,
              body.expiry_date,
              true // is initial batch
            );
            console.log(`Created initial stock batch for product ${data.id}: ${stockQuantity} units @ ${purchasePrice}`);
          } catch (batchError) {
            console.error("Failed to create initial batch:", batchError);
            // Don't fail the product creation, batch is optional enhancement
          }
        }
        
        // Log product history
        await supabase.from("shop_product_history").insert({
          user_id: userId,
          shop_id: shopId,
          product_id: data.id,
          product_name: data.name,
          quantity_added: stockQuantity,
          purchase_price: purchasePrice,
          selling_price: data.selling_price || 0,
          action_type: 'added',
        });
        
        return new Response(JSON.stringify({ product: data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "PUT") {
        const body = await req.json();
        const { id, ...updates } = body;
        const { data, error } = await supabase
          .from("shop_products")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ product: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "DELETE") {
        const body = await req.json().catch(() => ({} as any));
        const ids: string[] = Array.isArray(body.ids)
          ? body.ids
          : body.id
            ? [body.id]
            : [];

        if (ids.length === 0) {
          return new Response(JSON.stringify({ error: "Missing product id(s)" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Pre-fetch user-owned purchase/sale ids to safely update child rows
        const { data: purchaseRows } = await supabase
          .from("shop_purchases")
          .select("id")
          .eq("user_id", userId);
        const purchaseIds = (purchaseRows || []).map((p: any) => p.id);

        const { data: saleRows } = await supabase
          .from("shop_sales")
          .select("id")
          .eq("user_id", userId);
        const saleIds = (saleRows || []).map((s: any) => s.id);

        const deleted: string[] = [];
        const failed: Array<{ id: string; error: string }> = [];

        for (const productId of ids) {
          try {
            console.log(`Attempting to delete product (move to trash): ${productId}`);

            const { data: product, error: fetchError } = await supabase
              .from("shop_products")
              .select("*")
              .eq("id", productId)
              .eq("user_id", userId)
              .single();

            if (fetchError || !product) {
              failed.push({ id: productId, error: "Product not found" });
              continue;
            }

            // Save to trash before removing from inventory
            const { error: trashError } = await supabase.from("shop_trash").insert({
              user_id: userId,
              shop_id: shopId || null,
              original_table: "shop_products",
              original_id: productId,
              data: product,
            });
            if (trashError) throw trashError;

            // Remove FK references so product deletion won't fail
            if (purchaseIds.length > 0) {
              await supabase
                .from("shop_purchase_items")
                .update({ product_id: null })
                .eq("product_id", productId)
                .in("purchase_id", purchaseIds);
            }

            if (saleIds.length > 0) {
              await supabase
                .from("shop_sale_items")
                .update({ product_id: null })
                .eq("product_id", productId)
                .in("sale_id", saleIds);
            }

            await supabase
              .from("shop_stock_adjustments")
              .update({ product_id: null })
              .eq("product_id", productId)
              .eq("user_id", userId);

            await supabase
              .from("shop_damages")
              .update({ product_id: null })
              .eq("product_id", productId)
              .eq("user_id", userId);

            await supabase
              .from("shop_returns")
              .update({ product_id: null })
              .eq("product_id", productId)
              .eq("user_id", userId);

            const { error: deleteError } = await supabase
              .from("shop_products")
              .delete()
              .eq("id", productId)
              .eq("user_id", userId);

            if (deleteError) throw deleteError;

            deleted.push(productId);
            console.log(`Deleted product ${productId} and moved to trash`);
          } catch (e: any) {
            console.error("Product delete failed:", productId, e);
            failed.push({ id: productId, error: e?.message || "Delete failed" });
          }
        }

        return new Response(
          JSON.stringify({
            message: "Product(s) deleted and moved to trash",
            deleted,
            failed,
          }),
          {
            status: failed.length > 0 ? 207 : 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // ===== CATEGORIES CRUD =====
    if (resource === "categories") {
      if (req.method === "GET") {
        let query = supabase
          .from("shop_categories")
          .select("*")
          .eq("user_id", userId)
          .order("name");
        if (shopId) query = query.eq("shop_id", shopId);
        const { data, error } = await query;

        if (error) throw error;
        return new Response(JSON.stringify({ categories: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase
          .from("shop_categories")
          .insert({ ...body, user_id: userId, shop_id: shopId })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ category: data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "DELETE") {
        const { id } = await req.json();
        
        // Fetch category data before deleting
        const { data: category, error: fetchError } = await supabase
          .from("shop_categories")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (fetchError || !category) {
          return new Response(JSON.stringify({ error: "Category not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Save to trash before deleting
        const { error: trashError } = await supabase.from("shop_trash").insert({
          user_id: userId,
          shop_id: shopId || null,
          original_table: "shop_categories",
          original_id: id,
          data: category,
        });
        if (trashError) throw trashError;

        // Nullify category references in products
        await supabase
          .from("shop_products")
          .update({ category_id: null })
          .eq("category_id", id)
          .eq("user_id", userId);

        // Delete the category
        const { error } = await supabase
          .from("shop_categories")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) throw error;
        
        console.log(`Category ${id} moved to trash`);
        
        return new Response(JSON.stringify({ message: "Category deleted and moved to trash" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== CUSTOMERS CRUD =====
    if (resource === "customers") {
      if (req.method === "GET") {
        const id = url.searchParams.get("id");
        
        if (id) {
          // Get single customer with their sales
          let customerQuery = supabase
            .from("shop_customers")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId);
          if (shopId) customerQuery = customerQuery.eq("shop_id", shopId);
          const { data: customer, error } = await customerQuery.single();

          if (error) throw error;

          let salesQuery = supabase
            .from("shop_sales")
            .select(`*, items:shop_sale_items(*)`)
            .eq("customer_id", id)
            .order("sale_date", { ascending: false });
          if (shopId) salesQuery = salesQuery.eq("shop_id", shopId);
          const { data: sales } = await salesQuery;

          return new Response(JSON.stringify({ customer, sales: sales || [] }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let query = supabase
          .from("shop_customers")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (shopId) query = query.eq("shop_id", shopId);
        const { data, error } = await query;

        if (error) throw error;
        return new Response(JSON.stringify({ customers: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase
          .from("shop_customers")
          .insert({ ...body, user_id: userId, shop_id: shopId })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ customer: data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "PUT") {
        const body = await req.json();
        const { id, ...updates } = body;
        const { data, error } = await supabase
          .from("shop_customers")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ customer: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "DELETE") {
        const body = await req.json().catch(() => ({} as any));
        const ids: string[] = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];

        if (ids.length === 0) {
          return new Response(JSON.stringify({ error: "Missing customer id(s)" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const deleted: string[] = [];
        const failed: Array<{ id: string; error: string }> = [];

        for (const customerId of ids) {
          try {
            console.log(`Deleting customer (move to trash): ${customerId}`);

            // Fetch customer data
            const { data: customer, error: fetchError } = await supabase
              .from("shop_customers")
              .select("*")
              .eq("id", customerId)
              .eq("user_id", userId)
              .single();

            if (fetchError || !customer) {
              failed.push({ id: customerId, error: "Customer not found" });
              continue;
            }

            // Save to trash
            const { error: trashError } = await supabase.from("shop_trash").insert({
              user_id: userId,
              shop_id: shopId || null,
              original_table: "shop_customers",
              original_id: customerId,
              data: customer,
            });
            if (trashError) throw trashError;

            // Nullify references in shop_sales
            await supabase
              .from("shop_sales")
              .update({ customer_id: null })
              .eq("customer_id", customerId)
              .eq("user_id", userId);

            // Delete customer
            const { error: deleteError } = await supabase
              .from("shop_customers")
              .delete()
              .eq("id", customerId)
              .eq("user_id", userId);

            if (deleteError) throw deleteError;

            deleted.push(customerId);
            console.log(`Customer ${customerId} moved to trash`);
          } catch (e: any) {
            console.error("Customer delete failed:", customerId, e);
            failed.push({ id: customerId, error: e?.message || "Delete failed" });
          }
        }

        return new Response(
          JSON.stringify({ message: "Customer(s) deleted and moved to trash", deleted, failed }),
          { status: failed.length > 0 ? 207 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ===== SUPPLIERS CRUD =====
    if (resource === "suppliers") {
      if (req.method === "GET") {
        const id = url.searchParams.get("id");
        const profile = url.searchParams.get("profile") === "true";
        
        if (id) {
          let supplierQuery = supabase
            .from("shop_suppliers")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId);
          if (shopId) supplierQuery = supplierQuery.eq("shop_id", shopId);
          const { data: supplier, error } = await supplierQuery.single();

          if (error) throw error;

          const { data: purchases } = await supabase
            .from("shop_purchases")
            .select(`*, items:shop_purchase_items(*)`)
            .eq("supplier_id", id)
            .order("purchase_date", { ascending: false });

          // If profile requested, fetch additional data
          if (profile) {
            // Get supplier payments
            const { data: payments } = await supabase
              .from("shop_supplier_payments")
              .select("*")
              .eq("supplier_id", id)
              .order("payment_date", { ascending: false });

            // Calculate ledger entries from purchases and payments
            const ledgerEntries: any[] = [];
            let runningBalance = Number(supplier.opening_balance) || 0;

            // Add opening balance entry
            if (runningBalance !== 0) {
              ledgerEntries.push({
                id: 'opening',
                date: supplier.created_at,
                description: 'Opening Balance',
                debit: runningBalance > 0 ? runningBalance : 0,
                credit: 0,
                balance: runningBalance,
                type: 'opening'
              });
            }

            // Combine purchases and payments sorted by date
            const allTransactions = [
              ...(purchases || []).map(p => ({
                date: p.purchase_date,
                type: 'purchase' as const,
                data: p
              })),
              ...(payments || []).map(p => ({
                date: p.payment_date,
                type: 'payment' as const,
                data: p
              }))
            ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            for (const tx of allTransactions) {
              if (tx.type === 'purchase') {
                const purchaseAmount = Number(tx.data.total_amount) || 0;
                runningBalance += purchaseAmount;
                ledgerEntries.push({
                  id: tx.data.id,
                  date: tx.data.purchase_date,
                  description: `Purchase - ${tx.data.invoice_number || 'N/A'}`,
                  debit: purchaseAmount,
                  credit: 0,
                  balance: runningBalance,
                  type: 'purchase',
                  reference_id: tx.data.id
                });
                
                // Add payment entries from this purchase
                const paidAmount = Number(tx.data.paid_amount) || 0;
                if (paidAmount > 0) {
                  runningBalance -= paidAmount;
                  ledgerEntries.push({
                    id: `${tx.data.id}-payment`,
                    date: tx.data.purchase_date,
                    description: `Payment - ${tx.data.invoice_number || 'N/A'}`,
                    debit: 0,
                    credit: paidAmount,
                    balance: runningBalance,
                    type: 'purchase_payment',
                    reference_id: tx.data.id
                  });
                }
              } else {
                const paymentAmount = Number(tx.data.amount) || 0;
                runningBalance -= paymentAmount;
                ledgerEntries.push({
                  id: tx.data.id,
                  date: tx.data.payment_date,
                  description: `Due Payment - ${tx.data.notes || 'Supplier payment'}`,
                  debit: 0,
                  credit: paymentAmount,
                  balance: runningBalance,
                  type: 'due_payment',
                  reference_id: tx.data.id
                });
              }
            }

            // Get unique products purchased from this supplier
            const productMap = new Map();
            for (const purchase of purchases || []) {
              for (const item of purchase.items || []) {
                const existing = productMap.get(item.product_name);
                if (existing) {
                  existing.totalQuantity += item.quantity;
                  existing.totalAmount += item.total;
                  if (new Date(purchase.purchase_date) > new Date(existing.lastPurchaseDate)) {
                    existing.lastPurchaseDate = purchase.purchase_date;
                    existing.lastPrice = item.unit_price;
                  }
                } else {
                  productMap.set(item.product_name, {
                    name: item.product_name,
                    product_id: item.product_id,
                    totalQuantity: item.quantity,
                    totalAmount: item.total,
                    lastPurchaseDate: purchase.purchase_date,
                    lastPrice: item.unit_price,
                    averagePrice: item.unit_price
                  });
                }
              }
            }

            // Calculate average price
            const productSummary = Array.from(productMap.values()).map(p => ({
              ...p,
              averagePrice: p.totalAmount / p.totalQuantity
            }));

            // Calculate summary stats
            const totalPurchases = purchases?.length || 0;
            const totalPurchaseAmount = (purchases || []).reduce((sum, p) => sum + Number(p.total_amount), 0);
            const totalPaid = (purchases || []).reduce((sum, p) => sum + Number(p.paid_amount), 0) + 
                             (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
            const lastPurchaseDate = purchases?.[0]?.purchase_date || null;
            const lastPaymentDate = payments?.[0]?.payment_date || null;

            return new Response(JSON.stringify({ 
              supplier, 
              purchases: purchases || [],
              payments: payments || [],
              ledger: ledgerEntries,
              productSummary,
              summary: {
                totalPurchases,
                totalPurchaseAmount,
                totalPaid,
                totalDue: runningBalance,
                lastPurchaseDate,
                lastPaymentDate
              }
            }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ supplier, purchases: purchases || [] }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let suppliersQuery = supabase
          .from("shop_suppliers")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (shopId) suppliersQuery = suppliersQuery.eq("shop_id", shopId);
        const { data: suppliersData, error } = await suppliersQuery;

        if (error) throw error;

        // Fetch additional data for each supplier (total_paid, last_purchase_date)
        const enrichedSuppliers = await Promise.all((suppliersData || []).map(async (supplier) => {
          // Get total paid from purchases and supplier payments
          const { data: purchasesData } = await supabase
            .from("shop_purchases")
            .select("paid_amount, purchase_date")
            .eq("supplier_id", supplier.id)
            .order("purchase_date", { ascending: false });

          const { data: paymentsData } = await supabase
            .from("shop_supplier_payments")
            .select("amount")
            .eq("supplier_id", supplier.id);

          const totalPaidFromPurchases = (purchasesData || []).reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
          const totalPaidFromPayments = (paymentsData || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
          const totalPaid = totalPaidFromPurchases + totalPaidFromPayments;
          const lastPurchaseDate = purchasesData?.[0]?.purchase_date || null;

          return {
            ...supplier,
            total_paid: totalPaid,
            last_purchase_date: lastPurchaseDate,
          };
        }));

        return new Response(JSON.stringify({ suppliers: enrichedSuppliers }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const body = await req.json();
        
        // Generate supplier code if not provided
        let supplierCode = body.supplier_code;
        if (!supplierCode) {
          const { count } = await supabase
            .from("shop_suppliers")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);
          supplierCode = `SUP-${String((count || 0) + 1).padStart(3, '0')}`;
        }

        // Set initial total_due from opening_balance
        const openingBalance = Number(body.opening_balance) || 0;

        const { data, error } = await supabase
          .from("shop_suppliers")
          .insert({ 
            ...body, 
            user_id: userId,
            shop_id: shopId,
            supplier_code: supplierCode,
            total_due: openingBalance
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ supplier: data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "PUT") {
        const body = await req.json();
        const { id, ...updates } = body;
        const { data, error } = await supabase
          .from("shop_suppliers")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ supplier: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "DELETE") {
        const body = await req.json().catch(() => ({} as any));
        const ids: string[] = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];

        if (ids.length === 0) {
          return new Response(JSON.stringify({ error: "Missing supplier id(s)" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const deleted: string[] = [];
        const failed: Array<{ id: string; error: string }> = [];

        for (const supplierId of ids) {
          try {
            console.log(`Deleting supplier (move to trash): ${supplierId}`);

            // Fetch supplier data
            const { data: supplier, error: fetchError } = await supabase
              .from("shop_suppliers")
              .select("*")
              .eq("id", supplierId)
              .eq("user_id", userId)
              .single();

            if (fetchError || !supplier) {
              failed.push({ id: supplierId, error: "Supplier not found" });
              continue;
            }

            // Save to trash
            const { error: trashError } = await supabase.from("shop_trash").insert({
              user_id: userId,
              shop_id: shopId || null,
              original_table: "shop_suppliers",
              original_id: supplierId,
              data: supplier,
            });
            if (trashError) throw trashError;

            // Nullify references in shop_purchases
            await supabase
              .from("shop_purchases")
              .update({ supplier_id: null })
              .eq("supplier_id", supplierId)
              .eq("user_id", userId);

            // Delete supplier payments
            await supabase
              .from("shop_supplier_payments")
              .delete()
              .eq("supplier_id", supplierId);

            // Delete supplier
            const { error: deleteError } = await supabase
              .from("shop_suppliers")
              .delete()
              .eq("id", supplierId)
              .eq("user_id", userId);

            if (deleteError) throw deleteError;

            deleted.push(supplierId);
            console.log(`Supplier ${supplierId} moved to trash`);
          } catch (e: any) {
            console.error("Supplier delete failed:", supplierId, e);
            failed.push({ id: supplierId, error: e?.message || "Delete failed" });
          }
        }

        return new Response(
          JSON.stringify({ message: "Supplier(s) deleted and moved to trash", deleted, failed }),
          { status: failed.length > 0 ? 207 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ===== SUPPLIER PAYMENTS =====
    if (resource === "supplier-payments") {
      if (req.method === "GET") {
        const supplierId = url.searchParams.get("supplierId");
        
        let query = supabase
          .from("shop_supplier_payments")
          .select("*")
          .eq("user_id", userId)
          .order("payment_date", { ascending: false });
        
        if (supplierId) {
          query = query.eq("supplier_id", supplierId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        return new Response(JSON.stringify({ payments: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const { supplier_id, amount, payment_method, notes, purchase_id } = await req.json();
        
        // Create payment record
        const { data: payment, error } = await supabase
          .from("shop_supplier_payments")
          .insert({
            user_id: userId,
            supplier_id,
            purchase_id,
            amount,
            payment_method: payment_method || 'cash',
            notes
          })
          .select()
          .single();

        if (error) throw error;

        // Update supplier total_due
        const { data: supplier } = await supabase
          .from("shop_suppliers")
          .select("total_due")
          .eq("id", supplier_id)
          .single();

        if (supplier) {
          const newDue = Math.max(0, Number(supplier.total_due) - amount);
          await supabase
            .from("shop_suppliers")
            .update({ total_due: newDue, updated_at: new Date().toISOString() })
            .eq("id", supplier_id);
        }

        // Create cash transaction ONLY if payment_method is 'cash'
        if (payment_method === 'cash') {
          await supabase
            .from("shop_cash_transactions")
            .insert({
              user_id: userId,
              type: "out",
              source: "supplier_payment",
              amount,
              reference_id: supplier_id,
              reference_type: "supplier",
              notes: notes || "Supplier payment",
            });
        }

        return new Response(JSON.stringify({ payment, new_due: supplier ? Math.max(0, Number(supplier.total_due) - amount) : 0 }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== SALES CRUD =====
    if (resource === "sales") {
      if (req.method === "GET") {
        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");
        const customerId = url.searchParams.get("customerId");
        const paymentStatus = url.searchParams.get("paymentStatus");

        let query = supabase
          .from("shop_sales")
          .select(`
            *,
            customer:shop_customers(id, name, phone),
            items:shop_sale_items(*)
          `)
          .eq("user_id", userId)
          .order("sale_date", { ascending: false });

        if (shopId) query = query.eq("shop_id", shopId);
        if (startDate) query = query.gte("sale_date", startDate);
        if (endDate) query = query.lte("sale_date", endDate + "T23:59:59");
        if (customerId) query = query.eq("customer_id", customerId);
        if (paymentStatus) query = query.eq("payment_status", paymentStatus);

        const { data, error } = await query;
        if (error) throw error;
        return new Response(JSON.stringify({ sales: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const { customer_id, customer_name, customer_phone, items, discount, tax, paid_amount, received_amount, change_amount, payment_method, notes } = await req.json();

        // Get shop settings for invoice prefix
        const { data: settings } = await supabase
          .from("shop_settings")
          .select("invoice_prefix")
          .eq("user_id", userId)
          .maybeSingle();

        const prefix = settings?.invoice_prefix || "INV";

        // Generate invoice number
        const { count } = await supabase
          .from("shop_sales")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        const invoiceNumber = `${prefix}-${String((count || 0) + 1).padStart(6, "0")}`;
        const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
        const totalCost = items.reduce((sum: number, item: any) => sum + (item.purchase_price || 0) * item.quantity, 0);
        const total = subtotal - (discount || 0) + (tax || 0);
        const totalProfit = total - totalCost;
        const dueAmount = total - (paid_amount || total);

        // Create sale with optional customer info
        const saleData: any = {
          user_id: userId,
          shop_id: shopId || null,
          invoice_number: invoiceNumber,
          subtotal,
          discount: discount || 0,
          tax: tax || 0,
          total,
          total_cost: totalCost,
          total_profit: totalProfit,
          paid_amount: paid_amount || total,
          due_amount: dueAmount,
          payment_method: payment_method || "cash",
          payment_status: dueAmount > 0 ? "partial" : "paid",
          notes: notes || null,
          customer_name: customer_name || null,
          customer_phone: customer_phone || null,
        };

        // Only add customer_id if provided
        if (customer_id) {
          saleData.customer_id = customer_id;
        }

        const { data: sale, error: saleError } = await supabase
          .from("shop_sales")
          .insert(saleData)
          .select()
          .single();

        if (saleError) throw saleError;

        // Create sale items and update stock using FIFO - OPTIMIZED with parallel processing
        let actualTotalCost = 0;
        const saleItemsToInsert: any[] = [];
        const productUpdates: Promise<void>[] = [];
        
        // Process all items in parallel for FIFO deduction
        const itemResults = await Promise.all(items.map(async (item: any) => {
          let itemActualCost = (item.purchase_price || 0) * item.quantity;
          
          // Use FIFO to deduct from batches and get actual cost
          if (item.product_id) {
            try {
              const { totalCost: fifoCost, batchesUsed } = await deductStockFIFO(
                supabase,
                item.product_id,
                item.quantity
              );
              
              if (batchesUsed.length > 0) {
                itemActualCost = fifoCost;
              }
            } catch (fifoError) {
              console.error("FIFO deduction failed, using fallback:", fifoError);
            }
          }
          
          return { item, itemActualCost };
        }));
        
        // Prepare all sale items for batch insert
        for (const { item, itemActualCost } of itemResults) {
          const itemProfit = item.total - itemActualCost;
          actualTotalCost += itemActualCost;
          
          saleItemsToInsert.push({
            sale_id: sale.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            purchase_price: itemActualCost / item.quantity,
            discount: item.discount || 0,
            total: item.total,
            profit: itemProfit,
          });
        }
        
        // Batch insert all sale items at once
        if (saleItemsToInsert.length > 0) {
          await supabase.from("shop_sale_items").insert(saleItemsToInsert);
        }
        
        // Get all products in one query instead of per-item
        const productIds = items.filter((i: any) => i.product_id).map((i: any) => i.product_id);
        const { data: products } = await supabase
          .from("shop_products")
          .select("id, stock_quantity, online_sku")
          .in("id", productIds);
        
        // Get sync settings once
        const { data: syncSettings } = await supabase
          .from("sync_settings")
          .select("sync_enabled")
          .eq("user_id", userId)
          .maybeSingle();
        
        // Prepare product stock updates
        const productStockUpdates: any[] = [];
        const onlineProductUpdates: any[] = [];
        
        for (const item of items) {
          if (item.product_id && products) {
            const product = products.find((p: any) => p.id === item.product_id);
            if (product) {
              const newStock = Math.max(0, product.stock_quantity - item.quantity);
              productStockUpdates.push({
                id: item.product_id,
                stock_quantity: newStock,
                online_sku: product.online_sku,
              });
            }
          }
        }
        
        // Update all products and average costs in parallel
        await Promise.all([
          // Update shop products stock in batch
          ...productStockUpdates.map(async (update) => {
            await supabase
              .from("shop_products")
              .update({ stock_quantity: update.stock_quantity })
              .eq("id", update.id);
            
            // Update average cost
            await updateProductAverageCost(supabase, update.id, userId);
            
            // Sync to online if enabled
            if (syncSettings?.sync_enabled && update.online_sku) {
              await supabase
                .from("products")
                .update({ stock_quantity: update.stock_quantity, updated_at: new Date().toISOString() })
                .eq("user_id", userId)
                .eq("sku", update.online_sku);
            }
          }),
          // Update sale with actual cost and profit
          supabase
            .from("shop_sales")
            .update({ 
              total_cost: actualTotalCost, 
              total_profit: total - actualTotalCost 
            })
            .eq("id", sale.id),
          // Update customer totals if customer_id provided
          customer_id ? (async () => {
            const { data: customer } = await supabase
              .from("shop_customers")
              .select("total_purchases, total_due")
              .eq("id", customer_id)
              .single();
            
            if (customer) {
              await supabase
                .from("shop_customers")
                .update({
                  total_purchases: Number(customer.total_purchases) + total,
                  total_due: Number(customer.total_due) + dueAmount,
                })
                .eq("id", customer_id);
            }
          })() : Promise.resolve(),
          // Create cash IN transaction ONLY if payment_method is 'cash'
          // Use the actual sale amount (paid_amount), NOT received_amount
          // received_amount includes change which is returned, so we only track what's kept
          (payment_method === 'cash' && (paid_amount > 0 || total > 0)) ? supabase.from("shop_cash_transactions").insert({
            user_id: userId,
            shop_id: shopId || null,
            type: "in",
            source: "sale",
            amount: paid_amount || total, // Actual sale value, not what customer handed over
            reference_id: sale.id,
            reference_type: "sale",
            notes: `Sale ${invoiceNumber}`,
          }) : Promise.resolve(),
          // Create change_return transaction if customer received change back
          (async () => {
            console.log("[SALES] Change tracking:", { payment_method, change_amount, received_amount, paid_amount, total });
            if (payment_method === 'cash' && change_amount && Number(change_amount) > 0) {
              console.log("[SALES] Creating change_return transaction for amount:", Number(change_amount));
              const { error: changeError } = await supabase.from("shop_cash_transactions").insert({
                user_id: userId,
                shop_id: shopId || null,
                type: "out",
                source: "change_return",
                amount: Number(change_amount),
                reference_id: sale.id,
                reference_type: "sale",
                notes: `Change for ${invoiceNumber}${customer_name ? ` - ${customer_name}` : ''}`,
              });
              if (changeError) {
                console.error("[SALES] Failed to create change_return:", changeError);
              }
            }
          })(),
        ]);

        // Add customer info to response for invoice display
        const saleResponse = {
          ...sale,
          customer: customer_id ? undefined : (customer_name ? { name: customer_name, phone: customer_phone } : null),
        };

        return new Response(JSON.stringify({ sale: saleResponse, invoice_number: invoiceNumber }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "PUT") {
        const { id, paid_amount, due_amount, payment_status, notes, payment_method } = await req.json();

        if (!id) {
          return new Response(JSON.stringify({ error: "Missing sale id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get current sale to calculate payment difference
        const { data: currentSale, error: fetchError } = await supabase
          .from("shop_sales")
          .select("paid_amount, due_amount, invoice_number, customer_id")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (fetchError) throw fetchError;

        const previousPaid = Number(currentSale?.paid_amount || 0);
        const newPaid = Number(paid_amount ?? previousPaid);
        const paymentReceived = newPaid - previousPaid;

        // Build update object only with provided fields
        const updates: Record<string, any> = {};
        if (paid_amount !== undefined) updates.paid_amount = paid_amount;
        if (due_amount !== undefined) updates.due_amount = due_amount;
        if (payment_status !== undefined) updates.payment_status = payment_status;
        if (notes !== undefined) updates.notes = notes;
        updates.updated_at = new Date().toISOString();

        const { data: sale, error: updateError } = await supabase
          .from("shop_sales")
          .update(updates)
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (updateError) throw updateError;

        // If payment was received (due collection), create a cash transaction ONLY if payment_method is 'cash'
        if (paymentReceived > 0 && payment_method === 'cash') {
          await supabase.from("shop_cash_transactions").insert({
            user_id: userId,
            shop_id: shopId || null,
            type: "in",
            source: "due_collection",
            amount: paymentReceived,
            reference_id: id,
            reference_type: "sale",
            notes: `Due collection - ${currentSale?.invoice_number || 'Sale'}`
          });
          console.log(`Due collection recorded: ${paymentReceived} for sale ${id}`);

          // Update customer total_due if customer exists
          if (currentSale?.customer_id) {
            const { data: customer } = await supabase
              .from("shop_customers")
              .select("total_due")
              .eq("id", currentSale.customer_id)
              .single();

            if (customer) {
              await supabase
                .from("shop_customers")
                .update({ total_due: Math.max(0, Number(customer.total_due) - paymentReceived) })
                .eq("id", currentSale.customer_id);
            }
          }
        }

        console.log(`Sale updated: ${id}`, updates);

        return new Response(JSON.stringify({ sale }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "DELETE") {
        const body = await req.json().catch(() => ({} as any));
        const ids: string[] = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];

        if (ids.length === 0) {
          return new Response(JSON.stringify({ error: "Missing sale id(s)" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const deleted: string[] = [];
        const failed: Array<{ id: string; error: string }> = [];

        for (const saleId of ids) {
          try {
            console.log(`Deleting sale (move to trash): ${saleId}`);

            // Fetch sale with items
            const { data: sale, error: fetchError } = await supabase
              .from("shop_sales")
              .select("*, items:shop_sale_items(*)")
              .eq("id", saleId)
              .eq("user_id", userId)
              .single();

            if (fetchError || !sale) {
              failed.push({ id: saleId, error: "Sale not found" });
              continue;
            }

            // Save to trash
            const { error: trashError } = await supabase.from("shop_trash").insert({
              user_id: userId,
              shop_id: shopId || null,
              original_table: "shop_sales",
              original_id: saleId,
              data: sale,
            });
            if (trashError) throw trashError;

            // Restore stock for each item
            for (const item of sale.items || []) {
              if (item.product_id) {
                const { data: product } = await supabase
                  .from("shop_products")
                  .select("stock_quantity")
                  .eq("id", item.product_id)
                  .single();

                if (product) {
                  await supabase
                    .from("shop_products")
                    .update({ stock_quantity: product.stock_quantity + item.quantity })
                    .eq("id", item.product_id);
                }
              }
            }

            // Revert customer totals
            if (sale.customer_id) {
              const { data: customer } = await supabase
                .from("shop_customers")
                .select("total_purchases, total_due")
                .eq("id", sale.customer_id)
                .single();

              if (customer) {
                await supabase
                  .from("shop_customers")
                  .update({
                    total_purchases: Math.max(0, Number(customer.total_purchases) - Number(sale.total)),
                    total_due: Math.max(0, Number(customer.total_due) - Number(sale.due_amount)),
                  })
                  .eq("id", sale.customer_id);
              }
            }

            // Delete cash transactions for this sale
            await supabase
              .from("shop_cash_transactions")
              .delete()
              .eq("reference_id", saleId)
              .eq("reference_type", "sale")
              .eq("user_id", userId);

            // Nullify references in shop_returns to avoid foreign key constraint
            await supabase
              .from("shop_returns")
              .update({ original_sale_id: null })
              .eq("original_sale_id", saleId)
              .eq("user_id", userId);

            // Delete sale items
            await supabase
              .from("shop_sale_items")
              .delete()
              .eq("sale_id", saleId);

            // Delete the sale
            const { error: deleteError } = await supabase
              .from("shop_sales")
              .delete()
              .eq("id", saleId)
              .eq("user_id", userId);

            if (deleteError) throw deleteError;

            deleted.push(saleId);
            console.log(`Sale ${saleId} moved to trash, stock restored`);
          } catch (e: any) {
            console.error("Sale delete failed:", saleId, e);
            failed.push({ id: saleId, error: e?.message || "Delete failed" });
          }
        }

        return new Response(
          JSON.stringify({ message: "Sale(s) deleted and moved to trash", deleted, failed }),
          { status: failed.length > 0 ? 207 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ===== PURCHASES CRUD =====
    if (resource === "purchases") {
      if (req.method === "GET") {
        let query = supabase
          .from("shop_purchases")
          .select(`*, items:shop_purchase_items(*), supplier:shop_suppliers(id, name, phone)`)
          .eq("user_id", userId)
          .order("purchase_date", { ascending: false });
        if (shopId) query = query.eq("shop_id", shopId);
        const { data, error } = await query;

        if (error) throw error;
        return new Response(JSON.stringify({ purchases: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const { supplier_id, supplier_name, supplier_contact, invoice_number, items, paid_amount, paid_from_cash, payment_method, notes } = await req.json();
        const totalAmount = items.reduce((sum: number, item: any) => sum + item.total, 0);
        const dueAmount = totalAmount - (paid_amount || totalAmount);

        const { data: purchase, error: purchaseError } = await supabase
          .from("shop_purchases")
          .insert({
            user_id: userId,
            shop_id: shopId,
            supplier_id,
            supplier_name,
            supplier_contact,
            invoice_number,
            total_amount: totalAmount,
            paid_amount: paid_amount || totalAmount,
            due_amount: dueAmount,
            payment_status: dueAmount > 0 ? "partial" : "paid",
            notes,
          })
          .select()
          .single();

        if (purchaseError) throw purchaseError;

        // Create purchase items and update stock
        for (const item of items) {
          // Insert purchase item and get its ID
          const { data: purchaseItem, error: piError } = await supabase.from("shop_purchase_items").insert({
            purchase_id: purchase.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            expiry_date: item.expiry_date,
          }).select().single();

          if (piError) throw piError;

          // Increase stock, create batch, and update average cost
          if (item.product_id) {
            const { data: product } = await supabase
              .from("shop_products")
              .select("stock_quantity, average_cost, online_sku")
              .eq("id", item.product_id)
              .single();

            if (product) {
              const currentQty = Number(product.stock_quantity) || 0;
              const currentAvgCost = Number(product.average_cost) || Number(item.unit_price);
              const newQty = Number(item.quantity);
              const newUnitCost = Number(item.unit_price);
              
              // Calculate new weighted average cost
              const newAvgCost = calculateWeightedAverageCost(
                currentQty,
                currentAvgCost,
                newQty,
                newUnitCost
              );
              
              const newStock = currentQty + newQty;
              
              // Update product with new stock and average cost
              await supabase
                .from("shop_products")
                .update({
                  stock_quantity: newStock,
                  purchase_price: item.unit_price, // Keep latest purchase price
                  average_cost: newAvgCost,
                  expiry_date: item.expiry_date,
                })
                .eq("id", item.product_id);
              
              // Create stock batch for this purchase
              try {
                await createStockBatch(
                  supabase,
                  item.product_id,
                  userId,
                  shopId,
                  newQty,
                  newUnitCost,
                  purchase.id,
                  purchaseItem.id,
                  item.expiry_date
                );
                console.log(`Created stock batch for product ${item.product_id}: ${newQty} units @ ${newUnitCost}`);
              } catch (batchError) {
                console.error("Failed to create batch:", batchError);
              }
              
              // If sync is enabled and product has online_sku, update online product stock too
              if (product.online_sku) {
                const { data: syncSettings } = await supabase
                  .from("sync_settings")
                  .select("sync_enabled")
                  .eq("user_id", userId)
                  .maybeSingle();
                
                if (syncSettings?.sync_enabled) {
                  await supabase
                    .from("products")
                    .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
                    .eq("user_id", userId)
                    .eq("sku", product.online_sku);
                  
                  console.log(`Synced stock to online product SKU: ${product.online_sku}, new stock: ${newStock}`);
                }
              }
            }
          }
        }

        // Update supplier totals
        if (supplier_id) {
          const { data: supplier } = await supabase
            .from("shop_suppliers")
            .select("total_purchases, total_due")
            .eq("id", supplier_id)
            .single();

          if (supplier) {
            await supabase
              .from("shop_suppliers")
              .update({
                total_purchases: Number(supplier.total_purchases) + totalAmount,
                total_due: Number(supplier.total_due) + dueAmount,
              })
              .eq("id", supplier_id);
          }
        }

        // Create cash transaction only if paid_from_cash is true
        if (paid_amount > 0 && paid_from_cash === true) {
          await supabase.from("shop_cash_transactions").insert({
            user_id: userId,
            shop_id: shopId,
            type: "out",
            source: "purchase",
            amount: paid_amount || totalAmount,
            reference_id: purchase.id,
            reference_type: "purchase",
            notes: `Purchase from ${supplier_name || "Supplier"}`,
            transaction_date: new Date().toISOString().split("T")[0],
          });
        }

        return new Response(JSON.stringify({ purchase }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "DELETE") {
        const { id } = await req.json();
        
        console.log(`Attempting to delete purchase: ${id}`);
        
        // Get purchase details first
        const { data: purchase, error: fetchError } = await supabase
          .from("shop_purchases")
          .select("*, items:shop_purchase_items(*)")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (fetchError || !purchase) {
          console.error("Purchase not found:", fetchError);
          return new Response(JSON.stringify({ error: "Purchase not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Save to trash bin before deleting
        await supabase.from("shop_trash").insert({
          user_id: userId,
          shop_id: shopId || null,
          original_table: "shop_purchases",
          original_id: id,
          data: {
            purchase,
            items: purchase.items,
          },
        });

        // Restore stock for each item
        for (const item of purchase.items || []) {
          if (item.product_id) {
            const { data: product } = await supabase
              .from("shop_products")
              .select("stock_quantity")
              .eq("id", item.product_id)
              .single();

            if (product) {
              await supabase
                .from("shop_products")
                .update({
                  stock_quantity: Math.max(0, product.stock_quantity - item.quantity),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", item.product_id);
            }
          }
        }

        // Update supplier totals if supplier was linked
        if (purchase.supplier_id) {
          const { data: supplier } = await supabase
            .from("shop_suppliers")
            .select("total_purchases, total_due")
            .eq("id", purchase.supplier_id)
            .single();

          if (supplier) {
            await supabase
              .from("shop_suppliers")
              .update({
                total_purchases: Math.max(0, Number(supplier.total_purchases) - Number(purchase.total_amount)),
                total_due: Math.max(0, Number(supplier.total_due) - Number(purchase.due_amount)),
              })
              .eq("id", purchase.supplier_id);
          }
        }

        // Delete purchase payments first
        await supabase
          .from("shop_purchase_payments")
          .delete()
          .eq("purchase_id", id);

        // Delete purchase items
        await supabase
          .from("shop_purchase_items")
          .delete()
          .eq("purchase_id", id);

        // Delete associated cash transactions
        await supabase
          .from("shop_cash_transactions")
          .delete()
          .eq("reference_id", id)
          .eq("reference_type", "purchase");

        // Delete payment cash transactions too
        await supabase
          .from("shop_cash_transactions")
          .delete()
          .eq("reference_id", id)
          .eq("reference_type", "purchase_payment");

        // Delete the purchase
        const { error: deleteError } = await supabase
          .from("shop_purchases")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (deleteError) throw deleteError;

        console.log(`Deleted purchase ${id} and restored stock, saved to trash`);

        return new Response(JSON.stringify({ message: "Purchase deleted and moved to trash" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add payment to purchase
      if (req.method === "PATCH") {
        try {
          const body = await req.json();
          const { id, payment_method, notes } = body;
          const amount = Number(body.amount) || 0;
          
          console.log(`Processing purchase payment: id=${id}, amount=${amount}, payment_method=${payment_method}`);
          
          if (!id) {
            return new Response(JSON.stringify({ error: "Purchase ID required" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          // Get current purchase
          const { data: purchase, error: fetchError } = await supabase
            .from("shop_purchases")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .maybeSingle();

          if (fetchError) {
            console.error(`Purchase fetch error: ${id}`, fetchError);
            return new Response(JSON.stringify({ error: "Database error" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          if (!purchase) {
            console.error(`Purchase not found: ${id}`);
            return new Response(JSON.stringify({ error: "Purchase not found" }), {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          console.log(`Purchase found: due_amount=${purchase.due_amount}, paid_amount=${purchase.paid_amount}`);

          const dueAmount = Number(purchase.due_amount) || 0;
          const paymentAmount = Math.min(amount, dueAmount);
          
          if (paymentAmount <= 0) {
            console.error(`Invalid payment: amount=${amount}, dueAmount=${dueAmount}, paymentAmount=${paymentAmount}`);
            return new Response(JSON.stringify({ error: "Invalid payment amount or no due" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Record payment
          const { data: payment, error: paymentError } = await supabase
            .from("shop_purchase_payments")
            .insert({
              user_id: userId,
              purchase_id: id,
              amount: paymentAmount,
              payment_method: payment_method || "cash",
              notes: notes || null,
            })
            .select()
            .maybeSingle();

          if (paymentError) {
            console.error("Payment insert error:", paymentError);
            return new Response(JSON.stringify({ error: "Failed to record payment" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Update purchase totals
          const newPaidAmount = Number(purchase.paid_amount || 0) + paymentAmount;
          const newDueAmount = Math.max(0, dueAmount - paymentAmount);
          const newStatus = newDueAmount <= 0 ? "paid" : "partial";

          const { error: updateError } = await supabase
            .from("shop_purchases")
            .update({
              paid_amount: newPaidAmount,
              due_amount: newDueAmount,
              payment_status: newStatus,
            })
            .eq("id", id);

          if (updateError) {
            console.error("Purchase update error:", updateError);
          }

          // Update supplier due amount
          if (purchase.supplier_id) {
            const { data: supplier } = await supabase
              .from("shop_suppliers")
              .select("total_due")
              .eq("id", purchase.supplier_id)
              .maybeSingle();

            if (supplier) {
              await supabase
                .from("shop_suppliers")
                .update({
                  total_due: Math.max(0, Number(supplier.total_due || 0) - paymentAmount),
                })
                .eq("id", purchase.supplier_id);
            }
          }

          // Create cash transaction for payment ONLY if payment_method is 'cash'
          if (payment_method === 'cash') {
            await supabase.from("shop_cash_transactions").insert({
              user_id: userId,
              type: "out",
              source: "purchase_payment",
              amount: paymentAmount,
              reference_id: id,
              reference_type: "purchase_payment",
              notes: `Payment for purchase from ${purchase.supplier_name || "Supplier"}. ${notes || ""}`,
            });
          }

          console.log(`Payment successful: ${paymentAmount}, new_due: ${newDueAmount}`);

          return new Response(JSON.stringify({ 
            payment,
            new_paid_amount: newPaidAmount,
            new_due_amount: newDueAmount,
            payment_status: newStatus,
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (patchError) {
          console.error("PATCH handler error:", patchError);
          return new Response(JSON.stringify({ error: "Payment processing failed" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // ===== EXPENSES CRUD =====
    if (resource === "expenses") {
      if (req.method === "GET") {
        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");
        const category = url.searchParams.get("category");

        let query = supabase
          .from("shop_expenses")
          .select("*")
          .eq("user_id", userId)
          .order("expense_date", { ascending: false });
        
        if (shopId) query = query.eq("shop_id", shopId);
        if (startDate) query = query.gte("expense_date", startDate);
        if (endDate) query = query.lte("expense_date", endDate);
        if (category) query = query.eq("category", category);

        const { data, error } = await query;
        if (error) throw error;
        return new Response(JSON.stringify({ expenses: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const body = await req.json();
        // Extract paid_from_cash before inserting (not a database column)
        const { paid_from_cash, ...expenseData } = body;
        
        const { data, error } = await supabase
          .from("shop_expenses")
          .insert({ ...expenseData, user_id: userId, shop_id: shopId })
          .select()
          .single();

        if (error) throw error;

        // Only create cash transaction if paid_from_cash is true
        if (paid_from_cash === true) {
          await supabase.from("shop_cash_transactions").insert({
            user_id: userId,
            shop_id: shopId,
            type: "out",
            source: "expense",
            amount: body.amount,
            reference_id: data.id,
            reference_type: "expense",
            notes: `${body.category}: ${body.description || ""}`,
            transaction_date: body.expense_date || new Date().toISOString().split("T")[0],
          });
        }

        return new Response(JSON.stringify({ expense: data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "PUT") {
        const body = await req.json();
        const { id, ...updates } = body;
        const { data, error } = await supabase
          .from("shop_expenses")
          .update(updates)
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ expense: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "DELETE") {
        const { id } = await req.json();
        
        // Fetch expense data before deleting
        const { data: expense, error: fetchError } = await supabase
          .from("shop_expenses")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (fetchError || !expense) {
          return new Response(JSON.stringify({ error: "Expense not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Save to trash before deleting
        const { error: trashError } = await supabase.from("shop_trash").insert({
          user_id: userId,
          shop_id: shopId || null,
          original_table: "shop_expenses",
          original_id: id,
          data: expense,
        });
        if (trashError) throw trashError;

        // Delete related cash transaction
        await supabase
          .from("shop_cash_transactions")
          .delete()
          .eq("reference_id", id)
          .eq("reference_type", "expense")
          .eq("user_id", userId);

        // Delete the expense
        const { error } = await supabase
          .from("shop_expenses")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) throw error;
        
        console.log(`Expense ${id} moved to trash`);
        
        return new Response(JSON.stringify({ message: "Expense deleted and moved to trash" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== STOCK ADJUSTMENTS =====
    if (resource === "adjustments") {
      if (req.method === "GET") {
        const productId = url.searchParams.get("productId");
        const type = url.searchParams.get("type");
        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");

        let query = supabase
          .from("shop_stock_adjustments")
          .select("*")
          .eq("user_id", userId)
          .order("adjustment_date", { ascending: false });
        
        if (shopId) query = query.eq("shop_id", shopId);
        if (productId) query = query.eq("product_id", productId);
        if (type) query = query.eq("type", type);
        if (startDate) query = query.gte("adjustment_date", startDate);
        if (endDate) query = query.lte("adjustment_date", endDate);

        const { data, error } = await query;
        if (error) throw error;
        return new Response(JSON.stringify({ adjustments: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const body = await req.json();
        
        // Get product info for cost calculation
        let costImpact = 0;
        if (body.product_id) {
          const { data: product } = await supabase
            .from("shop_products")
            .select("purchase_price, stock_quantity")
            .eq("id", body.product_id)
            .single();

          if (product) {
            costImpact = product.purchase_price * body.quantity;
            
            // Update stock based on adjustment type
            const isIncrease = ["manual_increase", "return"].includes(body.type);
            const newStock = isIncrease
              ? product.stock_quantity + body.quantity
              : Math.max(0, product.stock_quantity - body.quantity);

            await supabase
              .from("shop_products")
              .update({ stock_quantity: newStock })
              .eq("id", body.product_id);
          }
        }

        const { data, error } = await supabase
          .from("shop_stock_adjustments")
          .insert({ ...body, user_id: userId, cost_impact: costImpact })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ adjustment: data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // DELETE adjustments (single or bulk)
      if (req.method === "DELETE") {
        const { ids } = await req.json();
        const idsToDelete = Array.isArray(ids) ? ids : [ids];
        
        if (idsToDelete.length === 0) {
          return new Response(JSON.stringify({ error: "No IDs provided" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get adjustments to delete
        const { data: adjustmentsToDelete } = await supabase
          .from("shop_stock_adjustments")
          .select("*")
          .eq("user_id", userId)
          .in("id", idsToDelete);

        const deletedIds: string[] = [];

        for (const adjustment of adjustmentsToDelete || []) {
          // Move to trash
          await supabase.from("shop_trash").insert({
            user_id: userId,
            shop_id: shopId || null,
            original_table: "shop_stock_adjustments",
            original_id: adjustment.id,
            data: adjustment,
          });

          // Delete from adjustments table
          const { error } = await supabase
            .from("shop_stock_adjustments")
            .delete()
            .eq("id", adjustment.id)
            .eq("user_id", userId);

          if (!error) {
            deletedIds.push(adjustment.id);

            // Optionally restore stock if it was a decrease adjustment
            if (adjustment.product_id) {
              const { data: product } = await supabase
                .from("shop_products")
                .select("stock_quantity")
                .eq("id", adjustment.product_id)
                .single();

              if (product) {
                const isIncrease = ["manual_increase", "return"].includes(adjustment.type);
                // Reverse the adjustment
                const restoredStock = isIncrease
                  ? Math.max(0, product.stock_quantity - adjustment.quantity)
                  : product.stock_quantity + adjustment.quantity;

                await supabase
                  .from("shop_products")
                  .update({ stock_quantity: restoredStock })
                  .eq("id", adjustment.product_id);
              }
            }
          }
        }

        return new Response(JSON.stringify({ deleted: deletedIds }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== CASH TRANSACTIONS =====
    if (resource === "cash") {
      if (req.method === "GET") {
        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");
        const source = url.searchParams.get("source");

        let query = supabase
          .from("shop_cash_transactions")
          .select("*")
          .eq("user_id", userId)
          .order("transaction_date", { ascending: false });
        
        if (shopId) query = query.eq("shop_id", shopId);
        if (startDate) query = query.gte("transaction_date", startDate);
        if (endDate) query = query.lte("transaction_date", endDate + "T23:59:59");
        if (source) query = query.eq("source", source);

        const { data, error } = await query;
        if (error) throw error;

        // Calculate balance for this shop
        let balanceQuery = supabase
          .from("shop_cash_transactions")
          .select("type, amount")
          .eq("user_id", userId);
        if (shopId) balanceQuery = balanceQuery.eq("shop_id", shopId);
        const { data: allTransactions } = await balanceQuery;

        const cashIn = (allTransactions || []).filter(t => t.type === "in").reduce((sum, t) => sum + Number(t.amount), 0);
        const cashOut = (allTransactions || []).filter(t => t.type === "out").reduce((sum, t) => sum + Number(t.amount), 0);
        const balance = cashIn - cashOut;

        return new Response(JSON.stringify({ transactions: data, balance, cashIn, cashOut }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase
          .from("shop_cash_transactions")
          .insert({ ...body, user_id: userId, shop_id: shopId })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ transaction: data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== STAFF USERS =====
    if (resource === "staff") {
      if (req.method === "GET") {
        let query = supabase
          .from("shop_staff_users")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (shopId) query = query.eq("shop_id", shopId);
        const { data, error } = await query;

        if (error) throw error;
        return new Response(JSON.stringify({ staff: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase
          .from("shop_staff_users")
          .insert({ ...body, user_id: userId, shop_id: shopId })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ staffUser: data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "PUT") {
        const body = await req.json();
        const { id, ...updates } = body;
        const { data, error } = await supabase
          .from("shop_staff_users")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ staffUser: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "DELETE") {
        const { id } = await req.json();
        
        // Fetch staff data before deleting
        const { data: staffUser, error: fetchError } = await supabase
          .from("shop_staff_users")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (fetchError || !staffUser) {
          return new Response(JSON.stringify({ error: "Staff not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Save to trash before deleting
        const { error: trashError } = await supabase.from("shop_trash").insert({
          user_id: userId,
          shop_id: shopId || null,
          original_table: "shop_staff_users",
          original_id: id,
          data: staffUser,
        });
        if (trashError) throw trashError;

        // Delete the staff user
        const { error } = await supabase
          .from("shop_staff_users")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) throw error;
        
        console.log(`Staff ${id} moved to trash`);
        
        return new Response(JSON.stringify({ message: "Staff deleted and moved to trash" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== SHOP SETTINGS =====
    if (resource === "settings") {
      // Explicitly list columns to avoid schema cache issues - using compact single line
      const settingsColumns = "id,user_id,shop_id,shop_name,shop_address,shop_phone,shop_email,logo_url,currency,tax_rate,invoice_prefix,invoice_footer,created_at,updated_at,default_tax_rate,enable_online_sync,opening_date,opening_cash_balance,data_retention_days,trash_passcode_hash,terms_and_conditions,invoice_format,due_reminder_sms_template,sms_api_key,sms_sender_id,use_platform_sms,scanner_config,scanner_last_connected_at,scanner_total_scans,branch_name,receipt_size,receipt_font_size,show_logo_on_receipt,thank_you_message,show_tax_on_receipt,show_payment_method,receipt_header_text,receipt_footer_text";
      
      if (req.method === "GET") {
        // Get settings for specific shop or user default
        let query = supabase
          .from("shop_settings")
          .select(settingsColumns)
          .eq("user_id", userId);
        
        if (shopId) {
          query = query.eq("shop_id", shopId);
        }
        
        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        
        // If no shop-specific settings exist but shopId is provided, get shop info
        let settingsData: Record<string, any> | null = data;
        if (!data && shopId) {
          const { data: shopData } = await supabase
            .from("shops")
            .select("name, address, phone, email, logo_url")
            .eq("id", shopId)
            .single();
          
          if (shopData) {
            settingsData = {
              shop_name: shopData.name,
              shop_address: shopData.address,
              shop_phone: shopData.phone,
              shop_email: shopData.email,
              logo_url: shopData.logo_url,
            };
          }
        }
        
        // Don't expose the actual hash, just indicate if passcode is set
        const settingsResponse = settingsData ? {
          ...settingsData,
          trash_passcode_hash: undefined,
          has_trash_passcode: !!(data?.trash_passcode_hash),
        } : null;
        return new Response(JSON.stringify({ settings: settingsResponse }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "POST" || req.method === "PUT") {
        const body = await req.json();
        
        // Don't allow setting trash_passcode_hash through regular settings update
        delete body.trash_passcode_hash;
        
        // Build query based on shopId
        let existingQuery = supabase
          .from("shop_settings")
          .select("id")
          .eq("user_id", userId);
        
        if (shopId) {
          existingQuery = existingQuery.eq("shop_id", shopId);
        }
        
        const { data: existing } = await existingQuery.maybeSingle();

        let data, error;
        if (existing) {
          let updateQuery = supabase
            .from("shop_settings")
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq("user_id", userId);
          
          if (shopId) {
            updateQuery = updateQuery.eq("shop_id", shopId);
          }
          
          ({ data, error } = await updateQuery.select(settingsColumns).single());
        } else {
        ({ data, error } = await supabase
            .from("shop_settings")
            .insert({ ...body, user_id: userId, shop_id: shopId })
            .select(settingsColumns)
            .single());
        }

        if (error) throw error;
        
        // Also update shop basic info if provided
        if (shopId && (body.shop_name || body.shop_address || body.shop_phone || body.shop_email || body.logo_url !== undefined)) {
          const shopUpdates: Record<string, any> = {};
          if (body.shop_name) shopUpdates.name = body.shop_name;
          if (body.shop_address !== undefined) shopUpdates.address = body.shop_address;
          if (body.shop_phone !== undefined) shopUpdates.phone = body.shop_phone;
          if (body.shop_email !== undefined) shopUpdates.email = body.shop_email;
          if (body.logo_url !== undefined) shopUpdates.logo_url = body.logo_url;
          
          if (Object.keys(shopUpdates).length > 0) {
            await supabase
              .from("shops")
              .update({ ...shopUpdates, updated_at: new Date().toISOString() })
              .eq("id", shopId)
              .eq("user_id", userId);
          }
        }
        
        const settingsResponse = data ? {
          ...data,
          trash_passcode_hash: undefined,
          has_trash_passcode: !!data.trash_passcode_hash,
        } : null;
        return new Response(JSON.stringify({ settings: settingsResponse }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== SMS USAGE =====
    if (resource === "sms-usage") {
      if (req.method === "GET") {
        try {
          // Get user's subscription plan
          const { data: userData } = await supabase
            .from("users")
            .select("subscription_plan")
            .eq("id", userId)
            .single();

          const plan = userData?.subscription_plan || "none";

          // Get site settings for SMS limits
          const { data: siteSettings } = await supabase
            .from("site_settings")
            .select("platform_sms_enabled, sms_limit_trial, sms_limit_starter, sms_limit_professional, sms_limit_business, sms_limit_lifetime")
            .limit(1)
            .single();

          // Determine daily limit based on plan
          let dailyLimit = 0;
          switch (plan) {
            case "trial":
            case "none":
              dailyLimit = siteSettings?.sms_limit_trial ?? 0;
              break;
            case "starter":
              dailyLimit = siteSettings?.sms_limit_starter ?? 50;
              break;
            case "professional":
              dailyLimit = siteSettings?.sms_limit_professional ?? 200;
              break;
            case "business":
              dailyLimit = siteSettings?.sms_limit_business ?? 1000;
              break;
            case "lifetime":
              dailyLimit = siteSettings?.sms_limit_lifetime ?? -1;
              break;
            default:
              dailyLimit = 0;
          }

          const isUnlimited = dailyLimit === -1;
          const platformSmsEnabled = siteSettings?.platform_sms_enabled ?? false;

          // Get today's SMS usage
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayStr = today.toISOString();

          const { data: usageLogs } = await supabase
            .from("sms_usage_logs")
            .select("sms_count")
            .eq("user_id", userId)
            .gte("sent_at", todayStr);

          const usedToday = (usageLogs || []).reduce((sum, log) => sum + (log.sms_count || 1), 0);
          const remainingToday = isUnlimited ? Infinity : Math.max(0, dailyLimit - usedToday);
          const canSendSms = platformSmsEnabled && (dailyLimit !== 0) && (isUnlimited || usedToday < dailyLimit);

          return new Response(JSON.stringify({
            usedToday,
            dailyLimit,
            isUnlimited,
            platformSmsEnabled,
            canSendSms,
            remainingToday: isUnlimited ? -1 : remainingToday,
            planId: plan,
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error fetching SMS usage:", error);
          return new Response(JSON.stringify({
            usedToday: 0,
            dailyLimit: 0,
            isUnlimited: false,
            platformSmsEnabled: false,
            canSendSms: false,
            remainingToday: 0,
            planId: "none",
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // ===== TRASH PASSCODE =====
    if (resource === "trash-passcode") {
      // Set passcode (only if not already set)
      if (req.method === "POST") {
        const { passcode } = await req.json();
        
        if (!passcode || passcode.length < 4) {
          return new Response(JSON.stringify({ error: "Passcode must be at least 4 characters" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if passcode already exists
        const { data: existing } = await supabase
          .from("shop_settings")
          .select("id, trash_passcode_hash")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing?.trash_passcode_hash) {
          return new Response(JSON.stringify({ 
            error: "Passcode already set. Contact admin to reset." 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Hash the passcode (simple base64 for now - in production use proper hashing)
        const encoder = new TextEncoder();
        const data = encoder.encode(passcode);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        // Save or update settings with passcode
        if (existing) {
          await supabase
            .from("shop_settings")
            .update({ 
              trash_passcode_hash: hashHex,
              updated_at: new Date().toISOString() 
            })
            .eq("user_id", userId);
        } else {
          await supabase
            .from("shop_settings")
            .insert({ 
              user_id: userId,
              trash_passcode_hash: hashHex,
            });
        }

        return new Response(JSON.stringify({ success: true, message: "Passcode set successfully" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify passcode
      if (req.method === "PUT") {
        const { passcode } = await req.json();
        
        if (!passcode) {
          return new Response(JSON.stringify({ error: "Passcode required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: settings } = await supabase
          .from("shop_settings")
          .select("trash_passcode_hash")
          .eq("user_id", userId)
          .maybeSingle();

        if (!settings?.trash_passcode_hash) {
          return new Response(JSON.stringify({ error: "No passcode set" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Hash the provided passcode and compare
        const encoder = new TextEncoder();
        const data = encoder.encode(passcode);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        if (hashHex !== settings.trash_passcode_hash) {
          return new Response(JSON.stringify({ valid: false, error: "Invalid passcode" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ valid: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== REPORTS =====
    if (resource === "reports") {
      const reportType = url.searchParams.get("type") || "sales";
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");

      if (reportType === "sales") {
        let query = supabase
          .from("shop_sales")
          .select(`
            *,
            customer:shop_customers(name, phone),
            items:shop_sale_items(product_name, quantity, unit_price, total, profit)
          `)
          .eq("user_id", userId)
          .order("sale_date", { ascending: false });

        if (startDate) query = query.gte("sale_date", startDate);
        if (endDate) query = query.lte("sale_date", endDate + "T23:59:59");

        const { data, error } = await query;
        if (error) throw error;

        const totalSales = (data || []).reduce((sum, s) => sum + Number(s.total), 0);
        const totalProfit = (data || []).reduce((sum, s) => sum + Number(s.total_profit || 0), 0);
        const totalDue = (data || []).reduce((sum, s) => sum + Number(s.due_amount || 0), 0);

        return new Response(JSON.stringify({
          sales: data,
          summary: { totalSales, totalProfit, totalDue, count: data?.length || 0 }
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (reportType === "purchases") {
        let query = supabase
          .from("shop_purchases")
          .select(`
            *,
            supplier:shop_suppliers(name, phone),
            items:shop_purchase_items(product_name, quantity, unit_price, total)
          `)
          .eq("user_id", userId)
          .order("purchase_date", { ascending: false });

        if (startDate) query = query.gte("purchase_date", startDate);
        if (endDate) query = query.lte("purchase_date", endDate + "T23:59:59");

        const { data, error } = await query;
        if (error) throw error;

        const totalPurchases = (data || []).reduce((sum, p) => sum + Number(p.total_amount), 0);
        const totalDue = (data || []).reduce((sum, p) => sum + Number(p.due_amount || 0), 0);

        return new Response(JSON.stringify({
          purchases: data,
          summary: { totalPurchases, totalDue, count: data?.length || 0 }
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (reportType === "expenses") {
        let query = supabase
          .from("shop_expenses")
          .select("*")
          .eq("user_id", userId)
          .order("expense_date", { ascending: false });

        if (startDate) query = query.gte("expense_date", startDate);
        if (endDate) query = query.lte("expense_date", endDate);

        const { data, error } = await query;
        if (error) throw error;

        const totalExpenses = (data || []).reduce((sum, e) => sum + Number(e.amount), 0);
        const byCategory: Record<string, number> = {};
        (data || []).forEach((e) => {
          byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
        });

        return new Response(JSON.stringify({
          expenses: data,
          summary: { totalExpenses, byCategory, count: data?.length || 0 }
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (reportType === "inventory") {
        const { data, error } = await supabase
          .from("shop_products")
          .select(`*, category:shop_categories(name)`)
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("name");

        if (error) throw error;

        const totalValue = (data || []).reduce((sum, p) => 
          sum + Number(p.purchase_price) * p.stock_quantity, 0);
        const lowStock = (data || []).filter(p => p.stock_quantity <= p.min_stock_alert);

        return new Response(JSON.stringify({
          products: data,
          summary: { totalProducts: data?.length || 0, totalValue, lowStockCount: lowStock.length }
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (reportType === "customers") {
        const { data, error } = await supabase
          .from("shop_customers")
          .select("*")
          .eq("user_id", userId)
          .order("total_purchases", { ascending: false });

        if (error) throw error;

        const totalDue = (data || []).reduce((sum, c) => sum + Number(c.total_due || 0), 0);
        const totalPurchases = (data || []).reduce((sum, c) => sum + Number(c.total_purchases || 0), 0);

        return new Response(JSON.stringify({
          customers: data,
          summary: { totalCustomers: data?.length || 0, totalDue, totalPurchases }
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (reportType === "products") {
        // Product performance report
        const { data: saleItems, error } = await supabase
          .from("shop_sale_items")
          .select(`
            product_id,
            product_name,
            quantity,
            total,
            profit,
            sale:shop_sales!inner(user_id, sale_date)
          `)
          .eq("sale.user_id", userId);

        if (error) throw error;

        // Aggregate by product
        const productMap: Record<string, { name: string; quantity: number; revenue: number; profit: number }> = {};
        (saleItems || []).forEach((item) => {
          const key = item.product_id || item.product_name;
          if (!productMap[key]) {
            productMap[key] = { name: item.product_name, quantity: 0, revenue: 0, profit: 0 };
          }
          productMap[key].quantity += item.quantity;
          productMap[key].revenue += Number(item.total);
          productMap[key].profit += Number(item.profit || 0);
        });

        const products = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

        return new Response(JSON.stringify({
          products,
          summary: { 
            totalProducts: products.length,
            totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
            totalProfit: products.reduce((sum, p) => sum + p.profit, 0)
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== IMPORT PRODUCTS =====
    if (resource === "import-products" && req.method === "POST") {
      const { products } = await req.json();
      const results = { success: 0, failed: 0, errors: [] as string[], suppliersCreated: 0 };

      // Validate shop_id is provided
      if (!shopId) {
        return new Response(JSON.stringify({ error: "Shop ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get existing categories for this user and shop
      let categoriesQuery = supabase
        .from("shop_categories")
        .select("id, name")
        .eq("user_id", userId);
      if (shopId) categoriesQuery = categoriesQuery.eq("shop_id", shopId);
      const { data: existingCategories } = await categoriesQuery;

      const categoryMap = new Map<string, string>();
      (existingCategories || []).forEach((cat) => {
        categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
      });

      // Get existing suppliers for this user and shop
      let suppliersQuery = supabase
        .from("shop_suppliers")
        .select("id, name, phone")
        .eq("user_id", userId);
      if (shopId) suppliersQuery = suppliersQuery.eq("shop_id", shopId);
      const { data: existingSuppliers } = await suppliersQuery;

      const supplierMap = new Map<string, string>();
      (existingSuppliers || []).forEach((sup) => {
        supplierMap.set(sup.name.toLowerCase().trim(), sup.id);
      });

      for (const product of products) {
        let categoryId = null;

        // If product has a category name, find or create it
        if (product.category && product.category.toString().trim()) {
          const categoryName = product.category.toString().trim();
          const categoryKey = categoryName.toLowerCase();

          if (categoryMap.has(categoryKey)) {
            categoryId = categoryMap.get(categoryKey);
          } else {
            // Create new category
            const { data: newCategory, error: catError } = await supabase
              .from("shop_categories")
              .insert({ name: categoryName, user_id: userId, shop_id: shopId })
              .select()
              .single();

            if (newCategory && !catError) {
              categoryId = newCategory.id;
              categoryMap.set(categoryKey, newCategory.id);
            }
          }
        }

        // If product has a supplier name, find or create it
        if (product.supplier_name && product.supplier_name.toString().trim()) {
          const supplierName = product.supplier_name.toString().trim();
          const supplierKey = supplierName.toLowerCase();

          if (!supplierMap.has(supplierKey)) {
            // Create new supplier
            const { data: newSupplier, error: supError } = await supabase
              .from("shop_suppliers")
              .insert({ 
                name: supplierName, 
                user_id: userId,
                shop_id: shopId,
                phone: product.supplier_contact || null,
              })
              .select()
              .single();

            if (newSupplier && !supError) {
              supplierMap.set(supplierKey, newSupplier.id);
              results.suppliersCreated++;
            }
          }
        }

        const { error } = await supabase
          .from("shop_products")
          .insert({
            user_id: userId,
            shop_id: shopId,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            brand: product.brand,
            category_id: categoryId,
            purchase_price: product.purchase_price || 0,
            selling_price: product.selling_price || 0,
            stock_quantity: product.stock_quantity || 0,
            min_stock_alert: product.min_stock_alert || 5,
            unit: product.unit || "pcs",
            expiry_date: product.expiry_date || null,
            supplier_name: product.supplier_name,
            supplier_contact: product.supplier_contact,
            description: product.description,
          });

        if (error) {
          results.failed++;
          results.errors.push(`${product.name}: ${error.message}`);
        } else {
          results.success++;
        }
      }

      return new Response(JSON.stringify({ results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== IMPORT PURCHASES =====
    if (resource === "import-purchases" && req.method === "POST") {
      const { purchases } = await req.json();
      const results = { success: 0, failed: 0, errors: [] as string[] };

      for (const purchase of purchases) {
        try {
          // Create the purchase record
          const totalAmount = (purchase.items || []).reduce((sum: number, item: any) => sum + (item.total || 0), 0);
          const paidAmount = purchase.paid_amount ?? totalAmount;
          const dueAmount = totalAmount - paidAmount;

          const { data: newPurchase, error: purchaseError } = await supabase
            .from("shop_purchases")
            .insert({
              user_id: userId,
              supplier_name: purchase.supplier_name || "",
              supplier_contact: purchase.supplier_contact || "",
              total_amount: totalAmount,
              paid_amount: paidAmount,
              due_amount: dueAmount,
              payment_status: dueAmount > 0 ? "partial" : "paid",
              notes: purchase.notes || "",
            })
            .select()
            .single();

          if (purchaseError) {
            results.failed++;
            results.errors.push(`Purchase: ${purchaseError.message}`);
            continue;
          }

          // Insert purchase items and update stock
          for (const item of purchase.items || []) {
            // Check if product exists, create if not
            let productId = item.product_id;

            if (!productId && item.product_name) {
              // Try to find by name
              const { data: existingProduct } = await supabase
                .from("shop_products")
                .select("id")
                .eq("user_id", userId)
                .eq("name", item.product_name)
                .maybeSingle();

              if (existingProduct) {
                productId = existingProduct.id;
              } else {
                // Create new product
                const { data: newProduct } = await supabase
                  .from("shop_products")
                  .insert({
                    user_id: userId,
                    name: item.product_name,
                    purchase_price: item.unit_price || 0,
                    selling_price: item.selling_price || item.unit_price || 0,
                    stock_quantity: 0,
                  })
                  .select()
                  .single();

                if (newProduct) {
                  productId = newProduct.id;
                }
              }
            }

            // Insert purchase item
            await supabase
              .from("shop_purchase_items")
              .insert({
                purchase_id: newPurchase.id,
                product_id: productId || null,
                product_name: item.product_name,
                quantity: item.quantity || 1,
                unit_price: item.unit_price || 0,
                total: item.total || (item.quantity || 1) * (item.unit_price || 0),
                expiry_date: item.expiry_date || null,
              });

            // Update product stock
            if (productId) {
              const { data: product } = await supabase
                .from("shop_products")
                .select("stock_quantity, purchase_price")
                .eq("id", productId)
                .single();

              if (product) {
                await supabase
                  .from("shop_products")
                  .update({
                    stock_quantity: (product.stock_quantity || 0) + (item.quantity || 1),
                    purchase_price: item.unit_price || product.purchase_price,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", productId);
              }
            }
          }

          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(error.message || "Unknown error");
        }
      }

      return new Response(JSON.stringify({ results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== DUE COLLECTION =====
    if (resource === "due-collection" && req.method === "POST") {
      const { customer_id, amount, notes, payment_method } = await req.json();

      // Update customer due
      const { data: customer } = await supabase
        .from("shop_customers")
        .select("total_due")
        .eq("id", customer_id)
        .single();

      if (customer) {
        await supabase
          .from("shop_customers")
          .update({ total_due: Math.max(0, Number(customer.total_due) - amount) })
          .eq("id", customer_id);
      }

      // Create cash transaction ONLY if payment_method is 'cash'
      let data = null;
      if (payment_method === 'cash') {
        const { data: txData, error: txError } = await supabase
          .from("shop_cash_transactions")
          .insert({
            user_id: userId,
            type: "in",
            source: "due_collection",
            amount,
            reference_id: customer_id,
            reference_type: "customer",
            notes: notes || "Due collection",
          })
          .select()
          .single();
        if (txError) throw txError;
        data = txData;
      }

      return new Response(JSON.stringify({ transaction: data, success: true }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== DUE PAYMENT (to supplier) =====
    if (resource === "due-payment" && req.method === "POST") {
      const { supplier_id, amount, notes, payment_method } = await req.json();

      // Update supplier due
      const { data: supplier } = await supabase
        .from("shop_suppliers")
        .select("total_due")
        .eq("id", supplier_id)
        .single();

      if (supplier) {
        await supabase
          .from("shop_suppliers")
          .update({ total_due: Math.max(0, Number(supplier.total_due) - amount) })
          .eq("id", supplier_id);
      }

      // Create cash transaction ONLY if payment_method is 'cash'
      let data = null;
      if (payment_method === 'cash') {
        const { data: txData, error: txError } = await supabase
          .from("shop_cash_transactions")
          .insert({
            user_id: userId,
            type: "out",
            source: "due_payment",
            amount,
            reference_id: supplier_id,
            reference_type: "supplier",
            notes: notes || "Due payment to supplier",
          })
          .select()
          .single();
        if (txError) throw txError;
        data = txData;
      }

      return new Response(JSON.stringify({ transaction: data, success: true }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== SYNC SETTINGS =====
    if (resource === "sync-settings") {
      // First check if user has permission to sync
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("can_sync_business")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user sync permission:", userError);
      }

      const canSync = userData?.can_sync_business === true;

      if (req.method === "GET") {
        const { data, error } = await supabase
          .from("sync_settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") throw error;
        
        return new Response(JSON.stringify({ 
          settings: data || { sync_enabled: false, master_inventory: "offline" },
          canSyncBusiness: canSync 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === "PUT") {
        // Check if user is allowed to sync
        if (!canSync) {
          return new Response(JSON.stringify({ 
            error: "You do not have permission to enable business sync. Please contact admin.",
            canSyncBusiness: false
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body = await req.json();
        const syncWasEnabled = body.sync_enabled === true;
        const syncIsDisabling = body.sync_enabled === false;
        
        // Get current sync settings to check if this is a fresh enable or disable
        const { data: currentSettings } = await supabase
          .from("sync_settings")
          .select("sync_enabled")
          .eq("user_id", userId)
          .maybeSingle();
        
        const wasEnabled = currentSettings?.sync_enabled === true;
        const wasDisabled = !currentSettings?.sync_enabled;
        const isNowEnabling = wasDisabled && syncWasEnabled;
        const isNowDisabling = wasEnabled && syncIsDisabling;
        
        // Upsert sync settings
        const { data, error } = await supabase
          .from("sync_settings")
          .upsert({
            user_id: userId,
            sync_enabled: body.sync_enabled ?? false,
            master_inventory: body.master_inventory ?? "offline",
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" })
          .select()
          .single();

        if (error) throw error;

        let syncStats = { offlineToOnline: 0, onlineToOffline: 0, stockUpdated: 0 };

        // If sync is being enabled for the first time, merge all products
        if (isNowEnabling) {
          console.log("Sync enabled - merging products between online and offline...");
          
          // Get all offline shop products
          const { data: offlineProducts, error: offlineErr } = await supabase
            .from("shop_products")
            .select("*")
            .eq("user_id", userId)
            .eq("is_active", true);
          
          if (offlineErr) {
            console.error("Error fetching offline products:", offlineErr);
          }
          
          // Get all online products
          const { data: onlineProducts, error: onlineErr } = await supabase
            .from("products")
            .select("*")
            .eq("user_id", userId)
            .eq("is_active", true);
          
          if (onlineErr) {
            console.error("Error fetching online products:", onlineErr);
          }
          
          console.log(`Found ${offlineProducts?.length || 0} offline products and ${onlineProducts?.length || 0} online products`);
          
          // Create maps for quick lookup - match by NAME (normalized) as primary, SKU as secondary
          const normalizeString = (str: string) => str?.toLowerCase().trim().replace(/\s+/g, ' ') || '';
          
          const onlineProductsByName = new Map<string, any>();
          const onlineProductsBySku = new Map<string, any>();
          (onlineProducts || []).forEach((p: any) => {
            onlineProductsByName.set(normalizeString(p.name), p);
            if (p.sku) onlineProductsBySku.set(p.sku.toLowerCase(), p);
          });
          
          const offlineProductsByName = new Map<string, any>();
          const offlineProductsBySku = new Map<string, any>();
          (offlineProducts || []).forEach((p: any) => {
            offlineProductsByName.set(normalizeString(p.name), p);
            if (p.sku) offlineProductsBySku.set(p.sku.toLowerCase(), p);
          });
          
          const processedOnlineIds = new Set<string>();
          
          // 1. Sync offline products to online
          for (const offlineProduct of offlineProducts || []) {
            const normalizedName = normalizeString(offlineProduct.name);
            const sku = offlineProduct.sku?.toLowerCase();
            
            // Try to find matching online product by name OR sku
            let matchingOnline = onlineProductsByName.get(normalizedName);
            if (!matchingOnline && sku) {
              matchingOnline = onlineProductsBySku.get(sku);
            }
            
            if (matchingOnline) {
              // Found a match - merge stock quantities
              processedOnlineIds.add(matchingOnline.id);
              const combinedStock = (offlineProduct.stock_quantity || 0) + (matchingOnline.stock_quantity || 0);
              
              // Use the online product's SKU as reference (or create one from name)
              const linkSku = matchingOnline.sku || offlineProduct.sku || `sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              
              const { error: updateOnlineErr } = await supabase
                .from("products")
                .update({ 
                  stock_quantity: combinedStock,
                  sku: linkSku 
                })
                .eq("id", matchingOnline.id);
              
              if (updateOnlineErr) {
                console.error("Error updating online product:", updateOnlineErr);
              }
              
              const { error: updateOfflineErr } = await supabase
                .from("shop_products")
                .update({ 
                  online_sku: linkSku,
                  stock_quantity: combinedStock,
                  sku: offlineProduct.sku || linkSku
                })
                .eq("id", offlineProduct.id);
              
              if (updateOfflineErr) {
                console.error("Error updating offline product:", updateOfflineErr);
              }
              
              if (!updateOnlineErr && !updateOfflineErr) {
                syncStats.stockUpdated++;
                console.log(`Merged product: ${offlineProduct.name}, combined stock: ${combinedStock}`);
              }
            } else {
              // No match - create new online product from offline
              const newSku = offlineProduct.sku || `sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              
              const { error: insertError } = await supabase
                .from("products")
                .insert({
                  user_id: userId,
                  name: offlineProduct.name,
                  description: offlineProduct.description,
                  price: offlineProduct.selling_price || 0,
                  sku: newSku,
                  stock_quantity: offlineProduct.stock_quantity || 0,
                  category: null,
                  brand: offlineProduct.brand,
                  image_url: offlineProduct.image_url,
                  is_active: true,
                  currency: "BDT",
                });
              
              if (insertError) {
                console.error("Error creating online product:", insertError);
              } else {
                syncStats.offlineToOnline++;
                // Update offline product with online_sku reference
                await supabase
                  .from("shop_products")
                  .update({ 
                    online_sku: newSku,
                    sku: offlineProduct.sku || newSku
                  })
                  .eq("id", offlineProduct.id);
                console.log(`Created online product from offline: ${offlineProduct.name}`);
              }
            }
          }
          
          // 2. Sync remaining online products to offline (ones not already matched)
          for (const onlineProduct of onlineProducts || []) {
            if (processedOnlineIds.has(onlineProduct.id)) continue;
            
            const normalizedName = normalizeString(onlineProduct.name);
            const sku = onlineProduct.sku?.toLowerCase();
            
            // Double check if it exists offline by name or sku
            let existsOffline = offlineProductsByName.has(normalizedName);
            if (!existsOffline && sku) {
              existsOffline = offlineProductsBySku.has(sku);
            }
            
            if (!existsOffline) {
              // Create new offline product from online
              const linkSku = onlineProduct.sku || `sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              
              const { error: insertError } = await supabase
                .from("shop_products")
                .insert({
                  user_id: userId,
                  name: onlineProduct.name,
                  description: onlineProduct.description,
                  selling_price: onlineProduct.price || 0,
                  purchase_price: 0,
                  sku: linkSku,
                  online_sku: linkSku,
                  stock_quantity: onlineProduct.stock_quantity || 0,
                  brand: onlineProduct.brand,
                  image_url: onlineProduct.image_url,
                  is_active: true,
                });
              
              if (insertError) {
                console.error("Error creating offline product:", insertError);
              } else {
                syncStats.onlineToOffline++;
                // Also update online product with SKU if it didn't have one
                if (!onlineProduct.sku) {
                  await supabase
                    .from("products")
                    .update({ sku: linkSku })
                    .eq("id", onlineProduct.id);
                }
                console.log(`Created offline product from online: ${onlineProduct.name}`);
              }
            }
          }
          
          console.log("Sync completed:", syncStats);
          
          // Log the sync event (only if sync happened)
          try {
            await supabase.from("sync_logs").insert({
              user_id: userId,
              event_type: "initial_sync",
              source: "system",
              payload: syncStats,
              status: "success",
            });
          } catch (logErr) {
            console.error("Error logging sync event:", logErr);
          }
        }

        // If sync is being DISABLED, remove products that came from the other side
        let unsyncStats = { offlineRemoved: 0, onlineRemoved: 0 };
        if (isNowDisabling) {
          console.log("Sync disabled - removing synced products...");
          
          // Find offline products that were synced FROM online (created during sync, have online_sku but no purchase history)
          // These are products that exist in offline only because of sync
          const { data: offlineProducts } = await supabase
            .from("shop_products")
            .select("id, name, online_sku, sku, created_at")
            .eq("user_id", userId)
            .not("online_sku", "is", null);
          
          // Find online products that were synced FROM offline (created during sync)
          // These have SKU starting with 'sync-' which indicates they were created during sync
          const { data: onlineProducts } = await supabase
            .from("products")
            .select("id, name, sku, created_at")
            .eq("user_id", userId)
            .like("sku", "sync-%");
          
          // Remove offline products that were created from online sync
          // (products where online_sku exists and matches their own sku - created during sync)
          for (const offlineProduct of offlineProducts || []) {
            // Check if this was a product created FROM online (sku = online_sku means it was created during sync)
            if (offlineProduct.sku === offlineProduct.online_sku && offlineProduct.sku?.startsWith("sync-")) {
              await supabase
                .from("shop_products")
                .delete()
                .eq("id", offlineProduct.id);
              unsyncStats.offlineRemoved++;
              console.log(`Removed offline product synced from online: ${offlineProduct.name}`);
            } else {
              // For other linked products, just clear the online_sku link
              await supabase
                .from("shop_products")
                .update({ online_sku: null })
                .eq("id", offlineProduct.id);
            }
          }
          
          // Remove online products that were created from offline sync (have sync- prefix)
          for (const onlineProduct of onlineProducts || []) {
            await supabase
              .from("products")
              .delete()
              .eq("id", onlineProduct.id);
            unsyncStats.onlineRemoved++;
            console.log(`Removed online product synced from offline: ${onlineProduct.name}`);
          }
          
          console.log("Unsync completed:", unsyncStats);
          
          // Log the unsync event
          try {
            await supabase.from("sync_logs").insert({
              user_id: userId,
              event_type: "sync_disabled",
              source: "system",
              payload: unsyncStats,
              status: "success",
            });
          } catch (logErr) {
            console.error("Error logging unsync event:", logErr);
          }
        }

        // Log the sync settings change
        try {
          await supabase.from("sync_logs").insert({
            user_id: userId,
            event_type: "settings_changed",
            source: "system",
            payload: { sync_enabled: data.sync_enabled, master_inventory: data.master_inventory },
            status: "success",
          });
        } catch (logErr) {
          console.error("Error logging settings change:", logErr);
        }

        return new Response(JSON.stringify({ 
          settings: data,
          syncStats: isNowEnabling ? syncStats : null,
          unsyncStats: isNowDisabling ? unsyncStats : null,
          message: isNowEnabling ? "Products synced successfully" : isNowDisabling ? "Sync disabled, linked products removed" : "Settings updated"
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== INTERNAL SYNC ENDPOINTS =====
    if (resource === "online-order-created") {
      if (req.method === "POST") {
        const body = await req.json();
        
        // Check if sync is enabled
        const { data: syncSettings } = await supabase
          .from("sync_settings")
          .select("sync_enabled")
          .eq("user_id", userId)
          .maybeSingle();

        if (!syncSettings?.sync_enabled) {
          return new Response(JSON.stringify({ message: "Sync is disabled", synced: false }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Log the event
        await supabase.from("sync_logs").insert({
          user_id: userId,
          event_type: "online_order_created",
          source: "online",
          source_id: body.order_id,
          payload: body,
          status: "pending",
        });

        // Process each item - decrease offline stock
        if (body.items && Array.isArray(body.items)) {
          for (const item of body.items) {
            if (item.sku) {
              // Find matching offline product by online_sku
              const { data: product } = await supabase
                .from("shop_products")
                .select("id, stock_quantity")
                .eq("user_id", userId)
                .eq("online_sku", item.sku)
                .maybeSingle();

              if (product) {
                // Decrease stock
                await supabase
                  .from("shop_products")
                  .update({ 
                    stock_quantity: Math.max(0, product.stock_quantity - (item.quantity || 1)),
                    updated_at: new Date().toISOString()
                  })
                  .eq("id", product.id);
              }
            }
          }
        }

        return new Response(JSON.stringify({ message: "Order synced", synced: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (resource === "offline-sale-created") {
      if (req.method === "POST") {
        const body = await req.json();
        
        // Check if sync is enabled
        const { data: syncSettings } = await supabase
          .from("sync_settings")
          .select("sync_enabled")
          .eq("user_id", userId)
          .maybeSingle();

        if (!syncSettings?.sync_enabled) {
          return new Response(JSON.stringify({ message: "Sync is disabled", synced: false }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Log the event for future processing
        await supabase.from("sync_logs").insert({
          user_id: userId,
          event_type: "offline_sale_created",
          source: "offline",
          source_id: body.sale_id,
          payload: body,
          status: "success",
        });

        return new Response(JSON.stringify({ message: "Sale logged for sync", synced: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (resource === "inventory-updated") {
      if (req.method === "POST") {
        const body = await req.json();
        
        // Log the inventory change
        await supabase.from("sync_logs").insert({
          user_id: userId,
          event_type: "inventory_updated",
          source: body.source || "manual",
          source_id: body.product_id,
          payload: body,
          status: "success",
        });

        return new Response(JSON.stringify({ message: "Inventory update logged" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== UNIFIED DASHBOARD DATA =====
    if (resource === "unified-dashboard") {
      if (req.method === "GET") {
        // Get sync status
        const { data: syncSettings } = await supabase
          .from("sync_settings")
          .select("sync_enabled")
          .eq("user_id", userId)
          .maybeSingle();

        // Get offline dashboard data
        const today = new Date().toISOString().split("T")[0];
        
        const { data: todaySales } = await supabase
          .from("shop_sales")
          .select("total, total_profit")
          .eq("user_id", userId)
          .gte("sale_date", today);

        const { count: totalProducts } = await supabase
          .from("shop_products")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_active", true);

        const { data: lowStock } = await supabase
          .from("shop_products")
          .select("id, name, stock_quantity, min_stock_alert")
          .eq("user_id", userId)
          .eq("is_active", true);

        const lowStockProducts = (lowStock || []).filter(
          (p) => p.stock_quantity <= p.min_stock_alert
        );

        const offlineTodaySales = (todaySales || []).reduce((sum, s) => sum + Number(s.total), 0);
        const offlineTodayProfit = (todaySales || []).reduce((sum, s) => sum + Number(s.total_profit || 0), 0);

        return new Response(JSON.stringify({
          syncEnabled: syncSettings?.sync_enabled || false,
          offline: {
            todaySales: offlineTodaySales,
            todayProfit: offlineTodayProfit,
            totalProducts: totalProducts || 0,
            lowStockCount: lowStockProducts.length,
          },
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== RETURNS =====
    if (resource === "returns") {
      if (req.method === "POST") {
        const { 
          sale_id, 
          items, 
          refund_amount, 
          refund_method = 'cash', 
          reason, 
          notes,
          is_resellable = false,
          loss_amount = 0,
          product_name,
          customer_id,
          customer_name,
          from_cash = true, // New parameter - whether to deduct from cash register
        } = await req.json();
        console.log("Processing return:", { sale_id, items, refund_amount, reason, is_resellable, loss_amount, from_cash });

        // Get the original sale if sale_id is provided
        let sale: any = null;
        if (sale_id) {
          const { data: saleData, error: saleError } = await supabase
            .from("shop_sales")
            .select("*, items:shop_sale_items(*)")
            .eq("id", sale_id)
            .eq("user_id", userId)
            .single();

          if (!saleError && saleData) {
            sale = saleData;
          }
        }

        // Get settings for return invoice prefix
        const { data: settings } = await supabase
          .from("shop_settings")
          .select("invoice_prefix")
          .eq("user_id", userId)
          .maybeSingle();

        const prefix = settings?.invoice_prefix || "INV";

        // Generate return invoice number
        const { count: returnCount } = await supabase
          .from("shop_stock_adjustments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("type", "return");

        const returnInvoice = `RET-${prefix}-${String((returnCount || 0) + 1).padStart(6, "0")}`;

        // Process each returned item
        let totalRefund = 0;
        const returnedItems = [];

        for (const returnItem of items) {
          let returnQuantity = returnItem.quantity || 1;
          let itemRefund = refund_amount || 0;
          let productName = product_name || "Unknown Product";

          // If we have sale data, find the original item
          if (sale && sale.items) {
            const originalItem = sale.items.find((i: any) => i.product_id === returnItem.product_id);
            if (originalItem) {
              returnQuantity = Math.min(returnItem.quantity, originalItem.quantity);
              itemRefund = returnQuantity * originalItem.unit_price;
              productName = originalItem.product_name || productName;
            }
          }
          
          totalRefund += itemRefund;

          // Only restore stock if the product is resellable
          if (is_resellable && returnItem.product_id) {
            const { data: product } = await supabase
              .from("shop_products")
              .select("stock_quantity, name")
              .eq("id", returnItem.product_id)
              .single();

            if (product) {
              await supabase
                .from("shop_products")
                .update({ 
                  stock_quantity: (product.stock_quantity || 0) + returnQuantity,
                  updated_at: new Date().toISOString()
                })
                .eq("id", returnItem.product_id);

              productName = product.name || productName;
              console.log(`Stock restored: +${returnQuantity} for product ${returnItem.product_id}`);
            }
          }

          // Create stock adjustment record for return (regardless of resellable status)
          if (returnItem.product_id) {
            const { data: product } = await supabase
              .from("shop_products")
              .select("name")
              .eq("id", returnItem.product_id)
              .single();

            await supabase.from("shop_stock_adjustments").insert({
              user_id: userId,
              product_id: returnItem.product_id,
              product_name: product?.name || productName,
              type: is_resellable ? "return" : "damage",
              quantity: is_resellable ? returnQuantity : 0, // Only count if resellable
              reason: reason || "Customer return",
              notes: `${is_resellable ? 'Resellable return' : 'Damaged/Not resellable'}. ${sale ? `From sale ${sale.invoice_number}` : ''}. ${notes || ""}`,
              cost_impact: is_resellable ? 0 : -(loss_amount || itemRefund), // Loss if damaged
            });
          }

          returnedItems.push({
            product_name: productName,
            quantity: returnQuantity,
            refund: itemRefund,
            is_resellable,
          });
        }

        // Use provided refund amount or calculated total
        const finalRefund = refund_amount || totalRefund;
        const finalLoss = loss_amount || (is_resellable ? 0 : finalRefund);

        // Create cash out transaction for refund (only if from_cash is true)
        const amountToDeduct = is_resellable ? finalRefund : finalLoss;
        if (from_cash && amountToDeduct > 0) {
          await supabase.from("shop_cash_transactions").insert({
            user_id: userId,
            shop_id: shopId,
            type: "out",
            source: "return",
            amount: amountToDeduct,
            reference_id: sale_id || null,
            reference_type: "return",
            notes: is_resellable 
              ? `Refund (resellable) for ${sale?.invoice_number || 'manual return'}. ${reason || ""}`
              : `Loss (damaged - ৳${finalLoss}) for ${sale?.invoice_number || 'manual return'}. ${reason || ""}`,
            transaction_date: new Date().toISOString().split("T")[0],
          });
          console.log(`Cash out created: ৳${amountToDeduct} for return (from_cash: ${from_cash})`);
        }

        // Adjust sale profit if there's a loss
        if (sale_id && finalLoss > 0) {
          const { data: saleForProfit } = await supabase
            .from("shop_sales")
            .select("total_profit")
            .eq("id", sale_id)
            .eq("user_id", userId)
            .single();

          if (saleForProfit) {
            await supabase
              .from("shop_sales")
              .update({
                total_profit: Math.max(0, (saleForProfit.total_profit || 0) - finalLoss),
                updated_at: new Date().toISOString(),
              })
              .eq("id", sale_id)
              .eq("user_id", userId);
            console.log(`Profit adjusted: -৳${finalLoss} for sale ${sale_id}`);
          }
        }

        // Also insert into shop_returns table for tracking
        const { error: returnInsertError } = await supabase.from("shop_returns").insert({
          user_id: userId,
          shop_id: shopId,
          product_id: items[0]?.product_id || null,
          product_name: returnedItems[0]?.product_name || product_name || "Unknown",
          customer_id: customer_id || null,
          customer_name: customer_name || null,
          quantity: items[0]?.quantity || 1,
          return_reason: reason || "Customer return",
          return_date: new Date().toISOString().split("T")[0],
          refund_amount: finalRefund,
          notes: from_cash ? `[From Cash] ${notes || ''}`.trim() : (notes || null),
          status: "processed",
          original_sale_id: sale_id || null,
          is_resellable,
          loss_amount: finalLoss,
          stock_restored: is_resellable,
        });

        if (returnInsertError) {
          console.error("Failed to insert return record:", returnInsertError);
        }

        const message = is_resellable 
          ? `Return created. Stock restored (+${items[0]?.quantity || 1}). Refund: ৳${finalRefund}`
          : `Return created. Loss: ৳${finalLoss}. Refund: ৳${finalRefund}`;

        console.log("Return processed successfully:", { returnInvoice, finalRefund, finalLoss, is_resellable, returnedItems });

        return new Response(JSON.stringify({
          success: true,
          return_invoice: returnInvoice,
          refund_amount: finalRefund,
          loss_amount: finalLoss,
          is_resellable,
          returned_items: returnedItems,
          original_sale: sale?.invoice_number || null,
          message,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET returns history
      if (req.method === "GET") {
        const { data: returns } = await supabase
          .from("shop_returns")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        return new Response(JSON.stringify({ returns: returns || [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // DELETE return - move to trash
      if (req.method === "DELETE") {
        const body = await req.json().catch(() => ({}));
        const { id } = body as { id?: string };

        if (!id) {
          return new Response(JSON.stringify({ error: "Return ID is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get the return data first
        const { data: returnData, error: fetchError } = await supabase
          .from("shop_returns")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (fetchError || !returnData) {
          console.error("Fetch return for delete error:", fetchError);
          return new Response(JSON.stringify({ error: "Return not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Insert into trash
        const { error: trashError } = await supabase
          .from("shop_trash")
          .insert({
            user_id: userId,
            shop_id: shopId || null,
            original_id: id,
            original_table: "shop_returns",
            data: returnData,
          });

        if (trashError) {
          console.error("Insert to trash error:", trashError);
          return new Response(JSON.stringify({ error: "Failed to move to trash" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete from shop_returns table
        const { error: deleteError } = await supabase
          .from("shop_returns")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (deleteError) {
          console.error("Delete return error:", deleteError);
          return new Response(JSON.stringify({ error: "Failed to delete return" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Return ${id} moved to trash`);
        return new Response(JSON.stringify({ message: "Return moved to trash" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== TRASH BIN =====
    if (resource === "trash") {
      if (req.method === "GET") {
        const table = url.searchParams.get("table");
        
        let query = supabase
          .from("shop_trash")
          .select("*")
          .eq("user_id", userId)
          .is("restored_at", null)
          .is("permanently_deleted_at", null)
          .order("deleted_at", { ascending: false });

        // Filter by shop_id if provided
        if (shopId) {
          query = query.eq("shop_id", shopId);
        }

        if (table) query = query.eq("original_table", table);

        const { data, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({ trash: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Restore from trash / permanent delete (passcode-protected)
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({} as any));
        const id = body.id as string | undefined;
        const ids = (Array.isArray(body.ids) ? body.ids : undefined) as string[] | undefined;
        const action = body.action as string | undefined;
        const passcode = body.passcode as string | undefined;

        if (action === "restore") {
          const { data: trashItem, error: fetchError } = await supabase
            .from("shop_trash")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

          if (fetchError || !trashItem) {
            return new Response(JSON.stringify({ error: "Trash item not found" }), {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const { original_table, original_id, data: originalData } = trashItem;
          console.log(`Restoring ${original_table} with id ${original_id}`);

          try {
            // ===== RESTORE PRODUCTS =====
            if (original_table === "shop_products") {
              const productData = { ...originalData };
              delete productData.category; // Remove joined data
              
              const { error: restoreError } = await supabase
                .from("shop_products")
                .insert(productData);

              if (restoreError) throw restoreError;
              console.log(`Product ${original_id} restored`);
            }

            // ===== RESTORE CUSTOMERS =====
            if (original_table === "shop_customers") {
              const { error: restoreError } = await supabase
                .from("shop_customers")
                .insert(originalData);

              if (restoreError) throw restoreError;

              // Re-link sales to customer
              await supabase
                .from("shop_sales")
                .update({ customer_id: original_id })
                .eq("user_id", userId)
                .is("customer_id", null);

              console.log(`Customer ${original_id} restored`);
            }

            // ===== RESTORE SUPPLIERS =====
            if (original_table === "shop_suppliers") {
              const { error: restoreError } = await supabase
                .from("shop_suppliers")
                .insert(originalData);

              if (restoreError) throw restoreError;

              // Re-link purchases to supplier
              await supabase
                .from("shop_purchases")
                .update({ supplier_id: original_id })
                .eq("user_id", userId)
                .is("supplier_id", null);

              console.log(`Supplier ${original_id} restored`);
            }

            // ===== RESTORE SALES =====
            if (original_table === "shop_sales") {
              const saleData = { ...originalData };
              const saleItems = saleData.items || [];
              delete saleData.items;
              delete saleData.customer; // Remove joined data

              const { data: restoredSale, error: restoreError } = await supabase
                .from("shop_sales")
                .insert(saleData)
                .select()
                .single();

              if (restoreError) throw restoreError;

              // Restore sale items
              for (const item of saleItems) {
                const itemData = { ...item };
                itemData.sale_id = restoredSale.id;
                delete itemData.id; // Generate new id
                
                await supabase.from("shop_sale_items").insert(itemData);

                // Deduct stock again
                if (item.product_id) {
                  const { data: product } = await supabase
                    .from("shop_products")
                    .select("stock_quantity")
                    .eq("id", item.product_id)
                    .maybeSingle();

                  if (product) {
                    await supabase
                      .from("shop_products")
                      .update({
                        stock_quantity: Math.max(0, product.stock_quantity - item.quantity),
                      })
                      .eq("id", item.product_id);
                  }
                }
              }

              // Restore customer totals
              if (saleData.customer_id) {
                const { data: customer } = await supabase
                  .from("shop_customers")
                  .select("total_purchases, total_due")
                  .eq("id", saleData.customer_id)
                  .maybeSingle();

                if (customer) {
                  await supabase
                    .from("shop_customers")
                    .update({
                      total_purchases: Number(customer.total_purchases) + Number(saleData.total),
                      total_due: Number(customer.total_due) + Number(saleData.due_amount || 0),
                    })
                    .eq("id", saleData.customer_id);
                }
              }

              // Restore cash transaction
              if (saleData.paid_amount > 0) {
                await supabase.from("shop_cash_transactions").insert({
                  user_id: userId,
                  type: "in",
                  source: "sale",
                  amount: saleData.paid_amount,
                  reference_id: restoredSale.id,
                  reference_type: "sale",
                  notes: `Restored sale ${saleData.invoice_number}`,
                });
              }

              console.log(`Sale ${original_id} restored with ${saleItems.length} items`);
            }

            // ===== RESTORE PURCHASES =====
            if (original_table === "shop_purchases") {
              const purchaseData = originalData.purchase || originalData;
              const purchaseItems = originalData.items || purchaseData.items || [];
              delete purchaseData.items;
              delete purchaseData.supplier; // Remove joined data

              const { data: restoredPurchase, error: restoreError } = await supabase
                .from("shop_purchases")
                .insert(purchaseData)
                .select()
                .single();

              if (restoreError) throw restoreError;

              // Restore purchase items
              for (const item of purchaseItems) {
                const itemData = { ...item };
                itemData.purchase_id = restoredPurchase.id;
                delete itemData.id; // Generate new id
                
                await supabase.from("shop_purchase_items").insert(itemData);

                // Add stock back
                if (item.product_id) {
                  const { data: product } = await supabase
                    .from("shop_products")
                    .select("stock_quantity")
                    .eq("id", item.product_id)
                    .maybeSingle();

                  if (product) {
                    await supabase
                      .from("shop_products")
                      .update({
                        stock_quantity: product.stock_quantity + item.quantity,
                      })
                      .eq("id", item.product_id);
                  }
                }
              }

              // Restore supplier totals
              if (purchaseData.supplier_id) {
                const { data: supplier } = await supabase
                  .from("shop_suppliers")
                  .select("total_purchases, total_due")
                  .eq("id", purchaseData.supplier_id)
                  .maybeSingle();

                if (supplier) {
                  await supabase
                    .from("shop_suppliers")
                    .update({
                      total_purchases: Number(supplier.total_purchases) + Number(purchaseData.total_amount),
                      total_due: Number(supplier.total_due) + Number(purchaseData.due_amount || 0),
                    })
                    .eq("id", purchaseData.supplier_id);
                }
              }

              // Restore cash transaction
              if (purchaseData.paid_amount > 0) {
                await supabase.from("shop_cash_transactions").insert({
                  user_id: userId,
                  type: "out",
                  source: "purchase",
                  amount: purchaseData.paid_amount,
                  reference_id: restoredPurchase.id,
                  reference_type: "purchase",
                  notes: `Restored purchase from ${purchaseData.supplier_name || "Supplier"}`,
                });
              }

              console.log(`Purchase ${original_id} restored with ${purchaseItems.length} items`);
            }

            // ===== RESTORE EXPENSES =====
            if (original_table === "shop_expenses") {
              const { error: restoreError } = await supabase
                .from("shop_expenses")
                .insert(originalData);

              if (restoreError) throw restoreError;

              // Restore cash transaction
              await supabase.from("shop_cash_transactions").insert({
                user_id: userId,
                shop_id: originalData.shop_id,
                type: "out",
                source: "expense",
                amount: originalData.amount,
                reference_id: original_id,
                reference_type: "expense",
                notes: `${originalData.category}: ${originalData.description || "Restored expense"}`,
              });

              console.log(`Expense ${original_id} restored`);
            }

            // ===== RESTORE STAFF =====
            if (original_table === "shop_staff_users") {
              const { error: restoreError } = await supabase
                .from("shop_staff_users")
                .insert(originalData);

              if (restoreError) throw restoreError;
              console.log(`Staff ${original_id} restored`);
            }

            // ===== RESTORE CATEGORIES =====
            if (original_table === "shop_categories") {
              const { error: restoreError } = await supabase
                .from("shop_categories")
                .insert(originalData);

              if (restoreError) throw restoreError;
              console.log(`Category ${original_id} restored`);
            }

            // ===== RESTORE STOCK ADJUSTMENTS =====
            if (original_table === "shop_stock_adjustments") {
              const { error: restoreError } = await supabase
                .from("shop_stock_adjustments")
                .insert(originalData);

              if (restoreError) throw restoreError;

              // Re-apply stock adjustment
              if (originalData.product_id) {
                const { data: product } = await supabase
                  .from("shop_products")
                  .select("stock_quantity")
                  .eq("id", originalData.product_id)
                  .maybeSingle();

                if (product) {
                  const isIncrease = ["manual_increase", "return"].includes(originalData.type);
                  const newStock = isIncrease
                    ? product.stock_quantity + originalData.quantity
                    : Math.max(0, product.stock_quantity - originalData.quantity);

                  await supabase
                    .from("shop_products")
                    .update({ stock_quantity: newStock })
                    .eq("id", originalData.product_id);
                }
              }

              console.log(`Stock adjustment ${original_id} restored`);
            }

            // Mark as restored
            await supabase
              .from("shop_trash")
              .update({ restored_at: new Date().toISOString() })
              .eq("id", id);

            return new Response(JSON.stringify({ message: "Item restored successfully" }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          } catch (restoreErr: any) {
            console.error("Restore failed:", restoreErr);
            return new Response(JSON.stringify({ error: restoreErr.message || "Restore failed" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        if (action === "permanent_delete") {
          const targetIds: string[] = Array.isArray(ids) ? ids : id ? [id] : [];

          if (targetIds.length === 0) {
            return new Response(JSON.stringify({ error: "Missing trash item id(s)" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Check if user has passcode set
          const { data: settingsData, error: settingsError } = await supabase
            .from("shop_settings")
            .select("trash_passcode_hash")
            .eq("user_id", userId)
            .maybeSingle();

          if (settingsError) throw settingsError;

          if (settingsData?.trash_passcode_hash) {
            if (!passcode) {
              return new Response(
                JSON.stringify({
                  error: "Passcode required for instant delete",
                  requires_passcode: true,
                }),
                {
                  status: 403,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
              );
            }

            // Verify passcode
            const encoder = new TextEncoder();
            const data = encoder.encode(passcode);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

            if (hashHex !== settingsData.trash_passcode_hash) {
              return new Response(JSON.stringify({ error: "Invalid passcode", requires_passcode: true }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }

          const { data: deletedRows, error: deleteError } = await supabase
            .from("shop_trash")
            .delete()
            .in("id", targetIds)
            .eq("user_id", userId)
            .is("restored_at", null)
            .select("id");

          if (deleteError) throw deleteError;

          return new Response(
            JSON.stringify({
              message: "Item(s) permanently deleted",
              deletedCount: deletedRows?.length || 0,
              deletedIds: deletedRows?.map((r: any) => r.id) || [],
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Empty trash (backwards compatible)
      if (req.method === "DELETE") {
        let emptyQuery = supabase
          .from("shop_trash")
          .update({ permanently_deleted_at: new Date().toISOString() })
          .eq("user_id", userId)
          .is("restored_at", null)
          .is("permanently_deleted_at", null);

        // Filter by shop_id if provided
        if (shopId) {
          emptyQuery = emptyQuery.eq("shop_id", shopId);
        }

        await emptyQuery;

        return new Response(JSON.stringify({ message: "Trash emptied" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== PURCHASE PAYMENTS =====
    if (resource === "purchase-payments") {
      if (req.method === "GET") {
        const purchaseId = url.searchParams.get("purchaseId");
        
        let query = supabase
          .from("shop_purchase_payments")
          .select("*")
          .eq("user_id", userId)
          .order("payment_date", { ascending: false });

        if (purchaseId) query = query.eq("purchase_id", purchaseId);

        const { data, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({ payments: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== PRODUCT HISTORY =====
    if (resource === "product-history") {
      if (req.method === "GET") {
        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");
        
        let query = supabase
          .from("shop_product_history")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        
        if (shopId) query = query.eq("shop_id", shopId);
        if (from) query = query.gte("created_at", from);
        if (to) query = query.lte("created_at", to);
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Group by date for summary
        const groupedByDate: Record<string, { count: number; products: any[] }> = {};
        (data || []).forEach((item: any) => {
          const date = item.created_at.split("T")[0];
          if (!groupedByDate[date]) {
            groupedByDate[date] = { count: 0, products: [] };
          }
          groupedByDate[date].count += 1;
          groupedByDate[date].products.push(item);
        });
        
        const summary = Object.entries(groupedByDate)
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => b.date.localeCompare(a.date));
        
        return new Response(JSON.stringify({ history: data, summary }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "DELETE") {
        // Clear all product history
        let deleteQuery = supabase
          .from("shop_product_history")
          .delete()
          .eq("user_id", userId);
        
        if (shopId) deleteQuery = deleteQuery.eq("shop_id", shopId);
        
        const { error } = await deleteQuery;
        if (error) throw error;
        
        return new Response(JSON.stringify({ message: "Product history cleared" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== GENERATE BARCODES (for products without barcode) =====
    if (resource === "generate-barcodes") {
      if (req.method === "POST") {
        // Get all products without valid barcodes (null, empty, or "N/A")
        let query = supabase
          .from("shop_products")
          .select("id, name")
          .eq("user_id", userId);
        
        if (shopId) query = query.eq("shop_id", shopId);
        
        const { data: allProducts, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        
        // Filter products without valid barcodes
        const productsWithoutBarcode = (allProducts || []).filter(p => {
          const barcode = (p as any).barcode;
          return !barcode || barcode === "" || barcode === "N/A" || barcode.trim() === "";
        });
        
        if (productsWithoutBarcode.length === 0) {
          return new Response(JSON.stringify({ 
            message: "All products already have barcodes",
            generated: 0 
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Get count of products WITH valid barcodes (for sequence)
        const productsWithBarcode = (allProducts || []).filter(p => {
          const barcode = (p as any).barcode;
          return barcode && barcode !== "" && barcode !== "N/A" && barcode.trim() !== "";
        });
        let sequence = productsWithBarcode.length + 1;
        
        // Generate UNIQUE barcodes for each product using UUID suffix
        const updates: { id: string; barcode: string }[] = [];
        const usedBarcodes = new Set<string>();
        
        for (const product of productsWithoutBarcode) {
          let barcode: string;
          let attempts = 0;
          
          // Generate unique barcode (use product ID to ensure uniqueness)
          do {
            const uniqueSuffix = product.id.replace(/-/g, "").slice(0, 5);
            const prefix = "890";
            const shopPart = (shopId || userId).replace(/-/g, "").slice(-4).padStart(4, "0").replace(/[^0-9]/g, "0");
            const seqPart = String(sequence + attempts).padStart(5, "0");
            const baseCode = prefix + shopPart + seqPart;
            
            // Calculate EAN-13 check digit
            let sum = 0;
            for (let i = 0; i < 12; i++) {
              const digit = parseInt(baseCode[i] || "0");
              sum += digit * (i % 2 === 0 ? 1 : 3);
            }
            const checkDigit = (10 - (sum % 10)) % 10;
            barcode = baseCode + checkDigit;
            attempts++;
          } while (usedBarcodes.has(barcode) && attempts < 100);
          
          usedBarcodes.add(barcode);
          sequence++;
          updates.push({ id: product.id, barcode });
        }
        
        // Update products with new barcodes
        let updatedCount = 0;
        for (const update of updates) {
          const { error } = await supabase
            .from("shop_products")
            .update({ barcode: update.barcode, updated_at: new Date().toISOString() })
            .eq("id", update.id)
            .eq("user_id", userId);
          
          if (!error) updatedCount++;
        }
        
        return new Response(JSON.stringify({ 
          message: `Generated barcodes for ${updatedCount} products`,
          generated: updatedCount,
          total: productsWithoutBarcode.length
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== PENDING STOCK ITEMS (purchase items without product_id) =====
    if (resource === "pending-stock-items") {
      if (req.method === "GET") {
        // Get all purchase items that don't have a product_id (not yet added to stock)
        // This is much more efficient than looping through each supplier
        let query = supabase
          .from("shop_purchase_items")
          .select(`
            id,
            product_name,
            quantity,
            unit_price,
            expiry_date,
            purchase:shop_purchases!inner(
              id,
              purchase_date,
              supplier_name,
              shop_id,
              user_id
            )
          `)
          .is("product_id", null);
        
        // Filter by user and shop through the purchase relation
        const { data: items, error } = await query;
        
        if (error) throw error;
        
        // Filter by user_id and shop_id, aggregate by product name
        // Note: purchase is returned as an object (not array) when using !inner with single match
        const filtered = (items || []).filter((item: any) => {
          const purchase = item.purchase;
          if (!purchase) return false;
          if (purchase.user_id !== userId) return false;
          if (shopId && purchase.shop_id !== shopId) return false;
          return true;
        });
        
        // Aggregate by product name (case-insensitive)
        const aggregated: Record<string, any> = {};
        for (const item of filtered) {
          const key = (item.product_name || "").toLowerCase();
          const purchase = item.purchase as any;
          if (aggregated[key]) {
            aggregated[key].quantity += Number(item.quantity);
          } else {
            aggregated[key] = {
              name: item.product_name,
              quantity: Number(item.quantity),
              unit_price: Number(item.unit_price || 0),
              selling_price: Number(item.unit_price || 0) * 1.2,
              supplier_name: purchase?.supplier_name || "",
              purchase_date: purchase?.purchase_date,
              expiry_date: item.expiry_date,
              unit: "pcs",
              min_stock_alert: 5,
            };
          }
        }
        
        const pendingItems = Object.values(aggregated);
        
        return new Response(JSON.stringify({ items: pendingItems }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== STOCK BATCHES CRUD =====
    if (resource === "stock-batches") {
      if (req.method === "GET") {
        const productId = url.searchParams.get("product_id");
        
        let query = supabase
          .from("shop_stock_batches")
          .select(`
            *,
            product:shop_products(id, name, sku)
          `)
          .eq("user_id", userId)
          .order("batch_date", { ascending: true });
        
        if (shopId) query = query.eq("shop_id", shopId);
        if (productId) query = query.eq("product_id", productId);
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ batches: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "POST") {
        // Manually add stock batch (for stock adjustments)
        const body = await req.json();
        const { product_id, quantity, unit_cost, expiry_date, notes } = body;
        
        if (!product_id || !quantity || quantity <= 0) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Get current product data
        const { data: product } = await supabase
          .from("shop_products")
          .select("stock_quantity, average_cost, purchase_price")
          .eq("id", product_id)
          .eq("user_id", userId)
          .single();
        
        if (!product) {
          return new Response(JSON.stringify({ error: "Product not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const currentQty = Number(product.stock_quantity) || 0;
        const currentAvgCost = Number(product.average_cost) || Number(product.purchase_price) || 0;
        const newQty = Number(quantity);
        const newUnitCost = Number(unit_cost) || currentAvgCost;
        
        // Calculate new weighted average cost
        const newAvgCost = calculateWeightedAverageCost(
          currentQty,
          currentAvgCost,
          newQty,
          newUnitCost
        );
        
        // Create batch
        const batch = await createStockBatch(
          supabase,
          product_id,
          userId,
          shopId,
          newQty,
          newUnitCost,
          undefined,
          undefined,
          expiry_date
        );
        
        // Update product stock and average cost
        const newStock = currentQty + newQty;
        await supabase
          .from("shop_products")
          .update({
            stock_quantity: newStock,
            average_cost: newAvgCost,
            purchase_price: newUnitCost, // Update latest purchase price
          })
          .eq("id", product_id)
          .eq("user_id", userId);
        
        // Log product history
        await supabase.from("shop_product_history").insert({
          user_id: userId,
          shop_id: shopId,
          product_id: product_id,
          product_name: body.product_name || "Unknown",
          quantity_added: newQty,
          purchase_price: newUnitCost,
          action_type: 'stock_added',
        });
        
        return new Response(JSON.stringify({ 
          batch, 
          new_stock: newStock, 
          new_average_cost: newAvgCost 
        }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    // ===== MIGRATE EXISTING PRODUCTS TO BATCHES =====
    if (resource === "migrate-batches") {
      if (req.method === "POST") {
        // Migrate existing products that don't have batches
        let productsQuery = supabase
          .from("shop_products")
          .select("id, name, stock_quantity, purchase_price, expiry_date")
          .eq("user_id", userId)
          .gt("stock_quantity", 0);
        
        if (shopId) productsQuery = productsQuery.eq("shop_id", shopId);
        
        const { data: products, error: productsError } = await productsQuery;
        
        if (productsError) throw productsError;
        
        let migratedCount = 0;
        let skippedCount = 0;
        
        for (const product of products || []) {
          // Check if product already has batches
          const { count } = await supabase
            .from("shop_stock_batches")
            .select("*", { count: "exact", head: true })
            .eq("product_id", product.id);
          
          if (count && count > 0) {
            skippedCount++;
            continue;
          }
          
          // Create initial batch
          try {
            await createStockBatch(
              supabase,
              product.id,
              userId,
              shopId,
              product.stock_quantity,
              product.purchase_price || 0,
              undefined,
              undefined,
              product.expiry_date,
              true
            );
            
            // Update average_cost
            await supabase
              .from("shop_products")
              .update({ average_cost: product.purchase_price || 0 })
              .eq("id", product.id);
            
            migratedCount++;
          } catch (e) {
            console.error(`Failed to migrate product ${product.id}:`, e);
          }
        }
        
        return new Response(JSON.stringify({ 
          message: "Migration complete",
          migrated: migratedCount,
          skipped: skippedCount,
          total: products?.length || 0
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== SCANNER DEVICES =====
    if (resource === "scanner-devices") {
      if (req.method === "GET") {
        let query = supabase
          .from("shop_scanner_devices")
          .select("*")
          .eq("user_id", userId)
          .order("last_connected_at", { ascending: false, nullsFirst: false });
        
        if (shopId) query = query.eq("shop_id", shopId);
        
        const { data, error } = await query;
        if (error) throw error;
        
        return new Response(JSON.stringify({ devices: data || [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "POST") {
        const body = await req.json();
        
        // Check if device already exists (by vendor_id + product_id or device_name)
        let existingQuery = supabase
          .from("shop_scanner_devices")
          .select("*")
          .eq("user_id", userId);
        
        if (shopId) existingQuery = existingQuery.eq("shop_id", shopId);
        
        if (body.vendor_id && body.product_id) {
          existingQuery = existingQuery
            .eq("vendor_id", body.vendor_id)
            .eq("product_id", body.product_id);
        } else {
          existingQuery = existingQuery.eq("device_name", body.device_name);
        }
        
        const { data: existing } = await existingQuery.maybeSingle();
        
        if (existing) {
          // Update existing device
          const { data: updated, error } = await supabase
            .from("shop_scanner_devices")
            .update({
              is_active: true,
              last_connected_at: new Date().toISOString(),
              device_name: body.device_name || existing.device_name,
              settings: body.settings || existing.settings,
            })
            .eq("id", existing.id)
            .select()
            .single();
          
          if (error) throw error;
          
          return new Response(JSON.stringify({ device: updated, isNew: false }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Create new device
        const { data: device, error } = await supabase
          .from("shop_scanner_devices")
          .insert({
            user_id: userId,
            shop_id: shopId || null,
            device_name: body.device_name,
            device_type: body.device_type || "keyboard",
            vendor_id: body.vendor_id || null,
            product_id: body.product_id || null,
            is_active: true,
            last_connected_at: new Date().toISOString(),
            settings: body.settings || {},
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ device, isNew: true }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "PUT" || req.method === "PATCH") {
        const body = await req.json();
        const deviceId = url.searchParams.get("device_id") || body.id;
        
        if (!deviceId) {
          return new Response(JSON.stringify({ error: "Device ID required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const updateData: any = {};
        if (body.device_name !== undefined) updateData.device_name = body.device_name;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;
        if (body.settings !== undefined) updateData.settings = body.settings;
        if (body.last_connected_at !== undefined) updateData.last_connected_at = body.last_connected_at;
        if (body.total_scans !== undefined) updateData.total_scans = body.total_scans;
        if (body.avg_scan_speed !== undefined) updateData.avg_scan_speed = body.avg_scan_speed;
        
        const { data: device, error } = await supabase
          .from("shop_scanner_devices")
          .update(updateData)
          .eq("id", deviceId)
          .eq("user_id", userId)
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ device }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "DELETE") {
        const deviceId = url.searchParams.get("device_id");
        
        if (deviceId) {
          // Delete specific device
          const { error } = await supabase
            .from("shop_scanner_devices")
            .delete()
            .eq("id", deviceId)
            .eq("user_id", userId);
          
          if (error) throw error;
          
          return new Response(JSON.stringify({ message: "Device deleted" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          // Delete all inactive devices
          let deleteQuery = supabase
            .from("shop_scanner_devices")
            .delete()
            .eq("user_id", userId)
            .eq("is_active", false);
          
          if (shopId) deleteQuery = deleteQuery.eq("shop_id", shopId);
          
          const { error } = await deleteQuery;
          if (error) throw error;
          
          return new Response(JSON.stringify({ message: "Inactive devices deleted" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // ===== SCANNER LOGS =====
    if (resource === "scanner-logs") {
      if (req.method === "GET") {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const productId = url.searchParams.get("product_id");
        
        let query = supabase
          .from("shop_scanner_logs")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);
        
        if (shopId) query = query.eq("shop_id", shopId);
        if (productId) query = query.eq("product_id", productId);
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Get stats
        let statsQuery = supabase
          .from("shop_scanner_logs")
          .select("id, is_matched, scan_speed", { count: "exact" })
          .eq("user_id", userId);
        
        if (shopId) statsQuery = statsQuery.eq("shop_id", shopId);
        
        const { data: allLogs, count } = await statsQuery;
        
        const totalScans = count || 0;
        const matchedScans = (allLogs || []).filter((l: any) => l.is_matched).length;
        const avgSpeed = (allLogs || []).reduce((sum: number, l: any) => sum + (l.scan_speed || 0), 0) / Math.max(1, allLogs?.length || 1);
        
        return new Response(JSON.stringify({ 
          logs: data,
          stats: {
            totalScans,
            matchedScans,
            unmatchedScans: totalScans - matchedScans,
            avgSpeed: Math.round(avgSpeed),
            matchRate: totalScans > 0 ? Math.round((matchedScans / totalScans) * 100) : 0
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "POST") {
        const body = await req.json();
        
        const { data: log, error } = await supabase
          .from("shop_scanner_logs")
          .insert({
            user_id: userId,
            shop_id: shopId || null,
            barcode: body.barcode,
            product_id: body.product_id || null,
            product_name: body.product_name || null,
            scan_type: body.scan_type || "usb",
            is_matched: body.is_matched ?? false,
            scan_speed: body.scan_speed || null,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ log }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "DELETE") {
        // Clear all scanner logs
        let deleteQuery = supabase
          .from("shop_scanner_logs")
          .delete()
          .eq("user_id", userId);
        
        if (shopId) deleteQuery = deleteQuery.eq("shop_id", shopId);
        
        const { error } = await deleteQuery;
        if (error) throw error;
        
        return new Response(JSON.stringify({ message: "Scanner logs cleared" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== DAILY CASH REGISTER =====
    if (resource === "cash-register") {
      if (req.method === "GET") {
        const dateParam = url.searchParams.get("date");
        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");
        
        let query = supabase
          .from("shop_daily_cash_register")
          .select("*")
          .eq("user_id", userId)
          .order("register_date", { ascending: false });
        
        if (shopId) query = query.eq("shop_id", shopId);
        if (dateParam) query = query.eq("register_date", dateParam);
        if (startDate) query = query.gte("register_date", startDate);
        if (endDate) query = query.lte("register_date", endDate);
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Get today's register or the specific date
        const today = dateParam || new Date().toISOString().split("T")[0];
        let todayRegister = (data || []).find((r: any) => r.register_date === today);
        
        // If register is open, fetch LIVE data from actual transactions
        if (todayRegister && todayRegister.status === "open") {
          const todayStart = today + "T00:00:00";
          const todayEnd = today + "T23:59:59";
          
          // Get today's sales from shop_sales
          const { data: sales } = await supabase
            .from("shop_sales")
            .select("total, paid_amount, payment_method")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .gte("sale_date", todayStart)
            .lte("sale_date", todayEnd);
          
          const totalSales = (sales || []).reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);
          // Cash Sales = only product sell price (total), not what customer paid
          const totalCashSales = (sales || []).filter((s: any) => s.payment_method === "cash")
            .reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);
          
          // Get today's due collections from cash transactions
          const { data: dueCollections } = await supabase
            .from("shop_cash_transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "in")
            .eq("source", "due_collection")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd);
          
          const totalDueCollected = (dueCollections || []).reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
          
          // Get today's expenses from shop_expenses
          const { data: expenses } = await supabase
            .from("shop_expenses")
            .select("amount")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .gte("expense_date", todayStart)
            .lte("expense_date", todayEnd);
          
          const totalExpenses = (expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
          
          // Get today's withdrawals from cash transactions
          const { data: withdrawals } = await supabase
            .from("shop_cash_transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "out")
            .eq("source", "withdrawal")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd);
          
          const totalWithdrawals = (withdrawals || []).reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0);
          
          // Get today's change returns from cash transactions
          const { data: changeReturns } = await supabase
            .from("shop_cash_transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "out")
            .eq("source", "change_return")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd);
          
          const totalChangeReturns = (changeReturns || []).reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
          
          // Get today's deposits from cash transactions
          const { data: deposits } = await supabase
            .from("shop_cash_transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "in")
            .eq("source", "deposit")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd);
          
          const totalDeposits = (deposits || []).reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
          
          // Get quick expenses (temporary daily expenses)
          const { data: quickExpenses } = await supabase
            .from("shop_quick_expenses")
            .select("*")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("expense_date", today);
          
          const totalQuickExpenses = (quickExpenses || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
          
          // Get today's cash in from sales (received_amount - what customer actually paid)
          const { data: saleTransactions } = await supabase
            .from("shop_cash_transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "in")
            .eq("source", "sale")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd);
          
          const totalCashIn = (saleTransactions || []).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
          
          // Get today's purchases from cash transactions
          const { data: purchases } = await supabase
            .from("shop_cash_transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "out")
            .eq("source", "purchase")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd);
          
          const totalPurchases = (purchases || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
          
          // Get today's return refunds/losses from cash transactions
          const { data: returnTransactions } = await supabase
            .from("shop_cash_transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "out")
            .eq("source", "return")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd);
          
          const totalReturns = (returnTransactions || []).reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
          
          // Total Cash Out = Expenses + Purchases + Quick Expenses + Change Returns + Withdrawals + Returns
          const totalCashOut = totalExpenses + totalPurchases + totalQuickExpenses + totalChangeReturns + totalWithdrawals + totalReturns;
          
          // Merge live data into today's register
          todayRegister = {
            ...todayRegister,
            total_sales: totalSales,
            total_cash_sales: totalCashSales,
            total_due_collected: totalDueCollected,
            total_expenses: totalExpenses + totalQuickExpenses,
            total_withdrawals: totalWithdrawals,
            total_deposits: totalDeposits,
            total_change_returns: totalChangeReturns,
            total_returns: totalReturns,
            total_cash_in: totalCashIn + totalDueCollected + totalDeposits, // Received from sales + dues + deposits
            total_cash_out: totalCashOut, // All outgoing cash (includes returns)
            quick_expenses: quickExpenses || [],
            total_quick_expenses: totalQuickExpenses,
          };
        }
        
        return new Response(JSON.stringify({ 
          registers: data, 
          todayRegister,
          hasOpenRegister: !!todayRegister && todayRegister.status === "open"
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "POST") {
        const body = await req.json();
        const action = body.action;
        const today = new Date().toISOString().split("T")[0];
        
        if (action === "open") {
          // Check if already open today
          const { data: existing } = await supabase
            .from("shop_daily_cash_register")
            .select("id, status")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("register_date", today)
            .maybeSingle();
          
          if (existing && existing.status === "open") {
            return new Response(JSON.stringify({ 
              error: "আজকের ক্যাশ রেজিস্টার ইতোমধ্যে খোলা আছে",
              register: existing 
            }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          // Get yesterday's closing cash as suggestion
          const { data: yesterday } = await supabase
            .from("shop_daily_cash_register")
            .select("closing_cash, register_date")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("status", "closed")
            .order("register_date", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          const suggestedOpening = yesterday?.closing_cash || 0;
          
          const { data: register, error } = await supabase
            .from("shop_daily_cash_register")
            .upsert({
              user_id: userId,
              shop_id: shopId,
              register_date: today,
              opening_cash: body.opening_cash ?? suggestedOpening,
              opening_time: new Date().toISOString(),
              status: "open",
              notes: body.notes,
            }, { onConflict: "user_id,shop_id,register_date" })
            .select()
            .single();
          
          if (error) throw error;
          
          return new Response(JSON.stringify({ 
            register, 
            message: "ক্যাশ রেজিস্টার খোলা হয়েছে",
            suggestedOpening 
          }), {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        if (action === "close") {
          // Get today's register
          const { data: todayReg, error: fetchErr } = await supabase
            .from("shop_daily_cash_register")
            .select("*")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("register_date", today)
            .eq("status", "open")
            .single();
          
          if (fetchErr || !todayReg) {
            return new Response(JSON.stringify({ error: "আজকের জন্য কোনো খোলা ক্যাশ রেজিস্টার নেই" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          // Get today's sales summary from shop_sales
          const todayStart = today + "T00:00:00";
          const todayEnd = today + "T23:59:59";
          
          const { data: sales } = await supabase
            .from("shop_sales")
            .select("total, paid_amount, payment_method")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .gte("sale_date", todayStart)
            .lte("sale_date", todayEnd);
          
          const totalSales = (sales || []).reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);
          const totalCashSales = (sales || []).filter((s: any) => s.payment_method === "cash")
            .reduce((sum: number, s: any) => sum + Number(s.paid_amount || 0), 0);
          const totalCardSales = (sales || []).filter((s: any) => s.payment_method === "card")
            .reduce((sum: number, s: any) => sum + Number(s.paid_amount || 0), 0);
          const totalMobileSales = (sales || []).filter((s: any) => ["bkash", "nagad", "rocket", "mobile"].includes(s.payment_method))
            .reduce((sum: number, s: any) => sum + Number(s.paid_amount || 0), 0);
          
          // Get today's due collections from cash transactions
          const { data: dueCollections } = await supabase
            .from("shop_cash_transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "in")
            .eq("source", "due_collection")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd);
          
          const totalDueCollected = (dueCollections || []).reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
          
          // Get today's expenses
          const { data: expenses } = await supabase
            .from("shop_expenses")
            .select("amount")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .gte("expense_date", todayStart)
            .lte("expense_date", todayEnd);
          
          const totalExpenses = (expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
          
          // Get today's withdrawals and deposits from cash transactions
          const { data: withdrawals } = await supabase
            .from("shop_cash_transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "out")
            .eq("source", "withdrawal")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd);
          
          const totalWithdrawals = (withdrawals || []).reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0);
          
          const { data: deposits } = await supabase
            .from("shop_cash_transactions")
            .select("amount")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "in")
            .eq("source", "deposit")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd);
          
          const totalDeposits = (deposits || []).reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
          
          // Get quick expenses (temporary daily expenses)
          const { data: quickExpenses } = await supabase
            .from("shop_quick_expenses")
            .select("amount")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("expense_date", today);
          
          const totalQuickExpenses = (quickExpenses || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
          const allExpenses = totalExpenses + totalQuickExpenses;
          
          // Calculate expected cash
          const expectedCash = Number(todayReg.opening_cash) + totalCashSales + totalDueCollected + totalDeposits - allExpenses - totalWithdrawals;
          const closingCash = body.closing_cash ?? expectedCash;
          const cashDifference = closingCash - expectedCash;
          
          // Update register
          const { data: updatedReg, error: updateErr } = await supabase
            .from("shop_daily_cash_register")
            .update({
              closing_cash: closingCash,
              closing_time: new Date().toISOString(),
              total_sales: totalSales,
              total_cash_sales: totalCashSales,
              total_card_sales: totalCardSales,
              total_mobile_sales: totalMobileSales,
              total_due_collected: totalDueCollected,
              total_expenses: allExpenses,
              total_withdrawals: totalWithdrawals,
              total_deposits: totalDeposits,
              expected_cash: expectedCash,
              cash_difference: cashDifference,
              notes: body.notes || todayReg.notes,
              status: "closed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", todayReg.id)
            .select()
            .single();
          
          // Delete quick expenses after closing (they are temporary)
          await supabase
            .from("shop_quick_expenses")
            .delete()
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("expense_date", today);
          
          if (updateErr) throw updateErr;
          
          return new Response(JSON.stringify({ 
            register: updatedReg, 
            message: "ক্যাশ রেজিস্টার বন্ধ হয়েছে",
            summary: {
              totalSales,
              totalCashSales,
              totalCardSales,
              totalMobileSales,
              totalDueCollected,
              totalExpenses,
              totalWithdrawals,
              totalDeposits,
              expectedCash,
              actualCash: closingCash,
              cashDifference,
            }
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        if (action === "update") {
          const { data: updatedReg, error } = await supabase
            .from("shop_daily_cash_register")
            .update({
              opening_cash: body.opening_cash,
              notes: body.notes,
              updated_at: new Date().toISOString(),
            })
            .eq("id", body.id)
            .eq("user_id", userId)
            .select()
            .single();
          
          if (error) throw error;
          
          return new Response(JSON.stringify({ register: updatedReg }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "DELETE") {
        const { id } = await req.json();
        
        const { error } = await supabase
          .from("shop_daily_cash_register")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ message: "Register deleted" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== QUICK EXPENSES (Temporary Daily Expenses) =====
    if (resource === "quick-expenses") {
      const today = new Date().toISOString().split("T")[0];
      
      if (req.method === "GET") {
        const { data, error } = await supabase
          .from("shop_quick_expenses")
          .select("*")
          .eq("user_id", userId)
          .eq("shop_id", shopId)
          .eq("expense_date", today)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        const total = (data || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
        
        return new Response(JSON.stringify({ expenses: data || [], total }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "POST") {
        const body = await req.json();
        
        if (!body.amount || body.amount <= 0) {
          return new Response(JSON.stringify({ error: "Amount is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const { data, error } = await supabase
          .from("shop_quick_expenses")
          .insert({
            user_id: userId,
            shop_id: shopId,
            amount: body.amount,
            description: body.description || "",
            expense_date: today,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ expense: data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (req.method === "DELETE") {
        const expenseId = url.searchParams.get("expense_id");
        
        if (expenseId) {
          // Delete specific expense
          const { error } = await supabase
            .from("shop_quick_expenses")
            .delete()
            .eq("id", expenseId)
            .eq("user_id", userId);
          
          if (error) throw error;
        } else {
          // Delete all today's expenses
          await supabase
            .from("shop_quick_expenses")
            .delete()
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("expense_date", today);
        }
        
        return new Response(JSON.stringify({ message: "Expense deleted" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== CASH FLOW BREAKDOWN (Detailed view) =====
    if (resource === "cash-flow-breakdown") {
      const dateParam = url.searchParams.get("date");
      const type = url.searchParams.get("type"); // cash_in, due_collected, cash_out
      const today = dateParam || new Date().toISOString().split("T")[0];
      const todayStart = today + "T00:00:00";
      const todayEnd = today + "T23:59:59";
      
      console.log("Cash flow breakdown - date params:", { dateParam, today, todayStart, todayEnd, type, shopId });

      if (req.method === "GET") {
        if (type === "cash_in") {
          // Get cash transactions for sales (actual received amounts)
          const { data: saleTransactions } = await supabase
            .from("shop_cash_transactions")
            .select("id, amount, notes, reference_id, created_at")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "in")
            .eq("source", "sale")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd)
            .order("created_at", { ascending: false });

          // Enrich sale transactions with sale details
          const enrichedSaleTransactions = await Promise.all((saleTransactions || []).map(async (t: any) => {
            let customerName = '';
            let customerPhone = '';
            let invoiceNumber = '';
            let saleTotal = 0;
            let saleDate = t.created_at;
            
            if (t.reference_id) {
              const { data: sale } = await supabase
                .from("shop_sales")
                .select("invoice_number, total, customer_name, customer_phone, sale_date, notes")
                .eq("id", t.reference_id)
                .maybeSingle();
              
              if (sale) {
                invoiceNumber = sale.invoice_number || '';
                saleTotal = Number(sale.total || 0);
                saleDate = sale.sale_date;
                customerName = sale.customer_name || '';
                customerPhone = sale.customer_phone || '';
                if (!customerName && sale.notes) {
                  const match = sale.notes.match(/Customer:\s*(.+?)(?:\s*\((.+?)\))?$/);
                  if (match) {
                    customerName = match[1].trim();
                    if (!customerPhone && match[2]) {
                      customerPhone = match[2].trim();
                    }
                  }
                }
              }
            }
            
            return {
              id: t.id,
              received_amount: Number(t.amount || 0), // Actual received from customer
              sale_total: saleTotal, // Product sell price
              change_given: Number(t.amount || 0) - saleTotal, // Change returned
              invoice_number: invoiceNumber,
              customer_name: customerName,
              customer_phone: customerPhone,
              sale_date: saleDate,
              source: 'sale'
            };
          }));

          // Get deposits
          const { data: deposits } = await supabase
            .from("shop_cash_transactions")
            .select("id, amount, notes, created_at")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "in")
            .eq("source", "deposit")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd)
            .order("created_at", { ascending: false });

          // Get due collections (for showing in cash_in breakdown)
          const { data: dueCollections } = await supabase
            .from("shop_cash_transactions")
            .select("id, amount, notes, reference_id, created_at")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "in")
            .eq("source", "due_collection")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd)
            .order("created_at", { ascending: false });

          const processedDeposits = (deposits || []).map((d: any) => ({
            ...d,
            source: 'deposit'
          }));

          // Enrich due collections with sale info
          const enrichedDueCollections = await Promise.all((dueCollections || []).map(async (dc: any) => {
            let customerName = '';
            let customerPhone = '';
            let invoiceNumber = '';
            
            if (dc.reference_id) {
              const { data: sale } = await supabase
                .from("shop_sales")
                .select("invoice_number, customer_name, customer_phone, notes")
                .eq("id", dc.reference_id)
                .maybeSingle();
              
              if (sale) {
                invoiceNumber = sale.invoice_number || '';
                customerName = sale.customer_name || '';
                customerPhone = sale.customer_phone || '';
                if (!customerName && sale.notes) {
                  const match = sale.notes.match(/Customer:\s*(.+?)(?:\s*\((.+?)\))?$/);
                  if (match) {
                    customerName = match[1].trim();
                    if (!customerPhone && match[2]) {
                      customerPhone = match[2].trim();
                    }
                  }
                }
              }
            }

            return {
              ...dc,
              customer_name: customerName,
              customer_phone: customerPhone,
              invoice_number: invoiceNumber
            };
          }));

          return new Response(JSON.stringify({ 
            sales: enrichedSaleTransactions,
            deposits: processedDeposits,
            due_collections: enrichedDueCollections,
            total_sales: enrichedSaleTransactions.reduce((sum: number, s: any) => sum + Number(s.sale_total || 0), 0),
            total_received: enrichedSaleTransactions.reduce((sum: number, s: any) => sum + Number(s.received_amount || 0), 0),
            total_deposits: processedDeposits.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0),
            total_due_collected: enrichedDueCollections.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0)
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (type === "due_collected") {
          // Get detailed due collections with sale info
          const { data: dueCollections } = await supabase
            .from("shop_cash_transactions")
            .select("id, amount, notes, reference_id, created_at")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "in")
            .eq("source", "due_collection")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd)
            .order("created_at", { ascending: false });

          // Get related sale info for each collection
          const enrichedCollections = await Promise.all((dueCollections || []).map(async (dc: any) => {
            let customerName = '';
            let customerPhone = '';
            let invoiceNumber = '';
            
            if (dc.reference_id) {
              const { data: sale } = await supabase
                .from("shop_sales")
                .select("invoice_number, customer_name, customer_phone, notes")
                .eq("id", dc.reference_id)
                .maybeSingle();
              
              if (sale) {
                invoiceNumber = sale.invoice_number || '';
                customerName = sale.customer_name || '';
                customerPhone = sale.customer_phone || '';
                // Parse from notes if not in direct fields
                if (!customerName && sale.notes) {
                  const match = sale.notes.match(/Customer:\s*(.+?)(?:\s*\((.+?)\))?$/);
                  if (match) {
                    customerName = match[1].trim();
                    if (!customerPhone && match[2]) {
                      customerPhone = match[2].trim();
                    }
                  }
                }
              }
            }

            return {
              ...dc,
              customer_name: customerName,
              customer_phone: customerPhone,
              invoice_number: invoiceNumber
            };
          }));

          return new Response(JSON.stringify({ 
            collections: enrichedCollections,
            total: enrichedCollections.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0)
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (type === "cash_out") {
          // Get ALL expenses from shop_expenses (not just cash-paid ones)
          const { data: allExpenses } = await supabase
            .from("shop_expenses")
            .select("id, amount, description, category, expense_date, payment_method, created_at")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .gte("expense_date", todayStart)
            .lte("expense_date", todayEnd)
            .order("created_at", { ascending: false });

          // Check which expenses were paid from cash (have entry in shop_cash_transactions)
          const { data: cashExpenseIds } = await supabase
            .from("shop_cash_transactions")
            .select("reference_id")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "out")
            .eq("source", "expense")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd);

          const cashPaidExpenseIds = new Set((cashExpenseIds || []).map((c: any) => c.reference_id));

          // Enrich expenses with paid_from_cash flag
          const expenses = (allExpenses || []).map((exp: any) => ({
            id: exp.id,
            amount: Number(exp.amount || 0),
            description: exp.description || '',
            category: exp.category || '',
            expense_date: exp.expense_date,
            payment_method: exp.payment_method || 'cash',
            paid_from_cash: cashPaidExpenseIds.has(exp.id),
            created_at: exp.created_at
          }));

          // Get cash purchases from shop_cash_transactions (since shop_purchases doesn't have payment_method)
          const { data: purchaseTransactions } = await supabase
            .from("shop_cash_transactions")
            .select("id, amount, notes, reference_id, created_at")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "out")
            .eq("source", "purchase")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd)
            .order("created_at", { ascending: false });
          
          // Enrich with purchase details
          const purchases = await Promise.all((purchaseTransactions || []).map(async (pt: any) => {
            let supplierName = '';
            let invoiceNumber = '';
            let purchaseDate = pt.created_at;
            
            if (pt.reference_id) {
              const { data: purchase } = await supabase
                .from("shop_purchases")
                .select("invoice_number, supplier_name, purchase_date")
                .eq("id", pt.reference_id)
                .maybeSingle();
              
              if (purchase) {
                invoiceNumber = purchase.invoice_number || '';
                supplierName = purchase.supplier_name || '';
                purchaseDate = purchase.purchase_date || pt.created_at;
              }
            }
            
            return {
              id: pt.id,
              paid_amount: Number(pt.amount || 0),
              invoice_number: invoiceNumber,
              supplier_name: supplierName,
              purchase_date: purchaseDate,
              created_at: pt.created_at
            };
          }));

          // Get quick expenses - using expense_date (DATE type) not created_at
          console.log("Fetching quick_expenses for:", { userId, shopId, today });
          const { data: quickExpenses, error: qeError } = await supabase
            .from("shop_quick_expenses")
            .select("id, amount, description, expense_date, created_at")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("expense_date", today)
            .order("created_at", { ascending: false });
          
          console.log("Quick expenses result:", { count: quickExpenses?.length, error: qeError, data: quickExpenses });

          // Get change returns (withdrawals marked as change_return)
          const { data: changeReturns } = await supabase
            .from("shop_cash_transactions")
            .select("id, amount, notes, reference_id, created_at")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("type", "out")
            .eq("source", "change_return")
            .gte("transaction_date", todayStart)
            .lte("transaction_date", todayEnd)
            .order("created_at", { ascending: false });

          // Enrich change returns with sale info
          const enrichedChangeReturns = await Promise.all((changeReturns || []).map(async (cr: any) => {
            let customerName = '';
            let invoiceNumber = '';
            
            if (cr.reference_id) {
              const { data: sale } = await supabase
                .from("shop_sales")
                .select("invoice_number, customer_name, notes")
                .eq("id", cr.reference_id)
                .maybeSingle();
              
              if (sale) {
                invoiceNumber = sale.invoice_number || '';
                customerName = sale.customer_name || '';
                if (!customerName && sale.notes) {
                  const match = sale.notes.match(/Customer:\s*(.+?)(?:\s*\((.+?)\))?$/);
                  if (match) {
                    customerName = match[1].trim();
                  }
                }
              }
            }

            return {
              ...cr,
              customer_name: customerName,
              invoice_number: invoiceNumber
            };
          }));

          const totalExpenses = (expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
          // Only count expenses paid from cash for actual cash calculation
          const cashExpenses = (expenses || []).filter((e: any) => e.paid_from_cash);
          const totalCashExpenses = cashExpenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
          const totalPurchases = (purchases || []).reduce((sum: number, p: any) => sum + Number(p.paid_amount || 0), 0);
          const totalQuickExpenses = (quickExpenses || []).reduce((sum: number, q: any) => sum + Number(q.amount || 0), 0);
          const totalChangeReturns = enrichedChangeReturns.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);

          // Get returns that were paid from cash (refund_method = 'cash')
          const { data: returnsFromCash } = await supabase
            .from("shop_returns")
            .select("id, product_name, quantity, refund_amount, unit_cost, reason, customer_name, customer_phone, is_resellable, created_at")
            .eq("user_id", userId)
            .eq("shop_id", shopId)
            .eq("refund_method", "cash")
            .gte("return_date", todayStart)
            .lte("return_date", todayEnd)
            .order("created_at", { ascending: false });

          // Calculate amounts for returns
          const returnsEnriched = (returnsFromCash || []).map((r: any) => ({
            id: r.id,
            product_name: r.product_name,
            quantity: r.quantity,
            reason: r.reason,
            customer_name: r.customer_name,
            customer_phone: r.customer_phone,
            is_resellable: r.is_resellable,
            created_at: r.created_at,
            // If resellable, cash_amount = refund_amount; else loss = unit_cost * quantity
            cash_amount: r.is_resellable 
              ? Number(r.refund_amount || 0) 
              : Number(r.unit_cost || 0) * Number(r.quantity || 1)
          }));

          const totalReturns = returnsEnriched.reduce((sum: number, r: any) => sum + Number(r.cash_amount || 0), 0);

          return new Response(JSON.stringify({ 
            expenses: expenses || [],
            purchases: purchases || [],
            quick_expenses: quickExpenses || [],
            change_returns: enrichedChangeReturns,
            returns: returnsEnriched,
            total_expenses: totalExpenses,
            total_cash_expenses: totalCashExpenses, // Only cash-paid expenses
            total_purchases: totalPurchases,
            total_quick_expenses: totalQuickExpenses,
            total_change_returns: totalChangeReturns,
            total_returns: totalReturns,
            // Total cash out only includes cash-paid items
            total: totalCashExpenses + totalPurchases + totalQuickExpenses + totalChangeReturns + totalReturns
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: "Invalid type parameter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Offline shop error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
