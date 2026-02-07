import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Env } from './types';

// Get Supabase admin client (service role)
export function getSupabaseAdmin(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Get Supabase anon client (with optional auth header)
export function getSupabaseClient(env: Env, authHeader?: string): SupabaseClient {
  const options: any = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  };
  
  if (authHeader) {
    options.global = {
      headers: { Authorization: authHeader },
    };
  }
  
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, options);
}

// Get user from auth header
export async function getUserFromAuth(
  env: Env, 
  request: Request
): Promise<{ userId: string; user: any } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabaseClient(env, authHeader);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return { userId: user.id, user };
}

// Verify request has valid auth
export async function requireAuth(
  env: Env, 
  request: Request
): Promise<{ userId: string; user: any } | Response> {
  const auth = await getUserFromAuth(env, request);
  
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return auth;
}
