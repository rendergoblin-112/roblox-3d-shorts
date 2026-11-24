// Our own blocky family. Not R6/R15: head is ~0.9x torso width (R6 is 0.63), legs are ~0.7x torso height (R6 is 1.0),
// every part is rounded, arms end in round mitten hands, shoes are separate. Faces are flat decals swapped whole.
import * as THREE from 'three';
import { box, sphere, cyl, mat, D2R, lerp } from './util.js';
import { faceSet } from './faces.js';

const P = { legW: 0.66, legH: 1.0, legD: 0.74, torW: 1.7, torH: 1.45, torD: 0.98, armW: 0.5, armH: 1.15, handR: 0.31, headW: 1.52, headH: 1.38, headD: 1.32 };

function hair(head, spec, hh) {
  const c = mat(spec.hair ?? '#3b2416', { rough: 0.75 });
  const W = P.headW, D = P.headD, top = hh;
  if (spec.hairStyle === 'kid') { // messy tufts + fringe
    box(head, W + 0.08, 0.34, D + 0.08, c, 0, top - 0.08, 0, { r: 0.16 });
    box(head, W + 0.1, 0.5, 0.36, c, 0, top - 0.42, -D / 2 + 0.12, { r: 0.16 });
    for (const [x, z, rz, s] of [[-0.45, 0.25, 0.5, 1], [0.05, 0.4, -0.2, 1.1], [0.5, 0.15, -0.6, 0.9], [-0.15, -0.3, 0.3, 1], [0.35, -0.35, -0.3, 0.9]]) {
      const t = box(head, 0.42 * s, 0.38 * s, 0.42 * s, c, x, top + 0.1, z, { r: 0.12 }); t.rotation.set(0.2 * z, 0.4, rz);
    }
    box(head, 0.95, 0.24, 0.3, c, -0.18, top - 0.24, D / 2 - 0.02, { r: 0.1, rz: 0.12 }); // fringe
    box(head, 0.2, 0.55, 0.9, c, -W / 2 - 0.02, top - 0.42, -0.1, { r: 0.08 });
    box(head, 0.2, 0.55, 0.9, c, W / 2 + 0.02, top - 0.42, -0.1, { r: 0.08 });
  } else if (spec.hairStyle === 'buns') { // two space buns + bangs + side locks
    box(head, W + 0.08, 0.36, D + 0.08, c, 0, top - 0.1, 0, { r: 0.17 });
    box(head, W + 0.08, 1.05, 0.4, c, 0, top - 0.6, -D / 2 + 0.1, { r: 0.18 });
    sphere(head, 0.36, c, -0.58, top + 0.18, -0.08); sphere(head, 0.36, c, 0.58, top + 0.18, -0.08);
    cyl(head, 0.2, 0.2, 0.1, mat('#ffd23a'), -0.48, top + 0.0, -0.06, { rz: 0.6 }); cyl(head, 0.2, 0.2, 0.1, mat('#ffd23a'), 0.48, top + 0.0, -0.06, { rz: -0.6 });
    box(head, W + 0.06, 0.26, 0.28, c, 0, top - 0.25, D / 2 - 0.04, { r: 0.1 }); // bangs
    box(head, 0.24, 1.2, 0.5, c, -W / 2 - 0.04, top - 0.72, 0.18, { r: 0.1 }); box(head, 0.24, 1.2, 0.5, c, W / 2 + 0.04, top - 0.72, 0.18, { r: 0.1 });
  } else if (spec.hairStyle === 'bun') { // big curly top bun, swept sides
    box(head, W + 0.1, 0.42, D + 0.1, c, 0, top - 0.1, 0, { r: 0.2 });
    box(head, W + 0.12, 0.95, 0.42, c, 0, top - 0.52, -D / 2 + 0.1, { r: 0.2 });
    sphere(head, 0.52, c, 0, top + 0.42, -0.15, { sy: 0.85 });
    for (const a of [0, 1.3, 2.6, 3.9, 5.2]) sphere(head, 0.22, c, Math.cos(a) * 0.42, top + 0.42 + Math.sin(a) * 0.12, -0.15 + Math.sin(a) * 0.38);
    box(head, 0.95, 0.24, 0.3, c, 0.28, top - 0.2, D / 2 - 0.02, { r: 0.12, rz: -0.18 });
    box(head, 0.26, 0.9, 0.7, c, -W / 2 - 0.05, top - 0.5, 0.0, { r: 0.12 }); box(head, 0.26, 0.9, 0.7, c, W / 2 + 0.05, top - 0.5, 0.0, { r: 0.12 });
    sphere(head, 0.08, mat('#ffd23a', { rough: 0.3 }), -W / 2 - 0.08, top - 1.02, 0.15); sphere(head, 0.08, mat('#ffd23a', { rough: 0.3 }), W / 2 + 0.08, top - 1.02, 0.15);
  } else if (spec.hairStyle === 'dad') { // short neat side part, slightly receding
    box(head, W + 0.06, 0.26, D - 0.1, c, 0, top - 0.06, -0.12, { r: 0.12 });
    box(head, W + 0.06, 0.62, 0.3, c, 0, top - 0.32, -D / 2 + 0.08, { r: 0.12 });
    box(head, 0.7, 0.2, 0.36, c, 0.32, top + 0.02, 0.36, { r: 0.09, rz: -0.12 });
    box(head, 0.16, 0.5, 0.7, c, -W / 2 - 0.01, top - 0.4, -0.15, { r: 0.07 }); box(head, 0.16, 0.5, 0.7, c, W / 2 + 0.01, top - 0.4, -0.15, { r: 0.07 });
  }
  // 'none': bald blank head (the starter avatar look)
}

