/**
 * Comprehensive Offline Shop Hooks
 * All hooks needed for complete offline shop functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineDataService } from '@/services/offlineDataService';
import { offlineShopService } from '@/services/offlineShopService';
import { ShopPurchase, ShopSupplier, ShopStockAdjustment, ShopReturn, ShopLoan, ShopStaff, ShopDailyCashRegister } from '@/lib/offlineDB';
import { generateOfflineId } from '@/lib/offlineUtils';
import { useIsOnline } from './useOnlineStatus';
import { useShop } from '@/contexts/ShopContext';

// =============== PURCHASES ===============

export function useOfflinePurchases(startDate?: string, endDate?: string) {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      // Use offlineDataService for offline-first access
      const result = await offlineDataService.getPurchases(startDate, endDate);
      setPurchases(result.purchases || []);
      setFromCache(result.fromCache);
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
      // Fallback to online API
      try {
        const result = await offlineShopService.getPurchases();
        setPurchases(result.purchases || []);
        setFromCache(false);
      } catch (e) {
        setPurchases([]);
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createPurchase = useCallback(async (data: any) => {
    try {
      const result = await offlineDataService.createPurchase(data);
      await refetch();
      return { purchase: result.purchase, offline: result.offline };
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  const deletePurchase = useCallback(async (id: string) => {
    try {
      const result = await offlineDataService.deletePurchase(id);
      await refetch();
      return { offline: result.offline };
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  return {
    purchases,
    loading,
    fromCache,
    isOnline,
    refetch,
    createPurchase,
    deletePurchase,
  };
}

// =============== SUPPLIERS ===============

export function useOfflineSuppliersExt() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineDataService.getSuppliers();
      setSuppliers(result.suppliers || []);
      setFromCache(result.fromCache);
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
    try {
      const result = await offlineDataService.createSupplier(data);
      await refetch();
      return { supplier: result.supplier, offline: result.offline };
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  const updateSupplier = useCallback(async (id: string, data: any) => {
    try {
      await offlineShopService.updateSupplier({ id, ...data });
      await refetch();
      return { offline: !isOnline };
    } catch (error) {
      throw error;
    }
  }, [isOnline, refetch]);

  const deleteSupplier = useCallback(async (id: string) => {
    try {
      await offlineShopService.deleteSupplier(id);
      await refetch();
      return { offline: !isOnline };
    } catch (error) {
      throw error;
    }
  }, [isOnline, refetch]);

  const deleteSuppliers = useCallback(async (ids: string[]) => {
    try {
      const result = await offlineShopService.deleteSuppliers(ids);
      await refetch();
      return result;
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  return {
    suppliers,
    loading,
    fromCache,
    isOnline,
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
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineShopService.getAdjustments(filterType ? { type: filterType } : {});
      setAdjustments(result.adjustments || []);
      setFromCache(!isOnline);
    } catch (error) {
      console.error('Failed to fetch adjustments:', error);
      setAdjustments([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, isOnline, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createAdjustment = useCallback(async (data: any) => {
    try {
      const result = await offlineShopService.createAdjustment(data);
      await refetch();
      return { adjustment: result.adjustment, offline: !isOnline };
    } catch (error) {
      throw error;
    }
  }, [isOnline, refetch]);

  const deleteAdjustments = useCallback(async (ids: string[]) => {
    try {
      const result = await offlineShopService.deleteAdjustments(ids);
      await refetch();
      return result;
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  return {
    adjustments,
    loading,
    fromCache,
    isOnline,
    refetch,
    createAdjustment,
    deleteAdjustments,
  };
}

// =============== RETURNS ===============

export function useOfflineReturns(returnType?: 'sale' | 'purchase') {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineDataService.getReturns(returnType);
      setReturns(result.returns || []);
      setFromCache(result.fromCache);
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
    try {
      const result = await offlineDataService.createReturn(data);
      await refetch();
      return { return: result.return, offline: result.offline };
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  return {
    returns,
    loading,
    fromCache,
    isOnline,
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
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineDataService.getLoans();
      let filteredLoans = result.loans || [];
      
      if (statusFilter && statusFilter !== 'all') {
        filteredLoans = filteredLoans.filter((l: any) => l.status === statusFilter);
      }
      
      setLoans(filteredLoans);
      setFromCache(result.fromCache);
      
      // Calculate stats
      const totalLoans = filteredLoans.reduce((sum: number, l: any) => sum + Number(l.total_amount || 0), 0);
      const totalPaid = filteredLoans.reduce((sum: number, l: any) => sum + Number(l.paid_amount || 0), 0);
      const totalRemaining = filteredLoans.reduce((sum: number, l: any) => sum + Number(l.remaining_amount || 0), 0);
      
      setStats({
        totalLoans,
        totalPaid,
        totalRemaining,
        monthlyEmi: 0,
        upcomingCount: 0,
        overdueCount: filteredLoans.filter((l: any) => l.status === 'overdue').length,
        activeCount: filteredLoans.filter((l: any) => l.status === 'active').length,
        completedCount: filteredLoans.filter((l: any) => l.status === 'paid').length,
      });
      
      setUpcomingLoans([]);
      setOverdueLoans(filteredLoans.filter((l: any) => l.status === 'overdue'));
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
    try {
      const result = await offlineDataService.createLoan(data);
      await refetch();
      return { loan: result.loan, offline: result.offline };
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  const deleteLoan = useCallback(async (id: string) => {
    try {
      const result = await offlineDataService.deleteLoan(id);
      await refetch();
      return { offline: result.offline };
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  return {
    loans,
    stats,
    upcomingLoans,
    overdueLoans,
    loading,
    fromCache,
    isOnline,
    refetch,
    createLoan,
    deleteLoan,
  };
}

// =============== STAFF ===============

export function useOfflineStaff() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineDataService.getStaff();
      setStaff(result.staff || []);
      setFromCache(result.fromCache);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createStaff = useCallback(async (data: any) => {
    try {
      const result = await offlineDataService.createStaff(data);
      await refetch();
      return { staff: result.staff, offline: result.offline };
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  const updateStaff = useCallback(async (data: any) => {
    try {
      const result = await offlineDataService.updateStaff(data);
      await refetch();
      return { staff: result.staff, offline: result.offline };
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  const deleteStaff = useCallback(async (id: string) => {
    try {
      const result = await offlineDataService.deleteStaff(id);
      await refetch();
      return { offline: result.offline };
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  return {
    staff,
    loading,
    fromCache,
    isOnline,
    refetch,
    createStaff,
    updateStaff,
    deleteStaff,
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
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, purchasesRes, expensesRes, customersRes, suppliersRes, productsRes] = await Promise.all([
        offlineDataService.getSales(),
        offlineShopService.getPurchases(),
        offlineDataService.getExpenses(),
        offlineDataService.getCustomers(),
        offlineDataService.getSuppliers(),
        offlineDataService.getProducts(),
      ]);

      setData({
        sales: salesRes.sales || [],
        purchases: purchasesRes.purchases || [],
        expenses: expensesRes.expenses || [],
        customers: customersRes.customers || [],
        suppliers: suppliersRes.suppliers || [],
        products: productsRes.products || [],
      });
      setFromCache(salesRes.fromCache);
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
    fromCache,
    isOnline,
    refetch,
  };
}

// =============== DUE CUSTOMERS ===============

export function useOfflineDueCustomers() {
  const [dueCustomers, setDueCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await offlineDataService.getSales();
      const allSales = response.sales || [];
      
      // Filter sales with due amount > 0
      const dueSales = allSales.filter((sale: any) => 
        sale.due_amount && Number(sale.due_amount) > 0
      );
      
      // Group by customer
      const customerMap = new Map<string, any>();
      
      for (const sale of dueSales) {
        let customerName = sale.customer_name || "Walk-in Customer";
        let customerPhone = sale.customer_phone || null;
        const customerId = sale.customer_id || null;
        
        const key = customerId || `walk-in-${customerName}-${customerPhone || 'unknown'}`;
        
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            customerId,
            customerName,
            customerPhone,
            totalSales: 0,
            totalPaid: 0,
            totalDue: 0,
            salesCount: 0,
            sales: [],
          });
        }
        
        const customer = customerMap.get(key)!;
        customer.totalSales += Number(sale.total) || 0;
        customer.totalPaid += Number(sale.paid_amount) || 0;
        customer.totalDue += Number(sale.due_amount) || 0;
        customer.salesCount += 1;
        customer.sales.push({
          id: sale.id,
          invoice_number: sale.invoice_number,
          sale_date: sale.sale_date,
          total: Number(sale.total),
          paid_amount: Number(sale.paid_amount),
          due_amount: Number(sale.due_amount),
          customer_id: sale.customer_id,
          customer_name: customerName,
          notes: sale.notes,
        });
      }
      
      const customers = Array.from(customerMap.values()).sort(
        (a, b) => b.totalDue - a.totalDue
      );
      
      setDueCustomers(customers);
      setFromCache(response.fromCache);
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
    try {
      await offlineShopService.updateSale(saleId, {
        paid_amount: paidAmount,
        due_amount: dueAmount,
        payment_status: dueAmount <= 0 ? "paid" : "partial",
      });
      await refetch();
      return { offline: !isOnline };
    } catch (error) {
      throw error;
    }
  }, [isOnline, refetch]);

  const deleteSales = useCallback(async (ids: string[]) => {
    try {
      const result = await offlineShopService.deleteSales(ids);
      await refetch();
      return result;
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  return {
    dueCustomers,
    loading,
    fromCache,
    isOnline,
    refetch,
    updateSalePayment,
    deleteSales,
  };
}

// =============== DAILY CASH REGISTER ===============

export function useOfflineCashRegister() {
  const [registers, setRegisters] = useState<any[]>([]);
  const [todayRegister, setTodayRegister] = useState<any>(null);
  const [hasOpenRegister, setHasOpenRegister] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineDataService.getCashRegisters();
      setRegisters(result.registers || []);
      setTodayRegister(result.todayRegister || null);
      setHasOpenRegister(result.hasOpenRegister || false);
      setFromCache(result.fromCache);
    } catch (error) {
      console.error('Failed to fetch cash registers:', error);
      // Fallback to API
      try {
        const result = await offlineShopService.getCashRegisters({});
        setRegisters(result.registers || []);
        setTodayRegister(result.todayRegister || null);
        setHasOpenRegister(result.hasOpenRegister || false);
        setFromCache(false);
      } catch (e) {
        setRegisters([]);
      }
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const openRegister = useCallback(async (openingCash: number, notes?: string) => {
    try {
      const result = await offlineDataService.openCashRegister(openingCash, notes);
      await refetch();
      return result;
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  const closeRegister = useCallback(async (closingCash: number, notes?: string) => {
    try {
      const result = await offlineDataService.closeCashRegister(closingCash, notes);
      await refetch();
      return result;
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  const addQuickExpense = useCallback(async (amount: number, description?: string) => {
    try {
      const result = await offlineDataService.addQuickExpense(amount, description);
      await refetch();
      return result;
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  const deleteQuickExpense = useCallback(async (expenseId: string) => {
    try {
      await offlineDataService.deleteQuickExpense(expenseId);
      await refetch();
      return { offline: true };
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  return {
    registers,
    todayRegister,
    hasOpenRegister,
    loading,
    fromCache,
    isOnline,
    refetch,
    openRegister,
    closeRegister,
    addQuickExpense,
    deleteQuickExpense,
  };
}

// =============== TRASH ===============

export function useOfflineTrash(table?: string) {
  const [trash, setTrash] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineShopService.getTrash(table);
      setTrash(result.trash || []);
    } catch (error) {
      console.error('Failed to fetch trash:', error);
      setTrash([]);
    } finally {
      setLoading(false);
    }
  }, [table, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const restoreItem = useCallback(async (id: string) => {
    try {
      await offlineShopService.restoreFromTrash(id);
      await refetch();
      return { offline: !isOnline };
    } catch (error) {
      throw error;
    }
  }, [isOnline, refetch]);

  const permanentDelete = useCallback(async (id: string) => {
    try {
      await offlineShopService.permanentDelete(id);
      await refetch();
      return { offline: !isOnline };
    } catch (error) {
      throw error;
    }
  }, [isOnline, refetch]);

  const emptyTrash = useCallback(async () => {
    try {
      await offlineShopService.emptyTrash();
      await refetch();
      return { offline: !isOnline };
    } catch (error) {
      throw error;
    }
  }, [isOnline, refetch]);

  return {
    trash,
    loading,
    isOnline,
    refetch,
    restoreItem,
    permanentDelete,
    emptyTrash,
  };
}

// =============== PRODUCTS (for price calculator) ===============

export function useOfflineProductsSimple() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await offlineDataService.getProducts();
      setProducts(result.products || []);
      setFromCache(result.fromCache);
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
    fromCache,
    isOnline,
    refetch,
  };
}
