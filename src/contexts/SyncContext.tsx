import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useShop } from '@/contexts/ShopContext';
import { useAuth } from '@/contexts/AuthContext';
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
  const { currentShop } = useShop();
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);
  const [isOfflineCapable] = useState(() => isInstalled());
  const initRef = useRef(false);
  const shopIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const orchestratorRef = useRef<any>(null);

  // Initialize sync orchestrator when shop and user are available
  useEffect(() => {
    // Skip if no shop or user
    if (!currentShop?.id || !user?.id) {
      return;
    }

    // Skip if already initialized with same shop and user
    if (initRef.current && shopIdRef.current === currentShop.id && userIdRef.current === user.id) {
      return;
    }

    // Only initialize for installed apps (PWA/APK/EXE)
    if (!isInstalled()) {
      console.log('[SyncProvider] Browser mode - sync not needed');
      return;
    }

    console.log('[SyncProvider] Initializing sync for shop:', currentShop.id);
    
    shopIdRef.current = currentShop.id;
    userIdRef.current = user.id;

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    // Dynamically import the sync orchestrator only when needed
    import('@/lib/offlineSyncOrchestrator').then(({ offlineSyncOrchestrator }) => {
      if (!isMounted) return;
      
      orchestratorRef.current = offlineSyncOrchestrator;
      
      // Initialize the sync orchestrator
      offlineSyncOrchestrator.init(currentShop.id, user.id)
        .then(() => {
          if (!isMounted) return;
          
          initRef.current = true;
          
          // Subscribe to sync status updates after successful init
          unsubscribe = offlineSyncOrchestrator.subscribe((status: SyncStatus) => {
            if (isMounted) {
              setSyncStatus(status);
            }
          });
        })
        .catch((error: Error) => {
          console.error('[SyncProvider] Failed to initialize sync:', error);
          if (isMounted) {
            // Update status with error
            setSyncStatus(prev => ({
              ...prev,
              lastError: error instanceof Error ? error.message : 'Sync initialization failed',
            }));
          }
        });
    }).catch((error) => {
      console.error('[SyncProvider] Failed to load sync module:', error);
    });

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
      // Only cleanup if shop/user actually changes (not on every render)
      // We'll handle full cleanup on unmount
    };
  }, [currentShop?.id, user?.id]);

  // Cleanup on full unmount
  useEffect(() => {
    return () => {
      if (initRef.current && orchestratorRef.current) {
        orchestratorRef.current.cleanup();
        initRef.current = false;
        shopIdRef.current = null;
        userIdRef.current = null;
      }
    };
  }, []);

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
    
    if (!initRef.current) {
      console.log('[SyncProvider] Cannot force sync - not initialized');
      return;
    }
    
    if (orchestratorRef.current) {
      await orchestratorRef.current.forceSync();
    }
  }, []);

  return (
    <SyncContext.Provider value={{ syncStatus, forceSync, isOfflineCapable }}>
      {children}
    </SyncContext.Provider>
  );
}
