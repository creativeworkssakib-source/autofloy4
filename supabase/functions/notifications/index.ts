import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, pragma",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

// Retry helper for transient network errors
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 100): Promise<T> {
  let lastError: unknown = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`Retry attempt ${i + 1}/${maxRetries} after error:`, errorMessage);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  throw lastError;
}

// JWT token verification using custom JWT_SECRET (manual HMAC verification)
async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    // Decode payload
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(payloadBase64));
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.log("Token expired");
      return null;
    }
    
    // Verify signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const signatureInput = encoder.encode(parts[0] + "." + parts[1]);
    const signatureBase64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (signatureBase64.length % 4)) % 4;
    const signatureBytes = Uint8Array.from(atob(signatureBase64 + "=".repeat(padding)), c => c.charCodeAt(0));
    
    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, signatureInput);
    return valid ? (payload.sub as string) : null;
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

  // GET - Fetch notifications with retry
  if (req.method === "GET") {
    try {
      let notifications: unknown[] = [];
      let fetchError: unknown = null;
      
      // Retry logic with better error handling for transient network issues
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data, error } = await supabase
            .from("notifications")
            .select("id, title, body, is_read, created_at, notification_type, metadata")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50);
          
          if (error) {
            fetchError = error;
            console.log(`Attempt ${attempt + 1}/3 failed:`, error.message || error);
            if (attempt < 2) {
              await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
              continue;
            }
          } else {
            notifications = data || [];
            fetchError = null;
            break;
          }
        } catch (e) {
          fetchError = e;
          console.log(`Attempt ${attempt + 1}/3 threw error:`, e instanceof Error ? e.message : String(e));
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
          }
        }
      }

      if (fetchError) {
        console.error("Fetch notifications error after retries:", fetchError);
        // Return empty array instead of error for transient issues
        return new Response(JSON.stringify({ notifications: [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ notifications }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("GET notifications error:", error);
      // Graceful fallback - return empty notifications instead of 500
      return new Response(JSON.stringify({ notifications: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // DELETE - Delete a notification
  if (req.method === "DELETE") {
    try {
      const { notification_id } = await req.json();

      if (!notification_id) {
        return new Response(JSON.stringify({ error: "notification_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notification_id)
        .eq("user_id", userId);

      if (error) {
        console.error("Delete notification error:", error);
        return new Response(JSON.stringify({ error: "Failed to delete notification" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "Notification deleted" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("DELETE notification error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // POST - Mark notifications as read
  if (req.method === "POST") {
    try {
      const { notification_id, markAll } = await req.json();

      if (markAll) {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", userId);

        if (error) {
          console.error("Mark all read error:", error);
          return new Response(JSON.stringify({ error: "Failed to mark notifications as read" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ message: "All notifications marked as read" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (notification_id) {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", notification_id)
          .eq("user_id", userId);

        if (error) {
          console.error("Mark read error:", error);
          return new Response(JSON.stringify({ error: "Failed to mark notification as read" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ message: "Notification marked as read" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "notification_id or markAll is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("POST notifications error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
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
