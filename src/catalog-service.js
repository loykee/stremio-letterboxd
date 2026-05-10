const { emptyCache, loadCache, writeCache } = require('./cache');
const { fetchWatchlist } = require('./letterboxd');
const { resolveMovie } = require('./resolver');

class CatalogService {
  constructor({
    cacheFile,
    watchlistUrl,
    maxItems,
    matchingMode,
    userAgent,
    logger,
    fetchWatchlistImpl = fetchWatchlist,
    resolveMovieImpl = resolveMovie,
    loadCacheImpl = loadCache,
    writeCacheImpl = writeCache,
  }) {
    this.cacheFile = cacheFile;
    this.watchlistUrl = watchlistUrl;
    this.maxItems = maxItems;
    this.matchingMode = matchingMode;
    this.userAgent = userAgent;
    this.logger = logger;
    this.fetchWatchlistImpl = fetchWatchlistImpl;
    this.resolveMovieImpl = resolveMovieImpl;
    this.writeCacheImpl = writeCacheImpl;
    this.cache = loadCacheImpl(cacheFile);
    this.syncPromise = null;
  }

  getCatalog() {
    return this.cache.items;
  }

  hasCachedCatalog() {
    return Boolean(this.cache.syncedAt);
  }

  async sync() {
    if (this.syncPromise) {
      return this.syncPromise;
    }

    this.syncPromise = this.performSync().finally(() => {
      this.syncPromise = null;
    });

    return this.syncPromise;
  }

  async performSync() {
    try {
      const watchlistItems = await this.fetchWatchlistImpl({
        url: this.watchlistUrl,
        maxItems: this.maxItems,
        userAgent: this.userAgent,
      });

      const metas = [];

      for (const item of watchlistItems) {
        const resolved = await this.resolveMovieImpl(item, {
          matchingMode: this.matchingMode,
        });

        if (resolved.status === 'resolved') {
          metas.push(resolved.meta);
          continue;
        }

        if (resolved.status === 'ambiguous') {
          this.logger.warn(
            {
              title: item.title,
              year: item.year,
              reason: resolved.reason,
            },
            'skipped ambiguous title',
          );
        }
      }

      this.cache = {
        syncedAt: new Date().toISOString(),
        sourceUrl: this.watchlistUrl,
        items: metas,
      };

      this.writeCacheImpl(this.cacheFile, this.cache);

      this.logger.info(
        {
          sourceUrl: this.watchlistUrl,
          fetched: watchlistItems.length,
          resolved: metas.length,
        },
        'sync success',
      );

      return this.cache;
    } catch (error) {
      this.logger.error(
        {
          err: error,
          sourceUrl: this.watchlistUrl,
        },
        'fetch failure',
      );

      if (this.hasCachedCatalog()) {
        this.logger.warn(
          {
            items: this.cache.items.length,
            syncedAt: this.cache.syncedAt,
          },
          'cache fallback usage',
        );
        return this.cache;
      }

      this.cache = emptyCache();
      return this.cache;
    }
  }
}

module.exports = {
  CatalogService,
};
