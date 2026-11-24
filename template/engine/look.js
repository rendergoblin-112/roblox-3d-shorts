// Look knobs, tuned against the measured targets: picture luminance mean ~117 (p95 ~213), saturation 0.48-0.58.
// Override any of these with LOOK in short.js. See references/lighting-and-night.md.
export const DEFAULT_LOOK = {
  toneMapping: 'NeutralToneMapping', // ACES desaturated the warm plastic; Neutral keeps the saturation
  exposure: 0.75,
  key: 2.3,        // soft key light, re-aimed every shot to the camera's upper-front-left
  moonKey: 2.6,    // cool moonlight key after the power-out
  ao: 0.75,        // GTAO blend: subtle contact/corner shading
  bloom: 0.3,      // UnrealBloom strength (threshold 0.85): screens, LEDs and lamps glow
  saturation: 1.05,
  // per-set exposure trims so every set lands near mean luminance ~117; night is lifted so it still reads (~30-45)
  setExposure: { room: 0.9, sis: 0.68, living: 0.74, hall: 0.8, ext: 1.0 },
  nightLift: { room: 2.1, ext: 1.6 },
  blackClamp: 0.08,
  vignette: 0.28,  // gentle corner shading
};
