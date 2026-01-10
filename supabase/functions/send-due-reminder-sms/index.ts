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
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
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
  } catch {
    return null;
  }
}

interface CustomerReminder {
  customerName: string;
  customerPhone: string;
  dueAmount: number;
  totalPurchases?: number;
  oldestDueDate?: string;
  daysOverdue?: number;
  productList?: string;
  invoiceList?: string;
  purchaseDetails?: string;
}

// SMS provider configurations
const SMS_PROVIDERS = {
  ssl_wireless: {
    url: "https://smsplus.sslwireless.com/api/v3/send-sms",
    sendSms: async (apiKey: string, senderId: string, phone: string, message: string, userId: string) => {
      const response = await fetch("https://smsplus.sslwireless.com/api/v3/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          api_token: apiKey,
          sid: senderId || "SSLSMS",
          msisdn: phone.replace("+", ""),
          sms: message,
          csms_id: `DUE-${userId.substring(0, 8)}-${Date.now()}`,
        }),
      });
      const result = await response.json();
      return { success: result.status === "SUCCESS" || result.status_code === "200", result };
    }
  },
  bulksms_bd: {
    url: "https://bulksmsbd.net/api/smsapi",
    sendSms: async (apiKey: string, senderId: string, phone: string, message: string) => {
      const response = await fetch("https://bulksmsbd.net/api/smsapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          senderid: senderId,
          number: phone.replace("+88", "").replace("+", ""),
          message: message,
        }),
      });
      const result = await response.json();
      return { success: result.response_code === 202, result };
    }
  },
  twilio: {
    url: "https://api.twilio.com/2010-04-01/Accounts/",
    sendSms: async (apiKey: string, senderId: string, phone: string, message: string) => {
      // apiKey format: ACCOUNT_SID:AUTH_TOKEN
      const [accountSid, authToken] = apiKey.split(":");
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
        },
        body: new URLSearchParams({
          To: phone,
          From: senderId,
          Body: message,
        }),
      });
      const result = await response.json();
      return { success: !result.error_code, result };
    }
  },
  mim_sms: {
    url: "https://esms.mimsms.com/smsapi",
    sendSms: async (apiKey: string, senderId: string, phone: string, message: string) => {
      const response = await fetch(`https://esms.mimsms.com/smsapi?api_key=${apiKey}&type=text&contacts=${phone.replace("+88", "").replace("+", "")}&senderid=${senderId}&msg=${encodeURIComponent(message)}`);
      const result = await response.text();
      return { success: result.includes("SMS SUBMITTED"), result };
    }
  },
  greenweb: {
    url: "http://api.greenweb.com.bd/api.php",
    sendSms: async (apiKey: string, _senderId: string, phone: string, message: string) => {
      const response = await fetch(`http://api.greenweb.com.bd/api.php?token=${apiKey}&to=${phone.replace("+88", "").replace("+", "")}&message=${encodeURIComponent(message)}`);
      const result = await response.text();
      return { success: result.includes("Ok"), result };
    }
  },
  custom: {
    url: "",
    sendSms: async (apiKey: string, senderId: string, phone: string, message: string, _userId: string, customUrl?: string) => {
      if (!customUrl) {
        throw new Error("Custom API URL not configured");
      }
      const response = await fetch(customUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          sender_id: senderId,
          phone: phone,
          message: message,
        }),
      });
      const result = await response.json();
      return { success: response.ok, result };
    }
  }
};

