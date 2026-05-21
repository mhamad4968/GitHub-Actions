#!/usr/bin/env node
/**
 * Phase 2-C — RULES-INDEX §↔.mdc 双方向自動節 + data/rules-index-section-mdc-map.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildMergedMap,
  toJsonSerializable,
} from './lib/rules-index-section-mdc.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULES_INDEX = path.join(root, 'RULES-INDEX.md');
const MAP_JSON = path.join(root, 'data', 'rules-index-section-mdc-map.json');
const BEGIN = '<!-- RULES-INDEX:SECTION-MDC-AUTO:BEGIN -->';
const END = '<!-- RULES-INDEX:SECTION-MDC-AUTO:END -->';

function buildAutoBlock(map) {
  const { sectionToMdc, mdcToSection } = map;
  const lines = [];
  lines.push(BEGIN);
  lines.push('');
  lines.push('## § ↔ .mdc 双方向索引（自動生成・編集禁止）');
  lines.push('');
  lines.push(`**更新**: \`npm run rules:sync-section-mdc\`（${new Date().toISOString().slice(0, 10)} JST）`);
  lines.push('**正本**: `AGENTS.md` § 解釈 / 機械: `data/rules-index-section-mdc-map.json`');
  lines.push('');
  lines.push('### § → .mdc（抜粋）');
  lines.push('');
  lines.push('| § | .mdc |');
  lines.push('|---|------|');

  const secRows = [...sectionToMdc.entries()]
    .filter(([s]) => s !== '§(RULES-INDEX行)')
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .slice(0, 80);

  for (const [s, mdcs] of secRows) {
    const links = [...mdcs]
      .sort()
      .map((m) => `[\`${m}\`](.cursor/rules/${m})`)
      .join(' · ');
    lines.push(`| ${s} | ${links || '—'} |`);
  }

  if (sectionToMdc.size > 80) {
    lines.push('');
    lines.push(`_他 ${sectionToMdc.size - 80} 件は \`data/rules-index-section-mdc-map.json\` を参照_`);
  }

  lines.push('');
  lines.push('### .mdc → §（抜粋）');
  lines.push('');
  lines.push('| .mdc | § |');
  lines.push('|------|---|');

  const mdcRows = [...mdcToSection.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(0, 40);
  for (const [m, secs] of mdcRows) {
    lines.push(`| [\`${m}\`](.cursor/rules/${m}) | ${[...secs].sort().join(' · ')} |`);
  }

  lines.push('');
  lines.push(END);
  return lines.join('\r\n');
}

function main() {
  const dry = process.argv.includes('--dry-run');
  const map = buildMergedMap(root);
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
    const anchor = END.includes('CURSOR') ? '<!-- RULES-INDEX:CURSOR-RULES-AUTO:END -->' : '## ジャンル読本';
    const idx = body.indexOf('<!-- RULES-INDEX:CURSOR-RULES-AUTO:END -->');
    if (idx !== -1) {
      const insertAt = idx + '<!-- RULES-INDEX:CURSOR-RULES-AUTO:END -->'.length;
      body = `${body.slice(0, insertAt)}\r\n\r\n${block}\r\n${body.slice(insertAt)}`;
    } else {
      body = `${body.trimEnd()}\r\n\r\n${block}\r\n`;
    }
  }

  if (dry) {
    console.log('[sync-rules-index-section-mdc] dry-run OK', Object.keys(json.sectionToMdc).length, 'sections');
    return;
  }

  fs.writeFileSync(RULES_INDEX, body.endsWith('\r\n') ? body : `${body}\r\n`, 'utf8');
  console.log(
    '[sync-rules-index-section-mdc] OK',
    Object.keys(json.sectionToMdc).length,
    '§ keys,',
    Object.keys(json.mdcToSection).length,
    'mdc keys',
  );
}

main();
