/**
 * Comprehensive Offline Shop Hooks
 * All hooks needed for complete offline shop functionality
 * 
 * Uses SmartDataService for platform-aware data access:
 * - Browser: Direct Supabase (server-first)
 * - PWA/APK/EXE: Local-first with real-time sync
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineDataService } from '@/services/offlineDataService';
import { offlineShopService } from '@/services/offlineShopService';
import { ShopPurchase, ShopSupplier, ShopStockAdjustment, ShopReturn, ShopLoan, ShopDailyCashRegister } from '@/lib/offlineDB';
import { generateOfflineId } from '@/lib/offlineUtils';
import { useIsOnline } from './useOnlineStatus';
import { useShop } from '@/contexts/ShopContext';
import { smartDataService } from '@/lib/smartDataService';
import { shouldUseLocalFirst, getPlatformName } from '@/lib/platformDetection';

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
      // SERVER-FIRST: When online, fetch from Supabase directly
      if (navigator.onLine) {
        try {
          const result = await offlineShopService.getAdjustments(filterType ? { type: filterType } : {});
          setAdjustments(result.adjustments || []);
          setFromCache(false);
          return;
        } catch (error) {
          console.error('[useOfflineAdjustments] Server fetch failed, using offlineDataService:', error);
        }
      }
      
      // Offline or server failed - use offlineDataService
      const result = await offlineDataService.getStockAdjustments();
      let filteredAdjustments = result.adjustments || [];
      if (filterType) {
        filteredAdjustments = filteredAdjustments.filter((a: any) => a.adjustment_type === filterType);
      }
      setAdjustments(filteredAdjustments);
      setFromCache(result.fromCache);
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
    try {
      // When online, use server directly
      if (navigator.onLine) {
        const result = await offlineShopService.createAdjustment(data);
        await refetch();
        return { adjustment: result.adjustment, offline: false };
      }
      // Offline - use offlineDataService
      const result = await offlineDataService.createStockAdjustment(data);
      await refetch();
      return { adjustment: result.adjustment, offline: result.offline };
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  const deleteAdjustments = useCallback(async (ids: string[]) => {
    try {
      if (navigator.onLine) {
        const result = await offlineShopService.deleteAdjustments(ids);
        await refetch();
        return result;
      }
      // Offline - just refetch (local delete will be queued)
      await refetch();
      return { deleted: ids, offline: true };
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
  const [lastRefetch, setLastRefetch] = useState(0);

  const refetch = useCallback(async () => {
    if (!currentShop?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('[useOfflineCashRegister] Fetching cash registers...');
      
      // IMPORTANT: When online, ALWAYS fetch directly from Supabase for LIVE data
      // This ensures we get the latest quick_expenses, sales, etc.
      if (navigator.onLine) {
        try {
          console.log('[useOfflineCashRegister] Online - fetching from Supabase directly');
          const result = await offlineShopService.getCashRegisters({});
          console.log('[useOfflineCashRegister] Server response:', {
            registersCount: result.registers?.length,
            todayRegister: result.todayRegister ? 'exists' : 'null',
            quickExpenses: result.todayRegister?.quick_expenses?.length || 0
          });
          setRegisters(result.registers || []);
          setTodayRegister(result.todayRegister || null);
          setHasOpenRegister(result.hasOpenRegister || false);
          setFromCache(false);
          setLastRefetch(Date.now());
          return;
        } catch (error) {
          console.error('[useOfflineCashRegister] Server fetch failed, trying offlineDataService:', error);
        }
      }
      
      // Offline or server failed - use offlineDataService which has fallback logic
      console.log('[useOfflineCashRegister] Using offlineDataService (offline or fallback)');
      const result = await offlineDataService.getCashRegisters();
      setRegisters(result.registers || []);
      setTodayRegister(result.todayRegister || null);
      setHasOpenRegister(result.hasOpenRegister || false);
      setFromCache(result.fromCache);
      setLastRefetch(Date.now());
      
    } catch (error) {
      console.error('[useOfflineCashRegister] Failed to fetch cash registers:', error);
      setRegisters([]);
      setTodayRegister(null);
      setHasOpenRegister(false);
    } finally {
      setLoading(false);
    }
  }, [currentShop?.id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const openRegister = useCallback(async (openingCash: number, notes?: string) => {
    try {
      // When online, call server directly for immediate sync
      if (navigator.onLine) {
        const result = await offlineShopService.openCashRegister(openingCash, notes);
        await refetch(); // Refetch to get latest data
        return { register: result.register, offline: false, message: result.message };
      }
      // Offline - use offlineDataService
      const result = await offlineDataService.openCashRegister(openingCash, notes);
      await refetch();
      return result;
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  const closeRegister = useCallback(async (closingCash: number, notes?: string) => {
    try {
      // When online, call server directly
      if (navigator.onLine) {
        const result = await offlineShopService.closeCashRegister(closingCash, notes);
        await refetch();
        return { register: result.register, offline: false, message: result.message };
      }
      const result = await offlineDataService.closeCashRegister(closingCash, notes);
      await refetch();
      return result;
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  const addQuickExpense = useCallback(async (amount: number, description?: string) => {
    try {
      console.log('[useOfflineCashRegister] Adding quick expense:', { amount, description });
      
      // When online, call server directly for immediate sync
      if (navigator.onLine) {
        const result = await offlineShopService.addQuickExpense(amount, description);
        console.log('[useOfflineCashRegister] Quick expense added on server, refreshing...');
        await refetch(); // Refetch to get updated register data with new expense
        return { expense: result.expense, offline: false };
      }
      
      // Offline - use offlineDataService
      const result = await offlineDataService.addQuickExpense(amount, description);
      await refetch();
      return result;
    } catch (error) {
      console.error('[useOfflineCashRegister] Failed to add quick expense:', error);
      throw error;
    }
  }, [refetch]);

  const deleteQuickExpense = useCallback(async (expenseId: string) => {
    try {
      // When online, call server directly
      if (navigator.onLine) {
        await offlineShopService.deleteQuickExpense(expenseId);
        await refetch();
        return { offline: false };
      }
      const result = await offlineDataService.deleteQuickExpense(expenseId);
      await refetch();
      return result;
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
    lastRefetch,
  };
}

// =============== TRASH ===============

export function useOfflineTrash(table?: string) {
  const [trash, setTrash] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      // SERVER-FIRST: Always fetch from server when online
      if (navigator.onLine) {
        try {
          const result = await offlineShopService.getTrash(table);
          setTrash(result.trash || []);
          setFromCache(false);
          return;
        } catch (error) {
          console.error('[useOfflineTrash] Server fetch failed:', error);
        }
      }
      
      // Offline - trash is server-only, show empty
      setTrash([]);
      setFromCache(true);
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
      if (navigator.onLine) {
        await offlineShopService.restoreFromTrash(id);
        await refetch();
        return { offline: false };
      }
      throw new Error('Cannot restore items while offline');
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  const permanentDelete = useCallback(async (id: string) => {
    try {
      if (navigator.onLine) {
        await offlineShopService.permanentDelete(id);
        await refetch();
        return { offline: false };
      }
      throw new Error('Cannot permanently delete while offline');
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  const emptyTrash = useCallback(async () => {
    try {
      if (navigator.onLine) {
        await offlineShopService.emptyTrash();
        await refetch();
        return { offline: false };
      }
      throw new Error('Cannot empty trash while offline');
    } catch (error) {
      throw error;
    }
  }, [refetch]);

  return {
    trash,
    loading,
    fromCache,
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

// =============== DASHBOARD (Smart Sync) ===============

export function useOfflineDashboard(range: 'today' | 'week' | 'month' = 'today') {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();
  const { currentShop } = useShop();
  const [platform, setPlatform] = useState<string>('');
  const [initialized, setInitialized] = useState(false);

  // Initialize smart data service when shop changes
  useEffect(() => {
    const initService = async () => {
      if (currentShop?.id) {
        const userId = localStorage.getItem('autofloy_user_id') || '';
        try {
          await smartDataService.init(currentShop.id, userId);
          setPlatform(getPlatformName());
          setInitialized(true);
          console.log('[useOfflineDashboard] Smart data service initialized');
        } catch (error) {
          console.error('[useOfflineDashboard] Failed to initialize:', error);
          setInitialized(true); // Still set to true to allow fallback
        }
      }
    };
    
    initService();
  }, [currentShop?.id]);

  const refetch = useCallback(async () => {
    if (!currentShop?.id) {
      console.log('[useOfflineDashboard] No shop ID, skipping fetch');
      setLoading(false);
      return;
    }
    
    if (!initialized) {
      console.log('[useOfflineDashboard] Not yet initialized, waiting...');
      return;
    }
    
    setLoading(true);
    try {
      console.log(`[useOfflineDashboard] Fetching dashboard for range: ${range}`);
      
      // Use smart data service which handles:
      // - Browser: Server-first
      // - PWA/APK/EXE + Online: Server-first, save to local
      // - PWA/APK/EXE + Offline: Local-first
      const dashboardData = await smartDataService.getDashboard(range);
      
      if (dashboardData) {
        // Map server data to our expected format
        const mappedData = {
          totalSales: dashboardData.period?.totalSales || dashboardData.totalSales || 0,
          totalExpenses: dashboardData.period?.totalExpenses || dashboardData.totalExpenses || 0,
          totalPurchases: dashboardData.period?.totalPurchases || dashboardData.totalPurchases || 0,
          totalReturns: dashboardData.returns?.totalRefundAmount || dashboardData.totalReturns || 0,
          profit: dashboardData.period?.netProfit || dashboardData.period?.grossProfit || dashboardData.profit || 0,
          salesCount: dashboardData.period?.customersServed || dashboardData.recentSales?.length || dashboardData.salesCount || 0,
          customersCount: dashboardData.totalCustomers || dashboardData.customersCount || 0,
          productsCount: dashboardData.totalProducts || dashboardData.productsCount || 0,
          lowStockItems: dashboardData.lowStockProducts || dashboardData.lowStockItems || [],
          lowStockCount: dashboardData.lowStockProducts?.length || dashboardData.lowStockCount || 0,
          recentSales: dashboardData.recentSales || [],
          recentProducts: dashboardData.recentProducts || [],
          totalDue: dashboardData.lifetime?.totalDue || dashboardData.totalDue || 0,
          totalLoanAmount: dashboardData.totalLoanAmount || 0,
          activeLoansCount: dashboardData.activeLoansCount || 0,
          returnsSummary: dashboardData.returns || dashboardData.returnsSummary || {
            totalCount: 0,
            totalRefundAmount: 0,
            processedCount: 0,
            pendingCount: 0,
            topReasons: [],
          },
          platform,
          fromLocal: dashboardData.fromLocal || false,
        };
        console.log('[useOfflineDashboard] Dashboard data mapped successfully');
        setData(mappedData);
        setFromCache(dashboardData.fromLocal || false);
      }
    } catch (error) {
      console.error('[useOfflineDashboard] Dashboard fetch error:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range, currentShop?.id, platform, initialized]);

  // Refetch when dependencies change
  useEffect(() => {
    if (initialized) {
      refetch();
    }
  }, [refetch, initialized]);

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
