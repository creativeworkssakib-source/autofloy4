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
      purchase: any;
    }>("purchases/payment", {
      method: "POST",
      body: JSON.stringify({ purchaseId, amount, paymentMethod, notes }),
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
    amount: number;
    description?: string;
    expense_date?: string;
  }) {
    return this.request<{ expense: any }>("expenses", {
      method: "POST",
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
  async getStockAdjustments(filterType?: string) {
    const params: Record<string, string> = {};
    if (filterType && filterType !== "all") params.type = filterType;
    return this.request<{ adjustments: any[] }>("stock-adjustments", {}, params);
  }

  async createStockAdjustment(data: {
    product_id: string;
    adjustment_type: string;
    quantity: number;
    reason?: string;
    notes?: string;
  }) {
    return this.request<{ adjustment: any }>("stock-adjustments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteStockAdjustments(ids: string[]) {
    return this.request<{ message: string; deleted?: string[]; failed?: Array<{ id: string; error: string }> }>(
      "stock-adjustments",
      {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      }
    );
  }

  // Cash Transactions
  async getCashTransactions(params?: { startDate?: string; endDate?: string; type?: string }) {
    const queryParams: Record<string, string> = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.type) queryParams.type = params.type;
    return this.request<{ transactions: any[]; summary: any }>("cash", {}, queryParams);
  }

  async createCashTransaction(data: {
    type: string;
    source: string;
    amount: number;
    notes?: string;
    transaction_date?: string;
  }) {
    return this.request<{ transaction: any }>("cash", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Staff
  async getStaffUsers() {
    return this.request<{ staffs: any[] }>("staff");
  }

  async createStaffUser(data: any) {
    return this.request<{ staff: any }>("staff", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateStaffUser(data: any) {
    return this.request<{ staff: any }>("staff", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteStaffUser(id: string) {
    return this.request<{ message: string }>("staff", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  }

  // Reports
  async getReports(type: string, params?: { startDate?: string; endDate?: string }) {
    const queryParams: Record<string, string> = { type };
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    return this.request<any>("reports", {}, queryParams);
  }

  // Stock Batches
  async getStockBatches(productId: string) {
    return this.request<{ batches: any[] }>("stock-batches", {}, { productId });
  }

  async deleteStockBatch(batchId: string) {
    return this.request<{ message: string }>("stock-batches", {
      method: "DELETE",
      body: JSON.stringify({ batchId }),
    });
  }

  async updateStockBatch(batchId: string, updates: { quantity?: number; expiry_date?: string }) {
    return this.request<{ batch: any }>("stock-batches", {
      method: "PUT",
      body: JSON.stringify({ batchId, ...updates }),
    });
  }

  // Settings
  async getSettings() {
    return this.request<any>("settings");
  }

  async updateSettings(settings: any) {
    return this.request<any>("settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  // Trash
  async getTrash() {
    return this.request<{ trash?: any[]; items?: any[] }>("trash");
  }

  async restoreFromTrash(id: string, type: string) {
    return this.request<{ message: string }>("trash", {
      method: "PUT",
      body: JSON.stringify({ id, type, action: "restore" }),
    });
  }

  async permanentDelete(id: string, type: string) {
    return this.request<{ message: string }>("trash", {
      method: "DELETE",
      body: JSON.stringify({ id, type }),
    });
  }

  async emptyTrash() {
    return this.request<{ message: string }>("trash", {
      method: "DELETE",
      body: JSON.stringify({ action: "empty" }),
    });
  }

  // SMS Features
  async sendDueReminderSms(params: { saleId: string; customerId: string; dueAmount: number; customerPhone: string }) {
    return this.request<{ success: boolean; message: string }>("sms/due-reminder", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async sendFollowupSms(params: { customerId: string; customerPhone: string; customerName: string; message: string }) {
    return this.request<{ success: boolean; message: string }>("sms/followup", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // Product History
  async getProductHistory(productId: string) {
    return this.request<{ history: any[] }>("products/history", {}, { productId });
  }

  // Barcode
  async generateBarcode(productId: string) {
    return this.request<{ barcode: string; product: any }>("products/barcode", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
  }

  // Scanner Logs
  async logScannerEvent(data: { event_type: string; device_info?: any; error_message?: string }) {
    return this.request<{ log: any }>("scanner/logs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getScannerLogs() {
    return this.request<{ logs: any[] }>("scanner/logs");
  }

  // Scanner Devices
  async getScannerDevices() {
    return this.request<{ devices: ScannerDevice[] }>("scanner/devices");
  }

  async saveScannerDevice(device: Partial<ScannerDevice>) {
    return this.request<{ device: ScannerDevice }>("scanner/devices", {
      method: "POST",
      body: JSON.stringify(device),
    });
  }

  async updateScannerDevice(device: Partial<ScannerDevice>) {
    return this.request<{ device: ScannerDevice }>("scanner/devices", {
      method: "PUT",
      body: JSON.stringify(device),
    });
  }

  async deleteScannerDevice(deviceId: string) {
    return this.request<{ message: string }>("scanner/devices", {
      method: "DELETE",
      body: JSON.stringify({ deviceId }),
    });
  }

  // Daily Cash Register
  async getCashRegister(date?: string) {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    return this.request<{ registers: any[]; todayRegister: any; hasOpenRegister: boolean }>("cash-register", {}, params);
  }

  async openCashRegister(openingBalance: number) {
    return this.request<{ register: any; message: string; suggestedOpening: number }>("cash-register", {
      method: "POST",
      body: JSON.stringify({ action: "open", opening_cash: openingBalance }),
    });
  }

  async closeCashRegister(closingBalance: number, notes?: string) {
    return this.request<{ register: any }>("cash-register", {
      method: "POST",
      body: JSON.stringify({ action: "close", closing_cash: closingBalance, notes }),
    });
  }

  async addQuickExpense(data: { amount: number; description: string; category?: string }) {
    return this.request<{ expense: any }>("quick-expenses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteQuickExpense(expenseId: string) {
    return this.request<{ message: string }>("quick-expenses", {
      method: "DELETE",
    }, { expense_id: expenseId });
  }

  async getQuickExpenses() {
    return this.request<{ expenses: any[]; total: number }>("quick-expenses", {});
  }

  // Cash Flow Breakdown
  async getCashFlowBreakdown(type: 'cash_in' | 'due_collected' | 'cash_out', date?: string) {
    const params: Record<string, string> = { type };
    if (date) params.date = date;
    return this.request<any>("cash-flow-breakdown", {}, params);
  }

  // Returns
  async getReturns(returnType?: 'sale' | 'purchase') {
    const params: Record<string, string> = {};
    if (returnType) params.type = returnType;
    return this.request<{ returns: any[] }>("returns", {}, params);
  }

  async processReturn(data: any) {
    return this.request<{ return: any }>("returns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteReturn(id: string) {
    return this.request<{ message: string }>("returns", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  }

  // Loans
  async getLoans(statusFilter?: string) {
    const params: Record<string, string> = {};
    if (statusFilter && statusFilter !== "all") params.status = statusFilter;
    return this.request<{ loans: any[]; stats: any }>("loans", {}, params);
  }

  async createLoan(data: any) {
    return this.request<{ loan: any }>("loans", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteLoan(id: string) {
    return this.request<{ message: string }>("loans", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  }

  async addLoanPayment(loanId: string, paymentData: any) {
    return this.request<{ payment: any; loan: any }>("loans/payment", {
      method: "POST",
      body: JSON.stringify({ loanId, ...paymentData }),
    });
  }
}

export interface ScannerDevice {
  id: string;
  name: string;
  device_name?: string;
  device_id: string;
  device_type: string;
  is_default: boolean;
  is_active: boolean;
  settings?: Record<string, any>;
  total_scans?: number;
  avg_scan_speed?: number;
  last_connected_at?: string;
  created_at: string;
  updated_at: string;
}

export const offlineShopService = new OfflineShopService();
