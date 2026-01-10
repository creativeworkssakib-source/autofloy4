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
  } catch (e) {
    console.error("Token verification failed:", e);
    return null;
  }
}

interface CustomerFollowup {
  customerName: string;
  customerPhone: string;
  message: string;
  purchasedProducts?: string;
  totalPurchases?: number;
  lastPurchaseDate?: string;
}

// SMS Provider configurations (same as send-due-reminder-sms)
const SMS_PROVIDERS: Record<string, {
  sendSms: (phone: string, message: string, config: any) => Promise<boolean>;
}> = {
  ssl_wireless: {
    async sendSms(phone: string, message: string, config: any) {
      const response = await fetch("https://smsplus.sslwireless.com/api/v3/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_token: config.api_key,
          sid: config.sender_id,
          msisdn: phone,
          sms: message,
          csms_id: `followup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }),
      });
      const data = await response.json();
      return data.status === "SUCCESS";
    },
  },
  bulksms_bd: {
    async sendSms(phone: string, message: string, config: any) {
      const response = await fetch("https://bulksmsbd.net/api/smsapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: config.api_key,
          type: "text",
          number: phone,
          senderid: config.sender_id,
          message: message,
        }),
      });
      const data = await response.json();
      return data.response_code === 202;
    },
  },
  twilio: {
    async sendSms(phone: string, message: string, config: any) {
      const [accountSid, authToken] = config.api_key.split(":");
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          },
          body: new URLSearchParams({
            To: phone,
            From: config.sender_id,
            Body: message,
          }),
        }
      );
      return response.ok;
    },
  },
  mim_sms: {
    async sendSms(phone: string, message: string, config: any) {
      const response = await fetch(
        `http://api.mimsms.com/smsapi?api_key=${config.api_key}&type=text&contacts=${phone}&senderid=${config.sender_id}&msg=${encodeURIComponent(message)}`
      );
      const data = await response.text();
      return data.includes("success") || data.includes("1");
    },
  },
  greenweb: {
    async sendSms(phone: string, message: string, config: any) {
      const response = await fetch("http://api.greenweb.com.bd/api.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: config.api_key,
          to: phone,
          message: message,
        }),
      });
      const data = await response.text();
      return data.includes("Ok") || data.includes("1");
    },
  },
  custom: {
    async sendSms(phone: string, message: string, config: any) {
      if (!config.api_endpoint) return false;
      const response = await fetch(config.api_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.api_key && { Authorization: `Bearer ${config.api_key}` }),
        },
        body: JSON.stringify({
          phone,
          message,
          sender_id: config.sender_id,
        }),
      });
      return response.ok;
    },
  },
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    const userId = await verifyToken(authHeader);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { customers } = (await req.json()) as { customers: CustomerFollowup[] };
    
    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return new Response(JSON.stringify({ error: "No customers provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get shop settings for SMS config
    const { data: shopSettings } = await supabase
      .from("shop_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get platform SMS settings if shop uses platform SMS
    let smsConfig: {
      provider: string;
      api_key: string;
      sender_id: string;
      api_endpoint?: string;
    } | null = null;

    const usePlatformSms = shopSettings?.use_platform_sms !== false;

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

      const { data: siteSettings } = await supabase
        .from("site_settings")
        .select("platform_sms_provider, platform_sms_api_key, platform_sms_sender_id, platform_sms_enabled")
        .single();

      if (siteSettings?.platform_sms_enabled && siteSettings?.platform_sms_api_key) {
        smsConfig = {
          provider: siteSettings.platform_sms_provider || "ssl_wireless",
          api_key: siteSettings.platform_sms_api_key,
          sender_id: siteSettings.platform_sms_sender_id || "AutoFloy",
        };
      }
    } else if (shopSettings?.sms_api_key) {
      smsConfig = {
        provider: "ssl_wireless",
        api_key: shopSettings.sms_api_key,
        sender_id: shopSettings.sms_sender_id || "ShopSMS",
      };
    }

    if (!smsConfig) {
      return new Response(
        JSON.stringify({
          error: "SMS not configured. Please configure SMS settings in shop settings or enable platform SMS.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results: Array<{ phone: string; success: boolean; message: string }> = [];
    let totalSent = 0;
    let totalFailed = 0;

    // Get the SMS provider
    const provider = SMS_PROVIDERS[smsConfig.provider] || SMS_PROVIDERS.ssl_wireless;

    for (const customer of customers) {
      try {
        // Clean phone number
        let phone = customer.customerPhone.replace(/\s+/g, "").replace(/-/g, "");
        if (phone.startsWith("0")) {
          phone = "+880" + phone.substring(1);
        } else if (!phone.startsWith("+")) {
          phone = "+880" + phone;
        }

        // The message is already formatted from the frontend
        const message = customer.message;

        console.log(`Sending followup SMS to ${phone}`);
        
        const success = await provider.sendSms(phone, message, smsConfig);

        if (success) {
          totalSent++;
          results.push({ phone, success: true, message: "SMS sent successfully" });
        } else {
          totalFailed++;
          results.push({ phone, success: false, message: "Failed to send SMS" });
        }
      } catch (error: any) {
        console.error(`Error sending SMS to ${customer.customerPhone}:`, error);
        totalFailed++;
        results.push({
          phone: customer.customerPhone,
          success: false,
          message: error.message || "Error sending SMS",
        });
      }
    }

    // Log SMS usage if using platform SMS and any were sent successfully
    if (usePlatformSms && totalSent > 0) {
      await logSmsUsage(supabase, userId, totalSent, "followup");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${totalSent} SMS, ${totalFailed} failed`,
        results,
        totalSent,
        totalFailed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-followup-sms:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
