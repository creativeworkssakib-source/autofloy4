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
async function syncCustomersFromConversations(supabase: any, userId: string, includeTestData: boolean = false) {
  console.log("[customer-followups] Syncing customers for user:", userId, "includeTestData:", includeTestData);
  
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
  let skippedTestData = 0;
  
  for (const conv of conversations || []) {
    // Skip test data unless specifically requested
    const isTestData = conv.sender_id?.startsWith('test') || 
                       conv.sender_id?.includes('test_') ||
                       conv.sender_name?.toLowerCase().includes('test');
    
    if (isTestData && !includeTestData) {
      skippedTestData++;
      console.log(`[customer-followups] Skipping test customer: ${conv.sender_id}`);
      continue;
    }

    const hasPurchased = purchasedCustomers.has(conv.sender_id);
    const orderData = customerOrderData.get(conv.sender_id);
    
    // Determine customer name - prefer collected, then sender_name, then order data, then FB ID
    let customerName = conv.collected_name || conv.sender_name || orderData?.customer_name;
    
    // If still no name, use a formatted version of the FB ID for real customers
    if (!customerName && !isTestData) {
      customerName = `Customer #${conv.sender_id.substring(0, 8)}`;
    }
    
    // Upsert customer followup record
    const { error: upsertError } = await supabase
      .from("customer_followups")
      .upsert({
        user_id: userId,
        customer_fb_id: conv.sender_id,
        customer_name: customerName,
        customer_phone: conv.collected_phone || orderData?.customer_phone,
        platform: "facebook", // TODO: Detect platform from page_id or conversation context
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

  console.log(`[customer-followups] Synced ${syncedCount} customers, skipped ${skippedTestData} test records`);
  return { synced: syncedCount, skipped: skippedTestData };
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

  // Filter out test data by default (unless includeTestData is true)
  if (!filters.includeTestData) {
    // Exclude customers with test IDs using NOT ILIKE pattern
    // Note: We use neq for RPC or filter in JS after fetch
    query = query.filter('customer_fb_id', 'not.ilike', 'test%');
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

  // Get FULL conversation history
  const conversation = await getConversationHistory(supabase, userId, customer.customer_fb_id);
  
  // Get user's business info from page_memory
  const { data: pageMemory } = await supabase
    .from("page_memory")
    .select("business_description, synced_products_summary, business_name, ai_preferences")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  // Extract conversation details for personalization
  const messageHistory = conversation?.message_history || [];
  const lastMessages = messageHistory.slice(-10); // Last 10 messages for context
  
  // Format conversation for AI
  const conversationContext = lastMessages.map((msg: any) => 
    `${msg.role === 'user' ? 'Customer' : 'AI'}: ${msg.content}`
  ).join('\n');

  // Determine customer personality and preferences from conversation
  const customerPrefs = conversation?.customer_preferences || {};
  const productsDiscussed = customer.last_products_discussed?.join(', ') || conversation?.last_products_discussed?.join(', ') || 'unknown';

  // Build context for AI
  const systemPrompt = `তুমি একজন দক্ষ বাংলাদেশী সেলস এক্সপার্ট। তোমার কাজ হলো কাস্টমারদের জন্য পার্সোনালাইজড ফলো-আপ SMS লেখা।

🎯 **মূল নিয়ম:**
1. বাংলায় লিখবে (Banglish/মিশ্র ভাষা OK)
2. SMS ছোট রাখবে (১৬০ ক্যারেক্টারের মধ্যে)
3. কাস্টমারের নাম ব্যবহার করবে
4. তাদের আগের কথোপকথন ভালো করে পড়ে তারপর রিপ্লাই দিবে
5. প্রাকৃতিক ও বন্ধুত্বপূর্ণ টোন রাখবে
6. একটাই emoji ব্যবহার করতে পারো

📋 **বিজনেস ইনফো:**
- নাম: ${pageMemory?.business_name || 'আমাদের শপ'}
- বর্ণনা: ${pageMemory?.business_description || 'Quality products'}

👤 **কাস্টমার ইনফো:**
- নাম: ${customer.customer_name || 'প্রিয় Customer'}
- কিনেছে কিনা: ${customer.has_purchased ? 'হ্যাঁ, কিনেছে ✓' : 'না, এখনো কেনেনি'}
- আলোচিত প্রোডাক্ট: ${productsDiscussed}
- AI সামারি: ${customer.conversation_summary || 'N/A'}
- মোট মেসেজ: ${customer.total_messages || 0}

💬 **সাম্প্রতিক কথোপকথন:**
${conversationContext || 'কোনো কথোপকথন পাওয়া যায়নি'}

**গুরুত্বপূর্ণ:** 
- কাস্টমার কেন কেনেনি সেটা বোঝার চেষ্টা করো (দাম বেশি? সময় নেই? অবিশ্বাস?)
- তাদের সেই সমস্যার সমাধান দিয়ে SMS লিখো
- সরাসরি বিক্রি করতে যেও না, আগে সম্পর্ক তৈরি করো`;

  let userPrompt = '';
  
  switch (context.messageType) {
    case 're-engage':
      userPrompt = `এই কাস্টমার জিজ্ঞেস করেছিল কিন্তু কেনেনি। 
তাদের আগের কথোপকথন পড়ে বোঝো কেন কেনেনি।
তারপর একটা ফ্রেন্ডলি মেসেজ লেখো যেটা তাদের আবার আগ্রহী করবে।
${productsDiscussed !== 'unknown' ? `তারা "${productsDiscussed}" নিয়ে আগ্রহী ছিল।` : ''}
শুধু SMS টেক্সট দাও, অন্য কিছু না।`;
      break;
    case 'new-product':
      userPrompt = `নতুন প্রোডাক্ট এসেছে: ${context.newProductInfo || 'নতুন কালেকশন'}
এই কাস্টমারের আগ্রহ অনুযায়ী একটা এক্সাইটিং মেসেজ লেখো।
${customer.has_purchased ? 'তারা আগে কিনেছে, তাই special offer দিতে পারো।' : 'তারা আগে কেনেনি, তাই ভালো deal offer করো।'}
শুধু SMS টেক্সট দাও।`;
      break;
    case 'thank-you':
      userPrompt = `এই কাস্টমার আমাদের থেকে কিনেছে! 
তাদের ধন্যবাদ জানিয়ে একটা হৃদয়গ্রাহী মেসেজ লেখো।
ভবিষ্যতে আবার কেনার জন্য উৎসাহিত করো।
শুধু SMS টেক্সট দাও।`;
      break;
    case 'custom':
      userPrompt = context.customPrompt || 'একটা ফ্রেন্ডলি ফলো-আপ মেসেজ লেখো। শুধু SMS টেক্সট দাও।';
      break;
    default:
      userPrompt = 'একটা ফ্রেন্ডলি ফলো-আপ মেসেজ লেখো। শুধু SMS টেক্সট দাও।';
  }

  console.log(`[customer-followups] Generating message for ${customer.customer_name || customer.customer_fb_id}`);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("AI API error:", error);
    
    // Handle rate limit
    if (response.status === 429) {
      throw new Error("AI rate limit exceeded. Please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please add credits.");
    }
    throw new Error("Failed to generate message");
  }

  const result = await response.json();
  const generatedMessage = result.choices?.[0]?.message?.content || '';
  
  // Clean up the message - remove quotes, extra formatting
  let cleanMessage = generatedMessage.trim()
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/^SMS:\s*/i, '') // Remove "SMS:" prefix
    .replace(/^\*\*.*?\*\*\s*/g, ''); // Remove bold markers
  
  console.log(`[customer-followups] Generated: ${cleanMessage.substring(0, 50)}...`);
  
  return cleanMessage;
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
      const includeTestData = url.searchParams.get("includeTestData") === "true";
      
      const customers = await getCustomers(supabase, userId, {
        hasPurchased: hasPurchased ? hasPurchased === "true" : undefined,
        platform,
        hasPhone,
        includeTestData
      });
      
      return new Response(JSON.stringify({ customers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /customer-followups/sync - Sync from conversations
    if (req.method === "POST" && path === "sync") {
      // Parse body for options
      let includeTestData = false;
      try {
        const body = await req.json();
        includeTestData = body?.includeTestData === true;
      } catch {
        // No body or invalid JSON - use defaults
      }
      
      const result = await syncCustomersFromConversations(supabase, userId, includeTestData);
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
