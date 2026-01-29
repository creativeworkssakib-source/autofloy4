/**
 * Update Notification Component
 * 
 * Shows a notification when app updates are available.
 * Works with PWA, Capacitor APK, and Electron EXE.
 */

import { useEffect } from 'react';
import { appUpdateService } from '@/services/appUpdateService';

export const UpdateNotification = () => {
  // Silent background updates - no visible UI
  // Updates are handled automatically by GlobalUpdateNotification
  // This component now renders nothing
  
  useEffect(() => {
    // Subscribe to update notifications and auto-apply silently
    const unsubscribe = appUpdateService.subscribe(async (result) => {
      if (result.hasUpdate) {
        console.log('[UpdateNotification] Update available, applying silently...');
        try {
          // Sync data first
          await appUpdateService.syncDataOnUpdate();
          
          // Apply update silently
          if (appUpdateService.isPWA()) {
            await appUpdateService.applyPWAUpdate();
          } else {
            window.location.reload();
          }
        } catch (error) {
          console.error('[UpdateNotification] Silent update failed:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Return null - no visible notification
  return null;
};

export default UpdateNotification;
