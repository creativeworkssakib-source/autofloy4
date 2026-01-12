/**
 * Offline Data Hook
 * 
 * Provides offline-first data access with automatic sync status tracking.
 * 
 * WHEN ONLINE: Always fetch from Supabase server first (LIVE data)
 * WHEN OFFLINE: Use local IndexedDB data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDataService } from '@/services/offlineDataService';
import { offlineShopService } from '@/services/offlineShopService';
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
  
  const deleteProducts = useCallback(async (ids: string[]) => {
    const result = await offlineDataService.deleteProducts(ids);
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
    deleteProducts,
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
  
  const updateSupplier = useCallback(async (data: any) => {
    const result = await offlineDataService.updateSupplier(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchSuppliers();
    return result;
  }, [fetchSuppliers, t]);
  
  const deleteSupplier = useCallback(async (id: string) => {
    const result = await offlineDataService.deleteSupplier(id);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchSuppliers();
    return result;
  }, [fetchSuppliers, t]);
  
  const deleteSuppliers = useCallback(async (ids: string[]) => {
    const result = await offlineDataService.deleteSuppliers(ids);
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
    updateSupplier,
    deleteSupplier,
    deleteSuppliers,
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
      
      // When online, always try server-first for LIVE data
      if (navigator.onLine) {
        try {
          const { sales: serverSales } = await offlineShopService.getSales({ startDate, endDate });
          setSales(serverSales || []);
          setFromCache(false);
          return;
        } catch (serverError) {
          console.warn('[useOfflineSales] Server fetch failed, using offlineDataService:', serverError);
        }
      }
      
      // Offline or server failed - use offlineDataService
      const result = await offlineDataService.getSales(startDate, endDate);
      setSales(result.sales || []);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales');
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);
  
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);
  
  const createSale = useCallback(async (data: any) => {
    // When online, server handles everything and we just refetch
    const result = await offlineDataService.createSale(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchSales();
    return result;
  }, [fetchSales, t]);
  
  const deleteSale = useCallback(async (id: string) => {
    const result = await offlineDataService.deleteSale(id);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchSales();
    return result;
  }, [fetchSales, t]);
  
  const deleteSales = useCallback(async (ids: string[]) => {
    const result = await offlineDataService.deleteSales(ids);
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
    deleteSale,
    deleteSales,
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
      
      // SERVER-FIRST: When online, fetch from Supabase directly
      if (navigator.onLine) {
        try {
          const { expenses: serverExpenses } = await offlineShopService.getExpenses({ startDate, endDate });
          setExpenses(serverExpenses || []);
          setFromCache(false);
          return;
        } catch (serverError) {
          console.warn('[useOfflineExpenses] Server fetch failed, using offlineDataService:', serverError);
        }
      }
      
      // Offline or server failed - use offlineDataService
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
  
  const deleteExpense = useCallback(async (id: string) => {
    const result = await offlineDataService.deleteExpense(id);
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
    deleteExpense,
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
      
      // SERVER-FIRST: When online, fetch from Supabase directly
      if (navigator.onLine) {
        try {
          const { purchases: serverPurchases } = await offlineShopService.getPurchases();
          setPurchases(serverPurchases || []);
          setFromCache(false);
          return;
        } catch (serverError) {
          console.warn('[useOfflinePurchases] Server fetch failed, using offlineDataService:', serverError);
        }
      }
      
      // Offline or server failed - use offlineDataService
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
  
  const deletePurchase = useCallback(async (id: string) => {
    const result = await offlineDataService.deletePurchase(id);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchPurchases();
    return result;
  }, [fetchPurchases, t]);
  
  const deletePurchases = useCallback(async (ids: string[]) => {
    const result = await offlineDataService.deletePurchases(ids);
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
    deletePurchase,
    deletePurchases,
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
      
      // SERVER-FIRST: When online, fetch from Supabase directly
      if (navigator.onLine) {
        try {
          const { transactions: serverTx } = await offlineShopService.getCashTransactions();
          setTransactions(serverTx || []);
          
          // Calculate totals
          let inAmount = 0, outAmount = 0;
          for (const tx of serverTx || []) {
            if (tx.type === 'in') inAmount += Number(tx.amount);
            else outAmount += Number(tx.amount);
          }
          setCashIn(inAmount);
          setCashOut(outAmount);
          setBalance(inAmount - outAmount);
          setFromCache(false);
          return;
        } catch (serverError) {
          console.warn('[useOfflineCashTransactions] Server fetch failed, using offlineDataService:', serverError);
        }
      }
      
      // Offline or server failed - use offlineDataService
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

// =============== OFFLINE LOANS HOOK ===============

export function useOfflineLoans() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { t } = useLanguage();
  
  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // SERVER-FIRST: When online, fetch from Supabase directly
      if (navigator.onLine) {
        try {
          const shopId = localStorage.getItem('autofloy_current_shop_id');
          const token = localStorage.getItem('autofloy_token');
          if (shopId && token) {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shop-loans?shop_id=${shopId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            if (data.loans) {
              setLoans(data.loans);
              setFromCache(false);
              return;
            }
          }
        } catch (serverError) {
          console.warn('[useOfflineLoans] Server fetch failed, using offlineDataService:', serverError);
        }
      }
      
      // Offline or server failed - use offlineDataService
      const result = await offlineDataService.getLoans();
      setLoans(result.loans);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);
  
  const createLoan = useCallback(async (data: any) => {
    const result = await offlineDataService.createLoan(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchLoans();
    return result;
  }, [fetchLoans, t]);
  
  const updateLoan = useCallback(async (data: any) => {
    const result = await offlineDataService.updateLoan(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchLoans();
    return result;
  }, [fetchLoans, t]);
  
  const deleteLoan = useCallback(async (id: string) => {
    const result = await offlineDataService.deleteLoan(id);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchLoans();
    return result;
  }, [fetchLoans, t]);
  
  return {
    loans,
    loading,
    error,
    fromCache,
    isOnline,
    refetch: fetchLoans,
    createLoan,
    updateLoan,
    deleteLoan,
  };
}

// =============== OFFLINE RETURNS HOOK ===============

export function useOfflineReturns(returnType?: 'sale' | 'purchase') {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { t } = useLanguage();
  
  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // SERVER-FIRST: When online, fetch from Supabase directly
      if (navigator.onLine) {
        try {
          const token = localStorage.getItem('autofloy_token');
          if (token) {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shop-returns`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            let serverReturns = data.returns || [];
            if (returnType) {
              serverReturns = serverReturns.filter((r: any) => r.return_type === returnType);
            }
            setReturns(serverReturns);
            setFromCache(false);
            return;
          }
        } catch (serverError) {
          console.warn('[useOfflineReturns] Server fetch failed, using offlineDataService:', serverError);
        }
      }
      
      // Offline or server failed - use offlineDataService
      const result = await offlineDataService.getReturns(returnType);
      setReturns(result.returns);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  }, [returnType]);
  
  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);
  
  const createReturn = useCallback(async (data: any) => {
    const result = await offlineDataService.createReturn(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchReturns();
    return result;
  }, [fetchReturns, t]);
  
  return {
    returns,
    loading,
    error,
    fromCache,
    isOnline,
    refetch: fetchReturns,
    createReturn,
  };
}

// =============== OFFLINE STOCK ADJUSTMENTS HOOK ===============

export function useOfflineStockAdjustments() {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { t } = useLanguage();
  
  const fetchAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // SERVER-FIRST: When online, fetch from Supabase directly
      if (navigator.onLine) {
        try {
          const result = await offlineShopService.getAdjustments({});
          setAdjustments(result.adjustments || []);
          setFromCache(false);
          return;
        } catch (serverError) {
          console.warn('[useOfflineStockAdjustments] Server fetch failed, using offlineDataService:', serverError);
        }
      }
      
      // Offline or server failed - use offlineDataService
      const result = await offlineDataService.getStockAdjustments();
      setAdjustments(result.adjustments);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);
  
  const createAdjustment = useCallback(async (data: any) => {
    const result = await offlineDataService.createStockAdjustment(data);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchAdjustments();
    return result;
  }, [fetchAdjustments, t]);
  
  return {
    adjustments,
    loading,
    error,
    fromCache,
    isOnline,
    refetch: fetchAdjustments,
    createAdjustment,
  };
}

// =============== OFFLINE CASH REGISTER HOOK ===============

export function useOfflineCashRegister() {
  const [registers, setRegisters] = useState<any[]>([]);
  const [todayRegister, setTodayRegister] = useState<any | null>(null);
  const [hasOpenRegister, setHasOpenRegister] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { t } = useLanguage();
  
  const fetchRegisters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // SERVER-FIRST: When online, fetch from Supabase directly
      if (navigator.onLine) {
        try {
          const result = await offlineShopService.getCashRegisters({});
          setRegisters(result.registers || []);
          setTodayRegister(result.todayRegister || null);
          setHasOpenRegister(result.hasOpenRegister || false);
          setFromCache(false);
          return;
        } catch (serverError) {
          console.warn('[useOfflineCashRegister] Server fetch failed, using offlineDataService:', serverError);
        }
      }
      
      // Offline or server failed - use offlineDataService
      const result = await offlineDataService.getCashRegisters();
      setRegisters(result.registers);
      setTodayRegister(result.todayRegister);
      setHasOpenRegister(result.hasOpenRegister);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cash registers');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchRegisters();
  }, [fetchRegisters]);
  
  const openRegister = useCallback(async (openingCash: number, notes?: string) => {
    // When online, call server directly
    if (navigator.onLine) {
      const result = await offlineShopService.openCashRegister(openingCash, notes);
      await fetchRegisters();
      return { register: result.register, offline: false, message: result.message };
    }
    
    const result = await offlineDataService.openCashRegister(openingCash, notes);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchRegisters();
    return result;
  }, [fetchRegisters, t]);
  
  const closeRegister = useCallback(async (closingCash: number, notes?: string) => {
    // When online, call server directly
    if (navigator.onLine) {
      const result = await offlineShopService.closeCashRegister(closingCash, notes);
      await fetchRegisters();
      return { register: result.register, offline: false, message: result.message };
    }
    
    const result = await offlineDataService.closeCashRegister(closingCash, notes);
    if (result.offline) {
      toast.info(t('offline.savedLocally'));
    }
    await fetchRegisters();
    return result;
  }, [fetchRegisters, t]);
  
  return {
    registers,
    todayRegister,
    hasOpenRegister,
    loading,
    error,
    fromCache,
    isOnline,
    refetch: fetchRegisters,
    openRegister,
    closeRegister,
  };
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
      
      // SERVER-FIRST: When online, fetch from Supabase directly
      if (navigator.onLine) {
        try {
          const { categories: serverCategories } = await offlineShopService.getCategories();
          setCategories(serverCategories || []);
          setFromCache(false);
          return;
        } catch (serverError) {
          console.warn('[useOfflineCategories] Server fetch failed, using offlineDataService:', serverError);
        }
      }
      
      // Offline or server failed - use offlineDataService
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
      
      // SERVER-FIRST: When online, fetch from Supabase directly
      if (navigator.onLine) {
        try {
          const { settings: serverSettings } = await offlineShopService.getSettings();
          if (serverSettings) {
            setSettings(serverSettings);
            setFromCache(false);
            return;
          }
        } catch (serverError) {
          console.warn('[useOfflineSettings] Server fetch failed, using offlineDataService:', serverError);
        }
      }
      
      // Offline or server failed - use offlineDataService
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
