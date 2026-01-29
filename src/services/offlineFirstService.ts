/**
 * Offline-First Service Layer
 * 
 * This service provides true offline-first functionality:
 * - When ONLINE: Fetches from API, caches to IndexedDB
 * - When OFFLINE: Reads from IndexedDB, queues writes for sync
 * 
 * All shop features work without internet connection.
 */

import { offlineDb, StoreName } from '@/lib/offlineDatabase';
import { syncManager } from '@/lib/syncManager';
import { offlineShopService } from './offlineShopService';
import { generateUUID, generateInvoiceNumber } from '@/lib/offlineUtils';

const CURRENT_SHOP_KEY = 'autofloy_current_shop_id';

class OfflineFirstService {
  private getShopId(): string | null {
    return localStorage.getItem(CURRENT_SHOP_KEY);
  }

  private isOnline(): boolean {
    return navigator.onLine;
  }

  // ============ PRODUCTS ============

  async getProducts(): Promise<{ products: any[] }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getProducts();
        // Cache to IndexedDB
        if (result.products?.length > 0) {
          await offlineDb.putMany('products', result.products);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    // Offline or API failed - read from IndexedDB
    await offlineDb.init();
    const products = await offlineDb.getAll('products', shopId || undefined);
    return { products };
  }

  async createProduct(data: any): Promise<{ product: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.createProduct(data);
        // Cache to IndexedDB
        if (result.product) {
          await offlineDb.put('products', result.product);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    // Offline - save locally and queue for sync
    const product = {
      id: generateUUID(),
      ...data,
      shop_id: shopId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.init();
    await offlineDb.put('products', product);
    await syncManager.queueOperation('products', 'create', product, shopId || '');
    
    return { product };
  }

  async updateProduct(data: any): Promise<{ product: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.updateProduct(data);
        if (result.product) {
          await offlineDb.put('products', result.product);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    // Offline update
    const existing = await offlineDb.get('products', data.id);
    const product = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.put('products', product);
    await syncManager.queueOperation('products', 'update', product, shopId || '');
    
    return { product };
  }

  async deleteProduct(id: string): Promise<void> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        await offlineShopService.deleteProduct(id);
        await offlineDb.delete('products', id);
        return;
      } catch (error) {
        console.log('[OfflineFirst] API failed, deleting locally');
      }
    }
    
    await offlineDb.delete('products', id);
    await syncManager.queueOperation('products', 'delete', { id }, shopId || '');
  }

