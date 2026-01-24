import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface MessageContext {
  pageId: string;
  senderId: string;
  senderName?: string;
  messageText: string;
  messageType: "text" | "image" | "audio" | "sticker" | "emoji";
  attachments?: any[];
  isComment?: boolean;
  commentId?: string;
  postId?: string;
}

interface PageMemory {
  business_description?: string;
  products_summary?: string;
  preferred_tone?: string;
  detected_language?: string;
  automation_settings?: Record<string, boolean>;
  selling_rules?: {
    usePriceFromProduct: boolean;
    allowDiscount: boolean;
    maxDiscountPercent: number;
    allowLowProfitSale: boolean;
  };
  ai_behavior_rules?: {
    neverHallucinate: boolean;
    askClarificationIfUnsure: boolean;
    askForClearerPhotoIfNeeded: boolean;
    confirmBeforeOrder: boolean;
  };
  payment_rules?: {
    codAvailable: boolean;
    advanceRequiredAbove: number;
    advancePercentage: number;
  };
}

interface ConversationState {
  id: string;
  conversation_state: string;
  current_product_id?: string;
  current_product_name?: string;
  current_product_price?: number;
  current_quantity?: number;
  collected_name?: string;
  collected_phone?: string;
  collected_address?: string;
  fake_order_score: number;
  message_history: any[];
}

interface ProductContext {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  sku?: string;
  is_active: boolean;
  variants?: any[];
}

interface PostContext {
  post_id: string;
  post_text?: string;
  media_type?: string;
  linked_product_id?: string;
  product_detected_name?: string;
  product?: ProductContext;
}

// Detect message intent
function detectIntent(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Price inquiry patterns
  if (/দাম|price|কত|টাকা|cost|rate|কততে|কতো/.test(lowerText)) {
    return "price_inquiry";
  }
  
  // Order patterns
  if (/order|অর্ডার|নিব|কিনব|কিনতে|চাই|দিন|দাও|নেব|লাগবে|buy|purchase/.test(lowerText)) {
    return "order_intent";
  }
  
  // Info request
  if (/details|বিস্তারিত|info|জানতে|কি|কী|available|আছে|stock/.test(lowerText)) {
    return "info_request";
  }
  
  // Greeting
  if (/hi|hello|হাই|হ্যালো|আসসালাম|সালাম|ভাই|sis|bhai|apu/.test(lowerText)) {
    return "greeting";
  }
  
  // Confirmation
  if (/yes|হ্যাঁ|হা|ok|okay|ঠিক|আছে|confirmed|done|হবে/.test(lowerText)) {
    return "confirmation";
  }
  
  // Cancellation
  if (/no|না|cancel|বাদ|থাক|later|পরে/.test(lowerText)) {
    return "cancellation";
  }
  
  return "general";
}

// Detect sentiment for reactions
function detectSentiment(text: string): "positive" | "neutral" | "negative" {
  const lowerText = text.toLowerCase();
  
  const positivePatterns = /thanks|ধন্যবাদ|great|awesome|good|ভালো|সুন্দর|love|excellent|best|amazing|wonderful|❤|👍|🔥|💯/;
  const negativePatterns = /bad|খারাপ|worst|terrible|hate|বাজে|poor|fraud|fake|scam|😡|👎|😤/;
  
  if (positivePatterns.test(lowerText)) return "positive";
  if (negativePatterns.test(lowerText)) return "negative";
  return "neutral";
}

// Detect fake order patterns
function calculateFakeOrderScore(conversation: ConversationState, newMessage: string): number {
  let score = conversation.fake_order_score || 0;
  
  const lowerText = newMessage.toLowerCase();
  
  // Suspicious patterns
  if (/test|পরীক্ষা|checking|চেক/.test(lowerText)) score += 20;
  if (/random|যেকোনো|anything/.test(lowerText)) score += 15;
  if (conversation.message_history.length < 2 && conversation.conversation_state === "collecting_address") score += 25;
  
  // Very short responses during collection
  if (newMessage.length < 3 && ["collecting_name", "collecting_phone", "collecting_address"].includes(conversation.conversation_state)) {
    score += 10;
  }
  
  // Invalid phone pattern
  if (conversation.conversation_state === "collecting_phone") {
    const phonePattern = /^(?:\+?88)?01[3-9]\d{8}$/;
    if (!phonePattern.test(newMessage.replace(/\s|-/g, ""))) {
      score += 15;
    }
  }
  
  return Math.min(score, 100);
}

