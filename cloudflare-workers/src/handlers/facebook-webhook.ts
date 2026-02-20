import { Env, FacebookWebhookEntry } from '../utils/types';
import { corsHeaders, jsonResponse, errorResponse } from '../utils/cors';
import { getSupabaseAdmin } from '../utils/supabase';
import { verifyFacebookSignature, sendFacebookMessage, replyToComment, reactToComment, hideComment, getSenderProfile, markMessageSeen, sendTypingIndicator } from '../utils/facebook';
import { callAI, detectProvider } from '../utils/ai-providers';
import { buildSystemPrompt, analyzeCommentSentiment } from '../utils/prompt-builder';

// Handle Facebook webhook verification (GET)
export async function handleWebhookVerify(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
  console.log('[Webhook] Verification request:', { mode, token });
  
  // Verify token check
  const expectedToken = env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'autofloy_fb_webhook_2024';
  
  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[Webhook] Verification successful');
    // Must return plain text challenge - NOT JSON
    return new Response(challenge || '', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  console.error('[Webhook] Verification failed - mode:', mode, 'token match:', token === expectedToken);
  return new Response('Verification failed', { status: 403 });
}

// Handle Facebook webhook events (POST)
export async function handleWebhookEvent(request: Request, env: Env): Promise<Response> {
  const startTime = Date.now();
  
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    
    // Verify signature only if FACEBOOK_APP_SECRET is configured
    if (env.FACEBOOK_APP_SECRET && signature) {
      if (!verifyFacebookSignature(payload, signature, env.FACEBOOK_APP_SECRET)) {
        console.error('[Webhook] Invalid signature');
        return errorResponse('Invalid signature', 401);
      }
    } else {
      console.log('[Webhook] Skipping signature verification (no secret configured)');
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

// Resolve AI credentials for a user
async function resolveAICredentials(
  userId: string,
  supabase: any,
  env: Env
): Promise<{ apiKey: string; provider: string; baseUrl: string | null; model: string | null } | null> {
  const { data: userAiConfig } = await supabase
    .from('ai_provider_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (userAiConfig?.use_admin_ai) {
    const { data: apiConfig } = await supabase
      .from('api_integrations')
      .select('is_enabled, api_key')
      .eq('provider', 'openai')
      .maybeSingle();
    if (!apiConfig?.is_enabled || !apiConfig?.api_key) {
      console.log('[AI] Admin AI disabled globally');
      return null;
    }
    return {
      apiKey: apiConfig.api_key,
      provider: detectProvider(apiConfig.api_key),
      baseUrl: null,
      model: null,
    };
  }

  if (userAiConfig?.is_active && userAiConfig?.api_key_encrypted) {
    return {
      apiKey: userAiConfig.api_key_encrypted,
      provider: userAiConfig.provider || detectProvider(userAiConfig.api_key_encrypted),
      baseUrl: userAiConfig.base_url || null,
      model: userAiConfig.model_name || null,
    };
  }

  console.log('[AI] No AI API configured for user:', userId);
  return null;
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
  
  console.log(`[Message] From ${senderId}: ${messageText.substring(0, 50)}`);
  
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
  
  // Check if autoInboxReply is enabled via automation_settings
  const automationSettings = pageMemory.automation_settings || {};
  if (!automationSettings.autoInboxReply) {
    console.log('[Message] autoInboxReply is disabled');
    return;
  }

  const userId = pageMemory.user_id;

  // Resolve AI credentials
  const aiCreds = await resolveAICredentials(userId, supabase, env);
  if (!aiCreds) return;
  
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

  // Mark as seen immediately
  await markMessageSeen(senderId, pageId, account.access_token);
  
  // Show typing indicator
  await sendTypingIndicator(senderId, pageId, account.access_token, 'typing_on');

  
  // Get/create conversation
  let { data: conversation } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('page_id', pageId)
    .eq('sender_id', senderId)
    .maybeSingle();
  
  if (!conversation) {
    const profile = await getSenderProfile(senderId, account.access_token);
    
    const { data: newConv } = await supabase
      .from('ai_conversations')
      .insert({
        page_id: pageId,
        sender_id: senderId,
        user_id: userId,
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
  
  const hasMedia = attachments.length > 0;
  
  const { response: aiResponse, provider: usedProvider } = await callAI(
    messages,
    aiCreds.provider as any,
    aiCreds.apiKey,
    env.LOVABLE_API_KEY,
    hasMedia
  );
  
  console.log(`[Message] AI response (${usedProvider}): ${aiResponse.substring(0, 80)}`);
  
  // Turn off typing indicator before sending
  await sendTypingIndicator(senderId, pageId, account.access_token, 'typing_off');
  
  // Send reply via Facebook
  const sent = await sendFacebookMessage(
    pageId,
    senderId,
    aiResponse,
    account.access_token
  );
  
  console.log(`[Message] Reply sent: ${sent}`);
  
  // Update conversation history
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
    user_id: userId,
    event_type: 'message_reply',
    status: sent ? 'success' : 'failed',
    source_platform: 'facebook',
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
  
  console.log(`[Comment] From ${fromName}: ${message.substring(0, 50)}`);
  
  // Get page memory
  const { data: pageMemory } = await supabase
    .from('page_memory')
    .select('*')
    .eq('page_id', pageId)
    .maybeSingle();
  
  if (!pageMemory) return;

  // Check automation_settings for comments
  const automationSettings = pageMemory.automation_settings || {};
  
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
  if (analysis.sentiment === 'negative' && automationSettings.hideNegativeComments) {
    await hideComment(commentId, account.access_token);
    console.log('[Comment] Hidden negative comment');
    return;
  }
  
  // Auto-react
  if (automationSettings.reactionOnComments && analysis.suggestedReaction !== 'NONE') {
    await reactToComment(commentId, analysis.suggestedReaction, account.access_token);
  }
  
  // Auto-reply to comment
  if (automationSettings.autoCommentReply && analysis.shouldReply) {
    const userId = pageMemory.user_id;
    const aiCreds = await resolveAICredentials(userId, supabase, env);
    if (!aiCreds) return;
    
    const systemPrompt = buildSystemPrompt(pageMemory);
    const messages = [
      { role: 'system', content: systemPrompt + '\n\nএটা একটা পাবলিক কমেন্টের রিপ্লাই। ছোট ও professional রাখো।' },
      { role: 'user', content: `কমেন্ট: "${message}"\nকমেন্টকারী: ${fromName}` },
    ];
    
    const { response: aiResponse } = await callAI(
      messages,
      aiCreds.provider as any,
      aiCreds.apiKey,
      env.LOVABLE_API_KEY,
      false
    );
    
    await replyToComment(commentId, aiResponse, account.access_token);
    console.log('[Comment] Replied:', aiResponse.substring(0, 50));
    
    // Log
    await supabase.from('execution_logs').insert({
      user_id: userId,
      event_type: 'comment_reply',
      status: 'success',
      source_platform: 'facebook',
      incoming_payload: { commentId, postId, message: message.substring(0, 100) },
      response_payload: { sentiment: analysis.sentiment, reply: aiResponse.substring(0, 100) },
    });
  }
}