  async deleteProducts(ids: string[]): Promise<any> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.deleteProducts(ids);
        await offlineDb.deleteMany('products', ids);
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, deleting locally');
      }
    }
    
    await offlineDb.deleteMany('products', ids);
    await syncManager.queueOperation('products', 'delete', { ids }, shopId || '');
    return { deleted: ids };
  }

  // ============ CATEGORIES ============

  async getCategories(): Promise<{ categories: any[] }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getCategories();
        if (result.categories?.length > 0) {
          await offlineDb.putMany('categories', result.categories);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    await offlineDb.init();
    const categories = await offlineDb.getAll('categories', shopId || undefined);
    return { categories };
  }

  async createCategory(data: { name: string; description?: string }): Promise<{ category: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.createCategory(data);
        if (result.category) {
          await offlineDb.put('categories', result.category);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    const category = {
      id: generateUUID(),
      ...data,
      shop_id: shopId,
      created_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.init();
    await offlineDb.put('categories', category);
    await syncManager.queueOperation('categories', 'create', category, shopId || '');
    
    return { category };
  }

  async deleteCategory(id: string): Promise<void> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        await offlineShopService.deleteCategory(id);
        await offlineDb.delete('categories', id);
        return;
      } catch (error) {
        console.log('[OfflineFirst] API failed, deleting locally');
      }
    }
    
    await offlineDb.delete('categories', id);
    await syncManager.queueOperation('categories', 'delete', { id }, shopId || '');
  }

  // ============ CUSTOMERS ============

  async getCustomers(): Promise<{ customers: any[] }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getCustomers();
        if (result.customers?.length > 0) {
          await offlineDb.putMany('customers', result.customers);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    await offlineDb.init();
    const customers = await offlineDb.getAll('customers', shopId || undefined);
    return { customers };
  }

  async createCustomer(data: any): Promise<{ customer: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.createCustomer(data);
        if (result.customer) {
          await offlineDb.put('customers', result.customer);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    const customer = {
      id: generateUUID(),
      ...data,
      shop_id: shopId,
      total_due: 0,
      total_purchases: 0,
      created_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.init();
    await offlineDb.put('customers', customer);
    await syncManager.queueOperation('customers', 'create', customer, shopId || '');
    
    return { customer };
  }

  async updateCustomer(data: any): Promise<{ customer: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.updateCustomer(data);
        if (result.customer) {
          await offlineDb.put('customers', result.customer);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    const existing = await offlineDb.get('customers', data.id);
    const customer = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.put('customers', customer);
    await syncManager.queueOperation('customers', 'update', customer, shopId || '');
    
    return { customer };
  }

  async deleteCustomer(id: string): Promise<void> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        await offlineShopService.deleteCustomer(id);
        await offlineDb.delete('customers', id);
        return;
      } catch (error) {
        console.log('[OfflineFirst] API failed, deleting locally');
      }
    }
    
    await offlineDb.delete('customers', id);
    await syncManager.queueOperation('customers', 'delete', { id }, shopId || '');
  }

  async deleteCustomers(ids: string[]): Promise<any> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.deleteCustomers(ids);
        await offlineDb.deleteMany('customers', ids);
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, deleting locally');
      }
    }
    
    await offlineDb.deleteMany('customers', ids);
    await syncManager.queueOperation('customers', 'delete', { ids }, shopId || '');
    return { deleted: ids };
  }

  // ============ SUPPLIERS ============

  async getSuppliers(): Promise<{ suppliers: any[] }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getSuppliers();
        if (result.suppliers?.length > 0) {
          await offlineDb.putMany('suppliers', result.suppliers);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    await offlineDb.init();
    const suppliers = await offlineDb.getAll('suppliers', shopId || undefined);
    return { suppliers };
  }

  async createSupplier(data: any): Promise<{ supplier: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.createSupplier(data);
        if (result.supplier) {
          await offlineDb.put('suppliers', result.supplier);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    const supplier = {
      id: generateUUID(),
      ...data,
      shop_id: shopId,
      total_due: 0,
      created_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.init();
    await offlineDb.put('suppliers', supplier);
    await syncManager.queueOperation('suppliers', 'create', supplier, shopId || '');
    
    return { supplier };
  }

  async updateSupplier(data: any): Promise<{ supplier: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.updateSupplier(data);
        if (result.supplier) {
          await offlineDb.put('suppliers', result.supplier);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    const existing = await offlineDb.get('suppliers', data.id);
    const supplier = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.put('suppliers', supplier);
    await syncManager.queueOperation('suppliers', 'update', supplier, shopId || '');
    
    return { supplier };
  }

  async deleteSupplier(id: string): Promise<void> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        await offlineShopService.deleteSupplier(id);
        await offlineDb.delete('suppliers', id);
        return;
      } catch (error) {
        console.log('[OfflineFirst] API failed, deleting locally');
      }
    }
    
    await offlineDb.delete('suppliers', id);
    await syncManager.queueOperation('suppliers', 'delete', { id }, shopId || '');
  }

  // ============ SALES ============

  async getSales(params?: { startDate?: string; endDate?: string }): Promise<{ sales: any[] }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getSales(params);
        if (result.sales?.length > 0) {
          await offlineDb.putMany('sales', result.sales);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    await offlineDb.init();
    let sales = await offlineDb.getAll('sales', shopId || undefined);
    
    // Apply date filters if provided
    if (params?.startDate || params?.endDate) {
      sales = sales.filter((sale: any) => {
        const saleDate = new Date(sale.sale_date || sale.created_at);
        if (params.startDate && saleDate < new Date(params.startDate)) return false;
        if (params.endDate && saleDate > new Date(params.endDate + 'T23:59:59')) return false;
        return true;
      });
    }
    
    return { sales };
  }

  async createSale(data: any): Promise<{ sale: any; invoice_number: string }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.createSale(data);
        if (result.sale) {
          await offlineDb.put('sales', result.sale);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    // Generate offline invoice number
    const invoiceNumber = generateInvoiceNumber('INV-', shopId || '');
    
    // Calculate totals
    const subtotal = data.items?.reduce((sum: number, item: any) => sum + (item.total || item.quantity * item.unit_price), 0) || 0;
    const total = subtotal - (data.discount || 0) + (data.tax || 0);
    const dueAmount = total - (data.paid_amount || 0);
    
    const sale = {
      id: generateUUID(),
      ...data,
      invoice_number: invoiceNumber,
      shop_id: shopId,
      subtotal,
      total,
      due_amount: dueAmount,
      payment_status: dueAmount > 0 ? 'partial' : 'paid',
      sale_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.init();
    await offlineDb.put('sales', sale);
    await syncManager.queueOperation('sales', 'create', sale, shopId || '');
    
    // Update product stock locally
    if (data.items) {
      for (const item of data.items) {
        if (item.product_id) {
          const product = await offlineDb.get('products', item.product_id);
          if (product) {
            product.stock_quantity = (product.stock_quantity || 0) - item.quantity;
            await offlineDb.put('products', product);
          }
        }
      }
    }
    
    return { sale, invoice_number: invoiceNumber };
  }

  async updateSale(id: string, updates: any): Promise<{ sale: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.updateSale(id, updates);
        if (result.sale) {
          await offlineDb.put('sales', result.sale);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    const existing = await offlineDb.get('sales', id);
    const sale = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.put('sales', sale);
    await syncManager.queueOperation('sales', 'update', { id, ...updates }, shopId || '');
    
    return { sale };
  }

  async deleteSale(id: string): Promise<void> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        await offlineShopService.deleteSale(id);
        await offlineDb.delete('sales', id);
        return;
      } catch (error) {
        console.log('[OfflineFirst] API failed, deleting locally');
      }
    }
    
    await offlineDb.delete('sales', id);
    await syncManager.queueOperation('sales', 'delete', { id }, shopId || '');
  }

  async deleteSales(ids: string[]): Promise<any> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.deleteSales(ids);
        await offlineDb.deleteMany('sales', ids);
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, deleting locally');
      }
    }
    
    await offlineDb.deleteMany('sales', ids);
    await syncManager.queueOperation('sales', 'delete', { ids }, shopId || '');
    return { deleted: ids };
  }

  // ============ EXPENSES ============

  async getExpenses(params?: { startDate?: string; endDate?: string }): Promise<{ expenses: any[] }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getExpenses(params);
        if (result.expenses?.length > 0) {
          await offlineDb.putMany('expenses', result.expenses);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    await offlineDb.init();
    let expenses = await offlineDb.getAll('expenses', shopId || undefined);
    
    if (params?.startDate || params?.endDate) {
      expenses = expenses.filter((exp: any) => {
        const expDate = new Date(exp.expense_date || exp.created_at);
        if (params.startDate && expDate < new Date(params.startDate)) return false;
        if (params.endDate && expDate > new Date(params.endDate + 'T23:59:59')) return false;
        return true;
      });
    }
    
    return { expenses };
  }

  async createExpense(data: any): Promise<{ expense: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.createExpense(data);
        if (result.expense) {
          await offlineDb.put('expenses', result.expense);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    const expense = {
      id: generateUUID(),
      ...data,
      shop_id: shopId,
      expense_date: data.expense_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.init();
    await offlineDb.put('expenses', expense);
    await syncManager.queueOperation('expenses', 'create', expense, shopId || '');
    
    return { expense };
  }

  async deleteExpense(id: string): Promise<void> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        await offlineShopService.deleteExpense(id);
        await offlineDb.delete('expenses', id);
        return;
      } catch (error) {
        console.log('[OfflineFirst] API failed, deleting locally');
      }
    }
    
    await offlineDb.delete('expenses', id);
    await syncManager.queueOperation('expenses', 'delete', { id }, shopId || '');
  }

  // ============ CASH TRANSACTIONS ============

  async getCashTransactions(): Promise<{ transactions: any[] }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getCashTransactions();
        if (result.transactions?.length > 0) {
          await offlineDb.putMany('cashTransactions', result.transactions);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    await offlineDb.init();
    const transactions = await offlineDb.getAll('cashTransactions', shopId || undefined);
    return { transactions };
  }

  async createCashTransaction(data: any): Promise<{ transaction: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.createCashTransaction(data);
        if (result.transaction) {
          await offlineDb.put('cashTransactions', result.transaction);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    const transaction = {
      id: generateUUID(),
      ...data,
      shop_id: shopId,
      transaction_date: data.transaction_date || new Date().toISOString(),
      created_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.init();
    await offlineDb.put('cashTransactions', transaction);
    await syncManager.queueOperation('cashTransactions', 'create', transaction, shopId || '');
    
    return { transaction };
  }

  // ============ SETTINGS ============

  async getSettings(): Promise<{ settings: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getSettings();
        if (result.settings) {
          await offlineDb.put('settings', { ...result.settings, shop_id: shopId });
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    await offlineDb.init();
    const settings = await offlineDb.get('settings', shopId || '');
    return { settings: settings || {} };
  }

  async updateSettings(updates: any): Promise<{ settings: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.updateSettings(updates);
        if (result.settings) {
          await offlineDb.put('settings', { ...result.settings, shop_id: shopId });
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    const existing = await offlineDb.get('settings', shopId || '');
    const settings = {
      ...existing,
      ...updates,
      shop_id: shopId,
      _isLocal: true,
    };
    
    await offlineDb.put('settings', settings);
    await syncManager.queueOperation('settings', 'update', settings, shopId || '');
    
    return { settings };
  }

  // ============ TRASH ============

  async getTrash(): Promise<{ trash: any[] }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getTrash();
        const trashItems = result.trash || [];
        if (trashItems.length > 0) {
          await offlineDb.putMany('trash', trashItems);
        }
        return { trash: trashItems };
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    await offlineDb.init();
    const trash = await offlineDb.getAll('trash', shopId || undefined);
    return { trash: trash || [] };
  }

  async restoreFromTrash(id: string, type: string): Promise<void> {
    if (this.isOnline()) {
      try {
        await offlineShopService.restoreFromTrash(id, type);
        await offlineDb.delete('trash', id);
        return;
      } catch (error) {
        console.log('[OfflineFirst] API failed for restore');
        throw error; // Restore requires online
      }
    }
    throw new Error('Restore requires internet connection');
  }

  async permanentDelete(id: string, type: string): Promise<void> {
    if (this.isOnline()) {
      try {
        await offlineShopService.permanentDelete(id, type);
        await offlineDb.delete('trash', id);
        return;
      } catch (error) {
        console.log('[OfflineFirst] API failed for permanent delete');
        throw error;
      }
    }
    throw new Error('Permanent delete requires internet connection');
  }

  async emptyTrash(): Promise<void> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        await offlineShopService.emptyTrash();
        // Clear local trash
        const trash = await offlineDb.getAll('trash', shopId || undefined);
        await offlineDb.deleteMany('trash', trash.map((t: any) => t.id));
        return;
      } catch (error) {
        console.log('[OfflineFirst] API failed for empty trash');
        throw error;
      }
    }
    throw new Error('Empty trash requires internet connection');
  }

  // ============ DASHBOARD ============

  async getDashboard(range: 'today' | 'week' | 'month' = 'today'): Promise<any> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        return await offlineShopService.getDashboard(range);
      } catch (error) {
        console.log('[OfflineFirst] API failed, calculating locally');
      }
    }
    
    // Calculate dashboard stats from local data
    await offlineDb.init();
    const sales = await offlineDb.getAll('sales', shopId || undefined);
    const expenses = await offlineDb.getAll('expenses', shopId || undefined);
    const products = await offlineDb.getAll('products', shopId || undefined);
    
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.toISOString().split('T')[0]);
    }
    
    const filteredSales = sales.filter((s: any) => new Date(s.sale_date || s.created_at) >= startDate);
    const filteredExpenses = expenses.filter((e: any) => new Date(e.expense_date || e.created_at) >= startDate);
    
    const totalRevenue = filteredSales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    const totalProfit = totalRevenue - totalExpenses;
    const lowStockCount = products.filter((p: any) => (p.stock_quantity || 0) <= (p.low_stock_threshold || 5)).length;
    
    return {
      dashboard: {
        totalRevenue,
        totalExpenses,
        totalProfit,
        salesCount: filteredSales.length,
        lowStockCount,
        dueAmount: filteredSales.reduce((sum: number, s: any) => sum + (s.due_amount || 0), 0),
      }
    };
  }

  // ============ PURCHASES ============

  async getPurchases(): Promise<{ purchases: any[] }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getPurchases();
        if (result.purchases?.length > 0) {
          await offlineDb.putMany('purchases', result.purchases);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    await offlineDb.init();
    const purchases = await offlineDb.getAll('purchases', shopId || undefined);
    return { purchases };
  }

  async createPurchase(data: any): Promise<{ purchase: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.createPurchase(data);
        if (result.purchase) {
          await offlineDb.put('purchases', result.purchase);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    const total = data.items?.reduce((sum: number, item: any) => sum + (item.total || item.quantity * item.unit_price), 0) || 0;
    
    const purchase = {
      id: generateUUID(),
      ...data,
      shop_id: shopId,
      total,
      due_amount: total - (data.paid_amount || 0),
      purchase_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.init();
    await offlineDb.put('purchases', purchase);
    await syncManager.queueOperation('purchases', 'create', purchase, shopId || '');
    
    // Update product stock locally
    if (data.items) {
      for (const item of data.items) {
        if (item.product_id) {
          const product = await offlineDb.get('products', item.product_id);
          if (product) {
            product.stock_quantity = (product.stock_quantity || 0) + item.quantity;
            await offlineDb.put('products', product);
          }
        }
      }
    }
    
    return { purchase };
  }

  // ============ STOCK ADJUSTMENTS ============

  async getStockAdjustments(params?: { filterType?: string }): Promise<{ adjustments: any[] }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getStockAdjustments(params);
        if (result.adjustments?.length > 0) {
          await offlineDb.putMany('adjustments', result.adjustments);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    await offlineDb.init();
    let adjustments = await offlineDb.getAll('adjustments', shopId || undefined);
    
    if (params?.filterType && params.filterType !== 'all') {
      adjustments = adjustments.filter((a: any) => a.adjustment_type === params.filterType);
    }
    
    return { adjustments };
  }

  async createStockAdjustment(data: any): Promise<{ adjustment: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.createStockAdjustment(data);
        if (result.adjustment) {
          await offlineDb.put('adjustments', result.adjustment);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    const adjustment = {
      id: generateUUID(),
      ...data,
      shop_id: shopId,
      created_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.init();
    await offlineDb.put('adjustments', adjustment);
    await syncManager.queueOperation('adjustments', 'create', adjustment, shopId || '');
    
    // Update product stock
    if (data.product_id) {
      const product = await offlineDb.get('products', data.product_id);
      if (product) {
        const quantityChange = data.adjustment_type === 'add' ? data.quantity : -data.quantity;
        product.stock_quantity = (product.stock_quantity || 0) + quantityChange;
        await offlineDb.put('products', product);
      }
    }
    
    return { adjustment };
  }

  // ============ RETURNS ============

  async getReturns(): Promise<{ returns: any[] }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getReturns();
        if (result.returns?.length > 0) {
          await offlineDb.putMany('returns', result.returns);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    await offlineDb.init();
    const returns = await offlineDb.getAll('returns', shopId || undefined);
    return { returns };
  }

  // ============ LOANS ============

  async getLoans(): Promise<{ loans: any[] }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getLoans();
        if (result.loans?.length > 0) {
          await offlineDb.putMany('loans', result.loans);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    await offlineDb.init();
    const loans = await offlineDb.getAll('loans', shopId || undefined);
    return { loans };
  }

  async createLoan(data: any): Promise<{ loan: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.createLoan(data);
        if (result.loan) {
          await offlineDb.put('loans', result.loan);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    const loan = {
      id: generateUUID(),
      ...data,
      shop_id: shopId,
      remaining_amount: data.amount,
      status: 'active',
      created_at: new Date().toISOString(),
      _isLocal: true,
    };
    
    await offlineDb.init();
    await offlineDb.put('loans', loan);
    await syncManager.queueOperation('loans', 'create', loan, shopId || '');
    
    return { loan };
  }

  // ============ REPORTS ============

  async getReports(type: string, params?: { startDate?: string; endDate?: string }): Promise<any> {
    if (this.isOnline()) {
      try {
        return await offlineShopService.getReports(type, params);
      } catch (error) {
        console.log('[OfflineFirst] API failed, generating local report');
      }
    }
    
    // Generate basic reports from local data
    const shopId = this.getShopId();
    await offlineDb.init();
    
    const sales = await offlineDb.getAll('sales', shopId || undefined);
    const expenses = await offlineDb.getAll('expenses', shopId || undefined);
    const products = await offlineDb.getAll('products', shopId || undefined);
    
    // Filter by date if provided
    let filteredSales = sales;
    let filteredExpenses = expenses;
    
    if (params?.startDate) {
      const start = new Date(params.startDate);
      filteredSales = filteredSales.filter((s: any) => new Date(s.sale_date || s.created_at) >= start);
      filteredExpenses = filteredExpenses.filter((e: any) => new Date(e.expense_date || e.created_at) >= start);
    }
    
    if (params?.endDate) {
      const end = new Date(params.endDate + 'T23:59:59');
      filteredSales = filteredSales.filter((s: any) => new Date(s.sale_date || s.created_at) <= end);
      filteredExpenses = filteredExpenses.filter((e: any) => new Date(e.expense_date || e.created_at) <= end);
    }
    
    const totalRevenue = filteredSales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    
    return {
      report: {
        type,
        totalRevenue,
        totalExpenses,
        profit: totalRevenue - totalExpenses,
        salesCount: filteredSales.length,
        productCount: products.length,
        _offline: true,
      }
    };
  }

  // ============ CASH REGISTER ============

  async getCashRegisters(): Promise<{ registers: any[] }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getCashRegister();
        if (result.registers?.length > 0) {
          await offlineDb.putMany('cashRegisters', result.registers);
        }
        return { registers: result.registers || [] };
      } catch (error) {
        console.log('[OfflineFirst] API failed, falling back to IndexedDB');
      }
    }
    
    await offlineDb.init();
    const registers = await offlineDb.getAll('cashRegisters', shopId || undefined);
    return { registers };
  }

  async openCashRegister(openingCash: number): Promise<{ register: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.openCashRegister(openingCash);
        if (result.register) {
          await offlineDb.put('cashRegisters', result.register);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    const register = {
      id: generateUUID(),
      shop_id: shopId,
      opening_cash: openingCash,
      register_date: new Date().toISOString().split('T')[0],
      opened_at: new Date().toISOString(),
      status: 'open',
      _isLocal: true,
    };
    
    await offlineDb.init();
    await offlineDb.put('cashRegisters', register);
    await syncManager.queueOperation('cashRegisters', 'create', register, shopId || '');
    
    return { register };
  }

  async closeCashRegister(closingCash: number, notes?: string): Promise<{ register: any }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.closeCashRegister(closingCash, notes);
        if (result.register) {
          await offlineDb.put('cashRegisters', result.register);
        }
        return result;
      } catch (error) {
        console.log('[OfflineFirst] API failed, saving locally');
      }
    }
    
    // Find today's open register
    const registers = await offlineDb.getAll('cashRegisters', shopId || undefined);
    const today = new Date().toISOString().split('T')[0];
    const openRegister = registers.find((r: any) => r.register_date === today && r.status === 'open');
    
    if (openRegister) {
      openRegister.closing_cash = closingCash;
      openRegister.notes = notes;
      openRegister.closed_at = new Date().toISOString();
      openRegister.status = 'closed';
      openRegister._isLocal = true;
      
      await offlineDb.put('cashRegisters', openRegister);
      await syncManager.queueOperation('cashRegisters', 'update', openRegister, shopId || '');
      
      return { register: openRegister };
    }
    
    throw new Error('No open register found for today');
  }

  async getTodayRegister(): Promise<{ register: any | null }> {
    const shopId = this.getShopId();
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.getCashRegister();
        return { register: result.todayRegister || null };
      } catch (error) {
        console.log('[OfflineFirst] API failed, checking locally');
      }
    }
    
    await offlineDb.init();
    const registers = await offlineDb.getAll('cashRegisters', shopId || undefined);
    const today = new Date().toISOString().split('T')[0];
    const todayRegister = registers.find((r: any) => r.register_date === today);
    
    return { register: todayRegister || null };
  }

  // ============ SYNC UTILITIES ============

  getSyncStatus() {
    return syncManager.getStatus();
  }

  subscribeSyncStatus(callback: (status: any) => void) {
    return syncManager.subscribe(callback);
  }

  async forceSyncNow() {
    return syncManager.forceSync();
  }

  async performInitialDataSync(shopId: string) {
    return syncManager.performInitialSync(shopId);
  }
}

// Export singleton
export const offlineFirstService = new OfflineFirstService();