// Build system prompt based on page memory, rules, and product context
function buildSystemPrompt(
  pageMemory: PageMemory, 
  conversationState: ConversationState,
  productContext?: ProductContext,
  postContext?: PostContext
): string {
  const tone = pageMemory.preferred_tone === "professional" ? "পেশাদার" : "বন্ধুত্বপূর্ণ";
  const language = pageMemory.detected_language === "english" ? "English" : 
                   pageMemory.detected_language === "bangla" ? "বাংলা" : "বাংলা এবং English মিশিয়ে (Banglish)";
  
  let prompt = `You are an AI sales agent for a business. You must behave like a polite, trained human sales representative.

## Business Context
${pageMemory.business_description || "General e-commerce business"}

## Products/Services Overview
${pageMemory.products_summary || "Various products available"}`;

  // Add specific product context if available
  if (productContext) {
    prompt += `

## 🎯 CURRENT PRODUCT BEING DISCUSSED (from customer's comment/inquiry)
- Product Name: ${productContext.name}
- Price: ৳${productContext.price}
- Category: ${productContext.category || "N/A"}
- SKU: ${productContext.sku || "N/A"}
- Description: ${productContext.description || "N/A"}
- Status: ${productContext.is_active ? "In Stock" : "Out of Stock"}

IMPORTANT: When the customer asks about price or details, use THIS product's information.`;
  }

  // Add post context if this is a comment
  if (postContext) {
    prompt += `

## 📱 POST CONTEXT (Comment was made on this post)
- Post Content: ${postContext.post_text || "N/A"}
- Media Type: ${postContext.media_type || "N/A"}`;
    
    if (postContext.product_detected_name && !productContext) {
      prompt += `
- Detected Product: ${postContext.product_detected_name} (Note: exact product not found in database)`;
    }
  }

  prompt += `

## Communication Style
- Tone: ${tone}
- Language: ${language}
- Never rush the customer
- Always prioritize clarity over speed
- Be patient and helpful

## CRITICAL RULES (MUST FOLLOW)`;

  // AI Behavior Rules
  if (pageMemory.ai_behavior_rules?.neverHallucinate) {
    prompt += `
- NEVER make up or guess product information, prices, or availability
- If you don't know something, say "আমি নিশ্চিত না, একটু চেক করে জানাচ্ছি"`;
  }
  
  if (pageMemory.ai_behavior_rules?.askClarificationIfUnsure) {
    prompt += `
- If customer's request is unclear, ask clarifying questions
- Example: "কোন সাইজ/রঙ চাচ্ছেন জানাবেন?"`;
  }
  
  if (pageMemory.ai_behavior_rules?.askForClearerPhotoIfNeeded) {
    prompt += `
- If customer sends unclear product image, politely ask for clearer photo
- Example: "ছবিটা একটু ক্লিয়ার না, আরেকটু ভালো ছবি দিতে পারবেন?"`;
  }
  
  if (pageMemory.ai_behavior_rules?.confirmBeforeOrder) {
    prompt += `
- ALWAYS confirm full order details before finalizing
- Summarize: product name, quantity, price, delivery address, total amount`;
  }

  // Selling Rules
  prompt += `

## Selling Rules`;
  
  if (pageMemory.selling_rules?.usePriceFromProduct) {
    prompt += `
- ONLY quote prices from the product catalog - NEVER guess prices`;
  }
  
  if (pageMemory.selling_rules?.allowDiscount) {
    prompt += `
- You CAN offer discounts up to ${pageMemory.selling_rules.maxDiscountPercent}% maximum
- Only offer discount if customer asks or insists`;
  } else {
    prompt += `
- Do NOT offer any discounts - prices are fixed`;
  }
  
  if (pageMemory.selling_rules?.allowLowProfitSale) {
    prompt += `
- If customer strongly insists, you may agree to minimal profit margin`;
  }

  // Payment Rules
  prompt += `

## Payment Rules`;
  
  if (pageMemory.payment_rules?.codAvailable) {
    prompt += `
- Cash on Delivery (COD) is available`;
  } else {
    prompt += `
- Cash on Delivery NOT available - advance payment required`;
  }
  
  if (pageMemory.payment_rules?.advanceRequiredAbove) {
    prompt += `
- Orders above ৳${pageMemory.payment_rules.advanceRequiredAbove} require ${pageMemory.payment_rules.advancePercentage}% advance payment`;
  }

  // Current conversation state
  prompt += `

## Current Conversation State: ${conversationState.conversation_state}`;
  
  if (conversationState.current_product_name) {
    prompt += `
- Product being discussed: ${conversationState.current_product_name}
- Price: ৳${conversationState.current_product_price}`;
  }
  
  if (conversationState.collected_name) {
    prompt += `
- Customer name: ${conversationState.collected_name}`;
  }
  
  if (conversationState.collected_phone) {
    prompt += `
- Phone: ${conversationState.collected_phone}`;
  }

  // State-specific instructions
  if (conversationState.conversation_state === "collecting_name") {
    prompt += `

You are collecting the customer's NAME. Ask politely for their full name.`;
  } else if (conversationState.conversation_state === "collecting_phone") {
    prompt += `

You are collecting the customer's PHONE NUMBER. Ask for their mobile number.`;
  } else if (conversationState.conversation_state === "collecting_address") {
    prompt += `

You are collecting the customer's DELIVERY ADDRESS. Ask for complete address with area name.`;
  } else if (conversationState.conversation_state === "order_confirmation") {
    prompt += `

Summarize the complete order and ask for final confirmation before placing.`;
  }

  prompt += `

## Response Guidelines
- Keep responses concise but helpful (2-4 sentences max)
- Use appropriate emojis sparingly
- If discussing price/order, be specific and clear
- If customer shows positive sentiment, be appreciative
- Never be pushy or aggressive`;

  return prompt;
}

