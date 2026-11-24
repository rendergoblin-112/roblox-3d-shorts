// Interior sets (style A is interiors; warm palette + cyan accent; matte plastic) and one exterior for the power-out.
// Each set returns: scene, L (hemi + key light), walls, objects (hideable by camera), screens, power(on), update(shot, t, f, ctx).
// Characters are added by the engine (engine/main.js), not here. Set-specific shot fields:
//   room:   slam (frame the desk jumps), chairBack (frame the chair rolls back), chairOut (chair pushed away all shot)
//   living: tvOff (frame the TV switches off), lidClose (frame the laptop lid shuts)
//   hall:   router: 'busy' | 'red'
//   any:    screens: { monitor | tv | laptop: 'game' | 'match' | 'call' | 'off' }
import * as THREE from 'three';
import { box, cyl, sphere, plane, mat, glow, canvasTex, planks, rng, D2R, clamp, easeOut } from './util.js';

// ---------- shared builders ----------
function lights(scene, o = {}) {
  const hemi = new THREE.HemisphereLight(o.sky ?? '#dfe8ff', o.ground ?? '#6b5a4a', o.hemi ?? 1.1); scene.add(hemi);
  const key = new THREE.DirectionalLight(o.keyColor ?? '#fff1de', o.key ?? 2.2); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 5; key.shadow.blurSamples = 16; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03;
  Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 90 });
  scene.add(key); scene.add(key.target);
  return { hemi, key };
}
function wallPanel(parent, w, h, upper, lower, o = {}) { // a wall with wainscot + white rail, facing +z in local space
  const g = new THREE.Group(); parent.add(g);
  const lowH = o.lowH ?? 2.4;
  const holes = o.holes || [];
  const seg = (x0, x1, y0, y1, color) => { if (x1 - x0 > 0.01 && y1 - y0 > 0.01) box(g, x1 - x0, y1 - y0, 0.3, color, (x0 + x1) / 2, (y0 + y1) / 2, -0.15, { r: 0, cast: false }); };
  const band = (y0, y1, color) => {
    let x = -w / 2; const hs = holes.filter((hl) => hl.y0 < y1 && hl.y1 > y0).sort((a, b) => a.x0 - b.x0);
    for (const hl of hs) { seg(x, hl.x0, y0, y1, color); seg(hl.x0, hl.x1, y0, Math.max(y0, hl.y0), color); seg(hl.x0, hl.x1, Math.min(y1, hl.y1), y1, color); x = hl.x1; }
    seg(x, w / 2, y0, y1, color);
  };
  band(0, lowH, lower); band(lowH, h, upper);
  box(g, w, 0.18, 0.12, '#ffffff', 0, lowH, 0.06, { r: 0.03, cast: false });
  box(g, w, 0.4, 0.1, '#ffffff', 0, 0.2, 0.05, { r: 0.03, cast: false });
  return g;
}
function ceiling(scene, w, d, h = 9, color = '#fff6ea') {
  const c = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
  c.rotation.x = Math.PI / 2; c.position.y = h; c.castShadow = false; c.receiveShadow = false; scene.add(c); return c;
}
function floor(scene, w, d, tex, color = '#ffffff') {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, color, roughness: 0.62 }));
  f.rotation.x = -Math.PI / 2; f.receiveShadow = true; scene.add(f); return f;
}
function rug(scene, r, c1, c2, x, z) {
  const t = canvasTex(256, 256, (g, w, h) => { const cs = [c1, c2]; for (let i = 0; i < 5; i++) { g.fillStyle = cs[i % 2]; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - i * 24, 0, Math.PI * 2); g.fill(); } });
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, z); m.receiveShadow = true; scene.add(m); return m;
}
function poster(parent, w, h, draw, x, y, z, ry = 0) {
  const t = canvasTex(Math.round(w * 128), Math.round(h * 128), draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 })); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; parent.add(m);
  box(parent, w + 0.12, h + 0.12, 0.06, '#ffffff', x - Math.sin(ry) * 0.03, y, z - Math.cos(ry) * 0.03, { ry, r: 0.02, cast: false });
  return m;
}
function nightSky(w = 1024, h = 512, o = {}) {
  return canvasTex(w, h, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1a4a'); gr.addColorStop(0.6, '#1f3f8f'); gr.addColorStop(1, o.horizon ?? '#5a6fc0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const R = rng(4); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + R() * 0.6})`; g.beginPath(); g.arc(R() * w, R() * h * 0.7, R() * 1.8 + 0.4, 0, Math.PI * 2); g.fill(); }
    if (o.moon) { g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(o.moon[0] * w, o.moon[1] * h, o.moonR ?? 34, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,246,216,0.15)'; g.beginPath(); g.arc(o.moon[0] * w, o.moon[1] * h, (o.moonR ?? 34) * 2.2, 0, Math.PI * 2); g.fill(); }
    if (o.houses) { // far neighbour houses with lit windows
      for (let i = 0; i < 6; i++) { const x = i * w / 5 - 40 + R() * 40, hw = 120 + R() * 60, hh = 90 + R() * 60, y = h - hh;
        g.fillStyle = '#16204a'; g.fillRect(x, y, hw, hh); g.beginPath(); g.moveTo(x - 10, y); g.lineTo(x + hw / 2, y - 50); g.lineTo(x + hw + 10, y); g.fill();
        for (let k = 0; k < 4; k++) if (R() > 0.35) { g.fillStyle = '#ffd36b'; g.fillRect(x + 14 + (k % 2) * (hw - 50), y + 16 + Math.floor(k / 2) * 40, 22, 24); } }
    }
  });
}
function screenTex(w, h, draw) { const t = canvasTex(w, h, draw); return t; }
function screenMat(tex, k = 1.15) { return new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(k, k, k), toneMapped: false }); }

