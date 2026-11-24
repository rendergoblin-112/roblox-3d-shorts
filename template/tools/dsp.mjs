// Small DSP kit for the mixer: decode/encode through ffmpeg, seeded noise, FFT band-pass, tones, envelopes.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

export const SR = 48000;
export const FFMPEG = process.env.FFMPEG || 'ffmpeg';

export function ffmpeg(args, opts = {}) {
  const r = spawnSync(FFMPEG, args, { maxBuffer: 1 << 30, ...opts });
  if (r.error) throw new Error(`could not run ffmpeg (${FFMPEG}): ${r.error.message}. Install ffmpeg or set FFMPEG=/path/to/ffmpeg`);
  return r;
}

// decode any audio file to stereo float32 at 48 kHz -> { L, R }
export function decode(path) {
  if (!fs.existsSync(path)) throw new Error(`sound file not found: ${path}`);
  const r = ffmpeg(['-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-']);
  if (r.status !== 0) throw new Error(`ffmpeg could not decode ${path}: ${r.stderr}`);
  const buf = r.stdout; const n = buf.length / 8;
  const f = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
  const L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = f[2 * i]; R[i] = f[2 * i + 1]; }
  return { L, R };
}

export function writeWav(path, L, R) {
  const n = L.length; const b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(path, b);
}

// EBU R128 integrated loudness, true peak, LRA (via ffmpeg)
export function loudness(path) {
  const r = ffmpeg(['-hide_banner', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const s = String(r.stderr);
  const last = (re) => { const m = [...s.matchAll(re)]; return m.length ? parseFloat(m[m.length - 1][1]) : NaN; };
  return { I: last(/I:\s+(-?[\d.]+) LUFS/g), TP: last(/Peak:\s+(-?[\d.]+) dBFS/g), LRA: last(/LRA:\s+([\d.]+) LU/g) };
}

export function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function gauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
export function noise(dur, r) { const n = Math.round(dur * SR), x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = gauss(r); return x; }

export const db = (x) => Math.pow(10, x / 20);
export const note = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function env(n, a = 0.005, d = null) {
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; let v = Math.min(1, t / Math.max(a, 1e-4)); if (d) v *= Math.exp(-t / d); e[i] = v; }
  return e;
}
// tone: f is a number or a function of time (s) -> Hz
export function tone(f, dur, kind = 'sine', d = null, a = 0.004) {
  const n = Math.round(dur * SR), x = new Float32Array(n), e = env(n, a, d); let ph = 0;
  for (let i = 0; i < n; i++) {
    const fr = typeof f === 'function' ? f(i / SR) : f; ph += 2 * Math.PI * fr / SR;
    const s = Math.sin(ph);
    const w = kind === 'sine' ? s : kind === 'square' ? Math.sign(s) * 0.6 : kind === 'tri' ? (2 / Math.PI) * Math.asin(s) : 2 * ((ph / (2 * Math.PI)) % 1) - 1;
    x[i] = w * e[i];
  }
  return x;
}

// in-place radix-2 FFT on (re, im)
function fft(re, im, inv) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
  if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}
// brick-wall band-pass (like an FFT mask)
export function bandpass(x, lo, hi) {
  let n = 1; while (n < x.length) n <<= 1;
  const re = new Float64Array(n), im = new Float64Array(n); re.set(x);
  fft(re, im, false);
  for (let k = 0; k < n; k++) { const f = (k <= n / 2 ? k : n - k) * SR / n; if (f < lo || f > hi) { re[k] = 0; im[k] = 0; } }
  fft(re, im, true);
  const out = new Float32Array(x.length); for (let i = 0; i < x.length; i++) out[i] = re[i]; return out;
}

export function concat(...xs) { const n = xs.reduce((a, x) => a + x.length, 0), o = new Float32Array(n); let k = 0; for (const x of xs) { o.set(x, k); k += x.length; } return o; }
export function scale(x, g) { const o = new Float32Array(x.length); for (let i = 0; i < x.length; i++) o[i] = x[i] * g; return o; }
export function peak(x) { let m = 0; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i])); return m; }
// scale so the RMS of the active part (|x| > 5% of peak) hits target, as measured on the reference sounds
export function normActive(x, target) {
  const p = peak(x); if (!p) return x; let s = 0, c = 0;
  for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > p * 0.05) { s += x[i] * x[i]; c++; }
  return scale(x, target / Math.sqrt(s / c));
}
export function rmsDb(x, a = 0, b = x.length) { let s = 0; for (let i = a; i < b; i++) s += x[i] * x[i]; return 10 * Math.log10(s / Math.max(1, b - a) + 1e-24); }
