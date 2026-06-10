/**
 * constitution-genre-catalog.json — GENRES 単一正本ローダ
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CATALOG_PATH = path.join(root, 'data', 'constitution-genre-catalog.json');

export function loadGenreCatalog() {
  return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
}

/** extract-constitution-by-genre.mjs 互換 GENRES 配列 */
export function getExtractGenres() {
  const catalog = loadGenreCatalog();
  return catalog.extractedGenres.map((g) => {
    const meta = {
      file: g.file,
      title: g.title,
      when: g.when,
    };
    if (g.chapterStart) meta.start = new RegExp(g.chapterStart);
    if (g.chapterEnd) meta.end = new RegExp(g.chapterEnd);
    if (g.chapter) meta.chapter = new RegExp(g.chapter);
    if (g.extraChapter) meta.extraChapter = new RegExp(g.extraChapter);
    if (g.combineExtraChapter) meta.combineExtraChapter = true;
    return meta;
  });
}

export function getManualPhase2Files() {
  return loadGenreCatalog().manualPhase2.map((m) => m.file);
}

export function getDesktopGenres() {
  return loadGenreCatalog().desktopGenres;
}

export function getDesktopManual() {
  const catalog = loadGenreCatalog();
  return catalog.manualPhase2.map((m) => [
    m.file.replace('.md', ''),
    m.title,
    m.when,
    '全員',
  ]);
}
