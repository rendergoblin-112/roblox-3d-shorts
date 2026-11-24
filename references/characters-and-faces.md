# Characters and faces

## The family (default cast)

Our own blocky family, built from code in `template/engine/rig.js` (geometry) and `template/engine/cast.js` (data). Use them as the default cast for every short so the channel has recurring characters.

| id | Look | Signature | scale |
|---|---|---|---|
| `kid` | orange hoodie with a yellow lightning bolt, blue jeans, white shoes with red soles, messy dark hair, freckles | **orange hoodie + teal over-ear gaming headset with mic**. His in-game avatar wears the same, so the signature shows twice | 0.82 |
| `sis` | pink tee with a white heart, purple leggings, two space buns with yellow scrunchies, lashes | | 0.90 |
| `mom` | purple cardigan over yellow, teal trousers, big auburn curly bun, gold earrings, lashes | | 1.00 |
| `dad` | green polo (collar, placket), belt, khakis, round black glasses, mustache, neat side part, wider torso | | 1.08 |

## Proportions: deliberately NOT the stock avatar

The genre uses blocky people, but the stock R6/R15 rig and its geometry must not be copied. Ours breaks it on purpose:

| Measure | Ours | Stock R6 |
|---|---|---|
| Head width / torso width | ≈0.9 (1.52 / 1.70) | 0.63 |
| Legs / torso height | ≈0.69 (1.0 / 1.45) | 1.03 |
| Edges | every part a rounded box | square |
| Hands | round mitten hands | none |
| Shoes | separate shoes with coloured soles | none |
| Hair | built from shapes | hair meshes |

Base dimensions (units, before `scale`): torso 1.70×1.45×0.98 (wide: 1.95×…×1.18), arms 0.5×1.15, hands r 0.31, legs 0.66×1.0×0.74, head 1.52×1.38×1.32. Pivots: shoulders at the top of the arms, hips at the top of the legs, neck at the torso top.

Never use: the stock avatar look or geometry, the yellow-head/blue-torso/green-legs colour scheme, any real game's characters, logos or UI.

## Changing or adding cast (data only)

```js
// short.js
export const CAST = {
  kid: { shirt: '#2f9bff', trim: '#1f6fcc' },                   // recolour the kid's hoodie
  grandma: { name: 'Grandma', skin: '#e8a874', shirt: '#c0392b', pants: '#5a4a6a', shoes: '#333', sole: '#111',
             hair: '#dddddd', hairStyle: 'bun', scale: 0.95, glasses: true, cardigan: true, shirt2: '#ffffff', lashes: true },
};
export const PLACEMENT = { living: ['mom', 'dad', 'grandma'] };   // who lives in which set by default
export const REST = { grandma: ['couch.sit', 'smile'] };          // what they do when a shot doesn't animate them
```

Spec fields: `skin, shirt, shirt2, trim, pants, shoes, sole, hair` (colours); `hairStyle: kid | buns | bun | dad | none`; `scale`; flags `hood, cardigan, polo, heart, headset, glasses, mustache, freckles, lashes, wide`; `browThick`.

Anyone keyed in a shot is added to that set automatically; anyone in a set without keys or a rest pose is hidden.

## In-game avatars

`GAME.avatars` in short.js. `{ cast: 'kid' }` copies a family member (shrunk to 0.55). `look: 'default'` is a blank starter avatar (all grey, bald, plain smile) that reads as "new player"; it is our own design. `look: { ...spec }` for anything else; `tag: 'name'` draws a name tag above the head.

## Faces

Faces are **flat decals on the head front, swapped whole at every emotional beat**: no moving brows, eyes or mouths (15/17 shorts). The study counted ≥ 6 swaps per short (style A median 8.5, range 6–25); our kid swaps 17 times.

17 expressions per character, drawn on canvas in `engine/faces.js` (thick ink outlines, glossy oval eyes, rosy cheeks):

| Group | Faces |
|---|---|
| Base | `smile`, `focus` (tongue out, sweat), `lockin` (narrowed, stress lines), `huh` (one eye big, o-mouth), `annoyed` (half lids) |
| Big reactions ("meme" detail) | `shock` (pin pupils, red veins, teeth, eye bags, wrinkles), `angry` (gritted teeth, cross-vein), `rage` (scream mouth, red face, vein, nose lines), `cry` (squeezed eyes, tear streams), `joy`, `ecstatic` (star eyes), `laugh` |
| Quieter | `stare` (dot eyes, shadow, one tear), `smug` (half lids, smirk), `talk`, `guilty` (side look, eek teeth, sweat), `worried` |

Rules that came from the build:
- Mix plain smiley faces with detailed meme faces: plain for the setup, meme detail on reactions (9/17 shorts do this).
- The decal is 1.42 units wide on a 1.52 head, so features spread across the head front. Smaller decals read too tame next to the references.
- Lift the head in big reactions (`hx` −14 to −28) so the face isn't hidden under the hair and meets the lens.
- Honest gap: reference meme faces are grotesque, near-photographic and ugly-funny; ours are clean cartoon drawings. They read clearly but are cuter. Uglier decals are the obvious next upgrade.

`node tools/cli.mjs faces out/faces.png` renders every face for every cast member on one sheet.
