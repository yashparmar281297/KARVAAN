// Writes capacitor.config.json. The app is a native shell around the KARVAAN
// website, so it needs the site's address:
//   KARVAAN_URL=https://karvaan.in npm run apk        (live site)
//   npm run apk                                       (this PC's dev server on the Wi-Fi)
import { networkInterfaces } from "node:os";
import { writeFileSync } from "node:fs";

const lanIp = () => {
  for (const list of Object.values(networkInterfaces()))
    for (const n of list ?? []) if (n.family === "IPv4" && !n.internal && /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))/.test(n.address)) return n.address;
  return "10.0.2.2"; // Android emulator → host PC
};

const url = (process.env.KARVAAN_URL || `http://${lanIp()}:${process.env.KARVAAN_PORT || 3000}`).replace(/\/$/, "");
const host = new URL(url).hostname;

const config = {
  appId: "in.karvaan.app",
  appName: "KARVAAN",
  webDir: "www",
  backgroundColor: "#070708",
  server: {
    url,
    cleartext: url.startsWith("http://"),
    androidScheme: "https",
    allowNavigation: [host],
    errorPath: "error.html",
  },
  android: { backgroundColor: "#070708", allowMixedContent: url.startsWith("http://") },
  ios: { backgroundColor: "#070708", contentInset: "always", scheme: "KARVAAN" },
  plugins: {
    SplashScreen: { launchShowDuration: 1200, launchAutoHide: true, backgroundColor: "#070708", showSpinner: false, androidScaleType: "CENTER_CROP" },
    SystemBars: { insetsHandling: "css", style: "DARK" },
  },
};
writeFileSync(new URL("../capacitor.config.json", import.meta.url), JSON.stringify(config, null, 2) + "\n");
writeFileSync(new URL("../www/config.js", import.meta.url), `window.KARVAAN_URL = ${JSON.stringify(url)};\n`);
console.log(`KARVAAN app → ${url}`);
