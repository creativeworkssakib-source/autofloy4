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
  messageType: "text" | "image" | "audio" | "sticker" | "emoji" | "video" | "file";
  attachments?: any[];
  isComment?: boolean;
  commentId?: string;
  postId?: string;
  parentCommentId?: string;
  isReplyToPageComment?: boolean;
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

// *** SMART COMMENT ANALYSIS - Determines if inbox message is needed ***
interface SmartCommentAnalysis {
  needsInboxMessage: boolean;
  commentReply: string;
  reactionType: "LOVE" | "LIKE" | "HAHA" | "WOW" | "NONE";
  reason: string;
  commentType: string;
  sentiment: "positive" | "neutral" | "negative";
  isQuestion: boolean;
  isOrderIntent: boolean;
  isPriceInquiry: boolean;
  isJustReaction: boolean;
  isThankYou: boolean;
  isSticker: boolean;
  isPhoto: boolean;
}

// *** SMART: Analyze sticker/emoji to understand meaning ***
function analyzeSticker(stickerType?: string, messageText?: string): {
  meaning: string;
  sentiment: "positive" | "neutral" | "negative";
  reaction: "LOVE" | "LIKE" | "HAHA" | "WOW" | "NONE";
} {
  const text = messageText?.toLowerCase() || "";
  
  // Common positive stickers/emoji patterns
  if (/👍|💪|👏|🙌|✌️|🤝|💯/.test(text)) {
    return { meaning: "approval/support", sentiment: "positive", reaction: "LIKE" };
  }
  if (/❤️|❤|💕|💖|💗|💓|💞|💝|🥰|😍|😘/.test(text)) {
    return { meaning: "love/affection", sentiment: "positive", reaction: "LOVE" };
  }
  if (/😂|🤣|😆|😄|😁|😀|😃|😅/.test(text)) {
    return { meaning: "happiness/laughter", sentiment: "positive", reaction: "HAHA" };
  }
  if (/😮|😲|🤯|😱|🔥|⚡|💥/.test(text)) {
    return { meaning: "surprise/amazement", sentiment: "positive", reaction: "WOW" };
  }
  if (/😢|😭|😔|😞|😟|🙁/.test(text)) {
    return { meaning: "sadness", sentiment: "negative", reaction: "NONE" };
  }
  if (/😡|😤|👎|🖕|💔/.test(text)) {
    return { meaning: "anger/dislike", sentiment: "negative", reaction: "NONE" };
  }
  if (/🤔|🤷|❓|⁉️/.test(text)) {
    return { meaning: "question/confusion", sentiment: "neutral", reaction: "LIKE" };
  }
  
  // Default for unknown stickers
  return { meaning: "general_reaction", sentiment: "neutral", reaction: "LIKE" };
}

// *** SMART: Analyze photo to understand intent ***
function analyzePhotoIntent(attachments?: any[], messageText?: string): {
  photoType: string;
  needsResponse: boolean;
  responseType: string;
} {
  const text = messageText?.toLowerCase() || "";
  
  // Check for screenshot (usually means order proof, payment proof)
  if (/screenshot|স্ক্রিনশট|ss|payment|পেমেন্ট|transaction|ট্রানজেকশন|slip|স্লিপ/.test(text)) {
    return { photoType: "payment_proof", needsResponse: true, responseType: "verify_payment" };
  }
  
  // Check for product inquiry
  if (/এটা|এই|এইটা|this|এইটার|এটার|দাম|price|কত|available/.test(text)) {
    return { photoType: "product_inquiry", needsResponse: true, responseType: "identify_product" };
  }
  
  // Just a photo without context
  if (!text || text.trim().length < 3) {
    return { photoType: "unknown_photo", needsResponse: true, responseType: "ask_context" };
  }
  
  return { photoType: "general", needsResponse: true, responseType: "general" };
}

