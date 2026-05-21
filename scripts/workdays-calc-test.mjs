#!/usr/bin/env node
/** 検証用 xlsx の気象データで calcWorkdays を突合 */
import { calcWorkdays, inferFiscalYear } from './workdays-calc-core.mjs';

const XLSX = 'C:\\tmp\\稼働日数算出ツール\\稼働日数算出ツール_検証用_20260517.xlsx';

function readDaily(ws, startRow, colDate, colVal) {
  const rows = [];
  for (let r = startRow; r < 10000; r += 1) {
    const d = ws[`${colDate}${r}`]?.value;
    const v = ws[`${colVal}${r}`]?.value;
    if (d == null && v == null && r > startRow + 5) break;
    if (d == null) continue;
    let iso;
    if (d instanceof Date) {
      iso = d.toISOString().slice(0, 10);
    } else if (typeof d === 'number') {
      const base = new Date(Date.UTC(1899, 11, 30));
      const dt = new Date(base.getTime() + d * 86400000);
      iso = dt.toISOString().slice(0, 10);
    } else {
      iso = String(d).slice(0, 10);
    }
    const num = Number(v);
    if (Number.isNaN(num)) continue;
    rows.push({ date: iso, value: num });
  }
  return rows;
}

// openpyxl is python - use python subprocess instead
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const py = `
import json, openpyxl
from datetime import datetime, date
wb=openpyxl.load_workbook(r"${XLSX.replace(/\\/g, '\\\\')}", data_only=True)
def rows(ws,sr,cd,cv):
  out=[]
  for r in range(sr,10000):
    d=ws[f"{cd}{r}"].value
    v=ws[f"{cv}{r}"].value
    if d is None and v is None and r>sr+5: break
    if d is None: continue
    if isinstance(d,datetime): iso=d.date().isoformat()
    elif isinstance(d,date): iso=d.isoformat()
    elif isinstance(d,(int,float)):
      from datetime import timedelta
      iso=(date(1899,12,30)+timedelta(days=int(d))).isoformat()
    else: iso=str(d)[:10]
    try: val=float(v)
    except: continue
    out.append({"date":iso,"value":val})
  return out
wind=rows(wb["05_風速CSV取込"],11,"B","C")
rain=rows(wb["06_降雨CSV取込"],18,"B","C")
hum=rows(wb["06_湿度CSV取込"],18,"B","C")
print(json.dumps({"wind":wind,"rain":rain,"hum":hum}))
`;
const tmp = join(tmpdir(), 'workdays-export.json');
writeFileSync(tmp.replace('.json', '.py'), py);
const r = spawnSync('python', [tmp.replace('.json', '.py')], { encoding: 'utf8' });
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(1);
}
const data = JSON.parse(r.stdout.trim());

const result = calcWorkdays({
  startDate: '2025-04-01',
  endDate: '2026-03-31',
  fiscalYear: 2025,
  windTh: 10,
  rainTh: 10,
  humTh: 85,
  wind: data.wind,
  rain: data.rain,
  hum: data.hum,
});

console.log('足場:', result.scaffold.toFixed(4), '(期待 ~172.15)');
console.log('塗装:', result.paint.toFixed(4), '(期待 ~89.05)');
console.log('fiscal from start:', inferFiscalYear('2025-04-01'));
