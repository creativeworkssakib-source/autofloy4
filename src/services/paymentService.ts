const SUPABASE_URL = "https://xvwsqxfydvagfhfkwxdm.supabase.co";

function getAuthHeaders() {
  const token = localStorage.getItem("autofloy_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export interface PaymentRequest {
  planId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  screenshotUrl?: string;
}

export interface UserPaymentHistory {
  id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string | null;
  screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
}

export async function submitPaymentRequest(data: PaymentRequest): Promise<{ success: boolean; requestId: string }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/payment-requests`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      plan_id: data.planId,
      amount: data.amount,
      payment_method: data.paymentMethod,
      transaction_id: data.transactionId,
      screenshot_url: data.screenshotUrl || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to submit payment request" }));
    throw new Error(error.error || "Failed to submit payment request");
  }

  return response.json();
}

export async function fetchUserPaymentHistory(): Promise<{ payments: UserPaymentHistory[] }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/payment-requests/my-history`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch payment history" }));
    throw new Error(error.error || "Failed to fetch payment history");
  }

  return response.json();
}
