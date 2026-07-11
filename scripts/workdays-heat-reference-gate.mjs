#!/usr/bin/env node
/** 688 WBGT 猛暑日参考 — 集計ゲート（calc-gate 不変） */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calcWorkdaysBundleForEstimate } from './workdays-calc-core.mjs';
import {
  parseCsvWbgtHourly,
  mergeWbgtCsvIntoRef5yr,
  buildHeatReferenceAverages,
  buildHeatAnnualReferenceAvg,
  heatBlockToMonthlyRows,
  monthlyRowsToHeatBlock,
  HEAT_REF5YR_KEY,
} from './workdays-heat-reference.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ref5yr = JSON.parse(readFileSync(path.join(root, 'scripts/data/workdays-5yr-omiya.json'), 'utf8'));

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const csvPath = path.join(root, 'scripts/data/workdays-wbgt-sample-saitama.csv');
const csvText = readFileSync(csvPath, 'utf8');
const hourly = parseCsvWbgtHourly(csvText);
assert(hourly.length > 1000, 'sample WBGT CSV parse');

const merged = mergeWbgtCsvIntoRef5yr(ref5yr, hourly);
assert(merged[HEAT_REF5YR_KEY], 'heat block created');

const heat2026 = buildHeatReferenceAverages(merged, 2026);
assert(heat2026 && heat2026.months.length === 12, 'heat monthly averages');

const july = heat2026.months.find((r) => r.m === 7);
assert(july && july.avg > 0, 'July heat avg > 0');

const annualAvg = buildHeatAnnualReferenceAvg(merged, 2026);
assert(annualAvg != null && annualAvg > 0, 'annual heat avg');

const bundleBefore = calcWorkdaysBundleForEstimate({
  estimateYear: 2026,
  ref5yr: ref5yr,
  holidayManual: [],
});
const bundleAfter = calcWorkdaysBundleForEstimate({
  estimateYear: 2026,
  ref5yr: merged,
  holidayManual: [],
});
assert(bundleBefore.scaffold === bundleAfter.scaffold, 'scaffold unchanged with heat data');
assert(bundleBefore.paint === bundleAfter.paint, 'paint unchanged with heat data');

// 687 wbgt_data 再読込経路: 月別行 → heat block → 過去5年表
const persistedRows = heatBlockToMonthlyRows(merged[HEAT_REF5YR_KEY]);
assert(persistedRows.length > 0, 'heatBlockToMonthlyRows for persist');
const reloadedBlock = monthlyRowsToHeatBlock(persistedRows);
const reloadedRef = { [HEAT_REF5YR_KEY]: reloadedBlock };
const reloadedHeat = buildHeatReferenceAverages(reloadedRef, 2026);
assert(reloadedHeat && reloadedHeat.months.length === 12, 'reloaded heat monthly averages');
const reloadedJuly = reloadedHeat.months.find((r) => r.m === 7);
assert(reloadedJuly && reloadedJuly.avg > 0, 'reloaded July heat avg > 0');

console.log('[workdays:heat-reference-gate] OK', {
  hourly_rows: hourly.length,
  july_avg: Number(july.avg.toFixed(2)),
  annual_avg: Number(annualAvg.toFixed(2)),
  scaffold: bundleAfter.scaffold,
  paint: bundleAfter.paint,
});
