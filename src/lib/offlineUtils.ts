import { ShopProduct, ShopSale, ShopSaleItem, ShopPurchase, ShopPurchaseItem, ShopCustomer, ShopSupplier, ShopExpense } from './offlineDB';

// =============== ID GENERATION ===============

/**
 * Generate a unique ID that's safe for offline use
 * Uses timestamp + random string to ensure uniqueness
 */
export function generateOfflineId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `${prefix}${timestamp}_${randomPart}`;
}

/**
 * Generate a UUID v4 compatible ID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// =============== INVOICE NUMBER GENERATION ===============

/**
 * Generate invoice number for offline use
 * Format: PREFIX-YYYYMMDD-XXXX
 */
export function generateInvoiceNumber(prefix: string, shopId: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const shopSuffix = shopId.slice(-4).toUpperCase();
  return `${prefix}${dateStr}-${shopSuffix}${random}`;
}

/**
 * Generate sequential invoice number (for offline, stored in localStorage)
 */
export function generateSequentialInvoice(prefix: string, shopId: string): string {
  const key = `invoice_seq_${shopId}`;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  const next = current + 1;
  localStorage.setItem(key, next.toString());
  
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  return `${prefix}${year}${month}-${next.toString().padStart(5, '0')}`;
}

// =============== SALE CALCULATIONS ===============

export interface SaleTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

/**
 * Calculate sale totals from items
 */
export function calculateSaleTotals(
  items: Array<{ quantity: number; unit_price: number; discount?: number }>,
  discount: number = 0,
  discountType: 'fixed' | 'percentage' = 'fixed',
  taxRate: number = 0
): SaleTotals {
  // Calculate subtotal from items
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unit_price;
    const itemDiscount = item.discount || 0;
    return sum + (itemTotal - itemDiscount);
  }, 0);
  
  // Calculate discount
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = (subtotal * discount) / 100;
  } else {
    discountAmount = discount;
  }
  
  // Calculate after discount
  const afterDiscount = subtotal - discountAmount;
  
  // Calculate tax
  const taxAmount = (afterDiscount * taxRate) / 100;
  
  // Final total
  const total = afterDiscount + taxAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Create sale item object
 */
export function createSaleItem(
  saleId: string,
  product: ShopProduct,
  quantity: number,
  discount: number = 0
): ShopSaleItem {
  const total = (quantity * product.selling_price) - discount;
  
  return {
    id: generateUUID(),
    sale_id: saleId,
    product_id: product.id,
    product_name: product.name,
    quantity,
    unit_price: product.selling_price,
    discount,
    total: Math.round(total * 100) / 100,
    created_at: new Date().toISOString(),
  };
}

// =============== PURCHASE CALCULATIONS ===============

export interface PurchaseTotals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

/**
 * Calculate purchase totals from items
 */
export function calculatePurchaseTotals(
  items: Array<{ quantity: number; unit_price: number }>,
  discount: number = 0,
  tax: number = 0
): PurchaseTotals {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const afterDiscount = subtotal - discount;
  const total = afterDiscount + tax;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discount * 100) / 100,
    taxAmount: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Create purchase item object
 */
export function createPurchaseItem(
  purchaseId: string,
  productId: string,
  productName: string,
  quantity: number,
  unitPrice: number,
  expiryDate?: string
): ShopPurchaseItem {
  return {
    id: generateUUID(),
    purchase_id: purchaseId,
    product_id: productId,
    product_name: productName,
    quantity,
    unit_price: unitPrice,
    total: Math.round(quantity * unitPrice * 100) / 100,
    expiry_date: expiryDate,
    created_at: new Date().toISOString(),
  };
}

// =============== STOCK OPERATIONS ===============

/**
 * Update product stock quantity
 */
export function updateProductStock(product: ShopProduct, quantityChange: number): ShopProduct {
  return {
    ...product,
    stock_quantity: Math.max(0, product.stock_quantity + quantityChange),
    updated_at: new Date().toISOString(),
    _locallyModified: true,
  };
}

/**
 * Check if product is low on stock
 */
export function isLowStock(product: ShopProduct): boolean {
  const threshold = product.min_stock_alert || 10;
  return product.stock_quantity <= threshold;
}

/**
 * Check if product is out of stock
 */
export function isOutOfStock(product: ShopProduct): boolean {
  return product.stock_quantity <= 0;
}

/**
 * Check if product is expiring soon (within days)
 */
