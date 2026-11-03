// Renders the profile's lock screen: a header, one glass notification per
// app, and the lock-screen bottom row. Every piece is its own SVG so each
// one can be a separate link in the README (links inside an <img> SVG
// don't work). Run: node scripts/render.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets/src');
const OUT = join(ROOT, 'assets');
mkdirSync(OUT, { recursive: true });

const W = 900;                 // every piece shares this width, shown at 600px in the README
const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', Inter, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const dataUri = (file) => {
  const mime = file.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  return `data:${mime};base64,${readFileSync(join(SRC, file)).toString('base64')}`;
};

/* ------------------------------------------------------------
   The wallpaper: indigo glass petals on a 900 x 1700 canvas.
   Each piece shows its own slice of it, so together they read
   as one lock screen.
   ------------------------------------------------------------ */
function wallpaperDefs(p) {
  return `
    <linearGradient id="${p}base" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stop-color="#0b1036"/><stop offset=".45" stop-color="#121a52"/><stop offset="1" stop-color="#0a0e2c"/>
    </linearGradient>
    <radialGradient id="${p}glowA" cx=".78" cy=".2" r=".45"><stop offset="0" stop-color="#96b9ff" stop-opacity=".42"/><stop offset="1" stop-color="#96b9ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}glowB" cx=".2" cy=".62" r=".5"><stop offset="0" stop-color="#5f86ff" stop-opacity=".32"/><stop offset="1" stop-color="#5f86ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}glowC" cx=".5" cy="1.02" r=".6"><stop offset="0" stop-color="#2b3f9e" stop-opacity=".9"/><stop offset="1" stop-color="#2b3f9e" stop-opacity="0"/></radialGradient>
    <linearGradient id="${p}petal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#b9caff" stop-opacity=".55"/><stop offset=".45" stop-color="#6e8cf0" stop-opacity=".2"/><stop offset=".8" stop-color="#1e2878" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${p}petalB" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c9d4ff" stop-opacity=".5"/><stop offset=".5" stop-color="#7a92ee" stop-opacity=".16"/><stop offset=".85" stop-color="#1e2878" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${p}rimLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#e6ecff" stop-opacity="0"/><stop offset=".5" stop-color="#e6ecff" stop-opacity=".55"/><stop offset="1" stop-color="#e6ecff" stop-opacity="0"/>
    </linearGradient>`;
}
function wallpaper(p) {
  const petals = [
    [120, 520, 820, 330, -24, 'petal'],
    [860, 160, 760, 300, 32, 'petalB'],
    [420, 1180, 700, 260, -8, 'petal'],
    [60, 40, 520, 200, 18, 'petalB'],
    [820, 980, 640, 250, -38, 'petal'],
    [300, 1560, 760, 280, 14, 'petalB'],
  ];
  return `
    <rect width="900" height="1700" fill="url(#${p}base)"/>
    <rect width="900" height="1700" fill="url(#${p}glowA)"/>
    <rect width="900" height="1700" fill="url(#${p}glowB)"/>
    <rect width="900" height="1700" fill="url(#${p}glowC)"/>
    ${petals.map(([cx, cy, rx, ry, rot, g]) => `
      <g transform="rotate(${rot} ${cx} ${cy})">
        <ellipse cx="${cx}" cy="${cy}" rx="${rx / 2}" ry="${ry / 2}" fill="url(#${p}${g})"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${rx / 2}" ry="${ry / 2}" fill="none" stroke="url(#${p}rimLine)" stroke-width="2"/>
      </g>`).join('')}`;
}

/* A glass platter: blurred wallpaper slice, tint, rim of light, sheen. */
function glassDefs(p) {
  return `
    <filter id="${p}blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="${p}shadow" x="-20%" y="-40%" width="140%" height="200%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#050820" flood-opacity=".22"/></filter>
    <linearGradient id="${p}tint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity=".09"/></linearGradient>
    <linearGradient id="${p}rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".3" stop-color="#fff" stop-opacity=".14"/>
      <stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity=".6"/>
    </linearGradient>
    <radialGradient id="${p}sheen" cx=".22" cy="0" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".24"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
}
function platter(p, x, y, w, h, r, slice, opacity = 1) {
  const id = `${p}c${x}${y}${w}`.replace(/\./g, '');
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#0b1036" filter="url(#${p}shadow)"/>
      <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>
      <g clip-path="url(#${id})">
        <g filter="url(#${p}blur)" transform="translate(0 ${-slice})">${wallpaper(p)}</g>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${p}tint)"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${p}sheen)"/>
      </g>
      <rect x="${x + 0.75}" y="${y + 0.75}" width="${w - 1.5}" height="${h - 1.5}" rx="${r - 0.75}" fill="none" stroke="url(#${p}rim)" stroke-width="1.5"/>
    </g>`;
}
function iconTile(x, y, s, icon) {
  const id = `ic${x}${y}`;
  const clip = `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.225}"/></clipPath>`;
  if (icon.tile) {
    const pad = s * (icon.pad || 0);
    return `${clip}<g clip-path="url(#${id})"><rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${icon.tile}"/>
      <image href="${dataUri(icon.file)}" x="${x + pad}" y="${y + pad}" width="${s - pad * 2}" height="${s - pad * 2}" preserveAspectRatio="xMidYMid meet"/></g>`;
  }
  return `${clip}<image href="${dataUri(icon.file)}" x="${x}" y="${y}" width="${s}" height="${s}" clip-path="url(#${id})"/>
    <rect x="${x + 0.5}" y="${y + 0.5}" width="${s - 1}" height="${s - 1}" rx="${s * 0.225}" fill="none" stroke="#fff" stroke-opacity=".22"/>`;
}
const svg = (w, h, title, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" font-family="${FONT}"><title>${esc(title)}</title>${body}</svg>\n`;

/* ------------------------------------------------------------
   Header: status bar, Dynamic Island, name and the 9:41 clock
   ------------------------------------------------------------ */
function header() {
  const H = 560, p = 'h';
  const body = `
    <defs>${wallpaperDefs(p)}${glassDefs(p)}
      <clipPath id="screen"><rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="44"/></clipPath>
      <linearGradient id="digits" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".97"/><stop offset=".42" stop-color="#e1e8ff" stop-opacity=".74"/>
        <stop offset=".8" stop-color="#bccbff" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity=".6"/>
      </linearGradient>
      <filter id="lift" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#050820" flood-opacity=".5"/></filter>
    </defs>
    <rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="44" fill="#0b1036" filter="url(#${p}shadow)"/>
    <g clip-path="url(#screen)">${wallpaper(p)}</g>
    <rect x="12.75" y="12.75" width="${W - 25.5}" height="${H - 25.5}" rx="43.25" fill="none" stroke="url(#${p}rim)" stroke-width="1.5"/>

    <!-- status bar -->
    <text x="62" y="62" fill="#fff" font-size="21" font-weight="600">Singapore</text>
    <g transform="translate(${W - 118} 46)" fill="#fff">
      <rect x="0" y="12" width="4" height="5" rx="1"/><rect x="6" y="9" width="4" height="8" rx="1"/><rect x="12" y="5" width="4" height="12" rx="1"/><rect x="18" y="1" width="4" height="16" rx="1"/>
      <rect x="32" y="1" width="30" height="15" rx="4.5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6"/><rect x="35" y="4" width="20" height="9" rx="2"/><rect x="63.5" y="6" width="2.2" height="5" rx="1" fill-opacity=".55"/>
    </g>

    <!-- Dynamic Island with a Live Activity -->
    <rect x="${W / 2 - 128}" y="34" width="256" height="44" rx="22" fill="#000"/>
    ${iconTile(W / 2 - 114, 41, 30, { file: 'apptimelock.png' })}
    <text x="${W / 2 - 74}" y="62" fill="#fff" font-size="15" font-weight="600">AppTimeLock 2.1</text>
    <circle cx="${W / 2 + 80}" cy="56" r="4.5" fill="#34c759"/>
    <text x="${W / 2 + 92}" y="62" fill="#34c759" font-size="15" font-weight="600">Live</text>

    <!-- date line, clock and widget line -->
    <text x="${W / 2}" y="152" text-anchor="middle" fill="#fff" fill-opacity=".9" font-size="27" font-weight="600" letter-spacing="-.3">Muhammad Farhan Almasyhur</text>
    <text x="${W / 2}" y="350" text-anchor="middle" font-size="236" font-weight="700" letter-spacing="-9" fill="url(#digits)" stroke="#fff" stroke-opacity=".45" stroke-width="1.5" filter="url(#lift)">9:41</text>
    <text x="${W / 2}" y="410" text-anchor="middle" fill="#fff" font-size="25" font-weight="500" fill-opacity=".92">iOS engineer in Singapore. I build apps for iPhone and iPad.</text>

    <!-- hint -->
    <g transform="translate(${W / 2} 482)">
      <rect x="-170" y="-24" width="340" height="44" rx="22" fill="#fff" fill-opacity=".12" stroke="#fff" stroke-opacity=".28"/>
      <text x="0" y="5" text-anchor="middle" fill="#fff" font-size="17" font-weight="500">Tap a notification to open it</text>
    </g>`;
  return svg(W, H, 'Lock screen: Muhammad Farhan Almasyhur, iOS engineer in Singapore. 9:41.', body);
}

/* ------------------------------------------------------------
   Notifications
   ------------------------------------------------------------ */
function notification({ file, app, meta, title, text, icon, stack = 0, slice }) {
  const p = `n${file.replace(/\W/g, '')}`;
  const m = 24, ph = 132, stackGap = 11;
  const H = m * 2 + ph + stack * stackGap;
  const x = m, y = m, w = W - m * 2;
  const behind = [];
  for (let i = stack; i >= 1; i--) {
    const inset = 26 * i;
    behind.push(platter(p, x + inset, y + i * stackGap, w - inset * 2, ph, 30, slice + 40 * i, 0.42 - 0.14 * (i - 1)));
  }
  const body = `
    <defs>${wallpaperDefs(p)}${glassDefs(p)}</defs>
    ${behind.join('')}
    ${platter(p, x, y, w, ph, 30, slice)}
    ${iconTile(x + 22, y + (ph - 76) / 2, 76, icon)}
    <text x="${x + 120}" y="${y + 40}" fill="#fff" fill-opacity=".72" font-size="19" font-weight="600">${esc(app)}</text>
    <text x="${x + w - 24}" y="${y + 40}" text-anchor="end" fill="#fff" fill-opacity=".62" font-size="18">${esc(meta)}</text>
    <text x="${x + 120}" y="${y + 72}" fill="#fff" font-size="24" font-weight="650" letter-spacing="-.2">${esc(title)}</text>
    <text x="${x + 120}" y="${y + 104}" fill="#fff" fill-opacity=".9" font-size="20">${esc(text)}</text>`;
  writeFileSync(join(OUT, `${file}.svg`), svg(W, H, `${app}: ${title}. ${text}`, body));
}

/* Lock screen bottom: two round glass buttons and the home bar */
function roundButton(file, label, glyph, slice) {
  const p = `b${file.replace(/\W/g, '')}`;
  const S = 150, r = 52, c = S / 2;
  const body = `
    <defs>${wallpaperDefs(p)}${glassDefs(p)}</defs>
    ${platter(p, c - r, c - r, r * 2, r * 2, r, slice)}
    <g transform="translate(${c - 18} ${c - 18})" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>`;
  writeFileSync(join(OUT, `${file}.svg`), svg(S, S, label, body));
}
function homeBar() {
  const w = 440, h = 140;
  const body = `
    <text x="${w / 2}" y="62" text-anchor="middle" fill="#6e7681" font-size="24" font-weight="600">Swipe up to open my website</text>
    <rect x="${w / 2 - 92}" y="84" width="184" height="8" rx="4" fill="#6e7681"/>`;
  writeFileSync(join(OUT, 'home-bar.svg'), svg(w, h, 'Swipe up to open my website', body));
}

/* ------------------------------------------------------------ */
writeFileSync(join(OUT, 'header.svg'), header());

const items = [
  { file: 'n-apptimelock', icon: { file: 'apptimelock.png' }, app: 'AppTimeLock', meta: 'now',
    title: 'Version 2.1 is on the App Store', text: 'Lock any app after a time limit, or make yourself wait first.' },
  { file: 'n-profometer', icon: { file: 'profometer.png' }, app: 'Profometer', meta: 'Screening Eagle',
    title: 'I build the iPad app for concrete scanners', text: 'Rebar and corrosion maps live over Bluetooth. Zoom: 8× to 200×.' },
  { file: 'n-sydtransport', icon: { file: 'sydbus.png' }, app: 'SydTransport', meta: 'TestFlight',
    title: 'Sydney, live.', text: 'Trains, metro, buses and ferries, and it follows your trip.' },
  { file: 'n-sgtransport', icon: { file: 'sgtransport.png' }, app: 'SGTransport', meta: 'in testing',
    title: 'Every bus stop in Singapore, live', text: 'Arrivals, MRT alerts and a buzz before your stop.' },
  { file: 'n-eureka', icon: { file: 'eureka.png' }, app: 'Hi Eureka', meta: '4.7★',
    title: 'An AI that kids can ask anything', text: 'I built it from an empty project to the App Store.' },
  { file: 'n-more', icon: { file: 'stellkey.png' }, app: 'Stellkey, Lucky Charm and Unibuzz', meta: '3 more', stack: 2,
    title: 'More apps from Mediatropy and university', text: 'Habits for kids, daily horoscopes, a forum for students.' },
  { file: 'n-education', icon: { file: 'ui.svg', tile: '#0b1a4a', pad: 0.14 }, app: 'Universitas Indonesia', meta: '2022', stack: 2,
    title: 'Computer Engineering, 3.94 GPA', text: 'Apple Developer Academy, Dicoding iOS Developer Expert.' },
];
items.forEach((it, i) => notification({ ...it, slice: 560 + i * 150 }));

roundButton('b-linkedin', 'LinkedIn',
  `<rect x="1" y="1" width="34" height="34" rx="8"/><path d="M10 15v11M10 10v.5M16 26v-11M16 19.5c0-3 2-4.5 4.5-4.5S26 16.5 26 19.5V26"/>`, 1500);
roundButton('b-email', 'Email',
  `<rect x="0" y="5" width="36" height="26" rx="5"/><path d="M2 8l16 12 16-12"/>`, 1540);
homeBar();

console.log('rendered', items.length + 4, 'images into assets/');
