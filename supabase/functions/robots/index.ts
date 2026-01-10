import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "text/plain",
};

const SITE_URL = "https://autofloy.com";
const SITEMAP_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/sitemap";

const defaultRobotsTxt = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /admin
Disallow: /dashboard
Disallow: /settings
Disallow: /login
Disallow: /signup

Sitemap: ${SITEMAP_URL}`;

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch custom robots.txt content from SEO settings
    const { data: seoSettings } = await supabase
      .from("seo_settings")
      .select("robots_txt_content, sitemap_enabled")
      .single();

    let robotsTxt = defaultRobotsTxt;

    if (seoSettings?.robots_txt_content && seoSettings.robots_txt_content.trim()) {
      robotsTxt = seoSettings.robots_txt_content;
      
      // Add sitemap URL if enabled and not already present
      if (seoSettings.sitemap_enabled !== false && !robotsTxt.toLowerCase().includes("sitemap:")) {
        robotsTxt += `\n\nSitemap: ${SITEMAP_URL}`;
      }
    }

    console.log("[robots] Serving robots.txt");

    return new Response(robotsTxt, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("[robots] Error serving robots.txt:", error);
    // Return default robots.txt on error
    return new Response(defaultRobotsTxt, {
      headers: corsHeaders,
    });
  }
});
