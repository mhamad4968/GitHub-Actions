#!/usr/bin/env node
/** @file verify security-training masters exist and meta matches files. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const mastersDir = path.join(repoRoot, 'docs/training/security/masters');

const REQUIRED = [
  '2026-security-training-master.pptx',
  '2026-security-training-distribution.docx',
  '2026-security-training-master.meta.json',
  '2026-security-training-master-outline.md',
  'README.md',
];

let ng = 0;

for (const name of REQUIRED) {
  const p = path.join(mastersDir, name);
  if (!fs.existsSync(p)) {
    console.error(`[verify:security-training-masters] NG missing ${name}`);
    ng++;
  }
}

const metaPath = path.join(mastersDir, '2026-security-training-master.meta.json');
if (fs.existsSync(metaPath)) {
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const pptxPath = path.join(mastersDir, '2026-security-training-master.pptx');
  if (fs.existsSync(pptxPath)) {
    const size = fs.statSync(pptxPath).size;
    if (meta.pptx_bytes !== size) {
      console.error(
        `[verify:security-training-masters] NG pptx size drift meta=${meta.pptx_bytes} actual=${size} — run security-training:sync-masters`,
      );
      ng++;
    }
    if (meta.slide_count < 12) {
      console.error(`[verify:security-training-masters] NG slide_count too low: ${meta.slide_count}`);
      ng++;
    }
  }
}

if (ng) {
  console.error(`[verify:security-training-masters] NG count=${ng}`);
  process.exit(2);
}

console.log('[verify:security-training-masters] OK masters + meta');
