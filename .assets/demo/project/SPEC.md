# SPEC: RiskProfiler product demo

GOAL:    a claims or SIU lead finishes the film knowing RiskProfiler scores a claim's fraud risk against a
         65% threshold, re-scores it the moment a fact changes, and shows which facts drove the score and
         why, in plain English.
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps, H.264 yuv420p + AAC 48 kHz.
TIME:    57.6 s x 30 = 1728 frames (v2). Music bed 100 BPM (Lyria), 1 beat = 0.6 s = 18 frames,
         1 bar = 2.4 s = 72 frames. Every chapter seam sits on a bar line (multiples of 2.4 s).

LOOK:    the product's own system, nothing invented.
         ground #f8f9fb (app --bg); surfaces #ffffff; borders rgba(0,0,0,.06/.10);
         ink #0f1419 (--text-strong), body #2c3338, muted #5c6d7e;
         accent #1a2b3c (--accent): callout rule, leader line and dot, end-card URL and its rule.
         Status red #eb3232 / green #2ba86e only where the app itself uses them (gauge, bars, columns),
         plus the one highlighted hook word "risky?" (red = the app's fraud colour). Cards are ink only.
         Display: DM Serif Display 400 (the app's h1 face), headlines 116 px, tracking -0.01em, lh 1.02.
         Labels and callouts: IBM Plex Mono 500 (the app's body face), 28-32 px on screen.
         Two film families only. The UI rebuild keeps the app's third face, Rajdhani 700, inside the gauge
         numeral, because that is the real component.
         The UI is the real dashboard rebuilt as DOM from the captured page (the running app's compiled
         CSS, its markup and class names, the real /predict responses) at 1440 CSS px wide, framed by a
         camera between 1.18x and 1.6x. v2 framing rule: every panel in frame is whole and inside the 5%
         safe area; push/pull follows the layout (result mounts -> pull back, edit clears it -> push in). Text and SVG repaint at the final zoom (2D transforms only).
OBJECTS: cursor = macOS-style black arrow, 1.5 px white edge, 22 px tall in app space (40-57 px on screen);
         dropdown = white popover under the claim-day select, app --shadow-lg, 8 px radius, 32 px rows,
         hovered row --surface-2 with a 2 px accent bar, check mark on the current value (the app uses a
         native select; a headless capture cannot show the OS menu, so it is drawn in the app's styling);
         gauge = the app's conic ring, 200 px, threshold tick at 234 deg (65%).
MOTION:  camera moves power2.inOut 0.9-1.2 s, one at a time, never during a click; never linear.
         cursor travel power3.inOut 0.6-0.9 s; hover 0.12 s; press = cursor scale 0.86 for 4 frames plus
         the control's own press (button y -1 -> 0, shadow md -> xs).
         menu open 0.2 s power2.out (opacity, scaleY 0.96 -> 1, y -4 -> 0); close 0.14 s power2.in.
         result mount = the app's own result-entrance (opacity 0 -> 1, y 18 -> 0, 0.38 s) and
         waterfall-enter (opacity, y 6 -> 0, 0.3 s, 60 ms stagger); gauge sweep 0.9 s back.out(1.4)
         (the app's transition curve is cubic-bezier(.34,1.56,.64,1)); numerals count with it; bars grow
         from the baseline 0.5 s power3.out.
         headline card = blur swap on one stage: the app blurs out (8 px, opacity 0, 0.2 s), words blur
         in 8 -> 0 px, 0.16 s each, 0.08 s apart, no translate; out 0.18 s; the app blurs back in with a
         1.03 -> 1 settle. That is the only transition between chapters; inside chapters the camera
         does the work.
         callouts: blur 6 -> 0 px + opacity in 0.2 s, held still, out 0.16 s; never move while read.
SHOTS (global seconds):
  0.0-4.8   HOOK poster: shield + "RiskProfiler", "Which facts make a claim safe?" (green) that rolls to
            "risky?" (red) on the frame the gauge crosses the 65% tick,
            "A fraud score, explained feature by feature.", the app's gauge at 35% LOW RISK sweeping past
            the 65% tick to 82% FRAUD LIKELY (0.9-2.1 s). Frame 0 is a finished poster.
  4.8-7.2   card "Start with one claim".
  7.2-14.4  form at 2.2x (Claim Context); push to Run Evaluation (2.2x); hover, press; "Evaluating"
            spinner and timer (1.4 s); pan to the result (2.0x): the panel grows, gauge sweeps to 35%,
            rows stagger in; callout "Below the 65% threshold".
  14.4-16.8 card "Then two facts change".
  16.8-24.0 claim day select at 2.4x: open, hover down to Friday, select, close; pan to Past claims:
            click, select "0", type "4"; callout "4 prior claims for this driver"; Run Evaluation.
  24.0-28.8 pan to the result: gauge sweeps red to 82% FRAUD LIKELY, "17.0% above threshold", rows
            stagger; callout "Above the 65% threshold".
  28.8-31.2 card "See what drives the score".
  31.2-38.4 Feature Effects at 1.9x; cursor hovers the info icon, push to 2.6x on the app's real tooltip;
            pull back; callouts "Biggest push: past claims" and "Green bars pull risk down".
  38.4-40.8 card "Read it in plain English".
  40.8-48.4 Executive Summary at 1.6x: callout on the OPENAI badge "Summary written by GPT-4o-mini";
            push to 2.2x, highlight band on "history of four past claims", callout "Same driver the chart
            found"; pull to the columns (1.75x): callouts "What raises risk", "What lowers it".
  48.4-51.6 pull back to the whole dashboard (1.2x): Friday, 4, 82%, every bar.
  51.6-60.0 end card: shield wipes up, "RiskProfiler" letters land, "Fraud scores you can explain.",
            risk-profiler.symfa.ai. Held 8.4 s; music fades 56.4 -> 59.2, silence to 60.0.
SOUND:   v2: Lyria minimal-piano bed (100 BPM, option 2 of music-options/) from 0, shaped by density cues;
         v1: Lyria light acoustic bed, low-passed at 12 kHz (Lyria's 14.8 and 19.2 kHz
         tones), -3 dB low shelf at 110 Hz, mix around -16 LUFS, true peak <= -1 dBTP; soft click on
         every real click (6), one key tick on the typed "4", quiet alternating whoosh takes on the five
         blur swaps, a pop when the hook gauge and the 82% gauge land; nothing else.
BANNED:  caption or subtitle strip; hard content swaps; error, empty-state ("Enter claim data..."),
         "N/A", "FALLBACK" text; localhost, browser chrome, the Next.js dev badge; spinners over 1.5 s;
         dark void ground; glow, particles, gradients, glass; centred everything (headlines left-aligned,
         only the end card is centred); titles that drift after landing; three cards in a row; the logo
         docked in a corner; click rings; will-change on camera layers; 3D transforms.
QA:      frames every 2 s and around every seam (+-0.2 s) and zoom peak at full resolution; text >= 28 px
         for headlines and callouts; consecutive-frame diff on every held label (no jitter); every number
         matches assets/data/predict-*.json; audio present from 0, true peak <= -1 dBTP, silence in the
         last 0.6 s.

v2 SHOTS (supersede the list above where they differ):
  7.2-14.4  "pre" 1.36x: cursor to Run Evaluation, hover, press, spinner 1.4 s; result mounts in frame, panel grows,
            camera pulls back to "post" 1.18x on the same curve; callout "Below the 65% threshold".
  16.8-24.0 "post": claim-day menu -> Friday; the old result clears, panel shrinks, camera pushes in to "pre";
            past claims double-click, type 4; Run Evaluation.
  24.0-28.8 B mounts, pull back to "post": 82% FRAUD LIKELY; callout "Above the 65% threshold".
  31.2-38.4 "post": info-icon hover shows the app's tooltip; callouts "Biggest push: past claims", "Green bars pull
            risk down" in the free space right of the panels.
  40.8-49.2 "sum" 1.6x, the summary alone: "Written by OpenAI GPT" above the badge; highlight on "history of four
            past claims" and on the first Risk Drivers item; "Same top driver as the chart", "What pulls it down".
  49.2-57.6 end card; music fades 54.0 -> 56.8, silence to 57.6.

v3: chapter transition = opaque #f8f9fb sheet whip (in from the right 0.45 s power3.inOut, 12 px blur clearing;
out to the left), line pre-set #dfe3e8 and inked word by word 0.09 s apart, key words -> #15436d with a 10 px
back.out(2) lift, orange #f08526 marker (32%) sweeping under them 0.42 s; cards centred both axes. "post" framing
centred (cx 720). Music: option 8, rhodes-guitar-warm (Lyria, 100 BPM, F major).

House style alignment (2026-10-27; supersedes the times and sizes above where they differ):
  TIME:     56.7 s x 30 = 1701 frames. End card 49.2-56.7 (7.5 s); music fades 53.1 -> 56.0, silence to 56.7.
  POSTER:   lockup mark 90 px at ink (160, 120); headline ink left 160, first cap top 300; sub-line left 160;
            gauge 520 px with its ink right edge at 1760, "Threshold 65%" below it (lowest ink 885).
  31.2-38.4 push to "fx" 2.2x (31.25-32.25) on the info icon: the app's 10 px tooltip reads at 22 px, held 1.7 s;
            pull back to "post" (34.35-35.35); callouts at 35.45 and 36.6.
  END CARD: mark 184 x 220, DM Serif wordmark 150 px (110 px ink), 58 px gap, tagline Plex Mono 46 px #5c6d7e,
            URL Plex Mono 36 px #1a2b3c with no rule; group ink 323-757, centred.
  CURSOR:   24 x 24 house arrow (the InsureCast / Claim Assistant path), tip on the same hotspot.
  RENDER:   tools/render-delivery.sh: 2x PNG capture, lanczos to 1080p, x264 CRF 14 preset slow, no tune or unsharp.
