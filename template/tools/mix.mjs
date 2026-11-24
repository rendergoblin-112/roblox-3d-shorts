// Soundtrack from the cue sheet in sound.js -> 48 kHz stereo WAV at ~-13 LUFS.
// Three stems (bed, fx, voice) so the bed can duck under the voice and the voice margin can be measured.
import fs from 'node:fs';
import path from 'node:path';
import { SR, decode, writeWav, loudness, ffmpeg, db, bandpass, rmsDb } from './dsp.mjs';
import { SYNTH } from './synth.mjs';
import { FPS } from '../engine/timeline.js';

const TEMPLATE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

export async function mixProject({ R, SOUND, projDir, out, log = console.log }) {
  const shotById = Object.fromEntries(R.shots.map((s) => [s.id, s]));
  const at = (shot, f = 0) => {
    if (shot === 'power') { if (R.powerOff == null) throw new Error('cue uses "power" but no shot has powerOff'); return (R.powerOff + f) / FPS; }
    if (typeof shot === 'number') return shot;
    const s = shotById[shot]; if (!s) throw new Error(`sound cue refers to unknown shot "${shot}"`);
    return (s.start + f) / FPS;
  };
  const DUR = R.total / FPS, N = Math.round(DUR * SR) + SR, END = Math.round(DUR * SR);
  const stem = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
  const fx = stem(), voice = stem(), bedtrack = stem();
  const cache = new Map();
  function file(name) {
    if (cache.has(name)) return cache.get(name);
    const cands = [path.join(projDir, 'sfx', name), path.join(TEMPLATE, 'sfx', name)];
    const p = cands.find((c) => fs.existsSync(c));
    if (!p) throw new Error(`sound "${name}" not found in ${cands.join(' or ')}`);
    const d = decode(p); cache.set(name, d); return d;
  }
  const mono = (s) => (s.L ? s : { L: s, R: s });
  function place(sig, t, gainDb = 0, pan = 0, st = fx) {
    sig = mono(sig); const i0 = Math.round(t * SR), n = Math.min(sig.L.length, N - i0); if (n <= 0) return;
    const g = db(gainDb), l = 1 - Math.max(0, pan), r = 1 + Math.min(0, pan);
    for (let i = Math.max(0, -i0); i < n; i++) { st.L[i0 + i] += sig.L[i] * g * l; st.R[i0 + i] += sig.R[i] * g * r; }
  }
  const cut = (s, a, b) => ({ L: s.L.subarray(a, b), R: s.R.subarray(a, b) });

  // ---------------- music bed: restarts, tape-stops, hard cut, dips ----------------
  const B = SOUND.bed;
  let bedMono = null;
  const bedgain = new Float32Array(N).fill(1);
  if (B) {
    const bed = file(B.file);
    bedMono = new Float32Array(bed.L.length); for (let i = 0; i < bedMono.length; i++) bedMono[i] = (bed.L[i] + bed.R[i]) / 2;
    const events = [];
    for (const [s, f] of B.starts || [[R.shots[0].id, 0]]) events.push([at(s, f), 'start']);
    for (const [s, f] of B.tapeStops || []) events.push([at(s, f), 'stop']);
    const cutAt = B.cut === 'power' ? (R.powerOff != null ? R.powerOff / FPS : null) : Array.isArray(B.cut) ? at(...B.cut) : null;
    if (cutAt != null) events.push([cutAt, 'cut']);
    events.sort((a, b) => a[0] - b[0]);
    events.forEach(([t, kind], i) => {
      if (kind !== 'start') return;
      const nx = events.slice(i + 1).find((e) => e[1] !== 'start');
      const tEnd = nx ? nx[0] : DUR, stopKind = nx ? nx[1] : 'cut';
      const a = Math.round(t * SR), e = Math.min(N, Math.round(tEnd * SR)), n = Math.min(e - a, bed.L.length);
      for (let k = 0; k < n; k++) { bedtrack.L[a + k] += bed.L[k]; bedtrack.R[a + k] += bed.R[k]; }
      if (stopKind === 'stop') { // tape stop over 0.55 s: the music lags with the game
        const d = 0.55, m = Math.round(d * SR);
        for (let k = 0; k < m && e + k < N; k++) {
          const tt = k / SR, pos = (n / SR + tt - tt * tt / (2 * d)) * SR, j = Math.floor(pos), fr = pos - j, g = Math.sqrt(1 - tt / d);
          if (j + 1 >= bed.L.length) break;
          bedtrack.L[e + k] += (bed.L[j] * (1 - fr) + bed.L[j + 1] * fr) * g; bedtrack.R[e + k] += (bed.R[j] * (1 - fr) + bed.R[j + 1] * fr) * g;
        }
      } else { const k8 = Math.round(0.008 * SR); for (let k = 0; k < k8; k++) { const g = 1 - k / k8; bedtrack.L[e - k8 + k] *= g; bedtrack.R[e - k8 + k] *= g; } }
    });
    for (const sid of B.dip?.shots || []) { const s = shotById[sid]; if (!s) throw new Error(`bed.dip: unknown shot ${sid}`); bedgain.fill(B.dip.gain ?? 0.45, Math.round(s.start / FPS * SR), Math.round((s.start + s.len) / FPS * SR)); }
  }

  // ---------------- room tone (never silent) + crickets after the power-out ----------------
  if (SOUND.roomTone !== 0) place(SYNTH.roomtone({ len: DUR + 1, level: SOUND.roomTone ?? 0.075 }), 0, 0);
  if (R.powerOff != null && SOUND.crickets !== false) place(SYNTH.crickets({ len: DUR - R.powerOff / FPS + 1 }), R.powerOff / FPS + 0.15, 0);

  // ---------------- cue sheet ----------------
  function sound(name, o = {}, shot) {
    const len = o.len === 'shot' ? shotById[shot].len / FPS : o.len;
    let s;
    if (name.startsWith('synth:')) {
      const fn = SYNTH[name.slice(6)]; if (!fn) throw new Error(`unknown synth sound ${name}. Known: ${Object.keys(SYNTH).map((k) => 'synth:' + k).join(', ')}`);
      s = mono(fn({ ...o, len, bed: bedMono }));
    } else s = file(name);
    if (o.trim) s = cut(s, Math.round(o.trim * SR));
    if (o.take) s = cut(s, 0, Math.round(o.take * SR));
    if (o.band) s = { L: bandpass(s.L, ...o.band), R: bandpass(s.R, ...o.band) };
    return s;
  }
  for (const c of SOUND.cues || []) {
    const [shot, f, name, gain = 0, o = {}] = c;
    place(sound(name, o, shot), at(shot, f), gain, o.pan ?? 0);
  }

  // ---------------- voice: interjections on reaction beats ----------------
  const vox = [];
  for (const [shot, f, name, gain = 0, o = {}] of SOUND.vox || []) {
    let x = sound(name, o, shot); const t = at(shot, f);
    if (o.cutAt) { // fade out (0.12 s) where the next beat interrupts it
      const k = Math.round((at(...o.cutAt) - t) * SR), fade = Math.round(0.12 * SR);
      const L = x.L.slice(0, k + fade), Rr = x.R.slice(0, k + fade);
      for (let i = k; i < L.length; i++) { const g = 1 - (i - k) / Math.max(1, L.length - k); L[i] *= g; Rr[i] *= g; }
      x = { L, R: Rr };
    }
    place(x, t, gain, o.pan ?? 0, voice);
    let mx = 0; for (let i = 0; i < x.L.length; i++) mx = Math.max(mx, Math.abs(x.L[i]), Math.abs(x.R[i]));
    let a = -1, b = -1; for (let i = 0; i < x.L.length; i++) if (Math.max(Math.abs(x.L[i]), Math.abs(x.R[i])) > mx * 0.06) { if (a < 0) a = i; b = i; }
    vox.push({ shot, name, a: t + a / SR, b: t + b / SR });
  }

  // duck the bed under the voice (40 ms attack, 250 ms release); effects dip a little too
  const gate = new Float32Array(N); for (const v of vox) gate.fill(1, Math.round(v.a * SR), Math.round(v.b * SR));
  const duck = new Float32Array(N); const att = 1 - Math.exp(-1 / (0.04 * SR)), rel = 1 - Math.exp(-1 / (0.25 * SR)); let y = 0; const step = 64;
  for (let i = 0; i < N; i += step) { const tg = gate[i]; y += (tg - y) * (1 - Math.pow(1 - (tg > y ? att : rel), step)); duck.fill(y, i, Math.min(N, i + step)); }
  const duckDb = B?.duck ?? -6, bedDb = B?.gain ?? -4;
  const mixL = new Float32Array(END), mixR = new Float32Array(END), restL = new Float32Array(END);
  const bedOnly = new Float32Array(END);
  for (let i = 0; i < END; i++) {
    const bg = bedgain[i] * (1 - duck[i] * (1 - db(duckDb))) * db(bedDb), fg = 1 - duck[i] * (1 - db(-4));
    const bl = bedtrack.L[i] * bg, br = bedtrack.R[i] * bg, fl = fx.L[i] * fg, frr = fx.R[i] * fg;
    mixL[i] = bl + fl + voice.L[i]; mixR[i] = br + frr + voice.R[i];
    restL[i] = (bl + br + fl + frr) / 2; bedOnly[i] = (bl + br) / 2;
  }

  // ---------------- master: linear gain to the target, then a peak limiter ----------------
  const M = { lufs: -13, limit: 0.84, ...(SOUND.master || {}) };
  let pk = 0; for (let i = 0; i < END; i++) pk = Math.max(pk, Math.abs(mixL[i]), Math.abs(mixR[i]));
  const head = 0.5 / pk; for (let i = 0; i < END; i++) { mixL[i] *= head; mixR[i] *= head; }
  const raw = out.replace(/\.wav$/i, '') + '.raw.wav';
  writeWav(raw, mixL, mixR);
  let gain = M.lufs - loudness(raw).I, res, limit = M.limit;
  for (let it = 0; it < 8; it++) {
    const r = ffmpeg(['-y', '-v', 'error', '-i', raw, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=${limit.toFixed(3)}:attack=3:release=60:level=disabled`, '-ar', String(SR), out]);
    if (r.status !== 0) throw new Error('ffmpeg master failed: ' + r.stderr);
    res = loudness(out);
    if (res.TP > -1.0) { limit *= Math.pow(10, (-1.1 - res.TP) / 20); continue; } // keep true peak under -1 dBTP
    if (Math.abs(res.I - M.lufs) < 0.3) break; gain += M.lufs - res.I;
  }
  fs.unlinkSync(raw);
  log(`loudness ${res.I.toFixed(1)} LUFS   true peak ${res.TP.toFixed(1)} dBTP   LRA ${res.LRA.toFixed(1)} LU   (target ${M.lufs})`);
  // never silent: share of video frames below -50 dBFS
  const fl = SR / FPS; let quiet = 0, frames = 0;
  for (let i = 0; i + fl <= END; i += fl) { const m = new Float32Array(fl); for (let k = 0; k < fl; k++) m[k] = (mixL[i + k] + mixR[i + k]) / 2; if (rmsDb(m) + gain < -50) quiet++; frames++; }
  log(`frames below -50 dBFS: ${(quiet / frames * 100).toFixed(2)}%  (target < 1%)`);
  if (vox.length) log('voice over everything else during each interjection (RMS, 200-4000 Hz):');
  const voiceMono = new Float32Array(END); for (let i = 0; i < END; i++) voiceMono[i] = (voice.L[i] + voice.R[i]) / 2;
  const margins = [];
  for (const v of vox) {
    const i = Math.round(v.a * SR), j = Math.min(END, Math.round(v.b * SR)); if (j <= i) continue;
    const m = rmsDb(bandpass(voiceMono.subarray(i, j), 200, 4000)) - rmsDb(bandpass(restL.subarray(i, j), 200, 4000));
    margins.push(m); log(`   ${String(v.shot).padEnd(10)} ${v.name.padEnd(20)} ${v.a.toFixed(2)}-${v.b.toFixed(2)}s  ${m >= 0 ? '+' : ''}${m.toFixed(1)} dB`);
  }
  return { ...res, quietShare: quiet / frames, margins };
}
