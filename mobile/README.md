# KARVAAN app (Android & iOS)

The app is a native shell (Capacitor 8) around the KARVAAN website. Every page,
login, upload and update comes from the site, so the app and the website are
always the same — fix something once and it's fixed everywhere.

## Test APK (Android)

`KARVAAN-test.apk` opens the dev server running on this PC over Wi-Fi
(the address is printed when you build, e.g. `http://192.168.1.3:3000`).

1. Keep `npm run dev` running in the project folder.
2. Phone and PC on the **same Wi-Fi**. If Windows asks whether Node.js may use
   the network, allow it on private networks.
3. Copy `KARVAAN-test.apk` to the phone, open it, allow "install unknown apps".

## Rebuild the APK

```bash
cd mobile
npm run apk                                    # → this PC's dev server
KARVAAN_URL=https://karvaan.in npm run apk     # → the live site, once deployed
```

Needs JDK 21 (Android Studio's bundled one works):
`JAVA_HOME="C:\Program Files\Android\Android Studio1\jbr"`.
The APK lands in `android/app/build/outputs/apk/debug/app-debug.apk`.

For the Play Store: open `android/` in Android Studio → Build → Generate Signed
App Bundle.

## iOS

The Xcode project is in `ios/`. Apple only allows iOS apps to be built on a Mac:
copy this `mobile/` folder to a Mac with Xcode, run `npm install && npx cap sync ios`,
then `npx cap open ios` and press Run (or Archive → TestFlight for testers).

## Icons & splash

`node mobile/scripts/icons.cjs` (from the project root) redraws the icon and
splash from the logo, then `npx capacitor-assets generate` here applies them.
