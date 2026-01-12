/**
 * Offline Sync Orchestrator
 * 
 * Manages bidirectional sync between local IndexedDB and Supabase server.
 * 
 * Flow:
 * 1. When ONLINE: Push local changes to server, then pull server changes to local
 * 2. When OFFLINE: All operations stored locally in IndexedDB
 * 3. When coming ONLINE: Sync all pending local changes, then refresh from server
 * 
 * Key features:
 * - Deduplication: Uses sync queue with record-level conflict resolution
 * - Offline-first: All data saved locally first, then synced
 * - Real-time: While online, continuously syncs with server
 * - No data loss: Queue tracks failed operations for retry
 */

import { offlineDB, SyncQueueItem } from '@/lib/offlineDB';
import { offlineDataService } from '@/services/offlineDataService';
import { offlineShopService } from '@/services/offlineShopService';
import { syncQueue } from '@/lib/syncQueue';
import { isInstalled, getPlatformType } from '@/lib/platformDetection';

// Sync status types
export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingChanges: number;
  syncProgress: number;
  lastError: string | null;
  syncDirection: 'push' | 'pull' | 'idle';
}

type SyncListener = (status: SyncStatus) => void;

class OfflineSyncOrchestrator {
  private shopId: string | null = null;
  private userId: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private isSyncing = false;
  private lastSyncAt: Date | null = null;
  private lastError: string | null = null;
  private pendingChanges = 0;
  private syncProgress = 0;
  private syncDirection: 'push' | 'pull' | 'idle' = 'idle';
  
  // Sync configuration
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds
  private readonly MAX_RETRY_COUNT = 5;
  private readonly BATCH_SIZE = 50;

  /**
   * Initialize the sync orchestrator
   */
  async init(shopId: string, userId: string): Promise<void> {
    // Skip if already initialized with same shop
    if (this.isInitialized && this.shopId === shopId) {
      console.log('[SyncOrchestrator] Already initialized for shop:', shopId);
      return;
    }
    
    // Cleanup previous instance
    this.cleanup();
    
    this.shopId = shopId;
    this.userId = userId;
    
    console.log('[SyncOrchestrator] Initializing for shop:', shopId, 'Platform:', getPlatformType());
    
    // Initialize offline database
    await offlineDB.init();
    
    // Set up offline data service
    offlineDataService.setShopId(shopId);
    offlineDataService.setUserId(userId);
    
    // Start sync loop only for installed apps (PWA/APK/EXE)
    if (isInstalled()) {
      console.log('[SyncOrchestrator] Installed app detected, starting sync loop');
      this.startSyncLoop();
      
      // Add online/offline event listeners
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      
      // Perform initial sync if online
      if (navigator.onLine) {
        await this.performFullSync();
      }
    } else {
      console.log('[SyncOrchestrator] Browser mode - no local sync needed');
    }
    
    this.isInitialized = true;
    await this.updatePendingCount();
    this.notifyListeners();
  }

  /**
   * Handle coming online
   */
  private handleOnline = async (): Promise<void> => {
    console.log('[SyncOrchestrator] Device came online');
    this.notifyListeners();
    
    // Small delay to ensure connection is stable
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Perform full sync
    await this.performFullSync();
  };

  /**
   * Handle going offline
   */
  private handleOffline = (): void => {
    console.log('[SyncOrchestrator] Device went offline');
    this.notifyListeners();
  };

