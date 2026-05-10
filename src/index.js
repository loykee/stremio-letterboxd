const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const { CatalogService } = require('./catalog-service');
const { loadConfig } = require('./config');
const logger = require('./logger');

const config = loadConfig();
const catalogId = 'letterboxd-watchlist';

const manifest = {
  id: 'com.maricristofaro.letterboxd-watchlist',
  version: '1.0.0',
  name: "Mari's Letterboxd Watchlist",
  description: 'Mirrors Mari’s public Letterboxd watchlist into a Stremio movie catalog.',
  logo: 'https://raw.githubusercontent.com/loykee/stremio-letterboxd/main/assets/icon.svg',
  resources: ['catalog'],
  types: ['movie'],
  idPrefixes: ['tt'],
  catalogs: [
    {
      type: 'movie',
      id: catalogId,
      name: "Mari's Letterboxd Watchlist",
    },
  ],
};

const service = new CatalogService({
  cacheFile: config.cacheFile,
  watchlistUrl: config.watchlistUrl,
  maxItems: config.maxItems,
  matchingMode: config.matchingMode,
  userAgent: config.userAgent,
  logger,
});

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id }) => {
  if (type !== 'movie' || id !== catalogId) {
    return { metas: [] };
  }

  return {
    metas: service.getCatalog(),
  };
});

async function boot() {
  await service.sync();

  if (process.argv.includes('--sync-once')) {
    return;
  }

  serveHTTP(builder.getInterface(), { port: config.port });
  logger.info(
    {
      port: config.port,
      manifest: `http://127.0.0.1:${config.port}/manifest.json`,
    },
    'server started',
  );

  const intervalMs = config.syncIntervalHours * 60 * 60 * 1000;
  setInterval(() => {
    service.sync().catch((error) => {
      logger.error({ err: error }, 'scheduled sync failed');
    });
  }, intervalMs);
}

boot().catch((error) => {
  logger.error({ err: error }, 'startup failed');
  process.exitCode = 1;
});
