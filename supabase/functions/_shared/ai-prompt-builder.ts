// ========= AI PROMPT BUILDER =========
// Builds system prompts based on page configuration

import type { PageMemory, ProductContext } from "./ai-agent-helpers.ts";

export function buildSystemPrompt(
  pageMemory: PageMemory,
  productContext: ProductContext | null,
  allProducts: ProductContext[],
  orderTakingEnabled: boolean,
  mediaContext?: string,
  digitalContext?: string
): string {
  const tone = pageMemory.preferred_tone || "friendly";
  const language = pageMemory.detected_language || "bn";
  
  let prompt = `আপনি একজন বাংলাদেশী ব্যবসার সহায়ক AI। আপনি Facebook Page এ Customer দের সাথে কথা বলছেন।

## 📋 ব্যবসার তথ্য:
${pageMemory.business_description || "ব্যবসার বিবরণ সেট করা হয়নি"}

## 💼 প্রোডাক্ট তালিকা:
${pageMemory.products_summary || allProducts.map(p => `- ${p.name}: ৳${p.price}`).slice(0, 30).join("\n")}

## 🎭 কথা বলার ধরন: ${tone === "formal" ? "সম্মানজনক ভাষায়" : tone === "casual" ? "বন্ধুত্বপূর্ণ" : "বন্ধুত্বপূর্ণ কিন্তু professional"}
## 🌐 ভাষা: ${language === "en" ? "English" : language === "bn" ? "বাংলা" : "Banglish mix"}
`;

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

  // Final instructions
  prompt += `\n\n## 📌 গুরুত্বপূর্ণ নিয়ম:
- সংক্ষেপে উত্তর দিন (২-৩ বাক্য)
- প্রতিটা message এ emoji ব্যবহার করুন
- Customer এর নাম ধরে ডাকুন (যদি জানা থাকে)
- Positive এবং helpful থাকুন
- **উপরের নিয়ম কঠোরভাবে মেনে চলুন**`;

  return prompt;
}
