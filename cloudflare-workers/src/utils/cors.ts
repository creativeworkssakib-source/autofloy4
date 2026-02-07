// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
};

// Handle CORS preflight
export function handleCORS(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

// JSON response helper
export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'application/json' 
    },
  });
}

// Error response helper
export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message, success: false }, status);
}

// Success response helper
export function successResponse<T>(data: T, message?: string): Response {
  return jsonResponse({ 
    success: true, 
    data, 
    message 
  });
}
