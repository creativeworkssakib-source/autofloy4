import { Env } from '../utils/types';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getSupabaseAdmin, requireAuth } from '../utils/supabase';

// Get execution logs
export async function handleGetExecutionLogs(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const status = url.searchParams.get('status');
    const eventType = url.searchParams.get('event_type');
    const platform = url.searchParams.get('platform');
    
    const supabase = getSupabaseAdmin(env);
    
    let query = supabase
      .from('execution_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    
    if (platform) {
      query = query.eq('source_platform', platform);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[ExecutionLogs] Get error:', error);
      return errorResponse(error.message);
    }
    
    return jsonResponse({
      success: true,
      logs: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
    
  } catch (error: any) {
    console.error('[ExecutionLogs] Get error:', error);
    return errorResponse(error.message);
  }
}

// Get execution stats
export async function handleGetExecutionStats(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const supabase = getSupabaseAdmin(env);
    
    const { data, error } = await supabase
      .from('execution_logs')
      .select('status, event_type, processing_time_ms, created_at')
      .eq('user_id', auth.userId)
      .gte('created_at', startDate.toISOString());
    
    if (error) {
      console.error('[ExecutionLogs] Stats error:', error);
      return errorResponse(error.message);
    }
    
    const logs = data || [];
    
    // Calculate stats
    const total = logs.length;
    const successful = logs.filter(l => l.status === 'success').length;
    const failed = logs.filter(l => l.status === 'failed').length;
    const avgProcessingTime = logs.length > 0
      ? Math.round(logs.reduce((sum, l) => sum + (l.processing_time_ms || 0), 0) / logs.length)
      : 0;
    
    // Group by event type
    const byEventType: Record<string, number> = {};
    logs.forEach(l => {
      const type = l.event_type || 'unknown';
      byEventType[type] = (byEventType[type] || 0) + 1;
    });
    
    // Group by day
    const byDay: Record<string, { success: number; failed: number }> = {};
    logs.forEach(l => {
      const day = l.created_at.split('T')[0];
      if (!byDay[day]) {
        byDay[day] = { success: 0, failed: 0 };
      }
      if (l.status === 'success') {
        byDay[day].success++;
      } else {
        byDay[day].failed++;
      }
    });
    
    return jsonResponse({
      success: true,
      stats: {
        total,
        successful,
        failed,
        successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
        avgProcessingTime,
        byEventType,
        byDay,
      },
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
    });
    
  } catch (error: any) {
    console.error('[ExecutionLogs] Stats error:', error);
    return errorResponse(error.message);
  }
}
