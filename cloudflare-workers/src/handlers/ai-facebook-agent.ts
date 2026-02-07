import { Env } from '../utils/types';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getSupabaseAdmin } from '../utils/supabase';
import { callAI, detectProvider } from '../utils/ai-providers';
import { buildSystemPrompt, analyzeCommentSentiment } from '../utils/prompt-builder';
import { sendFacebookMessage, replyToComment, reactToComment } from '../utils/facebook';

// Main AI Facebook Agent handler
export async function handleAIFacebookAgent(request: Request, env: Env): Promise<Response> {
  const startTime = Date.now();
  
  try {
    const body = await request.json() as any;
    const { 
      pageId, 
      senderId, 
      messageText, 
      messageType = 'text',
      attachments = [],
      isComment = false,
      commentId,
      postId,
      senderName
    } = body;
    
    if (!pageId || !senderId) {
      return errorResponse('Missing pageId or senderId', 400);
    }
    
    console.log(`[AI Agent] Processing ${isComment ? 'comment' : 'message'} for page ${pageId}`);
    
    const supabase = getSupabaseAdmin(env);
    
    // Get page memory
    const { data: pageMemory, error: memoryError } = await supabase
      .from('page_memory')
      .select('*')
      .eq('page_id', pageId)
      .maybeSingle();
    
    if (memoryError) {
      console.error('[AI Agent] Page memory error:', memoryError);
    }
    
    if (!pageMemory) {
      return jsonResponse({ 
        success: false, 
        reason: 'Page not configured',
        processingTime: Date.now() - startTime 
      });
    }
    
    // Check if AI is enabled for this page
    if (!pageMemory.is_ai_enabled) {
      return jsonResponse({ 
        success: false, 
        reason: 'AI disabled for this page',
        processingTime: Date.now() - startTime 
      });
    }
    
    // Get API config
    const { data: apiConfig } = await supabase
      .from('api_integrations')
      .select('is_enabled, api_key')
      .eq('provider', 'openai')
      .maybeSingle();
    
    if (!apiConfig?.is_enabled) {
      return jsonResponse({ 
        success: false, 
        reason: 'AI is globally disabled',
        processingTime: Date.now() - startTime 
      });
    }
    
    // For comments, analyze sentiment first
    if (isComment && messageText) {
      const sentiment = analyzeCommentSentiment(messageText);
      
      if (sentiment.sentiment === 'negative' && pageMemory.hide_negative_comments) {
        return jsonResponse({
          success: true,
          action: 'hide_comment',
          sentiment: 'negative',
          processingTime: Date.now() - startTime,
        });
      }
      
      if (!sentiment.shouldReply) {
        return jsonResponse({
          success: true,
          action: 'no_reply_needed',
          sentiment: sentiment.sentiment,
          suggestedReaction: sentiment.suggestedReaction,
          processingTime: Date.now() - startTime,
        });
      }
    }
    
    // Get/create conversation (for messages)
    let conversation = null;
    if (!isComment) {
      const { data: existingConv } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('page_id', pageId)
        .eq('sender_id', senderId)
        .maybeSingle();
      
      if (!existingConv) {
        const { data: newConv } = await supabase
          .from('ai_conversations')
          .insert({
            page_id: pageId,
            sender_id: senderId,
            user_id: pageMemory.user_id,
            sender_name: senderName,
            message_history: [],
            conversation_state: 'active',
          })
          .select()
          .single();
        conversation = newConv;
      } else {
        conversation = existingConv;
      }
    }
    
    // Build system prompt
    const systemPrompt = buildSystemPrompt(pageMemory);
    
    // Build messages array
    let messages: any[] = [{ role: 'system', content: systemPrompt }];
    
    if (isComment) {
      // For comments, just the comment text
      messages.push({
        role: 'system',
        content: 'এটা একটা পাবলিক কমেন্ট। ছোট, প্রফেশনাল ও ফ্রেন্ডলি রিপ্লাই দাও। ইনবক্সে আসতে বলতে পারো।'
      });
      messages.push({
        role: 'user',
        content: `কমেন্ট: "${messageText}"${senderName ? `\nকমেন্টকারী: ${senderName}` : ''}`
      });
    } else {
      // For messages, include conversation history
      const history = (conversation?.message_history || []).slice(-10);
      messages = [...messages, ...history];
      messages.push({
        role: 'user',
        content: messageText || '[Media received]'
      });
    }
    
    // Detect provider and call AI
    const provider = detectProvider(apiConfig.api_key);
    const hasMedia = messageType !== 'text' || attachments?.length > 0;
    
    console.log(`[AI Agent] Using provider: ${provider}, hasMedia: ${hasMedia}`);
    
    const { response: aiResponse, provider: usedProvider } = await callAI(
      messages,
      provider,
      apiConfig.api_key,
      env.LOVABLE_API_KEY,
      hasMedia
    );
    
    console.log(`[AI Agent] Got response from ${usedProvider}: ${aiResponse.substring(0, 50)}...`);
    
    // Update conversation history (for messages)
    if (!isComment && conversation) {
      const updatedHistory = [
        ...(conversation.message_history || []),
        { role: 'user', content: messageText, timestamp: new Date().toISOString() },
        { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
      ].slice(-20); // Keep last 20 messages
      
      await supabase
        .from('ai_conversations')
        .update({
          message_history: updatedHistory,
          last_message_at: new Date().toISOString(),
          total_messages_count: (conversation.total_messages_count || 0) + 1,
        })
        .eq('id', conversation.id);
    }
    
    // Log execution
    await supabase.from('execution_logs').insert({
      user_id: pageMemory.user_id,
      event_type: isComment ? 'comment_reply' : 'message_reply',
      status: 'success',
      source_platform: 'facebook',
      processing_time_ms: Date.now() - startTime,
      incoming_payload: { 
        pageId, 
        senderId, 
        messageText: messageText?.substring(0, 100),
        isComment,
        commentId 
      },
      response_payload: { 
        aiResponse: aiResponse.substring(0, 200), 
        provider: usedProvider 
      },
    });
    
    const processingTime = Date.now() - startTime;
    console.log(`[AI Agent] Completed in ${processingTime}ms`);
    
    return jsonResponse({
      success: true,
      reply: aiResponse,
      provider: usedProvider,
      conversationId: conversation?.id,
      processingTime,
    });
    
  } catch (error: any) {
    console.error('[AI Agent] Error:', error);
    
    return errorResponse(error.message || 'Internal server error');
  }
}
