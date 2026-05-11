const nameToImdb = require('name-to-imdb');

const NUMBER_WORDS = new Map([
  ['zero', '0'],
  ['one', '1'],
  ['two', '2'],
  ['three', '3'],
  ['four', '4'],
  ['five', '5'],
  ['six', '6'],
  ['seven', '7'],
  ['eight', '8'],
  ['nine', '9'],
  ['ten', '10'],
  ['eleven', '11'],
  ['twelve', '12'],
  ['thirteen', '13'],
  ['fourteen', '14'],
  ['fifteen', '15'],
  ['sixteen', '16'],
  ['seventeen', '17'],
  ['eighteen', '18'],
  ['nineteen', '19'],
  ['twenty', '20'],
]);

function normalizeTitle(value) {
  return (value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b([a-z]+)\b/g, (word, token) => NUMBER_WORDS.get(token) || token)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function yearsAreCompatible(left, right) {
  if (!left || !right) {
    return true;
  }

  return Math.abs(left - right) <= 1;
}

function isConservativeMatch(source, resolved) {
  if (!resolved || !resolved.id || !resolved.name) {
    return false;
  }

  if (!yearsAreCompatible(source.year, resolved.year)) {
    return false;
  }

  return normalizeTitle(source.title) === normalizeTitle(resolved.name);
}

// Parses "102 min" or "1h 42m" style strings into an integer number of minutes.
function parseRuntimeMinutes(runtime) {
  if (!runtime) return null;
  const minOnly = /^(\d+)\s*min$/i.exec(String(runtime).trim());
  if (minOnly) return Number.parseInt(minOnly[1], 10);
  const hm = /(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/i.exec(String(runtime).trim());
  if (hm && (hm[1] || hm[2])) return (Number.parseInt(hm[1] || '0', 10) * 60) + Number.parseInt(hm[2] || '0', 10);
  return null;
}

async function fetchCinemetaMeta(imdbId, { fetchImpl = fetch }) {
  const url = `https://v3-cinemeta.strem.io/meta/movie/${imdbId}.json`;
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error(`Cinemeta fetch failed with ${response.status}`);
  }

  const body = await response.json();
  return body.meta || null;
}

async function resolveMovie(entry, options = {}) {
  const { matchingMode = 'conservative', fetchImpl = fetch } = options;
  const lookup = await nameToImdb({
    name: entry.title,
    year: entry.year,
    type: 'movie',
    providers: ['metadata', 'imdbFind'],
  });

  if (!lookup.res || !lookup.inf || !lookup.inf.meta) {
    return {
      status: 'unresolved',
      reason: 'no_match',
    };
  }

  if (matchingMode === 'conservative' && !isConservativeMatch(entry, lookup.inf.meta)) {
    return {
      status: 'ambiguous',
      reason: 'title_or_year_mismatch',
      candidate: lookup.inf.meta,
    };
  }

  const cinemetaMeta = await fetchCinemetaMeta(lookup.res, { fetchImpl });
  if (!cinemetaMeta || normalizeTitle(cinemetaMeta.name) !== normalizeTitle(entry.title)) {
    return {
      status: 'ambiguous',
      reason: 'cinemeta_name_mismatch',
      candidate: cinemetaMeta,
    };
  }

  if (entry.year && cinemetaMeta.releaseInfo) {
    const releaseYear = Number.parseInt(String(cinemetaMeta.releaseInfo).slice(0, 4), 10);
    if (Number.isInteger(releaseYear) && !yearsAreCompatible(entry.year, releaseYear)) {
      return {
        status: 'ambiguous',
        reason: 'cinemeta_year_mismatch',
        candidate: cinemetaMeta,
      };
    }
  }

  const runtimeMinutes = parseRuntimeMinutes(cinemetaMeta.runtime);

  return {
    status: 'resolved',
    meta: {
      id: lookup.res,
      type: 'movie',
      name: cinemetaMeta.name || entry.title,
      poster: cinemetaMeta.poster || entry.poster || undefined,
      year: cinemetaMeta.year || entry.year || undefined,
      imdbRating: cinemetaMeta.imdbRating || undefined,
      runtime: cinemetaMeta.runtime || undefined,
      runtimeMinutes: runtimeMinutes || undefined,
    },
  };
}

module.exports = {
  fetchCinemetaMeta,
  normalizeTitle,
  yearsAreCompatible,
  resolveMovie,
};
