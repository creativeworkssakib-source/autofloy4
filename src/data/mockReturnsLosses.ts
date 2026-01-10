export interface ReturnItem {
  id: string;
  orderId: string;
  productName: string;
  reason: string;
  refundAmount: number;
  date: string;
}

export interface LossItem {
  id: string;
  productName: string;
  reason: 'Damaged' | 'Lost' | 'Broken';
  productCost: number;
  date: string;
  notes?: string;
}

// Empty data - will be replaced with API data
export const mockReturns: ReturnItem[] = [];
export const mockLosses: LossItem[] = [];

export const getReturnsSummary = () => ({
  totalReturns: 0,
  totalRefundValue: 0,
});

export const getLossesSummary = () => ({
  totalLosses: 0,
  totalLossValue: 0,
  damagedCount: 0,
  lostCount: 0,
  brokenCount: 0,
});
