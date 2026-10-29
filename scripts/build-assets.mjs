// Builds assets/hero.svg, assets/hero-mobile.svg and assets/divider.svg.
// Pure SVG + CSS: no external fonts, images or scripts. Run: node scripts/build-assets.mjs
// Animations live inside `prefers-reduced-motion: no-preference`; the static state is the final frame.
import { writeFileSync, mkdirSync } from "node:fs";

const C = {
  bg: "#08080b",
  surface: "#101016",
  term: "#0c0c11",
  fg: "#f4f4f5",
  soft: "#c9c9d1",
  muted: "#9a9aa6",
  from: "#ff6a1a",
  to: "#ffb347",
  line: "rgba(255,255,255,0.08)",
  lineStrong: "rgba(255,255,255,0.14)",
};
const SANS = "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, 'Helvetica Neue', Arial, sans-serif";
const MONO = "ui-monospace, 'Geist Mono', SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

// Cinderhash mark (public/brand/logo-mark.svg on the site), viewBox 0 0 1921 2220.
const LOGO = "M795 1L0 488L1 1718L794 2219L1254 1954L1254 1411L790 1670L451 1463L440 754L794 541L794 913L1251 637L1254 261ZM1473 153L1470 173L1457 790L1197 790L791 1027L790 1543L1254 1285L1480 1285L1480 2063L1921 1798L1921 417Z";
const logo = (x, y, h, fill = C.fg) => {
  const s = h / 2220;
  return `<path transform="translate(${r(x)} ${r(y)}) scale(${s.toFixed(5)})" fill="${fill}" fill-rule="evenodd" d="${LOGO}"/>`;
};

const r = (n) => Math.round(n * 100) / 100;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Pointy-top hexagon, same orientation as the logo and the site grid.
function hex(cx, cy, rad) {
  const w = (Math.sqrt(3) * rad) / 2;
  return `M${r(cx)} ${r(cy - rad)}L${r(cx + w)} ${r(cy - rad / 2)}L${r(cx + w)} ${r(cy + rad / 2)}L${r(cx)} ${r(cy + rad)}L${r(cx - w)} ${r(cy + rad / 2)}L${r(cx - w)} ${r(cy - rad / 2)}Z`;
}

// Site hex grid tile (src/components/brand/hex-grid.tsx), R = 28.
const GR = 28;
const GW = Math.sqrt(3) * GR;
const GH = 3 * GR;
const TILE = `M${r(GW / 2)} 0L${r(GW)} ${GR / 2}L${r(GW)} ${1.5 * GR}L${r(GW / 2)} ${2 * GR}L0 ${1.5 * GR}L0 ${GR / 2}ZM${r(GW / 2)} ${2 * GR}L${r(GW / 2)} ${3 * GR}`;

const BASE_CSS = `
text{font-kerning:normal}
.sans{font-family:${SANS}}
.mono{font-family:${MONO}}
.fx{transform-box:fill-box;transform-origin:center}
.pk,.ring,.cur,.cover{opacity:0}
@keyframes enter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes appear{from{opacity:0}to{opacity:1}}
@keyframes float{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-12px) rotate(8deg)}}
@keyframes breathe{0%,100%{opacity:.65;transform:scale(1)}50%{opacity:1;transform:scale(1.07)}}
@keyframes ring{0%{opacity:.75;transform:scale(1)}70%,100%{opacity:0;transform:scale(1.85)}}
@keyframes packet{0%{stroke-dashoffset:5}55%,100%{stroke-dashoffset:-100}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes drift{to{transform:translate(${r(GW)}px,${GH}px)}}
@keyframes cursor{0%,99%{opacity:1}100%{opacity:0}}`;

function defs(id, w, h, extra = "") {
  return `<defs>
<linearGradient id="${id}-ember" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.from}"/><stop offset="1" stop-color="${C.to}"/></linearGradient>
<radialGradient id="${id}-glow"><stop offset="0" stop-color="${C.from}" stop-opacity=".22"/><stop offset=".55" stop-color="${C.from}" stop-opacity=".06"/><stop offset="1" stop-color="${C.from}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}-fade" cx=".5" cy=".42" r=".62"><stop offset=".25" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<pattern id="${id}-grid" width="${r(GW)}" height="${GH}" patternUnits="userSpaceOnUse"><path d="${TILE}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/></pattern>
<mask id="${id}-mask"><rect width="${w}" height="${h}" fill="url(#${id}-fade)"/></mask>
<clipPath id="${id}-clip"><rect width="${w}" height="${h}" rx="22"/></clipPath>
${extra}</defs>`;
}

