// ========= SMART COMMENT ANALYZER =========
// Analyzes comments to decide on responses

import type { SmartCommentAnalysis, ProductContext } from "./ai-agent-helpers.ts";
import { analyzeSticker } from "./ai-agent-helpers.ts";

interface PostContext {
  post_id: string;
  post_text?: string;
  media_type?: string;
  linked_product_id?: string;
  product_detected_name?: string;
  product?: ProductContext;
}

export function smartAnalyzeComment(
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
  
  // GIF / ANIMATED STICKER HANDLING
  const isGifType = messageType === "gif" || messageType === "animated_sticker" || 
    attachments?.some(a => a.type === "animated_image_share" || a.type === "gif" || a.url?.includes(".gif"));
  
  if (isGifType) {
    const gifAnalysis = analyzeSticker(undefined, originalText, attachments);
    const gifReplies = ["😄💕", "🔥🙌", "💯😊", "❤️✨", "👏😍"];
    const gifReply = gifAnalysis.sentiment === "positive" 
      ? gifReplies[Math.floor(Math.random() * gifReplies.length)]
      : gifAnalysis.sentiment === "negative" ? "" : "😊👍";
    
    return {
      needsInboxMessage: false,
      commentReply: gifReply,
      reactionType: gifAnalysis.reaction,
      reason: `GIF: ${gifAnalysis.meaning}`,
      commentType: "gif",
      sentiment: gifAnalysis.sentiment,
      isQuestion: false, isOrderIntent: false, isPriceInquiry: false,
      isJustReaction: true, isThankYou: false, isSticker: false, isPhoto: false,
    };
  }
  
  // STICKER HANDLING
  if (messageType === "sticker" || /^\s*[^\w\s\u0980-\u09FF]{1,5}\s*$/.test(originalText)) {
    const stickerAnalysis = analyzeSticker(undefined, originalText, attachments);
    return {
      needsInboxMessage: false,
      commentReply: stickerAnalysis.sentiment === "positive" 
        ? (stickerAnalysis.reaction === "LOVE" ? "💕" : "😊")
        : stickerAnalysis.sentiment === "negative" ? "" : "😊",
      reactionType: stickerAnalysis.reaction,
      reason: `Sticker: ${stickerAnalysis.meaning}`,
      commentType: "sticker",
      sentiment: stickerAnalysis.sentiment,
      isQuestion: false, isOrderIntent: false, isPriceInquiry: false,
      isJustReaction: true, isThankYou: false, isSticker: true, isPhoto: false,
    };
  }
  
  // VIDEO/AUDIO HANDLING
  if (messageType === "video") {
    return {
      needsInboxMessage: true,
      commentReply: `ভিডিওটা দেখছি! 🎬 ইনবক্স check করুন! 😊`,
      reactionType: "WOW",
      reason: "Video detected",
      commentType: "video",
      sentiment: "neutral",
      isQuestion: false, isOrderIntent: false, isPriceInquiry: false,
      isJustReaction: false, isThankYou: false, isSticker: false, isPhoto: false,
    };
  }
  
  if (messageType === "audio") {
    return {
      needsInboxMessage: true,
      commentReply: `🎤 ভয়েস মেসেজ পেয়েছি!`,
      reactionType: "LIKE",
      reason: "Voice message",
      commentType: "audio",
      sentiment: "neutral",
      isQuestion: false, isOrderIntent: false, isPriceInquiry: false,
      isJustReaction: false, isThankYou: false, isSticker: false, isPhoto: false,
    };
  }
  
  // PHOTO HANDLING
  if (messageType === "image" || attachments?.some(a => a.type === "image")) {
    const hasTextContext = /এটা|এই|দাম|price|কত|available/.test(text);
    return {
      needsInboxMessage: hasTextContext,
      commentReply: hasTextContext 
        ? `ছবিটা দেখলাম! 👀 ইনবক্সে বিস্তারিত পাঠাচ্ছি 📩`
        : `ধন্যবাদ ছবিটা পাঠানোর জন্য! 📷 কী জানতে চাইছেন বলুন? 🙂`,
      reactionType: "LIKE",
      reason: "Photo",
      commentType: "photo",
      sentiment: "neutral",
      isQuestion: hasTextContext, isOrderIntent: false, isPriceInquiry: hasTextContext,
      isJustReaction: false, isThankYou: false, isSticker: false, isPhoto: true,
    };
  }
  
  // POSITIVE FEEDBACK - No inbox needed
  const positivePraise = /great|good|nice|awesome|excellent|best|amazing|দারুণ|চমৎকার|অসাধারণ|সুন্দর|মাশাল্লাহ|❤️|❤|👍|🔥|💯|💕|😍|🥰|😊|👏|💪|🙌/i;
  const thankPatterns = /thanks|thank you|ধন্যবাদ|ty|thx/i;
  
  if ((positivePraise.test(text) || thankPatterns.test(text)) &&
      !text.includes("?") && !/কত|দাম|price|অর্ডার|order|কিনব|নিব|চাই|লাগবে|available/.test(text)) {
    return {
      needsInboxMessage: false,
      commentReply: thankPatterns.test(text) ? `আপনাকেও ভাই` : `ধন্যবাদ ভাই`,
      reactionType: "LOVE",
      reason: "Positive feedback",
      commentType: "positive_feedback",
      sentiment: "positive",
      isQuestion: false, isOrderIntent: false, isPriceInquiry: false,
      isJustReaction: true, isThankYou: thankPatterns.test(text), isSticker: false, isPhoto: false,
    };
  }
  
  // REPLY TO PAGE'S COMMENT
  if (isReplyToPageComment || parentCommentId) {
    if (/sms|message|inbox|মেসেজ|ইনবক্স|msg|dm|দিচ্ছি|করছি/i.test(text)) {
      return {
        needsInboxMessage: false,
        commentReply: `ওকে ভাই, inbox এ কথা বলি`,
        reactionType: "LIKE",
        reason: "Going to inbox",
        commentType: "going_to_inbox",
        sentiment: "neutral",
        isQuestion: false, isOrderIntent: false, isPriceInquiry: false,
        isJustReaction: false, isThankYou: false, isSticker: false, isPhoto: false,
      };
    }
    
    if (/^(ok|okay|ওকে|ঠিক আছে|বুঝলাম|আচ্ছা|হ্যাঁ|হা|yes|জি|hmm|হুম|হবে|করব)[\s!.]*$/i.test(originalText)) {
      return {
        needsInboxMessage: false,
        commentReply: `জি ভাই`,
        reactionType: "LIKE",
        reason: "Acknowledgment",
        commentType: "acknowledgment",
        sentiment: "neutral",
        isQuestion: false, isOrderIntent: false, isPriceInquiry: false,
        isJustReaction: true, isThankYou: false, isSticker: false, isPhoto: false,
      };
    }
  }
  
  // PRICE INQUIRY
  if (/দাম|price|কত|টাকা|cost|rate|কততে|কতো/.test(text)) {
    const priceReply = productContext ? `৳${productContext.price} ভাই, inbox দেখেন` : `inbox দেখেন ভাই`;
    return {
      needsInboxMessage: true,
      commentReply: priceReply,
      reactionType: "LIKE",
      reason: "Price inquiry",
      commentType: "price_inquiry",
      sentiment: "neutral",
      isQuestion: true, isOrderIntent: false, isPriceInquiry: true,
      isJustReaction: false, isThankYou: false, isSticker: false, isPhoto: false,
    };
  }
  
  // ORDER INTENT
  if (/order|অর্ডার|নিব|কিনব|কিনতে|চাই|দিন|দাও|নেব|লাগবে|buy|purchase/.test(text)) {
    return {
      needsInboxMessage: true,
      commentReply: `ভাই inbox এ order নিচ্ছি`,
      reactionType: "LIKE",
      reason: "Order intent",
      commentType: "order_intent",
      sentiment: "neutral",
      isQuestion: false, isOrderIntent: true, isPriceInquiry: false,
      isJustReaction: false, isThankYou: false, isSticker: false, isPhoto: false,
    };
  }
  
  // QUESTION
  if (/\?|কি আছে|available|stock|সাইজ|size|color|রঙ|কোন|which|কিভাবে|how|details|বিস্তারিত/.test(text)) {
    return {
      needsInboxMessage: true,
      commentReply: `inbox দেখেন ভাই`,
      reactionType: "LIKE",
      reason: "Question",
      commentType: "question",
      sentiment: "neutral",
      isQuestion: true, isOrderIntent: false, isPriceInquiry: false,
      isJustReaction: false, isThankYou: false, isSticker: false, isPhoto: false,
    };
  }
  
  // GREETING
  if (/^(hi|hello|হাই|হ্যালো|আসসালাম|সালাম|ভাই|sis|bhai|apu)[\s!.]*$/i.test(originalText)) {
    return {
      needsInboxMessage: false,
      commentReply: `জি ভাই বলুন`,
      reactionType: "LIKE",
      reason: "Greeting",
      commentType: "greeting",
      sentiment: "neutral",
      isQuestion: false, isOrderIntent: false, isPriceInquiry: false,
      isJustReaction: true, isThankYou: false, isSticker: false, isPhoto: false,
    };
  }
  
  // SHORT/UNCLEAR
  if (text.length < 15 && !/\?|দাম|কত|order|অর্ডার/.test(text)) {
    return {
      needsInboxMessage: false,
      commentReply: `জি ভাই বলুন`,
      reactionType: "LIKE",
      reason: "Short/unclear",
      commentType: "unclear",
      sentiment: "neutral",
      isQuestion: false, isOrderIntent: false, isPriceInquiry: false,
      isJustReaction: true, isThankYou: false, isSticker: false, isPhoto: false,
    };
  }
  
  // DEFAULT
  return {
    needsInboxMessage: true,
    commentReply: `ভাই inbox দেখেন`,
    reactionType: "LIKE",
    reason: "General comment",
    commentType: "general",
    sentiment: "neutral",
    isQuestion: false, isOrderIntent: false, isPriceInquiry: false,
    isJustReaction: false, isThankYou: false, isSticker: false, isPhoto: false,
  };
}
