# roblox-3d-shorts

A free Claude Code skill that turns a one-line joke into a finished **wordless 3D comedy short** in the blocky-avatar meme style: 9:16, 42–47 s, a pinned caption, a locked camera, snap-and-freeze acting, flat decal faces that swap on every beat, voice reactions ("huh?", "no no no", screams) on the reactions, and a punchline at ~93%.

Everything is real 3D built in code with three.js: the house, a recurring blocky family (kid, sister, mom, dad), the PC and a made-up obby on the monitor. A new joke is a new shot list (plain data), not new code. The rules come from a frame-by-frame study of 17 shorts in this genre, and the engine ships with the short it was built for ("When your WiFi lags one second before you win") as a worked example.

**Not affiliated with Roblox Corporation.** "Roblox" is their trademark and only describes the genre here. This project contains no Roblox assets, logos, Robux icon, UI, fonts, sounds or avatar geometry; the characters, sets, game and sounds are original.

## Install (one command)

```bash
git clone https://github.com/rendergoblin-112/roblox-3d-shorts ~/.claude/skills/roblox-3d-shorts && cd ~/.claude/skills/roblox-3d-shorts/template && npm install
```

`npm install` fetches three.js, two fonts and puppeteer, and puppeteer downloads its small headless Chrome into `template/.cache/` (about 300 MB in total, nothing outside the folder). Then render the example to check everything works (3–4 minutes):

```bash
npm run example
```

That writes `template/out/wifi-lag.mp4`. `node tools/cli.mjs doctor` checks node, ffmpeg and the browser if anything fails.

## Use it

Open Claude Code in any folder and ask, for example:

> Make a Roblox short: "When mom says five more minutes" — the kid keeps asking for five more minutes of his game, mom's patience runs out four times, and at the end she's the one who can't stop playing.

The skill writes the caption and a beat sheet, builds the shot list from the family's pose and camera library, checks the format numbers, renders stills and compares them side by side with the reference frames, fixes what looks worse, mixes the sound, and renders `out/short.mp4`.

## Requirements

- **Node.js 22.12 or newer** (tested on 22.16)
- **ffmpeg** on your PATH (tested with 9.0; macOS: `brew install ffmpeg`), or set `FFMPEG=/path/to/ffmpeg`
- **Claude Code**, with this folder in `~/.claude/skills/`
- Optional: an **ElevenLabs API key** to generate new sound effects or voice reactions, read from the `ELEVENLABS_API_KEY` environment variable. The 13 shipped sounds and the built-in synthesized ones work without it.
- Tested on macOS (Apple Silicon, GPU via Metal). Linux and Windows should work through Chrome's software renderer, but more slowly; they haven't been tested.

## What's inside

```
SKILL.md                 the workflow Claude follows
references/              the measured format, joke rules, caption, characters and faces, acting,
                         camera, lighting and the power-cut night look, sound cue sheet, still check,
                         engine/data reference
template/                the engine: engine/ (three.js), tools/cli.mjs (check, stills, compare,
                         video, mix, build, measure, sfx), sfx/ (shipped sounds + their prompts)
examples/wifi-lag/       the original short as data: short.js (shots), sound.js (cues), ref/ (house reference stills)
```

Common commands (from `template/`):

```bash
node tools/cli.mjs check   ../examples/wifi-lag                      # format checks
node tools/cli.mjs stills  ../examples/wifi-lag out/stills mid       # one still per shot
node tools/cli.mjs build   ../examples/wifi-lag out/wifi-lag.mp4     # video + sound
```

## License

MIT, see [LICENSE](LICENSE). The shipped sounds in `template/sfx` were generated for this project with ElevenLabs; their prompts are in `template/sfx/prompts.json`.