export function isExpiringSoon(product: ShopProduct, days: number = 30): boolean {
  if (!product.expiry_date) return false;
  
  const expiryDate = new Date(product.expiry_date);
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry >= 0 && daysUntilExpiry <= days;
}

/**
 * Check if product is expired
 */
export function isExpired(product: ShopProduct): boolean {
  if (!product.expiry_date) return false;
  return new Date(product.expiry_date) < new Date();
}

// =============== VALIDATION ===============

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate product data
 */
export function validateProduct(product: Partial<ShopProduct>): ValidationResult {
  const errors: string[] = [];
  
  if (!product.name || product.name.trim().length === 0) {
    errors.push('Product name is required');
  }
  
  if (product.selling_price === undefined || product.selling_price < 0) {
    errors.push('Selling price must be 0 or greater');
  }
  
  if (product.purchase_price !== undefined && product.purchase_price < 0) {
    errors.push('Purchase price must be 0 or greater');
  }
  
  if (product.stock_quantity !== undefined && product.stock_quantity < 0) {
    errors.push('Stock quantity cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate sale data
 */
export function validateSale(sale: Partial<ShopSale>): ValidationResult {
  const errors: string[] = [];
  
  if (!sale.items || sale.items.length === 0) {
    errors.push('Sale must have at least one item');
  }
  
  if (sale.total !== undefined && sale.total < 0) {
    errors.push('Total cannot be negative');
  }
  
  if (sale.paid_amount !== undefined && sale.paid_amount < 0) {
    errors.push('Paid amount cannot be negative');
  }
  
  if (sale.paid_amount !== undefined && sale.total !== undefined && sale.paid_amount > sale.total) {
    errors.push('Paid amount cannot exceed total');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate customer data
 */
export function validateCustomer(customer: Partial<ShopCustomer>): ValidationResult {
  const errors: string[] = [];
  
  if (!customer.name || customer.name.trim().length === 0) {
    errors.push('Customer name is required');
  }
  
  if (customer.phone && !/^[0-9+\-\s()]+$/.test(customer.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (customer.email && !/^[^\\s@]+@[^\\s@]+\.[^\\s@]+$/.test(customer.email)) {
    errors.push('Invalid email format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate supplier data
 */
export function validateSupplier(supplier: Partial<ShopSupplier>): ValidationResult {
  const errors: string[] = [];
  
  if (!supplier.name || supplier.name.trim().length === 0) {
    errors.push('Supplier name is required');
  }
  
  if (supplier.phone && !/^[0-9+\-\s()]+$/.test(supplier.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (supplier.email && !/^[^\\s@]+@[^\\s@]+\.[^\\s@]+$/.test(supplier.email)) {
    errors.push('Invalid email format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate expense data
 */
export function validateExpense(expense: Partial<ShopExpense>): ValidationResult {
  const errors: string[] = [];
  
  if (!expense.category || expense.category.trim().length === 0) {
    errors.push('Expense category is required');
  }
  
  if (expense.amount === undefined || expense.amount <= 0) {
    errors.push('Expense amount must be greater than 0');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// =============== DATE UTILITIES ===============

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (locale === 'bn') {
    return d.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = '৳', locale: string = 'en'): string {
  const formatted = amount.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return `${currency}${formatted}`;
}

// =============== DATA TRANSFORMATION ===============

/**
 * Prepare record for sync (remove local flags)
 */
export function prepareForSync<T extends { _locallyModified?: boolean; _locallyCreated?: boolean; _locallyDeleted?: boolean }>(
  record: T
): Omit<T, '_locallyModified' | '_locallyCreated' | '_locallyDeleted'> {
  const { _locallyModified, _locallyCreated, _locallyDeleted, ...rest } = record;
  return rest as Omit<T, '_locallyModified' | '_locallyCreated' | '_locallyDeleted'>;
}

/**
 * Merge server record with local record (server wins for most fields)
 */
export function mergeRecords<T extends { updated_at: string }>(
  localRecord: T,
  serverRecord: T
): T {
  // If server record is newer, use it completely
  if (new Date(serverRecord.updated_at) > new Date(localRecord.updated_at)) {
    return serverRecord;
  }
  
  // Otherwise keep local (it has unsaved changes)
  return localRecord;
}

// =============== STORAGE UTILITIES ===============

/**
 * Check available storage space
 */
export async function getStorageEstimate(): Promise<{ used: number; quota: number; percentUsed: number } | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? (used / quota) * 100 : 0;
    
    return {
      used,
      quota,
      percentUsed: Math.round(percentUsed * 100) / 100,
    };
  }
  return null;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
