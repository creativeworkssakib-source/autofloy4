import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Webhook verification token - must match what's in Facebook Developer Console
const VERIFY_TOKEN = "autofloy_fb_verify_2024";

// Create Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;

// Facebook Graph API
const GRAPH_API_URL = "https://graph.facebook.com/v18.0";

// Decrypt access token (v2 format: PBKDF2 + AES-GCM)
async function decryptToken(encryptedData: string): Promise<string> {
  try {
    // Check for v2 format
    if (encryptedData.startsWith("v2:")) {
      const parts = encryptedData.substring(3).split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid v2 token structure");
      }
      
      const [saltB64, ivB64, encryptedB64] = parts;
      
      const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
      const encrypted = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
      
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(encryptionKey),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );
      
      const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );
      
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    }
    
    // Legacy v1 format fallback
    const [ivHex, encryptedHex] = encryptedData.split(":");
    const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const encrypted = new Uint8Array(encryptedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(encryptionKey.padEnd(32, "0").slice(0, 32));
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("[Decrypt] Failed to decrypt token:", error);
    throw error;
  }
}

// Send message via Facebook API - returns error details if failed
async function sendFacebookMessage(pageAccessToken: string, recipientId: string, message: string): Promise<{ success: boolean; error?: any; errorCode?: number }> {
  try {
    const response = await fetch(`${GRAPH_API_URL}/me/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: pageAccessToken,
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: "RESPONSE",
      }),
    });

    const result = await response.json();
    if (result.error) {
      console.error("[Facebook] Send message error:", result.error);
      return { 
        success: false, 
        error: result.error, 
        errorCode: result.error.code 
      };
    }
    console.log("[Facebook] Message sent successfully to:", recipientId);
    return { success: true };
  } catch (error) {
    console.error("[Facebook] Failed to send message:", error);
    return { success: false, error };
  }
}

// Reply to a comment - returns the reply comment ID for later editing
async function replyToComment(pageAccessToken: string, commentId: string, message: string): Promise<{ success: boolean; replyId?: string }> {
  try {
    const response = await fetch(`${GRAPH_API_URL}/${commentId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: pageAccessToken,
        message,
      }),
    });

    const result = await response.json();
    if (result.error) {
      console.error("[Facebook] Reply to comment error:", result.error);
      return { success: false };
    }
    console.log("[Facebook] Comment reply sent successfully, ID:", result.id);
    return { success: true, replyId: result.id };
  } catch (error) {
    console.error("[Facebook] Failed to reply to comment:", error);
    return { success: false };
  }
}

// Edit/Update an existing comment (for smart fallback)
async function editComment(pageAccessToken: string, commentId: string, newMessage: string): Promise<boolean> {
  try {
    const response = await fetch(`${GRAPH_API_URL}/${commentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: pageAccessToken,
        message: newMessage,
      }),
    });

    const result = await response.json();
    if (result.error) {
      console.error("[Facebook] Edit comment error:", result.error);
      return false;
    }
    console.log("[Facebook] Comment edited successfully");
    return true;
  } catch (error) {
    console.error("[Facebook] Failed to edit comment:", error);
    return false;
  }
}

// React to a comment or post
async function addReaction(pageAccessToken: string, objectId: string, reactionType: string = "LIKE") {
  try {
    const response = await fetch(`${GRAPH_API_URL}/${objectId}/reactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: pageAccessToken,
        type: reactionType, // LIKE, LOVE, HAHA, WOW, SAD, ANGRY
      }),
    });

    const result = await response.json();
    if (result.error) {
      console.error("[Facebook] Add reaction error:", result.error);
      return false;
    }
    console.log(`[Facebook] Reaction ${reactionType} added successfully`);
    return true;
  } catch (error) {
    console.error("[Facebook] Failed to add reaction:", error);
    return false;
  }
}

// Get user profile
async function getUserProfile(pageAccessToken: string, userId: string): Promise<{ name?: string; profile_pic?: string } | null> {
  try {
    const response = await fetch(`${GRAPH_API_URL}/${userId}?fields=name,profile_pic&access_token=${pageAccessToken}`);
    const result = await response.json();
    if (result.error) {
      console.error("[Facebook] Get profile error:", result.error);
      return null;
    }
    return result;
  } catch (error) {
    console.error("[Facebook] Failed to get profile:", error);
    return null;
  }
}