// Call Lovable AI
async function callAI(systemPrompt: string, messages: any[]): Promise<string> {
  try {
    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI] Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "দুঃখিত, একটু সমস্যা হয়েছে। আবার চেষ্টা করুন।";
  } catch (error) {
    console.error("[AI] Call failed:", error);
    return "দুঃখিত, একটু সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।";
  }
}

// Determine next conversation state based on current state and intent
function getNextState(currentState: string, intent: string, hasAllOrderInfo: boolean): string {
  if (intent === "cancellation") return "idle";
  
  switch (currentState) {
    case "idle":
      if (intent === "order_intent") return "collecting_name";
      if (intent === "price_inquiry" || intent === "info_request") return "product_inquiry";
      return "greeting";
    
    case "greeting":
    case "product_inquiry":
      if (intent === "order_intent") return "collecting_name";
      return currentState;
    
    case "collecting_name":
      return "collecting_phone";
    
    case "collecting_phone":
      return "collecting_address";
    
    case "collecting_address":
      return "order_confirmation";
    
    case "order_confirmation":
      if (intent === "confirmation") return "completed";
      return currentState;
    
    default:
      return currentState;
  }
}

// Get product context from post
async function getProductFromPost(
  supabase: any, 
  pageId: string, 
  postId: string, 
  userId: string
): Promise<{ postContext: PostContext | null; productContext: ProductContext | null }> {
  console.log(`[AI Agent] Looking up post context for post_id: ${postId}`);
  
  // First, check if we have this post synced
  const { data: fbPost, error: postError } = await supabase
    .from("facebook_posts")
    .select(`
      post_id,
      post_text,
      media_type,
      linked_product_id,
      product_detected_name,
      products:linked_product_id (
        id,
        name,
        price,
        description,
        category,
        sku,
        is_active
      )
    `)
    .eq("page_id", pageId)
    .eq("post_id", postId)
    .single();

  if (fbPost) {
    const postContext: PostContext = {
      post_id: fbPost.post_id,
      post_text: fbPost.post_text,
      media_type: fbPost.media_type,
      linked_product_id: fbPost.linked_product_id,
      product_detected_name: fbPost.product_detected_name,
    };

    let productContext: ProductContext | null = null;
    if (fbPost.products) {
      productContext = fbPost.products as ProductContext;
    }

    console.log(`[AI Agent] Found post context with product: ${productContext?.name || 'none'}`);
    return { postContext, productContext };
  }

  console.log(`[AI Agent] Post not found in database, will try to fetch from Facebook`);
  return { postContext: null, productContext: null };
}

