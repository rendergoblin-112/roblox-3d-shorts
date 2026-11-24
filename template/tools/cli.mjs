#!/usr/bin/env node
// roblox-3d-shorts command line. Run from the template folder:  node tools/cli.mjs <command> ...
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolveProject, FPS } from '../engine/timeline.js';
import { TEMPLATE, openEngine, openCanvas, serve } from './browser.mjs';
import { mixProject } from './mix.mjs';
import { SYNTH } from './synth.mjs';
import { FFMPEG } from './dsp.mjs';

const HELP = `usage: node tools/cli.mjs <command> [args]

  check   <project>                          shot table + format checks (duration, cuts, punchline, caption, voice...)
  stills  <project> <outdir> [mid|start|end|<frame>...] [--shots id,id]
                                             render PNG stills (default: one per shot at 60%)
  sheet   <dir> <out.jpg> [cols]             contact sheet of every PNG/JPG in a folder
  pair    <ours> <ref> <out.jpg> [label]     one side-by-side image
  compare <project> <stillsdir> <outdir> [--refs <dir>]
                                             side-by-side of each still with the house reference for its camera
                                             type + picture stats against the targets
  stats   <png>...                           picture luminance / saturation (targets: mean ~117, p95 ~213, sat 0.48-0.58)
  video   <project> <out.mp4> [start end]    silent h264 render (wrap in renderlock if you have it)
  mix     <project> <out.wav>                soundtrack from sound.js
  mux     <video.mp4> <audio.wav> <out.mp4>  add the soundtrack without re-encoding the picture
  build   <project> <out.mp4>                check + video + mix + mux + measure, in one go
  measure <video.mp4>                        cuts/min, frozen frames, holds, luminance, loudness (as the study measured)
  faces   <out.png>                          every face decal for every cast member
  sfx     "<prompt>" <out.mp3> [seconds] [--music]
                                             generate one sound with ElevenLabs (needs ELEVENLABS_API_KEY)
  probe   <sound>...                         where each sound starts/ends inside its file and how loud (use before placing it)
  regen-sfx [--force] [--out <dir>]          regenerate the shipped sounds from sfx/prompts.json
  doctor                                     check node, ffmpeg, the headless browser and fonts

  <project> is a folder with short.js (+ sound.js), e.g. ../examples/wifi-lag`;

const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const bool = (name) => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };
const OPT = { shots: flag('--shots'), refs: flag('--refs'), out: flag('--out'), force: bool('--force'), music: bool('--music') };
const cmd = argv[0];

function projectDir(p) {
  if (!p) die('missing <project> folder');
  const d = path.resolve(p);
  if (!fs.existsSync(path.join(d, 'short.js'))) die(`no short.js in ${d}`);
  return d;
}
async function loadProject(p) {
  const d = projectDir(p);
  const v = `?t=${Date.now()}`;
  const P = await import(pathToFileURL(path.join(d, 'short.js')).href + v);
  const S = fs.existsSync(path.join(d, 'sound.js')) ? await import(pathToFileURL(path.join(d, 'sound.js')).href + v) : {};
  const R = resolveProject(P);
  return { d, P, R, SOUND: S.SOUND || {} };
}
function die(msg) { console.error('error: ' + msg); process.exit(1); }
function needFfmpeg() { const r = spawnSync(FFMPEG, ['-version']); if (r.error || r.status !== 0) die(`ffmpeg not found (${FFMPEG}). Install it (macOS: brew install ffmpeg) or set FFMPEG=/path/to/ffmpeg`); }
const sec = (f) => (f / FPS).toFixed(2);