// Check SMS limit for user based on their plan
async function checkSmsLimit(supabase: any, userId: string, smsCount: number): Promise<{ allowed: boolean; message?: string; remaining?: number }> {
  // Get user's subscription plan
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("subscription_plan")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    console.error("Error fetching user:", userError);
    return { allowed: false, message: "Could not verify user subscription" };
  }

  const plan = user.subscription_plan || "none";
  console.log(`User ${userId} has plan: ${plan}`);

  // Get SMS limits from site_settings
  const { data: siteSettings, error: settingsError } = await supabase
    .from("site_settings")
    .select("sms_limit_trial, sms_limit_starter, sms_limit_professional, sms_limit_business, sms_limit_lifetime")
    .limit(1)
    .maybeSingle();

  if (settingsError) {
    console.error("Error fetching site settings:", settingsError);
  }

  // Determine limit based on plan
  let dailyLimit = 0;
  switch (plan) {
    case "trial":
    case "none":
      dailyLimit = siteSettings?.sms_limit_trial ?? 0;
      break;
    case "starter":
      dailyLimit = siteSettings?.sms_limit_starter ?? 50;
      break;
    case "professional":
      dailyLimit = siteSettings?.sms_limit_professional ?? 200;
      break;
    case "business":
      dailyLimit = siteSettings?.sms_limit_business ?? 1000;
      break;
    case "lifetime":
      dailyLimit = siteSettings?.sms_limit_lifetime ?? -1;
      break;
    default:
      dailyLimit = 0;
  }

  console.log(`Plan ${plan} has daily limit: ${dailyLimit}`);

  // Check if trial/none - not allowed
  if (dailyLimit === 0) {
    return { 
      allowed: false, 
      message: plan === "trial" || plan === "none"
        ? "Platform SMS is not available for Free Trial. Please upgrade to Starter or higher plan."
        : "SMS limit reached for your plan."
    };
  }

  // If unlimited (-1), allow
  if (dailyLimit === -1) {
    return { allowed: true, remaining: Infinity };
  }

  // Count today's usage
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data: usageLogs, error: usageError } = await supabase
    .from("sms_usage_logs")
    .select("sms_count")
    .eq("user_id", userId)
    .gte("sent_at", today.toISOString());

  if (usageError) {
    console.error("Error fetching usage logs:", usageError);
  }

  const usedToday = usageLogs?.reduce((sum: number, log: any) => sum + (log.sms_count || 0), 0) || 0;
  const remaining = dailyLimit - usedToday;

  console.log(`User ${userId} has used ${usedToday} SMS today, ${remaining} remaining`);

  // Check if exceeds limit
  if (usedToday + smsCount > dailyLimit) {
    return { 
      allowed: false, 
      message: `Daily SMS limit (${dailyLimit}) reached. You have sent ${usedToday} SMS today. Try again tomorrow or upgrade your plan.`,
      remaining: remaining
    };
  }

  return { allowed: true, remaining: remaining };
}

