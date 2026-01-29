/**
 * Offline-First Data Hooks
 * 
 * Provides TRUE offline functionality:
 * - Online: Fetches from API, caches to IndexedDB
 * - Offline: Reads from IndexedDB, queues writes for sync
 * 
 * All shop features work without internet!
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineFirstService } from '@/services/offlineFirstService';
import { useShop } from '@/contexts/ShopContext';
import { useIsOnline } from './useOnlineStatus';
import { useRealtimeSync } from './useRealtimeSync';

// =============== PRODUCTS ===============

export function useOfflineProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getProducts();
      setProducts(result.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Real-time sync - auto update when products change anywhere (only when online)
  useRealtimeSync({
    table: 'shop_products',
    onChange: refetch,
    enabled: isOnline,
  });

  const createProduct = useCallback(async (data: any) => {
    const result = await offlineFirstService.createProduct(data);
    // Refetch to update local state (works offline too)
    await refetch();
    return { product: result.product };
  }, [refetch]);

  const updateProduct = useCallback(async (data: any) => {
    const result = await offlineFirstService.updateProduct(data);
    await refetch();
    return { product: result.product };
  }, [refetch]);

  const deleteProduct = useCallback(async (id: string) => {
    await offlineFirstService.deleteProduct(id);
    await refetch();
  }, [refetch]);

  const deleteProducts = useCallback(async (ids: string[]) => {
    const result = await offlineFirstService.deleteProducts(ids);
    await refetch();
    return result;
  }, [refetch]);

  return {
    products,
    loading,
    isOnline,
    refetch,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProducts,
  };
}

// =============== CATEGORIES ===============

export function useOfflineCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getCategories();
      setCategories(result.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Real-time sync (only when online)
  useRealtimeSync({
    table: 'shop_categories',
    onChange: refetch,
    enabled: isOnline,
  });

  const createCategory = useCallback(async (data: { name: string; description?: string }) => {
    const result = await offlineFirstService.createCategory(data);
    await refetch();
    return { category: result.category };
  }, [refetch]);

  const deleteCategory = useCallback(async (id: string) => {
    await offlineFirstService.deleteCategory(id);
    await refetch();
  }, [refetch]);

  return {
    categories,
    loading,
    refetch,
    createCategory,
    deleteCategory,
  };
}

// =============== CUSTOMERS ===============

export function useOfflineCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getCustomers();
      setCustomers(result.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Real-time sync (only when online)
  useRealtimeSync({
    table: 'shop_customers',
    onChange: refetch,
    enabled: isOnline,
  });

  const createCustomer = useCallback(async (data: any) => {
    const result = await offlineFirstService.createCustomer(data);
    await refetch();
    return { customer: result.customer };
  }, [refetch]);

  const updateCustomer = useCallback(async (data: any) => {
    const result = await offlineFirstService.updateCustomer(data);
    await refetch();
    return { customer: result.customer };
  }, [refetch]);

  const deleteCustomer = useCallback(async (id: string) => {
    await offlineFirstService.deleteCustomer(id);
    await refetch();
  }, [refetch]);

  const deleteCustomers = useCallback(async (ids: string[]) => {
    const result = await offlineFirstService.deleteCustomers(ids);
    await refetch();
    return result;
  }, [refetch]);

  return {
    customers,
    loading,
    refetch,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    deleteCustomers,
  };
}

// =============== SUPPLIERS ===============

export function useOfflineSuppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getSuppliers();
      setSuppliers(result.suppliers || []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Real-time sync (only when online)
  useRealtimeSync({
    table: 'shop_suppliers',
    onChange: refetch,
    enabled: isOnline,
  });

  const createSupplier = useCallback(async (data: any) => {
    const result = await offlineFirstService.createSupplier(data);
    await refetch();
    return { supplier: result.supplier };
  }, [refetch]);

  const updateSupplier = useCallback(async (data: any) => {
    const result = await offlineFirstService.updateSupplier(data);
    await refetch();
    return { supplier: result.supplier };
  }, [refetch]);

  const deleteSupplier = useCallback(async (id: string) => {
    await offlineFirstService.deleteSupplier(id);
    await refetch();
  }, [refetch]);

  return {
    suppliers,
    loading,
    refetch,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}

// =============== SALES ===============

export function useOfflineSales(startDate?: string, endDate?: string) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getSales(startDate && endDate ? { startDate, endDate } : undefined);
      setSales(result.sales || []);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Real-time sync - auto update when sales change anywhere (only when online)
  useRealtimeSync({
    table: 'shop_sales',
    onChange: refetch,
    enabled: isOnline,
  });

  const createSale = useCallback(async (data: any) => {
    const result = await offlineFirstService.createSale(data);
    await refetch();
    return { sale: result.sale, invoice_number: result.invoice_number };
  }, [refetch]);

  const updateSale = useCallback(async (id: string, updates: any) => {
    const result = await offlineFirstService.updateSale(id, updates);
    await refetch();
    return { sale: result.sale };
  }, [refetch]);

  const deleteSale = useCallback(async (id: string) => {
    await offlineFirstService.deleteSale(id);
    await refetch();
  }, [refetch]);

  const deleteSales = useCallback(async (ids: string[]) => {
    const result = await offlineFirstService.deleteSales(ids);
    await refetch();
    return result;
  }, [refetch]);

  return {
    sales,
    loading,
    refetch,
    createSale,
    updateSale,
    deleteSale,
    deleteSales,
  };
}

// =============== EXPENSES ===============

export function useOfflineExpenses(params?: { startDate?: string; endDate?: string }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getExpenses(params);
      setExpenses(result.expenses || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [params?.startDate, params?.endDate, currentShop?.id]);

  useEffect(() => {
    if (currentShop?.id) {
      refetch();
    }
  }, [currentShop?.id]);

  // Real-time sync (only when online)
  useRealtimeSync({
    table: 'shop_expenses',
    onChange: refetch,
    enabled: isOnline,
  });

  const createExpense = useCallback(async (data: any) => {
    const result = await offlineFirstService.createExpense(data);
    await refetch();
    return { expense: result.expense };
  }, [refetch]);

  const deleteExpense = useCallback(async (id: string) => {
    await offlineFirstService.deleteExpense(id);
    await refetch();
  }, [refetch]);

  return {
    expenses,
    loading,
    refetch,
    createExpense,
    deleteExpense,
  };
}

// =============== CASH TRANSACTIONS ===============

export function useOfflineCashTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getCashTransactions();
      setTransactions(result.transactions || []);
    } catch (error) {
      console.error('Failed to fetch cash transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Real-time sync (only when online)
  useRealtimeSync({
    table: 'shop_cash_transactions',
    onChange: refetch,
    enabled: isOnline,
  });

  const createTransaction = useCallback(async (data: any) => {
    const result = await offlineFirstService.createCashTransaction(data);
    await refetch();
    return { transaction: result.transaction };
  }, [refetch]);

  return {
    transactions,
    loading,
    refetch,
    createTransaction,
  };
}

// =============== SETTINGS ===============

export function useOfflineSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getSettings();
      setSettings(result.settings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateSettings = useCallback(async (updates: any) => {
    const result = await offlineFirstService.updateSettings(updates);
    await refetch();
    return { settings: result.settings };
  }, [refetch]);

  return {
    settings,
    loading,
    refetch,
    updateSettings,
  };
}

// =============== TRASH ===============

export function useOfflineTrash() {
  const [trash, setTrash] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getTrash();
      setTrash(result.trash || []);
    } catch (error) {
      console.error('Failed to fetch trash:', error);
      setTrash([]);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const restoreItem = useCallback(async (id: string, type: string) => {
    await offlineFirstService.restoreFromTrash(id, type);
    await refetch();
  }, [refetch]);

  const permanentDelete = useCallback(async (id: string, type: string) => {
    await offlineFirstService.permanentDelete(id, type);
    await refetch();
  }, [refetch]);

  const emptyTrash = useCallback(async () => {
    await offlineFirstService.emptyTrash();
    await refetch();
  }, [refetch]);

  return {
    trash,
    loading,
    refetch,
    restoreItem,
    permanentDelete,
    emptyTrash,
  };
}

// =============== SYNC STATUS ===============

export function useOfflineSyncStatus() {
  const [status, setStatus] = useState(offlineFirstService.getSyncStatus());

  useEffect(() => {
    const unsubscribe = offlineFirstService.subscribeSyncStatus((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const forceSync = useCallback(async () => {
    await offlineFirstService.forceSyncNow();
  }, []);

  return {
    ...status,
    forceSync,
  };
}

// =============== DASHBOARD ===============

export function useOfflineDashboard(range: 'today' | 'week' | 'month' = 'today') {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getDashboard(range);
      setDashboard(result.dashboard || result);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [range, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    dashboard,
    loading,
    refetch,
  };
}

// =============== PURCHASES ===============

export function useOfflinePurchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getPurchases();
      setPurchases(result.purchases || []);
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useRealtimeSync({
    table: 'shop_purchases',
    onChange: refetch,
    enabled: isOnline,
  });

  const createPurchase = useCallback(async (data: any) => {
    const result = await offlineFirstService.createPurchase(data);
    await refetch();
    return { purchase: result.purchase };
  }, [refetch]);

  return {
    purchases,
    loading,
    refetch,
    createPurchase,
  };
}

// =============== STOCK ADJUSTMENTS ===============

export function useOfflineStockAdjustments(params?: { filterType?: string }) {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getStockAdjustments(params);
      setAdjustments(result.adjustments || []);
    } catch (error) {
      console.error('Failed to fetch adjustments:', error);
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  }, [params?.filterType, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useRealtimeSync({
    table: 'shop_stock_adjustments',
    onChange: refetch,
    enabled: isOnline,
  });

  const createAdjustment = useCallback(async (data: any) => {
    const result = await offlineFirstService.createStockAdjustment(data);
    await refetch();
    return { adjustment: result.adjustment };
  }, [refetch]);

  return {
    adjustments,
    loading,
    refetch,
    createAdjustment,
  };
}

// =============== RETURNS ===============

export function useOfflineReturns() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getReturns();
      setReturns(result.returns || []);
    } catch (error) {
      console.error('Failed to fetch returns:', error);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useRealtimeSync({
    table: 'shop_returns',
    onChange: refetch,
    enabled: isOnline,
  });

  return {
    returns,
    loading,
    refetch,
  };
}

// =============== LOANS ===============

export function useOfflineLoans() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getLoans();
      setLoans(result.loans || []);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useRealtimeSync({
    table: 'shop_loans',
    onChange: refetch,
    enabled: isOnline,
  });

  const createLoan = useCallback(async (data: any) => {
    const result = await offlineFirstService.createLoan(data);
    await refetch();
    return { loan: result.loan };
  }, [refetch]);

  return {
    loans,
    loading,
    refetch,
    createLoan,
  };
}

// =============== CASH REGISTER ===============

export function useOfflineCashRegister() {
  const [registers, setRegisters] = useState<any[]>([]);
  const [register, setRegister] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = useIsOnline();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [registersResult, todayResult] = await Promise.all([
        offlineFirstService.getCashRegisters(),
        offlineFirstService.getTodayRegister(),
      ]);
      setRegisters(registersResult.registers || []);
      setRegister(todayResult.register);
    } catch (error) {
      console.error('Failed to fetch cash registers:', error);
      setRegisters([]);
      setRegister(null);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useRealtimeSync({
    table: 'shop_daily_cash_register',
    onChange: refetch,
    enabled: isOnline,
  });

  const openRegister = useCallback(async (openingCash: number) => {
    const result = await offlineFirstService.openCashRegister(openingCash);
    await refetch();
    return { message: 'Register opened successfully', ...result };
  }, [refetch]);

  const closeRegister = useCallback(async (closingCash: number, notes?: string) => {
    const result = await offlineFirstService.closeCashRegister(closingCash, notes);
    await refetch();
    return result;
  }, [refetch]);

  return {
    register, // This is what DailyCashRegister expects
    registers,
    loading,
    refetch,
    openRegister,
    closeRegister,
  };
}

// =============== REPORTS ===============

export function useOfflineReports(type: string, params?: { startDate?: string; endDate?: string }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineFirstService.getReports(type, params);
      setReport(result.report || result);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [type, params?.startDate, params?.endDate, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    report,
    loading,
    refetch,
  };
}