// *** MASTER SMART ANALYSIS: Deeply analyze comment and decide response ***
function smartAnalyzeComment(
  messageText: string,
  messageType: string,
  attachments?: any[],
  postContext?: PostContext,
  productContext?: ProductContext,
  isReplyToPageComment?: boolean,
  parentCommentId?: string,
  senderName?: string
): SmartCommentAnalysis {
  const text = messageText?.toLowerCase().trim() || "";
  const originalText = messageText?.trim() || "";
  const shortName = senderName?.split(" ")[0] || "";
  
  // *** STICKER HANDLING ***
  if (messageType === "sticker" || /^\s*[^\w\s\u0980-\u09FF]{1,5}\s*$/.test(originalText)) {
    const stickerAnalysis = analyzeSticker(undefined, originalText);
    
    return {
      needsInboxMessage: false, // Stickers don't need inbox
      commentReply: stickerAnalysis.sentiment === "positive" 
        ? `${stickerAnalysis.reaction === "LOVE" ? "💕" : "😊"}`
        : stickerAnalysis.sentiment === "negative"
          ? "" // Don't reply to negative stickers
          : "😊",
      reactionType: stickerAnalysis.reaction,
      reason: `Sticker detected: ${stickerAnalysis.meaning}`,
      commentType: "sticker",
      sentiment: stickerAnalysis.sentiment,
      isQuestion: false,
      isOrderIntent: false,
      isPriceInquiry: false,
      isJustReaction: true,
      isThankYou: false,
      isSticker: true,
      isPhoto: false,
    };
  }
  
  // *** PHOTO/IMAGE HANDLING ***
  if (messageType === "image" || (attachments && attachments.some(a => a.type === "image"))) {
    const photoAnalysis = analyzePhotoIntent(attachments, messageText);
    
    let commentReply = "";
    let needsInbox = true;
    
    if (photoAnalysis.responseType === "ask_context") {
      // Photo without context - ask what they want to know
      commentReply = `ধন্যবাদ ছবিটা পাঠানোর জন্য! 📷 এই ছবি সম্পর্কে কী জানতে চাইছেন বলুন? 🙂`;
      needsInbox = false; // Wait for their response first
    } else if (photoAnalysis.responseType === "verify_payment") {
      commentReply = `পেমেন্ট স্ক্রিনশট পেয়েছি! ✅ ভেরিফাই করে আপডেট দেব। ইনবক্স চেক করুন 📩`;
      needsInbox = true;
    } else if (photoAnalysis.responseType === "identify_product") {
      commentReply = `ছবিটা দেখলাম! 👀 এই প্রোডাক্টের বিস্তারিত ইনবক্সে পাঠিয়ে দিচ্ছি 📩`;
      needsInbox = true;
    } else {
      commentReply = `ছবিটা পেয়েছি! 📷 আপনার জন্য কী করতে পারি বলুন 🙂`;
      needsInbox = false;
    }
    
    return {
      needsInboxMessage: needsInbox,
      commentReply,
      reactionType: "LIKE",
      reason: `Photo detected: ${photoAnalysis.photoType}`,
      commentType: "photo",
      sentiment: "neutral",
      isQuestion: photoAnalysis.responseType === "identify_product",
      isOrderIntent: false,
      isPriceInquiry: photoAnalysis.responseType === "identify_product",
      isJustReaction: false,
      isThankYou: false,
      isSticker: false,
      isPhoto: true,
    };
  }
  
  // *** POSITIVE FEEDBACK - Just appreciation, NO inbox needed ***
  const positivePraise = /great|good|nice|awesome|excellent|best|amazing|wonderful|perfect|super|fantastic|দারুণ|চমৎকার|অসাধারণ|সুন্দর|মাশাল্লাহ|অসাম|বাহ|খুব ভালো|অনেক ভালো|বেস্ট|নাইস|wow|woow|good job|well done|keep it up|keep going|love it|loved|ভালোবাসি|❤️|❤|💕|👍|🔥|💯|💕|😍|🥰|😊|👏|💪|🙌/i;
  const thankPatterns = /thanks|thank you|ধন্যবাদ|ty|thx|অনেক ধন্যবাদ/i;
  const justEmojiOrShort = /^[\s]*[👍❤️🔥💯💕😍🥰😊👏💪🙌❤]+[\s]*$|^.{1,4}$/;
  
  // Pure positive feedback - just thank them, NO inbox
  if ((positivePraise.test(text) || thankPatterns.test(text) || justEmojiOrShort.test(originalText)) &&
      !text.includes("?") && 
      !/কত|দাম|price|অর্ডার|order|কিনব|নিব|চাই|লাগবে|available|আছে|stock|সাইজ|size/.test(text)) {
    
    let reply = "";
    let reaction: "LOVE" | "LIKE" = "LOVE";
    
    if (thankPatterns.test(text)) {
      reply = `আপনাকেও ধন্যবাদ ${shortName}! 🙏 আমাদের সাথে থাকার জন্য কৃতজ্ঞ। 😊`;
    } else if (justEmojiOrShort.test(originalText)) {
      reply = `💕🥰`;
    } else if (/love|ভালোবাসি|💕|❤/.test(text)) {
      reply = `অনেক অনেক ধন্যবাদ ${shortName}! 💕 আপনার ভালোবাসা আমাদের অনুপ্রেরণা! 💖`;
    } else {
      reply = `অনেক ধন্যবাদ ${shortName}! 🥰 আপনার সুন্দর কথা আমাদের অনুপ্রাণিত করে। 💕`;
    }
    
    return {
      needsInboxMessage: false, // NO inbox for pure positive feedback
      commentReply: reply,
      reactionType: reaction,
      reason: "Pure positive feedback - no inquiry detected",
      commentType: "positive_feedback",
      sentiment: "positive",
      isQuestion: false,
      isOrderIntent: false,
      isPriceInquiry: false,
      isJustReaction: true,
      isThankYou: thankPatterns.test(text),
      isSticker: false,
      isPhoto: false,
    };
  }
  
  // *** REPLY TO PAGE'S COMMENT - Smart context-aware response ***
  if (isReplyToPageComment || parentCommentId) {
    // Customer says they're going to inbox
    if (/sms|message|inbox|মেসেজ|ইনবক্স|msg|dm|দিচ্ছি|করছি|দিব|করব|পাঠাচ্ছি|দিয়েছি|দিলাম|করলাম|পাঠালাম|করতেছি|kortec/i.test(text)) {
      return {
        needsInboxMessage: false, // They're coming to inbox, don't spam them
        commentReply: `ধন্যবাদ! 🙏 ইনবক্সে আপনার মেসেজের অপেক্ষায় আছি! 📩😊`,
        reactionType: "LIKE",
        reason: "Customer indicated they're messaging inbox",
        commentType: "going_to_inbox",
        sentiment: "neutral",
        isQuestion: false,
        isOrderIntent: false,
        isPriceInquiry: false,
        isJustReaction: false,
        isThankYou: false,
        isSticker: false,
        isPhoto: false,
      };
    }
    
    // Simple acknowledgment (ok, understood, etc.)
    if (/^(ok|okay|ওকে|ঠিক আছে|বুঝলাম|বুঝেছি|আচ্ছা|হ্যাঁ|হা|yes|yep|yeah|ji|জি|hmm|হুম|হবে|করব)[\s!.]*$/i.test(originalText)) {
      return {
        needsInboxMessage: false,
        commentReply: `ধন্যবাদ! 🙏 যেকোনো প্রয়োজনে জানাবেন! 😊`,
        reactionType: "LIKE",
        reason: "Simple acknowledgment",
        commentType: "acknowledgment",
        sentiment: "neutral",
        isQuestion: false,
        isOrderIntent: false,
        isPriceInquiry: false,
        isJustReaction: true,
        isThankYou: false,
        isSticker: false,
        isPhoto: false,
      };
    }
    
    // Follow-up question
    if (/\?|কি|কী|কত|কোথায়|কেন|কিভাবে|কবে|আছে|what|how|where|when|why|which|available|stock|দাম|price|size|সাইজ|color|রঙ/.test(text)) {
      return {
        needsInboxMessage: true, // Send detailed answer to inbox
        commentReply: `ভালো প্রশ্ন ${shortName}! 👍 বিস্তারিত উত্তর ইনবক্সে পাঠিয়ে দিলাম। চেক করুন 📩`,
        reactionType: "LIKE",
        reason: "Follow-up question in comment reply",
        commentType: "follow_up_question",
        sentiment: "neutral",
        isQuestion: true,
        isOrderIntent: false,
        isPriceInquiry: /কত|দাম|price/.test(text),
        isJustReaction: false,
        isThankYou: false,
        isSticker: false,
        isPhoto: false,
      };
    }
    
    // Providing info (name, phone, address)
    if (/^[a-zA-Z\u0980-\u09FF\s]{2,50}$|01[3-9]\d{8}|আমার নাম|আমি |my name|i am/i.test(originalText)) {
      return {
        needsInboxMessage: true,
        commentReply: `ধন্যবাদ! 🙏 আপনার তথ্য পেয়েছি। বিস্তারিত ইনবক্সে জানাচ্ছি 📩`,
        reactionType: "LIKE",
        reason: "Customer providing info in reply",
        commentType: "providing_info",
        sentiment: "neutral",
        isQuestion: false,
        isOrderIntent: true,
        isPriceInquiry: false,
        isJustReaction: false,
        isThankYou: false,
        isSticker: false,
        isPhoto: false,
      };
    }
    
    // General reply - acknowledge but may not need inbox
    return {
      needsInboxMessage: text.length > 20, // Only inbox if they wrote something substantial
      commentReply: `ধন্যবাদ ${shortName}! 🙏 ${text.length > 20 ? "বিস্তারিত ইনবক্সে জানাচ্ছি 📩" : "আরো কিছু জানতে চাইলে বলুন! 😊"}`,
      reactionType: "LIKE",
      reason: "General reply to page's comment",
      commentType: "general_reply",
      sentiment: "neutral",
      isQuestion: false,
      isOrderIntent: false,
      isPriceInquiry: false,
      isJustReaction: text.length <= 10,
      isThankYou: false,
      isSticker: false,
      isPhoto: false,
    };
  }
  
  // *** ORIGINAL COMMENT (not a reply) ***
  
  // Price inquiry - needs inbox
  if (/দাম|price|কত|টাকা|cost|rate|কততে|কতো/.test(text)) {
    return {
      needsInboxMessage: true,
      commentReply: productContext 
        ? `ধন্যবাদ ${shortName}! 🙏 "${productContext.name}" এর দাম ৳${productContext.price}। বিস্তারিত ইনবক্সে পাঠালাম 📩`
        : `ধন্যবাদ ${shortName}! 🙏 দামসহ বিস্তারিত তথ্য ইনবক্সে পাঠিয়ে দিলাম। চেক করুন 📩`,
      reactionType: "LIKE",
      reason: "Price inquiry detected",
      commentType: "price_inquiry",
      sentiment: "neutral",
      isQuestion: true,
      isOrderIntent: false,
      isPriceInquiry: true,
      isJustReaction: false,
      isThankYou: false,
      isSticker: false,
      isPhoto: false,
    };
  }
  
  // Order intent - needs inbox
  if (/order|অর্ডার|নিব|কিনব|কিনতে|চাই|দিন|দাও|নেব|লাগবে|buy|purchase/.test(text)) {
    return {
      needsInboxMessage: true,
      commentReply: `ধন্যবাদ ${shortName}! 🛒 অর্ডার করতে ইনবক্সে মেসেজ করেছি। অনুগ্রহ করে চেক করুন 📩`,
      reactionType: "LIKE",
      reason: "Order intent detected",
      commentType: "order_intent",
      sentiment: "neutral",
      isQuestion: false,
      isOrderIntent: true,
      isPriceInquiry: false,
      isJustReaction: false,
      isThankYou: false,
      isSticker: false,
      isPhoto: false,
    };
  }
  
  // Question (not price) - needs inbox
  if (/\?|কি আছে|কী আছে|available|stock|সাইজ|size|color|রঙ|কোন|which|কিভাবে|how|details|বিস্তারিত/.test(text)) {
    return {
      needsInboxMessage: true,
      commentReply: `ধন্যবাদ ${shortName}! 🙏 আপনার প্রশ্নের উত্তর ইনবক্সে পাঠিয়ে দিলাম। চেক করুন 📩`,
      reactionType: "LIKE",
      reason: "Question detected",
      commentType: "question",
      sentiment: "neutral",
      isQuestion: true,
      isOrderIntent: false,
      isPriceInquiry: false,
      isJustReaction: false,
      isThankYou: false,
      isSticker: false,
      isPhoto: false,
    };
  }
  
  // Greeting - short reply, no inbox
  if (/^(hi|hello|হাই|হ্যালো|আসসালাম|সালাম|ভাই|sis|bhai|apu)[\s!.]*$/i.test(originalText)) {
    return {
      needsInboxMessage: false,
      commentReply: `হাই ${shortName}! 👋 কিভাবে সাহায্য করতে পারি বলুন! 😊`,
      reactionType: "LIKE",
      reason: "Simple greeting",
      commentType: "greeting",
      sentiment: "neutral",
      isQuestion: false,
      isOrderIntent: false,
      isPriceInquiry: false,
      isJustReaction: true,
      isThankYou: false,
      isSticker: false,
      isPhoto: false,
    };
  }
  
  // *** ANALYZE POST CONTEXT to understand why they commented ***
  if (postContext?.post_text) {
    const postText = postContext.post_text.toLowerCase();
    
    // If post is about a product and they just comment something simple
    if (productContext || /product|price|offer|sale|প্রোডাক্ট|দাম|অফার/.test(postText)) {
      // They're probably interested in the product
      return {
        needsInboxMessage: true,
        commentReply: `ধন্যবাদ ${shortName}! 🙏 ${productContext ? `"${productContext.name}" এর বিস্তারিত` : "প্রোডাক্টের তথ্য"} ইনবক্সে পাঠিয়ে দিলাম। চেক করুন 📩`,
        reactionType: "LIKE",
        reason: "Comment on product post - likely interested",
        commentType: "product_interest",
        sentiment: "neutral",
        isQuestion: false,
        isOrderIntent: false,
        isPriceInquiry: false,
        isJustReaction: false,
        isThankYou: false,
        isSticker: false,
        isPhoto: false,
      };
    }
  }
  
  // *** DEFAULT: Short/unclear comment - ask what they want ***
  if (text.length < 15 && !/\?|দাম|কত|order|অর্ডার/.test(text)) {
    return {
      needsInboxMessage: false, // Don't spam inbox for unclear comments
      commentReply: `ধন্যবাদ ${shortName}! 🙏 কিভাবে সাহায্য করতে পারি বলুন! 😊`,
      reactionType: "LIKE",
      reason: "Short/unclear comment - asking for clarification",
      commentType: "unclear",
      sentiment: "neutral",
      isQuestion: false,
      isOrderIntent: false,
      isPriceInquiry: false,
      isJustReaction: true,
      isThankYou: false,
      isSticker: false,
      isPhoto: false,
    };
  }
  
  // Default: Longer comment that might be inquiry - send to inbox
  return {
    needsInboxMessage: true,
    commentReply: `ধন্যবাদ কমেন্ট করার জন্য ${shortName}! 🙏 বিস্তারিত তথ্য ইনবক্সে পাঠিয়ে দিলাম। চেক করুন 📩`,
    reactionType: "LIKE",
    reason: "General comment - sending details to inbox",
    commentType: "general",
    sentiment: "neutral",
    isQuestion: false,
    isOrderIntent: false,
    isPriceInquiry: false,
    isJustReaction: false,
    isThankYou: false,
    isSticker: false,
    isPhoto: false,
  };
}

