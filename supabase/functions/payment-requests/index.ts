import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Plan name mapping
const PLAN_NAMES: Record<string, string> = {
  "free-trial": "Free Trial",
  starter: "Starter",
  professional: "Professional",
  business: "Business",
  lifetime: "Lifetime",
};

// Verify JWT and get user ID
async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const jwtSecret = Deno.env.get("JWT_SECRET");

  if (!jwtSecret) {
    console.error("[Payment] JWT_SECRET not configured");
    return null;
  }

  try {
    const { verify } = await import("https://deno.land/x/djwt@v3.0.2/mod.ts");
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
    console.error("[Payment] Token verification failed:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/payment-requests")[1] || "";

  // Verify authentication
  const userId = await verifyToken(req.headers.get("Authorization"));
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // POST /payment-requests - Submit new payment request
    if (req.method === "POST" && (!path || path === "/")) {
      const body = await req.json();
      const { plan_id, amount, payment_method, transaction_id, screenshot_url } = body;

      if (!plan_id || !amount || !payment_method) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: plan_id, amount, payment_method" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user already has a pending request for this plan
      const { data: existingRequest } = await supabase
        .from("payment_requests")
        .select("id")
        .eq("user_id", userId)
        .eq("plan_id", plan_id)
        .eq("status", "pending")
        .maybeSingle();

      if (existingRequest) {
        return new Response(
          JSON.stringify({ error: "You already have a pending request for this plan" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const planName = PLAN_NAMES[plan_id] || plan_id;

      const { data: newRequest, error: insertError } = await supabase
        .from("payment_requests")
        .insert({
          user_id: userId,
          plan_id,
          plan_name: planName,
          amount,
          currency: "BDT",
          payment_method,
          transaction_id: transaction_id || null,
          screenshot_url: screenshot_url || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[Payment] Failed to create request:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to submit payment request" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[Payment] New payment request ${newRequest.id} from user ${userId} for plan ${plan_id}`);

      return new Response(
        JSON.stringify({ success: true, requestId: newRequest.id }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /payment-requests/my-history - Get user's payment history
    if (req.method === "GET" && path === "/my-history") {
      const { data: payments, error: fetchError } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("[Payment] Failed to fetch history:", fetchError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch payment history" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ payments: payments || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Payment] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
