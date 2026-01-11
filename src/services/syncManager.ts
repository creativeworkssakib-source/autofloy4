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
  
  getStatus(): SyncStatus {
    return {
      isSyncing: this.isSyncing,
      pendingCount: 0, // Will be updated async
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
      progress: this.progress,
    };
  }
  
  async getStatusWithCount(): Promise<SyncStatus> {
    const pendingCount = await syncQueue.getPendingCount();
    return {
      ...this.getStatus(),
      pendingCount,
    };
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
  
  private handleOnline = (): void => {
    // Wait a bit for connection to stabilize
    setTimeout(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync();
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
      
      // Clear synced items
      await syncQueue.clearSynced();
      
      this.lastSyncAt = new Date();
      this.progress = 100;
      
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Sync failed';
      failed++;
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
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
      default:
        console.warn(`Unknown table for sync: ${table}`);
    }
  }
  
  // =============== TABLE-SPECIFIC SYNC ===============
  
  private async syncProduct(operation: SyncOperation, data: any): Promise<void> {
    switch (operation) {
      case 'create':
        await offlineShopService.createProduct(data);
        break;
      case 'update':
        await offlineShopService.updateProduct(data);
        break;
      case 'delete':
        await offlineShopService.deleteProduct(data.id);
        break;
    }
  }
  
  private async syncCategory(operation: SyncOperation, data: any): Promise<void> {
    switch (operation) {
      case 'create':
        await offlineShopService.createCategory(data);
        break;
      case 'delete':
        await offlineShopService.deleteCategory(data.id);
        break;
      // Note: Category update not supported in current API
    }
  }
  
  private async syncCustomer(operation: SyncOperation, data: any): Promise<void> {
    switch (operation) {
      case 'create':
        await offlineShopService.createCustomer(data);
        break;
      case 'update':
        await offlineShopService.updateCustomer(data);
        break;
      case 'delete':
        await offlineShopService.deleteCustomer(data.id);
        break;
    }
  }
  
  private async syncSupplier(operation: SyncOperation, data: any): Promise<void> {
    switch (operation) {
      case 'create':
        await offlineShopService.createSupplier(data);
        break;
      case 'update':
        await offlineShopService.updateSupplier(data);
        break;
      case 'delete':
        await offlineShopService.deleteSupplier(data.id);
        break;
    }
  }
  
  private async syncSale(operation: SyncOperation, data: any): Promise<void> {
    switch (operation) {
      case 'create':
        await offlineShopService.createSale(data);
        break;
      case 'update':
        await offlineShopService.updateSale(data.id, data);
        break;
      case 'delete':
        await offlineShopService.deleteSale(data.id);
        break;
    }
  }
  
  private async syncPurchase(operation: SyncOperation, data: any): Promise<void> {
    switch (operation) {
      case 'create':
        await offlineShopService.createPurchase(data);
        break;
      case 'delete':
        await offlineShopService.deletePurchase(data.id);
        break;
    }
  }
  
  private async syncExpense(operation: SyncOperation, data: any): Promise<void> {
    switch (operation) {
      case 'create':
        await offlineShopService.createExpense(data);
        break;
      case 'update':
        await offlineShopService.updateExpense(data);
        break;
      case 'delete':
        await offlineShopService.deleteExpense(data.id);
        break;
    }
  }
  
  private async syncCashTransaction(operation: SyncOperation, data: any): Promise<void> {
    if (operation === 'create') {
      await offlineShopService.createCashTransaction(data);
    }
  }
  
  private async syncStockAdjustment(operation: SyncOperation, data: any): Promise<void> {
    if (operation === 'create') {
      await offlineShopService.createAdjustment(data);
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
    
    try {
      // Sync products
      const { products } = await offlineShopService.getProducts();
      await offlineDB.bulkSaveProducts(products.map(p => ({
        ...p,
        shop_id: shopId,
        _locallyModified: false,
        _locallyCreated: false,
        _locallyDeleted: false,
      })));
      syncedTables.push('products');
      this.progress = 15;
      this.notifyListeners();
      
      // Sync categories
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
      this.progress = 30;
      this.notifyListeners();
      
      // Sync customers
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
      this.progress = 45;
      this.notifyListeners();
      
      // Sync suppliers
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
      this.progress = 60;
      this.notifyListeners();
      
      // Sync sales (last 30 days)
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
      this.progress = 80;
      this.notifyListeners();
      
      // Sync settings
      const { settings } = await offlineShopService.getSettings();
      if (settings) {
        await offlineDB.saveSettings({
          ...settings,
          shop_id: shopId,
        });
      }
      syncedTables.push('settings');
      this.progress = 100;
      
      this.lastSyncAt = new Date();
      
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
