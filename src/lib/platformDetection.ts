/**
 * Platform Detection Utility
 * 
 * Detects if the app is running as:
 * - PWA (Progressive Web App)
 * - APK (Android via Capacitor)
 * - EXE (Desktop via Electron)
 * - Browser (Regular web browser)
 */

export type PlatformType = 'pwa' | 'apk' | 'exe' | 'browser';

interface PlatformInfo {
  type: PlatformType;
  isInstalled: boolean;
  isNative: boolean;
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
        name: 'PWA',
      };
      return this.cachedPlatform;
    }

    // Default to browser
    this.cachedPlatform = {
      type: 'browser',
      isInstalled: false,
      isNative: false,
      name: 'Browser',
    };
    return this.cachedPlatform;
  }

  /**
   * Check if running in Electron
   */
  private isElectron(): boolean {
    if (typeof window !== 'undefined') {
      if (navigator.userAgent.toLowerCase().includes('electron')) {
        return true;
      }
      if ((window as any).process?.type === 'renderer') {
        return true;
      }
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
      if ((window as any).Capacitor?.isNativePlatform?.()) {
        return true;
      }
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
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      if ((navigator as any).standalone === true) {
        return true;
      }
      if (window.matchMedia('(display-mode: fullscreen)').matches) {
        return true;
      }
      if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        return true;
      }
    }
    return false;
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
export const isInstalled = () => platformDetector.isInstalled();
export const getPlatformType = () => platformDetector.getPlatformType();
export const getPlatformName = () => platformDetector.getPlatformName();
