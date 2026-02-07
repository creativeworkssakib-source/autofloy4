import { Env } from '../utils/types';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getSupabaseAdmin, requireAuth } from '../utils/supabase';

// Get notifications
export async function handleGetNotifications(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    const supabase = getSupabaseAdmin(env);
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[Notifications] Get error:', error);
      return errorResponse(error.message);
    }
    
    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .eq('is_read', false);
    
    return jsonResponse({
      success: true,
      notifications: data || [],
      unreadCount: unreadCount || 0,
    });
    
  } catch (error: any) {
    console.error('[Notifications] Get error:', error);
    return errorResponse(error.message);
  }
}

// Mark notification as read
export async function handleMarkNotificationRead(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const { notification_id, mark_all } = await request.json() as any;
    
    const supabase = getSupabaseAdmin(env);
    
    if (mark_all) {
      // Mark all as read
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', auth.userId)
        .eq('is_read', false);
    } else if (notification_id) {
      // Mark single notification
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notification_id)
        .eq('user_id', auth.userId);
    }
    
    return jsonResponse({
      success: true,
      message: mark_all ? 'All notifications marked as read' : 'Notification marked as read',
    });
    
  } catch (error: any) {
    console.error('[Notifications] Mark read error:', error);
    return errorResponse(error.message);
  }
}

// Create notification (internal use)
export async function createNotification(
  supabase: any,
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any
): Promise<void> {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      data,
      is_read: false,
    });
  } catch (error) {
    console.error('[Notifications] Create error:', error);
  }
}
