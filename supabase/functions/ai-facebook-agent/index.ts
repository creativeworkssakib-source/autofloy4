// ========= AI FACEBOOK AGENT - LEAN VERSION =========
// Refactored for faster bundle generation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared helpers
import {
  corsHeaders,
  type MessageContext,
  type PageMemory,
  type ProductContext,
  type SmartCommentAnalysis,
  analyzeSticker,
  detectIntent,
  detectSentiment,
  getNextState,
  calculateFakeOrderScore,
  trimMessageHistory,
  generateCustomerSummary,
  extractProductsDiscussed,
} from "../_shared/ai-agent-helpers.ts";

import { buildSystemPrompt } from "../_shared/ai-prompt-builder.ts";
import { smartAnalyzeComment } from "../_shared/ai-comment-analyzer.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Check if AI is globally enabled from admin settings
async function isAIEnabled(supabase: any): Promise<{ enabled: boolean; useCustomKey: boolean; customApiKey: string | null }> {
  const { data } = await supabase
    .from("api_integrations")
    .select("is_enabled, api_key")
    .eq("provider", "openai")
    .single();
  
  if (!data) {
    // Default: use Lovable AI if no config
    return { enabled: true, useCustomKey: false, customApiKey: null };
  }
  
  // If disabled, AI won't work at all
  if (!data.is_enabled) {
    return { enabled: false, useCustomKey: false, customApiKey: null };
  }
  
  // If enabled with custom API key, use OpenAI directly
  if (data.api_key && data.api_key.trim().length > 10) {
    return { enabled: true, useCustomKey: true, customApiKey: data.api_key };
  }
  
  // Enabled but no custom key - use Lovable AI
  return { enabled: true, useCustomKey: false, customApiKey: null };
}

// Database helpers
async function getPageMemory(supabase: any, pageId: string) {
  const { data } = await supabase.from("page_memory").select("*").eq("page_id", pageId).single();
  return data;
}

async function getAllProducts(supabase: any, userId: string): Promise<ProductContext[]> {
  const { data: physical } = await supabase.from("products").select("*").eq("user_id", userId).eq("is_active", true).limit(100);
  const { data: digital } = await supabase.from("digital_products").select("*").eq("user_id", userId).eq("is_active", true).limit(100);
  
  const products: ProductContext[] = (physical || []).map((p: any) => ({
    id: p.id, name: p.name, price: p.price, description: p.description, 
    category: p.category, sku: p.sku, is_active: p.is_active, isDigital: false
  }));
  
  // FIXED: Use `price` as primary, NOT sale_price (sale_price is optional discount)
  (digital || []).forEach((d: any) => {
    products.push({
      id: d.id, name: d.name, price: d.price, description: d.description,
      category: d.product_type, is_active: d.is_active, isDigital: true, product_type: d.product_type
    });
  });
  
  console.log(`[AI Agent] Loaded products: ${products.map(p => `${p.name}=৳${p.price}`).join(", ")}`);
  return products;
}

async function findProductByName(supabase: any, userId: string, text: string): Promise<ProductContext | null> {
  const lowerText = text.toLowerCase();
  const products = await getAllProducts(supabase, userId);
  
  for (const product of products) {
    const productNameLower = product.name.toLowerCase();
    if (lowerText.includes(productNameLower) || 
        productNameLower.split(" ").some(word => word.length > 3 && lowerText.includes(word))) {
      return product;
    }
  }
  return null;
}

async function getOrCreateConversation(supabase: any, userId: string, pageId: string, senderId: string, senderName?: string) {
  // Try to find existing conversation
  const { data: conv, error: selectError } = await supabase.from("ai_conversations")
    .select("*").eq("page_id", pageId).eq("sender_id", senderId).single();
  
  if (selectError) {
    console.log(`[AI Agent] Select conversation error (may be normal for new):`, selectError.code);
  }
  
  if (conv) {
    return conv;
  }
  
  // Create new conversation if not found
  console.log(`[AI Agent] Creating new conversation for sender ${senderId}`);
  const { data: newConv, error: insertError } = await supabase.from("ai_conversations")
    .insert({ 
      user_id: userId, 
      page_id: pageId, 
      sender_id: senderId, 
      sender_name: senderName, 
      conversation_state: "idle", 
      message_history: [] 
    })
    .select().single();
  
  if (insertError) {
    console.error(`[AI Agent] Failed to create conversation:`, insertError);
    // Return a minimal conversation object to prevent crash
    return {
      id: null,
      user_id: userId,
      page_id: pageId,
      sender_id: senderId,
      sender_name: senderName,
      conversation_state: "idle",
      message_history: [],
      fake_order_score: 0,
      total_messages_count: 0,
    };
  }
  
  return newConv;
}

