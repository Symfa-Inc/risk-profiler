#!/bin/sh
# Delivery render (v4+): capture lossless PNG frames at 2x device scale (3840x2160), then encode 1920x1080 ourselves.
# Why: `render --format mp4` captures each frame as JPEG (q95) at 1x and lets x264 see the JPEG; small UI text came
# out soft. PNG capture at 2x + lanczos downscale supersamples the text, a mild luma-only unsharp (0.5) restores
# edge contrast, and x264 runs at CRF 10 / veryslow / tune stillimage (flat UI compresses to ~1 Mbps anyway).
# usage: tools/render-delivery.sh <out.mp4>   (needs ~0.5 GB free for the frames)
set -e
cd "$(dirname "$0")/.."
OUT="$1"; TMP="$(mktemp -d)"
npx hyperframes render --format png-sequence --resolution landscape-4k --output "$TMP/frames"
DUR=$(sed -n 's/.*data-composition-id="main"[^>]*data-duration="\([0-9.]*\)".*/\1/p' index.html | head -1)
FRAMES=$(python3 -c "print(round($DUR*30))")
ffmpeg -loglevel error -y -framerate 30 -i "$TMP/frames/frame_%06d.png" -i "$TMP/frames/audio.m4a" -frames:v "$FRAMES" -map 0:v -map 1:a \
  -vf "scale=1920:1080:flags=lanczos+accurate_rnd+full_chroma_int:out_color_matrix=bt709:out_range=tv,format=yuv444p,unsharp=5:5:0.5:5:5:0,scale=flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p" \
  -c:v libx264 -preset veryslow -crf 10 -tune stillimage -x264-params "aq-mode=3:maxrate=20000:bufsize=40000" -profile:v high -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -movflags +faststart -c:a copy -t "$DUR" "$OUT"
rm -rf "$TMP"
echo "$OUT"
