# Engine reference: the project format and the CLI

A short is a folder with two data files. The engine (`template/`) never changes per joke.

```
my-short/
  short.js     picture: caption, shots, cameras, poses, game script, cast tweaks
  sound.js     cue sheet (see sound-and-voice.md)
  sfx/         this short's own sounds (optional; looked up before template/sfx)
```

Start from a copy of `examples/wifi-lag/` and replace its contents.

## short.js exports

| Export | Required | What |
|---|---|---|
| `CAPTION` | yes | array of lines (or a string with `\n`) |
| `SHOTS` | yes | the shot list (below) |
| `WATERMARK` | | faint `@handle` centre-left |
| `CAST` | | overrides/additions to the family (`characters-and-faces.md`) |
| `PLACEMENT` | | who lives in which set by default: `{ room: ['kid'], sis: ['sis'], living: ['mom', 'dad'] }` |
| `REST` | | pose + face when a shot doesn't animate someone: `{ dad: ['couch.sit', 'smile'] }` or per set `{ living: { dad: [...] } }` |
| `SPOTS`, `SHAPES`, `POSES` | | extra pose pieces (`acting.md`) |
| `CAMERAS` | | extra cameras (`camera.md`) |
| `GAME` | | the in-game setup (below) |
| `LOOK` | | lighting/grade overrides (`lighting-and-night.md`), e.g. `{ setExposure: { living: 0.64 } }` |
| `SCREENS` | | default screen feeds for the whole short, e.g. `{ laptop: 'game' }` when someone plays on the laptop (a shot's `screens` still wins) |
| `LEAD` | | whose face swaps `check` counts (default: first character in shot 1) |

## A shot

```js
{ id: 'huh1', cam: 'front', len: 36, beat: 'esc1',
  kid: [[0, 'desk.lean', 'focus', 0], [4, 'desk.huh', 'huh', 6]] }
```

| Field | What |
|---|---|
| `id` | unique name (sound cues refer to it) |
| `cam` | a camera id; the set comes from the camera (or give `set`) |
| `len` | frames (30 fps). Draw from 18, 24, 30, 36, 45, 60, 75 |
| `beat` | `premise`, `esc1`…`esc4`, `turn`, `win`, `punch`, `button` (for `check`) |
| `<cast id>` | that character's keys `[frame, pose, face, moveFrames]` |
| `push` | the one slow push-in, e.g. `1.05` (zoom per second) |
| `powerOff` | frame (in this shot) where the power goes out for the whole house |
| `punchline` | frame of the punchline (if it isn't the power-off) |
| `screens` | what in-world screens show: `{ monitor: 'game' \| 'off', tv: 'match' \| 'game' \| 'off', laptop: 'call' \| 'game' \| 'off' }` (defaults: monitor game, tv match, laptop call) |
| `gameFocus` | which avatar the game camera + HUD follow in this shot (default `'me'`, or `GAME.focus[screen]`) |
| `gameView` | `'follow'` (behind the avatar) or `'wide'` (pulled back to show several players) |
| `game` | in-game segments starting in this shot (below) |
| `chat` | server chat lines: `[[frame, 'name', 'text', '#colour'?]]` (last 5 stay on screen) |
| `banner` | `[[frame, { text, sub?, color?, style: 'pill' \| 'card', lines?: [...], dur?: 45, confetti?, only?: avatar }]]` |
| `slam` | room: frame the desk jumps (keyboard + mouse) |
| `chairBack` / `chairOut` | room: frame the chair rolls back / chair pushed away all shot |
| `tvOff` / `lidClose` | living: frame the TV switches off / the laptop lid shuts |
| `router` | hall: `'busy'` (flicker) or `'red'` (alarm) |

## The game on the screens

A made-up obby ("LAVA LEAP"): 10 floating platforms over lava (0 = START pad, 10 = FINISH arch), spinning kill-bars, our own HUD (stage counter, session timer, ping pill with Wi-Fi bars, spinner, CONNECTION LOST / Rejoining, BACK TO START, YOU WIN). No real game's names, UI or fonts.

```js
export const GAME = {
  stages: 50, timer: [3, 12, 40],                  // HUD stage count, session timer start (h, m, s)
  avatars: {                                       // 'me' is the default focus
    me:  { cast: 'kid' },
    dad: { cast: 'dad', look: 'default', tag: 'dad_1979' },
    p1:  { look: { shirt: '#ff4fc0', pants: '#2a2a5a', hairStyle: 'buns', hair: '#ffd23a' }, tag: 'zoe' },
  },
  focus: { monitor: 'me', laptop: 'dad' },         // default focus per screen
};
```

Segments (`game: [[frame, { avatar?: 'me', mode, ... }]]`); the game clock is absolute and runs across cuts. The last segment at or before a frame wins, per avatar.

| mode | fields | what |
|---|---|---|
| `stand` | `at, stage` | stands on platform `at` |
| `spawn` | `quiet?` | appears at START (shows BACK TO START unless `quiet`) |
| `run` | `from, to, dur, s0, s1, ping?` | hops platform to platform over `dur` frames; stage counter s0→s1 |
| `jump` | `lagAt, peak, ramp, slip` | the final jump, frozen by lag at `lagAt`: ping climbs to `peak`, spinner, rubber-band, slides back at `slip` |
| `rejoin` | `dur` | CONNECTION LOST screen with a progress bar |
| `win` | `from, to, dur` | the last hop, then YOU WIN + confetti |
| `fall` | `from` | a weak jump off platform `from` that drops into the lava (splash, then gone) |
| `cheer` | `at` | bouncing with arms up on platform `at` (default: finish) |
| `carry` | `by` | piggyback on another avatar |
| `follow` | `target, delay, offset: [x, z]` | copies another avatar's moves `delay` frames later, offset |
| `hidden` | | not in the world |

Any segment can also take `offset: [x, z]` (course units) so several avatars can share a platform without standing inside each other: e.g. `{ avatar: 'me', mode: 'stand', at: 0, offset: [-1.4, 0] }` and `{ avatar: 'dad', mode: 'spawn', offset: [1.4, 0] }`. The START pad is 7×7, the others ~2.5 wide. `face` overrides the avatar's face for that segment.

Avatars default to the kid only (`{ me: { cast: 'kid' } }`). The game camera sits behind the focus avatar, so put other avatars beside it, not between it and the camera.

Timing that matters when you plan shots around the game:
- **Start an on-screen action inside the shot that shows the screen.** The game clock runs across cuts: a fall that starts in a shot of someone's face is over by the time you cut to the monitor.
- A `fall` from START hits the lava ~25 frames after it starts (from platform 1, ~26): put the splash sound there.
- A `run` of 9 hops in 24 frames is a speed-run; 36 frames is normal; ~170 frames reads as a steady carry.
- `follow` delays of 4/8/12 frames with sideways offsets (`[±2, 0]`) read as a train behind the leader; long delays put followers right in front of the game camera.
- In the `follow` view, looking down the course, `+x` appears on the **left** of the screen.
- `'wide'` view: pulled back and up to show several players; tags and chat stay readable on the monitor.

## Sets

`room` (kid's bedroom + PC), `sis` (sister's room, ring-light phone that shows a live render), `living` (dining table + laptop, couch + TV), `hall` (router), `ext` (the house at night). Coordinates in `camera.md`. Only the sets your shots use are built.

## CLI (`node tools/cli.mjs …` from `template/`)

| Command | What |
|---|---|
| `check <project>` | shot table + format checks; exits 1 on errors |
| `stills <project> <dir> [mid\|start\|end\|frames…] [--shots a,b]` | PNG stills |
| `sheet <dir> <out.jpg> [cols]` | contact sheet |
| `pair <ours> <ref> <out.jpg> [label]` | one side-by-side |
| `compare <project> <stills> <out> [--refs dir]` | side-by-sides with the house references + stats |
| `stats <png…>` | luminance / saturation |
| `video <project> <out.mp4> [start end]` | silent render (wrap in `renderlock` if your machine has it) |
| `mix <project> <out.wav>` | soundtrack |
| `mux <video> <wav> <out.mp4>` | add sound, picture copied |
| `build <project> <out.mp4>` | check + video + mix + mux + measure |
| `measure <mp4>` | cuts, frozen share, holds, luminance, loudness |
| `faces <out.png>` | every face decal |
| `sfx "<prompt>" <out.mp3> [s] [--music]` | one ElevenLabs sound (needs `ELEVENLABS_API_KEY`) |
| `probe <sound…>` | where each sound starts/ends inside its file, how loud, trim hint |
| `regen-sfx [--force] [--out dir]` | regenerate the shipped sounds from `sfx/prompts.json` |
| `doctor` | node, ffmpeg, browser, fonts |

Environment: `FFMPEG` (path to ffmpeg), `CHROME` (use another Chrome), `CHROME_ARGS` (extra flags), `ELEVENLABS_API_KEY`.
Rendering: headless Chrome draws each frame with three.js (WebGL) and pipes PNGs to ffmpeg (libx264, CRF 16). About 0.15–0.2 s per frame on an Apple M1 Pro.