// ---------- KID'S BEDROOM ----------
export function makeRoom(env) {
  const scene = new THREE.Scene(); scene.environment = env; scene.environmentIntensity = 0.45;
  scene.background = new THREE.Color('#000');
  const L = lights(scene, { hemi: 1.15, key: 2.3 });
  floor(scene, 18, 16, planks('#d0915a', 3)); ceiling(scene, 18, 16);
  const walls = {};
  const UP = '#3cb6ee', LOW = '#1d78c8';
  walls.back = wallPanel(scene, 18, 9, UP, LOW, { holes: [{ x0: 0.2, x1: 4.6, y0: 3.0, y1: 6.8 }] }); walls.back.position.set(0, 0, -7);
  walls.left = wallPanel(scene, 16, 9, UP, LOW, { holes: [{ x0: 1.4, x1: 4.0, y0: 0, y1: 5.6 }] }); walls.left.position.set(-8, 0, 0); walls.left.rotation.y = Math.PI / 2;
  walls.right = wallPanel(scene, 16, 9, UP, LOW); walls.right.position.set(8, 0, 0); walls.right.rotation.y = -Math.PI / 2;
  walls.front = wallPanel(scene, 18, 9, UP, LOW); walls.front.position.set(0, 0, 7); walls.front.rotation.y = Math.PI;
  // window (back wall) with night sky + neighbour houses beyond
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshBasicMaterial({ map: nightSky(1024, 600, { moon: [0.42, 0.28], houses: true }), toneMapped: false })); sky.position.set(2.4, 5, -9.5); scene.add(sky);
  const wf = '#ffffff';
  box(scene, 4.6, 0.25, 0.5, wf, 2.4, 2.92, -6.85); box(scene, 4.6, 0.2, 0.3, wf, 2.4, 6.85, -6.95); box(scene, 0.2, 3.9, 0.3, wf, 0.15, 4.9, -6.95); box(scene, 0.2, 3.9, 0.3, wf, 4.65, 4.9, -6.95);
  box(scene, 0.12, 3.8, 0.12, wf, 2.4, 4.9, -6.95); box(scene, 4.4, 0.12, 0.12, wf, 2.4, 4.9, -6.95);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.8), new THREE.MeshStandardMaterial({ color: '#9fd0ff', transparent: true, opacity: 0.08, roughness: 0.05 })); glass.position.set(2.4, 4.9, -6.98); scene.add(glass);
  for (const [x, s] of [[-0.25, 1], [5.05, -1]]) { const c = box(scene, 0.9, 4.6, 0.25, mat('#ff8a1f', { rough: 0.85 }), x, 4.6, -6.7, { r: 0.12 }); }
  box(scene, 5.8, 0.18, 0.18, '#7a4a26', 2.4, 7.0, -6.7, { r: 0.08 });
  // desk against right wall
  const DESK = '#f7f3ea', DRAW = '#ff7a1f';
  box(scene, 3.2, 0.22, 6.6, DESK, 6.4, 2.2, 0, { r: 0.06 });
  box(scene, 2.9, 2.1, 1.6, DRAW, 6.5, 1.05, -2.4, { r: 0.08 }); box(scene, 2.9, 2.1, 0.25, DESK, 6.5, 1.05, 3.1, { r: 0.05 });
  for (const y of [0.55, 1.5]) { box(scene, 0.06, 0.7, 1.3, '#e5600c', 5.03, y, -2.4, { r: 0.03 }); box(scene, 0.12, 0.1, 0.5, '#ffffff', 4.97, y + 0.15, -2.4, { r: 0.03 }); }
  // monitor (faces -x)
  const mon = new THREE.Group(); mon.position.set(7.0, 2.31, 0); mon.rotation.y = -Math.PI / 2; scene.add(mon);
  box(mon, 1.4, 0.1, 0.9, '#222', 0, 0.05, 0, { r: 0.05 }); box(mon, 0.3, 0.9, 0.2, '#222', 0, 0.5, 0.15, { r: 0.05 });
  const SW = 3.6, SH = SW * 9 / 16;
  box(mon, SW + 0.24, SH + 0.24, 0.18, '#151515', 0, 0.85 + SH / 2, 0.2, { r: 0.06 });
  const screenM = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), screenM); screen.position.set(0, 0.85 + SH / 2, 0.30); mon.add(screen);
  sphere(mon, 0.035, glow('#3ef06a', 2), SW / 2 - 0.1, 0.78, 0.3, { cast: false });
  // keyboard + mouse + pad
  const kbTex = canvasTex(512, 160, (g, w, h) => { g.fillStyle = '#1a1a22'; g.fillRect(0, 0, w, h); const cs = ['#ff3b6b', '#ffcc22', '#2fd36b', '#2f9bff', '#a45cff']; for (let r = 0; r < 4; r++) for (let c = 0; c < 15; c++) { g.fillStyle = cs[Math.floor((c + r) / 3) % 5]; g.globalAlpha = 0.85; g.beginPath(); g.roundRect(8 + c * 33, 10 + r * 36, 28, 30, 5); g.fill(); } g.globalAlpha = 1; g.fillStyle = '#dddddd'; g.beginPath(); g.roundRect(120, 10 + 4 * 36 - 2, 260, 10, 4); g.fill(); });
  const kb = new THREE.Group(); kb.position.set(5.65, 2.31, 0.15); scene.add(kb);
  box(kb, 0.95, 0.12, 2.5, '#202028', 0, 0.06, 0, { r: 0.04 });
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.85), new THREE.MeshBasicMaterial({ map: kbTex, toneMapped: false, color: new THREE.Color(0.9, 0.9, 0.9) })); keys.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); keys.position.y = 0.125; kb.add(keys);
  box(scene, 1.3, 0.03, 1.5, '#2a2a3a', 5.75, 2.32, -1.95, { r: 0.02 });
  const mouse = box(scene, 0.42, 0.18, 0.3, '#202028', 5.7, 2.42, -1.95, { r: 0.08 });
  sphere(scene, 0.04, glow('#ff3bd0', 3), 5.55, 2.52, -1.95, { cast: false });
  // PC tower with RGB fans (on desk, right side)
  const pc = new THREE.Group(); pc.position.set(6.9, 2.31, 2.55); scene.add(pc);
  box(pc, 2.0, 2.3, 1.0, '#18181f', 0, 1.15, 0, { r: 0.06 });
  const rgb = []; for (const [y, c] of [[1.65, '#22e6ff'], [0.75, '#ff3bd0']]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 32), glow(c, 2.2)); ring.position.set(-1.01, y, 0); ring.rotation.y = Math.PI / 2; pc.add(ring); rgb.push(ring); }
  const strip = box(pc, 0.02, 2.0, 0.06, glow('#7a5cff', 2.2), -1.01, 1.15, 0.45, { r: 0, cast: false }); rgb.push(strip);
  // desk lamp
  const lamp = new THREE.Group(); lamp.position.set(7.4, 2.31, -2.8); scene.add(lamp);
  cyl(lamp, 0.35, 0.4, 0.12, '#ffffff', 0, 0.06, 0); const arm = box(lamp, 0.1, 1.8, 0.1, '#ffffff', -0.3, 0.95, 0, { rz: 0.35 });
  const shade = cyl(lamp, 0.18, 0.45, 0.5, '#ff7a1f', -0.75, 1.9, 0.0, { rz: 0.5 }); const bulb = sphere(lamp, 0.16, glow('#fff0c8', 2.4), -0.85, 1.72, 0.0, { cast: false });
  const lampLight = new THREE.PointLight('#ffc27a', 9, 10, 1.6); lampLight.position.set(6.4, 3.8, -2.6); scene.add(lampLight);
  // desk clutter
  cyl(scene, 0.17, 0.17, 0.55, '#22d36b', 5.6, 2.59, 2.0); cyl(scene, 0.172, 0.172, 0.2, '#111', 5.6, 2.62, 2.0);
  box(scene, 0.5, 0.65, 0.18, '#ffcc22', 5.45, 2.65, -3.0, { r: 0.08, ry: 0.4 });
  box(scene, 0.2, 0.32, 0.2, '#ff3b6b', 7.6, 2.48, 1.2, { r: 0.06 }); sphere(scene, 0.17, '#ff3b6b', 7.6, 2.8, 1.2); // little figure
  // gaming chair
  const chair = new THREE.Group(); chair.position.set(3.85, 0, 0.1); scene.add(chair);
  cyl(chair, 0.12, 0.12, 1.0, '#333', 0, 0.6, 0); for (let i = 0; i < 5; i++) { const l = box(chair, 1.0, 0.12, 0.16, '#333', Math.cos(i * 1.256) * 0.5, 0.12, Math.sin(i * 1.256) * 0.5, { ry: -i * 1.256 }); }
  box(chair, 1.7, 0.32, 1.7, '#e3262f', 0, 1.25, 0, { r: 0.12 });
  const back = box(chair, 0.38, 2.6, 1.6, '#e3262f', -0.85, 2.55, 0, { r: 0.14, rz: -0.08 }); box(chair, 0.4, 1.6, 0.5, '#1a1a1a', -0.86, 2.55, 0, { r: 0.1, rz: -0.08 });
  box(chair, 0.42, 0.5, 1.2, '#1a1a1a', -0.92, 3.95, 0, { r: 0.15, rz: -0.08 });
  for (const z of [-0.95, 0.95]) box(chair, 1.0, 0.14, 0.2, '#1a1a1a', -0.1, 1.95, z, { r: 0.05 });
  // bed (back-left)
  const bed = new THREE.Group(); bed.position.set(-5.2, 0, -4.6); scene.add(bed);
  box(bed, 5.4, 1.0, 4.4, '#8a5a34', 0, 0.5, 0, { r: 0.1 }); box(bed, 5.2, 0.6, 4.2, '#ffffff', 0, 1.3, 0, { r: 0.2 });
  box(bed, 3.6, 0.35, 4.3, '#ff7a1f', 0.9, 1.65, 0, { r: 0.16 }); box(bed, 1.3, 0.45, 2.2, '#fff8e8', -1.8, 1.82, 0, { r: 0.2 });
  box(bed, 0.4, 2.6, 4.4, '#8a5a34', -2.8, 1.3, 0, { r: 0.1 });
  // shelf + toys on left wall, posters
  box(scene, 0.8, 0.14, 3.4, '#ffffff', -7.55, 5.0, 4.8, { r: 0.04 });
  sphere(scene, 0.3, '#ffcc22', -7.5, 5.37, 3.7); box(scene, 0.5, 0.7, 0.5, '#2fd36b', -7.5, 5.42, 4.6, { r: 0.12 }); box(scene, 0.4, 0.4, 0.9, '#a45cff', -7.5, 5.27, 5.6, { r: 0.1 });
  poster(scene, 2.2, 2.9, (g, w, h) => { // our game's poster: LAVA LEAP
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3c8dff'); gr.addColorStop(0.7, '#ffb36b'); gr.addColorStop(1, '#ff3d00'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const cs = ['#ff3b6b', '#ffcc22', '#2fd36b', '#a45cff']; for (let i = 0; i < 4; i++) { g.fillStyle = cs[i]; g.fillRect(30 + i * 60, h - 120 - i * 50, 50, 22); }
    g.fillStyle = '#fff'; g.font = '700 54px Fredoka'; g.textAlign = 'center'; g.fillText('LAVA', w / 2, 70); g.fillText('LEAP', w / 2, 124);
  }, -2.0, 5.2, -6.84);
  poster(scene, 2.0, 2.0, (g, w, h) => { g.fillStyle = '#ffcc22'; g.fillRect(0, 0, w, h); g.fillStyle = '#2fd36b'; g.beginPath(); g.roundRect(50, 70, 150, 120, 30); g.fill(); g.beginPath(); g.roundRect(150, 40, 70, 70, 20); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(195, 66, 8, 0, 7); g.fill(); g.fillRect(60, 180, 26, 50); g.fillRect(150, 180, 26, 50); }, -4.8, 5.4, -6.84);
  poster(scene, 2.2, 1.6, (g, w, h) => { g.fillStyle = '#1d2a6b'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff7a1f'; g.beginPath(); g.moveTo(w * 0.3, h * 0.8); g.lineTo(w * 0.5, h * 0.15); g.lineTo(w * 0.7, h * 0.8); g.fill(); g.fillStyle = '#ffcc22'; g.beginPath(); g.arc(w * 0.5, h * 0.88, 18, 0, 7); g.fill(); for (let i = 0; i < 30; i++) { g.fillStyle = '#fff'; g.fillRect((i * 53) % w, (i * 31) % h, 3, 3); } }, -7.84, 5.2, -1.5, Math.PI / 2);
  // door (left wall)
  box(scene, 0.2, 5.5, 2.6, '#ffffff', -7.95, 2.75, 2.7, { r: 0.04 }); box(scene, 0.12, 5.3, 2.4, '#c9783e', -7.88, 2.65, 2.7, { r: 0.04 }); sphere(scene, 0.1, '#ffd23a', -7.75, 2.6, 1.8);
  rug(scene, 3.2, '#ffcc22', '#22c3d6', 0.0, 1.2);
  sphere(scene, 0.45, '#ffffff', -2.4, 0.45, 4.5); // soccer ball-ish
  box(scene, 0.8, 0.35, 1.3, '#ff3b6b', -1.0, 0.18, 4.0, { r: 0.12, ry: 0.5 }); // sneaker
  // ceiling light (fill)
  const ceil = new THREE.PointLight('#fff3e2', 30, 26, 1.2); ceil.position.set(0, 8.4, 1); scene.add(ceil);
  const monGlow = new THREE.PointLight('#bfe4ff', 5, 8, 1.6); monGlow.position.set(6.1, 3.6, 0); scene.add(monGlow);

  const state = { power: true };
  return {
    name: 'room', scene, L, walls, chars: {}, mon, keys, screenM, screen, kb, mouse, chair, rgb, lampLight, bulb, ceil, monGlow, sky,
    objects: { monitor: mon, chair },
    update(sh, t, f, ctx) {
      const feed = ctx.feed('monitor', 'game');
      const tex = feed === 'game' ? ctx.gameTex('monitor') : null;
      if (!tex) { screenM.map = null; screenM.color.set('#030304'); }
      else { screenM.map = tex; screenM.color.setScalar(1.15); }
      screenM.needsUpdate = true;
      monGlow.intensity = 5;
      // keyboard + mouse jump when the desk is slammed
      kb.position.y = 2.31; mouse.position.y = 2.42;
      if (sh.slam != null) { const u = t - sh.slam; if (u >= 0 && u < 8) { const h = Math.max(0, Math.sin((u / 8) * Math.PI)) * 0.35; kb.position.y += h; mouse.position.y += h * 1.3; } }
      // chair rolls back when he stands
      let cx = 3.85; if (sh.chairBack != null) cx = 3.85 - 1.3 * easeOut((t - sh.chairBack) / 6) * (t >= sh.chairBack ? 1 : 0);
      if (sh.chairOut) cx = 2.55; chair.position.x = cx;
    },
    power(on) {
      if (state.power === on) return; state.power = on;
      lampLight.visible = ceil.visible = monGlow.visible = on; bulb.material.color.set(on ? new THREE.Color('#fff0c8').multiplyScalar(2.4) : '#222');
      for (const r of rgb) r.visible = on; keys.material.color.setScalar(on ? 0.9 : 0.06);
      L.hemi.intensity = on ? 1.15 : 0.8; L.hemi.color.set(on ? '#dfe8ff' : '#5a78e0'); L.hemi.groundColor.set(on ? '#6b5a4a' : '#141c3a');
      scene.environmentIntensity = on ? 0.45 : 0.06;
    },
  };
}

// ---------- SISTER'S ROOM ----------
export function makeSis(env) {
  const scene = new THREE.Scene(); scene.environment = env; scene.environmentIntensity = 0.45;
  const L = lights(scene, { hemi: 1.15, key: 2.2 });
  floor(scene, 18, 16, canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#9a6ae6'; g.fillRect(0, 0, w, h); const R = rng(9); for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(${R() < 0.5 ? '255,255,255' : '60,20,120'},0.08)`; g.fillRect(R() * w, R() * h, 2, 2); } }, { repeat: [4, 4] }));
  const walls = {}; const UP = '#ff9ccc', LOW = '#ff5fa8';
  walls.back = wallPanel(scene, 18, 9, UP, LOW); walls.back.position.set(0, 0, -7);
  walls.left = wallPanel(scene, 16, 9, UP, LOW); walls.left.position.set(-8, 0, 0); walls.left.rotation.y = Math.PI / 2;
  walls.right = wallPanel(scene, 16, 9, UP, LOW); walls.right.position.set(8, 0, 0); walls.right.rotation.y = -Math.PI / 2;
  // bed with lilac blanket, heart pillow
  const bed = new THREE.Group(); bed.position.set(-4.4, 0, -4.4); scene.add(bed);
  box(bed, 5.4, 1.0, 4.6, '#ffffff', 0, 0.5, 0, { r: 0.1 }); box(bed, 5.2, 0.6, 4.4, '#ffffff', 0, 1.3, 0, { r: 0.2 }); box(bed, 3.4, 0.36, 4.5, '#b48cff', 0.9, 1.66, 0, { r: 0.16 });
  box(bed, 1.3, 0.5, 2.0, '#ffe25a', -1.7, 1.85, 0, { r: 0.22 }); box(bed, 0.4, 3.0, 4.6, '#ffffff', -2.8, 1.5, 0, { r: 0.12 });
  // fairy lights along back wall
  const fairy = [];
  for (let i = 0; i < 22; i++) { const x = -7.5 + i * 0.7, y = 7.4 - Math.sin(i * 0.9) * 0.25 - Math.abs(Math.sin(i * 0.45)) * 0.5; fairy.push(sphere(scene, 0.09, glow(['#ffd36b', '#ff7ad0', '#7ad8ff'][i % 3], 2.6), x, y, -6.8, { cast: false })); }
  // posters, mirror, desk with laptop
  poster(scene, 2.2, 2.8, (g, w, h) => { g.fillStyle = '#7a4fe0'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23a'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w / 2, h / 2, 110 - i * 20, 0, 7); g.globalAlpha = 0.25 + i * 0.15; g.fill(); } g.globalAlpha = 1; g.fillStyle = '#fff'; g.font = '700 46px Fredoka'; g.textAlign = 'center'; g.fillText('STAR', w / 2, h - 40); }, 1.0, 5.2, -6.84);
  poster(scene, 1.8, 1.8, (g, w, h) => { g.fillStyle = '#22d6d0'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff4f9a'; g.beginPath(); g.moveTo(w / 2, h * 0.8); g.bezierCurveTo(-20, h * 0.4, w * 0.3, -10, w / 2, h * 0.3); g.bezierCurveTo(w * 0.7, -10, w + 20, h * 0.4, w / 2, h * 0.8); g.fill(); }, 3.8, 5.6, -6.84);
  box(scene, 4.0, 0.2, 2.0, '#ffffff', 5.6, 2.3, -5.9, { r: 0.05 }); box(scene, 0.2, 2.2, 1.8, '#ffffff', 3.8, 1.15, -5.9); box(scene, 0.2, 2.2, 1.8, '#ffffff', 7.4, 1.15, -5.9);
  box(scene, 0.6, 0.9, 0.6, '#22d6d0', 6.8, 2.85, -6.1, { r: 0.2 }); sphere(scene, 0.45, '#2fd36b', 6.8, 3.6, -6.1);
  rug(scene, 2.8, '#ffffff', '#ff8fc8', 1.0, 0.8);
  // ring light + phone on tripod (faces +x toward sis... placed at x=4, facing -x)
  const rig = new THREE.Group(); rig.position.set(3.6, 0, 1.4); rig.rotation.y = -Math.PI / 2 - 0.35; scene.add(rig);
  cyl(rig, 0.55, 0.65, 0.16, '#2a2a30', 0, 0.08, 0); cyl(rig, 0.07, 0.07, 3.5, '#2a2a30', 0, 1.8, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.13, 16, 64), glow('#fff8f0', 2.4)); ring.position.set(0, 3.7, 0); rig.add(ring);
  const ringLight = new THREE.PointLight('#fff4ea', 14, 12, 1.4); ringLight.position.set(0, 3.7, 1.2); rig.add(ringLight);
  const phone = new THREE.Group(); phone.position.set(0, 3.7, 0.05); rig.add(phone);
  box(phone, 0.62, 1.2, 0.1, '#1a1a1a', 0, 0, 0, { r: 0.08 });
  const phoneRT = new THREE.WebGLRenderTarget(360, 640, { samples: 4, type: THREE.HalfFloatType });
  const phoneHud = canvasTex(360, 640, (g, w, h) => {
    g.fillStyle = '#ff2b4a'; g.beginPath(); g.roundRect(18, 18, 120, 46, 12); g.fill(); g.fillStyle = '#fff'; g.font = '700 30px Fredoka'; g.textBaseline = 'middle'; g.fillText('● LIVE', 28, 42);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.roundRect(150, 18, 110, 46, 12); g.fill(); g.fillStyle = '#fff'; g.fillText('👁 2.4K', 160, 42);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.roundRect(270, 18, 72, 46, 12); g.fill(); g.fillStyle = '#ffd23a'; g.fillText('4K', 284, 42);
    for (let i = 0; i < 6; i++) { g.font = `${30 + i * 4}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`; g.fillText(['💖', '💜', '💖', '🔥', '💖', '✨'][i], 290 - (i % 2) * 30, 560 - i * 70); }
  });
  const phoneScreenMat = new THREE.MeshBasicMaterial({ map: phoneRT.texture, toneMapped: false });
  const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.1), phoneScreenMat); phoneScreen.position.set(0, 0, 0.055); phone.add(phoneScreen);
  const phoneHudM = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.1), new THREE.MeshBasicMaterial({ map: phoneHud, transparent: true, toneMapped: false })); phoneHudM.position.set(0, 0, 0.058); phone.add(phoneHudM);
  const phoneCam = new THREE.PerspectiveCamera(60, 360 / 640, 0.1, 50);
  const ceil = new THREE.PointLight('#fff0f6', 26, 26, 1.2); ceil.position.set(0, 8.4, 0); scene.add(ceil);
  const self = {
    name: 'sis', scene, L, walls, chars: {}, ring, phone, phoneCam, phoneRT, phoneScreen, fairy,
    objects: { ringlight: rig },
    // the phone on the ring light shows a live render of whoever stands on the rug (the sister by default)
    renderPhone(renderer) {
      phone.updateWorldMatrix(true, false); phone.getWorldPosition(phoneCam.position);
      const star = self.chars.sis || Object.values(self.chars)[0];
      const head = new THREE.Vector3(0.6, 3.6, 0.4); if (star) star.head.getWorldPosition(head); phoneCam.lookAt(head.x, head.y - 0.6, head.z);
      phoneScreen.visible = false; phoneHudM.visible = false;
      const prev = renderer.getRenderTarget(); renderer.setRenderTarget(phoneRT); renderer.render(scene, phoneCam); renderer.setRenderTarget(prev);
      phoneScreen.visible = true; phoneHudM.visible = true;
    },
    update(sh, t, f, ctx) { self.renderPhone(ctx.renderer); },
    power(on) { ceil.visible = ringLight.visible = on; L.hemi.intensity = on ? 1.15 : 0.12; scene.environmentIntensity = on ? 0.45 : 0.02; },
  };
  return self;
}

// ---------- LIVING ROOM (dad's TV + mom's laptop at the dining table) ----------
export function makeLiving(env) {
  const scene = new THREE.Scene(); scene.environment = env; scene.environmentIntensity = 0.45;
  const L = lights(scene, { hemi: 1.15, key: 2.3 });
  floor(scene, 30, 18, planks('#c4834c', 8)); ceiling(scene, 30, 18);
  const walls = {}; const UP = '#ffb23e', LOW = '#ffffff';
  walls.back = wallPanel(scene, 30, 9, UP, '#f2e6cf', { holes: [{ x0: -1.5, x1: 1.5, y0: 0, y1: 5.8 }] }); walls.back.position.set(0, 0, -8);
  walls.left = wallPanel(scene, 18, 9, UP, '#f2e6cf'); walls.left.position.set(-15, 0, 0); walls.left.rotation.y = Math.PI / 2;
  walls.right = wallPanel(scene, 18, 9, UP, '#f2e6cf'); walls.right.position.set(15, 0, 0); walls.right.rotation.y = -Math.PI / 2;
  walls.front = wallPanel(scene, 30, 9, UP, '#f2e6cf'); walls.front.position.set(0, 0, 9); walls.front.rotation.y = Math.PI;
  // hallway opening in back wall (dark corridor beyond with a door glow)
  box(walls.back, 3.4, 0.3, 0.4, '#ffffff', 0, 5.9, 0.1); box(walls.back, 0.25, 5.9, 0.4, '#ffffff', -1.6, 2.95, 0.1); box(walls.back, 0.25, 5.9, 0.4, '#ffffff', 1.6, 2.95, 0.1);
  box(walls.back, 3.0, 6, 0.2, '#e8d6b6', 0, 3, -4); box(walls.back, 0.2, 6, 4, '#e8d6b6', -1.5, 3, -2); box(walls.back, 0.2, 6, 4, '#e8d6b6', 1.5, 3, -2);
  // --- TV corner (left half): couch faces -x toward TV on the left wall
  const rugM = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), new THREE.MeshStandardMaterial({ color: '#2a6fe0', roughness: 0.95 })); rugM.rotation.x = -Math.PI / 2; rugM.position.set(-8.5, 0.02, 0.5); rugM.receiveShadow = true; scene.add(rugM);
  const couch = new THREE.Group(); couch.position.set(-5.6, 0, 0.5); scene.add(couch);
  const CO = '#e23d3d';
  box(couch, 2.6, 1.3, 7.0, CO, 0, 0.65, 0, { r: 0.2 }); box(couch, 1.1, 2.6, 7.0, CO, 0.9, 1.4, 0, { r: 0.3 });
  box(couch, 2.6, 2.0, 0.9, CO, 0.1, 1.0, -3.6, { r: 0.3 }); box(couch, 2.6, 2.0, 0.9, CO, 0.1, 1.0, 3.6, { r: 0.3 });
  for (const z of [-1.6, 1.6]) box(couch, 2.0, 0.45, 3.1, '#f05454', -0.2, 1.5, z, { r: 0.2 });
  box(couch, 0.5, 0.9, 0.9, '#ffd23a', 0.45, 2.1, -2.6, { r: 0.2, rz: 0.2 });
  // TV + stand on left wall
  box(scene, 1.6, 1.4, 6.0, '#6b4226', -14.1, 0.7, 0.5, { r: 0.06 });
  const TVW = 7.6, TVH = TVW * 9 / 16;
  box(scene, 0.25, TVH + 0.25, TVW + 0.25, '#111', -14.5, 4.35, 0.5, { r: 0.06 });
  const tvTex = screenTex(768, 432, () => {});
  const tv = new THREE.Mesh(new THREE.PlaneGeometry(TVW, TVH), screenMat(tvTex, 1.1)); tv.position.set(-14.36, 4.35, 0.5); tv.rotation.y = Math.PI / 2; scene.add(tv);
  const tvGlow = new THREE.PointLight('#bfffc8', 10, 14, 1.4); tvGlow.position.set(-12.5, 4.2, 0.5); scene.add(tvGlow);
  const consoleBox = box(scene, 1.2, 0.3, 1.6, '#f4f4f4', -14.0, 1.55, -1.5, { r: 0.08 }); const consoleLed = box(scene, 0.04, 0.05, 1.2, glow('#2fd3ff', 3), -13.39, 1.55, -1.5, { r: 0, cast: false });
  box(scene, 1.1, 2.6, 1.1, '#2fd36b', -13.8, 1.3, 4.6, { r: 0.4 }); sphere(scene, 1.0, '#27b85c', -13.8, 3.2, 4.6); // plant
  // lamp
  cyl(scene, 0.06, 0.06, 5.2, '#333', -9.0, 2.6, -6.8); cyl(scene, 0.5, 0.8, 0.9, '#fff3d6', -9.0, 5.4, -6.8);
  const floorLamp = new THREE.PointLight('#ffc98a', 12, 12, 1.5); floorLamp.position.set(-9.0, 5.0, -6.4); scene.add(floorLamp);
  // --- dining corner (right half): table + laptop, mom faces +x?  mom sits at x=6 facing -x? -> she faces camera side (+z)
  const table = new THREE.Group(); table.position.set(1.1, 0, 0.5); scene.add(table);
  box(table, 4.6, 0.25, 3.0, '#d99a5b', 0, 2.4, 0, { r: 0.06 });
  for (const [x, z] of [[-2, -1.2], [2, -1.2], [-2, 1.2], [2, 1.2]]) box(table, 0.22, 2.3, 0.22, '#c9783e', x, 1.15, z);
  const laptop = new THREE.Group(); laptop.position.set(1.0, 2.53, 1.15); scene.add(laptop);
  box(laptop, 2.0, 0.08, 1.4, '#6f7684', 0, 0.04, 0, { r: 0.03 });
  const lid = new THREE.Group(); lid.position.set(0, 0.08, -0.68); lid.rotation.x = -0.25; laptop.add(lid);
  box(lid, 2.0, 1.35, 0.06, '#6f7684', 0, 0.68, 0, { r: 0.03 });
  sphere(lid, 0.16, mat('#ff4f9a'), 0, 0.72, -0.05, { sx: 1, sz: 0.2 }); // flat logo on the lid back (without sx the sphere poked through the screen)
  const callTex = screenTex(640, 420, () => {});
  const callScr = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 1.2), screenMat(callTex, 1.1)); callScr.position.set(0, 0.68, 0.035); lid.add(callScr);
  const laptopGlow = new THREE.PointLight('#cfe6ff', 4, 6, 1.6); laptopGlow.position.set(1.0, 3.3, 2.0); scene.add(laptopGlow);
  cyl(scene, 0.2, 0.17, 0.42, '#ff4f9a', 2.8, 2.74, 0.2); // mug
  box(scene, 1.0, 0.06, 0.7, '#ffcc22', -0.8, 2.55, 0.0, { r: 0.02, ry: 0.3 }); // notebook
  const chair = new THREE.Group(); chair.position.set(1.0, 0, 3.3); scene.add(chair);
  box(chair, 1.8, 0.25, 1.8, '#1fa6a0', 0, 1.45, 0, { r: 0.08 }); box(chair, 1.8, 2.4, 0.25, '#1fa6a0', 0, 2.6, 0.9, { r: 0.08 });
  for (const [x, z] of [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]]) box(chair, 0.18, 1.4, 0.18, '#c9783e', x, 0.7, z);
  // kitchen behind (right wall)
  box(scene, 2.4, 2.4, 12, '#ffffff', 13.6, 1.2, 0, { r: 0.05 }); box(scene, 2.5, 0.2, 12.1, '#ff7a1f', 13.6, 2.5, 0, { r: 0.04 });
  for (let i = 0; i < 6; i++) box(scene, 0.06, 2.0, 1.8, '#f2f2f2', 12.38, 1.15, -5 + i * 2, { r: 0.03 });
  box(scene, 2.2, 6.6, 2.6, '#e8eef6', 13.7, 3.3, -6.6, { r: 0.12 }); box(scene, 0.06, 0.9, 0.12, '#888', 12.58, 4.4, -5.6); // fridge
  box(scene, 1.3, 2.0, 11, '#ffffff', 14.2, 6.2, 0.5, { r: 0.05 });
  poster(scene, 3.0, 2.0, (g, w, h) => { g.fillStyle = '#2fd3c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(w * 0.75, h * 0.3, 40, 0, 7); g.fill(); g.fillStyle = '#2f9e4a'; g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.35, h * 0.4); g.lineTo(w * 0.7, h); g.fill(); g.fillStyle = '#27b85c'; g.beginPath(); g.moveTo(w * 0.4, h); g.lineTo(w * 0.75, h * 0.5); g.lineTo(w, h); g.fill(); }, -6.5, 5.6, -7.84);
  poster(scene, 2.2, 1.6, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); const cs = ['#ff7417', '#ff4f9a', '#9a5cf2', '#38b25a']; cs.forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.roundRect(20 + i * 62, 60 + (i % 2) * 10, 50, 120, 14); g.fill(); g.beginPath(); g.arc(45 + i * 62, 40 + (i % 2) * 10, 24, 0, 7); g.fill(); }); }, 5.0, 5.6, -7.84);
  const ceil = new THREE.PointLight('#fff3e2', 20, 30, 1.2); ceil.position.set(0, 8.4, 0); scene.add(ceil);
  const ceil2 = new THREE.PointLight('#fff3e2', 9, 22, 1.2); ceil2.position.set(2, 8.4, 1); scene.add(ceil2);
  const tvMat = tv.material, callMat = callScr.material;
  return {
    name: 'living', scene, L, walls, chars: {}, tvTex, callTex, tv, callScr, couch, laptop, consoleLed,
    objects: { laptop, couch, table, chair },
    update(sh, t, f, ctx) {
      const powerOn = ctx.powerOn;
      // TV: 'match' (default), 'game' or 'off'; tvOff = the frame it switches off
      const tvFeed = ctx.feed('tv', 'match');
      const tvOn = powerOn && !(sh.tvOff != null && t >= sh.tvOff) && tvFeed !== 'off';
      const tvGame = tvOn && tvFeed === 'game' ? ctx.gameTex('tv') : null;
      const tvMap = tvGame || tvTex; if (!tvGame) drawTV(tvTex, f, tvOn);
      if (tvMat.map !== tvMap) { tvMat.map = tvMap; tvMat.needsUpdate = true; }
      // laptop: 'call' (default), 'game' or 'off'; lidClose = the frame the lid shuts
      const lid = laptop.children.find((c) => c.isGroup);
      const closing = sh.lidClose != null && t >= sh.lidClose; lid.rotation.x = closing ? -0.25 - 1.32 * easeOut((t - sh.lidClose) / 5) : -0.25;
      const lapFeed = ctx.feed('laptop', 'call');
      const lapOn = powerOn && !closing && lapFeed !== 'off';
      const lapGame = lapOn && lapFeed === 'game' ? ctx.gameTex('laptop') : null;
      const lapMap = lapGame || callTex; if (!lapGame) drawCall(callTex, f, lapOn);
      if (callMat.map !== lapMap) { callMat.map = lapMap; callMat.needsUpdate = true; }
    },
    power(on) { ceil.visible = ceil2.visible = floorLamp.visible = tvGlow.visible = laptopGlow.visible = on; L.hemi.intensity = on ? 1.15 : 0.12; scene.environmentIntensity = on ? 0.45 : 0.02; },
  };
}

