#!/bin/sh
# Fits a raw Lyria take (from tools/lyria-structured.py, 4 s warm-up lead) to the film and cleans it up:
#   trim the 4 s lead; two 12 kHz low-passes (Lyria leaves narrow tones at 13-19 kHz); -3 dB low shelf at
#   110 Hz; gain to about -16 LUFS; 0.8 s fade-in; fade-out 54.3 -> 57.2 s under the end card (end card +3.9 s,
#   2.9 s long, house spec B2.11); true silence to 57.9 s; limiter at -1.5 dBFS.
# usage: tools/make-bed.sh <raw.wav|flac> <out.flac|mp3> [extra notch filters for tones the analysis found]
# The approved bed (assets/music/source-option8-*.mp3) was cut for the 57.6 s v3 film. The 57.9 s film holds the
# summary columns 1.2 s longer, so the bed repeats two beats (1.19 s, the take's measured 101 BPM) inside the sustained
# chord at 43.9-45.1 s: the seam scored best for onset pattern and chroma on both sides of the jump, it sits in a quiet
# spot between notes, and it has a 20 ms crossfade. Everything after it plays 1.19 s later, sample-exact; then the
# bed fades under the end card:
#   ffmpeg -i assets/music/source-option8-rhodes-guitar-warm.mp3 -i assets/music/source-option8-rhodes-guitar-warm.mp3 \
#     -filter_complex "[0:a]atrim=0:45.125,asetpts=PTS-STARTPTS[a];[1:a]atrim=start=43.915,asetpts=PTS-STARTPTS[b];\
#       [a][b]acrossfade=d=0.02,afade=t=out:st=54.3:d=2.9,atrim=0:57.2,apad=whole_dur=57.9" \
#     -ar 48000 -ac 2 -sample_fmt s16 -c:a flac -compression_level 12 assets/music/bed.flac
set -e
cd "$(dirname "$0")/.."
IN="$1"; OUT="$2"
CLEAN="lowpass=f=12000:poles=2,lowpass=f=12000:poles=2,bass=g=-3:f=110${3:+,$3}"
I=$(ffmpeg -hide_banner -nostats -ss 4 -t 57.9 -i "$IN" -af "$CLEAN,ebur128" -f null - 2>&1 | awk '/I:/{v=$2} END{print v}')
GAIN=$(echo "-16 - ($I)" | bc -l)
case "$OUT" in *.mp3) CODEC="-c:a libmp3lame -b:a 192k" ;; *) CODEC="-sample_fmt s16 -c:a flac -compression_level 12" ;; esac
ffmpeg -loglevel error -y -ss 4 -t 57.2 -i "$IN" \
  -af "$CLEAN,volume=${GAIN}dB,afade=t=in:st=0:d=0.8,afade=t=out:st=54.3:d=2.9,alimiter=limit=0.84:level=false,apad=whole_dur=57.9" \
  -ar 48000 -ac 2 $CODEC "$OUT"
echo "$OUT: source $I LUFS, gain $GAIN dB"
