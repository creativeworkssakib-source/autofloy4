/**
 * Platform Detection Utility
 * 
 * Detects if the app is running as:
 * - PWA (Progressive Web App)
 * - APK (Android via Capacitor)
 * - EXE (Desktop via Electron)
 * - Browser (Regular web browser)
 * 
 * This determines the sync strategy:
 * - PWA/APK/EXE: Local-first, sync to server when online
 * - Browser: Server-first, use Supabase directly
 */

export type PlatformType = 'pwa' | 'apk' | 'exe' | 'browser';

interface PlatformInfo {
  type: PlatformType;
  isInstalled: boolean;
  isNative: boolean;
  useLocalFirst: boolean;
  name: string;
}

class PlatformDetector {
  private cachedPlatform: PlatformInfo | null = null;

  /**
   * Detect the current platform
   */
  detect(): PlatformInfo {
    if (this.cachedPlatform) {
      return this.cachedPlatform;
    }

    // Check for Electron (Desktop)
    if (this.isElectron()) {
      this.cachedPlatform = {
        type: 'exe',
        isInstalled: true,
        isNative: true,
        useLocalFirst: true,
        name: 'Desktop App',
      };
      return this.cachedPlatform;
    }

    // Check for Capacitor (Android/iOS)
    if (this.isCapacitor()) {
      this.cachedPlatform = {
        type: 'apk',
        isInstalled: true,
        isNative: true,
        useLocalFirst: true,
        name: 'Mobile App',
      };
      return this.cachedPlatform;
    }

    // Check for PWA (installed progressive web app)
    if (this.isPWA()) {
      this.cachedPlatform = {
        type: 'pwa',
        isInstalled: true,
        isNative: false,
        useLocalFirst: true,
        name: 'PWA',
      };
      return this.cachedPlatform;
    }

    // Default to browser
    this.cachedPlatform = {
      type: 'browser',
      isInstalled: false,
      isNative: false,
      useLocalFirst: false, // Browser uses server-first
      name: 'Browser',
    };
    return this.cachedPlatform;
  }

  /**
   * Check if running in Electron
   */
  private isElectron(): boolean {
    // Check for Electron-specific APIs
    if (typeof window !== 'undefined') {
      // Check for electron in user agent
      if (navigator.userAgent.toLowerCase().includes('electron')) {
        return true;
      }
      // Check for electron process
      if ((window as any).process?.type === 'renderer') {
        return true;
      }
      // Check for electron API
      if ((window as any).electron) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if running in Capacitor (Android/iOS app)
   */
  private isCapacitor(): boolean {
    if (typeof window !== 'undefined') {
      // Check for Capacitor global
      if ((window as any).Capacitor?.isNativePlatform?.()) {
        return true;
      }
      // Fallback check
      if ((window as any).Capacitor?.platform && (window as any).Capacitor.platform !== 'web') {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if running as PWA (installed progressive web app)
   */
  private isPWA(): boolean {
    if (typeof window !== 'undefined') {
      // Check display-mode media query (installed PWA)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      // iOS Safari specific check
      if ((navigator as any).standalone === true) {
        return true;
      }
      // Check if running in fullscreen mode
      if (window.matchMedia('(display-mode: fullscreen)').matches) {
        return true;
      }
      // Check for minimal-ui mode (some PWAs)
      if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if the app should use local-first sync strategy
   */
  shouldUseLocalFirst(): boolean {
    return this.detect().useLocalFirst;
  }

  /**
   * Check if the app is installed (PWA, APK, or EXE)
   */
  isInstalled(): boolean {
    return this.detect().isInstalled;
  }

  /**
   * Get the platform type
   */
  getPlatformType(): PlatformType {
    return this.detect().type;
  }

  /**
   * Get platform name for display
   */
  getPlatformName(): string {
    return this.detect().name;
  }

  /**
   * Clear cached platform (for testing)
   */
  clearCache(): void {
    this.cachedPlatform = null;
  }
}

// Export singleton instance
export const platformDetector = new PlatformDetector();

// Export helper functions
export const shouldUseLocalFirst = () => platformDetector.shouldUseLocalFirst();
export const isInstalled = () => platformDetector.isInstalled();
export const getPlatformType = () => platformDetector.getPlatformType();
export const getPlatformName = () => platformDetector.getPlatformName();
