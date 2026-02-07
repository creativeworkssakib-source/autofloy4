import { Env, FacebookWebhookEntry } from '../utils/types';
import { corsHeaders, jsonResponse, errorResponse } from '../utils/cors';
import { getSupabaseAdmin } from '../utils/supabase';
import { verifyFacebookSignature, sendFacebookMessage, replyToComment, reactToComment, hideComment, getSenderProfile } from '../utils/facebook';
import { callAI, detectProvider } from '../utils/ai-providers';
import { buildSystemPrompt, analyzeCommentSentiment } from '../utils/prompt-builder';

// Handle Facebook webhook verification (GET)
export async function handleWebhookVerify(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
  console.log('[Webhook] Verification request:', { mode, token });
  
  // Verify token should match your Facebook app's verify token
  if (mode === 'subscribe' && token) {
    console.log('[Webhook] Verification successful');
    return new Response(challenge || '', { status: 200 });
  }
  
  return errorResponse('Verification failed', 403);
}

// Handle Facebook webhook events (POST)
export async function handleWebhookEvent(request: Request, env: Env): Promise<Response> {
  const startTime = Date.now();
  
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    
    // Verify signature
    if (!verifyFacebookSignature(payload, signature, env.FACEBOOK_APP_SECRET)) {
      console.error('[Webhook] Invalid signature');
      return errorResponse('Invalid signature', 401);
    }
    
    const body = JSON.parse(payload);
    console.log('[Webhook] Received event:', body.object);
    
    if (body.object !== 'page') {
      return jsonResponse({ received: true });
    }
    
    const supabase = getSupabaseAdmin(env);
    
    // Process each entry
    for (const entry of (body.entry || []) as FacebookWebhookEntry[]) {
      const pageId = entry.id;
      
      // Handle messages
      if (entry.messaging) {
        for (const event of entry.messaging) {
          if (event.message && !event.message.is_echo) {
            await processMessage(event, pageId, supabase, env);
          }
        }
      }
      
      // Handle comments
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'feed' && change.value.item === 'comment') {
            await processComment(change.value, pageId, supabase, env);
          }
        }
      }
    }
    
    console.log(`[Webhook] Processed in ${Date.now() - startTime}ms`);
    return jsonResponse({ received: true });
    
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return errorResponse(error.message);
  }
}

// Process incoming message
async function processMessage(
  event: any,
  pageId: string,
  supabase: any,
  env: Env
): Promise<void> {
  const senderId = event.sender.id;
  const messageText = event.message.text || '';
  const attachments = event.message.attachments || [];
  
  console.log(`[Message] From ${senderId}: ${messageText.substring(0, 50)}...`);
  
  // Get page memory
  const { data: pageMemory } = await supabase
    .from('page_memory')
    .select('*')
    .eq('page_id', pageId)
    .maybeSingle();
  
  if (!pageMemory) {
    console.log('[Message] No page memory found for:', pageId);
    return;
  }
  
  // Check if AI is enabled
  if (!pageMemory.is_ai_enabled) {
    console.log('[Message] AI is disabled for this page');
    return;
  }
  
  // Get API config
  const { data: apiConfig } = await supabase
    .from('api_integrations')
    .select('is_enabled, api_key')
    .eq('provider', 'openai')
    .maybeSingle();
  
  if (!apiConfig?.is_enabled) {
    console.log('[Message] AI integration is disabled');
    return;
  }
  
  // Get access token
  const { data: account } = await supabase
    .from('connected_accounts')
    .select('access_token')
    .eq('external_id', pageId)
    .eq('platform', 'facebook')
    .maybeSingle();
  
  if (!account?.access_token) {
    console.log('[Message] No access token for page');
    return;
  }
  
  // Get/create conversation
  let { data: conversation } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('page_id', pageId)
    .eq('sender_id', senderId)
    .maybeSingle();
  
  if (!conversation) {
    // Get sender profile
    const profile = await getSenderProfile(senderId, account.access_token);
    
    const { data: newConv } = await supabase
      .from('ai_conversations')
      .insert({
        page_id: pageId,
        sender_id: senderId,
        user_id: pageMemory.user_id,
        sender_name: profile?.name,
        message_history: [],
        conversation_state: 'active',
      })
      .select()
      .single();
    conversation = newConv;
  }
  
  // Build messages for AI
  const systemPrompt = buildSystemPrompt(pageMemory);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...(conversation?.message_history || []).slice(-10),
    { role: 'user', content: messageText || '[Media received]' },
  ];
  
  // Detect provider and call AI
  const provider = detectProvider(apiConfig.api_key);
  const hasMedia = attachments.length > 0;
  
  const { response: aiResponse, provider: usedProvider } = await callAI(
    messages,
    provider,
    apiConfig.api_key,
    env.LOVABLE_API_KEY,
    hasMedia
  );
  
  // Send reply
  const sent = await sendFacebookMessage(
    pageId,
    senderId,
    aiResponse,
    account.access_token
  );
  
  console.log(`[Message] Reply sent: ${sent}, provider: ${usedProvider}`);
  
  // Update conversation
  const updatedHistory = [
    ...(conversation?.message_history || []),
    { role: 'user', content: messageText, timestamp: new Date().toISOString() },
    { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
  ].slice(-20);
  
  await supabase
    .from('ai_conversations')
    .update({
      message_history: updatedHistory,
      last_message_at: new Date().toISOString(),
      total_messages_count: (conversation?.total_messages_count || 0) + 1,
    })
    .eq('id', conversation?.id);
  
  // Log execution
  await supabase.from('execution_logs').insert({
    user_id: pageMemory.user_id,
    event_type: 'message_reply',
    status: sent ? 'success' : 'failed',
    source_platform: 'facebook',
    processing_time_ms: Date.now() - Date.now(),
    incoming_payload: { pageId, senderId, messageText: messageText.substring(0, 100) },
    response_payload: { aiResponse: aiResponse.substring(0, 200), provider: usedProvider },
  });
}

