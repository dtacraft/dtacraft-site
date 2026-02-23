#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const publishDir = path.join(repoRoot, 'dtacraft-site');
const sitemapsDir = path.join(publishDir, 'sitemaps');
const contentDir = path.join(repoRoot, 'content');
const baseUrl = 'https://dtacraft.com';

const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const ensureAbsoluteUrl = (sitePath) => {
  const safePath = sitePath.startsWith('/') ? sitePath : `/${sitePath}`;
  return `${baseUrl}${safePath}`;
};

const readJson = async (fileName) => {
  const raw = await fs.readFile(path.join(contentDir, fileName), 'utf8');
  return JSON.parse(raw);
};

const toGamePath = (slug) => `/games/${slug}/`;
const toWikiPath = (slug) => `/wiki/${slug}/`;

const buildChildSitemap = (urls) => {
  const entries = urls
    .map((item) => {
      const lines = [
        '  <url>',
        `    <loc>${escapeXml(ensureAbsoluteUrl(item.path))}</loc>`,
        `    <lastmod>${escapeXml(item.lastmod)}</lastmod>`
      ];

      if (item.changefreq) {
        lines.push(`    <changefreq>${escapeXml(item.changefreq)}</changefreq>`);
      }

      if (item.priority !== undefined) {
        lines.push(`    <priority>${Number(item.priority).toFixed(1)}</priority>`);
      }

      lines.push('  </url>');
      return lines.join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>',
    ''
  ].join('\n');
};

const buildSitemapIndex = (names) => {
  const generatedAt = new Date().toISOString();
  const entries = names
    .map(
      (name) => [
        '  <sitemap>',
        `    <loc>${escapeXml(`${baseUrl}/sitemaps/${name}.xml`)}</loc>`,
        `    <lastmod>${escapeXml(generatedAt)}</lastmod>`,
        '  </sitemap>'
      ].join('\n')
    )
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</sitemapindex>',
    ''
  ].join('\n');
};

const buildRobotsTxt = () => ['User-agent: *', 'Allow: /', '', `Sitemap: ${baseUrl}/sitemap.xml`, ''].join('\n');

const main = async () => {
  const mainPages = await readJson('main-pages.json');
  const games = await readJson('games.json');
  const wiki = await readJson('wiki.json');

  const sitemapData = {
    main: mainPages,
    games: games.map((item) => ({ ...item, path: toGamePath(item.slug) })),
    wiki: wiki.map((item) => ({ ...item, path: toWikiPath(item.slug) }))
  };

  await fs.mkdir(sitemapsDir, { recursive: true });

  const names = ['main', 'games', 'wiki'];
  for (const name of names) {
    const xml = buildChildSitemap(sitemapData[name]);
    await fs.writeFile(path.join(sitemapsDir, `${name}.xml`), xml, 'utf8');
  }

  await fs.writeFile(path.join(publishDir, 'sitemap.xml'), buildSitemapIndex(names), 'utf8');
  await fs.writeFile(path.join(publishDir, 'robots.txt'), buildRobotsTxt(), 'utf8');

  console.log(`Generated sitemap index and ${names.length} child sitemaps.`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
