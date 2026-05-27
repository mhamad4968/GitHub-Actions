/**
 * 678 デプロイ用: SheetJS (xlsx.full.min.js) + desktop.js を 1 ファイルに結合する。
 * kintone customize は単一 JS アップロードのため、Excel 出力は SheetJS に委譲する。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const xlsxPath = join(root, 'node_modules/xlsx/dist/xlsx.full.min.js');
const desktopPath = join(root, 'customize/678/desktop.js');
const outPath = join(root, 'customize/678/desktop.bundle.js');

const xlsx = readFileSync(xlsxPath, 'utf8');
const desktop = readFileSync(desktopPath, 'utf8');
const banner =
  '/* kintone-ai-lab bundle: SheetJS ' +
  (JSON.parse(readFileSync(join(root, 'node_modules/xlsx/package.json'), 'utf8')).version || '?') +
  ' + customize/678/desktop.js — do not edit by hand */\n';
const out = banner + xlsx + '\n' + desktop + '\n';
writeFileSync(outPath, out, 'utf8');
console.log('[bundle-678-desktop] wrote', outPath, '(' + Math.round(out.length / 1024) + ' KiB)');