// ---------- HALLWAY (the router) ----------
export function makeHall(env) {
  const scene = new THREE.Scene(); scene.environment = env; scene.environmentIntensity = 0.5;
  const L = lights(scene, { hemi: 1.2, key: 2.0 });
  floor(scene, 14, 12, planks('#c4834c', 12)); ceiling(scene, 14, 12);
  const walls = {};
  walls.back = wallPanel(scene, 14, 9, '#8fe0c8', '#ffffff'); walls.back.position.set(0, 0, -4);
  walls.left = wallPanel(scene, 12, 9, '#8fe0c8', '#ffffff'); walls.left.position.set(-7, 0, 0); walls.left.rotation.y = Math.PI / 2;
  // console table + router + plant + family photos
  box(scene, 4.2, 0.2, 1.4, '#c9783e', 0, 2.6, -3.2, { r: 0.05 }); for (const x of [-1.9, 1.9]) box(scene, 0.18, 2.5, 1.2, '#a8602e', x, 1.25, -3.2);
  const router = new THREE.Group(); router.position.set(-0.2, 2.7, -3.1); scene.add(router);
  box(router, 2.0, 0.42, 1.0, '#26262e', 0, 0.21, 0, { r: 0.16 });
  const antennas = []; for (const x of [-0.75, 0, 0.75]) { const a = box(router, 0.12, 1.5, 0.12, '#1d1d24', x, 1.1, -0.3, { r: 0.05 }); a.rotation.z = x * 0.25; antennas.push(a); }
  const leds = []; for (let i = 0; i < 5; i++) { const m = new THREE.MeshBasicMaterial({ color: '#3ef06a', toneMapped: false }); const l = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.03), m); l.position.set(-0.6 + i * 0.3, 0.22, 0.505); router.add(l); leds.push(l); }
  const wifiIcon = canvasTex(256, 256, (g, w, h) => { g.strokeStyle = '#ffffff'; g.lineWidth = 18; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(w / 2, h * 0.8, 40 + i * 45, Math.PI * 1.25, Math.PI * 1.75); g.stroke(); } g.fillStyle = '#ffffff'; g.beginPath(); g.arc(w / 2, h * 0.8, 16, 0, 7); g.fill(); });
  const wi = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshStandardMaterial({ map: wifiIcon, transparent: true })); wi.position.set(0.72, 0.3, 0.505); router.add(wi);
  const routerGlow = new THREE.PointLight('#3ef06a', 0.0, 3, 2); routerGlow.position.set(-0.2, 3.0, -2.2); scene.add(routerGlow);
  box(scene, 0.8, 0.9, 0.8, '#ff7a1f', 1.4, 3.15, -3.2, { r: 0.2 }); sphere(scene, 0.6, '#2fd36b', 1.4, 3.95, -3.2);
  const frames = [['#ff7417', '#38b25a'], ['#9a5cf2', '#ff4f9a']];
  frames.forEach((cs, i) => poster(scene, 1.6, 1.3, (g, w, h) => { g.fillStyle = '#ffe9c8'; g.fillRect(0, 0, w, h); cs.forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.roundRect(40 + k * 90, 70, 60, 80, 12); g.fill(); g.beginPath(); g.arc(70 + k * 90, 50, 26, 0, 7); g.fill(); }); }, -1.6 + i * 2.6, 5.3, -3.84));
  const ceil = new THREE.PointLight('#fff3e2', 18, 18, 1.3); ceil.position.set(0, 8, 0); scene.add(ceil);
  return {
    name: 'hall', scene, L, walls, chars: {}, leds, routerGlow, antennas, objects: { router },
    update(sh, t, f) { // router LEDs: 'busy' flicker (default) or 'red' alarm
      const red = sh.router === 'red';
      leds.forEach((l, i) => { const on = red ? ((f >> 1) + i) % 2 === 0 : ((f * 3 + i * 7) % 5) < 3; l.material.color.set(on ? (red ? '#ff2020' : (i < 3 ? '#3ef06a' : '#ffb020')) : '#202020'); });
      routerGlow.intensity = red ? 3 : 1.2; routerGlow.color.set(red ? '#ff2a2a' : '#3ef06a');
    },
    power(on) { ceil.visible = on; L.hemi.intensity = on ? 1.2 : 0.12; scene.environmentIntensity = on ? 0.5 : 0.02; for (const l of leds) l.visible = on; },
  };
}