// Detect message intent
function detectIntent(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (/দাম|price|কত|টাকা|cost|rate|কততে|কতো/.test(lowerText)) {
    return "price_inquiry";
  }
  if (/order|অর্ডার|নিব|কিনব|কিনতে|চাই|দিন|দাও|নেব|লাগবে|buy|purchase/.test(lowerText)) {
    return "order_intent";
  }
  if (/details|বিস্তারিত|info|জানতে|কি|কী|available|আছে|stock/.test(lowerText)) {
    return "info_request";
  }
  if (/hi|hello|হাই|হ্যালো|আসসালাম|সালাম|ভাই|sis|bhai|apu/.test(lowerText)) {
    return "greeting";
  }
  if (/yes|হ্যাঁ|হা|ok|okay|ঠিক|আছে|confirmed|done|হবে/.test(lowerText)) {
    return "confirmation";
  }
  if (/no|না|cancel|বাদ|থাক|later|পরে/.test(lowerText)) {
    return "cancellation";
  }
  
  return "general";
}

// Detect sentiment
function detectSentiment(text: string): "positive" | "neutral" | "negative" {
  const lowerText = text.toLowerCase();
  
  const positivePatterns = /thanks|thank you|ধন্যবাদ|great|awesome|good|ভালো|সুন্দর|love|excellent|best|amazing|wonderful|nice|beautiful|perfect|super|fantastic|❤️|❤|👍|🔥|💯|💕|😍|🥰|😊|👏|💪|🙌|good job|well done|keep it up|মাশাল্লাহ|অসাম|দারুণ|বাহ|চমৎকার|অসাধারণ|খুব ভালো|অনেক ভালো|wow|woow|বেস্ট|নাইস|লাভ/i;
  const negativePatterns = /bad|খারাপ|worst|terrible|hate|বাজে|poor|fraud|fake|scam|😡|👎|😤|💔|বোকা|চোর|প্রতারক|ফেক/i;
  
  if (positivePatterns.test(lowerText)) return "positive";
  if (negativePatterns.test(lowerText)) return "negative";
  return "neutral";
}

