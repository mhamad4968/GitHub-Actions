#!/usr/bin/env node
/**
 * Phase 2-D — RULES-INDEX §↔ジャンル読本 双方向自動節 + data/constitution-section-genre-map.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildMergedSectionGenreMap,
  toJsonSerializable,
} from './lib/rules-index-section-genre.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULES_INDEX = path.join(root, 'RULES-INDEX.md');
const MAP_JSON = path.join(root, 'data', 'constitution-section-genre-map.json');
const BEGIN = '<!-- RULES-INDEX:SECTION-GENRE-AUTO:BEGIN -->';
const END = '<!-- RULES-INDEX:SECTION-GENRE-AUTO:END -->';

function buildAutoBlock(map) {
  const { sectionToGenre, genreToSection } = map;
  const lines = [];
  lines.push(BEGIN);
  lines.push('');
  lines.push('## § ↔ ジャンル読本 双方向索引（自動生成・編集禁止）');
  lines.push('');
  lines.push(`**更新**: \`npm run rules:sync-section-genre\`（${new Date().toISOString().slice(0, 10)} JST）`);
  lines.push('**正本**: `AGENTS.md` § 解釈 / 機械: `data/constitution-section-genre-map.json`');
  lines.push('**カタログ**: `data/constitution-genre-catalog.json`');
  lines.push('');
  lines.push('> 本節は **索引専用**。矛盾時は **AGENTS.md** が正。手動表「ジャンル読本 早見」はフォールバック。');
  lines.push('');
  lines.push('### § → ジャンル（抜粋）');
  lines.push('');
  lines.push('| § | ジャンル読本 |');
  lines.push('|---|-------------|');

  const secRows = [...sectionToGenre.entries()]
    .filter(([s]) => s !== '§(階層)' && s !== '§(RULES-INDEX行)')
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .slice(0, 60);

  for (const [s, genres] of secRows) {
    const links = [...genres]
      .sort()
      .map((g) => `[\`${g}\`](docs/constitution/${g})`)
      .join(' · ');
    lines.push(`| ${s} | ${links || '—'} |`);
  }

  if (sectionToGenre.size > 60) {
    lines.push('');
    lines.push(`_他 ${sectionToGenre.size - 60} 件は \`data/constitution-section-genre-map.json\` を参照_`);
  }

  lines.push('');
  lines.push('### ジャンル → §（抜粋）');
  lines.push('');
  lines.push('| ジャンル | § |');
  lines.push('|----------|---|');

  const genreRows = [...genreToSection.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(0, 30);
  for (const [g, secs] of genreRows) {
    const shown = [...secs].sort().slice(0, 8).join(' · ');
    const suffix = secs.size > 8 ? ' …' : '';
    lines.push(`| [\`${g}\`](docs/constitution/${g}) | ${shown}${suffix} |`);
  }

  lines.push('');
  lines.push(END);
  return lines.join('\r\n');
}

function main() {
  const dry = process.argv.includes('--dry-run');
  const map = buildMergedSectionGenreMap(root);
  const json = toJsonSerializable(map);
  const block = buildAutoBlock(map);

  if (!dry) {
    fs.writeFileSync(MAP_JSON, `${JSON.stringify(json, null, 2)}\r\n`, 'utf8');
  }

  let body = fs.readFileSync(RULES_INDEX, 'utf8');
  if (body.includes(BEGIN) && body.includes(END)) {
    const re = new RegExp(
      `${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    );
    body = body.replace(re, block);
  } else {
    const anchor = '## ジャンル読本 早見（§ → ファイル）';
    const idx = body.indexOf(anchor);
    if (idx !== -1) {
      body = `${body.slice(0, idx)}${block}\r\n\r\n${body.slice(idx)}`;
    } else {
      body = `${body.trimEnd()}\r\n\r\n${block}\r\n`;
    }
  }

  if (dry) {
    console.log(
      '[sync-rules-index-section-genre] dry-run OK',
      Object.keys(json.sectionToGenre).length,
      'sections',
    );
    return;
  }

  fs.writeFileSync(RULES_INDEX, body.endsWith('\r\n') ? body : `${body}\r\n`, 'utf8');
  console.log(
    '[sync-rules-index-section-genre] OK',
    Object.keys(json.sectionToGenre).length,
    '§ keys,',
    Object.keys(json.genreToSection).length,
    'genre keys',
  );
}

main();
