/**
 * Smart Data Service v3
 * 
 * IMPROVED SYNC STRATEGY:
 * 
 * 1. INSTANT UI: Show local data IMMEDIATELY while syncing in background
 * 2. BIDIRECTIONAL SYNC: LocalDB = Supabase always
 *    - When online: Pull all server data to local, detecting deletions
 *    - Push pending local changes to server
 * 3. 30-SECOND SYNC: Every 30s while online, check for changes
 * 4. USER SEES NOTHING: Sync happens silently in background
 * 
 * Flow:
 * - User opens dashboard → Instant data from localDB
 * - Background: Check Supabase for changes
 * - If changes found → Update localDB → UI auto-refreshes
 * - When offline → Use localDB, queue changes
 * - When back online → Push pending, pull latest
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
  backgroundSync?: boolean; // New: trigger background sync but return cached data immediately
}

class SmartDataService {
  private initialized = false;
  private initializingPromise: Promise<void> | null = null;
  private shopId: string | null = null;
  private userId: string | null = null;
  private listeners: Map<string, Set<DataListener>> = new Map();
  private dataCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 60 seconds cache TTL (increased)
  private initialSyncDone = false;
  private isSyncing = false;
  
  /**
   * Initialize the smart data service
   * NO AUTO-SYNC - only manual sync to prevent UI freezes
   */
  async init(shopId: string, userId: string): Promise<void> {
    if (this.initialized && this.shopId === shopId) {
      return;
    }
    
    if (this.initializingPromise) {
      await this.initializingPromise;
      if (this.initialized && this.shopId === shopId) {
        return;
      }
    }
    
    this.initializingPromise = this.doInit(shopId, userId);
    await this.initializingPromise;
    this.initializingPromise = null;
  }
  
  private async doInit(shopId: string, userId: string): Promise<void> {
    console.log('[SmartData] Initializing with shopId:', shopId, '- NO AUTO-SYNC');
    
    if (this.shopId && this.shopId !== shopId) {
      this.clearCache();
      this.initialSyncDone = false;
    }
    
    this.shopId = shopId;
    this.userId = userId;
    
    // Initialize offline DB first
    await offlineDB.init();
    
    // DISABLED: Real-time sync causes UI freezes
    // await realtimeSyncManager.init(shopId, userId);
    
    // DISABLED: No sync loop - manual sync only
    // this.startSyncLoop();
    
    // DISABLED: No realtime subscription
    // realtimeSyncManager.subscribe(() => {...});
    
    // DISABLED: No initial sync on load - manual only
    // if (navigator.onLine && !this.initialSyncDone) {
    //   this.performInitialSync().catch(console.error);
    // }
    
    // DISABLED: No online/offline event listeners
    // window.addEventListener('online', this.handleOnline);
    // window.addEventListener('offline', this.handleOffline);
    
    console.log('[SmartData] Initialized - MANUAL SYNC ONLY');
    this.initialized = true;
  }
  
  /**
   * Ensure service is initialized
   */
  private async ensureInitialized(): Promise<boolean> {
    if (this.initialized && this.shopId) {
      return true;
    }
    
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
      this.isSyncing = true;
      
      // First push any pending local changes
      await syncManager.sync();
      
      // Then pull everything from server with deletion detection
      await this.pullAllServerData();
      
      this.initialSyncDone = true;
      console.log('[SmartData] Initial sync complete');
      
      // Notify listeners to refresh
      this.clearCache();
      this.notifyAllListeners();
    } catch (error) {
      console.error('[SmartData] Initial sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Perform bidirectional sync - LocalDB = Supabase
   */
  private async performBidirectionalSync(): Promise<void> {
    if (this.isSyncing || !this.shopId) return;
    
    try {
      this.isSyncing = true;
      console.log('[SmartData] Starting bidirectional sync');
      
      // Step 1: Push local pending changes to server
      const pushResult = await syncManager.sync();
      console.log('[SmartData] Push result:', pushResult);
      
      // Step 2: Pull server data with deletion detection
      await this.pullAllServerData();
      
      // Notify listeners of data change
      this.clearCache();
      this.notifyAllListeners();
      
      console.log('[SmartData] Bidirectional sync complete');
    } catch (error) {
      console.error('[SmartData] Bidirectional sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Pull ALL server data and detect deletions
   * Key: If server has 79 items and local has 80, delete the extra one from local
   */
  private async pullAllServerData(): Promise<void> {
    if (!this.shopId) return;
    
    const shopId = this.shopId;
    const userId = this.userId || '';
    
    try {
      // Fetch all data from server in parallel
      const [
        productsRes,
        categoriesRes,
        customersRes,
        suppliersRes,
        salesRes,
        purchasesRes,
        expensesRes,
      ] = await Promise.allSettled([
        offlineShopService.getProducts(),
        offlineShopService.getCategories(),
        offlineShopService.getCustomers(),
        offlineShopService.getSuppliers(),
        offlineShopService.getSales({}),
        offlineShopService.getPurchases(),
        offlineShopService.getExpenses({}),
      ]);
      
      // Process products with deletion detection
      if (productsRes.status === 'fulfilled') {
        await this.syncTableWithDeletions(
          'products',
          productsRes.value.products,
          shopId,
          userId,
          offlineDB.getProducts.bind(offlineDB),
          offlineDB.bulkSaveProducts.bind(offlineDB),
          offlineDB.hardDeleteProduct.bind(offlineDB)
        );
      }
      
      // Process categories
      if (categoriesRes.status === 'fulfilled') {
        await this.syncTableWithDeletions(
          'categories',
          categoriesRes.value.categories,
          shopId,
          userId,
          offlineDB.getCategories.bind(offlineDB),
          offlineDB.bulkSaveCategories.bind(offlineDB),
          offlineDB.hardDeleteCategory.bind(offlineDB)
        );
      }
      
      // Process customers
      if (customersRes.status === 'fulfilled') {
        await this.syncTableWithDeletions(
          'customers',
          customersRes.value.customers,
          shopId,
          userId,
          offlineDB.getCustomers.bind(offlineDB),
          offlineDB.bulkSaveCustomers.bind(offlineDB),
          offlineDB.hardDeleteCustomer.bind(offlineDB)
        );
      }
      
      // Process suppliers
      if (suppliersRes.status === 'fulfilled') {
        await this.syncTableWithDeletions(
          'suppliers',
          suppliersRes.value.suppliers,
          shopId,
          userId,
          offlineDB.getSuppliers.bind(offlineDB),
          offlineDB.bulkSaveSuppliers.bind(offlineDB),
          offlineDB.hardDeleteSupplier.bind(offlineDB)
        );
      }
      
      // Process sales
      if (salesRes.status === 'fulfilled') {
        await this.syncTableWithDeletions(
          'sales',
          salesRes.value.sales,
          shopId,
          userId,
          offlineDB.getSales.bind(offlineDB),
          offlineDB.bulkSaveSales.bind(offlineDB),
          offlineDB.hardDeleteSale.bind(offlineDB)
        );
      }
      
      // Process purchases
      if (purchasesRes.status === 'fulfilled') {
        await this.syncTableWithDeletions(
          'purchases',
          purchasesRes.value.purchases,
          shopId,
          userId,
          offlineDB.getPurchases.bind(offlineDB),
          offlineDB.bulkSavePurchases.bind(offlineDB),
          offlineDB.hardDeletePurchase.bind(offlineDB)
        );
      }
      
      // Process expenses
      if (expensesRes.status === 'fulfilled') {
        await this.syncTableWithDeletions(
          'expenses',
          expensesRes.value.expenses,
          shopId,
          userId,
          offlineDB.getExpenses.bind(offlineDB),
          offlineDB.bulkSaveExpenses.bind(offlineDB),
          offlineDB.hardDeleteExpense.bind(offlineDB)
        );
      }
      
      console.log('[SmartData] All tables synced with deletion detection');
    } catch (error) {
      console.error('[SmartData] Error pulling server data:', error);
    }
  }
  
  /**
   * Sync a table with deletion detection
   * If server has deleted an item, delete it from local too
   */
  private async syncTableWithDeletions<T extends { id: string }>(
    tableName: string,
    serverData: T[],
    shopId: string,
    userId: string,
    getLocal: (shopId: string) => Promise<any[]>,
    bulkSave: (items: any[]) => Promise<void>,
    hardDelete: (id: string) => Promise<void>
  ): Promise<void> {
    try {
      // Get local data
      const localData = await getLocal(shopId);
      const serverIds = new Set(serverData.map(item => item.id));
      const localMap = new Map(localData.map(item => [item.id, item]));
      
      // Find items to delete (in local but not on server AND not locally created)
      const toDelete: string[] = [];
      for (const local of localData) {
        if (!serverIds.has(local.id) && !local._locallyCreated && !local._locallyModified) {
          toDelete.push(local.id);
        }
      }
      
      // Delete items that server has deleted
      for (const id of toDelete) {
        console.log(`[SmartData] Deleting ${tableName} ${id} (deleted from server)`);
        await hardDelete(id);
      }
      
      // Save/update items from server (skip locally modified ones)
      const toSave = serverData
        .filter(item => {
          const local = localMap.get(item.id);
          return !local?._locallyModified && !local?._locallyCreated;
        })
        .map(item => ({
          ...item,
          shop_id: shopId,
          user_id: userId,
          _locallyModified: false,
          _locallyCreated: false,
          _locallyDeleted: false,
        }));
      
      if (toSave.length > 0) {
        await bulkSave(toSave);
      }
      
      console.log(`[SmartData] ${tableName}: saved ${toSave.length}, deleted ${toDelete.length}`);
    } catch (error) {
      console.error(`[SmartData] Error syncing ${tableName}:`, error);
    }
  }
  
  /**
   * Handle coming online
   */
  private handleOnline = async (): Promise<void> => {
    console.log('[SmartData] Online - syncing data');
    
    // Small delay to ensure connection is stable
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Perform bidirectional sync
    await this.performBidirectionalSync();
  };
  
  /**
   * Handle going offline
   */
  private handleOffline = (): void => {
    console.log('[SmartData] Offline - using local data');
    this.notifyAllListeners();
  };
  
  /**
   * Get dashboard data - SERVER-FIRST: Always fetch fresh data from Supabase when online
   * No caching for fresh data - instant real-time updates
   */
  async getDashboard(range: 'today' | 'week' | 'month' = 'today', forceRefresh: boolean = false): Promise<any> {
    const ready = await this.ensureInitialized();
    if (!ready) {
      console.warn('[SmartData] Not initialized, returning empty dashboard');
      return this.getEmptyDashboard();
    }
    
    const cacheKey = `dashboard-${this.shopId}-${range}`;
    const isOnline = navigator.onLine;
    
    // SERVER-FIRST: Always fetch from server when online for REAL-TIME data
    if (isOnline) {
      try {
        console.log('[SmartData] Fetching LIVE dashboard from server...');
        const serverData = await offlineShopService.getDashboardLive(range);
        
        if (serverData) {
          console.log('[SmartData] Got LIVE server dashboard data');
          this.setCache(cacheKey, { ...serverData, fromLocal: false });
          return { ...serverData, fromLocal: false };
        }
      } catch (error) {
        console.warn('[SmartData] Server fetch failed, trying cache:', error);
        // Fallback to cache only if server fails
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          return cached;
        }
      }
    } else {
      // Offline - use cache
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('[SmartData] Returning cached dashboard (offline)');
        return cached;
      }
    }
    
    // Fallback to local DB calculation
    if (this.shopId) {
      try {
        const localData = await this.calculateLocalDashboard(range);
        this.setCache(cacheKey, { ...localData, fromLocal: true });
        return { ...localData, fromLocal: true };
      } catch (localError) {
        console.warn('[SmartData] Local dashboard failed:', localError);
      }
    }
    
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
        
        // If local-first platform, save to local DB with user_id
        if (isLocalFirstPlatform && this.shopId) {
          await offlineDB.bulkSaveProducts(result.products.map(p => ({
            ...p,
            shop_id: this.shopId!,
            user_id: p.user_id || this.userId || '',
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
        
        // Save to local if local-first platform with user_id
        if (isLocalFirstPlatform && this.shopId) {
          for (const sale of result.sales) {
            await offlineDB.saveSale({
              ...sale,
              shop_id: this.shopId,
              user_id: sale.user_id || this.userId || '',
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
              user_id: cust.user_id || this.userId || '',
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
