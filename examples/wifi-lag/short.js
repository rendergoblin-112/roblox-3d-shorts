// "When your WiFi lags one second before you win" — the original short, as data.
// 36 shots, 1284 frames (42.8 s). Four escalations (sister, mom, dad, everyone), punchline (power-out) at 92.8%.
// Character keys: [frame in shot, pose, face, move frames]. Poses snap with an ease-out, then hold dead still.

export const CAPTION = ['When your WiFi lags', 'one second before you win 😭💀'];
export const WATERMARK = ''; // your @handle, shown faint centre-left

// Cast, placement, rest poses and the game avatar are all the engine defaults (the family), so nothing to declare.

// Game segments (frames relative to the shot; the game clock is absolute and runs across cuts):
//   run {from, to, dur, s0, s1}  jump {lagAt, peak, ramp, slip}  rejoin {dur}  spawn  stand {at, stage}  win {from, to, dur}
export const SHOTS = [
  // --- premise: one jump from the finish
  { id: 'hook', cam: 'backWide', len: 42, beat: 'premise', kid: [[0, 'desk.type', 'focus', 0], [1, 'desk.lean', 'focus', 6]], game: [[0, { mode: 'run', from: 8, to: 9, dur: 14, s0: 48, s1: 49 }], [14, { mode: 'stand', at: 9, stage: 49 }]] },
  { id: 'mon1', cam: 'mon', len: 36, beat: 'premise', kid: [[0, 'desk.lean', 'focus', 0]] },
  { id: 'press1', cam: 'front', len: 30, beat: 'premise', kid: [[0, 'desk.lean', 'lockin', 0], [12, 'desk.press', 'focus', 3], [16, 'desk.lean', 'focus', 4]] },
  // --- escalation 1: sister's livestream
  { id: 'lag1', cam: 'mon', len: 60, beat: 'esc1', kid: [[0, 'desk.lean', 'focus', 0]], game: [[0, { mode: 'jump', lagAt: 12, peak: 1460, ramp: 3.2, slip: 40 }]] },
  { id: 'huh1', cam: 'front', len: 36, beat: 'esc1', kid: [[0, 'desk.lean', 'focus', 0], [4, 'desk.huh', 'huh', 6]] },
  { id: 'sis1', cam: 'sisWide', len: 54, beat: 'esc1', sis: [[0, 'rug.v', 'joy', 0], [13, 'rug.point', 'laugh', 5], [27, 'rug.hip', 'joy', 5], [41, 'rug.peace', 'smug', 5]] },
  { id: 'router1', cam: 'router', len: 33, beat: 'esc1', router: 'busy' },
  { id: 'rejoin1', cam: 'mon', len: 48, beat: 'esc1', kid: [[0, 'desk.huh', 'huh', 0]], game: [[0, { mode: 'rejoin', dur: 33 }], [33, { mode: 'spawn', stage: 1 }]] },
  { id: 'slump1', cam: 'high', len: 42, beat: 'esc1', kid: [[0, 'desk.huh', 'huh', 0], [5, 'desk.slump', 'annoyed', 8]] },
  // --- escalation 2: mom's video call (faster)
  { id: 'run2', cam: 'mon', len: 42, beat: 'esc2', kid: [[0, 'desk.lean', 'lockin', 0]], game: [[0, { mode: 'run', from: 0, to: 9, dur: 36, s0: 1, s1: 49 }], [36, { mode: 'stand', at: 9, stage: 49 }]] },
  { id: 'press2', cam: 'front', len: 24, beat: 'esc2', kid: [[0, 'desk.lean', 'lockin', 0], [8, 'desk.press', 'lockin', 3], [12, 'desk.lean', 'lockin', 3]] },
  { id: 'lag2', cam: 'mon', len: 33, beat: 'esc2', kid: [[0, 'desk.lean', 'lockin', 0]], game: [[0, { mode: 'jump', lagAt: 11, peak: 1840, ramp: 2.4, slip: 18 }]] },
  { id: 'nonono', cam: 'frontClose', len: 39, beat: 'esc2', kid: [[0, 'desk.lean', 'shock', 0], [3, 'desk.cheeks', 'shock', 5]] },
  { id: 'mom1', cam: 'momWide', len: 33, beat: 'esc2', mom: [[0, 'table.wave1', 'talk', 0], [9, 'table.wave2', 'talk', 4], [18, 'table.wave1', 'talk', 4], [26, 'table.laugh', 'laugh', 4]] },
  { id: 'call1', cam: 'call', len: 21, beat: 'esc2', mom: [[0, 'table.laugh', 'laugh', 0]] },
  { id: 'rejoin2', cam: 'mon', len: 33, beat: 'esc2', kid: [[0, 'desk.cheeks', 'shock', 0]], game: [[0, { mode: 'rejoin', dur: 20 }], [20, { mode: 'spawn', stage: 1 }]] },
  { id: 'slam2', cam: 'side', len: 39, beat: 'esc2', kid: [[0, 'desk.lean', 'angry', 0], [3, 'desk.slamUp', 'angry', 5], [13, 'desk.slam', 'angry', 3]], slam: 15 },
  // --- escalation 3: dad's 8K match (faster, angrier)
  { id: 'run3', cam: 'backWide', len: 30, beat: 'esc3', kid: [[0, 'desk.lean', 'lockin', 0]], game: [[0, { mode: 'run', from: 0, to: 9, dur: 24, s0: 1, s1: 49 }], [24, { mode: 'stand', at: 9, stage: 49 }]] },
  { id: 'lag3', cam: 'mon', len: 27, beat: 'esc3', kid: [[0, 'desk.press', 'lockin', 0]], game: [[0, { mode: 'jump', lagAt: 9, peak: 4096, ramp: 1.6, slip: 14 }]] },
  { id: 'rage3', cam: 'frontClose', len: 30, beat: 'esc3', kid: [[0, 'desk.lean', 'angry', 0], [2, 'desk.grab', 'rage', 4]] },
  { id: 'dad1', cam: 'dadWide', len: 45, beat: 'esc3', dad: [[0, 'couch.sit', 'smile', 0], [6, 'couch.cheer', 'ecstatic', 5], [20, 'couch.pump', 'joy', 4], [32, 'couch.cheer', 'ecstatic', 4]] },
  { id: 'rejoin3', cam: 'mon', len: 24, beat: 'esc3', kid: [[0, 'desk.grab', 'rage', 0]], game: [[0, { mode: 'rejoin', dur: 14 }], [14, { mode: 'spawn', stage: 1 }]] },
  { id: 'stand3', cam: 'wideHigh', len: 36, beat: 'esc3', kid: [[0, 'desk.grab', 'rage', 0], [4, 'deskSide.grab', 'cry', 6]], chairBack: 4 },
  // --- escalation 4: everyone at once (fastest)
  { id: 'run4', cam: 'mon', len: 33, beat: 'esc4', chairOut: true, kid: [[0, 'desk.lean', 'lockin', 0]], game: [[0, { mode: 'run', from: 0, to: 9, dur: 15, s0: 1, s1: 49 }], [15, { mode: 'jump', lagAt: 8, peak: 9999, ramp: 0.9, slip: 99 }]] },
  { id: 'sis2', cam: 'sisHigh', len: 18, beat: 'esc4', sis: [[0, 'rug.hip', 'laugh', 0], [8, 'rug.v', 'joy', 4]] },
  { id: 'mom2', cam: 'momWide', len: 18, beat: 'esc4', mom: [[0, 'table.wave2', 'laugh', 0], [8, 'table.laugh', 'laugh', 4]] },
  { id: 'dad2', cam: 'dadFace', len: 18, beat: 'esc4', dad: [[0, 'couch.pump', 'joy', 0], [8, 'couch.cheer', 'ecstatic', 4]] },
  { id: 'router2', cam: 'router', len: 18, beat: 'esc4', router: 'red' },
  { id: 'rage4', cam: 'high', len: 45, beat: 'esc4', chairOut: true, kid: [[0, 'deskSide.flail1', 'rage', 0], [9, 'deskSide.flail2', 'rage', 4], [18, 'deskSide.flail1', 'rage', 4], [27, 'deskSide.flail2', 'rage', 4], [36, 'deskSide.fists', 'rage', 4]], game: [[0, { mode: 'rejoin', dur: 80 }]] },
  // --- the family finally stops
  { id: 'famstop', cam: 'famWide', len: 48, beat: 'turn', mom: [[0, 'table.laugh', 'laugh', 0], [6, 'table.freeze', 'guilty', 5]], dad: [[0, 'couch.cheer', 'ecstatic', 0], [6, 'couch.freeze', 'guilty', 5]], tvOff: 26, lidClose: 20, game: [[30, { mode: 'spawn', stage: 1 }]] },
  { id: 'ready', cam: 'front', len: 42, beat: 'turn', kid: [[0, 'desk.knuckle', 'lockin', 0], [10, 'desk.type', 'lockin', 5], [22, 'desk.lean', 'lockin', 5]] },
  // --- the clean run: win (the only push-in in the film)
  { id: 'final', cam: 'mon', len: 66, beat: 'win', push: 1.05, kid: [[0, 'desk.lean', 'lockin', 0]], game: [[0, { mode: 'run', from: 0, to: 9, dur: 24, s0: 1, s1: 49, ping: 12 }], [24, { mode: 'win', from: 9, to: 10, dur: 26, ping: 12 }]] },
  { id: 'joy', cam: 'front', len: 36, beat: 'win', kid: [[0, 'desk.lean', 'shock', 0], [3, 'desk.victory', 'ecstatic', 5]] },
  // --- punchline: the power goes out (in-shot lighting change at frame 12), then the button
  { id: 'blackout', cam: 'backWide', len: 39, beat: 'punch', kid: [[0, 'desk.victory', 'ecstatic', 0]], powerOff: 12 },
  { id: 'ext', cam: 'ext', len: 33, beat: 'button' },
  { id: 'tag', cam: 'front', len: 33, beat: 'button', kid: [[0, 'desk.victory', 'stare', 0]] },
];
