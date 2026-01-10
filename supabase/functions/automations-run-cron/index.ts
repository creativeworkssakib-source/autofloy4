import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-key",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cronSecret = Deno.env.get("CRON_SECRET");
const n8nBaseUrl = Deno.env.get("N8N_BASE_URL");
const n8nWebhookPath = Deno.env.get("N8N_WEBHOOK_PATH");
const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");

// AES-GCM decryption (v2)
async function decryptV2(ciphertext: string): Promise<string> {
  if (!encryptionKey) return ciphertext;
  
  const encoder = new TextEncoder();
  const parts = ciphertext.split(":");
  if (parts.length !== 4) return ciphertext;
  
  const [, saltBase64, ivBase64, dataBase64] = parts;
  
  const salt = new Uint8Array(base64Decode(saltBase64));
  const iv = new Uint8Array(base64Decode(ivBase64));
  const encryptedData = new Uint8Array(base64Decode(dataBase64));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(encryptionKey),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encryptedData.buffer
  );
  
  return new TextDecoder().decode(decrypted);
}

// Legacy XOR decryption (v1) - for backwards compatibility
function decryptV1(ciphertext: string): string {
  if (!encryptionKey) return ciphertext;
  
  const parts = ciphertext.split(":");
  if (parts.length !== 3) return ciphertext;
  
  const [, ivBase64, dataBase64] = parts;
  
  function deriveKey(key: string, salt: string): Uint8Array {
    const combined = key + salt;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const derived = new Uint8Array(32);
    for (let i = 0; i < data.length; i++) {
      derived[i % 32] ^= data[i];
    }
    return derived;
  }
  
  const derivedKey = deriveKey(encryptionKey, ivBase64);
  const encrypted = new Uint8Array(base64Decode(dataBase64));
  
  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ derivedKey[i % derivedKey.length];
  }
  
  return new TextDecoder().decode(decrypted);
}

// Unified token decryption - handles both v1 and v2
async function decryptToken(ciphertext: string): Promise<string> {
  if (!ciphertext || !encryptionKey) return ciphertext;
  
  if (ciphertext.startsWith("v2:")) {
    return await decryptV2(ciphertext);
  }
  
  if (ciphertext.startsWith("v1:")) {
    return decryptV1(ciphertext);
  }
  
  return ciphertext; // Return as-is if not encrypted
}

// STRICT check: User must have active paid subscription OR valid 24-hour trial
function isUserActive(user: any): { active: boolean; reason: string } {
  const now = new Date();
  
  // Check for active paid subscription
  const paidPlans = ["starter", "professional", "business", "lifetime"];
  if (paidPlans.includes(user.subscription_plan)) {
    // Lifetime is always active
    if (user.subscription_plan === "lifetime") {
      return { active: true, reason: "Lifetime subscription" };
    }
    // Check subscription end date for other paid plans
    if (user.subscription_ends_at) {
      const subscriptionEnd = new Date(user.subscription_ends_at);
      if (subscriptionEnd > now) {
        return { active: true, reason: "Active paid subscription" };
      }
    }
  }

  // Check for active 24-hour trial (based on database timestamp)
  if (user.subscription_plan === "trial" && user.is_trial_active && user.trial_end_date) {
    const trialEnd = new Date(user.trial_end_date);
    if (trialEnd > now) {
      return { active: true, reason: "Active trial" };
    }
    return { active: false, reason: "24-hour trial expired" };
  }

  return { active: false, reason: "No active subscription or trial" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: CRON_SECRET is required - fail if not configured
    if (!cronSecret) {
      console.error("CRITICAL: CRON_SECRET environment variable not configured");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration - cron secret not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify cron secret
    const cronKey = req.headers.get("x-cron-key");
    if (cronKey !== cronSecret) {
      console.warn("Unauthorized cron access attempt");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch enabled automations with user and connected account info
    const { data: automations, error: fetchError } = await supabase
      .from("automations")
      .select(`
        *,
        users!automations_user_id_fkey(*),
        connected_accounts!automations_account_id_fkey(*)
      `)
      .eq("is_enabled", true);

    if (fetchError) {
      console.error("Fetch automations error:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch automations" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let triggered = 0;
    let skipped = 0;
    let trialExpired = 0;
    const results: any[] = [];

    for (const automation of automations || []) {
      const user = automation.users;
      const account = automation.connected_accounts;

      // STRICT ACCESS CHECK: Verify user has valid subscription or trial
      if (!user) {
        skipped++;
        results.push({
          automation_id: automation.id,
          status: "skipped",
          reason: "User not found",
        });
        continue;
      }

      const userStatus = isUserActive(user);
      if (!userStatus.active) {
        trialExpired++;
        console.log(`[BLOCKED] Automation ${automation.id} blocked - ${userStatus.reason} for user ${automation.user_id}`);
        results.push({
          automation_id: automation.id,
          status: "blocked",
          reason: userStatus.reason,
        });
        continue;
      }

      // Check if account is connected
      if (!account || !account.is_connected) {
        skipped++;
        results.push({
          automation_id: automation.id,
          status: "skipped",
          reason: "Account not connected",
        });
        continue;
      }

      // If n8n is configured, trigger the webhook
      if (n8nBaseUrl && n8nWebhookPath) {
        try {
          const webhookUrl = `${n8nBaseUrl}${n8nWebhookPath}`;
          
          // Decrypt the token (supports both v1 and v2)
          const accessToken = account.access_token_encrypted 
            ? await decryptToken(account.access_token_encrypted)
            : account.access_token;
          
          const payload = {
            user_id: automation.user_id,
            account_id: automation.account_id,
            page_id: account.external_id,
            facebook_page_token: accessToken,
            automation_type: automation.type,
            config: automation.config,
          };

          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            triggered++;
            results.push({
              automation_id: automation.id,
              status: "triggered",
            });
          } else {
            skipped++;
            results.push({
              automation_id: automation.id,
              status: "failed",
              reason: `Webhook returned ${response.status}`,
            });
          }
        } catch (webhookError: unknown) {
          skipped++;
          results.push({
            automation_id: automation.id,
            status: "failed",
            reason: webhookError instanceof Error ? webhookError.message : "Unknown error",
          });
        }
      } else {
        // n8n not configured, just log
        console.log(`[CRON] Would trigger automation ${automation.id} for user ${automation.user_id}`);
        triggered++;
        results.push({
          automation_id: automation.id,
          status: "logged",
          note: "n8n not configured",
        });
      }
    }

    console.log(`Cron run complete: ${triggered} triggered, ${skipped} skipped, ${trialExpired} blocked (trial expired)`);

    return new Response(JSON.stringify({
      summary: { triggered, skipped, trialExpired, total: automations?.length || 0 },
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Cron run error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
