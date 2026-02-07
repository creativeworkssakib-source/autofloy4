import { PageMemory } from './types';

// Build system prompt from page memory
export function buildSystemPrompt(pageMemory: PageMemory | null): string {
  if (!pageMemory) {
    return getDefaultPrompt();
  }
  
  const businessDesc = pageMemory.business_description || 'একটি অনলাইন বিজনেস';
  const productsSummary = pageMemory.products_summary || '';
  const tone = pageMemory.preferred_tone || 'friendly';
  const customInstructions = pageMemory.custom_instructions || '';
  
  // Parse rules
  const sellingRules = pageMemory.selling_rules || {};
  const behaviorRules = pageMemory.behavior_rules || {};
  const paymentRules = pageMemory.payment_rules || {};
  const deliveryRules = pageMemory.delivery_rules || {};
  
  let prompt = `তুমি একজন বাংলাদেশি অনলাইন বিক্রেতার AI সেলস এজেন্ট।

## বিজনেস তথ্য
- বিজনেস: ${businessDesc}
- প্রোডাক্ট: ${productsSummary}
- টোন: ${tone}

## মূল নিয়ম
1. সবসময় বাংলায় উত্তর দাও (Banglish ও গ্রহণযোগ্য)
2. ছোট, friendly এবং helpful উত্তর দাও
3. প্রাইস জিজ্ঞেস করলে সঠিক দাম বলো
4. যা জানো না তা বানিয়ে বলো না - বলো "আমি নিশ্চিত না, একটু অপেক্ষা করুন"
5. অর্ডার নিতে পারলে: নাম, ফোন নম্বর, ঠিকানা নাও`;

  // Add selling rules
  if (sellingRules.showPriceInFirstReply) {
    prompt += `\n6. প্রথম reply তেই প্রাইস বলো`;
  }
  if (sellingRules.askForPhoneNumber) {
    prompt += `\n7. সবসময় ফোন নম্বর জিজ্ঞেস করো`;
  }
  if (sellingRules.upsellRelatedProducts) {
    prompt += `\n8. Related products suggest করো`;
  }
  if (sellingRules.offerDiscount) {
    prompt += `\n9. Discount অফার করতে পারো`;
  }
  
  // Add behavior rules
  if (behaviorRules.greetingStyle) {
    prompt += `\n\n## Greeting Style: ${behaviorRules.greetingStyle}`;
  }
  if (behaviorRules.handleNegativeComments === 'polite') {
    prompt += `\n- নেগেটিভ কমেন্টে politely respond করো`;
  }
  
  // Add payment info
  if (paymentRules.acceptCOD) {
    prompt += `\n\n## পেমেন্ট: Cash on Delivery আছে`;
  }
  if (paymentRules.acceptBkash) {
    prompt += `, বিকাশ: ${paymentRules.bkashNumber || 'আছে'}`;
  }
  if (paymentRules.acceptNagad) {
    prompt += `, নগদ: ${paymentRules.nagadNumber || 'আছে'}`;
  }
  
  // Add delivery info
  if (deliveryRules.insideDhaka) {
    prompt += `\n\n## ডেলিভারি: ঢাকায় ${deliveryRules.insideDhaka}৳`;
  }
  if (deliveryRules.outsideDhaka) {
    prompt += `, ঢাকার বাইরে ${deliveryRules.outsideDhaka}৳`;
  }
  if (deliveryRules.deliveryTime) {
    prompt += `, সময় ${deliveryRules.deliveryTime}`;
  }
  
  // Add custom instructions
  if (customInstructions) {
    prompt += `\n\n## বিশেষ নির্দেশনা
${customInstructions}`;
  }
  
  return prompt;
}

function getDefaultPrompt(): string {
  return `তুমি একজন বাংলাদেশি অনলাইন বিক্রেতার AI সেলস এজেন্ট।

## মূল নিয়ম
1. সবসময় বাংলায় উত্তর দাও (Banglish ও গ্রহণযোগ্য)
2. ছোট, friendly এবং helpful উত্তর দাও
3. কাস্টমারকে সাহায্য করো
4. যা জানো না তা বানিয়ে বলো না

## অর্ডার নিতে হলে
- নাম
- ফোন নম্বর  
- সম্পূর্ণ ঠিকানা`;
}

// Analyze comment sentiment
export function analyzeCommentSentiment(comment: string): {
  sentiment: 'positive' | 'negative' | 'neutral' | 'inquiry';
  shouldReply: boolean;
  suggestedReaction: 'LIKE' | 'LOVE' | 'NONE';
} {
  const lowerComment = comment.toLowerCase();
  
  // Positive patterns
  const positivePatterns = [
    'ভালো', 'সুন্দর', 'অসাধারণ', 'চমৎকার', 'দারুণ', 'মাশাআল্লাহ',
    'wow', 'nice', 'beautiful', 'amazing', 'great', 'love it',
    '❤️', '😍', '🔥', '👍', '💯'
  ];
  
  // Negative patterns
  const negativePatterns = [
    'খারাপ', 'বাজে', 'ফ্রড', 'প্রতারক', 'চোর', 'লোভী',
    'scam', 'fraud', 'fake', 'worst', 'terrible', 'bad',
    '😡', '🤮', '👎'
  ];
  
  // Inquiry patterns
  const inquiryPatterns = [
    'দাম', 'প্রাইস', 'কত', 'price', 'cost', 'how much',
    'কিভাবে', 'কোথায়', 'কবে', 'আছে', 'পাবো', 'দিবেন',
    '?', 'inbox', 'pm', 'dm'
  ];
  
  // Check patterns
  const isPositive = positivePatterns.some(p => lowerComment.includes(p));
  const isNegative = negativePatterns.some(p => lowerComment.includes(p));
  const isInquiry = inquiryPatterns.some(p => lowerComment.includes(p));
  
  if (isNegative) {
    return { sentiment: 'negative', shouldReply: false, suggestedReaction: 'NONE' };
  }
  
  if (isInquiry) {
    return { sentiment: 'inquiry', shouldReply: true, suggestedReaction: 'LIKE' };
  }
  
  if (isPositive) {
    return { sentiment: 'positive', shouldReply: true, suggestedReaction: 'LOVE' };
  }
  
  return { sentiment: 'neutral', shouldReply: true, suggestedReaction: 'LIKE' };
}
