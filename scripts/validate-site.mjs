#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const publishDir = path.join(repoRoot, 'dtacraft-site');
const contentDir = path.join(repoRoot, 'content');

const readJson = async (fileName) => {
  const raw = await fs.readFile(path.join(contentDir, fileName), 'utf8');
  return JSON.parse(raw);
};

const pathCandidates = (sitePath) => {
  const clean = sitePath === '/' ? '/' : sitePath.replace(/\/+$/, '');

  if (clean === '/') {
    return [path.join(publishDir, 'index.html')];
  }

  const noLead = clean.replace(/^\//, '');
  const candidates = [
    path.join(publishDir, noLead),
    path.join(publishDir, `${noLead}.html`),
    path.join(publishDir, noLead, 'index.html')
  ];

  return [...new Set(candidates)];
};

const fileExists = async (target) => {
  try {
    const stat = await fs.stat(target);
    return stat.isFile();
  } catch {
    return false;
  }
};

const main = async () => {
  const mainPages = await readJson('main-pages.json');
  const games = await readJson('games.json');
  const wiki = await readJson('wiki.json');

  const urls = [
    ...mainPages.map((item) => item.path),
    ...games.map((item) => `/games/${item.slug}/`),
    ...wiki.map((item) => `/wiki/${item.slug}/`)
  ];

  const missing = [];

  for (const sitePath of urls) {
    const candidates = pathCandidates(sitePath);
    let found = false;

    for (const candidate of candidates) {
      if (await fileExists(candidate)) {
        found = true;
        break;
      }
    }

    if (!found) {
      missing.push({ sitePath, candidates });
    }
  }

  const requiredGenerated = [
    '/sitemap.xml',
    '/sitemaps/main.xml',
    '/sitemaps/games.xml',
    '/sitemaps/wiki.xml',
    '/robots.txt'
  ];

  for (const sitePath of requiredGenerated) {
    const absolute = path.join(publishDir, sitePath.replace(/^\//, ''));
    if (!(await fileExists(absolute))) {
      missing.push({ sitePath, candidates: [absolute] });
    }
  }

  if (missing.length > 0) {
    console.error('Site validation failed. Missing files for:');
    for (const entry of missing) {
      console.error(`- ${entry.sitePath}`);
      for (const candidate of entry.candidates) {
        console.error(`  - checked: ${candidate}`);
      }
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${urls.length} listed URLs and required generated files.`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
