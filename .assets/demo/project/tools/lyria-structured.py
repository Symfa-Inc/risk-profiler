#!/usr/bin/env python3
"""Generate a music bed shaped to the film with Google Lyria RealTime.

Lyria streams one continuous piece; this script changes density and brightness at cue points (by generated
audio position, sent ~2 s early to cover the model's buffer) so the bed starts gentle, opens when the product
starts working, fills out for the explanation chapters and thins out under the end card.

  python tools/lyria-structured.py --option 2 --output /tmp/opt2.wav

Needs $GEMINI_API_KEY (or $GOOGLE_API_KEY) and `pip install google-genai`.
"""

import argparse
import asyncio
import os
import sys
import wave

SR, CH, SW = 48000, 2, 2
LEAD = 4.0  # seconds generated before film time 0 (Lyria's first seconds are a warm-up); trimmed later

OPTIONS = {
    1: {
        "seed": 101,
        "name": "warm-electronic",
        "bpm": 100,
        "scale": "D_MAJOR_B_MINOR",
        "prompt": "Warm soft analog synths, gentle side-chained pad pulse, light soft kick and shaker, warm sub bass, modern SaaS product demo underscore, calm and optimistic",
    },
    2: {
        "seed": 202,
        "name": "minimal-piano",
        "bpm": 100,
        "scale": "C_MAJOR_A_MINOR",
        "prompt": "Minimal felt piano motif, clean and confident, subtle light percussion with soft rim clicks and brushed hats, warm upright bass, modern minimal underscore",
    },
    3: {
        "seed": 303,
        "name": "ambient-cinematic",
        "bpm": 80,
        "scale": "F_MAJOR_D_MINOR",
        "prompt": "Airy ambient pads, slow evolving strings, soft piano notes with long reverb, no drums, no percussion, calm premium cinematic underscore",
    },
    4: {
        "seed": 404,
        "name": "upbeat-tech",
        "bpm": 115,
        "scale": "G_MAJOR_E_MINOR",
        "prompt": "Plucky bright synth arpeggios, light claps and crisp soft hats, round bass, optimistic modern tech underscore, unobtrusive and clean",
    },
    # round 2, in the InsureCast bed's direction (light acoustic-electronic, ~100 BPM, plucked motif over a warm
    # low end, steady energy, A minor / C major), blended with what worked in options 1 and 4
    5: {
        "seed": 505,
        "name": "acoustic-pulse",
        "bpm": 100,
        "scale": "C_MAJOR_A_MINOR",
        "energy": 0.0,
        "prompt": "Fingerpicked acoustic guitar motif over a warm analog synth pad pulse, soft kick, shaker, deep warm sub bass, light acoustic-electronic product underscore, hopeful and confident",
    },
    6: {
        "seed": 606,
        "name": "marimba-tech",
        "bpm": 100,
        "scale": "C_MAJOR_A_MINOR",
        "energy": 0.05,
        "prompt": "Marimba and kalimba plucks with a plucky synth arpeggio, light claps on the backbeat, soft kick, round warm bass, bright modern tech underscore, optimistic and clean",
    },
    7: {
        "seed": 707,
        "name": "bright-pluck-drive",
        "bpm": 150,
        "scale": "G_MAJOR_E_MINOR",
        "energy": 0.1,
        "prompt": "Half-time groove, bright plucked synths and muted electric guitar, crisp soft hats, claps, warm sub bass, uplifting modern tech product launch underscore, energetic but unobtrusive",
    },
    8: {
        "seed": 808,
        "name": "rhodes-guitar-warm",
        "bpm": 100,
        "scale": "F_MAJOR_D_MINOR",
        "energy": -0.05,
        "prompt": "Warm Rhodes electric piano chords and nylon guitar plucks, brushed drums, soft warm bass, gentle acoustic-electronic underscore, calm, assured and premium",
    },
}
NEG = "vocals, singing, choir, heavy drums, distortion, aggressive, dubstep, EDM drop, noise, lo-fi crackle"
# film-time cues: (start s, density, brightness). Seams: 7.2 app in, 28.8 explanation, 49.2 end card.
CUES = [(0.0, 0.25, 0.55), (6.6, 0.45, 0.62), (28.2, 0.55, 0.66), (48.4, 0.22, 0.5)]
NO_DRUMS = {3}


async def run(opt: int, out: str, duration: float) -> None:
    from google import genai
    from google.genai import types

    o = OPTIONS[opt]
    energy = float(o.get("energy", 0))  # type: ignore[arg-type]
    key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not key:
        sys.exit("GEMINI_API_KEY / GOOGLE_API_KEY not set")
    client = genai.Client(api_key=key, http_options={"api_version": "v1alpha"})
    total = duration + LEAD
    target = int(total * SR * CH * SW)
    buf = bytearray()

    def cfg(density, brightness):
        c = {
            "bpm": o["bpm"],
            "temperature": 1.0,
            "seed": o["seed"],
            "density": density,
            "brightness": brightness,
            "scale": getattr(types.Scale, o["scale"]),
        }
        if opt in NO_DRUMS:
            c["mute_drums"] = True
        return types.LiveMusicGenerationConfig(**c)

    async with client.aio.live.music.connect(model="models/lyria-realtime-exp") as s:
        await s.set_weighted_prompts(
            prompts=[
                types.WeightedPrompt(text=o["prompt"], weight=1.0),
                types.WeightedPrompt(text=NEG, weight=-0.6),
            ],
        )
        await s.set_music_generation_config(
            config=cfg(CUES[0][1] + energy, CUES[0][2]),
        )
        await s.play()
        pending = list(CUES[1:])
        while len(buf) < target:
            async for msg in s.receive():
                sc = msg.server_content
                if sc and sc.audio_chunks:
                    for ch in sc.audio_chunks:
                        buf.extend(ch.data)
                    t = len(buf) / (SR * CH * SW) - LEAD
                    while pending and t >= pending[0][0] - 2.0:
                        _, d, b = pending.pop(0)
                        await s.set_music_generation_config(
                            config=cfg(min(0.9, d + energy), b),
                        )
                    if len(buf) >= target:
                        break
    with wave.open(out, "wb") as w:
        w.setnchannels(CH)
        w.setsampwidth(SW)
        w.setframerate(SR)
        w.writeframes(bytes(buf[:target]))
    print(f"{o['name']}: {out} ({total:.1f}s incl. {LEAD}s lead)")


if __name__ == "__main__":
    a = argparse.ArgumentParser()
    a.add_argument("--option", type=int, required=True)
    a.add_argument("--output", required=True)
    a.add_argument("--duration", type=float, default=57.6)
    a.add_argument(
        "--seed",
        type=int,
        default=None,
        help="override the option's seed for another take",
    )
    x = a.parse_args()
    if x.seed is not None:
        OPTIONS[x.option]["seed"] = x.seed
    asyncio.run(asyncio.wait_for(run(x.option, x.output, x.duration), timeout=240))