// Try to match product by name from message text
async function findProductByName(
  supabase: any, 
  userId: string, 
  messageText: string
): Promise<ProductContext | null> {
  // Get all user's products
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price, description, category, sku, is_active")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error || !products || products.length === 0) {
    return null;
  }

  // Simple fuzzy match - check if any product name appears in the message
  const lowerMessage = messageText.toLowerCase();
  for (const product of products) {
    const productNameLower = product.name.toLowerCase();
    // Check for partial match
    if (lowerMessage.includes(productNameLower) || 
        productNameLower.split(" ").some((word: string) => word.length > 3 && lowerMessage.includes(word))) {
      console.log(`[AI Agent] Matched product by name: ${product.name}`);
      return product as ProductContext;
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { 
      pageId, 
      senderId, 
      senderName,
      messageText, 
      messageType = "text",
      attachments,
      isComment = false,
      commentId,
      postId,
      userId 
    } = body as MessageContext & { userId: string };

    console.log(`[AI Agent] Processing ${isComment ? "comment" : "message"} for page ${pageId}`);
    console.log(`[AI Agent] Post ID: ${postId}, Message: ${messageText?.substring(0, 50)}`);

    // Get page memory for context
    const { data: pageMemory } = await supabase
      .from("page_memory")
      .select("*")
      .eq("page_id", pageId)
      .single();

    if (!pageMemory) {
      console.error("[AI Agent] No page memory found for page:", pageId);
      return new Response(JSON.stringify({ 
        error: "Page not configured",
        reply: "দুঃখিত, এই পেজের জন্য AI সেটআপ করা হয়নি।" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if automation is enabled
    const settings = pageMemory.automation_settings || {};
    if (isComment && !settings.autoCommentReply) {
      return new Response(JSON.stringify({ 
        skip: true, 
        reason: "Comment auto-reply disabled" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isComment && !settings.autoInboxReply) {
      return new Response(JSON.stringify({ 
        skip: true, 
        reason: "Inbox auto-reply disabled" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get product context from post (if comment) or from message text
    let productContext: ProductContext | null = null;
    let postContext: PostContext | null = null;

    if (isComment && postId) {
      // Try to get product from the post
      const postResult = await getProductFromPost(supabase, pageId, postId, userId);
      postContext = postResult.postContext;
      productContext = postResult.productContext;
    }

    // If no product from post, try to match from message text
    if (!productContext && messageText) {
      productContext = await findProductByName(supabase, userId, messageText);
    }

    // Get or create conversation state
    let { data: conversation } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("page_id", pageId)
      .eq("sender_id", senderId)
      .single();

    if (!conversation) {
      const { data: newConv, error } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: userId,
          page_id: pageId,
          sender_id: senderId,
          sender_name: senderName,
          conversation_state: "idle",
          message_history: [],
        })
        .select()
        .single();
      
      if (error) {
        console.error("[AI Agent] Failed to create conversation:", error);
        throw error;
      }
      conversation = newConv;
    }

    // If we found a product, update the conversation with it
    if (productContext && !conversation.current_product_id) {
      await supabase
        .from("ai_conversations")
        .update({
          current_product_id: productContext.id,
          current_product_name: productContext.name,
          current_product_price: productContext.price,
        })
        .eq("id", conversation.id);

      conversation.current_product_id = productContext.id;
      conversation.current_product_name = productContext.name;
      conversation.current_product_price = productContext.price;
    }

    // Detect intent and sentiment
    const intent = detectIntent(messageText);
    const sentiment = detectSentiment(messageText);
    
    console.log(`[AI Agent] Intent: ${intent}, Sentiment: ${sentiment}, State: ${conversation.conversation_state}`);
    console.log(`[AI Agent] Product context: ${productContext?.name || 'none'}`);

    // Handle image messages
    let processedMessage = messageText;
    if (messageType === "image" && attachments && attachments.length > 0) {
      if (pageMemory.ai_behavior_rules?.askForClearerPhotoIfNeeded) {
        processedMessage = "[Customer sent an image - analyze if it's a product inquiry]";
      }
    }

    // Handle voice messages
    if (messageType === "audio") {
      processedMessage = "[Customer sent a voice message - ask them to type their message]";
    }

    // Calculate fake order score
    const fakeScore = calculateFakeOrderScore(conversation, messageText);

    // Update message history
    const messageHistory = conversation.message_history || [];
    messageHistory.push({
      role: "user",
      content: processedMessage,
      timestamp: new Date().toISOString(),
      intent,
      sentiment,
      productContext: productContext ? { name: productContext.name, price: productContext.price } : null,
    });

    // Determine next state
    let nextState = conversation.conversation_state;
    let collectedData: any = {};

    // Extract info based on current state
    if (conversation.conversation_state === "collecting_name" && intent !== "cancellation") {
      collectedData.collected_name = messageText.trim();
      nextState = "collecting_phone";
    } else if (conversation.conversation_state === "collecting_phone" && intent !== "cancellation") {
      const phoneMatch = messageText.match(/(?:\+?88)?01[3-9]\d{8}/);
      if (phoneMatch) {
        collectedData.collected_phone = phoneMatch[0];
        nextState = "collecting_address";
      }
    } else if (conversation.conversation_state === "collecting_address" && intent !== "cancellation") {
      collectedData.collected_address = messageText.trim();
      nextState = "order_confirmation";
    } else if (conversation.conversation_state === "order_confirmation" && intent === "confirmation") {
      nextState = "completed";
    } else {
      nextState = getNextState(conversation.conversation_state, intent, false);
    }

    // Update conversation state
    const { error: updateError } = await supabase
      .from("ai_conversations")
      .update({
        conversation_state: nextState,
        fake_order_score: fakeScore,
        message_history: messageHistory,
        last_message_at: new Date().toISOString(),
        ...collectedData,
      })
      .eq("id", conversation.id);

    if (updateError) {
      console.error("[AI Agent] Failed to update conversation:", updateError);
    }

    // Build AI prompt and get response with product context
    const updatedConversation = { ...conversation, conversation_state: nextState, ...collectedData };
    const systemPrompt = buildSystemPrompt(pageMemory, updatedConversation, productContext || undefined, postContext || undefined);
    
    // Format message history for AI
    const aiMessages = messageHistory.slice(-10).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    const aiReply = await callAI(systemPrompt, aiMessages);

    // Add AI response to history
    messageHistory.push({
      role: "assistant",
      content: aiReply,
      timestamp: new Date().toISOString(),
    });

    await supabase
      .from("ai_conversations")
      .update({ message_history: messageHistory })
      .eq("id", conversation.id);

    // If order is completed, create the order
    let orderId = null;
    let invoiceNumber = null;
    
    if (nextState === "completed" && updatedConversation.collected_name && updatedConversation.collected_phone && updatedConversation.collected_address) {
      // Generate invoice number
      const { data: invoiceData } = await supabase.rpc("generate_invoice_number");
      invoiceNumber = invoiceData;

      const orderProduct = productContext || {
        name: updatedConversation.current_product_name,
        price: updatedConversation.current_product_price,
      };

      const { data: order, error: orderError } = await supabase
        .from("ai_orders")
        .insert({
          user_id: userId,
          page_id: pageId,
          conversation_id: conversation.id,
          customer_fb_id: senderId,
          customer_name: updatedConversation.collected_name,
          customer_phone: updatedConversation.collected_phone,
          customer_address: updatedConversation.collected_address,
          products: orderProduct.name ? [{
            id: productContext?.id,
            name: orderProduct.name,
            price: orderProduct.price,
            quantity: updatedConversation.current_quantity || 1,
          }] : [],
          subtotal: orderProduct.price || 0,
          total: orderProduct.price || 0,
          payment_method: pageMemory.payment_rules?.codAvailable ? "cod" : "advance",
          fake_order_score: fakeScore,
          invoice_number: invoiceNumber,
          order_status: fakeScore > 50 ? "pending" : "confirmed",
        })
        .select()
        .single();

      if (order) {
        orderId = order.id;
        console.log(`[AI Agent] Order created: ${invoiceNumber}`);
      }
      
      // Reset conversation for next order
      await supabase
        .from("ai_conversations")
        .update({
          conversation_state: "idle",
          current_product_id: null,
          current_product_name: null,
          current_product_price: null,
          collected_name: null,
          collected_phone: null,
          collected_address: null,
        })
        .eq("id", conversation.id);
    }

    // Prepare response
    const response: any = {
      reply: aiReply,
      intent,
      sentiment,
      conversationState: nextState,
      shouldReact: isComment,
      reactionType: sentiment === "positive" ? "LOVE" : "LIKE",
      fakeOrderScore: fakeScore,
      productContext: productContext ? { name: productContext.name, price: productContext.price } : null,
    };

    // For comments, also prepare inbox message
    if (isComment && (intent === "order_intent" || intent === "price_inquiry" || intent === "info_request")) {
      // Include product info in the comment reply if available
      if (productContext) {
        response.commentReply = `ধন্যবাদ! ${productContext.name} এর দাম ৳${productContext.price}। বিস্তারিত জানতে ইনবক্স করুন 📩`;
      } else {
        response.commentReply = "ধন্যবাদ! বিস্তারিত জানতে আপনার ইনবক্স চেক করুন 📩";
      }
      response.shouldSendInbox = true;
      response.inboxMessage = aiReply;
    }

    if (orderId) {
      response.orderId = orderId;
      response.invoiceNumber = invoiceNumber;
    }

    console.log(`[AI Agent] Response prepared for ${senderId}, state: ${nextState}, product: ${productContext?.name || 'none'}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[AI Agent] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      reply: "দুঃখিত, একটু সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