// Background: card, drifting hex grid, glow, floating hexes.
function background(id, w, h, glow, floaters) {
  const grid = `<g mask="url(#${id}-mask)"><g class="drift"><rect x="${-r(GW)}" y="${-GH}" width="${r(w + 2 * GW)}" height="${h + 2 * GH}" fill="url(#${id}-grid)"/></g></g>`;
  const halo = `<circle class="fx breathe" cx="${glow[0]}" cy="${glow[1]}" r="${glow[2]}" fill="url(#${id}-glow)"/>`;
  const floats = floaters
    .map(([x, y, rad, dur, delay], i) => `<path class="fx float" style="animation-duration:${dur}s;animation-delay:-${delay}s" d="${hex(x, y, rad)}" fill="${C.from}" fill-opacity="${i % 2 ? 0.05 : 0.08}" stroke="${C.from}" stroke-opacity=".4" stroke-width="1"/>`)
    .join("");
  return `<rect width="${w}" height="${h}" rx="22" fill="${C.bg}"/>
<g clip-path="url(#${id}-clip)">${grid}${halo}${floats}</g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="21.5" fill="none" stroke="${C.lineStrong}"/>`;
}

function brandBlock(id, x, y, s) {
  const markH = 40 * s;
  const kicker = "SOFTWARE · SECURITY · MARKETING";
  const kFont = 12 * s;
  const kLen = kicker.length * kFont * 0.74;
  const kY = y + 64 * s;
  return `<g class="enter" style="animation-delay:.05s">
${logo(x, y, markH)}
<text class="sans" x="${r(x + 48 * s)}" y="${r(y + markH * 0.74)}" font-size="${r(26 * s)}" font-weight="600" letter-spacing="-.03em" fill="${C.fg}">Cinderhash</text>
</g>
<g class="enter" style="animation-delay:.15s">
<rect x="${x}" y="${r(kY)}" width="${r(kLen + 26 * s)}" height="${r(28 * s)}" rx="${r(14 * s)}" fill="${C.from}" fill-opacity=".08" stroke="${C.from}" stroke-opacity=".35"/>
<text class="mono" x="${r(x + 13 * s)}" y="${r(kY + 18.5 * s)}" font-size="${r(kFont)}" textLength="${r(kLen)}" lengthAdjust="spacing" fill="${C.to}">${kicker}</text>
</g>`;
}

function headline(id, x, y, size) {
  return `<g class="enter" style="animation-delay:.25s">
<text class="sans" x="${x}" y="${y}" font-size="${size}" font-weight="600" letter-spacing="-.04em" fill="${C.fg}">Automate your work.</text>
<text class="sans" x="${x}" y="${r(y + size * 1.14)}" font-size="${size}" font-weight="600" letter-spacing="-.04em" fill="url(#${id}-ember)">Focus on growth.</text>
</g>`;
}

