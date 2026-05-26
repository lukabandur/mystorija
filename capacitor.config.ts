import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mystorija.app',
  appName: 'Mystorija',
  webDir: 'out',
  server: {
    url: 'https://mystorija.com',
    cleartext: false
  }
};

export default config;
