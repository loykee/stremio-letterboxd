const test = require('node:test');
const assert = require('node:assert/strict');
const { parseWatchlistPage } = require('../src/letterboxd');

test('parseWatchlistPage preserves visible watchlist order and fields', () => {
  const html = `
    <div class="poster-grid">
      <li class="griditem">
        <div
          class="react-component"
          data-component-class="LazyPoster"
          data-item-name="First Movie (2001)"
          data-item-link="/film/first-movie/"
          data-item-slug="first-movie"
          data-poster-url="/film/first-movie/image-150/">
        </div>
      </li>
      <li class="griditem">
        <div
          class="react-component"
          data-component-class="LazyPoster"
          data-item-name="Second Movie (1999)"
          data-item-link="/film/second-movie/"
          data-item-slug="second-movie"
          data-poster-url="/film/second-movie/image-150/">
        </div>
      </li>
    </div>
    <div class="pagination">
      <a class="next" href="/user/watchlist/page/2/">Older</a>
    </div>
  `;

  const result = parseWatchlistPage(html);

  assert.deepEqual(result.items, [
    {
      title: 'First Movie',
      year: 2001,
      letterboxdUrl: 'https://letterboxd.com/film/first-movie/',
      poster: 'https://letterboxd.com/film/first-movie/image-150/',
      slug: 'first-movie',
    },
    {
      title: 'Second Movie',
      year: 1999,
      letterboxdUrl: 'https://letterboxd.com/film/second-movie/',
      poster: 'https://letterboxd.com/film/second-movie/image-150/',
      slug: 'second-movie',
    },
  ]);

  assert.equal(result.nextPageUrl, 'https://letterboxd.com/user/watchlist/page/2/');
});
