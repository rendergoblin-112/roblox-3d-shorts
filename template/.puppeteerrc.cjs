// npm install downloads only the small headless Chrome build, into this folder (template/.cache/puppeteer),
// so the skill folder is self-contained and nothing is written to ~/.cache.
const { join } = require('path');

module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
  chrome: { skipDownload: true },
  'chrome-headless-shell': { skipDownload: false },
  firefox: { skipDownload: true },
};
