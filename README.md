# Mari Letterboxd Watchlist Addon

Standalone Stremio addon that mirrors a public Letterboxd watchlist into a `movie` catalog backed by IMDb IDs. Because the catalog IDs are IMDb IDs, Stremio's built-in Cinemeta addon supplies the details page and any installed torrent addons can attach streams normally.

The manifest includes a custom addon icon hosted from this repository's `assets/icon.svg`.

## Endpoints

- `/manifest.json`
- `/catalog/movie/letterboxd-watchlist.json`

## Defaults

- `LETTERBOXD_WATCHLIST_URL=https://letterboxd.com/maricristofaro/watchlist/`
- `SYNC_INTERVAL_HOURS=6`
- `MAX_ITEMS=500`
- `MATCHING_MODE=conservative`
- `PORT=7010`
- `USER_AGENT` is optional

## Local Run

```bash
npm install
npm start
```

The manifest will be available at [http://127.0.0.1:7010/manifest.json](http://127.0.0.1:7010/manifest.json).

## Sync Behavior

- Fetches the public Letterboxd watchlist HTML, including pagination, and preserves visible order.
- Extracts title, year, film URL, and the Letterboxd poster endpoint from each entry.
- Resolves movies to IMDb IDs conservatively and skips ambiguous matches instead of guessing.
- Pulls poster art from Cinemeta for resolved IMDb IDs so the catalog looks native in Stremio.
- Stores the last successful resolved catalog in `data/watchlist-cache.json` and keeps it in memory for runtime reads.
- Falls back to the last good cache when Letterboxd fetches fail.

## Logging

Structured logs are emitted for:

- sync success
- skipped ambiguous titles
- fetch failures
- cache fallback usage

## Render

Create a Render web service with:

- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `LETTERBOXD_WATCHLIST_URL`
  - `SYNC_INTERVAL_HOURS`
  - `MAX_ITEMS`
  - `PORT`
  - `USER_AGENT`

## Publish Steps

From this project folder:

```bash
git init
git add .
git commit -m "Initial Stremio Letterboxd watchlist addon"
```

Then create a new empty GitHub repository and connect this folder:

```bash
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

In Render:

1. Create a new Web Service from that GitHub repository.
2. Use `npm install` as the build command.
3. Use `npm start` as the start command.
4. Set the environment variables from `.env.example` if you want to override defaults.
5. Deploy.

After the deploy finishes, install this URL in Stremio:

`https://<your-render-service>.onrender.com/manifest.json`

Then remove the localhost addon from Stremio so it only uses the hosted one.
