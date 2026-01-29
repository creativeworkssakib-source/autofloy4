/**
 * App Version API
 * 
 * Returns the current app version for PWA update detection.
 * This endpoint is NEVER cached, ensuring PWAs always get the latest version.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CRITICAL: Update this on every deployment!
// This is the single source of truth for app version
const APP_VERSION = "2.0.4";
const BUILD_NUMBER = 20250129001; // YYYYMMDDnnn format (with increment)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, pragma",
  // CRITICAL: Never cache this response
  "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const response = {
      version: APP_VERSION,
      buildNumber: BUILD_NUMBER,
      timestamp: new Date().toISOString(),
      forceUpdate: false, // Set to true to force immediate update
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in app-version:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