  /**
   * Start the automatic sync loop
   */
  private startSyncLoop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(async () => {
      if (navigator.onLine && !this.isSyncing) {
        await this.syncPendingChanges();
      }
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * Perform a full bidirectional sync
   */
  async performFullSync(): Promise<{ success: boolean; pushed: number; pulled: number }> {
    if (this.isSyncing) {
      console.log('[SyncOrchestrator] Sync already in progress');
      return { success: false, pushed: 0, pulled: 0 };
    }
    
    if (!navigator.onLine) {
      console.log('[SyncOrchestrator] Cannot sync - offline');
      return { success: false, pushed: 0, pulled: 0 };
    }
    
    this.isSyncing = true;
    this.lastError = null;
    this.syncProgress = 0;
    let pushed = 0;
    let pulled = 0;
    
    try {
      console.log('[SyncOrchestrator] Starting full sync');
      
      // Step 1: Push local changes to server (PRIORITY)
      this.syncDirection = 'push';
      this.notifyListeners();
      
      const pushResult = await this.syncPendingChanges();
      pushed = pushResult.synced;
      this.syncProgress = 40;
      
      // Step 2: Pull server changes to local
      this.syncDirection = 'pull';
      this.notifyListeners();
      
      const pullResult = await this.pullServerData();
      pulled = pullResult.pulled;
      this.syncProgress = 100;
      
      this.lastSyncAt = new Date();
      console.log('[SyncOrchestrator] Full sync complete - Pushed:', pushed, 'Pulled:', pulled);
      
      return { success: true, pushed, pulled };
    } catch (error) {
      console.error('[SyncOrchestrator] Full sync failed:', error);
      this.lastError = error instanceof Error ? error.message : 'Sync failed';
      return { success: false, pushed, pulled };
    } finally {
      this.isSyncing = false;
      this.syncDirection = 'idle';
      await this.updatePendingCount();
      this.notifyListeners();
    }
  }

  /**
   * Sync all pending local changes to server
   */
  async syncPendingChanges(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (!navigator.onLine || !this.shopId) {
      return { success: false, synced: 0, failed: 0 };
    }
    
    let synced = 0;
    let failed = 0;
    
    try {
      const pendingItems = await offlineDB.getPendingSyncItemsSafe();
      
      if (pendingItems.length === 0) {
        return { success: true, synced: 0, failed: 0 };
      }
      
      console.log('[SyncOrchestrator] Syncing', pendingItems.length, 'pending items');
      
      // Process in batches to avoid overwhelming the server
      for (let i = 0; i < pendingItems.length; i += this.BATCH_SIZE) {
        const batch = pendingItems.slice(i, i + this.BATCH_SIZE);
        
        const results = await Promise.allSettled(
          batch.map(item => this.syncSingleItem(item))
        );
        
        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          const item = batch[j];
          
          if (result.status === 'fulfilled' && result.value) {
            await offlineDB.markAsSynced(item.id);
            await this.clearLocalFlags(item);
            synced++;
          } else {
            const error = result.status === 'rejected' ? result.reason?.message || 'Unknown error' : 'Sync failed';
            await offlineDB.updateSyncQueueError(item.id, error);
            
            // If max retries exceeded, move to failed
            if (item.retryCount >= this.MAX_RETRY_COUNT) {
              console.error('[SyncOrchestrator] Max retries exceeded for item:', item.id);
            }
            failed++;
          }
        }
        
        // Update progress
        this.syncProgress = Math.round((i + batch.length) / pendingItems.length * 40);
        this.notifyListeners();
      }
      
      return { success: failed === 0, synced, failed };
    } catch (error) {
      console.error('[SyncOrchestrator] Error syncing pending changes:', error);
      return { success: false, synced, failed };
    }
  }

  /**
   * Sync a single item to the server
   */
  private async syncSingleItem(item: SyncQueueItem): Promise<boolean> {
    const { operation, table, recordId, data } = item;
    
    // Remove local tracking fields before sending to server
    const cleanData = this.stripLocalFields(data);
    
    try {
      switch (table) {
        case 'products':
          return await this.syncProductItem(operation, recordId, cleanData);
        case 'categories':
          return await this.syncCategoryItem(operation, recordId, cleanData);
        case 'customers':
          return await this.syncCustomerItem(operation, recordId, cleanData);
        case 'suppliers':
          return await this.syncSupplierItem(operation, recordId, cleanData);
        case 'sales':
          return await this.syncSaleItem(operation, recordId, cleanData);
        case 'purchases':
          return await this.syncPurchaseItem(operation, recordId, cleanData);
        case 'expenses':
          return await this.syncExpenseItem(operation, recordId, cleanData);
        case 'loans':
          return await this.syncLoanItem(operation, recordId, cleanData);
        case 'returns':
          return await this.syncReturnItem(operation, recordId, cleanData);
        case 'dailyCashRegister':
          return await this.syncCashRegisterItem(operation, recordId, cleanData);
        case 'cashTransactions':
          return await this.syncCashTransactionItem(operation, recordId, cleanData);
        case 'stockAdjustments':
          return await this.syncStockAdjustmentItem(operation, recordId, cleanData);
        default:
          console.warn('[SyncOrchestrator] Unknown table:', table);
          return false;
      }
    } catch (error) {
      console.error(`[SyncOrchestrator] Failed to sync ${table}:${recordId}:`, error);
      throw error;
    }
  }

  // Individual sync methods for each table
  private async syncProductItem(op: string, id: string, data: any): Promise<boolean> {
    switch (op) {
      case 'create':
        const { product: newProduct } = await offlineShopService.createProduct(data);
        // Update local record with server ID
        if (newProduct.id !== id) {
          await this.updateLocalRecordId('products', id, newProduct.id);
        }
        return true;
      case 'update':
        await offlineShopService.updateProduct({ id, ...data });
        return true;
      case 'delete':
        await offlineShopService.deleteProduct(id);
        await offlineDB.hardDeleteProduct(id);
        return true;
      default:
        return false;
    }
  }

  private async syncCategoryItem(op: string, id: string, data: any): Promise<boolean> {
    switch (op) {
      case 'create':
        const { category: newCat } = await offlineShopService.createCategory(data);
        if (newCat.id !== id) {
          await this.updateLocalRecordId('categories', id, newCat.id);
        }
        return true;
      case 'update':
        // Categories don't have an update method in offlineShopService
        return true;
      case 'delete':
        await offlineShopService.deleteCategory(id);
        await offlineDB.hardDeleteCategory(id);
        return true;
      default:
        return false;
    }
  }

  private async syncCustomerItem(op: string, id: string, data: any): Promise<boolean> {
    switch (op) {
      case 'create':
        const { customer: newCust } = await offlineShopService.createCustomer(data);
        if (newCust.id !== id) {
          await this.updateLocalRecordId('customers', id, newCust.id);
        }
        return true;
      case 'update':
        await offlineShopService.updateCustomer({ id, ...data });
        return true;
      case 'delete':
        await offlineShopService.deleteCustomer(id);
        await offlineDB.hardDeleteCustomer(id);
        return true;
      default:
        return false;
    }
  }

  private async syncSupplierItem(op: string, id: string, data: any): Promise<boolean> {
    switch (op) {
      case 'create':
        const { supplier: newSupp } = await offlineShopService.createSupplier(data);
        if (newSupp.id !== id) {
          await this.updateLocalRecordId('suppliers', id, newSupp.id);
        }
        return true;
      case 'update':
        await offlineShopService.updateSupplier({ id, ...data });
        return true;
      case 'delete':
        await offlineShopService.deleteSupplier(id);
        await offlineDB.hardDeleteSupplier(id);
        return true;
      default:
        return false;
    }
  }

  private async syncSaleItem(op: string, id: string, data: any): Promise<boolean> {
    switch (op) {
      case 'create':
        const { sale: newSale } = await offlineShopService.createSale(data);
        if (newSale.id !== id) {
          await this.updateLocalRecordId('sales', id, newSale.id);
        }
        return true;
      case 'update':
        await offlineShopService.updateSale(id, data);
        return true;
      case 'delete':
        await offlineShopService.deleteSale(id);
        await offlineDB.hardDeleteSale(id);
        return true;
      default:
        return false;
    }
  }

  private async syncPurchaseItem(op: string, id: string, data: any): Promise<boolean> {
    switch (op) {
      case 'create':
        const { purchase: newPurchase } = await offlineShopService.createPurchase(data);
        if (newPurchase.id !== id) {
          await this.updateLocalRecordId('purchases', id, newPurchase.id);
        }
        return true;
      case 'delete':
        await offlineShopService.deletePurchase(id);
        await offlineDB.hardDeletePurchase(id);
        return true;
      default:
        return false;
    }
  }

  private async syncExpenseItem(op: string, id: string, data: any): Promise<boolean> {
    switch (op) {
      case 'create':
        const { expense: newExp } = await offlineShopService.createExpense(data);
        if (newExp.id !== id) {
          await this.updateLocalRecordId('expenses', id, newExp.id);
        }
        return true;
      case 'update':
        await offlineShopService.updateExpense({ id, ...data });
        return true;
      case 'delete':
        await offlineShopService.deleteExpense(id);
        await offlineDB.hardDeleteExpense(id);
        return true;
      default:
        return false;
    }
  }

  private async syncLoanItem(op: string, id: string, data: any): Promise<boolean> {
    const token = localStorage.getItem("autofloy_token");
    if (!token) return false;
    
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    switch (op) {
      case 'create':
        const createRes = await fetch(`${baseUrl}/functions/v1/shop-loans`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const createData = await createRes.json();
        if (createData.loan?.id && createData.loan.id !== id) {
          await this.updateLocalRecordId('loans', id, createData.loan.id);
        }
        return createRes.ok;
      case 'update':
        const updateRes = await fetch(`${baseUrl}/functions/v1/shop-loans`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...data }),
        });
        return updateRes.ok;
      case 'delete':
        const deleteRes = await fetch(`${baseUrl}/functions/v1/shop-loans?id=${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (deleteRes.ok) {
          await offlineDB.hardDeleteLoan(id);
        }
        return deleteRes.ok;
      default:
        return false;
    }
  }

  private async syncReturnItem(op: string, id: string, data: any): Promise<boolean> {
    const token = localStorage.getItem("autofloy_token");
    if (!token) return false;
    
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    switch (op) {
      case 'create':
        const res = await fetch(`${baseUrl}/functions/v1/shop-returns`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (resData.return?.id && resData.return.id !== id) {
          await this.updateLocalRecordId('returns', id, resData.return.id);
        }
        return res.ok;
      default:
        return false;
    }
  }

  private async syncCashRegisterItem(op: string, id: string, data: any): Promise<boolean> {
    switch (op) {
      case 'create':
        await offlineShopService.openCashRegister(data.opening_cash, data.notes);
        return true;
      case 'update':
        if (data.status === 'closed') {
          await offlineShopService.closeCashRegister(data.closing_cash, data.notes);
        }
        return true;
      default:
        return false;
    }
  }

  private async syncCashTransactionItem(op: string, id: string, data: any): Promise<boolean> {
    switch (op) {
      case 'create':
        const { transaction: newTx } = await offlineShopService.createCashTransaction(data);
        if (newTx.id !== id) {
          await this.updateLocalRecordId('cashTransactions', id, newTx.id);
        }
        return true;
      default:
        return false;
    }
  }

  private async syncStockAdjustmentItem(op: string, id: string, data: any): Promise<boolean> {
    switch (op) {
      case 'create':
        const result = await offlineShopService.createAdjustment(data);
        if (result.adjustment?.id && result.adjustment.id !== id) {
          await this.updateLocalRecordId('stockAdjustments', id, result.adjustment.id);
        }
        return true;
      default:
        return false;
    }
  }

  /**
   * Pull latest data from server to local
   */
  private async pullServerData(): Promise<{ pulled: number }> {
    if (!this.shopId) return { pulled: 0 };
    
    let pulled = 0;
    
    try {
      // Pull products
      try {
        const { products } = await offlineShopService.getProducts();
        for (const product of products) {
          const local = await offlineDB.getProductById(product.id);
          if (!local?._locallyModified && !local?._locallyCreated) {
            await offlineDB.saveProduct({
              ...product,
              shop_id: this.shopId!,
              user_id: this.userId || '',
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
            pulled++;
          }
        }
      } catch (e) { console.error('[SyncOrchestrator] Failed to pull products:', e); }
      
      this.syncProgress = 50;
      this.notifyListeners();
      
      // Pull categories
      try {
        const { categories } = await offlineShopService.getCategories();
        const localCats = await offlineDB.getCategories(this.shopId!);
        for (const cat of categories) {
          const local = localCats.find(c => c.id === cat.id);
          if (!local?._locallyModified && !local?._locallyCreated) {
            await offlineDB.saveCategory({
              ...cat,
              shop_id: this.shopId!,
              user_id: this.userId || '',
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
            pulled++;
          }
        }
      } catch (e) { console.error('[SyncOrchestrator] Failed to pull categories:', e); }
      
      // Pull customers
      try {
        const { customers } = await offlineShopService.getCustomers();
        for (const cust of customers) {
          const local = await offlineDB.getCustomerById(cust.id);
          if (!local?._locallyModified && !local?._locallyCreated) {
            await offlineDB.saveCustomer({
              ...cust,
              shop_id: this.shopId!,
              user_id: this.userId || '',
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
            pulled++;
          }
        }
      } catch (e) { console.error('[SyncOrchestrator] Failed to pull customers:', e); }
      
      this.syncProgress = 60;
      this.notifyListeners();
      
      // Pull suppliers
      try {
        const { suppliers } = await offlineShopService.getSuppliers();
        for (const supp of suppliers) {
          const local = await offlineDB.getSupplierById(supp.id);
          if (!local?._locallyModified && !local?._locallyCreated) {
            await offlineDB.saveSupplier({
              ...supp,
              shop_id: this.shopId!,
              user_id: this.userId || '',
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
            pulled++;
          }
        }
      } catch (e) { console.error('[SyncOrchestrator] Failed to pull suppliers:', e); }
      
      // Pull sales
      try {
        const { sales } = await offlineShopService.getSales({});
        for (const sale of sales) {
          const local = await offlineDB.getSaleById(sale.id);
          if (!local?._locallyModified && !local?._locallyCreated) {
            await offlineDB.saveSale({
              ...sale,
              shop_id: this.shopId!,
              user_id: this.userId || '',
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
            pulled++;
          }
        }
      } catch (e) { console.error('[SyncOrchestrator] Failed to pull sales:', e); }
      
      this.syncProgress = 65;
      this.notifyListeners();
      
      // Pull purchases
      try {
        const { purchases } = await offlineShopService.getPurchases();
        for (const purchase of purchases) {
          const local = await offlineDB.getPurchaseById(purchase.id);
          if (!local?._locallyModified && !local?._locallyCreated) {
            await offlineDB.savePurchase({
              ...purchase,
              shop_id: this.shopId!,
              user_id: this.userId || '',
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
            pulled++;
          }
        }
      } catch (e) { console.error('[SyncOrchestrator] Failed to pull purchases:', e); }
      
      this.syncProgress = 70;
      this.notifyListeners();
      
      // Pull expenses
      try {
        const { expenses } = await offlineShopService.getExpenses({});
        const localExps = await offlineDB.getExpenses(this.shopId!);
        for (const exp of expenses) {
          const local = localExps.find(e => e.id === exp.id);
          if (!local?._locallyModified && !local?._locallyCreated) {
            await offlineDB.saveExpense({
              ...exp,
              shop_id: this.shopId!,
              user_id: this.userId || '',
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
            pulled++;
          }
        }
      } catch (e) { console.error('[SyncOrchestrator] Failed to pull expenses:', e); }
      
      this.syncProgress = 75;
      this.notifyListeners();
      
      // Pull loans
      try {
        const token = localStorage.getItem("autofloy_token");
        if (token) {
          const baseUrl = import.meta.env.VITE_SUPABASE_URL;
          const res = await fetch(`${baseUrl}/functions/v1/shop-loans?shop_id=${this.shopId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (res.ok) {
            const { loans } = await res.json();
            const localLoans = await offlineDB.getLoans(this.shopId!);
            for (const loan of loans || []) {
              const local = localLoans.find(l => l.id === loan.id);
              if (!local?._locallyModified && !local?._locallyCreated) {
                await offlineDB.saveLoan({
                  ...loan,
                  shop_id: this.shopId!,
                  user_id: this.userId || '',
                  _locallyModified: false,
                  _locallyCreated: false,
                  _locallyDeleted: false,
                });
                pulled++;
              }
            }
          }
        }
      } catch (e) { console.error('[SyncOrchestrator] Failed to pull loans:', e); }
      
      this.syncProgress = 80;
      this.notifyListeners();
      
      // Pull cash transactions
      try {
        const { transactions: cashTxs } = await offlineShopService.getCashTransactions({});
        const localCashTxs = await offlineDB.getCashTransactions(this.shopId!);
        for (const tx of cashTxs || []) {
          const local = localCashTxs.find(t => t.id === tx.id);
          if (!local?._locallyModified && !local?._locallyCreated) {
            await offlineDB.saveCashTransaction({
              ...tx,
              shop_id: this.shopId!,
              user_id: this.userId || '',
              _locallyModified: false,
              _locallyCreated: false,
              _locallyDeleted: false,
            });
            pulled++;
          }
        }
      } catch (e) { console.error('[SyncOrchestrator] Failed to pull cash transactions:', e); }
      
      this.syncProgress = 85;
      this.notifyListeners();
      
      // Pull settings
      try {
        const { settings } = await offlineShopService.getSettings();
        if (settings) {
          await offlineDB.saveSettings({
            ...settings,
            shop_id: this.shopId!,
            user_id: this.userId || '',
          });
          pulled++;
        }
      } catch (e) { console.error('[SyncOrchestrator] Failed to pull settings:', e); }
      
      this.syncProgress = 90;
      this.notifyListeners();
      
      // Update sync metadata
      await offlineDataService.updateSyncMetadata({
        lastSyncTimestamp: Date.now(),
        lastOnlineCheck: Date.now(),
      });
      
      return { pulled };
    } catch (error) {
      console.error('[SyncOrchestrator] Error pulling server data:', error);
      return { pulled };
    }
  }

  /**
   * Update local record ID when server assigns a new ID
   */
  private async updateLocalRecordId(table: string, oldId: string, newId: string): Promise<void> {
    // This updates references in local DB when server assigns different ID
    console.log(`[SyncOrchestrator] Updating ${table} ID: ${oldId} -> ${newId}`);
    
    try {
      switch (table) {
        case 'products':
          const product = await offlineDB.getProductById(oldId);
          if (product) {
            await offlineDB.hardDeleteProduct(oldId);
            await offlineDB.saveProduct({ ...product, id: newId, _locallyCreated: false });
          }
          break;
        case 'categories':
          const localCats = await offlineDB.getCategories(this.shopId!);
          const category = localCats.find(c => c.id === oldId);
          if (category) {
            await offlineDB.hardDeleteCategory(oldId);
            await offlineDB.saveCategory({ ...category, id: newId, _locallyCreated: false });
          }
          break;
        case 'customers':
          const customer = await offlineDB.getCustomerById(oldId);
          if (customer) {
            await offlineDB.hardDeleteCustomer(oldId);
            await offlineDB.saveCustomer({ ...customer, id: newId, _locallyCreated: false });
          }
          break;
        case 'suppliers':
          const supplier = await offlineDB.getSupplierById(oldId);
          if (supplier) {
            await offlineDB.hardDeleteSupplier(oldId);
            await offlineDB.saveSupplier({ ...supplier, id: newId, _locallyCreated: false });
          }
          break;
        case 'sales':
          const sale = await offlineDB.getSaleById(oldId);
          if (sale) {
            await offlineDB.hardDeleteSale(oldId);
            await offlineDB.saveSale({ ...sale, id: newId, _locallyCreated: false });
          }
          break;
        case 'purchases':
          const purchase = await offlineDB.getPurchaseById(oldId);
          if (purchase) {
            await offlineDB.hardDeletePurchase(oldId);
            await offlineDB.savePurchase({ ...purchase, id: newId, _locallyCreated: false });
          }
          break;
        case 'expenses':
          const expenses = await offlineDB.getExpenses(this.shopId!);
          const expense = expenses.find(e => e.id === oldId);
          if (expense) {
            await offlineDB.hardDeleteExpense(oldId);
            await offlineDB.saveExpense({ ...expense, id: newId, _locallyCreated: false });
          }
          break;
        case 'loans':
          const loans = await offlineDB.getLoans(this.shopId!);
          const loan = loans.find(l => l.id === oldId);
          if (loan) {
            await offlineDB.hardDeleteLoan(oldId);
            await offlineDB.saveLoan({ ...loan, id: newId, _locallyCreated: false });
          }
          break;
        case 'cashTransactions':
          const cashTxs = await offlineDB.getCashTransactions(this.shopId!);
          const cashTx = cashTxs.find(t => t.id === oldId);
          if (cashTx) {
            await offlineDB.hardDeleteCashTransaction(oldId);
            await offlineDB.saveCashTransaction({ ...cashTx, id: newId, _locallyCreated: false });
          }
          break;
        case 'stockAdjustments':
          const adjustments = await offlineDB.getStockAdjustments(this.shopId!);
          const adjustment = adjustments.find(a => a.id === oldId);
          if (adjustment) {
            await offlineDB.hardDeleteStockAdjustment(oldId);
            await offlineDB.saveStockAdjustment({ ...adjustment, id: newId, _locallyCreated: false });
          }
          break;
        case 'returns':
          const returns = await offlineDB.getReturns(this.shopId!);
          const returnItem = returns.find(r => r.id === oldId);
          if (returnItem) {
            await offlineDB.hardDeleteReturn(oldId);
            await offlineDB.saveReturn({ ...returnItem, id: newId, _locallyCreated: false });
          }
          break;
        default:
          console.warn(`[SyncOrchestrator] updateLocalRecordId: Unknown table ${table}`);
      }
    } catch (error) {
      console.error(`[SyncOrchestrator] Error updating local record ID for ${table}:`, error);
    }
  }

  /**
   * Clear local modification flags after successful sync
   */
  private async clearLocalFlags(item: SyncQueueItem): Promise<void> {
    const { table, recordId } = item;
    
    try {
      switch (table) {
        case 'products':
          const product = await offlineDB.getProductById(recordId);
          if (product) {
            product._locallyModified = false;
            product._locallyCreated = false;
            await offlineDB.saveProduct(product);
          }
          break;
        case 'categories':
          const localCats = await offlineDB.getCategories(this.shopId!);
          const category = localCats.find(c => c.id === recordId);
          if (category) {
            category._locallyModified = false;
            category._locallyCreated = false;
            await offlineDB.saveCategory(category);
          }
          break;
        case 'customers':
          const customer = await offlineDB.getCustomerById(recordId);
          if (customer) {
            customer._locallyModified = false;
            customer._locallyCreated = false;
            await offlineDB.saveCustomer(customer);
          }
          break;
        case 'suppliers':
          const supplier = await offlineDB.getSupplierById(recordId);
          if (supplier) {
            supplier._locallyModified = false;
            supplier._locallyCreated = false;
            await offlineDB.saveSupplier(supplier);
          }
          break;
        case 'sales':
          const sale = await offlineDB.getSaleById(recordId);
          if (sale) {
            sale._locallyModified = false;
            sale._locallyCreated = false;
            await offlineDB.saveSale(sale);
          }
          break;
        case 'purchases':
          const purchase = await offlineDB.getPurchaseById(recordId);
          if (purchase) {
            purchase._locallyModified = false;
            purchase._locallyCreated = false;
            await offlineDB.savePurchase(purchase);
          }
          break;
        case 'expenses':
          const expenses = await offlineDB.getExpenses(this.shopId!);
          const expense = expenses.find(e => e.id === recordId);
          if (expense) {
            expense._locallyModified = false;
            expense._locallyCreated = false;
            await offlineDB.saveExpense(expense);
          }
          break;
        case 'loans':
          const loans = await offlineDB.getLoans(this.shopId!);
          const loan = loans.find(l => l.id === recordId);
          if (loan) {
            loan._locallyModified = false;
            loan._locallyCreated = false;
            await offlineDB.saveLoan(loan);
          }
          break;
        case 'cashTransactions':
          const cashTxs = await offlineDB.getCashTransactions(this.shopId!);
          const cashTx = cashTxs.find(t => t.id === recordId);
          if (cashTx) {
            cashTx._locallyModified = false;
            cashTx._locallyCreated = false;
            await offlineDB.saveCashTransaction(cashTx);
          }
          break;
        case 'dailyCashRegister':
          const register = await offlineDB.getDailyCashRegister(this.shopId!, new Date().toISOString().split('T')[0]);
          if (register && register.id === recordId) {
            register._locallyModified = false;
            register._locallyCreated = false;
            await offlineDB.saveDailyCashRegister(register);
          }
          break;
        case 'stockAdjustments':
          const adjustments = await offlineDB.getStockAdjustments(this.shopId!);
          const adjustment = adjustments.find(a => a.id === recordId);
          if (adjustment) {
            adjustment._locallyModified = false;
            adjustment._locallyCreated = false;
            await offlineDB.saveStockAdjustment(adjustment);
          }
          break;
        case 'returns':
          const returns = await offlineDB.getReturns(this.shopId!);
          const returnItem = returns.find(r => r.id === recordId);
          if (returnItem) {
            returnItem._locallyModified = false;
            returnItem._locallyCreated = false;
            await offlineDB.saveReturn(returnItem);
          }
          break;
        default:
          console.warn(`[SyncOrchestrator] clearLocalFlags: Unknown table ${table}`);
      }
    } catch (error) {
      console.error(`[SyncOrchestrator] Error clearing flags for ${table}:${recordId}:`, error);
    }
  }

  /**
   * Strip local tracking fields before sending to server
   */
  private stripLocalFields(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const { _locallyModified, _locallyCreated, _locallyDeleted, ...cleanData } = data;
    return cleanData;
  }

  /**
   * Update pending changes count
   */
  private async updatePendingCount(): Promise<void> {
    try {
      this.pendingChanges = await offlineDB.getSyncQueueCount();
    } catch {
      this.pendingChanges = 0;
    }
  }

  /**
   * Subscribe to sync status updates
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    
    // Immediately send current status
    listener(this.getStatus());
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return {
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      pendingChanges: this.pendingChanges,
      syncProgress: this.syncProgress,
      lastError: this.lastError,
      syncDirection: this.syncDirection,
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (e) {
        console.error('[SyncOrchestrator] Listener error:', e);
      }
    });
  }

  /**
   * Force a full sync now
   */
  async forceSync(): Promise<void> {
    await this.performFullSync();
  }

  /**
   * Cleanup and stop syncing
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    // Only remove event listeners if they were added (isInitialized indicates they were)
    if (this.isInitialized) {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    // Reset all state
    this.isInitialized = false;
    this.isSyncing = false;
    this.lastSyncAt = null;
    this.lastError = null;
    this.pendingChanges = 0;
    this.syncProgress = 0;
    this.syncDirection = 'idle';
    // Clear listeners to prevent memory leaks
    this.listeners.clear();
  }

  /**
   * Check if orchestrator is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const offlineSyncOrchestrator = new OfflineSyncOrchestrator();
