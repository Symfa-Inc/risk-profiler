#!/bin/sh
# Delivery render, house spec B6: capture lossless PNG frames at 2x device scale (3840x2160), lanczos downscale to
# 1920x1080, then H.264 High CRF 14 preset slow yuv420p 30 fps, AAC 192k, +faststart, with a forced keyframe at the
# end-card start. No -tune and no unsharp: the 2x capture is the sharpness fix. The poster (B7) is frame T = 3.0 s
# of the same 4K sequence, never upscaled.
# usage: tools/render-delivery.sh [out.mp4]   (default ../demo-risk-profiler.mp4; needs ~0.6 GB free for the frames)
set -e
cd "$(dirname "$0")/.."
OUT="${1:-../demo-risk-profiler.mp4}"
POSTER_T=3.0
DUR=$(sed -n 's/.*data-composition-id="main"[^>]*data-duration="\([0-9.]*\)".*/\1/p' index.html | head -1)
FRAMES=$(python3 -c "print(round($DUR*30))")
# the end card starts on a forced keyframe, so no I-frame lands inside its still hold (a visible step)
ENDCARD=$(sed -n 's/.*data-composition-id="outro"[^>]*data-start="\([0-9.]*\)".*/\1/p' index.html | head -1)
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 1) 2x supersampled capture: lossless PNG, 3840x2160, plus the audio mix
npx hyperframes render --format png-sequence --resolution landscape-4k --fps 30 --output "$TMP/frames"

# 2) lanczos downscale to 1080p, then H.264 High CRF 14 preset slow yuv420p 30 fps, AAC 192k, faststart
ffmpeg -loglevel error -y -framerate 30 -i "$TMP/frames/frame_%06d.png" -i "$TMP/frames/audio.m4a" \
  -map 0:v -map 1:a -frames:v "$FRAMES" \
  -vf "scale=1920:1080:flags=lanczos+accurate_rnd+full_chroma_int:out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 14 -profile:v high -pix_fmt yuv420p -r 30 -force_key_frames "$ENDCARD" \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart -t "$DUR" "$OUT"

# 3) poster: the 4K frame at T, as RGB PNG (the sequence may start at frame_000000 or frame_000001)
N=$(python3 -c "print(round($POSTER_T*30))")
[ -f "$TMP/frames/frame_000000.png" ] || N=$((N + 1))
ffmpeg -loglevel error -y -i "$TMP/frames/frame_$(printf %06d "$N").png" -vf format=rgb24 "$(dirname "$OUT")/poster.png"
echo "$OUT"
