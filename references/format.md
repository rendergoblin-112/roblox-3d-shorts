# Format: the measured numbers

From a frame-by-frame study of 17 wordless blocky-avatar comedy shorts (every frame decoded at 30 fps; cuts, holds, camera motion, colour, caption geometry and loudness measured; shot size, angle, faces and joke beats coded by eye on every shot). "n/17" = how many of the 17 follow the rule.

The set splits into two production styles. **This skill makes style A** (locked-camera pose comedy). Don't blend them.

| | Style A: locked-camera pose comedy (this skill) | Style B: moving-camera sketch |
|---|---|---|
| Length | **42–47 s** (median 43.4 s) | 15–24 s (median 19 s) |
| Camera | static inside a shot (94% of shots); at most one slow push | moves in ~92% of shots |
| Motion | snap, then freeze (52% of frames frozen) | never freezes |
| Layout | black band with the caption above the picture | full bleed, caption over the picture |
| Caption | 2 lines, ~9 words, 1–2 emoji | 1 line, ~7 words |
| Sound | doesn't cut on beats | cuts on sound hits |

## Output

| Rule | Number |
|---|---|
| 9:16, **1080×1920, 30 fps**, h264 + AAC | sources were 720×1280; render 1080×1920 for upload |
| Length 42–47 s | 12/17 inside their style's band |

## Layout (style A, banded)

- Picture window **1080×1210 starting at y = 355** (0.63 of the height, top at 0.185 H). Black bands above and below.
- The pinned caption sits in the top band (see [caption.md](caption.md)).
- Faint watermark (`@handle`) centre-left of the picture, optional (12/17 had one).

## Hook (first 3 s)

| Rule | Number |
|---|---|
| Something moves on frame 1. No title card, no establishing still. | median first change at frame 1; latest 0.63 s (17/17 within 1 s) |
| A character acts from frame 0. | first action at 0.0 s (16/17 by 0.5 s) |
| The premise reads by ~1 s from caption + first shot. | median 1.0 s |
| The caption is on screen from frame 0. | 98.9–100% of runtime |
| First cut by ~1.3 s; 2 cuts inside the first 3 s. | first cut median 1.27 s |
| No voice in the hook. | first word ≥ 2 s or none (15/17) |

## Rhythm

| Rule | Number |
|---|---|
| ~**44 cuts per minute** | median 43.5/min; locked-camera shorts 38–53/min |
| Median shot **1.1 s**; most shots 0.6–2.3 s; nothing over ~3.5 s | p10 0.61 s, p90 2.28 s, longest median 3.47 s |
| Shot lengths to draw from (frames) | **18, 24, 30, 36, 45, 60, 75** (measured p10–p90: 18–68) |
| Hard cuts only. No dissolves, wipes, flashes. | 0 flash frames in 18/18 |
| Cut between angles inside one set (same-room cuts). | 4/6 locked-camera shorts |
| Last shot ~1 s, ending on the button. | median 1.13 s |

## Motion

| Rule | Number |
|---|---|
| Pose to pose; rigid parts; no squash and stretch. | 16/17 |
| Moves last ~12 frames (0.4 s), then the whole frame freezes ~12 frames. | frozen frames median **52%** (37–70%); holds ≥ 6 frames **48/min** (43–74); hold median 11.75 f |
| One gag per character per shot; the reaction is its own shot with a face swap. | 10/17 |

## Joke shape (details in [joke-writing.md](joke-writing.md))

| Rule | Number |
|---|---|
| One premise, from the caption, escalated ~**4 times** | escalations median 4 (1–7) |
| Punchline at ~**93%** of the runtime | median 0.93 (0.68–0.97); 14/17 in the last 15% |
| Stop ~2 s after the punchline | median 1.9 s (at 43 s, 93% leaves ~3 s: a two-beat button) |

## Look (details in [lighting-and-night.md](lighting-and-night.md))

| Rule | Number |
|---|---|
| Bright mid-key: picture mean luminance ~**117**/255, p95 ~213, almost no clipping | mean 117 (62–166); ≥250 is 0.4% |
| Saturated; style A more so | HSV saturation 0.48 pooled, **0.58** style A (0.45–0.72) |
| Warm palette + a cyan/blue accent | red–yellow ≈ half of saturated pixels |
| Style A crushes blacks | luminance p05 ≈ 0–1 |
| Soft shadows, light bloom, subtle AO, matte plastic | 16/17, 15/17, 14/17, 16/17 |

## Sound (details in [sound-and-voice.md](sound-and-voice.md))

| Rule | Number |
|---|---|
| About **−12 to −14 LUFS** integrated, true peak ≤ −1 dBTP | median −11.6 LUFS (−21.9 to −4.8) |
| Never silent: a continuous bed | frames below −50 dBFS < 1% (16/17) |
| No dialogue: interjections only, at reactions | 2–11 recognised words per locked-camera short |
| ~1.8 sound events per second | median 1.84 |

## What our WiFi-lag short measured (`node tools/cli.mjs measure`)

| Metric | Ours | Target |
|---|---|---|
| Duration | 42.8 s | 42–47 s |
| Hard cuts | 35 (49.1/min) | ~44 (38–53) |
| First cut | 1.40 s | ~1.3 s |
| Frozen-frame share | 60.3% | 52% (37–70%) |
| Holds ≥ 6 frames | 69/min | 48/min (43–74) |
| Picture luminance | 121.5 | ~117 |
| Loudness | −13.1 LUFS / −0.9 dBTP | −12 to −14 |
| Punchline | 92.8% | ~93% |

The detector counts every full-screen change as a cut, so in-shot changes (power-out, a game screen switching) add to its count. `check` counts the real cuts from the shot list.

## Uncertain (be honest about these)

- Shot size, angle, faces, lens and joke beats were coded by eye from the first/middle/last frame of every shot, single coder.
- Face-swap counts are lower bounds (swaps between sampled frames aren't seen).
- Lens wasn't measured: "mildly wide" is an eye judgement; 50–60° vertical FOV is a starting value.
- Light and post settings are derived to hit the measured luminance and saturation, not measured.
- Loudness varied a lot and platforms normalise playback; −13 LUFS is a production target, not a rule.
