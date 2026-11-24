// The default cast: our own blocky family. A project can override any field (CAST in short.js) or add new members.
// Not R6/R15: see references/characters-and-faces.md for the proportions and why.
//
// Spec fields
//   skin, shirt, shirt2 (accent), trim (cuffs/pocket/collar), pants, shoes, sole, hair  colours
//   hairStyle: 'kid' | 'buns' | 'bun' | 'dad' | 'none'
//   scale: overall size (kid 0.82, sis 0.9, mom 1.0, dad 1.08)
//   flags: hood (hoodie + bolt), cardigan, polo (collar, placket, belt), heart (tee print), headset, glasses,
//          mustache, freckles, lashes, wide (broader torso), browThick (face brow weight)
export const DEFAULT_CAST = {
  kid: { name: 'Kid', skin: '#e8a874', shirt: '#ff7417', shirt2: '#ffd23a', trim: '#e5600c', pants: '#2f5fb3', shoes: '#ffffff', sole: '#e8333a', hair: '#3b2416', hairStyle: 'kid', scale: 0.82, headset: true, freckles: true, hood: true },
  sis: { name: 'Sis', skin: '#e8a874', shirt: '#ff4f9a', shirt2: '#ffffff', pants: '#7b4fe0', shoes: '#ffffff', sole: '#ff4f9a', hair: '#2a1a12', hairStyle: 'buns', scale: 0.9, lashes: true, heart: true },
  mom: { name: 'Mom', skin: '#e8a874', shirt: '#9a5cf2', shirt2: '#ffd23a', pants: '#1fa6a0', shoes: '#5a3a8a', sole: '#3a2560', hair: '#b7431f', hairStyle: 'bun', scale: 1.0, lashes: true, cardigan: true },
  dad: { name: 'Dad', skin: '#e8a874', shirt: '#38b25a', shirt2: '#ffffff', trim: '#2e9a4c', pants: '#c9a26a', shoes: '#4a2e1c', sole: '#2a1a10', hair: '#3a2416', hairStyle: 'dad', scale: 1.08, glasses: true, mustache: true, wide: true, polo: true, browThick: 14 },
};

// Where each family member lives when a shot doesn't say otherwise, and the pose they hold there.
export const DEFAULT_PLACEMENT = { room: ['kid'], sis: ['sis'], living: ['mom', 'dad'], hall: [], ext: [] };
export const DEFAULT_REST = {
  kid: ['desk.type', 'focus'],
  sis: ['rug.v', 'joy'],
  mom: ['table.wave1', 'talk'],
  dad: ['couch.sit', 'smile'],
};

// In-game avatar looks. 'default' is a blank starter avatar (all grey, no hair, plain smile): reads as "new player".
// It is our own design, not the stock Roblox look (no yellow/blue/green colour scheme, rounded parts, mitten hands).
export const AVATAR_LOOKS = {
  default: { shirt: '#a7b0ba', shirt2: '#a7b0ba', trim: '#98a1ab', pants: '#6b737d', shoes: '#5a616a', sole: '#3c4148', hairStyle: 'none', hood: false, cardigan: false, polo: false, heart: false, headset: false, glasses: false, mustache: false, freckles: false, lashes: false, wide: false },
};

export function castSpec(cast, id) {
  const s = cast[id];
  if (!s) throw new Error(`Unknown cast member "${id}". Known: ${Object.keys(cast).join(', ')}`);
  return s;
}
