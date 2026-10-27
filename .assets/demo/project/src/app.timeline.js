// The continuous take inside RiskProfiler. Times are global seconds (the app host starts at 0).
// Inlined by tools/build.mjs, which also provides GEOM (measured layout), DATA (scores), FR (framings), CALLOUTS.
gsap.config({ force3D: false }); // keep every transform 2D so the zoomed DOM repaints at its final scale
const tl = gsap.timeline({ paused: true, defaults: { immediateRender: false } });
const $ = (s) => document.querySelector(s);
const G0 = GEOM.none || {}, GB = GEOM.B || {};
const box = (st, id) => (GEOM[st] || {})[id] || { x: 0, y: 0, w: 0, h: 0 };
const ctr = (st, id, dx = 0, dy = 0) => { const b = box(st, id); return [b.x + b.w / 2 + dx, b.y + b.h / 2 + dy]; };

// ---------- initial state (t = 0) ----------
// the app is live under every card: cards are opaque sheets that whip across it (see compositions/card-*.html)
gsap.set("#rp-fx", { opacity: 1, filter: "none" });
const camTo = (f) => ({ x: 960 - FR[f].s * FR[f].cx, y: 540 - FR[f].s * FR[f].cy, scale: FR[f].s });
gsap.set("#rp-cam", { transformOrigin: "0 0", ...camTo("pre") });
gsap.set("#rp-cursor", { x: 1150, y: 1090, opacity: 1, scale: 1, transformOrigin: "1.5px 1.5px" });
gsap.set("#rp-result-stack", { height: 0 });
// rows and bars start hidden: their staggered tweens begin after the entrance (immediateRender is off)
gsap.set("[id^=rpA-row-], [id^=rpB-row-]", { opacity: 0, y: 6 });
gsap.set("[id^=rpA-bar-], [id^=rpB-bar-]", { scaleX: 0 });
gsap.set("#rp-run", { boxShadow: "0 0 0 rgba(0,0,0,0)" });
gsap.set("#rp-menu", { opacity: 0, scaleY: 0.96, y: -4, transformOrigin: "50% 0%" });

// ---------- helpers ----------
const appOut = (t) => tl.to("#rp-fx", { opacity: 0, filter: "blur(8px)", duration: 0.2, ease: "power2.in" }, t);
const appIn = (t) => {
  tl.fromTo("#rp-fx", { opacity: 0, filter: "blur(8px)", scale: 1.03 }, { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.32, ease: "power3.out" }, t);
  tl.set("#rp-fx", { filter: "none" }, t + 0.33); // no leftover filter surface
};
const cam = (f, t, d = 1.0, ease = "power2.inOut") => tl.to("#rp-cam", { ...camTo(f), duration: d, ease }, t);
const camSet = (f, t) => tl.set("#rp-cam", camTo(f), t);
const cur = (p, t, d = 0.75, ease = "power3.inOut") => tl.to("#rp-cursor", { x: p[0], y: p[1], duration: d, ease }, t);
const curSet = (p, t) => tl.set("#rp-cursor", { x: p[0], y: p[1] }, t);
const press = (t) => tl.to("#rp-cursor", { scale: 0.86, duration: 0.06, ease: "power2.out" }, t).to("#rp-cursor", { scale: 1, duration: 0.1, ease: "power2.out" }, t + 0.133);
const fade = (sel, to, t, d = 0.14) => tl.to(sel, { opacity: to, duration: d, ease: "power1.inOut" }, t);
const swap = (outSel, inSel, t, d = 0.14) => { fade(outSel, 0, t, d); fade(inSel, 1, t, d); };

