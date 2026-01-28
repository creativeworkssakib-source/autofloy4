/**
 * Offline-First Data Hooks
 * 
 * These hooks provide seamless offline support:
 * 1. Read from IndexedDB first (instant)
 * 2. Fetch from server in background when online
 * 3. Queue writes locally, sync when online
 * 4. Automatic conflict resolution
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDb, StoreName } from '@/lib/offlineDatabase';
import { syncManager, SyncStatus } from '@/lib/syncManager';
import { offlineShopService } from '@/services/offlineShopService';
import { useShop } from '@/contexts/ShopContext';
import { useIsOnline } from './useOnlineStatus';
import { generateUUID } from '@/lib/offlineUtils';

// ============ Sync Status Hook ============

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const isOnline = useIsOnline();

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(({ status, pendingCount }) => {
      setStatus(status);
      setPendingCount(pendingCount);
    });
    return unsubscribe;
  }, []);

  const forceSync = useCallback(async () => {
    await syncManager.forceSync();
  }, []);

  return {
    status,
    pendingCount,
    isOnline,
    isSyncing: status === 'syncing',
    hasError: status === 'error',
    forceSync,
  };
}

// ============ Generic Offline-First Hook ============

type DataStoreName = 'products' | 'categories' | 'customers' | 'suppliers' | 'sales' | 
  'purchases' | 'expenses' | 'adjustments' | 'returns' | 'loans' |
  'cashTransactions' | 'cashRegisters';

export function useOfflineFirstData<T extends { id?: string }>(
  storeName: DataStoreName,
  fetchFn: () => Promise<{ [key: string]: T[] }>,
  dataKey: string
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();
  const shopId = currentShop?.id || '';
  const lastFetchRef = useRef<number>(0);

  // Load from IndexedDB first
  const loadLocalData = useCallback(async () => {
    if (!shopId) return;
    
    try {
      const localData = await offlineDb.getAll(storeName, shopId);
      if (localData.length > 0) {
        setData(localData as T[]);
        setLoading(false);
      }
    } catch (error) {
      console.error(`[OfflineFirst] Error loading ${storeName} from IndexedDB:`, error);
    }
  }, [storeName, shopId]);

  // Fetch from server and update local
  const syncFromServer = useCallback(async () => {
    if (!isOnline || !shopId) return;
    
    // Debounce - don't fetch more than once per 5 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) return;
    lastFetchRef.current = now;

    try {
      const result = await fetchFn();
      const serverData = result[dataKey] || [];
      
      // Update IndexedDB with server data
      if (serverData.length > 0) {
        await offlineDb.putMany(storeName, serverData);
      }
      
      setData(serverData as T[]);
    } catch (error) {
      console.error(`[OfflineFirst] Error fetching ${storeName} from server:`, error);
      // Keep showing local data on error
    } finally {
      setLoading(false);
    }
  }, [fetchFn, dataKey, storeName, isOnline, shopId]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      await loadLocalData();
      await syncFromServer();
    };
    
    if (shopId) {
      load();
    }
  }, [loadLocalData, syncFromServer, shopId]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && shopId) {
      syncFromServer();
    }
  }, [isOnline, syncFromServer, shopId]);

  // Create operation
  const create = useCallback(async (newData: Partial<T>): Promise<T> => {
    if (!shopId) throw new Error('No shop selected');
    
    const item = {
      ...newData,
      id: (newData as any).id || generateUUID(),
      shop_id: shopId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as T;

    // Save locally immediately
    await offlineDb.put(storeName, item);
    setData(prev => [item, ...prev]);

    // Queue for sync
    await syncManager.queueOperation(storeName, 'create', item, shopId);

    return item;
  }, [storeName, shopId]);

  // Update operation
  const update = useCallback(async (id: string, updates: Partial<T>): Promise<T> => {
    if (!shopId) throw new Error('No shop selected');
    
    const existing = await offlineDb.get(storeName, id);
    if (!existing) throw new Error('Item not found');

    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Save locally immediately
    await offlineDb.put(storeName, updated);
    setData(prev => prev.map(item => (item as any).id === id ? updated as T : item));

    // Queue for sync
    await syncManager.queueOperation(storeName, 'update', updated, shopId);

    return updated as T;
  }, [storeName, shopId]);

  // Delete operation
  const remove = useCallback(async (ids: string | string[]) => {
    if (!shopId) throw new Error('No shop selected');
    
    const idArray = Array.isArray(ids) ? ids : [ids];

    // Delete locally immediately
    await offlineDb.deleteMany(storeName, idArray);
    setData(prev => prev.filter(item => !idArray.includes((item as any).id)));

    // Queue for sync
    await syncManager.queueOperation(storeName, 'delete', { ids: idArray }, shopId);
  }, [storeName, shopId]);

  // Manual refresh
  const refetch = useCallback(async () => {
    setLoading(true);
    await loadLocalData();
    await syncFromServer();
  }, [loadLocalData, syncFromServer]);

  return {
    data,
    loading,
    isOnline,
    create,
    update,
    remove,
    refetch,
  };
}

// ============ Products Hook ============

export function useOfflineProducts() {
  const hook = useOfflineFirstData<any>(
    'products',
    () => offlineShopService.getProducts(),
    'products'
  );

  const createProduct = useCallback(async (data: any) => {
    const product = await hook.create(data);
    return { product };
  }, [hook.create]);

  const updateProduct = useCallback(async (data: any) => {
    const product = await hook.update(data.id, data);
    return { product };
  }, [hook.update]);

  const deleteProduct = useCallback(async (id: string) => {
    await hook.remove(id);
  }, [hook.remove]);

  const deleteProducts = useCallback(async (ids: string[]) => {
    await hook.remove(ids);
    return { deleted: ids };
  }, [hook.remove]);

  return {
    products: hook.data,
    loading: hook.loading,
    isOnline: hook.isOnline,
    refetch: hook.refetch,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProducts,
  };
}

// ============ Categories Hook ============

export function useOfflineCategories() {
  const hook = useOfflineFirstData<any>(
    'categories',
    () => offlineShopService.getCategories(),
    'categories'
  );

  const createCategory = useCallback(async (data: { name: string; description?: string }) => {
    const category = await hook.create(data);
    return { category };
  }, [hook.create]);

  const deleteCategory = useCallback(async (id: string) => {
    await hook.remove(id);
  }, [hook.remove]);

  return {
    categories: hook.data,
    loading: hook.loading,
    refetch: hook.refetch,
    createCategory,
    deleteCategory,
  };
}

// ============ Customers Hook ============

export function useOfflineCustomers() {
  const hook = useOfflineFirstData<any>(
    'customers',
    () => offlineShopService.getCustomers(),
    'customers'
  );

  const createCustomer = useCallback(async (data: any) => {
    const customer = await hook.create(data);
    return { customer };
  }, [hook.create]);

  const updateCustomer = useCallback(async (data: any) => {
    const customer = await hook.update(data.id, data);
    return { customer };
  }, [hook.update]);

  const deleteCustomer = useCallback(async (id: string) => {
    await hook.remove(id);
  }, [hook.remove]);

  const deleteCustomers = useCallback(async (ids: string[]) => {
    await hook.remove(ids);
    return { deleted: ids };
  }, [hook.remove]);

  return {
    customers: hook.data,
    loading: hook.loading,
    refetch: hook.refetch,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    deleteCustomers,
  };
}

// ============ Suppliers Hook ============

export function useOfflineSuppliers() {
  const hook = useOfflineFirstData<any>(
    'suppliers',
    () => offlineShopService.getSuppliers(),
    'suppliers'
  );

  const createSupplier = useCallback(async (data: any) => {
    const supplier = await hook.create(data);
    return { supplier };
  }, [hook.create]);

  const updateSupplier = useCallback(async (data: any) => {
    const supplier = await hook.update(data.id, data);
    return { supplier };
  }, [hook.update]);

  const deleteSupplier = useCallback(async (id: string) => {
    await hook.remove(id);
  }, [hook.remove]);

  const deleteSuppliers = useCallback(async (ids: string[]) => {
    await hook.remove(ids);
    return { deleted: ids };
  }, [hook.remove]);

  return {
    suppliers: hook.data,
    loading: hook.loading,
    refetch: hook.refetch,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    deleteSuppliers,
  };
}

// ============ Sales Hook ============

export function useOfflineSales(startDate?: string, endDate?: string) {
  const hook = useOfflineFirstData<any>(
    'sales',
    () => offlineShopService.getSales(startDate && endDate ? { startDate, endDate } : undefined),
    'sales'
  );

  const createSale = useCallback(async (data: any) => {
    const invoiceNumber = `INV-${Date.now()}`;
    const sale = await hook.create({
      ...data,
      invoice_number: invoiceNumber,
      sale_date: data.sale_date || new Date().toISOString().split('T')[0],
    });
    return { sale, invoice_number: invoiceNumber };
  }, [hook.create]);

  const updateSale = useCallback(async (id: string, updates: any) => {
    const sale = await hook.update(id, updates);
    return { sale };
  }, [hook.update]);

  const deleteSale = useCallback(async (id: string) => {
    await hook.remove(id);
  }, [hook.remove]);

  const deleteSales = useCallback(async (ids: string[]) => {
    await hook.remove(ids);
    return { deleted: ids };
  }, [hook.remove]);

  return {
    sales: hook.data,
    loading: hook.loading,
    refetch: hook.refetch,
    createSale,
    updateSale,
    deleteSale,
    deleteSales,
  };
}

// ============ Purchases Hook ============

export function useOfflinePurchases() {
  const hook = useOfflineFirstData<any>(
    'purchases',
    () => offlineShopService.getPurchases(),
    'purchases'
  );

  const createPurchase = useCallback(async (data: any) => {
    const purchase = await hook.create({
      ...data,
      purchase_date: data.purchase_date || new Date().toISOString().split('T')[0],
    });
    return { purchase };
  }, [hook.create]);

  const deletePurchase = useCallback(async (id: string) => {
    await hook.remove(id);
  }, [hook.remove]);

  return {
    purchases: hook.data,
    loading: hook.loading,
    refetch: hook.refetch,
    createPurchase,
    deletePurchase,
  };
}

// ============ Expenses Hook ============

export function useOfflineExpenses(params?: { startDate?: string; endDate?: string }) {
  const hook = useOfflineFirstData<any>(
    'expenses',
    () => offlineShopService.getExpenses(params),
    'expenses'
  );

  const createExpense = useCallback(async (data: any) => {
    const expense = await hook.create({
      ...data,
      expense_date: data.expense_date || new Date().toISOString().split('T')[0],
    });
    return { expense };
  }, [hook.create]);

  const deleteExpense = useCallback(async (id: string) => {
    await hook.remove(id);
  }, [hook.remove]);

  return {
    expenses: hook.data,
    loading: hook.loading,
    refetch: hook.refetch,
    createExpense,
    deleteExpense,
  };
}

// ============ Adjustments Hook ============

export function useOfflineAdjustments(filterType?: string) {
  const hook = useOfflineFirstData<any>(
    'adjustments',
    () => offlineShopService.getStockAdjustments({ filterType }),
    'adjustments'
  );

  const createAdjustment = useCallback(async (data: any) => {
    const adjustment = await hook.create(data);
    return { adjustment };
  }, [hook.create]);

  const deleteAdjustments = useCallback(async (ids: string[]) => {
    await hook.remove(ids);
    return { deleted: ids };
  }, [hook.remove]);

  return {
    adjustments: hook.data,
    loading: hook.loading,
    refetch: hook.refetch,
    createAdjustment,
    deleteAdjustments,
  };
}

// ============ Returns Hook ============

export function useOfflineReturns(returnType?: 'sale' | 'purchase') {
  const hook = useOfflineFirstData<any>(
    'returns',
    () => offlineShopService.getReturns(returnType),
    'returns'
  );

  const createReturn = useCallback(async (data: any) => {
    const returnItem = await hook.create(data);
    return { return: returnItem };
  }, [hook.create]);

  return {
    returns: hook.data,
    loading: hook.loading,
    refetch: hook.refetch,
    createReturn,
  };
}

// ============ Loans Hook ============

export function useOfflineLoans(statusFilter?: string) {
  const [stats, setStats] = useState<any>(null);
  const { currentShop } = useShop();
  const shopId = currentShop?.id || '';
  
  const hook = useOfflineFirstData<any>(
    'loans',
    async () => {
      const result = await offlineShopService.getLoans(statusFilter);
      setStats(result.stats);
      return result;
    },
    'loans'
  );

  const upcomingLoans = hook.data.filter((l: any) => l.status === 'active');
  const overdueLoans = hook.data.filter((l: any) => l.status === 'overdue');

  const createLoan = useCallback(async (data: any) => {
    const loan = await hook.create(data);
    return { loan };
  }, [hook.create]);

  const deleteLoan = useCallback(async (id: string) => {
    await hook.remove(id);
  }, [hook.remove]);

  const addPayment = useCallback(async (loanId: string, paymentData: any) => {
    // For payments, we need to update the loan and create payment record
    const existing = await offlineDb.get('loans', loanId);
    if (existing) {
      const newPaidAmount = (existing.paid_amount || 0) + paymentData.amount;
      const newRemaining = existing.loan_amount - newPaidAmount;
      const isCompleted = newRemaining <= 0;
      
      await hook.update(loanId, {
        paid_amount: newPaidAmount,
        remaining_amount: Math.max(0, newRemaining),
        status: isCompleted ? 'paid' : existing.status,
      });
      
      // Also queue the payment for sync
      await syncManager.queueOperation('loanPayments', 'create', {
        id: generateUUID(),
        loan_id: loanId,
        ...paymentData,
        shop_id: shopId,
      }, shopId);
      
      return { isCompleted };
    }
    return { isCompleted: false };
  }, [hook.update, shopId]);

  return {
    loans: hook.data,
    stats,
    upcomingLoans,
    overdueLoans,
    loading: hook.loading,
    refetch: hook.refetch,
    createLoan,
    deleteLoan,
    addPayment,
  };
}

// ============ Cash Transactions Hook ============

export function useOfflineCashTransactions() {
  const hook = useOfflineFirstData<any>(
    'cashTransactions',
    () => offlineShopService.getCashTransactions(),
    'transactions'
  );

  const createTransaction = useCallback(async (data: any) => {
    const transaction = await hook.create({
      ...data,
      transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
    });
    return { transaction };
  }, [hook.create]);

  return {
    transactions: hook.data,
    loading: hook.loading,
    refetch: hook.refetch,
    createTransaction,
  };
}

// ============ Cash Register Hook ============

export function useOfflineCashRegister(date?: string) {
  const [register, setRegister] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();
  const shopId = currentShop?.id || '';
  const targetDate = date || new Date().toISOString().split('T')[0];

  const loadRegister = useCallback(async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      // Try local first
      const allRegisters = await offlineDb.getAll('cashRegisters', shopId);
      const localRegister = allRegisters.find((r: any) => r.register_date === targetDate);
      
      if (localRegister) {
        setRegister(localRegister);
      }
      
      // Fetch from server if online
      if (isOnline) {
        try {
          const result = await offlineShopService.getCashRegister(targetDate);
          const serverRegister = result.todayRegister || result.registers?.[0];
          if (serverRegister) {
            await offlineDb.put('cashRegisters', serverRegister);
            setRegister(serverRegister);
          }
        } catch (error) {
          // Keep local data on error
        }
      }
    } catch (error) {
      console.error('[OfflineCashRegister] Error:', error);
    } finally {
      setLoading(false);
    }
  }, [shopId, targetDate, isOnline]);

  useEffect(() => {
    loadRegister();
  }, [loadRegister]);

  const openRegister = useCallback(async (openingCash: number) => {
    if (!shopId) throw new Error('No shop selected');
    
    const registerData = {
      id: generateUUID(),
      shop_id: shopId,
      register_date: targetDate,
      opening_cash: openingCash,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save locally
    await offlineDb.put('cashRegisters', registerData);
    setRegister(registerData);

    // Queue for sync
    await syncManager.queueOperation('cashRegisters', 'create', registerData, shopId);

    return { register: registerData };
  }, [shopId, targetDate]);

  const closeRegister = useCallback(async (closingCash: number, notes?: string) => {
    if (!shopId || !register) throw new Error('No register to close');
    
    const updatedRegister = {
      ...register,
      closing_cash: closingCash,
      notes,
      status: 'closed',
      updated_at: new Date().toISOString(),
    };

    // Save locally
    await offlineDb.put('cashRegisters', updatedRegister);
    setRegister(updatedRegister);

    // Queue for sync
    await syncManager.queueOperation('cashRegisters', 'update', updatedRegister, shopId);

    return { register: updatedRegister };
  }, [shopId, register]);

  return {
    register,
    loading,
    refetch: loadRegister,
    openRegister,
    closeRegister,
  };
}
