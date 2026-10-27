// Measures the rebuilt page (tools/measure.html) at the live capture's 1440 px viewport and compares it with
// the live app's geometry (assets/data/live/*.geom.json). Writes assets/data/geom.json (page px, top-left origin).
// Needs Playwright: NODE_PATH=<dir with playwright> node tools/measure.cjs
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto("file://" + path.join(ROOT, "tools/measure.html"));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  const measureState = async (state) => p.evaluate((state) => {
    const show = (id, on) => { const e = document.getElementById(id); if (e) e.style.opacity = on ? 1 : 0; };
    const stack = document.getElementById("rp-result-stack");
    stack.style.height = state === "none" ? "0px" : "auto";
    show("rp-resA", state === "A"); show("rp-resB", state === "B"); show("rp-summary-wrap", state === "B");
    document.getElementById("rp-summary-wrap").style.display = state === "B" ? "" : "none";
    const r = (el) => { const q = el.getBoundingClientRect(); return { x: +(q.x + scrollX).toFixed(2), y: +(q.y + scrollY).toFixed(2), w: +q.width.toFixed(2), h: +q.height.toFixed(2) }; };
    const out = {};
    document.querySelectorAll("[id^=rp]").forEach((el) => (out["#" + el.id] = r(el)));
    const sel = { h1: "h1", form: ".form-panel", result: ".result-panel", runBtn: ".run-btn", status: ".form-status", gauge: "#rpB-gauge" };
    for (const [k, s] of Object.entries(sel)) { const e = document.querySelector(s); if (e) out[k] = r(e); }
    out.fields = [...document.querySelectorAll(".field")].map((f) => ({ label: f.querySelector(".field-label").innerText, ctrl: r(f.querySelector("select,input,.toggle-label")) }));
    out.sectionInfo = [...document.querySelectorAll(".form-section .effects-info")].map(r);
    out.doc = { h: document.documentElement.scrollHeight };
    return out;
  }, state);
  const G = { none: await measureState("none"), A: await measureState("A"), B: await measureState("B") };
  await p.screenshot({ path: path.join(ROOT, ".hyperframes/measure-B.png"), fullPage: true }).catch(() => {});
  fs.writeFileSync(path.join(ROOT, "assets/data/geom.json"), JSON.stringify(G, null, 1));
  // compare with live
  const live = (n) => JSON.parse(fs.readFileSync(path.join(ROOT, `assets/data/live/${n}.geom.json`), "utf8"));
  const L0 = live("s0-initial"), L3 = live("s3-resultB");
  const d = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.w - b.w), Math.abs(a.h - b.h)).toFixed(2);
  const rows = [];
  rows.push(["form (none)", d(G.none.form, L0.form[0])], ["result (none)", d(G.none.result, L0.result[0])], ["runBtn", d(G.none.runBtn, L0.runBtn[0])], ["status", d(G.none.status, L0.status[0])]);
  rows.push(["form (B)", d(G.B.form, L3.form[0])], ["result (B)", d(G.B.result, L3.result[0])], ["gauge B", d(G.B.gauge, L3.gauge[0])], ["h1", d(G.B.h1, L3.h1[0])]);
  G.B.fields.forEach((f, i) => rows.push([`field ${f.label}`, d(f.ctrl, L3.fieldsByLabel[i].ctrl)]));
  L3.wfRows.forEach((w, i) => rows.push([`wf row ${i}`, d(G.B["#rpB-row-" + i], w)]));
  rows.push(["summary", d(G.B["#rp-sum"], L3.summary[0])], ["summary text", d(G.B["#rp-sum-text"], L3.summaryText[0])], ["badge", d(G.B["#rp-sum-badge"], L3.source[0])]);
  L3.groups.forEach((g, i) => rows.push([`group ${i}`, d(G.B[["#rp-col-risk", "#rp-col-prot", "#rp-col-top"][i]], g)]));
  console.log(rows.map((r) => r.join(": max delta px ")).join("\n"));
  await b.close();
})();
