import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;
const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
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
  } catch (e) {
    console.error("Token verification failed:", e);
    return null;
  }
}

// Sync customers from AI conversations
async function syncCustomersFromConversations(supabase: any, userId: string) {
  console.log("[customer-followups] Syncing customers for user:", userId);
  
  // Get all AI conversations for this user
  const { data: conversations, error: convError } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });

  if (convError) {
    console.error("Error fetching conversations:", convError);
    throw new Error("Failed to fetch conversations");
  }

  // Get all AI orders to check who purchased
  const { data: orders, error: orderError } = await supabase
    .from("ai_orders")
    .select("customer_fb_id, customer_name, customer_phone, total, created_at")
    .eq("user_id", userId);

  if (orderError) {
    console.error("Error fetching orders:", orderError);
  }

  interface OrderRecord {
    customer_fb_id: string;
    customer_name: string | null;
    customer_phone: string | null;
    total: number;
    created_at: string;
  }

  const purchasedCustomers = new Set((orders as OrderRecord[] || []).map((o) => o.customer_fb_id));
  const customerOrderData = new Map((orders as OrderRecord[] || []).map((o) => [o.customer_fb_id, o]));

  let syncedCount = 0;
  
  for (const conv of conversations || []) {
    const hasPurchased = purchasedCustomers.has(conv.sender_id);
    const orderData = customerOrderData.get(conv.sender_id);
    
    // Upsert customer followup record
    const { error: upsertError } = await supabase
      .from("customer_followups")
      .upsert({
        user_id: userId,
        customer_fb_id: conv.sender_id,
        customer_name: conv.collected_name || conv.sender_name || orderData?.customer_name,
        customer_phone: conv.collected_phone || orderData?.customer_phone,
        platform: "facebook",
        has_purchased: hasPurchased,
        total_messages: conv.total_messages_count || 0,
        last_message_at: conv.last_message_at,
        last_products_discussed: conv.last_products_discussed,
        conversation_summary: conv.customer_summary,
        status: hasPurchased ? "converted" : "active",
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id,customer_fb_id,platform"
      });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
    } else {
      syncedCount++;
    }
  }

  console.log(`[customer-followups] Synced ${syncedCount} customers`);
  return { synced: syncedCount };
}

// Get customers with filtering
async function getCustomers(supabase: any, userId: string, filters: any) {
  console.log("[customer-followups] Getting customers with filters:", filters);
  
  let query = supabase
    .from("customer_followups")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });

  if (filters.hasPurchased !== undefined) {
    query = query.eq("has_purchased", filters.hasPurchased);
  }

  if (filters.platform) {
    query = query.eq("platform", filters.platform);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.hasPhone) {
    query = query.not("customer_phone", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }

  return data;
}

// Get conversation history for a customer
async function getConversationHistory(supabase: any, userId: string, customerFbId: string) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("sender_id", customerFbId)
    .single();

  if (error) {
    console.error("Error fetching conversation:", error);
    return null;
  }

  return data;
}

