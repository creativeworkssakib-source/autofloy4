import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
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
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getPath(req: Request): string {
  const url = new URL(req.url);
  // Edge function path: /user-settings/ai-config -> extract "ai-config"
  const parts = url.pathname.split("/").filter(Boolean);
  // Remove "functions", "v1", "user-settings" prefix parts
  const fnIndex = parts.indexOf("user-settings");
  if (fnIndex >= 0 && fnIndex + 1 < parts.length) {
    return "/" + parts.slice(fnIndex + 1).join("/");
  }
  return "/";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const userId = await verifyToken(req.headers.get("Authorization"));
  if (!userId) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const path = getPath(req);

  try {
    // ========== /ai-config ==========
    if (path === "/ai-config") {
      if (req.method === "GET") {
        return await handleGetAIConfig(supabase, userId);
      }
      if (req.method === "PUT") {
        const body = await req.json();
        return await handleSaveAIConfig(supabase, userId, body);
      }
    }

    // ========== /validate-code ==========
    if (path === "/validate-code" && req.method === "POST") {
      const body = await req.json();
      return await handleValidateCode(supabase, userId, body.code);
    }

    // ========== /deactivate-admin-ai ==========
    if (path === "/deactivate-admin-ai" && req.method === "POST") {
      return await handleDeactivateAdminAI(supabase, userId);
    }

    // ========== / (base) - General user settings ==========
    if (path === "/") {
      if (req.method === "GET") {
        return await handleGetSettings(supabase, userId);
      }
      if (req.method === "PUT") {
        const body = await req.json();
        return await handleUpdateSettings(supabase, userId, body);
      }
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    console.error(`[user-settings] ${path} error:`, error);
    return json({ error: error instanceof Error ? error.message : "Internal error" }, 500);
  }
});

// =============================================
// AI CONFIG HANDLERS
// =============================================

async function handleGetAIConfig(supabase: any, userId: string) {
  // Get AI provider settings
  const { data: aiSettings } = await supabase
    .from("ai_provider_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // Get usage limits
  const { data: limits } = await supabase
    .from("user_usage_limits")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  console.log(`[AI Config] user=${userId}, ai_active=${aiSettings?.is_active}, use_admin=${aiSettings?.use_admin_ai}, automation_enabled=${limits?.is_automation_enabled}`);

  // Get today's usage
  const today = new Date().toISOString().split("T")[0];
  const { data: usage } = await supabase
    .from("daily_usage_tracker")
    .select("*")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();

  return json({
    ai_settings: aiSettings || {
      provider: "openai",
      api_key_encrypted: "",
      base_url: "",
      model_name: "",
      is_active: false,
      use_admin_ai: false,
      admin_code_id: null,
    },
    limits: limits || {
      daily_message_limit: 50,
      daily_comment_limit: 50,
      monthly_total_limit: 1000,
      is_automation_enabled: false,
    },
    usage: usage || {
      message_count: 0,
      comment_count: 0,
      total_ai_calls: 0,
      is_limit_reached: false,
    },
  });
}

async function handleSaveAIConfig(supabase: any, userId: string, body: any) {
  const { provider, api_key_encrypted, base_url, model_name, is_active, use_admin_ai } = body;

  const upsertData: Record<string, any> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  if (provider !== undefined) upsertData.provider = provider;
  if (api_key_encrypted !== undefined) upsertData.api_key_encrypted = api_key_encrypted;
  if (base_url !== undefined) upsertData.base_url = base_url;
  if (model_name !== undefined) upsertData.model_name = model_name;
  if (is_active !== undefined) upsertData.is_active = Boolean(is_active);
  if (use_admin_ai !== undefined) upsertData.use_admin_ai = Boolean(use_admin_ai);

  // Check if record exists
  const { data: existing } = await supabase
    .from("ai_provider_settings")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("ai_provider_settings")
      .update(upsertData)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw new Error(`Failed to update: ${error.message}`);
    result = data;
  } else {
    // Set defaults for insert
    upsertData.provider = upsertData.provider || "openai";
    upsertData.is_active = upsertData.is_active ?? false;
    upsertData.use_admin_ai = upsertData.use_admin_ai ?? false;

    const { data, error } = await supabase
      .from("ai_provider_settings")
      .insert(upsertData)
      .select()
      .single();
    if (error) throw new Error(`Failed to create: ${error.message}`);
    result = data;
  }

  console.log(`[AI Config] Saved for user ${userId}: provider=${result.provider}, active=${result.is_active}`);
  return json({ success: true, ai_settings: result });
}

