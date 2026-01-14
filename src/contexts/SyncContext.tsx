import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';

/**
 * SIMPLIFIED Sync Context
 * - NO auto-sync
 * - NO event listeners for online/offline
 * - ONLY manual sync via user button click
 * - Prevents UI freezes caused by background sync
 */

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

// Global debounce for force sync - 60 seconds minimum
let lastForceSyncTime = 0;
const FORCE_SYNC_DEBOUNCE_MS = 60000;

export function SyncProvider({ children }: SyncProviderProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);
  const isSyncingRef = useRef(false);

  // NO useEffect for online/offline events - removed to prevent background activity

  const forceSync = useCallback(async () => {
    const now = Date.now();
    
    // Strong debounce - 60 seconds minimum
    if (now - lastForceSyncTime < FORCE_SYNC_DEBOUNCE_MS) {
      console.log('[SyncProvider] Force sync debounced, wait', Math.ceil((FORCE_SYNC_DEBOUNCE_MS - (now - lastForceSyncTime)) / 1000), 'seconds');
      return;
    }
    
    // Prevent concurrent syncs
    if (isSyncingRef.current) {
      console.log('[SyncProvider] Sync already in progress');
      return;
    }
    
    lastForceSyncTime = now;
    isSyncingRef.current = true;
    setSyncStatus(prev => ({ ...prev, isSyncing: true, isOnline: navigator.onLine }));
    
    try {
      // Lazy load to prevent blocking
      const { syncManager } = await import('@/services/syncManager');
      await syncManager.sync();
      
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSyncAt: new Date(),
        lastError: null,
        isOnline: navigator.onLine,
      }));
    } catch (error) {
      console.error('[SyncProvider] Force sync failed:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false,
        lastError: error instanceof Error ? error.message : 'Sync failed',
        isOnline: navigator.onLine,
      }));
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  return (
    <SyncContext.Provider value={{ syncStatus, forceSync, isOfflineCapable: false }}>
      {children}
    </SyncContext.Provider>
  );
}
