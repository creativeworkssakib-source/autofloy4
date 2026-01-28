/**
 * IndexedDB Offline Database for Shop Data
 * Provides local storage for all shop data with automatic sync queue
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database version - increment when schema changes
const DB_VERSION = 1;
const DB_NAME = 'autofloy_shop_offline';

// Sync operation types
export type SyncOperation = 'create' | 'update' | 'delete';

// Sync queue item
export interface SyncQueueItem {
  id: string;
  table: string;
  operation: SyncOperation;
  data: any;
  timestamp: number;
  retryCount: number;
  shopId: string;
}

// Store names type
export type StoreName = 'products' | 'categories' | 'customers' | 'suppliers' | 
  'sales' | 'purchases' | 'expenses' | 'adjustments' | 'returns' | 'loans' |
  'loanPayments' | 'cashTransactions' | 'cashRegisters' | 'supplierPayments' |
  'stockBatches' | 'trash' | 'settings' | 'syncQueue' | 'metadata';

// Define the database schema
interface OfflineDBSchema extends DBSchema {
  // Shop data stores
  products: {
    key: string;
    value: any;
    indexes: { 'by-shop': string; 'by-updated': number };
  };
  categories: {
    key: string;
    value: any;
    indexes: { 'by-shop': string };
  };
  customers: {
    key: string;
    value: any;
    indexes: { 'by-shop': string; 'by-phone': string };
  };
  suppliers: {
    key: string;
    value: any;
    indexes: { 'by-shop': string };
  };
  sales: {
    key: string;
    value: any;
    indexes: { 'by-shop': string; 'by-date': string };
  };
  purchases: {
    key: string;
    value: any;
    indexes: { 'by-shop': string; 'by-date': string };
  };
  expenses: {
    key: string;
    value: any;
    indexes: { 'by-shop': string; 'by-date': string };
  };
  adjustments: {
    key: string;
    value: any;
    indexes: { 'by-shop': string };
  };
  returns: {
    key: string;
    value: any;
    indexes: { 'by-shop': string };
  };
  loans: {
    key: string;
    value: any;
    indexes: { 'by-shop': string };
  };
  loanPayments: {
    key: string;
    value: any;
    indexes: { 'by-loan': string };
  };
  cashTransactions: {
    key: string;
    value: any;
    indexes: { 'by-shop': string; 'by-date': string };
  };
  cashRegisters: {
    key: string;
    value: any;
    indexes: { 'by-shop': string; 'by-date': string };
  };
  supplierPayments: {
    key: string;
    value: any;
    indexes: { 'by-supplier': string };
  };
  stockBatches: {
    key: string;
    value: any;
    indexes: { 'by-product': string };
  };
  trash: {
    key: string;
    value: any;
    indexes: { 'by-shop': string };
  };
  settings: {
    key: string;
    value: any;
  };
  // Sync queue for pending operations
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-table': string; 'by-timestamp': number };
  };
  // Metadata store
  metadata: {
    key: string;
    value: { lastSyncTime: number; shopId: string };
  };
}

// Table name mapping to API endpoints
export const TABLE_API_MAPPING: Record<string, string> = {
  products: 'products',
  categories: 'categories',
  customers: 'customers',
  suppliers: 'suppliers',
  sales: 'sales',
  purchases: 'purchases',
  expenses: 'expenses',
  adjustments: 'adjustments',
  returns: 'returns',
  loans: 'loans',
  loanPayments: 'loan-payments',
  cashTransactions: 'cash',
  cashRegisters: 'cash-register',
  supplierPayments: 'supplier-payments',
  stockBatches: 'stock-batches',
  trash: 'trash',
  settings: 'settings',
};

// Stores that support shop-based indexing
const SHOP_INDEXED_STORES = [
  'products', 'categories', 'customers', 'suppliers', 
  'sales', 'purchases', 'expenses', 'adjustments',
  'returns', 'loans', 'cashTransactions', 'cashRegisters', 'trash'
];

class OfflineDatabase {
  private db: IDBPDatabase<OfflineDBSchema> | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.openDatabase();
    await this.initPromise;
  }

  private async openDatabase(): Promise<void> {
    this.db = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`[OfflineDB] Upgrading from v${oldVersion} to v${newVersion}`);
        
        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const store = db.createObjectStore('products', { keyPath: 'id' });
          store.createIndex('by-shop', 'shop_id');
          store.createIndex('by-updated', '_localUpdatedAt');
        }

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const store = db.createObjectStore('categories', { keyPath: 'id' });
          store.createIndex('by-shop', 'shop_id');
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const store = db.createObjectStore('customers', { keyPath: 'id' });
          store.createIndex('by-shop', 'shop_id');
          store.createIndex('by-phone', 'phone');
        }

        // Suppliers store
        if (!db.objectStoreNames.contains('suppliers')) {
          const store = db.createObjectStore('suppliers', { keyPath: 'id' });
          store.createIndex('by-shop', 'shop_id');
        }

        // Sales store
        if (!db.objectStoreNames.contains('sales')) {
          const store = db.createObjectStore('sales', { keyPath: 'id' });
          store.createIndex('by-shop', 'shop_id');
          store.createIndex('by-date', 'sale_date');
        }

        // Purchases store
        if (!db.objectStoreNames.contains('purchases')) {
          const store = db.createObjectStore('purchases', { keyPath: 'id' });
          store.createIndex('by-shop', 'shop_id');
          store.createIndex('by-date', 'purchase_date');
        }

        // Expenses store
        if (!db.objectStoreNames.contains('expenses')) {
          const store = db.createObjectStore('expenses', { keyPath: 'id' });
          store.createIndex('by-shop', 'shop_id');
          store.createIndex('by-date', 'expense_date');
        }

        // Adjustments store
        if (!db.objectStoreNames.contains('adjustments')) {
          const store = db.createObjectStore('adjustments', { keyPath: 'id' });
          store.createIndex('by-shop', 'shop_id');
        }

        // Returns store
        if (!db.objectStoreNames.contains('returns')) {
          const store = db.createObjectStore('returns', { keyPath: 'id' });
          store.createIndex('by-shop', 'shop_id');
        }

        // Loans store
        if (!db.objectStoreNames.contains('loans')) {
          const store = db.createObjectStore('loans', { keyPath: 'id' });
          store.createIndex('by-shop', 'shop_id');
        }

        // Loan payments store
        if (!db.objectStoreNames.contains('loanPayments')) {
          const store = db.createObjectStore('loanPayments', { keyPath: 'id' });
          store.createIndex('by-loan', 'loan_id');
        }

        // Cash transactions store
        if (!db.objectStoreNames.contains('cashTransactions')) {
          const store = db.createObjectStore('cashTransactions', { keyPath: 'id' });
          store.createIndex('by-shop', 'shop_id');
          store.createIndex('by-date', 'transaction_date');
        }

        // Cash registers store
        if (!db.objectStoreNames.contains('cashRegisters')) {
          const store = db.createObjectStore('cashRegisters', { keyPath: 'id' });
          store.createIndex('by-shop', 'shop_id');
          store.createIndex('by-date', 'register_date');
        }

        // Supplier payments store
        if (!db.objectStoreNames.contains('supplierPayments')) {
          const store = db.createObjectStore('supplierPayments', { keyPath: 'id' });
          store.createIndex('by-supplier', 'supplier_id');
        }

        // Stock batches store
        if (!db.objectStoreNames.contains('stockBatches')) {
          const store = db.createObjectStore('stockBatches', { keyPath: 'id' });
          store.createIndex('by-product', 'product_id');
        }

        // Trash store
        if (!db.objectStoreNames.contains('trash')) {
          const store = db.createObjectStore('trash', { keyPath: 'id' });
          store.createIndex('by-shop', 'shop_id');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'shop_id' });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
          store.createIndex('by-table', 'table');
          store.createIndex('by-timestamp', 'timestamp');
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'shopId' });
        }
      },
    });
  }

  private async ensureDb(): Promise<IDBPDatabase<OfflineDBSchema>> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // ============ Generic CRUD Operations ============

  async getAll(
    storeName: StoreName,
    shopId?: string
  ): Promise<any[]> {
    const db = await this.ensureDb();
    
    // For stores that support shop-based indexing
    if (shopId && SHOP_INDEXED_STORES.includes(storeName)) {
      try {
        const tx = db.transaction(storeName as any, 'readonly');
        const store = tx.objectStore(storeName as any);
        const index = store.index('by-shop');
        return await index.getAll(shopId);
      } catch (error) {
        console.warn(`[OfflineDB] Index lookup failed for ${storeName}, falling back to getAll`);
      }
    }
    
    return db.getAll(storeName as any);
  }

  async get(
    storeName: StoreName,
    id: string
  ): Promise<any | undefined> {
    const db = await this.ensureDb();
    return db.get(storeName as any, id);
  }

  async put(
    storeName: StoreName,
    data: any
  ): Promise<string> {
    const db = await this.ensureDb();
    // Add local timestamp for tracking
    const dataWithTimestamp = {
      ...data,
      _localUpdatedAt: Date.now(),
    };
    return db.put(storeName as any, dataWithTimestamp) as Promise<string>;
  }

  async delete(
    storeName: StoreName,
    id: string
  ): Promise<void> {
    const db = await this.ensureDb();
    return db.delete(storeName as any, id);
  }

  async clear(storeName: StoreName): Promise<void> {
    const db = await this.ensureDb();
    return db.clear(storeName as any);
  }

  // ============ Bulk Operations ============

  async putMany(
    storeName: StoreName,
    items: any[]
  ): Promise<void> {
    const db = await this.ensureDb();
    const tx = db.transaction(storeName as any, 'readwrite');
    const store = tx.objectStore(storeName as any);
    
    await Promise.all(
      items.map(item => store.put({
        ...item,
        _localUpdatedAt: Date.now(),
      }))
    );
    
    await tx.done;
  }

  async deleteMany(
    storeName: StoreName,
    ids: string[]
  ): Promise<void> {
    const db = await this.ensureDb();
    const tx = db.transaction(storeName as any, 'readwrite');
    const store = tx.objectStore(storeName as any);
    
    await Promise.all(ids.map(id => store.delete(id)));
    await tx.done;
  }

  // ============ Sync Queue Operations ============

  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const db = await this.ensureDb();
    const queueItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    await db.put('syncQueue', queueItem);
    console.log('[OfflineDB] Added to sync queue:', queueItem);
    return queueItem.id;
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.ensureDb();
    const items = await db.getAllFromIndex('syncQueue', 'by-timestamp');
    return items;
  }

  async getSyncQueueCount(): Promise<number> {
    const db = await this.ensureDb();
    return db.count('syncQueue');
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await this.ensureDb();
    return db.delete('syncQueue', id);
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    const db = await this.ensureDb();
    const item = await db.get('syncQueue', id);
    if (item) {
      await db.put('syncQueue', { ...item, ...updates });
    }
  }

  async clearSyncQueue(): Promise<void> {
    const db = await this.ensureDb();
    return db.clear('syncQueue');
  }

  // ============ Metadata Operations ============

  async getLastSyncTime(shopId: string): Promise<number | null> {
    const db = await this.ensureDb();
    const meta = await db.get('metadata', shopId);
    return meta?.lastSyncTime || null;
  }

  async setLastSyncTime(shopId: string, timestamp: number): Promise<void> {
    const db = await this.ensureDb();
    await db.put('metadata', { shopId, lastSyncTime: timestamp });
  }

  // ============ Clear All Shop Data ============

  async clearAllShopData(shopId: string): Promise<void> {
    const stores: StoreName[] = [
      'products', 'categories', 'customers', 'suppliers', 
      'sales', 'purchases', 'expenses', 'adjustments',
      'returns', 'loans', 'loanPayments', 'cashTransactions',
      'cashRegisters', 'supplierPayments', 'stockBatches', 'trash'
    ];

    for (const store of stores) {
      const items = await this.getAll(store, shopId);
      const ids = items.map((item: any) => item.id);
      if (ids.length > 0) {
        await this.deleteMany(store, ids);
      }
    }
  }

  // ============ Check if DB has data ============

  async hasData(shopId: string): Promise<boolean> {
    const db = await this.ensureDb();
    try {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const index = store.index('by-shop');
      const count = await index.count(shopId);
      return count > 0;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const offlineDb = new OfflineDatabase();
