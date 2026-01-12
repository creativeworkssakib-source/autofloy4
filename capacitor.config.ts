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
