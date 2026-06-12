import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.app.appnexus',
  appName: 'AppNexus',
  webDir: 'dist',
  server: {
    url: 'https://61c63823-3472-48e3-a148-faed88715111.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
