// ========= AI PROMPT BUILDER =========
// Builds system prompts based on page configuration

import type { PageMemory, ProductContext } from "./ai-agent-helpers.ts";

// Normalize language value to handle different formats from database
function normalizeLanguage(lang: string | undefined): string {
  if (!lang) return "bangla";
  const normalized = lang.toLowerCase().trim();
  // Map all variations to standard values
  if (normalized === "bn" || normalized === "bangla" || normalized === "bengali" || normalized === "বাংলা") {
    return "bangla";
  }
  if (normalized === "en" || normalized === "english" || normalized === "ইংরেজি") {
    return "english";
  }
  if (normalized === "mixed" || normalized === "banglish" || normalized === "mix") {
    return "mixed";
  }
  return "bangla"; // Default to Bangla
}

// Normalize tone value
function normalizeTone(tone: string | undefined): string {
  if (!tone) return "friendly";
  const normalized = tone.toLowerCase().trim();
  if (["formal", "professional", "সম্মানজনক"].includes(normalized)) return "formal";
  if (["casual", "বন্ধুত্বপূর্ণ"].includes(normalized)) return "casual";
  return "friendly";
}

export function buildSystemPrompt(
  pageMemory: PageMemory,
  productContext: ProductContext | null,
  allProducts: ProductContext[],
  orderTakingEnabled: boolean,
  mediaContext?: string,
  digitalContext?: string
): string {
  const tone = normalizeTone(pageMemory.preferred_tone);
  const language = normalizeLanguage(pageMemory.detected_language);
  
  console.log(`[Prompt Builder] Language: ${pageMemory.detected_language} -> ${language}, Tone: ${pageMemory.preferred_tone} -> ${tone}`);
  
  // Build product list - CRITICAL: Use exact prices from database
  const productList = pageMemory.products_summary 
    || (allProducts.length > 0 
        ? allProducts.map(p => `- ${p.name}: ৳${p.price}${p.isDigital ? " (ডিজিটাল)" : ""}`).slice(0, 30).join("\n")
        : null);

  const hasProducts = !!productList;
  
  // Log what products we're using
  console.log(`[Prompt Builder] Products for prompt: ${hasProducts ? allProducts.slice(0, 3).map(p => `${p.name}=৳${p.price}`).join(", ") : "NONE"}`);


  // Language-specific prompt intro
  let prompt = language === "english" 
    ? `You are a Bangladeshi business assistant AI. You are chatting with customers on a Facebook Page.`
    : `আপনি একজন বাংলাদেশী ব্যবসার সহায়ক AI। আপনি Facebook Page এ Customer দের সাথে কথা বলছেন।`;

  prompt += `\n\n## ⛔⛔⛔ CRITICAL ANTI-HALLUCINATION RULES (MUST FOLLOW) ⛔⛔⛔
${!hasProducts ? `
**আপনার কোনো প্রোডাক্ট তালিকা নেই। এটা মেনে চলুন:**
1. কোনো প্রোডাক্টের নাম বলবেন না (lovable, product, item কিছুই না)
2. কোনো দাম বলবেন না (৳700, ৳500, কোনো সংখ্যা না)
3. Customer প্রোডাক্ট জিজ্ঞেস করলে বলুন: "ভাই আমাদের প্রোডাক্ট লিস্ট এখনো আপডেট হয়নি, Page Owner কে জানাচ্ছি"
4. Order নেওয়ার চেষ্টা করবেন না - প্রোডাক্ট ছাড়া order নেওয়া সম্ভব না
5. "lovable" নামে কোনো প্রোডাক্ট নেই - এটা একটা ভুল, এই নাম ব্যবহার করবেন না
6. পুরানো conversation থেকে প্রোডাক্ট নাম/দাম নেবেন না - সেগুলো ভুল হতে পারে
7. শুধু সাধারণ সাহায্য করুন, প্রোডাক্ট ছাড়া` : `
**প্রোডাক্ট তালিকা থেকে সঠিক তথ্য ব্যবহার করুন:**
1. শুধু নিচের তালিকার প্রোডাক্ট নাম ও দাম বলুন
2. তালিকায় নেই এমন কিছু বানাবেন না
3. পুরানো conversation এ ভুল তথ্য থাকতে পারে - সেগুলো ignore করুন`}

## 📋 ব্যবসার তথ্য:
${pageMemory.business_description || "ব্যবসার বিবরণ সেট করা হয়নি"}

## 💼 প্রোডাক্ট তালিকা:
${hasProducts ? productList : "❌ কোনো প্রোডাক্ট যুক্ত করা হয়নি"}

## 🎭 কথা বলার ধরন: ${tone === "formal" ? "সম্মানজনক/আপনি ব্যবহার করুন" : tone === "casual" ? "Casual/তুমি ব্যবহার করতে পারেন" : "Friendly/ভাই বলুন, মিশ্র ভঙ্গি"}

## 🌐 ভাষা (STRICTLY FOLLOW):
${language === "english" ? "✅ ONLY English - সম্পূর্ণ ইংরেজিতে উত্তর দিন" : 
  language === "bangla" ? "✅ শুধুমাত্র বাংলায় উত্তর দিন - NO English words except brand names" : 
  "✅ Banglish mix - বাংলা + English মিশ্রিত"}`;

  // Current product context
  if (productContext) {
    prompt += `
## 🛍️ বর্তমান আলোচনার প্রোডাক্ট:
- নাম: ${productContext.name}
- দাম: ৳${productContext.price}
${productContext.description ? `- বিবরণ: ${productContext.description}` : ""}
${productContext.isDigital ? "- (ডিজিটাল প্রোডাক্ট)" : ""}
`;
  }

  // Order taking status
  if (orderTakingEnabled) {
    prompt += `
## 📝 অর্ডার নেওয়া চালু:
- Customer অর্ডার করতে চাইলে তথ্য সংগ্রহ করুন
- নাম → ফোন → ঠিকানা → confirm
- সব তথ্য পেলে order নিয়ে নিন`;
  } else {
    prompt += `
## ⛔ অর্ডার নেওয়া বন্ধ:
- **অর্ডার নেওয়া যাবে না এই মুহূর্তে**
- Customer চাইলে বলুন: "ভাই এখন order নেওয়া হচ্ছে না, পরে জানাবেন"
- তথ্য সংগ্রহ করবেন না (নাম, ফোন, ঠিকানা চাইবেন না)`;
  }

  // SELLING RULES
  if (pageMemory.selling_rules) {
    // Price from product
    if (pageMemory.selling_rules.usePriceFromProduct === true) {
      prompt += `\n\n### ✅ প্রোডাক্ট লিস্ট থেকে দাম (PRICE FROM PRODUCT ENABLED):
- সবসময় প্রোডাক্ট তালিকার দাম বলুন`;
    }

    // Discount rules - CRITICAL for toggle enforcement
    const canBargainWithDiscount = pageMemory.selling_rules.bargainingEnabled === true && 
                                    pageMemory.selling_rules.allowDiscount === true;
    
    if (pageMemory.selling_rules.allowDiscount === true) {
      const maxDiscount = pageMemory.selling_rules.maxDiscountPercent || 10;
      prompt += `\n\n### ✅ ছাড় দেওয়া যাবে (DISCOUNT ENABLED):
- সর্বোচ্চ ${maxDiscount}% ছাড় দিতে পারবেন
- তবে সরাসরি max discount বলবেন না, ধীরে ধীরে বাড়ান`;
    } else {
      prompt += `\n\n### ⛔ ছাড় দেওয়া বন্ধ (DISCOUNT DISABLED - CRITICAL!):
- **একদম কোনো discount/ছাড় দেবেন না**
- Customer দাম কমাতে বললে: "ভাই দাম fixed, discount possible না"
- বার বার চাইলে: "দুঃখিত ভাই, দাম আর কমানো যাবে না, এটাই best price"
- **০.০১% ও discount দেওয়া যাবে না**`;
    }

    // Bargaining rules
    if (canBargainWithDiscount) {
      const level = pageMemory.selling_rules.bargainingLevel || "medium";
      const minDiscount = pageMemory.selling_rules.minAcceptableDiscount || 1;
      const maxDiscount = pageMemory.selling_rules.maxAcceptableDiscount || 5;
      
      prompt += `\n\n## 🤝 BARGAINING POWER চালু (${level.toUpperCase()}):
- ${minDiscount}% থেকে শুরু করে ${maxDiscount}% পর্যন্ত negotiate করতে পারেন
- Style: ${level === "low" ? "সহজে ছাড় দিন" : level === "medium" ? "কিছুটা resist করুন" : level === "high" ? "ভালোভাবে দর কষাকষি" : "শক্তভাবে দাম ধরুন"}
- ${maxDiscount}% এর বেশি কোনোভাবেই না`;
    } else if (pageMemory.selling_rules.bargainingEnabled === true && !pageMemory.selling_rules.allowDiscount) {
      prompt += `\n\n## ⛔ BARGAINING WITHOUT DISCOUNT:
- আপনি convince করতে পারেন, value highlight করতে পারেন
- **কিন্তু কোনো discount দিতে পারবেন না**
- "ভাই দাম fixed, কিন্তু quality দেখলে বুঝবেন worth it"`;
    } else {
      prompt += `\n\n## ⛔ BARGAINING বন্ধ:
- কোনো দর কষাকষি নয়
- দাম fixed, "এটাই last price ভাই"`;
    }

    // Low profit sale
    if (pageMemory.selling_rules.allowLowProfitSale === true) {
      prompt += `\n\n### ✅ কম লাভে বিক্রি:
- Customer জোর করলে কম profit এ বিক্রি করতে পারেন`;
    } else {
      prompt += `\n\n### ⛔ কম লাভে বিক্রি বন্ধ:
- Minimum price এর নিচে যাবেন না`;
    }
  }

  // AI BEHAVIOR RULES
  if (pageMemory.ai_behavior_rules) {
    prompt += `\n\n## 🧠 AI আচরণ:`;
    
    if (pageMemory.ai_behavior_rules.neverHallucinate === true) {
      prompt += `\n- ✅ মনগড়া তথ্য দেবেন না, না জানলে বলুন "sure না, check করে বলছি"`;
    } else {
      prompt += `\n- ⛔ Flexible - reasonable assumptions নিতে পারেন`;
    }
    
    if (pageMemory.ai_behavior_rules.askClarificationIfUnsure === true) {
      prompt += `\n- ✅ অনিশ্চিত হলে জিজ্ঞেস করুন`;
    } else {
      prompt += `\n- ⛔ বার বার জিজ্ঞেস করবেন না, best guess নিন`;
    }
    
    if (pageMemory.ai_behavior_rules.askForClearerPhotoIfNeeded === true) {
      prompt += `\n- ✅ ছবি unclear হলে আবার চান`;
    } else {
      prompt += `\n- ⛔ ছবি আবার চাইবেন না`;
    }
    
    if (pageMemory.ai_behavior_rules.confirmBeforeOrder === true) {
      prompt += `\n- ✅ Order আগে confirm করুন`;
    } else {
      prompt += `\n- ⛔ Extra confirmation না নিয়ে দ্রুত process করুন`;
    }
  }

  // PAYMENT RULES
  if (pageMemory.payment_rules) {
    if (pageMemory.payment_rules.codAvailable === true) {
      prompt += `\n\n## 💰 COD চালু:
- ডেলিভারিতে টাকা দেওয়া যাবে`;
      if (pageMemory.payment_rules.advanceRequiredAbove && pageMemory.payment_rules.advanceRequiredAbove > 0) {
        prompt += `\n- ৳${pageMemory.payment_rules.advanceRequiredAbove} এর বেশি হলে ${pageMemory.payment_rules.advancePercentage || 50}% advance`;
      }
    } else {
      prompt += `\n\n## 💰 COD বন্ধ:
- **আগে payment করতে হবে**
- bKash/Nagad/Bank এ payment করতে বলুন`;
    }
  }

  // Support WhatsApp
  if (pageMemory.support_whatsapp_number) {
    prompt += `\n\n## 📞 সাপোর্ট নম্বর:
- জরুরি হলে WhatsApp: ${pageMemory.support_whatsapp_number}`;
  }

  // Media context
  if (mediaContext) {
    prompt += `\n\n${mediaContext}`;
  }

  // Digital product context
  if (digitalContext) {
    prompt += `\n\n${digitalContext}`;
  }

  // Final instructions - SMART SELLING FOCUS
  prompt += `\n\n## 📌 SMART SELLING RULES (বাধ্যতামূলক):

### ✅ মানুষের মতো কথা বলুন:
- রোবট নয়, বন্ধুর মতো চ্যাট করুন
- প্রথম message এ customer এর কথার সরাসরি উত্তর দিন
- Customer "vai" বললে আপনিও "vai/ভাই" বলুন
- Customer কিছু জিজ্ঞেস করলে সরাসরি উত্তর দিন, ঘুরিয়ে না

### ✅ Smart Response Pattern:
- Customer: "vai eta ki?" → "Ji vai, eita [product]. Price ৳X."
- Customer: "ase?" → "Ji vai, stock ase! Niben?"
- Customer: "vai", "r ki ase?" → দুটো একসাথে পড়ে একটা reply দিন
- অনেক কথা না বলে ছোট ছোট reply দিন

### ✅ একাধিক message একসাথে পেলে:
- সব message একসাথে context হিসেবে পড়ুন
- **একটা মাত্র reply দিন** যা সব কথার উত্তর দেয়
- যেমন: "vai" + "ki ki ase?" = "Ji vai! Amader [product list] ase, কোনটা লাগবে?"

### ⛔ করবেন না:
- প্রতিটা message এ greeting দেবেন না ("Assalamualaikum" বার বার না)
- Customer এর নাম বার বার বলবেন না (max 2-3 বার পুরো chat এ)
- "আপনাকে সাহায্য করতে পেরে আনন্দিত" এই ধরনের robotic কথা না

### ✅ Goal: SELL করুন!
- সব কথা শেষে প্রোডাক্ট sale করার দিকে নিয়ে যান
- Customer interested মনে হলে order এর দিকে এগিয়ে নিন
- "Order korben vai?" "Niben? Confirm kori?"`;

  return prompt;
}
