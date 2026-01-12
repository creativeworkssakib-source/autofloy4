/**
 * Comprehensive Offline Shop Hooks
 * All hooks needed for complete offline shop functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineDataService } from '@/services/offlineDataService';
import { offlineShopService } from '@/services/offlineShopService';
import { ShopPurchase, ShopSupplier, ShopStockAdjustment, ShopReturn, ShopLoan, ShopDailyCashRegister } from '@/lib/offlineDB';
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

  const addPayment = useCallback(async (loanId: string, paymentData: any) => {
    try {
      // Update loan locally
      const loan = loans.find(l => l.id === loanId);
      if (loan) {
        const newPaidAmount = (loan.paid_amount || 0) + (paymentData.amount || 0);
        const newRemaining = (loan.total_amount || 0) - newPaidAmount;
        const isCompleted = newRemaining <= 0;
        
        // This will be synced to server via sync queue
        await offlineDataService.updateLoan({
          id: loanId,
          paid_amount: newPaidAmount,
          remaining_amount: Math.max(0, newRemaining),
          status: isCompleted ? 'paid' : loan.status,
        } as any);
        
        await refetch();
        return { offline: !isOnline, isCompleted };
      }
      throw new Error('Loan not found');
    } catch (error) {
      throw error;
    }
  }, [refetch, loans, isOnline]);

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
    addPayment,
  };
}

// =============== STAFF (REMOVED) ===============
// Staff feature has been removed from the application

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

// =============== DASHBOARD (Fully Offline) ===============

export function useOfflineDashboard(range: 'today' | 'week' | 'month' = 'today') {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      // If online, try to get data from server first
      if (isOnline) {
        try {
          const serverData = await offlineShopService.getDashboard(range);
          if (serverData) {
            // Map server data to our expected format
            const mappedData = {
              totalSales: serverData.period?.totalSales || serverData.totalSales || 0,
              totalExpenses: serverData.period?.totalExpenses || serverData.totalExpenses || 0,
              totalPurchases: serverData.period?.totalPurchases || serverData.totalPurchases || 0,
              totalReturns: serverData.returns?.totalRefundAmount || serverData.totalReturns || 0,
              profit: serverData.period?.netProfit || serverData.profit || 0,
              salesCount: serverData.recentSales?.length || serverData.period?.customersServed || 0,
              customersCount: serverData.totalCustomers || serverData.customersCount || 0,
              productsCount: serverData.totalProducts || serverData.productsCount || 0,
              lowStockItems: serverData.lowStockProducts || serverData.lowStockItems || [],
              lowStockCount: serverData.lowStockProducts?.length || serverData.lowStockCount || 0,
              recentSales: serverData.recentSales || [],
              recentProducts: serverData.recentProducts || [],
              totalDue: serverData.lifetime?.totalDue || serverData.totalDue || 0,
              returnsSummary: serverData.returns || serverData.returnsSummary || {
                totalCount: 0,
                totalRefundAmount: 0,
                processedCount: 0,
                pendingCount: 0,
                topReasons: [],
              },
            };
            setData(mappedData);
            setFromCache(false);
            setLoading(false);
            return;
          }
        } catch (serverError) {
          console.warn('Server fetch failed, falling back to local data:', serverError);
        }
      }

      // Fallback to local calculation if offline or server fails
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

      // Fetch all data from local DB
      const [salesResult, expensesResult, purchasesResult, productsResult, customersResult, returnsResult] = await Promise.all([
        offlineDataService.getSales(startDate, endDate),
        offlineDataService.getExpenses(startDate, endDate),
        offlineDataService.getPurchases(startDate, endDate),
        offlineDataService.getProducts(),
        offlineDataService.getCustomers(),
        offlineDataService.getReturns(),
      ]);

      const sales = salesResult.sales || [];
      const expenses = expensesResult.expenses || [];
      const purchases = purchasesResult.purchases || [];
      const products = productsResult.products || [];
      const customers = customersResult.customers || [];
      const returns = returnsResult.returns || [];

      // Calculate stats
      const totalSales = sales.reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);
      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
      const totalPurchases = purchases.reduce((sum: number, p: any) => sum + Number(p.total || 0), 0);
      const totalReturns = returns.reduce((sum: number, r: any) => sum + Number(r.total_amount || 0), 0);
      const profit = totalSales - totalExpenses - totalReturns;

      // Calculate total due from customers
      const totalDue = customers.reduce((sum: number, c: any) => sum + Number(c.total_due || 0), 0);

      // Low stock items
      const lowStockItems = products.filter((p: any) => 
        p.stock_quantity <= (p.min_stock_alert || 5) && p.is_active
      );

      // Recent sales (last 5)
      const recentSales = [...sales]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      // Recent products (last 5)
      const recentProducts = [...products]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      // Returns summary
      const returnsByReason = returns.reduce((acc: any, r: any) => {
        const reason = r.reason || 'Other';
        if (!acc[reason]) {
          acc[reason] = { count: 0, amount: 0 };
        }
        acc[reason].count += 1;
        acc[reason].amount += Number(r.total_amount || r.refund_amount || 0);
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      const topReturnReasons = Object.entries(returnsByReason)
        .map(([reason, data]: [string, any]) => ({ reason, count: data.count, amount: data.amount }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);

      const processedReturns = returns.filter((r: any) => r.status === 'processed' || r.status === 'completed');
      const pendingReturns = returns.filter((r: any) => r.status === 'pending' || !r.status);

      setData({
        totalSales,
        totalExpenses,
        totalPurchases,
        totalReturns,
        profit,
        salesCount: sales.length,
        customersCount: customers.length,
        productsCount: products.length,
        lowStockItems,
        lowStockCount: lowStockItems.length,
        recentSales,
        recentProducts,
        totalDue,
        returnsSummary: {
          totalCount: returns.length,
          totalRefundAmount: totalReturns,
          processedCount: processedReturns.length,
          pendingCount: pendingReturns.length,
          topReasons: topReturnReasons,
        },
      });
      
      setFromCache(true);
    } catch (error) {
      console.error('Failed to calculate dashboard data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range, currentShop?.id, isOnline]);

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

// =============== REPORTS (Fully Offline) ===============

export function useOfflineReports(
  reportType: 'sales' | 'expenses' | 'inventory',
  startDate?: string,
  endDate?: string
) {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      if (reportType === 'sales') {
        const result = await offlineDataService.getSales(startDate, endDate);
        const sales = result.sales || [];
        
        const totalAmount = sales.reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);
        const totalItems = sales.reduce((sum: number, s: any) => sum + (s.items?.length || 0), 0);
        const avgSale = sales.length > 0 ? totalAmount / sales.length : 0;
        
        setReportData({
          records: sales,
          summary: {
            totalAmount,
            totalItems,
            count: sales.length,
            avgSale,
          },
        });
        setFromCache(result.fromCache);
        
      } else if (reportType === 'expenses') {
        const result = await offlineDataService.getExpenses(startDate, endDate);
        const expenses = result.expenses || [];
        
        const totalAmount = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
        const byCategory = expenses.reduce((acc: any, e: any) => {
          const cat = e.category || 'Other';
          acc[cat] = (acc[cat] || 0) + Number(e.amount || 0);
          return acc;
        }, {});
        
        setReportData({
          records: expenses,
          summary: {
            totalAmount,
            count: expenses.length,
            byCategory,
          },
        });
        setFromCache(result.fromCache);
        
      } else if (reportType === 'inventory') {
        const result = await offlineDataService.getProducts();
        const products = result.products || [];
        
        const totalValue = products.reduce((sum: number, p: any) => 
          sum + (Number(p.selling_price || 0) * Number(p.stock_quantity || 0)), 0
        );
        const totalCost = products.reduce((sum: number, p: any) => 
          sum + (Number(p.purchase_price || 0) * Number(p.stock_quantity || 0)), 0
        );
        const lowStock = products.filter((p: any) => 
          p.stock_quantity <= (p.min_stock_alert || 5)
        );
        const outOfStock = products.filter((p: any) => p.stock_quantity === 0);
        
        setReportData({
          records: products,
          summary: {
            totalProducts: products.length,
            totalValue,
            totalCost,
            potentialProfit: totalValue - totalCost,
            lowStockCount: lowStock.length,
            outOfStockCount: outOfStock.length,
          },
        });
        setFromCache(result.fromCache);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [reportType, startDate, endDate, currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    reportData,
    loading,
    fromCache,
    isOnline,
    refetch,
  };
}
