import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create client with user's auth header for getUser
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  
  if (userError || !user) {
    console.error("Auth error:", userError);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = user.id;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // GET - Fetch notifications
  if (req.method === "GET") {
    try {
      const { data: notifications, error } = await supabase
        .from("notifications")
        .select("id, title, body, is_read, created_at, notification_type, metadata")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Fetch notifications error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch notifications" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ notifications }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("GET notifications error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
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
