import { Env } from '../utils/types';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getSupabaseAdmin, requireAuth } from '../utils/supabase';

// Get page memory for a page
export async function handleGetPageMemory(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const url = new URL(request.url);
    const pageId = url.searchParams.get('page_id');
    
    const supabase = getSupabaseAdmin(env);
    
    let query = supabase
      .from('page_memory')
      .select('*')
      .eq('user_id', auth.userId);
    
    if (pageId) {
      query = query.eq('page_id', pageId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[PageMemory] Get error:', error);
      return errorResponse(error.message);
    }
    
    return jsonResponse({
      success: true,
      data: pageId ? data?.[0] : data,
    });
    
  } catch (error: any) {
    console.error('[PageMemory] Get error:', error);
    return errorResponse(error.message);
  }
}

// Update page memory
export async function handleUpdatePageMemory(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const body = await request.json() as any;
    const { page_id, ...updates } = body;
    
    if (!page_id) {
      return errorResponse('page_id is required', 400);
    }
    
    const supabase = getSupabaseAdmin(env);
    
    // Check if exists
    const { data: existing } = await supabase
      .from('page_memory')
      .select('id')
      .eq('page_id', page_id)
      .eq('user_id', auth.userId)
      .maybeSingle();
    
    let result;
    
    if (existing) {
      // Update
      result = await supabase
        .from('page_memory')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert
      result = await supabase
        .from('page_memory')
        .insert({
          page_id,
          user_id: auth.userId,
          ...updates,
        })
        .select()
        .single();
    }
    
    if (result.error) {
      console.error('[PageMemory] Update error:', result.error);
      return errorResponse(result.error.message);
    }
    
    return jsonResponse({
      success: true,
      data: result.data,
      message: 'Page memory updated successfully',
    });
    
  } catch (error: any) {
    console.error('[PageMemory] Update error:', error);
    return errorResponse(error.message);
  }
}

// Sync products to page memory
export async function handleSyncProducts(request: Request, env: Env): Promise<Response> {
  try {
    const auth = await requireAuth(env, request);
    if (auth instanceof Response) return auth;
    
    const { page_id } = await request.json() as any;
    
    if (!page_id) {
      return errorResponse('page_id is required', 400);
    }
    
    const supabase = getSupabaseAdmin(env);
    
    // Get user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('name, price, sale_price, stock, category')
      .eq('user_id', auth.userId)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .limit(100);
    
    if (productsError) {
      return errorResponse(productsError.message);
    }
    
    // Build products summary
    const summary = (products || [])
      .map(p => `${p.name}: ${p.sale_price || p.price}৳${p.stock ? ` (${p.stock} in stock)` : ''}`)
      .join('\n');
    
    // Update page memory
    const { error: updateError } = await supabase
      .from('page_memory')
      .update({
        products_summary: summary,
        last_products_sync: new Date().toISOString(),
      })
      .eq('page_id', page_id)
      .eq('user_id', auth.userId);
    
    if (updateError) {
      return errorResponse(updateError.message);
    }
    
    return jsonResponse({
      success: true,
      productCount: products?.length || 0,
      message: `Synced ${products?.length || 0} products`,
    });
    
  } catch (error: any) {
    console.error('[PageMemory] Sync products error:', error);
    return errorResponse(error.message);
  }
}
