// Headless Chrome + a tiny static server: the template at /, the project folder at /project/.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

export const TEMPLATE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
// puppeteer reads .puppeteerrc.cjs from the *current* folder, so point it at template/.cache explicitly
// (otherwise running the CLI from a project folder looks in ~/.cache/puppeteer and finds no browser)
process.env.PUPPETEER_CACHE_DIR ||= path.join(TEMPLATE, '.cache', 'puppeteer');
const { default: puppeteer } = await import('puppeteer');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };

export function serve(projDir) {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      let root = TEMPLATE, rel = url;
      if (projDir && url.startsWith('/project/')) { root = projDir; rel = url.slice('/project'.length); }
      const p = path.join(root, rel);
      if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(p).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

export async function launch() {
  const gpu = process.platform === 'darwin' ? ['--use-angle=metal'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
  const extra = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : [];
  try {
    return await puppeteer.launch({
      headless: 'shell',
      ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
      args: [...gpu, '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--force-color-profile=srgb', '--hide-scrollbars', '--mute-audio', ...extra],
      defaultViewport: { width: 1080, height: 1920, deviceScaleFactor: 1 },
      protocolTimeout: 600000,
    });
  } catch (e) {
    throw new Error(`Could not start headless Chrome: ${e.message}\n` +
      'The browser is downloaded by `npm install` (puppeteer postinstall) into template/.cache/puppeteer.\n' +
      'Fix: run `npx puppeteer browsers install chrome-headless-shell` inside template/, or set CHROME=/path/to/chrome.');
  }
}

// Open the engine on a project; resolves when the first frames are compiled.
export async function openEngine(projDir) {
  const srv = await serve(projDir);
  const browser = await launch();
  const page = await browser.newPage();
  page.on('console', (m) => { const t = m.text(); if (!t.includes('GPU stall') && !t.includes('GroupMarkerNotSet')) console.log('[page]', t); });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true || !!window.__error', { timeout: 300000 });
  const err = await page.evaluate(() => window.__error);
  if (err) { await browser.close(); srv.close(); throw new Error('engine failed to start:\n' + err); }
  const info = await page.evaluate(() => ({ renderer: window.__info, total: window.__totalFrames, shots: window.__shots, powerOff: window.__powerOff }));
  const frame = async (f) => { await page.evaluate((f) => window.renderFrame(f), f); return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1920 }, optimizeForSpeed: true }); };
  const close = async () => { await browser.close(); srv.close(); };
  return { page, browser, info, frame, close };
}

// A blank page with a canvas, for contact sheets, side-by-sides and picture stats.
export async function openCanvas() {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setContent('<html><body style="margin:0;background:#111"></body></html>');
  return { page, close: () => browser.close() };
}
export const dataUrl = (p) => `data:${p.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'};base64,${fs.readFileSync(p).toString('base64')}`;
