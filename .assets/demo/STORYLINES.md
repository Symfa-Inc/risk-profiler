# RiskProfiler demo film: storylines

Subject: RiskProfiler, the insurance claim fraud-risk dashboard (FastAPI + AutoGluon + SHAP backend,
Next.js frontend). A claims adjuster enters ten facts about a claim, runs an evaluation, and gets a fraud
probability against a 65% threshold, per-feature SHAP effects and a plain-English summary from OpenAI.

Viewer: a claims or special-investigations lead who has to decide which claims deserve a closer look.

One real piece of data travels through every option: **one auto claim**, captured from the running app
(backend on :8341, frontend on :3341). With the app's default facts it scores **35%, low risk**. Change two
facts (claim day Monday to Friday, past claims 0 to 4) and the same model scores it **82%, fraud likely**,
with "Past number of claims" as the top SHAP driver (+19.8%) and the real GPT-4o-mini summary.

---

## A. "Two facts change the call" (chosen)

- **Device / form:** a moment in an adjuster's day (one claim, scored, then re-scored when two new facts
  arrive), told as one continuous take inside the product. Short headline cards blur in on the app's own
  ground between chapters; inside chapters the camera does the work.
- **What the viewer sees and feels:** the dashboard works in front of them: the cursor runs an evaluation,
  the gauge sweeps to 35%, the adjuster opens the claim-day menu and picks Friday, types 4 past claims, runs
  it again, and the gauge swings red to 82%. Then the product explains itself: which facts pushed the score
  up, which pulled it down, and a summary an adjuster can paste into the file. Calm, competent, specific.
- **First two seconds:** a designed poster on the app's #f8f9fb ground: the RiskProfiler shield and
  wordmark, "Which facts make a claim safe?" in DM Serif Display, and the app's own gauge at 35% LOW RISK
  that sweeps past the 65% threshold mark to 82% FRAUD LIKELY; on that frame "safe?" rolls into "risky?".
- **Beats:** hook poster → "Start with one claim" → run evaluation → 35% low risk → "Then two facts change"
  → claim day menu: Friday; past claims: 4 → run again → 82% fraud likely → "See what drives the score" →
  Feature Effects tooltip and bars → "Read it in plain English" → Executive Summary → pull back to the whole
  dashboard → end card held while the music resolves to silence.
- **Look:** the app's own system: #f8f9fb ground, white cards, ink #0f1419, slate accent #1a2b3c, status
  red #eb3232 and green #2ba86e only where the app uses them; DM Serif Display for headlines, IBM Plex Mono
  for labels and callouts; real UI at 1.6x to 2.6x, never a small window floating on a void.
- **Sound:** a light acoustic bed (guitar plucks, soft piano, shaker, ~100 BPM, generated with Lyria),
  soft clicks on real clicks, one key tick on the typed digit, a quiet whoosh on each headline card, a pop
  when a gauge lands; the bed resolves under the end card and fades to silence.

**Why this one:** a stranger can follow it without narration: one claim, one change, one different call,
and the explanation of why. Every number on screen is the product's own output for the exact inputs shown,
and the story naturally performs every interaction the product has (number input, select, run, re-run,
tooltip).

## B. "The number first"

- **Device / form:** the result first, then a pull-back.
- **What the viewer sees:** the film opens on "82%" in Rajdhani filling the frame, red. The camera pulls
  back: the number sits in the gauge, the gauge sits beside the Feature Effects bars that built it, the bars
  sit beside the form whose two changed fields caused it, and finally the whole dashboard.
- **First two seconds:** "82%" at 420 px, the red ring drawing around it, "FRAUD LIKELY" blurring in.
- **Beats:** number lands → gauge → Feature Effects → the two changed fields → the summary → whole app →
  end card.
- **Look:** same app palette; giant numerals; one continuous zoom.
- **Sound:** a single sustained pad that opens up as the camera pulls back.
- **Not chosen because:** it explains the tool backwards. The interactions (run, pick from the menu, type,
  re-run) happen off camera or out of order, and the "35% to 82%" contrast, which is the point, gets lost.

## C. "Two claims, one model"

- **Device / form:** split screen to one. Two copies of the dashboard play side by side: the default claim
  on the left, the changed claim on the right, the same clicks on both; then the left pane slides away and
  the right one fills the frame for the explanation.
- **First two seconds:** two forms side by side, identical except two highlighted fields (Monday / Friday,
  0 / 4), both Run buttons pressed at once.
- **Beats:** two panes → both run → 35% vs 82% → collapse to the 82% pane → Feature Effects → summary → end.
- **Look:** app palette, a 1 px divider, both panes at 0.9x.
- **Sound:** a bed with a stereo split that merges when the panes collapse.
- **Not chosen because:** the side-by-side panes shrink the UI below a readable size at 1080p (the app's
  10 px labels would land at about 9 px), and "side-by-side panels standing in for a scene" is a known tell.

The chosen film borrows one thing from B: the result gauge is the hook's hero object.
