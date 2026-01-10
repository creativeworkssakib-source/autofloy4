import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.autofloy.offlineshop',
  appName: 'Autofloy Offline Shop',
  webDir: 'dist',
  server: {
    url: 'https://d767a1d5-e35f-4b16-bc56-67e62e146598.lovableproject.com/offline-shop?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#10B981"
    }
  }
};

export default config;
