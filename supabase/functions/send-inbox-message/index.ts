import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

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

interface InboxMessageRequest {
  customers: Array<{
    customerId: string;
    customerFbId: string;
    customerName: string;
    message: string;
    platform: string;
    pageId?: string;
  }>;
}

// Send message via Facebook Messenger API
async function sendFacebookMessage(
  pageId: string, 
  recipientId: string, 
  message: string, 
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[send-inbox-message] Sending FB message to ${recipientId} via page ${pageId}`);
    
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          messaging_type: "MESSAGE_TAG",
          tag: "CONFIRMED_EVENT_UPDATE", // Allows sending outside 24h window
          access_token: accessToken,
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error("[send-inbox-message] Facebook API error:", data);
      
      // Check for specific error codes
      if (data.error?.code === 10) {
        return { success: false, error: "অনুমতি নেই - পেজ অ্যাক্সেস টোকেন চেক করুন" };
      }
      if (data.error?.code === 551) {
        return { success: false, error: "এই ব্যবহারকারী মেসেজ ব্লক করেছে" };
      }
      if (data.error?.code === 200 || data.error?.code === 230) {
        return { success: false, error: "24 ঘণ্টার পর মেসেজ পাঠানোর অনুমতি নেই" };
      }
      
      return { success: false, error: data.error?.message || "Facebook API error" };
    }

    console.log(`[send-inbox-message] Message sent successfully:`, data.message_id);
    return { success: true };
  } catch (error: any) {
    console.error("[send-inbox-message] Error sending message:", error);
    return { success: false, error: error.message };
  }
}

// Get page access token from connected_accounts
async function getPageAccessToken(
  supabase: any, 
  userId: string, 
  pageId: string
): Promise<string | null> {
  // First try to get directly from connected_accounts with matching external_id
  const { data: account } = await supabase
    .from("connected_accounts")
    .select("access_token, access_token_encrypted")
    .eq("user_id", userId)
    .eq("external_id", pageId)
    .eq("platform", "facebook")
    .maybeSingle();

  if (account?.access_token) {
    return account.access_token;
  }

  // Fallback: Get user's Facebook account and use page_memory for page token
  const { data: pageMemory } = await supabase
    .from("page_memory")
    .select("page_access_token")
    .eq("user_id", userId)
    .eq("page_id", pageId)
    .maybeSingle();

  if (pageMemory?.page_access_token) {
    return pageMemory.page_access_token;
  }

  // Last resort: Get any connected Facebook account
  const { data: fbAccount } = await supabase
    .from("connected_accounts")
    .select("access_token")
    .eq("user_id", userId)
    .eq("platform", "facebook")
    .eq("is_connected", true)
    .limit(1)
    .maybeSingle();

  return fbAccount?.access_token || null;
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
    const { customers } = (await req.json()) as InboxMessageRequest;

    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return new Response(JSON.stringify({ error: "No customers provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[send-inbox-message] Processing ${customers.length} messages for user ${userId}`);

    // Get user's connected Facebook pages
    const { data: connectedPages } = await supabase
      .from("page_memory")
      .select("page_id, page_access_token")
      .eq("user_id", userId);

    // Create a map of page_id to access_token
    const pageTokens = new Map<string, string>();
    for (const page of connectedPages || []) {
      if (page.page_access_token) {
        pageTokens.set(page.page_id, page.page_access_token);
      }
    }

    // If no page tokens in page_memory, try connected_accounts
    if (pageTokens.size === 0) {
      const { data: fbAccounts } = await supabase
        .from("connected_accounts")
        .select("external_id, access_token")
        .eq("user_id", userId)
        .eq("platform", "facebook")
        .eq("is_connected", true);

      for (const acc of fbAccounts || []) {
        if (acc.access_token) {
          pageTokens.set(acc.external_id, acc.access_token);
        }
      }
    }

    if (pageTokens.size === 0) {
      return new Response(JSON.stringify({ 
        error: "No connected Facebook pages found",
        message: "Please connect your Facebook page first"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{
      customerId: string;
      customerName: string;
      success: boolean;
      error?: string;
    }> = [];

    let totalSent = 0;
    let totalFailed = 0;

    for (const customer of customers) {
      // Determine which page to send from
      let pageId = customer.pageId;
      let accessToken: string | null = null;

      // Get customer's conversation to find the page_id they talked to
      if (!pageId) {
        const { data: conversation } = await supabase
          .from("ai_conversations")
          .select("page_id")
          .eq("user_id", userId)
          .eq("sender_id", customer.customerFbId)
          .maybeSingle();
        
        pageId = conversation?.page_id;
      }

      // Get access token for the page
      if (pageId) {
        accessToken = pageTokens.get(pageId) || null;
        
        // If not in map, try to fetch specifically
        if (!accessToken) {
          accessToken = await getPageAccessToken(supabase, userId, pageId);
        }
      }

      // Fallback to first available page
      if (!accessToken && pageTokens.size > 0) {
        const entries = Array.from(pageTokens.entries());
        if (entries.length > 0) {
          pageId = entries[0][0];
          accessToken = entries[0][1];
        }
      }

      if (!accessToken || !pageId) {
        results.push({
          customerId: customer.customerId,
          customerName: customer.customerName,
          success: false,
          error: "No valid page access token found"
        });
        totalFailed++;
        continue;
      }

      // Send the message
      const sendResult = await sendFacebookMessage(
        pageId,
        customer.customerFbId,
        customer.message,
        accessToken
      );

      if (sendResult.success) {
        totalSent++;
        results.push({
          customerId: customer.customerId,
          customerName: customer.customerName,
          success: true
        });

        // Get current followup count and update
        const { data: currentFollowup } = await supabase
          .from("customer_followups")
          .select("followup_count")
          .eq("id", customer.customerId)
          .maybeSingle();
        
        await supabase
          .from("customer_followups")
          .update({
            followup_count: (currentFollowup?.followup_count || 0) + 1,
            last_followup_at: new Date().toISOString(),
            last_followup_message: customer.message
          })
          .eq("id", customer.customerId);

        // Log the message
        await supabase
          .from("followup_message_logs")
          .insert({
            user_id: userId,
            customer_followup_id: customer.customerId,
            customer_name: customer.customerName,
            message_content: customer.message,
            message_type: "inbox",
            status: "sent"
          });

      } else {
        totalFailed++;
        results.push({
          customerId: customer.customerId,
          customerName: customer.customerName,
          success: false,
          error: sendResult.error
        });
      }

      // Add small delay between messages to avoid rate limiting
      if (customers.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`[send-inbox-message] Completed: ${totalSent} sent, ${totalFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${totalSent} মেসেজ পাঠানো হয়েছে, ${totalFailed} ব্যর্থ`,
        totalSent,
        totalFailed,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("[send-inbox-message] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
