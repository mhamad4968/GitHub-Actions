#!/usr/bin/env node
/**
 * 業務改善ガイド（699）申請編スクショを desktop.js に data URL 埋め込み
 * （単独 fileKey は <img> で表示できないため base64 埋め込み方式）
 *
 * 配置: customize/business-improvement-guide/assets/
 *   apply-00-guide.png     → guide
 *   apply-01-overview.png  → start
 *   apply-02-fields.png    → fields
 *   apply-03-accordion.png → accordion
 *   apply-04-attach.png    → attach
 *   apply-05-submit.png    → submit
 *   apply-06-confirm.png   → confirm
 *
 *   node scripts/bi-guide-upload-screenshots.mjs
 *   node scripts/bi-guide-upload-screenshots.mjs --dry-run
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'customize', 'business-improvement-guide', 'assets');
const DESKTOP = path.join(ROOT, 'customize', 'business-improvement-guide', 'desktop.js');

const MAP = {
  'apply-00-guide.png': 'guide',
  'apply-01-overview.png': 'start',
  'apply-02-fields.png': 'fields',
  'apply-03-accordion.png': 'accordion',
  'apply-04-attach.png': 'attach',
  'apply-05-submit.png': 'submit',
  'apply-06-confirm.png': 'confirm',
};

const EMPTY_KEYS = ['guide', 'start', 'fields', 'accordion', 'attach', 'submit', 'confirm'];

function mimeFor(name) {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

function toDataUrl(filePath) {
  const name = path.basename(filePath);
  const buf = readFileSync(filePath);
  return `data:${mimeFor(name)};base64,${buf.toString('base64')}`;
}

function patchDesktop(keys) {
  let src = readFileSync(DESKTOP, 'utf8');
  const blockRe = /var APPLY_SCREENSHOTS = \{[\s\S]*?\};/;
  if (!blockRe.test(src)) throw new Error('APPLY_SCREENSHOTS block not found');
  const lines = EMPTY_KEYS.map((k) => `    ${k}: '${keys[k] || ''}',`).join('\n');
  const next = 'var APPLY_SCREENSHOTS = {\n' + lines + '\n  };';
  src = src.replace(blockRe, next);
  writeFileSync(DESKTOP, src, 'utf8');
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (!existsSync(ASSETS)) throw new Error(`assets folder missing: ${ASSETS}`);

  const files = readdirSync(ASSETS).filter((f) => MAP[f]);
  if (!files.length) {
    console.log('[bi-guide-embed] assets に apply-0N-*.png がありません');
    process.exit(0);
  }

  const out = {};
  EMPTY_KEYS.forEach((k) => { out[k] = ''; });

  for (const name of files.sort()) {
    const key = MAP[name];
    const fp = path.join(ASSETS, name);
    if (dryRun) {
      console.log(`dry-run: ${name} → ${key}`);
      continue;
    }
    out[key] = toDataUrl(fp);
    console.log(`OK ${name} → ${key} (${Math.round(out[key].length / 1024)} KB data URL)`);
  }

  if (!dryRun) {
    patchDesktop(out);
    console.log('[bi-guide-embed] patched desktop.js APPLY_SCREENSHOTS (data URL)');
    console.log('  次: npm run cio:preflight:699 -- --note "..." && npm run deploy:699');
  }
}

main();
