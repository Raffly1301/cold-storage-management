import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.csbsidp.app',
  appName: 'Cold Storage BSI DP',
  webDir: 'dist'
  server: {
    "androidScheme": "https"
}};

export default config;
