# FBG Property — Đóng gói app native (iOS / Android)

App đã là **PWA cài được** (Thêm vào màn hình chính / Install). Để có **bản app-store thật** (`.ipa` / `.apk`), dùng **Capacitor** bọc bản web `dist/`.

> **Trạng thái hiện tại (đã dựng sẵn):**
> - ✅ Đã cài Capacitor + **tạo khung `android/` và `ios/`** (bước 1–2 bên dưới đã xong).
> - ✅ Đã bật **live-update** (`server.url = https://app.fbgproperty.vn`) → app native luôn hiển thị bản web mới nhất, sửa web là app tự cập nhật, không cần nộp lại kho.
> - ⏳ Còn lại: cài **toolchain** trên máy Mac + mở IDE xuất file + tài khoản nhà phát triển (bước 3).

> Cần máy có **Xcode** (iOS) và/hoặc **Android Studio** (Android) — không build được trong môi trường CI thường.

## 1. Cài Capacitor (1 lần)
```bash
npm i @capacitor/core
npm i -D @capacitor/cli
npm i @capacitor/ios @capacitor/android
```
(Cấu hình đã có sẵn ở `capacitor.config.ts` — appId `vn.fbgproperty.app`, appName "FBG Property".)

## 2. Thêm nền tảng
```bash
npm run build            # tạo dist/
npx cap add ios
npx cap add android
npx cap sync
```

## 3. Mở & build
```bash
npx cap open ios         # → Xcode: Archive → xuất .ipa (cần Apple Developer)
npx cap open android     # → Android Studio: Build → Generate Signed APK/AAB
```

## 4. Cập nhật về sau
Mỗi lần web đổi:
```bash
npm run build && npx cap sync
```

## Hai chế độ
- **Đóng gói tĩnh** (mặc định): app chứa bản web trong gói — chạy offline shell, cập nhật qua app-store.
- **Live web**: mở `server.url = 'https://app.fbgproperty.vn'` trong `capacitor.config.ts` → app native luôn hiển thị bản web mới nhất (cập nhật tức thì, không cần submit lại store).

## Phiên bản hiện có
- **Web** — https://app.fbgproperty.vn
- **PWA** — cài từ trình duyệt (mobile + desktop) ✅ đã có
- **iOS / Android native** — build theo hướng dẫn trên (cần toolchain).
