---
name: roblox-3d-shorts
description: Turn a one-line joke into a finished wordless 3D blocky-family comedy short (9:16, 42-47 s, pinned caption, locked camera, snap-and-freeze acting, decal faces, voice reactions on the beats), rendered with three.js and ffmpeg. Use when the user says "make a Roblox short", "3D Roblox short", "Roblox animation short", "Roblox meme short", "blocky family short", "make a short like the WiFi lag one", or gives a "When…"/"POV:…" joke to animate with the kid, sis, mom and dad.
---

# roblox-3d-shorts

Joke in, MP4 out: a 42–47 s vertical short in the locked-camera pose-comedy style, made with our own blocky family in real 3D. A new joke is new data (a shot list and a cue sheet), never a new engine.

`<skill>` below = the folder this SKILL.md is in. The engine is `<skill>/template`; the worked example is `<skill>/examples/wifi-lag`.

## 0. Setup (once)

```bash
cd <skill>/template
test -d node_modules || npm install      # three.js, fonts, puppeteer + its headless Chrome (into template/.cache)
node tools/cli.mjs doctor                # node >= 22.12, ffmpeg, browser, fonts
```

If `doctor` fails, fix that first (install ffmpeg; re-run `npm install`). Never commit `node_modules`, `.cache` or renders.

## 1. Write the joke (read references/joke-writing.md and references/caption.md)

1. Caption: 7–9 words, starts "When…" or "POV:…", two lines (short over long), 1–2 emoji at the end.
2. Beat sheet: premise (0–3.6 s) → **one problem repeated ~4 times, each faster and worse**, each ending on a reaction shot with a face swap → turn → **punchline at ~93%** → **button of ~2–3 s**, then cut.
3. Write the table: for each escalation, what makes it worse, the lead's reaction pose + face, and the interjection.
4. Show the user the caption and beat sheet in a few lines before building, unless they asked you to just go.

No dialogue, ever. Text only on in-world screens (game HUD, chat, banners). Use the family (`kid`, `sis`, `mom`, `dad`) unless the user asks otherwise.

## 2. Make the project folder (data only)

```bash
cp -R <skill>/examples/wifi-lag ./<short-name>     # in the user's working folder, not inside <skill>
rm -rf ./<short-name>/ref ./<short-name>/README.md # the house references stay in the skill
```

Then cut `sound.js` down to just the `bed` (its cues point at the WiFi shot ids and would flood `check` with warnings) and fill it in at step 5. The CLI can be run from any folder: `node <skill>/template/tools/cli.mjs …`.

Edit `./<short-name>/short.js` (format: references/engine.md):
- `CAPTION`, `SHOTS` (ids, cameras, lengths from {18, 24, 30, 36, 45, 60, 75} frames, `beat` tags, character keys `[frame, pose, face, moveFrames]`);
- `punchline: <frame>` or `powerOff: <frame>` on the punchline shot, at 0.93 × total;
- new spots / shapes / cameras / cast tweaks / `GAME` avatars only if the library lacks them (references/acting.md, camera.md, characters-and-faces.md);
- if the joke is in the game (several players, chat, falls, a carry), read the game section of references/engine.md: give avatars on one platform different `offset`s, and start every on-screen action *inside* the shot that shows that screen.

Acting: the lead moves on frame 1; snap over 3–8 frames, then hold dead still 8–16 frames; one gag per character per shot; the reaction is its own shot with a face swap (references/acting.md). Camera: locked, eye level + 25–40% high angles, medium/full shots, same-room cuts, at most one slow push (references/camera.md).

## 3. Check the numbers

```bash
cd <skill>/template
node tools/cli.mjs check <path-to>/<short-name>
```

Fix every ERROR and WARN you can: duration 42–47 s, ~44 cuts/min, median shot ~1.1 s, first cut ~1.3 s, punchline ~93%, 2–3 s button, 4 escalations, caption rules, ≥ 8 face swaps for the lead, voice on reaction frames.

## 4. Stills first, side by side (references/still-check.md)

```bash
node tools/cli.mjs stills  <proj> <proj>/stills/r1 mid
node tools/cli.mjs sheet   <proj>/stills/r1 <proj>/stills/r1_sheet.jpg
node tools/cli.mjs compare <proj> <proj>/stills/r1 <proj>/compare/r1
```

Open the sheet and the pairs (Read the JPGs). Compare each still with the house reference for its camera type; check the printed stats (day mean luminance ~117, night ~30–45, saturation 0.48–0.58). Fix what looks worse (the table in still-check.md lists every bug the original build hit), re-render only the touched shots with `--shots id,id` into r2, r3… Keep a short log of each round. Don't render video until the stills pass.

## 5. Sound (references/sound-and-voice.md)

Edit `<proj>/sound.js`. Reuse first: the 13 shipped sounds in `template/sfx` (kid voice reactions, power-out, TV crowd, lag, win, knuckles, music bed) and the `synth:` sounds. Voice clips start on the reaction's face-swap frame; one pop per reaction; the cause of each escalation gets its own sound; the bed dips under them, ducks under the voice, never goes silent.

New sounds only if needed, and only with the user's ElevenLabs key in the environment (`ELEVENLABS_API_KEY`):
```bash
node tools/cli.mjs sfx "cartoon young girl giggling, short, close mic, dry" <proj>/sfx/giggle.mp3 1.2
```
Run each `sfx` call as its own plain command and keep a log of every call (prompt, file, length, where it's used). Then measure where each file actually starts and how loud it is before placing it: `node tools/cli.mjs probe <proj>/sfx/*.mp3` (use its `trim` hint; very quiet files need positive gain). After `mix`, check the printed voice margins (aim +9 to +20 dB) and raise any reaction that's buried.

## 6. Render

```bash
node tools/cli.mjs build <proj> <proj>/out/short.mp4      # check + video + mix + mux + measure
```
If the machine has a render lock (e.g. `renderlock`), wrap it: `renderlock node tools/cli.mjs build …`. Expect ~0.15–0.2 s per frame (3–4 min for 43 s on an M1 Pro). For iterations, `video` and `mix` + `mux` can run separately.

## 7. Verify and report

- `measure` output against references/format.md (cuts/min, frozen share ~52%, holds ~48/min, luminance ~117, −12 to −14 LUFS).
- Pull frames from the MP4 at your approved still frames and confirm they match.
- Tell the user honestly what still looks worse than the reference (faces, acting stiffness, sets, framing, night readability, sound you couldn't listen to).

## Never

- Roblox logos, the Robux icon, Roblox UI or fonts, real game names, the "oof" sound, stock avatar geometry or colour scheme.
- Anything from other creators (videos, frames, transcripts, channel names) inside the project or its outputs.
- API keys in files.

## References

- references/format.md: every measured number (length, hook, rhythm, layout, motion, look, sound)
- references/joke-writing.md: the joke rules, beat sheet, worked example
- references/caption.md: the pinned caption
- references/characters-and-faces.md: the family, proportions, faces, adding cast, avatars
- references/acting.md: keys, pose library, the family's acting language
- references/camera.md: camera rules, library, set coordinates
- references/lighting-and-night.md: the look, targets, the power-cut night look
- references/sound-and-voice.md: cue sheet, voice rules, shipped and synth sounds
- references/still-check.md: the side-by-side check before rendering
- references/engine.md: short.js / sound.js format, game segments, CLI
