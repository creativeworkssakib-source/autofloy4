import { authService } from "./authService";

const SUPABASE_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co";
const CURRENT_SHOP_KEY = "autofloy_current_shop_id";

class OfflineShopService {
  private getShopId(): string | null {
    return localStorage.getItem(CURRENT_SHOP_KEY);
  }

  private async request<T>(
    resource: string,
    options: RequestInit = {},
    queryParams?: Record<string, string>
  ): Promise<T> {
    const token = authService.getToken();
    if (!token) {
      throw new Error("Unauthorized");
    }

    const shopId = this.getShopId();
    
    let url = `${SUPABASE_URL}/functions/v1/offline-shop/${resource}`;
    const allParams = { ...queryParams };
    if (shopId) {
      allParams.shop_id = shopId;
    }
    if (Object.keys(allParams).length > 0) {
      const params = new URLSearchParams(allParams);
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(shopId && { "X-Shop-Id": shopId }),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  // Dashboard
  async getDashboard(range: "today" | "week" | "month" = "today") {
    return this.request<any>("dashboard", {}, { range });
  }

  // Growth Insights
  async getGrowthInsights() {
    return this.request<any>("growth-insights");
  }

  // Products
  async getProducts() {
    return this.request<{ products: any[] }>("products");
  }

  async createProduct(product: any) {
    return this.request<{ product: any }>("products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  }

  async updateProduct(product: any) {
    return this.request<{ product: any }>("products", {
      method: "PUT",
      body: JSON.stringify(product),
    });
  }

  async deleteProducts(ids: string[]) {
    return this.request<{ message: string; deleted?: string[]; failed?: Array<{ id: string; error: string }> }>(
      "products",
      {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      }
    );
  }

  async deleteProduct(id: string) {
    return this.deleteProducts([id]);
  }

  // Categories
  async getCategories() {
    return this.request<{ categories: any[] }>("categories");
  }

  async createCategory(category: { name: string; description?: string }) {
    return this.request<{ category: any }>("categories", {
      method: "POST",
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string) {
    return this.request<{ message: string }>("categories", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  }

  // Customers
  async getCustomers() {
    return this.request<{ customers: any[] }>("customers");
  }

  async getCustomer(id: string) {
    return this.request<{ customer: any; sales: any[] }>("customers", {}, { id });
  }

  async createCustomer(customer: any) {
    return this.request<{ customer: any }>("customers", {
      method: "POST",
      body: JSON.stringify(customer),
    });
  }

  async updateCustomer(customer: any) {
    return this.request<{ customer: any }>("customers", {
      method: "PUT",
      body: JSON.stringify(customer),
    });
  }

  async deleteCustomers(ids: string[]) {
    return this.request<{ message: string; deleted?: string[]; failed?: Array<{ id: string; error: string }> }>(
      "customers",
      {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      }
    );
  }

  async deleteCustomer(id: string) {
    return this.deleteCustomers([id]);
  }

  // Suppliers
  async getSuppliers() {
    return this.request<{ suppliers: any[] }>("suppliers");
  }

  async getSupplier(id: string) {
    return this.request<{ supplier: any; purchases: any[] }>("suppliers", {}, { id });
  }

  // Get all pending stock items (purchase items without product_id) efficiently
  async getPendingStockItems() {
    return this.request<{ items: any[] }>("pending-stock-items");
  }

  async getSupplierProfile(id: string) {
    return this.request<{ 
      supplier: any; 
      purchases: any[]; 
      payments: any[];
      ledger: any[];
      productSummary: any[];
      summary: {
        totalPurchases: number;
        totalPurchaseAmount: number;
        totalPaid: number;
        totalDue: number;
        lastPurchaseDate: string | null;
        lastPaymentDate: string | null;
      };
    }>("suppliers", {}, { id, profile: "true" });
  }

  async createSupplier(supplier: any) {
    return this.request<{ supplier: any }>("suppliers", {
      method: "POST",
      body: JSON.stringify(supplier),
    });
  }

  async updateSupplier(supplier: any) {
    return this.request<{ supplier: any }>("suppliers", {
      method: "PUT",
      body: JSON.stringify(supplier),
    });
  }

  async deleteSuppliers(ids: string[]) {
    return this.request<{ message: string; deleted?: string[]; failed?: Array<{ id: string; error: string }> }>(
      "suppliers",
      {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      }
    );
  }

  async deleteSupplier(id: string) {
    return this.deleteSuppliers([id]);
  }

  // Supplier Payments
  async getSupplierPayments(supplierId?: string) {
    const params: Record<string, string> = {};
    if (supplierId) params.supplierId = supplierId;
    return this.request<{ payments: any[] }>("supplier-payments", {}, params);
  }

  async addSupplierPayment(data: {
    supplier_id: string;
    amount: number;
    payment_method?: string;
    notes?: string;
    purchase_id?: string;
  }) {
    return this.request<{ payment: any; new_due: number }>("supplier-payments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Sales
  async deleteSales(ids: string[]) {
    return this.request<{ message: string; deleted?: string[]; failed?: Array<{ id: string; error: string }> }>(
      "sales",
      {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      }
    );
  }

  async deleteSale(id: string) {
    return this.deleteSales([id]);
  }
  async getSales(params?: { startDate?: string; endDate?: string; customerId?: string; paymentStatus?: string }) {
    const queryParams: Record<string, string> = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.customerId) queryParams.customerId = params.customerId;
    if (params?.paymentStatus) queryParams.paymentStatus = params.paymentStatus;
    return this.request<{ sales: any[] }>("sales", {}, queryParams);
  }

  async createSale(sale: {
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
    tax?: number;
    paid_amount?: number;
    payment_method?: string;
    notes?: string;
  }) {
    return this.request<{ sale: any; invoice_number: string }>("sales", {
      method: "POST",
      body: JSON.stringify(sale),
    });
  }

  async updateSale(id: string, updates: {
    paid_amount?: number;
    due_amount?: number;
    payment_status?: string;
    notes?: string;
  }) {
    return this.request<{ sale: any }>("sales", {
      method: "PUT",
      body: JSON.stringify({ id, ...updates }),
    });
  }

  // Purchases
  async getPurchases() {
    return this.request<{ purchases: any[] }>("purchases");
  }

  async createPurchase(purchase: {
    supplier_id?: string;
    supplier_name?: string;
    supplier_contact?: string;
    invoice_number?: string;
    items: Array<{
      product_id?: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      total: number;
      expiry_date?: string;
    }>;
    paid_amount?: number;
    payment_method?: string;
    notes?: string;
  }) {
    return this.request<{ purchase: any }>("purchases", {
      method: "POST",
      body: JSON.stringify(purchase),
    });
  }

  async deletePurchase(id: string) {
    return this.request<{ message: string }>("purchases", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  }

  async addPurchasePayment(purchaseId: string, amount: number, paymentMethod?: string, notes?: string) {
    return this.request<{ 
      payment: any; 
      new_paid_amount: number; 
      new_due_amount: number; 
      payment_status: string;
    }>("purchases", {
      method: "PATCH",
      body: JSON.stringify({ 
        id: purchaseId, 
        amount, 
        payment_method: paymentMethod, 
        notes 
      }),
    });
  }

  async getPurchasePayments(purchaseId: string) {
    return this.request<{ payments: any[] }>("purchase-payments", {}, { purchaseId });
  }

  // Trash bin
  async getTrash(table?: string) {
    const params: Record<string, string> = {};
    if (table) params.table = table;
    return this.request<{ trash: any[] }>("trash", {}, params);
  }

  async restoreFromTrash(id: string) {
    return this.request<{ message: string }>("trash", {
      method: "POST",
      body: JSON.stringify({ id, action: "restore" }),
    });
  }

  async permanentDelete(id: string) {
    return this.request<{ message: string }>("trash", {
      method: "POST",
      body: JSON.stringify({ id, action: "permanent_delete" }),
    });
  }

  async emptyTrash() {
    return this.request<{ message: string }>("trash", {
      method: "DELETE",
    });
  }

  // Expenses
  async getExpenses(params?: { startDate?: string; endDate?: string; category?: string }) {
    const queryParams: Record<string, string> = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.category) queryParams.category = params.category;
    return this.request<{ expenses: any[] }>("expenses", {}, queryParams);
  }

  async createExpense(expense: {
    category: string;
    description?: string;
    amount: number;
    expense_date?: string;
    payment_method?: string;
    notes?: string;
  }) {
    return this.request<{ expense: any }>("expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    });
  }

  async updateExpense(expense: any) {
    return this.request<{ expense: any }>("expenses", {
      method: "PUT",
      body: JSON.stringify(expense),
    });
  }

  async deleteExpense(id: string) {
    return this.request<{ message: string }>("expenses", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  }

  // Stock Adjustments
  async getAdjustments(params?: { productId?: string; type?: string; startDate?: string; endDate?: string }) {
    const queryParams: Record<string, string> = {};
    if (params?.productId) queryParams.productId = params.productId;
    if (params?.type) queryParams.type = params.type;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    return this.request<{ adjustments: any[] }>("adjustments", {}, queryParams);
  }

  async createAdjustment(adjustment: {
    product_id: string;
    product_name: string;
    type: string;
    quantity: number;
    adjustment_date?: string;
    reason?: string;
    notes?: string;
  }) {
    return this.request<{ adjustment: any }>("adjustments", {
      method: "POST",
      body: JSON.stringify(adjustment),
    });
  }

  async deleteAdjustments(ids: string[]) {
    return this.request<{ deleted: string[] }>("adjustments", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  }

  async deleteAdjustment(id: string) {
    return this.deleteAdjustments([id]);
  }

  // Cash Transactions
  async getCashTransactions(params?: { startDate?: string; endDate?: string; source?: string }) {
    const queryParams: Record<string, string> = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.source) queryParams.source = params.source;
    return this.request<{ transactions: any[]; balance: number; cashIn: number; cashOut: number }>("cash", {}, queryParams);
  }

  async createCashTransaction(transaction: {
    type: "in" | "out";
    source: string;
    amount: number;
    notes?: string;
  }) {
    return this.request<{ transaction: any }>("cash", {
      method: "POST",
      body: JSON.stringify(transaction),
    });
  }

  // Staff Users
  async getStaff() {
    return this.request<{ staff: any[] }>("staff");
  }

  async createStaff(staff: {
    name: string;
    email?: string;
    phone?: string;
    role: string;
    permissions?: Record<string, boolean>;
  }) {
    return this.request<{ staffUser: any }>("staff", {
      method: "POST",
      body: JSON.stringify(staff),
    });
  }

  async updateStaff(staff: any) {
    return this.request<{ staffUser: any }>("staff", {
      method: "PUT",
      body: JSON.stringify(staff),
    });
  }

  async deleteStaff(id: string) {
    return this.request<{ message: string }>("staff", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  }

  // Reports
  async getReport(type: "sales" | "purchases" | "expenses" | "inventory" | "customers" | "products", startDate?: string, endDate?: string) {
    const params: Record<string, string> = { type };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return this.request<any>("reports", {}, params);
  }

  // Stock Batches
  async getStockBatches(productId?: string) {
    const params: Record<string, string> = {};
    if (productId) params.product_id = productId;
    return this.request<{ batches: any[] }>("stock-batches", {}, params);
  }

  async addStockBatch(data: {
    product_id: string;
    product_name?: string;
    quantity: number;
    unit_cost: number;
    expiry_date?: string;
    notes?: string;
  }) {
    return this.request<{ batch: any; new_stock: number; new_average_cost: number }>(
      "stock-batches",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async migrateExistingProductsToBatches() {
    return this.request<{ migrated: number; skipped: number; total: number }>(
      "migrate-batches",
      { method: "POST" }
    );
  }

  // Shop Settings
  async getSettings() {
    return this.request<{ settings: any & { has_trash_passcode?: boolean } }>("settings");
  }

  async saveSettings(settings: any) {
    return this.request<{ settings: any }>("settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  }

  // Trash Passcode
  async setTrashPasscode(passcode: string) {
    return this.request<{ success: boolean; message: string }>("trash-passcode", {
      method: "POST",
      body: JSON.stringify({ passcode }),
    });
  }

  async verifyTrashPasscode(passcode: string) {
    return this.request<{ valid: boolean }>("trash-passcode", {
      method: "PUT",
      body: JSON.stringify({ passcode }),
    });
  }

  // Permanent delete with passcode
  async permanentDeleteManyWithPasscode(ids: string[], passcode?: string) {
    return this.request<{ message: string; deletedCount?: number; deletedIds?: string[] }>("trash", {
      method: "POST",
      body: JSON.stringify({ ids, action: "permanent_delete", passcode }),
    });
  }

  async permanentDeleteWithPasscode(id: string, passcode?: string) {
    return this.permanentDeleteManyWithPasscode([id], passcode);
  }

  // Import Products
  async importProducts(products: any[]) {
    return this.request<{ results: { success: number; failed: number; errors: string[] } }>(
      "import-products",
      {
        method: "POST",
        body: JSON.stringify({ products }),
      }
    );
  }

  // Import Purchases
  async importPurchases(purchases: any[]) {
    return this.request<{ results: { success: number; failed: number; errors: string[] } }>(
      "import-purchases",
      {
        method: "POST",
        body: JSON.stringify({ purchases }),
      }
    );
  }

  // Due Collection
  async collectDue(customerId: string, amount: number, notes?: string) {
    return this.request<{ transaction: any }>("due-collection", {
      method: "POST",
      body: JSON.stringify({ customer_id: customerId, amount, notes }),
    });
  }

  // Due Payment (to supplier)
  async payDue(supplierId: string, amount: number, notes?: string) {
    return this.request<{ transaction: any }>("due-payment", {
      method: "POST",
      body: JSON.stringify({ supplier_id: supplierId, amount, notes }),
    });
  }

  // Returns
  async processReturn(returnData: {
    sale_id: string;
    items: Array<{
      product_id: string;
      quantity: number;
    }>;
    refund_amount?: number;
    refund_method?: string;
    reason?: string;
    notes?: string;
  }) {
    return this.request<{
      success: boolean;
      return_invoice: string;
      refund_amount: number;
      returned_items: Array<{ product_name: string; quantity: number; refund: number }>;
      original_sale: string;
    }>("returns", {
      method: "POST",
      body: JSON.stringify(returnData),
    });
  }

  async getReturns() {
    return this.request<{ returns: any[] }>("returns");
  }

  // Send Due Reminder SMS
  async sendDueReminderSms(customers: Array<{
    customerName: string;
    customerPhone: string;
    dueAmount: number;
    salesDetails?: string;
  }>) {
    const token = authService.getToken();
    if (!token) {
      throw new Error("Unauthorized");
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-due-reminder-sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ customers }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send SMS");
    }

    return data as {
      success: boolean;
      message: string;
      results: Array<{ phone: string; success: boolean; message: string }>;
      totalSent: number;
      totalFailed: number;
    };
  }

  // Send Followup SMS
  async sendFollowupSms(customers: Array<{
    customerName: string;
    customerPhone: string;
    message: string;
    purchasedProducts?: string;
    totalPurchases?: number;
    lastPurchaseDate?: string;
  }>) {
    const token = authService.getToken();
    if (!token) {
      throw new Error("Unauthorized");
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-followup-sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ customers }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send SMS");
    }

    return data as {
      success: boolean;
      message: string;
      results: Array<{ phone: string; success: boolean; message: string }>;
      totalSent: number;
      totalFailed: number;
    };
  }

  // Product History
  async getProductHistory(from?: string, to?: string) {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return this.request<{ history: any[]; summary: any[] }>("product-history", {}, params);
  }

  async clearProductHistory() {
    return this.request<{ message: string }>("product-history", { method: "DELETE" });
  }

  // Generate barcodes for products without barcode
  async generateBarcodes() {
    return this.request<{ message: string; generated: number; total?: number }>(
      "generate-barcodes",
      { method: "POST" }
    );
  }

  // Scanner Logs
  async getScannerLogs(limit?: number, productId?: string) {
    const params: Record<string, string> = {};
    if (limit) params.limit = String(limit);
    if (productId) params.product_id = productId;
    return this.request<{
      logs: Array<{
        id: string;
        barcode: string;
        product_id: string | null;
        product_name: string | null;
        scan_type: string;
        is_matched: boolean;
        scan_speed: number | null;
        created_at: string;
      }>;
      stats: {
        totalScans: number;
        matchedScans: number;
        unmatchedScans: number;
        avgSpeed: number;
        matchRate: number;
      };
    }>("scanner-logs", {}, params);
  }

  async logScan(data: {
    barcode: string;
    product_id?: string;
    product_name?: string;
    scan_type?: string;
    is_matched?: boolean;
    scan_speed?: number;
  }) {
    return this.request<{ log: any }>("scanner-logs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async clearScannerLogs() {
    return this.request<{ message: string }>("scanner-logs", { method: "DELETE" });
  }

  // Scanner Devices
  async getScannerDevices() {
    return this.request<{ devices: ScannerDevice[] }>("scanner-devices");
  }

  async registerScannerDevice(data: {
    device_name: string;
    device_type?: string;
    vendor_id?: string;
    product_id?: string;
    settings?: Record<string, any>;
  }) {
    return this.request<{ device: ScannerDevice; isNew: boolean }>("scanner-devices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateScannerDevice(deviceId: string, data: {
    device_name?: string;
    is_active?: boolean;
    settings?: Record<string, any>;
    last_connected_at?: string;
    total_scans?: number;
    avg_scan_speed?: number;
  }) {
    return this.request<{ device: ScannerDevice }>("scanner-devices", {
      method: "PUT",
      body: JSON.stringify({ id: deviceId, ...data }),
    });
  }

  async deleteScannerDevice(deviceId: string) {
    return this.request<{ message: string }>("scanner-devices", { method: "DELETE" }, { device_id: deviceId });
  }

  async disconnectScannerDevice(deviceId: string) {
    return this.updateScannerDevice(deviceId, { is_active: false });
  }

  // Search product by barcode
  async getProductByBarcode(barcode: string): Promise<{ product: any | null }> {
    const { products } = await this.getProducts();
    const product = products.find((p: any) => p.barcode === barcode);
    return { product: product || null };
  }
}

// Scanner Device interface
export interface ScannerDevice {
  id: string;
  user_id: string;
  shop_id: string | null;
  device_name: string;
  device_type: string;
  vendor_id: string | null;
  product_id: string | null;
  is_active: boolean;
  last_connected_at: string | null;
  total_scans: number;
  avg_scan_speed: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const offlineShopService = new OfflineShopService();
