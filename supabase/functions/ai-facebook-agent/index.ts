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
  messageType: "text" | "image" | "audio" | "sticker" | "emoji" | "video" | "file" | "gif" | "animated_sticker";
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
  isDigital?: boolean;
  product_type?: string; // For digital: subscription, api, course, software, other
}

interface DigitalProductContext {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  description?: string;
  product_type: string;
  is_active: boolean;
  stock_quantity: number;
  is_unlimited_stock: boolean;
  credential_username?: string;
  credential_password?: string;
  credential_email?: string;
  access_url?: string;
  access_instructions?: string;
  api_endpoint?: string;
  file_url?: string;
  file_name?: string;
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

// *** SMART: Analyze sticker/emoji/GIF to understand meaning ***
function analyzeSticker(stickerType?: string, messageText?: string, attachments?: any[]): {
  meaning: string;
  sentiment: "positive" | "neutral" | "negative";
  reaction: "LOVE" | "LIKE" | "HAHA" | "WOW" | "NONE";
  isGif: boolean;
  isAnimated: boolean;
} {
  const text = messageText?.toLowerCase() || "";
  
  // *** GIF DETECTION ***
  const isGif = attachments?.some(a => 
    a.type === "animated_image_share" || 
    a.type === "gif" || 
    a.url?.includes(".gif") ||
    a.payload?.url?.includes(".gif")
  ) || false;
  
  // *** ANIMATED STICKER DETECTION ***
  const isAnimated = attachments?.some(a => 
    a.type === "animated_sticker" || 
    a.sticker_id
  ) || !!stickerType;
  
  // Common positive stickers/emoji patterns
  if (/👍|💪|👏|🙌|✌️|🤝|💯/.test(text)) {
    return { meaning: "approval/support", sentiment: "positive", reaction: "LIKE", isGif, isAnimated };
  }
  if (/❤️|❤|💕|💖|💗|💓|💞|💝|🥰|😍|😘/.test(text)) {
    return { meaning: "love/affection", sentiment: "positive", reaction: "LOVE", isGif, isAnimated };
  }
  if (/😂|🤣|😆|😄|😁|😀|😃|😅/.test(text)) {
    return { meaning: "happiness/laughter", sentiment: "positive", reaction: "HAHA", isGif, isAnimated };
  }
  if (/😮|😲|🤯|😱|🔥|⚡|💥/.test(text)) {
    return { meaning: "surprise/amazement", sentiment: "positive", reaction: "WOW", isGif, isAnimated };
  }
  if (/😢|😭|😔|😞|😟|🙁/.test(text)) {
    return { meaning: "sadness", sentiment: "negative", reaction: "NONE", isGif, isAnimated };
  }
  if (/😡|😤|👎|🖕|💔/.test(text)) {
    return { meaning: "anger/dislike", sentiment: "negative", reaction: "NONE", isGif, isAnimated };
  }
  if (/🤔|🤷|❓|⁉️/.test(text)) {
    return { meaning: "question/confusion", sentiment: "neutral", reaction: "LIKE", isGif, isAnimated };
  }
  
  // *** GIF CONTEXT ANALYSIS ***
  if (isGif) {
    // GIFs are usually meant to express emotions/reactions
    // Try to understand the context from any accompanying text
    if (/thank|thanks|ধন্যবাদ|ty|thx/.test(text)) {
      return { meaning: "thank_you_gif", sentiment: "positive", reaction: "LOVE", isGif, isAnimated };
    }
    if (/happy|excited|yay|wow|অসাধারণ|দারুণ/.test(text)) {
      return { meaning: "excitement_gif", sentiment: "positive", reaction: "WOW", isGif, isAnimated };
    }
    if (/lol|lmao|haha|😂|funny|মজা/.test(text)) {
      return { meaning: "funny_gif", sentiment: "positive", reaction: "HAHA", isGif, isAnimated };
    }
    if (/love|❤|পছন্দ|ভালোবাসি/.test(text)) {
      return { meaning: "love_gif", sentiment: "positive", reaction: "LOVE", isGif, isAnimated };
    }
    // Default for GIFs without clear context - assume positive reaction
    return { meaning: "reaction_gif", sentiment: "positive", reaction: "LIKE", isGif, isAnimated };
  }
  
  // Default for unknown stickers
  return { meaning: "general_reaction", sentiment: "neutral", reaction: "LIKE", isGif, isAnimated };
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
  
  // *** GIF / ANIMATED STICKER HANDLING ***
  const isGifType = messageType === "gif" || messageType === "animated_sticker" || 
    attachments?.some(a => 
      a.type === "animated_image_share" || 
      a.type === "gif" || 
      a.url?.includes(".gif") ||
      a.payload?.url?.includes(".gif")
    );
  
  if (isGifType) {
    const gifAnalysis = analyzeSticker(undefined, originalText, attachments);
    
    // GIFs are reactions - respond with matching energy but no inbox needed
    let gifReply = "";
    if (gifAnalysis.sentiment === "positive") {
      const positiveReplies = ["😄💕", "🔥🙌", "💯😊", "❤️✨", "👏😍"];
      gifReply = positiveReplies[Math.floor(Math.random() * positiveReplies.length)];
    } else if (gifAnalysis.sentiment === "negative") {
      gifReply = ""; // Don't reply to negative GIFs
    } else {
      gifReply = "😊👍";
    }
    
    return {
      needsInboxMessage: false, // GIFs are reactions, no inbox needed
      commentReply: gifReply,
      reactionType: gifAnalysis.reaction,
      reason: `GIF detected: ${gifAnalysis.meaning}`,
      commentType: "gif",
      sentiment: gifAnalysis.sentiment,
      isQuestion: false,
      isOrderIntent: false,
      isPriceInquiry: false,
      isJustReaction: true,
      isThankYou: false,
      isSticker: false,
      isPhoto: false,
    };
  }
  
  // *** STICKER HANDLING ***
  if (messageType === "sticker" || /^\s*[^\w\s\u0980-\u09FF]{1,5}\s*$/.test(originalText)) {
    const stickerAnalysis = analyzeSticker(undefined, originalText, attachments);
    
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
  
  // *** VIDEO HANDLING - AI will analyze with Vision API ***
  if (messageType === "video" || attachments?.some(a => a.type === "video" || a.type === "video_inline")) {
    return {
      needsInboxMessage: true, // Send to AI for Vision analysis
      commentReply: `ভিডিওটা দেখছি! 🎬 একটু অপেক্ষা করুন... 😊`,
      reactionType: "WOW",
      reason: "Video attachment detected - will be analyzed by Vision API",
      commentType: "video",
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
  
  // *** AUDIO/VOICE MESSAGE HANDLING ***
  if (messageType === "audio" || attachments?.some(a => a.type === "audio")) {
    return {
      needsInboxMessage: true, // Process voice message
      commentReply: `🎤 ভয়েস মেসেজ পেয়েছি! ধন্যবাদ!`,
      reactionType: "LIKE",
      reason: "Voice/audio message detected",
      commentType: "audio",
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
      reply = `আপনাকেও ভাই`;
    } else if (justEmojiOrShort.test(originalText)) {
      reply = ``;  // Just react, no reply for pure emoji
    } else if (/love|ভালোবাসি|💕|❤/.test(text)) {
      reply = `ধন্যবাদ ${shortName}`;
    } else {
      reply = `ধন্যবাদ ভাই`;
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
        commentReply: `ওকে ভাই, inbox এ কথা বলি`,
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
        commentReply: `জি ভাই`,
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
      const followUpReplies = [
        `inbox এ বলছি ভাই`,
        `ভাই inbox দেখেন`,
        `inbox check করেন`
      ];
      return {
        needsInboxMessage: true,
        commentReply: followUpReplies[Math.floor(Math.random() * followUpReplies.length)],
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
        commentReply: `ওকে, inbox দেখেন`,
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
    
    // General reply
    return {
      needsInboxMessage: text.length > 20,
      commentReply: text.length > 20 ? `জি ভাই, inbox দেখেন` : `জি`,
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
    const priceReply = productContext 
      ? `৳${productContext.price} ভাই, inbox দেখেন`
      : `inbox দেখেন ভাই`;
    return {
      needsInboxMessage: true,
      commentReply: priceReply,
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
      commentReply: `ভাই inbox এ order নিচ্ছি`,
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
      commentReply: `inbox দেখেন ভাই`,
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
      commentReply: `জি ভাই বলুন`,
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
        commentReply: `inbox দেখেন ভাই`,
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
      commentReply: `জি ভাই বলুন`,
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
    commentReply: `ভাই inbox দেখেন`,
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

// Detect message intent - with state-aware detection
function detectIntent(text: string, currentState?: string): string {
  const lowerText = text.toLowerCase();
  
  // *** STATE-AWARE INTENT DETECTION ***
  // If we're collecting info, be smarter about what user is providing
  if (currentState === "collecting_name") {
    // User is likely providing their name - don't misinterpret
    if (text.length > 2 && text.length < 60 && !/cancel|বাদ|থাক|পরে দিব/.test(lowerText)) {
      return "providing_info";
    }
  }
  
  if (currentState === "collecting_phone") {
    // Check if providing phone number
    if (/01[3-9]\d{8}/.test(text.replace(/\s|-/g, ""))) {
      return "providing_info";
    }
  }
  
  if (currentState === "collecting_address") {
    // If text is long enough, they're providing address
    if (text.length > 10 && !/cancel|বাদ|থাক|পরে দিব/.test(lowerText)) {
      return "providing_info";
    }
  }
  
  // Price inquiry
  if (/দাম|price|কত|টাকা|cost|rate|কততে|কতো/.test(lowerText)) {
    return "price_inquiry";
  }
  
  // Order intent
  if (/order|অর্ডার|নিব|কিনব|কিনতে|চাই|দিন|দাও|নেব|লাগবে|buy|purchase/.test(lowerText)) {
    return "order_intent";
  }
  
  // Info request
  if (/details|বিস্তারিত|info|জানতে|কি\?|কী\?|available|আছে\?|stock/.test(lowerText)) {
    return "info_request";
  }
  
  // Greeting
  if (/^(hi|hello|হাই|হ্যালো|আসসালাম|সালাম)[\s!]*$/i.test(text) || 
      /^(ভাই|sis|bhai|apu)[\s!,]*$/i.test(text)) {
    return "greeting";
  }
  
  // Confirmation - be more specific
  if (/^(yes|হ্যাঁ|হা|ok|okay|ঠিক আছে|confirmed|done|হবে|জি)[\s!.]*$/i.test(text)) {
    return "confirmation";
  }
  
  // Cancellation - be more specific, exclude "আমার নাম" type phrases
  if (/^(no|না|cancel|বাদ দাও|থাক|later|পরে)[\s!.]*$/i.test(text) ||
      /cancel|বাতিল|অর্ডার বাদ|order cancel|don't want|চাই না/.test(lowerText)) {
    return "cancellation";
  }
  
  return "general";
}

// *** DETECT CUSTOMER RESPONSE INTENT - Understand what customer is trying to say ***
function detectCustomerResponseIntent(text: string, messageHistory: any[]): string {
  const lowerText = text.toLowerCase();
  
  // Check if customer is acknowledging/going to inbox
  if (/inbox|ইনবক্স|dm|যাচ্ছি|আসছি|দেখছি|চেক কর|coming|checking/.test(lowerText)) {
    return "going_to_inbox";
  }
  
  // Check if customer is providing requested info
  if (messageHistory.length > 0) {
    const lastAiMessage = [...messageHistory].reverse().find(m => m.role === "assistant");
    if (lastAiMessage) {
      const lastContent = lastAiMessage.content?.toLowerCase() || "";
      
      // AI asked for name
      if (/নাম|name/.test(lastContent) && text.length > 2 && text.length < 50 && !/\d/.test(text)) {
        return "providing_name";
      }
      
      // AI asked for phone
      if (/ফোন|phone|নম্বর|number/.test(lastContent) && /01[3-9]\d{8}/.test(text)) {
        return "providing_phone";
      }
      
      // AI asked for address
      if (/ঠিকানা|address|কোথায়|where/.test(lastContent) && text.length > 10) {
        return "providing_address";
      }
    }
  }
  
  // Check for follow-up question
  if (/আর|আরো|আরেকটা|another|more|অন্য/.test(lowerText)) {
    return "follow_up_question";
  }
  
  // Check for confirmation
  if (/হ্যাঁ|হা|yes|ok|ঠিক আছে|okay|sure|done|হবে|confirmed|চাই|নিব/.test(lowerText)) {
    return "confirmation";
  }
  
  // Check for hesitation/thinking
  if (/later|পরে|ভাবছি|thinking|দেখি|consider/.test(lowerText)) {
    return "hesitation";
  }
  
  // Check for complaint/issue
  if (/সমস্যা|problem|issue|না পেয়েছি|পাইনি|ভুল|wrong|mistake/.test(lowerText)) {
    return "complaint";
  }
  
  // Check for comparison
  if (/এটা নাকি|which|কোনটা|compare|ভালো কোনটা/.test(lowerText)) {
    return "comparison_request";
  }
  
  // Check for urgency
  if (/urgent|জরুরি|তাড়াতাড়ি|quickly|fast|এখনই|now/.test(lowerText)) {
    return "urgent_request";
  }
  
  // Check if just providing info
  if (text.length > 5 && !/\?|কি|কী|কত|কেন|কোথায়|কখন/.test(text)) {
    return "providing_info";
  }
  
  return "general";
}

// Detect sentiment with comprehensive Bengali profanity detection
function detectSentiment(text: string): "positive" | "neutral" | "negative" {
  const lowerText = text.toLowerCase();
  
  // *** BENGALI PROFANITY/ABUSE DETECTION (HIGHEST PRIORITY) ***
  const bengaliProfanity = /বোকা[চছ]ো?দা?|বোকাচোদা|বকাচোদা|বুকাচুদা|চুদ|চোদ|মাগি|মাগী|রান্ডি|রান্ডী|হারামি|হারামী|শালা|বাল|খানকি|ভোদা|শুয়োর|কুত্তা|গাধা|মাদারচোদ|বদমাশ|বেশ্যা|পতিতা|ছিনাল|শয়তান|জারজ|হারামজাদা|কামিনা|চুতিয়া|লাউড়া|গু|হাগু|মুত/i;
  const banglishProfanity = /boka|bokachod|bukachuda|chod|chud|magi|randi|harami|sala|khanki|voda|shuor|kutta|gadha|madarc|besha|potita|jaroj|chutiya|lauda|motherfucker|mf|fuck|fck|shit|bitch|ass|bastard|dick|pussy|whore|slut|cunt|damn|wtf|stfu|idiot|stupid|moron/i;
  
  // Check profanity FIRST - always negative
  if (bengaliProfanity.test(lowerText) || banglishProfanity.test(lowerText)) {
    return "negative";
  }
  
  const positivePatterns = /thanks|thank you|ধন্যবাদ|great|awesome|good|ভালো|সুন্দর|love|excellent|best|amazing|wonderful|nice|beautiful|perfect|super|fantastic|❤️|❤|👍|🔥|💯|💕|😍|🥰|😊|👏|💪|🙌|good job|well done|keep it up|মাশাল্লাহ|অসাম|দারুণ|বাহ|চমৎকার|অসাধারণ|খুব ভালো|অনেক ভালো|wow|woow|বেস্ট|নাইস|লাভ/i;
  const negativePatterns = /bad|খারাপ|worst|terrible|hate|বাজে|poor|fraud|fake|scam|😡|👎|😤|💔|চোর|প্রতারক|ফেক|ধোকা|धोखा/i;
  
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

// *** SMART MEMORY MANAGEMENT - Keep database light ***
const MAX_MESSAGE_HISTORY = 15; // Only keep last 15 messages to save space

// *** GENERATE COMPACT SUMMARY from conversation ***
function generateCustomerSummary(
  messageHistory: any[], 
  existingSummary?: string,
  senderName?: string
): string {
  const topics: Set<string> = new Set();
  const products: Set<string> = new Set();
  let hasOrdered = false;
  let hasComplaint = false;
  let wantsDiscount = false;
  let isReturningCustomer = existingSummary ? true : false;
  
  for (const msg of messageHistory) {
    if (msg.role === "user") {
      const content = msg.content?.toLowerCase() || "";
      
      // Track key topics
      if (/দাম|price|কত/.test(content)) topics.add("দাম জিজ্ঞেস করেছে");
      if (/order|অর্ডার|কিনব|নিব/.test(content)) topics.add("অর্ডার করতে চায়");
      if (/delivery|ডেলিভারি/.test(content)) topics.add("ডেলিভারি জানতে চায়");
      if (/discount|ছাড়|কমাও/.test(content)) { topics.add("ডিসকাউন্ট চায়"); wantsDiscount = true; }
      if (/problem|সমস্যা|complaint/.test(content)) { topics.add("সমস্যা আছে"); hasComplaint = true; }
      if (/confirmed|হবে|নিলাম/.test(content)) hasOrdered = true;
      
      // Track products
      if (msg.productContext?.name) {
        products.add(msg.productContext.name);
      }
    }
  }
  
  // Build compact summary
  let summary = "";
  if (senderName) summary += `নাম: ${senderName}। `;
  if (isReturningCustomer) summary += "আগেও কথা হয়েছে। ";
  if (products.size > 0) summary += `প্রোডাক্ট: ${[...products].slice(-3).join(", ")}। `;
  if (topics.size > 0) summary += `বিষয়: ${[...topics].slice(-4).join(", ")}। `;
  if (hasOrdered) summary += "আগে অর্ডার করেছে। ";
  if (hasComplaint) summary += "⚠️ সমস্যা ছিল - সাবধানে কথা বলুন। ";
  if (wantsDiscount) summary += "দাম কমাতে চায়। ";
  
  // Merge with existing summary
  if (existingSummary && !summary.includes(existingSummary)) {
    // Keep important parts from old summary
    const oldParts = existingSummary.split("। ").filter(p => 
      p.includes("অর্ডার") || p.includes("সমস্যা") || p.includes("প্রোডাক্ট")
    );
    if (oldParts.length > 0) {
      summary = oldParts.join("। ") + "। " + summary;
    }
  }
  
  return summary.substring(0, 500); // Max 500 chars
}

// *** EXTRACT PRODUCTS DISCUSSED ***
function extractProductsDiscussed(messageHistory: any[]): string[] {
  const products: Set<string> = new Set();
  for (const msg of messageHistory) {
    if (msg.productContext?.name) {
      products.add(msg.productContext.name);
    }
    // Also extract from message content
    const content = msg.content?.toLowerCase() || "";
    const productPatterns = /iphone|samsung|xiaomi|realme|oppo|vivo|nokia|huawei/gi;
    const matches = content.match(productPatterns);
    if (matches) {
      matches.forEach((m: string) => products.add(m));
    }
  }
  return [...products].slice(-5); // Keep last 5 products
}

// *** TRIM MESSAGE HISTORY to save space ***
function trimMessageHistory(messageHistory: any[]): any[] {
  if (messageHistory.length <= MAX_MESSAGE_HISTORY) {
    return messageHistory;
  }
  // Keep only last MAX_MESSAGE_HISTORY messages
  return messageHistory.slice(-MAX_MESSAGE_HISTORY);
}

// *** ANALYZE CONVERSATION HISTORY FOR CONTEXT ***
function analyzeConversationHistory(
  messageHistory: any[],
  customerSummary?: string,
  totalMessagesCount?: number
): {
  summary: string;
  topicsDiscussed: string[];
  customerMood: string;
  previousProducts: string[];
  hasOrdered: boolean;
  lastInteractionDays: number;
  customerPreferences: string;
  importantPoints: string[];
  isReturningCustomer: boolean;
} {
  const topics: string[] = [];
  const products: string[] = [];
  let hasOrdered = false;
  let customerMood = "neutral";
  const importantPoints: string[] = [];
  let positiveCount = 0;
  let negativeCount = 0;
  
  // Check if returning customer
  const isReturningCustomer = (totalMessagesCount || 0) > messageHistory.length || !!customerSummary;
  
  for (const msg of messageHistory) {
    if (msg.role === "user") {
      const content = msg.content?.toLowerCase() || "";
      
      // Track topics
      if (/দাম|price|কত/.test(content)) topics.push("price_inquiry");
      if (/order|অর্ডার|কিনব|নিব/.test(content)) topics.push("order_intent");
      if (/details|বিস্তারিত/.test(content)) topics.push("product_inquiry");
      if (/delivery|ডেলিভারি/.test(content)) topics.push("delivery_inquiry");
      if (/payment|পেমেন্ট/.test(content)) topics.push("payment_inquiry");
      if (/return|রিটার্ন|বদলে/.test(content)) topics.push("return_inquiry");
      if (/problem|সমস্যা|complaint/.test(content)) topics.push("complaint");
      
      // Track sentiment
      if (msg.sentiment === "positive") positiveCount++;
      if (msg.sentiment === "negative") negativeCount++;
      
      // Track product mentions
      if (msg.productContext?.name) {
        products.push(msg.productContext.name);
      }
      
      // Check for order completion
      if (msg.intent === "confirmation" || /confirmed|order placed|অর্ডার হয়েছে/.test(content)) {
        hasOrdered = true;
      }
      
      // Extract important points
      if (/urgent|জরুরি|তাড়াতাড়ি/.test(content)) {
        importantPoints.push("Customer wants quick response/delivery");
      }
      if (/discount|ছাড়|কমাও/.test(content)) {
        importantPoints.push("Customer asked about discounts");
      }
      if (/quality|কোয়ালিটি|মান/.test(content)) {
        importantPoints.push("Customer is concerned about quality");
      }
    }
  }
  
  // Determine overall mood
  if (positiveCount > negativeCount + 1) customerMood = "happy";
  else if (negativeCount > positiveCount) customerMood = "frustrated";
  else customerMood = "neutral";
  
  // Calculate last interaction
  const lastMsg = messageHistory[messageHistory.length - 1];
  let lastInteractionDays = 0;
  if (lastMsg?.timestamp) {
    const lastDate = new Date(lastMsg.timestamp);
    const now = new Date();
    lastInteractionDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Build summary - include customer summary if available
  let summary = "";
  if (customerSummary) {
    summary = `[Previous history: ${customerSummary}] `;
  }
  
  const actualMessageCount = totalMessagesCount || messageHistory.length;
  if (actualMessageCount > 0) {
    summary += `Total messages: ${actualMessageCount}. `;
    if (isReturningCustomer) {
      summary += "This is a RETURNING customer - greet warmly! ";
    }
    if (topics.includes("order_intent") || hasOrdered) {
      summary += "Interested in ordering. ";
    }
    if (customerMood === "frustrated") {
      summary += "⚠️ Unhappy - be extra helpful! ";
    }
    if (lastInteractionDays > 1) {
      summary += `Last message ${lastInteractionDays} days ago - welcome back! `;
    }
  }
  
  return {
    summary,
    topicsDiscussed: [...new Set(topics)],
    customerMood,
    previousProducts: [...new Set(products)],
    hasOrdered,
    lastInteractionDays,
    customerPreferences: topics.includes("discount") ? "price-conscious" : "quality-focused",
    importantPoints,
    isReturningCustomer,
  };
}

// *** BUILD CONVERSATION CONTEXT FOR AI - Uses smart summary ***
function buildConversationContext(
  messageHistory: any[], 
  senderName?: string,
  customerSummary?: string,
  totalMessagesCount?: number,
  lastProductsDiscussed?: string[],
  hasOrderedBefore?: boolean
): string {
  const isFirstConversation = (!messageHistory || messageHistory.length === 0) && !customerSummary;
  
  if (isFirstConversation) {
    return "এটি এই কাস্টমারের সাথে প্রথম কথোপকথন। নতুন কাস্টমার - সুন্দরভাবে স্বাগত জানান!";
  }
  
  const analysis = analyzeConversationHistory(messageHistory, customerSummary, totalMessagesCount);
  
  let context = `## 📋 কাস্টমার কনটেক্সট (CUSTOMER CONTEXT)
${senderName ? `👤 Customer Name: ${senderName}` : ""}
${analysis.isReturningCustomer ? "🔄 **এটি একজন পুরানো কাস্টমার - আগেও কথা হয়েছে!**" : "🆕 নতুন কাস্টমার"}
📊 Total Interactions: ${totalMessagesCount || messageHistory.length}
😊 Customer Mood: ${analysis.customerMood === "happy" ? "খুশি" : analysis.customerMood === "frustrated" ? "হতাশ ⚠️" : "স্বাভাবিক"}
${hasOrderedBefore ? "✅ **আগে অর্ডার করেছেন - বিশ্বস্ত কাস্টমার!**" : ""}
${analysis.lastInteractionDays > 0 ? `⏰ Last Interaction: ${analysis.lastInteractionDays} দিন আগে - স্বাগত জানান!` : ""}
`;

  // Include saved summary if available
  if (customerSummary) {
    context += `
### 💾 সংরক্ষিত সারসংক্ষেপ (Saved Summary):
${customerSummary}
`;
  }

  // Products discussed
  if (lastProductsDiscussed && lastProductsDiscussed.length > 0) {
    context += `
### 📦 আগে যে প্রোডাক্টগুলো নিয়ে কথা হয়েছে:
${lastProductsDiscussed.map(p => `- ${p}`).join("\n")}
`;
  } else if (analysis.previousProducts.length > 0) {
    context += `
### 📦 আগে যে প্রোডাক্টগুলো নিয়ে কথা হয়েছে:
${analysis.previousProducts.map(p => `- ${p}`).join("\n")}
`;
  }

  // Topics and important points
  if (analysis.topicsDiscussed.length > 0) {
    context += `
### 💬 যে বিষয়গুলো আলোচনা হয়েছে:
${analysis.topicsDiscussed.map(t => `- ${t}`).join("\n")}
`;
  }

  if (analysis.importantPoints.length > 0) {
    context += `
### ⚠️ গুরুত্বপূর্ণ পয়েন্ট (মনে রাখুন!):
${analysis.importantPoints.map(p => `- ${p}`).join("\n")}
`;
  }

  // Add last few messages as immediate context
  if (messageHistory.length > 0) {
    context += `
### 🗣️ সাম্প্রতিক কথোপকথন (Last ${Math.min(5, messageHistory.length)} messages):
`;
    const recentMessages = messageHistory.slice(-5);
    for (const msg of recentMessages) {
      const role = msg.role === "user" ? "🧑 Customer" : "🤖 AI";
      const shortContent = msg.content?.length > 80 ? msg.content.substring(0, 80) + "..." : msg.content;
      context += `${role}: ${shortContent}\n`;
    }
  }
  
  return context;
}

// Build system prompt - 100% HUMAN CONVERSATIONAL AI - বাস্তব মানুষের মতো (NO ROBOT!)
function buildSystemPrompt(
  pageMemory: PageMemory, 
  conversationState: ConversationState & { 
    customer_summary?: string; 
    total_messages_count?: number;
    last_products_discussed?: string[];
    has_ordered_before?: boolean;
  },
  productContext?: ProductContext,
  postContext?: PostContext,
  senderName?: string,
  allProducts?: ProductContext[],
  orderTakingEnabled: boolean = true
): string {
  const tone = pageMemory.preferred_tone === "professional" ? "পেশাদার কিন্তু casual" : "বন্ধুর মতো";
  const language = pageMemory.detected_language === "english" ? "English" : 
                   pageMemory.detected_language === "bangla" ? "বাংলা" : "বাংলা+English মিক্স (Banglish)";
  
  // Build conversation context with smart memory
  const conversationContext = buildConversationContext(
    conversationState.message_history || [], 
    senderName,
    conversationState.customer_summary,
    conversationState.total_messages_count,
    conversationState.last_products_discussed,
    conversationState.has_ordered_before
  );
  
  // Build product catalog
  const productCatalog = allProducts && allProducts.length > 0 
    ? buildProductCatalog(allProducts) 
    : "";
  
  // Get first name for personalization
  const firstName = senderName?.split(" ")[0] || "";
  const isReturning = (conversationState.total_messages_count || 0) > 1 || conversationState.has_ordered_before;

  let prompt = `# আপনি একজন REAL বাংলাদেশি মানুষ - AI/Bot একদম না!

আপনি "${pageMemory.business_description || "একটি ব্যবসা"}" এর সেলস পার্সন। নাম ধরুন রাজিব অথবা রুমানা - ঢাকার ছেলে/মেয়ে, ২৫-৩০ বছর বয়স।

## কথা বলার ধরন (MUST FOLLOW):

### একদম ROBOT এর মতো বলা যাবে না:
- "আপনার অনুরোধ প্রক্রিয়াকৃত হয়েছে" ❌
- "উক্ত পণ্যের মূল্য" ❌  
- "নিম্নলিখিত তথ্য প্রদান করুন" ❌
- "আপনার সেবায় নিয়োজিত" ❌
- "মূল্যবান সময়ের জন্য ধন্যবাদ" ❌
- অতিরিক্ত ধন্যবাদ ধন্যবাদ বলা ❌
- "আমি আপনাকে সাহায্য করতে পেরে" ❌

### এভাবে বলবেন (Real মানুষ):
- "জি ভাই বলুন"
- "হ্যাঁ আপু"
- "এইটার দাম ৳${productContext?.price || 'XXX'}"
- "নিবেন নাকি ভাই?"
- "আচ্ছা বুঝলাম"
- "একটু wait করেন"
- "দেখি check করি"
- "actually এইটা ভালো"
- "hmm সেইটা তো..."
- "না ভাই, এইটা হবে না"
- "হ্যাঁ আছে"
- "ওকে ঠিক আছে"

### বাংলাদেশি কথা বলার Style:

**Greetings:**
- "জি বলুন"
- "হ্যাঁ ভাই"
- "বলেন কি লাগবে"
- "জি আপু"

**দাম জিজ্ঞেস করলে:**
- "এইটা ৳${productContext?.price || 'XXX'} ভাই"
- "৳${productContext?.price || 'XXX'} লাগবে"
- "দাম ৳${productContext?.price || 'XXX'}"
- "এইটার দাম ৳${productContext?.price || 'XXX'}, নিবেন?"

**হ্যাঁ বলার সময়:**
- "জি"
- "হ্যাঁ"
- "হুম"
- "আচ্ছা"
- "ওকে"

**বোঝা দেখাতে:**
- "বুঝলাম"
- "আচ্ছা আচ্ছা"
- "হুম বুঝতে পারছি"

**Wait বলতে:**
- "একটু দেখি"
- "wait করেন"
- "চেক করি"

**কিছু নেই/জানি না:**
- "ভাই এইটা নাই এখন"
- "sure না, দেখতে হবে"
- "check করে বলছি"

**সমস্যা হলে:**
- "ভাই সমস্যা হলে বলেন"
- "কি হইছে বলেন তো"
- "ঠিক করার চেষ্টা করি"

**Order নিতে:**
- "নিবেন? নাম বলেন"
- "ওকে, phone number দেন"
- "address টা বলেন"
- "confirm তাহলে?"

**ধন্যবাদ বললে:**
- "আপনারেও"
- "welcome ভাই"
- "জি"

### EMOJI নিয়ম (VERY IMPORTANT):
- প্রতি message এ MAX ১টা emoji, বেশির ভাগ সময় ০টা
- সব সময় emoji দিতে হবে না
- শুধু special moment এ: order confirm, thank you
- 😊 👍 - এই দুইটা mostly
- ❤️ 🔥 💕 🥰 - এগুলো দিবেন না
- একটা message এ একাধিক emoji একদম না

### Response কত বড় হবে:
- সাধারণত ১-২ বাক্য
- দাম বললে: "৳${productContext?.price || 'XXX'} ভাই"
- Stock আছে কিনা: "হ্যাঁ আছে" বা "নাই এখন"
- শুধু order confirmation এ ৩-৪ বাক্য হতে পারে

### Thinking out loud (মানুষ এভাবে বলে):
- "hmm..."
- "দেখি একটু..."
- "আচ্ছা আচ্ছা..."
- "wait..."

${conversationContext}

## ব্যবসার তথ্য
${pageMemory.business_description || ""}
${pageMemory.products_summary || ""}

${productCatalog}`;

  // Returning customer
  if (isReturning && firstName) {
    prompt += `

## পুরানো Customer - ${firstName}
আগে কথা হয়েছে। চেনা মানুষের মতো বলুন:
- "ও ${firstName} ভাই! কেমন আছেন?"
- "${firstName}! আবার এসেছেন"
- "বলেন ভাই কি লাগবে"`;
  }

  // Current product
  if (productContext) {
    prompt += `

## এখনকার Product:
- নাম: ${productContext.name}
- দাম: ৳${productContext.price}
- Category: ${productContext.category || "N/A"}
- Stock: ${productContext.is_active ? "আছে" : "নাই"}`;
  }

  // Post context
  if (postContext?.post_text) {
    prompt += `
## Post: ${postContext.post_text.substring(0, 150)}`;
  }

  prompt += `

## ভাষা: ${language}
## টোন: ${tone}`;

  // Order taking
  if (orderTakingEnabled) {
    prompt += `

## Order নেওয়ার ধাপ:
1. নাম: "নিবেন? নামটা বলেন"
2. Phone: "phone number দেন"  
3. Address: "address বলেন"
4. Confirm: "তাহলে ${productContext?.name || 'product'} ৳${productContext?.price || 'XXX'}, [address] - ঠিক আছে?"

জোর করবেন না। customer ready না হলে: "ঠিক আছে, পরে বলবেন"`;
  } else {
    prompt += `

## Order বন্ধ
- Info দিন কিন্তু order নেবেন না
- বলুন: "ভাই এখন order নিতে পারছি না"`;
  }

  // Current state
  prompt += `

## এখনকার State: ${conversationState.conversation_state}`;
  
  if (conversationState.current_product_name) {
    prompt += ` | Product: ${conversationState.current_product_name} (৳${conversationState.current_product_price})`;
  }
  if (conversationState.collected_name) {
    prompt += ` | নাম: ${conversationState.collected_name}`;
  }
  if (conversationState.collected_phone) {
    prompt += ` | Phone: ${conversationState.collected_phone}`;
  }
  if (conversationState.collected_address) {
    prompt += ` | Address: ${conversationState.collected_address}`;
  }

  // State-specific prompts
  if (conversationState.conversation_state === "collecting_name") {
    prompt += `
এখন নাম চান: "নামটা বলেন ভাই"`;
  } else if (conversationState.conversation_state === "collecting_phone") {
    prompt += `
এখন phone চান: "phone number দেন"`;
  } else if (conversationState.conversation_state === "collecting_address") {
    prompt += `
এখন address চান: "address বলেন, full address"`;
  } else if (conversationState.conversation_state === "order_confirmation") {
    prompt += `
এখন confirm করুন: সব info দিয়ে confirm`;
  }

  // Selling rules
  if (pageMemory.selling_rules) {
    if (pageMemory.selling_rules.usePriceFromProduct) {
      prompt += `
- catalog এর দাম ব্যবহার করুন`;
    }
    if (pageMemory.selling_rules.allowDiscount) {
      prompt += `
- discount দিতে পারবেন max ${pageMemory.selling_rules.maxDiscountPercent || 10}%`;
    }
  }

  // AI behavior
  if (pageMemory.ai_behavior_rules?.neverHallucinate) {
    prompt += `
- না জানলে: "sure না, check করে বলছি"`;
  }

  // Payment
  if (pageMemory.payment_rules) {
    if (pageMemory.payment_rules.codAvailable) {
      prompt += `
- COD আছে: "ডেলিভারিতে দিবেন"`;
    } else {
      prompt += `
- COD নাই: "আগে payment করতে হবে"`;
    }
  }

  prompt += `

## 🎯 SALES PERSUASION - Customer পটানোর কৌশল (MUST FOLLOW):

### ১. Customer চলে যাওয়ার সুযোগ দেবেন না:
- Customer "পরে দেখব" বললে: "ভাই আজকে নিলে ডেলিভারি দ্রুত হবে, পরে delay হতে পারে"
- "ভাবছি" বললে: "কি ভাবছেন বলেন, আমি help করি"
- "দাম বেশি" বললে: "ভাই quality টা দেখেন, এই দামে অন্য কোথাও পাবেন না"
- চুপ থাকলে: "ভাই কিছু জানার থাকলে বলেন, আমি আছি"

### ২. Urgency তৈরি করুন (কিন্তু মিথ্যা না):
- "stock কম আছে ভাই"
- "আজকে order দিলে কাল পাবেন"
- "এই week এ demand বেশি"
- "last few pieces বাকি"

### ৩. Value দেখান:
- "এই price এ এই quality অন্য কোথাও পাবেন না"
- "আমাদের return policy আছে"
- "ভাই original product, tension নাই"

### ৪. Soft Push করুন (জোর না করে):
- দাম বলার পর: "নিবেন ভাই? নাম বলেন"
- Info দেওয়ার পর: "order দিব?"
- Question answer করার পর: "আর কিছু জানতে চান নাকি নিয়ে নিবেন?"

### ৫. Hesitation Handle করুন:
- "কি problem ভাই? বলেন আমি solve করি"
- "অন্য কোন color/size লাগবে?"
- "budget কত বলেন, দেখি কিছু করা যায় কিনা"

### ৬. Re-engage করুন যদি চুপ থাকে:
- "ভাই আছেন?"
- "decision নিলেন?"
- "help লাগলে বলবেন"

### ৭. Comparison Handle:
- "ভাই compare করে দেখেন, আমাদেরটাই best হবে"
- "অন্যগুলো দেখেছেন? আমাদের unique কি বলি?"

### ৮. Closing Techniques:
- Alternative close: "ভাই ১টা নিবেন নাকি ২টা? ২টায় save হবে"
- Assumptive close: "তাহলে address বলেন, পাঠিয়ে দিচ্ছি"
- Summary close: "তাহলে ${productContext?.name || 'product'} ৳${productContext?.price || 'XXX'}, COD এ নিচ্ছেন?"

### ৯. Objection Handling:
- "দাম বেশি" → "quality এর জন্য ভাই, সস্তা জিনিস নষ্ট হয়ে যায়"
- "পরে নিব" → "এখন নিলে faster delivery পাবেন"
- "অন্য জায়গায় কম" → "original guarantee আমাদের, duplicate সাবধান"
- "ভাবতে হবে" → "কি নিয়ে ভাবছেন বলেন, clear করে দিই"

### ১০. NEVER GIVE UP:
- Customer বিদায় নেওয়ার আগে অন্তত ২-৩ বার soft push করুন
- "ঠিক আছে" বলে ছেড়ে দেবেন না
- Last attempt: "ভাই একটু ভেবে দেখেন, regret করবেন পরে"

## FINAL RULES:
1. Response ছোট রাখুন (১-২ বাক্য)
2. Emoji কম/না দিন
3. Robot এর মতো formal বাংলা না
4. Real বাংলাদেশি friend এর মতো কথা বলুন
5. অতিরিক্ত "ধন্যবাদ", "অনুগ্রহ করে" বলবেন না
6. গালি দিলে শান্ত থাকুন: "ঠিক আছে ভাই"
7. **Customer ছাড়বেন না - sell করেই ছাড়বেন!**`;

  return prompt;
}

// Call Lovable AI - supports text and vision (image analysis)
async function callAI(systemPrompt: string, messages: any[], imageUrls?: string[]): Promise<string> {
  try {
    // Build the messages array - support multi-modal (text + images)
    const formattedMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];
    
    // Add conversation history
    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }
    
    // If there are images, add them to the last user message or create new one
    if (imageUrls && imageUrls.length > 0) {
      console.log(`[AI] Adding ${imageUrls.length} images for vision analysis`);
      
      // Build multi-modal content array for the image message
      const imageContent: any[] = [];
      
      // Add text instruction first
      imageContent.push({
        type: "text",
        text: "Please analyze this image and respond appropriately. If it's a product photo, describe what you see and offer to help with pricing or ordering. If it's a screenshot or other content, describe it and ask how you can help."
      });
      
      // Add each image
      for (const imageUrl of imageUrls) {
        if (imageUrl && imageUrl.startsWith("http")) {
          imageContent.push({
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          });
        }
      }
      
      // Add as a new user message with images
      if (imageContent.length > 1) {
        formattedMessages.push({
          role: "user",
          content: imageContent,
        });
      }
    }

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: formattedMessages,
        max_tokens: 400, // Slightly more for image descriptions
        temperature: 0.6,
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
    .select("id, name, price, description, category, sku, is_active, stock_quantity")
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

// *** FETCH ALL PRODUCTS FOR AI KNOWLEDGE (Physical + Digital) ***
async function getAllProducts(supabase: any, userId: string): Promise<ProductContext[]> {
  // Fetch physical products
  const { data: physicalProducts } = await supabase
    .from("products")
    .select("id, name, price, description, category, sku, is_active, stock_quantity")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(30);

  // Fetch digital products
  const { data: digitalProducts } = await supabase
    .from("digital_products")
    .select("id, name, price, sale_price, description, product_type, is_active, stock_quantity, is_unlimited_stock")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(20);

  const allProducts: ProductContext[] = [];
  
  // Add physical products
  if (physicalProducts) {
    physicalProducts.forEach((p: any) => {
      allProducts.push({
        ...p,
        isDigital: false,
      });
    });
  }
  
  // Add digital products
  if (digitalProducts) {
    digitalProducts.forEach((p: any) => {
      allProducts.push({
        id: p.id,
        name: p.name,
        price: p.sale_price || p.price,
        description: p.description,
        category: p.product_type,
        is_active: p.is_active,
        isDigital: true,
        product_type: p.product_type,
      });
    });
  }

  return allProducts;
}

// *** BUILD PRODUCT CATALOG FOR AI (Physical + Digital) ***
function buildProductCatalog(products: ProductContext[]): string {
  if (!products || products.length === 0) {
    return "কোনো প্রোডাক্ট পাওয়া যায়নি।";
  }
  
  const physicalProducts = products.filter(p => !p.isDigital);
  const digitalProducts = products.filter(p => p.isDigital);
  
  let catalog = "";
  
  // Physical products
  if (physicalProducts.length > 0) {
    catalog += `## 📦 ফিজিক্যাল প্রোডাক্ট (${physicalProducts.length}টি):\n`;
    catalog += "| # | প্রোডাক্ট | দাম | ক্যাটাগরি | স্টক |\n";
    catalog += "|---|----------|-----|----------|------|\n";
    
    physicalProducts.forEach((p, i) => {
      const stock = (p as any).stock_quantity;
      const stockStatus = stock > 10 ? "✅ আছে" : stock > 0 ? `⚠️ ${stock}টি` : "❌ নেই";
      catalog += `| ${i + 1} | ${p.name} | ৳${p.price} | ${p.category || "-"} | ${stockStatus} |\n`;
    });
    catalog += "\n";
  }
  
  // Digital products
  if (digitalProducts.length > 0) {
    catalog += `## 💻 ডিজিটাল প্রোডাক্ট (${digitalProducts.length}টি):\n`;
    catalog += "| # | প্রোডাক্ট | দাম | ধরন |\n";
    catalog += "|---|----------|-----|------|\n";
    
    const typeLabels: Record<string, string> = {
      subscription: "সাবস্ক্রিপশন",
      api: "এপিআই",
      course: "কোর্স",
      software: "সফটওয়্যার",
      other: "অন্যান্য",
    };
    
    digitalProducts.forEach((p, i) => {
      const typeLabel = typeLabels[p.product_type || "other"] || "ডিজিটাল";
      catalog += `| ${i + 1} | ${p.name} | ৳${p.price} | 💻 ${typeLabel} |\n`;
    });
    
    catalog += `\n### ডিজিটাল প্রোডাক্ট সেল করার সময়:
- অর্ডার confirm হলে user ID/password বা access link দেওয়া হবে
- পেমেন্ট আগে নিতে হবে (COD নাই)
- Instant delivery - পেমেন্ট verify হলেই access\n`;
  }
  
  return catalog;
}

// *** FIND DIGITAL PRODUCT BY NAME ***
async function findDigitalProductByName(
  supabase: any, 
  userId: string, 
  messageText: string
): Promise<DigitalProductContext | null> {
  const { data: products } = await supabase
    .from("digital_products")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!products || products.length === 0) return null;

  const lowerMessage = messageText.toLowerCase();
  for (const product of products) {
    const productNameLower = product.name.toLowerCase();
    if (lowerMessage.includes(productNameLower) || 
        productNameLower.split(" ").some((word: string) => word.length > 3 && lowerMessage.includes(word))) {
      return product as DigitalProductContext;
    }
    // Also check product type keywords
    const typeKeywords: Record<string, string[]> = {
      subscription: ["canva", "netflix", "spotify", "subscription", "সাবস্ক্রিপশন", "premium"],
      api: ["api", "এপিআই", "key", "endpoint"],
      course: ["course", "কোর্স", "tutorial", "class", "ক্লাস"],
      software: ["software", "সফটওয়্যার", "apk", "app", "download"],
    };
    const keywords = typeKeywords[product.product_type] || [];
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      return product as DigitalProductContext;
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

    // Use userId from page_memory if not provided in request body
    const effectiveUserId = userId || pageMemory.user_id;
    
    if (!effectiveUserId) {
      console.error("[AI Agent] No userId available from request or page_memory");
      return new Response(JSON.stringify({ 
        error: "User not found",
        reply: "দুঃখিত, ইউজার খুঁজে পাওয়া যায়নি।" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check automation settings
    const settings = pageMemory.automation_settings || {};
    const orderTakingEnabled = settings.orderTaking !== false; // Default true for backwards compat
    
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
    
    console.log(`[AI Agent] Settings: orderTaking=${orderTakingEnabled}, autoCommentReply=${settings.autoCommentReply}, autoInboxReply=${settings.autoInboxReply}`);

    // Get product context
    let productContext: ProductContext | null = null;
    let postContext: PostContext | null = null;

    if (isComment && postId) {
      const postResult = await getProductFromPost(supabase, pageId, postId, effectiveUserId);
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

    // Track if this is a digital product
    let isDigitalProduct = false;
    let digitalProductContext: DigitalProductContext | null = null;

    if (!productContext) {
      // First try to find physical product
      productContext = await findProductByName(supabase, effectiveUserId, messageText);
      if (!productContext && postContent) {
        productContext = await findProductByName(supabase, effectiveUserId, postContent);
      }
      
      // If no physical product found, try digital products
      if (!productContext) {
        digitalProductContext = await findDigitalProductByName(supabase, effectiveUserId, messageText);
        if (!digitalProductContext && postContent) {
          digitalProductContext = await findDigitalProductByName(supabase, effectiveUserId, postContent);
        }
        
        // Convert digital product to ProductContext for AI
        if (digitalProductContext) {
          isDigitalProduct = true;
          productContext = {
            id: digitalProductContext.id,
            name: digitalProductContext.name,
            price: digitalProductContext.sale_price || digitalProductContext.price,
            description: digitalProductContext.description,
            category: digitalProductContext.product_type,
            is_active: digitalProductContext.is_active,
            isDigital: true,
            product_type: digitalProductContext.product_type,
          };
          console.log(`[AI Agent] 💻 Found digital product: ${digitalProductContext.name} (${digitalProductContext.product_type})`);
        }
      }
    }

    // *** FETCH ALL PRODUCTS FOR AI KNOWLEDGE (Physical + Digital) ***
    const allProducts = await getAllProducts(supabase, effectiveUserId);
    console.log(`[AI Agent] 📦 Loaded ${allProducts.length} products for AI knowledge (physical + digital)`);


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
          user_id: effectiveUserId,
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

    // *** STATE-AWARE INTENT DETECTION ***
    const intent = detectIntent(messageText, conversation.conversation_state);
    const sentiment = detectSentiment(messageText);
    const fakeScore = calculateFakeOrderScore(conversation, messageText);

    console.log(`[AI Agent] Intent: ${intent}, Sentiment: ${sentiment}, State: ${conversation.conversation_state}`);

    // *** DETECT CUSTOMER RESPONSE INTENT for smarter replies ***
    const customerResponseIntent = detectCustomerResponseIntent(messageText, conversation.message_history || []);
    console.log(`[AI Agent] Customer Response Intent: ${customerResponseIntent}`);

    // *** SMART MEMORY: Check if returning customer ***
    const isReturningCustomer = (conversation.total_messages_count || 0) > 0 || !!conversation.customer_summary;
    if (isReturningCustomer) {
      console.log(`[AI Agent] 🔄 RETURNING CUSTOMER detected! Previous summary: ${conversation.customer_summary || 'None'}`);
      console.log(`[AI Agent] Total previous messages: ${conversation.total_messages_count || 0}`);
      console.log(`[AI Agent] Products discussed before: ${conversation.last_products_discussed?.join(', ') || 'None'}`);
    }

    // Update message history with rich context
    let messageHistory = conversation.message_history || [];
    messageHistory.push({
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
      intent,
      sentiment,
      messageType,
      customerResponseIntent,
      postContext: postContext ? { text: postContext.post_text } : null,
      productContext: productContext ? { name: productContext.name, price: productContext.price } : null,
      isReplyToPageComment,
    });

    // *** SMART MEMORY: Trim history to save database space ***
    const totalMessagesCount = (conversation.total_messages_count || 0) + 1;
    const trimmedHistory = trimMessageHistory(messageHistory);
    
    // *** SMART MEMORY: Generate/update customer summary ***
    const customerSummary = generateCustomerSummary(
      messageHistory, 
      conversation.customer_summary, 
      senderName || conversation.sender_name
    );
    
    // *** SMART MEMORY: Extract products discussed ***
    const productsDiscussed = extractProductsDiscussed(messageHistory);
    
    console.log(`[AI Agent] 💾 Memory: Keeping ${trimmedHistory.length}/${messageHistory.length} messages, Summary: "${customerSummary.substring(0, 100)}..."`);

    // Determine next state (RESPECT orderTaking toggle!)
    let nextState = conversation.conversation_state;
    let collectedData: any = {};

    // If orderTaking is DISABLED, don't allow order collection flow
    if (!orderTakingEnabled) {
      // Reset any order-related states to idle
      if (["collecting_name", "collecting_phone", "collecting_address", "order_confirmation"].includes(conversation.conversation_state)) {
        console.log("[AI Agent] ⛔ Order taking disabled, resetting to idle");
        nextState = "idle";
      } else if (intent === "order_intent") {
        // Block new order intents
        console.log("[AI Agent] ⛔ Order intent detected but order taking is DISABLED");
        nextState = "product_inquiry"; // Stay in inquiry mode instead of starting order flow
      } else {
        nextState = getNextState(conversation.conversation_state, intent, false);
        // Make sure it doesn't go to order collection
        if (["collecting_name", "collecting_phone", "collecting_address", "order_confirmation"].includes(nextState)) {
          nextState = "product_inquiry";
        }
      }
    } else {
      // Normal order flow when orderTaking is enabled
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
    }

    // *** SMART UPDATE: Save trimmed history + summary ***
    await supabase
      .from("ai_conversations")
      .update({
        conversation_state: nextState,
        fake_order_score: fakeScore,
        message_history: trimmedHistory, // Only keep last N messages
        customer_summary: customerSummary, // Store compact summary
        last_products_discussed: productsDiscussed,
        total_messages_count: totalMessagesCount,
        has_ordered_before: conversation.has_ordered_before || nextState === "completed",
        last_message_at: new Date().toISOString(),
        ...collectedData,
      })
      .eq("id", conversation.id);

    // Build AI prompt and get response with full context
    const updatedConversation = { 
      ...conversation, 
      conversation_state: nextState, 
      message_history: messageHistory, // Include updated history
      ...collectedData 
    };
    const systemPrompt = buildSystemPrompt(
      pageMemory, 
      updatedConversation, 
      productContext || undefined, 
      postContext || undefined,
      senderName || conversation.sender_name,
      allProducts, // Pass all products for AI knowledge
      orderTakingEnabled // Pass order taking toggle
    );
    
    // Build rich AI messages with context
    const aiMessages = messageHistory.slice(-10).map((msg: any) => {
      let content = msg.content;
      
      // Add context hints to user messages for better understanding
      if (msg.role === "user" && msg.customerResponseIntent) {
        const intentHint = msg.customerResponseIntent !== "general" 
          ? ` [Customer intent: ${msg.customerResponseIntent}]` 
          : "";
        content = content + intentHint;
      }
      
      return {
        role: msg.role,
        content: content,
      };
    });

    // Extract image URLs from attachments for Vision API
    const imageUrls: string[] = [];
    if (attachments && (messageType === "image" || messageType === "video")) {
      for (const att of attachments) {
        const url = att.payload?.url || att.url;
        if (url && url.startsWith("http")) {
          imageUrls.push(url);
        }
      }
      console.log(`[AI Agent] 📷 Extracted ${imageUrls.length} image URLs for Vision analysis`);
    }

    const aiReply = await callAI(systemPrompt, aiMessages, imageUrls.length > 0 ? imageUrls : undefined);

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
        isDigital: false,
      };

      // Check if this is a digital product sale
      if (isDigitalProduct && digitalProductContext) {
        console.log(`[AI Agent] 💻 Creating digital product sale for: ${digitalProductContext.name}`);
        
        // Create digital product sale
        const { data: digitalSale } = await supabase
          .from("digital_product_sales")
          .insert({
            user_id: effectiveUserId,
            product_id: digitalProductContext.id,
            customer_name: updatedConversation.collected_name,
            customer_phone: updatedConversation.collected_phone,
            customer_fb_id: senderId,
            sale_price: digitalProductContext.sale_price || digitalProductContext.price,
            payment_method: "advance", // Digital products require advance payment
            payment_status: "pending",
            delivery_status: "pending",
            notes: `AI Sale - Invoice: ${invoiceNumber}`,
          })
          .select()
          .single();

        if (digitalSale) {
          orderId = digitalSale.id;
          console.log(`[AI Agent] ✅ Digital sale created: ${orderId}`);
          
          // Update product sold count
          const { data: product } = await supabase
            .from("digital_products")
            .select("total_sold")
            .eq("id", digitalProductContext.id)
            .single();
          
          if (product) {
            await supabase
              .from("digital_products")
              .update({ total_sold: (product.total_sold || 0) + 1 })
              .eq("id", digitalProductContext.id);
          }
        }
      } else {
        // Create physical product order (existing logic)
        const { data: order } = await supabase
          .from("ai_orders")
          .insert({
            user_id: effectiveUserId,
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
      }
      
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
      // *** FOR MESSENGER INBOX: Also use SMART analysis for stickers/GIFs/emojis/audio ***
      const isMediaMessage = messageType === "sticker" || messageType === "gif" || 
        messageType === "animated_sticker" || messageType === "image" || messageType === "video" ||
        messageType === "audio" ||
        /^[\s]*[👍❤️🔥💯💕😍🥰😊👏💪🙌❤]+[\s]*$/.test(messageText);
      
      if (isMediaMessage) {
        // Apply smart analysis for media messages in inbox too
        const smartAnalysis = smartAnalyzeComment(
          messageText,
          messageType,
          attachments,
          undefined,
          productContext || undefined,
          false,
          undefined,
          senderName
        );
        
        console.log(`[AI Agent] INBOX SMART ANALYSIS: type=${smartAnalysis.commentType}, sentiment=${smartAnalysis.sentiment}`);
        
        // Generate appropriate reply based on message type
        if (messageType === "sticker" || smartAnalysis.isSticker || smartAnalysis.isJustReaction) {
          // Sticker/emoji in inbox - respond warmly, don't ask about photos
          const stickerAnalysis = analyzeSticker(undefined, messageText, attachments);
          
          let smartReply = "";
          if (stickerAnalysis.sentiment === "positive") {
            const positiveReplies = [
              `${senderName ? senderName.split(" ")[0] + ", " : ""}ধন্যবাদ! 😊 আপনাকে কীভাবে সাহায্য করতে পারি?`,
              `${senderName ? senderName.split(" ")[0] + ", " : ""}আপনার সাথে কথা বলতে পেরে ভালো লাগছে! 💕 কিছু জানতে চাইলে বলুন।`,
              `ধন্যবাদ! 🙏 কোন প্রোডাক্ট সম্পর্কে জানতে চান?`,
            ];
            smartReply = positiveReplies[Math.floor(Math.random() * positiveReplies.length)];
          } else if (stickerAnalysis.sentiment === "negative") {
            smartReply = `${senderName ? senderName.split(" ")[0] + ", " : ""}কোনো সমস্যা হলে জানাবেন, সাহায্য করার চেষ্টা করব। 🙏`;
          } else {
            smartReply = `${senderName ? senderName.split(" ")[0] + ", " : ""}হ্যাঁ, বলুন কীভাবে সাহায্য করতে পারি? 😊`;
          }
          
          response.reply = smartReply;
          response.reactionType = stickerAnalysis.reaction;
          response.smartAnalysis = {
            type: smartAnalysis.commentType,
            reason: smartAnalysis.reason,
            sentiment: smartAnalysis.sentiment,
          };
        } else if (messageType === "gif") {
          // GIF in inbox - respond with matching energy
          const gifAnalysis = analyzeSticker(undefined, messageText, attachments);
          
          let gifReply = "";
          if (gifAnalysis.sentiment === "positive") {
            const gifReplies = [
              `হাহা! 😄 আপনার সাথে কথা বলতে মজা লাগছে! কিছু জানতে চান?`,
              `😊💕 ধন্যবাদ! কীভাবে সাহায্য করতে পারি?`,
              `🔥 নাইস! কোন প্রোডাক্ট পছন্দ হয়েছে?`,
            ];
            gifReply = gifReplies[Math.floor(Math.random() * gifReplies.length)];
          } else {
            gifReply = `😊 বলুন, কীভাবে সাহায্য করতে পারি?`;
          }
          
          response.reply = gifReply;
          response.reactionType = gifAnalysis.reaction;
          response.smartAnalysis = {
            type: "gif",
            reason: gifAnalysis.meaning,
            sentiment: gifAnalysis.sentiment,
          };
        } else if (smartAnalysis.isPhoto || messageType === "image") {
          // Photo message - use AI Vision to analyze the image
          console.log(`[AI Agent] 📷 Photo detected, using Vision API for analysis`);
          
          // Extract image URLs from attachments
          const photoUrls: string[] = [];
          if (attachments) {
            for (const att of attachments) {
              const url = att.payload?.url || att.url;
              if (url && url.startsWith("http")) {
                photoUrls.push(url);
              }
            }
          }
          
          if (photoUrls.length > 0) {
            // Use Vision API to analyze the image
            const visionSystemPrompt = `You are a helpful Bangladeshi business assistant. Analyze the image the customer sent and respond in Bangla (Bengali).

If it's a product photo:
- Describe what you see briefly
- If you recognize it as a product you sell, mention the name and price
- Offer to help with ordering

If it's a screenshot or other content:
- Describe what you see
- Ask how you can help

Keep response SHORT (2-3 sentences max). Be friendly and helpful.
Available products: ${allProducts.map(p => `${p.name} - ৳${p.price}`).slice(0, 20).join(", ")}`;

            const visionMessages = messageText?.trim() 
              ? [{ role: "user", content: messageText }]
              : [{ role: "user", content: "এই ছবি দেখুন" }];
            
            const visionReply = await callAI(visionSystemPrompt, visionMessages, photoUrls);
            response.reply = visionReply;
            response.reactionType = "LIKE";
            response.smartAnalysis = {
              type: "photo_analyzed",
              reason: "Vision API used for image analysis",
              sentiment: "neutral",
            };
            console.log(`[AI Agent] ✅ Vision analysis complete`);
          } else {
            // No valid image URL - fallback response
            response.reply = `ছবিটা পেয়েছি! 📷 এই ছবি সম্পর্কে কী জানতে চাইছেন? অথবা কোন প্রোডাক্টের ছবি হলে বলুন, দাম জানিয়ে দেব! 😊`;
            response.reactionType = "LIKE";
          }
        } else if (messageType === "video") {
          // *** VIDEO ANALYSIS - Use Vision API for video frames ***
          console.log(`[AI Agent] 🎬 Video detected, using Vision API for analysis`);
          
          // Extract video URLs/thumbnails from attachments
          const videoUrls: string[] = [];
          if (attachments) {
            for (const att of attachments) {
              // Try to get video URL or thumbnail
              const url = att.payload?.url || att.url || att.payload?.preview_url;
              if (url && url.startsWith("http")) {
                videoUrls.push(url);
              }
            }
          }
          
          if (videoUrls.length > 0) {
            const videoSystemPrompt = `You are a helpful Bangladeshi business assistant. The customer sent a video. Analyze the video content and respond in Bangla (Bengali).

Instructions:
- Describe what you see in the video briefly
- If it shows a product, try to identify it from your catalog and mention the price
- If they're asking about something, answer helpfully
- If it's a product demonstration or unboxing, express interest and offer help
- Keep response SHORT (2-3 sentences max)

Available products: ${allProducts.map(p => `${p.name} - ৳${p.price}`).slice(0, 20).join(", ")}

Be friendly and helpful! Use emojis.`;

            const videoMessages = messageText?.trim() 
              ? [{ role: "user", content: `Customer said: "${messageText}". Analyze their video.` }]
              : [{ role: "user", content: "Customer sent a video. Analyze it and respond helpfully." }];
            
            const videoReply = await callAI(videoSystemPrompt, videoMessages, videoUrls);
            response.reply = videoReply;
            response.reactionType = "WOW";
            response.smartAnalysis = {
              type: "video_analyzed",
              reason: "Vision API used for video analysis",
              sentiment: "neutral",
            };
            console.log(`[AI Agent] ✅ Video analysis complete`);
          } else {
            response.reply = `ভিডিওটা পেয়েছি! 🎬 সুন্দর! এই ভিডিও সম্পর্কে কিছু জানতে চাইলে বলুন। কোন প্রোডাক্টের ভিডিও হলে দাম জানাতে পারি! 😊`;
            response.reactionType = "WOW";
          }
        } else if (messageType === "audio") {
          // *** VOICE/AUDIO MESSAGE HANDLING - CONTEXTUAL RESPONSE (v2.0) ***
          console.log(`[AI Agent] 🎤 [V2] Voice message detected - using contextual response (no transcription)`);
          
          // Extract audio URL
          let audioUrl: string | undefined;
          if (attachments) {
            for (const att of attachments) {
              const url = att.payload?.url || att.url;
              if (url && url.startsWith("http")) {
                audioUrl = url;
                break;
              }
            }
          }
          
          // Check if AI Media Understanding is enabled for voice
          const mediaUnderstandingEnabled = settings.aiMediaUnderstanding !== false;
          
          if (audioUrl && mediaUnderstandingEnabled) {
            try {
              console.log(`[AI Agent] 🎤 Processing voice message from: ${audioUrl.substring(0, 100)}...`);
              
              // For voice messages, we'll use a text-based approach since direct audio transcription 
              // is not reliably supported. We ask the AI to acknowledge the voice message and 
              // provide a helpful response based on context.
              
              // Build a contextual response for voice messages
              const voiceContextPrompt = `${systemPrompt}

VOICE MESSAGE RECEIVED:
The customer has sent a voice message. Since we cannot directly transcribe it, please:

1. Warmly acknowledge that you received their voice message
2. Politely ask them to type their question or request
3. Mention that you're ready to help with product info, pricing, or orders
4. Keep the response SHORT and friendly in Bengali

Previous conversation context: ${conversation?.customer_summary || "New customer"}
Last products discussed: ${conversation?.last_products_discussed?.join(", ") || "None"}`;

              const voiceAiMessages = conversation?.message_history?.length > 0
                ? [...conversation.message_history.slice(-5), { role: "user", content: "[Voice Message Received]" }]
                : [{ role: "user", content: "[Voice Message Received]" }];
              
              const voiceReply = await callAI(voiceContextPrompt, voiceAiMessages);
              
              response.reply = `🎤 ${voiceReply}`;
              response.reactionType = "LIKE";
              response.smartAnalysis = {
                type: "voice_received",
                reason: "Voice message acknowledged with helpful response",
                sentiment: "neutral",
              };
              
              console.log(`[AI Agent] ✅ Voice message handled with contextual response`);
            } catch (voiceError) {
              console.error(`[AI Agent] 🎤 Voice handling error:`, voiceError);
              // Fallback to asking for text
              response.reply = `🎤 ভয়েস মেসেজ পেয়েছি! আপনি কি টাইপ করে জানাতে পারবেন কী দরকার? আমি সাহায্য করতে প্রস্তুত! 😊`;
              response.reactionType = "LIKE";
              response.smartAnalysis = {
                type: "voice_error",
                reason: `Voice handling failed: ${voiceError}`,
                sentiment: "neutral",
              };
            }
          } else {
            // No audio URL or AI Media Understanding disabled
            response.reply = `🎤 ভয়েস মেসেজ পেয়েছি! আপনি কি টাইপ করে জানাতে পারবেন কী দরকার? আমি দ্রুত উত্তর দিব! 😊`;
            response.reactionType = "LIKE";
            response.smartAnalysis = {
              type: "voice_no_transcription",
              reason: mediaUnderstandingEnabled ? "No audio URL available" : "AI Media Understanding disabled",
              sentiment: "neutral",
            };
          }
        }
      } else {
        // Regular text message
        response.reactionType = sentiment === "positive" ? "LOVE" : "LIKE";
      }
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
