import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { authService } from "@/services/authService";
import { toast } from "sonner";

export interface Shop {
  id: string;
  user_id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  is_active: boolean;
  is_default: boolean;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface ShopLimits {
  maxShops: number;
  currentShopCount: number;
  canCreateMore: boolean;
  planName: string;
}

interface ShopContextType {
  shops: Shop[];
  currentShop: Shop | null;
  isLoading: boolean;
  shopLimits: ShopLimits | null;
  selectShop: (shopId: string) => void;
  createShop: (data: Partial<Shop>) => Promise<Shop | null>;
  updateShop: (id: string, data: Partial<Shop>) => Promise<Shop | null>;
  deleteShop: (id: string, cascade?: boolean) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const CURRENT_SHOP_KEY = "autofloy_current_shop_id";
const CACHED_SHOPS_KEY = "autofloy_cached_shops";
const SHOP_API_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/offline-shop/shops";

// Check if online
const isOnline = () => typeof navigator !== 'undefined' && navigator.onLine;

// Get cached shops from localStorage
const getCachedShops = (): { shops: Shop[]; limits: ShopLimits | null } => {
  try {
    const cached = localStorage.getItem(CACHED_SHOPS_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('[ShopContext] Failed to parse cached shops:', e);
  }
  return { shops: [], limits: null };
};

// Save shops to localStorage
const cacheShops = (shops: Shop[], limits: ShopLimits | null) => {
  try {
    localStorage.setItem(CACHED_SHOPS_KEY, JSON.stringify({ shops, limits }));
  } catch (e) {
    console.error('[ShopContext] Failed to cache shops:', e);
  }
};

export function ShopProvider({ children }: { children: ReactNode }) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shopLimits, setShopLimits] = useState<ShopLimits | null>(null);

