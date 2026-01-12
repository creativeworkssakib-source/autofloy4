/**
 * Smart Data Service
 * 
 * Provides a unified interface for data access that automatically chooses
 * the right strategy based on platform:
 * 
 * - Browser: Direct Supabase access (server-first)
 * - PWA/APK/EXE: Local-first with sync to server
 * 
 * Also handles:
 * - Real-time updates when online
 * - Deduplication of data
 * - Automatic sync on reconnection
 */

import { offlineDB } from './offlineDB';
import { offlineDataService } from '@/services/offlineDataService';
import { offlineShopService } from '@/services/offlineShopService';
import { syncManager } from '@/services/syncManager';
import { realtimeSyncManager } from './realtimeSync';
import { platformDetector, shouldUseLocalFirst } from './platformDetection';

type DataListener = (data: any) => void;

interface SmartDataOptions {
  forceServer?: boolean;
  skipCache?: boolean;
}

class SmartDataService {
  private initialized = false;
  private shopId: string | null = null;
  private userId: string | null = null;
  private listeners: Map<string, Set<DataListener>> = new Map();
  private dataCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds cache TTL
  
  /**
   * Initialize the smart data service
   */
  async init(shopId: string, userId: string): Promise<void> {
    if (this.initialized && this.shopId === shopId) {
      return;
    }
    
    this.shopId = shopId;
    this.userId = userId;
    
    // Initialize offline data service
    offlineDataService.setShopId(shopId);
    offlineDataService.setUserId(userId);
    await offlineDataService.init();
    
    // For installed apps, set up real-time sync
    if (shouldUseLocalFirst()) {
      await realtimeSyncManager.init(shopId, userId);
      
      // Start auto-sync for background syncing
      syncManager.startAutoSync(30000); // Every 30 seconds
      
      // Subscribe to real-time updates to clear cache
      realtimeSyncManager.subscribe(() => {
        this.clearCache();
        this.notifyAllListeners();
      });
      
      console.log('[SmartData] Initialized for installed app (local-first)');
    } else {
      console.log('[SmartData] Initialized for browser (server-first)');
    }
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    this.initialized = true;
  }
  
  /**
   * Handle coming online
   */
  private handleOnline = async (): Promise<void> => {
    console.log('[SmartData] Online - refreshing data');
    
    // Clear cache to get fresh data
    this.clearCache();
    
    if (shouldUseLocalFirst() && this.shopId) {
      // Push pending changes
      await syncManager.sync();
      
      // Pull fresh data
      await syncManager.fullSync(this.shopId);
    }
    
    // Notify all listeners
    this.notifyAllListeners();
  };
  
  /**
   * Handle going offline
   */
  private handleOffline = (): void => {
    console.log('[SmartData] Offline - using local data');
  };
  
  /**
   * Get dashboard data with smart strategy
   */
  async getDashboard(range: 'today' | 'week' | 'month' = 'today'): Promise<any> {
    const cacheKey = `dashboard-${range}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;
    
    if (shouldUseLocalFirst()) {
      // PWA/APK/EXE: Try server first if online, fallback to local
      if (navigator.onLine) {
        try {
          const serverData = await offlineShopService.getDashboard(range);
          if (serverData) {
            this.setCache(cacheKey, serverData);
            return serverData;
          }
        } catch (error) {
          console.warn('[SmartData] Server fetch failed, using local:', error);
        }
      }
      
      // Calculate from local data
      return this.calculateLocalDashboard(range);
    } else {
      // Browser: Always use server
      try {
        const serverData = await offlineShopService.getDashboard(range);
        this.setCache(cacheKey, serverData);
        return serverData;
      } catch (error) {
        console.error('[SmartData] Server fetch failed:', error);
        throw error;
      }
    }
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
      totalSales,
      totalExpenses,
      totalPurchases,
      totalReturns,
      profit,
      salesCount: sales.length,
      customersCount: customers.length,
      productsCount: products.length,
      lowStockItems,
      lowStockCount: lowStockItems.length,
      recentSales,
      totalDue,
      totalLoanAmount,
      activeLoansCount: activeLoans.length,
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
    
    if (shouldUseLocalFirst() && !options?.forceServer) {
      const result = await offlineDataService.getProducts();
      this.setCache(cacheKey, result.products);
      return result;
    } else {
      const result = await offlineShopService.getProducts();
      this.setCache(cacheKey, result.products);
      return { products: result.products, fromCache: false };
    }
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
    
    if (shouldUseLocalFirst() && !options?.forceServer) {
      const result = await offlineDataService.getSales(startDate, endDate);
      this.setCache(cacheKey, result.sales);
      return result;
    } else {
      const result = await offlineShopService.getSales();
      this.setCache(cacheKey, result.sales);
      return { sales: result.sales, fromCache: false };
    }
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
    
    if (shouldUseLocalFirst() && !options?.forceServer) {
      const result = await offlineDataService.getCustomers();
      this.setCache(cacheKey, result.customers);
      return result;
    } else {
      const result = await offlineShopService.getCustomers();
      this.setCache(cacheKey, result.customers);
      return { customers: result.customers, fromCache: false };
    }
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
    
    if (shouldUseLocalFirst() && !options?.forceServer) {
      const result = await offlineDataService.getExpenses(startDate, endDate);
      this.setCache(cacheKey, result.expenses);
      return result;
    } else {
      const result = await offlineShopService.getExpenses();
      this.setCache(cacheKey, result.expenses);
      return { expenses: result.expenses, fromCache: false };
    }
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
    
    if (shouldUseLocalFirst() && !options?.forceServer) {
      const result = await offlineDataService.getLoans();
      this.setCache(cacheKey, result.loans);
      return result;
    } else {
      // Browser: fetch from server
      const token = localStorage.getItem('autofloy_token');
      if (!token) throw new Error('Not authenticated');
      
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${baseUrl}/functions/v1/shop-loans`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch loans');
      const data = await response.json();
      this.setCache(cacheKey, data.loans);
      return { loans: data.loans || [], fromCache: false };
    }
  }
  
  /**
   * Create a sale with smart strategy
   */
  async createSale(saleData: any): Promise<{ sale: any; offline: boolean }> {
    this.clearCache('sales');
    this.clearCache('products'); // Stock changed
    this.clearCache('customers'); // Due might change
    this.clearCache('dashboard');
    
    if (shouldUseLocalFirst()) {
      return offlineDataService.createSale(saleData);
    } else {
      const result = await offlineShopService.createSale(saleData);
      return { sale: result.sale, offline: false };
    }
  }
  
  /**
   * Create a product with smart strategy
   */
  async createProduct(productData: any): Promise<{ product: any; offline: boolean }> {
    this.clearCache('products');
    this.clearCache('dashboard');
    
    if (shouldUseLocalFirst()) {
      return offlineDataService.createProduct(productData);
    } else {
      const result = await offlineShopService.createProduct(productData);
      return { product: result.product, offline: false };
    }
  }
  
  /**
   * Create an expense with smart strategy
   */
  async createExpense(expenseData: any): Promise<{ expense: any; offline: boolean }> {
    this.clearCache('expenses');
    this.clearCache('dashboard');
    
    if (shouldUseLocalFirst()) {
      return offlineDataService.createExpense(expenseData);
    } else {
      const result = await offlineShopService.createExpense(expenseData);
      return { expense: result.expense, offline: false };
    }
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
  }
}

// Export singleton
export const smartDataService = new SmartDataService();
