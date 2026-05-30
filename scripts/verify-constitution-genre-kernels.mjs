#!/usr/bin/env node
/**
 * ジャンル別 AI-KERNEL 4要素読本 — 整合検証（第10層・憲法細分化）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KERNEL_DIR = 'docs/constitution';

const KERNELS = [
  { file: '19-governance-four-ai-kernel.md', markers: ['統制・役割', '§35-1', 'verify:cio-four-ai-governance'] },
  { file: '20-cost-token-defense-kernel.md', markers: ['15ターン', 'export-handoff', 'verify:cio-session-dissolution'] },
  { file: '21-autonomous-patrol-kernel.md', markers: ['週末', 'rollback:weekend-actions', 'WEEKEND'] },
  { file: '22-error-handling-kernel.md', markers: ['3択', 'verify:cio-spec-logic', 'escalation-guard'] },
];

const HEADINGS = ['## 前提条件', '## 実行手順', '## 禁止事項', '## 判定コード'];

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
  if (!fs.readFileSync(readme, 'utf8').includes('19-governance-four-ai-kernel')) {
    issues.push('README.md missing kernel table entries');
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (!pkg.scripts?.['verify:constitution-genre-kernels']) {
    issues.push('package.json scripts.verify:constitution-genre-kernels');
  }

  if (issues.length) {
    console.error('[verify:constitution-genre-kernels] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:constitution-genre-kernels] OK 4ジャンル AI-KERNEL 整合');
  process.exit(0);
}

main();
