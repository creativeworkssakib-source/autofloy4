import { offlineDB, SyncQueueItem } from './offlineDB';

export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncTable = 
  | 'products' 
  | 'categories' 
  | 'customers' 
  | 'suppliers' 
  | 'sales' 
  | 'saleItems'
  | 'purchases' 
  | 'purchaseItems'
  | 'expenses' 
  | 'cashTransactions' 
  | 'stockAdjustments' 
  | 'returns' 
  | 'stockBatches' 
  | 'settings'
  | 'dailyCashRegister'
  | 'loans'
  | 'loanPayments'
  | 'staff';

class SyncQueue {
  /**
   * Add an operation to the sync queue
   */
  async add(
    operation: SyncOperation,
    table: SyncTable,
    recordId: string,
    data: any
  ): Promise<void> {
    const item: Omit<SyncQueueItem, 'id'> = {
      operation,
      table,
      recordId,
      data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
    };
    
    await offlineDB.addToSyncQueue(item);
  }

  /**
   * Get all pending (unsynced) items
   */
  async getPending(): Promise<SyncQueueItem[]> {
    // Use safe method that handles uninitialized DB
    return offlineDB.getPendingSyncItemsSafe();
  }

  /**
   * Get pending items count
   */
  async getPendingCount(): Promise<number> {
    // getSyncQueueCount already handles uninitialized DB
    return offlineDB.getSyncQueueCount();
  }

  /**
   * Mark an item as synced
   */
  async markSynced(id: string): Promise<void> {
    await offlineDB.markAsSynced(id);
  }

  /**
   * Mark sync failed with error
   */
  async markFailed(id: string, error: string): Promise<void> {
    await offlineDB.updateSyncQueueError(id, error);
  }

  /**
   * Clear all synced items from queue
   */
  async clearSynced(): Promise<void> {
    await offlineDB.clearSyncedItems();
  }

  /**
   * Delete a sync queue item by table and record ID
   */
  async deleteByRecordId(table: SyncTable, recordId: string): Promise<void> {
    await offlineDB.deleteSyncQueueByRecordId(table, recordId);
  }

  /**
   * Get items by table
   */
  async getByTable(table: SyncTable): Promise<SyncQueueItem[]> {
    const pending = await this.getPending();
    return pending.filter(item => item.table === table);
  }

  /**
   * Get items by operation type
   */
  async getByOperation(operation: SyncOperation): Promise<SyncQueueItem[]> {
    const pending = await this.getPending();
    return pending.filter(item => item.operation === operation);
  }

  /**
   * Check if there are any pending items
   */
  async hasPending(): Promise<boolean> {
    const count = await this.getPendingCount();
    return count > 0;
  }

  /**
   * Get failed items (items with retry count > 0)
   */
  async getFailedItems(): Promise<SyncQueueItem[]> {
    const pending = await this.getPending();
    return pending.filter(item => item.retryCount > 0);
  }

  /**
   * Get items that should be retried (retry count < max retries)
   */
  async getRetryableItems(maxRetries: number = 3): Promise<SyncQueueItem[]> {
    const pending = await this.getPending();
    return pending.filter(item => item.retryCount < maxRetries);
  }

  /**
   * Batch mark items as synced
   */
  async batchMarkSynced(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.markSynced(id);
    }
  }

  /**
   * Get summary of pending operations
   */
  async getSummary(): Promise<{
    total: number;
    byTable: Record<string, number>;
    byOperation: Record<string, number>;
    failedCount: number;
  }> {
    const pending = await this.getPending();
    
    const byTable: Record<string, number> = {};
    const byOperation: Record<string, number> = {};
    let failedCount = 0;
    
    for (const item of pending) {
      byTable[item.table] = (byTable[item.table] || 0) + 1;
      byOperation[item.operation] = (byOperation[item.operation] || 0) + 1;
      if (item.retryCount > 0) failedCount++;
    }
    
    return {
      total: pending.length,
      byTable,
      byOperation,
      failedCount,
    };
  }
}

// Export singleton instance
export const syncQueue = new SyncQueue();
