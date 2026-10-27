// Builds compositions/app.html (and tools/measure.html) from the captured app and the sources in src/.
// Run from the project root:  node tools/build.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const A = JSON.parse(rd("assets/data/predict-A.json"));
const B = JSON.parse(rd("assets/data/predict-B.json"));
const geomPath = path.join(ROOT, "assets/data/geom.json");
const GEOM = fs.existsSync(geomPath) ? JSON.parse(fs.readFileSync(geomPath, "utf8")) : {};

const INFO = `<svg class="effects-info-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm.75 4.75a.75.75 0 10-1.5 0v.5a.75.75 0 001.5 0v-.5zm0 3.5a.75.75 0 00-1.5 0v3a.75.75 0 001.5 0v-3z" clip-rule="evenodd"></path></svg>`;
const THRESHOLD = 0.65;

// ---- the app's own formatting (frontend/src/app/ui/*.tsx), applied to the recorded /predict answers ----
const pct = (v) => `${Math.round(v * 100)}%`;
const effect = (e) => `${e >= 0 ? "+" : "-"}${Math.abs(e * 100).toFixed(1)}%`;
const explain = (name, value) => {
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (["higheducationind", "highereducation", "higheducation", "witnesspresentind", "witnesspresent"].includes(n)) {
    if (value === "1") return "Yes";
    if (value === "0") return "No";
  }
  return value;
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function result(p, k) {
  const score = p.fraud_probability;
  const sp = Math.max(0, Math.min(100, Math.round(score * 100)));
  const tp = Math.round(THRESHOLD * 100);
  const low = score < THRESHOLD;
  const delta = low ? `${(tp - sp).toFixed(1)}% below threshold` : `${(sp - tp).toFixed(1)}% above threshold`;
  const rows = [...p.feature_contributions].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 6);
  const base = p.shap_base_value;
  const maxAbs = Math.max(Math.abs(score - base), ...rows.map((r) => Math.abs(r.impact)), 0.001);
  const seg = rows.map((r, i) => {
    const width = Math.max((Math.abs(r.impact) / maxAbs) * 40, 1.2);
    const left = r.impact >= 0 ? 50 : 50 - width;
    const dir = r.impact > 0 ? "increase" : r.impact < 0 ? "decrease" : "neutral";
    return `<li class="waterfall-row" id="rp${k}-row-${i}"><div class="waterfall-meta"><span class="waterfall-name">${esc(r.name)}</span><span class="waterfall-delta waterfall-delta-${dir}" id="rp${k}-delta-${i}">${effect(r.impact)}</span></div><div class="waterfall-track"><span class="waterfall-marker waterfall-marker-base" style="left: 50%;"></span><span class="waterfall-bar waterfall-${dir}" id="rp${k}-bar-${i}" style="left: ${left}%; width: ${width}%;"></span></div><div class="waterfall-values">value ${esc(explain(r.name, r.value))}</div></li>`;
  });
  return `<div class="result-entrance" id="rp${k}-ent">
  <div class="gauge-wrap"><div class="gauge-ring" id="rp${k}-gauge" style="--threshold-deg: ${Math.round(THRESHOLD * 360)}deg; --gauge-deg: 0deg; --gauge-color: var(--${low ? "low" : "high"});"><span class="gauge-threshold-line" aria-hidden="true"></span><div class="gauge-inner"><div class="gauge-percent" id="rp${k}-pct">0%</div><div class="gauge-tier tier-${low ? "low" : "high"}" id="rp${k}-tier">${low ? "Low risk" : "Fraud likely"}</div></div></div></div>
  <div class="gauge-meta" id="rp${k}-meta"><span>Threshold ${tp}%</span><span>${delta}</span></div>
  <section class="explanation-block" id="rp${k}-fx"><div class="explanation-head"><span class="explanation-head-main">Feature Effects<button type="button" class="effects-info" id="rp${k}-fx-info" aria-label="How to read Feature Effects">${INFO}<span class="effects-tooltip" id="rp${k}-fx-tip">Baseline is the model's starting risk for a typical profile. Each bar shows how one feature moves risk up (red) or down (green) from that baseline.</span></button></span></div>
  <div class="waterfall-summary" id="rp${k}-wfsum"><span>Baseline ${pct(base)}</span><span>Current ${pct(score)}</span></div>
  <ul class="waterfall-list">${seg.join("")}</ul></section></div>`;
}

