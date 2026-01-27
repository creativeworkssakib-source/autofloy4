import { supabase } from "@/integrations/supabase/client";

export type ProductSourceType = "physical" | "digital";

export interface ProductMedia {
  id: string;
  user_id: string;
  product_id: string;
  product_source: ProductSourceType; // Which table the product comes from
  media_type: "image" | "video";
  file_url: string;
  file_path?: string;
  file_name?: string;
  file_size_bytes?: number;
  thumbnail_url?: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined product info
  product?: {
    id: string;
    name: string;
    image_url?: string;
    product_type?: string; // For digital products
  };
}

const getUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem("autofloy_current_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    const userId = localStorage.getItem("autofloy_user_id");
    if (userId) return userId;
    return null;
  } catch {
    return null;
  }
};

export const productMediaService = {
  // Get all media for user's products, filtered by source type
  async getAllMedia(sourceType: ProductSourceType = "physical"): Promise<ProductMedia[]> {
    const userId = getUserId();
    if (!userId) return [];

    // For now we'll filter by product_source column
    // If column doesn't exist yet, we'll default to physical
    const { data, error } = await supabase
      .from("product_media")
      .select(`
        *,
        product:products(id, name, image_url)
      `)
      .eq("user_id", userId)
      .eq("product_source", sourceType)
      .order("created_at", { ascending: false });

    if (error) {
      // If product_source column doesn't exist, try without filter (backwards compat)
      if (error.message?.includes("product_source")) {
        const { data: fallbackData } = await supabase
          .from("product_media")
          .select(`
            *,
            product:products(id, name, image_url)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        return (fallbackData || []) as unknown as ProductMedia[];
      }
      console.error("Error fetching product media:", error);
      return [];
    }

    return (data || []) as unknown as ProductMedia[];
  },

  // Get media for a specific product
  async getMediaByProduct(productId: string): Promise<ProductMedia[]> {
    const { data, error } = await supabase
      .from("product_media")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching product media:", error);
      return [];
    }

    return (data || []) as unknown as ProductMedia[];
  },

  // Upload media file to storage
  async uploadFile(file: File, productId: string): Promise<{ url: string; path: string } | null> {
    const userId = getUserId();
    if (!userId) return null;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${productId}/${fileName}`;

    const { error } = await supabase.storage
      .from("product-media")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Error uploading file:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("product-media")
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  },

  // Create media record
  async createMedia(input: {
    product_id: string;
    product_source?: ProductSourceType;
    media_type: "image" | "video";
    file_url: string;
    file_path?: string;
    file_name?: string;
    file_size_bytes?: number;
    thumbnail_url?: string;
    description?: string;
  }): Promise<ProductMedia | null> {
    const userId = getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from("product_media")
      .insert({
        product_id: input.product_id,
        media_type: input.media_type,
        file_url: input.file_url,
        file_path: input.file_path,
        file_name: input.file_name,
        file_size_bytes: input.file_size_bytes,
        thumbnail_url: input.thumbnail_url,
        description: input.description,
        user_id: userId,
        product_source: input.product_source || "physical",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating product media:", error);
      return null;
    }

    return data as unknown as ProductMedia;
  },

  // Delete media
  async deleteMedia(id: string, filePath?: string): Promise<boolean> {
    // Delete from storage if path provided
    if (filePath) {
      await supabase.storage.from("product-media").remove([filePath]);
    }

    const { error } = await supabase
      .from("product_media")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting product media:", error);
      return false;
    }

    return true;
  },

  // Update media description
  async updateMedia(id: string, updates: { description?: string; sort_order?: number }): Promise<boolean> {
    const { error } = await supabase
      .from("product_media")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating product media:", error);
      return false;
    }

    return true;
  },

  // Get media stats filtered by source type
  async getStats(sourceType: ProductSourceType = "physical"): Promise<{ totalMedia: number; totalImages: number; totalVideos: number; productsWithMedia: number }> {
    const userId = getUserId();
    if (!userId) return { totalMedia: 0, totalImages: 0, totalVideos: 0, productsWithMedia: 0 };

    let query = supabase
      .from("product_media")
      .select("id, media_type, product_id, product_source")
      .eq("user_id", userId);
    
    // Try to filter by product_source
    query = query.eq("product_source", sourceType);

    const { data, error } = await query;

    if (error) {
      // If product_source column doesn't exist, fallback
      if (error.message?.includes("product_source")) {
        const { data: fallbackData } = await supabase
          .from("product_media")
          .select("id, media_type, product_id")
          .eq("user_id", userId);
        
        const totalMedia = fallbackData?.length || 0;
        const totalImages = fallbackData?.filter(m => m.media_type === "image").length || 0;
        const totalVideos = fallbackData?.filter(m => m.media_type === "video").length || 0;
        const productsWithMedia = new Set(fallbackData?.map(m => m.product_id)).size;
        return { totalMedia, totalImages, totalVideos, productsWithMedia };
      }
      console.error("Error fetching media stats:", error);
      return { totalMedia: 0, totalImages: 0, totalVideos: 0, productsWithMedia: 0 };
    }

    const totalMedia = data?.length || 0;
    const totalImages = data?.filter(m => m.media_type === "image").length || 0;
    const totalVideos = data?.filter(m => m.media_type === "video").length || 0;
    const productsWithMedia = new Set(data?.map(m => m.product_id)).size;

    return { totalMedia, totalImages, totalVideos, productsWithMedia };
  },

  // Get media for AI usage (by product IDs)
  async getMediaForProducts(productIds: string[]): Promise<ProductMedia[]> {
    if (!productIds.length) return [];

    const { data, error } = await supabase
      .from("product_media")
      .select("*")
      .in("product_id", productIds)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching media for products:", error);
      return [];
    }

    return (data || []) as unknown as ProductMedia[];
  },
};
