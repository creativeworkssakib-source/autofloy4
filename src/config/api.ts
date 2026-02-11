/**
 * API Configuration
 * 
 * Architecture:
 * - WORKER_API_URL: Cloudflare Worker handles ALL business logic (auth, automation, products, etc.)
 * - SUPABASE_URL: Used ONLY for direct database reads via Supabase SDK (no edge functions)
 * 
 * To switch to your deployed Cloudflare Worker, update WORKER_API_URL below
 * or set VITE_WORKER_API_URL in your environment.
 */

// Cloudflare Worker URL - all API requests go here
// During development, falls back to Supabase Edge Functions URL
export const WORKER_API_URL = import.meta.env.VITE_WORKER_API_URL 
  || "https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1";

// Supabase URL - ONLY for direct SDK database access (no business logic)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL 
  || "https://klkrzfwvrmffqkmkyqrh.supabase.co";

export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsa3J6Znd2cm1mZnFrbWt5cXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTE4MjcsImV4cCI6MjA4MTQ2NzgyN30.ZArRZTr6tGhhnptPXvq7Onn4OhMLxrF7FvKkYC26nXg";

/**
 * Build full API endpoint URL
 * Routes through Cloudflare Worker for all business logic
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${WORKER_API_URL}/${cleanEndpoint}`;
}

/**
 * Check if we're using Cloudflare Workers (not Supabase Edge Functions fallback)
 */
export function isUsingCloudflareWorkers(): boolean {
  return !WORKER_API_URL.includes('supabase.co');
}