function summary(p, renderedText) {
  const local = [...p.feature_contributions];
  const fmt = (v) => `${v >= 0 ? "+" : "-"}${Math.abs(v * 100).toFixed(2)}%`;
  const line = (r) => `${r.name} (${explain(r.name, r.value)}): ${fmt(r.impact)} impact`;
  const top = [...local].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 3);
  const risk = local.filter((r) => r.impact > 0).sort((a, b) => b.impact - a.impact).slice(0, 3);
  const prot = local.filter((r) => r.impact < 0).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 3);
  const li = (arr, k) => arr.map((r, i) => `<li id="rp-${k}-${i}">${esc(line(r))}</li>`).join("");
  return `<section class="summary-panel" id="rp-sum"><div class="summary-card-head"><span class="summary-card-title">Executive Summary<button type="button" class="effects-info" aria-label="About Executive Summary">${INFO}<span class="effects-tooltip">A structured summary of the claim's risk profile, key risk drivers, protective factors, and top overall contributors.</span></button></span><span class="summary-source summary-source-openai" id="rp-sum-badge">OPENAI</span></div>
  <p class="summary-headline" id="rp-sum-head">Top local driver: ${esc(top[0].name)}</p>
  <p class="summary-text" id="rp-sum-text">${renderedText}</p>
  <div class="summary-columns"><div class="summary-group summary-group--risk" id="rp-col-risk"><h3 id="rp-col-risk-h">Risk Drivers</h3><ul>${li(risk, "risk")}</ul></div><div class="summary-group summary-group--protective" id="rp-col-prot"><h3 id="rp-col-prot-h">Protective Signals</h3><ul>${li(prot, "prot")}</ul></div><div class="summary-group" id="rp-col-top"><h3 id="rp-col-top-h">Top 3 Overall</h3><ul>${li(top, "top")}</ul></div></div></section>`;
}

// SummaryPanel.formatSummaryProbabilities turns "risk score of 0.82" into the score with one decimal.
// The rendered sentence below is exactly what the live app showed for predict-B (assets/data/live/s3-resultB.png).
const scorePct = `${(B.fraud_probability * 100).toFixed(1)}%`;
const renderedB = esc(B.summary.replace("0.82", scorePct)).replace(
  "history of four past claims",
  '<span class="rp-mark" id="rp-mark">history of four past claims</span>',
);
if (!renderedB.includes("rp-mark")) throw new Error("summary phrase not found");

