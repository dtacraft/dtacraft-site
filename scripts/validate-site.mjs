#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const publishDir = path.join(repoRoot, 'dtacraft-site');
const configPath = path.join(repoRoot, 'sitemap.config.json');

const fileExists = async (target) => {
  try {
    const stat = await fs.stat(target);
    return stat.isFile();
  } catch {
    return false;
  }
};

const candidateFiles = (sitePath) => {
  if (sitePath === '/') return [path.join(publishDir, 'index.html')];
  const clean = sitePath.replace(/^\//, '').replace(/\/$/, '');
  return [
    path.join(publishDir, `${clean}.html`),
    path.join(publishDir, clean, 'index.html')
  ];
};

const walkIndexPages = async (relativeDir, exclusions = []) => {
  const root = path.join(publishDir, relativeDir);
  const pages = [];
  const walk = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      if (entry.isFile() && entry.name === 'index.html') {
        const rel = `/${path.relative(publishDir, path.dirname(full)).replaceAll(path.sep, '/')}/`;
        if (!exclusions.includes(rel)) pages.push(rel);
      }
    }
  };
  await walk(root);
  return pages;
};

const main = async () => {
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  const urls = new Set(['/']);

  for (const entries of Object.values(config.staticSitemaps || {})) {
    for (const item of entries) urls.add(item.path);
  }

  for (const item of Object.values(config.autoscan || {})) {
    for (const p of await walkIndexPages(item.dir, item.exclude || [])) urls.add(p);
  }

  const missing = [];
  for (const sitePath of urls) {
    const found = await Promise.all(candidateFiles(sitePath).map(fileExists));
    if (!found.some(Boolean)) missing.push(sitePath);
  }

  const requiredFiles = ['/sitemap.xml', '/robots.txt', ...(config.sitemaps || []).map((n) => `/sitemaps/${n}.xml`)];
  for (const rel of requiredFiles) {
    if (!(await fileExists(path.join(publishDir, rel.replace(/^\//, ''))))) missing.push(rel);
  }

  if (missing.length) {
    console.error('Missing required files/paths:\n' + missing.map((m) => `- ${m}`).join('\n'));
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${urls.size} URL targets and ${requiredFiles.length} generated files.`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
