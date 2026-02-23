# dtacraft-site

DTA Craft website (Cloudflare Pages)

## Sitemap setup

This repo uses a scalable sitemap setup with:

- `dtacraft-site/sitemap.xml` as the sitemap index.
- child sitemaps in `dtacraft-site/sitemaps/*.xml`.
- `dtacraft-site/robots.txt` pointing crawlers to `https://dtacraft.com/sitemap.xml`.

The canonical base URL is **`https://dtacraft.com`**, matching the canonical URL declared in `dtacraft-site/index.html`.

### Regenerate sitemaps

1. Update `sitemap.config.json` (base URL, child sitemap names, URL lists).
2. Run:

   ```bash
   npm run sitemap:generate
   ```

This command regenerates:

- `dtacraft-site/sitemap.xml`
- `dtacraft-site/robots.txt`
- `dtacraft-site/sitemaps/*.xml`

### Production serving

Cloudflare Pages serves static files from the publish directory (`dtacraft-site/`), so these files are served directly in production at:

- `/sitemap.xml`
- `/sitemaps/<name>.xml`
- `/robots.txt`
