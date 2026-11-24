# Joke writing

A short is one joke told with no words. The caption states the premise; the picture does everything else.

## The rules

1. **One premise, stated by the caption.** "When dad joins your game", "When your WiFi lags one second before you win". The viewer knows the setup by ~1 s.
2. **One problem, repeated about four times, worse every time.** Same situation, rising stakes: faster, bigger, angrier, more people involved. The study's median is 4 escalations (range 1–7).
3. **Each escalation ends on a reaction shot with a face swap.** The reaction is its own cut. That's where the voice interjection goes ("huh?", "no no no", a scream).
4. **The punchline lands at ~93% of the runtime** (about 39.5–40 s of 42.8 s). It's a reversal or a payoff that recontextualises the escalations, shown as one clear image.
5. **A short button, then cut.** ~2–3 s after the punchline: one or two shots (a held reaction, a cutaway, a tiny tag). Never explain it.
6. **Nothing that needs dialogue.** If a beat only works with a spoken line, it's the wrong beat. Text belongs on screens inside the world (a game HUD, a chat line, a banner), never on top of the picture.

Endings seen: tag after the punchline (8/17), hard cut on the punchline (5), held reaction (3), loop to start (1, rare: don't build around a loop).
Premise families: siblings vs parents (most common), a game-world gag, one character's win-then-catch.

## Beat sheet for 42–47 s (style A)

| Time | Beat | What happens | Shots |
|---|---|---|---|
| 0–3.6 s | **Premise** | Lead acts on frame 1; caption + first shot make the situation clear; 2 cuts by 3 s | 3 |
| 3.6–12.7 s | **Escalation 1** | Problem appears, mild. Reaction: confused ("huh?") | 5–6 |
| 12.7–21.5 s | **Escalation 2** | Same problem, faster/bigger. Reaction: panic ("no no no") | 6–8 |
| 21.5–27.9 s | **Escalation 3** | Faster again. Reaction: anger (yell) | 5–6 |
| 27.9–32.9 s | **Escalation 4** | Fastest: 0.6 s cuts, everyone/everything at once. Reaction: full meltdown (scream) | 5–6 |
| 32.9–39.7 s | **Turn** | The thing that's been causing it stops / the lead locks in / the setup for the payoff | 3–4 |
| ~39.7 s (93%) | **Punchline** | The reversal, in one readable image | 1 |
| 39.7–42.8 s | **Button** | 1–2 short shots, then cut | 1–2 |

Each escalation gets *shorter* than the one before (WiFi short: 9.1 s, 8.8 s, 6.4 s, 5.0 s) and the reaction gets *bigger*.

## Worked example: "When your WiFi lags one second before you win"

| # | Who/what causes it | Ping peak | Time to respawn | Lead's reaction | Voice |
|---|---|---|---|---|---|
| 1 | Sister's 4K livestream | 1460 ms | 6.1 s | annoyed slump | "huh?" |
| 2 | Mom's HD video call | 1840 ms | 4.2 s | hands to cheeks, desk slam | "no no no no" |
| 3 | Dad's 8K match | 4096 ms | 3.4 s | grabs head, stands up crying | short yell |
| 4 | All three at once (0.6 s cuts) | 9999+ | — | full rage flail | long scream |
| turn | The family hears him, freezes, switches everything off | | | cracks knuckles | |
| win | Clean run, YOU WIN | 12 ms | | arms up, star eyes | "YESSS" |
| **punch** | **The power goes out for the whole house** (93%) | | | frozen, arms still up | |
| button | Dark house exterior (neighbours lit), kid in moonlight with one tear | | | stare | whimper |

Why it works: the escalations train the viewer to expect "family hogs the WiFi → he loses". The turn removes the cause, he wins, and the punchline takes it away by a bigger version of the same cause (no power at all).

## From joke to shot list

1. Write the caption (see [caption.md](caption.md)).
2. Fill the beat sheet table above for your joke: for each escalation, *what makes it worse* and *the lead's reaction*.
3. Turn each row into shots of 18–66 frames: the action shot(s), an insert if a screen carries the story, the reaction shot. Reuse the same few cameras: same-room cuts are the style.
4. Put the punchline frame at 0.93 × total. Mark it with `punchline: <frame>` (or `powerOff`) on that shot.
5. Tag every shot with `beat: 'premise' | 'esc1'…'esc4' | 'turn' | 'punch' | 'button'` so `check` can count.
6. Run `node tools/cli.mjs check <project>`; adjust lengths until duration, cuts/min and the 93% land.

## Writing tips that came out of the build

- The screen *is* the story when the joke is about a game: put the lag, the score, the chat on an in-world screen and cut to it as an insert. Inserts ran 31–36% of shots in our short (the study's pooled 7% is for jokes that don't live on a screen); that's a deliberate departure.
- Cross-cut the cause: a 1–2 s shot of whoever causes the problem (sister dancing, mom on a call) is funnier than any explanation.
- Escalation 4 works as a burst: three or four 0.6 s shots of all the causes at once, then the meltdown.
- Give the button a physical image (the dark house with lit neighbours), not just a face.
