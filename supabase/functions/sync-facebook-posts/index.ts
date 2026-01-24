import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;

const GRAPH_API_URL = "https://graph.facebook.com/v18.0";

// Base64 decode helper
function base64Decode(str: string): ArrayBuffer {
  const binaryStr = atob(str);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes.buffer;
}

// Decrypt access token (v2 format: v2:salt:iv:data)
async function decryptToken(encryptedData: string): Promise<string> {
  try {
    if (!encryptedData.startsWith("v2:")) {
      throw new Error("Invalid encryption format - expected v2");
    }
    
    const parts = encryptedData.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid encryption format - expected 4 parts");
    }
    
    const [, saltBase64, ivBase64, dataBase64] = parts;
    
    const salt = new Uint8Array(base64Decode(saltBase64));
    const iv = new Uint8Array(base64Decode(ivBase64));
    const encryptedBytes = new Uint8Array(base64Decode(dataBase64));
    
    const encoder = new TextEncoder();
    
    // Import key for PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(encryptionKey),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    // Derive key using PBKDF2 (same params as encryption)
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
    
    // Decrypt with AES-GCM
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encryptedBytes.buffer
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("[Decrypt] Failed to decrypt token:", error);
    throw error;
  }
}

// Fetch posts from Facebook
async function fetchFacebookPosts(pageAccessToken: string, pageId: string, limit: number = 50) {
  try {
    const fields = "id,message,full_picture,created_time,attachments{type,media_type,url,title,description}";
    const response = await fetch(
      `${GRAPH_API_URL}/${pageId}/posts?fields=${fields}&limit=${limit}&access_token=${pageAccessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[Facebook] Failed to fetch posts:", error);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("[Facebook] Error fetching posts:", error);
    return [];
  }
}

// Try to detect product name from post text
function detectProductName(postText: string): string | null {
  if (!postText) return null;
  
  // Common patterns for product posts
  // Pattern 1: Product name at the start
  // Pattern 2: "Product Name - Price" format
  // Pattern 3: Looking for quoted product names
  
  const lines = postText.split("\n").filter(l => l.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // If first line is short and doesn't look like a sentence, it might be a product name
    if (firstLine.length < 50 && !firstLine.includes("।") && !firstLine.endsWith("?")) {
      return firstLine;
    }
  }
  
  // Look for price patterns and extract preceding text
  const priceMatch = postText.match(/(.{5,40}?)[\s-–]+(?:৳|TK|BDT|টাকা)\s*[\d,]+/i);
  if (priceMatch) {
    return priceMatch[1].trim();
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { pageId, accountId, userId } = await req.json();

    if (!pageId || !userId) {
      return new Response(JSON.stringify({ error: "Missing pageId or userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Sync Posts] Starting sync for page ${pageId}`);

    // Get the connected account
    const { data: account, error: accountError } = await supabase
      .from("connected_accounts")
      .select("id, access_token_encrypted, encryption_version")
      .eq("external_id", pageId)
      .eq("platform", "facebook")
      .eq("is_connected", true)
      .single();

    if (accountError || !account) {
      return new Response(JSON.stringify({ error: "Account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decrypt access token
    let pageAccessToken: string | null = null;
    if (account.access_token_encrypted && account.encryption_version === 2) {
      try {
        pageAccessToken = await decryptToken(account.access_token_encrypted);
      } catch (e) {
        console.error("[Sync Posts] Failed to decrypt token:", e);
        return new Response(JSON.stringify({ error: "Failed to decrypt token" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!pageAccessToken) {
      return new Response(JSON.stringify({ error: "No valid access token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch posts from Facebook
    const posts = await fetchFacebookPosts(pageAccessToken, pageId);
    console.log(`[Sync Posts] Fetched ${posts.length} posts from Facebook`);

    // Get user's products for matching
    const { data: products } = await supabase
      .from("products")
      .select("id, name")
      .eq("user_id", userId)
      .eq("is_active", true);

    const productMap = new Map<string, string>();
    if (products) {
      for (const p of products) {
        productMap.set(p.name.toLowerCase(), p.id);
      }
    }

    // Process and save posts
    let syncedCount = 0;
    let matchedCount = 0;

    for (const post of posts) {
      const postId = post.id.split("_")[1] || post.id; // Facebook post IDs are in format pageId_postId
      
      // Determine media type
      let mediaType = "status";
      let mediaUrl = post.full_picture || null;
      
      if (post.attachments?.data?.[0]) {
        const attachment = post.attachments.data[0];
        mediaType = attachment.media_type || attachment.type || "status";
        mediaUrl = attachment.url || mediaUrl;
      }

      // Try to detect product name
      const detectedProductName = detectProductName(post.message);
      
      // Try to match with existing product
      let linkedProductId: string | null = null;
      if (detectedProductName) {
        // Try exact match
        const exactMatch = productMap.get(detectedProductName.toLowerCase());
        if (exactMatch) {
          linkedProductId = exactMatch;
          matchedCount++;
        } else {
          // Try partial match
          for (const [name, id] of productMap.entries()) {
            if (detectedProductName.toLowerCase().includes(name) || 
                name.includes(detectedProductName.toLowerCase())) {
              linkedProductId = id;
              matchedCount++;
              break;
            }
          }
        }
      }

      // Upsert the post
      const { error: upsertError } = await supabase
        .from("facebook_posts")
        .upsert({
          user_id: userId,
          page_id: pageId,
          post_id: postId,
          post_text: post.message,
          media_type: mediaType,
          media_url: mediaUrl,
          thumbnail_url: post.full_picture,
          linked_product_id: linkedProductId,
          product_detected_name: detectedProductName,
          is_synced: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "page_id,post_id",
        });

      if (!upsertError) {
        syncedCount++;
      } else {
        console.error(`[Sync Posts] Failed to upsert post ${postId}:`, upsertError);
      }
    }

    console.log(`[Sync Posts] Synced ${syncedCount} posts, matched ${matchedCount} with products`);

    return new Response(JSON.stringify({
      success: true,
      synced: syncedCount,
      matched: matchedCount,
      total: posts.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Sync Posts] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