// Process comment
async function processComment(
  value: any,
  pageId: string,
  supabase: any,
  env: Env
): Promise<void> {
  const commentId = value.comment_id;
  const postId = value.post_id;
  const message = value.message || '';
  const fromId = value.from?.id;
  const fromName = value.from?.name;
  
  // Skip own comments
  if (fromId === pageId) return;
  
  console.log(`[Comment] From ${fromName}: ${message.substring(0, 50)}...`);
  
  // Get page memory
  const { data: pageMemory } = await supabase
    .from('page_memory')
    .select('*')
    .eq('page_id', pageId)
    .maybeSingle();
  
  if (!pageMemory) return;
  
  // Get access token
  const { data: account } = await supabase
    .from('connected_accounts')
    .select('access_token')
    .eq('external_id', pageId)
    .eq('platform', 'facebook')
    .maybeSingle();
  
  if (!account?.access_token) return;
  
  // Analyze sentiment
  const analysis = analyzeCommentSentiment(message);
  console.log(`[Comment] Sentiment: ${analysis.sentiment}`);
  
  // Handle negative comments
  if (analysis.sentiment === 'negative' && pageMemory.hide_negative_comments) {
    await hideComment(commentId, account.access_token);
    console.log('[Comment] Hidden negative comment');
    return;
  }
  
  // Auto-like/react
  if (pageMemory.auto_like_comments && analysis.suggestedReaction !== 'NONE') {
    await reactToComment(commentId, analysis.suggestedReaction, account.access_token);
  }
  
  // Auto-reply
  if (pageMemory.auto_reply_comments && analysis.shouldReply) {
    // Check API config
    const { data: apiConfig } = await supabase
      .from('api_integrations')
      .select('is_enabled, api_key')
      .eq('provider', 'openai')
      .maybeSingle();
    
    if (!apiConfig?.is_enabled) return;
    
    // Build AI prompt for comment
    const systemPrompt = buildSystemPrompt(pageMemory);
    const messages = [
      { role: 'system', content: systemPrompt + '\n\nএটা একটা পাবলিক কমেন্টের রিপ্লাই। ছোট ও professional রাখো।' },
      { role: 'user', content: `কমেন্ট: "${message}"\nকমেন্টকারী: ${fromName}` },
    ];
    
    const provider = detectProvider(apiConfig.api_key);
    const { response: aiResponse } = await callAI(
      messages,
      provider,
      apiConfig.api_key,
      env.LOVABLE_API_KEY,
      false
    );
    
    // Reply to comment
    await replyToComment(commentId, aiResponse, account.access_token);
    console.log('[Comment] Replied');
  }
  
  // Log
  await supabase.from('execution_logs').insert({
    user_id: pageMemory.user_id,
    event_type: 'comment_processed',
    status: 'success',
    source_platform: 'facebook',
    incoming_payload: { commentId, postId, message: message.substring(0, 100) },
    response_payload: { sentiment: analysis.sentiment },
  });
}
