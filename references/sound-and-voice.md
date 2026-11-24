# Sound and voice: the cue sheet

## Rules (measured)

| Rule | Number |
|---|---|
| ~**−13 LUFS** integrated (−12 to −14), true peak ≤ −1 dBTP | study median −11.6 LUFS; platforms normalise anyway |
| **Never silent**: a continuous bed under everything | frames below −50 dBFS < 1% |
| **No dialogue.** Interjections only, **on reaction beats**: "huh?", "no no no", "uh", yells, screams, a whimper | 2–11 recognised words per style-A short, all interjections |
| ~1.8 sound events per second (SFX + music events) | median 1.84 |
| Style A does **not** cut on beats: sounds sit on actions, not cuts | cuts-on-onset 0.27 vs chance 0.25 |
| No voice in the first ~2 s | 15/17 |

## The voice

The lead's voice escalates with the joke: confused → panicked → yelling → screaming, then the payoff reaction. Each clip starts **on the frame its reaction face swaps in** (the same frame as the pose key). `check` warns when a vox cue isn't on a key or on a face swap at the cut.

- The bed ducks 6 dB under the voice (40 ms attack, 250 ms release); effects dip 4 dB.
- Aim for the voice **+9 to +20 dB** over everything else in the 200–4000 Hz band; `mix` prints the margin for every clip. A reaction that coincides with a pop or whoosh loses margin: keep those quieter or move them a few frames.
- The family can have non-word sounds (muffled "wah-wah" call voices), never lines.

## sound.js

```js
export const SOUND = {
  bed: { file: 'bed.mp3', gain: -4, duck: -6,
         starts: [['hook', 0], ['rejoin1', 33]],     // (re)start from the top of the file
         tapeStops: [['lag1', 12]],                  // slows to a halt over 0.55 s (a gag: the music lags too)
         cut: 'power',                               // hard cut at the power-off frame, or [shot, frame]
         dip: { gain: 0.45, shots: ['sis1'] } },     // quieter under shots that carry their own sound
  roomTone: 0.075,        // keeps it never-silent
  crickets: true,         // after the power-out
  cues: [ [shot, frame, sound, gainDb, { pan, trim, take, band: [lo, hi], len, ...synth options }] ],
  vox:  [ [shot, frame, sound, gainDb, { cutAt: [shot, frame] }] ],   // cutAt fades it out 0.12 s where the next beat interrupts
  master: { lufs: -13, limit: 0.84 },
};
```

- Times are `[shot id, frame in shot]`; `'power'` means the power-off frame.
- Files are looked up in `<project>/sfx/` first, then `template/sfx/`.
- `trim` skips dead air at the start of a file (measure it: see below); `take` keeps only the first N seconds; `band` limits it (a TV speaker: `[300, 6000]`).

## Shipped sounds (`template/sfx/`, generated with ElevenLabs for the WiFi short; prompts in `sfx/prompts.json`)

| File | What | Starts at |
|---|---|---|
| `huh.mp3` | kid: short confused "huh?" | 0.03 s |
| `nonono.mp3` | kid: panicked "no no no no" | 0.01 s |
| `scream_short.mp3` | kid: short angry yell | 0.00 s |
| `scream_long.mp3` | kid: long rage scream (2.2 s) | 0.00 s |
| `yes.mp3` | kid: triumphant "YESSS" | 0.00 s |
| `whimper.mp3` | kid: small sad whimper | 0.00 s |
| `powerout.mp3` | whole-house power-down with a breaker clunk | 0.00 s |
| `crowd.mp3` | stadium crowd from a TV | 0.00 s |
| `tvoff.mp3` | TV switching off (trim 0.2) | 0.22 s |
| `lag.mp3` | network-lag glitch stutter | 0.00 s |
| `win.mp3` | cartoon victory jingle | 0.00 s |
| `knuckles.mp3` | knuckle crack (trim 0.31, quiet: +10/+12 dB) | 0.33 s |
| `bed.mp3` | 46 s playful cartoon comedy bed, ~130 bpm, steady from 0 s (restarts land on the groove) | 0.00 s |

## Synth sounds (`'synth:<name>'`, generated in code)

`click`, `typing` (len), `glitch`, `fail`, `impact`, `thump`, `whoosh`, `riser`, `scale`, `pop`, `shimmer`, `bwomp` ("back to start"), `router` (len, fast), `wahwah` (len, base pitch: muffled adult talk), `scratch` (record scratch), `chairRoll`, `sadNote`, `phone` (len, offset: the bed through a phone speaker).

## The WiFi short's cue pattern (copy the shape)

- a pop on every reaction face swap (−4 dB);
- the cause gets its own sound (phone music, router beeps, wah-wah call, TV crowd) and the bed dips under it;
- the game music is diegetic: it tape-stops at each lag, restarts on respawn, cuts at the power-out;
- one physical hit per escalation (slam, chair roll, whooshes on the flails);
- a record scratch when the family freezes; knuckle cracks before the final attempt; a riser under the final run; the victory jingle; the breaker clunk on the punchline; crickets and one sad note on the button.

## New sounds

Generate with ElevenLabs (needs `ELEVENLABS_API_KEY` in the environment; no key is stored anywhere):

```bash
node tools/cli.mjs sfx "cartoon dad says a proud 'hmph', close mic, dry" ../my-short/sfx/hmph.mp3 1.0
node tools/cli.mjs sfx --music "<prompt>" ../my-short/sfx/bed.mp3 46
```

Prompt pattern that worked for voices: "cartoon young boy/girl/dad + the exact interjection in quotes + emotion + 'close mic, dry, no music'". Keep durations short (0.8–2.2 s).

Generated files can start late or run long, and some come out very quiet. Before placing them, measure:

```bash
node tools/cli.mjs probe ../my-short/sfx/*.mp3
# kid_what.mp3   length 1.00s  sound 0.34-0.89s  loudest at 0.62s  peak level -5.4 dB   -> trim: 0.34
# join.mp3       length 0.80s  sound 0.00-0.31s  loudest at 0.00s  peak level -27.0 dB
```

Use the `trim` hint so the onset lands on the face-swap frame, and give very quiet files positive gain. Then `mix` and read the voice margins; raise any reaction under ~+9 dB. No sound from games or other creators, and never the "oof" sound.
