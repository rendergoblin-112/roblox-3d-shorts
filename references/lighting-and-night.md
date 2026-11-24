# Lighting, colour and the power-cut night look

## Targets (measured on the study shorts)

| | Target |
|---|---|
| Picture mean luminance | **~117**/255 (style A shorts 103–130) |
| Highlights (p95) | ~213; clipping (≥ 250) under 1% |
| Saturation (HSV mean) | **0.48–0.58** (style A 0.58, range 0.45–0.72) |
| Blacks (p05) | style A crushes to ~0 |
| Palette | warm-dominant (red/orange/yellow ≈ half the saturated pixels) + a cyan/blue accent |
| Shadows | soft, from a top-front key; no hard sun shadows indoors |
| Bloom | light, on bright surfaces |
| AO | subtle, in corners and contacts |
| Materials | smooth matte plastic: no metal, no reflections |
| DOF | none in style A |

Check them with `node tools/cli.mjs stats <pngs>` or `compare` (it prints them for every still).

## How the engine gets there (`engine/main.js`, knobs in `engine/look.js`)

| Piece | Setting |
|---|---|
| Ambient | `HemisphereLight` sky #dfe8ff / ground #6b5a4a, 1.15 + a `RoomEnvironment` PMREM at 0.45 |
| Key | one `DirectionalLight` #fff1de, 2.3, **re-aimed every shot** to 30° left of and 50° above the shot's camera (top-front-left), VSM soft shadows (2048 map, radius 5) |
| Practicals | ceiling point light, desk lamp, monitor glow, TV glow, laptop glow, ring light (all switch off in the power-out) |
| Materials | `MeshStandardMaterial`, roughness 0.55–0.7, metalness 0 |
| Post | GTAO (blend 0.75) → UnrealBloom (0.3, threshold 0.85) → Neutral tone mapping, exposure 0.75 → grade: saturation ×1.05, black clamp 0.08, corner vignette 0.28 |
| Per-set exposure | room 0.9, sis 0.68, living 0.74, hall 0.8, ext 1.0 |

ACES (the obvious choice) desaturated the warm plastic; Neutral kept the saturation without pushing the grade.

Override any knob per project: `export const LOOK = { exposure: 0.8, setExposure: { living: 0.8 } };`

Palette in the sets: warm wood floors, orange hoodie, red gaming chair, yellow living room, against cyan/blue walls, rug and the night sky in the window.

## The power-cut night look

Put `powerOff: <frame>` on one shot. From that frame on, for every set:
- room, ceiling, lamp, monitor, TV, laptop and ring lights switch off; screens, keyboard RGB, PC fans and LEDs go dark;
- the key light becomes **cool moonlight** (#8aa6ff, 2.6) from the window side;
- hemisphere and environment drop to deep blue;
- the exterior's windows go dark while the neighbours and street lamp stay lit;
- exposure gets a night lift (room ×2.1, exterior ×1.6) so the frame still reads (mean ≈ 30–45);
- the music bed hard-cuts and crickets start (sound.js).

It is a real lighting change *inside the shot*, never a cut to black: the punchline image is the room going dark around him, then the dark house among lit neighbours.

## Lessons from the fix rounds

- First pass was too bright and flat (mean 150–190, p95 ≈ 240): exposure 1.0 → 0.75, black clamp up, per-set trims, saturation boost down.
- White table + white laptop + strong ceiling light washed shots out through bloom: use wood and grey props, keep ceiling lights modest.
- Black void above the walls in eye-level wides: every interior has a ceiling.
- Night frames at mean 30–35 were unreadable: brighter moon key and blue hemisphere. The moonlit face still reads harder than any reference frame; a moonlight rim on the face would help (honest gap).
- The sister's pastel room measures low saturation (0.37–0.42) next to the rest; acceptable as a contrast, but don't add more pastel sets.
