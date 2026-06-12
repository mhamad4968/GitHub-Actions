/**
 * 699 デプロイ用: SheetJS + 年次パネル + ご利用ガイド desktop.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const xlsxPath = join(root, 'node_modules/xlsx/dist/xlsx.full.min.js');
const panelPath = join(root, 'customize/business-improvement-annual/annual-panel.js');
const desktopPath = join(root, 'customize/business-improvement-guide/desktop.js');
const outPath = join(root, 'customize/business-improvement-guide/desktop.bundle.js');

const xlsx = readFileSync(xlsxPath, 'utf8');
const panel = readFileSync(panelPath, 'utf8');
const desktop = readFileSync(desktopPath, 'utf8');
const banner =
  '/* kintone-ai-lab bundle: SheetJS + annual-panel + guide/desktop.js — do not edit by hand */\n';
const out = banner + xlsx + '\n' + panel + '\n' + desktop + '\n';
writeFileSync(outPath, out, 'utf8');
console.log('[bundle-bi-guide-desktop] wrote', outPath, '(' + Math.round(out.length / 1024) + ' KiB)');