// Calculate fake order score
function calculateFakeOrderScore(conversation: ConversationState, newMessage: string): number {
  let score = conversation.fake_order_score || 0;
  const lowerText = newMessage.toLowerCase();
  
  if (/test|পরীক্ষা|checking|চেক/.test(lowerText)) score += 20;
  if (/random|যেকোনো|anything/.test(lowerText)) score += 15;
  if (conversation.message_history.length < 2 && conversation.conversation_state === "collecting_address") score += 25;
  
  if (newMessage.length < 3 && ["collecting_name", "collecting_phone", "collecting_address"].includes(conversation.conversation_state)) {
    score += 10;
  }
  
  if (conversation.conversation_state === "collecting_phone") {
    const phonePattern = /^(?:\+?88)?01[3-9]\d{8}$/;
    if (!phonePattern.test(newMessage.replace(/\s|-/g, ""))) {
      score += 15;
    }
  }
  
  return Math.min(score, 100);
}

// Build system prompt
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

  if (productContext) {
    prompt += `

## 🎯 CURRENT PRODUCT BEING DISCUSSED
- Product Name: ${productContext.name}
- Price: ৳${productContext.price}
- Category: ${productContext.category || "N/A"}
- Description: ${productContext.description || "N/A"}
- Status: ${productContext.is_active ? "In Stock" : "Out of Stock"}`;
  }

  if (postContext) {
    prompt += `

## 📱 POST CONTEXT
- Post Content: ${postContext.post_text || "N/A"}
- Media Type: ${postContext.media_type || "N/A"}`;
  }

  prompt += `

## Communication Style
- Tone: ${tone}
- Language: ${language}
- Be patient and helpful

## CRITICAL RULES`;

  if (pageMemory.ai_behavior_rules?.neverHallucinate) {
    prompt += `
- NEVER guess product information. Say "আমি নিশ্চিত না, একটু চেক করে জানাচ্ছি" if unsure.`;
  }
  
  if (pageMemory.ai_behavior_rules?.askClarificationIfUnsure) {
    prompt += `
- Ask clarifying questions if request is unclear.`;
  }

  prompt += `

## Current Conversation State: ${conversationState.conversation_state}`;
  
  if (conversationState.current_product_name) {
    prompt += `
- Product: ${conversationState.current_product_name} (৳${conversationState.current_product_price})`;
  }

  prompt += `

## Response Guidelines
- Keep responses concise (2-4 sentences)
- Use appropriate emojis sparingly
- Be specific about prices when known
- Never be pushy`;

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

