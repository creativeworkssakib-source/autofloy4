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
  
  useEffect(() => {
    const unsubscribe = syncManager.subscribe(setStatus);
    
    // Get initial pending count
    syncManager.getStatusWithCount().then(setStatus);
    
    return unsubscribe;
  }, []);
  
  const triggerSync = useCallback(async () => {
    return syncManager.sync();
  }, []);
  
  const triggerFullSync = useCallback(async (shopId: string) => {
    return syncManager.fullSync(shopId);
  }, []);
  
  return {
    ...status,
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

// =============== PENDING SYNC COUNT HOOK ===============

export function usePendingSyncCount() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const updateCount = async () => {
      const pendingCount = await offlineDataService.getPendingSyncCount();
      setCount(pendingCount);
    };
    
    updateCount();
    
    // Update every 5 seconds
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return count;
}
