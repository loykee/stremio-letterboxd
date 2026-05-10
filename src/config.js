const path = require('path');

const DEFAULTS = {
  LETTERBOXD_WATCHLIST_URL: 'https://letterboxd.com/maricristofaro/watchlist/',
  SYNC_INTERVAL_HOURS: 6,
  MAX_ITEMS: 500,
  MATCHING_MODE: 'conservative',
  PORT: 7010,
  USER_AGENT: 'Mari-Letterboxd-Watchlist-Addon/1.0 (+https://letterboxd.com/maricristofaro/watchlist/)',
  CACHE_FILE: path.join(process.cwd(), 'data', 'watchlist-cache.json'),
};

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function loadConfig(env = process.env) {
  return {
    watchlistUrl: env.LETTERBOXD_WATCHLIST_URL || DEFAULTS.LETTERBOXD_WATCHLIST_URL,
    syncIntervalHours: parsePositiveInt(env.SYNC_INTERVAL_HOURS, DEFAULTS.SYNC_INTERVAL_HOURS),
    maxItems: parsePositiveInt(env.MAX_ITEMS, DEFAULTS.MAX_ITEMS),
    matchingMode: env.MATCHING_MODE || DEFAULTS.MATCHING_MODE,
    port: parsePositiveInt(env.PORT, DEFAULTS.PORT),
    userAgent: env.USER_AGENT || DEFAULTS.USER_AGENT,
    cacheFile: env.CACHE_FILE || DEFAULTS.CACHE_FILE,
  };
}

module.exports = {
  DEFAULTS,
  loadConfig,
};