// AI Call with better error handling - supports both Lovable AI and custom OpenAI key
async function callAI(systemPrompt: string, messages: any[], imageUrls?: string[], customApiKey?: string | null): Promise<string> {
  const aiMessages: any[] = [];
  
  for (const msg of messages.slice(-10)) {
    if (msg.role === "user" || msg.role === "assistant") {
      const content = msg.content || msg.text || "";
      // Ensure content is never empty
      if (content.trim()) {
        aiMessages.push({ role: msg.role, content: content.trim() });
      }
    }
  }
  
  // Ensure at least one user message exists
  if (aiMessages.length === 0 || !aiMessages.some(m => m.role === "user")) {
    aiMessages.push({ role: "user", content: "Hi" });
  }
  
  // Add images if present
  if (imageUrls && imageUrls.length > 0) {
    const lastMsgIndex = aiMessages.length - 1;
    if (lastMsgIndex >= 0 && aiMessages[lastMsgIndex].role === "user") {
      const textContent = aiMessages[lastMsgIndex].content;
      aiMessages[lastMsgIndex].content = [
        { type: "text", text: textContent || "এই ছবি দেখুন" },
        ...imageUrls.slice(0, 3).map(url => ({ type: "image_url", image_url: { url } }))
      ];
    }
  }
  
  // Determine API endpoint and model based on whether using custom key
  const useCustomKey = customApiKey && customApiKey.trim().length > 10;
  const apiUrl = useCustomKey ? OPENAI_API_URL : AI_GATEWAY_URL;
  const apiKey = useCustomKey ? customApiKey : LOVABLE_API_KEY;
  
  // Select model based on provider
  const model = useCustomKey 
    ? (imageUrls?.length ? "gpt-4o" : "gpt-4o-mini")  // OpenAI models
    : (imageUrls?.length ? "openai/gpt-5" : "openai/gpt-5-mini");  // Lovable AI Gateway models
  
  const requestBody = {
    model,
    messages: [{ role: "system", content: systemPrompt }, ...aiMessages],
    max_tokens: 2048,
  };
  
  console.log(`[AI Agent] Calling AI: provider=${useCustomKey ? 'OpenAI' : 'Lovable'}, model=${model}, messages=${aiMessages.length}`);
  
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[AI Agent] API Error ${response.status}:`, errorText);
    throw new Error(`AI API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }
  
  const data = await response.json();
  console.log(`[AI Agent] API Response structure:`, JSON.stringify(data).substring(0, 300));
  
  // Try different response formats (some APIs use different structures)
  const reply = data.choices?.[0]?.message?.content 
    || data.choices?.[0]?.text 
    || data.message?.content
    || data.content
    || data.response
    || "দুঃখিত, একটু সমস্যা হচ্ছে।";
    
  console.log(`[AI Agent] AI replied: ${reply.substring(0, 100)}...`);
  return reply;
}

