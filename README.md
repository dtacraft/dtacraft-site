# dtacraft-site

DTA Craft website (Cloudflare Pages).

## Site structure conventions

- Cloudflare Pages publish directory: `dtacraft-site/`
- Canonical base URL: `https://dtacraft.com`
- Games route convention: `/games/<slug>/` => `dtacraft-site/games/<slug>/index.html`
- Wiki route convention: `/wiki/<slug>/` => `dtacraft-site/wiki/<slug>/index.html`

See full conventions in `docs/SITE_CONVENTIONS.md`.

## Sitemap architecture

- Sitemap index: `dtacraft-site/sitemap.xml`
- Child sitemaps:
  - `dtacraft-site/sitemaps/main.xml`
  - `dtacraft-site/sitemaps/games.xml`
  - `dtacraft-site/sitemaps/wiki.xml`
- Source-of-truth content files:
  - `content/main-pages.json`
  - `content/games.json`
  - `content/wiki.json`

## Add a new game page

1. Create the page file: `dtacraft-site/games/<slug>/index.html`.
2. Add a record to `content/games.json`:

   ```json
   {
     "slug": "<slug>",
     "lastmod": "YYYY-MM-DD",
     "changefreq": "monthly",
     "priority": 0.8
   }
   ```

3. Optionally add a link from `dtacraft-site/games/index.html`.

## Add a new wiki page

1. Create the page file: `dtacraft-site/wiki/<slug>/index.html`.
2. Add a record to `content/wiki.json`:

   ```json
   {
     "slug": "<slug>",
     "lastmod": "YYYY-MM-DD"
   }
   ```

3. Optionally add a link from `dtacraft-site/wiki/index.html`.

## Regenerate sitemaps

```bash
npm run sitemap:generate
```

This regenerates:

- `dtacraft-site/sitemap.xml`
- `dtacraft-site/sitemaps/main.xml`
- `dtacraft-site/sitemaps/games.xml`
- `dtacraft-site/sitemaps/wiki.xml`
- `dtacraft-site/robots.txt`

## Validate listed URLs and generated files

```bash
npm run site:validate
```

Validation fails if a URL listed in the content JSON files does not resolve to a file inside `dtacraft-site/`, or if required generated files are missing.

## Deploy flow via PR

1. Create/update pages and content JSON entries.
2. Run:

   ```bash
   npm run sitemap:generate
   npm run site:validate
   ```

3. Commit generated sitemap/robots output with your content changes.
4. Open a PR.
5. After merge, Cloudflare Pages deploys from `dtacraft-site/`.