// button: enabled 1.0, disabled 0.4 (the app's .run-btn:disabled)
const btnHover = (t) => tl.to("#rp-run", { y: -1, boxShadow: "0 4px 12px rgba(0,0,0,0.07)", duration: 0.12, ease: "power2.out" }, t);
const btnPress = (t) => tl.to("#rp-run", { y: 0, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", duration: 0.06, ease: "power2.out" }, t);
const btnRest = (t) => tl.to("#rp-run", { y: 0, boxShadow: "0 0 0 rgba(0,0,0,0)", duration: 0.12 }, t);

function evaluate(tClick, tResult) {
  btnPress(tClick);
  press(tClick);
  fade("#rp-run", 0.4, tClick + 0.08, 0.16);
  btnRest(tClick + 0.12);
  swap("#rp-lbl-run, #rp-lbl-rerun", "#rp-lbl-eval", tClick + 0.08, 0.12);
  // spinner: 550 ms per turn, linear (the app's @keyframes spin)
  const d = tResult - tClick;
  tl.fromTo("#rp-spin", { rotation: 0 }, { rotation: 360 * (d / 0.55), duration: d, ease: "none" }, tClick + 0.08);
  const o = { v: 0 };
  tl.fromTo(o, { v: 0 }, { v: d, duration: d, ease: "none", onUpdate: () => { $("#rp-elapsed").textContent = (Math.floor(o.v * 10) / 10).toFixed(1) + "s"; } }, tClick + 0.08);
  swap("#rp-lbl-eval", "#rp-lbl-rerun", tResult, 0.14);
  swap("#rp-status-ready", "#rp-status-match", tResult, 0.16);
}

// stack height at which the result panel equals the form's own height (no layout change yet)
const H0 = box("none", "#rp-form").h - (box("B", "#rp-result").h - box("B", "#rp-result-stack").h);
function mountResult(k, t, camTo) {
  const D = DATA[k];
  // The panel grows to its content and the camera pulls back on the same curve, so both panels stay whole
  // in frame while the page gets taller (measured height, no "auto").
  const LAYOUT = { d: 0.9, ease: "power2.inOut" };
  // Up to H0 the result fits inside the form-height panel, so it appears whole at once; only the last rows grow it.
  tl.set("#rp-result-stack", { height: H0 }, t);
  tl.fromTo("#rp-result-stack", { height: H0 }, { height: box(k, "#rp-result-stack").h, duration: LAYOUT.d, ease: LAYOUT.ease, immediateRender: false }, t + 0.001);
  cam(camTo, t, LAYOUT.d, LAYOUT.ease);
  tl.set(`#rp-res${k}`, { opacity: 1 }, t);
  // the app's .result-entrance: fade-up 380 ms
  tl.fromTo(`#rp${k}-ent`, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.38, ease: "power2.out" }, t);
  // gauge sweep with the app's overshooting curve, numerals count to the exact score
  tl.fromTo(`#rp${k}-gauge`, { "--gauge-deg": "0deg" }, { "--gauge-deg": D.deg + "deg", duration: 0.9, ease: "back.out(1.4)" }, t + 0.1);
  const n = { v: 0 };
  tl.fromTo(n, { v: 0 }, { v: D.pct, duration: 0.85, ease: "power2.out", onUpdate: () => { $(`#rp${k}-pct`).textContent = Math.round(n.v) + "%"; } }, t + 0.1);
  // waterfall-enter: 300 ms, 60 ms stagger; bars grow from the baseline
  for (let i = 0; i < 6; i++) {
    tl.fromTo(`#rp${k}-row-${i}`, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, t + 0.25 + 0.06 * i);
    tl.fromTo(`#rp${k}-bar-${i}`, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power3.out" }, t + 0.35 + 0.06 * i);
  }
}
// The first edit clears the old result (the app sets prediction to null): it fades, the panel shrinks back to
// the form's height and the camera pushes in on the same curve.
function unmountResult(k, t, camTo) {
  tl.to(`#rp-res${k}`, { opacity: 0, duration: 0.18, ease: "power1.in" }, t);
  tl.to("#rp-result-stack", { height: H0, duration: 0.9, ease: "power2.inOut" }, t + 0.12);
  tl.set("#rp-result-stack", { height: 0 }, t + 1.03);
  cam(camTo, t + 0.12, 0.9, "power2.inOut");
}
function callout(id, t0, t1) {
  tl.fromTo([`#${id}-dot`], { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.18, ease: "power3.out" }, t0);
  tl.fromTo(`#${id}-ln`, { opacity: 0 }, { opacity: 1, duration: 0.16 }, t0 + 0.06);
  tl.fromTo(`#${id}`, { opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power2.out" }, t0 + 0.1);
  tl.set(`#${id}`, { filter: "none" }, t0 + 0.31);
  tl.to([`#${id}`, `#${id}-ln`, `#${id}-dot`], { opacity: 0, duration: 0.16, ease: "power2.in" }, t1);
}

// Framing rule: every panel in frame is whole and inside the 5% safe area ("pre" = form + empty result panel at
// 1.36x, "post" = form + result at 1.18x, "sum" = Executive Summary at 1.6x). Push-ins and pull-backs are driven
// by the layout itself: the page grows when a result arrives and shrinks when an edit clears it.

// ================= S2  7.2-14.4  first evaluation =================
const run = ctr("none", "#rp-run", 18, 6);
cur(run, 7.75, 1.0);
btnHover(8.8);
evaluate(9.1, 10.6);
mountResult("A", 10.6, "post");
callout("co-a", 11.85, 13.95);

// ================= S3  16.8-24.0  two facts change =================
const day = ctr("none", "#rp-day", -30, 2);
curSet([640, 960], 14.9);
cur(day, 17.0, 0.7);
fade("#rp-day-hover", 1, 17.72, 0.1);
press(17.95);
fade("#rp-day-focus", 1, 17.97, 0.1);
fade("#rp-day-hover", 0, 17.97, 0.1);
tl.to("#rp-menu", { opacity: 1, scaleY: 1, y: 0, duration: 0.2, ease: "power2.out" }, 18.0);
// cursor glides down the open menu; the hovered row highlights as the tip crosses it
const optY = (i) => box("none", `#rp-opt-${i}`).y;
const yFri = optY(4) + 16, y0 = day[1];
const cursorDown = { t: 18.3, d: 0.8 };
cur([day[0] - 12, yFri], cursorDown.t, cursorDown.d, "power2.inOut");
const ease = gsap.parseEase("power2.inOut");
const crossT = (y) => { // invert the cursor's eased path numerically (deterministic)
  const p = (y - y0) / (yFri - y0);
  let lo = 0, hi = 1;
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (ease(m) < p) lo = m; else hi = m; }
  return cursorDown.t + cursorDown.d * lo;
};
gsap.set("#rp-menu-hl", { y: 0 });
for (let i = 0; i <= 4; i++) {
  const t = i === 0 ? 18.22 : crossT(optY(i));
  if (i === 0) tl.to("#rp-menu-hl", { opacity: 1, duration: 0.08 }, t);
  else tl.to("#rp-menu-hl", { y: optY(i) - optY(0), duration: 0.07, ease: "power1.out" }, t);
}
press(19.35);
tl.to("#rp-menu", { opacity: 0, scaleY: 0.96, y: -4, duration: 0.14, ease: "power2.in" }, 19.42);
swap("#rp-day-mon", "#rp-day-fri", 19.42, 0.15);
// first edit: the old result clears, the button re-enables, the status line flips back
unmountResult("A", 19.5, "pre");
swap("#rp-status-match", "#rp-status-ready", 19.5, 0.14);
fade("#rp-run", 1, 19.5, 0.14);
swap("#rp-lbl-rerun", "#rp-lbl-run", 19.5, 0.14);
const pastP = ctr("none", "#rp-past", -40, 2);
cur(pastP, 20.3, 0.75);
fade("#rp-past-hover", 1, 21.03, 0.1);
press(21.15);
fade("#rp-day-focus", 0, 21.15, 0.1);
fade("#rp-past-focus", 1, 21.17, 0.1);
fade("#rp-past-hover", 0, 21.17, 0.1);
tl.set("#rp-past-caret", { opacity: 1 }, 21.2);
press(21.42); // double-click selects the value
tl.set("#rp-past-caret", { opacity: 0 }, 21.46);
tl.set("#rp-past-sel", { opacity: 1 }, 21.46);
// type "4"
tl.set("#rp-past-sel", { opacity: 0 }, 21.75);
tl.set("#rp-past-0", { opacity: 0 }, 21.75);
tl.set("#rp-past-4", { opacity: 1 }, 21.75);
tl.set("#rp-past-caret", { opacity: 1 }, 21.75);
const run2 = ctr("none", "#rp-run", 40, 6);
cur(run2, 22.65, 0.8);
btnHover(23.45);
evaluate(23.7, 25.0);
fade("#rp-past-focus", 0, 23.7, 0.1);
tl.set("#rp-past-caret", { opacity: 0 }, 23.7);

// ================= S4  24.0-28.8  fraud likely =================
mountResult("B", 25.0, "post");
callout("co-b", 26.35, 28.55);

// ================= S5  31.2-38.4  what drives it =================
curSet([1560, 1200], 29.3); // parked fully outside every framing (was half visible at the bottom-right edge)
const info = ctr("B", "#rpB-fx-info", 1, 2);
// push in on the info icon as the card leaves, so the app's 10 px tooltip reads at 22 px; the tooltip holds 1.7 s
// with the camera still, then the camera pulls back to "post" before the chart callouts
cam("fx", 31.25, 1.0);
cur(info, 31.55, 0.9);
tl.to("#rpB-fx-info", { color: "#2c3338", duration: 0.12 }, 32.5);
tl.to("#rpB-fx-tip", { opacity: 1, duration: 0.13, ease: "power2.out" }, 32.55);
tl.to("#rpB-fx-tip", { opacity: 0, duration: 0.13, ease: "power2.in" }, 34.25);
tl.to("#rpB-fx-info", { color: "#8a96a3", duration: 0.12 }, 34.25);
cur([1560, 1200], 34.3, 0.9);
cam("post", 34.35, 1.0);
callout("co-top", 35.45, 37.6);
callout("co-green", 36.6, 38.15);

// ================= S6  40.8-50.4  plain English =================
// The camera moves down to the summary behind the card. It is framed alone and whole: the panels above are
// hidden so their bottom edges do not cut into the frame (the summary itself stayed hidden until now for the
// same reason; in the app it mounts with the result).
// behind the card (fully covered 38.85-40.35)
camSet("sum", 38.9);
tl.set("#rp-cursor", { opacity: 0 }, 38.9);
tl.set("#rp-grid", { opacity: 0 }, 38.9);
tl.set("#rp-summary-wrap", { opacity: 1 }, 38.9);
callout("co-gpt", 41.2, 43.4);
tl.fromTo("#rp-mark", { backgroundSize: "0% 72%" }, { backgroundSize: "100% 72%", duration: 0.55, ease: "power2.inOut" }, 43.6);
tl.to("#rp-risk-0", { backgroundColor: "#fbe9e9", duration: 0.35, ease: "power2.inOut" }, 44.3);
// the three column callouts land 1.15 s apart (risk, protective, top 3) and leave together at 49.5
callout("co-risk", 44.75, 49.5);
callout("co-prot", 45.9, 49.5);
callout("co-top3", 47.05, 49.5);

window.__timelines["app"] = tl;