// Terminal: commands are typed (a cover rect slides right in steps), outputs appear, cursor blinks at the end.
function terminal(x, y, w, font, lh) {
  const cw = font * 0.6;
  const bar = 30 * (font / 15);
  const pad = 18 * (font / 15);
  const rows = [
    { cmd: "whoami", out: [["Nazım Çeltekli", C.fg], [" · ", C.muted], ["Cinderhash", C.to]] },
    { cmd: "cat role", out: [["Network & Security", C.fg], [" · ", C.muted], ["software · automation", C.soft]] },
    { cmd: "cat focus", out: [["TCP/IP · ARP · MITM research · Scapy · Nmap", C.soft]] },
  ];
  const h = bar + pad + (rows.length * 2 + 1) * lh;
  const css = [];
  let t = 0.7;
  let body = "";
  let lineY = y + bar + pad + font * 0.9;
  const tx = x + pad;
  const cmdX = tx + 2 * cw;
  rows.forEach((row, i) => {
    const n = row.cmd.length;
    const typeDur = n * 0.075;
    const start = t;
    const typed = start + 0.35;
    const done = typed + typeDur;
    const shown = done + 0.25;
    const cmdW = n * cw;
    css.push(`.row${i}{animation:appear .01s linear ${r(start)}s both}`);
    css.push(`.cov${i}{opacity:1;animation:type${i} ${r(typeDur)}s steps(${n},end) ${r(typed)}s both}`);
    css.push(`@keyframes type${i}{from{transform:translateX(0)}to{transform:translateX(${r(cmdW)}px)}}`);
    css.push(`.cur${i}{animation:type${i} ${r(typeDur)}s steps(${n},end) ${r(typed)}s both,cursor ${r(shown - start)}s linear ${r(start)}s forwards}`);
    css.push(`.out${i}{animation:appear .15s ease-out ${r(shown)}s both}`);
    body += `<g class="row${i}"><text class="mono" x="${r(tx)}" y="${r(lineY)}" font-size="${font}" fill="${C.from}">$</text>
<text class="mono" x="${r(cmdX)}" y="${r(lineY)}" font-size="${font}" textLength="${r(cmdW)}" lengthAdjust="spacing" fill="${C.fg}">${row.cmd}</text>
<rect class="cover cov${i}" x="${r(cmdX)}" y="${r(lineY - font)}" width="${r(cmdW + 2)}" height="${r(font * 1.3)}" fill="${C.term}"/>
<rect class="cur cur${i}" x="${r(cmdX)}" y="${r(lineY - font * 0.82)}" width="${r(cw)}" height="${r(font * 1.05)}" fill="${C.from}"/></g>\n`;
    lineY += lh;
    const text = row.out.map(([s, fill]) => `<tspan fill="${fill}">${esc(s)}</tspan>`).join("");
    const len = row.out.reduce((sum, [s]) => sum + [...s].length, 0) * cw;
    body += `<text class="mono out${i}" x="${r(tx)}" y="${r(lineY)}" font-size="${font}" textLength="${r(len)}" lengthAdjust="spacing">${text}</text>\n`;
    lineY += lh;
    t = shown + 0.35;
  });
  css.push(`.last{animation:appear .01s linear ${r(t)}s both}`);
  css.push(`.blink{animation:blink 1.1s step-end ${r(t)}s infinite}`);
  body += `<g class="last"><text class="mono" x="${r(tx)}" y="${r(lineY)}" font-size="${font}" fill="${C.from}">$</text>
<rect class="blink" x="${r(cmdX)}" y="${r(lineY - font * 0.82)}" width="${r(cw)}" height="${r(font * 1.05)}" fill="${C.from}"/></g>`;
  const dots = [0, 1, 2].map((i) => `<circle cx="${r(x + pad + i * 16 * (font / 15))}" cy="${r(y + bar / 2)}" r="${r(4.5 * (font / 15))}" fill="${i === 0 ? C.from : "#2a2a33"}"/>`).join("");
  const frame = `<rect x="${x}" y="${y}" width="${w}" height="${r(h)}" rx="12" fill="${C.term}" stroke="${C.lineStrong}"/>
<path d="M${x} ${r(y + bar)}H${x + w}" stroke="${C.line}"/>${dots}
<text class="mono" x="${r(x + w - pad)}" y="${r(y + bar / 2 + 4 * (font / 15))}" font-size="${r(11 * (font / 15))}" text-anchor="end" fill="${C.muted}">nazim@cinderhash: ~</text>`;
  return { svg: `<g class="enter" style="animation-delay:.35s">${frame}\n${body}</g>`, css: css.join("\n"), h };
}

// Network topology: hex nodes, links, packets travelling along links, pulsing rings.
const NODES = [
  { id: "hub", x: 930, y: 255, rad: 36 },
  { id: "TCP/IP", x: 785, y: 128, rad: 20, lx: 0, ly: -30 },
  { id: "ARP", x: 1075, y: 118, rad: 18, lx: 0, ly: -28 },
  { id: "SCAPY", x: 1112, y: 292, rad: 20, lx: 0, ly: 40 },
  { id: "NMAP", x: 1008, y: 420, rad: 18, lx: 0, ly: 38 },
  { id: "PYTHON", x: 822, y: 398, rad: 18, lx: 0, ly: 38 },
  { id: "C/C++", x: 728, y: 262, rad: 16, lx: 0, ly: 36 },
];
const LINKS = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 6], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]];

