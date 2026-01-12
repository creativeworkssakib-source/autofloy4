import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { authService, User as ServiceUser } from "@/services/authService";
import { 
  cacheAuthForOffline, 
  getCachedAuth, 
  clearOfflineAuth, 
  hasValidOfflineAuth,
  initOfflineAuth,
  refreshOfflineAuthExpiry,
  getOfflineAuthRemainingDays
} from "@/lib/offlineAuth";

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
  isOfflineMode: boolean;
  offlineAuthDaysRemaining: number;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = "autofloy_current_user";

// Check if we're online
const isOnline = () => typeof navigator !== 'undefined' && navigator.onLine;

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
  const [isOfflineMode, setIsOfflineMode] = useState(!isOnline());
  const [offlineAuthDaysRemaining, setOfflineAuthDaysRemaining] = useState(0);
  
  // Use ref to prevent multiple initializations
  const isInitializedRef = useRef(false);

  const refreshUser = async () => {
    if (authService.isAuthenticated()) {
      try {
        const { user: serviceUser, token } = await authService.refreshUser();
        const mappedUser = mapServiceUser(serviceUser);
        setUser(mappedUser);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
        localStorage.setItem('autofloy_user_id', mappedUser.id);
        
        // Cache for offline use (7 days)
        const authToken = token || authService.getToken();
        if (authToken) {
          cacheAuthForOffline(authToken, mappedUser);
          refreshOfflineAuthExpiry();
          setOfflineAuthDaysRemaining(getOfflineAuthRemainingDays());
        }
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
    
    // Initialize offline auth system
    initOfflineAuth();
    
    // Listen for online/offline changes
    const handleOnline = () => {
      console.log('[AuthContext] Online detected');
      setIsOfflineMode(false);
      // Refresh auth expiry when back online
      if (hasValidOfflineAuth()) {
        refreshOfflineAuthExpiry();
        setOfflineAuthDaysRemaining(getOfflineAuthRemainingDays());
      }
    };
    
    const handleOffline = () => {
      console.log('[AuthContext] Offline detected');
      setIsOfflineMode(true);
      
      // When going offline, ensure we have user from offline cache
      const offlineAuth = getCachedAuth();
      if (offlineAuth && offlineAuth.user) {
        const offlineUser: User = {
          id: offlineAuth.user.id,
          email: offlineAuth.user.email,
          name: offlineAuth.user.name,
          phone: offlineAuth.user.phone,
          emailVerified: true,
          subscriptionPlan: offlineAuth.user.subscriptionPlan,
          avatarUrl: offlineAuth.user.avatarUrl,
          createdAt: new Date().toISOString(),
        };
        setUser(offlineUser);
        setOfflineAuthDaysRemaining(getOfflineAuthRemainingDays());
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for existing session via token
    const initAuth = async () => {
      const cachedUser = localStorage.getItem(CURRENT_USER_KEY);
      const hasToken = authService.isAuthenticated();
      const offlineAuth = getCachedAuth();
      
      console.log('[AuthContext] Init auth:', { 
        isOnline: isOnline(), 
        hasToken, 
        hasCachedUser: !!cachedUser,
        hasOfflineAuth: !!offlineAuth,
        hasValidOfflineAuth: hasValidOfflineAuth()
      });
      
      // OFFLINE MODE: Use cached auth if available
      if (!isOnline()) {
        console.log('[AuthContext] Offline mode detected');
        
        // First try offline auth cache (7-day cache)
        if (offlineAuth && offlineAuth.user && offlineAuth.token) {
          console.log('[AuthContext] Using offline auth cache');
          const offlineUser: User = {
            id: offlineAuth.user.id,
            email: offlineAuth.user.email,
            name: offlineAuth.user.name,
            phone: offlineAuth.user.phone,
            emailVerified: true,
            subscriptionPlan: offlineAuth.user.subscriptionPlan,
            avatarUrl: offlineAuth.user.avatarUrl,
          createdAt: new Date().toISOString(),
          };
          setUser(offlineUser);
          localStorage.setItem('autofloy_user_id', offlineUser.id);
          setOfflineAuthDaysRemaining(getOfflineAuthRemainingDays());
          setIsLoading(false);
          return;
        }
        
        // Fallback: try regular cached user (if token exists)
        if (cachedUser && hasToken) {
          try {
          console.log('[AuthContext] Using regular cached user for offline');
          const parsedUser = JSON.parse(cachedUser) as User;
          setUser(parsedUser);
          localStorage.setItem('autofloy_user_id', parsedUser.id);
            
            // Create offline auth cache from this data for future offline use
            const token = authService.getToken();
            if (token) {
              cacheAuthForOffline(token, parsedUser);
              setOfflineAuthDaysRemaining(7);
            }
            
            setIsLoading(false);
            return;
          } catch (e) {
            console.error('[AuthContext] Failed to parse cached user:', e);
          }
        }
        
        // No valid offline auth - user needs to go online
        console.log('[AuthContext] No offline auth available');
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // ONLINE MODE: Normal auth flow
      if (cachedUser && hasToken) {
        try {
          // Load cached user immediately
          const parsedUser = JSON.parse(cachedUser) as User;
          setUser(parsedUser);
          localStorage.setItem('autofloy_user_id', parsedUser.id);
          setIsLoading(false); // Show UI immediately with cached data
          
          // Refresh user data in background
          try {
            const { user: serviceUser, token } = await authService.refreshUser();
            const mappedUser = mapServiceUser(serviceUser);
            setUser(mappedUser);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
            localStorage.setItem('autofloy_user_id', mappedUser.id);
            
            // Cache for offline use
            const authToken = token || authService.getToken();
            if (authToken) {
              cacheAuthForOffline(authToken, mappedUser);
              setOfflineAuthDaysRemaining(getOfflineAuthRemainingDays());
            }
          } catch (error) {
            console.log("Background refresh failed, using cached user:", error);
            // Still cache the current user for offline if we have token
            const authToken = authService.getToken();
            if (authToken && parsedUser) {
              cacheAuthForOffline(authToken, parsedUser);
            }
          }
        } catch (error) {
          console.log("Cache parse failed:", error);
          if (hasToken) {
            try {
              const { user: serviceUser, token } = await authService.refreshUser();
              const mappedUser = mapServiceUser(serviceUser);
              setUser(mappedUser);
              localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
              localStorage.setItem('autofloy_user_id', mappedUser.id);
              
              const authToken = token || authService.getToken();
              if (authToken) {
                cacheAuthForOffline(authToken, mappedUser);
              }
              setIsLoading(false);
            } catch {
              authService.logout();
              clearOfflineAuth();
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
          const { user: serviceUser, token } = await authService.refreshUser();
          const mappedUser = mapServiceUser(serviceUser);
          setUser(mappedUser);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
          localStorage.setItem('autofloy_user_id', mappedUser.id);
          
          const authToken = token || authService.getToken();
          if (authToken) {
            cacheAuthForOffline(authToken, mappedUser);
            setOfflineAuthDaysRemaining(getOfflineAuthRemainingDays());
          }
          setIsLoading(false);
        } catch (error) {
          console.log("Auth init failed, clearing session:", error);
          authService.logout();
          clearOfflineAuth();
          setUser(null);
          localStorage.removeItem(CURRENT_USER_KEY);
          setIsLoading(false);
        }
      } else if (offlineAuth && offlineAuth.user && offlineAuth.token) {
        // No token but we have valid offline auth - use it
        // This handles the case where user refreshed while offline cache is valid
        console.log('[AuthContext] No token but using offline auth');
        const offlineUser: User = {
          id: offlineAuth.user.id,
          email: offlineAuth.user.email,
          name: offlineAuth.user.name,
          phone: offlineAuth.user.phone,
          emailVerified: true,
          subscriptionPlan: offlineAuth.user.subscriptionPlan,
          avatarUrl: offlineAuth.user.avatarUrl,
          createdAt: new Date().toISOString(),
        };
        setUser(offlineUser);
        localStorage.setItem('autofloy_user_id', offlineUser.id);
        setOfflineAuthDaysRemaining(getOfflineAuthRemainingDays());
        
        // Try to restore the token from offline auth
        if (offlineAuth.token) {
          localStorage.setItem('autofloy_token', offlineAuth.token);
        }
        setIsLoading(false);
      } else {
        // No token and no offline auth
        setUser(null);
        localStorage.removeItem(CURRENT_USER_KEY);
        setIsLoading(false);
      }
    };
    
    initAuth();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Empty dependency array - run once only

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Require online for login
    if (!isOnline()) {
      return { success: false, error: "লগইন করতে ইন্টারনেট সংযোগ প্রয়োজন" };
    }
    
    try {
      const { user: serviceUser, token } = await authService.login(email, password);
      const mappedUser = mapServiceUser(serviceUser);
      setUser(mappedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
      localStorage.setItem('autofloy_user_id', mappedUser.id);
      
      // Cache for offline use (7 days)
      cacheAuthForOffline(token, mappedUser);
      setOfflineAuthDaysRemaining(7);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Login failed" };
    }
  };

  const signup = async (data: { name: string; email: string; phone: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    // Require online for signup
    if (!isOnline()) {
      return { success: false, error: "সাইন আপ করতে ইন্টারনেট সংযোগ প্রয়োজন" };
    }
    
    try {
      const { user: serviceUser, token } = await authService.signup(
        data.email,
        data.password,
        data.phone,
        data.name
      );
      const mappedUser = mapServiceUser(serviceUser);
      setUser(mappedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mappedUser));
      localStorage.setItem('autofloy_user_id', mappedUser.id);
      
      // Cache for offline use (7 days)
      cacheAuthForOffline(token, mappedUser);
      setOfflineAuthDaysRemaining(7);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Signup failed" };
    }
  };

  const logout = () => {
    authService.logout();
    clearOfflineAuth(); // Clear offline cache on logout
    setUser(null);
    setOfflineAuthDaysRemaining(0);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isOfflineMode,
      offlineAuthDaysRemaining,
      login, 
      signup, 
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
