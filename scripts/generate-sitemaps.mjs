#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const publishDir = path.join(repoRoot, 'dtacraft-site');
const sitemapsDir = path.join(publishDir, 'sitemaps');
const configPath = path.join(repoRoot, 'sitemap.config.json');

const today = new Date().toISOString().slice(0, 10);

const escapeXml = (v) => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const ensureSlash = (v) => (v.startsWith('/') ? v : `/${v}`);

const toAbsolute = (baseUrl, sitePath) => `${baseUrl}${ensureSlash(sitePath)}`;

const buildUrlset = (baseUrl, urls) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((u) => `  <url>\n    <loc>${escapeXml(toAbsolute(baseUrl, u.path))}</loc>\n    <lastmod>${escapeXml(u.lastmod || today)}</lastmod>${u.changefreq ? `\n    <changefreq>${escapeXml(u.changefreq)}</changefreq>` : ''}${u.priority !== undefined ? `\n    <priority>${Number(u.priority).toFixed(1)}</priority>` : ''}\n  </url>`)
  .join('\n')}\n</urlset>\n`;

const buildIndex = (baseUrl, names) => `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${names
  .map((name) => `  <sitemap>\n    <loc>${escapeXml(`${baseUrl}/sitemaps/${name}.xml`)}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`)
  .join('\n')}\n</sitemapindex>\n`;

const walkIndexPages = async (relativeDir, exclusions = []) => {
  const root = path.join(publishDir, relativeDir);
  const result = [];

  const walk = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name === 'index.html') {
        const sitePath = `/${path.relative(publishDir, path.dirname(full)).replaceAll(path.sep, '/')}/`;
        if (!exclusions.includes(sitePath)) result.push(sitePath.replace('//', '/'));
      }
    }
  };

  await walk(root);
  return [...new Set(result)].sort();
};

const main = async () => {
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  const { baseUrl, staticSitemaps = {}, autoscan = {}, sitemaps = [] } = config;

  const generated = {};
  for (const [name, cfg] of Object.entries(autoscan)) {
    const paths = await walkIndexPages(cfg.dir, cfg.exclude || []);
    generated[name] = paths.map((sitePath) => ({
      path: sitePath,
      lastmod: today,
      changefreq: cfg.changefreq,
      priority: cfg.priority
    }));
  }

  const sitemapData = {
    ...Object.fromEntries(Object.entries(staticSitemaps).map(([name, urls]) => [name, urls.map((u) => ({ lastmod: today, ...u }))])),
    ...generated
  };

  const names = sitemaps.length ? sitemaps : Object.keys(sitemapData);

  await fs.mkdir(sitemapsDir, { recursive: true });
  for (const name of names) {
    await fs.writeFile(path.join(sitemapsDir, `${name}.xml`), buildUrlset(baseUrl, sitemapData[name] || []), 'utf8');
  }

  await fs.writeFile(path.join(publishDir, 'sitemap.xml'), buildIndex(baseUrl, names), 'utf8');
  await fs.writeFile(path.join(publishDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`, 'utf8');
  console.log(`Generated sitemap index and ${names.length} child sitemaps.`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
