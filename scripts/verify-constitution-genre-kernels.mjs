#!/usr/bin/env node
/**
 * ジャンル別読本 — 整合検証（AI-KERNEL 4要素 + Desktop 28 + RULES-INDEX）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KERNEL_DIR = 'docs/constitution';

const KERNELS = [
  { file: '19-governance-four-ai-kernel.md', markers: ['統制・役割', '§35-1', 'verify:cio-four-ai-governance', 'cio:tool:route'] },
  { file: '20-cost-token-defense-kernel.md', markers: ['15ターン', 'export-handoff', 'verify:cio-session-dissolution', 'cio:session:cold-start'] },
  { file: '21-autonomous-patrol-kernel.md', markers: ['週末', 'rollback:weekend-actions', 'WEEKEND'] },
  { file: '22-error-handling-kernel.md', markers: ['3択', 'verify:cio-spec-logic', 'escalation-guard'] },
  { file: '23-project-closure-recognition-kernel.md', markers: ['認識同期', 'verify:checkpoint-project-closure', '§41', 'handoff:append-block'] },
];

const HEADINGS = ['## 前提条件', '## 実行手順', '## 禁止事項', '## 判定コード'];

const RULES_INDEX_GENRE_ROWS = [
  '18-ai-team-read-map.md',
  '19-governance-four-ai-kernel.md',
  '20-cost-token-defense-kernel.md',
  '21-autonomous-patrol-kernel.md',
  '22-error-handling-kernel.md',
  '23-project-closure-recognition-kernel.md',
  '28-CONSTITUTION-GENRE-MAP.txt',
];

const DESKTOP_MAP_MARKERS = [
  '【28-CONSTITUTION-GENRE-MAP】',
  '4AI — 誰が何を読む',
  '19-governance-four-ai-kernel',
  'verify:constitution-genre-kernels',
];

function main() {
  const issues = [];
  for (const k of KERNELS) {
    const p = path.join(root, KERNEL_DIR, k.file);
    if (!fs.existsSync(p)) {
      issues.push(`missing: ${k.file}`);
      continue;
    }
    const text = fs.readFileSync(p, 'utf8');
    for (const h of HEADINGS) {
      if (!text.includes(h)) issues.push(`${k.file} missing ${h}`);
    }
    for (const m of k.markers) {
      if (!text.includes(m)) issues.push(`${k.file} missing marker: ${m}`);
    }
  }

  const readme = path.join(root, KERNEL_DIR, 'README.md');
  const readmeText = fs.readFileSync(readme, 'utf8');
  if (!readmeText.includes('19-governance-four-ai-kernel')) {
    issues.push('README.md missing kernel table entries');
  }
  if (!readmeText.includes('18-ai-team-read-map')) {
    issues.push('README.md missing 18-ai-team-read-map');
  }
  if (!readmeText.includes('23-project-closure-recognition-kernel')) {
    issues.push('README.md missing 23-project-closure-recognition-kernel');
  }

  const rulesIndex = fs.readFileSync(path.join(root, 'RULES-INDEX.md'), 'utf8');
  if (!rulesIndex.includes('<!-- RULES-INDEX:SECTION-GENRE-AUTO:BEGIN -->')) {
    issues.push('RULES-INDEX.md missing SECTION-GENRE-AUTO block — run npm run rules:sync-section-genre');
  }
  const catalogPath = path.join(root, 'data', 'constitution-genre-catalog.json');
  if (!fs.existsSync(catalogPath)) {
    issues.push('missing data/constitution-genre-catalog.json');
  }
  for (const row of RULES_INDEX_GENRE_ROWS) {
    if (!rulesIndex.includes(row)) {
      issues.push(`RULES-INDEX.md missing genre row: ${row}`);
    }
  }

  const mapPath = path.join(
    root,
    'chat-sessions/desktop-ai-emergency-read-pack/28-CONSTITUTION-GENRE-MAP.txt',
  );
  if (!fs.existsSync(mapPath)) {
    issues.push('missing Desktop map: 28-CONSTITUTION-GENRE-MAP.txt');
  } else {
    const mapText = fs.readFileSync(mapPath, 'utf8');
    for (const m of DESKTOP_MAP_MARKERS) {
      if (!mapText.includes(m)) issues.push(`28-CONSTITUTION-GENRE-MAP.txt missing: ${m}`);
    }
  }

  const manifestPath = path.join(root, KERNEL_DIR, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!Array.isArray(manifest.manualPhase2) || manifest.manualPhase2.length < 8) {
      issues.push('manifest.json manualPhase2 incomplete');
    }
    if (!manifest.catalog) {
      issues.push('manifest.json missing catalog pointer');
    }
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (!pkg.scripts?.['verify:constitution-genre-kernels']) {
    issues.push('package.json scripts.verify:constitution-genre-kernels');
  }
  if (!pkg.scripts?.['constitution:sync-genre-desktop-map']) {
    issues.push('package.json scripts.constitution:sync-genre-desktop-map');
  }

  if (issues.length) {
    console.error('[verify:constitution-genre-kernels] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:constitution-genre-kernels] OK ジャンル+AI-KERNEL+Desktop28+索引 整合');
  process.exit(0);
}

main();
