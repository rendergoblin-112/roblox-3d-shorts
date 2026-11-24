// Locked cameras (style A: the camera never moves inside a shot; one slow push per video at most).
// pos / look in set units, fov = vertical degrees. hide = what the camera "cheats" away for this angle:
//   wall names (back/left/right/front), set objects (monitor, chair, laptop, couch, table), or cast ids (kid, dad...).
// angle ('eye' | 'high' | 'low') and size ('CU' | 'MS' | 'FS' | 'WS' | 'insert') feed `check`; ref names the
// house reference still used by `compare` (examples/wifi-lag/ref/<ref>.jpg).
export const CAMERAS = {
  // ---- kid's bedroom
  backWide:   { set: 'room', pos: [0.4, 6.0, -3.9], look: [5.6, 3.4, 0.4], fov: 54, hide: [], angle: 'eye', size: 'WS', ref: 'wide' },
  mon:        { set: 'room', pos: [1.35, 3.9, -0.05], look: [6.7, 3.9, -0.05], fov: 40.5, hide: ['kid', 'chair'], angle: 'eye', size: 'insert', ref: 'insert' },
  front:      { set: 'room', pos: [8.7, 4.55, 0.25], look: [4.7, 3.55, 0.1], fov: 40, hide: ['right', 'monitor'], angle: 'eye', size: 'MS', ref: 'front_ms' },
  frontClose: { set: 'room', pos: [8.4, 4.3, 0.15], look: [4.8, 3.45, 0.1], fov: 34, hide: ['right', 'monitor'], angle: 'eye', size: 'CU', ref: 'reaction_cu' },
  high:       { set: 'room', pos: [6.4, 7.6, 2.8], look: [4.0, 2.6, 0.1], fov: 54, hide: ['right'], angle: 'high', size: 'MS', ref: 'high' },
  side:       { set: 'room', pos: [4.9, 4.2, 6.2], look: [5.0, 3.0, 0.0], fov: 54, hide: ['front'], angle: 'eye', size: 'MS', ref: 'front_ms' },
  wideHigh:   { set: 'room', pos: [-2.5, 8.6, 6.0], look: [4.4, 2.2, -0.5], fov: 56, hide: ['front', 'left'], angle: 'high', size: 'WS', ref: 'high' },
  // ---- sister's room
  sisWide:    { set: 'sis', pos: [4.6, 4.3, 4.6], look: [1.1, 2.7, 0.5], fov: 50, hide: ['right'], angle: 'eye', size: 'FS', ref: 'sibling' },
  sisHigh:    { set: 'sis', pos: [3.4, 8.2, 6.4], look: [0.8, 2.0, 0.0], fov: 54, hide: [], angle: 'high', size: 'FS', ref: 'sibling' },
  // ---- living room (dining table with laptop on the right, couch + TV on the left)
  momWide:    { set: 'living', pos: [2.4, 7.4, -2.2], look: [1.0, 3.5, 3.2], fov: 48, hide: ['back'], angle: 'high', size: 'MS', ref: 'table' },
  call:       { set: 'living', pos: [2.7, 5.3, 4.6], look: [1.0, 3.25, 0.35], fov: 36, hide: ['front'], angle: 'high', size: 'insert', ref: 'insert' },
  laptop:     { set: 'living', pos: [1.0, 3.9, 4.2], look: [1.0, 3.27, 0.3], fov: 34, hide: ['front', 'chair', 'mom', 'dad'], angle: 'eye', size: 'insert', ref: 'insert' }, // straight-on laptop screen (whoever sits there is hidden)
  dadWide:    { set: 'living', pos: [-9.5, 5.4, 10.6], look: [-9.5, 3.4, 0.9], fov: 64, hide: ['front'], angle: 'eye', size: 'WS', ref: 'sofa' },
  dadFace:    { set: 'living', pos: [-13.0, 6.3, 5.6], look: [-7.2, 3.4, 1.2], fov: 50, hide: [], angle: 'high', size: 'MS', ref: 'sofa' },
  famWide:    { set: 'living', pos: [-2.5, 7.4, -11.0], look: [-2.5, 2.4, 2.0], fov: 52, hide: ['back'], angle: 'high', size: 'WS', ref: 'twoshot' },
  // ---- hallway, exterior
  router:     { set: 'hall', pos: [-0.2, 4.0, -0.4], look: [-0.15, 3.05, -3.1], fov: 44, hide: [], angle: 'high', size: 'insert', ref: 'insert' },
  ext:        { set: 'ext', pos: [0, 3.6, 27], look: [0, 6.5, -4], fov: 52, hide: [], angle: 'low', size: 'WS', ref: 'night' },
};
