// Engine entry: loads the project (served at /project/short.js), builds the sets it uses, places the cast and renders
// any frame on demand: window.renderFrame(f). Driven headless by tools/cli.mjs.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeRoom, makeSis, makeLiving, makeHall, makeExt } from './sets.js';
import { makeGame } from './game.js';
import { makeChar, applyPose, blendPose } from './rig.js';
import { faceSheet } from './faces.js';
import { resolvePose } from './poses.js';
import { resolveProject } from './timeline.js';
import { easeOut, D2R } from './util.js';
import { DEFAULT_LOOK } from './look.js';

const W = 1080, H = 1210;

try {
  await main();
} catch (e) {
  window.__error = (e && e.stack) || String(e);
  console.error(window.__error);
}

async function main() {
  const P = await import('/project/short.js');
  const R = resolveProject(P);
  if (R.errors.length) throw new Error('short.js problems:\n  - ' + R.errors.join('\n  - '));
  const LOOK = { ...DEFAULT_LOOK, ...(P.LOOK || {}) };
  LOOK.setExposure = { ...DEFAULT_LOOK.setExposure, ...(P.LOOK?.setExposure || {}) };
  LOOK.nightLift = { ...DEFAULT_LOOK.nightLift, ...(P.LOOK?.nightLift || {}) };

  // ---- pinned caption + watermark (band layout lives in index.html)
  const lines = Array.isArray(P.CAPTION) ? P.CAPTION : String(P.CAPTION ?? '').split('\n');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const emo = (s) => esc(s).replace(/(\p{Extended_Pictographic}[\p{Extended_Pictographic}‍️]*)/gu, '<span class="emo">$1</span>');
  document.getElementById('caption').innerHTML = lines.map(emo).join('<br>');
  document.getElementById('wm').textContent = P.WATERMARK ?? '';
  await document.fonts.load('800 60px Nunito'); await document.fonts.load('700 40px Fredoka'); await document.fonts.load('600 20px Fredoka');

  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.toneMapping = THREE[LOOK.toneMapping]; renderer.toneMappingExposure = LOOK.exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.getElementById('pic').appendChild(renderer.domElement);
  const gl = renderer.getContext(); const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  window.__info = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown';

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // ---- sets (only the ones the shot list uses), each followed by its cast
  const BUILD = { room: () => makeRoom(env), sis: () => makeSis(env), living: () => makeLiving(env), hall: () => makeHall(env), ext: () => makeExt() };
  const sets = {};
  for (const s of R.setsUsed) {
    const S = BUILD[s](); sets[s] = S;
    for (const c of R.charsBySet[s]) { const ch = makeChar({ name: c, ...R.cast[c] }); S.scene.add(ch.root); S.chars[c] = ch; }
  }
  // what in-world screens show: shot.screens > SCREENS in short.js > the set's default
  const feedOf = (sh, screen, def) => sh.screens?.[screen] ?? P.SCREENS?.[screen] ?? def;
  const usesGame = R.shots.some((sh) => (sh.set === 'room' && feedOf(sh, 'monitor', 'game') === 'game') || ['tv', 'laptop'].some((s) => feedOf(sh, s, null) === 'game'));
  const game = usesGame ? makeGame(renderer, R) : null;
  if (game && sets.room) { sets.room.screenM.map = game.texture; sets.room.screenM.needsUpdate = true; }

  const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 400);

  // post: render -> AO (subtle) -> bloom (light) -> tone map + sRGB -> grade (saturation, black clamp, corner shading)
  const first = sets[R.setsUsed[0]];
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
  const renderPass = new RenderPass(first.scene, camera); composer.addPass(renderPass);
  const gtao = new GTAOPass(first.scene, camera, W, H);
  gtao.output = GTAOPass.OUTPUT.Default; gtao.blendIntensity = LOOK.ao;
  gtao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.5, thickness: 1.5, scale: 1.0, samples: 16 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  composer.addPass(gtao);
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), LOOK.bloom, 0.45, 0.85); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, sat: { value: LOOK.saturation }, black: { value: LOOK.blackClamp }, vig: { value: LOOK.vignette }, aspect: { value: W / H } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float sat, black, vig, aspect; varying vec2 vUv;
      void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
        float l = dot(c, vec3(0.299,0.587,0.114)); c = mix(vec3(l), c, sat);
        c = max((c - black) / (1.0 - black), 0.0);
        vec2 p = (vUv - 0.5) * vec2(aspect, 1.0); float r = length(p) / 0.72; c *= 1.0 - vig * smoothstep(0.55, 1.25, r);
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }`,
  });
  composer.addPass(grade);

  // ---- per-frame evaluation
  const poseCache = new Map();
  function pose(ref, ch) {
    const k = ch.root.name + '|' + (typeof ref === 'string' ? ref : JSON.stringify(ref));
    if (!poseCache.has(k)) poseCache.set(k, resolvePose(ref, ch.spec, R.lib));
    return poseCache.get(k);
  }
  function evalKeys(keys, t, ch) {
    let i = 0; for (let j = 0; j < keys.length; j++) if (keys[j][0] <= t) i = j;
    const [kf, ref, face, dur] = keys[i];
    const p = pose(ref, ch);
    const prev = i > 0 ? pose(keys[i - 1][1], ch) : p;
    const u = dur > 0 ? easeOut((t - kf) / dur) : 1;
    return { pose: blendPose(prev, p, u), face };
  }
  const WALLS = ['back', 'left', 'right', 'front'];
  let curSet = null;

  function renderFrame(f) {
    f = Math.max(0, Math.min(R.total - 1, f));
    const sh = R.shotAt(f), t = f - sh.start;
    const S = sets[sh.set], cam = R.cams[sh.cam];
    const powerOn = R.powerOff == null || f < R.powerOff;
    for (const k in sets) sets[k].power(powerOn);
    // camera cheats: walls, set objects and cast members this angle hides
    const hide = cam.hide || [];
    for (const w of WALLS) if (S.walls[w]) S.walls[w].visible = !hide.includes(w);
    for (const [n, o] of Object.entries(S.objects || {})) o.visible = !hide.includes(n);
    // camera (locked; optional single slow push)
    camera.fov = cam.fov; camera.position.set(...cam.pos); camera.lookAt(...cam.look);
    camera.zoom = sh.push ? Math.pow(sh.push, t / 30) : 1;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    // key light: top-front-left of this shot's camera, soft shadows; moonlight after the power-out
    if (S.L) {
      const tgt = new THREE.Vector3(...cam.look);
      if (powerOn) {
        const back = camera.position.clone().sub(tgt).setY(0).normalize();
        back.applyAxisAngle(new THREE.Vector3(0, 1, 0), -30 * D2R);
        const dir = back.multiplyScalar(Math.cos(50 * D2R)).setY(Math.sin(50 * D2R)).normalize();
        S.L.key.position.copy(tgt).addScaledVector(dir, 30); S.L.key.color.set('#fff1de'); S.L.key.intensity = LOOK.key;
      } else { S.L.key.position.set(tgt.x - 4, 22, tgt.z - 26); S.L.key.color.set('#8aa6ff'); S.L.key.intensity = LOOK.moonKey; }
      S.L.key.target.position.copy(tgt); S.L.key.target.updateMatrixWorld();
    }
    // cast: shot keys, else the rest pose for this set, else hidden
    for (const [name, ch] of Object.entries(S.chars)) {
      const keys = sh[name] || R.restKeys(sh.set, name);
      if (!keys) { ch.root.visible = false; continue; }
      ch.root.visible = !hide.includes(name);
      const { pose: p, face } = evalKeys(keys, t, ch); applyPose(ch, p); ch.setFace(face);
    }
    // set-specific behaviour (screens, router, lid, chair...)
    S.update(sh, t, f, {
      renderer, powerOn,
      feed: (screen, def) => feedOf(sh, screen, def),
      gameTex: (screen) => (game && powerOn ? game.render(f, sh.gameFocus ?? R.GAME.focus?.[screen] ?? 'me', sh.gameView ?? 'follow') : null),
    });
    renderer.toneMappingExposure = LOOK.exposure * (LOOK.setExposure[sh.set] ?? 1) * (powerOn ? 1 : (LOOK.nightLift[sh.set] ?? 1));
    if (curSet !== sh.set) { curSet = sh.set; renderPass.scene = S.scene; gtao.scene = S.scene; }
    composer.render();
    return { shot: sh.id, t };
  }

  window.renderFrame = renderFrame;
  window.__totalFrames = R.total;
  window.__shots = R.shots.map((s) => ({ id: s.id, start: s.start, len: s.len, set: s.set, cam: s.cam }));
  window.__powerOff = R.powerOff;
  window.__faceSheet = () => faceSheet(Object.values(R.cast).map((c) => ({ skin: c.skin ?? '#e8a874', lashes: c.lashes, mustache: c.mustache, hairColor: c.hair, freckles: c.freckles, browThick: c.browThick ?? 11 })));
  // warm up every set once (shader compile) so frame timing is stable
  for (const s of R.setsUsed) renderFrame(R.shots.find((x) => x.set === s).start);
  window.__ready = true;
}