function topology(id, ox, oy, s) {
  const P = NODES.map((n) => ({ ...n, x: ox + (n.x - 930) * s, y: oy + (n.y - 255) * s, rad: n.rad * s }));
  const links = LINKS.map(([a, b]) => `M${r(P[a].x)} ${r(P[a].y)}L${r(P[b].x)} ${r(P[b].y)}`);
  const base = links.map((d) => `<path d="${d}" stroke="rgba(255,255,255,0.11)" stroke-width="1.25"/>`).join("");
  const packets = links
    .map((d, i) => {
      const dur = 2.6 + (i % 4) * 0.45;
      const delay = (i * 0.37) % dur;
      const rev = i % 3 === 1;
      return `<path class="pk" pathLength="100" d="${d}" stroke="${i % 2 ? C.to : C.from}" stroke-width="${r(3 * Math.max(s, 0.8))}" stroke-linecap="round" stroke-dasharray="5 200" style="animation-duration:${r(dur)}s;animation-delay:-${r(delay)}s${rev ? ";animation-direction:reverse" : ""}"/>`;
    })
    .join("");
  const nodes = P.map((n, i) => {
    const ring = `<path class="fx ring" style="animation-delay:${r(i * 0.45)}s" d="${hex(n.x, n.y, n.rad)}" fill="none" stroke="${C.from}" stroke-width="1.25"/>`;
    const body = `<path d="${hex(n.x, n.y, n.rad)}" fill="${C.surface}" stroke="${i === 0 ? `url(#${id}-ember)` : C.from}" stroke-opacity="${i === 0 ? 1 : 0.6}" stroke-width="${i === 0 ? 2 : 1.25}"/>`;
    if (i === 0) {
      const h = n.rad * 1.02;
      return `${ring}${body}${logo(n.x - (h * 1921) / 2220 / 2, n.y - h / 2, h)}`;
    }
    const dot = `<path d="${hex(n.x, n.y, n.rad * 0.34)}" fill="${C.from}" fill-opacity=".85"/>`;
    const label = `<text class="mono" x="${r(n.x + n.lx * s)}" y="${r(n.y + n.ly * s)}" font-size="${r(11 * Math.max(s, 0.9))}" letter-spacing=".12em" text-anchor="middle" fill="${C.muted}">${esc(n.id)}</text>`;
    return `${ring}${body}${dot}${label}`;
  }).join("\n");
  return `<g fill="none">${base}</g>\n<g fill="none">${packets}</g>\n${nodes}`;
}

function svgDoc({ id, w, h, title, desc, css, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="${id}-t ${id}-d">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
<style>${BASE_CSS}
@media (prefers-reduced-motion:no-preference){
.enter{animation:enter .7s cubic-bezier(.16,1,.3,1) both}
.float{animation:float 11s ease-in-out infinite}
.breathe{animation:breathe 8s ease-in-out infinite}
.drift{animation:drift 36s linear infinite}
.pk{opacity:1;animation:packet 3s linear infinite}
.ring{animation:ring 3.2s ease-out infinite}
${css}
}
</style>
${body}
</svg>
`;
}

const TITLE = "Cinderhash — Nazım Çeltekli";
const DESC = "Cinderhash: Software · Security · Marketing. Automate your work. Focus on growth. Terminal: whoami → Nazım Çeltekli · Cinderhash; role → Network & Security; focus → TCP/IP, ARP, MITM research, Scapy, Nmap. An animated network of hexagon nodes with packets flowing between them.";

function hero() {
  const id = "h";
  const w = 1200;
  const h = 520;
  const term = terminal(56, 288, 560, 15, 21);
  const body = [
    defs(id, w, h),
    background(id, w, h, [930, 255, 300], [
      [640, 70, 14, 12, 2],
      [470, 112, 9, 10, 5],
      [1160, 58, 16, 13, 7],
      [1168, 478, 11, 9, 3],
      [690, 470, 12, 14, 9],
      [990, 58, 8, 10, 4],
    ]),
    brandBlock(id, 56, 46, 1),
    headline(id, 54, 206, 46),
    term.svg,
    `<g class="enter" style="animation-delay:.45s">${topology(id, 930, 255, 1)}
<text class="mono" x="1150" y="494" font-size="11" letter-spacing=".14em" text-anchor="end" fill="${C.muted}" fill-opacity=".8">ISOLATED LAB NETWORK</text></g>`,
  ].join("\n");
  return svgDoc({ id, w, h, title: TITLE, desc: DESC, css: term.css, body });
}

function heroMobile() {
  const id = "m";
  const w = 600;
  const h = 830;
  const term = terminal(30, 562, 540, 18, 26);
  const body = [
    defs(id, w, h),
    background(id, w, h, [300, 400, 230], [
      [540, 70, 16, 12, 2],
      [560, 300, 10, 10, 5],
      [44, 520, 12, 13, 7],
      [470, 520, 9, 9, 3],
    ]),
    brandBlock(id, 32, 40, 1.15),
    headline(id, 30, 210, 48),
    `<g class="enter" style="animation-delay:.45s">${topology(id, 300, 412, 0.56)}</g>`,
    term.svg,
  ].join("\n");
  return svgDoc({ id, w, h, title: TITLE, desc: DESC, css: term.css, body });
}

function divider() {
  const id = "d";
  // Narrow viewBox + non-scaling line strokes: stays visible when the README column shrinks to ~360 px.
  const w = 800;
  const h = 40;
  const cy = h / 2;
  const mid = w / 2;
  const small = [[110, 3.5], [200, 5], [290, 3.5], [510, 3.5], [600, 5], [690, 3.5]]
    .map(([x, rad], i) => `<path class="fx pop" style="animation-delay:${r(i * 0.4)}s" d="${hex(x, cy, rad)}" fill="${C.from}" fill-opacity=".25" stroke="${C.from}" stroke-width="1.25"/>`)
    .join("");
  const body = `<defs>
<linearGradient id="d-l" x1="24" x2="${mid - 16}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.from}" stop-opacity="0"/><stop offset="1" stop-color="${C.from}"/></linearGradient>
<linearGradient id="d-r" x1="${mid + 16}" x2="${w - 24}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.to}"/><stop offset="1" stop-color="${C.to}" stop-opacity="0"/></linearGradient>
<linearGradient id="d-e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.from}"/><stop offset="1" stop-color="${C.to}"/></linearGradient>
</defs>
<path d="M24 ${cy}H${mid - 16}" stroke="url(#d-l)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
<path d="M${mid + 16} ${cy}H${w - 24}" stroke="url(#d-r)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
<path class="pk" pathLength="100" d="M${mid - 15} ${cy}H24" stroke="${C.from}" stroke-width="4" stroke-linecap="round" stroke-dasharray="5 200" style="animation-duration:3.6s"/>
<path class="pk" pathLength="100" d="M${mid + 15} ${cy}H${w - 24}" stroke="${C.to}" stroke-width="4" stroke-linecap="round" stroke-dasharray="5 200" style="animation-duration:3.6s"/>
${small}
<path class="fx ring" style="animation-duration:3.6s" d="${hex(mid, cy, 14)}" fill="none" stroke="${C.from}" stroke-width="1.5"/>
<path class="fx spin" d="${hex(mid, cy, 14)}" fill="${C.from}" fill-opacity=".14" stroke="url(#d-e)" stroke-width="2"/>
<path d="${hex(mid, cy, 6)}" fill="url(#d-e)"/>`;
  const css = `@keyframes pop{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:1;transform:scale(1.35)}}
.pop{animation:pop 4.8s ease-in-out infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.spin{animation:spin 24s linear infinite}`;
  return svgDoc({ id, w, h, title: "Section divider", desc: "Hexagon divider in Cinderhash orange with packets travelling outward.", css, body });
}

mkdirSync(new URL("../assets/", import.meta.url), { recursive: true });
for (const [name, svg] of [["hero.svg", hero()], ["hero-mobile.svg", heroMobile()], ["divider.svg", divider()]]) {
  writeFileSync(new URL(`../assets/${name}`, import.meta.url), svg);
  console.log(name, `${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`);
}
