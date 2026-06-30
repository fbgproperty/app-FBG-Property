import type { CapacitorConfig } from '@capacitor/cli';

// Cấu hình đóng gói app native (iOS/Android) bằng Capacitor.
// Web build (dist/) được bọc thành app thật. Xem BUILD-NATIVE.md.
const config: CapacitorConfig = {
  appId: 'vn.fbgproperty.app',
  appName: 'FBG Property',
  webDir: 'dist',
  backgroundColor: '#0f172a',
  server: {
    androidScheme: 'https',
    // Khi muốn app native trỏ thẳng web đã deploy (live-update), bỏ comment:
    // url: 'https://app.fbgproperty.vn', cleartext: false,
  },
  ios: { contentInset: 'always' },
  android: { allowMixedContent: false },
};

export default config;
