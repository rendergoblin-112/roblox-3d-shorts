// Procedural sounds, written in code (no samples, no licences). Use them in sound.js as 'synth:<name>'.
// Levels are set to the active RMS of the generic library sounds the original short used, so cue gains carry over.
import { SR, rng, noise, tone, env, bandpass, concat, scale, normActive, note, gauss } from './dsp.mjs';

const R = rng(7);
const n = (s) => Math.round(s * SR);

function svfSweep(x, fOf, q = 0.7) { // state-variable band-pass with a moving centre
  const y = new Float32Array(x.length); let lp = 0, bp = 0;
  for (let i = 0; i < x.length; i++) {
    const f = 2 * Math.sin(Math.PI * Math.min(fOf(i / SR), SR / 6) / SR);
    const hp = x[i] - lp - q * bp; bp += f * hp; lp += f * bp; y[i] = bp;
  }
  return y;
}
function clickOne(freq = 3200, amp = 1, r = R) {
  const len = n(0.03), x = new Float32Array(len);
  let prev = 0;
  for (let i = 0; i < len; i++) { const t = i / SR, w = gauss(r); const hp = w - prev; prev = w; x[i] = amp * (hp * 0.35 * Math.exp(-t / 0.003) + Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / 0.005)); }
  return x;
}

