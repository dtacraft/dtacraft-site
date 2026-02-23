# SITE_CONVENTIONS

## Canonical base URL

- Canonical site URL: `https://dtacraft.com`
- Sitemaps and robots entries must always emit canonical URLs using this base.

## Routing conventions

Cloudflare Pages publish directory is `dtacraft-site/`.

### Games

- Game pages live at `/games/<slug>/`
- File convention: `dtacraft-site/games/<slug>/index.html`
- Games listing page: `dtacraft-site/games/index.html` at `/games/`

### Wiki

- Wiki pages live at `/wiki/<slug>/`
- File convention: `dtacraft-site/wiki/<slug>/index.html`
- Wiki listing page: `dtacraft-site/wiki/index.html` at `/wiki/`

## Navigation baseline

All top-level user-facing pages should include links to:

- Home (`/`)
- Games (`/games/`)
- Wiki (`/wiki/`)
- Press (`/press/`)
- Privacy (`/privacy.html`)

## Sitemap layout

- Sitemap index: `dtacraft-site/sitemap.xml`
- Child sitemaps:
  - `dtacraft-site/sitemaps/main.xml`
  - `dtacraft-site/sitemaps/games.xml`
  - `dtacraft-site/sitemaps/wiki.xml`

## Source of truth for sitemap generation

- `content/main-pages.json`
- `content/games.json`
- `content/wiki.json`

Always run `npm run sitemap:generate` after updating content JSON files, and run `npm run site:validate` before opening a PR.
