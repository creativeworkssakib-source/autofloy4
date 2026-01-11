/**
 * App Update Service
 * 
 * Handles automatic updates for PWA, Capacitor APK, and Electron EXE.
 * When admin makes changes on the website, updates sync to all platforms.
 */

import { offlineShopService } from './offlineShopService';
import { syncManager } from './syncManager';

interface AppVersion {
  version: string;
  buildNumber: number;
  releaseDate: string;
  releaseNotes?: string;
  forceUpdate?: boolean;
}

interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
  releaseNotes?: string;
}

const APP_VERSION_KEY = 'autofloy_app_version';
const LAST_UPDATE_CHECK_KEY = 'autofloy_last_update_check';
const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

class AppUpdateService {
  private currentVersion = '1.0.0';
  private buildNumber = 1;
  private listeners: Set<(result: UpdateCheckResult) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Load current version from storage
    this.loadCurrentVersion();
  }
  
  private loadCurrentVersion(): void {
    try {
      const stored = localStorage.getItem(APP_VERSION_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.currentVersion = data.version || '1.0.0';
        this.buildNumber = data.buildNumber || 1;
      }
    } catch (error) {
      console.error('Failed to load app version:', error);
    }
  }
  
  private saveCurrentVersion(): void {
    try {
      localStorage.setItem(APP_VERSION_KEY, JSON.stringify({
        version: this.currentVersion,
        buildNumber: this.buildNumber,
      }));
    } catch (error) {
      console.error('Failed to save app version:', error);
    }
  }
  
  getCurrentVersion(): string {
    return this.currentVersion;
  }
  
  getBuildNumber(): number {
    return this.buildNumber;
  }
  
  // Check if we're running in Electron
  isElectron(): boolean {
    return typeof window !== 'undefined' && 
      !!(window as any).electronAPI?.isElectron;
  }
  
  // Check if we're running in Capacitor
  isCapacitor(): boolean {
    return typeof window !== 'undefined' && 
      !!(window as any).Capacitor?.isNativePlatform?.();
  }
  
  // Check if we're running as PWA
  isPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
  }
  
  // Subscribe to update notifications
  subscribe(callback: (result: UpdateCheckResult) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  private notifyListeners(result: UpdateCheckResult): void {
    this.listeners.forEach(callback => callback(result));
  }
  
  // Start automatic update checking
  startAutoCheck(intervalMs: number = UPDATE_CHECK_INTERVAL): void {
    if (this.checkInterval) return;
    
    // Check immediately on start (if online)
    if (navigator.onLine) {
      this.checkForUpdates();
    }
    
    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      if (navigator.onLine) {
        this.checkForUpdates();
      }
    }, intervalMs);
    
    // Also check when coming online
    window.addEventListener('online', this.handleOnline);
  }
  
  stopAutoCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    window.removeEventListener('online', this.handleOnline);
  }
  
  private handleOnline = (): void => {
    setTimeout(() => {
      if (navigator.onLine) {
        this.checkForUpdates();
        // Also trigger a data sync when coming online
        syncManager.sync();
      }
    }, 2000);
  };
  
  // Check for app updates from server
  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      // Get latest version from server settings
      const { settings } = await offlineShopService.getSettings();
      
      // For now, we use a simple version check
      // In production, this would call a dedicated version endpoint
      const serverVersion = settings?.app_version || this.currentVersion;
      const serverBuildNumber = settings?.app_build_number || this.buildNumber;
      
      const hasUpdate = serverBuildNumber > this.buildNumber;
      const forceUpdate = settings?.force_app_update || false;
      
      const result: UpdateCheckResult = {
        hasUpdate,
        currentVersion: this.currentVersion,
        latestVersion: serverVersion,
        forceUpdate,
        releaseNotes: settings?.release_notes,
      };
      
      if (hasUpdate) {
        this.notifyListeners(result);
      }
      
      localStorage.setItem(LAST_UPDATE_CHECK_KEY, Date.now().toString());
      
      return result;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return {
        hasUpdate: false,
        currentVersion: this.currentVersion,
        latestVersion: this.currentVersion,
        forceUpdate: false,
      };
    }
  }
  
  // Sync all data when update is available
  async syncDataOnUpdate(): Promise<{ success: boolean; synced: string[] }> {
    if (!navigator.onLine) {
      return { success: false, synced: [] };
    }
    
    try {
      const shopId = localStorage.getItem('autofloy_current_shop_id');
      if (!shopId) {
        return { success: false, synced: [] };
      }
      
      // Perform full sync to get latest data
      const result = await syncManager.fullSync(shopId);
      
      return { success: result.success, synced: result.tables };
    } catch (error) {
      console.error('Failed to sync data on update:', error);
      return { success: false, synced: [] };
    }
  }
  
  // Apply update (for PWA - refresh the page)
  async applyPWAUpdate(): Promise<void> {
    // Clear service worker cache
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        // Unregister current service worker
        await registration.unregister();
        // Reload to get new version
        window.location.reload();
      }
    }
  }
  
  // Update version after successful update
  updateVersion(version: string, buildNumber: number): void {
    this.currentVersion = version;
    this.buildNumber = buildNumber;
    this.saveCurrentVersion();
  }
  
  // Check if settings have changed and need sync
  async checkSettingsSync(): Promise<boolean> {
    if (!navigator.onLine) return false;
    
    try {
      const { settings } = await offlineShopService.getSettings();
      if (settings) {
        // Settings synced successfully
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to sync settings:', error);
      return false;
    }
  }
  
  // Get last update check time
  getLastUpdateCheck(): Date | null {
    const timestamp = localStorage.getItem(LAST_UPDATE_CHECK_KEY);
    return timestamp ? new Date(parseInt(timestamp)) : null;
  }
}

// Export singleton instance
export const appUpdateService = new AppUpdateService();
