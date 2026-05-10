const cheerio = require('cheerio');

const LETTERBOXD_ORIGIN = 'https://letterboxd.com';

function absoluteUrl(url) {
  if (!url) {
    return null;
  }

  return new URL(url, LETTERBOXD_ORIGIN).toString();
}

function parseTitleAndYear(label) {
  const match = /^(.*)\s+\((\d{4})\)$/.exec((label || '').trim());
  if (!match) {
    return { title: (label || '').trim(), year: null };
  }

  return {
    title: match[1].trim(),
    year: Number.parseInt(match[2], 10),
  };
}

function parseWatchlistPage(html) {
  const $ = cheerio.load(html);
  const items = [];

  $('.poster-grid .react-component[data-component-class="LazyPoster"]').each((_, element) => {
    const node = $(element);
    const rawName = node.attr('data-item-name') || node.attr('data-item-full-display-name') || '';
    const link = absoluteUrl(node.attr('data-item-link'));
    const poster = absoluteUrl(node.attr('data-poster-url'));
    const slug = (node.attr('data-item-slug') || '').trim();
    const { title, year } = parseTitleAndYear(rawName);

    if (!title || !link) {
      return;
    }

    items.push({
      title,
      year,
      letterboxdUrl: link,
      poster,
      slug,
    });
  });

  const nextPagePath = $('.pagination a.next').attr('href') || null;

  return {
    items,
    nextPageUrl: nextPagePath ? absoluteUrl(nextPagePath) : null,
  };
}

async function fetchHtml(url, { userAgent, fetchImpl = fetch }) {
  const response = await fetchImpl(url, {
    headers: {
      'user-agent': userAgent,
      accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Letterboxd fetch failed with ${response.status}`);
  }

  return response.text();
}

async function fetchWatchlist({
  url,
  maxItems,
  userAgent,
  fetchImpl = fetch,
}) {
  const results = [];
  let nextPageUrl = url;

  while (nextPageUrl && results.length < maxItems) {
    const html = await fetchHtml(nextPageUrl, { userAgent, fetchImpl });
    const page = parseWatchlistPage(html);

    for (const item of page.items) {
      results.push(item);
      if (results.length >= maxItems) {
        break;
      }
    }

    nextPageUrl = page.nextPageUrl;
  }

  return results;
}

module.exports = {
  LETTERBOXD_ORIGIN,
  fetchWatchlist,
  parseTitleAndYear,
  parseWatchlistPage,
};