  const fetchShops = useCallback(async () => {
    try {
      const token = authService.getToken();
      
      // OFFLINE MODE: Use cached shops
      if (!isOnline()) {
        console.log('[ShopContext] Offline - using cached shops');
        const { shops: cachedShops, limits: cachedLimits } = getCachedShops();
        
        if (cachedShops.length > 0) {
          setShops(cachedShops);
          setShopLimits(cachedLimits);
          
          // Restore last selected shop
          const savedShopId = localStorage.getItem(CURRENT_SHOP_KEY);
          const savedShop = cachedShops.find(s => s.id === savedShopId);
          const defaultShop = cachedShops.find(s => s.is_default) || cachedShops[0];
          
          if (savedShop && savedShop.is_active) {
            setCurrentShop(savedShop);
          } else if (defaultShop) {
            setCurrentShop(defaultShop);
          }
        }
        setIsLoading(false);
        return;
      }
      
      // No token - can't fetch
      if (!token) {
        // Try cached shops anyway
        const { shops: cachedShops, limits: cachedLimits } = getCachedShops();
        if (cachedShops.length > 0) {
          setShops(cachedShops);
          setShopLimits(cachedLimits);
          const savedShopId = localStorage.getItem(CURRENT_SHOP_KEY);
          const savedShop = cachedShops.find(s => s.id === savedShopId);
          if (savedShop) setCurrentShop(savedShop);
        }
        setIsLoading(false);
        return;
      }

      const res = await fetch(SHOP_API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const shopList: Shop[] = data.shops || [];
        const limits: ShopLimits = data.limits || null;
        
        setShops(shopList);
        setShopLimits(limits);
        
        // Cache for offline use
        cacheShops(shopList, limits);

        // Restore last selected shop or select default
        const savedShopId = localStorage.getItem(CURRENT_SHOP_KEY);
        const savedShop = shopList.find(s => s.id === savedShopId);
        const defaultShop = shopList.find(s => s.is_default) || shopList[0];
        
        if (savedShop && savedShop.is_active) {
          setCurrentShop(savedShop);
        } else if (defaultShop) {
          setCurrentShop(defaultShop);
          localStorage.setItem(CURRENT_SHOP_KEY, defaultShop.id);
        }
      } else {
        // API failed - try cached shops
        const { shops: cachedShops, limits: cachedLimits } = getCachedShops();
        if (cachedShops.length > 0) {
          console.log('[ShopContext] API failed, using cached shops');
          setShops(cachedShops);
          setShopLimits(cachedLimits);
          const savedShopId = localStorage.getItem(CURRENT_SHOP_KEY);
          const savedShop = cachedShops.find(s => s.id === savedShopId);
          if (savedShop) setCurrentShop(savedShop);
        }
      }
    } catch (error) {
      console.error("Failed to fetch shops:", error);
      // Try cached shops on error
      const { shops: cachedShops, limits: cachedLimits } = getCachedShops();
      if (cachedShops.length > 0) {
        console.log('[ShopContext] Error fetching, using cached shops');
        setShops(cachedShops);
        setShopLimits(cachedLimits);
        const savedShopId = localStorage.getItem(CURRENT_SHOP_KEY);
        const savedShop = cachedShops.find(s => s.id === savedShopId);
        if (savedShop) setCurrentShop(savedShop);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const selectShop = useCallback((shopId: string) => {
    const shop = shops.find(s => s.id === shopId);
    if (shop && shop.is_active) {
      setCurrentShop(shop);
      localStorage.setItem(CURRENT_SHOP_KEY, shopId);
    }
  }, [shops]);

  const createShop = useCallback(async (data: Partial<Shop>): Promise<Shop | null> => {
    // Require online for creating shops
    if (!isOnline()) {
      toast.error("শপ তৈরি করতে ইন্টারনেট সংযোগ প্রয়োজন");
      return null;
    }
    
    try {
      const token = authService.getToken();
      if (!token) return null;

      // Check limits before creating
      if (shopLimits && !shopLimits.canCreateMore) {
        toast.error(`আপনার ${shopLimits.planName} প্ল্যানে সর্বোচ্চ ${shopLimits.maxShops}টি শপ তৈরি করতে পারবেন। আরও শপ যোগ করতে প্ল্যান আপগ্রেড করুন।`);
        return null;
      }

      const res = await fetch(SHOP_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        await fetchShops();
        toast.success("নতুন শপ তৈরি হয়েছে!");
        return result.shop;
      } else {
        const error = await res.json();
        toast.error(error.error || "শপ তৈরি করা যায়নি");
        return null;
      }
    } catch (error) {
      console.error("Failed to create shop:", error);
      toast.error("শপ তৈরি করা যায়নি");
      return null;
    }
  }, [fetchShops, shopLimits]);

  const updateShop = useCallback(async (id: string, data: Partial<Shop>): Promise<Shop | null> => {
    // Require online for updating shops
    if (!isOnline()) {
      toast.error("শপ আপডেট করতে ইন্টারনেট সংযোগ প্রয়োজন");
      return null;
    }
    
    try {
      const token = authService.getToken();
      if (!token) return null;

      const res = await fetch(SHOP_API_URL, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...data }),
      });

      if (res.ok) {
        const result = await res.json();
        await fetchShops();
        toast.success("শপ আপডেট হয়েছে!");
        return result.shop;
      } else {
        const error = await res.json();
        toast.error(error.error || "শপ আপডেট করা যায়নি");
        return null;
      }
    } catch (error) {
      console.error("Failed to update shop:", error);
      toast.error("শপ আপডেট করা যায়নি");
      return null;
    }
  }, [fetchShops]);

  const deleteShop = useCallback(async (id: string, cascade: boolean = true): Promise<boolean> => {
    // Require online for deleting shops
    if (!isOnline()) {
      toast.error("শপ মুছতে ইন্টারনেট সংযোগ প্রয়োজন");
      return false;
    }
    
    try {
      const token = authService.getToken();
      if (!token) return false;

      // Prevent deleting the last shop
      if (shops.length <= 1) {
        toast.error("আপনার কমপক্ষে একটি শপ থাকতে হবে");
        return false;
      }

      const res = await fetch(SHOP_API_URL, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, cascade }),
      });

      if (res.ok) {
        await fetchShops();
        toast.success(cascade 
          ? "শপ এবং সব ডাটা মুছে ফেলা হয়েছে!" 
          : "শপ মুছে ফেলা হয়েছে!"
        );
        return true;
      } else {
        const error = await res.json();
        toast.error(error.error || "শপ মুছে ফেলা যায়নি");
        return false;
      }
    } catch (error) {
      console.error("Failed to delete shop:", error);
      toast.error("শপ মুছে ফেলা যায়নি");
      return false;
    }
  }, [fetchShops, shops.length]);

  return (
    <ShopContext.Provider value={{
      shops,
      currentShop,
      isLoading,
      shopLimits,
      selectShop,
      createShop,
      updateShop,
      deleteShop,
      refetch: fetchShops,
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