export function makeChar(spec) {
  const root = new THREE.Group(); root.name = spec.name || 'char';
  const s = { ...P }; if (spec.wide) { s.torW = 1.95; s.torD = 1.18; }
  const trim = spec.trim ?? '#e5600c';
  const skin = mat(spec.skin ?? '#e8a874', { rough: 0.55 }), shirt = mat(spec.shirt), pants = mat(spec.pants), shoe = mat(spec.shoes, { rough: 0.5 }), sole = mat(spec.sole);
  const body = new THREE.Group(); root.add(body); body.scale.setScalar(spec.scale ?? 1);
  const hips = new THREE.Group(); hips.position.y = s.legH; body.add(hips);
  // legs (pivot at hip)
  const legs = [-1, 1].map((side) => {
    const g = new THREE.Group(); g.position.set(side * 0.38, 0, 0); hips.add(g);
    box(g, s.legW, s.legH, s.legD, pants, 0, -s.legH / 2 + 0.06, 0, { r: 0.16 });
    box(g, s.legW + 0.06, 0.3, s.legD + 0.2, shoe, 0, -s.legH + 0.12, 0.08, { r: 0.14 });
    box(g, s.legW + 0.08, 0.1, s.legD + 0.22, sole, 0, -s.legH + 0.0, 0.08, { r: 0.04 });
    return g;
  });
  // torso (pivot at hips)
  const torso = new THREE.Group(); hips.add(torso);
  box(torso, s.torW, s.torH, s.torD, shirt, 0, s.torH / 2, 0, { r: 0.22 });
  if (spec.hood) { // hoodie: pocket, strings, hood roll, chest bolt
    box(torso, s.torW * 0.6, 0.36, 0.06, mat(trim), 0, 0.36, s.torD / 2, { r: 0.08 });
    box(torso, 0.07, 0.42, 0.06, mat('#ffffff'), -0.22, s.torH - 0.36, s.torD / 2 + 0.01, { r: 0.03 }); box(torso, 0.07, 0.42, 0.06, mat('#ffffff'), 0.22, s.torH - 0.36, s.torD / 2 + 0.01, { r: 0.03 });
    box(torso, s.torW * 0.85, 0.34, 0.5, mat(trim), 0, s.torH - 0.02, -s.torD / 2 + 0.12, { r: 0.16 });
    const bolt = new THREE.Shape([[0.1, 0.32], [-0.14, -0.02], [0.0, -0.02], [-0.08, -0.32], [0.16, 0.06], [0.02, 0.06]].map(([x, y]) => new THREE.Vector2(x, y)));
    const bm = new THREE.Mesh(new THREE.ExtrudeGeometry(bolt, { depth: 0.04, bevelEnabled: false }), mat(spec.shirt2)); bm.position.set(0.0, s.torH * 0.66, s.torD / 2 - 0.005); torso.add(bm);
  }
  if (spec.cardigan) { // open cardigan over a contrasting top
    box(torso, s.torW * 0.42, s.torH * 0.9, 0.06, mat(spec.shirt2), 0, s.torH * 0.5, s.torD / 2, { r: 0.05 });
    for (const y of [0.45, 0.75, 1.05]) sphere(torso, 0.05, mat('#ffffff'), s.torW * 0.24, y, s.torD / 2 + 0.03);
  }
  if (spec.polo) { // polo collar + placket + belt
    box(torso, s.torW * 0.7, 0.14, s.torD * 0.9, mat(trim), 0, s.torH - 0.02, 0, { r: 0.05 });
    box(torso, 0.18, 0.5, 0.05, mat(spec.shirt2 ?? '#ffffff'), 0, s.torH - 0.32, s.torD / 2 + 0.005, { r: 0.03 });
    box(torso, s.torW + 0.02, 0.18, s.torD + 0.02, mat('#6b4a2a'), 0, 0.12, 0, { r: 0.06 }); // belt
    box(torso, 0.26, 0.16, 0.05, mat('#e8c25a', { rough: 0.35 }), 0, 0.12, s.torD / 2 + 0.02, { r: 0.02 });
  }
  if (spec.heart) { // white heart on tee
    const h = new THREE.Shape(); h.moveTo(0, -0.18); h.bezierCurveTo(-0.3, 0.02, -0.16, 0.24, 0, 0.1); h.bezierCurveTo(0.16, 0.24, 0.3, 0.02, 0, -0.18);
    const hm = new THREE.Mesh(new THREE.ExtrudeGeometry(h, { depth: 0.04, bevelEnabled: false }), mat('#ffffff')); hm.position.set(0, s.torH * 0.6, s.torD / 2 - 0.005); torso.add(hm);
  }
  // arms (pivot at shoulder)
  const arms = [-1, 1].map((side) => {
    const g = new THREE.Group(); g.position.set(side * (s.torW / 2 + s.armW / 2 + 0.02), s.torH - 0.22, 0); torso.add(g);
    box(g, s.armW, s.armH, s.armW + 0.04, spec.cardigan ? mat(spec.shirt) : shirt, 0, -s.armH / 2 + 0.2, 0, { r: 0.2 });
    box(g, s.armW + 0.06, 0.16, s.armW + 0.1, (spec.hood || spec.polo) ? mat(trim) : shirt, 0, -s.armH + 0.24, 0, { r: 0.06 });
    const hand = new THREE.Group(); hand.position.set(0, -s.armH + 0.02, 0); g.add(hand);
    sphere(hand, s.handR, skin, 0, 0, 0);
    return { g, hand };
  });
  // head (pivot at neck)
  const head = new THREE.Group(); head.position.y = s.torH + 0.02; torso.add(head);
  box(head, s.headW, s.headH, s.headD, skin, 0, s.headH / 2, 0, { r: 0.36 });
  hair(head, spec, s.headH);
  if (spec.headset) { // signature teal headset
    const t = mat('#16c7c1', { rough: 0.45 }), dk = mat('#0d4f63', { rough: 0.5 });
    box(head, s.headW + 0.36, 0.2, 0.34, t, 0, s.headH + 0.24, 0.0, { r: 0.09 });
    for (const side of [-1, 1]) {
      box(head, 0.16, 0.6, 0.24, t, side * (s.headW / 2 + 0.14), s.headH - 0.04, 0, { r: 0.07 });
      cyl(head, 0.34, 0.34, 0.24, t, side * (s.headW / 2 + 0.12), s.headH * 0.46, 0, { rz: Math.PI / 2 });
      cyl(head, 0.24, 0.24, 0.26, dk, side * (s.headW / 2 + 0.14), s.headH * 0.46, 0, { rz: Math.PI / 2 });
    }
    const boom = box(head, 0.08, 0.08, 0.7, dk, s.headW / 2 + 0.1, s.headH * 0.3, 0.38, { r: 0.03 }); boom.rotation.y = -0.35;
    sphere(head, 0.09, mat('#16c7c1'), s.headW / 2 - 0.05, s.headH * 0.28, 0.7);
  }
  if (spec.glasses) {
    const fr = mat('#151515', { rough: 0.4 });
    for (const side of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 10, 28), fr); ring.position.set(side * 0.3, s.headH * 0.56, s.headD / 2 + 0.06); head.add(ring);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshStandardMaterial({ color: '#cfe9ff', transparent: true, opacity: 0.18, roughness: 0.1 })); lens.position.copy(ring.position); head.add(lens);
    }
    box(head, 0.2, 0.05, 0.05, fr, 0, s.headH * 0.58, s.headD / 2 + 0.06, { r: 0.02 });
  }
  // face decal
  const faces = faceSet({ skin: spec.skin ?? '#e8a874', lashes: spec.lashes, mustache: spec.mustache, hairColor: spec.hair, freckles: spec.freckles, browThick: spec.browThick ?? 11 });
  const faceMat = new THREE.MeshStandardMaterial({ map: faces.smile, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 1.42), faceMat); face.position.set(0, s.headH * 0.45, s.headD / 2 + 0.006); head.add(face);

  root.traverse((o) => { if (o.isMesh && o !== face && o.material.transparent !== true) { o.castShadow = true; o.receiveShadow = true; } });
  const ch = { root, body, hips, torso, head, legs, arms, faces, face, spec, dims: s, curFace: 'smile' };
  ch.setFace = (n) => {
    if (!faces[n]) throw new Error(`Unknown face "${n}" on ${root.name}. Faces: ${Object.keys(faces).join(', ')}`);
    if (ch.curFace !== n) { faceMat.map = faces[n]; faceMat.needsUpdate = true; ch.curFace = n; }
  };
  ch.hand = (side) => arms[side === 'L' ? 1 : 0].hand; // character's left is +x
  return ch;
}

