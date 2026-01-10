import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

// Validate allowed tones
const VALID_TONES = ["friendly", "professional", "casual"];
const VALID_LANGUAGES = ["bengali", "english", "mixed"];

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
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
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

  // GET - Fetch user settings
  if (req.method === "GET") {
    try {
      // Try to get existing settings
      let { data: settings, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // If no settings exist, create default settings
      if (!settings) {
        const { data: newSettings, error: insertError } = await supabase
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

        if (insertError) {
          console.error("Failed to create default settings:", insertError);
          return new Response(JSON.stringify({ error: "Failed to create settings" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        settings = newSettings;
        console.log(`Created default settings for user ${userId}`);
      }

      return new Response(JSON.stringify({ settings }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("GET settings error:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch settings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // PUT - Update user settings
  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const {
        default_tone,
        response_language,
        email_notifications,
        push_notifications,
        sound_alerts,
        daily_digest,
      } = body;

      // Validate input
      const updateData: Record<string, any> = {};

      if (default_tone !== undefined) {
        if (!VALID_TONES.includes(default_tone)) {
          return new Response(JSON.stringify({ error: "Invalid tone value" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        updateData.default_tone = default_tone;
      }

      if (response_language !== undefined) {
        if (!VALID_LANGUAGES.includes(response_language)) {
          return new Response(JSON.stringify({ error: "Invalid language value" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        updateData.response_language = response_language;
      }

      if (email_notifications !== undefined) {
        updateData.email_notifications = Boolean(email_notifications);
      }

      if (push_notifications !== undefined) {
        updateData.push_notifications = Boolean(push_notifications);
      }

      if (sound_alerts !== undefined) {
        updateData.sound_alerts = Boolean(sound_alerts);
      }

      if (daily_digest !== undefined) {
        updateData.daily_digest = Boolean(daily_digest);
      }

      if (Object.keys(updateData).length === 0) {
        return new Response(JSON.stringify({ error: "No fields to update" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // First check if settings exist, if not create them
      const { data: existingSettings } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      let settings;

      if (!existingSettings) {
        // Create new settings with provided values
        const { data: newSettings, error: insertError } = await supabase
          .from("user_settings")
          .insert({
            user_id: userId,
            default_tone: updateData.default_tone || "friendly",
            response_language: updateData.response_language || "bengali",
            email_notifications: updateData.email_notifications ?? true,
            push_notifications: updateData.push_notifications ?? true,
            sound_alerts: updateData.sound_alerts ?? false,
            daily_digest: updateData.daily_digest ?? true,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Failed to create settings:", insertError);
          return new Response(JSON.stringify({ error: "Failed to save settings" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        settings = newSettings;
      } else {
        // Update existing settings
        const { data: updatedSettings, error: updateError } = await supabase
          .from("user_settings")
          .update(updateData)
          .eq("user_id", userId)
          .select()
          .single();

        if (updateError) {
          console.error("Failed to update settings:", updateError);
          return new Response(JSON.stringify({ error: "Failed to update settings" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        settings = updatedSettings;
      }

      console.log(`Updated settings for user ${userId}:`, updateData);

      // Sync default_tone and response_language to all page_memory records for this user
      // This ensures AI automation uses the user's preferred settings
      if (updateData.default_tone || updateData.response_language) {
        const pageMemoryUpdate: Record<string, any> = {};
        if (updateData.default_tone) {
          pageMemoryUpdate.preferred_tone = updateData.default_tone;
        }
        if (updateData.response_language) {
          pageMemoryUpdate.detected_language = updateData.response_language;
        }

        const { error: syncError, count } = await supabase
          .from("page_memory")
          .update(pageMemoryUpdate)
          .eq("user_id", userId);

        if (syncError) {
          console.warn(`Failed to sync settings to page_memory:`, syncError);
        } else {
          console.log(`Synced tone/language settings to ${count || 'all'} page_memory records for user ${userId}`);
        }
      }

      // Fetch user data for webhook
      const { data: userData } = await supabase
        .from("users")
        .select("id, email, display_name")
        .eq("id", userId)
        .single();

      // Fetch connected pages for context
      const { data: connectedPages } = await supabase
        .from("connected_accounts")
        .select("id, name, external_id, platform")
        .eq("user_id", userId)
        .eq("is_connected", true);

      // Send settings update to n8n webhook for AI automation sync
      // This webhook allows n8n to update its internal settings for this user
      const n8nWebhookUrl = Deno.env.get("N8N_SETTINGS_WEBHOOK_URL");
      if (n8nWebhookUrl) {
        try {
          const webhookPayload = {
            event_type: "user_settings_updated",
            user_id: userId,
            user_email: userData?.email,
            user_name: userData?.display_name,
            settings: {
              default_tone: settings.default_tone,
              response_language: settings.response_language,
              email_notifications: settings.email_notifications,
              push_notifications: settings.push_notifications,
              sound_alerts: settings.sound_alerts,
              daily_digest: settings.daily_digest,
            },
            updated_fields: Object.keys(updateData),
            connected_pages: connectedPages?.map(p => ({
              id: p.id,
              name: p.name,
              external_id: p.external_id,
              platform: p.platform,
            })) || [],
            timestamp: new Date().toISOString(),
          };

          const webhookResponse = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload),
          });

          if (webhookResponse.ok) {
            console.log(`Successfully synced settings to n8n for user ${userId}`);
          } else {
            console.warn(`n8n webhook returned ${webhookResponse.status}:`, await webhookResponse.text());
          }
        } catch (webhookError) {
          console.warn("Failed to sync to n8n webhook:", webhookError);
          // Don't fail the request if webhook fails - settings are still saved
        }
      }

      return new Response(JSON.stringify({ settings }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("PUT settings error:", error);
      return new Response(JSON.stringify({ error: "Failed to update settings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
