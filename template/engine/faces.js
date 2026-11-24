// Flat face decals, drawn whole per expression and swapped whole at each beat (bible §4: decal faces, no rigged features).
// Our own face language: big glossy oval eyes, thick ink outlines, rosy cheeks; reaction faces get "meme" detail
// (teeth, tiny pupils, stress lines, veins, tears) as the bible measured on reaction shots.
import * as THREE from 'three';

const INK = '#1b1410', MOUTH = '#5b1212', TONGUE = '#ef6a83', WHITE = '#ffffff';
const S = 512;

function eye(g, x, y, type, v) {
  g.save(); g.translate(x, y);
  const lw = 9; g.lineWidth = lw; g.strokeStyle = INK; g.fillStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
  const mirror = v.side < 0 ? -1 : 1;
  switch (type) {
    case 'oval': case 'look': {
      const dx = type === 'look' ? 14 * (v.lookDir || 1) : 0;
      g.beginPath(); g.ellipse(dx, 0, 24, 36, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = WHITE; g.beginPath(); g.ellipse(dx - 7, -13, 8, 11, -0.3, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(dx + 8, 14, 4, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'big': { // wide open, white sclera, mid pupil
      g.fillStyle = WHITE; g.beginPath(); g.ellipse(0, 0, 40, 46, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(0, 4, 17, 0, Math.PI * 2); g.fill();
      g.fillStyle = WHITE; g.beginPath(); g.arc(-6, -2, 6, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'tiny': { // shock: huge sclera, pin pupils, red veins
      g.fillStyle = WHITE; g.beginPath(); g.ellipse(0, 0, 46, 52, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.strokeStyle = '#e04a4a'; g.lineWidth = 3;
      for (const a of [0.3, 1.2, 2.4, 3.4, 4.5, 5.6]) { g.beginPath(); g.moveTo(Math.cos(a) * 44, Math.sin(a) * 50); g.lineTo(Math.cos(a + 0.15) * 30, Math.sin(a + 0.15) * 34); g.stroke(); }
      g.fillStyle = INK; g.beginPath(); g.arc(0, 2, 8, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'angry': { // narrowed oval with slanted lid (inner side down)
      g.beginPath(); g.ellipse(0, 6, 26, 30, 0, 0, Math.PI * 2); g.save(); g.clip();
      g.fillStyle = INK; g.fillRect(-40, -40, 80, 80);
      g.fillStyle = v.skin; g.beginPath(); g.moveTo(-40 * mirror, -40); g.lineTo(40 * mirror, -40); g.lineTo(40 * mirror, -4); g.lineTo(-40 * mirror, -26); g.closePath(); g.fill();
      g.restore();
      g.fillStyle = WHITE; g.beginPath(); g.arc(-5, 10, 6, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'tinyAngry': {
      g.fillStyle = WHITE; g.beginPath(); g.ellipse(0, 4, 42, 40, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = v.skin; g.beginPath(); g.moveTo(-50 * mirror, -46); g.lineTo(50 * mirror, -46); g.lineTo(50 * mirror, -18); g.lineTo(-50 * mirror, 6); g.closePath(); g.fill();
      g.strokeStyle = INK; g.lineWidth = 10; g.beginPath(); g.moveTo(-46 * mirror, 4); g.lineTo(46 * mirror, -20); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(4 * mirror, 14, 8, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'half': { // bored lids
      g.beginPath(); g.ellipse(0, 0, 25, 34, 0, 0, Math.PI * 2); g.save(); g.clip();
      g.fillStyle = INK; g.fillRect(-40, -40, 80, 80); g.fillStyle = v.skin; g.fillRect(-40, -40, 80, 38); g.restore();
      g.lineWidth = 10; g.beginPath(); g.moveTo(-30, -2); g.lineTo(30, -2); g.stroke();
      g.fillStyle = WHITE; g.beginPath(); g.arc(-6, 12, 5, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'happy': g.lineWidth = 11; g.beginPath(); g.arc(0, 12, 26, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); break;
    case 'squeeze': g.lineWidth = 11; g.beginPath(); g.moveTo(-26 * mirror, -18); g.lineTo(18 * mirror, 0); g.lineTo(-26 * mirror, 18); g.stroke(); break;
    case 'dot': g.beginPath(); g.arc(0, 0, 11, 0, Math.PI * 2); g.fill(); break;
    case 'line': g.lineWidth = 10; g.beginPath(); g.moveTo(-24, 0); g.lineTo(24, 0); g.stroke(); break;
    case 'star': {
      g.fillStyle = '#ffd23a'; g.strokeStyle = INK; g.lineWidth = 7; g.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 18 : 44, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fill(); g.stroke(); g.fillStyle = WHITE; g.beginPath(); g.arc(-8, -8, 6, 0, Math.PI * 2); g.fill();
      break;
    }
  }
  if (v.lashes && ['oval', 'look', 'big', 'half', 'happy'].includes(type)) {
    g.strokeStyle = INK; g.lineWidth = 7; const top = type === 'big' ? -40 : -30;
    for (const k of [0, 1]) { g.beginPath(); g.moveTo(mirror * (14 + k * 10), top + 6 + k * 8); g.lineTo(mirror * (28 + k * 12), top - 6 + k * 8); g.stroke(); }
  }
  g.restore();
}

function brow(g, x, y, ang, side, thick = 11, len = 34) {
  g.save(); g.translate(x, y); g.rotate(ang * side); g.strokeStyle = INK; g.lineWidth = thick; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-len, 0); g.quadraticCurveTo(0, -6, len, 0); g.stroke(); g.restore();
}

function teethRow(g, x0, x1, y0, y1, n) {
  g.fillStyle = WHITE; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.strokeStyle = '#9a9a9a'; g.lineWidth = 3;
  for (let i = 1; i < n; i++) { const x = x0 + (x1 - x0) * i / n; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
}

function mouth(g, type, v) {
  const cx = 256 + (v.mouthX || 0), cy = 370;
  g.save(); g.strokeStyle = INK; g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round';
  switch (type) {
    case 'smile': g.beginPath(); g.arc(cx, cy - 40, 50, Math.PI * 0.22, Math.PI * 0.78); g.stroke(); break;
    case 'flat': g.beginPath(); g.moveTo(cx - 40, cy); g.lineTo(cx + 34, cy + 4); g.stroke(); break;
    case 'frown': g.beginPath(); g.arc(cx, cy + 40, 44, Math.PI * 1.25, Math.PI * 1.75); g.stroke(); break;
    case 'o': g.fillStyle = MOUTH; g.beginPath(); g.ellipse(cx + 18, cy, 15, 19, 0, 0, Math.PI * 2); g.fill(); g.stroke(); break;
    case 'tongue': {
      g.beginPath(); g.moveTo(cx - 44, cy - 6); g.quadraticCurveTo(cx, cy + 22, cx + 46, cy - 10); g.stroke();
      g.fillStyle = TONGUE; g.beginPath(); g.ellipse(cx + 28, cy + 10, 15, 20, -0.3, 0, Math.PI); g.fill(); g.stroke();
      break;
    }
    case 'big': case 'laugh': { // open D smile with teeth and tongue
      const w = type === 'laugh' ? 82 : 70, h = type === 'laugh' ? 78 : 62;
      g.beginPath(); g.moveTo(cx - w, cy - 24); g.lineTo(cx + w, cy - 24); g.quadraticCurveTo(cx + w, cy - 24 + h * 1.5, cx, cy - 24 + h * 1.3); g.quadraticCurveTo(cx - w, cy - 24 + h * 1.5, cx - w, cy - 24); g.closePath();
      g.fillStyle = MOUTH; g.fill(); g.save(); g.clip();
      teethRow(g, cx - w, cx + w, cy - 24, cy - 6, 6);
      g.fillStyle = TONGUE; g.beginPath(); g.ellipse(cx, cy - 24 + h * 1.25, w * 0.6, 26, 0, 0, Math.PI * 2); g.fill();
      g.restore(); g.stroke();
      break;
    }
    case 'talk': g.fillStyle = MOUTH; g.beginPath(); g.moveTo(cx - 36, cy - 12); g.quadraticCurveTo(cx, cy - 4, cx + 36, cy - 12); g.quadraticCurveTo(cx, cy + 46, cx - 36, cy - 12); g.fill(); g.stroke();
      g.save(); g.clip(); g.fillStyle = TONGUE; g.beginPath(); g.ellipse(cx, cy + 22, 20, 12, 0, 0, Math.PI * 2); g.fill(); g.restore(); break;
    case 'shock': { // tall open oval, top teeth, uvula dark
      g.fillStyle = MOUTH; g.beginPath(); g.ellipse(cx, cy + 10, 40, 56, 0, 0, Math.PI * 2); g.fill();
      g.save(); g.clip(); teethRow(g, cx - 40, cx + 40, cy - 46, cy - 26, 5); g.fillStyle = TONGUE; g.beginPath(); g.ellipse(cx, cy + 58, 30, 22, 0, 0, Math.PI * 2); g.fill(); g.restore();
      g.stroke(); break;
    }
    case 'grit': case 'eek': { // clenched teeth block
      const w = type === 'eek' ? 78 : 64, h = 46, y = cy - 18;
      g.beginPath(); g.roundRect(cx - w, y, w * 2, h, 14); g.fillStyle = WHITE; g.fill(); g.save(); g.clip();
      g.strokeStyle = '#8a8a8a'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - w, y + h / 2); g.lineTo(cx + w, y + h / 2); g.stroke();
      for (let i = 1; i < 8; i++) { const x = cx - w + (2 * w) * i / 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + h); g.stroke(); }
      g.restore(); g.strokeStyle = INK; g.lineWidth = 10; g.beginPath(); g.roundRect(cx - w, y, w * 2, h, 14); g.stroke();
      if (type === 'grit') { g.lineWidth = 6; g.beginPath(); g.moveTo(cx - w - 14, y + h + 8); g.lineTo(cx - w + 4, y + h + 2); g.moveTo(cx + w + 14, y + h + 8); g.lineTo(cx + w - 4, y + h + 2); g.stroke(); }
      break;
    }
    case 'scream': { // huge trapezoid with both teeth rows
      g.beginPath(); g.moveTo(cx - 92, cy - 40); g.lineTo(cx + 92, cy - 40); g.lineTo(cx + 64, cy + 88); g.quadraticCurveTo(cx, cy + 104, cx - 64, cy + 88); g.closePath();
      g.fillStyle = MOUTH; g.fill(); g.save(); g.clip();
      teethRow(g, cx - 92, cx + 92, cy - 40, cy - 16, 7); teethRow(g, cx - 70, cx + 70, cy + 70, cy + 100, 6);
      g.fillStyle = TONGUE; g.beginPath(); g.ellipse(cx, cy + 66, 50, 22, 0, 0, Math.PI * 2); g.fill();
      g.restore(); g.stroke(); break;
    }
    case 'wobble': {
      g.fillStyle = MOUTH; g.beginPath(); g.moveTo(cx - 54, cy + 22);
      for (let i = 0; i <= 8; i++) g.lineTo(cx - 54 + i * 13.5, cy + (i % 2 ? -4 : 6));
      g.quadraticCurveTo(cx + 54, cy + 50, cx, cy + 46); g.quadraticCurveTo(cx - 54, cy + 50, cx - 54, cy + 22); g.fill(); g.stroke();
      break;
    }
    case 'smirk': g.beginPath(); g.moveTo(cx - 40, cy + 6); g.quadraticCurveTo(cx + 10, cy + 14, cx + 48, cy - 16); g.stroke(); break;
  }
  g.restore();
}

function extras(g, list, v) {
  for (const e of list) {
    g.save();
    if (e === 'blush') { g.fillStyle = 'rgba(255,90,110,0.38)'; for (const x of [140, 372]) { g.beginPath(); g.ellipse(x, 318, 40, 22, 0, 0, Math.PI * 2); g.fill(); } }
    if (e === 'redface') { const gr = g.createLinearGradient(0, 120, 0, 330); gr.addColorStop(0, 'rgba(230,30,30,0.0)'); gr.addColorStop(1, 'rgba(230,30,30,0.42)'); g.fillStyle = gr; g.fillRect(40, 120, 432, 300); }
    if (e === 'tears') { g.fillStyle = 'rgba(80,190,255,0.9)'; g.strokeStyle = '#1a6fb0'; g.lineWidth = 4; for (const x of [168, 344]) { g.beginPath(); g.roundRect(x - 13, 250, 26, 200, 13); g.fill(); g.stroke(); } }
    if (e === 'tear1') { g.fillStyle = 'rgba(80,190,255,0.95)'; g.strokeStyle = '#1a6fb0'; g.lineWidth = 4; g.beginPath(); g.ellipse(352, 296, 13, 20, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
    if (e === 'sweat') { g.fillStyle = 'rgba(120,205,255,0.95)'; g.strokeStyle = '#1a6fb0'; g.lineWidth = 5; g.beginPath(); g.moveTo(436, 92); g.quadraticCurveTo(470, 150, 436, 162); g.quadraticCurveTo(402, 150, 436, 92); g.fill(); g.stroke(); }
    if (e === 'vein') { g.strokeStyle = '#d42020'; g.lineWidth = 11; g.lineCap = 'round'; g.translate(418, 108);
      for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(8, -6); g.quadraticCurveTo(22, -2, 26, -20); g.stroke(); } }
    if (e === 'stress') { g.strokeStyle = 'rgba(40,20,10,0.55)'; g.lineWidth = 5; g.lineCap = 'round';
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(256 + s * (120 + i * 10), 262 + i * 14); g.quadraticCurveTo(256 + s * (150 + i * 10), 276 + i * 14, 256 + s * (186 + i * 6), 264 + i * 14); g.stroke(); } }
    if (e === 'wrinkle') { g.strokeStyle = 'rgba(40,20,10,0.5)'; g.lineWidth = 5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(196, 84 + i * 15); g.quadraticCurveTo(256, 74 + i * 15, 316, 84 + i * 15); g.stroke(); } }
    if (e === 'bags') { g.strokeStyle = 'rgba(70,30,20,0.55)'; g.lineWidth = 6; g.lineCap = 'round'; for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { g.beginPath(); g.arc(256 + s * 92, 250 + i * 12, 46 + i * 8, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); } }
    if (e === 'nose') { g.strokeStyle = 'rgba(60,25,15,0.75)'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(240, 300); g.quadraticCurveTo(222, 322, 244, 330); g.moveTo(272, 300); g.quadraticCurveTo(290, 322, 268, 330); g.stroke(); }
    if (e === 'freckles') { g.fillStyle = 'rgba(150,80,40,0.55)'; for (const [x, y] of [[150, 300], [172, 314], [132, 318], [362, 300], [340, 314], [380, 318]]) { g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); } }
    if (e === 'shadow') { const gr = g.createLinearGradient(0, 60, 0, 260); gr.addColorStop(0, 'rgba(60,40,120,0.45)'); gr.addColorStop(1, 'rgba(60,40,120,0)'); g.fillStyle = gr; g.fillRect(40, 60, 432, 210); }
    g.restore();
  }
  if (v.mustache) {
    g.save(); g.fillStyle = v.hairColor || '#4a2c1a'; g.strokeStyle = INK; g.lineWidth = 5;
    g.beginPath(); g.moveTo(256, 318); g.bezierCurveTo(220, 296, 168, 304, 150, 342); g.bezierCurveTo(186, 330, 220, 344, 256, 336);
    g.bezierCurveTo(292, 344, 326, 330, 362, 342); g.bezierCurveTo(344, 304, 292, 296, 256, 318); g.fill(); g.stroke(); g.restore();
  }
}

// Expression table: [left eye, right eye, brow L angle/height, brow R, mouth, extras]
const EXPR = {
  smile:    { eyes: ['oval', 'oval'], brows: [[0.12, 0], [0.12, 0]], mouth: 'smile', ex: ['blush'] },
  focus:    { eyes: ['angry', 'angry'], brows: [[-0.35, 16], [-0.35, 16]], mouth: 'tongue', ex: ['sweat'] },
  lockin:   { eyes: ['angry', 'angry'], brows: [[-0.45, 18], [-0.45, 18]], mouth: 'flat', ex: ['sweat', 'stress'] },
  huh:      { eyes: ['oval', 'big'], brows: [[0.4, -14], [-0.1, -30]], mouth: 'o', ex: [] },
  annoyed:  { eyes: ['half', 'half'], brows: [[-0.08, 10], [-0.08, 10]], mouth: 'flat', ex: [] },
  shock:    { eyes: ['tiny', 'tiny'], brows: [[0.35, -30], [0.35, -30]], mouth: 'shock', ex: ['stress', 'bags', 'wrinkle'] },
  angry:    { eyes: ['tinyAngry', 'tinyAngry'], brows: [[-0.55, 22], [-0.55, 22]], mouth: 'grit', ex: ['vein', 'stress', 'bags'] },
  rage:     { eyes: ['tinyAngry', 'tinyAngry'], brows: [[-0.6, 22], [-0.6, 22]], mouth: 'scream', ex: ['redface', 'vein', 'stress', 'bags', 'nose'] },
  cry:      { eyes: ['squeeze', 'squeeze'], brows: [[0.45, -6], [0.45, -6]], mouth: 'wobble', ex: ['tears', 'blush', 'bags', 'nose'] },
  joy:      { eyes: ['happy', 'happy'], brows: [[0.2, -14], [0.2, -14]], mouth: 'big', ex: ['blush'] },
  ecstatic: { eyes: ['star', 'star'], brows: [[0.25, -22], [0.25, -22]], mouth: 'laugh', ex: ['blush'] },
  stare:    { eyes: ['dot', 'dot'], brows: [[0, 4], [0, 4]], mouth: 'flat', ex: ['shadow', 'tear1'] },
  laugh:    { eyes: ['squeeze', 'squeeze'], brows: [[0.2, -16], [0.2, -16]], mouth: 'laugh', ex: ['blush'] },
  smug:     { eyes: ['half', 'half'], brows: [[0.1, 0], [-0.2, -10]], mouth: 'smirk', ex: [] },
  talk:     { eyes: ['oval', 'oval'], brows: [[0.15, -8], [0.15, -8]], mouth: 'talk', ex: ['blush'] },
  guilty:   { eyes: ['look', 'look'], brows: [[0.4, -6], [0.4, -6]], mouth: 'eek', ex: ['sweat'] },
  worried:  { eyes: ['big', 'big'], brows: [[0.45, -10], [0.45, -10]], mouth: 'wobble', ex: ['sweat'] },
};
export const EXPRESSIONS = Object.keys(EXPR);

export function drawFace(variant, name) {
  const e = EXPR[name]; const v = { ...variant };
  const c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d');
  if (variant.freckles && !['rage', 'angry'].includes(name)) extras(g, ['freckles'], v);
  extras(g, e.ex.filter((x) => x !== 'tears' && x !== 'tear1' && x !== 'sweat' && x !== 'vein'), v);
  const ey = 236;
  for (const s of [-1, 1]) {
    const [type] = [e.eyes[s < 0 ? 0 : 1]];
    eye(g, 256 + s * 92, ey, type, { ...v, side: s, lookDir: 1 });
    const [ang, dy] = e.brows[s < 0 ? 0 : 1];
    brow(g, 256 + s * 92, ey - 66 + dy, ang, -s, v.browThick || 11);
  }
  mouth(g, e.mouth, v);
  extras(g, e.ex.filter((x) => ['tears', 'tear1', 'sweat', 'vein'].includes(x)), v);
  if (v.mustache) extras(g, [], v);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function faceSet(variant) {
  const set = {};
  for (const n of EXPRESSIONS) set[n] = drawFace(variant, n);
  return set;
}

// Contact sheet of every face for review.
export function faceSheet(variants) {
  const c = document.createElement('canvas'); c.width = EXPRESSIONS.length * 128; c.height = variants.length * 128; const g = c.getContext('2d');
  variants.forEach((v, r) => EXPRESSIONS.forEach((n, i) => {
    g.fillStyle = v.skin; g.fillRect(i * 128, r * 128, 128, 128);
    g.drawImage(drawFace(v, n).image, i * 128, r * 128, 128, 128);
  }));
  return c.toDataURL();
}
