// Sound cue sheet for "WiFi lag". Times are [shot id, frame in shot] ('power' = the power-off frame).
// Files are looked up in <project>/sfx/ first, then template/sfx/. 'synth:<name>' sounds are generated in code.
// Cue: [shot, frame, sound, gain dB, { pan, trim, take, band: [lo, hi], len: seconds | 'shot', ...synth options }]
// Vox: interjections only, each starting on the frame its reaction face swaps in.

export const SOUND = {
  // the generated bed is "the game music": it tape-stops at every lag, restarts on respawn, cuts at the power-out
  bed: {
    file: 'bed.mp3', gain: -4, duck: -6,
    starts: [['hook', 0], ['rejoin1', 33], ['rejoin2', 20], ['rejoin3', 14], ['ready', 0]],
    tapeStops: [['lag1', 12], ['lag2', 11], ['lag3', 9], ['run4', 23]],
    cut: 'power',
    dip: { gain: 0.45, shots: ['sis1', 'router1', 'mom1', 'call1', 'dad1', 'sis2', 'mom2', 'dad2', 'router2'] }, // the family's own sounds carry these
  },
  roomTone: 0.075, // never silent
  crickets: true,  // after the power-out
  cues: [
    ['hook', 0, 'synth:typing', 8],
    ['press1', 13, 'synth:click', 6], ['press2', 9, 'synth:click', 6], ['ready', 23, 'synth:click', 6],
    // lag hits: generated buffering stutter over a short glitch
    ['lag1', 12, 'synth:glitch', -8], ['lag1', 12, 'lag.mp3', -2],
    ['lag2', 11, 'synth:glitch', -8], ['lag2', 11, 'lag.mp3', -2],
    ['lag3', 9, 'synth:glitch', -8], ['lag3', 9, 'lag.mp3', -2],
    ['run4', 23, 'synth:glitch', -8], ['run4', 23, 'lag.mp3', -2],
    ['rejoin1', 0, 'synth:fail', -6], ['rejoin2', 0, 'synth:fail', -6], ['rejoin3', 0, 'synth:fail', -6],
    ['rejoin1', 33, 'synth:bwomp', -6], ['rejoin2', 20, 'synth:bwomp', -6], ['rejoin3', 14, 'synth:bwomp', -6],
    // a pop on every reaction face swap
    ['huh1', 4, 'synth:pop', -4], ['slump1', 5, 'synth:pop', -4], ['nonono', 2, 'synth:pop', -4], ['slam2', 3, 'synth:pop', -4],
    ['rage3', 2, 'synth:pop', -4], ['stand3', 4, 'synth:pop', -4], ['joy', 3, 'synth:pop', -4], ['famstop', 6, 'synth:pop', -4],
    // the family's noise
    ['sis1', 0, 'synth:phone', -6, { pan: 0.2, len: 'shot', offset: 4.0 }], ['sis2', 0, 'synth:phone', -6, { pan: 0.2, len: 'shot', offset: 12.0 }],
    ['router1', 0, 'synth:router', -8, { len: 'shot' }], ['router2', 0, 'synth:router', -6, { len: 'shot', fast: true }],
    ['mom1', 2, 'synth:wahwah', -6, { pan: -0.1, len: 1.0, base: 330 }], ['mom1', 20, 'synth:wahwah', -8, { pan: 0.2, len: 0.6, base: 420 }],
    ['call1', 2, 'synth:wahwah', -8, { pan: -0.2, len: 0.6, base: 260 }], ['mom2', 1, 'synth:wahwah', -6, { len: 0.5, base: 380 }],
    ['dad1', 4, 'crowd.mp3', -9, { band: [300, 6000] }], ['dad2', 0, 'crowd.mp3', -9, { take: 0.6, band: [300, 6000] }], // TV-speaker band limit
    // his rage
    ['slam2', 15, 'synth:impact', -2], ['slam2', 15, 'synth:thump', 4],
    ['stand3', 4, 'synth:chairRoll', -2], ['stand3', 6, 'synth:thump', 2],
    ['rage4', 0, 'synth:whoosh', -12, { pan: 0.3 }], ['rage4', 9, 'synth:whoosh', -12, { pan: -0.3 }], ['rage4', 18, 'synth:whoosh', -12, { pan: 0.3 }],
    ['rage4', 27, 'synth:whoosh', -12, { pan: -0.3 }], ['rage4', 36, 'synth:whoosh', -12, { pan: 0.3 }],
    // the family stops
    ['famstop', 5, 'synth:scratch', -4], ['famstop', 20, 'synth:click', 2], ['famstop', 26, 'tvoff.mp3', 0, { trim: 0.2 }],
    ['ready', 2, 'knuckles.mp3', 12, { trim: 0.31 }], ['ready', 7, 'knuckles.mp3', 10, { trim: 0.31 }],
    // the win
    ['final', 2, 'synth:riser', -14],
    ['final', 50, 'win.mp3', -4], ['final', 52, 'synth:shimmer', -4],
    ['joy', 3, 'synth:scale', -14],
    // punchline + button
    ['power', 0, 'powerout.mp3', 2],
    ['tag', 22, 'synth:sadNote', -8],
  ],
  vox: [
    ['huh1', 4, 'huh.mp3', -6],                                        // esc 1: confused
    ['nonono', 2, 'nonono.mp3', -7],                                   // esc 2: panic
    ['rage3', 2, 'scream_short.mp3', -8],                              // esc 3: angry yell
    ['rage4', 0, 'scream_long.mp3', -10, { cutAt: ['famstop', 3] }],   // esc 4: rage, carries into the family freezing, cut by the scratch
    ['joy', 3, 'yes.mp3', -4],                                         // the win
    ['tag', 8, 'whimper.mp3', -3],                                     // in the dark
  ],
  master: { lufs: -13, limit: 0.84 },
};
