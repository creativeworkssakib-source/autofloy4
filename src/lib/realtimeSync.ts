/**
 * Real-time Supabase Sync Manager
 * 
 * Handles real-time subscriptions to Supabase tables for live data updates.
 * When online, subscribes to changes and updates local IndexedDB.
 * Implements deduplication to prevent memory bloat.
 */

import { supabase } from '@/integrations/supabase/client';
import { offlineDB } from './offlineDB';
import { platformDetector } from './platformDetection';

type TableName = 
  | 'shop_products'
  | 'shop_categories'
  | 'shop_customers'
  | 'shop_suppliers'
  | 'shop_sales'
  | 'shop_purchases'
  | 'shop_expenses'
  | 'shop_cash_transactions'
  | 'shop_stock_adjustments'
  | 'shop_returns'
  | 'shop_loans'
  | 'shop_daily_cash_registers'
  | 'shop_settings';

type SubscriptionCallback = (payload: any) => void;
type SyncListener = (status: RealtimeSyncStatus) => void;

export interface RealtimeSyncStatus {
  isConnected: boolean;
  subscribedTables: string[];
  lastUpdateAt: Date | null;
  pendingUpdates: number;
}

class RealtimeSyncManager {
  private subscriptions: Map<string, any> = new Map();
  private listeners: Set<SyncListener> = new Set();
  private isConnected = false;
  private lastUpdateAt: Date | null = null;
  private pendingUpdates = 0;
  private shopId: string | null = null;
  private userId: string | null = null;
  private syncDebounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastSyncTimestamps: Map<string, number> = new Map();
  
  // Deduplication: track record versions to avoid redundant updates
  private recordVersions: Map<string, string> = new Map();
  
  /**
   * Initialize real-time sync
   */
  async init(shopId: string, userId: string): Promise<void> {
    // Skip if already initialized with same shopId
    if (this.shopId === shopId && this.isConnected) {
      console.log('[RealtimeSync] Already initialized with same shopId');
      return;
    }
    
    // Disconnect existing subscriptions if shopId changed
    if (this.shopId && this.shopId !== shopId) {
      console.log('[RealtimeSync] Shop changed, disconnecting old subscriptions');
      this.disconnect();
    }
    
    this.shopId = shopId;
    this.userId = userId;
    
    // Only set up real-time for installed apps (PWA/APK/EXE)
    if (platformDetector.shouldUseLocalFirst()) {
      await this.setupSubscriptions();
    }
  }
  
  /**
   * Set up real-time subscriptions for all relevant tables
   */
  private async setupSubscriptions(): Promise<void> {
    if (!this.shopId || !this.userId) {
      console.warn('[RealtimeSync] Cannot setup subscriptions without shopId and userId');
      return;
    }
    
    // Subscribe to key tables
    const tables: TableName[] = [
      'shop_products',
      'shop_categories',
      'shop_customers',
      'shop_suppliers',
      'shop_sales',
      'shop_purchases',
      'shop_expenses',
      'shop_loans',
      'shop_returns',
      'shop_daily_cash_registers',
    ];
    
    for (const table of tables) {
      await this.subscribeToTable(table);
    }
    
    this.isConnected = true;
    this.notifyListeners();
    
    console.log('[RealtimeSync] Subscriptions set up for', tables.length, 'tables');
  }
  
