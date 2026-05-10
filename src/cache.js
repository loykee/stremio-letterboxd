const fs = require('fs');
const path = require('path');

function emptyCache() {
  return {
    syncedAt: null,
    sourceUrl: null,
    items: [],
  };
}

function loadCache(cacheFile) {
  try {
    if (!fs.existsSync(cacheFile)) {
      return emptyCache();
    }

    const parsed = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    return {
      syncedAt: parsed.syncedAt || null,
      sourceUrl: parsed.sourceUrl || null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch (_error) {
    return emptyCache();
  }
}

function writeCache(cacheFile, payload) {
  const directory = path.dirname(cacheFile);
  fs.mkdirSync(directory, { recursive: true });

  const tempFile = `${cacheFile}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2));
  fs.renameSync(tempFile, cacheFile);
}

module.exports = {
  emptyCache,
  loadCache,
  writeCache,
};
