// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Verify admin token and check admin role
async function verifyAdminToken(authHeader: string | null): Promise<{ userId: string; isAdmin: boolean } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[admin-reset-password] Missing Bearer token");
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const jwtSecret = Deno.env.get("JWT_SECRET");

  if (!jwtSecret) {
    console.error("[admin-reset-password] JWT_SECRET not configured");
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

    // Check if user has admin role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleError) {
      console.error("[admin-reset-password] role lookup error:", roleError);
      return null;
    }

    const isAdmin = roleData?.role === "admin";
    console.log(`[admin-reset-password] user ${userId} isAdmin=${isAdmin}`);

    return { userId, isAdmin };
  } catch (e) {
    console.error("[admin-reset-password] token verification failed:", e);
    return null;
  }
}

// Password hashing using PBKDF2 (Web Crypto API - Edge Runtime compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // CRITICAL: Verify admin authorization before any action
    const authResult = await verifyAdminToken(req.headers.get("Authorization"));

    if (!authResult) {
      console.log("[admin-reset-password] Unauthorized - no valid token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!authResult.isAdmin) {
      console.log(`[admin-reset-password] Forbidden - user ${authResult.userId} is not admin`);
      return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, password } = await req.json();

    if (!user_id || !password) {
      return new Response(JSON.stringify({ error: "user_id and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Hash the new password
    const passwordHash = await hashPassword(password);

    // Update user password
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq("id", user_id);

    if (updateError) {
      console.error("[admin-reset-password] Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update password" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[admin-reset-password] Password reset for user ${user_id.substring(0, 8)}... by admin ${authResult.userId.substring(0, 8)}...`);

    return new Response(JSON.stringify({ success: true, message: "Password updated successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[admin-reset-password] Password reset error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