async function handleValidateCode(supabase: any, userId: string, code: string) {
  if (!code?.trim()) {
    return json({ valid: false, reason: "No code provided" }, 400);
  }

  // Use the database RPC function
  const { data, error } = await supabase.rpc("validate_activation_code", {
    p_user_id: userId,
    p_code: code.trim(),
  });

  if (error) {
    console.error("[Validate Code] RPC error:", error);
    return json({ valid: false, reason: "Validation error: " + error.message }, 500);
  }

  // data is the jsonb result from the RPC
  const result = data as any;
  console.log(`[Validate Code] User ${userId}, code=${code}: valid=${result?.valid}`);

  return json(result || { valid: false, reason: "Unknown error" });
}

async function handleDeactivateAdminAI(supabase: any, userId: string) {
  const { error } = await supabase
    .from("ai_provider_settings")
    .update({
      use_admin_ai: false,
      admin_code_id: null,
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("[Deactivate Admin AI] Error:", error);
    return json({ success: false, error: error.message }, 500);
  }

  console.log(`[Deactivate Admin AI] User ${userId} deactivated admin AI`);
  return json({ success: true });
}

// =============================================
// GENERAL SETTINGS HANDLERS
// =============================================

const VALID_TONES = ["friendly", "professional", "casual"];
const VALID_LANGUAGES = ["bengali", "english", "mixed"];

async function handleGetSettings(supabase: any, userId: string) {
  let { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!settings) {
    const { data: newSettings, error } = await supabase
      .from("user_settings")
      .insert({
        user_id: userId,
        default_tone: "friendly",
        response_language: "bengali",
        email_notifications: true,
        push_notifications: true,
        sound_alerts: false,
        daily_digest: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create default settings:", error);
      return json({ error: "Failed to create settings" }, 500);
    }
    settings = newSettings;
  }

  return json({ settings });
}

async function handleUpdateSettings(supabase: any, userId: string, body: any) {
  const { default_tone, response_language, email_notifications, push_notifications, sound_alerts, daily_digest } = body;
  const updateData: Record<string, any> = {};

  if (default_tone !== undefined) {
    if (!VALID_TONES.includes(default_tone)) return json({ error: "Invalid tone" }, 400);
    updateData.default_tone = default_tone;
  }
  if (response_language !== undefined) {
    if (!VALID_LANGUAGES.includes(response_language)) return json({ error: "Invalid language" }, 400);
    updateData.response_language = response_language;
  }
  if (email_notifications !== undefined) updateData.email_notifications = Boolean(email_notifications);
  if (push_notifications !== undefined) updateData.push_notifications = Boolean(push_notifications);
  if (sound_alerts !== undefined) updateData.sound_alerts = Boolean(sound_alerts);
  if (daily_digest !== undefined) updateData.daily_digest = Boolean(daily_digest);

  if (Object.keys(updateData).length === 0) return json({ error: "No fields to update" }, 400);

  const { data: existing } = await supabase
    .from("user_settings")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  let settings;
  if (!existing) {
    const { data, error } = await supabase
      .from("user_settings")
      .insert({ user_id: userId, ...updateData })
      .select()
      .single();
    if (error) return json({ error: "Failed to save" }, 500);
    settings = data;
  } else {
    const { data, error } = await supabase
      .from("user_settings")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) return json({ error: "Failed to update" }, 500);
    settings = data;
  }

  // Sync tone/language to page_memory
  if (updateData.default_tone || updateData.response_language) {
    const pmUpdate: Record<string, any> = {};
    if (updateData.default_tone) pmUpdate.preferred_tone = updateData.default_tone;
    if (updateData.response_language) pmUpdate.detected_language = updateData.response_language;

    await supabase.from("page_memory").update(pmUpdate).eq("user_id", userId);
  }

  return json({ settings });
}
