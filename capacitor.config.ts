import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2be69bbb95e0450f83ebed9755c45ce2',
  appName: 'birdco-vendor-hub',
  webDir: 'dist',
  server: {
    url: 'https://2be69bbb-95e0-450f-83eb-ed9755c45ce2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
