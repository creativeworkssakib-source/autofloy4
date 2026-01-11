/**
 * Offline-First Data Service
 * 
 * This service provides offline-first data access pattern:
 * 1. Always read from local IndexedDB first
 * 2. If online, sync with server in background
 * 3. All writes go to local first, then queue for server sync
 */

import { offlineDB, ShopProduct, ShopCategory, ShopCustomer, ShopSupplier, ShopSale, ShopSaleItem, ShopPurchase, ShopExpense, ShopCashTransaction, ShopStockAdjustment, ShopReturn, ShopStockBatch, ShopSettings, ShopDailyCashRegister, ShopLoan, ShopStaff, SyncMetadata } from '@/lib/offlineDB';
import { syncQueue, SyncTable } from '@/lib/syncQueue';
import { generateOfflineId, generateInvoiceNumber, calculateSaleTotals } from '@/lib/offlineUtils';
import { offlineShopService } from './offlineShopService';

const CURRENT_SHOP_KEY = 'autofloy_current_shop_id';

class OfflineDataService {
  private initialized = false;
  private shopId: string | null = null;
  private userId: string | null = null;
  
  // =============== INITIALIZATION ===============
  
  async init(): Promise<void> {
    if (this.initialized) return;
    await offlineDB.init();
    this.shopId = localStorage.getItem(CURRENT_SHOP_KEY);
    this.initialized = true;
  }
  
  setShopId(shopId: string): void {
    this.shopId = shopId;
    localStorage.setItem(CURRENT_SHOP_KEY, shopId);
  }
  
  setUserId(userId: string): void {
    this.userId = userId;
  }
  
  getShopId(): string | null {
    return this.shopId || localStorage.getItem(CURRENT_SHOP_KEY);
  }
  
  private ensureShopId(): string {
    const shopId = this.getShopId();
    if (!shopId) throw new Error('Shop ID not set');
    return shopId;
  }
  
  isOnline(): boolean {
    return navigator.onLine;
  }
  
  // =============== PRODUCTS ===============
  
  async getProducts(): Promise<{ products: ShopProduct[]; fromCache: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    
    // Always get from local first
    const localProducts = await offlineDB.getProducts(shopId);
    
    // If online, sync in background
    if (this.isOnline()) {
      this.syncProductsInBackground(shopId);
    }
    
    return { products: localProducts, fromCache: true };
  }
  
  private async syncProductsInBackground(shopId: string): Promise<void> {
    try {
      const { products } = await offlineShopService.getProducts();
      // Update local cache with server data
      for (const product of products) {
        const localProduct = await offlineDB.getProductById(product.id);
        // Only update if not locally modified
        if (!localProduct?._locallyModified && !localProduct?._locallyCreated) {
          await offlineDB.saveProduct({
            ...product,
            shop_id: shopId,
            user_id: this.userId || '',
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          } as ShopProduct);
        }
      }
    } catch (error) {
      console.error('Background sync failed for products:', error);
    }
  }
  
  async getProductById(id: string): Promise<ShopProduct | undefined> {
    await this.init();
    return offlineDB.getProductById(id);
  }
  
  async getProductByBarcode(barcode: string): Promise<ShopProduct | undefined> {
    await this.init();
    const shopId = this.ensureShopId();
    return offlineDB.getProductByBarcode(barcode, shopId);
  }
  
  async createProduct(productData: Partial<ShopProduct>): Promise<{ product: ShopProduct; offline: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const now = new Date().toISOString();
    
    const product: ShopProduct = {
      id: generateOfflineId(),
      shop_id: shopId,
      user_id: this.userId || '',
      name: productData.name || '',
      sku: productData.sku,
      barcode: productData.barcode,
      category_id: productData.category_id,
      category_name: productData.category_name,
      description: productData.description,
      purchase_price: productData.purchase_price || 0,
      selling_price: productData.selling_price || 0,
      stock_quantity: productData.stock_quantity || 0,
      min_stock_alert: productData.min_stock_alert,
      unit: productData.unit,
      image_url: productData.image_url,
      expiry_date: productData.expiry_date,
      is_active: productData.is_active ?? true,
      created_at: now,
      updated_at: now,
      _locallyCreated: true,
      _locallyModified: false,
      _locallyDeleted: false,
    };
    
    await offlineDB.saveProduct(product);
    await syncQueue.add('create', 'products', product.id, product);
    
    // If online, try to sync immediately
    if (this.isOnline()) {
      try {
        const { product: serverProduct } = await offlineShopService.createProduct(productData);
        // Update local with server ID and clear flags
        const updatedProduct = {
          ...product,
          id: serverProduct.id,
          _locallyCreated: false,
        };
        await offlineDB.deleteProduct(product.id);
        await offlineDB.saveProduct(updatedProduct as ShopProduct);
        // Clear from sync queue since we synced immediately
        await syncQueue.clearSynced();
        return { product: updatedProduct as ShopProduct, offline: false };
      } catch (error) {
        console.error('Failed to sync product to server:', error);
      }
    }
    
    return { product, offline: true };
  }
  
