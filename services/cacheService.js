const fs = require('fs').promises;
const path = require('path');

const cachePath = path.join(__dirname, '../data/source-cache.json');

async function readCache() {
  try {
    const raw = await fs.readFile(cachePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

async function writeCache(payload) {
  try {
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      ...payload
    }, null, 2));
  } catch (_) {
    // cache write best effort
  }
}

module.exports = {
  readCache,
  writeCache,
  cachePath
};
