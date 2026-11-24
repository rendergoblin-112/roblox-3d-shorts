// Pose library. A pose = a SPOT (where in which set: x, z, facing ry, and either y or a seat height) + a SHAPE
// (body angles in degrees). Any cast member can take any pose; seated heights adapt to their size.
// Pure data: no three.js import, so the Node tools can read it too.
//
// Shape fields (degrees): tx/ty/tz torso, hx/hy/hz head, al/ar = [x, y, z] left/right arm
// (x negative = forward/up, z positive = outward on both sides), ll/lr leg swing (-90 = seated), lz leg spread.
// Use a pose in a shot key as:  'desk.lean'  |  { spot: 'room.desk', shape: 'sit.cheer', hz: 10 }  |  a name from your POSES.

export const SPOTS = {
  'room.desk':     { x: 4.15, z: 0.1, ry: 90, seat: 1.41 },  // gaming chair at the bedroom desk, facing the monitor (+x)
  'room.deskSide': { x: 3.6, z: 0.1, ry: 90, y: 0 },         // standing beside the desk (chair rolled back)
  'room.behind':   { x: 2.4, z: -1.9, ry: 90, y: 0 },        // standing behind the gaming chair, watching the monitor (seen in front/frontClose/high)
  'sis.rug':       { x: 0.6, z: 0.4, ry: 72, y: 0 },         // sister's rug, facing her phone on the ring light
  'living.table':  { x: 1.0, z: 3.25, ry: 180, seat: 1.32 }, // dining chair, facing the laptop (-z)
  'living.couch':  { x: -6.0, z: 1.2, ry: -90, seat: 1.416 },// couch, facing the TV (-x)
};