  async updateProduct(productData: Partial<ShopProduct> & { id: string }): Promise<{ product: ShopProduct; offline: boolean }> {
    await this.init();
    const existing = await offlineDB.getProductById(productData.id);
    if (!existing) throw new Error('Product not found');
    
    const updated: ShopProduct = {
      ...existing,
      ...productData,
      updated_at: new Date().toISOString(),
      _locallyModified: true,
    };
    
    await offlineDB.saveProduct(updated);
    await syncQueue.add('update', 'products', updated.id, updated);
    
    if (this.isOnline()) {
      try {
        await offlineShopService.updateProduct(productData);
        updated._locallyModified = false;
        await offlineDB.saveProduct(updated);
        return { product: updated, offline: false };
      } catch (error) {
        console.error('Failed to sync product update:', error);
      }
    }
    
    return { product: updated, offline: true };
  }
  
  async deleteProduct(id: string): Promise<{ offline: boolean }> {
    await this.init();
    await offlineDB.deleteProduct(id);
    await syncQueue.add('delete', 'products', id, { id });
    
    if (this.isOnline()) {
      try {
        await offlineShopService.deleteProduct(id);
        return { offline: false };
      } catch (error) {
        console.error('Failed to sync product deletion:', error);
      }
    }
    
    return { offline: true };
  }
  
  async updateProductStock(id: string, quantityChange: number): Promise<void> {
    await this.init();
    await offlineDB.updateProductStock(id, quantityChange);
    const product = await offlineDB.getProductById(id);
    if (product) {
      await syncQueue.add('update', 'products', id, product);
    }
  }
  
  // =============== CATEGORIES ===============
  
  async getCategories(): Promise<{ categories: ShopCategory[]; fromCache: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const categories = await offlineDB.getCategories(shopId);
    
    if (this.isOnline()) {
      this.syncCategoriesInBackground(shopId);
    }
    
    return { categories, fromCache: true };
  }
  
  private async syncCategoriesInBackground(shopId: string): Promise<void> {
    try {
      const { categories } = await offlineShopService.getCategories();
      for (const cat of categories) {
        const local = await offlineDB.getCategories(shopId);
        const existing = local.find(c => c.id === cat.id);
        if (!existing?._locallyModified && !existing?._locallyCreated) {
          await offlineDB.saveCategory({
            ...cat,
            shop_id: shopId,
            user_id: this.userId || '',
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          } as ShopCategory);
        }
      }
    } catch (error) {
      console.error('Background sync failed for categories:', error);
    }
  }
  
  async createCategory(data: { name: string; description?: string }): Promise<{ category: ShopCategory; offline: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const now = new Date().toISOString();
    
    const category: ShopCategory = {
      id: generateOfflineId(),
      shop_id: shopId,
      user_id: this.userId || '',
      name: data.name,
      description: data.description,
      created_at: now,
      _locallyCreated: true,
      _locallyModified: false,
      _locallyDeleted: false,
    };
    
    await offlineDB.saveCategory(category);
    await syncQueue.add('create', 'categories', category.id, category);
    
    if (this.isOnline()) {
      try {
        const { category: serverCat } = await offlineShopService.createCategory(data);
        const updated = { ...category, id: serverCat.id, _locallyCreated: false };
        await offlineDB.deleteCategory(category.id);
        await offlineDB.saveCategory(updated as ShopCategory);
        return { category: updated as ShopCategory, offline: false };
      } catch (error) {
        console.error('Failed to sync category:', error);
      }
    }
    
    return { category, offline: true };
  }
  
  // =============== CUSTOMERS ===============
  
  async getCustomers(): Promise<{ customers: ShopCustomer[]; fromCache: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const customers = await offlineDB.getCustomers(shopId);
    
    if (this.isOnline()) {
      this.syncCustomersInBackground(shopId);
    }
    
    return { customers, fromCache: true };
  }
  
  private async syncCustomersInBackground(shopId: string): Promise<void> {
    try {
      const { customers } = await offlineShopService.getCustomers();
      for (const cust of customers) {
        const existing = await offlineDB.getCustomerById(cust.id);
        if (!existing?._locallyModified && !existing?._locallyCreated) {
          await offlineDB.saveCustomer({
            ...cust,
            shop_id: shopId,
            user_id: this.userId || '',
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          } as ShopCustomer);
        }
      }
    } catch (error) {
      console.error('Background sync failed for customers:', error);
    }
  }
  
  async getCustomerById(id: string): Promise<ShopCustomer | undefined> {
    await this.init();
    return offlineDB.getCustomerById(id);
  }
  
  async createCustomer(data: Partial<ShopCustomer>): Promise<{ customer: ShopCustomer; offline: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const now = new Date().toISOString();
    
    const customer: ShopCustomer = {
      id: generateOfflineId(),
      shop_id: shopId,
      user_id: this.userId || '',
      name: data.name || '',
      phone: data.phone,
      email: data.email,
      address: data.address,
      notes: data.notes,
      total_purchases: 0,
      total_due: data.opening_balance || 0,
      opening_balance: data.opening_balance || 0,
      created_at: now,
      updated_at: now,
      _locallyCreated: true,
      _locallyModified: false,
      _locallyDeleted: false,
    };
    
    await offlineDB.saveCustomer(customer);
    await syncQueue.add('create', 'customers', customer.id, customer);
    
    if (this.isOnline()) {
      try {
        const { customer: serverCust } = await offlineShopService.createCustomer(data);
        const updated = { ...customer, id: serverCust.id, _locallyCreated: false };
        await offlineDB.deleteCustomer(customer.id);
        await offlineDB.saveCustomer(updated as ShopCustomer);
        return { customer: updated as ShopCustomer, offline: false };
      } catch (error) {
        console.error('Failed to sync customer:', error);
      }
    }
    
    return { customer, offline: true };
  }
  