// *** IMPROVED: Fetch post content using multiple strategies ***
async function fetchPostContent(pageAccessToken: string, postId: string): Promise<{ text: string; mediaType?: string } | null> {
  try {
    console.log(`[Facebook] Fetching post content for: ${postId}`);
    
    // Strategy 1: Try to get post directly with minimal fields (works with pages_manage_posts)
    const simpleFieldOptions = [
      "message",                        // Most basic - just message
      "message,type",                   // With type
      "message,story",                  // With story
    ];
    
    for (const fields of simpleFieldOptions) {
      try {
        const response = await fetch(
          `${GRAPH_API_URL}/${postId}?fields=${fields}&access_token=${pageAccessToken}`
        );
        const result = await response.json();
        
        if (!result.error) {
          const text = result.message || result.story || "";
          const mediaType = result.type || "unknown";
          
          if (text) {
            console.log(`[Facebook] ✅ Post content fetched with fields [${fields}]: "${text.substring(0, 100)}..."`);
            return { text, mediaType };
          }
        } else {
          console.log(`[Facebook] Fields [${fields}] failed: code=${result.error.code}`);
        }
      } catch (innerError) {
        console.log(`[Facebook] Error with fields [${fields}]:`, innerError);
      }
    }
    
    // Strategy 2: Try to get post via attachment/permalinks approach
    try {
      const attachmentResponse = await fetch(
        `${GRAPH_API_URL}/${postId}?fields=attachments{description,title,type}&access_token=${pageAccessToken}`
      );
      const attachmentResult = await attachmentResponse.json();
      
      if (!attachmentResult.error && attachmentResult.attachments?.data?.[0]) {
        const attachment = attachmentResult.attachments.data[0];
        const text = attachment.description || attachment.title || "";
        if (text) {
          console.log(`[Facebook] ✅ Post content from attachments: "${text.substring(0, 100)}..."`);
          return { text, mediaType: attachment.type || "unknown" };
        }
      }
    } catch (attachError) {
      console.log("[Facebook] Attachment strategy failed:", attachError);
    }
    
    // Strategy 3: Try to get page's recent posts and match
    try {
      // Extract page ID from post ID (format: pageId_postId)
      const parts = postId.split("_");
      if (parts.length === 2) {
        const extractedPageId = parts[0];
        const feedResponse = await fetch(
          `${GRAPH_API_URL}/${extractedPageId}/feed?fields=id,message&limit=10&access_token=${pageAccessToken}`
        );
        const feedResult = await feedResponse.json();
        
        if (!feedResult.error && feedResult.data) {
          const matchingPost = feedResult.data.find((p: any) => p.id === postId);
          if (matchingPost?.message) {
            console.log(`[Facebook] ✅ Post content from feed: "${matchingPost.message.substring(0, 100)}..."`);
            return { text: matchingPost.message, mediaType: "post" };
          }
        }
      }
    } catch (feedError) {
      console.log("[Facebook] Feed strategy failed:", feedError);
    }
    
    console.log("[Facebook] ⚠️ Could not fetch post content with any strategy, proceeding without it");
    return null;
  } catch (error) {
    console.error("[Facebook] Failed to fetch post:", error);
    return null;
  }
}

// *** NEW: Check if a comment is a reply to page's own comment ***
async function checkIfReplyToPageComment(
  pageAccessToken: string, 
  parentCommentId: string, 
  pageId: string
): Promise<boolean> {
  try {
    // Fetch the parent comment to check its author
    const response = await fetch(
      `${GRAPH_API_URL}/${parentCommentId}?fields=from&access_token=${pageAccessToken}`
    );
    const result = await response.json();
    
    if (result.error) {
      console.log("[Facebook] Could not fetch parent comment:", result.error);
      return false;
    }
    
    // Check if the parent comment was made by the page
    const isFromPage = result.from?.id === pageId;
    console.log(`[Facebook] Parent comment author: ${result.from?.id}, Page ID: ${pageId}, IsFromPage: ${isFromPage}`);
    
    return isFromPage;
  } catch (error) {
    console.error("[Facebook] Error checking parent comment:", error);
    return false;
  }
}

