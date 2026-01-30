// ========= SHARED AI AGENT HELPERS =========
// Common types, utilities, and helper functions for ai-facebook-agent

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export interface MessageContext {
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

export interface PageMemory {
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
    bargainingEnabled?: boolean;
    bargainingLevel?: "low" | "medium" | "high" | "aggressive";
    minAcceptableDiscount?: number;
    maxAcceptableDiscount?: number;
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
  support_whatsapp_number?: string;
}

export interface ProductContext {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  sku?: string;
  is_active: boolean;
  variants?: any[];
  isDigital?: boolean;
  product_type?: string;
}

export interface SmartCommentAnalysis {
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

// Analyze sticker/emoji/GIF meaning
export function analyzeSticker(stickerType?: string, messageText?: string, attachments?: any[]): {
  meaning: string;
  sentiment: "positive" | "neutral" | "negative";
  reaction: "LOVE" | "LIKE" | "HAHA" | "WOW" | "NONE";
  isGif: boolean;
  isAnimated: boolean;
} {
  const text = messageText?.toLowerCase() || "";
  
  const isGif = attachments?.some(a => 
    a.type === "animated_image_share" || a.type === "gif" || 
    a.url?.includes(".gif") || a.payload?.url?.includes(".gif")
  ) || false;
  
  const isAnimated = attachments?.some(a => a.type === "animated_sticker" || a.sticker_id) || !!stickerType;
  
  if (/👍|💪|👏|🙌|✌️|🤝|💯/.test(text)) return { meaning: "approval", sentiment: "positive", reaction: "LIKE", isGif, isAnimated };
  if (/❤️|❤|💕|💖|💗|💓|💞|💝|🥰|😍|😘/.test(text)) return { meaning: "love", sentiment: "positive", reaction: "LOVE", isGif, isAnimated };
  if (/😂|🤣|😆|😄|😁|😀|😃|😅/.test(text)) return { meaning: "laughter", sentiment: "positive", reaction: "HAHA", isGif, isAnimated };
  if (/😮|😲|🤯|😱|🔥|⚡|💥/.test(text)) return { meaning: "surprise", sentiment: "positive", reaction: "WOW", isGif, isAnimated };
  if (/😢|😭|😔|😞|😟|🙁/.test(text)) return { meaning: "sadness", sentiment: "negative", reaction: "NONE", isGif, isAnimated };
  if (/😡|😤|👎|🖕|💔/.test(text)) return { meaning: "anger", sentiment: "negative", reaction: "NONE", isGif, isAnimated };
  if (/🤔|🤷|❓|⁉️/.test(text)) return { meaning: "question", sentiment: "neutral", reaction: "LIKE", isGif, isAnimated };
  
  if (isGif) {
    if (/thank|thanks|ধন্যবাদ|ty|thx/.test(text)) return { meaning: "thank_you_gif", sentiment: "positive", reaction: "LOVE", isGif, isAnimated };
    if (/happy|excited|yay|wow|অসাধারণ|দারুণ/.test(text)) return { meaning: "excitement_gif", sentiment: "positive", reaction: "WOW", isGif, isAnimated };
    if (/lol|lmao|haha|😂|funny|মজা/.test(text)) return { meaning: "funny_gif", sentiment: "positive", reaction: "HAHA", isGif, isAnimated };
    if (/love|❤|পছন্দ|ভালোবাসি/.test(text)) return { meaning: "love_gif", sentiment: "positive", reaction: "LOVE", isGif, isAnimated };
    return { meaning: "reaction_gif", sentiment: "positive", reaction: "LIKE", isGif, isAnimated };
  }
  
  return { meaning: "general_reaction", sentiment: "neutral", reaction: "LIKE", isGif, isAnimated };
}

// Detect message intent with state awareness
export function detectIntent(text: string, currentState?: string): string {
  const lowerText = text.toLowerCase();
  
  if (currentState === "collecting_name" && text.length > 2 && text.length < 60 && !/cancel|বাদ|থাক|পরে দিব/.test(lowerText)) return "providing_info";
  if (currentState === "collecting_phone" && /01[3-9]\d{8}/.test(text.replace(/\s|-/g, ""))) return "providing_info";
  if (currentState === "collecting_address" && text.length > 10 && !/cancel|বাদ|থাক|পরে দিব/.test(lowerText)) return "providing_info";
  
  if (/দাম|price|কত|টাকা|cost|rate|কততে|কতো/.test(lowerText)) return "price_inquiry";
  if (/order|অর্ডার|নিব|কিনব|কিনতে|চাই|দিন|দাও|নেব|লাগবে|buy|purchase/.test(lowerText)) return "order_intent";
  if (/details|বিস্তারিত|info|জানতে|কি\?|কী\?|available|আছে\?|stock/.test(lowerText)) return "info_request";
  if (/^(hi|hello|হাই|হ্যালো|আসসালাম|সালাম)[\s!]*$/i.test(text) || /^(ভাই|sis|bhai|apu)[\s!,]*$/i.test(text)) return "greeting";
  if (/^(yes|হ্যাঁ|হা|ok|okay|ঠিক আছে|confirmed|done|হবে|জি)[\s!.]*$/i.test(text)) return "confirmation";
  if (/^(no|না|cancel|বাদ দাও|থাক|later|পরে)[\s!.]*$/i.test(text) || /cancel|বাতিল|অর্ডার বাদ|order cancel|don't want|চাই না/.test(lowerText)) return "cancellation";
  
  return "general";
}

// Detect sentiment with profanity detection
export function detectSentiment(text: string): "positive" | "neutral" | "negative" {
  const lowerText = text.toLowerCase();
  
  const bengaliProfanity = /বোকা[চছ]ো?দা?|বোকাচোদা|বকাচোদা|বুকাচুদা|চুদ|চোদ|মাগি|মাগী|রান্ডি|রান্ডী|হারামি|হারামী|শালা|বাল|খানকি|ভোদা|শুয়োর|কুত্তা|গাধা|মাদারচোদ|বদমাশ|বেশ্যা|পতিতা|ছিনাল|শয়তান|জারজ|হারামজাদা|কামিনা|চুতিয়া|লাউড়া|গু|হাগু|মুত/i;
  const banglishProfanity = /boka|bokachod|chod|chud|magi|randi|harami|sala|khanki|voda|shuor|kutta|gadha|madarc|besha|chutiya|lauda|motherfucker|mf|fuck|fck|shit|bitch|ass|bastard|dick|pussy|whore|slut|cunt|damn|wtf|stfu|idiot|stupid|moron/i;
  
  if (bengaliProfanity.test(lowerText) || banglishProfanity.test(lowerText)) return "negative";
  
  const positivePatterns = /thanks|thank you|ধন্যবাদ|great|awesome|good|ভালো|সুন্দর|love|excellent|best|amazing|wonderful|nice|beautiful|perfect|super|fantastic|❤️|❤|👍|🔥|💯|💕|😍|🥰|😊|👏|💪|🙌|মাশাল্লাহ|অসাম|দারুণ|বাহ|চমৎকার|অসাধারণ|wow|বেস্ট|নাইস|লাভ/i;
  const negativePatterns = /bad|খারাপ|worst|terrible|hate|বাজে|poor|fraud|fake|scam|😡|👎|😤|💔|চোর|প্রতারক|ফেক|ধোকা/i;
  
  if (positivePatterns.test(lowerText)) return "positive";
  if (negativePatterns.test(lowerText)) return "negative";
  return "neutral";
}

// Get next conversation state
export function getNextState(currentState: string, intent: string, orderTakingEnabled: boolean): string {
  if (!orderTakingEnabled) {
    if (intent === "order_intent") return "product_inquiry";
    return currentState;
  }
  
  const stateTransitions: Record<string, Record<string, string>> = {
    idle: {
      greeting: "idle",
      price_inquiry: "product_inquiry",
      info_request: "product_inquiry",
      order_intent: "collecting_name",
      cancellation: "idle",
    },
    product_inquiry: {
      order_intent: "collecting_name",
      cancellation: "idle",
      confirmation: "collecting_name",
    },
    collecting_name: {
      providing_info: "collecting_phone",
      cancellation: "idle",
    },
    collecting_phone: {
      providing_info: "collecting_address",
      cancellation: "idle",
    },
    collecting_address: {
      providing_info: "order_confirmation",
      cancellation: "idle",
    },
    order_confirmation: {
      confirmation: "order_complete",
      cancellation: "idle",
    },
  };
  
  return stateTransitions[currentState]?.[intent] || currentState;
}

// Calculate fake order score
export function calculateFakeOrderScore(messageHistory: any[], conversationState: string, existingScore: number, newMessage: string): number {
  let score = existingScore || 0;
  const lowerText = newMessage.toLowerCase();
  
  if (/test|পরীক্ষা|checking|চেক/.test(lowerText)) score += 20;
  if (/random|যেকোনো|anything/.test(lowerText)) score += 15;
  if (messageHistory.length < 2 && conversationState === "collecting_address") score += 25;
  if (newMessage.length < 3 && ["collecting_name", "collecting_phone", "collecting_address"].includes(conversationState)) score += 10;
  if (conversationState === "collecting_phone" && !/^(?:\+?88)?01[3-9]\d{8}$/.test(newMessage.replace(/\s|-/g, ""))) score += 15;
  
  return Math.min(score, 100);
}

// Trim message history to keep database light
export function trimMessageHistory(history: any[], maxLength: number = 15): any[] {
  if (history.length <= maxLength) return history;
  
  const importantMessages = history.filter(m => 
    m.intent === "order_intent" || m.intent === "confirmation" || m.intent === "cancellation" ||
    m.productContext || m.orderId
  );
  
  const recentMessages = history.slice(-maxLength + importantMessages.length);
  const combined = [...new Set([...importantMessages, ...recentMessages])];
  return combined.slice(-maxLength);
}

// Generate customer summary for memory
export function generateCustomerSummary(messageHistory: any[], existingSummary?: string, senderName?: string): string {
  const topics: Set<string> = new Set();
  const products: Set<string> = new Set();
  let hasOrdered = false, hasComplaint = false, wantsDiscount = false;
  
  for (const msg of messageHistory) {
    if (msg.role === "user") {
      const content = msg.content?.toLowerCase() || "";
      if (/দাম|price|কত/.test(content)) topics.add("দাম জিজ্ঞেস করেছে");
      if (/order|অর্ডার|কিনব|নিব/.test(content)) topics.add("অর্ডার করতে চায়");
      if (/delivery|ডেলিভারি/.test(content)) topics.add("ডেলিভারি জানতে চায়");
      if (/discount|ছাড়|কমাও/.test(content)) { topics.add("ডিসকাউন্ট চায়"); wantsDiscount = true; }
      if (/problem|সমস্যা|complaint/.test(content)) { topics.add("সমস্যা আছে"); hasComplaint = true; }
      if (/confirmed|হবে|নিলাম/.test(content)) hasOrdered = true;
      if (msg.productContext?.name) products.add(msg.productContext.name);
    }
  }
  
  let summary = "";
  if (senderName) summary += `নাম: ${senderName}। `;
  if (existingSummary) summary += "আগেও কথা হয়েছে। ";
  if (products.size > 0) summary += `প্রোডাক্ট: ${[...products].slice(-3).join(", ")}। `;
  if (topics.size > 0) summary += `বিষয়: ${[...topics].slice(-4).join(", ")}। `;
  if (hasOrdered) summary += "আগে অর্ডার করেছে। ";
  if (hasComplaint) summary += "⚠️ সমস্যা ছিল। ";
  if (wantsDiscount) summary += "দাম কমাতে চায়। ";
  
  return summary.substring(0, 500);
}

// Extract products discussed
export function extractProductsDiscussed(messageHistory: any[]): string[] {
  const products: Set<string> = new Set();
  for (const msg of messageHistory) {
    if (msg.productContext?.name) products.add(msg.productContext.name);
  }
  return [...products].slice(-10);
}
