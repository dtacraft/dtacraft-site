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

const escapeXml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const normalizeBaseUrl = (value) => value.replace(/\/+$/, '');

const ensureAbsoluteUrl = (baseUrl, sitePath) => {
  const safePath = sitePath.startsWith('/') ? sitePath : `/${sitePath}`;
  return `${baseUrl}${safePath}`;
};

const timestamp = () => new Date().toISOString();

const buildChildSitemap = (baseUrl, urls) => {
  const entries = urls
    .map((item) => {
      const lastmod = item.lastmod ?? timestamp();
      const lines = [
        '  <url>',
        `    <loc>${escapeXml(ensureAbsoluteUrl(baseUrl, item.path))}</loc>`,
        `    <lastmod>${escapeXml(lastmod)}</lastmod>`
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

const buildSitemapIndex = (baseUrl, names) => {
  const entries = names
    .map(
      (name) => [
        '  <sitemap>',
        `    <loc>${escapeXml(`${baseUrl}/sitemaps/${name}.xml`)}</loc>`,
        `    <lastmod>${escapeXml(timestamp())}</lastmod>`,
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

const buildRobotsTxt = (baseUrl) => [
  'User-agent: *',
  'Allow: /',
  '',
  `Sitemap: ${baseUrl}/sitemap.xml`,
  ''
].join('\n');

const main = async () => {
  const configRaw = await fs.readFile(configPath, 'utf8');
  const config = JSON.parse(configRaw);
  const baseUrl = normalizeBaseUrl(config.baseUrl);

  if (baseUrl !== 'https://dtacraft.com') {
    throw new Error(`Expected canonical base URL to be https://dtacraft.com, received: ${baseUrl}`);
  }

  await fs.mkdir(sitemapsDir, { recursive: true });

  const sitemapNames = [];
  for (const sitemap of config.sitemaps) {
    sitemapNames.push(sitemap.name);
    const xml = buildChildSitemap(baseUrl, sitemap.urls);
    const target = path.join(sitemapsDir, `${sitemap.name}.xml`);
    await fs.writeFile(target, xml, 'utf8');
  }

  const indexXml = buildSitemapIndex(baseUrl, sitemapNames);
  await fs.writeFile(path.join(publishDir, 'sitemap.xml'), indexXml, 'utf8');

  const robotsTxt = buildRobotsTxt(baseUrl);
  await fs.writeFile(path.join(publishDir, 'robots.txt'), robotsTxt, 'utf8');

  console.log(`Generated ${sitemapNames.length} sitemap files under ${sitemapsDir}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