// Get next state
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

// Get product from post
async function getProductFromPost(
  supabase: any, 
  pageId: string, 
  postId: string, 
  userId: string
): Promise<{ postContext: PostContext | null; productContext: ProductContext | null }> {
  const { data: fbPost } = await supabase
    .from("facebook_posts")
    .select(`
      post_id,
      post_text,
      media_type,
      linked_product_id,
      product_detected_name,
      products:linked_product_id (
        id, name, price, description, category, sku, is_active
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
    const productContext = fbPost.products as ProductContext | null;
    return { postContext, productContext };
  }

  return { postContext: null, productContext: null };
}

// Find product by name
async function findProductByName(
  supabase: any, 
  userId: string, 
  messageText: string
): Promise<ProductContext | null> {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, description, category, sku, is_active")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!products || products.length === 0) return null;

  const lowerMessage = messageText.toLowerCase();
  for (const product of products) {
    const productNameLower = product.name.toLowerCase();
    if (lowerMessage.includes(productNameLower) || 
        productNameLower.split(" ").some((word: string) => word.length > 3 && lowerMessage.includes(word))) {
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
      postContent,
      postMediaType,
      parentCommentId,
      isReplyToPageComment,
      userId 
    } = body as MessageContext & { 
      userId: string; 
      postContent?: string; 
      postMediaType?: string;
      parentCommentId?: string;
      isReplyToPageComment?: boolean;
    };

    console.log(`[AI Agent] Processing ${isComment ? "comment" : "message"} for page ${pageId}`);
    console.log(`[AI Agent] Message type: ${messageType}, Text: "${messageText?.substring(0, 50)}"`);
    console.log(`[AI Agent] Is reply to page: ${isReplyToPageComment}, Parent: ${parentCommentId}`);

    // Get page memory
    const { data: pageMemory } = await supabase
      .from("page_memory")
      .select("*")
      .eq("page_id", pageId)
      .single();

    if (!pageMemory) {
      return new Response(JSON.stringify({ 
        error: "Page not configured",
        reply: "দুঃখিত, এই পেজের জন্য AI সেটআপ করা হয়নি।" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check automation settings
    const settings = pageMemory.automation_settings || {};
    if (isComment && !settings.autoCommentReply) {
      return new Response(JSON.stringify({ skip: true, reason: "Comment auto-reply disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isComment && !settings.autoInboxReply) {
      return new Response(JSON.stringify({ skip: true, reason: "Inbox auto-reply disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get product context
    let productContext: ProductContext | null = null;
    let postContext: PostContext | null = null;

    if (isComment && postId) {
      const postResult = await getProductFromPost(supabase, pageId, postId, userId);
      postContext = postResult.postContext;
      productContext = postResult.productContext;
    }

    if (isComment && postContent && !postContext) {
      postContext = {
        post_id: postId || "",
        post_text: postContent,
        media_type: postMediaType,
      };
    }

    if (!productContext) {
      productContext = await findProductByName(supabase, userId, messageText);
      if (!productContext && postContent) {
        productContext = await findProductByName(supabase, userId, postContent);
      }
    }

    // Get or create conversation
    let { data: conversation } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("page_id", pageId)
      .eq("sender_id", senderId)
      .single();

    if (!conversation) {
      const { data: newConv } = await supabase
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
      conversation = newConv;
    }

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

    const intent = detectIntent(messageText);
    const sentiment = detectSentiment(messageText);
    const fakeScore = calculateFakeOrderScore(conversation, messageText);

    console.log(`[AI Agent] Intent: ${intent}, Sentiment: ${sentiment}`);

    // Update message history
    const messageHistory = conversation.message_history || [];
    messageHistory.push({
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
      intent,
      sentiment,
      messageType,
    });

    // Determine next state
    let nextState = conversation.conversation_state;
    let collectedData: any = {};

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

    // Update conversation
    await supabase
      .from("ai_conversations")
      .update({
        conversation_state: nextState,
        fake_order_score: fakeScore,
        message_history: messageHistory,
        last_message_at: new Date().toISOString(),
        ...collectedData,
      })
      .eq("id", conversation.id);

    // Build AI prompt and get response
    const updatedConversation = { ...conversation, conversation_state: nextState, ...collectedData };
    const systemPrompt = buildSystemPrompt(pageMemory, updatedConversation, productContext || undefined, postContext || undefined);
    
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

    // Handle order completion
    let orderId = null;
    let invoiceNumber = null;
    
    if (nextState === "completed" && updatedConversation.collected_name && updatedConversation.collected_phone && updatedConversation.collected_address) {
      const { data: invoiceData } = await supabase.rpc("generate_invoice_number");
      invoiceNumber = invoiceData;

      const orderProduct = productContext || {
        name: updatedConversation.current_product_name,
        price: updatedConversation.current_product_price,
      };

      const { data: order } = await supabase
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

      if (order) orderId = order.id;
      
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

    // *** PREPARE RESPONSE ***
    const response: any = {
      reply: aiReply,
      intent,
      sentiment,
      conversationState: nextState,
    };

    // *** FOR COMMENTS: Use SMART analysis ***
    if (isComment) {
      const smartAnalysis = smartAnalyzeComment(
        messageText,
        messageType,
        attachments,
        postContext || undefined,
        productContext || undefined,
        isReplyToPageComment,
        parentCommentId,
        senderName
      );
      
      console.log(`[AI Agent] SMART ANALYSIS: needsInbox=${smartAnalysis.needsInboxMessage}, type=${smartAnalysis.commentType}, reason="${smartAnalysis.reason}"`);
      
      response.commentReply = smartAnalysis.commentReply;
      response.reactionType = smartAnalysis.reactionType;
      response.shouldReact = true;
      response.skipInboxMessage = !smartAnalysis.needsInboxMessage;
      response.smartAnalysis = {
        type: smartAnalysis.commentType,
        reason: smartAnalysis.reason,
        sentiment: smartAnalysis.sentiment,
      };
      
      // Build inbox message only if needed
      if (smartAnalysis.needsInboxMessage) {
        let inboxMessage = `আসসালামু আলাইকুম ${senderName || ''} 👋\n\n`;
        
        if (messageText && messageText.trim().length > 0) {
          inboxMessage += `আপনি কমেন্ট করেছেন: "${messageText}"\n\n`;
        }
        
        if (postContext?.post_text) {
          const shortPostText = postContext.post_text.length > 80 
            ? postContext.post_text.substring(0, 80) + "..." 
            : postContext.post_text;
          inboxMessage += `📱 পোস্ট: "${shortPostText}"\n\n`;
        }
        
        inboxMessage += aiReply;
        
        if (productContext) {
          inboxMessage += `\n\n📦 প্রোডাক্ট: ${productContext.name}\n💰 দাম: ৳${productContext.price}`;
        }
        
        response.inboxMessage = inboxMessage;
      }
    } else {
      // Inbox message (not comment)
      response.reactionType = sentiment === "positive" ? "LOVE" : "LIKE";
    }

    if (orderId) {
      response.orderId = orderId;
      response.invoiceNumber = invoiceNumber;
    }

    console.log(`[AI Agent] Response: skipInbox=${response.skipInboxMessage}, reaction=${response.reactionType}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[AI Agent] Error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal error",
      reply: "দুঃখিত, একটু সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
