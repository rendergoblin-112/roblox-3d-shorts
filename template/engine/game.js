// The made-up obby shown on in-world screens: floating platforms over lava, a finish flag, our own HUD
// (stage counter, ping that spikes, loading spinner, "Rejoining" screen, banners, chat). Rendered to a texture.
// Several avatars can play at once (GAME.avatars in short.js); the HUD and camera follow the focus avatar.
import * as THREE from 'three';
import { box, cyl, sphere, mat, canvasTex, clamp, lerp, easeOut, rng, D2R } from './util.js';
import { makeChar, applyPose } from './rig.js';
import { AVATAR_LOOKS } from './cast.js';

export const GW = 1280, GH = 720;
const N = 10; // platform 0 = start, 10 = finish

function platformPos(i) {
  if (i === N) return new THREE.Vector3(0.5, 2.6, 9 * 6.2 + 9.5);
  return new THREE.Vector3(Math.sin(i * 1.7) * 2.6, (i % 3) * 0.45 + i * 0.12, i * 6.2);
}
const COLORS = ['#ff3b6b', '#ffcc22', '#2fd36b', '#2f9bff', '#a45cff', '#ff8a1f', '#22d6d0', '#ff4fc0', '#7bdc2a', '#ff5a3a'];
const LAVA_Y = -5;

