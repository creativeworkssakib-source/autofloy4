/**
 * Offline Authentication Manager
 * 
 * Handles offline authentication with 7-day session caching.
 * Users can work offline without re-logging in for 7 days.
 */

const AUTH_CACHE_KEY = 'autofloy_offline_auth';
const AUTH_TOKEN_KEY = 'autofloy_token';
const CURRENT_USER_KEY = 'autofloy_current_user';
const CACHE_DURATION_DAYS = 7;
const CACHE_DURATION_MS = CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000;

export interface CachedAuth {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    subscriptionPlan: string;
    avatarUrl?: string;
  };
  cachedAt: number;
  expiresAt: number;
}

/**
 * Save authentication data for offline use
 * Called after successful login
 */
export function cacheAuthForOffline(token: string, user: any): void {
  const now = Date.now();
  const cachedAuth: CachedAuth = {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name || user.display_name || user.email.split('@')[0],
      phone: user.phone,
      subscriptionPlan: user.subscriptionPlan || user.subscription_plan || 'none',
      avatarUrl: user.avatarUrl || user.avatar_url,
    },
    cachedAt: now,
    expiresAt: now + CACHE_DURATION_MS,
  };
  
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cachedAuth));
    console.log('[OfflineAuth] Auth cached for offline use, expires in 7 days');
  } catch (error) {
    console.error('[OfflineAuth] Failed to cache auth:', error);
  }
}

/**
 * Get cached authentication data
 * Returns null if cache is expired or doesn't exist
 */
export function getCachedAuth(): CachedAuth | null {
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (!cached) return null;
    
    const cachedAuth: CachedAuth = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache has expired
    if (now > cachedAuth.expiresAt) {
      console.log('[OfflineAuth] Cache expired, clearing');
      clearOfflineAuth();
      return null;
    }
    
    return cachedAuth;
  } catch (error) {
    console.error('[OfflineAuth] Failed to get cached auth:', error);
    return null;
  }
}

/**
 * Check if valid offline auth exists
 */
export function hasValidOfflineAuth(): boolean {
  const cached = getCachedAuth();
  return cached !== null && !!cached.token && !!cached.user;
}

/**
 * Get remaining days until offline auth expires
 */
export function getOfflineAuthRemainingDays(): number {
  const cached = getCachedAuth();
  if (!cached) return 0;
  
  const remaining = cached.expiresAt - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

/**
 * Refresh the cache expiry (call this when user comes online)
 */
export function refreshOfflineAuthExpiry(): void {
  const cached = getCachedAuth();
  if (!cached) return;
  
  const now = Date.now();
  cached.expiresAt = now + CACHE_DURATION_MS;
  cached.cachedAt = now;
  
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cached));
    console.log('[OfflineAuth] Cache expiry refreshed for 7 more days');
  } catch (error) {
    console.error('[OfflineAuth] Failed to refresh cache expiry:', error);
  }
}

/**
 * Clear offline auth cache (called on logout)
 */
export function clearOfflineAuth(): void {
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
    console.log('[OfflineAuth] Cache cleared');
  } catch (error) {
    console.error('[OfflineAuth] Failed to clear cache:', error);
  }
}

/**
 * Check if user can access app offline
 * Returns true if:
 * 1. User is online (normal auth flow)
 * 2. User is offline but has valid cached auth
 */
export function canAccessOffline(): boolean {
  if (navigator.onLine) return true;
  return hasValidOfflineAuth();
}

/**
 * Get auth state for offline mode
 */
export function getOfflineAuthState(): {
  isAuthenticated: boolean;
  user: CachedAuth['user'] | null;
  token: string | null;
  remainingDays: number;
  isOffline: boolean;
} {
  const isOffline = !navigator.onLine;
  const cached = getCachedAuth();
  
  // Also check for token in regular storage
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  
  if (cached && cached.token) {
    return {
      isAuthenticated: true,
      user: cached.user,
      token: cached.token,
      remainingDays: getOfflineAuthRemainingDays(),
      isOffline,
    };
  }
  
  // If we have a token but no cache, try to create cache from current user
  if (token) {
    const currentUserStr = localStorage.getItem(CURRENT_USER_KEY);
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        // Create cache from existing data
        cacheAuthForOffline(token, currentUser);
        return {
          isAuthenticated: true,
          user: {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
            phone: currentUser.phone,
            subscriptionPlan: currentUser.subscriptionPlan,
            avatarUrl: currentUser.avatarUrl,
          },
          token,
          remainingDays: CACHE_DURATION_DAYS,
          isOffline,
        };
      } catch {
        // Ignore parse errors
      }
    }
  }
  
  return {
    isAuthenticated: false,
    user: null,
    token: null,
    remainingDays: 0,
    isOffline,
  };
}

/**
 * Initialize offline auth on app start
 * Should be called early in app initialization
 */
export function initOfflineAuth(): void {
  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('[OfflineAuth] Back online');
    // Refresh cache expiry when coming back online
    if (hasValidOfflineAuth()) {
      refreshOfflineAuthExpiry();
    }
  });
  
  window.addEventListener('offline', () => {
    console.log('[OfflineAuth] Gone offline');
  });
  
  // Log current state
  const state = getOfflineAuthState();
  console.log('[OfflineAuth] Initialized:', {
    isAuthenticated: state.isAuthenticated,
    remainingDays: state.remainingDays,
    isOffline: state.isOffline,
  });
}
