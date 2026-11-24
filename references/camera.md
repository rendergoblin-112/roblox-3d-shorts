# Camera

## Style A rules (measured)

| Rule | Number |
|---|---|
| **Locked camera**: no movement inside a shot | 94% of shots static (72–100%) |
| **At most one slow push** per video | 5 pushes in 182 shots, 1.03–1.06×/s |
| **Eye level + a lot of high angle** | high-angle share 25–41%; eye level 48–75%; low angles rare |
| **Medium and full shots**, not close-ups | pooled: MS 34%, FS 28%, WS 14%, CU 7%, MCU 7%, insert 7% |
| Inserts (phone, router, screen) ~7% | more when the story is on a screen |
| Mildly wide lens | 50–60° vertical FOV as a start (lens not measured) |
| ~1.5 characters in frame on average | median 1.46 |
| Cut between angles inside one set | same-room cuts are the style |

## Camera library (`engine/cameras.js`)

| id | Set | Angle | Size | Use |
|---|---|---|---|---|
| `backWide` | room | eye | WS | behind-left of the kid: profile, hands and the monitor. Opening shot |
| `mon` | room | eye | insert | straight-on monitor insert (hides the kid and chair) |
| `front` | room | eye | MS | kid from the monitor's position (hides the right wall + monitor), FOV 40 |
| `frontClose` | room | eye | CU | reaction close-up, FOV 34 |
| `high` | room | high | MS | high angle over the desk |
| `side` | room | eye | MS | side view of the desk (slams) |
| `wideHigh` | room | high | WS | whole room from high (standing up, chair rolling) |
| `sisWide` / `sisHigh` | sis | eye / high | FS | the sister and her ring-light phone |
| `momWide` | living | high | MS | the dining table and laptop from behind it |
| `call` | living | high | insert | over the shoulder onto the laptop screen (fits mom; dad's bigger head blocks it) |
| `laptop` | living | eye | insert | straight-on laptop screen; hides whoever sits at it. Use this when someone plays on the laptop |
| `dadWide` | living | eye | WS | couch + TV, dad in profile |
| `dadFace` | living | high | MS | dad 3/4 front on the couch |
| `famWide` | living | high | WS | the whole living room from the hall (table + couch) |
| `router` | hall | high | insert | the router on the hall table |
| `ext` | ext | low | WS | the house from the street at night |

Add your own in short.js; same fields:

```js
export const CAMERAS = {
  overDesk: { set: 'room', pos: [2.2, 6.4, -2.6], look: [5.8, 3.4, 0.4], fov: 50, hide: [], angle: 'high', size: 'MS', ref: 'high' },
};
```

- `pos` / `look` in set units, `fov` vertical degrees.
- `hide`: the camera's "cheats": wall names (`back left right front`), set objects (`monitor chair` in the room; `laptop couch table chair` in the living room; `router`; `ringlight`) or cast ids. A camera standing where a wall or the monitor is hides it.
- `angle` / `size` feed `check` (high-angle share, inserts). `ref` picks the house reference still for `compare`.
- A shot can omit `set`: it comes from the camera.
- `push: 1.05` on one shot = the single slow push-in (zoom ×1.05 per second).

## Set coordinates (to aim new cameras)

- **room** (18×16, walls at x ±8 / z −7, +7; ceiling 9): desk along the right wall (x 6.4), monitor at x 7.0 facing −x (screen centre y ≈ 4.2), kid in the chair at x 4.15 z 0.1 facing +x, window on the back wall, bed back-left, door on the left wall.
- **sis** (walls at z −7, x ±8): rug at (1.0, 0.8), sister at (0.6, 0.4) facing ry 72°, ring light + phone at (3.6, 1.4).
- **living** (30×18, walls at x ±15 / z −8, +9): dining table at (1.1, 0.5) with the laptop at (1.0, 1.15) facing +z, dining chair at (1.0, 3.3); couch at (−5.6, 0.5) facing −x to the TV on the left wall (x −14.4); hallway opening at the back wall centre; kitchen on the right wall.
- **hall**: router on a console table at (−0.2, 2.7, −3.1).
- **ext**: the house at z −6, street at z 14, camera at (0, 3.6, 27).

## Framing lessons from the fix rounds

- A front camera inside the kid's lean saw only hair: put front cameras where the monitor stands and hide the monitor.
- Inserts should fill the frame with the prop (the screen fills the width with the keyboard below), but keep the HUD's edge text in frame.
- Wides that show 40% empty wall or floor are weak: move the camera back through a hidden wall instead of widening the lens.
- High angles must still fill the frame with the character; in our high shots the desk sometimes dominated (honest gap).
- Front MS/CU on faces: 34–40° FOV avoids distortion.
- An over-the-shoulder insert built around one character can be blocked by a bigger one in the same seat: switch to a straight-on insert that hides the character.
- A front camera on a plain wall looks emptier than the reference (door, poster, bed behind the kid): angle the camera diagonally so the background has depth. `dadFront` in the joke test went from a flat orange wall to a 3/4 view with floor and wall rail.
- Swapping cameras changes the high-angle share: re-run `check` after camera changes.
