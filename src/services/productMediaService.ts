import { supabase } from "@/integrations/supabase/client";

export interface ProductMedia {
  id: string;
  user_id: string;
  product_id: string;
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
  // Get all media for user's products
  async getAllMedia(): Promise<ProductMedia[]> {
    const userId = getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from("product_media")
      .select(`
        *,
        product:products(id, name, image_url)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
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
        ...input,
        user_id: userId,
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

  // Get media stats
  async getStats(): Promise<{ totalMedia: number; totalImages: number; totalVideos: number; productsWithMedia: number }> {
    const userId = getUserId();
    if (!userId) return { totalMedia: 0, totalImages: 0, totalVideos: 0, productsWithMedia: 0 };

    const { data, error } = await supabase
      .from("product_media")
      .select("id, media_type, product_id")
      .eq("user_id", userId);

    if (error) {
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
