/**
 * Optimized Query Utilities
 * 
 * Provides:
 * 1. Debounced queries - prevent rapid successive calls
 * 2. Selective column fetching - only get what you need
 * 3. Request deduplication - don't repeat identical requests
 * 4. Smart caching with TTL
 */

import { useRef, useCallback, useState, useEffect } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Global request cache to deduplicate across components
const requestCache = new Map<string, Promise<any>>();
const dataCache = new Map<string, CacheEntry<any>>();

// Default cache TTL: 2 minutes
const DEFAULT_TTL = 2 * 60 * 1000;

/**
 * Clear all cached data
 */
export function clearOptimizedCache(): void {
  requestCache.clear();
  dataCache.clear();
  console.log("[OptimizedQuery] Cache cleared");
}

/**
 * Create a cache key from function arguments
 */
function createCacheKey(prefix: string, args: unknown[]): string {
  return `${prefix}:${JSON.stringify(args)}`;
}

/**
 * Debounced function hook
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fnRef = useRef(fn);
  
  // Keep function reference updated
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  
  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    return new Promise<ReturnType<T>>((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        const result = await fnRef.current(...args);
        resolve(result);
      }, delay);
    });
  }, [delay]) as T;
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedFn;
}

/**
 * Deduplicated fetch hook - prevents duplicate requests
 */
export function useDedupedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
  } = {}
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { ttl = DEFAULT_TTL, enabled = true } = options;
  
  const [data, setData] = useState<T | null>(() => {
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      setData(cached.data);
      setIsLoading(false);
      return;
    }
    
    // Check if request is already in flight
    const existingRequest = requestCache.get(key);
    if (existingRequest) {
      try {
        const result = await existingRequest;
        setData(result);
        setIsLoading(false);
      } catch (e) {
        setError(e as Error);
        setIsLoading(false);
      }
      return;
    }
    
    setIsLoading(true);
    
    // Create new request and cache it
    const request = fetchFn();
    requestCache.set(key, request);
    
    try {
      const result = await request;
      
      // Cache the result
      dataCache.set(key, { data: result, timestamp: Date.now() });
      setData(result);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      requestCache.delete(key);
      setIsLoading(false);
    }
  }, [key, fetchFn, ttl]);
  
  const refetch = useCallback(async () => {
    // Force refresh - clear cache
    dataCache.delete(key);
    requestCache.delete(key);
    await fetchData();
  }, [key, fetchData]);
  
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);
  
  return { data, isLoading, error, refetch };
}

/**
 * Batched state update hook - groups rapid updates
 */
export function useBatchedState<T>(
  initialValue: T,
  batchDelay: number = 100
): [T, (updater: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const pendingUpdatesRef = useRef<Array<T | ((prev: T) => T)>>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const batchedSetState = useCallback((updater: T | ((prev: T) => T)) => {
    pendingUpdatesRef.current.push(updater);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setState((prevState: T) => {
        let result = prevState;
        for (const update of pendingUpdatesRef.current) {
          if (typeof update === "function") {
            result = (update as (prev: T) => T)(result);
          } else {
            result = update;
          }
        }
        return result;
      });
      pendingUpdatesRef.current = [];
    }, batchDelay);
  }, [batchDelay]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return [state, batchedSetState];
}

/**
 * Memoized async function - caches results
 */
export function createMemoizedFetch<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: {
    keyPrefix: string;
    ttl?: number;
  }
): (...args: TArgs) => Promise<TResult> {
  const { keyPrefix, ttl = DEFAULT_TTL } = options;
  
  return async (...args: TArgs): Promise<TResult> => {
    const key = createCacheKey(keyPrefix, args);
    
    // Check cache
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`[MemoizedFetch] Cache hit for ${keyPrefix}`);
      return cached.data;
    }
    
    // Check in-flight request
    const existingRequest = requestCache.get(key);
    if (existingRequest) {
      console.log(`[MemoizedFetch] Deduping request for ${keyPrefix}`);
      return existingRequest;
    }
    
    // Make new request
    console.log(`[MemoizedFetch] New request for ${keyPrefix}`);
    const request = fn(...args);
    requestCache.set(key, request);
    
    try {
      const result = await request;
      dataCache.set(key, { data: result, timestamp: Date.now() });
      return result;
    } finally {
      requestCache.delete(key);
    }
  };
}