export const SYNTH = {
  // ---- generic hits
  click: () => normActive(concat(clickOne(3600, 1), new Float32Array(n(0.25))), 0.177),
  typing: (o = {}) => { // keyboard rattle
    const r = rng(11), dur = o.len ?? 2.7, x = new Float32Array(n(dur + 0.1)); let t = 0.03;
    while (t < dur) { const c = clickOne(2500 + r() * 1700, 0.5 + r() * 0.5, r); x.set(c.subarray(0, Math.min(c.length, x.length - n(t))), n(t)); t += 0.07 + r() * 0.08; }
    return normActive(x, 0.069);
  },
  glitch: () => { // digital stutter: crushed square chirps and noise grains
    const r = rng(21), segs = [];
    for (let i = 0; i < 26; i++) {
      const d = 0.022 + r() * 0.012, k = r();
      if (k < 0.45) segs.push(tone(200 + r() * 1800, d, 'square'));
      else if (k < 0.8) segs.push(scale(noise(d, r), 0.5));
      else segs.push(new Float32Array(n(d)));
    }
    const x = concat(...segs); for (let i = 0; i < x.length; i++) x[i] = Math.round(x[i] * 6) / 6;
    return normActive(x, 0.161);
  },
  fail: () => normActive(concat(tone(note(76), 0.2, 'square', 0.4), tone(note(69), 0.2, 'square', 0.4), tone(note(64), 0.5, 'square', 0.3)), 0.22), // "connection lost" buzz
  impact: () => { // deep boom
    const len = 0.6, x = tone((t) => 40 + 80 * Math.exp(-t / 0.06), len, 'sine', 0.16, 0.001);
    const nb = bandpass(noise(0.08, rng(31)), 60, 900); for (let i = 0; i < nb.length; i++) x[i] += nb[i] * 0.4 * Math.exp(-i / SR / 0.02);
    return normActive(x, 0.56);
  },
  thump: () => normActive(tone((t) => 45 + 45 * Math.exp(-t / 0.05), 0.5, 'sine', 0.1, 0.001), 0.089),
  whoosh: () => { // air swipe
    const d = 0.32, x = svfSweep(noise(d, rng(41)), (t) => 120 + 380 * Math.sin(Math.PI * t / d), 0.5); const e = x.length;
    for (let i = 0; i < e; i++) x[i] *= Math.pow(Math.sin(Math.PI * i / e), 2);
    return normActive(bandpass(x, 40, 700), 0.13);
  },
  riser: () => { // tension build, silent first 0.6 s like the original
    const d = 1.35, a = bandpass(noise(d, rng(51)), 1500, 7000), b = tone((t) => 200 + 900 * (t / d) ** 2, d, 'saw');
    const x = new Float32Array(a.length); for (let i = 0; i < x.length; i++) { const u = i / x.length; x[i] = (a[i] * 0.6 + b[i] * 0.4) * u * u; }
    return concat(new Float32Array(n(0.63)), normActive(x, 0.526));
  },
  scale: () => normActive(concat(...[72, 76, 79, 84].map((m) => { const s = tone(note(m), 0.18, 'sine', 0.12), h = tone(note(m) * 2, 0.18, 'sine', 0.06); for (let i = 0; i < s.length; i++) s[i] += h[i] * 0.3; return s; })), 0.21),
  pop: () => concat(new Float32Array(n(0.1)), normActive(tone((t) => 170 + 530 * Math.exp(-t / 0.015), 0.07, 'sine', 0.03, 0.001), 0.16)),
  shimmer: () => { // sparkle
    const r = rng(61), x = new Float32Array(n(0.8));
    for (let k = 0; k < 16; k++) { const s = tone(5000 + r() * 7000, 0.3, 'sine', 0.07, 0.001), at = n(r() * 0.45); for (let i = 0; i < s.length && at + i < x.length; i++) x[at + i] += s[i]; }
    return normActive(x, 0.047);
  },
  // ---- pieces the original mixer synthesized
  bwomp: () => concat(scale(tone(note(55), 0.22, 'square', 0.2), 0.35), scale(tone(note(48), 0.45, 'square', 0.3), 0.35)), // "back to start"
  router: (o = {}) => { // beeps: slow, or fast with o.fast
    const d = o.len ?? 1, step = o.fast ? 0.07 : 0.13, s = new Float32Array(n(d));
    for (let i = 0; i < Math.floor(d / step); i++) { const b = scale(tone(o.fast ? 2600 : 2000, 0.035, 'sine', 0.02), 0.3), k = n(i * step); s.set(b.subarray(0, Math.max(0, Math.min(b.length, s.length - k))), k); }
    return s;
  },
  wahwah: (o = {}) => { // muffled trombone "adult talk": non-word
    const d = o.len ?? 1, base = o.base ?? 300, r = rng(Math.round(base)), ph0 = r() * 6;
    const w = bandpass(tone((t) => base * (1 + 0.25 * Math.sin(2 * Math.PI * 2.3 * t) + 0.1 * Math.sin(2 * Math.PI * 5.1 * t)), d, 'saw'), 200, 1400);
    for (let i = 0; i < w.length; i++) w[i] *= Math.pow(Math.max(0, Math.sin(2 * Math.PI * 4.2 * i / SR + ph0)), 0.6) * 0.5;
    return w;
  },
  scratch: () => { const d = 0.45, x = bandpass(noise(d, rng(71)), 300, 4000); for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] *= Math.sin(Math.PI * t / d) * 0.6 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (8 + 30 * t) * t)); } return x; },
  chairRoll: () => { const d = 0.4, x = bandpass(noise(d, rng(81)), 200, 1200); for (let i = 0; i < x.length; i++) x[i] *= Math.sin(Math.PI * i / SR / d) * 0.35; return x; },
  sadNote: () => scale(tone(note(52), 0.9, 'sine', 0.4), 0.25),
  // music through a phone speaker: needs the bed (o.bed mono), o.offset (s into the bed), o.len
  phone: (o = {}) => {
    const a = n(o.offset ?? 0), len = n(o.len ?? 1), b = new Float32Array(len); if (o.bed) b.set(o.bed.subarray(a, a + len));
    const y = bandpass(b, 900, 5000); for (let i = 0; i < y.length; i++) y[i] = Math.round(y[i] * 10) / 10 * 1.6;
    return y;
  },
  // ---- beds under everything
  roomtone: (o = {}) => scale(bandpass(noise(o.len ?? 1, rng(7)), 60, 900), o.level ?? 0.075),
  crickets: (o = {}) => {
    const len = n(o.len ?? 3), L = new Float32Array(len), Rr = new Float32Array(len);
    for (let i = 0; i < len; i++) { const t = i / SR;
      L[i] = Math.sin(2 * Math.PI * 4300 * t) * (Math.sin(2 * Math.PI * 28 * t) > 0.3) * (Math.sin(2 * Math.PI * 1.4 * t) > 0.1) * 0.035;
      Rr[i] = Math.sin(2 * Math.PI * 3900 * t) * (Math.sin(2 * Math.PI * 31 * t) > 0.4) * (Math.sin(2 * Math.PI * 1.1 * t + 1) > 0.2) * 0.025; }
    return { L, R: Rr };
  },
};
export const SYNTH_NAMES = Object.keys(SYNTH);