// ---------------------------------------------------------------- check
function check({ P, R, SOUND, d }) {
  const lines = [], warn = [], pass = [];
  const ok = (cond, msg) => (cond ? pass : warn).push(msg);
  for (const s of R.shots) lines.push(`${s.id.padEnd(12)} ${s.set.padEnd(7)} ${s.cam.padEnd(12)} f${String(s.start).padStart(4)}-${String(s.start + s.len).padStart(4)}  ${sec(s.start).padStart(6)}s  ${String(s.len).padStart(3)}f ${s.beat ? ' ' + s.beat : ''}`);
  const dur = R.total / FPS, cuts = R.shots.length - 1, cpm = cuts / (dur / 60);
  const lens = R.shots.map((s) => s.len).sort((a, b) => a - b), med = lens[Math.floor(lens.length / 2)], longest = lens[lens.length - 1];
  const firstCut = R.shots[0].len / FPS, in3 = R.shots.filter((s) => s.start > 0 && s.start < 90).length;
  ok(dur >= 42 && dur <= 47, `duration ${dur.toFixed(2)} s (style A: 42-47 s)`);
  ok(cpm >= 38 && cpm <= 53, `${cuts} hard cuts = ${cpm.toFixed(1)}/min (target ~44; style A shorts 38-53)`);
  ok(med / FPS <= 1.4, `median shot ${(med / FPS).toFixed(2)} s (target ~1.1 s; most shots 0.6-2.3 s)`);
  ok(longest <= 105, `longest shot ${(longest / FPS).toFixed(2)} s (keep under ~3.5 s)`);
  ok(lens[0] >= 15, `shortest shot ${(lens[0] / FPS).toFixed(2)} s (keep at least ~0.5 s)`);
  ok(firstCut <= 1.6, `first cut at ${firstCut.toFixed(2)} s (target ~1.3 s)`);
  ok(in3 >= 2, `${in3} cuts inside the first 3 s (target 2)`);
  if (R.punchline == null) warn.push('no punchline marked: set punchline: <frame> (or powerOff) on the punchline shot');
  else {
    const pos = R.punchline / R.total, tail = (R.total - R.punchline) / FPS;
    ok(pos >= 0.88 && pos <= 0.96, `punchline at ${(R.punchline / FPS).toFixed(2)} s = ${(pos * 100).toFixed(1)}% (target ~93%)`);
    ok(tail >= 1.0 && tail <= 3.6, `end ${tail.toFixed(2)} s after the punchline (target ~2-3 s: a short button, then cut)`);
  }
  const esc = new Set(R.shots.map((s) => s.beat).filter((b) => /^esc\d/.test(b || '')).map((b) => b.match(/^esc\d+/)[0]));
  ok(esc.size >= 3 && esc.size <= 5, `${esc.size} escalations tagged (beat: 'esc1'..; target ~4, each worse than the last)`);
  // caption
  const capLines = Array.isArray(P.CAPTION) ? P.CAPTION : String(P.CAPTION ?? '').split('\n');
  const cap = capLines.join(' ');
  const words = cap.replace(/\p{Extended_Pictographic}|\u200d|\ufe0f/gu, ' ').trim().split(/\s+/).filter(Boolean);
  const emo = (cap.match(/\p{Extended_Pictographic}/gu) || []).length;
  ok(words.length >= 6 && words.length <= 10, `caption ${words.length} words (target 7-9)`);
  ok(/^(when|pov)\b/i.test(words[0] || ''), `caption starts with "${words[0]}" (target "When…" or "POV:…")`);
  ok(capLines.length >= 1 && capLines.length <= 2, `caption ${capLines.length} line(s) (style A: 2)`);
  ok(emo >= 1 && emo <= 2, `caption ends with ${emo} emoji (style A: 1-2)`);
  // camera
  const angles = R.shots.map((s) => R.cams[s.cam]?.angle || 'eye'), sizes = R.shots.map((s) => R.cams[s.cam]?.size || 'MS');
  const high = angles.filter((a) => a === 'high').length / R.shots.length, ins = sizes.filter((s) => s === 'insert').length / R.shots.length;
  ok(high >= 0.2 && high <= 0.45, `high-angle shots ${(high * 100).toFixed(0)}% (style A 25-41%)`);
  pass.push(`inserts ${(ins * 100).toFixed(0)}% (study pooled ~7%; more is fine when the story lives on a screen)`);
  const pushes = R.shots.filter((s) => s.push).length; ok(pushes <= 1, `${pushes} push-in(s) (style A: at most one slow push, 1.03-1.06x/s)`);
  // faces (lead = first cast member keyed in the first shot, or LEAD)
  const lead = P.LEAD || R.shots[0].cast[0] || 'kid';
  let swaps = 0, prev = null;
  for (const s of R.shots) for (const k of s[lead] || []) { if (prev && k[2] !== prev) swaps++; prev = k[2]; }
  ok(swaps >= 8, `${lead}'s face swaps ${swaps} (style A median 8.5, range 6-25)`);
  // first frame motion: a key after frame 0 in shot 1, or game action
  const s0 = R.shots[0]; const moves = s0.cast.some((c) => (s0[c] || []).some((k) => k[0] > 0 && k[0] <= 2)) || (s0.game || []).length > 0;
  ok(moves, 'something moves on frame 1 (a pose key at frame 1-2 of the first shot, or game action)');
  // sound
  if (!SOUND || !Object.keys(SOUND).length) warn.push('no sound.js: the short will be silent');
  else {
    const vox = SOUND.vox || [];
    ok(vox.length >= 2 && vox.length <= 11, `${vox.length} voice interjections (study: 2-11, only at reactions, no dialogue)`);
    for (const [shot, f, name] of vox) {
      const s = R.shots.find((x) => x.id === shot); if (!s) { warn.push(`vox ${name}: unknown shot ${shot}`); continue; }
      const swapsAt = s.cast.flatMap((c) => (s[c] || []).map((k) => k[0]));
      // a reaction beat = a pose/face key within 3 frames, or the cut itself when the shot opens on a new face
      const i = R.shots.indexOf(s), prevFace = (c) => { for (let j = i - 1; j >= 0; j--) { const k = R.shots[j][c]; if (k) return k[k.length - 1][2]; } return null; };
      const swapOnCut = f <= 10 && s.cast.some((c) => s[c][0][2] !== prevFace(c));
      const near = swapsAt.some((k) => Math.abs(k - f) <= 3) || swapOnCut;
      ok(near, `vox ${name} at ${shot} f${f} ${near ? 'lands on' : 'is not within 3 frames of'} a reaction (pose/face key or face swap on the cut)`);
    }
    const names = [...(SOUND.cues || []).map((c) => c[2]), ...vox.map((v) => v[2]), ...(SOUND.bed ? [SOUND.bed.file] : [])];
    for (const n of new Set(names)) {
      if (n.startsWith('synth:')) { if (!SYNTH[n.slice(6)]) warn.push(`unknown synth sound ${n}`); continue; }
      if (!fs.existsSync(path.join(d, 'sfx', n)) && !fs.existsSync(path.join(TEMPLATE, 'sfx', n))) warn.push(`missing sound file ${n} (looked in ${path.join(d, 'sfx')} and template/sfx)`);
    }
    for (const c of SOUND.cues || []) if (c[0] !== 'power' && !R.shots.find((x) => x.id === c[0])) warn.push(`cue ${c[2]}: unknown shot ${c[0]}`);
  }
  console.log(lines.join('\n'));
  console.log(`\nTOTAL ${R.total} frames = ${dur.toFixed(2)} s, ${R.shots.length} shots${R.powerOff != null ? `, power-off f${R.powerOff}` : ''}${R.punchline != null ? `, punchline f${R.punchline}` : ''}\n`);
  for (const e of R.errors) console.log('ERROR ' + e);
  for (const p of pass) console.log('ok    ' + p);
  for (const w of warn) console.log('WARN  ' + w);
  return { errors: R.errors, warn };
}

