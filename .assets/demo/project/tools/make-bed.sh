#!/bin/sh
# Fits a raw Lyria take (from tools/lyria-structured.py, 4 s warm-up lead) to the film and cleans it up:
#   trim the 4 s lead; two 12 kHz low-passes (Lyria leaves narrow tones at 13-19 kHz); -3 dB low shelf at
#   110 Hz; gain to about -16 LUFS; 0.8 s fade-in; fade-out 53.1 -> 56.0 s under the end card (end card +3.9 s,
#   2.9 s long, house spec B2.11); true silence to 56.7 s; limiter at -1.5 dBFS.
# usage: tools/make-bed.sh <raw.wav|flac> <out.flac|mp3> [extra notch filters for tones the analysis found]
# The approved bed (assets/music/source-option8-*.mp3) was cut for the 57.6 s v3 film; refit it to 56.7 s with
#   ffmpeg -i assets/music/source-option8-rhodes-guitar-warm.mp3 \
#     -af "afade=t=out:st=53.1:d=2.9,atrim=0:56.0,apad=whole_dur=56.7" -ar 48000 -ac 2 -sample_fmt s16 \
#     -c:a flac -compression_level 12 assets/music/bed.flac
set -e
cd "$(dirname "$0")/.."
IN="$1"; OUT="$2"
CLEAN="lowpass=f=12000:poles=2,lowpass=f=12000:poles=2,bass=g=-3:f=110${3:+,$3}"
I=$(ffmpeg -hide_banner -nostats -ss 4 -t 56.7 -i "$IN" -af "$CLEAN,ebur128" -f null - 2>&1 | awk '/I:/{v=$2} END{print v}')
GAIN=$(echo "-16 - ($I)" | bc -l)
case "$OUT" in *.mp3) CODEC="-c:a libmp3lame -b:a 192k" ;; *) CODEC="-sample_fmt s16 -c:a flac -compression_level 12" ;; esac
ffmpeg -loglevel error -y -ss 4 -t 56.0 -i "$IN" \
  -af "$CLEAN,volume=${GAIN}dB,afade=t=in:st=0:d=0.8,afade=t=out:st=53.1:d=2.9,alimiter=limit=0.84:level=false,apad=whole_dur=56.7" \
  -ar 48000 -ac 2 $CODEC "$OUT"
echo "$OUT: source $I LUFS, gain $GAIN dB"