const SEAT = { ll: -90, lr: -90 };
export const SHAPES = {
  // ---- seated (legs at -90)
  'sit.type':    { ...SEAT, tx: 14, hx: -6, al: [-82, 0, 4], ar: [-82, 0, 4] },
  'sit.lean':    { ...SEAT, tx: 20, hx: -28, al: [-92, 0, 2], ar: [-92, 0, 2] },
  'sit.press':   { ...SEAT, tx: 22, hx: -28, al: [-92, 0, 2], ar: [-116, 0, 2] },
  'sit.slamUp':  { ...SEAT, tx: 4, hx: -10, al: [-90, 0, 4], ar: [-178, 0, 8] },
  'sit.slam':    { ...SEAT, tx: 34, hx: 10, al: [-90, 0, 4], ar: [-70, 0, 2] },
  'sit.huh':     { ...SEAT, tx: 6, hx: -2, hz: 16, ty: -8, al: [-82, 0, 4], ar: [-40, 0, 24] },
  'sit.slump':   { ...SEAT, tx: -14, hx: -10, hz: -6, al: [6, 0, 22], ar: [6, 0, 22] },
  'sit.cheeks':  { ...SEAT, tx: 18, hx: -8, al: [-150, 0, -26], ar: [-150, 0, -26] },
  'sit.grab':    { ...SEAT, tx: 10, hx: -14, al: [-162, 0, -34], ar: [-162, 0, -34] },
  'sit.scream':  { ...SEAT, tx: -10, hx: -26, al: [-160, 0, 40], ar: [-160, 0, 40] },
  'sit.victory': { ...SEAT, tx: -8, hx: -18, al: [-172, 0, 26], ar: [-172, 0, 26] },
  'sit.knuckle': { ...SEAT, tx: 10, hx: 4, al: [-100, -30, -10], ar: [-100, -30, -10] },
  'sit.wave':    { ...SEAT, tx: 4, al: [-30, 0, 8], ar: [-165, 0, 22], hz: 8 },
  'sit.wave2':   { ...SEAT, tx: 4, al: [-30, 0, 8], ar: [-165, 0, -6], hz: -6 },
  'sit.laugh':   { ...SEAT, tx: -14, hx: -18, al: [-40, 0, 14], ar: [-60, 0, 30] },
  'sit.freeze':  { ...SEAT, tx: -6, hx: -16, hy: 0, ty: 0, al: [-60, 0, 8], ar: [-60, 0, 8] },
  'sit.rest':    { ...SEAT, tx: -6, al: [-20, 0, 10], ar: [-40, 0, 10] },
  'sit.cheer':   { ...SEAT, tx: -10, hx: -16, al: [-172, 0, 24], ar: [-172, 0, 24] },
  'sit.pump':    { ...SEAT, tx: 10, hx: 0, al: [-100, 0, 30], ar: [-150, 0, 10] },
  'sit.turnLook':{ ...SEAT, tx: 0, hx: -18, hy: -70, ty: -28, al: [-50, 0, 10], ar: [-50, 0, 10] },
  'sit.pointLaugh': { ...SEAT, tx: -12, hx: -18, hz: 8, al: [-40, 0, -14], ar: [-96, 0, 4] },
  'sit.smug':    { ...SEAT, tx: -6, hx: -10, hz: -6, al: [-70, 0, 4], ar: [-158, 0, -30] }, // hand up to the face (glasses push)
  'sit.shrug':   { ...SEAT, tx: -4, hx: -6, hz: 10, al: [-50, 0, 46], ar: [-50, 0, 46] },
  // ---- standing
  'stand.idle':    { al: [0, 0, 6], ar: [0, 0, 6] },
  'stand.grab':    { tx: 8, hx: 10, al: [-162, 0, -34], ar: [-162, 0, -34] },
  'stand.cry':     { tx: 2, hx: -10, al: [-150, 0, -24], ar: [-150, 0, -24] },
  'stand.flail1':  { tx: -10, hx: -26, al: [-175, 0, 50], ar: [-120, 0, 60], ll: -10, lr: 8 },
  'stand.flail2':  { tx: -12, hx: -28, al: [-120, 0, 60], ar: [-175, 0, 50], ll: 8, lr: -10 },
  'stand.fists':   { tx: 12, hx: -6, al: [-20, 0, 30], ar: [-20, 0, 30], ll: -8, lr: 8 },
  'stand.v':       { al: [-160, 0, 36], ar: [-160, 0, 36], hz: 8 },
  'stand.point':   { ty: 14, tz: -6, al: [-20, 0, 26], ar: [-150, 0, 6], hz: -10, ll: 0, lr: -16 },
  'stand.hip':     { ty: -14, tz: 8, al: [-30, 0, 60], ar: [-170, 0, 18], hz: 12, ll: -16 },
  'stand.peace':   { al: [-125, 20, -20], ar: [0, 0, 18], hz: 14, tz: 4 },
  'stand.stop':    { al: [0, 0, 6], ar: [-60, 0, 8], hx: 8 },
  'stand.cheer':   { tx: -8, hx: -18, al: [-172, 0, 24], ar: [-172, 0, 24] },
  'stand.laugh':   { tx: -12, hx: -22, al: [-38, 0, -16], ar: [-38, 0, -16] },                   // hands on belly, head back
  'stand.pointLaugh': { tx: -8, hx: -16, hz: 8, al: [-38, 0, -16], ar: [-96, 0, 4] },           // one arm points at the screen
  'stand.doubleOver': { tx: 30, hx: -24, al: [-30, 0, -18], ar: [-30, 0, -18], ll: -6, lr: 6 }, // bent over laughing
  'stand.facepalm':   { tx: 6, hx: 16, al: [0, 0, 6], ar: [-150, 0, -30] },
  'stand.shock':      { tx: -6, hx: -12, al: [-40, 0, 40], ar: [-40, 0, 40] },                  // arms out, leaning back
  'stand.lean':       { tx: 18, hx: -16, al: [-24, 0, 6], ar: [-24, 0, 6] },                     // leaning in to look
  'stand.shrug':      { hz: 10, al: [-50, 0, 46], ar: [-50, 0, 46] },
  'stand.smug':       { tx: -4, hx: -8, hz: -6, al: [0, 0, 6], ar: [-158, 0, -30] },
};

