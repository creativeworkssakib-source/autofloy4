/**
 * Sync Manager
 * 
 * Handles background synchronization between local IndexedDB and server.
 * Manages the sync queue, retries failed operations, and maintains sync state.
 */

import { offlineDB, SyncQueueItem } from '@/lib/offlineDB';
import { syncQueue, SyncTable, SyncOperation } from '@/lib/syncQueue';
import { offlineShopService } from './offlineShopService';

const MAX_RETRIES = 3;
const SYNC_BATCH_SIZE = 10;

// Fields that are only for local storage, should never be sent to server
const LOCAL_ONLY_FIELDS = [
  '_locallyCreated',
  '_locallyModified', 
  '_locallyDeleted',
  'custom_category', // This is a frontend-only field
] as const;

// Helper to strip local-only fields before sending to server
function stripLocalFields<T extends Record<string, unknown>>(data: T): T {
  const cleaned = { ...data };
  for (const field of LOCAL_ONLY_FIELDS) {
    delete (cleaned as Record<string, unknown>)[field];
  }
  return cleaned;
}

type SyncListener = (status: SyncStatus) => void;

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  lastError: string | null;
  progress: number; // 0-100
}

class SyncManager {
  private isSyncing = false;
  private lastSyncAt: Date | null = null;
  private lastError: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;
  private progress = 0;
  
