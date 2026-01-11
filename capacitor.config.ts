import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e5d6a0c559f34540831c26b5a8ab5ed7',
  appName: 'Autofloy Shop',
  webDir: 'dist',
  // For production builds, remove the server block entirely
  // The app will use the local bundled files which work offline
  server: {
    // For development/testing with live reload:
    url: 'https://e5d6a0c5-59f3-4540-831c-26b5a8ab5ed7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#6366f1',
      showSpinner: false,
    },
  },
};

export default config;
