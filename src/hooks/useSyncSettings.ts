import { useState, useEffect, useCallback } from "react";
import { authService } from "@/services/authService";

interface SyncSettings {
  sync_enabled: boolean;
  master_inventory: string;
}

interface SyncStats {
  offlineToOnline: number;
  onlineToOffline: number;
  stockUpdated: number;
}

interface SyncResponse {
  settings: SyncSettings;
  syncStats?: SyncStats | null;
  message?: string;
  canSyncBusiness?: boolean;
}

const SYNC_SETTINGS_URL =
  (import.meta.env.VITE_WORKER_API_URL || "https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1") + "/offline-shop/sync-settings";

export const useSyncSettings = () => {
  const [syncSettings, setSyncSettings] = useState<SyncSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStats, setLastSyncStats] = useState<SyncStats | null>(null);
  const [canSyncBusiness, setCanSyncBusiness] = useState(false);

  const fetchSyncSettings = useCallback(async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      console.log("useSyncSettings: Making request to", SYNC_SETTINGS_URL);
      const res = await fetch(SYNC_SETTINGS_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("useSyncSettings: Response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("useSyncSettings: Got data:", data);
        setSyncSettings(data.settings);
        setCanSyncBusiness(data.canSyncBusiness === true);
      } else {
        const errText = await res.text().catch(() => "");
        console.error("useSyncSettings: Failed to fetch:", res.status, errText);
      }
    } catch (error) {
      console.error("useSyncSettings: Failed to fetch sync settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSyncSettings = useCallback(async (settings: Partial<SyncSettings>): Promise<SyncResponse | null> => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error("useSyncSettings: No token found for update");
        return null;
      }

      setIsSyncing(true);

      const res = await fetch(SYNC_SETTINGS_URL, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      console.log("useSyncSettings: Update response status:", res.status);
      
      if (res.ok) {
        const data: SyncResponse = await res.json();
        console.log("useSyncSettings: Update success, data:", data);
        setSyncSettings(data.settings);
        
        if (data.syncStats) {
          setLastSyncStats(data.syncStats);
        }
        
        return data;
      }

      // Handle 403 - no permission
      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        console.error("useSyncSettings: No permission to sync:", errData);
        setCanSyncBusiness(false);
        return { 
          settings: syncSettings || { sync_enabled: false, master_inventory: "offline" },
          message: errData.error || "You do not have permission to enable business sync.",
          canSyncBusiness: false
        };
      }

      const errText = await res.text().catch(() => "");
      console.error("useSyncSettings: Failed to update sync settings:", res.status, errText);
      return null;
    } catch (error) {
      console.error("useSyncSettings: Exception during update:", error);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [syncSettings]);

  useEffect(() => {
    fetchSyncSettings();
  }, [fetchSyncSettings]);

  return {
    syncSettings,
    syncEnabled: syncSettings?.sync_enabled ?? false,
    masterInventory: syncSettings?.master_inventory ?? "offline",
    isLoading,
    isSyncing,
    lastSyncStats,
    canSyncBusiness,
    updateSyncSettings,
    refetch: fetchSyncSettings,
  };
};