// Call AI Agent with auto post analysis
async function callAIAgent(supabase: any, data: {
  pageId: string;
  senderId: string;
  senderName?: string;
  messageText: string;
  messageType: string;
  attachments?: any[];
  isComment: boolean;
  commentId?: string;
  postId?: string;
  postContent?: string;
  postMediaType?: string;
  parentCommentId?: string;       // *** NEW: Parent comment ID ***
  isReplyToPageComment?: boolean; // *** NEW: Is reply to page's comment ***
  userId: string;
}): Promise<any> {
  try {
    // Call the AI agent edge function internally
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-facebook-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Agent] Call failed:", response.status, errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[AI Agent] Error calling agent:", error);
    return null;
  }
}

// Check if comment is negative/spam
function isNegativeComment(text: string): boolean {
  const lowerText = text.toLowerCase();
  const negativePatterns = /বাজে|খারাপ|fraud|fake|scam|spam|worst|terrible|hate|cheat|धोखा|😡|👎|😤|🖕|wtf|bullshit|shit|damn/;
  return negativePatterns.test(lowerText);
}

serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET request = Facebook webhook verification
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      console.log("[Webhook] Verification request:", { mode, token: token?.substring(0, 5) + "..." });

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("[Webhook] Verification successful");
        return new Response(challenge, {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      } else {
        console.error("[Webhook] Verification failed - invalid token");
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }
    }

    // POST request = Incoming webhook event from Facebook
    if (req.method === "POST") {
      const body = await req.json();
      console.log("[Webhook] Received event:", JSON.stringify(body, null, 2));

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Process Facebook webhook events
      if (body.object === "page") {
        for (const entry of body.entry || []) {
          const pageId = entry.id;

          // Process messaging events (inbox)
          if (entry.messaging) {
            for (const event of entry.messaging) {
              await processMessagingEvent(supabase, pageId, event);
            }
          }

          // Process feed/comment events
          if (entry.changes) {
            for (const change of entry.changes) {
              await processFeedChange(supabase, pageId, change);
            }
          }
        }
      }

      // Always return 200 OK to acknowledge receipt
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    // Still return 200 to prevent Facebook from retrying
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Process incoming messages
async function processMessagingEvent(supabase: any, pageId: string, event: any) {
  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  const timestamp = event.timestamp;

  console.log(`[Webhook] Messaging event for page ${pageId}:`, { senderId, recipientId });

  // Skip if the message is from the page itself (echo)
  if (senderId === pageId) {
    console.log("[Webhook] Skipping echo message");
    return;
  }

  // Get the connected account for this page
  const { data: account, error: accountError } = await supabase
    .from("connected_accounts")
    .select("id, user_id, is_connected, name, access_token_encrypted, encryption_version")
    .eq("external_id", pageId)
    .eq("platform", "facebook")
    .eq("is_connected", true)
    .single();

  if (accountError || !account) {
    console.log("[Webhook] No active account found for page:", pageId);
    return;
  }

  // Decrypt access token
  let decryptedToken: string | null = null;
  if (account.access_token_encrypted && account.encryption_version === 2) {
    try {
      decryptedToken = await decryptToken(account.access_token_encrypted);
    } catch (e) {
      console.error("[Webhook] Failed to decrypt token:", e);
    }
  }

  const startTime = Date.now();

  // Get page memory for AI context
  const { data: pageMemory } = await supabase
    .from("page_memory")
    .select("automation_settings")
    .eq("page_id", pageId)
    .eq("user_id", account.user_id)
    .single();

  // Check if auto-reply is enabled
  if (!pageMemory?.automation_settings?.autoInboxReply) {
    console.log("[Webhook] Auto inbox reply disabled for page:", pageId);
    return;
  }

  // Handle messages
  if (event.message) {
    const message = event.message;
    console.log(`[Webhook] Received message: "${message.text?.substring(0, 50)}..."`);

    // Determine message type with enhanced detection
    let messageType = "text";
    let attachments = null;
    let messageText = message.text || "";
    
    if (message.attachments) {
      const firstAttachment = message.attachments[0];
      if (firstAttachment.type === "image") messageType = "image";
      else if (firstAttachment.type === "audio") messageType = "audio";
      else if (firstAttachment.type === "video") messageType = "video";
      else if (firstAttachment.type === "file") messageType = "file";
      else if (firstAttachment.type === "sticker") messageType = "sticker";
      attachments = message.attachments;
    }
    
    // Sticker detection
    if (message.sticker_id) {
      messageType = "sticker";
      // Add sticker context to message
      messageText = messageText || `[Sticker: ${message.sticker_id}]`;
    }
    
    console.log(`[Webhook] Message type: ${messageType}, Sticker ID: ${message.sticker_id || 'none'}`);

    // Get sender profile
    let senderName: string | undefined = undefined;
    if (decryptedToken) {
      const profile = await getUserProfile(decryptedToken, senderId);
      senderName = profile?.name || undefined;
    }

    // Call AI Agent with enhanced message info
    const aiResponse = await callAIAgent(supabase, {
      pageId,
      senderId,
      senderName,
      messageText: messageText || `[${messageType} message]`,
      messageType,
      attachments,
      isComment: false,
      userId: account.user_id,
    });
    
    console.log(`[Webhook] AI response received: reply length=${aiResponse?.reply?.length || 0}`);

    // Log the execution
    await supabase.from("execution_logs").insert({
      user_id: account.user_id,
      automation_id: null,
      source_platform: "facebook",
      event_type: "message_received",
      status: aiResponse?.reply ? "success" : "error",
      incoming_payload: {
        sender_id: senderId,
        sender_name: senderName,
        page_id: pageId,
        message_text: message.text,
        message_type: messageType,
        message_id: message.mid,
        timestamp,
      },
      response_payload: aiResponse || { error: "AI agent failed" },
      processing_time_ms: Date.now() - startTime,
    });

    // Send AI response if available
    if (aiResponse?.reply && decryptedToken) {
      const sendResult = await sendFacebookMessage(decryptedToken, senderId, aiResponse.reply);
      if (sendResult.success) {
        console.log("[Webhook] AI reply sent to:", senderId);
      } else {
        console.log("[Webhook] Failed to send AI reply, error code:", sendResult.errorCode);
      }
    }
  }

  // Handle postback (button clicks)
  if (event.postback) {
    console.log(`[Webhook] Received postback: ${event.postback.payload}`);
    
    await supabase.from("execution_logs").insert({
      user_id: account.user_id,
      automation_id: null,
      source_platform: "facebook",
      event_type: "postback_received",
      status: "success",
      incoming_payload: {
        sender_id: senderId,
        page_id: pageId,
        payload: event.postback.payload,
        timestamp,
      },
      response_payload: { status: "logged" },
      processing_time_ms: Date.now() - startTime,
    });
  }
}

// Process feed changes (comments, posts)
async function processFeedChange(supabase: any, pageId: string, change: any) {
  console.log(`[Webhook] Feed change for page ${pageId}:`, change.field);

  if (change.field !== "feed") {
    return;
  }

  const value = change.value;
  const item = value.item;

  // Get the connected account
  const { data: account, error } = await supabase
    .from("connected_accounts")
    .select("id, user_id, is_connected, name, access_token_encrypted, encryption_version")
    .eq("external_id", pageId)
    .eq("platform", "facebook")
    .eq("is_connected", true)
    .single();

  if (error || !account) {
    console.log("[Webhook] No active account for page:", pageId);
    return;
  }

  // Decrypt access token
  let decryptedToken: string | null = null;
  if (account.access_token_encrypted && account.encryption_version === 2) {
    try {
      decryptedToken = await decryptToken(account.access_token_encrypted);
    } catch (e) {
      console.error("[Webhook] Failed to decrypt token for comments:", e);
    }
  }

  const startTime = Date.now();

  // Get page memory
  const { data: pageMemory } = await supabase
    .from("page_memory")
    .select("automation_settings")
    .eq("page_id", pageId)
    .eq("user_id", account.user_id)
    .single();

  // Handle comments
  if (item === "comment" && value.verb === "add") {
    // Skip if comment is from the page itself
    if (value.from?.id === pageId) {
      console.log("[Webhook] Skipping own comment");
      return;
    }

    const commentText = value.message || "";
    const parentId = value.parent_id; // *** IMPORTANT: This is the parent comment ID if this is a reply ***
    
    console.log(`[Webhook] Comment on page ${pageId}: "${commentText.substring(0, 50)}..."`);
    console.log(`[Webhook] Parent ID: ${parentId || 'none (top-level comment)'}`);

    // Check if auto-reply is enabled
    if (!pageMemory?.automation_settings?.autoCommentReply) {
      console.log("[Webhook] Auto comment reply disabled for page:", pageId);
      return;
    }

    // Check for negative/spam comment - don't reply to these
    if (isNegativeComment(commentText)) {
      console.log("[Webhook] Skipping negative/spam comment");
      
      await supabase.from("execution_logs").insert({
        user_id: account.user_id,
        automation_id: null,
        source_platform: "facebook",
        event_type: "comment_skipped_negative",
        status: "skipped",
        incoming_payload: {
          page_id: pageId,
          post_id: value.post_id,
          comment_id: value.comment_id,
          parent_id: parentId,
          message: commentText,
          from: value.from,
          reason: "Negative or spam comment detected",
        },
        response_payload: { skipped: true },
        processing_time_ms: Date.now() - startTime,
      });
      return;
    }

    // *** NEW: Check if this is a reply to page's own comment ***
    let isReplyToPageComment = false;
    if (parentId && decryptedToken) {
      isReplyToPageComment = await checkIfReplyToPageComment(decryptedToken, parentId, pageId);
      console.log(`[Webhook] Is reply to page's comment: ${isReplyToPageComment}`);
    }

    // *** AUTO FETCH POST CONTENT FROM FACEBOOK ***
    let postContent: string | undefined;
    let postMediaType: string | undefined;
    
    if (decryptedToken && value.post_id) {
      const postData = await fetchPostContent(decryptedToken, value.post_id);
      if (postData) {
        postContent = postData.text;
        postMediaType = postData.mediaType;
        console.log(`[Webhook] Auto-fetched post content: "${postContent?.substring(0, 100)}..."`);
      }
    }

    // Call AI Agent with auto-analyzed post content and reply context
    const aiResponse = await callAIAgent(supabase, {
      pageId,
      senderId: value.from?.id,
      senderName: value.from?.name,
      messageText: commentText,
      messageType: "text",
      isComment: true,
      commentId: value.comment_id,
      postId: value.post_id,
      postContent,           // Auto-fetched post content
      postMediaType,         // Post media type
      parentCommentId: parentId,          // *** NEW: Parent comment ID ***
      isReplyToPageComment,               // *** NEW: Is reply to page's comment ***
      userId: account.user_id,
    });

    // Log the execution
    await supabase.from("execution_logs").insert({
      user_id: account.user_id,
      automation_id: null,
      source_platform: "facebook",
      event_type: isReplyToPageComment ? "comment_reply_to_page" : "comment_received",
      status: aiResponse ? "success" : "error",
      incoming_payload: {
        page_id: pageId,
        post_id: value.post_id,
        post_content: postContent,
        post_media_type: postMediaType,
        comment_id: value.comment_id,
        parent_id: parentId,
        is_reply_to_page: isReplyToPageComment,
        message: commentText,
        from: value.from,
        created_time: value.created_time,
      },
      response_payload: aiResponse || { error: "AI agent failed" },
      processing_time_ms: Date.now() - startTime,
    });

    if (aiResponse && decryptedToken) {
      // Get sender name for personalized message
      const senderName = value.from?.name || "ভাই/আপু";
      const shortName = senderName.split(" ")[0];
      
      // Log smart analysis
      console.log(`[Webhook] SMART AI Decision: skipInbox=${aiResponse.skipInboxMessage}, type=${aiResponse.smartAnalysis?.type}, reason="${aiResponse.smartAnalysis?.reason}"`);
      
      // *** STEP 1: Reply to comment with AI-generated contextual message ***
      const commentReplyText = aiResponse.commentReply || 
        `ধন্যবাদ ${shortName}! 🙏 কিভাবে সাহায্য করতে পারি বলুন! 😊`;
      
      const replyResult = await replyToComment(decryptedToken, value.comment_id, commentReplyText);
      console.log("[Webhook] Comment reply sent:", commentReplyText.substring(0, 60));

      // Add reaction based on AI decision
      if (pageMemory?.automation_settings?.reactionOnComments && aiResponse.reactionType !== "NONE") {
        await addReaction(decryptedToken, value.comment_id, aiResponse.reactionType || "LIKE");
        console.log(`[Webhook] Reaction added: ${aiResponse.reactionType}`);
      }

      // *** STEP 2: SMART INBOX DECISION - Only send if AI says to ***
      if (value.from?.id && !aiResponse.skipInboxMessage && aiResponse.inboxMessage) {
        console.log("[Webhook] Sending inbox message (AI decided it's needed)...");
        
        const inboxResult = await sendFacebookMessage(decryptedToken, value.from.id, aiResponse.inboxMessage);
        
        if (inboxResult.success) {
          console.log("[Webhook] ✅ Inbox message sent successfully to:", senderName);
        } else {
          // *** STEP 3: SMART FALLBACK - If inbox fails, edit the comment reply ***
          console.log("[Webhook] Inbox message failed (code:", inboxResult.errorCode, "), updating comment reply...");
          
          const isMessagingRestricted = inboxResult.errorCode === 551 || 
                                        inboxResult.errorCode === 10 || 
                                        inboxResult.errorCode === 230 ||
                                        inboxResult.errorCode === 2018278;
          
          if (isMessagingRestricted && replyResult.replyId) {
            const fallbackReply = `ধন্যবাদ ${shortName}! কমেন্ট করার জন্য অনেক ধন্যবাদ! 🙏❤️\n\n` +
              `আপনাকে বিস্তারিত তথ্য দিতে চাচ্ছিলাম, কিন্তু আপনার ইনবক্সে মেসেজ পাঠাতে পারছি না 😔\n\n` +
              `অনুগ্রহ করে আমাদের পেজে প্রথমে একটি মেসেজ দিন! 📩`;
            
            const editSuccess = await editComment(decryptedToken, replyResult.replyId, fallbackReply);
            
            if (editSuccess) {
              console.log("[Webhook] Smart fallback: Comment edited with inbox request");
              
              await supabase.from("execution_logs").insert({
                user_id: account.user_id,
                source_platform: "facebook",
                event_type: "inbox_fallback_used",
                status: "success",
                incoming_payload: {
                  page_id: pageId,
                  comment_id: value.comment_id,
                  reply_comment_id: replyResult.replyId,
                  inbox_error_code: inboxResult.errorCode,
                  from: value.from,
                },
                response_payload: { 
                  fallback_used: true,
                  comment_edited: true,
                },
                processing_time_ms: Date.now() - startTime,
              });
            }
          }
        }
      } else if (aiResponse.skipInboxMessage) {
        console.log(`[Webhook] ⏭️ Skipping inbox message - AI decision: ${aiResponse.smartAnalysis?.reason || 'not needed'}`);
        
        // Log that we intelligently skipped inbox
        await supabase.from("execution_logs").insert({
          user_id: account.user_id,
          source_platform: "facebook",
          event_type: "inbox_skipped_smart",
          status: "success",
          incoming_payload: {
            page_id: pageId,
            comment_id: value.comment_id,
            message: commentText,
            from: value.from,
          },
          response_payload: { 
            skipped: true,
            reason: aiResponse.smartAnalysis?.reason,
            comment_type: aiResponse.smartAnalysis?.type,
            reaction_given: aiResponse.reactionType,
            comment_reply_sent: true,
          },
          processing_time_ms: Date.now() - startTime,
        });
      }
    }
  }
}
