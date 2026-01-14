import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { isInstalled } from '@/lib/platformDetection';

// Define the SyncStatus interface inline to avoid importing the heavy module
interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingChanges: number;
  syncProgress: number;
  lastError: string | null;
  syncDirection: 'push' | 'pull' | 'idle';
}

interface SyncContextType {
  syncStatus: SyncStatus;
  forceSync: () => Promise<void>;
  isOfflineCapable: boolean;
}

const defaultSyncStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  lastSyncAt: null,
  pendingChanges: 0,
  syncProgress: 0,
  lastError: null,
  syncDirection: 'idle',
};

const SyncContext = createContext<SyncContextType>({
  syncStatus: defaultSyncStatus,
  forceSync: async () => {},
  isOfflineCapable: false,
});

export const useSyncContext = () => useContext(SyncContext);

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);
  const [isOfflineCapable] = useState(() => isInstalled());

  // Update online status independently - simple and non-blocking
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
    };
    
    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const forceSync = useCallback(async () => {
    // No-op for now - sync is handled elsewhere
    console.log('[SyncProvider] Force sync requested');
  }, []);

  return (
    <SyncContext.Provider value={{ syncStatus, forceSync, isOfflineCapable }}>
      {children}
    </SyncContext.Provider>
  );
}
