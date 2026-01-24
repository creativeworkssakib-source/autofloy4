/**
 * Simplified Data Hook with Real-time Sync
 * 
 * Provides basic data access using offlineShopService
 * Direct Supabase calls with automatic real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineShopService } from '@/services/offlineShopService';
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
      const result = await offlineShopService.getProducts();
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

  // Real-time sync - auto update when products change anywhere
  useRealtimeSync({
    table: 'shop_products',
    onChange: refetch,
    enabled: isOnline,
  });

  const createProduct = useCallback(async (data: any) => {
    const result = await offlineShopService.createProduct(data);
    // No need to refetch - realtime will handle it
    return { product: result.product };
  }, []);

  const updateProduct = useCallback(async (data: any) => {
    const result = await offlineShopService.updateProduct(data);
    return { product: result.product };
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await offlineShopService.deleteProduct(id);
  }, []);

  const deleteProducts = useCallback(async (ids: string[]) => {
    const result = await offlineShopService.deleteProducts(ids);
    return result;
  }, []);

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
      const result = await offlineShopService.getCategories();
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

  // Real-time sync
  useRealtimeSync({
    table: 'shop_categories',
    onChange: refetch,
    enabled: isOnline,
  });

  const createCategory = useCallback(async (data: { name: string; description?: string }) => {
    const result = await offlineShopService.createCategory(data);
    return { category: result.category };
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await offlineShopService.deleteCategory(id);
  }, []);

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
      const result = await offlineShopService.getCustomers();
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

  // Real-time sync
  useRealtimeSync({
    table: 'shop_customers',
    onChange: refetch,
    enabled: isOnline,
  });

  const createCustomer = useCallback(async (data: any) => {
    const result = await offlineShopService.createCustomer(data);
    return { customer: result.customer };
  }, []);

  const updateCustomer = useCallback(async (data: any) => {
    const result = await offlineShopService.updateCustomer(data);
    return { customer: result.customer };
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    await offlineShopService.deleteCustomer(id);
  }, []);

  const deleteCustomers = useCallback(async (ids: string[]) => {
    const result = await offlineShopService.deleteCustomers(ids);
    return result;
  }, []);

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
      const result = await offlineShopService.getSuppliers();
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

  // Real-time sync
  useRealtimeSync({
    table: 'shop_suppliers',
    onChange: refetch,
    enabled: isOnline,
  });

  const createSupplier = useCallback(async (data: any) => {
    const result = await offlineShopService.createSupplier(data);
    return { supplier: result.supplier };
  }, []);

  const updateSupplier = useCallback(async (data: any) => {
    const result = await offlineShopService.updateSupplier(data);
    return { supplier: result.supplier };
  }, []);

  const deleteSupplier = useCallback(async (id: string) => {
    await offlineShopService.deleteSupplier(id);
  }, []);

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
      const result = await offlineShopService.getSales(startDate && endDate ? { startDate, endDate } : undefined);
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

  // Real-time sync - auto update when sales change anywhere
  useRealtimeSync({
    table: 'shop_sales',
    onChange: refetch,
    enabled: isOnline,
  });

  const createSale = useCallback(async (data: any) => {
    const result = await offlineShopService.createSale(data);
    return { sale: result.sale, invoice_number: result.invoice_number };
  }, []);

  const updateSale = useCallback(async (id: string, updates: any) => {
    const result = await offlineShopService.updateSale(id, updates);
    return { sale: result.sale };
  }, []);

  const deleteSale = useCallback(async (id: string) => {
    await offlineShopService.deleteSale(id);
  }, []);

  const deleteSales = useCallback(async (ids: string[]) => {
    const result = await offlineShopService.deleteSales(ids);
    return result;
  }, []);

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
      const result = await offlineShopService.getExpenses(params);
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

  // Real-time sync
  useRealtimeSync({
    table: 'shop_expenses',
    onChange: refetch,
    enabled: isOnline,
  });

  const createExpense = useCallback(async (data: any) => {
    const result = await offlineShopService.createExpense(data);
    return { expense: result.expense };
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await offlineShopService.deleteExpense(id);
  }, []);

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
      const result = await offlineShopService.getCashTransactions();
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

  // Real-time sync
  useRealtimeSync({
    table: 'shop_cash_transactions',
    onChange: refetch,
    enabled: isOnline,
  });

  const createTransaction = useCallback(async (data: any) => {
    const result = await offlineShopService.createCashTransaction(data);
    return { transaction: result.transaction };
  }, []);

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
      const result = await offlineShopService.getSettings();
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
    const result = await offlineShopService.updateSettings(updates);
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
      const result = await offlineShopService.getTrash();
      // API returns { trash: [] }
      setTrash(result.trash || result.items || []);
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
    await offlineShopService.restoreFromTrash(id, type);
    await refetch();
  }, [refetch]);

  const permanentDelete = useCallback(async (id: string, type: string) => {
    await offlineShopService.permanentDelete(id, type);
    await refetch();
  }, [refetch]);

  const emptyTrash = useCallback(async () => {
    await offlineShopService.emptyTrash();
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
