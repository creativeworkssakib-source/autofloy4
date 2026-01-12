/**
 * Offline Data Hook
 * 
 * Provides offline-first data access with automatic sync status tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDataService } from '@/services/offlineDataService';
import { syncManager, SyncStatus } from '@/services/syncManager';
import { useIsOnline } from './useOnlineStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

// =============== SYNC STATUS HOOK ===============

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null,
    progress: 0,
  });
  const [isDbReady, setIsDbReady] = useState(false);
  const isMountedRef = useRef(true);
  
  // Safe setState wrapper to prevent updates on unmounted components
  const safeSetStatus = useCallback((newStatus: SyncStatus) => {
    if (isMountedRef.current) {
      setStatus(newStatus);
    }
  }, []);
  
  useEffect(() => {
    isMountedRef.current = true;
    let unsubscribe: (() => void) | null = null;
    let interval: NodeJS.Timeout | null = null;
    
    // Wait for offlineDataService to be initialized before accessing sync status
    const initAndSubscribe = async () => {
      try {
        // Initialize the database if needed
        await offlineDataService.init();
        
        if (!isMountedRef.current) return;
        
        setIsDbReady(true);
        
        // Start auto sync in background (every 30 seconds when online)
        syncManager.startAutoSync(30000);
        
        // If online, immediately trigger a sync to clear any pending items
        if (navigator.onLine) {
          syncManager.sync().catch(() => {});
        }
        
        // Subscribe with safe setter
        unsubscribe = syncManager.subscribe(safeSetStatus);
        
        // Get initial pending count - now safe as DB is initialized
        try {
          const initialStatus = await syncManager.getStatusWithCount();
          if (isMountedRef.current) {
            setStatus(initialStatus);
          }
        } catch (e) {
          console.warn('Failed to get initial sync status:', e);
        }
        
        // Update pending count periodically
        interval = setInterval(() => {
          if (isMountedRef.current) {
            syncManager.updatePendingCount().catch(() => {});
          }
        }, 10000);
      } catch (error) {
        console.warn('Failed to initialize sync status:', error);
      }
    };
    
    initAndSubscribe();
    
    return () => {
      isMountedRef.current = false;
      if (unsubscribe) unsubscribe();
      if (interval) clearInterval(interval);
      // Note: We don't stop auto sync on unmount as other components may need it
    };
  }, [safeSetStatus]);
  
  const triggerSync = useCallback(async () => {
    if (!isDbReady) return { success: false, synced: 0, failed: 0 };
    return syncManager.sync();
  }, [isDbReady]);
  
  const triggerFullSync = useCallback(async (shopId: string) => {
    if (!isDbReady) return { success: false, tables: [] };
    return syncManager.fullSync(shopId);
  }, [isDbReady]);
  
  return {
    ...status,
    isDbReady,
    triggerSync,
    triggerFullSync,
  };
}

// =============== OFFLINE PRODUCTS HOOK ===============

export function useOfflineProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { t } = useLanguage();
  
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await offlineDataService.getProducts();
      setProducts(result.products);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  const createProduct = useCallback(async (data: any) => {
    const result = await offlineDataService.createProduct(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchProducts();
    return result;
  }, [fetchProducts, t]);
  
  const updateProduct = useCallback(async (data: any) => {
    const result = await offlineDataService.updateProduct(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchProducts();
    return result;
  }, [fetchProducts, t]);
  
  const deleteProduct = useCallback(async (id: string) => {
    const result = await offlineDataService.deleteProduct(id);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchProducts();
    return result;
  }, [fetchProducts, t]);
  
  const getProductByBarcode = useCallback(async (barcode: string) => {
    return offlineDataService.getProductByBarcode(barcode);
  }, []);
  
  return {
    products,
    loading,
    error,
    fromCache,
    isOnline,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductByBarcode,
  };
}

// =============== OFFLINE CUSTOMERS HOOK ===============

export function useOfflineCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { t } = useLanguage();
  
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await offlineDataService.getCustomers();
      setCustomers(result.customers);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  
  const createCustomer = useCallback(async (data: any) => {
    const result = await offlineDataService.createCustomer(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchCustomers();
    return result;
  }, [fetchCustomers, t]);
  
  const updateCustomer = useCallback(async (data: any) => {
    const result = await offlineDataService.updateCustomer(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchCustomers();
    return result;
  }, [fetchCustomers, t]);
  
  const deleteCustomer = useCallback(async (id: string) => {
    const result = await offlineDataService.deleteCustomer(id);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchCustomers();
    return result;
  }, [fetchCustomers, t]);
  
  return {
    customers,
    loading,
    error,
    fromCache,
    isOnline,
    refetch: fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}

// =============== OFFLINE SUPPLIERS HOOK ===============

export function useOfflineSuppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { t } = useLanguage();
  
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await offlineDataService.getSuppliers();
      setSuppliers(result.suppliers);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);
  
  const createSupplier = useCallback(async (data: any) => {
    const result = await offlineDataService.createSupplier(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchSuppliers();
    return result;
  }, [fetchSuppliers, t]);
  
  return {
    suppliers,
    loading,
    error,
    fromCache,
    isOnline,
    refetch: fetchSuppliers,
    createSupplier,
  };
}

// =============== OFFLINE SALES HOOK ===============

export function useOfflineSales(startDate?: string, endDate?: string) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { t } = useLanguage();
  
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await offlineDataService.getSales(startDate, endDate);
      setSales(result.sales);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);
  
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);
  
  const createSale = useCallback(async (data: any) => {
    const result = await offlineDataService.createSale(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchSales();
    return result;
  }, [fetchSales, t]);
  
  return {
    sales,
    loading,
    error,
    fromCache,
    isOnline,
    refetch: fetchSales,
    createSale,
  };
}

// =============== OFFLINE EXPENSES HOOK ===============

export function useOfflineExpenses(startDate?: string, endDate?: string) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { t } = useLanguage();
  
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await offlineDataService.getExpenses(startDate, endDate);
      setExpenses(result.expenses);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);
  
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);
  
  const createExpense = useCallback(async (data: any) => {
    const result = await offlineDataService.createExpense(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchExpenses();
    return result;
  }, [fetchExpenses, t]);
  
  return {
    expenses,
    loading,
    error,
    fromCache,
    isOnline,
    refetch: fetchExpenses,
    createExpense,
  };
}

// =============== OFFLINE PURCHASES HOOK ===============

export function useOfflinePurchases(startDate?: string, endDate?: string) {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { t } = useLanguage();
  
  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await offlineDataService.getPurchases(startDate, endDate);
      setPurchases(result.purchases);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);
  
  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);
  
  const createPurchase = useCallback(async (data: any) => {
    const result = await offlineDataService.createPurchase(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchPurchases();
    return result;
  }, [fetchPurchases, t]);
  
  return {
    purchases,
    loading,
    error,
    fromCache,
    isOnline,
    refetch: fetchPurchases,
    createPurchase,
  };
}

// =============== OFFLINE CASH TRANSACTIONS HOOK ===============

export function useOfflineCashTransactions(startDate?: string, endDate?: string) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [cashIn, setCashIn] = useState(0);
  const [cashOut, setCashOut] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { t } = useLanguage();
  
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await offlineDataService.getCashTransactions(startDate, endDate);
      setTransactions(result.transactions);
      setBalance(result.balance);
      setCashIn(result.cashIn);
      setCashOut(result.cashOut);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);
  
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  const createTransaction = useCallback(async (data: any) => {
    const result = await offlineDataService.createCashTransaction(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchTransactions();
    return result;
  }, [fetchTransactions, t]);
  
  return {
    transactions,
    balance,
    cashIn,
    cashOut,
    loading,
    error,
    fromCache,
    isOnline,
    refetch: fetchTransactions,
    createTransaction,
  };
}

// =============== OFFLINE DATA SIZE HOOK ===============

export function useOfflineDataSize() {
  const [dataSize, setDataSize] = useState<{ tables: Record<string, number>; total: number }>({
    tables: {},
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    offlineDataService.getLocalDataSize()
      .then(setDataSize)
      .finally(() => setLoading(false));
  }, []);
  
  return { dataSize, loading };
}

// =============== OFFLINE CATEGORIES HOOK ===============

export function useOfflineCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { t } = useLanguage();
  
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await offlineDataService.getCategories();
      setCategories(result.categories);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  const createCategory = useCallback(async (data: { name: string; description?: string }) => {
    const result = await offlineDataService.createCategory(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchCategories();
    return result;
  }, [fetchCategories, t]);
  
  return {
    categories,
    loading,
    error,
    fromCache,
    isOnline,
    refetch: fetchCategories,
    createCategory,
  };
}

// =============== OFFLINE SETTINGS HOOK ===============

export function useOfflineSettings() {
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await offlineDataService.getSettings();
      setSettings(result.settings);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  
  return {
    settings,
    loading,
    error,
    fromCache,
    isOnline,
    refetch: fetchSettings,
  };
}

// =============== PENDING SYNC COUNT HOOK ===============

export function usePendingSyncCount() {
  const [count, setCount] = useState(0);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    const updateCount = async () => {
      try {
        const pendingCount = await offlineDataService.getPendingSyncCount();
        if (isMountedRef.current) {
          setCount(pendingCount);
        }
      } catch (error) {
        // Silently fail if DB not ready
        console.warn('Failed to get pending sync count:', error);
      }
    };
    
    updateCount();
    
    // Update every 5 seconds
    const interval = setInterval(updateCount, 5000);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);
  
  return count;
}
