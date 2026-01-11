/**
 * Capacitor Production Configuration
 * 
 * ⚠️ PRODUCTION BUILD এর জন্য এই ফাইলটা capacitor.config.ts হিসেবে ব্যবহার করুন
 * 
 * কিভাবে:
 * 1. capacitor.config.ts কে capacitor.config.dev.ts নাম দিন
 * 2. এই ফাইলটা capacitor.config.ts নাম দিন
 * 3. npm run build করুন
 * 4. npx cap sync করুন
 */

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e5d6a0c559f34540831c26b5a8ab5ed7',
  appName: 'Autofloy Shop',
  webDir: 'dist',
  // No server block = uses local bundled files = works offline
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#6366f1',
      showSpinner: false,
    },
  },
};

export default config;