// Named poses used by the example and handy defaults: [spot, shape]
export const POSES = {
  // kid at the desk
  'desk.type': ['room.desk', 'sit.type'], 'desk.lean': ['room.desk', 'sit.lean'], 'desk.press': ['room.desk', 'sit.press'],
  'desk.slamUp': ['room.desk', 'sit.slamUp'], 'desk.slam': ['room.desk', 'sit.slam'], 'desk.huh': ['room.desk', 'sit.huh'],
  'desk.slump': ['room.desk', 'sit.slump'], 'desk.cheeks': ['room.desk', 'sit.cheeks'], 'desk.grab': ['room.desk', 'sit.grab'],
  'desk.scream': ['room.desk', 'sit.scream'], 'desk.victory': ['room.desk', 'sit.victory'], 'desk.knuckle': ['room.desk', 'sit.knuckle'],
  'desk.laugh': ['room.desk', 'sit.laugh'], 'desk.pointLaugh': ['room.desk', 'sit.pointLaugh'], 'desk.smug': ['room.desk', 'sit.smug'],
  // standing beside the desk
  'deskSide.grab': ['room.deskSide', 'stand.grab'], 'deskSide.cry': ['room.deskSide', 'stand.cry'], 'deskSide.flail1': ['room.deskSide', 'stand.flail1'],
  'deskSide.flail2': ['room.deskSide', 'stand.flail2'], 'deskSide.fists': ['room.deskSide', 'stand.fists'],
  // watching over the gamer's shoulder
  'behind.idle': ['room.behind', 'stand.idle'], 'behind.lean': ['room.behind', 'stand.lean'], 'behind.pointLaugh': ['room.behind', 'stand.pointLaugh'],
  'behind.laugh': ['room.behind', 'stand.laugh'], 'behind.shock': ['room.behind', 'stand.shock'], 'behind.facepalm': ['room.behind', 'stand.facepalm'],
  // sister on her rug
  'rug.v': ['sis.rug', 'stand.v'], 'rug.point': ['sis.rug', 'stand.point'], 'rug.hip': ['sis.rug', 'stand.hip'], 'rug.peace': ['sis.rug', 'stand.peace'], 'rug.stop': ['sis.rug', 'stand.stop'],
  // dining table (laptop)
  'table.wave1': ['living.table', 'sit.wave'], 'table.wave2': ['living.table', 'sit.wave2'], 'table.laugh': ['living.table', 'sit.laugh'], 'table.freeze': ['living.table', 'sit.freeze'],
  'table.type': ['living.table', 'sit.type'], 'table.lean': ['living.table', 'sit.lean'], 'table.smug': ['living.table', 'sit.smug'],
  // couch (TV)
  'couch.sit': ['living.couch', 'sit.rest'], 'couch.cheer': ['living.couch', 'sit.cheer'], 'couch.pump': ['living.couch', 'sit.pump'], 'couch.freeze': ['living.couch', 'sit.turnLook'],
};

// Resolve a pose reference for one cast spec. lib = { SPOTS, SHAPES, POSES } (library merged with the project's).
export function resolvePose(ref, spec, lib, seen = 0) {
  if (seen > 8) throw new Error('pose reference loop');
  if (typeof ref === 'string') {
    const p = lib.POSES[ref];
    if (!p) throw new Error(`Unknown pose "${ref}". Add it to POSES in short.js or use { spot, shape }.`);
    return resolvePose(p, spec, lib, seen + 1);
  }
  if (Array.isArray(ref)) { const [spot, shape, over] = ref; return resolvePose({ spot, shape, ...(over || {}) }, spec, lib, seen + 1); }
  const { spot, shape, from, ...over } = ref;
  let base = {};
  if (from) base = resolvePose(from, spec, lib, seen + 1);
  const sp = spot ? lib.SPOTS[spot] : null; if (spot && !sp) throw new Error(`Unknown spot "${spot}"`);
  const sh = shape ? lib.SHAPES[shape] : null; if (shape && !sh) throw new Error(`Unknown shape "${shape}"`);
  const out = { ...base, ...(sp || {}), ...(sh || {}), ...over };
  const seat = over.seat ?? sp?.seat;
  if (seat != null && over.y == null) { const sc = spec.scale ?? 1; out.y = seat - 1.0 * sc + 0.3 * sc; }
  delete out.seat;
  return out;
}
