import { useState, useEffect, useCallback } from 'react';

interface OnlineStatusState {
  isOnline: boolean;
  lastOnlineAt: Date | null;
  wasOffline: boolean;
}

/**
 * Hook to track online/offline status with history
 */
export function useOnlineStatus() {
  const [state, setState] = useState<OnlineStatusState>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastOnlineAt: typeof navigator !== 'undefined' && navigator.onLine ? new Date() : null,
    wasOffline: false,
  }));

  const handleOnline = useCallback(() => {
    setState(prev => ({
      isOnline: true,
      lastOnlineAt: new Date(),
      wasOffline: !prev.isOnline, // Was offline before this
    }));
    
    // Store last online time in localStorage for persistence
    localStorage.setItem('lastOnlineAt', new Date().toISOString());
  }, []);

  const handleOffline = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnline: false,
      wasOffline: false,
    }));
  }, []);

  useEffect(() => {
    // Initialize from localStorage
    const storedLastOnline = localStorage.getItem('lastOnlineAt');
    if (storedLastOnline) {
      setState(prev => ({
        ...prev,
        lastOnlineAt: new Date(storedLastOnline),
      }));
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  /**
   * Check if we've been offline for more than specified hours
   */
  const hasBeenOfflineFor = useCallback((hours: number): boolean => {
    if (state.isOnline) return false;
    if (!state.lastOnlineAt) return true; // Never been online
    
    const hoursSinceOnline = (Date.now() - state.lastOnlineAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceOnline >= hours;
  }, [state.isOnline, state.lastOnlineAt]);

  /**
   * Check if we've been offline for more than specified days
   */
  const hasBeenOfflineForDays = useCallback((days: number): boolean => {
    return hasBeenOfflineFor(days * 24);
  }, [hasBeenOfflineFor]);

  /**
   * Get time since last online in human readable format
   */
  const getTimeSinceOnline = useCallback((language: 'en' | 'bn' = 'en'): string | null => {
    if (!state.lastOnlineAt) return null;
    
    const now = Date.now();
    const lastOnline = state.lastOnlineAt.getTime();
    const diffMs = now - lastOnline;
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (language === 'bn') {
      if (days > 0) return `${days} দিন আগে`;
      if (hours > 0) return `${hours} ঘন্টা আগে`;
      if (minutes > 0) return `${minutes} মিনিট আগে`;
      return 'এইমাত্র';
    }
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }, [state.lastOnlineAt]);

  /**
   * Force update online status (useful for testing or manual refresh)
   */
  const refreshStatus = useCallback(() => {
    const online = navigator.onLine;
    if (online) {
      handleOnline();
    } else {
      handleOffline();
    }
  }, [handleOnline, handleOffline]);

  return {
    isOnline: state.isOnline,
    lastOnlineAt: state.lastOnlineAt,
    wasOffline: state.wasOffline,
    hasBeenOfflineFor,
    hasBeenOfflineForDays,
    getTimeSinceOnline,
    refreshStatus,
  };
}

/**
 * Simple hook that just returns online status
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
