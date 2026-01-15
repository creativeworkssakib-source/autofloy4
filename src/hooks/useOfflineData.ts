/**
 * Simplified Data Hook
 * 
 * Provides basic data access using offlineShopService
 * Direct Supabase calls - no local caching
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineShopService } from '@/services/offlineShopService';
import { useShop } from '@/contexts/ShopContext';
import { useIsOnline } from './useOnlineStatus';

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

  const createProduct = useCallback(async (data: any) => {
    const result = await offlineShopService.createProduct(data);
    await refetch();
    return { product: result.product };
  }, [refetch]);

  const updateProduct = useCallback(async (data: any) => {
    const result = await offlineShopService.updateProduct(data);
    await refetch();
    return { product: result.product };
  }, [refetch]);

  const deleteProduct = useCallback(async (id: string) => {
    await offlineShopService.deleteProduct(id);
    await refetch();
  }, [refetch]);

  const deleteProducts = useCallback(async (ids: string[]) => {
    const result = await offlineShopService.deleteProducts(ids);
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

  const createCategory = useCallback(async (data: { name: string; description?: string }) => {
    const result = await offlineShopService.createCategory(data);
    await refetch();
    return { category: result.category };
  }, [refetch]);

  const deleteCategory = useCallback(async (id: string) => {
    await offlineShopService.deleteCategory(id);
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

  const createCustomer = useCallback(async (data: any) => {
    const result = await offlineShopService.createCustomer(data);
    await refetch();
    return { customer: result.customer };
  }, [refetch]);

  const updateCustomer = useCallback(async (data: any) => {
    const result = await offlineShopService.updateCustomer(data);
    await refetch();
    return { customer: result.customer };
  }, [refetch]);

  const deleteCustomer = useCallback(async (id: string) => {
    await offlineShopService.deleteCustomer(id);
    await refetch();
  }, [refetch]);

  const deleteCustomers = useCallback(async (ids: string[]) => {
    const result = await offlineShopService.deleteCustomers(ids);
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

  const createSupplier = useCallback(async (data: any) => {
    const result = await offlineShopService.createSupplier(data);
    await refetch();
    return { supplier: result.supplier };
  }, [refetch]);

  const updateSupplier = useCallback(async (data: any) => {
    const result = await offlineShopService.updateSupplier(data);
    await refetch();
    return { supplier: result.supplier };
  }, [refetch]);

  const deleteSupplier = useCallback(async (id: string) => {
    await offlineShopService.deleteSupplier(id);
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

  const createSale = useCallback(async (data: any) => {
    const result = await offlineShopService.createSale(data);
    await refetch();
    return { sale: result.sale, invoice_number: result.invoice_number };
  }, [refetch]);

  const updateSale = useCallback(async (id: string, updates: any) => {
    const result = await offlineShopService.updateSale(id, updates);
    await refetch();
    return { sale: result.sale };
  }, [refetch]);

  const deleteSale = useCallback(async (id: string) => {
    await offlineShopService.deleteSale(id);
    await refetch();
  }, [refetch]);

  const deleteSales = useCallback(async (ids: string[]) => {
    const result = await offlineShopService.deleteSales(ids);
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
    refetch();
  }, [refetch]);

  const createExpense = useCallback(async (data: any) => {
    const result = await offlineShopService.createExpense(data);
    await refetch();
    return { expense: result.expense };
  }, [refetch]);

  const deleteExpense = useCallback(async (id: string) => {
    await offlineShopService.deleteExpense(id);
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

  const createTransaction = useCallback(async (data: any) => {
    const result = await offlineShopService.createCashTransaction(data);
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
      setTrash(result.items || []);
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
