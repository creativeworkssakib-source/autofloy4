// =============== ID GENERATION ===============

/**
 * Generate a unique ID that's safe for offline use
 * Uses timestamp + random string to ensure uniqueness
 */
export function generateOfflineId(prefix: string = ''): string {
  // Generate a proper UUID v4 that's compatible with the database
  // Prefix is optional and can be used for debugging purposes in logs
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  return uuid;
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

// =============== VALIDATION ===============

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
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
