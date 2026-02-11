import { WORKER_API_URL } from "@/config/api";

export interface User {
  id: string;
  email: string;
  phone: string | null;
  display_name: string | null;
  avatar_url: string | null;
  subscription_plan: string;
  subscription_type: 'online' | 'offline' | 'both'; // What type of subscription they bought
  trial_end_date: string | null;
  is_trial_active: boolean;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  email_verified: boolean;
  phone_verified?: boolean;
  is_active?: boolean;
  is_suspended?: boolean;
  remaining_trial_days?: number | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("autofloy_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(
      `${WORKER_API_URL}/${endpoint}`,
      {
        ...options,
        headers,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  async signup(
    email: string,
    password: string,
    phone?: string,
    display_name?: string
  ): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>("auth-signup", {
      method: "POST",
      body: JSON.stringify({ email, password, phone, display_name }),
    });

    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>("auth-login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    this.setToken(data.token);
    return data;
  }

  async requestEmailOtp(): Promise<{ message: string }> {
    return this.request("auth-request-email-otp", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async verifyEmailOtp(otp: string): Promise<{ message: string }> {
    return this.request("auth-verify-email-otp", {
      method: "POST",
      body: JSON.stringify({ otp }),
    });
  }

  async requestPhoneOtp(): Promise<{ message: string }> {
    return this.request("auth-request-phone-otp", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async verifyPhoneOtp(otp: string): Promise<{ message: string }> {
    return this.request("auth-verify-phone-otp", {
      method: "POST",
      body: JSON.stringify({ otp }),
    });
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.request("auth-request-password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, otp: string, new_password: string): Promise<{ message: string }> {
    return this.request("auth-reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, new_password }),
    });
  }

  async refreshUser(): Promise<{ user: User; token?: string }> {
    const data = await this.request<{ user: User; token?: string }>("auth-refresh-user", {
      method: "POST",
      body: JSON.stringify({}),
    });
    
    // Store the new token if returned
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request("me-change-password", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  }

  async requestDeletionOtp(): Promise<{ message: string; email: string }> {
    return this.request("auth-request-deletion-otp", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async confirmDeletion(otp: string): Promise<{ message: string; success: boolean }> {
    return this.request("auth-confirm-deletion", {
      method: "POST",
      body: JSON.stringify({ otp }),
    });
  }

  async deleteAccount(): Promise<{ message: string }> {
    return this.request("me", {
      method: "DELETE",
    });
  }

  async updateProfile(data: { display_name?: string; phone?: string }): Promise<{ user: User }> {
    return this.request("me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  private setToken(token: string) {
    this.token = token;
    localStorage.setItem("autofloy_token", token);
  }

  logout() {
    this.token = null;
    localStorage.removeItem("autofloy_token");
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Google OAuth methods
  async getGoogleAuthUrl(redirectUri: string): Promise<{ auth_url: string; state: string }> {
    return this.request("auth-google", {
      method: "POST",
      body: JSON.stringify({ action: "get_auth_url", redirect_uri: redirectUri }),
    });
  }

  async handleGoogleCallback(code: string, redirectUri: string): Promise<AuthResponse & { is_new_user: boolean }> {
    const data = await this.request<AuthResponse & { is_new_user: boolean }>("auth-google", {
      method: "POST",
      body: JSON.stringify({ action: "callback", code, redirect_uri: redirectUri }),
    });

    this.setToken(data.token);
    return data;
  }
}

export const authService = new AuthService();

// Reviews API
export async function getReviews(): Promise<{ reviews: any[] }> {
  const response = await fetch(`${WORKER_API_URL}/reviews`);
  return response.json();
}

export async function createReview(
  rating: number,
  comment: string
): Promise<{ review: any }> {
  const token = authService.getToken();
  const response = await fetch(`${WORKER_API_URL}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rating, comment }),
  });
  return response.json();
}

// Notifications API
export async function getNotifications(): Promise<{ notifications: any[] }> {
  const token = authService.getToken();
  const response = await fetch(`${WORKER_API_URL}/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function markNotificationRead(
  notificationId?: string,
  markAll?: boolean
): Promise<{ message: string }> {
  const token = authService.getToken();
  const response = await fetch(`${WORKER_API_URL}/notifications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      notification_id: notificationId,
      markAll,
    }),
  });
  return response.json();
}

// Like review
export async function likeReview(reviewId: string, unlike: boolean = false): Promise<{ success: boolean; likes_count: number }> {
  const token = authService.getToken();
  const response = await fetch(`${WORKER_API_URL}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: "like",
      reviewId,
      unlike,
    }),
  });
  return response.json();
}
