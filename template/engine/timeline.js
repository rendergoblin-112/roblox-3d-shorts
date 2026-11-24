// Resolve a project (short.js) into absolute timing, cast placement and the in-game timeline.
// Pure JS (no three.js) so both the browser engine and the Node tools (check, mix) use the same numbers.
import { SPOTS, SHAPES, POSES } from './poses.js';
import { CAMERAS } from './cameras.js';
import { DEFAULT_CAST, DEFAULT_PLACEMENT, DEFAULT_REST } from './cast.js';

export const FPS = 30;
export const SET_ORDER = ['room', 'sis', 'living', 'hall', 'ext'];
// Shot fields that are not cast ids. Anything else that matches a cast id is that character's key list.
const SHOT_FIELDS = new Set(['id', 'set', 'cam', 'len', 'beat', 'game', 'chat', 'banner', 'gameFocus', 'gameView', 'screens', 'push', 'powerOff', 'punchline',
  'slam', 'chairBack', 'chairOut', 'tvOff', 'lidClose', 'router', 'note', 'start']);

export function resolveProject(P) {
  const errors = [];
  const cast = {};
  for (const [id, s] of Object.entries(DEFAULT_CAST)) cast[id] = { ...s };
  for (const [id, s] of Object.entries(P.CAST || {})) cast[id] = { ...(cast[id] || {}), ...s };
  const lib = { SPOTS: { ...SPOTS, ...(P.SPOTS || {}) }, SHAPES: { ...SHAPES, ...(P.SHAPES || {}) }, POSES: { ...POSES, ...(P.POSES || {}) } };
  const cams = { ...CAMERAS, ...(P.CAMERAS || {}) };
  if (!Array.isArray(P.SHOTS) || !P.SHOTS.length) throw new Error('short.js must export a non-empty SHOTS array');

  let f0 = 0;
  const ids = new Set();
  const shots = P.SHOTS.map((src, i) => {
    const sh = { ...src };
    if (!sh.id) sh.id = `s${i + 1}`;
    if (ids.has(sh.id)) errors.push(`duplicate shot id "${sh.id}"`); ids.add(sh.id);
    const cam = cams[sh.cam];
    if (!cam) errors.push(`shot ${sh.id}: unknown camera "${sh.cam}"`);
    sh.set = sh.set ?? cam?.set;
    if (!SET_ORDER.includes(sh.set)) errors.push(`shot ${sh.id}: unknown set "${sh.set}"`);
    if (!(sh.len > 0)) errors.push(`shot ${sh.id}: len must be a positive frame count`);
    sh.cast = Object.keys(sh).filter((k) => !SHOT_FIELDS.has(k) && cast[k]);
    for (const k of Object.keys(sh)) if (!SHOT_FIELDS.has(k) && !cast[k] && k !== 'cast') errors.push(`shot ${sh.id}: unknown field or cast id "${k}"`);
    sh.start = f0; f0 += sh.len;
    return sh;
  });
  const total = f0;
  const pShot = shots.find((s) => s.powerOff != null);
  const powerOff = pShot ? pShot.start + pShot.powerOff : null;
  const punShot = shots.find((s) => s.punchline != null);
  const punchline = punShot ? punShot.start + punShot.punchline : powerOff;

  // cast placement per set: default homes (overridable) + anyone keyed in a shot of that set
  const placement = { ...DEFAULT_PLACEMENT, ...(P.PLACEMENT || {}) };
  const setsUsed = SET_ORDER.filter((s) => shots.some((sh) => sh.set === s));
  const charsBySet = {};
  for (const s of setsUsed) {
    const list = [...(placement[s] || [])];
    for (const sh of shots) if (sh.set === s) for (const c of sh.cast) if (!list.includes(c)) list.push(c);
    charsBySet[s] = list.filter((c) => cast[c]);
  }
  // rest pose: REST[set][char] > REST[char] > default
  const REST = P.REST || {};
  function restKeys(set, char) {
    const r = REST[set]?.[char] ?? REST[char] ?? DEFAULT_REST[char];
    if (!r) return null;
    if (Array.isArray(r[0])) return r;                // already [[frame, pose, face, move]]
    return [[0, r[0], r[1] ?? 'smile', 0]];           // [pose, face] shorthand
  }

  // ---- in-game timeline (absolute frames). Segment avatar defaults to 'me'.
  const tracks = {}; const chat = []; const banners = [];
  for (const sh of shots) {
    for (const [rf, seg] of sh.game || []) { const id = seg.avatar ?? 'me'; (tracks[id] ||= []).push({ f: sh.start + rf, ...seg }); }
    for (const [rf, name, text, color] of sh.chat || []) chat.push({ f: sh.start + rf, name, text, color });
    for (const [rf, b] of sh.banner || []) banners.push({ f: sh.start + rf, ...b });
  }
  for (const id in tracks) tracks[id].sort((a, b) => a.f - b.f);
  chat.sort((a, b) => a.f - b.f); banners.sort((a, b) => a.f - b.f);
  const GAME = P.GAME || {};

  function gameState(f, id = 'me') {
    if (powerOff != null && f >= powerOff) return { mode: 'off' };
    const segs = tracks[id];
    if (!segs || !segs.length) return id === 'me' ? { mode: 'stand', at: 9, stage: 49, ping: 24 + ((f * 7) % 9), t: 0 } : { mode: 'hidden' };
    let seg = segs[0]; for (const g of segs) if (g.f <= f) seg = g;
    const t = f - seg.f; const base = { ping: 24 + ((f * 7) % 9) };
    if (seg.ping) base.ping = seg.ping + ((f * 3) % 3);
    if (seg.face) base.face = seg.face;
    if (seg.offset) base.offset = seg.offset; // [x, z] shift so several avatars can share a platform
    const fin = GAME.stages ?? 50, last = fin - 1;
    switch (seg.mode) {
      case 'stand': return { ...base, mode: 'stand', at: seg.at, stage: seg.stage, t: 0 };
      case 'spawn': return { ...base, mode: 'spawn', at: 0, stage: 1, t, quiet: seg.quiet };
      case 'run': {
        const u = Math.min(1, t / seg.dur);
        return { ...base, mode: 'run', from: seg.from, to: seg.to, dur: seg.dur, t: Math.min(t, seg.dur - 0.001), stage: Math.round(seg.s0 + (seg.s1 - seg.s0) * u) };
      }
      case 'jump': {
        if (t < seg.lagAt) return { ...base, mode: 'run', from: 9, to: 10, dur: 30, t, stage: last };
        const lt = t - seg.lagAt; const ping = Math.min(seg.peak, Math.round(base.ping * Math.pow(2, lt / seg.ramp)));
        return { mode: 'lag', from: 9, to: 10, dur: 30, lagAt: seg.lagAt, t: lt, slip: seg.slip, ping, stage: last, spinAt: 6, lagFrame: seg.f + seg.lagAt };
      }
      case 'rejoin': return { mode: 'rejoin', t, dur: seg.dur, ping: 9999, stage: last };
      case 'win': return { ...base, mode: 'win', from: seg.from, to: seg.to, dur: seg.dur, t, stage: t >= seg.dur ? fin : last };
      // multi-player modes
      case 'fall': return { ...base, mode: 'fall', from: seg.from ?? 0, t, stage: seg.stage ?? 1 };
      case 'cheer': return { ...base, mode: 'cheer', at: seg.at ?? 10, t, stage: seg.stage ?? fin };
      case 'carry': return { ...base, mode: 'carry', by: seg.by, t, stage: seg.stage };
      case 'follow': return { ...base, mode: 'follow', target: seg.target, delay: seg.delay ?? 6, offset: seg.offset ?? [0, -2.2], t, stage: seg.stage };
      case 'hidden': return { mode: 'hidden' };
    }
    return { ...base, mode: 'stand', at: 9, stage: last };
  }
  function chatAt(f, n = 5) { return chat.filter((c) => c.f <= f).slice(-n); }
  function bannerAt(f) { let b = null; for (const x of banners) if (x.f <= f && f < x.f + (x.dur ?? 45)) b = x; return b; }
  function shotAt(f) { let sh = shots[0]; for (const x of shots) if (x.start <= f) sh = x; return sh; }

  const avatars = GAME.avatars || { me: { cast: 'kid' } };
  for (const id of Object.keys(tracks)) if (!avatars[id]) errors.push(`game segment for unknown avatar "${id}" (add it to GAME.avatars)`);

  return { P, cast, lib, cams, shots, total, powerOff, punchline, placement, setsUsed, charsBySet, restKeys, tracks, chat, banners, gameState, chatAt, bannerAt, shotAt, GAME, avatars, errors };
}
