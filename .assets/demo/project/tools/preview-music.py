#!/usr/bin/env python3
"""Cheap music previews: re-mix the film's audio with another bed and mux it onto an existing render (video copied,
no re-render). The sound effects are re-placed from index.html (<audio id="sfx-..."> start, duration, volume).

  python3 tools/preview-music.py <render.mp4> <bed.mp3|flac|wav> <out.mp4>
"""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
video, bed, out = sys.argv[1:4]
html = (ROOT / "index.html").read_text()
clips = []
for tag in re.findall(r"<audio [^>]*>", html):
    a = dict(re.findall(r'([\w-]+)="([^"]*)"', tag))
    if a.get("id", "").startswith("sfx-"):
        clips.append(
            (
                ROOT / a["src"],
                float(a["data-start"]),
                float(a["data-duration"]),
                float(a.get("data-volume", 1)),
            ),
        )
m = re.search(r'data-composition-id="main"[^>]*data-duration="([\d.]+)"', html)
if m is None:
    sys.exit("main composition duration not found")
dur = float(m.group(1))
args = ["ffmpeg", "-loglevel", "error", "-y", "-i", video, "-i", bed]
for src, *_ in clips:
    args += ["-i", str(src)]
f = [f"[1:a]aresample=48000,atrim=0:{dur:.3f}[m]"]
for i, (_, st, d, v) in enumerate(clips):
    ms = int(round(st * 1000))
    f.append(
        f"[{i + 2}:a]aresample=48000,atrim=0:{d:.3f},volume={v},adelay={ms}|{ms}[s{i}]",
    )
f.append(
    "[m]"
    + "".join(f"[s{i}]" for i in range(len(clips)))
    + f"amix=inputs={len(clips) + 1}:normalize=0:duration=first[a]",
)
args += [
    "-filter_complex",
    ";".join(f),
    "-map",
    "0:v",
    "-map",
    "[a]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-t",
    str(dur),
    out,
]
subprocess.run(args, check=True)
print(out)
