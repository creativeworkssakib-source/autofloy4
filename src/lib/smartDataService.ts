/**
 * Smart Data Service v2
 * 
 * Provides a unified interface for data access that automatically chooses
 * the right strategy based on platform and online status:
 * 
 * - Browser: Direct Supabase access (server-first, no local storage)
 * - PWA/APK/EXE Online: Server-first, save to local, show from local after sync
 * - PWA/APK/EXE Offline: Local-first, queue for sync when online
 * 
 * Key principle: When online, data ALWAYS goes through server first to maintain consistency
 */

import { offlineDB } from './offlineDB';
import { offlineShopService } from '@/services/offlineShopService';
import { syncManager } from '@/services/syncManager';
import { realtimeSyncManager } from './realtimeSync';
import { platformDetector, shouldUseLocalFirst } from './platformDetection';

type DataListener = (data: any) => void;

interface SmartDataOptions {
  forceLocal?: boolean;
  skipCache?: boolean;
}

class SmartDataService {
  private initialized = false;
  private initializingPromise: Promise<void> | null = null;
  private shopId: string | null = null;
  private userId: string | null = null;
  private listeners: Map<string, Set<DataListener>> = new Map();
  private dataCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds cache TTL
  private initialSyncDone = false;
  
  /**
   * Initialize the smart data service
   * Returns a promise that resolves when initialization is complete
   */
  async init(shopId: string, userId: string): Promise<void> {
    // If already initialized with same shopId, return immediately
    if (this.initialized && this.shopId === shopId) {
      return;
    }
    
    // If currently initializing, wait for that to complete
    if (this.initializingPromise) {
      await this.initializingPromise;
      // Check again if we're now initialized with correct shopId
      if (this.initialized && this.shopId === shopId) {
        return;
      }
    }
    
    // Start new initialization
    this.initializingPromise = this.doInit(shopId, userId);
    await this.initializingPromise;
    this.initializingPromise = null;
  }
  
  private async doInit(shopId: string, userId: string): Promise<void> {
    console.log('[SmartData] Initializing with shopId:', shopId);
    
    // Clear cache if shopId changed
    if (this.shopId && this.shopId !== shopId) {
      this.clearCache();
      this.initialSyncDone = false;
    }
    
    this.shopId = shopId;
    this.userId = userId;
    
    // Initialize offline DB
    await offlineDB.init();
    
    // For installed apps (PWA/APK/EXE), set up real-time sync
    if (shouldUseLocalFirst()) {
      await realtimeSyncManager.init(shopId, userId);
      
      // Start auto-sync for background syncing when online
      syncManager.startAutoSync(60000); // Every 60 seconds
      
      // Subscribe to real-time updates to clear cache
      realtimeSyncManager.subscribe(() => {
        this.clearCache();
        this.notifyAllListeners();
      });
      
      // If online, do initial full sync to populate local DB
      if (navigator.onLine && !this.initialSyncDone) {
        console.log('[SmartData] Online - performing initial sync');
        // Don't await - let it run in background
        this.performInitialSync();
      }
      
      console.log('[SmartData] Initialized for installed app (PWA/APK/EXE)');
    } else {
      console.log('[SmartData] Initialized for browser (server-first only)');
    }
    
    // Listen for online/offline events
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    this.initialized = true;
  }
  
  /**
   * Ensure service is initialized before any operation
   */
  private async ensureInitialized(): Promise<boolean> {
    if (this.initialized && this.shopId) {
      return true;
    }
    
    // Try to get from localStorage
    const shopId = localStorage.getItem('autofloy_current_shop_id');
    const userId = localStorage.getItem('autofloy_user_id');
    
    if (shopId && userId) {
      await this.init(shopId, userId);
      return true;
    }
    
    return false;
  }
  
  /**
   * Perform initial sync - pull all data from server to local DB
   */
  private async performInitialSync(): Promise<void> {
    if (!this.shopId || this.initialSyncDone) return;
    
    try {
      console.log('[SmartData] Starting initial sync...');
      await syncManager.fullSync(this.shopId);
      this.initialSyncDone = true;
      console.log('[SmartData] Initial sync complete');
    } catch (error) {
      console.error('[SmartData] Initial sync failed:', error);
    }
  }
  
  /**
   * Handle coming online
   */
  private handleOnline = async (): Promise<void> => {
    console.log('[SmartData] Online - syncing data');
    
    // Clear cache to get fresh data
    this.clearCache();
    
    if (shouldUseLocalFirst() && this.shopId) {
      // First push any pending local changes
      await syncManager.sync();
      
      // Then pull fresh data from server
      await syncManager.fullSync(this.shopId);
    }
    
    // Notify all listeners to refresh
    this.notifyAllListeners();
  };
  
