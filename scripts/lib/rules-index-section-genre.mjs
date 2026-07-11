/**
 * § ↔ ジャンル読本 双方向マップ構築
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadGenreCatalog } from './constitution-genre-catalog.mjs';
import { normalizeSection, extractSections } from './rules-index-section-mdc.mjs';

const RE_PRIMARY = /^§(\d+)/;

function loadOverrides(root) {
  const p = path.join(root, 'data', 'constitution-section-genre-overrides.json');
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf8')).sectionToGenre || {};
}

function primaryNumber(section) {
  const m = String(section).match(RE_PRIMARY);
  return m ? Number(m[1]) : null;
}

function inRange(n, range) {
  if (n == null || !range) return false;
  if (n < range.min || n > range.max) return false;
  return true;
}

function matchesPrefix(section, prefix) {
  return String(section).startsWith(prefix);
}

function matchesAnyPrefix(section, prefixes) {
  return (prefixes || []).some((p) => matchesPrefix(section, p));
}

function addToMap(map, section, genreFile) {
  const key = normalizeSection(section);
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(genreFile);
}

function assignGenres(section, catalog) {
  const genres = new Set();
  const key = normalizeSection(section);

  for (const [s, files] of Object.entries(catalog.specialSectionToGenre || {})) {
    if (key === normalizeSection(s) || key.startsWith(normalizeSection(s))) {
      for (const f of files) genres.add(f);
    }
  }

  for (const manual of catalog.manualPhase2 || []) {
    for (const p of manual.sectionPrefixes || []) {
      if (matchesPrefix(key, p)) genres.add(manual.file);
    }
  }

  if (genres.size) return genres;

  for (const g of catalog.extractedGenres || []) {
    if (g.sectionPrefix && matchesPrefix(key, g.sectionPrefix)) {
      genres.add(g.file);
      continue;
    }
    if (g.sectionPrefixes && matchesAnyPrefix(key, g.sectionPrefixes)) {
      genres.add(g.file);
      continue;
    }
    const n = primaryNumber(key);
    if (g.sectionRange && inRange(n, g.sectionRange)) {
      const excluded = (g.sectionRange.excludePrefixes || []).some((p) => matchesPrefix(key, p));
      if (!excluded) genres.add(g.file);
    }
  }

  if (key.startsWith('§1-2')) {
    genres.add('17-four-ai-mode-b.md');
  }

  return genres;
}

export function parseRulesIndexGenreTable(rulesIndexText) {
  const map = new Map();
  const lines = rulesIndexText.split(/\r?\n/);
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith('## ジャンル読本 早見')) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith('---')) break;
    if (!inTable || !line.trim().startsWith('|')) continue;
    if (/^\|\s*[-:]+\s*\|/.test(line)) continue;
    const m = line.match(/\]\((docs\/constitution\/[^)]+)\)/);
    if (!m) continue;
    const genreFile = path.basename(m[1]);
    const sections = extractSections(line);
    for (const s of sections) addToMap(map, s, genreFile);
    if (/（階層）/.test(line)) addToMap(map, '§(階層)', genreFile);
  }
  return map;
}

export function buildMergedSectionGenreMap(root) {
  const catalog = loadGenreCatalog();
  const overrides = loadOverrides(root);
  const sectionToGenre = new Map();
  const genreToSection = new Map();

  const ingest = (section, genreFile) => {
    addToMap(sectionToGenre, section, genreFile);
    if (!genreToSection.has(genreFile)) genreToSection.set(genreFile, new Set());
    genreToSection.get(genreFile).add(normalizeSection(section));
  };

  const rulesIndex = fs.readFileSync(path.join(root, 'RULES-INDEX.md'), 'utf8');
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  const constitutionDir = path.join(root, 'docs', 'constitution');

  for (const [s, files] of parseRulesIndexGenreTable(rulesIndex).entries()) {
    for (const f of files) ingest(s, f);
  }

  const allSections = new Set([
    ...extractSections(agents),
    ...extractSections(rulesIndex),
  ]);

  for (const name of fs.readdirSync(constitutionDir)) {
    if (!name.endsWith('.md')) continue;
    allSections.add(...extractSections(fs.readFileSync(path.join(constitutionDir, name), 'utf8')));
  }

  for (const section of allSections) {
    for (const genreFile of assignGenres(section, catalog)) {
      ingest(section, genreFile);
    }
  }

  for (const [section, files] of Object.entries(overrides)) {
    for (const f of files) ingest(section, f);
  }

  const metaLinks = {
    '25-constitution-no-replacement-charter.md': ['§57'],
    '26-formalization-lifecycle-charter.md': ['§57'],
    '27-constitution-navigation-charter.md': ['§0'],
    '28-ceo-go-phases-charter.md': ['§57', '§50-3-8'],
  };
  for (const m of catalog.metaCharters || []) {
    const genreFile = m.file;
    const charterPath = path.join(constitutionDir, genreFile);
    if (fs.existsSync(charterPath)) {
      for (const s of extractSections(fs.readFileSync(charterPath, 'utf8'))) {
        ingest(s, genreFile);
      }
    }
    for (const s of metaLinks[genreFile] || []) {
      ingest(s, genreFile);
    }
  }

  return { sectionToGenre, genreToSection, catalogVersion: catalog.version };
}

export function toJsonSerializable({ sectionToGenre, genreToSection, catalogVersion }) {
  const s2g = {};
  for (const [s, set] of [...sectionToGenre.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    s2g[s] = [...set].sort();
  }
  const g2s = {};
  for (const [g, set] of [...genreToSection.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    g2s[g] = [...set].sort();
  }
  return {
    generatedAt: new Date().toISOString(),
    catalogVersion,
    sectionToGenre: s2g,
    genreToSection: g2s,
  };
}