// ---- CSS: the running app's compiled stylesheet, minus browser-clock animation; fonts from assets/fonts ----
const fontFaces = [
  ["Rajdhani", 700, "rajdhani-700"],
  ["DM Serif Display", 400, "dmserifdisplay-400"],
  ...[300, 400, 500, 600, 700].map((w) => ["IBM Plex Mono", w, `ibmplexmono-${w}`]),
]
  .map(([f, w, file]) => `@font-face { font-family: "${f}"; font-style: normal; font-weight: ${w}; font-display: block; src: url("assets/fonts/${file}-latin.woff2") format("woff2"); }`)
  .join("\n") + `
@font-face { font-family: "Rajdhani Fallback"; src: local("Arial"); ascent-override: 102.12%; descent-override: 37.99%; line-gap-override: 0%; size-adjust: 91.07%; }
@font-face { font-family: "DM Serif Display Fallback"; src: local("Times New Roman"); ascent-override: 94.37%; descent-override: 30.51%; line-gap-override: 0%; size-adjust: 109.78%; }
@font-face { font-family: "IBM Plex Mono Fallback"; src: local("Arial"); ascent-override: 76.16%; descent-override: 20.43%; line-gap-override: 0%; size-adjust: 134.59%; }`;
let appCss = rd("assets/data/app-compiled.css")
  // GSAP owns every change: drop CSS animations and transitions (they run on the browser clock)
  .replace(/\s*animation(-[a-z]+)?:[^;{}]*;/g, "")
  .replace(/\s*transition(-[a-z]+)?:[^;{}]*;/g, "")
  // Tailwind's theme stacks name emoji fonts the page never renders; drop them so every family resolves
  .replace(/, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"/g, "");
// next/font variables (layout.tsx) on the page root
const fontVars = `#rp-page { --font-rajdhani: "Rajdhani", "Rajdhani Fallback"; --font-display: "DM Serif Display", "DM Serif Display Fallback"; --font-mono: "IBM Plex Mono", "IBM Plex Mono Fallback"; font-family: var(--font-mono), "Courier New", monospace; font-size: 14px; line-height: 1.6; color: var(--text); -webkit-font-smoothing: antialiased; }`;
const css = [fontFaces, appCss, fontVars, rd("src/app.style.css")].join("\n");

let markup = rd("src/app.markup.html")
  .replace(/<!--[\s\S]*?-->/, "")
  .replaceAll("{{INFO}}", INFO)
  .replace("{{RESULT_A}}", result(A, "A"))
  .replace("{{RESULT_B}}", result(B, "B"))
  .replace("{{SUMMARY_B}}", summary(B, renderedB));

const DATA = {
  A: { score: A.fraud_probability, deg: Math.round(A.fraud_probability * 360), pct: Math.round(A.fraud_probability * 100) },
  B: { score: B.fraud_probability, deg: Math.round(B.fraud_probability * 360), pct: Math.round(B.fraud_probability * 100) },
};

// house cursor: the 24 x 24 macOS-style arrow shared by the InsureCast and Claim Assistant films (tip at 5.5, 2.5)
const cursorSvg = `<svg id="rp-cursor-art" viewBox="0 0 24 24"><path d="M5.5 2.5 L5.5 19.5 L9.6 15.6 L12.4 21.9 L15.3 20.6 L12.6 14.5 L18.4 14.5 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

const timeline = rd("src/app.timeline.js");

// ---- camera framings (page px centre + scale) and callouts (screen space, positioned from the measured layout) ----
const g = (st, id) => {
  const b = (GEOM[st] || {})[id];
  if (!b) return { x: 0, y: 0, w: 0, h: 0 };
  return b;
};
const FR = {
  pre: { cx: 720, cy: 643.5, s: 1.36 },   // form + empty result panel, both whole (grid 1072 x 709)
  post: { cx: 720, cy: 696.75, s: 1.18 },  // form + result, both whole and centred (grid 1072 x 815)
  sum: { cx: 720, cy: 1300.8, s: 1.6 },   // Executive Summary alone (1072 x 353)
  // Feature Effects tooltip read: the tooltip (876-1136 x 520-598), its info icon and the section header whole at
  // 2.2x, so the app's 10 px tooltip text reads at 22 px on screen; frame top 40 px above the tooltip
  fx: { cx: 1046, cy: 725.5, s: 2.2 },
};
const scr = (f, px, py) => [960 + FR[f].s * (px - FR[f].cx), 540 + FR[f].s * (py - FR[f].cy)];
const gauge = g("B", "#rpB-gauge"), badge = g("B", "#rp-sum-badge");
const bar0 = g("B", "#rpB-bar-0"), bar4 = g("B", "#rpB-bar-4"), colR = g("B", "#rp-col-risk"), colP = g("B", "#rp-col-prot");
const gaugeR = [gauge.x + gauge.w, gauge.y + gauge.h / 2];
const CALLOUTS = [
  // the centred layout leaves 232 px of safe margin on the right: 28 px two-line tags that end at the safe line
  { id: "co-a", f: "post", at: gaugeR, side: "right", toX: 1562, small: true, t: [11.85, 13.95], html: "Below the 65%<br>threshold" },
  { id: "co-b", f: "post", at: gaugeR, side: "right", toX: 1562, small: true, t: [26.35, 28.55], html: "Above the 65%<br>threshold" },
  { id: "co-top", f: "post", at: [bar0.x + bar0.w, bar0.y + bar0.h / 2], side: "right", toX: 1562, small: true, t: [35.45, 37.6], html: "Biggest push:<br>past claims" },
  { id: "co-green", f: "post", at: [bar4.x, bar4.y + bar4.h / 2], side: "right", toX: 1562, small: true, t: [36.6, 38.15], html: "Green bars:<br>lower risk" },
  { id: "co-gpt", f: "sum", at: [badge.x + badge.w / 2, badge.y], side: "above", gap: 50, t: [41.2, 43.4], html: "Written by OpenAI GPT" },
  { id: "co-risk", f: "sum", at: [colR.x + colR.w / 2, colR.y + colR.h], side: "below", gap: 56, t: [44.75, 48.3], html: "Same top driver as the chart" },
  { id: "co-prot", f: "sum", at: [colP.x + colP.w / 2, colP.y + colP.h], side: "below", gap: 56, t: [45.9, 48.3], html: "What pulls it down" },
];
let calloutHtml = "", leaderSvg = "";
for (const c of CALLOUTS) {
  const [ax, ay] = scr(c.f, ...c.at);
  const lines = c.html.split("<br>").length;
  const h = (c.small ? 33.6 : 36) * lines + (c.small ? 30 : 34); // font x 1.2 per line + padding + border
  let style, x2 = ax, y2 = ay;
  if (c.side === "right") { x2 = c.toX; style = `left:${x2.toFixed(1)}px; top:${(ay - h / 2).toFixed(1)}px;`; }
  if (c.side === "below") { y2 = ay + c.gap; style = `left:${ax.toFixed(1)}px; top:${y2.toFixed(1)}px; transform: translateX(-50%);`; }
  if (c.side === "above") { y2 = ay - c.gap; style = `left:${(ax + 40).toFixed(1)}px; top:${y2.toFixed(1)}px; transform: translate(-100%, -100%);`; }
  c.screen = { ax: +ax.toFixed(1), ay: +ay.toFixed(1), x2: +x2.toFixed(1), y2: +y2.toFixed(1) };
  calloutHtml += `<div class="rp-callout${c.small ? " rp-callout--sm" : ""}" id="${c.id}" style="${style}">${c.html}</div>`;
  leaderSvg += `<line class="rp-leader" id="${c.id}-ln" x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/><circle class="rp-dot" id="${c.id}-dot" cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="7"/>`;
}
const DUR = 49.8;

const page = `<div id="rp-page">${markup}<div id="rp-cursor">${cursorSvg}</div></div>`;
const app = `<template>
<style>
${css}
</style>
<div id="root" data-composition-id="app" data-width="1920" data-height="1080">
  <div id="rp-stage" class="clip" data-start="0" data-duration="${DUR}" data-layout-allow-overflow data-layout-allow-overlap>
    <div id="rp-fx">
      <div id="rp-cam">${page}</div>
      <div id="rp-overlay">
        <svg id="rp-leaders" viewBox="0 0 1920 1080">${leaderSvg}</svg>
        ${calloutHtml}
      </div>
    </div>
  </div>
</div>
<script>
(function () {
const GEOM = ${JSON.stringify(GEOM)};
const DATA = ${JSON.stringify(DATA)};
const FR = ${JSON.stringify(FR)};
const CALLOUTS = ${JSON.stringify(CALLOUTS.map(({ id, t, screen, side }) => ({ id, t, screen, side })))};
${timeline}
})();
</script>
</template>
`;
fs.writeFileSync(path.join(ROOT, "compositions/app.html"), app);

// a plain page with the same CSS + markup, for measuring the rebuilt layout against the live capture
const measure = `<!doctype html><html><head><meta charset="utf-8"><base href="../"><style>${css}
body{margin:0;background:#f8f9fb} #rp-page{position:relative}</style></head><body>${page}</body></html>`;
fs.writeFileSync(path.join(ROOT, "tools/measure.html"), measure);
console.log("wrote compositions/app.html", app.length, "bytes; geom keys:", Object.keys(GEOM).length);

// ---- headline cards: an opaque sheet whips in over the app, the line is pre-set in pale grey and inks in word by
// word, the key words take the brand blue and an orange marker sweeps under them, then the sheet whips out.
// (Card grammar studied from the InsureCast demo's sheet-read / sheet-whatif; words, colours and marker are ours.)
const CARDS = [
  { id: "card-change", words: ["Then", "two", "facts", "change"], accent: [1, 2], dur: 2.4 },
  { id: "card-drives", words: ["See", "what", "drives", "the", "score"], accent: [2], dur: 2.4 },
  { id: "card-english", words: ["Read", "it", "in", "plain", "English"], accent: [3, 4], dur: 2.4 },
];
export const CARD_CSS = (k) => `
  #${k}-sheet { position: absolute; inset: 0; background: #f8f9fb; }
  #${k}-line { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
  #${k}-text { position: relative; isolation: isolate; font-family: "DM Serif Display", serif; font-weight: 400; font-size: 120px; line-height: 1.04;
    letter-spacing: -0.01em; color: #0f1419; white-space: nowrap; text-align: center; }
  #${k}-text .w { display: inline-block; color: #dfe3e8; }
  #${k}-acc { position: relative; display: inline-block; white-space: nowrap; }
  #${k}-mark { position: absolute; left: -0.08em; right: -0.08em; bottom: 0.1em; height: 0.3em; border-radius: 0.06em;
    background: #f08526; opacity: 0.32; transform-origin: left center; z-index: -1; }`;
// Word gaps are margins, not space characters: the renderer dropped some whitespace text nodes between the
// inline-block words ("whatdrives"), so every gap is explicit (0.25em, the face's word space).
const cardWords = (c, k) => {
  const first = c.accent[0], last = c.accent[c.accent.length - 1], n = c.words.length;
  const gap = (on) => (on ? ' style="margin-right: 0.25em"' : "");
  let html = "";
  c.words.forEach((w, i) => {
    const inAcc = i >= first && i <= last;
    if (i === first) html += `<span id="${k}-acc"${gap(last < n - 1)}><span id="${k}-mark"></span>`;
    html += `<span class="w" id="${k}-w${i}"${gap(inAcc ? i < last : i < n - 1)}>${w}</span>`;
    if (i === last) html += "</span>";
  });
  return html;
};
// the shared motion: sheet in 0-0.45 s, ink wave from 0.4 s (0.09 s apart), marker sweep, sheet out at dur - 0.45
const cardTimeline = (k, c, t0 = 0, withSheetIn = true) => `
  ${withSheetIn ? `tl.fromTo("#${k}-sheet", { x: 2050, filter: "blur(12px)" }, { x: 0, duration: 0.45, ease: "power3.inOut" }, ${t0});
  tl.to("#${k}-sheet", { filter: "blur(0px)", duration: 0.2, ease: "power2.out" }, ${t0} + 0.25);
  tl.set("#${k}-sheet", { filter: "none" }, ${t0} + 0.46);` : ""}
  gsap.set("#${k}-mark", { scaleX: 0 });
  const ids = ${JSON.stringify(c.words.map((_, i) => `#${k}-w${i}`))}, acc = ${JSON.stringify(c.accent)};
  ids.forEach((s, i) => {
    const on = acc.includes(i);
    tl.fromTo(s, { color: "#dfe3e8", y: on ? 10 : 0 }, { color: on ? "#15436d" : "#0f1419", y: 0, duration: on ? 0.3 : 0.2, ease: on ? "back.out(2)" : "power1.out" }, ${t0} + 0.4 + i * 0.09);
  });
  tl.to("#${k}-mark", { scaleX: 1, duration: 0.42, ease: "power2.inOut" }, ${t0} + 0.4 + acc[acc.length - 1] * 0.09 + 0.16);
  tl.to("#${k}-sheet", { x: -2050, duration: 0.45, ease: "power3.inOut" }, ${t0} + ${c.dur} - 0.45);
  tl.to("#${k}-sheet", { filter: "blur(12px)", duration: 0.22, ease: "power2.in" }, ${t0} + ${c.dur} - 0.45);`;
for (const c of CARDS) {
  const k = c.id.replace("card-", "c");
  const html = `<template>
<style>
  @font-face { font-family: "DM Serif Display"; font-weight: 400; font-display: block; src: url("assets/fonts/dmserifdisplay-400-latin.woff2") format("woff2"); }
  #root { position: absolute; inset: 0; overflow: hidden; }
  ${CARD_CSS(k)}
</style>
<div id="root" data-composition-id="${c.id}" data-width="1920" data-height="1080">
  <div id="${k}-stage" class="clip" data-start="0" data-duration="${c.dur}" data-layout-allow-overflow>
    <div id="${k}-sheet"><div id="${k}-line"><div id="${k}-text" data-layout-allow-overlap>${cardWords(c, k)}</div></div></div>
  </div>
</div>
<script>
(function () {
  gsap.config({ force3D: false });
  const tl = gsap.timeline({ paused: true, defaults: { immediateRender: false } });
  gsap.set("#${k}-sheet", { x: 2050 });
  ${cardTimeline(k, c)}
  window.__timelines["${c.id}"] = tl;
})();
</script>
</template>
`;
  fs.writeFileSync(path.join(ROOT, `compositions/${c.id}.html`), html);
}
console.log("wrote cards", CARDS.map((c) => c.id).join(", "));
