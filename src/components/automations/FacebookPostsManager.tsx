import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Link2, Image, Video, FileText, Package, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FacebookPost {
  id: string;
  post_id: string;
  post_text: string | null;
  media_type: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  linked_product_id: string | null;
  product_detected_name: string | null;
  created_at: string;
  products?: {
    id: string;
    name: string;
    price: number;
  } | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface FacebookPostsManagerProps {
  pageId: string;
  accountId: string;
  userId: string;
}

const FacebookPostsManager = ({ pageId, accountId, userId }: FacebookPostsManagerProps) => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [updatingPostId, setUpdatingPostId] = useState<string | null>(null);

  // Load posts and products
  useEffect(() => {
    loadData();
  }, [pageId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("facebook_posts")
        .select(`
          id,
          post_id,
          post_text,
          media_type,
          media_url,
          thumbnail_url,
          linked_product_id,
          product_detected_name,
          created_at,
          products:linked_product_id (
            id,
            name,
            price
          )
        `)
        .eq("page_id", pageId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (postsError) throw postsError;
      setPosts((postsData as any) || []);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, price")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("name");

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "লোড করতে সমস্যা",
        description: "ডাটা লোড করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncPosts = async () => {
    setIsSyncing(true);
    try {
      const token = localStorage.getItem("autofloy_token");
      const response = await fetch(
        `https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/sync-facebook-posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ pageId, accountId, userId }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "পোস্ট সিঙ্ক হয়েছে",
          description: `${result.synced} টি পোস্ট সিঙ্ক করা হয়েছে, ${result.matched} টি প্রোডাক্টের সাথে ম্যাচ হয়েছে।`,
        });
        loadData();
      } else {
        throw new Error(result.error || "Sync failed");
      }
    } catch (error) {
      console.error("Sync failed:", error);
      toast({
        title: "সিঙ্ক ব্যর্থ",
        description: "পোস্ট সিঙ্ক করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const linkProductToPost = async (postId: string, productId: string | null) => {
    setUpdatingPostId(postId);
    try {
      const { error } = await supabase
        .from("facebook_posts")
        .update({ linked_product_id: productId === "none" ? null : productId })
        .eq("id", postId);

      if (error) throw error;

      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              linked_product_id: productId === "none" ? null : productId,
              products: productId === "none" ? null : products.find(p => p.id === productId) || null
            } 
          : post
      ));

      toast({
        title: "আপডেট হয়েছে",
        description: productId === "none" ? "প্রোডাক্ট লিঙ্ক সরানো হয়েছে।" : "প্রোডাক্ট লিঙ্ক করা হয়েছে।",
      });
    } catch (error) {
      console.error("Failed to link product:", error);
      toast({
        title: "আপডেট ব্যর্থ",
        description: "প্রোডাক্ট লিঙ্ক করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
    } finally {
      setUpdatingPostId(null);
    }
  };

  const getMediaIcon = (mediaType: string | null) => {
    switch (mediaType) {
      case "photo":
      case "image":
        return <Image className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const linkedCount = posts.filter(p => p.linked_product_id).length;

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              পোস্ট-প্রোডাক্ট ম্যাপিং
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {linkedCount}/{posts.length} লিঙ্কড
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={syncPosts}
            disabled={isSyncing}
            className="gap-2"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            সিঙ্ক করুন
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          প্রতিটি পোস্টের সাথে প্রোডাক্ট লিঙ্ক করুন যাতে AI সেই পোস্টে কমেন্ট আসলে সঠিক দাম বলতে পারে।
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>কোনো পোস্ট পাওয়া যায়নি।</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={syncPosts} 
              className="mt-3"
              disabled={isSyncing}
            >
              Facebook থেকে সিঙ্ক করুন
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-background/50"
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                  {post.thumbnail_url ? (
                    <img 
                      src={post.thumbnail_url} 
                      alt="Post thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getMediaIcon(post.media_type)
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2 text-foreground/80">
                    {post.post_text || "(কোনো টেক্সট নেই)"}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {post.product_detected_name && !post.linked_product_id && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <AlertCircle className="h-3 w-3" />
                        সম্ভাব্য: {post.product_detected_name}
                      </Badge>
                    )}
                    {post.linked_product_id && post.products && (
                      <Badge variant="default" className="text-xs gap-1 bg-success/20 text-success border-success/30">
                        <CheckCircle className="h-3 w-3" />
                        {post.products.name} - ৳{post.products.price}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Product Selector */}
                <div className="flex-shrink-0 w-40">
                  <Select
                    value={post.linked_product_id || "none"}
                    onValueChange={(value) => linkProductToPost(post.id, value)}
                    disabled={updatingPostId === post.id}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      {updatingPostId === post.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <SelectValue placeholder="প্রোডাক্ট নির্বাচন" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">কোনো প্রোডাক্ট নেই</SelectItem>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ৳{product.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FacebookPostsManager;
