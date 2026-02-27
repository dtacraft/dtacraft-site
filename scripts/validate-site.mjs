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

const walkHtmlPages = async () => {
  const pages = [];
  const walk = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      if (entry.isFile() && entry.name.endsWith('.html')) pages.push(full);
    }
  };
  await walk(publishDir);
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

  const htmlIssues = [];
  const requiredThemeIncludes = ['/assets/theme.css', '/assets/site.css', '/assets/theme.js', '/assets/site.js'];
  const requiredFontToken = 'fonts.googleapis.com/css2?family=Cinzel';
  const htmlPages = await walkHtmlPages();

  for (const page of htmlPages) {
    const rel = path.relative(publishDir, page).replaceAll(path.sep, '/');
    const html = await fs.readFile(page, 'utf8');

    for (const include of requiredThemeIncludes) {
      if (!html.includes(include)) {
        htmlIssues.push(`${rel}: missing ${include}`);
      }
    }

    if (!html.includes(requiredFontToken)) {
      htmlIssues.push(`${rel}: missing Cinzel/Noto Sans Google Fonts include`);
    }

    if (html.includes('<header class="nav">')) {
      if (!html.includes('class="brand" href="/"')) {
        htmlIssues.push(`${rel}: missing home link on logo/title in header`);
      }

      const requiredNavLinks = [
        { href: '/games/', label: 'Games' },
        { href: '/devlog/', label: 'Devlog' },
        { href: '/wiki/', label: 'Wiki / Rules' },
        { href: '/press/', label: 'Press' },
        { href: '/studio/', label: 'Studio' },
        { href: '/support/', label: 'Support' }
      ];

      for (const link of requiredNavLinks) {
        if (!html.includes(`href="${link.href}">${link.label}</a>`)) {
          htmlIssues.push(`${rel}: missing ${link.label} item in top navigation`);
        }
      }
    }
  }

  if (htmlIssues.length) {
    console.error('Theme/navigation consistency issues:\n' + htmlIssues.map((m) => `- ${m}`).join('\n'));
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${urls.size} URL targets, ${requiredFiles.length} generated files, and ${htmlPages.length} HTML theme/nav checks.`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
