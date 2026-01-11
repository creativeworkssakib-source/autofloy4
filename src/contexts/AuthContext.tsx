import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService, User as ServiceUser } from "@/services/authService";

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified?: boolean;
  subscriptionPlan: string;
  trialEndDate?: string;
  isTrialActive?: boolean;
  subscriptionStartedAt?: string;
  subscriptionEndsAt?: string;
  avatarUrl?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = "autofloy_current_user";

// Convert service user to context user format
const mapServiceUser = (serviceUser: ServiceUser): User => ({
  id: serviceUser.id,
  email: serviceUser.email,
  name: serviceUser.display_name || serviceUser.email.split('@')[0],
  phone: serviceUser.phone || undefined,
  emailVerified: serviceUser.email_verified,
  phoneVerified: serviceUser.phone_verified,
  subscriptionPlan: serviceUser.subscription_plan,
  trialEndDate: serviceUser.trial_end_date || undefined,
  isTrialActive: serviceUser.is_trial_active,
  subscriptionStartedAt: serviceUser.subscription_started_at || undefined,
  subscriptionEndsAt: serviceUser.subscription_ends_at || undefined,
  avatarUrl: serviceUser.avatar_url || undefined,
  createdAt: new Date().toISOString(),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    if (authService.isAuthenticated()) {
      try {
        const { user: serviceUser } = await authService.refreshUser();
        const mappedUser = mapServiceUser(serviceUser);
        setUser(mappedUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
      } catch {
        authService.logout();
        setUser(null);
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    }
  };

  useEffect(() => {
    // Check for existing session via token
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const { user: serviceUser } = await authService.refreshUser();
          const mappedUser = mapServiceUser(serviceUser);
          setUser(mappedUser);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
        } catch (error) {
          // Token invalid or user not found, clear auth state
          console.log("Auth init failed, clearing session:", error);
          authService.logout();
          setUser(null);
          localStorage.removeItem(CURRENT_USER_KEY);
        }
      } else {
        setUser(null);
        localStorage.removeItem(CURRENT_USER_KEY);
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user: serviceUser } = await authService.login(email, password);
      const mappedUser = mapServiceUser(serviceUser);
      setUser(mappedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Login failed" };
    }
  };

  const signup = async (data: { name: string; email: string; phone: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user: serviceUser } = await authService.signup(
        data.email,
        data.password,
        data.phone,
        data.name
      );
      const mappedUser = mapServiceUser(serviceUser);
      setUser(mappedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Signup failed" };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
