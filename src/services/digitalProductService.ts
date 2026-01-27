import { supabase } from "@/integrations/supabase/client";

export interface DigitalProduct {
  id: string;
  user_id: string;
  shop_id?: string;
  name: string;
  description?: string;
  product_type: "subscription" | "api" | "course" | "software" | "other";
  price: number;
  sale_price?: number;
  currency: string;
  // Credentials
  credential_username?: string;
  credential_password?: string;
  credential_email?: string;
  credential_extra?: Record<string, any>;
  // Files
  file_url?: string;
  file_name?: string;
  file_size_bytes?: number;
  file_type?: string;
  // API
  api_endpoint?: string;
  api_key?: string;
  api_documentation?: string;
  // Course/Content
  access_url?: string;
  access_instructions?: string;
  // Stock
  stock_quantity: number;
  is_unlimited_stock: boolean;
  is_active: boolean;
  total_sold: number;
  created_at: string;
  updated_at: string;
}

export interface DigitalProductSale {
  id: string;
  user_id: string;
  product_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_fb_id?: string;
  sale_price: number;
  payment_method: string;
  payment_status: "pending" | "paid" | "refunded";
  delivery_status: "pending" | "delivered" | "failed";
  delivered_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined product info - includes all digital product fields
  product?: {
    id: string;
    name: string;
    price: number;
    sale_price?: number;
    product_type: string;
    description?: string;
    credential_username?: string;
    credential_password?: string;
    credential_email?: string;
    access_url?: string;
    access_instructions?: string;
    api_endpoint?: string;
    api_key?: string;
    file_url?: string;
    file_name?: string;
  };
}

export interface CreateDigitalProductInput {
  name: string;
  description?: string;
  product_type: DigitalProduct["product_type"];
  price: number;
  sale_price?: number;
  currency?: string;
  credential_username?: string;
  credential_password?: string;
  credential_email?: string;
  credential_extra?: Record<string, any>;
  file_url?: string;
  file_name?: string;
  file_size_bytes?: number;
  file_type?: string;
  api_endpoint?: string;
  api_key?: string;
  api_documentation?: string;
  access_url?: string;
  access_instructions?: string;
  stock_quantity?: number;
  is_unlimited_stock?: boolean;
  is_active?: boolean;
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

export const digitalProductService = {
  async getProducts(): Promise<DigitalProduct[]> {
    const userId = getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from("digital_products")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching digital products:", error);
      return [];
    }

    return (data || []) as unknown as DigitalProduct[];
  },

  async getProduct(id: string): Promise<DigitalProduct | null> {
    const { data, error } = await supabase
      .from("digital_products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching digital product:", error);
      return null;
    }

    return data as unknown as DigitalProduct;
  },

  async createProduct(input: CreateDigitalProductInput): Promise<DigitalProduct | null> {
    const userId = getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from("digital_products")
      .insert({
        ...input,
        user_id: userId,
        currency: input.currency || "BDT",
        stock_quantity: input.stock_quantity ?? 1,
        is_unlimited_stock: input.is_unlimited_stock ?? false,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating digital product:", error);
      return null;
    }

    return data as unknown as DigitalProduct;
  },

  async updateProduct(id: string, input: Partial<CreateDigitalProductInput>): Promise<DigitalProduct | null> {
    const { data, error } = await supabase
      .from("digital_products")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating digital product:", error);
      return null;
    }

    return data as unknown as DigitalProduct;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("digital_products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting digital product:", error);
      return false;
    }

    return true;
  },

  async getSales(): Promise<DigitalProductSale[]> {
    const userId = getUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from("digital_product_sales")
      .select(`
        *,
        product:digital_products(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching digital product sales:", error);
      return [];
    }

    return (data || []) as unknown as DigitalProductSale[];
  },

  async createSale(input: {
    product_id: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    customer_fb_id?: string;
    sale_price: number;
    payment_method?: string;
    payment_status?: string;
    notes?: string;
  }): Promise<DigitalProductSale | null> {
    const userId = getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from("digital_product_sales")
      .insert({
        ...input,
        user_id: userId,
        payment_method: input.payment_method || "cash",
        payment_status: input.payment_status || "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating sale:", error);
      return null;
    }

    // Update product sold count - increment total_sold
    const { data: product } = await supabase
      .from("digital_products")
      .select("total_sold")
      .eq("id", input.product_id)
      .single();
    
    if (product) {
      await supabase
        .from("digital_products")
        .update({ total_sold: (product.total_sold || 0) + 1 })
        .eq("id", input.product_id);
    }

    return data as unknown as DigitalProductSale;
  },

  async updateSale(id: string, input: Partial<{
    payment_status: string;
    delivery_status: string;
    delivered_at: string;
    notes: string;
  }>): Promise<DigitalProductSale | null> {
    const { data, error } = await supabase
      .from("digital_product_sales")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating sale:", error);
      return null;
    }

    return data as unknown as DigitalProductSale;
  },

  async getStats() {
    const userId = getUserId();
    if (!userId) return { totalProducts: 0, totalSales: 0, totalRevenue: 0, pendingDeliveries: 0 };

    const [productsRes, salesRes] = await Promise.all([
      supabase
        .from("digital_products")
        .select("id, total_sold, price", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_active", true),
      supabase
        .from("digital_product_sales")
        .select("sale_price, payment_status, delivery_status", { count: "exact" })
        .eq("user_id", userId),
    ]);

    const products = productsRes.data || [];
    const sales = salesRes.data || [];

    const totalRevenue = sales
      .filter(s => s.payment_status === "paid")
      .reduce((sum, s) => sum + (s.sale_price || 0), 0);

    const pendingDeliveries = sales.filter(s => s.delivery_status === "pending").length;

    return {
      totalProducts: productsRes.count || 0,
      totalSales: salesRes.count || 0,
      totalRevenue,
      pendingDeliveries,
    };
  },
};