// ---------- EXTERIOR (night) ----------
export function makeExt() {
  const scene = new THREE.Scene();
  scene.background = nightSky(1024, 1024, { moon: [0.78, 0.18], moonR: 40, horizon: '#3a4f9a' });
  const hemi = new THREE.HemisphereLight('#6f86ff', '#1a2440', 0.9); scene.add(hemi);
  const moon = new THREE.DirectionalLight('#9fb4ff', 1.3); moon.position.set(20, 30, 10); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); moon.shadow.radius = 4; Object.assign(moon.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 120 }); scene.add(moon);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat('#2f7a3a', { rough: 0.95 })); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; scene.add(grass);
  box(scene, 200, 0.1, 8, '#3a3f4a', 0, 0.05, 14, { r: 0, cast: false }); box(scene, 200, 0.2, 2.4, '#9aa0aa', 0, 0.1, 8.8, { r: 0, cast: false });
  for (let i = -10; i < 10; i++) box(scene, 2.4, 0.02, 0.3, '#e8e2b0', i * 6, 0.11, 14, { r: 0, cast: false });
  box(scene, 2.6, 0.12, 8, '#9aa0aa', 0, 0.06, 4, { r: 0, cast: false }); // path
  const windows = [];
  function house(x, z, s, wall, roof, lit, main) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
    box(g, 14, 10, 9, wall, 0, 5, 0, { r: 0.1 });
    const roofG = new THREE.Group(); roofG.position.set(0, 10, 0); g.add(roofG);
    const shape = new THREE.Shape([new THREE.Vector2(-7.8, 0), new THREE.Vector2(7.8, 0), new THREE.Vector2(0, 5)]);
    const rm = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 10, bevelEnabled: false }), mat(roof)); rm.position.z = -5; rm.castShadow = true; roofG.add(rm);
    box(g, 1.3, 3, 1.3, '#8a4a34', 4, 13, -1.5);
    box(g, 2.4, 4.4, 0.3, '#7a3e22', 0, 2.2, 4.55, { r: 0.05 }); sphere(g, 0.12, '#ffd23a', 0.8, 2.2, 4.75);
    const wins = [[-4.6, 3], [4.6, 3], [-4.6, 7.4], [0, 7.4], [4.6, 7.4]];
    for (const [wx, wy] of wins) {
      box(g, 2.8, 2.6, 0.2, '#ffffff', wx, wy, 4.52, { r: 0.04 });
      const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(lit ? '#ffcf6a' : '#1a2340').multiplyScalar(lit ? 1.6 : 1), toneMapped: false });
      const w = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.2), m); w.position.set(wx, wy, 4.64); g.add(w);
      box(g, 0.12, 2.2, 0.1, '#ffffff', wx, wy, 4.7, { r: 0 }); box(g, 2.4, 0.12, 0.1, '#ffffff', wx, wy, 4.7, { r: 0 });
      if (main) windows.push(m);
    }
    const porch = new THREE.PointLight('#ffc070', main ? 16 : 10, 10, 1.5); porch.position.set(0, 5.2, 5.6); g.add(porch); sphere(g, 0.25, glow('#ffd890', 3), 0, 5.0, 4.8, { cast: false });
    return { g, porch };
  }
  const main = house(0, -6, 1, '#f3e3c3', '#c2412f', true, true);
  const n1 = house(-24, -8, 0.9, '#bfe0f0', '#3c5aa8', true, false);
  const n2 = house(24, -8, 0.9, '#f0c8d8', '#6a3a8a', true, false);
  // trees, fence, mailbox, street lamp
  for (const [x, z, s] of [[-11, 2, 1.1], [11.5, 1, 0.9], [-36, 0, 1.2], [36, 2, 1]]) { cyl(scene, 0.4, 0.5, 4, '#6b4226', x, 2, z); sphere(scene, 2.6 * s, '#2a8a3e', x, 5.5 * s + 0.5, z); sphere(scene, 1.8 * s, '#34a04a', x + 1.2, 4.8 * s, z + 0.8); }
  for (let i = -9; i <= 9; i++) if (Math.abs(i) > 1) { box(scene, 0.3, 1.4, 0.3, '#ffffff', i * 1.2, 0.7, 7.2, { r: 0.04 }); }
  box(scene, 21, 0.18, 0.12, '#ffffff', 0, 1.1, 7.2); box(scene, 21, 0.18, 0.12, '#ffffff', 0, 0.5, 7.2);
  cyl(scene, 0.15, 0.2, 9, '#2a2e38', 9, 4.5, 10); box(scene, 2.2, 0.2, 0.2, '#2a2e38', 8.1, 9, 10); sphere(scene, 0.45, glow('#ffe2a8', 3), 7.2, 8.7, 10, { cast: false });
  const lampL = new THREE.PointLight('#ffd590', 60, 22, 1.4); lampL.position.set(7.2, 8.4, 10); scene.add(lampL);
  return {
    name: 'ext', scene, walls: {}, chars: {}, objects: {}, windows, porch: main.porch, update() {},
    power(on) { for (const m of windows) m.color.set(on ? new THREE.Color('#ffcf6a').multiplyScalar(1.6) : new THREE.Color('#141c36')); main.porch.visible = on; },
  };
}

