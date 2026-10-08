// Renders the KARVAAN app icon + splash (and the website's favicon / home-screen
// icons) from the logo mark. Run from the project root: node mobile/scripts/icons.cjs
const sharp = require("sharp");
const path = require("path");
const root = path.join(__dirname, "..", "..");
const INK = "#070708", IVORY = "#ece8df", EMBER = "#e4572e";

// The three-chevron convoy mark (viewBox 36×24), placed at (x, y) with width w.
const mark = (x, y, w) => {
  const s = w / 36;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M2 3h6l8 9-8 9H2l8-9Z" fill="${IVORY}"/>
    <path d="M13 3h5l8 9-8 9h-5l8-9Z" fill="${IVORY}" opacity=".55"/>
    <path d="M23 3h4l8 9-8 9h-4l8-9Z" fill="${EMBER}"/></g>`;
};
const svg = (w, h, body, bg = INK) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ""}${body}</svg>`);
// Mark centred in a square of size n, taking `share` of its width.
const centred = (n, share) => { const w = n * share, h = (w / 36) * 24; return mark((n - w) / 2, (n - h) / 2, w); };
const wordmark = (cx, y, size) => `<text x="${cx}" y="${y}" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="${size}" letter-spacing="${size * 0.12}" fill="${IVORY}">KARVAAN</text>`;

const out = async (buf, file, size) => { let img = sharp(buf); if (size) img = img.resize(size, size); await img.png().toFile(path.join(root, file)); console.log("wrote", file); };

(async () => {
  // App (Capacitor assets): full icon, adaptive foreground/background, splash.
  await out(svg(1024, 1024, centred(1024, 0.62)), "mobile/assets/icon-only.png");
  await out(svg(1024, 1024, centred(1024, 0.42), null), "mobile/assets/icon-foreground.png");
  await out(svg(1024, 1024, ""), "mobile/assets/icon-background.png");
  const splash = (bg) => svg(2732, 2732, mark((2732 - 520) / 2, 1366 - 300, 520) + wordmark(1366, 1366 + 170, 150), bg);
  await out(splash(INK), "mobile/assets/splash.png");
  await out(splash(INK), "mobile/assets/splash-dark.png");
  // Website: favicon + home-screen icons (Next file conventions).
  await out(svg(512, 512, centred(512, 0.62)), "app/icon.png");
  await out(svg(180, 180, centred(180, 0.62)), "app/apple-icon.png");
  await out(svg(512, 512, centred(512, 0.62)), "public/icon-512.png");
  await out(svg(512, 512, centred(512, 0.62)), "public/icon-192.png", 192);
})();
