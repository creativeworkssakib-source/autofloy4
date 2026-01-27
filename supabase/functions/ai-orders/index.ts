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

  const userId = await verifyToken(req.headers.get("Authorization"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (req.method === "GET") {
      // Fetch all AI orders for the user
      const { data: orders, error } = await supabase
        .from("ai_orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching AI orders:", error);
        throw error;
      }

      // Calculate stats
      const stats = {
        total: orders?.length || 0,
        pending: orders?.filter(o => o.order_status === "pending").length || 0,
        confirmed: orders?.filter(o => o.order_status === "confirmed").length || 0,
        processing: orders?.filter(o => o.order_status === "processing").length || 0,
        shipped: orders?.filter(o => o.order_status === "shipped").length || 0,
        delivered: orders?.filter(o => o.order_status === "delivered").length || 0,
        cancelled: orders?.filter(o => o.order_status === "cancelled").length || 0,
        totalRevenue: orders?.filter(o => o.order_status === "delivered").reduce((sum, o) => sum + Number(o.total || 0), 0) || 0,
      };

      console.log(`Fetched ${orders?.length || 0} AI orders for user ${userId}`);

      return new Response(JSON.stringify({ orders: orders || [], stats }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "PATCH") {
      // Update order status
      const { orderId, status } = await req.json();

      if (!orderId || !status) {
        return new Response(JSON.stringify({ error: "Missing orderId or status" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the order belongs to the user
      const { data: existingOrder, error: checkError } = await supabase
        .from("ai_orders")
        .select("id, user_id")
        .eq("id", orderId)
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError || !existingOrder) {
        return new Response(JSON.stringify({ error: "Order not found or unauthorized" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: updatedOrder, error: updateError } = await supabase
        .from("ai_orders")
        .update({ 
          order_status: status, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", orderId)
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating order status:", updateError);
        throw updateError;
      }

      console.log(`Updated order ${orderId} status to ${status}`);

      return new Response(JSON.stringify({ order: updatedOrder }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI orders error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
