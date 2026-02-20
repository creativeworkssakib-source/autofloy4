import { Env } from './types';
import { createHmac } from 'node:crypto';

// Verify Facebook webhook signature
export function verifyFacebookSignature(
  payload: string,
  signature: string | null,
  appSecret: string
): boolean {
  if (!signature) return false;
  
  const expectedSignature = createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');
  
  const providedSignature = signature.replace('sha256=', '');
  
  return expectedSignature === providedSignature;
}

// Send message via Facebook Graph API
export async function sendFacebookMessage(
  pageId: string,
  recipientId: string,
  message: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          messaging_type: 'RESPONSE',
          access_token: accessToken,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Facebook send error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Facebook send error:', error);
    return false;
  }
}

// Reply to a comment
export async function replyToComment(
  commentId: string,
  message: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${commentId}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          access_token: accessToken,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Comment reply error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Comment reply error:', error);
    return false;
  }
}

// React to a comment (LIKE, LOVE, etc.)
export async function reactToComment(
  commentId: string,
  reactionType: 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY',
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${commentId}/reactions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reactionType,
          access_token: accessToken,
        }),
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Reaction error:', error);
    return false;
  }
}

// Hide a comment
export async function hideComment(
  commentId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${commentId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_hidden: true,
          access_token: accessToken,
        }),
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Hide comment error:', error);
    return false;
  }
}

// Get sender profile
export async function getSenderProfile(
  senderId: string,
  accessToken: string
): Promise<{ name: string } | null> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${senderId}?fields=name&access_token=${accessToken}`
    );
    
    if (!response.ok) return null;
    
    return await response.json() as { name: string };
  } catch {
    return null;
  }
}

// Mark message as seen (read receipt)
export async function markMessageSeen(
  senderId: string,
  pageId: string,
  accessToken: string
): Promise<void> {
  try {
    await fetch(`https://graph.facebook.com/v18.0/${pageId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: senderId },
        sender_action: 'mark_seen',
        access_token: accessToken,
      }),
    });
  } catch (error) {
    console.error('Mark seen error:', error);
  }
}

// Send typing indicator (typing_on / typing_off)
export async function sendTypingIndicator(
  senderId: string,
  pageId: string,
  accessToken: string,
  action: 'typing_on' | 'typing_off' = 'typing_on'
): Promise<void> {
  try {
    await fetch(`https://graph.facebook.com/v18.0/${pageId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: senderId },
        sender_action: action,
        access_token: accessToken,
      }),
    });
  } catch (error) {
    console.error('Typing indicator error:', error);
  }
}