  async updateCustomer(data: Partial<ShopCustomer> & { id: string }): Promise<{ customer: ShopCustomer; offline: boolean }> {
    await this.init();
    const existing = await offlineDB.getCustomerById(data.id);
    if (!existing) throw new Error('Customer not found');
    
    const updated: ShopCustomer = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
      _locallyModified: true,
    };
    
    await offlineDB.saveCustomer(updated);
    await syncQueue.add('update', 'customers', updated.id, updated);
    
    if (this.isOnline()) {
      try {
        await offlineShopService.updateCustomer(data);
        updated._locallyModified = false;
        await offlineDB.saveCustomer(updated);
        return { customer: updated, offline: false };
      } catch (error) {
        console.error('Failed to sync customer update:', error);
      }
    }
    
    return { customer: updated, offline: true };
  }
  
  async deleteCustomer(id: string): Promise<{ offline: boolean }> {
    await this.init();
    await offlineDB.deleteCustomer(id);
    await syncQueue.add('delete', 'customers', id, { id });
    
    if (this.isOnline()) {
      try {
        await offlineShopService.deleteCustomer(id);
        return { offline: false };
      } catch (error) {
        console.error('Failed to sync customer deletion:', error);
      }
    }
    
    return { offline: true };
  }
  
  // =============== SUPPLIERS ===============
  
  async getSuppliers(): Promise<{ suppliers: ShopSupplier[]; fromCache: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const suppliers = await offlineDB.getSuppliers(shopId);
    
    if (this.isOnline()) {
      this.syncSuppliersInBackground(shopId);
    }
    
    return { suppliers, fromCache: true };
  }
  
  private async syncSuppliersInBackground(shopId: string): Promise<void> {
    try {
      const { suppliers } = await offlineShopService.getSuppliers();
      for (const supp of suppliers) {
        const existing = await offlineDB.getSupplierById(supp.id);
        if (!existing?._locallyModified && !existing?._locallyCreated) {
          await offlineDB.saveSupplier({
            ...supp,
            shop_id: shopId,
            user_id: this.userId || '',
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          } as ShopSupplier);
        }
      }
    } catch (error) {
      console.error('Background sync failed for suppliers:', error);
    }
  }
  
  async createSupplier(data: Partial<ShopSupplier>): Promise<{ supplier: ShopSupplier; offline: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const now = new Date().toISOString();
    
    const supplier: ShopSupplier = {
      id: generateOfflineId(),
      shop_id: shopId,
      user_id: this.userId || '',
      name: data.name || '',
      phone: data.phone,
      email: data.email,
      address: data.address,
      company_name: data.company_name,
      notes: data.notes,
      total_purchases: 0,
      total_due: data.opening_balance || 0,
      opening_balance: data.opening_balance || 0,
      created_at: now,
      updated_at: now,
      _locallyCreated: true,
      _locallyModified: false,
      _locallyDeleted: false,
    };
    
    await offlineDB.saveSupplier(supplier);
    await syncQueue.add('create', 'suppliers', supplier.id, supplier);
    
    if (this.isOnline()) {
      try {
        const { supplier: serverSupp } = await offlineShopService.createSupplier(data);
        const updated = { ...supplier, id: serverSupp.id, _locallyCreated: false };
        await offlineDB.deleteSupplier(supplier.id);
        await offlineDB.saveSupplier(updated as ShopSupplier);
        return { supplier: updated as ShopSupplier, offline: false };
      } catch (error) {
        console.error('Failed to sync supplier:', error);
      }
    }
    
    return { supplier, offline: true };
  }
  
  // =============== SALES ===============
  
  async getSales(startDate?: string, endDate?: string): Promise<{ sales: ShopSale[]; fromCache: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const sales = await offlineDB.getSales(shopId, startDate, endDate);
    
    if (this.isOnline()) {
      this.syncSalesInBackground(shopId);
    }
    
    return { sales, fromCache: true };
  }
  
  private async syncSalesInBackground(shopId: string): Promise<void> {
    try {
      const { sales } = await offlineShopService.getSales();
      for (const sale of sales) {
        const existing = await offlineDB.getSaleById(sale.id);
        if (!existing?._locallyModified && !existing?._locallyCreated) {
          await offlineDB.saveSale({
            ...sale,
            shop_id: shopId,
            user_id: this.userId || '',
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          } as ShopSale);
        }
      }
    } catch (error) {
      console.error('Background sync failed for sales:', error);
    }
  }
  
  async getSaleById(id: string): Promise<ShopSale | undefined> {
    await this.init();
    return offlineDB.getSaleById(id);
  }
  
  async createSale(saleData: {
    customer_id?: string;
    customer_name?: string;
    customer_phone?: string;
    items: Array<{
      product_id?: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      purchase_price?: number;
      discount?: number;
      total: number;
    }>;
    discount?: number;
    discount_type?: 'fixed' | 'percentage';
    tax?: number;
    paid_amount?: number;
    payment_method?: string;
    notes?: string;
  }): Promise<{ sale: ShopSale; invoice_number: string; offline: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const now = new Date().toISOString();
    
    // Calculate totals
    const subtotal = saleData.items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = saleData.discount || 0;
    const taxAmount = saleData.tax || 0;
    const total = subtotal - discountAmount + taxAmount;
    const paidAmount = saleData.paid_amount || 0;
    const dueAmount = total - paidAmount;
    
    const invoiceNumber = generateInvoiceNumber('INV', shopId);
    
    const saleItems: ShopSaleItem[] = saleData.items.map((item, index) => ({
      id: generateOfflineId(),
      sale_id: '', // Will be set after sale creation
      product_id: item.product_id || '',
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount || 0,
      total: item.total,
      created_at: now,
    }));
    
    const sale: ShopSale = {
      id: generateOfflineId(),
      shop_id: shopId,
      user_id: this.userId || '',
      invoice_number: invoiceNumber,
      customer_id: saleData.customer_id,
      customer_name: saleData.customer_name,
      customer_phone: saleData.customer_phone,
      subtotal,
      discount: discountAmount,
      discount_type: saleData.discount_type || 'fixed',
      tax: taxAmount,
      total,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_method: saleData.payment_method || 'cash',
      payment_status: dueAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'due',
      notes: saleData.notes,
      sale_date: now.split('T')[0],
      created_at: now,
      updated_at: now,
      items: saleItems.map(item => ({ ...item, sale_id: '' })),
      _locallyCreated: true,
      _locallyModified: false,
      _locallyDeleted: false,
    };
    
    // Update sale_id in items
    sale.items = saleItems.map(item => ({ ...item, sale_id: sale.id }));
    
    // Update product stock
    for (const item of saleData.items) {
      if (item.product_id) {
        await this.updateProductStock(item.product_id, -item.quantity);
      }
    }
    
    // Update customer due if applicable
    if (saleData.customer_id && dueAmount > 0) {
      await offlineDB.updateCustomerDue(saleData.customer_id, dueAmount);
    }
    
    await offlineDB.saveSale(sale);
    await syncQueue.add('create', 'sales', sale.id, sale);
    
    if (this.isOnline()) {
      try {
        const { sale: serverSale, invoice_number: serverInvoice } = await offlineShopService.createSale(saleData);
        const updated = { 
          ...sale, 
          id: serverSale.id, 
          invoice_number: serverInvoice,
          _locallyCreated: false 
        };
        await offlineDB.deleteSale(sale.id);
        await offlineDB.saveSale(updated as ShopSale);
        return { sale: updated as ShopSale, invoice_number: serverInvoice, offline: false };
      } catch (error) {
        console.error('Failed to sync sale:', error);
      }
    }
    
    return { sale, invoice_number: invoiceNumber, offline: true };
  }
  
  // =============== PURCHASES ===============
  
  async getPurchases(startDate?: string, endDate?: string): Promise<{ purchases: ShopPurchase[]; fromCache: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const purchases = await offlineDB.getPurchases(shopId, startDate, endDate);
    
    if (this.isOnline()) {
      this.syncPurchasesInBackground(shopId);
    }
    
    return { purchases, fromCache: true };
  }
  
  private async syncPurchasesInBackground(shopId: string): Promise<void> {
    try {
      const { purchases } = await offlineShopService.getPurchases();
      for (const purchase of purchases) {
        const existing = await offlineDB.getPurchaseById(purchase.id);
        if (!existing?._locallyModified && !existing?._locallyCreated) {
          await offlineDB.savePurchase({
            ...purchase,
            shop_id: shopId,
            user_id: this.userId || '',
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          } as ShopPurchase);
        }
      }
    } catch (error) {
      console.error('Background sync failed for purchases:', error);
    }
  }
  
  async createPurchase(data: any): Promise<{ purchase: ShopPurchase; offline: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const now = new Date().toISOString();
    
    const purchase: ShopPurchase = {
      id: generateOfflineId(),
      shop_id: shopId,
      user_id: this.userId || '',
      invoice_number: data.invoice_number,
      supplier_id: data.supplier_id,
      supplier_name: data.supplier_name,
      subtotal: data.items?.reduce((sum: number, i: any) => sum + (i.total || 0), 0) || 0,
      discount: data.discount || 0,
      tax: data.tax || 0,
      total: data.items?.reduce((sum: number, i: any) => sum + (i.total || 0), 0) || 0,
      paid_amount: data.paid_amount || 0,
      due_amount: 0,
      payment_method: data.payment_method || 'cash',
      payment_status: 'paid',
      notes: data.notes,
      purchase_date: now.split('T')[0],
      created_at: now,
      updated_at: now,
      items: data.items,
      _locallyCreated: true,
      _locallyModified: false,
      _locallyDeleted: false,
    };
    
    purchase.due_amount = purchase.total - purchase.paid_amount;
    purchase.payment_status = purchase.due_amount === 0 ? 'paid' : purchase.paid_amount > 0 ? 'partial' : 'due';
    
    await offlineDB.savePurchase(purchase);
    await syncQueue.add('create', 'purchases', purchase.id, purchase);
    
    if (this.isOnline()) {
      try {
        const { purchase: serverPurchase } = await offlineShopService.createPurchase(data);
        const updated = { ...purchase, id: serverPurchase.id, _locallyCreated: false };
        await offlineDB.deletePurchase(purchase.id);
        await offlineDB.savePurchase(updated as ShopPurchase);
        return { purchase: updated as ShopPurchase, offline: false };
      } catch (error) {
        console.error('Failed to sync purchase:', error);
      }
    }
    
    return { purchase, offline: true };
  }
  
  async deletePurchase(id: string): Promise<{ offline: boolean }> {
    await this.init();
    await offlineDB.deletePurchase(id);
    await syncQueue.add('delete', 'purchases', id, { id });
    
    if (this.isOnline()) {
      try {
        await offlineShopService.deletePurchase(id);
        return { offline: false };
      } catch (error) {
        console.error('Failed to sync purchase deletion:', error);
      }
    }
    
    return { offline: true };
  }
  
  // =============== EXPENSES ===============
  
  async getExpenses(startDate?: string, endDate?: string): Promise<{ expenses: ShopExpense[]; fromCache: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const expenses = await offlineDB.getExpenses(shopId, startDate, endDate);
    
    if (this.isOnline()) {
      this.syncExpensesInBackground(shopId);
    }
    
    return { expenses, fromCache: true };
  }
  
  private async syncExpensesInBackground(shopId: string): Promise<void> {
    try {
      const { expenses } = await offlineShopService.getExpenses();
      for (const exp of expenses) {
        const allExpenses = await offlineDB.getExpenses(shopId);
        const existing = allExpenses.find(e => e.id === exp.id);
        if (!existing?._locallyModified && !existing?._locallyCreated) {
          await offlineDB.saveExpense({
            ...exp,
            shop_id: shopId,
            user_id: this.userId || '',
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          } as ShopExpense);
        }
      }
    } catch (error) {
      console.error('Background sync failed for expenses:', error);
    }
  }
  
  async createExpense(data: {
    category: string;
    description?: string;
    amount: number;
    expense_date?: string;
    payment_method?: string;
    notes?: string;
  }): Promise<{ expense: ShopExpense; offline: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const now = new Date().toISOString();
    
    const expense: ShopExpense = {
      id: generateOfflineId(),
      shop_id: shopId,
      user_id: this.userId || '',
      category: data.category,
      description: data.description,
      amount: data.amount,
      payment_method: data.payment_method || 'cash',
      expense_date: data.expense_date || now.split('T')[0],
      notes: data.notes,
      created_at: now,
      updated_at: now,
      _locallyCreated: true,
      _locallyModified: false,
      _locallyDeleted: false,
    };
    
    await offlineDB.saveExpense(expense);
    await syncQueue.add('create', 'expenses', expense.id, expense);
    
    if (this.isOnline()) {
      try {
        const { expense: serverExp } = await offlineShopService.createExpense(data);
        const updated = { ...expense, id: serverExp.id, _locallyCreated: false };
        await offlineDB.deleteExpense(expense.id);
        await offlineDB.saveExpense(updated as ShopExpense);
        return { expense: updated as ShopExpense, offline: false };
      } catch (error) {
        console.error('Failed to sync expense:', error);
      }
    }
    
    return { expense, offline: true };
  }
  
  async deleteExpense(id: string): Promise<{ offline: boolean }> {
    await this.init();
    await offlineDB.deleteExpense(id);
    await syncQueue.add('delete', 'expenses', id, { id });
    
    if (this.isOnline()) {
      try {
        await offlineShopService.deleteExpense(id);
        return { offline: false };
      } catch (error) {
        console.error('Failed to sync expense deletion:', error);
      }
    }
    
    return { offline: true };
  }
  
  // =============== LOANS ===============
  
  async getLoans(): Promise<{ loans: ShopLoan[]; fromCache: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const loans = await offlineDB.getLoans(shopId);
    
    if (this.isOnline()) {
      this.syncLoansInBackground(shopId);
    }
    
    return { loans, fromCache: true };
  }
  
  private async syncLoansInBackground(shopId: string): Promise<void> {
    try {
      const token = localStorage.getItem("autofloy_token");
      if (!token) return;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shop-loans?shop_id=${shopId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      
      for (const loan of data.loans || []) {
        const existing = await offlineDB.getLoans(shopId);
        const existingLoan = existing.find(l => l.id === loan.id);
        if (!existingLoan?._locallyModified && !existingLoan?._locallyCreated) {
          await offlineDB.saveLoan({
            ...loan,
            shop_id: shopId,
            user_id: this.userId || '',
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          } as ShopLoan);
        }
      }
    } catch (error) {
      console.error('Background sync failed for loans:', error);
    }
  }
  
  async createLoan(data: Partial<ShopLoan>): Promise<{ loan: ShopLoan; offline: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const now = new Date().toISOString();
    
    const loan: ShopLoan = {
      id: generateOfflineId(),
      shop_id: shopId,
      user_id: this.userId || '',
      customer_id: data.customer_id,
      customer_name: data.customer_name || '',
      customer_phone: data.customer_phone,
      loan_type: data.loan_type || 'given',
      principal_amount: data.principal_amount || 0,
      interest_rate: data.interest_rate || 0,
      total_amount: data.total_amount || data.principal_amount || 0,
      paid_amount: data.paid_amount || 0,
      remaining_amount: data.remaining_amount || (data.total_amount || data.principal_amount || 0),
      status: data.status || 'active',
      loan_date: data.loan_date || now.split('T')[0],
      due_date: data.due_date,
      notes: data.notes,
      created_at: now,
      updated_at: now,
      _locallyCreated: true,
      _locallyModified: false,
      _locallyDeleted: false,
    };
    
    await offlineDB.saveLoan(loan);
    await syncQueue.add('create', 'loans', loan.id, loan);
    
    return { loan, offline: true };
  }
  
  async deleteLoan(id: string): Promise<{ offline: boolean }> {
    await this.init();
    await offlineDB.deleteLoan(id);
    await syncQueue.add('delete', 'loans', id, { id });
    return { offline: true };
  }
  
  // =============== RETURNS ===============
  
  async getReturns(returnType?: 'sale' | 'purchase'): Promise<{ returns: ShopReturn[]; fromCache: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const returns = await offlineDB.getReturns(shopId, returnType);
    
    if (this.isOnline()) {
      this.syncReturnsInBackground(shopId);
    }
    
    return { returns, fromCache: true };
  }
  
  private async syncReturnsInBackground(shopId: string): Promise<void> {
    try {
      const token = localStorage.getItem("autofloy_token");
      if (!token) return;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shop-returns`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      
      for (const ret of data.returns || []) {
        const existing = await offlineDB.getReturns(shopId);
        const existingRet = existing.find(r => r.id === ret.id);
        if (!existingRet?._locallyModified && !existingRet?._locallyCreated) {
          await offlineDB.saveReturn({
            ...ret,
            shop_id: shopId,
            user_id: this.userId || '',
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          } as ShopReturn);
        }
      }
    } catch (error) {
      console.error('Background sync failed for returns:', error);
    }
  }
  
  async createReturn(data: Partial<ShopReturn>): Promise<{ return: ShopReturn; offline: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const now = new Date().toISOString();
    
    const returnItem: ShopReturn = {
      id: generateOfflineId(),
      shop_id: shopId,
      user_id: this.userId || '',
      return_type: data.return_type || 'sale',
      reference_id: data.reference_id || '',
      reference_invoice: data.reference_invoice,
      product_id: data.product_id || '',
      product_name: data.product_name || '',
      quantity: data.quantity || 0,
      unit_price: data.unit_price || 0,
      total_amount: data.total_amount || 0,
      reason: data.reason,
      notes: data.notes,
      return_date: data.return_date || now.split('T')[0],
      created_at: now,
      _locallyCreated: true,
      _locallyModified: false,
      _locallyDeleted: false,
    };
    
    await offlineDB.saveReturn(returnItem);
    await syncQueue.add('create', 'returns', returnItem.id, returnItem);
    
    return { return: returnItem, offline: true };
  }
  
  // =============== STAFF ===============
  
  async getStaff(): Promise<{ staff: ShopStaff[]; fromCache: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const staff = await offlineDB.getStaff(shopId);
    
    if (this.isOnline()) {
      this.syncStaffInBackground(shopId);
    }
    
    return { staff, fromCache: true };
  }
  
  private async syncStaffInBackground(shopId: string): Promise<void> {
    try {
      const { staff } = await offlineShopService.getStaff();
      for (const s of staff) {
        const existing = await offlineDB.getStaff(shopId);
        const existingStaff = existing.find(st => st.id === s.id);
        if (!existingStaff?._locallyModified && !existingStaff?._locallyCreated) {
          await offlineDB.saveStaff({
            ...s,
            shop_id: shopId,
            user_id: this.userId || '',
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          } as ShopStaff);
        }
      }
    } catch (error) {
      console.error('Background sync failed for staff:', error);
    }
  }
  
  async createStaff(data: Partial<ShopStaff>): Promise<{ staff: ShopStaff; offline: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const now = new Date().toISOString();
    
    const staffMember: ShopStaff = {
      id: generateOfflineId(),
      shop_id: shopId,
      user_id: this.userId || '',
      name: data.name || '',
      phone: data.phone,
      email: data.email,
      role: data.role || 'staff',
      passcode: data.passcode,
      is_active: data.is_active ?? true,
      permissions: data.permissions,
      created_at: now,
      updated_at: now,
      _locallyCreated: true,
      _locallyModified: false,
      _locallyDeleted: false,
    };
    
    await offlineDB.saveStaff(staffMember);
    await syncQueue.add('create', 'staff', staffMember.id, staffMember);
    
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.createStaff({
          name: data.name || '',
          role: data.role || 'staff',
          phone: data.phone,
          email: data.email,
          permissions: data.permissions,
        });
        const updated = { ...staffMember, id: result.staffUser?.id || staffMember.id, _locallyCreated: false };
        await offlineDB.deleteStaff(staffMember.id);
        await offlineDB.saveStaff(updated as ShopStaff);
        return { staff: updated as ShopStaff, offline: false };
      } catch (error) {
        console.error('Failed to sync staff:', error);
      }
    }
    
    return { staff: staffMember, offline: true };
  }
  
  async updateStaff(data: Partial<ShopStaff> & { id: string }): Promise<{ staff: ShopStaff; offline: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const existing = await offlineDB.getStaff(shopId);
    const staff = existing.find(s => s.id === data.id);
    
    if (!staff) throw new Error('Staff not found');
    
    const updated: ShopStaff = {
      ...staff,
      ...data,
      updated_at: new Date().toISOString(),
      _locallyModified: true,
    };
    
    await offlineDB.saveStaff(updated);
    await syncQueue.add('update', 'staff', updated.id, updated);
    
    return { staff: updated, offline: true };
  }
  
  async deleteStaff(id: string): Promise<{ offline: boolean }> {
    await this.init();
    await offlineDB.deleteStaff(id);
    await syncQueue.add('delete', 'staff', id, { id });
    return { offline: true };
  }
  
  // =============== CASH TRANSACTIONS ===============
  
  async getCashTransactions(startDate?: string, endDate?: string): Promise<{ 
    transactions: ShopCashTransaction[]; 
    balance: number; 
    cashIn: number; 
    cashOut: number;
    fromCache: boolean 
  }> {
    await this.init();
    const shopId = this.ensureShopId();
    const transactions = await offlineDB.getCashTransactions(shopId, startDate, endDate);
    
    let cashIn = 0;
    let cashOut = 0;
    
    for (const t of transactions) {
      if (t.type === 'in') {
        cashIn += t.amount;
      } else {
        cashOut += t.amount;
      }
    }
    
    const balance = cashIn - cashOut;
    
    if (this.isOnline()) {
      // Background sync
      this.syncCashTransactionsInBackground(shopId);
    }
    
    return { transactions, balance, cashIn, cashOut, fromCache: true };
  }
  
  private async syncCashTransactionsInBackground(shopId: string): Promise<void> {
    try {
      const { transactions } = await offlineShopService.getCashTransactions();
      for (const tx of transactions) {
        const allTx = await offlineDB.getCashTransactions(shopId);
        const existing = allTx.find(t => t.id === tx.id);
        if (!existing?._locallyModified && !existing?._locallyCreated) {
          await offlineDB.saveCashTransaction({
            ...tx,
            shop_id: shopId,
            user_id: this.userId || '',
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          } as ShopCashTransaction);
        }
      }
    } catch (error) {
      console.error('Background sync failed for cash transactions:', error);
    }
  }
  
  async createCashTransaction(data: {
    type: 'in' | 'out';
    source: string;
    amount: number;
    notes?: string;
  }): Promise<{ transaction: ShopCashTransaction; offline: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const now = new Date().toISOString();
    
    const transaction: ShopCashTransaction = {
      id: generateOfflineId(),
      shop_id: shopId,
      user_id: this.userId || '',
      type: data.type,
      source: data.source,
      amount: data.amount,
      notes: data.notes,
      transaction_date: now.split('T')[0],
      created_at: now,
      _locallyCreated: true,
      _locallyModified: false,
      _locallyDeleted: false,
    };
    
    await offlineDB.saveCashTransaction(transaction);
    await syncQueue.add('create', 'cashTransactions', transaction.id, transaction);
    
    if (this.isOnline()) {
      try {
        const { transaction: serverTx } = await offlineShopService.createCashTransaction(data);
        const updated = { ...transaction, id: serverTx.id, _locallyCreated: false };
        await offlineDB.deleteCashTransaction(transaction.id);
        await offlineDB.saveCashTransaction(updated as ShopCashTransaction);
        return { transaction: updated as ShopCashTransaction, offline: false };
      } catch (error) {
        console.error('Failed to sync cash transaction:', error);
      }
    }
    
    return { transaction, offline: true };
  }
  
  // =============== DAILY CASH REGISTER ===============
  
  async getCashRegisters(startDate?: string): Promise<{
    registers: ShopDailyCashRegister[];
    todayRegister: ShopDailyCashRegister | null;
    hasOpenRegister: boolean;
    fromCache: boolean;
  }> {
    await this.init();
    const shopId = this.ensureShopId();
    
    const today = new Date().toISOString().split('T')[0];
    const registers = await offlineDB.getAllDailyCashRegisters(shopId, startDate);
    const todayRegister = registers.find(r => r.register_date === today) || null;
    const openRegister = await offlineDB.getOpenCashRegister(shopId);
    
    if (this.isOnline()) {
      this.syncCashRegistersInBackground(shopId);
    }
    
    return {
      registers,
      todayRegister,
      hasOpenRegister: !!openRegister,
      fromCache: true,
    };
  }
  
  private async syncCashRegistersInBackground(shopId: string): Promise<void> {
    try {
      const result = await offlineShopService.getCashRegisters({});
      for (const register of result.registers || []) {
        const existing = await offlineDB.getDailyCashRegister(shopId, register.register_date);
        if (!existing?._locallyModified && !existing?._locallyCreated) {
          await offlineDB.saveDailyCashRegister({
            ...register,
            shop_id: shopId,
            user_id: this.userId || '',
            _locallyModified: false,
            _locallyCreated: false,
            _locallyDeleted: false,
          } as ShopDailyCashRegister);
        }
      }
    } catch (error) {
      console.error('Background sync failed for cash registers:', error);
    }
  }
  
  async openCashRegister(openingCash: number, notes?: string): Promise<{ register: ShopDailyCashRegister; offline: boolean; message: string }> {
    await this.init();
    const shopId = this.ensureShopId();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Check if already open
    const existingOpen = await offlineDB.getOpenCashRegister(shopId);
    if (existingOpen) {
      throw new Error('A cash register is already open');
    }
    
    const register: ShopDailyCashRegister = {
      id: generateOfflineId(),
      shop_id: shopId,
      user_id: this.userId || '',
      register_date: today,
      opening_cash: openingCash,
      opening_time: now.toISOString(),
      status: 'open',
      notes: notes || undefined,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      _locallyCreated: true,
      _locallyModified: false,
      _locallyDeleted: false,
    };
    
    await offlineDB.saveDailyCashRegister(register);
    await syncQueue.add('create', 'dailyCashRegister', register.id, register);
    
    // Try to sync if online
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.openCashRegister(openingCash, notes);
        const updatedRegister = { ...register, id: result.register?.id || register.id, _locallyCreated: false };
        await offlineDB.saveDailyCashRegister(updatedRegister as ShopDailyCashRegister);
        return { register: updatedRegister as ShopDailyCashRegister, offline: false, message: result.message };
      } catch (error) {
        console.error('Failed to sync open register:', error);
      }
    }
    
    return { register, offline: true, message: 'Shop opened (will sync when online)' };
  }
  
  async closeCashRegister(closingCash: number, notes?: string): Promise<{ register: ShopDailyCashRegister; offline: boolean; message: string }> {
    await this.init();
    const shopId = this.ensureShopId();
    const now = new Date();
    
    const openRegister = await offlineDB.getOpenCashRegister(shopId);
    if (!openRegister) {
      throw new Error('No open cash register found');
    }
    
    const updatedRegister: ShopDailyCashRegister = {
      ...openRegister,
      closing_cash: closingCash,
      closing_time: now.toISOString(),
      status: 'closed',
      notes: notes || openRegister.notes,
      updated_at: now.toISOString(),
      _locallyModified: true,
    };
    
    await offlineDB.saveDailyCashRegister(updatedRegister);
    await syncQueue.add('update', 'dailyCashRegister', updatedRegister.id, updatedRegister);
    
    // Try to sync if online
    if (this.isOnline()) {
      try {
        const result = await offlineShopService.closeCashRegister(closingCash, notes);
        const synced = { ...updatedRegister, _locallyModified: false };
        await offlineDB.saveDailyCashRegister(synced as ShopDailyCashRegister);
        return { register: synced as ShopDailyCashRegister, offline: false, message: result.message };
      } catch (error) {
        console.error('Failed to sync close register:', error);
      }
    }
    
    return { register: updatedRegister, offline: true, message: 'Shop closed (will sync when online)' };
  }
  
  async addQuickExpense(amount: number, description?: string): Promise<{ offline: boolean }> {
    await this.init();
    
    // Quick expenses are temporary and stored on the open register
    // For now, just call the API if online, otherwise store locally
    if (this.isOnline()) {
      try {
        await offlineShopService.addQuickExpense(amount, description);
        return { offline: false };
      } catch (error) {
        console.error('Failed to add quick expense:', error);
      }
    }
    
    // Store in local cash transactions as fallback
    await this.createCashTransaction({
      type: 'out',
      source: 'quick_expense',
      amount,
      notes: description || 'Quick expense',
    });
    
    return { offline: true };
  }
  
  async deleteQuickExpense(expenseId: string): Promise<{ offline: boolean }> {
    await this.init();
    
    if (this.isOnline()) {
      try {
        await offlineShopService.deleteQuickExpense(expenseId);
        return { offline: false };
      } catch (error) {
        console.error('Failed to delete quick expense:', error);
      }
    }
    
    return { offline: true };
  }
  
  // =============== SETTINGS ===============
  
  async getSettings(): Promise<{ settings: ShopSettings | undefined; fromCache: boolean }> {
    await this.init();
    const shopId = this.ensureShopId();
    const settings = await offlineDB.getSettings(shopId);
    
    if (this.isOnline()) {
      this.syncSettingsInBackground(shopId);
    }
    
    return { settings, fromCache: true };
  }
  
  private async syncSettingsInBackground(shopId: string): Promise<void> {
    try {
      const { settings } = await offlineShopService.getSettings();
      if (settings) {
        await offlineDB.saveSettings({
          ...settings,
          shop_id: shopId,
          user_id: this.userId || '',
        } as ShopSettings);
      }
    } catch (error) {
      console.error('Background sync failed for settings:', error);
    }
  }
  
  // =============== SYNC STATUS ===============
  
  async getPendingSyncCount(): Promise<number> {
    await this.init();
    return syncQueue.getPendingCount();
  }
  
  async getSyncSummary(): Promise<{
    total: number;
    byTable: Record<string, number>;
    byOperation: Record<string, number>;
    failedCount: number;
  }> {
    await this.init();
    return syncQueue.getSummary();
  }
  
  async getSyncMetadata(): Promise<SyncMetadata | undefined> {
    await this.init();
    const shopId = this.ensureShopId();
    return offlineDB.getSyncMetadata(shopId);
  }
  
  async updateSyncMetadata(data: Partial<SyncMetadata>): Promise<void> {
    await this.init();
    const shopId = this.ensureShopId();
    const existing = await offlineDB.getSyncMetadata(shopId);
    
    const metadata: SyncMetadata = {
      id: existing?.id || generateOfflineId(),
      shopId,
      userId: this.userId || '',
      lastSyncTimestamp: data.lastSyncTimestamp ?? existing?.lastSyncTimestamp ?? Date.now(),
      lastOnlineCheck: data.lastOnlineCheck ?? existing?.lastOnlineCheck ?? Date.now(),
      subscriptionPlan: data.subscriptionPlan ?? existing?.subscriptionPlan ?? 'free',
      subscriptionEndsAt: data.subscriptionEndsAt ?? existing?.subscriptionEndsAt ?? '',
      isSubscriptionValid: data.isSubscriptionValid ?? existing?.isSubscriptionValid ?? false,
      pendingSyncCount: data.pendingSyncCount ?? existing?.pendingSyncCount ?? 0,
    };
    
    await offlineDB.saveSyncMetadata(metadata);
  }
  
  // =============== DATA MANAGEMENT ===============
  
  async clearAllLocalData(): Promise<void> {
    await this.init();
    await offlineDB.clearAllData();
  }
  
  async clearShopLocalData(): Promise<void> {
    await this.init();
    const shopId = this.ensureShopId();
    await offlineDB.clearShopData(shopId);
  }
  
  async getLocalDataSize(): Promise<{ tables: Record<string, number>; total: number }> {
    await this.init();
    return offlineDB.getDataSize();
  }
}

// Export singleton instance
export const offlineDataService = new OfflineDataService();
