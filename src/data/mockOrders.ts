export interface Order {
  id: string;
  customerName: string;
  productName: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'COD' | 'Card' | 'Bank Transfer';
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Delivered';
  dateTime: string;
}

export interface DailyStats {
  date: string;
  sales: number;
  orders: number;
}

// Empty data - will be replaced with API data
export const mockOrders: Order[] = [];
export const mockDailyStats: DailyStats[] = [];
export const mockSummaryStats = {
  todaysSales: 0,
  todaysOrders: 0,
  confirmedOrders: 0,
  pendingOrders: 0,
  totalRevenue: 0,
  totalOrders: 0,
};