// Create order
async function createOrder(supabase: any, userId: string, pageId: string, conversation: any, productContext: ProductContext | null) {
  const invoiceNumber = `INV${Date.now().toString().slice(-8)}`;
  const { data: order } = await supabase.from("ai_orders").insert({
    user_id: userId,
    page_id: pageId,
    conversation_id: conversation.id,
    customer_name: conversation.collected_name || "Unknown",
    customer_phone: conversation.collected_phone || "",
    customer_address: conversation.collected_address || "",
    customer_fb_id: conversation.sender_id,
    products: productContext ? [{ id: productContext.id, name: productContext.name, price: productContext.price, quantity: conversation.current_quantity || 1 }] : [],
    subtotal: productContext?.price || 0,
    total: productContext?.price || 0,
    invoice_number: invoiceNumber,
    order_status: "pending",
    fake_order_score: conversation.fake_order_score || 0,
  }).select().single();
  
  return { orderId: order?.id, invoiceNumber };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Check if AI is globally enabled
  const aiConfig = await isAIEnabled(supabase);
  if (!aiConfig.enabled) {
    console.log(`[AI Agent] AI is globally disabled from admin settings`);
    return new Response(JSON.stringify({ 
      skip: true, 
      reason: "AI is disabled from admin panel",
      reply: "AI বর্তমানে বন্ধ আছে।" 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  
  console.log(`[AI Agent] AI enabled: useCustomKey=${aiConfig.useCustomKey}`);
  
  try {
    const body = await req.json();
    const { pageId, senderId, senderName, messageText, messageType = "text", attachments,
            isComment = false, commentId, postId, postContent, parentCommentId, 
            isReplyToPageComment, userId } = body;
    
    console.log(`[AI Agent] Processing ${isComment ? "comment" : "message"} for page ${pageId}`);
    
    // Get page memory
    const pageMemory = await getPageMemory(supabase, pageId);
    if (!pageMemory) {
      return new Response(JSON.stringify({ error: "Page not configured", reply: "দুঃখিত, AI সেটআপ করা হয়নি।" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    const effectiveUserId = userId || pageMemory.user_id;
    
    // Check automation settings
    const settings = pageMemory.automation_settings || {};
    const orderTakingEnabled = settings.orderTaking === true;
    const autoCommentReplyEnabled = settings.autoCommentReply === true;
    const autoInboxReplyEnabled = settings.autoInboxReply === true;
    
    console.log(`[AI Agent] Settings: orderTaking=${orderTakingEnabled}, autoComment=${autoCommentReplyEnabled}, autoInbox=${autoInboxReplyEnabled}`);
    
    if (isComment && !autoCommentReplyEnabled) {
      return new Response(JSON.stringify({ skip: true, reason: "Comment auto-reply disabled" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!isComment && !autoInboxReplyEnabled) {
      return new Response(JSON.stringify({ skip: true, reason: "Inbox auto-reply disabled" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    // Get products
    const allProducts = await getAllProducts(supabase, effectiveUserId);
    let productContext = await findProductByName(supabase, effectiveUserId, messageText);
    if (!productContext && postContent) {
      productContext = await findProductByName(supabase, effectiveUserId, postContent);
    }
    
    // Get or create conversation
    const conversation = await getOrCreateConversation(supabase, effectiveUserId, pageId, senderId, senderName);
    
    // Detect intent and sentiment
    const intent = detectIntent(messageText, conversation.conversation_state);
    const sentiment = detectSentiment(messageText);
    const fakeScore = calculateFakeOrderScore(conversation.message_history || [], conversation.conversation_state, conversation.fake_order_score || 0, messageText);
    
    console.log(`[AI Agent] Intent: ${intent}, Sentiment: ${sentiment}, State: ${conversation.conversation_state}`);
    
    // CRITICAL: Check if we have any real products configured
    const hasRealProducts = allProducts.length > 0 || (pageMemory.products_summary && pageMemory.products_summary.trim().length > 10);
    
    console.log(`[AI Agent] Products check: dbProducts=${allProducts.length}, summaryLength=${pageMemory.products_summary?.length || 0}, hasRealProducts=${hasRealProducts}`);
    
    // Get message history from database
    let messageHistory = conversation.message_history || [];
    
    // *** SMART HALLUCINATION DETECTION (only when NO products exist) ***
    // Build valid product names/prices from our actual product list
    const validProductNames = allProducts.map(p => p.name.toLowerCase());
    const validPrices = allProducts.map(p => p.price);
    
    // Only check for hallucination if we have NO products at all
    let hasHallucination = false;
    if (!hasRealProducts) {
      // If no products configured, ANY product/price mention is hallucination
      const pricePattern = /৳\s*\d+|টাকা/i;
      hasHallucination = messageHistory.some((m: any) => 
        m.role === "assistant" && pricePattern.test(m.content || "")
      );
      
      if (hasHallucination) {
        console.log(`[AI Agent] 🚨 HALLUCINATION: AI mentioned prices but no products configured - PURGING history!`);
      } else {
        console.log(`[AI Agent] ⚠️ NO PRODUCTS CONFIGURED - Preventing hallucination`);
      }
      
      // COMPLETELY RESET only when NO products
      if (conversation.id) {
        await supabase.from("ai_conversations").update({
          message_history: [],
          customer_summary: null,
          current_product_id: null,
          current_product_name: null,
          current_product_price: null,
          conversation_state: "idle",
        }).eq("id", conversation.id);
      }
      messageHistory = [];
    } else {
      // We HAVE products - check for WRONG prices (not matching our actual products)
      for (const msg of messageHistory) {
        if (msg.role !== "assistant") continue;
        const content = msg.content || "";
        
        // Extract any price mentioned
        const priceMatches = content.match(/৳\s*(\d+)/g);
        if (priceMatches) {
          for (const match of priceMatches) {
            const price = parseInt(match.replace(/৳\s*/, ""));
            // If AI mentioned a price that's NOT in our valid prices list
            if (!validPrices.includes(price) && price > 0 && price !== 50 && price !== 60 && price !== 100) {
              console.log(`[AI Agent] ⚠️ Wrong price detected: ${price} not in valid prices [${validPrices.join(",")}]`);
              // Don't purge all history, just trim to last 3 messages
              messageHistory = messageHistory.slice(-3);
              break;
            }
          }
        }
      }
    }
    
    // Add current message to history
    messageHistory.push({
      role: "user", content: messageText, timestamp: new Date().toISOString(),
      intent, sentiment, messageType,
      productContext: productContext ? { name: productContext.name, price: productContext.price } : null,
    });
    
    // Handle comments
    if (isComment) {
      const smartAnalysis = smartAnalyzeComment(messageText, messageType, attachments, 
        { post_id: postId || "", post_text: postContent }, productContext || undefined, 
        isReplyToPageComment, parentCommentId, senderName);
      
      console.log(`[AI Agent] Smart Analysis: ${smartAnalysis.commentType}, needsInbox=${smartAnalysis.needsInboxMessage}`);
      
      let inboxMessage: string | undefined;
      if (smartAnalysis.needsInboxMessage) {
        const prompt = buildSystemPrompt(pageMemory, productContext, allProducts, orderTakingEnabled);
        inboxMessage = await callAI(prompt, messageHistory);
      }
      
      // Update conversation
      await supabase.from("ai_conversations").update({
        message_history: trimMessageHistory(messageHistory),
        last_message_at: new Date().toISOString(),
        total_messages_count: (conversation.total_messages_count || 0) + 1,
      }).eq("id", conversation.id);
      
      return new Response(JSON.stringify({
        commentReply: smartAnalysis.commentReply,
        inboxMessage,
        reactionType: smartAnalysis.reactionType,
        skipInboxMessage: !smartAnalysis.needsInboxMessage,
        smartAnalysis: { type: smartAnalysis.commentType, sentiment: smartAnalysis.sentiment },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    // Handle inbox messages
    let nextState = conversation.conversation_state;
    let collectedData: any = {};
    
    // State transitions
    if (!orderTakingEnabled) {
      if (["collecting_name", "collecting_phone", "collecting_address", "order_confirmation"].includes(nextState)) {
        nextState = "idle";
      } else if (intent === "order_intent") {
        nextState = "product_inquiry";
      }
    } else {
      if (conversation.conversation_state === "collecting_name" && intent !== "cancellation") {
        collectedData.collected_name = messageText.trim();
        nextState = "collecting_phone";
      } else if (conversation.conversation_state === "collecting_phone") {
        const phoneMatch = messageText.replace(/\s|-/g, "").match(/(?:\+?88)?01[3-9]\d{8}/);
        if (phoneMatch) {
          collectedData.collected_phone = phoneMatch[0].replace(/^\+?88/, "");
          nextState = "collecting_address";
        }
      } else if (conversation.conversation_state === "collecting_address" && intent !== "cancellation") {
        collectedData.collected_address = messageText.trim();
        nextState = "order_confirmation";
      } else if (conversation.conversation_state === "order_confirmation" && intent === "confirmation") {
        nextState = "order_complete";
      } else {
        nextState = getNextState(conversation.conversation_state, intent, orderTakingEnabled);
      }
    }
    
    // Build prompt and get AI response
    const systemPrompt = buildSystemPrompt(pageMemory, productContext, allProducts, orderTakingEnabled);
    
    // Handle media messages
    let imageUrls: string[] = [];
    if (messageType === "image" && attachments) {
      for (const att of attachments) {
        const url = att.payload?.url || att.url;
        if (url?.startsWith("http")) imageUrls.push(url);
      }
    }
    
    const aiReply = await callAI(systemPrompt, messageHistory, imageUrls.length > 0 ? imageUrls : undefined);
    
    // Create order if complete
    let orderId: string | undefined, invoiceNumber: string | undefined;
    if (nextState === "order_complete" && productContext) {
      const orderResult = await createOrder(supabase, effectiveUserId, pageId, 
        { ...conversation, ...collectedData }, productContext);
      orderId = orderResult.orderId;
      invoiceNumber = orderResult.invoiceNumber;
      nextState = "idle";
    }
    
    // Add AI response to history
    messageHistory.push({ role: "assistant", content: aiReply, timestamp: new Date().toISOString() });
    
    // Update conversation in database
    await supabase.from("ai_conversations").update({
      conversation_state: nextState,
      message_history: trimMessageHistory(messageHistory),
      customer_summary: generateCustomerSummary(messageHistory, conversation.customer_summary, senderName),
      last_products_discussed: extractProductsDiscussed(messageHistory),
      fake_order_score: fakeScore,
      last_message_at: new Date().toISOString(),
      total_messages_count: (conversation.total_messages_count || 0) + 1,
      ...collectedData,
      ...(productContext ? { current_product_id: productContext.id, current_product_name: productContext.name, current_product_price: productContext.price } : {}),
    }).eq("id", conversation.id);
    
    // Build response
    const response: any = {
      reply: aiReply,
      reactionType: sentiment === "positive" ? "LOVE" : "LIKE",
      conversationState: nextState,
      productContext: productContext ? { name: productContext.name, price: productContext.price } : null,
    };
    
    if (orderId) {
      response.orderId = orderId;
      response.invoiceNumber = invoiceNumber;
    }
    
    return new Response(JSON.stringify(response), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    
  } catch (error) {
    console.error("[AI Agent] Error:", error);
    return new Response(JSON.stringify({ error: "Internal error", reply: "দুঃখিত, একটু সমস্যা হয়েছে।" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
