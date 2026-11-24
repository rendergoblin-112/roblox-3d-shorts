# The pinned caption

One caption, on screen from frame 0 to the last frame, never changing. It states the premise so the picture doesn't have to.

## Rules (measured)

| Rule | Number |
|---|---|
| One caption for the whole video | on screen 98.9–100% of runtime (15/17 had one) |
| **7–9 words**; style A uses ~9 | median 7 (3–12); locked-camera shorts 9 |
| Starts **"When…"** or **"POV:…"** | 10/17 |
| Ends with **1–2 emoji** in style A (😭 💀 😂) | all locked-camera shorts |
| **2 lines, centred**; short line over long line | style A median 2 lines; centre 0.485–0.51 W |
| Text top at ~**10% of the height** | median 0.100 H |
| Ink height ~0.046–0.058 W | ≈ 57–62 px font at 1080 wide |
| Widest line ~0.68–0.75 W | |
| Pure white fill; **no stroke on the black band** (a ~5 px black stroke only if it sits over the picture) | 13/13 white |
| Bold rounded sans, sentence case, not condensed | we use Nunito ExtraBold (800) |

"POV:" does **not** mean a first-person camera (POV-shot share median 0%).

## In the engine

```js
export const CAPTION = ['When your WiFi lags', 'one second before you win 😭💀'];  // one string per line
export const WATERMARK = '@yourhandle';  // optional, faint, centre-left of the picture
```

Emoji are wrapped automatically and drawn with the system colour-emoji font (Apple on macOS, bundled Noto elsewhere). Layout (index.html): 57 px Nunito 800, line height 70 px, top 180 px, emoji 48 px. Measured on our render: text top 0.101 H, first line ink ≈0.049 W, widest line ≈0.76 W.

## Writing it

- Name the situation, not the joke: "When dad joins your game", not "Dad is secretly a pro".
- Put the twist-risk word last so it reads as the setup: "…one second before you win".
- Short line first (4–5 words), long line second (5–6 words + emoji).
- `check` counts words, the When/POV start, lines and emoji.
