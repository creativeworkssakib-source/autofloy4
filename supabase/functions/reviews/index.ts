import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  } catch {
    return null;
  }
}

function isUserActive(user: any): boolean {
  if (user.subscription_plan !== "none") {
    return true;
  }
  if (user.is_trial_active && user.trial_end_date) {
    const trialEnd = new Date(user.trial_end_date);
    return trialEnd > new Date();
  }
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // GET - Public endpoint to fetch reviews
  if (req.method === "GET") {
    try {
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Fetch reviews error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch reviews" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ reviews }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("GET reviews error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // POST - Auth required to create review or like
  if (req.method === "POST") {
    try {
      const userId = await verifyToken(req.headers.get("Authorization"));
      if (!userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      
      // Handle like action
      if (body.action === "like") {
        const { reviewId, unlike } = body;
        
        if (!reviewId) {
          return new Response(JSON.stringify({ error: "Review ID is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get current review
        const { data: review, error: fetchError } = await supabase
          .from("reviews")
          .select("likes_count")
          .eq("id", reviewId)
          .single();

        if (fetchError || !review) {
          return new Response(JSON.stringify({ error: "Review not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const newCount = unlike 
          ? Math.max(0, (review.likes_count || 0) - 1)
          : (review.likes_count || 0) + 1;

        const { error: updateError } = await supabase
          .from("reviews")
          .update({ likes_count: newCount })
          .eq("id", reviewId);

        if (updateError) {
          console.error("Like update error:", updateError);
          return new Response(JSON.stringify({ error: "Failed to update like" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, likes_count: newCount }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle create review
      const { rating, comment } = body;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return new Response(JSON.stringify({ error: "Rating must be between 1 and 5" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!comment || comment.trim().length === 0) {
        return new Response(JSON.stringify({ error: "Comment is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get user info
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Determine if user is verified
      const isVerified = isUserActive(user);

      // Insert review
      const { data: newReview, error: insertError } = await supabase
        .from("reviews")
        .insert({
          user_id: userId,
          name: user.display_name || user.email,
          rating,
          comment: comment.trim(),
          is_verified: isVerified,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert review error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to create review" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Review created:", newReview.id);

      return new Response(JSON.stringify({ review: newReview }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("POST reviews error:", error);
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