export function makeGame(renderer, R) {
  const GAME = R.GAME || {};
  const STAGES = GAME.stages ?? 50;
  const scene = new THREE.Scene();
  scene.background = canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3c8dff'); gr.addColorStop(0.55, '#8fd0ff'); gr.addColorStop(1, '#ffd9a8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  scene.add(new THREE.HemisphereLight('#e6f2ff', '#ff8a4a', 1.6));
  const sun = new THREE.DirectionalLight('#fff3dc', 2.4); sun.position.set(-20, 30, -10); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 120 }); sun.shadow.bias = -0.0005; sun.shadow.radius = 3;
  scene.add(sun); scene.add(sun.target);

  // lava sea
  const lavaTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#ff3d00'; g.fillRect(0, 0, w, h); const R = rng(7);
    for (let i = 0; i < 90; i++) { const x = R() * w, y = R() * h, r = 8 + R() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,230,60,0.95)'); gr.addColorStop(1, 'rgba(255,120,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(140,10,0,0.5)'; g.beginPath(); g.ellipse(R() * w, R() * h, 10 + R() * 26, 4 + R() * 8, R() * 3, 0, Math.PI * 2); g.fill(); }
  }, { repeat: [40, 40] });
  const lava = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ map: lavaTex, color: new THREE.Color(1.25, 1.1, 1.0) }));
  lava.rotation.x = -Math.PI / 2; lava.position.set(0, LAVA_Y, 60); scene.add(lava);

  // platforms
  const plats = [];
  for (let i = 0; i <= N; i++) {
    const p = platformPos(i), g = new THREE.Group(); g.position.copy(p); scene.add(g);
    if (i === 0) {
      box(g, 7, 1, 7, '#3ccf4e', 0, -0.5, 0, { r: 0.2 }); box(g, 2.6, 0.12, 2.6, '#e8ffe0', 0, 0.06, 0, { r: 0.05 });
      const sign = canvasTex(512, 160, (c, w, h) => { c.fillStyle = '#1d7a2c'; c.beginPath(); c.roundRect(0, 0, w, h, 30); c.fill(); c.fillStyle = '#fff'; c.font = '700 110px Fredoka'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('START', w / 2, h / 2 + 6); });
      box(g, 0.25, 3, 0.25, '#ffffff', -2.6, 1.5, 3.2); box(g, 0.25, 3, 0.25, '#ffffff', 2.6, 1.5, 3.2);
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.7), new THREE.MeshStandardMaterial({ map: sign, roughness: 0.6 })); sm.position.set(0, 3.1, 3.3); sm.rotation.y = Math.PI; g.add(sm);
    } else if (i === N) {
      const chk = canvasTex(256, 256, (c, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#111' : '#fff'; c.fillRect(x * 32, y * 32, 32, 32); } });
      box(g, 7, 1, 6, '#ffd23a', 0, -0.5, 0, { r: 0.2 });
      const pad = new THREE.Mesh(new THREE.BoxGeometry(5, 0.1, 4), new THREE.MeshStandardMaterial({ map: chk, roughness: 0.6 })); pad.position.y = 0.05; pad.receiveShadow = true; g.add(pad);
      box(g, 0.5, 5, 0.5, '#ff3b6b', -3, 2.5, 1.5); box(g, 0.5, 5, 0.5, '#ff3b6b', 3, 2.5, 1.5);
      const fin = canvasTex(512, 128, (c, w, h) => { c.fillStyle = '#ff3b6b'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '700 96px Fredoka'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FINISH', w / 2, h / 2 + 6); });
      const fm = new THREE.Mesh(new THREE.BoxGeometry(6.6, 1.3, 0.5), [mat('#ff3b6b'), mat('#ff3b6b'), mat('#ff3b6b'), mat('#ff3b6b'), new THREE.MeshStandardMaterial({ map: fin }), new THREE.MeshStandardMaterial({ map: fin })]);
      fm.position.set(0, 5.4, 1.5); fm.castShadow = true; g.add(fm);
      cyl(g, 0.1, 0.1, 6, '#eeeeee', 2.2, 3, -1.8);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5, 8, 1), new THREE.MeshStandardMaterial({ map: chk, side: THREE.DoubleSide })); flag.position.set(3.4, 5.2, -1.8); g.add(flag);
      sphere(g, 0.2, '#ffd23a', 2.2, 6.1, -1.8);
      g.userData.flag = flag;
    } else {
      const sz = i === N - 1 ? 2.6 : 2.4 + ((i * 37) % 10) / 10;
      box(g, sz, 0.8, sz, COLORS[i % COLORS.length], 0, -0.4, 0, { r: 0.18 });
      box(g, sz * 0.7, 0.6, sz * 0.7, new THREE.Color(COLORS[i % COLORS.length]).multiplyScalar(0.7), 0, -1.0, 0, { r: 0.15 });
    }
    plats.push(g);
  }
  // decoration: clouds, far islands, kill-brick spinners
  const R0 = rng(11);
  for (let i = 0; i < 26; i++) {
    const c = new THREE.Group(); c.position.set((R0() < 0.5 ? -1 : 1) * (18 + R0() * 50), 16 + R0() * 14, R0() * 170 + 10); scene.add(c);
    for (let k = 0; k < 5; k++) sphere(c, 2.2 + R0() * 1.6, mat('#ffffff', { rough: 0.95 }), (k - 2) * 2.4, R0() * 1.0, R0() * 1.5, { cast: false });
  }
  for (let i = 0; i < 14; i++) {
    const s = 3 + R0() * 6, x = (R0() < 0.5 ? -1 : 1) * (14 + R0() * 30), z = R0() * 140;
    box(scene, s, s * 0.6, s, COLORS[i % COLORS.length], x, -1 + R0() * 6, z, { r: 0.3 });
  }
  const spinners = [];
  for (const i of [3, 6, 8]) { const p = platformPos(i); const sp = box(scene, 6, 0.35, 0.35, '#ff2a2a', p.x, p.y + 0.6, p.z + 3.1, { r: 0.1 }); spinners.push(sp); }

  // avatars: 'me' is the kid's own avatar (same signature hoodie + headset) unless GAME.avatars says otherwise
  const AV = {};
  for (const [id, a] of Object.entries(R.avatars)) {
    const look = typeof a.look === 'string' ? AVATAR_LOOKS[a.look] : (a.look || {});
    if (typeof a.look === 'string' && !look) throw new Error(`Unknown avatar look "${a.look}"`);
    const base = a.cast ? R.cast[a.cast] : { skin: '#e8a874', ...AVATAR_LOOKS.default };
    const av = makeChar({ ...base, ...look, scale: a.scale ?? 0.55 }); scene.add(av.root);
    av.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    AV[id] = { av, cfg: a };
  }
  const ids = Object.keys(AV);
  const hasFall = Object.values(R.tracks).some((tr) => tr.some((s) => s.mode === 'fall'));
  // lava splash (only built when some avatar falls)
  const splash = [];
  if (hasFall) for (let i = 0; i < 10; i++) { const m = sphere(scene, 0.32, new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffd23a' : '#ff7a1f' }), 0, LAVA_Y, 0, { cast: false }); m.visible = false; splash.push(m); }

  const cam = new THREE.PerspectiveCamera(58, GW / GH, 0.3, 400);

  // HUD
  const hudTex = canvasTex(GW, GH, () => {}); const hud = hudTex.userData.ctx;
  const hudScene = new THREE.Scene(), hudCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  hudScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: hudTex, transparent: true, depthTest: false })));

  const rt = new THREE.WebGLRenderTarget(GW, GH, { samples: 4, type: THREE.HalfFloatType });
  const confettiR = rng(5); const confetti = Array.from({ length: 120 }, () => ({ x: confettiR() * GW, y: -confettiR() * 400, vx: (confettiR() - 0.5) * 6, vy: 6 + confettiR() * 8, c: COLORS[Math.floor(confettiR() * COLORS.length)], r: confettiR() * 6, s: 8 + confettiR() * 10 }));

  const onPlat = (i) => platformPos(i).clone();
  // where an avatar is and how it stands, from its game state
  function avatarAt(st) {
    const m = st.mode, t = st.t;
    if (m === 'stand' || m === 'spawn') { const p = onPlat(st.at ?? 0); return { pos: p, base: p, pose: { al: [-8, 0, 8], ar: [-8, 0, 8] } }; }
    if (m === 'run' || m === 'jump' || m === 'lag' || m === 'win') {
      let from = st.from, to = st.to, dur = st.dur, tt = t;
      if (m === 'lag') { // frozen at lagAt with rubber-band stutter back
        tt = st.lagAt; const k = t % 9; if (k < 3 && t > 4) tt = Math.max(0, st.lagAt - (3 - k) * 1.5);
        if (st.slip && t > st.slip) tt = Math.max(0, st.lagAt - Math.min(12, (t - st.slip) * 1.5)); // slides back before rejoin
      }
      if (m === 'win') tt = Math.min(t, dur);
      const hops = to - from, hopDur = dur / hops; const k = clamp(Math.floor(tt / hopDur), 0, hops - 1);
      const u = clamp((tt - k * hopDur) / hopDur);
      const a = onPlat(from + k), b = onPlat(from + k + 1);
      const pos = a.clone().lerp(b, u); const H = (from + k + 1 === N) ? 4.2 : 2.2; pos.y += Math.sin(Math.PI * u) * H + (b.y - a.y) * 0;
      const base = a.clone().lerp(b, easeOut(u));
      const air = u > 0.02 && u < 0.98;
      const swing = Math.sin(tt * 0.9) * 40;
      const pose = air ? { al: [-150, 0, 20], ar: [-150, 0, 20], ll: -30, lr: 20, tx: 8 } : { al: [swing, 0, 6], ar: [-swing, 0, 6], ll: -swing * 0.6, lr: swing * 0.6 };
      if (m === 'win' && t >= dur) return { pos: onPlat(N), base: onPlat(N), pose: { al: [-170, 0, 30], ar: [-170, 0, 30] }, won: true };
      return { pos, base, pose, dir: Math.atan2(b.x - a.x, b.z - a.z) };
    }
    if (m === 'fall') { // a weak jump off platform `from` that drops into the lava
      const a = onPlat(st.from), b = onPlat(Math.min(N, st.from + 1));
      const d = b.clone().sub(a).setY(0).normalize();
      const pos = a.clone().addScaledVector(d, Math.min(t, 34) * 0.11); pos.y = a.y + 0.36 * t - 0.022 * t * t;
      const sunk = pos.y < LAVA_Y - 0.4;
      const fl = Math.sin(t * 1.1) * 50;
      const tHit = (0.36 + Math.sqrt(0.36 * 0.36 + 4 * 0.022 * (a.y - LAVA_Y))) / (2 * 0.022);
      return { pos, base: a, pose: { al: [-150 + fl, 0, 40], ar: [-150 - fl, 0, 40], ll: -20 + fl * 0.4, lr: 20 - fl * 0.4, tx: -10 }, dir: Math.atan2(d.x, d.z), hidden: sunk, splash: t >= tHit ? { at: pos.clone().setY(LAVA_Y), k: t - tHit } : null, face: 'shock' };
    }
    if (m === 'cheer') { const p = onPlat(st.at ?? N); const pos = p.clone(); pos.y += Math.abs(Math.sin(t * 0.35)) * 0.8; return { pos, base: p, pose: { al: [-170, 0, 30], ar: [-170, 0, 30] }, won: true, dir: Math.PI }; }
    if (m === 'hidden' || m === 'off') return { pos: onPlat(0), base: onPlat(0), pose: {}, hidden: true };
    return { pos: onPlat(0), base: onPlat(0), pose: {} };
  }
  // carry / follow depend on other avatars
  function placeAll(f) {
    const out = {};
    const state = (id, ff) => R.gameState(ff, id);
    const resolveOne = (id, depth = 0) => {
      if (out[id]) return out[id];
      const st = state(id, f);
      let a;
      if (st.mode === 'follow' && depth < 4) {
        const tst = state(st.target, f - st.delay);
        a = tst.mode === 'follow' || tst.mode === 'carry' ? resolveOne(st.target, depth + 1) : avatarAt(tst);
        a = { ...a, pos: a.pos.clone().add(new THREE.Vector3(st.offset[0], 0, st.offset[1])), base: a.base.clone().add(new THREE.Vector3(st.offset[0], 0, st.offset[1])), splash: null };
      } else if (st.mode === 'carry' && depth < 4) {
        const c = resolveOne(st.by, depth + 1);
        const back = new THREE.Vector3(Math.sin(c.dir ?? 0), 0, Math.cos(c.dir ?? 0)).multiplyScalar(-0.42);
        a = { pos: c.pos.clone().add(back).add(new THREE.Vector3(0, 0.98, 0)), base: c.base, dir: c.dir, pose: { tx: -6, hx: -16, al: [-170, 0, 34], ar: [-170, 0, 34], ll: -70, lr: -70, lz: 24 }, hidden: c.hidden, won: true };
      } else {
        a = avatarAt(st);
        if (st.offset) { const o = new THREE.Vector3(st.offset[0], 0, st.offset[1]); a = { ...a, pos: a.pos.clone().add(o), base: a.base.clone().add(o), splash: a.splash ? { ...a.splash, at: a.splash.at.clone().add(o) } : null }; }
      }
      out[id] = { ...a, st };
      return out[id];
    };
    for (const id of ids) resolveOne(id);
    return out;
  }

  function drawHUD(st, gf, extra) {
    const g = hud; g.clearRect(0, 0, GW, GH);
    g.textBaseline = 'middle'; g.lineJoin = 'round';
    const pill = (x, y, w, h, fill) => { g.fillStyle = fill; g.beginPath(); g.roundRect(x, y, w, h, h / 2); g.fill(); };
    const text = (s, x, y, size, color = '#fff', align = 'left', stroke = 0) => { g.font = `700 ${size}px Fredoka`; g.textAlign = align; if (stroke) { g.lineWidth = stroke; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.strokeText(s, x, y); } g.fillStyle = color; g.fillText(s, x, y); };
    if (st.mode === 'off') { g.fillStyle = '#000'; g.fillRect(0, 0, GW, GH); hudTex.needsUpdate = true; return; }
    // name tags over avatars (drawn first so the HUD sits on top)
    for (const tg of extra.tags) {
      g.font = '700 26px Fredoka'; const w = g.measureText(tg.text).width + 28;
      pill(tg.x - w / 2, tg.y - 20, w, 40, 'rgba(15,20,45,0.6)'); text(tg.text, tg.x, tg.y + 1, 26, tg.color || '#fff', 'center');
    }
    // stage counter
    pill(28, 26, 300, 68, 'rgba(15,20,45,0.72)'); text(`STAGE ${st.stage ?? STAGES - 1}/${STAGES}`, 178, 62, 42, '#ffd23a', 'center');
    // timer (hours of effort)
    const T0 = GAME.timer ?? [3, 12, 40];
    const secs = T0[0] * 3600 + T0[1] * 60 + T0[2] + Math.floor(gf / 30); const hh = Math.floor(secs / 3600), mm = Math.floor(secs / 60) % 60, ss = secs % 60;
    pill(28, GH - 92, 260, 64, 'rgba(15,20,45,0.72)'); text(`⏱ ${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, 158, GH - 59, 38, '#fff', 'center');
    // ping
    const ping = st.ping ?? 24; const bad = ping > 150;
    const shake = bad ? Math.sin(gf * 2.3) * 4 : 0;
    const pw = bad ? 330 : 250; const px = GW - pw - 28 + shake;
    pill(px, 26, pw, 68, bad ? 'rgba(220,20,40,0.92)' : 'rgba(15,20,45,0.72)');
    const bars = ping < 80 ? 4 : ping < 300 ? 2 : ping < 900 ? 1 : 0;
    for (let i = 0; i < 4; i++) { g.fillStyle = i < bars ? (bad ? '#fff' : '#3ef06a') : 'rgba(255,255,255,0.25)'; g.fillRect(px + 30 + i * 16, 74 - (i + 1) * 10, 11, (i + 1) * 10); }
    text(`${ping >= 9999 ? '9999+' : ping} ms`, px + pw - 30, 62, bad ? 48 : 42, bad ? '#fff' : '#3ef06a', 'right');
    if (bad) { text('⚠ HIGH PING', GW - 28 - 165 + shake, 122, 30, '#ff4d5e', 'center', 6); }
    // chat (server messages), bottom-left above the timer
    if (extra.chat.length) {
      const lh = 40, h = extra.chat.length * lh + 20, y0 = GH - 110 - h;
      g.fillStyle = 'rgba(15,20,45,0.55)'; g.beginPath(); g.roundRect(28, y0, 560, h, 18); g.fill();
      extra.chat.forEach((c, i) => {
        const y = y0 + 10 + lh * i + lh / 2; g.font = '700 28px Fredoka'; g.textAlign = 'left';
        const nm = `${c.name}:`; g.fillStyle = c.color || '#ffd23a'; g.fillText(nm, 46, y);
        const w = g.measureText(nm).width; g.fillStyle = '#fff'; g.fillText(c.text, 46 + w + 10, y);
      });
    }
    // lag spinner
    if (st.mode === 'lag' && st.t > (st.spinAt ?? 8)) {
      g.save(); g.translate(GW / 2, GH / 2 - 10); g.fillStyle = 'rgba(10,12,30,0.55)'; g.beginPath(); g.arc(0, 0, 84, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + Math.floor(gf / 2) * (Math.PI / 6); g.fillStyle = `rgba(255,255,255,${0.15 + 0.85 * (i / 12)})`; g.save(); g.rotate(a); g.beginPath(); g.roundRect(-7, -66, 14, 30, 7); g.fill(); g.restore(); }
      g.restore();
      text('Waiting for server...', GW / 2, GH / 2 + 110, 36, '#fff', 'center', 8);
    }
    if (st.mode === 'rejoin') {
      g.fillStyle = 'rgba(12,16,46,0.93)'; g.fillRect(0, 0, GW, GH);
      text('CONNECTION LOST', GW / 2, GH / 2 - 150, 78, '#ff4d5e', 'center');
      g.save(); g.translate(GW / 2, GH / 2 + 10);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + Math.floor(gf / 2) * (Math.PI / 6); g.fillStyle = `rgba(255,255,255,${0.15 + 0.85 * (i / 12)})`; g.save(); g.rotate(a); g.beginPath(); g.roundRect(-7, -60, 14, 28, 7); g.fill(); g.restore(); }
      g.restore();
      text('Rejoining' + '.'.repeat(1 + Math.floor(gf / 6) % 3), GW / 2 - 110, GH / 2 + 140, 50, '#fff', 'left');
      const prog = clamp(st.t / (st.dur || 30)); pill(GW / 2 - 260, GH / 2 + 196, 520, 26, 'rgba(255,255,255,0.18)'); pill(GW / 2 - 260, GH / 2 + 196, Math.max(26, 520 * prog), 26, '#3ef06a');
    }
    if (st.mode === 'spawn' && st.t < 40 && !st.quiet) {
      const s = 1 + 0.25 * (1 - easeOut(st.t / 6));
      g.save(); g.translate(GW / 2, GH / 2 - 120); g.scale(s, s); pill(-330, -60, 660, 120, '#ff3b6b'); text('BACK TO START', 0, 4, 70, '#fff', 'center'); g.restore();
    }
    if (st.mode === 'win' && st.t >= st.dur) {
      const k = st.t - st.dur, s = 1 + 0.3 * (1 - easeOut(k / 6));
      for (const c of confetti) { const y = c.y + c.vy * k, x = c.x + c.vx * k; if (y < GH + 20) { g.save(); g.translate(x, y % (GH + 400)); g.rotate(c.r + k * 0.2); g.fillStyle = c.c; g.fillRect(-c.s / 2, -c.s / 4, c.s, c.s / 2); g.restore(); } }
      g.save(); g.translate(GW / 2, GH / 2 - 110); g.scale(s, s);
      pill(-360, -78, 720, 156, '#ffd23a'); g.lineWidth = 8; g.strokeStyle = '#fff'; g.beginPath(); g.roundRect(-360, -78, 720, 156, 78); g.stroke();
      text('YOU WIN!', 0, 6, 110, '#ff3b6b', 'center'); g.restore();
      text(`${STAGES}/${STAGES} COMPLETE`, GW / 2, GH / 2 + 30, 46, '#fff', 'center', 10);
    }
    // banner (pill) or card, from the shot list
    const b = extra.banner;
    if (b) {
      const k = gf - b.f, s = 1 + 0.25 * (1 - easeOut(k / 6));
      if (b.confetti) for (const c of confetti) { const y = c.y + c.vy * k, x = c.x + c.vx * k; if (y < GH + 20) { g.save(); g.translate(x, y % (GH + 400)); g.rotate(c.r + k * 0.2); g.fillStyle = c.c; g.fillRect(-c.s / 2, -c.s / 4, c.s, c.s / 2); g.restore(); } }
      g.save(); g.translate(GW / 2, b.y ?? (GH / 2 - 120)); g.scale(s, s);
      if (b.style === 'card') {
        const lines = b.lines || []; const h = 130 + lines.length * 52;
        g.fillStyle = 'rgba(15,20,45,0.92)'; g.beginPath(); g.roundRect(-380, -h / 2, 760, h, 34); g.fill();
        g.lineWidth = 8; g.strokeStyle = b.color || '#ffd23a'; g.beginPath(); g.roundRect(-380, -h / 2, 760, h, 34); g.stroke();
        text(b.text, 0, -h / 2 + 62, 62, b.color || '#ffd23a', 'center');
        lines.forEach((ln, i) => text(ln, 0, -h / 2 + 128 + i * 52, 38, '#fff', 'center'));
      } else {
        g.font = '700 70px Fredoka'; const w = Math.max(560, g.measureText(b.text).width + 110);
        pill(-w / 2, -60, w, 120, b.color || '#ff3b6b'); text(b.text, 0, 4, 70, b.textColor || '#fff', 'center');
        if (b.sub) text(b.sub, 0, 100, 44, '#fff', 'center', 10);
      }
      g.restore();
    }
    hudTex.needsUpdate = true;
  }

  const tmpV = new THREE.Vector3();
  let lastKey = '';
  // focus: the avatar the HUD and camera follow; view: 'follow' | 'wide'
  function render(gf, focus = 'me', view = 'follow') {
    const placed = placeAll(gf);
    const F = placed[focus] || placed[ids[0]];
    const st = F.st;
    const chat = R.chatAt(gf).filter((c) => !c.only || c.only === focus);
    let banner = R.bannerAt(gf); if (banner && banner.only && banner.only !== focus) banner = null;
    const anim = Object.values(placed).some((p) => ['lag', 'rejoin', 'win', 'run', 'jump', 'fall', 'cheer', 'carry', 'follow'].includes(p.st.mode));
    const key = JSON.stringify(ids.length === 1 ? st : Object.fromEntries(ids.map((id) => [id, placed[id].st]))) + focus + view + (anim ? gf : '') + Math.floor(gf / 30) + chat.length + (banner ? `b${banner.f}:${gf}` : '');
    if (key === lastKey) return rt.texture; lastKey = key;
    for (const id of ids) {
      const { av, cfg } = AV[id]; const a = placed[id];
      av.root.visible = !a.hidden;
      if (a.hidden) continue;
      av.root.position.copy(a.pos); av.root.rotation.y = a.dir ?? 0;
      applyPose(av, { ...a.pose, x: a.pos.x, y: a.pos.y, z: a.pos.z, ry: (a.dir ?? 0) / D2R });
      av.setFace(a.st.face || a.face || (a.st.mode === 'lag' ? 'shock' : a.won ? 'joy' : 'smile'));
    }
    // lava splash
    splash.forEach((m) => { m.visible = false; });
    const sp = Object.values(placed).find((p) => p.splash && p.splash.k < 16);
    if (sp) splash.forEach((m, i) => { const k = sp.splash.k, a = i / splash.length * Math.PI * 2; m.visible = true; m.position.set(sp.splash.at.x + Math.cos(a) * k * 0.18, LAVA_Y + 0.9 * k - 0.07 * k * k, sp.splash.at.z + Math.sin(a) * k * 0.18); m.scale.setScalar(Math.max(0.05, 1 - k / 16)); });
    const live = st.mode !== 'lag';
    const tt = live ? gf : (st.lagFrame ?? gf);
    for (const s of spinners) s.rotation.y = tt * 0.06;
    lavaTex.offset.set(tt * 0.0008, tt * 0.0011);
    const base = F.base;
    const lift = Math.max(0, F.pos.y - base.y) * 0.85;
    if (view === 'wide') { cam.position.set(base.x * 0.7 + 4.5, base.y + 5.2, base.z - 8.2); cam.lookAt(base.x * 0.85, base.y + 1.0, base.z + 2.5); }
    else { cam.position.set(base.x * 0.7, base.y + 3.7 + lift, base.z - 7.4); cam.lookAt(base.x * 0.85, base.y + 0.9 + lift * 0.6, base.z + 6); }
    sun.position.set(base.x - 20, 30, base.z - 10); sun.target.position.set(base.x, base.y, base.z + 5);
    // name tags (projected above each tagged avatar's head)
    const tags = [];
    for (const id of ids) {
      const { av, cfg } = AV[id];
      if (!cfg.tag || placed[id].hidden) continue;
      cam.updateMatrixWorld(); av.root.updateMatrixWorld(true);
      av.head.getWorldPosition(tmpV); tmpV.y += 1.5; tmpV.project(cam);
      if (tmpV.z < 1 && Math.abs(tmpV.x) < 1.1 && Math.abs(tmpV.y) < 1.1) tags.push({ text: cfg.tag, color: cfg.tagColor, x: (tmpV.x + 1) / 2 * GW, y: (1 - tmpV.y) / 2 * GH });
    }
    drawHUD(st, gf, { chat, banner, tags });
    const prevT = renderer.getRenderTarget(), prevAC = renderer.autoClear;
    renderer.setRenderTarget(rt); renderer.autoClear = true; renderer.render(scene, cam);
    renderer.autoClear = false; renderer.render(hudScene, hudCam);
    renderer.setRenderTarget(prevT); renderer.autoClear = prevAC;
    return rt.texture;
  }
  return { render, texture: rt.texture, rt };
}