  /**
   * Handle going offline
   */
  private handleOffline = (): void => {
    console.log('[SmartData] Offline - using local data');
    this.notifyAllListeners();
  };
  
  /**
   * Get dashboard data with smart strategy
   */
  async getDashboard(range: 'today' | 'week' | 'month' = 'today'): Promise<any> {
    // Ensure we're initialized
    const ready = await this.ensureInitialized();
    if (!ready) {
      console.warn('[SmartData] Not initialized, returning empty dashboard');
      return this.getEmptyDashboard();
    }
    
    const cacheKey = `dashboard-${this.shopId}-${range}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    const isLocalFirstPlatform = shouldUseLocalFirst();
    const isOnline = navigator.onLine;
    
    console.log(`[SmartData] getDashboard - Platform: ${isLocalFirstPlatform ? 'PWA/APK/EXE' : 'Browser'}, Online: ${isOnline}`);
    
    // STRATEGY:
    // 1. Browser: Always server-first
    // 2. PWA/APK/EXE + Online: Server-first, save to local
    // 3. PWA/APK/EXE + Offline: Local-first
    
    if (isOnline) {
      try {
        // Always try server first when online
        console.log('[SmartData] Fetching dashboard from server...');
        const serverData = await offlineShopService.getDashboard(range);
        
        if (serverData) {
          console.log('[SmartData] Got server dashboard data:', Object.keys(serverData));
          this.setCache(cacheKey, { ...serverData, fromLocal: false });
          return { ...serverData, fromLocal: false };
        }
      } catch (error) {
        console.warn('[SmartData] Server fetch failed:', error);
        
        // If local-first platform, fall back to local data
        if (isLocalFirstPlatform && this.shopId) {
          console.log('[SmartData] Falling back to local dashboard');
          const localData = await this.calculateLocalDashboard(range);
          return { ...localData, fromLocal: true };
        }
        throw error;
      }
    } else if (isLocalFirstPlatform && this.shopId) {
      // Offline + local-first platform: use local data
      console.log('[SmartData] Offline - using local dashboard');
      return this.calculateLocalDashboard(range);
    }
    
    // Browser + Offline: return empty dashboard
    console.warn('[SmartData] Browser offline - returning empty dashboard');
    return this.getEmptyDashboard();
  }
  
  /**
   * Get empty dashboard structure
   */
  private getEmptyDashboard(): any {
    return {
      period: {
        totalSales: 0,
        totalExpenses: 0,
        totalPurchases: 0,
        grossProfit: 0,
        netProfit: 0,
        customersServed: 0,
      },
      lifetime: {
        totalSales: 0,
        totalProfit: 0,
        totalProducts: 0,
        totalSuppliers: 0,
        totalDue: 0,
      },
      totalProducts: 0,
      totalCustomers: 0,
      lowStockProducts: [],
      recentSales: [],
      recentProducts: [],
      returns: {
        totalCount: 0,
        totalRefundAmount: 0,
        processedCount: 0,
        pendingCount: 0,
        topReasons: [],
      },
      fromLocal: false,
    };
  }
  
  /**
   * Calculate dashboard from local IndexedDB data
   */
  private async calculateLocalDashboard(range: 'today' | 'week' | 'month'): Promise<any> {
    await offlineDB.init();
    if (!this.shopId) throw new Error('Shop ID not set');
    
    const now = new Date();
    let startDate: string;
    const endDate = now.toISOString().split('T')[0];
    
    if (range === 'today') {
      startDate = endDate;
    } else if (range === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
    } else {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString().split('T')[0];
    }
    
    // Fetch all data from local DB in parallel
    const [sales, expenses, purchases, products, customers, returns, loans] = await Promise.all([
      offlineDB.getSales(this.shopId, startDate, endDate),
      offlineDB.getExpenses(this.shopId, startDate, endDate),
      offlineDB.getPurchases(this.shopId, startDate, endDate),
      offlineDB.getProducts(this.shopId),
      offlineDB.getCustomers(this.shopId),
      offlineDB.getReturns(this.shopId),
      offlineDB.getLoans(this.shopId),
    ]);
    
    // Calculate stats
    const totalSales = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
    const totalReturns = returns.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
    const profit = totalSales - totalExpenses - totalReturns;
    const totalDue = customers.reduce((sum, c) => sum + Number(c.total_due || 0), 0);
    
    // Active loans
    const activeLoans = loans.filter(l => l.status === 'active');
    const totalLoanAmount = activeLoans.reduce((sum, l) => sum + Number(l.remaining_amount || 0), 0);
    
    // Low stock items
    const lowStockItems = products.filter(p => 
      p.stock_quantity <= (p.min_stock_alert || 5) && p.is_active
    );
    
    // Recent sales (last 5)
    const recentSales = [...sales]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
    
    return {
      period: {
        totalSales,
        totalExpenses,
        totalPurchases,
        grossProfit: profit,
        netProfit: profit,
        customersServed: sales.length,
      },
      lifetime: {
        totalSales,
        totalProfit: profit,
        totalProducts: products.length,
        totalSuppliers: 0,
        totalDue,
      },
      totalProducts: products.length,
      totalCustomers: customers.length,
      lowStockProducts: lowStockItems,
      recentSales,
      recentProducts: products.slice(0, 5),
      returns: {
        totalCount: returns.length,
        totalRefundAmount: totalReturns,
        processedCount: returns.length,
        pendingCount: 0,
        topReasons: [],
      },
      fromLocal: true,
    };
  }
  
  /**
   * Get products with smart strategy
   */
  async getProducts(options?: SmartDataOptions): Promise<{ products: any[]; fromCache: boolean }> {
    const cacheKey = 'products';
    
    if (!options?.skipCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return { products: cached, fromCache: true };
    }
    
    const isLocalFirstPlatform = shouldUseLocalFirst();
    const isOnline = navigator.onLine;
    
    if (isOnline && !options?.forceLocal) {
      try {
        // Server-first when online
        const result = await offlineShopService.getProducts();
        
        // If local-first platform, save to local DB
        if (isLocalFirstPlatform && this.shopId) {
          await offlineDB.bulkSaveProducts(result.products.map(p => ({
            ...p,
            shop_id: this.shopId!,
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          })));
        }
        
        this.setCache(cacheKey, result.products);
        return { products: result.products, fromCache: false };
      } catch (error) {
        console.warn('[SmartData] Server fetch failed for products:', error);
        
        if (isLocalFirstPlatform && this.shopId) {
          const localProducts = await offlineDB.getProducts(this.shopId);
          return { products: localProducts, fromCache: true };
        }
        throw error;
      }
    } else if (isLocalFirstPlatform && this.shopId) {
      // Offline: use local data
      const localProducts = await offlineDB.getProducts(this.shopId);
      return { products: localProducts, fromCache: true };
    }
    
    throw new Error('Cannot fetch products - offline and no local data available');
  }
  
  /**
   * Get sales with smart strategy
   */
  async getSales(startDate?: string, endDate?: string, options?: SmartDataOptions): Promise<{ sales: any[]; fromCache: boolean }> {
    const cacheKey = `sales-${startDate}-${endDate}`;
    
    if (!options?.skipCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return { sales: cached, fromCache: true };
    }
    
    const isLocalFirstPlatform = shouldUseLocalFirst();
    const isOnline = navigator.onLine;
    
    if (isOnline && !options?.forceLocal) {
      try {
        const result = await offlineShopService.getSales({ startDate, endDate });
        
        // Save to local if local-first platform
        if (isLocalFirstPlatform && this.shopId) {
          for (const sale of result.sales) {
            await offlineDB.saveSale({
              ...sale,
              shop_id: this.shopId,
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
          }
        }
        
        this.setCache(cacheKey, result.sales);
        return { sales: result.sales, fromCache: false };
      } catch (error) {
        console.warn('[SmartData] Server fetch failed for sales:', error);
        
        if (isLocalFirstPlatform && this.shopId) {
          const localSales = await offlineDB.getSales(this.shopId, startDate, endDate);
          return { sales: localSales, fromCache: true };
        }
        throw error;
      }
    } else if (isLocalFirstPlatform && this.shopId) {
      const localSales = await offlineDB.getSales(this.shopId, startDate, endDate);
      return { sales: localSales, fromCache: true };
    }
    
    throw new Error('Cannot fetch sales - offline and no local data available');
  }
  
  /**
   * Get customers with smart strategy
   */
  async getCustomers(options?: SmartDataOptions): Promise<{ customers: any[]; fromCache: boolean }> {
    const cacheKey = 'customers';
    
    if (!options?.skipCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return { customers: cached, fromCache: true };
    }
    
    const isLocalFirstPlatform = shouldUseLocalFirst();
    const isOnline = navigator.onLine;
    
    if (isOnline && !options?.forceLocal) {
      try {
        const result = await offlineShopService.getCustomers();
        
        if (isLocalFirstPlatform && this.shopId) {
          for (const cust of result.customers) {
            await offlineDB.saveCustomer({
              ...cust,
              shop_id: this.shopId,
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
          }
        }
        
        this.setCache(cacheKey, result.customers);
        return { customers: result.customers, fromCache: false };
      } catch (error) {
        console.warn('[SmartData] Server fetch failed for customers:', error);
        
        if (isLocalFirstPlatform && this.shopId) {
          const localCustomers = await offlineDB.getCustomers(this.shopId);
          return { customers: localCustomers, fromCache: true };
        }
        throw error;
      }
    } else if (isLocalFirstPlatform && this.shopId) {
      const localCustomers = await offlineDB.getCustomers(this.shopId);
      return { customers: localCustomers, fromCache: true };
    }
    
    throw new Error('Cannot fetch customers - offline and no local data available');
  }
  
  /**
   * Get expenses with smart strategy
   */
  async getExpenses(startDate?: string, endDate?: string, options?: SmartDataOptions): Promise<{ expenses: any[]; fromCache: boolean }> {
    const cacheKey = `expenses-${startDate}-${endDate}`;
    
    if (!options?.skipCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return { expenses: cached, fromCache: true };
    }
    
    const isLocalFirstPlatform = shouldUseLocalFirst();
    const isOnline = navigator.onLine;
    
    if (isOnline && !options?.forceLocal) {
      try {
        const result = await offlineShopService.getExpenses({ startDate, endDate });
        
        if (isLocalFirstPlatform && this.shopId) {
          for (const exp of result.expenses) {
            await offlineDB.saveExpense({
              ...exp,
              shop_id: this.shopId,
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
          }
        }
        
        this.setCache(cacheKey, result.expenses);
        return { expenses: result.expenses, fromCache: false };
      } catch (error) {
        console.warn('[SmartData] Server fetch failed for expenses:', error);
        
        if (isLocalFirstPlatform && this.shopId) {
          const localExpenses = await offlineDB.getExpenses(this.shopId, startDate, endDate);
          return { expenses: localExpenses, fromCache: true };
        }
        throw error;
      }
    } else if (isLocalFirstPlatform && this.shopId) {
      const localExpenses = await offlineDB.getExpenses(this.shopId, startDate, endDate);
      return { expenses: localExpenses, fromCache: true };
    }
    
    throw new Error('Cannot fetch expenses - offline and no local data available');
  }
  
  /**
   * Get loans with smart strategy
   */
  async getLoans(options?: SmartDataOptions): Promise<{ loans: any[]; fromCache: boolean }> {
    const cacheKey = 'loans';
    
    if (!options?.skipCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return { loans: cached, fromCache: true };
    }
    
    const isLocalFirstPlatform = shouldUseLocalFirst();
    const isOnline = navigator.onLine;
    
    if (isOnline && !options?.forceLocal) {
      try {
        const token = localStorage.getItem('autofloy_token');
        if (!token) throw new Error('Not authenticated');
        
        const baseUrl = import.meta.env.VITE_SUPABASE_URL;
        const shopId = localStorage.getItem('autofloy_current_shop_id');
        const response = await fetch(`${baseUrl}/functions/v1/shop-loans?shop_id=${shopId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!response.ok) throw new Error('Failed to fetch loans');
        const data = await response.json();
        
        if (isLocalFirstPlatform && this.shopId) {
          for (const loan of (data.loans || [])) {
            await offlineDB.saveLoan({
              ...loan,
              shop_id: this.shopId,
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
          }
        }
        
        this.setCache(cacheKey, data.loans);
        return { loans: data.loans || [], fromCache: false };
      } catch (error) {
        console.warn('[SmartData] Server fetch failed for loans:', error);
        
        if (isLocalFirstPlatform && this.shopId) {
          const localLoans = await offlineDB.getLoans(this.shopId);
          return { loans: localLoans, fromCache: true };
        }
        throw error;
      }
    } else if (isLocalFirstPlatform && this.shopId) {
      const localLoans = await offlineDB.getLoans(this.shopId);
      return { loans: localLoans, fromCache: true };
    }
    
    throw new Error('Cannot fetch loans - offline and no local data available');
  }
  