// Pose: degrees. al/ar = [x,y,z] for left/right arm (z positive = outward on both sides), ll/lr = leg x.
export const POSE0 = { x: 0, y: 0, z: 0, ry: 0, tx: 0, ty: 0, tz: 0, hx: 0, hy: 0, hz: 0, al: [0, 0, 4], ar: [0, 0, 4], ll: 0, lr: 0, lz: 0 };
export function blendPose(a, b, t) {
  const o = {};
  for (const k of Object.keys(POSE0)) {
    const va = a[k] ?? POSE0[k], vb = b[k] ?? POSE0[k];
    o[k] = Array.isArray(va) ? va.map((x, i) => lerp(x, vb[i], t)) : lerp(va, vb, t);
  }
  return o;
}
export function applyPose(ch, p) {
  p = { ...POSE0, ...p };
  ch.root.position.set(p.x, p.y, p.z); ch.root.rotation.y = p.ry * D2R;
  ch.torso.rotation.set(p.tx * D2R, p.ty * D2R, p.tz * D2R);
  ch.head.rotation.set(p.hx * D2R, p.hy * D2R, p.hz * D2R);
  const [L, R] = [ch.arms[1].g, ch.arms[0].g];
  L.rotation.set(p.al[0] * D2R, p.al[1] * D2R, p.al[2] * D2R);
  R.rotation.set(p.ar[0] * D2R, -p.ar[1] * D2R, -p.ar[2] * D2R);
  ch.legs[1].rotation.set(p.ll * D2R, 0, p.lz * D2R); ch.legs[0].rotation.set(p.lr * D2R, 0, -p.lz * D2R);
}
// Seated: root y so the hips sit on a seat of height seatH (world units, after scale)
export function seatY(spec, seatH) { const sc = spec.scale ?? 1; return seatH - P.legH * sc + 0.3 * sc; }
