/**
 * 新⑤ デploy用: SheetJS + annual-panel + desktop.js（ガイド誘導）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const xlsxPath = join(root, 'node_modules/xlsx/dist/xlsx.full.min.js');
const panelPath = join(root, 'customize/business-improvement-annual/annual-panel.js');
const desktopPath = join(root, 'customize/business-improvement-annual/desktop.js');
const outPath = join(root, 'customize/business-improvement-annual/desktop.bundle.js');

const xlsx = readFileSync(xlsxPath, 'utf8');
const panel = readFileSync(panelPath, 'utf8');
const desktop = readFileSync(desktopPath, 'utf8');
const banner =
  '/* kintone-ai-lab bundle: SheetJS + annual-panel + annual/desktop.js — do not edit by hand */\n';
const out = banner + xlsx + '\n' + panel + '\n' + desktop + '\n';
writeFileSync(outPath, out, 'utf8');
console.log('[bundle-bi-annual-desktop] wrote', outPath, '(' + Math.round(out.length / 1024) + ' KiB)');
