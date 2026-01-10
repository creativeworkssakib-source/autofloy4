import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

const SITE_URL = "https://autofloy.com";

// Static routes with their priorities and change frequencies
const staticRoutes = [
  { path: "/", priority: 1.0, changefreq: "daily" },
  { path: "/about", priority: 0.8, changefreq: "monthly" },
  { path: "/pricing", priority: 0.9, changefreq: "weekly" },
  { path: "/contact", priority: 0.7, changefreq: "monthly" },
  { path: "/blog", priority: 0.8, changefreq: "daily" },
  { path: "/features", priority: 0.8, changefreq: "weekly" },
  { path: "/help", priority: 0.6, changefreq: "weekly" },
  { path: "/documentation", priority: 0.7, changefreq: "weekly" },
  { path: "/privacy-policy", priority: 0.3, changefreq: "yearly" },
  { path: "/terms-of-service", priority: 0.3, changefreq: "yearly" },
  { path: "/gdpr", priority: 0.3, changefreq: "yearly" },
  { path: "/cookie-policy", priority: 0.3, changefreq: "yearly" },
  { path: "/careers", priority: 0.5, changefreq: "monthly" },
];

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if sitemap is enabled
    const { data: seoSettings } = await supabase
      .from("seo_settings")
      .select("sitemap_enabled")
      .single();

    if (seoSettings && seoSettings.sitemap_enabled === false) {
      return new Response("Sitemap is disabled", { 
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" } 
      });
    }

    // Fetch published blog posts
    const { data: blogPosts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    // Fetch published CMS pages
    const { data: cmsPages } = await supabase
      .from("cms_pages")
      .select("slug, updated_at")
      .eq("is_published", true);

    const now = new Date().toISOString();

    // Build URL entries
    let urlEntries = "";

    // Add static routes
    for (const route of staticRoutes) {
      urlEntries += `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    }

    // Add blog posts
    if (blogPosts) {
      for (const post of blogPosts) {
        const lastmod = post.updated_at || post.published_at || now;
        urlEntries += `
  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }

    // Add CMS pages
    if (cmsPages) {
      for (const page of cmsPages) {
        const lastmod = page.updated_at || now;
        urlEntries += `
  <url>
    <loc>${SITE_URL}/${page.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      }
    }

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    console.log(`[sitemap] Generated sitemap with ${staticRoutes.length + (blogPosts?.length || 0) + (cmsPages?.length || 0)} URLs`);

    return new Response(sitemap, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("[sitemap] Error generating sitemap:", error);
    return new Response("Error generating sitemap", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
