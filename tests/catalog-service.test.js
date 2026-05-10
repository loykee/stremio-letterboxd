const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { CatalogService } = require('../src/catalog-service');

test('CatalogService falls back to the last good cache on fetch failure', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stremio-catalog-'));
  const cacheFile = path.join(tempDir, 'watchlist-cache.json');
  const cached = {
    syncedAt: '2026-05-09T12:00:00.000Z',
    sourceUrl: 'https://letterboxd.com/example/watchlist/',
    items: [
      {
        id: 'tt0133093',
        type: 'movie',
        name: 'The Matrix',
        poster: 'https://example.com/matrix.jpg',
      },
    ],
  };

  fs.writeFileSync(cacheFile, JSON.stringify(cached, null, 2));

  const events = [];
  const logger = {
    info(payload, message) {
      events.push({ level: 'info', payload, message });
    },
    warn(payload, message) {
      events.push({ level: 'warn', payload, message });
    },
    error(payload, message) {
      events.push({ level: 'error', payload, message });
    },
  };

  const service = new CatalogService({
    cacheFile,
    watchlistUrl: 'https://letterboxd.com/example/watchlist/',
    maxItems: 500,
    matchingMode: 'conservative',
    userAgent: 'test',
    logger,
    fetchWatchlistImpl: async () => {
      throw new Error('network down');
    },
  });

  const cache = await service.sync();

  assert.deepEqual(cache.items, cached.items);
  assert.deepEqual(service.getCatalog(), cached.items);
  assert.ok(events.some((event) => event.message === 'cache fallback usage'));
});