// 2D screen content painters (redrawn per frame when needed)
export function drawTV(tex, f, on = true) {
  const g = tex.userData.ctx, w = 768, h = 432;
  if (!on) { g.fillStyle = '#05060a'; g.fillRect(0, 0, w, h); tex.needsUpdate = true; return; }
  g.fillStyle = '#2f9e3e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#2a9038' : '#33a843'; g.fillRect(i * w / 8, 0, w / 8, h); }
  g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.strokeRect(30, 40, w - 60, h - 70); g.beginPath(); g.moveTo(w / 2, 40); g.lineTo(w / 2, h - 30); g.stroke(); g.beginPath(); g.arc(w / 2, h / 2 + 5, 60, 0, 7); g.stroke();
  const R = rng(2); const ph = f * 0.04;
  for (let i = 0; i < 12; i++) { const x = 80 + R() * (w - 160) + Math.sin(ph + i) * 20, y = 80 + R() * (h - 160) + Math.cos(ph * 1.3 + i) * 12; g.fillStyle = i < 6 ? '#ff3b3b' : '#2f6bff'; g.beginPath(); g.roundRect(x - 9, y - 18, 18, 30, 6); g.fill(); g.fillStyle = '#e8a874'; g.beginPath(); g.arc(x, y - 24, 8, 0, 7); g.fill(); }
  g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2 + Math.sin(ph * 2) * 120, h / 2 + Math.cos(ph * 1.7) * 60, 8, 0, 7); g.fill();
  g.fillStyle = 'rgba(10,14,40,0.85)'; g.beginPath(); g.roundRect(20, 12, 250, 50, 10); g.fill();
  g.font = '700 32px Fredoka'; g.textBaseline = 'middle'; g.fillStyle = '#ff3b3b'; g.fillText('RED', 34, 38); g.fillStyle = '#fff'; g.fillText('2 - 1', 104, 38); g.fillStyle = '#5a8bff'; g.fillText('BLU', 194, 38);
  g.fillStyle = '#ff2b4a'; g.beginPath(); g.roundRect(w - 220, 12, 90, 50, 10); g.fill(); g.fillStyle = '#fff'; g.fillText('LIVE', w - 206, 38);
  g.fillStyle = 'rgba(10,14,40,0.85)'; g.beginPath(); g.roundRect(w - 122, 12, 102, 50, 10); g.fill(); g.fillStyle = '#ffd23a'; g.fillText('8K', w - 96, 38);
  tex.needsUpdate = true;
}
export function drawCall(tex, f, on = true, talking = 0) {
  const g = tex.userData.ctx, w = 640, h = 420;
  if (!on) { g.fillStyle = '#05060a'; g.fillRect(0, 0, w, h); tex.needsUpdate = true; return; }
  g.fillStyle = '#1b1f2e'; g.fillRect(0, 0, w, h);
  const people = [['#ff7a8a', '#ffd23a', 'Auntie'], ['#7ad8ff', '#3a6bd6', 'Grandpa'], ['#b48cff', '#ff4f9a', 'Cousin'], ['#ffd27a', '#38b25a', 'Uncle'], ['#9ff0c8', '#ff7417', 'Nana'], ['#ffb3d1', '#9a5cf2', 'Bestie']];
  people.forEach(([bg, shirt, name], i) => {
    const x = 12 + (i % 3) * 208, y = 12 + Math.floor(i / 3) * 172, tw = 196, th = 160;
    g.fillStyle = bg; g.beginPath(); g.roundRect(x, y, tw, th, 12); g.fill();
    g.save(); g.beginPath(); g.roundRect(x, y, tw, th, 12); g.clip();
    g.fillStyle = shirt; g.beginPath(); g.roundRect(x + 48, y + 104, 100, 80, 20); g.fill();
    g.fillStyle = '#e8a874'; g.beginPath(); g.roundRect(x + 58, y + 30, 80, 76, 22); g.fill();
    g.fillStyle = '#1b1410'; const bob = ((f >> 2) + i) % 3 === 0 ? 8 : 3; g.fillRect(x + 76, y + 58, 8, 12); g.fillRect(x + 112, y + 58, 8, 12); g.beginPath(); g.ellipse(x + 98, y + 88, 14, bob, 0, 0, 7); g.fill();
    g.restore();
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.roundRect(x + 8, y + th - 30, 90, 24, 8); g.fill(); g.fillStyle = '#fff'; g.font = '600 17px Fredoka'; g.textBaseline = 'middle'; g.fillText(name, x + 16, y + th - 18);
    if (((f >> 3) + i) % 4 === 0) { g.strokeStyle = '#3ef06a'; g.lineWidth = 5; g.beginPath(); g.roundRect(x, y, tw, th, 12); g.stroke(); }
  });
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.beginPath(); g.roundRect(w - 96, h - 40, 84, 30, 8); g.fill(); g.fillStyle = '#ffd23a'; g.font = '700 20px Fredoka'; g.fillText('HD ●', w - 86, h - 25);
  tex.needsUpdate = true;
}