  // =============== LISTENERS ===============
  
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }
  
  private pendingCount = 0;
  
  getStatus(): SyncStatus {
    return {
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
      progress: this.progress,
    };
  }
  
  async getStatusWithCount(): Promise<SyncStatus> {
    this.pendingCount = await syncQueue.getPendingCount();
    return {
      ...this.getStatus(),
      pendingCount: this.pendingCount,
    };
  }
  
  async updatePendingCount(): Promise<void> {
    this.pendingCount = await syncQueue.getPendingCount();
    this.notifyListeners();
  }
  
  // =============== AUTO SYNC ===============
  
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync();
      }
    }, intervalMs);
    
    // Also listen for online event
    window.addEventListener('online', this.handleOnline);
  }
  
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    window.removeEventListener('online', this.handleOnline);
  }
  
  private handleOnline = async (): Promise<void> => {
    // Wait a bit for connection to stabilize
    setTimeout(async () => {
      if (navigator.onLine && !this.isSyncing) {
        console.log('[SyncManager] Online - starting auto sync');
        
        // First, push any pending local changes to server
        const result = await this.sync();
        console.log('[SyncManager] Push sync complete:', result);
        
        // Then, pull latest data from server
        const shopId = localStorage.getItem('autofloy_current_shop_id');
        if (shopId && result.success) {
          console.log('[SyncManager] Pulling latest data from server');
          await this.fullSync(shopId);
        }
      }
    }, 2000);
  };
  
  // =============== SYNC OPERATIONS ===============
  
  async sync(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (this.isSyncing) {
      return { success: false, synced: 0, failed: 0 };
    }
    
    if (!navigator.onLine) {
      this.lastError = 'No internet connection';
      this.notifyListeners();
      return { success: false, synced: 0, failed: 0 };
    }
    
    this.isSyncing = true;
    this.lastError = null;
    this.progress = 0;
    this.notifyListeners();
    
    let synced = 0;
    let failed = 0;
    
    try {
      const pendingItems = await syncQueue.getRetryableItems(MAX_RETRIES);
      const totalItems = pendingItems.length;
      
      if (totalItems === 0) {
        this.lastSyncAt = new Date();
        this.progress = 100;
        this.isSyncing = false;
        this.notifyListeners();
        return { success: true, synced: 0, failed: 0 };
      }
      
      // Process in batches
      for (let i = 0; i < pendingItems.length; i += SYNC_BATCH_SIZE) {
        const batch = pendingItems.slice(i, i + SYNC_BATCH_SIZE);
        
        for (const item of batch) {
          try {
            await this.syncItem(item);
            await syncQueue.markSynced(item.id);
            synced++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await syncQueue.markFailed(item.id, errorMessage);
            failed++;
          }
          
          this.progress = Math.round(((i + synced + failed) / totalItems) * 100);
          this.notifyListeners();
        }
      }
      
      // Items are now deleted immediately after sync via markAsSynced
      // No need to call clearSynced anymore
      
      this.lastSyncAt = new Date();
      this.progress = 100;
      
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Sync failed';
      failed++;
    } finally {
      this.isSyncing = false;
      // Update pending count after sync
      await this.updatePendingCount();
    }
    
    return { success: failed === 0, synced, failed };
  }
  
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const { operation, table, data } = item;
    
    switch (table as SyncTable) {
      case 'products':
        await this.syncProduct(operation, data);
        break;
      case 'categories':
        await this.syncCategory(operation, data);
        break;
      case 'customers':
        await this.syncCustomer(operation, data);
        break;
      case 'suppliers':
        await this.syncSupplier(operation, data);
        break;
      case 'sales':
        await this.syncSale(operation, data);
        break;
      case 'purchases':
        await this.syncPurchase(operation, data);
        break;
      case 'expenses':
        await this.syncExpense(operation, data);
        break;
      case 'cashTransactions':
        await this.syncCashTransaction(operation, data);
        break;
      case 'stockAdjustments':
        await this.syncStockAdjustment(operation, data);
        break;
      case 'returns':
        await this.syncReturn(operation, data);
        break;
      case 'loans':
        await this.syncLoan(operation, data);
        break;
      case 'loanPayments':
        await this.syncLoanPayment(operation, data);
        break;
      // Staff feature removed - skip sync for legacy queue items
      case 'staff':
        console.log('[SyncManager] Staff sync skipped - feature removed');
        break;
      case 'dailyCashRegister':
        await this.syncDailyCashRegister(operation, data);
        break;
      default:
        console.warn(`Unknown table for sync: ${table}`);
    }
  }
  
  // =============== TABLE-SPECIFIC SYNC ===============
  
  private async syncProduct(operation: SyncOperation, data: any): Promise<void> {
    const cleanData = stripLocalFields(data);
    switch (operation) {
      case 'create':
        await offlineShopService.createProduct(cleanData);
        break;
      case 'update':
        await offlineShopService.updateProduct(cleanData);
        break;
      case 'delete':
        await offlineShopService.deleteProduct(data.id);
        break;
    }
  }
  
  private async syncCategory(operation: SyncOperation, data: any): Promise<void> {
    const cleanData = stripLocalFields(data);
    switch (operation) {
      case 'create':
        await offlineShopService.createCategory(cleanData);
        break;
      case 'delete':
        await offlineShopService.deleteCategory(data.id);
        break;
      // Note: Category update not supported in current API
    }
  }
  
  private async syncCustomer(operation: SyncOperation, data: any): Promise<void> {
    const cleanData = stripLocalFields(data);
    switch (operation) {
      case 'create':
        await offlineShopService.createCustomer(cleanData);
        break;
      case 'update':
        await offlineShopService.updateCustomer(cleanData);
        break;
      case 'delete':
        await offlineShopService.deleteCustomer(data.id);
        break;
    }
  }
  
  private async syncSupplier(operation: SyncOperation, data: any): Promise<void> {
    const cleanData = stripLocalFields(data);
    switch (operation) {
      case 'create':
        await offlineShopService.createSupplier(cleanData);
        break;
      case 'update':
        await offlineShopService.updateSupplier(cleanData);
        break;
      case 'delete':
        await offlineShopService.deleteSupplier(data.id);
        break;
    }
  }
  
  private async syncSale(operation: SyncOperation, data: any): Promise<void> {
    const cleanData = stripLocalFields(data);
    switch (operation) {
      case 'create':
        await offlineShopService.createSale(cleanData);
        break;
      case 'update':
        await offlineShopService.updateSale(data.id, cleanData);
        break;
      case 'delete':
        await offlineShopService.deleteSale(data.id);
        break;
    }
  }
  
  private async syncPurchase(operation: SyncOperation, data: any): Promise<void> {
    const cleanData = stripLocalFields(data);
    switch (operation) {
      case 'create':
        await offlineShopService.createPurchase(cleanData);
        break;
      case 'delete':
        await offlineShopService.deletePurchase(data.id);
        break;
    }
  }
  
  private async syncExpense(operation: SyncOperation, data: any): Promise<void> {
    const cleanData = stripLocalFields(data);
    switch (operation) {
      case 'create':
        await offlineShopService.createExpense(cleanData);
        break;
      case 'update':
        await offlineShopService.updateExpense(cleanData);
        break;
      case 'delete':
        await offlineShopService.deleteExpense(data.id);
        break;
    }
  }
  
  private async syncCashTransaction(operation: SyncOperation, data: any): Promise<void> {
    const cleanData = stripLocalFields(data);
    if (operation === 'create') {
      await offlineShopService.createCashTransaction(cleanData);
    }
  }
  
  private async syncStockAdjustment(operation: SyncOperation, data: any): Promise<void> {
    const cleanData = stripLocalFields(data);
    if (operation === 'create') {
      await offlineShopService.createAdjustment(cleanData);
    }
  }
  
  private async syncReturn(operation: SyncOperation, data: any): Promise<void> {
    const cleanData = stripLocalFields(data);
    const token = localStorage.getItem("autofloy_token");
    if (!token) throw new Error("No auth token");
    
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    switch (operation) {
      case 'create':
        await fetch(`${baseUrl}/functions/v1/shop-returns`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanData),
        });
        break;
      case 'delete':
        await fetch(`${baseUrl}/functions/v1/shop-returns?id=${data.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        break;
    }
  }
  
  private async syncLoan(operation: SyncOperation, data: any): Promise<void> {
    const cleanData = stripLocalFields(data);
    const token = localStorage.getItem("autofloy_token");
    if (!token) throw new Error("No auth token");
    
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    switch (operation) {
      case 'create':
        await fetch(`${baseUrl}/functions/v1/shop-loans`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanData),
        });
        break;
      case 'update':
        await fetch(`${baseUrl}/functions/v1/shop-loans/${data.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanData),
        });
        break;
      case 'delete':
        await fetch(`${baseUrl}/functions/v1/shop-loans/${data.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        break;
    }
  }
  
  private async syncLoanPayment(operation: SyncOperation, data: any): Promise<void> {
    const cleanData = stripLocalFields(data);
    const token = localStorage.getItem("autofloy_token");
    if (!token) throw new Error("No auth token");
    
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (operation === 'create') {
      await fetch(`${baseUrl}/functions/v1/shop-loans/${data.loan_id}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      });
    }
  }
  
  // Staff feature removed - method kept for backwards compatibility
  private async syncStaff(_operation: SyncOperation, _data: any): Promise<void> {
    // Staff sync removed - feature deprecated
    console.log('[SyncManager] Staff sync skipped - feature removed');
  }
  
  private async syncDailyCashRegister(operation: SyncOperation, data: any): Promise<void> {
    const cleanData = stripLocalFields(data);
    switch (operation) {
      case 'create':
        await offlineShopService.openCashRegister(cleanData.opening_cash, cleanData.notes);
        break;
      case 'update':
        if (cleanData.status === 'closed') {
          await offlineShopService.closeCashRegister(cleanData.closing_cash, cleanData.notes);
        }
        break;
    }
  }
  
  // =============== FULL DATA SYNC ===============
  
  async fullSync(shopId: string): Promise<{ success: boolean; tables: string[] }> {
    if (!navigator.onLine) {
      return { success: false, tables: [] };
    }
    
    this.isSyncing = true;
    this.progress = 0;
    this.notifyListeners();
    
    const syncedTables: string[] = [];
    const token = localStorage.getItem("autofloy_token");
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    try {
      // Sync products (10%)
      const { products } = await offlineShopService.getProducts();
      await offlineDB.bulkSaveProducts(products.map(p => ({
        ...p,
        shop_id: shopId,
        _locallyModified: false,
        _locallyCreated: false,
        _locallyDeleted: false,
      })));
      syncedTables.push('products');
      this.progress = 10;
      this.notifyListeners();
      
      // Sync categories (15%)
      const { categories } = await offlineShopService.getCategories();
      for (const cat of categories) {
        await offlineDB.saveCategory({
          ...cat,
          shop_id: shopId,
          _locallyModified: false,
          _locallyCreated: false,
          _locallyDeleted: false,
        });
      }
      syncedTables.push('categories');
      this.progress = 15;
      this.notifyListeners();
      
      // Sync customers (25%)
      const { customers } = await offlineShopService.getCustomers();
      for (const cust of customers) {
        await offlineDB.saveCustomer({
          ...cust,
          shop_id: shopId,
          _locallyModified: false,
          _locallyCreated: false,
          _locallyDeleted: false,
        });
      }
      syncedTables.push('customers');
      this.progress = 25;
      this.notifyListeners();
      
      // Sync suppliers (35%)
      const { suppliers } = await offlineShopService.getSuppliers();
      for (const supp of suppliers) {
        await offlineDB.saveSupplier({
          ...supp,
          shop_id: shopId,
          _locallyModified: false,
          _locallyCreated: false,
          _locallyDeleted: false,
        });
      }
      syncedTables.push('suppliers');
      this.progress = 35;
      this.notifyListeners();
      
      // Sync sales - last 30 days (45%)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { sales } = await offlineShopService.getSales({
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
      });
      for (const sale of sales) {
        await offlineDB.saveSale({
          ...sale,
          shop_id: shopId,
          _locallyModified: false,
          _locallyCreated: false,
          _locallyDeleted: false,
        });
      }
      syncedTables.push('sales');
      this.progress = 45;
      this.notifyListeners();
      
      // Sync purchases (55%)
      try {
        const { purchases } = await offlineShopService.getPurchases();
        for (const purchase of purchases) {
          await offlineDB.savePurchase({
            ...purchase,
            shop_id: shopId,
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          });
        }
        syncedTables.push('purchases');
      } catch (e) {
        console.error('Failed to sync purchases:', e);
      }
      this.progress = 55;
      this.notifyListeners();
      
      // Sync expenses (60%)
      try {
        const { expenses } = await offlineShopService.getExpenses();
        for (const expense of expenses) {
          await offlineDB.saveExpense({
            ...expense,
            shop_id: shopId,
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          });
        }
        syncedTables.push('expenses');
      } catch (e) {
        console.error('Failed to sync expenses:', e);
      }
      this.progress = 60;
      this.notifyListeners();
      
      // Sync loans (70%)
      if (token) {
        try {
          const loansRes = await fetch(
            `${baseUrl}/functions/v1/shop-loans?shop_id=${shopId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const loansData = await loansRes.json();
          for (const loan of loansData.loans || []) {
            await offlineDB.saveLoan({
              ...loan,
              shop_id: shopId,
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
          }
          syncedTables.push('loans');
        } catch (e) {
          console.error('Failed to sync loans:', e);
        }
      }
      this.progress = 70;
      this.notifyListeners();
      
      // Sync returns (75%)
      if (token) {
        try {
          const returnsRes = await fetch(
            `${baseUrl}/functions/v1/shop-returns`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const returnsData = await returnsRes.json();
          for (const ret of returnsData.returns || []) {
            await offlineDB.saveReturn({
              ...ret,
              shop_id: shopId,
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
          }
          syncedTables.push('returns');
        } catch (e) {
          console.error('Failed to sync returns:', e);
        }
      }
      this.progress = 75;
      this.notifyListeners();
      
      // Staff sync removed - feature deprecated
      this.progress = 80;
      this.notifyListeners();
      
      // Sync cash registers (85%)
      try {
        const cashRegsData = await offlineShopService.getCashRegisters({});
        for (const reg of cashRegsData.registers || []) {
          await offlineDB.saveDailyCashRegister({
            ...reg,
            shop_id: shopId,
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          });
        }
        syncedTables.push('dailyCashRegister');
      } catch (e) {
        console.error('Failed to sync cash registers:', e);
      }
      this.progress = 85;
      this.notifyListeners();
      
      // Sync cash transactions (90%)
      try {
        const { transactions } = await offlineShopService.getCashTransactions();
        for (const tx of transactions) {
          await offlineDB.saveCashTransaction({
            ...tx,
            shop_id: shopId,
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          });
        }
        syncedTables.push('cashTransactions');
      } catch (e) {
        console.error('Failed to sync cash transactions:', e);
      }
      this.progress = 90;
      this.notifyListeners();
      
      // Sync settings (100%)
      try {
        const { settings } = await offlineShopService.getSettings();
        if (settings) {
          await offlineDB.saveSettings({
            ...settings,
            shop_id: shopId,
          });
        }
        syncedTables.push('settings');
      } catch (e) {
        console.error('Failed to sync settings:', e);
      }
      this.progress = 100;
      
      this.lastSyncAt = new Date();
      console.log('[SyncManager] Full sync complete:', syncedTables);
      
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Full sync failed';
      return { success: false, tables: syncedTables };
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
    
    return { success: true, tables: syncedTables };
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
