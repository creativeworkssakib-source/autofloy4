import { Env } from '../utils/types';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getSupabaseAdmin, requireAuth } from '../utils/supabase';

// Get dashboard stats
export async function handleDashboardStats(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const supabase = getSupabaseAdmin(env);
    const userId = auth.userId;
    
    // Get date range
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Parallel queries for efficiency
    const [
      ordersResult,
      productsResult,
      conversationsResult,
      logsResult,
      pagesResult,
    ] = await Promise.all([
      // AI Orders count & total
      supabase
        .from('ai_orders')
        .select('id, total, order_status, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString()),
      
      // Products count
      supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_deleted', false),
      
      // Active conversations
      supabase
        .from('ai_conversations')
        .select('id, total_messages_count', { count: 'exact' })
        .eq('user_id', userId)
        .gte('last_message_at', startDate.toISOString()),
      
      // Execution logs
      supabase
        .from('execution_logs')
        .select('id, status, event_type')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString()),
      
      // Connected pages
      supabase
        .from('connected_accounts')
        .select('id, name, picture_url')
        .eq('user_id', userId)
        .eq('platform', 'facebook')
        .eq('is_connected', true),
    ]);
    
    // Calculate stats
    const orders = ordersResult.data || [];
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingOrders = orders.filter(o => o.order_status === 'pending').length;
    const completedOrders = orders.filter(o => o.order_status === 'completed').length;
    
    const logs = logsResult.data || [];
    const totalAutomations = logs.length;
    const successfulAutomations = logs.filter(l => l.status === 'success').length;
    const failedAutomations = logs.filter(l => l.status === 'failed').length;
    
    const totalMessages = (conversationsResult.data || [])
      .reduce((sum, c) => sum + (c.total_messages_count || 0), 0);
    
    return jsonResponse({
      success: true,
      stats: {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders,
          revenue: totalRevenue,
        },
        products: {
          total: productsResult.count || 0,
        },
        conversations: {
          active: conversationsResult.count || 0,
          totalMessages,
        },
        automations: {
          total: totalAutomations,
          successful: successfulAutomations,
          failed: failedAutomations,
          successRate: totalAutomations > 0 
            ? Math.round((successfulAutomations / totalAutomations) * 100) 
            : 0,
        },
        pages: {
          connected: pagesResult.data?.length || 0,
          list: pagesResult.data || [],
        },
      },
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
    });
    
  } catch (error: any) {
    console.error('[Dashboard] Stats error:', error);
    return errorResponse(error.message);
  }
}

// Get dashboard overview
export async function handleDashboardOverview(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const supabase = getSupabaseAdmin(env);
    const userId = auth.userId;
    
    // Get user subscription
    const { data: user } = await supabase
      .from('users')
      .select('subscription_plan, subscription_status, subscription_expires_at, trial_started_at, trial_ends_at')
      .eq('id', userId)
      .maybeSingle();
    
    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('ai_orders')
      .select('id, customer_name, total, order_status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Get recent logs
    const { data: recentLogs } = await supabase
      .from('execution_logs')
      .select('id, event_type, status, processing_time_ms, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    return jsonResponse({
      success: true,
      overview: {
        subscription: user,
        recentOrders: recentOrders || [],
        recentActivity: recentLogs || [],
      },
    });
    
  } catch (error: any) {
    console.error('[Dashboard] Overview error:', error);
    return errorResponse(error.message);
  }
}
