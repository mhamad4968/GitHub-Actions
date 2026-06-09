#!/usr/bin/env node
/**
 * 業務改善ガイド（699）申請編・評価編スクショを desktop.js に data URL 埋め込み
 *
 * 配置: customize/business-improvement-guide/assets/
 *   apply-00-guide.png     → guide
 *   apply-01-overview.png  → start
 *   apply-02-fields.png    → fields
 *   apply-03-accordion.png → accordion
 *   apply-04-attach.png    → attach
 *   apply-05-submit.png    → submit
 *   apply-06-confirm.png   → confirm
 *   eval-00-overview.png   → overview
 *   eval-01-cards-bi.png   → cardsBi
 *   eval-02-cards-idea.png → cardsIdea
 *   eval-03-result.png     → result
 *   eval-04-delegate.png   → delegate
 *   eval-05-pending-list.png → pendingList
 *   eval-06-eval-open.png  → evalOpen
 *   eval-07-approve.png    → approve
 *   eval-08-wf-route.png   → wfRoute
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

const APPLY_MAP = {
  'apply-00-guide.png': 'guide',
  'apply-01-overview.png': 'start',
  'apply-02-fields.png': 'fields',
  'apply-03-accordion.png': 'accordion',
  'apply-04-attach.png': 'attach',
  'apply-05-submit.png': 'submit',
  'apply-06-confirm.png': 'confirm',
};

const EVAL_MAP = {
  'eval-00-overview.png': 'overview',
  'eval-01-cards-bi.png': 'cardsBi',
  'eval-02-cards-idea.png': 'cardsIdea',
  'eval-03-result.png': 'result',
  'eval-04-delegate.png': 'delegate',
  'eval-05-pending-list.png': 'pendingList',
  'eval-06-eval-open.png': 'evalOpen',
  'eval-07-approve.png': 'approve',
  'eval-08-wf-route.png': 'wfRoute',
};

const MAP = { ...APPLY_MAP, ...EVAL_MAP };

const APPLY_KEYS = ['guide', 'start', 'fields', 'accordion', 'attach', 'submit', 'confirm'];
const EVAL_KEYS = [
  'overview',
  'cardsBi',
  'cardsIdea',
  'result',
  'delegate',
  'pendingList',
  'evalOpen',
  'approve',
  'wfRoute',
];

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

function readExistingBlock(src, varName) {
  const re = new RegExp(`var ${varName} = \\{([\\s\\S]*?)\\n  \\};`);
  const m = src.match(re);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split('\n')) {
    const km = line.match(/^\s+(\w+):\s+'(.*)',?\s*$/);
    if (km) out[km[1]] = km[2];
  }
  return out;
}

function blockLines(keys, values) {
  return keys.map((k) => `    ${k}: '${values[k] || ''}',`).join('\n');
}

function patchDesktop(applyKeys, evalKeys) {
  let src = readFileSync(DESKTOP, 'utf8');
  const applyRe = /var APPLY_SCREENSHOTS = \{[\s\S]*?\n  \};/;
  const evalRe = /var EVAL_SCREENSHOTS = \{[\s\S]*?\n  \};/;
  if (!applyRe.test(src)) throw new Error('APPLY_SCREENSHOTS block not found');
  if (!evalRe.test(src)) throw new Error('EVAL_SCREENSHOTS block not found');
  src = src.replace(applyRe, 'var APPLY_SCREENSHOTS = {\n' + blockLines(APPLY_KEYS, applyKeys) + '\n  };');
  src = src.replace(evalRe, 'var EVAL_SCREENSHOTS = {\n' + blockLines(EVAL_KEYS, evalKeys) + '\n  };');
  writeFileSync(DESKTOP, src, 'utf8');
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (!existsSync(ASSETS)) throw new Error(`assets folder missing: ${ASSETS}`);

  const files = readdirSync(ASSETS).filter((f) => MAP[f]);
  if (!files.length) {
    console.log('[bi-guide-embed] assets に apply-0N-*.png / eval-0N-*.png がありません');
    process.exit(0);
  }

  let src = readFileSync(DESKTOP, 'utf8');
  const applyOut = readExistingBlock(src, 'APPLY_SCREENSHOTS');
  const evalOut = readExistingBlock(src, 'EVAL_SCREENSHOTS');
  APPLY_KEYS.forEach((k) => {
    if (!(k in applyOut)) applyOut[k] = '';
  });
  EVAL_KEYS.forEach((k) => {
    if (!(k in evalOut)) evalOut[k] = '';
  });

  for (const name of files.sort()) {
    const key = MAP[name];
    const fp = path.join(ASSETS, name);
    if (dryRun) {
      console.log(`dry-run: ${name} → ${key}`);
      continue;
    }
    const dataUrl = toDataUrl(fp);
    if (APPLY_KEYS.includes(key)) applyOut[key] = dataUrl;
    else if (EVAL_KEYS.includes(key)) evalOut[key] = dataUrl;
    console.log(`OK ${name} → ${key} (${Math.round(dataUrl.length / 1024)} KB data URL)`);
  }

  if (!dryRun) {
    patchDesktop(applyOut, evalOut);
    console.log('[bi-guide-embed] patched desktop.js APPLY_SCREENSHOTS + EVAL_SCREENSHOTS');
    console.log('  次: npm run cio:preflight:699 -- --note "..." && npm run deploy:699');
  }
}

main();
