# dtacraft-site

DTA Craft website (Cloudflare Pages).

## Core conventions

- Publish directory: `dtacraft-site/`
- Canonical base URL: `https://dtacraft.com`
- Shared IA nav across pages: Games, Devlog, Wiki / Rules, Press, Studio, Support
- Shared legal footer: privacy, terms, credits, and per-game privacy pages

## Sitemap architecture (scalable)

- Sitemap index: `dtacraft-site/sitemap.xml`
- Child sitemaps:
  - `dtacraft-site/sitemaps/main.xml`
  - `dtacraft-site/sitemaps/games.xml`
  - `dtacraft-site/sitemaps/devlog.xml`
  - `dtacraft-site/sitemaps/wiki.xml`
  - `dtacraft-site/sitemaps/press.xml`
  - `dtacraft-site/sitemaps/studio.xml`
  - `dtacraft-site/sitemaps/support.xml`
- Config source-of-truth: `sitemap.config.json`
  - Hybrid strategy: autoscan for `/games/`, `/devlog/`, `/wiki/`; config-driven static lists for top-level pages.

## How to add a new game

1. Create `dtacraft-site/games/<slug>/index.html` using the current game page template structure.
2. Add or confirm a game-specific privacy page. If a `*/privacy-policy` URL already exists, keep that file immutable and only link to it.
3. Add a rules hub at `dtacraft-site/wiki/<slug>/index.html` and section pages:
   - `quickstart`, `core-rules`, `cards-units-enemies`, `keywords`, `difficulty-modes`, `faq`.
4. Add a card to `dtacraft-site/games/index.html` with filter metadata (`data-status`, `data-platforms`, `data-genre`).
5. Add changelog and devlog items in:
   - `dtacraft-site/content/changelog.json`
   - `dtacraft-site/assets/devlog-posts.json`
6. Regenerate sitemaps.

## How to add a new devlog entry

1. Add an entry object in `dtacraft-site/assets/devlog-posts.json`.
2. Use one category:
   - `release-notes`, `design-notes`, `production-logs`, `postmortems`
3. Set `game` to one of the game slugs (or `studio`).
4. Verify filtering on `/devlog/`.

## How to add a new wiki page

1. Place the page at `dtacraft-site/wiki/<slug>/index.html` (or nested under a game hub).
2. Link the page from its parent rules hub so no nav entry points are broken.
3. Regenerate sitemaps.

## Regenerate and validate

```bash
npm run sitemap:generate
npm run site:validate
```

These commands regenerate sitemap/robots outputs and validate all configured and autoscanned URLs resolve to files.

## IA maintenance quick guide

- New game: create `/games/<slug>/`, add/verify `/wiki/<slug>/` hub + required rules pages, add the game card to `/games/`, and add a changelog object in `dtacraft-site/content/changelog.json`.
- New wiki section: create the page under `dtacraft-site/wiki/` and link it from the appropriate hub so no entry point leads to a 404.
- New devlog page/category: create the new page under `dtacraft-site/devlog/` and add entries in `dtacraft-site/assets/devlog-posts.json`.
- Regenerate sitemaps after any IA changes: `npm run sitemap:generate`.
