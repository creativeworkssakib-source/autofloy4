import { Env } from '../utils/types';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getSupabaseAdmin, getSupabaseClient } from '../utils/supabase';

// Handle login
export async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const { email, password } = await request.json() as any;
    
    if (!email || !password) {
      return errorResponse('Email and password required', 400);
    }
    
    const supabase = getSupabaseClient(env);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('[Auth] Login error:', error);
      return errorResponse(error.message, 401);
    }
    
    return jsonResponse({
      success: true,
      user: data.user,
      session: data.session,
    });
    
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return errorResponse(error.message);
  }
}

// Handle signup
export async function handleSignup(request: Request, env: Env): Promise<Response> {
  try {
    const { email, password, name, phone } = await request.json() as any;
    
    if (!email || !password) {
      return errorResponse('Email and password required', 400);
    }
    
    const supabase = getSupabaseClient(env);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
      },
    });
    
    if (error) {
      console.error('[Auth] Signup error:', error);
      return errorResponse(error.message, 400);
    }
    
    return jsonResponse({
      success: true,
      user: data.user,
      session: data.session,
      message: 'Account created successfully',
    });
    
  } catch (error: any) {
    console.error('[Auth] Signup error:', error);
    return errorResponse(error.message);
  }
}

// Handle password reset request
export async function handlePasswordResetRequest(request: Request, env: Env): Promise<Response> {
  try {
    const { email } = await request.json() as any;
    
    if (!email) {
      return errorResponse('Email required', 400);
    }
    
    const supabase = getSupabaseClient(env);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://autofloy.com/reset-password',
    });
    
    if (error) {
      console.error('[Auth] Password reset error:', error);
      return errorResponse(error.message, 400);
    }
    
    return jsonResponse({
      success: true,
      message: 'Password reset email sent',
    });
    
  } catch (error: any) {
    console.error('[Auth] Password reset error:', error);
    return errorResponse(error.message);
  }
}

// Handle token refresh
export async function handleRefreshToken(request: Request, env: Env): Promise<Response> {
  try {
    const { refresh_token } = await request.json() as any;
    
    if (!refresh_token) {
      return errorResponse('Refresh token required', 400);
    }
    
    const supabase = getSupabaseClient(env);
    
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });
    
    if (error) {
      return errorResponse(error.message, 401);
    }
    
    return jsonResponse({
      success: true,
      session: data.session,
    });
    
  } catch (error: any) {
    console.error('[Auth] Refresh error:', error);
    return errorResponse(error.message);
  }
}

// Get current user
export async function handleGetUser(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabaseClient(env, authHeader);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return errorResponse('Invalid token', 401);
    }
    
    // Get user profile/settings
    const adminSupabase = getSupabaseAdmin(env);
    const { data: userSettings } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    return jsonResponse({
      success: true,
      user: {
        ...user,
        settings: userSettings,
      },
    });
    
  } catch (error: any) {
    console.error('[Auth] Get user error:', error);
    return errorResponse(error.message);
  }
}
