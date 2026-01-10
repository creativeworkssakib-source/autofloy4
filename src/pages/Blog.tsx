import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Calendar, Clock, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  title_bn?: string;
  excerpt?: string;
  featured_image_url?: string;
  category?: string;
  read_time_minutes: number;
  published_at?: string;
  created_at: string;
}

// Fallback static posts for when database is empty
const staticBlogPosts = [
  {
    id: "1",
    slug: "facebook-automation-sales",
    title: "কিভাবে Facebook Page অটোমেশন আপনার বিক্রি ৩x বাড়াতে পারে",
    title_bn: "How Facebook Page Automation Can 3x Your Sales",
    excerpt: "জানুন কিভাবে AI-powered auto-reply ব্যবহার করে আপনার response time কমিয়ে conversion rate বাড়াবেন। বাস্তব কেস স্টাডি সহ।",
    published_at: "2026-01-02",
    read_time_minutes: 5,
    category: "Automation Tips",
    featured_image_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=400&fit=crop"
  },
  {
    id: "2",
    slug: "digitize-offline-shop",
    title: "অফলাইন দোকান ডিজিটাল করুন: Complete Guide",
    title_bn: "Digitize Your Offline Shop: Complete Guide",
    excerpt: "কাগজের হিসাব থেকে digital POS - কিভাবে আপনার দোকানের সব হিসাব সহজে ডিজিটাল করবেন তার step-by-step গাইড।",
    published_at: "2025-12-28",
    read_time_minutes: 8,
    category: "Shop Management",
    featured_image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop"
  },
  {
    id: "3",
    slug: "voice-message-ai-bengali",
    title: "Voice Message এ কাস্টমার জিজ্ঞেস করছে? AI এখন বাংলায় বুঝতে পারে!",
    title_bn: "Customers Sending Voice Messages? AI Now Understands Bengali!",
    excerpt: "অনেক কাস্টমার voice message পাঠাতে পছন্দ করেন। কিভাবে AutoFloy এই voice messages transcribe করে এবং automatically উত্তর দেয়।",
    published_at: "2025-12-20",
    read_time_minutes: 4,
    category: "AI Features",
    featured_image_url: "https://images.unsplash.com/photo-1589254065878-42c9da997008?w=800&h=400&fit=crop"
  },
  {
    id: "4",
    slug: "sync-online-offline-stock",
    title: "Online আর Offline Stock এক জায়গায়: Sync Feature Guide",
    title_bn: "Unify Online & Offline Stock: Sync Feature Guide",
    excerpt: "Facebook থেকে order আসলে offline stock থেকে কমবে - কিভাবে unified inventory management সেটআপ করবেন।",
    published_at: "2025-12-15",
    read_time_minutes: 6,
    category: "Integration",
    featured_image_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=400&fit=crop"
  }
];

const Blog = () => {
  const { settings } = useSiteSettings();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Posts");

  // Fetch blog posts from database
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts' as any)
          .select('id, slug, title, title_bn, excerpt, featured_image_url, category, read_time_minutes, published_at, created_at')
          .eq('is_published', true)
          .order('published_at', { ascending: false });

        if (error) {
          console.warn('Could not fetch blog posts:', error);
          setBlogPosts(staticBlogPosts as BlogPost[]);
        } else if (data && data.length > 0) {
          setBlogPosts(data as unknown as BlogPost[]);
        } else {
          setBlogPosts(staticBlogPosts as BlogPost[]);
        }
      } catch (err) {
        console.warn('Error fetching blog posts:', err);
        setBlogPosts(staticBlogPosts as BlogPost[]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Build categories from blog posts
  const categories = [
    { name: "All Posts", count: blogPosts.length },
    ...Object.entries(
      blogPosts.reduce((acc, post) => {
        if (post.category) {
          acc[post.category] = (acc[post.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, count]) => ({ name, count }))
  ];

  // Filter posts by category
  const filteredPosts = selectedCategory === "All Posts" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Blog
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Tips & <span className="gradient-text">Insights</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                বাংলাদেশী ব্যবসায়ীদের জন্য automation tips, shop management guides, এবং AI features সম্পর্কে জানুন।
              </p>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-6 px-4 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-4 py-2 rounded-full transition-colors text-sm font-medium ${
                    selectedCategory === category.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No posts found in this category.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {filteredPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    <div className="aspect-video overflow-hidden relative">
                      <img 
                        src={post.featured_image_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=400&fit=crop"} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        {post.category && (
                          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                            {post.category}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(post.published_at || post.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.read_time_minutes} min read
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      {post.title_bn && (
                        <p className="text-sm text-muted-foreground/80 mb-1">{post.title_bn}</p>
                      )}
                      {post.excerpt && (
                        <p className="text-muted-foreground mb-4 text-sm">{post.excerpt}</p>
                      )}
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all text-sm"
                      >
                        Read more <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}

            {/* Coming Soon Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-12 text-center p-8 bg-muted/30 rounded-2xl border border-border"
            >
              <h3 className="text-xl font-semibold mb-2">More Articles Coming Soon!</h3>
              <p className="text-muted-foreground mb-4">
                আমরা নিয়মিত নতুন guides এবং tips publish করি। Subscribe করুন updates পেতে।
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Subscribe
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
