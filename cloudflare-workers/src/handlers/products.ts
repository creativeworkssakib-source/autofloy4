import { Env } from '../utils/types';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getSupabaseAdmin, requireAuth } from '../utils/supabase';

// Get products
export async function handleGetProducts(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search');
    const category = url.searchParams.get('category');
    
    const supabase = getSupabaseAdmin(env);
    
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[Products] Get error:', error);
      return errorResponse(error.message);
    }
    
    return jsonResponse({
      success: true,
      products: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
    
  } catch (error: any) {
    console.error('[Products] Get error:', error);
    return errorResponse(error.message);
  }
}

// Create product
export async function handleCreateProduct(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const body = await request.json() as any;
    
    const supabase = getSupabaseAdmin(env);
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...body,
        user_id: auth.userId,
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Products] Create error:', error);
      return errorResponse(error.message);
    }
    
    return jsonResponse({
      success: true,
      product: data,
      message: 'Product created successfully',
    });
    
  } catch (error: any) {
    console.error('[Products] Create error:', error);
    return errorResponse(error.message);
  }
}

// Update product
export async function handleUpdateProduct(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const url = new URL(request.url);
    const productId = url.pathname.split('/').pop();
    const body = await request.json() as any;
    
    const supabase = getSupabaseAdmin(env);
    
    const { data, error } = await supabase
      .from('products')
      .update(body)
      .eq('id', productId)
      .eq('user_id', auth.userId)
      .select()
      .single();
    
    if (error) {
      console.error('[Products] Update error:', error);
      return errorResponse(error.message);
    }
    
    return jsonResponse({
      success: true,
      product: data,
      message: 'Product updated successfully',
    });
    
  } catch (error: any) {
    console.error('[Products] Update error:', error);
    return errorResponse(error.message);
  }
}

// Delete product (soft delete)
export async function handleDeleteProduct(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const url = new URL(request.url);
    const productId = url.pathname.split('/').pop();
    
    const supabase = getSupabaseAdmin(env);
    
    const { error } = await supabase
      .from('products')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('user_id', auth.userId);
    
    if (error) {
      console.error('[Products] Delete error:', error);
      return errorResponse(error.message);
    }
    
    return jsonResponse({
      success: true,
      message: 'Product deleted successfully',
    });
    
  } catch (error: any) {
    console.error('[Products] Delete error:', error);
    return errorResponse(error.message);
  }
}