// Generate AI follow-up message
async function generateFollowupMessage(
  supabase: any,
  userId: string,
  customer: any,
  context: {
    messageType: string; // 're-engage', 'new-product', 'thank-you', 'custom'
    newProductInfo?: string;
    customPrompt?: string;
  }
) {
  if (!lovableApiKey) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  // Get conversation history
  const conversation = await getConversationHistory(supabase, userId, customer.customer_fb_id);
  
  // Get user's business info from page_memory
  const { data: pageMemory } = await supabase
    .from("page_memory")
    .select("business_description, synced_products_summary, business_name")
    .eq("user_id", userId)
    .limit(1)
    .single();

  // Build context for AI
  let systemPrompt = `You are a helpful assistant generating follow-up SMS messages for a Bangladeshi e-commerce business.
Write messages in Bengali (Banglish is acceptable). Keep messages short (under 160 characters if possible).
Be friendly, personal, and conversational. Use the customer's name if available.

Business Info:
- Business Name: ${pageMemory?.business_name || 'আমাদের শপ'}
- Description: ${pageMemory?.business_description || 'Quality products at best prices'}

Customer Info:
- Name: ${customer.customer_name || 'প্রিয় Customer'}
- Has Purchased: ${customer.has_purchased ? 'Yes' : 'No'}
- Last Products Discussed: ${customer.last_products_discussed?.join(', ') || 'Unknown'}
- Previous Summary: ${customer.conversation_summary || conversation?.customer_summary || 'No previous summary'}
`;

  let userPrompt = '';
  
  switch (context.messageType) {
    case 're-engage':
      userPrompt = `Generate a friendly re-engagement message for this customer who inquired but hasn't purchased yet.
Remind them about the products they were interested in and offer to help.`;
      break;
    case 'new-product':
      userPrompt = `Generate a message informing about new product arrivals.
New Product Info: ${context.newProductInfo || 'New exciting products just arrived!'}
Make it exciting and personalized based on their interests.`;
      break;
    case 'thank-you':
      userPrompt = `Generate a thank you message for a customer who made a purchase.
Express gratitude and encourage them to shop again.`;
      break;
    case 'custom':
      userPrompt = context.customPrompt || 'Generate a friendly follow-up message.';
      break;
    default:
      userPrompt = 'Generate a friendly follow-up message.';
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("AI API error:", error);
    throw new Error("Failed to generate message");
  }

  const result = await response.json();
  const generatedMessage = result.choices?.[0]?.message?.content || '';
  
  return generatedMessage.trim();
}

// Send follow-up SMS
async function sendFollowupSms(
  supabase: any,
  userId: string,
  customerId: string,
  phone: string,
  message: string
) {
  // Update followup record
  await supabase
    .from("customer_followups")
    .update({
      followup_count: supabase.sql`followup_count + 1`,
      last_followup_at: new Date().toISOString(),
      last_followup_message: message
    })
    .eq("id", customerId);

  // Log the message
  await supabase
    .from("followup_message_logs")
    .insert({
      user_id: userId,
      customer_followup_id: customerId,
      customer_phone: phone,
      message_content: message,
      message_type: "sms",
      status: "pending"
    });

  return { success: true, message: "Follow-up queued for sending" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const userId = await verifyToken(authHeader);
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // GET /customer-followups - List customers
    if (req.method === "GET" && (!path || path === "customer-followups")) {
      const hasPurchased = url.searchParams.get("hasPurchased");
      const platform = url.searchParams.get("platform");
      const hasPhone = url.searchParams.get("hasPhone") === "true";
      
      const customers = await getCustomers(supabase, userId, {
        hasPurchased: hasPurchased ? hasPurchased === "true" : undefined,
        platform,
        hasPhone
      });
      
      return new Response(JSON.stringify({ customers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /customer-followups/sync - Sync from conversations
    if (req.method === "POST" && path === "sync") {
      const result = await syncCustomersFromConversations(supabase, userId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /customer-followups/generate-message - Generate AI message
    if (req.method === "POST" && path === "generate-message") {
      const { customerId, messageType, newProductInfo, customPrompt } = await req.json();
      
      // Get customer
      const { data: customer, error } = await supabase
        .from("customer_followups")
        .select("*")
        .eq("id", customerId)
        .eq("user_id", userId)
        .single();

      if (error || !customer) {
        return new Response(JSON.stringify({ error: "Customer not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const message = await generateFollowupMessage(supabase, userId, customer, {
        messageType,
        newProductInfo,
        customPrompt
      });

      return new Response(JSON.stringify({ message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /customer-followups/conversation - Get conversation history
    if (req.method === "POST" && path === "conversation") {
      const { customerFbId } = await req.json();
      
      const conversation = await getConversationHistory(supabase, userId, customerFbId);
      
      return new Response(JSON.stringify({ conversation }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[customer-followups] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
