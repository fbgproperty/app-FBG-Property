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
    // Live-update: app native luôn tải bản web mới nhất (sửa web → app tự cập nhật, không cần nộp lại kho).
    url: 'https://app.fbgproperty.vn',
    cleartext: false,
  },
  ios: { contentInset: 'always' },
  android: { allowMixedContent: false },
};

export default config;
