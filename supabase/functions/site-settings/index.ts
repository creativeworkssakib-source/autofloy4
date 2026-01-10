import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function verifyAdminToken(authHeader: string | null): Promise<{ userId: string; isAdmin: boolean } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[site-settings] Missing Bearer token");
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const jwtSecret = Deno.env.get("JWT_SECRET");

  if (!jwtSecret) {
    console.error("[site-settings] JWT_SECRET not configured");
    return null;
  }

  try {
    const { verify } = await import("https://deno.land/x/djwt@v3.0.2/mod.ts");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );

    const payload = await verify(token, key);
    const userId = payload.sub as string;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleError) {
      console.error("[site-settings] role lookup error:", roleError);
      return null;
    }

    const isAdmin = roleData?.role === "admin";
    console.log(`[site-settings] user ${userId} isAdmin=${isAdmin}`);

    return { userId, isAdmin };
  } catch (e) {
    console.error("[site-settings] token verification failed:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  console.log(`[site-settings] ${req.method} ${url.pathname}${url.search}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await verifyAdminToken(req.headers.get("Authorization"));

    if (!authResult) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!authResult.isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // GET: return current settings (singleton)
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[site-settings] fetch error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch site settings" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ settings: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Write methods: update singleton settings
    if (req.method === "PUT" || req.method === "POST" || req.method === "PATCH") {
      const body = await req.json().catch(() => ({}));
      const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...updates } = body ?? {};
      const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

      const { data, error } = await supabase
        .from("site_settings")
        .upsert({ id: SETTINGS_ID, ...updates }, { onConflict: "id" })
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("[site-settings] update error:", error);
        return new Response(JSON.stringify({ error: "Failed to update site settings" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ settings: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If method is unexpected, return 405 (not 404)
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[site-settings] unhandled error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
