import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

  // GET /me - Get current user
  if (req.method === "GET") {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("id, display_name, email, phone, subscription_plan, trial_end_date, is_trial_active, subscription_started_at, subscription_ends_at, email_verified, phone_verified, avatar_url, created_at")
        .eq("id", userId)
        .single();

      if (error || !user) {
        console.error("User fetch error:", error);
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("GET /me error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // DELETE /me - Delete user account
  if (req.method === "DELETE") {
    try {
      console.log(`Deleting user account: ${userId}`);

      // Delete related data in order (respecting foreign keys)
      const tablesToClean = [
        "execution_logs",
        "automations",
        "connected_accounts",
        "notifications",
        "orders",
        "products",
        "subscriptions",
        "verification_otps",
        "user_roles",
      ];

      for (const table of tablesToClean) {
        const { error } = await supabase.from(table).delete().eq("user_id", userId);
        if (error) {
          console.warn(`Failed to delete from ${table}:`, error.message);
        }
      }

      // Finally delete the user
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (deleteError) {
        console.error("Failed to delete user:", deleteError);
        return new Response(JSON.stringify({ error: "Failed to delete account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`User ${userId} deleted successfully`);
      return new Response(JSON.stringify({ message: "Account deleted successfully" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("DELETE /me error:", error);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // PUT /me - Update user profile
  if (req.method === "PUT") {
    try {
      const body = await req.json();
      const { display_name, phone } = body;

      const updateData: Record<string, any> = {};
      if (display_name !== undefined) updateData.display_name = display_name;
      if (phone !== undefined) updateData.phone = phone;

      if (Object.keys(updateData).length === 0) {
        return new Response(JSON.stringify({ error: "No fields to update" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: user, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select("id, display_name, email, phone, subscription_plan, trial_end_date, is_trial_active, subscription_started_at, subscription_ends_at, email_verified, phone_verified, avatar_url, created_at")
        .single();

      if (error) {
        console.error("Update error:", error);
        return new Response(JSON.stringify({ error: "Failed to update profile" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("PUT /me error:", error);
      return new Response(JSON.stringify({ error: "Failed to update profile" }), {
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
