import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
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
  loginWithGoogle: () => Promise<void>;
  handleGoogleCallback: (code: string) => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>;
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
  
  // Use ref to prevent multiple initializations
  const isInitializedRef = useRef(false);

  const refreshUser = async () => {
    if (authService.isAuthenticated()) {
      try {
        const { user: serviceUser } = await authService.refreshUser();
        const mappedUser = mapServiceUser(serviceUser);
        setUser(mappedUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
        localStorage.setItem('autofloy_user_id', mappedUser.id);
      } catch {
        authService.logout();
        setUser(null);
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    }
  };

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    // Check for existing session via token
    const initAuth = async () => {
      const cachedUser = localStorage.getItem(CURRENT_USER_KEY);
      const hasToken = authService.isAuthenticated();
      
      console.log('[AuthContext] Init auth:', { 
        hasToken, 
        hasCachedUser: !!cachedUser
      });
      
      if (cachedUser && hasToken) {
        try {
          // Load cached user immediately for fast UI
          const parsedUser = JSON.parse(cachedUser) as User;
          setUser(parsedUser);
          localStorage.setItem('autofloy_user_id', parsedUser.id);
          setIsLoading(false);
          
          // Refresh user data in background
          try {
            const { user: serviceUser } = await authService.refreshUser();
            const mappedUser = mapServiceUser(serviceUser);
            setUser(mappedUser);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
            localStorage.setItem('autofloy_user_id', mappedUser.id);
          } catch (error) {
            console.log("Background refresh failed, using cached user:", error);
          }
        } catch (error) {
          console.log("Cache parse failed:", error);
          if (hasToken) {
            try {
              const { user: serviceUser } = await authService.refreshUser();
              const mappedUser = mapServiceUser(serviceUser);
              setUser(mappedUser);
              localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
              localStorage.setItem('autofloy_user_id', mappedUser.id);
              setIsLoading(false);
            } catch {
              authService.logout();
              setUser(null);
              localStorage.removeItem(CURRENT_USER_KEY);
              setIsLoading(false);
            }
          } else {
            setUser(null);
            setIsLoading(false);
          }
        }
      } else if (hasToken) {
        // No cache but has token - try to refresh
        try {
          const { user: serviceUser } = await authService.refreshUser();
          const mappedUser = mapServiceUser(serviceUser);
          setUser(mappedUser);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
          localStorage.setItem('autofloy_user_id', mappedUser.id);
          setIsLoading(false);
        } catch (error) {
          console.log("Auth init failed, clearing session:", error);
          authService.logout();
          setUser(null);
          localStorage.removeItem(CURRENT_USER_KEY);
          setIsLoading(false);
        }
      } else {
        // No token - not authenticated
        setUser(null);
        localStorage.removeItem(CURRENT_USER_KEY);
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user: serviceUser } = await authService.login(email, password);
      const mappedUser = mapServiceUser(serviceUser);
      setUser(mappedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
      localStorage.setItem('autofloy_user_id', mappedUser.id);
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
      localStorage.setItem('autofloy_user_id', mappedUser.id);
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

  // Google OAuth - redirect to Google login
  const loginWithGoogle = async () => {
    // Get the Google Client ID from window or use the edge function
    const GOOGLE_CLIENT_ID = "458754008519-d0feefkvq33klrlqtjplek3i9orogq8t.apps.googleusercontent.com";
    
    // Always use production domain for OAuth redirect
    const PRODUCTION_DOMAIN = "https://autofloy.online";
    const redirectUri = `${PRODUCTION_DOMAIN}/auth/google/callback`;
    
    const scope = encodeURIComponent("openid email profile");
    const state = crypto.randomUUID();
    
    // Store state for verification
    sessionStorage.setItem('google_oauth_state', state);
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `state=${state}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    window.location.href = authUrl;
  };

  // Handle Google OAuth callback
  const handleGoogleCallback = async (code: string): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> => {
    // Always use production domain for OAuth redirect - must match what was used in loginWithGoogle
    const PRODUCTION_DOMAIN = "https://autofloy.online";
    const redirectUri = `${PRODUCTION_DOMAIN}/auth/google/callback`;
    
    try {
      const { user: serviceUser, is_new_user } = await authService.handleGoogleCallback(code, redirectUri);
      const mappedUser = mapServiceUser(serviceUser);
      setUser(mappedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
      localStorage.setItem('autofloy_user_id', mappedUser.id);
      return { success: true, isNewUser: is_new_user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Google login failed" };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      signup, 
      loginWithGoogle,
      handleGoogleCallback,
      logout, 
      refreshUser 
    }}>
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
