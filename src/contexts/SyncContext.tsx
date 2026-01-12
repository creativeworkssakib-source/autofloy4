import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { offlineSyncOrchestrator, SyncStatus } from '@/lib/offlineSyncOrchestrator';
import { useShop } from '@/contexts/ShopContext';
import { useAuth } from '@/contexts/AuthContext';
import { isInstalled } from '@/lib/platformDetection';

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
  const { currentShop } = useShop();
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);
  const [isOfflineCapable] = useState(() => isInstalled());

  // Initialize sync orchestrator when shop and user are available
  useEffect(() => {
    if (!currentShop?.id || !user?.id) {
      return;
    }

    // Only initialize for installed apps (PWA/APK/EXE)
    if (!isInstalled()) {
      console.log('[SyncProvider] Browser mode - sync not needed');
      return;
    }

    console.log('[SyncProvider] Initializing sync for shop:', currentShop.id);

    let unsubscribe: (() => void) | null = null;

    // Initialize the sync orchestrator
    offlineSyncOrchestrator.init(currentShop.id, user.id)
      .then(() => {
        // Subscribe to sync status updates after successful init
        unsubscribe = offlineSyncOrchestrator.subscribe(status => {
          setSyncStatus(status);
        });
      })
      .catch(error => {
        console.error('[SyncProvider] Failed to initialize sync:', error);
        // Update status with error
        setSyncStatus(prev => ({
          ...prev,
          lastError: error instanceof Error ? error.message : 'Sync initialization failed',
        }));
      });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Cleanup the orchestrator on unmount or when shop/user changes
      offlineSyncOrchestrator.cleanup();
    };
  }, [currentShop?.id, user?.id]);

  // Update online status independently
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
    if (!isInstalled()) {
      console.log('[SyncProvider] Force sync not available in browser mode');
      return;
    }
    
    await offlineSyncOrchestrator.forceSync();
  }, []);

  return (
    <SyncContext.Provider value={{ syncStatus, forceSync, isOfflineCapable }}>
      {children}
    </SyncContext.Provider>
  );
}
