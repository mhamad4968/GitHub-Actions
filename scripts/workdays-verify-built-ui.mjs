#!/usr/bin/env node
/** R1 — workdays built desktop.js に必須 UI/計算マーカーがあるか検証 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const app = String(process.argv[2] || '').trim();
const specs = {
  688: {
    file: 'customize/688/desktop.js',
    must: ['wd688-year-col', 'computeYearTotals', 'a.calYear !== b.calYear', 'renderExcelTransposedTable'],
  },
  687: {
    file: 'customize/687/desktop.js',
    must: ['holidayBreakdownInRange', 'calcWorkdays', 'JP_HOLIDAY_YMD'],
  },
};

const spec = specs[app];
if (!spec) {
  console.error('[workdays-verify-built-ui] Usage: node scripts/workdays-verify-built-ui.mjs <687|688>');
  process.exit(2);
}

const abs = path.join(process.cwd(), spec.file);
let src;
try {
  src = readFileSync(abs, 'utf8');
} catch (e) {
  console.error(`[workdays-verify-built-ui] ❌ read failed: ${spec.file}`);
  process.exit(1);
}

const missing = spec.must.filter((needle) => !src.includes(needle));
if (missing.length) {
  console.error(`[workdays-verify-built-ui] ❌ app=${app} missing in ${spec.file}:`);
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}

console.log(`[workdays-verify-built-ui] OK app=${app} file=${spec.file}`);