  /**
   * Create a sale with smart strategy
   * Online: Send to server first, then save locally
   * Offline: Save locally, queue for sync
   */
  async createSale(saleData: any): Promise<{ sale: any; offline: boolean }> {
    this.clearCache('sales');
    this.clearCache('products');
    this.clearCache('customers');
    this.clearCache('dashboard');
    
    const isLocalFirstPlatform = shouldUseLocalFirst();
    const isOnline = navigator.onLine;
    
    if (isOnline) {
      // Server-first when online
      const result = await offlineShopService.createSale(saleData);
      
      // Save to local if local-first platform
      if (isLocalFirstPlatform && this.shopId) {
        await offlineDB.saveSale({
          ...result.sale,
          shop_id: this.shopId,
          _locallyModified: false,
          _locallyCreated: false,
          _locallyDeleted: false,
        });
      }
      
      return { sale: result.sale, offline: false };
    } else if (isLocalFirstPlatform) {
      // Offline: save locally and queue
      const { offlineDataService } = await import('@/services/offlineDataService');
      return offlineDataService.createSale(saleData);
    }
    
    throw new Error('Cannot create sale - offline and not on local-first platform');
  }
  
  /**
   * Create a product with smart strategy
   */
  async createProduct(productData: any): Promise<{ product: any; offline: boolean }> {
    this.clearCache('products');
    this.clearCache('dashboard');
    
    const isLocalFirstPlatform = shouldUseLocalFirst();
    const isOnline = navigator.onLine;
    
    if (isOnline) {
      const result = await offlineShopService.createProduct(productData);
      
      if (isLocalFirstPlatform && this.shopId) {
        await offlineDB.saveProduct({
          ...result.product,
          shop_id: this.shopId,
          _locallyModified: false,
          _locallyCreated: false,
          _locallyDeleted: false,
        });
      }
      
      return { product: result.product, offline: false };
    } else if (isLocalFirstPlatform) {
      const { offlineDataService } = await import('@/services/offlineDataService');
      return offlineDataService.createProduct(productData);
    }
    
    throw new Error('Cannot create product - offline and not on local-first platform');
  }
  
