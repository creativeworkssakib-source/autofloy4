/**
 * Automations Data Hook with Realtime & Caching
 * 
 * Features:
 * 1. LocalStorage cache for instant loading
 * 2. Supabase Realtime for live updates
 * 3. Optimistic updates for better UX
 * 4. Background sync when tab becomes visible
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  fetchAutomationsWithAccess, 
  fetchConnectedAccountsWithLimits,
  Automation,
  AutomationsResponse,
  ConnectedAccountsResponse
} from "@/services/apiService";

// Cache configuration
const AUTOMATIONS_CACHE_KEY = "autofloy_automations_cache";
const ACCOUNTS_CACHE_KEY = "autofloy_connected_accounts_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface AutomationsCache {
  data: AutomationsResponse;
  timestamp: number;
}

interface AccountsCache {
  data: ConnectedAccountsResponse;
  timestamp: number;
}

interface UseAutomationsDataReturn {
  automations: Automation[];
  automationsResponse: AutomationsResponse | null;
  accountsResponse: ConnectedAccountsResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Get user ID from token
function getUserId(): string | null {
  const token = localStorage.getItem("autofloy_token");
  if (!token) return null;
  
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

// Load automations from cache
function loadAutomationsCache(): AutomationsResponse | null {
  try {
    const cached = localStorage.getItem(AUTOMATIONS_CACHE_KEY);
    if (!cached) return null;
    
    const parsed: AutomationsCache = JSON.parse(cached);
    // Return cached data even if stale - we'll refresh in background
    return parsed.data;
  } catch {
    return null;
  }
}

// Save automations to cache
function saveAutomationsCache(data: AutomationsResponse): void {
  try {
    const cache: AutomationsCache = { data, timestamp: Date.now() };
    localStorage.setItem(AUTOMATIONS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache errors
  }
}

// Load accounts from cache
function loadAccountsCache(): ConnectedAccountsResponse | null {
  try {
    const cached = localStorage.getItem(ACCOUNTS_CACHE_KEY);
    if (!cached) return null;
    
    const parsed: AccountsCache = JSON.parse(cached);
    return parsed.data;
  } catch {
    return null;
  }
}

// Save accounts to cache
function saveAccountsCache(data: ConnectedAccountsResponse): void {
  try {
    const cache: AccountsCache = { data, timestamp: Date.now() };
    localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache errors
  }
}

export function useAutomationsData(): UseAutomationsDataReturn {
  // Initialize from cache
  const cachedAutomations = loadAutomationsCache();
  const cachedAccounts = loadAccountsCache();
  
  const [automationsResponse, setAutomationsResponse] = useState<AutomationsResponse | null>(cachedAutomations);
  const [accountsResponse, setAccountsResponse] = useState<ConnectedAccountsResponse | null>(cachedAccounts);
  const [isLoading, setIsLoading] = useState(!cachedAutomations);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMountedRef = useRef(true);

  // Fetch all data
  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    
    try {
      const [automationsData, accountsData] = await Promise.all([
        fetchAutomationsWithAccess(),
        fetchConnectedAccountsWithLimits("facebook"),
      ]);
      
      if (!isMountedRef.current) return;
      
      setAutomationsResponse(automationsData);
      setAccountsResponse(accountsData);
      setError(null);
      
      // Update cache
      saveAutomationsCache(automationsData);
      saveAccountsCache(accountsData);
      
    } catch (err) {
      console.error("[Automations] Fetch error:", err);
      setError("Failed to load data");
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  // Setup Realtime and initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    const userId = getUserId();
    
    // Initial fetch
    fetchData(!cachedAutomations);
    
    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isMountedRef.current) {
        console.log("[Automations] Tab visible - refreshing");
        fetchData(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Setup Realtime subscription
    if (userId) {
      const channel = supabase
        .channel(`automations-realtime-${userId}`)
        // Listen for automation changes
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'automations',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log("[Realtime] Automation changed:", payload.eventType);
            
            // Optimistic update for faster UI
            if (payload.eventType === 'INSERT') {
              const newAutomation = payload.new as Automation;
              setAutomationsResponse(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  automations: [newAutomation, ...prev.automations]
                };
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedAutomation = payload.new as Automation;
              setAutomationsResponse(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  automations: prev.automations.map(a => 
                    a.id === updatedAutomation.id ? updatedAutomation : a
                  )
                };
              });
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id: string }).id;
              setAutomationsResponse(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  automations: prev.automations.filter(a => a.id !== deletedId)
                };
              });
            }
            
            // Also refresh from server to ensure consistency
            fetchData(false);
          }
        )
        // Listen for connected accounts changes
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'connected_accounts',
            filter: `user_id=eq.${userId}`
          },
          () => {
            console.log("[Realtime] Connected account changed");
            fetchConnectedAccountsWithLimits("facebook").then(data => {
              if (isMountedRef.current) {
                setAccountsResponse(data);
                saveAccountsCache(data);
              }
            });
          }
        )
        // Listen for webhook config changes
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'webhook_configs',
          },
          () => {
            console.log("[Realtime] Webhook config changed");
            fetchData(false);
          }
        )
        .subscribe((status) => {
          console.log("[Realtime] Automations subscription:", status);
        });
      
      channelRef.current = channel;
    }
    
    return () => {
      isMountedRef.current = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return {
    automations: automationsResponse?.automations || [],
    automationsResponse,
    accountsResponse,
    isLoading,
    error,
    refresh,
  };
}
