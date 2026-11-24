import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const D2R = Math.PI / 180;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOutBack = (t) => { t = clamp(t); const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

export function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// Matte smooth plastic (bible §9: roughness 0.55-0.7, metalness 0).
const matCache = new Map();
export function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!o.unique && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.6, metalness: 0, ...(o.emissive ? { emissive: o.emissive, emissiveIntensity: o.ei ?? 1 } : {}), ...(o.map ? { map: o.map } : {}), ...(o.transparent ? { transparent: true, opacity: o.opacity ?? 1 } : {}), side: o.side ?? THREE.FrontSide });
  if (!o.unique) matCache.set(key, m);
  return m;
}
export function glow(color, intensity = 1) { // unlit emissive surface that blooms (screens, LEDs, lamp shades)
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false });
}

const geoCache = new Map();
function rbox(w, h, d, r) {
  const k = `${w}|${h}|${d}|${r}`;
  if (!geoCache.has(k)) geoCache.set(k, r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)) : new THREE.BoxGeometry(w, h, d));
  return geoCache.get(k);
}
// Box helper: position is the box centre unless o.base, in which case y is the bottom.
export function box(parent, w, h, d, material, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(rbox(w, h, d, o.r ?? 0.04), typeof material === 'string' || typeof material === 'number' ? mat(material) : material);
  m.position.set(x, o.base ? y + h / 2 : y, z);
  if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz;
  m.castShadow = o.cast ?? true; m.receiveShadow = o.receive ?? true;
  parent.add(m); return m;
}
export function cyl(parent, rt, rb, h, material, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 32), typeof material === 'string' || typeof material === 'number' ? mat(material) : material);
  m.position.set(x, y, z); if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; if (o.ry) m.rotation.y = o.ry;
  m.castShadow = o.cast ?? true; m.receiveShadow = o.receive ?? true; parent.add(m); return m;
}
export function sphere(parent, r, material, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), typeof material === 'string' || typeof material === 'number' ? mat(material) : material);
  m.position.set(x, y, z); if (o.sx) m.scale.set(o.sx, o.sy ?? 1, o.sz ?? 1);
  m.castShadow = o.cast ?? true; m.receiveShadow = o.receive ?? true; parent.add(m); return m;
}
export function plane(parent, w, h, material, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.position.set(x, y, z); if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz;
  m.receiveShadow = o.receive ?? true; m.castShadow = false; parent.add(m); return m;
}

export function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  t.userData.canvas = c; t.userData.ctx = g;
  return t;
}

export function roundRect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

// Wood plank floor texture.
export function planks(base = '#c98a52', seed = 3) {
  const R = rng(seed);
  return canvasTex(512, 512, (g, w, h) => {
    const rows = 8, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -R() * 200;
      while (x < w) {
        const len = 160 + R() * 180, c = new THREE.Color(base).offsetHSL((R() - 0.5) * 0.02, (R() - 0.5) * 0.08, (R() - 0.5) * 0.08);
        g.fillStyle = '#' + c.getHexString(); g.fillRect(x, r * rh, len, rh);
        g.fillStyle = 'rgba(60,30,10,0.35)'; g.fillRect(x, r * rh, 3, rh);
        x += len;
      }
      g.fillStyle = 'rgba(60,30,10,0.45)'; g.fillRect(0, r * rh, w, 3);
    }
  }, { repeat: [3, 3] });
}