  /**
   * Create an expense with smart strategy
   */
  async createExpense(expenseData: any): Promise<{ expense: any; offline: boolean }> {
    this.clearCache('expenses');
    this.clearCache('dashboard');
    
    const isLocalFirstPlatform = shouldUseLocalFirst();
    const isOnline = navigator.onLine;
    
    if (isOnline) {
      const result = await offlineShopService.createExpense(expenseData);
      
      if (isLocalFirstPlatform && this.shopId) {
        await offlineDB.saveExpense({
          ...result.expense,
          shop_id: this.shopId,
          _locallyModified: false,
          _locallyCreated: false,
          _locallyDeleted: false,
        });
      }
      
      return { expense: result.expense, offline: false };
    } else if (isLocalFirstPlatform) {
      const { offlineDataService } = await import('@/services/offlineDataService');
      return offlineDataService.createExpense(expenseData);
    }
    
    throw new Error('Cannot create expense - offline and not on local-first platform');
  }
  
  /**
   * Force sync all data
   */
  async forceSync(): Promise<void> {
    if (!this.shopId) return;
    
    // Clear all caches
    this.clearCache();
    
    // Push local changes
    await syncManager.sync();
    
    // Pull server data
    await syncManager.fullSync(this.shopId);
    
    // Notify listeners
    this.notifyAllListeners();
  }
  
  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      platform: platformDetector.detect(),
      realtimeSync: realtimeSyncManager.getStatus(),
      syncManager: syncManager.getStatus(),
    };
  }
  
  /**
   * Subscribe to data changes
   */
  subscribe(key: string, listener: DataListener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);
    
    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }
  
  /**
   * Notify listeners for a specific key
   */
  private notifyListeners(key: string, data: any): void {
    this.listeners.get(key)?.forEach(listener => listener(data));
  }
  
  /**
   * Notify all listeners
   */
  private notifyAllListeners(): void {
    for (const [key, listeners] of this.listeners) {
      const cached = this.dataCache.get(key);
      if (cached) {
        listeners.forEach(listener => listener(cached.data));
      }
    }
  }
  
  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    const cached = this.dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }
  
  private setCache(key: string, data: any): void {
    this.dataCache.set(key, { data, timestamp: Date.now() });
    this.notifyListeners(key, data);
  }
  
  private clearCache(prefix?: string): void {
    if (prefix) {
      for (const key of this.dataCache.keys()) {
        if (key.startsWith(prefix)) {
          this.dataCache.delete(key);
        }
      }
    } else {
      this.dataCache.clear();
    }
  }
  
  /**
   * Cleanup
   */
  cleanup(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    realtimeSyncManager.disconnect();
    syncManager.stopAutoSync();
    this.listeners.clear();
    this.dataCache.clear();
    this.initialized = false;
    this.initialSyncDone = false;
  }
}

// Export singleton
export const smartDataService = new SmartDataService();
