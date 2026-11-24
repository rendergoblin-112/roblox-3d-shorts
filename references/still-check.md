# The still check: side by side before rendering

Never render the video first. A full render takes ~3–4 minutes; a still takes a fraction of a second. Fix everything on stills, then render once.

## The loop

```bash
cd <skill>/template
node tools/cli.mjs check   ../my-short                         # numbers first: duration, cuts, 93%, caption, voice
node tools/cli.mjs stills  ../my-short ../my-short/stills/r1 mid   # one still per shot at 60% of its length
node tools/cli.mjs sheet   ../my-short/stills/r1 ../my-short/stills/r1_sheet.jpg
node tools/cli.mjs compare ../my-short ../my-short/stills/r1 ../my-short/compare/r1
```

1. **Look at the contact sheet** (open the JPG). Read it as the viewer: does every shot say one thing? Is the lead's face visible and readable in every reaction?
2. **Look at the side-by-side pairs.** `compare` pairs each still with the house reference still for its camera type (`examples/wifi-lag/ref/`: `wide, insert, front_ms, reaction_cu, high, sibling, table, sofa, twoshot, night`): the approved WiFi short. If you have reference frames of your own (screenshots you are allowed to use, kept locally and never committed), pass `--refs <dir>` with files named the same way.
3. **Read the stats** `compare` prints: picture mean luminance ~117 for day shots (≈30–45 at night), p95 ~213, saturation 0.48–0.58, clipping < 1%.
4. **Fix what looks worse than the reference**, change one thing at a time, render the same stills again into `r2`, `r3`… Re-render only the shots you touched: `--shots id,id`.
5. Write each round down (what was wrong, what you changed). Keep the stills folders.
6. When the stills pass, render the motion-critical moments as frame runs (`stills ../my-short dir 600 603 606 609`) to check snaps and holds, then build the video.

## What to look for (every item here was a real bug in the original build)

| Problem | Fix |
|---|---|
| Camera inside a character's head, or only hair visible | move the camera back to where a prop/wall is and hide that prop/wall (`hide`) |
| An insert blocked by the back of a head | straight-on insert, hide the character and the chair |
| A chair or prop hides the lead in a wide | move the camera to see the profile, hands and the screen |
| A screen faces away from its user | turn the prop; add an over-the-shoulder insert so the screen reads |
| Wide shows the back of a head or an empty floor | new angle; move back through a hidden wall instead of widening |
| Characters left standing at the origin | give them a rest pose (REST) or keys in that shot |
| Two characters too far apart for a two-shot | move them (new spot) |
| Lights or RGB still on after the power-out | tie them to `power(on)` in the set |
| Frame too bright/flat (mean > 140) or murky (night < 30) | per-set exposure (`LOOK.setExposure`), night lift |
| Bloom haze from white props under a strong light | darker/wood props, weaker ceiling light |
| Black void above walls in an eye-level wide | ceilings (all sets have them) |
| Reaction faces read small or tame | big decal, meme detail, lift the head so the face meets the lens |
| A screen insert uses only half the frame | tighter FOV so the screen fills the width, but keep the HUD's edge text |
| Arms through furniture (victory pose through the headrest) | adjust the shape or the camera so it doesn't show |
| Caption line too wide (> ~0.76 W) | fewer words on that line |
| *(joke test)* Two avatars standing inside each other on one platform | give each a different `offset` in its game segments |
| *(joke test)* A fall/jump on a screen insert already over when the insert starts | start the game segment inside the shot that shows that screen |
| *(joke test)* A pink ball through the laptop screen | engine bug in the original build, fixed (flat lid logo) |
| *(joke test)* Over-the-shoulder insert blocked by a bigger character | straight-on insert hiding them (`laptop` camera) |
| *(joke test)* A reaction pose that hides the face (bent over) at eye level | a different shape, or a high angle |
| *(joke test)* A close shot against a bright plain wall measures hot (mean ~155) | `LOOK.setExposure` for that set + a diagonal angle |

Also render the **motion-critical moments as frame runs** before the video (a fall, a carry, the punchline): a mid-shot still can miss that the action isn't on screen at all.

## After the render

```bash
node tools/cli.mjs measure ../my-short/out/short.mp4
```

Compare against [format.md](format.md): duration, cuts/min, first cut, frozen-frame share (~52%), holds/min (~48), luminance (~117), loudness (−12 to −14 LUFS). Then pull a few frames from the final video at the same frame numbers as your approved stills and confirm they match before calling it done. Finish with an honest list of what still looks worse than the reference.
