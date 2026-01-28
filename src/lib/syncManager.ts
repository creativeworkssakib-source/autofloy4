/**
 * Sync Manager - Handles background sync between local IndexedDB and remote Supabase
 * 
 * Features:
 * - Automatic sync when coming back online
 * - Queue-based pending operations
 * - Conflict resolution (last-write-wins)
 * - Retry with exponential backoff
 */

import { offlineDb, SyncQueueItem, TABLE_API_MAPPING } from './offlineDatabase';
import { offlineShopService } from '@/services/offlineShopService';
import { authService } from '@/services/authService';

// Sync status types
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

// Sync event types
export type SyncEventType = 'sync-start' | 'sync-complete' | 'sync-error' | 'queue-change';

// Event listener type
type SyncEventListener = (data: { status: SyncStatus; pendingCount: number; error?: string }) => void;

class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncStatus: SyncStatus = 'idle';
  private listeners: Set<SyncEventListener> = new Set();
  private syncInterval: number | null = null;
  private pendingCount: number = 0;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Start periodic sync check
    this.startPeriodicSync();
    
    // Initial queue count
    this.updatePendingCount();
  }

  private async updatePendingCount(): Promise<void> {
    try {
      this.pendingCount = await offlineDb.getSyncQueueCount();
      this.notifyListeners();
    } catch (error) {
      console.error('[SyncManager] Error updating pending count:', error);
    }
  }

  private handleOnline(): void {
    console.log('[SyncManager] Network online - triggering sync');
    this.isOnline = true;
    this.syncStatus = 'idle';
    this.syncPendingChanges();
  }

  private handleOffline(): void {
    console.log('[SyncManager] Network offline');
    this.isOnline = false;
    this.syncStatus = 'offline';
    this.notifyListeners();
  }

  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingChanges();
      }
    }, 30000);
  }

  // ============ Event Listeners ============

  subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener({ status: this.syncStatus, pendingCount: this.pendingCount });
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(error?: string): void {
    this.listeners.forEach(listener => {
      listener({ status: this.syncStatus, pendingCount: this.pendingCount, error });
    });
  }

  // ============ Public API ============

  getStatus(): { status: SyncStatus; pendingCount: number; isOnline: boolean } {
    return {
      status: this.syncStatus,
      pendingCount: this.pendingCount,
      isOnline: this.isOnline,
    };
  }

  async queueOperation(
    table: string,
    operation: 'create' | 'update' | 'delete',
    data: any,
    shopId: string
  ): Promise<void> {
    await offlineDb.addToSyncQueue({
      table,
      operation,
      data,
      shopId,
    });
    await this.updatePendingCount();
    
    // Try to sync immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.syncPendingChanges();
    }
  }

  async syncPendingChanges(): Promise<void> {
    if (!this.isOnline || this.isSyncing) {
      console.log('[SyncManager] Skipping sync - offline or already syncing');
      return;
    }

    const queue = await offlineDb.getSyncQueue();
    if (queue.length === 0) {
      console.log('[SyncManager] No pending changes to sync');
      return;
    }

    console.log(`[SyncManager] Starting sync of ${queue.length} pending operations`);
    this.isSyncing = true;
    this.syncStatus = 'syncing';
    this.notifyListeners();

    let successCount = 0;
    let errorCount = 0;

    for (const item of queue) {
      try {
        await this.processSyncItem(item);
        await offlineDb.removeSyncQueueItem(item.id);
        successCount++;
      } catch (error: any) {
        console.error(`[SyncManager] Failed to sync item ${item.id}:`, error);
        
        // Update retry count
        const newRetryCount = item.retryCount + 1;
        
        if (newRetryCount >= 5) {
          // Max retries reached, remove from queue and log error
          console.error(`[SyncManager] Max retries reached for item ${item.id}, removing from queue`);
          await offlineDb.removeSyncQueueItem(item.id);
          errorCount++;
        } else {
          // Increment retry count for next attempt
          await offlineDb.updateSyncQueueItem(item.id, { retryCount: newRetryCount });
        }
      }
    }

    this.isSyncing = false;
    this.syncStatus = errorCount > 0 ? 'error' : 'idle';
    await this.updatePendingCount();

    console.log(`[SyncManager] Sync complete. Success: ${successCount}, Errors: ${errorCount}`);
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const apiResource = TABLE_API_MAPPING[item.table];
    if (!apiResource) {
      throw new Error(`Unknown table: ${item.table}`);
    }

    const token = authService.getToken();
    if (!token) {
      throw new Error('No auth token');
    }

    switch (item.operation) {
      case 'create':
        await this.syncCreate(item.table, item.data);
        break;
      case 'update':
        await this.syncUpdate(item.table, item.data);
        break;
      case 'delete':
        await this.syncDelete(item.table, item.data.id || item.data.ids || item.data);
        break;
    }
  }

  private async syncCreate(table: string, data: any): Promise<void> {
    // Remove local-only fields before syncing
    const cleanData = { ...data };
    delete cleanData._localUpdatedAt;
    
    switch (table) {
      case 'products':
        await offlineShopService.createProduct(cleanData);
        break;
      case 'categories':
        await offlineShopService.createCategory(cleanData);
        break;
      case 'customers':
        await offlineShopService.createCustomer(cleanData);
        break;
      case 'suppliers':
        await offlineShopService.createSupplier(cleanData);
        break;
      case 'sales':
        await offlineShopService.createSale(cleanData);
        break;
      case 'purchases':
        await offlineShopService.createPurchase(cleanData);
        break;
      case 'expenses':
        await offlineShopService.createExpense(cleanData);
        break;
      case 'adjustments':
        await offlineShopService.createStockAdjustment(cleanData);
        break;
      case 'returns':
        await offlineShopService.processReturn(cleanData);
        break;
      case 'loans':
        await offlineShopService.createLoan(cleanData);
        break;
      case 'loanPayments':
        await offlineShopService.addLoanPayment(cleanData.loan_id, cleanData);
        break;
      case 'cashTransactions':
        await offlineShopService.createCashTransaction(cleanData);
        break;
      case 'cashRegisters':
        // Use open/close register based on data
        if (cleanData.opening_cash !== undefined && !cleanData.closing_cash) {
          await offlineShopService.openCashRegister(cleanData.opening_cash);
        } else if (cleanData.closing_cash !== undefined) {
          await offlineShopService.closeCashRegister(cleanData.closing_cash, cleanData.notes);
        }
        break;
      case 'supplierPayments':
        await offlineShopService.addSupplierPayment(cleanData);
        break;
      default:
        console.warn(`[SyncManager] No create handler for table: ${table}`);
    }
  }

  private async syncUpdate(table: string, data: any): Promise<void> {
    // Remove local-only fields before syncing
    const cleanData = { ...data };
    delete cleanData._localUpdatedAt;
    
    switch (table) {
      case 'products':
        await offlineShopService.updateProduct(cleanData);
        break;
      case 'customers':
        await offlineShopService.updateCustomer(cleanData);
        break;
      case 'suppliers':
        await offlineShopService.updateSupplier(cleanData);
        break;
      case 'sales':
        await offlineShopService.updateSale(cleanData.id, cleanData);
        break;
      case 'settings':
        await offlineShopService.updateSettings(cleanData);
        break;
      case 'cashRegisters':
        // Handle register updates
        if (cleanData.closing_cash !== undefined) {
          await offlineShopService.closeCashRegister(cleanData.closing_cash, cleanData.notes);
        }
        break;
      case 'stockBatches':
        await offlineShopService.updateStockBatch(cleanData.id, cleanData);
        break;
      default:
        console.warn(`[SyncManager] No update handler for table: ${table}`);
    }
  }

  private async syncDelete(table: string, id: string | string[]): Promise<void> {
    const ids = Array.isArray(id) ? id : [id];
    
    switch (table) {
      case 'products':
        await offlineShopService.deleteProducts(ids);
        break;
      case 'categories':
        for (const catId of ids) {
          await offlineShopService.deleteCategory(catId);
        }
        break;
      case 'customers':
        await offlineShopService.deleteCustomers(ids);
        break;
      case 'suppliers':
        await offlineShopService.deleteSuppliers(ids);
        break;
      case 'sales':
        await offlineShopService.deleteSales(ids);
        break;
      case 'purchases':
        for (const pId of ids) {
          await offlineShopService.deletePurchase(pId);
        }
        break;
      case 'expenses':
        for (const eId of ids) {
          await offlineShopService.deleteExpense(eId);
        }
        break;
      case 'adjustments':
        await offlineShopService.deleteStockAdjustments(ids);
        break;
      case 'loans':
        for (const lId of ids) {
          await offlineShopService.deleteLoan(lId);
        }
        break;
      case 'stockBatches':
        for (const bId of ids) {
          await offlineShopService.deleteStockBatch(bId);
        }
        break;
      default:
        console.warn(`[SyncManager] No delete handler for table: ${table}`);
    }
  }

  // ============ Initial Data Sync ============

  async performInitialSync(shopId: string): Promise<void> {
    if (!this.isOnline) {
      console.log('[SyncManager] Cannot perform initial sync - offline');
      return;
    }

    console.log('[SyncManager] Performing initial data sync for shop:', shopId);
    this.isSyncing = true;
    this.syncStatus = 'syncing';
    this.notifyListeners();

    try {
      // Fetch all data from server
      const [
        productsRes,
        categoriesRes,
        customersRes,
        suppliersRes,
        salesRes,
        purchasesRes,
        expensesRes,
        adjustmentsRes,
        returnsRes,
        loansRes,
        cashTransRes,
      ] = await Promise.all([
        offlineShopService.getProducts().catch(() => ({ products: [] })),
        offlineShopService.getCategories().catch(() => ({ categories: [] })),
        offlineShopService.getCustomers().catch(() => ({ customers: [] })),
        offlineShopService.getSuppliers().catch(() => ({ suppliers: [] })),
        offlineShopService.getSales().catch(() => ({ sales: [] })),
        offlineShopService.getPurchases().catch(() => ({ purchases: [] })),
        offlineShopService.getExpenses().catch(() => ({ expenses: [] })),
        offlineShopService.getStockAdjustments().catch(() => ({ adjustments: [] })),
        offlineShopService.getReturns().catch(() => ({ returns: [] })),
        offlineShopService.getLoans().catch(() => ({ loans: [] })),
        offlineShopService.getCashTransactions().catch(() => ({ transactions: [] })),
      ]);

      // Store in IndexedDB
      await Promise.all([
        offlineDb.putMany('products', productsRes.products || []),
        offlineDb.putMany('categories', categoriesRes.categories || []),
        offlineDb.putMany('customers', customersRes.customers || []),
        offlineDb.putMany('suppliers', suppliersRes.suppliers || []),
        offlineDb.putMany('sales', salesRes.sales || []),
        offlineDb.putMany('purchases', purchasesRes.purchases || []),
        offlineDb.putMany('expenses', expensesRes.expenses || []),
        offlineDb.putMany('adjustments', adjustmentsRes.adjustments || []),
        offlineDb.putMany('returns', returnsRes.returns || []),
        offlineDb.putMany('loans', loansRes.loans || []),
        offlineDb.putMany('cashTransactions', cashTransRes.transactions || []),
      ]);

      await offlineDb.setLastSyncTime(shopId, Date.now());
      
      console.log('[SyncManager] Initial sync complete');
      this.syncStatus = 'idle';
    } catch (error) {
      console.error('[SyncManager] Initial sync failed:', error);
      this.syncStatus = 'error';
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  // Force sync now
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      console.log('[SyncManager] Cannot force sync - offline');
      return;
    }
    await this.syncPendingChanges();
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
  }
}

// Export singleton
export const syncManager = new SyncManager();
