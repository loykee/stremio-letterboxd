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
      extra: [{ name: 'skip', isRequired: false }],
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

const PAGE_SIZE = 100;

const SORT_COMPARATORS = {
  watchlist: null, // preserve original Letterboxd order
  imdbRating: (a, b) => (b.imdbRating || 0) - (a.imdbRating || 0),
  runtime: (a, b) => (a.runtimeMinutes || 0) - (b.runtimeMinutes || 0),
  year: (a, b) => (b.year || 0) - (a.year || 0),
};

builder.defineCatalogHandler(async ({ type, id, extra }) => {
  if (type !== 'movie' || id !== catalogId) {
    return { metas: [] };
  }

  const skip = Number.parseInt(extra?.skip, 10) || 0;
  const comparator = SORT_COMPARATORS[config.sortBy] ?? SORT_COMPARATORS.imdbRating;
  const all = comparator ? [...service.getCatalog()].sort(comparator) : service.getCatalog();

  return {
    metas: all.slice(skip, skip + PAGE_SIZE),
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