// Log SMS usage
async function logSmsUsage(supabase: any, userId: string, smsCount: number, smsType: string) {
  const { error } = await supabase
    .from("sms_usage_logs")
    .insert({
      user_id: userId,
      sms_count: smsCount,
      sms_type: smsType,
      sent_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Error logging SMS usage:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const userId = await verifyToken(req.headers.get("Authorization"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { customers } = await req.json() as { customers: CustomerReminder[] };

    if (!customers || customers.length === 0) {
      return new Response(JSON.stringify({ error: "No customers provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get shop settings for SMS template and API credentials
    const { data: settings, error: settingsError } = await supabase
      .from("shop_settings")
      .select("shop_name, shop_phone, due_reminder_sms_template, sms_api_key, sms_sender_id, use_platform_sms")
      .eq("user_id", userId)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw settingsError;
    }

    const shopName = settings?.shop_name || "Our Shop";
    const shopPhone = settings?.shop_phone || "";
    const smsTemplate = settings?.due_reminder_sms_template || 
      "প্রিয় {customer_name}, আপনার কাছে {shop_name} এ মোট {due_amount} টাকা বাকি আছে। অনুগ্রহ করে পরিশোধ করুন।";
    const usePlatformSms = settings?.use_platform_sms !== false;
    
    let smsApiKey = settings?.sms_api_key;
    let smsSenderId = settings?.sms_sender_id;
    let smsProvider = "ssl_wireless";

    // If using platform SMS, check limits and get platform SMS settings
    if (usePlatformSms) {
      // Check SMS limit first
      const limitCheck = await checkSmsLimit(supabase, userId, customers.length);
      if (!limitCheck.allowed) {
        return new Response(JSON.stringify({ 
          error: "SMS limit exceeded", 
          message: limitCheck.message,
          remaining: limitCheck.remaining
        }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: siteSettings, error: siteError } = await supabase
        .from("site_settings")
        .select("platform_sms_enabled, platform_sms_api_key, platform_sms_sender_id, platform_sms_provider")
        .limit(1)
        .maybeSingle();

      if (siteError) {
        console.error("Error fetching site settings:", siteError);
      }

      if (!siteSettings?.platform_sms_enabled) {
        return new Response(JSON.stringify({ 
          error: "Platform SMS not enabled", 
          message: "Platform SMS service is currently disabled. Please contact admin or use your own SMS API." 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      smsApiKey = siteSettings.platform_sms_api_key;
      smsSenderId = siteSettings.platform_sms_sender_id;
      smsProvider = siteSettings.platform_sms_provider || "ssl_wireless";
    }

    if (!smsApiKey) {
      return new Response(JSON.stringify({ 
        error: "SMS API key not configured", 
        message: usePlatformSms 
          ? "Platform SMS API key not configured. Please contact admin."
          : "Please configure SMS API key in shop settings" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ phone: string; success: boolean; message: string }> = [];
    
    for (const customer of customers) {
      if (!customer.customerPhone) {
        results.push({ 
          phone: "N/A", 
          success: false, 
          message: `No phone for ${customer.customerName}` 
        });
        continue;
      }

      // Format amount with BDT
      const formattedAmount = new Intl.NumberFormat("bn-BD", {
        style: "currency",
        currency: "BDT",
        minimumFractionDigits: 0,
      }).format(customer.dueAmount);

      // Replace all placeholders in template
      const smsText = smsTemplate
        .replace(/{customer_name}/g, customer.customerName)
        .replace(/{shop_name}/g, shopName)
        .replace(/{due_amount}/g, formattedAmount)
        .replace(/{total_purchases}/g, String(customer.totalPurchases || 0))
        .replace(/{oldest_due_date}/g, customer.oldestDueDate || "N/A")
        .replace(/{days_overdue}/g, String(customer.daysOverdue || 0))
        .replace(/{product_list}/g, customer.productList || "")
        .replace(/{invoice_list}/g, customer.invoiceList || "")
        .replace(/{purchase_details}/g, customer.purchaseDetails || "")
        .replace(/{phone}/g, shopPhone);

      // Clean phone number (remove spaces, ensure format)
      let phoneNumber = customer.customerPhone.replace(/\s+/g, "").replace(/-/g, "");
      if (!phoneNumber.startsWith("+")) {
        if (phoneNumber.startsWith("0")) {
          phoneNumber = "+88" + phoneNumber;
        } else if (phoneNumber.startsWith("88")) {
          phoneNumber = "+" + phoneNumber;
        } else {
          phoneNumber = "+880" + phoneNumber;
        }
      }

      try {
        const provider = SMS_PROVIDERS[smsProvider as keyof typeof SMS_PROVIDERS] || SMS_PROVIDERS.ssl_wireless;
        const { success, result } = await provider.sendSms(
          smsApiKey,
          smsSenderId || "",
          phoneNumber,
          smsText,
          userId
        );

        console.log(`SMS to ${phoneNumber} via ${smsProvider}:`, result);

        if (success) {
          results.push({ 
            phone: phoneNumber, 
            success: true, 
            message: "SMS sent successfully" 
          });
        } else {
          results.push({ 
            phone: phoneNumber, 
            success: false, 
            message: typeof result === 'object' ? (result.error_message || result.status || "Failed to send") : String(result)
          });
        }
      } catch (smsError: any) {
        console.error(`SMS error for ${phoneNumber}:`, smsError);
        results.push({ 
          phone: phoneNumber, 
          success: false, 
          message: smsError.message || "Network error" 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    // Log SMS usage if using platform SMS and any were sent successfully
    if (usePlatformSms && successCount > 0) {
      await logSmsUsage(supabase, userId, successCount, "due_reminder");
    }

    console.log(`SMS reminder results: ${successCount} sent, ${failCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `${successCount} SMS sent, ${failCount} failed`,
      results,
      totalSent: successCount,
      totalFailed: failCount,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error sending SMS reminders:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to send SMS reminders" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
