/**
 * Shop Data Hooks
 * All hooks needed for shop functionality
 * 
 * Uses offlineShopService for direct Supabase API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineShopService } from '@/services/offlineShopService';
import { useShop } from '@/contexts/ShopContext';

// =============== PURCHASES ===============

export function useOfflinePurchases(startDate?: string, endDate?: string) {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineShopService.getPurchases();
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

  const createPurchase = useCallback(async (data: any) => {
    const result = await offlineShopService.createPurchase(data);
    await refetch();
    return { purchase: result.purchase };
  }, [refetch]);

  const deletePurchase = useCallback(async (id: string) => {
    await offlineShopService.deletePurchase(id);
    await refetch();
  }, [refetch]);

  return {
    purchases,
    loading,
    refetch,
    createPurchase,
    deletePurchase,
  };
}

// =============== SUPPLIERS ===============

export function useOfflineSuppliersExt() {
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

  const updateSupplier = useCallback(async (id: string, data: any) => {
    await offlineShopService.updateSupplier({ id, ...data });
    await refetch();
  }, [refetch]);

  const deleteSupplier = useCallback(async (id: string) => {
    await offlineShopService.deleteSupplier(id);
    await refetch();
  }, [refetch]);

  const deleteSuppliers = useCallback(async (ids: string[]) => {
    const result = await offlineShopService.deleteSuppliers(ids);
    await refetch();
    return result;
  }, [refetch]);

  return {
    suppliers,
    loading,
    refetch,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    deleteSuppliers,
  };
}

// =============== ADJUSTMENTS ===============

export function useOfflineAdjustments(filterType?: string) {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineShopService.getStockAdjustments(filterType);
      setAdjustments(result.adjustments || []);
    } catch (error) {
      console.error('Failed to fetch adjustments:', error);
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createAdjustment = useCallback(async (data: any) => {
    const result = await offlineShopService.createStockAdjustment(data);
    await refetch();
    return { adjustment: result.adjustment };
  }, [refetch]);

  const deleteAdjustments = useCallback(async (ids: string[]) => {
    const result = await offlineShopService.deleteStockAdjustments(ids);
    await refetch();
    return result;
  }, [refetch]);

  return {
    adjustments,
    loading,
    refetch,
    createAdjustment,
    deleteAdjustments,
  };
}

// =============== RETURNS ===============

export function useOfflineReturns(returnType?: 'sale' | 'purchase') {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineShopService.getReturns(returnType);
      setReturns(result.returns || []);
    } catch (error) {
      console.error('Failed to fetch returns:', error);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [returnType, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createReturn = useCallback(async (data: any) => {
    const result = await offlineShopService.processReturn(data);
    await refetch();
    return { return: result };
  }, [refetch]);

  return {
    returns,
    loading,
    refetch,
    createReturn,
  };
}

// =============== LOANS ===============

export function useOfflineLoans(statusFilter?: string) {
  const [loans, setLoans] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [upcomingLoans, setUpcomingLoans] = useState<any[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineShopService.getLoans(statusFilter);
      const allLoans = result.loans || [];
      setLoans(allLoans);
      setStats(result.stats);
      setUpcomingLoans(allLoans.filter((l: any) => l.status === 'active'));
      setOverdueLoans(allLoans.filter((l: any) => l.status === 'overdue'));
    } catch (error) {
      console.error('Failed to fetch loans:', error);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createLoan = useCallback(async (data: any) => {
    const result = await offlineShopService.createLoan(data);
    await refetch();
    return { loan: result.loan };
  }, [refetch]);

  const deleteLoan = useCallback(async (id: string) => {
    await offlineShopService.deleteLoan(id);
    await refetch();
  }, [refetch]);

  const addPayment = useCallback(async (loanId: string, paymentData: any) => {
    const result = await offlineShopService.addLoanPayment(loanId, paymentData);
    await refetch();
    return { isCompleted: result.loan?.status === 'paid' };
  }, [refetch]);

  return {
    loans,
    stats,
    upcomingLoans,
    overdueLoans,
    loading,
    refetch,
    createLoan,
    deleteLoan,
    addPayment,
  };
}

// =============== CASH SUMMARY ===============

export function useOfflineCashSummary() {
  const [data, setData] = useState<{
    sales: any[];
    purchases: any[];
    expenses: any[];
    customers: any[];
    suppliers: any[];
    products: any[];
  }>({
    sales: [],
    purchases: [],
    expenses: [],
    customers: [],
    suppliers: [],
    products: [],
  });
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, purchasesRes, expensesRes, customersRes, suppliersRes, productsRes] = await Promise.all([
        offlineShopService.getSales(),
        offlineShopService.getPurchases(),
        offlineShopService.getExpenses(),
        offlineShopService.getCustomers(),
        offlineShopService.getSuppliers(),
        offlineShopService.getProducts(),
      ]);

      setData({
        sales: salesRes.sales || [],
        purchases: purchasesRes.purchases || [],
        expenses: expensesRes.expenses || [],
        customers: customersRes.customers || [],
        suppliers: suppliersRes.suppliers || [],
        products: productsRes.products || [],
      });
    } catch (error) {
      console.error('Failed to fetch cash summary:', error);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    loading,
    refetch,
  };
}

// =============== DUE CUSTOMERS ===============

export function useOfflineDueCustomers() {
  const [dueCustomers, setDueCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await offlineShopService.getSales();
      const allSales = response.sales || [];
      
      // Filter sales with due amount > 0
      const dueSales = allSales.filter((sale: any) => 
        sale.due_amount && Number(sale.due_amount) > 0
      );
      
      // Group by customer
      const customerMap = new Map<string, any>();
      dueSales.forEach((sale: any) => {
        const customerId = sale.customer_id || sale.customer_phone || 'walk-in';
        const existing = customerMap.get(customerId);
        
        if (existing) {
          existing.totalDue += Number(sale.due_amount || 0);
          existing.salesCount += 1;
          existing.sales.push(sale);
        } else {
          customerMap.set(customerId, {
            id: customerId,
            name: sale.customer_name || 'Walk-in Customer',
            phone: sale.customer_phone || '',
            totalDue: Number(sale.due_amount || 0),
            salesCount: 1,
            sales: [sale],
          });
        }
      });
      
      setDueCustomers(Array.from(customerMap.values()).sort((a, b) => b.totalDue - a.totalDue));
    } catch (error) {
      console.error('Failed to fetch due customers:', error);
      setDueCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateSalePayment = useCallback(async (saleId: string, paidAmount: number, dueAmount: number) => {
    const status = dueAmount <= 0 ? 'paid' : 'partial';
    await offlineShopService.updateSale(saleId, { paid_amount: paidAmount, due_amount: dueAmount, payment_status: status });
    await refetch();
  }, [refetch]);

  const deleteSales = useCallback(async (ids: string[]) => {
    await offlineShopService.deleteSales(ids);
    await refetch();
  }, [refetch]);

  return {
    dueCustomers,
    loading,
    refetch,
    updateSalePayment,
    deleteSales,
  };
}

// =============== DAILY CASH REGISTER ===============

export function useOfflineDailyCashRegister(date?: string) {
  const [register, setRegister] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineShopService.getCashRegister(date);
      setRegister(result.register);
    } catch (error) {
      console.error('Failed to fetch daily cash register:', error);
      setRegister(null);
    } finally {
      setLoading(false);
    }
  }, [date, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const openRegister = useCallback(async (openingBalance: number) => {
    const result = await offlineShopService.openCashRegister(openingBalance);
    await refetch();
    return result;
  }, [refetch]);

  const closeRegister = useCallback(async (closingBalance: number, notes?: string) => {
    const result = await offlineShopService.closeCashRegister(closingBalance, notes);
    await refetch();
    return result;
  }, [refetch]);

  return {
    register,
    loading,
    refetch,
    openRegister,
    closeRegister,
  };
}

// =============== CASH REGISTER (alias) ===============
export const useOfflineCashRegister = useOfflineDailyCashRegister;

// =============== DASHBOARD ===============

export function useOfflineDashboard(range: 'today' | 'week' | 'month' = 'today') {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineShopService.getDashboard(range);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    loading,
    refetch,
  };
}

// =============== REPORTS ===============

export function useOfflineReports(type: "sales" | "purchases" | "expenses" | "inventory" | "customers" | "products", startDate?: string, endDate?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineShopService.getReports(type, { startDate, endDate });
      setData(result);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [type, startDate, endDate, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    loading,
    refetch,
  };
}

// =============== PRODUCTS SIMPLE ===============

export function useOfflineProductsSimple() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentShop } = useShop();
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;

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

  return {
    products,
    loading,
    isOnline,
    refetch,
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
      // API returns { trash: [] } or { items: [] }
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
