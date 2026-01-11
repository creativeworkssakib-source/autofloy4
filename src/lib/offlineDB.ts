import { openDB, DBSchema, IDBPDatabase } from 'idb';

// =============== TYPE DEFINITIONS ===============

export interface ShopProduct {
  id: string;
  shop_id: string;
  user_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category_id?: string;
  category_name?: string;
  description?: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_alert?: number;
  unit?: string;
  image_url?: string;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Local sync tracking
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface ShopCategory {
  id: string;
  shop_id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface ShopCustomer {
  id: string;
  shop_id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  total_purchases: number;
  total_due: number;
  opening_balance: number;
  created_at: string;
  updated_at: string;
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface ShopSupplier {
  id: string;
  shop_id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  company_name?: string;
  notes?: string;
  total_purchases: number;
  total_due: number;
  opening_balance: number;
  created_at: string;
  updated_at: string;
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface ShopSale {
  id: string;
  shop_id: string;
  user_id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount: number;
  discount_type: 'fixed' | 'percentage';
  tax: number;
  total: number;
  paid_amount: number;
  due_amount: number;
  payment_method: string;
  payment_status: 'paid' | 'partial' | 'due';
  notes?: string;
  sale_date: string;
  created_at: string;
  updated_at: string;
  items?: ShopSaleItem[];
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface ShopSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  created_at: string;
}

export interface ShopPurchase {
  id: string;
  shop_id: string;
  user_id: string;
  invoice_number?: string;
  supplier_id?: string;
  supplier_name?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  due_amount: number;
  payment_method: string;
  payment_status: 'paid' | 'partial' | 'due';
  notes?: string;
  purchase_date: string;
  created_at: string;
  updated_at: string;
  items?: ShopPurchaseItem[];
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface ShopPurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  expiry_date?: string;
  created_at: string;
}

export interface ShopExpense {
  id: string;
  shop_id: string;
  user_id: string;
  category: string;
  description?: string;
  amount: number;
  payment_method: string;
  expense_date: string;
  notes?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface ShopCashTransaction {
  id: string;
  shop_id: string;
  user_id: string;
  type: 'in' | 'out';
  source: string;
  amount: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  transaction_date: string;
  created_at: string;
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface ShopStockAdjustment {
  id: string;
  shop_id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  adjustment_type: 'add' | 'remove' | 'set';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  notes?: string;
  adjustment_date: string;
  created_at: string;
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface ShopReturn {
  id: string;
  shop_id: string;
  user_id: string;
  return_type: 'sale' | 'purchase';
  reference_id: string;
  reference_invoice?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  reason?: string;
  notes?: string;
  return_date: string;
  created_at: string;
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface ShopStockBatch {
  id: string;
  shop_id: string;
  user_id: string;
  product_id: string;
  batch_number?: string;
  quantity: number;
  remaining_quantity: number;
  purchase_price: number;
  expiry_date?: string;
  purchase_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface ShopSettings {
  id: string;
  shop_id: string;
  user_id: string;
  shop_name: string;
  shop_address?: string;
  shop_phone?: string;
  shop_email?: string;
  shop_logo_url?: string;
  currency: string;
  currency_symbol: string;
  tax_rate: number;
  invoice_prefix: string;
  invoice_footer?: string;
  low_stock_alert: number;
  enable_expiry_tracking: boolean;
  enable_barcode: boolean;
  thermal_printer_enabled: boolean;
  receipt_width: number;
  created_at: string;
  updated_at: string;
}

export interface ShopDailyCashRegister {
  id: string;
  shop_id: string;
  user_id: string;
  register_date: string;
  opening_cash: number;
  opening_time?: string;
  closing_cash?: number;
  closing_time?: string;
  expected_cash?: number;
  cash_difference?: number;
  total_sales?: number;
  total_cash_sales?: number;
  total_card_sales?: number;
  total_mobile_sales?: number;
  total_expenses?: number;
  total_due_collected?: number;
  total_deposits?: number;
  total_withdrawals?: number;
  status: 'open' | 'closed';
  notes?: string;
  created_at: string;
  updated_at: string;
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface ShopLoan {
  id: string;
  shop_id: string;
  user_id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  loan_type: 'given' | 'taken';
  principal_amount: number;
  interest_rate: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'active' | 'paid' | 'overdue';
  loan_date: string;
  due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface ShopStaff {
  id: string;
  shop_id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  role: string;
  passcode?: string;
  is_active: boolean;
  permissions?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  _locallyModified?: boolean;
  _locallyCreated?: boolean;
  _locallyDeleted?: boolean;
}

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  recordId: string;
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
  lastError?: string;
}

export interface SyncMetadata {
  id: string;
  shopId: string;
  userId: string;
  lastSyncTimestamp: number;
  lastOnlineCheck: number;
  subscriptionPlan: string;
  subscriptionEndsAt: string;
  isSubscriptionValid: boolean;
  pendingSyncCount: number;
}

// =============== DATABASE SCHEMA ===============

interface OfflineDBSchema extends DBSchema {
  products: {
    key: string;
    value: ShopProduct;
    indexes: {
      'by-shop': string;
      'by-barcode': string;
      'by-category': string;
    };
  };
  categories: {
    key: string;
    value: ShopCategory;
    indexes: { 'by-shop': string };
  };
  customers: {
    key: string;
    value: ShopCustomer;
    indexes: { 'by-shop': string; 'by-phone': string };
  };
  suppliers: {
    key: string;
    value: ShopSupplier;
    indexes: { 'by-shop': string };
  };
  sales: {
    key: string;
    value: ShopSale;
    indexes: { 'by-shop': string; 'by-date': string; 'by-customer': string };
  };
  saleItems: {
    key: string;
    value: ShopSaleItem;
    indexes: { 'by-sale': string; 'by-product': string };
  };
  purchases: {
    key: string;
    value: ShopPurchase;
    indexes: { 'by-shop': string; 'by-date': string; 'by-supplier': string };
  };
  purchaseItems: {
    key: string;
    value: ShopPurchaseItem;
    indexes: { 'by-purchase': string; 'by-product': string };
  };
  expenses: {
    key: string;
    value: ShopExpense;
    indexes: { 'by-shop': string; 'by-date': string; 'by-category': string };
  };
  cashTransactions: {
    key: string;
    value: ShopCashTransaction;
    indexes: { 'by-shop': string; 'by-date': string };
  };
  stockAdjustments: {
    key: string;
    value: ShopStockAdjustment;
    indexes: { 'by-shop': string; 'by-product': string };
  };
  returns: {
    key: string;
    value: ShopReturn;
    indexes: { 'by-shop': string; 'by-type': string };
  };
  stockBatches: {
    key: string;
    value: ShopStockBatch;
    indexes: { 'by-shop': string; 'by-product': string };
  };
  settings: {
    key: string;
    value: ShopSettings;
    indexes: { 'by-shop': string };
  };
  dailyCashRegister: {
    key: string;
    value: ShopDailyCashRegister;
    indexes: { 'by-shop': string; 'by-date': string };
  };
  loans: {
    key: string;
    value: ShopLoan;
    indexes: { 'by-shop': string; 'by-customer': string };
  };
  staff: {
    key: string;
    value: ShopStaff;
    indexes: { 'by-shop': string };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-synced': number; 'by-table': string };
  };
  syncMetadata: {
    key: string;
    value: SyncMetadata;
    indexes: { 'by-shop': string };
  };
}

// =============== OFFLINE DATABASE CLASS ===============

class OfflineDB {
  private db: IDBPDatabase<OfflineDBSchema> | null = null;
  private dbName = 'autofloy_offline_shop';
  private version = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<OfflineDBSchema>(this.dbName, this.version, {
      upgrade(db) {
        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by-shop', 'shop_id');
          productStore.createIndex('by-barcode', 'barcode');
          productStore.createIndex('by-category', 'category_id');
        }

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
          categoryStore.createIndex('by-shop', 'shop_id');
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
          customerStore.createIndex('by-shop', 'shop_id');
          customerStore.createIndex('by-phone', 'phone');
        }

        // Suppliers store
        if (!db.objectStoreNames.contains('suppliers')) {
          const supplierStore = db.createObjectStore('suppliers', { keyPath: 'id' });
          supplierStore.createIndex('by-shop', 'shop_id');
        }

        // Sales store
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
          salesStore.createIndex('by-shop', 'shop_id');
          salesStore.createIndex('by-date', 'sale_date');
          salesStore.createIndex('by-customer', 'customer_id');
        }

        // Sale Items store
        if (!db.objectStoreNames.contains('saleItems')) {
          const saleItemsStore = db.createObjectStore('saleItems', { keyPath: 'id' });
          saleItemsStore.createIndex('by-sale', 'sale_id');
          saleItemsStore.createIndex('by-product', 'product_id');
        }

        // Purchases store
        if (!db.objectStoreNames.contains('purchases')) {
          const purchasesStore = db.createObjectStore('purchases', { keyPath: 'id' });
          purchasesStore.createIndex('by-shop', 'shop_id');
          purchasesStore.createIndex('by-date', 'purchase_date');
          purchasesStore.createIndex('by-supplier', 'supplier_id');
        }

        // Purchase Items store
        if (!db.objectStoreNames.contains('purchaseItems')) {
          const purchaseItemsStore = db.createObjectStore('purchaseItems', { keyPath: 'id' });
          purchaseItemsStore.createIndex('by-purchase', 'purchase_id');
          purchaseItemsStore.createIndex('by-product', 'product_id');
        }

        // Expenses store
        if (!db.objectStoreNames.contains('expenses')) {
          const expensesStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expensesStore.createIndex('by-shop', 'shop_id');
          expensesStore.createIndex('by-date', 'expense_date');
          expensesStore.createIndex('by-category', 'category');
        }

        // Cash Transactions store
        if (!db.objectStoreNames.contains('cashTransactions')) {
          const cashStore = db.createObjectStore('cashTransactions', { keyPath: 'id' });
          cashStore.createIndex('by-shop', 'shop_id');
          cashStore.createIndex('by-date', 'transaction_date');
        }

        // Stock Adjustments store
        if (!db.objectStoreNames.contains('stockAdjustments')) {
          const adjustmentStore = db.createObjectStore('stockAdjustments', { keyPath: 'id' });
          adjustmentStore.createIndex('by-shop', 'shop_id');
          adjustmentStore.createIndex('by-product', 'product_id');
        }

        // Returns store
        if (!db.objectStoreNames.contains('returns')) {
          const returnsStore = db.createObjectStore('returns', { keyPath: 'id' });
          returnsStore.createIndex('by-shop', 'shop_id');
          returnsStore.createIndex('by-type', 'return_type');
        }

        // Stock Batches store
        if (!db.objectStoreNames.contains('stockBatches')) {
          const batchesStore = db.createObjectStore('stockBatches', { keyPath: 'id' });
          batchesStore.createIndex('by-shop', 'shop_id');
          batchesStore.createIndex('by-product', 'product_id');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
          settingsStore.createIndex('by-shop', 'shop_id');
        }

        // Daily Cash Register store
        if (!db.objectStoreNames.contains('dailyCashRegister')) {
          const registerStore = db.createObjectStore('dailyCashRegister', { keyPath: 'id' });
          registerStore.createIndex('by-shop', 'shop_id');
          registerStore.createIndex('by-date', 'register_date');
        }

        // Loans store
        if (!db.objectStoreNames.contains('loans')) {
          const loansStore = db.createObjectStore('loans', { keyPath: 'id' });
          loansStore.createIndex('by-shop', 'shop_id');
          loansStore.createIndex('by-customer', 'customer_id');
        }

        // Staff store
        if (!db.objectStoreNames.contains('staff')) {
          const staffStore = db.createObjectStore('staff', { keyPath: 'id' });
          staffStore.createIndex('by-shop', 'shop_id');
        }

        // Sync Queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncQueueStore.createIndex('by-synced', 'synced');
          syncQueueStore.createIndex('by-table', 'table');
        }

        // Sync Metadata store
        if (!db.objectStoreNames.contains('syncMetadata')) {
          const syncMetaStore = db.createObjectStore('syncMetadata', { keyPath: 'id' });
          syncMetaStore.createIndex('by-shop', 'shopId');
        }
      },
    });
  }

  private ensureDb(): IDBPDatabase<OfflineDBSchema> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // =============== PRODUCTS ===============

  async getProducts(shopId: string): Promise<ShopProduct[]> {
    const db = this.ensureDb();
    const allProducts = await db.getAllFromIndex('products', 'by-shop', shopId);
    return allProducts.filter(p => !p._locallyDeleted);
  }

  async getProductById(id: string): Promise<ShopProduct | undefined> {
    const db = this.ensureDb();
    const product = await db.get('products', id);
    return product?._locallyDeleted ? undefined : product;
  }

  async getProductByBarcode(barcode: string, shopId: string): Promise<ShopProduct | undefined> {
    const db = this.ensureDb();
    const products = await db.getAllFromIndex('products', 'by-barcode', barcode);
    return products.find(p => p.shop_id === shopId && !p._locallyDeleted);
  }

  async saveProduct(product: ShopProduct): Promise<void> {
    const db = this.ensureDb();
    await db.put('products', product);
  }

  async deleteProduct(id: string): Promise<void> {
    const db = this.ensureDb();
    const product = await db.get('products', id);
    if (product) {
      product._locallyDeleted = true;
      product._locallyModified = true;
      await db.put('products', product);
    }
  }

  async bulkSaveProducts(products: ShopProduct[]): Promise<void> {
    const db = this.ensureDb();
    const tx = db.transaction('products', 'readwrite');
    await Promise.all([
      ...products.map(p => tx.store.put(p)),
      tx.done,
    ]);
  }

  async updateProductStock(id: string, quantityChange: number): Promise<void> {
    const db = this.ensureDb();
    const product = await db.get('products', id);
    if (product) {
      product.stock_quantity = Math.max(0, product.stock_quantity + quantityChange);
      product.updated_at = new Date().toISOString();
      product._locallyModified = true;
      await db.put('products', product);
    }
  }

  // =============== CATEGORIES ===============

  async getCategories(shopId: string): Promise<ShopCategory[]> {
    const db = this.ensureDb();
    const categories = await db.getAllFromIndex('categories', 'by-shop', shopId);
    return categories.filter(c => !c._locallyDeleted);
  }

  async saveCategory(category: ShopCategory): Promise<void> {
    const db = this.ensureDb();
    await db.put('categories', category);
  }

  async deleteCategory(id: string): Promise<void> {
    const db = this.ensureDb();
    const category = await db.get('categories', id);
    if (category) {
      category._locallyDeleted = true;
      category._locallyModified = true;
      await db.put('categories', category);
    }
  }

  // =============== CUSTOMERS ===============

  async getCustomers(shopId: string): Promise<ShopCustomer[]> {
    const db = this.ensureDb();
    const customers = await db.getAllFromIndex('customers', 'by-shop', shopId);
    return customers.filter(c => !c._locallyDeleted);
  }

  async getCustomerById(id: string): Promise<ShopCustomer | undefined> {
    const db = this.ensureDb();
    const customer = await db.get('customers', id);
    return customer?._locallyDeleted ? undefined : customer;
  }

  async getCustomerByPhone(phone: string, shopId: string): Promise<ShopCustomer | undefined> {
    const db = this.ensureDb();
    const customers = await db.getAllFromIndex('customers', 'by-phone', phone);
    return customers.find(c => c.shop_id === shopId && !c._locallyDeleted);
  }

  async saveCustomer(customer: ShopCustomer): Promise<void> {
    const db = this.ensureDb();
    await db.put('customers', customer);
  }

  async deleteCustomer(id: string): Promise<void> {
    const db = this.ensureDb();
    const customer = await db.get('customers', id);
    if (customer) {
      customer._locallyDeleted = true;
      customer._locallyModified = true;
      await db.put('customers', customer);
    }
  }

  async updateCustomerDue(id: string, dueChange: number): Promise<void> {
    const db = this.ensureDb();
    const customer = await db.get('customers', id);
    if (customer) {
      customer.total_due += dueChange;
      customer.updated_at = new Date().toISOString();
      customer._locallyModified = true;
      await db.put('customers', customer);
    }
  }

  // =============== SUPPLIERS ===============

  async getSuppliers(shopId: string): Promise<ShopSupplier[]> {
    const db = this.ensureDb();
    const suppliers = await db.getAllFromIndex('suppliers', 'by-shop', shopId);
    return suppliers.filter(s => !s._locallyDeleted);
  }

  async getSupplierById(id: string): Promise<ShopSupplier | undefined> {
    const db = this.ensureDb();
    const supplier = await db.get('suppliers', id);
    return supplier?._locallyDeleted ? undefined : supplier;
  }

  async saveSupplier(supplier: ShopSupplier): Promise<void> {
    const db = this.ensureDb();
    await db.put('suppliers', supplier);
  }

  async deleteSupplier(id: string): Promise<void> {
    const db = this.ensureDb();
    const supplier = await db.get('suppliers', id);
    if (supplier) {
      supplier._locallyDeleted = true;
      supplier._locallyModified = true;
      await db.put('suppliers', supplier);
    }
  }

  async updateSupplierDue(id: string, dueChange: number): Promise<void> {
    const db = this.ensureDb();
    const supplier = await db.get('suppliers', id);
    if (supplier) {
      supplier.total_due += dueChange;
      supplier.updated_at = new Date().toISOString();
      supplier._locallyModified = true;
      await db.put('suppliers', supplier);
    }
  }

  // =============== SALES ===============

  async getSales(shopId: string, startDate?: string, endDate?: string): Promise<ShopSale[]> {
    const db = this.ensureDb();
    const sales = await db.getAllFromIndex('sales', 'by-shop', shopId);
    let filtered = sales.filter(s => !s._locallyDeleted);
    
    if (startDate) {
      filtered = filtered.filter(s => s.sale_date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(s => s.sale_date <= endDate);
    }
    
    return filtered.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());
  }

  async getSaleById(id: string): Promise<ShopSale | undefined> {
    const db = this.ensureDb();
    const sale = await db.get('sales', id);
    if (!sale || sale._locallyDeleted) return undefined;
    
    // Get sale items
    const items = await db.getAllFromIndex('saleItems', 'by-sale', id);
    sale.items = items;
    return sale;
  }

  async saveSale(sale: ShopSale): Promise<void> {
    const db = this.ensureDb();
    const tx = db.transaction(['sales', 'saleItems'], 'readwrite');
    
    await tx.objectStore('sales').put(sale);
    
    if (sale.items && sale.items.length > 0) {
      const itemsStore = tx.objectStore('saleItems');
      for (const item of sale.items) {
        await itemsStore.put(item);
      }
    }
    
    await tx.done;
  }

  async deleteSale(id: string): Promise<void> {
    const db = this.ensureDb();
    const sale = await db.get('sales', id);
    if (sale) {
      sale._locallyDeleted = true;
      sale._locallyModified = true;
      await db.put('sales', sale);
    }
  }

  async getSaleItems(saleId: string): Promise<ShopSaleItem[]> {
    const db = this.ensureDb();
    return db.getAllFromIndex('saleItems', 'by-sale', saleId);
  }

  // =============== PURCHASES ===============

  async getPurchases(shopId: string, startDate?: string, endDate?: string): Promise<ShopPurchase[]> {
    const db = this.ensureDb();
    const purchases = await db.getAllFromIndex('purchases', 'by-shop', shopId);
    let filtered = purchases.filter(p => !p._locallyDeleted);
    
    if (startDate) {
      filtered = filtered.filter(p => p.purchase_date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(p => p.purchase_date <= endDate);
    }
    
    return filtered.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());
  }

  async getPurchaseById(id: string): Promise<ShopPurchase | undefined> {
    const db = this.ensureDb();
    const purchase = await db.get('purchases', id);
    if (!purchase || purchase._locallyDeleted) return undefined;
    
    const items = await db.getAllFromIndex('purchaseItems', 'by-purchase', id);
    purchase.items = items;
    return purchase;
  }

  async savePurchase(purchase: ShopPurchase): Promise<void> {
    const db = this.ensureDb();
    const tx = db.transaction(['purchases', 'purchaseItems'], 'readwrite');
    
    await tx.objectStore('purchases').put(purchase);
    
    if (purchase.items && purchase.items.length > 0) {
      const itemsStore = tx.objectStore('purchaseItems');
      for (const item of purchase.items) {
        await itemsStore.put(item);
      }
    }
    
    await tx.done;
  }

  async deletePurchase(id: string): Promise<void> {
    const db = this.ensureDb();
    const purchase = await db.get('purchases', id);
    if (purchase) {
      purchase._locallyDeleted = true;
      purchase._locallyModified = true;
      await db.put('purchases', purchase);
    }
  }

  // =============== EXPENSES ===============

  async getExpenses(shopId: string, startDate?: string, endDate?: string): Promise<ShopExpense[]> {
    const db = this.ensureDb();
    const expenses = await db.getAllFromIndex('expenses', 'by-shop', shopId);
    let filtered = expenses.filter(e => !e._locallyDeleted);
    
    if (startDate) {
      filtered = filtered.filter(e => e.expense_date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(e => e.expense_date <= endDate);
    }
    
    return filtered.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  }

  async saveExpense(expense: ShopExpense): Promise<void> {
    const db = this.ensureDb();
    await db.put('expenses', expense);
  }

  async deleteExpense(id: string): Promise<void> {
    const db = this.ensureDb();
    const expense = await db.get('expenses', id);
    if (expense) {
      expense._locallyDeleted = true;
      expense._locallyModified = true;
      await db.put('expenses', expense);
    }
  }

  // =============== CASH TRANSACTIONS ===============

  async getCashTransactions(shopId: string, startDate?: string, endDate?: string): Promise<ShopCashTransaction[]> {
    const db = this.ensureDb();
    const transactions = await db.getAllFromIndex('cashTransactions', 'by-shop', shopId);
    let filtered = transactions.filter(t => !t._locallyDeleted);
    
    if (startDate) {
      filtered = filtered.filter(t => t.transaction_date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(t => t.transaction_date <= endDate);
    }
    
    return filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }

  async saveCashTransaction(transaction: ShopCashTransaction): Promise<void> {
    const db = this.ensureDb();
    await db.put('cashTransactions', transaction);
  }

  async deleteCashTransaction(id: string): Promise<void> {
    const db = this.ensureDb();
    const transaction = await db.get('cashTransactions', id);
    if (transaction) {
      transaction._locallyDeleted = true;
      transaction._locallyModified = true;
      await db.put('cashTransactions', transaction);
    }
  }

  // =============== STOCK ADJUSTMENTS ===============

  async getStockAdjustments(shopId: string): Promise<ShopStockAdjustment[]> {
    const db = this.ensureDb();
    const adjustments = await db.getAllFromIndex('stockAdjustments', 'by-shop', shopId);
    return adjustments.filter(a => !a._locallyDeleted);
  }

  async saveStockAdjustment(adjustment: ShopStockAdjustment): Promise<void> {
    const db = this.ensureDb();
    await db.put('stockAdjustments', adjustment);
  }

  // =============== RETURNS ===============

  async getReturns(shopId: string, returnType?: 'sale' | 'purchase'): Promise<ShopReturn[]> {
    const db = this.ensureDb();
    const returns = await db.getAllFromIndex('returns', 'by-shop', shopId);
    let filtered = returns.filter(r => !r._locallyDeleted);
    
    if (returnType) {
      filtered = filtered.filter(r => r.return_type === returnType);
    }
    
    return filtered.sort((a, b) => new Date(b.return_date).getTime() - new Date(a.return_date).getTime());
  }

  async saveReturn(returnItem: ShopReturn): Promise<void> {
    const db = this.ensureDb();
    await db.put('returns', returnItem);
  }

  // =============== STOCK BATCHES ===============

  async getStockBatches(productId: string): Promise<ShopStockBatch[]> {
    const db = this.ensureDb();
    const batches = await db.getAllFromIndex('stockBatches', 'by-product', productId);
    return batches.filter(b => !b._locallyDeleted && b.remaining_quantity > 0);
  }

  async saveStockBatch(batch: ShopStockBatch): Promise<void> {
    const db = this.ensureDb();
    await db.put('stockBatches', batch);
  }

  // =============== SETTINGS ===============

  async getSettings(shopId: string): Promise<ShopSettings | undefined> {
    const db = this.ensureDb();
    const settings = await db.getAllFromIndex('settings', 'by-shop', shopId);
    return settings[0];
  }

  async saveSettings(settings: ShopSettings): Promise<void> {
    const db = this.ensureDb();
    await db.put('settings', settings);
  }

  // =============== DAILY CASH REGISTER ===============

  async getDailyCashRegister(shopId: string, date: string): Promise<ShopDailyCashRegister | undefined> {
    const db = this.ensureDb();
    const registers = await db.getAllFromIndex('dailyCashRegister', 'by-shop', shopId);
    return registers.find(r => r.register_date === date && !r._locallyDeleted);
  }

  async saveDailyCashRegister(register: ShopDailyCashRegister): Promise<void> {
    const db = this.ensureDb();
    await db.put('dailyCashRegister', register);
  }

  // =============== LOANS ===============

  async getLoans(shopId: string): Promise<ShopLoan[]> {
    const db = this.ensureDb();
    const loans = await db.getAllFromIndex('loans', 'by-shop', shopId);
    return loans.filter(l => !l._locallyDeleted);
  }

  async saveLoan(loan: ShopLoan): Promise<void> {
    const db = this.ensureDb();
    await db.put('loans', loan);
  }

  async deleteLoan(id: string): Promise<void> {
    const db = this.ensureDb();
    const loan = await db.get('loans', id);
    if (loan) {
      loan._locallyDeleted = true;
      loan._locallyModified = true;
      await db.put('loans', loan);
    }
  }

  // =============== STAFF ===============

  async getStaff(shopId: string): Promise<ShopStaff[]> {
    const db = this.ensureDb();
    const staff = await db.getAllFromIndex('staff', 'by-shop', shopId);
    return staff.filter(s => !s._locallyDeleted);
  }

  async saveStaff(staffMember: ShopStaff): Promise<void> {
    const db = this.ensureDb();
    await db.put('staff', staffMember);
  }

  async deleteStaff(id: string): Promise<void> {
    const db = this.ensureDb();
    const staff = await db.get('staff', id);
    if (staff) {
      staff._locallyDeleted = true;
      staff._locallyModified = true;
      await db.put('staff', staff);
    }
  }

  // =============== SYNC QUEUE ===============

  async addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<void> {
    const db = this.ensureDb();
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.put('syncQueue', { ...item, id });
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    const db = this.ensureDb();
    const items = await db.getAll('syncQueue');
    return items.filter(i => !i.synced).sort((a, b) => a.timestamp - b.timestamp);
  }

  async markAsSynced(id: string): Promise<void> {
    const db = this.ensureDb();
    const item = await db.get('syncQueue', id);
    if (item) {
      item.synced = true;
      await db.put('syncQueue', item);
    }
  }

  async updateSyncQueueError(id: string, error: string): Promise<void> {
    const db = this.ensureDb();
    const item = await db.get('syncQueue', id);
    if (item) {
      item.retryCount += 1;
      item.lastError = error;
      await db.put('syncQueue', item);
    }
  }

  async clearSyncedItems(): Promise<void> {
    const db = this.ensureDb();
    const items = await db.getAll('syncQueue');
    const tx = db.transaction('syncQueue', 'readwrite');
    for (const item of items) {
      if (item.synced) {
        await tx.store.delete(item.id);
      }
    }
    await tx.done;
  }

  async getSyncQueueCount(): Promise<number> {
    const items = await this.getPendingSyncItems();
    return items.length;
  }

  // =============== SYNC METADATA ===============

  async getSyncMetadata(shopId: string): Promise<SyncMetadata | undefined> {
    const db = this.ensureDb();
    const metadataList = await db.getAllFromIndex('syncMetadata', 'by-shop', shopId);
    return metadataList[0];
  }

  async saveSyncMetadata(metadata: SyncMetadata): Promise<void> {
    const db = this.ensureDb();
    await db.put('syncMetadata', metadata);
  }

  // =============== UTILITY METHODS ===============

  async clearAllData(): Promise<void> {
    const db = this.ensureDb();
    const storeNames = [
      'products', 'categories', 'customers', 'suppliers', 'sales', 'saleItems',
      'purchases', 'purchaseItems', 'expenses', 'cashTransactions', 'stockAdjustments',
      'returns', 'stockBatches', 'settings', 'dailyCashRegister', 'loans', 'staff',
      'syncQueue', 'syncMetadata'
    ] as const;
    
    for (const storeName of storeNames) {
      await db.clear(storeName);
    }
  }

  async clearShopData(shopId: string): Promise<void> {
    const db = this.ensureDb();
    
    // Clear products
    const products = await db.getAllFromIndex('products', 'by-shop', shopId);
    const productTx = db.transaction('products', 'readwrite');
    for (const p of products) {
      await productTx.store.delete(p.id);
    }
    await productTx.done;
    
    // Repeat for other stores...
    // This is simplified - in production, you'd do all stores
  }

  async getDataSize(): Promise<{ tables: Record<string, number>; total: number }> {
    const db = this.ensureDb();
    const tables: Record<string, number> = {};
    let total = 0;
    
    const storeNames = [
      'products', 'categories', 'customers', 'suppliers', 'sales',
      'purchases', 'expenses', 'cashTransactions', 'stockAdjustments',
      'returns', 'stockBatches', 'settings', 'dailyCashRegister', 'loans', 'staff'
    ];
    
    for (const name of storeNames) {
      const count = await db.count(name as any);
      tables[name] = count;
      total += count;
    }
    
    return { tables, total };
  }

  async getModifiedRecords(shopId: string): Promise<{
    products: ShopProduct[];
    categories: ShopCategory[];
    customers: ShopCustomer[];
    suppliers: ShopSupplier[];
    sales: ShopSale[];
    purchases: ShopPurchase[];
    expenses: ShopExpense[];
  }> {
    const db = this.ensureDb();
    
    const products = (await db.getAllFromIndex('products', 'by-shop', shopId))
      .filter(p => p._locallyModified || p._locallyCreated);
    const categories = (await db.getAllFromIndex('categories', 'by-shop', shopId))
      .filter(c => c._locallyModified || c._locallyCreated);
    const customers = (await db.getAllFromIndex('customers', 'by-shop', shopId))
      .filter(c => c._locallyModified || c._locallyCreated);
    const suppliers = (await db.getAllFromIndex('suppliers', 'by-shop', shopId))
      .filter(s => s._locallyModified || s._locallyCreated);
    const sales = (await db.getAllFromIndex('sales', 'by-shop', shopId))
      .filter(s => s._locallyModified || s._locallyCreated);
    const purchases = (await db.getAllFromIndex('purchases', 'by-shop', shopId))
      .filter(p => p._locallyModified || p._locallyCreated);
    const expenses = (await db.getAllFromIndex('expenses', 'by-shop', shopId))
      .filter(e => e._locallyModified || e._locallyCreated);
    
    return { products, categories, customers, suppliers, sales, purchases, expenses };
  }

  async clearModifiedFlags(shopId: string): Promise<void> {
    const db = this.ensureDb();
    
    // Clear flags for products
    const products = await db.getAllFromIndex('products', 'by-shop', shopId);
    const productTx = db.transaction('products', 'readwrite');
    for (const p of products) {
      if (p._locallyModified || p._locallyCreated) {
        p._locallyModified = false;
        p._locallyCreated = false;
        await productTx.store.put(p);
      }
    }
    await productTx.done;
    
    // Repeat for other stores as needed
  }
}

// Export singleton instance
export const offlineDB = new OfflineDB();
