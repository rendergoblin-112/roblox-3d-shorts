# Acting: how the family moves

## Style A motion (measured)

- **Pose to pose.** Every move goes from one held pose to the next (16/17). Rigid parts, no squash and stretch.
- **Snap, then freeze.** A move takes ~3–12 frames with an ease-out, then the pose holds with **zero motion** for ~8–16 frames. No idle breathing: it breaks the freeze. Style A shorts are frozen 52% of the time (37–70%), with 48 holds per minute.
- **One gag per character per shot.** The reaction is a separate cut with a face swap.
- **The lead acts on frame 1** of the first shot.

## Keys

A character's keys in a shot: `[frame in shot, pose, face, move frames]`.

```js
kid: [[0, 'desk.lean', 'focus', 0],      // starts already in pose (0 = no move)
      [4, 'desk.huh', 'huh', 6]],        // at frame 4: snap to the huh pose over 6 frames, face swaps at frame 4
```

- The face swaps on the key frame, whole. Put the voice interjection on that same frame.
- Move frames: 3–5 for snaps (reactions, slams), 5–8 for bigger body moves. 0 = cut straight into the pose.
- Space keys 8–14 frames apart in style A so each pose gets its freeze.
- The first key of a shot should repeat where the character ended in the last shot of that set (continuity), unless the cut *is* the reaction.

## Poses = spot + shape

A pose is a **spot** (where, in which set: `x, z, ry` and a `seat` height or `y`) plus a **shape** (body angles in degrees). Any cast member can take any pose; seated heights adapt to their size. Library in `engine/poses.js`:

**Spots:** `room.desk` (gaming chair at the PC), `room.deskSide` (standing beside it), `room.behind` (standing behind the chair, watching the screen; visible in `front`, `frontClose`, `high`), `sis.rug` (sister's rug, facing her phone), `living.table` (dining chair at the laptop), `living.couch` (couch facing the TV).

**Seated shapes:** `sit.type, sit.lean, sit.press, sit.slamUp, sit.slam, sit.huh, sit.slump, sit.cheeks, sit.grab, sit.scream, sit.victory, sit.knuckle, sit.wave, sit.wave2, sit.laugh, sit.freeze, sit.rest, sit.cheer, sit.pump, sit.turnLook, sit.pointLaugh, sit.smug, sit.shrug`

**Standing shapes:** `stand.idle, stand.grab, stand.cry, stand.flail1, stand.flail2, stand.fists, stand.v, stand.point, stand.hip, stand.peace, stand.stop, stand.cheer, stand.laugh, stand.pointLaugh, stand.doubleOver, stand.facepalm, stand.shock, stand.lean, stand.shrug, stand.smug`

**Named poses** (spot + shape): `desk.type/lean/press/slamUp/slam/huh/slump/cheeks/grab/scream/victory/knuckle/laugh/pointLaugh/smug`, `deskSide.grab/cry/flail1/flail2/fists`, `behind.idle/lean/pointLaugh/laugh/shock/facepalm`, `rug.v/point/hip/peace/stop`, `table.wave1/wave2/laugh/freeze/type/lean/smug`, `couch.sit/cheer/pump/freeze`.

Use in a key: a name (`'desk.lean'`), an object (`{ spot: 'living.table', shape: 'sit.pointLaugh', hz: 12 }`), or your own name from `POSES` in short.js. New spots and shapes go in `SPOTS` / `SHAPES` in short.js:

```js
export const SPOTS = { 'room.behind': { x: 2.0, z: -1.6, ry: 90, y: 0 } };   // standing behind the kid's chair
export const POSES = { sisLaugh: { spot: 'room.behind', shape: 'stand.pointLaugh' } };
```

Shape fields: `tx ty tz` torso, `hx hy hz` head, `al ar` = `[x, y, z]` left/right arm (x negative = forward/up: −90 straight forward, −170 straight up; z positive = outward on both sides), `ll lr` legs (−90 seated), `lz` leg spread.

## The family's acting language (from the WiFi short)

| Beat | Pose | Face |
|---|---|---|
| Concentrating | `desk.lean` (torso 20°, head lifted −28°) | `focus` / `lockin` |
| Confused | `desk.huh` (head tilt 16°, one hand out) | `huh` |
| Deflated | `desk.slump` | `annoyed` |
| Panic | `desk.cheeks` (both hands to the face) | `shock` |
| Anger | `desk.slamUp` → `desk.slam` (+ `slam: frame` makes the keyboard jump) | `angry` |
| Rage | `desk.grab`, then standing `deskSide.flail1/2` alternating every 9 frames, end on `fists` | `rage` |
| Breaking down | `deskSide.cry` / `deskSide.grab` | `cry` |
| Locking in | `desk.knuckle` → `desk.type` → `desk.lean` | `lockin` |
| Triumph | `desk.victory` (arms straight up) | `ecstatic` |
| Caught out | `table.freeze`, `couch.freeze` (head turned to the noise) | `guilty` |
| Showing off | `rug.v/point/hip/peace` every ~14 frames | `joy/laugh/smug` |

## Rules learned in the fix rounds

- Leaning poses tip the face down: use less torso lean and more head lift so the face meets the lens.
- Give every character a rest pose for shots that don't animate them, or they stand at the origin (dad's head once appeared in the call insert).
- Short arms and big mitten hands limit poses: "hands on head" reads as "hands on cheeks"; the victory pose can push arms through a chair headrest. Check stills for clipping.
- `stand.doubleOver` (bent over laughing) points the face at the floor: from an eye-level camera you see only hair. Use it in high angles; at eye level use `stand.laugh` or `stand.pointLaugh`.
- Laughing escalates like anger does: `smile` → `laugh` → `cry` (tears of laughter) → `ecstatic`, with `desk.laugh` → `desk.pointLaugh` → `desk.slump`.
- Keep characters that share a two-shot close together (mom and dad were 13 units apart until the table moved next to the couch).
