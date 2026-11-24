# Example: "When your WiFi lags one second before you win"

A kid at his desk is one jump from finishing a hard obby. Four times, right before the finish, the game lags and throws him back to the start, each time faster and angrier, and each lag is someone in the family hogging the WiFi (sister's livestream, mom's video call, dad's 8K match, then all three). When he finally wins, the power goes out for the whole house.

- `short.js`: 36 shots, 1284 frames (42.8 s), punchline (power-out) at frame 1191 (92.8%).
- `sound.js`: the cue sheet: game-music bed that tape-stops on every lag, six voice reactions, 60-odd effects.
- `ref/`: ten frames of the approved render, one per camera type, used by `compare` as the house reference.

Render it from `template/`: `npm run example` (writes `template/out/wifi-lag.mp4`).