  /**
   * Subscribe to a specific table
   */
  private async subscribeToTable(table: TableName): Promise<void> {
    if (this.subscriptions.has(table)) {
      return; // Already subscribed
    }
    
    // Build filter based on table
    // Most tables filter by shop_id, some by user_id
    const filter = `shop_id=eq.${this.shopId}`;
    
    try {
      const channel = supabase
        .channel(`realtime-${table}-${this.shopId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: filter,
          },
          (payload) => {
            this.handleRealtimeUpdate(table, payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[RealtimeSync] Subscribed to ${table}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`[RealtimeSync] Error subscribing to ${table}`);
            // Remove failed subscription so we can retry
            this.subscriptions.delete(table);
          } else if (status === 'TIMED_OUT') {
            console.warn(`[RealtimeSync] Subscription timed out for ${table}`);
            this.subscriptions.delete(table);
          }
        });
      
      this.subscriptions.set(table, channel);
    } catch (error) {
      console.error(`[RealtimeSync] Failed to subscribe to ${table}:`, error);
    }
  }
  
  /**
   * Handle real-time updates from Supabase
   */
  private async handleRealtimeUpdate(table: TableName, payload: any): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    // Debounce rapid updates to prevent overload
    const debounceKey = `${table}-${newRecord?.id || oldRecord?.id}`;
    const existingTimer = this.syncDebounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    const timer = setTimeout(async () => {
      try {
        // Check for deduplication
        if (newRecord) {
          const versionKey = `${table}-${newRecord.id}`;
          const currentVersion = this.recordVersions.get(versionKey);
          const newVersion = newRecord.updated_at || newRecord.created_at;
          
          // Skip if we already have this version
          if (currentVersion && currentVersion >= newVersion) {
            console.log(`[RealtimeSync] Skipping duplicate update for ${table}:${newRecord.id}`);
            return;
          }
          
          this.recordVersions.set(versionKey, newVersion);
        }
        
        await this.applyUpdate(table, eventType, newRecord, oldRecord);
        
        this.lastUpdateAt = new Date();
        this.pendingUpdates = Math.max(0, this.pendingUpdates - 1);
        this.notifyListeners();
        
      } catch (error) {
        console.error(`[RealtimeSync] Error applying update for ${table}:`, error);
      }
      
      this.syncDebounceTimers.delete(debounceKey);
    }, 100); // 100ms debounce
    
    this.syncDebounceTimers.set(debounceKey, timer);
    this.pendingUpdates++;
    this.notifyListeners();
  }
  
  /**
   * Apply update to local IndexedDB
   */
  private async applyUpdate(
    table: TableName,
    eventType: string,
    newRecord: any,
    oldRecord: any
  ): Promise<void> {
    await offlineDB.init();
    
    const localTable = this.getLocalTableName(table);
    
    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
        await this.upsertRecord(localTable, newRecord);
        break;
      case 'DELETE':
        await this.deleteRecord(localTable, oldRecord?.id || newRecord?.id);
        break;
    }
    
    console.log(`[RealtimeSync] Applied ${eventType} to ${table}:`, newRecord?.id || oldRecord?.id);
  }
  
  /**
   * Map Supabase table names to local IndexedDB table names
   */
  private getLocalTableName(supabaseTable: TableName): string {
    const mapping: Record<TableName, string> = {
      'shop_products': 'products',
      'shop_categories': 'categories',
      'shop_customers': 'customers',
      'shop_suppliers': 'suppliers',
      'shop_sales': 'sales',
      'shop_purchases': 'purchases',
      'shop_expenses': 'expenses',
      'shop_cash_transactions': 'cashTransactions',
      'shop_stock_adjustments': 'stockAdjustments',
      'shop_returns': 'returns',
      'shop_loans': 'loans',
      'shop_daily_cash_registers': 'dailyCashRegister',
      'shop_settings': 'settings',
    };
    return mapping[supabaseTable] || supabaseTable;
  }
  
  /**
   * Upsert a record to local IndexedDB
   */
  private async upsertRecord(table: string, record: any): Promise<void> {
    // Add local tracking fields (not modified locally since this is from server)
    const localRecord = {
      ...record,
      _locallyModified: false,
      _locallyCreated: false,
      _locallyDeleted: false,
    };
    
    switch (table) {
      case 'products':
        await offlineDB.saveProduct(localRecord);
        break;
      case 'categories':
        await offlineDB.saveCategory(localRecord);
        break;
      case 'customers':
        await offlineDB.saveCustomer(localRecord);
        break;
      case 'suppliers':
        await offlineDB.saveSupplier(localRecord);
        break;
      case 'sales':
        await offlineDB.saveSale(localRecord);
        break;
      case 'purchases':
        await offlineDB.savePurchase(localRecord);
        break;
      case 'expenses':
        await offlineDB.saveExpense(localRecord);
        break;
      case 'cashTransactions':
        await offlineDB.saveCashTransaction(localRecord);
        break;
      case 'stockAdjustments':
        await offlineDB.saveStockAdjustment(localRecord);
        break;
      case 'returns':
        await offlineDB.saveReturn(localRecord);
        break;
      case 'loans':
        await offlineDB.saveLoan(localRecord);
        break;
      case 'dailyCashRegister':
        await offlineDB.saveDailyCashRegister(localRecord);
        break;
      case 'settings':
        await offlineDB.saveSettings(localRecord);
        break;
    }
  }
  
  /**
   * Delete a record from local IndexedDB
   */
  private async deleteRecord(table: string, id: string): Promise<void> {
    if (!id) return;
    
    // Actually remove from local DB (not soft delete since server already deleted)
    switch (table) {
      case 'products':
        await offlineDB.hardDeleteProduct(id);
        break;
      case 'categories':
        await offlineDB.hardDeleteCategory(id);
        break;
      case 'customers':
        await offlineDB.hardDeleteCustomer(id);
        break;
      case 'suppliers':
        await offlineDB.hardDeleteSupplier(id);
        break;
      case 'sales':
        await offlineDB.hardDeleteSale(id);
        break;
      case 'purchases':
        await offlineDB.hardDeletePurchase(id);
        break;
      case 'expenses':
        await offlineDB.hardDeleteExpense(id);
        break;
      case 'loans':
        await offlineDB.hardDeleteLoan(id);
        break;
      case 'returns':
        await offlineDB.hardDeleteReturn(id);
        break;
      case 'dailyCashRegister':
        await offlineDB.hardDeleteDailyCashRegister(id);
        break;
    }
    
    // Clean up version tracking
    this.recordVersions.delete(`${table}-${id}`);
  }
  
  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }
  
  /**
   * Get current sync status
   */
  getStatus(): RealtimeSyncStatus {
    return {
      isConnected: this.isConnected,
      subscribedTables: Array.from(this.subscriptions.keys()),
      lastUpdateAt: this.lastUpdateAt,
      pendingUpdates: this.pendingUpdates,
    };
  }
  
  /**
   * Disconnect all subscriptions
   */
  disconnect(): void {
    for (const [table, channel] of this.subscriptions) {
      supabase.removeChannel(channel);
      console.log(`[RealtimeSync] Unsubscribed from ${table}`);
    }
    
    this.subscriptions.clear();
    this.isConnected = false;
    this.notifyListeners();
  }
  
  /**
   * Force sync all data from server
   */
  async forceFullSync(): Promise<void> {
    if (!this.shopId) return;
    
    console.log('[RealtimeSync] Starting full sync...');
    
    // Clear version tracking to force fresh data
    this.recordVersions.clear();
    
    // Notify listeners that we're syncing
    this.pendingUpdates = 10; // Approximate
    this.notifyListeners();
    
    // The actual sync will be handled by syncManager
    // This just ensures subscriptions are set up
    await this.setupSubscriptions();
  }
  
  /**
   * Clean up old records from local DB to prevent memory bloat
   * Keeps last 30 days of data by default
   */
  async cleanupOldRecords(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    
    console.log(`[RealtimeSync] Cleaning up records older than ${cutoffStr}`);
    
    // Only cleanup non-essential tables (keep products, customers, etc.)
    // Clean old sales, expenses, transactions that are already synced
    // This is done in offlineDB
    await offlineDB.cleanupOldRecords(cutoffStr);
    
    // Also clean up version tracking
    const keysToDelete: string[] = [];
    for (const [key, version] of this.recordVersions) {
      if (version < cutoffStr) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.recordVersions.delete(key));
    
    console.log(`[RealtimeSync] Cleaned up ${keysToDelete.length} old version records`);
  }
}

// Export singleton instance
export const realtimeSyncManager = new RealtimeSyncManager();
