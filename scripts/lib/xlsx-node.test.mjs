import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from './xlsx-node.mjs';

assert.equal(XLSX.version, '0.20.3', 'SheetJS security-fixed version must stay pinned');

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const packageLock = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package-lock.json'), 'utf8'));
const officialTarball = 'https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz';
assert.equal(packageJson.devDependencies.xlsx, officialTarball);
assert.equal(packageLock.packages['node_modules/xlsx'].resolved, officialTarball);
assert.match(packageLock.packages['node_modules/xlsx'].integrity, /^sha512-/);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xlsx-node-'));
const file = path.join(dir, 'roundtrip.xlsx');

try {
  const main = XLSX.utils.aoa_to_sheet([
    ['text', 'number', 'formula', 'date', 'boolean'],
    ['日本語✓', 1234.5, null, new Date('2026-07-19T00:00:00.000Z'), true],
  ], { cellDates: true });
  main.C2 = { t: 'n', f: 'B2*2', v: 2469 };
  main['!merges'] = [XLSX.utils.decode_range('A3:A4')];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, main, 'Main');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['hidden']]), '非表示');
  workbook.Workbook = { Sheets: [{ Hidden: 0 }, { Hidden: 1 }] };
  XLSX.writeFile(workbook, file, { compression: true });

  const read = XLSX.readFile(file, { cellDates: true, cellFormula: true });
  assert.deepEqual(read.SheetNames, ['Main', '非表示']);
  assert.equal(read.Sheets.Main.A2.v, '日本語✓');
  assert.equal(read.Sheets.Main.B2.v, 1234.5);
  assert.equal(read.Sheets.Main.C2.f, 'B2*2');
  assert.equal(read.Sheets.Main.C2.v, 2469);
  assert.equal(read.Sheets.Main.D2.v.toISOString().slice(0, 10), '2026-07-19');
  assert.equal(read.Sheets.Main.E2.v, true);
  assert.equal(XLSX.utils.encode_range(read.Sheets.Main['!merges'][0]), 'A3:A4');
  assert.equal(read.Workbook.Sheets[1].Hidden, 1);
  console.log('[verify:xlsx-node] OK version=0.20.3 roundtrip');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
