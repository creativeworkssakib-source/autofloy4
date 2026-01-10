import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function verifyAdminToken(authHeader: string | null): Promise<{ userId: string; isAdmin: boolean } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[admin-cms] No valid auth header");
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const jwtSecret = Deno.env.get("JWT_SECRET");

  if (!jwtSecret) {
    console.error("[admin-cms] JWT_SECRET not configured");
    return null;
  }

  try {
    const { verify } = await import("https://deno.land/x/djwt@v3.0.2/mod.ts");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const payload = await verify(token, key);
    const userId = payload.sub as string;
    console.log("[admin-cms] Token verified for user:", userId);

    // Check admin role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const isAdmin = roleData?.role === "admin";
    console.log("[admin-cms] User", userId, "isAdmin:", isAdmin);
    return { userId, isAdmin };
  } catch (e) {
    console.error("[admin-cms] token verification failed:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // Expected: /admin-cms/{resource}/{id?}
  const resource = pathParts[1] || url.searchParams.get("resource");
  const resourceId = pathParts[2] || url.searchParams.get("id");

  console.log(`[admin-cms] ${req.method} resource=${resource} id=${resourceId}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await verifyAdminToken(req.headers.get("Authorization"));

    // For GET requests on public resources, allow unauthenticated access
    const publicResources = ["pricing_plans", "appearance_settings", "seo_settings"];
    const isPublicRead = req.method === "GET" && publicResources.includes(resource || "");

    if (!isPublicRead) {
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
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate resource name
    const validResources = [
      "cms_pages", "blog_posts", "pricing_plans", 
      "appearance_settings", "seo_settings", "email_templates",
      "shop_products", "products"
    ];

    if (!resource || !validResources.includes(resource)) {
      return new Response(JSON.stringify({ error: "Invalid resource" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case "GET": {
        if (resourceId) {
          // Get single item
          const { data, error } = await supabase
            .from(resource)
            .select("*")
            .eq("id", resourceId)
            .maybeSingle();

          if (error) throw error;
          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          // Get list with pagination and search
          const page = parseInt(url.searchParams.get("page") || "1");
          const limit = parseInt(url.searchParams.get("limit") || "50");
          const search = url.searchParams.get("search") || "";
          const offset = (page - 1) * limit;

          let query = supabase.from(resource).select("*", { count: "exact" });

          // Add search for text fields
          if (search) {
            if (resource === "cms_pages" || resource === "blog_posts") {
              query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
            } else if (resource === "pricing_plans") {
              query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
            } else if (resource === "email_templates") {
              query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
            } else if (resource === "shop_products" || resource === "products") {
              query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
            }
          }

          // Add ordering
          if (resource === "pricing_plans") {
            query = query.order("display_order", { ascending: true });
          } else if (resource === "blog_posts") {
            query = query.order("created_at", { ascending: false });
          } else {
            query = query.order("created_at", { ascending: false });
          }

          const { data, error, count } = await query.range(offset, offset + limit - 1);

          if (error) throw error;
          return new Response(JSON.stringify({ 
            data, 
            pagination: { page, limit, total: count || 0 } 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      case "POST": {
        const body = await req.json();
        const { data, error } = await supabase
          .from(resource)
          .insert(body)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "PUT":
      case "PATCH": {
        if (!resourceId) {
          // Singleton update (appearance_settings, seo_settings)
          const singletonId = "00000000-0000-0000-0000-000000000001";
          const body = await req.json();
          const { id: _id, created_at: _createdAt, ...updates } = body;

          const { data, error } = await supabase
            .from(resource)
            .upsert({ id: singletonId, ...updates }, { onConflict: "id" })
            .select()
            .maybeSingle();

          if (error) throw error;
          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body = await req.json();
        const { id: _id, created_at: _createdAt, ...updates } = body;

        const { data, error } = await supabase
          .from(resource)
          .update(updates)
          .eq("id", resourceId)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "DELETE": {
        if (!resourceId) {
          return new Response(JSON.stringify({ error: "ID required for delete" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error } = await supabase
          .from(resource)
          .delete()
          .eq("id", resourceId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e: any) {
    console.error("[admin-cms] error:", e);
    return new Response(JSON.stringify({ error: e.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
