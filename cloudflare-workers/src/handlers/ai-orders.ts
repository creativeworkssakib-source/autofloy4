import { Env } from '../utils/types';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getSupabaseAdmin, requireAuth } from '../utils/supabase';

// Get AI orders
export async function handleGetAIOrders(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const status = url.searchParams.get('status');
    const pageId = url.searchParams.get('page_id');
    
    const supabase = getSupabaseAdmin(env);
    
    let query = supabase
      .from('ai_orders')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (status) {
      query = query.eq('order_status', status);
    }
    
    if (pageId) {
      query = query.eq('page_id', pageId);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[AIOrders] Get error:', error);
      return errorResponse(error.message);
    }
    
    return jsonResponse({
      success: true,
      orders: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
    
  } catch (error: any) {
    console.error('[AIOrders] Get error:', error);
    return errorResponse(error.message);
  }
}

// Create AI order
export async function handleCreateAIOrder(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const body = await request.json() as any;
    const {
      page_id,
      customer_name,
      customer_phone,
      customer_address,
      customer_fb_id,
      products,
      subtotal,
      delivery_charge = 0,
      advance_amount = 0,
      notes,
      conversation_id,
    } = body;
    
    if (!customer_name || !customer_phone || !customer_address) {
      return errorResponse('Customer name, phone, and address are required', 400);
    }
    
    const supabase = getSupabaseAdmin(env);
    
    // Generate invoice number
    const invoiceNumber = `AI-${Date.now().toString(36).toUpperCase()}`;
    
    const total = subtotal + delivery_charge - advance_amount;
    
    const { data, error } = await supabase
      .from('ai_orders')
      .insert({
        user_id: auth.userId,
        page_id,
        customer_name,
        customer_phone,
        customer_address,
        customer_fb_id,
        products: products || [],
        subtotal: subtotal || 0,
        delivery_charge,
        advance_amount,
        total,
        invoice_number: invoiceNumber,
        notes,
        conversation_id,
        order_status: 'pending',
      })
      .select()
      .single();
    
    if (error) {
      console.error('[AIOrders] Create error:', error);
      return errorResponse(error.message);
    }
    
    return jsonResponse({
      success: true,
      order: data,
      message: 'Order created successfully',
    });
    
  } catch (error: any) {
    console.error('[AIOrders] Create error:', error);
    return errorResponse(error.message);
  }
}

// Update AI order status
export async function handleUpdateAIOrder(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const url = new URL(request.url);
    const orderId = url.pathname.split('/').pop();
    const body = await request.json() as any;
    
    const supabase = getSupabaseAdmin(env);
    
    const { data, error } = await supabase
      .from('ai_orders')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('user_id', auth.userId)
      .select()
      .single();
    
    if (error) {
      console.error('[AIOrders] Update error:', error);
      return errorResponse(error.message);
    }
    
    return jsonResponse({
      success: true,
      order: data,
      message: 'Order updated successfully',
    });
    
  } catch (error: any) {
    console.error('[AIOrders] Update error:', error);
    return errorResponse(error.message);
  }
}

// Get AI order stats
export async function handleGetAIOrderStats(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const supabase = getSupabaseAdmin(env);
    
    const { data, error } = await supabase
      .from('ai_orders')
      .select('total, order_status, created_at')
      .eq('user_id', auth.userId)
      .gte('created_at', startDate.toISOString());
    
    if (error) {
      console.error('[AIOrders] Stats error:', error);
      return errorResponse(error.message);
    }
    
    const orders = data || [];
    
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.order_status === 'pending').length,
      confirmed: orders.filter(o => o.order_status === 'confirmed').length,
      shipped: orders.filter(o => o.order_status === 'shipped').length,
      delivered: orders.filter(o => o.order_status === 'delivered').length,
      cancelled: orders.filter(o => o.order_status === 'cancelled').length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
      avgOrderValue: orders.length > 0 
        ? Math.round(orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length)
        : 0,
    };
    
    return jsonResponse({
      success: true,
      stats,
      period: { days },
    });
    
  } catch (error: any) {
    console.error('[AIOrders] Stats error:', error);
    return errorResponse(error.message);
  }
}