// ---------------------------------------------------------------- images (in the headless browser)
async function withCanvas(files, fn) {
  const allow = new Set(files.map((f) => path.resolve(f)));
  const http = await import('node:http');
  const srv = http.createServer((req, rsp) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').searchParams.get('p') || '');
    if (!allow.has(p)) { rsp.writeHead(404); return rsp.end(); }
    rsp.writeHead(200, { 'Content-Type': p.endsWith('.png') ? 'image/png' : 'image/jpeg', 'Access-Control-Allow-Origin': '*' }); fs.createReadStream(p).pipe(rsp);
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/img?p=`;
  const { page, close } = await openCanvas();
  try { return await fn(page, (f) => base + encodeURIComponent(path.resolve(f))); } finally { await close(); srv.close(); }
}
const saveDataUrl = (url, out) => { fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); };
const IMG_JS = `window.load = (u) => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => rej(new Error('cannot load ' + u)); i.src = u; });`;

async function sheet(dir, out, cols = 7, w = 270) {
  const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort().map((f) => path.join(dir, f));
  if (!files.length) die(`no images in ${dir}`);
  await withCanvas(files, async (page, url) => {
    await page.evaluate(IMG_JS);
    const data = await page.evaluate(async (items, cols, w) => {
      const h = Math.round(w * 16 / 9), rows = Math.ceil(items.length / cols);
      const c = document.createElement('canvas'); c.width = cols * w; c.height = rows * (h + 18); const g = c.getContext('2d');
      g.fillStyle = '#1e1e1e'; g.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < items.length; i++) {
        const im = await window.load(items[i].u); const x = (i % cols) * w, y = Math.floor(i / cols) * (h + 18);
        g.drawImage(im, x, y, w, h); g.fillStyle = '#ffe600'; g.font = '13px sans-serif'; g.fillText(items[i].n.slice(0, 30), x + 4, y + h + 13);
      }
      return c.toDataURL('image/jpeg', 0.88);
    }, files.map((f) => ({ u: url(f), n: path.basename(f) })), cols, w);
    saveDataUrl(data, out);
  });
  console.log('saved', out, files.length, 'images');
}
async function pairs(list) { // list of { a, b, out, label, refLabel }
  await withCanvas(list.flatMap((p) => [p.a, p.b]), async (page, url) => {
    await page.evaluate(IMG_JS);
    for (const p of list) {
      const data = await page.evaluate(async (a, b, label, refLabel) => {
        const A = await window.load(a), B = await window.load(b); const h = 960;
        const wa = Math.round(A.width * h / A.height), wb = Math.round(B.width * h / B.height);
        const c = document.createElement('canvas'); c.width = wa + wb + 12; c.height = h + 40; const g = c.getContext('2d');
        g.fillStyle = '#141414'; g.fillRect(0, 0, c.width, c.height); g.drawImage(A, 0, 40, wa, h); g.drawImage(B, wa + 12, 40, wb, h);
        g.font = 'bold 22px sans-serif'; g.fillStyle = '#ffe600'; g.fillText('OURS  ' + label, 8, 28); g.fillStyle = '#78dcff'; g.fillText('REFERENCE  ' + refLabel, wa + 20, 28);
        return c.toDataURL('image/jpeg', 0.9);
      }, url(p.a), url(p.b), p.label || '', p.refLabel || path.basename(p.b));
      saveDataUrl(data, p.out); console.log('saved', p.out);
    }
  });
}
async function stats(files, quiet = false) {
  const out = [];
  await withCanvas(files, async (page, url) => {
    await page.evaluate(IMG_JS);
    for (const f of files) {
      const s = await page.evaluate(async (u) => {
        const im = await window.load(u); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
        const banded = im.height === 1920; const y0 = banded ? 355 : Math.round(im.height * 0.185), y1 = banded ? 1565 : Math.round(im.height * 0.815);
        const d = g.getImageData(0, y0, im.width, y1 - y0).data; const hist = new Array(256).fill(0); let sum = 0, sat = 0, clip = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) { const r = d[i], gg = d[i + 1], b = d[i + 2]; const l = 0.299 * r + 0.587 * gg + 0.114 * b; sum += l; hist[Math.min(255, Math.round(l))]++; const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); sat += mx > 0 ? (mx - mn) / mx : 0; if (l >= 250) clip++; n++; }
        const pct = (q) => { let acc = 0; for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= q * n) return i; } return 255; };
        return { mean: sum / n, p05: pct(0.05), p95: pct(0.95), sat: sat / n, clip: clip / n * 100 };
      }, url(f));
      out.push({ f, ...s });
      if (!quiet) console.log(`${path.basename(f).padEnd(28)} lum mean ${s.mean.toFixed(1).padStart(6)}  p05 ${String(s.p05).padStart(3)}  p95 ${String(s.p95).padStart(3)}  sat ${s.sat.toFixed(3)}  clip ${s.clip.toFixed(2)}%`);
    }
  });
  return out;
}

// ---------------------------------------------------------------- render
async function stills(p, outdir, rest) {
  const only = OPT.shots;
  const { d } = await loadProject(p);
  fs.mkdirSync(outdir, { recursive: true });
  const E = await openEngine(d);
  console.log('renderer:', E.info.renderer);
  let list = rest.filter((x) => !x.startsWith('--'));
  const mode = list[0] && ['mid', 'start', 'end'].includes(list[0]) ? list.shift() : (list.length ? null : 'mid');
  if (mode) { const pos = { mid: 0.6, start: 0, end: 1 }[mode]; list = E.info.shots.filter((s) => !only || only.split(',').includes(s.id)).map((s) => s.start + Math.min(s.len - 1, Math.floor(s.len * pos))); }
  for (const s of list) { const f = parseInt(s, 10); fs.writeFileSync(path.join(outdir, `f${String(f).padStart(4, '0')}.png`), await E.frame(f)); console.log('still', f, E.info.shots.filter((x) => x.start <= f).pop()?.id); }
  await E.close();
}
async function video(p, out, start, end) {
  needFfmpeg();
  const { d } = await loadProject(p);
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const E = await openEngine(d);
  console.log('renderer:', E.info.renderer);
  const a = start ? parseInt(start, 10) : 0, b = end ? parseInt(end, 10) : E.info.total;
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = a; f < b; f++) {
    const buf = await E.frame(f);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`frame ${f}/${b}  ${((Date.now() - t0) / 1000 / (f - a + 1)).toFixed(3)} s/frame`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  await E.close();
  console.log('done', out, ((Date.now() - t0) / 1000).toFixed(1), 's');
}
function mux(v, a, out) {
  needFfmpeg();
  const r = spawnSync(FFMPEG, ['-y', '-v', 'error', '-i', v, '-i', a, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
  if (r.status !== 0) die('mux failed');
  console.log('saved', out);
}
function measure(file) {
  needFfmpeg();
  const W = 270, H = 480;
  const r = spawnSync(FFMPEG, ['-v', 'error', '-i', file, '-vf', `scale=${W}:${H}`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 2 ** 31 });
  if (r.status !== 0) die('cannot read ' + file);
  const fr = W * H, n = Math.floor(r.stdout.length / fr), y0 = Math.floor(H * 0.185), y1 = Math.floor(H * 0.815);
  const d = []; let lum = 0;
  for (let k = 0; k < n; k++) {
    let s = 0, l = 0;
    for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const i = k * fr + y * W + x; l += r.stdout[i]; if (k) s += Math.abs(r.stdout[i] - r.stdout[i - fr]); }
    lum += l / ((y1 - y0) * W); if (k) d.push(s / ((y1 - y0) * W));
  }
  const dur = n / FPS; const cutsRaw = d.map((v, i) => (v > 14 ? i : -1)).filter((i) => i >= 0);
  const cuts = cutsRaw.filter((c, i) => i === 0 || c - cutsRaw[i - 1] > 3);
  const frozen = d.map((v) => v < 0.35); let holds = 0, run = 0; for (const z of frozen) { if (z) run++; else { if (run >= 6) holds++; run = 0; } } if (run >= 6) holds++;
  console.log(`frames ${n}  duration ${dur.toFixed(2)} s`);
  console.log(cuts.length ? `picture changes > 14 grey (cuts + full-screen changes) ${cuts.length} -> ${(cuts.length / dur * 60).toFixed(1)}/min   first at ${((cuts[0] + 1) / FPS).toFixed(2)} s` : 'no cuts');
  console.log(`frozen-frame share ${(frozen.filter(Boolean).length / frozen.length * 100).toFixed(1)}%  (style A median 52%, 37-70%)`);
  console.log(`holds >= 6 frames: ${holds} -> ${(holds / dur * 60).toFixed(1)}/min  (style A median 48/min, 43-74)`);
  console.log(`first frame with change > 1.5 grey: ${d.findIndex((v) => v > 1.5) + 1}`);
  console.log(`picture luminance mean ${(lum / n).toFixed(1)}  (target ~117)`);
  const L = spawnSync(FFMPEG, ['-hide_banner', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '';
  const I = [...L.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop(), P = [...L.matchAll(/Peak:\s+(-?[\d.]+) dBFS/g)].pop();
  if (I) console.log(`loudness ${I[1]} LUFS, true peak ${P ? P[1] : '?'} dBTP  (target -12 to -14 LUFS)`);
}

// ---------------------------------------------------------------- sounds
async function elevenlabs(prompt, out, seconds, music) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) die('ELEVENLABS_API_KEY is not set. Export it in your shell (export ELEVENLABS_API_KEY=...) to generate sounds. The shipped sounds in template/sfx work without it.');
  const url = music ? 'https://api.elevenlabs.io/v1/music' : 'https://api.elevenlabs.io/v1/sound-generation';
  const body = music ? { prompt, music_length_ms: Math.round(parseFloat(seconds || 30) * 1000) } : { text: prompt, prompt_influence: 0.5, ...(seconds ? { duration_seconds: parseFloat(seconds) } : {}) };
  const r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) die(`ElevenLabs ${r.status}: ${await r.text()}`);
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  console.log('saved', out);
}

// ---------------------------------------------------------------- probe sounds (where the sound starts, how loud)
async function probe(files) {
  const { decode, SR: sr } = await import('./dsp.mjs');
  for (const f of files) {
    const { L, R } = decode(f); const hop = sr / 100, e = [];
    for (let i = 0; i + hop <= L.length; i += hop) { let s = 0; for (let k = 0; k < hop; k++) { const v = (L[i + k] + R[i + k]) / 2; s += v * v; } e.push(10 * Math.log10(s / hop + 1e-12)); }
    const mx = Math.max(...e), on = e.findIndex((v) => v > mx - 24) / 100, off = (e.length - [...e].reverse().findIndex((v) => v > mx - 30)) / 100, pk = e.indexOf(mx) / 100;
    console.log(`${path.basename(f).padEnd(22)} length ${(L.length / sr).toFixed(2)}s  sound ${on.toFixed(2)}-${off.toFixed(2)}s  loudest at ${pk.toFixed(2)}s  peak level ${mx.toFixed(1)} dB${on > 0.04 ? `   -> trim: ${on.toFixed(2)}` : ''}`);
  }
}

// ---------------------------------------------------------------- doctor
async function doctor() {
  const [maj, min] = process.versions.node.split('.').map(Number);
  console.log(`node ${process.versions.node} ${maj >= 20 || (maj === 18 && min >= 17) ? 'ok' : 'TOO OLD (need 18.17+, 20+ recommended)'}`);
  const f = spawnSync(FFMPEG, ['-version'], { encoding: 'utf8' });
  console.log(f.error || f.status !== 0 ? `ffmpeg MISSING (${FFMPEG}): install it or set FFMPEG` : `ffmpeg ok: ${f.stdout.split('\n')[0]}`);
  for (const m of ['three/build/three.module.js', '@fontsource/nunito/files/nunito-latin-800-normal.woff2', '@fontsource/fredoka/files/fredoka-latin-700-normal.woff2'])
    console.log(`${m.split('/')[0]} ${fs.existsSync(path.join(TEMPLATE, 'node_modules', m)) ? 'ok' : 'MISSING: run npm install in template/'}`);
  try {
    const { openEngine: _ } = await import('./browser.mjs');
    const E = await openEngine(path.join(TEMPLATE, '..', 'examples', 'wifi-lag'));
    console.log(`headless browser ok: ${E.info.renderer}`); await E.close();
  } catch (e) { console.log('headless browser FAILED: ' + e.message); }
  console.log(`ELEVENLABS_API_KEY ${process.env.ELEVENLABS_API_KEY ? 'set' : 'not set (only needed to generate new sounds)'}`);
}

// ---------------------------------------------------------------- main
const a = argv.slice(1);
try {
  switch (cmd) {
    case 'check': { const r = check(await loadProject(a[0])); process.exit(r.errors.length ? 1 : 0); }
    case 'stills': await stills(a[0], a[1] || die('missing <outdir>'), a.slice(2)); break;
    case 'sheet': await sheet(a[0], a[1], a[2] ? parseInt(a[2], 10) : 7); break;
    case 'pair': await pairs([{ a: a[0], b: a[1], out: a[2], label: a[3] }]); break;
    case 'compare': {
      const refs = path.resolve(OPT.refs || path.join(TEMPLATE, '..', 'examples', 'wifi-lag', 'ref'));
      const { R } = await loadProject(a[0]); const dir = a[1], out = a[2] || die('usage: compare <project> <stillsdir> <outdir>');
      const files = fs.readdirSync(dir).filter((f) => /^f\d+\.png$/.test(f)).sort();
      const list = [];
      for (const f of files) {
        const fr = parseInt(f.slice(1), 10), sh = R.shotAt(fr), cam = R.cams[sh.cam], ref = cam.ref || 'front_ms';
        const rp = ['.jpg', '.png'].map((e) => path.join(refs, ref + e)).find((p) => fs.existsSync(p));
        if (rp) list.push({ a: path.join(dir, f), b: rp, out: path.join(out, `${f.replace('.png', '')}_${sh.id}_vs_${ref}.jpg`), label: `${sh.id} (${sh.cam})`, refLabel: `${ref} (house reference)` });
      }
      if (list.length) await pairs(list);
      console.log('\npicture stats (targets: mean ~117 day / ~30-45 night, p95 ~213, saturation 0.48-0.58, clip < 1%):');
      await stats(files.map((f) => path.join(dir, f)));
      break;
    }
    case 'stats': await stats(a); break;
    case 'video': await video(a[0], a[1] || die('missing <out.mp4>'), a[2], a[3]); break;
    case 'mix': { needFfmpeg(); const L = await loadProject(a[0]); const out = a[1] || die('missing <out.wav>'); fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); await mixProject({ R: L.R, SOUND: L.SOUND, projDir: L.d, out }); console.log('saved', out); break; }
    case 'mux': mux(a[0], a[1], a[2]); break;
    case 'build': {
      needFfmpeg();
      const L = await loadProject(a[0]); const out = a[1] || die('missing <out.mp4>');
      const r = check(L); if (r.errors.length) die('fix the errors above first');
      const base = out.replace(/\.mp4$/i, '');
      await video(a[0], base + '.silent.mp4');
      await mixProject({ R: L.R, SOUND: L.SOUND, projDir: L.d, out: base + '.wav' });
      mux(base + '.silent.mp4', base + '.wav', out);
      measure(out);
      break;
    }
    case 'measure': measure(a[0]); break;
    case 'faces': {
      const out = a[0] || die('missing <out.png>'); const E = await openEngine(path.join(TEMPLATE, '..', 'examples', 'wifi-lag'));
      saveDataUrl(await E.page.evaluate(() => window.__faceSheet()), out); await E.close(); console.log('saved', out); break;
    }
    case 'sfx': await elevenlabs(a[0], a[1] || die('usage: sfx "<prompt>" <out.mp3> [seconds] [--music]'), a[2], OPT.music); break;
    case 'regen-sfx': {
      const force = OPT.force; const outDir = path.resolve(OPT.out || path.join(TEMPLATE, 'sfx'));
      const list = JSON.parse(fs.readFileSync(path.join(TEMPLATE, 'sfx', 'prompts.json'), 'utf8')).sounds;
      for (const s of list) { const o = path.join(outDir, s.file); if (fs.existsSync(o) && !force) { console.log('keep', s.file); continue; } await elevenlabs(s.prompt, o, s.seconds, s.music); }
      break;
    }
    case 'probe': needFfmpeg(); await probe(a); break;
    case 'doctor': await doctor(); break;
    default: console.log(HELP); process.exit(cmd ? 1 : 0);
  }
} catch (e) { console.error('error:', e.message); process.exit(1); }
