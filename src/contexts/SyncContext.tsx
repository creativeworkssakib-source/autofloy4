import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
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

// Global debounce for force sync
let lastForceSyncTime = 0;
const FORCE_SYNC_DEBOUNCE_MS = 30000; // 30 seconds minimum between force syncs

export function SyncProvider({ children }: SyncProviderProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);
  const [isOfflineCapable] = useState(() => isInstalled());
  const isSyncingRef = useRef(false);

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
    const now = Date.now();
    
    // Debounce to prevent rapid calls
    if (now - lastForceSyncTime < FORCE_SYNC_DEBOUNCE_MS) {
      console.log('[SyncProvider] Force sync debounced');
      return;
    }
    
    // Prevent concurrent syncs
    if (isSyncingRef.current) {
      console.log('[SyncProvider] Sync already in progress');
      return;
    }
    
    lastForceSyncTime = now;
    isSyncingRef.current = true;
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    
    try {
      // Lazy load to prevent blocking
      const { syncManager } = await import('@/services/syncManager');
      await syncManager.sync();
      
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSyncAt: new Date(),
        lastError: null 
      }));
    } catch (error) {
      console.error('[SyncProvider] Force sync failed:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false,
        lastError: error instanceof Error ? error.message : 'Sync failed'
      }));
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  return (
    <SyncContext.Provider value={{ syncStatus, forceSync, isOfflineCapable }}>
      {children}
    </SyncContext.Provider>
  );
}
