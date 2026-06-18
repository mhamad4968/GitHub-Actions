#!/usr/bin/env node
/**
 * 実行予算書リストマスタ — コード.xlsx + 書式.xls リスト → seed JSON
 *   node scripts/jikkou-yosan-extract-master-data.mjs
 *   node scripts/jikkou-yosan-extract-master-data.mjs --code-dir "C:\\tmp\\実行予算書"
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const codeDir = process.argv.includes('--code-dir')
  ? process.argv[process.argv.indexOf('--code-dir') + 1]
  : 'C:\\tmp\\実行予算書';
const outPath = path.join(__dirname, 'data', 'jikkou-yosan-master-seed.json');

const py = `
import openpyxl, os, json, xlrd, sys
base = sys.argv[1]
code_file = None
for f in os.listdir(base):
    p = os.path.join(base, f)
    if f.endswith('.xlsx') and not f.startswith('~') and os.path.getsize(p) < 100000:
        code_file = p
        break
if not code_file:
    raise SystemExit('code xlsx not found')
wb = openpyxl.load_workbook(code_file, data_only=True)
ws = wb.active

def fmt_num(v):
    if v is None: return ''
    if isinstance(v, float) and v == int(v): return str(int(v))
    return str(v).strip()

code_rows = []
cur_item = cur_exp_code = cur_exp_name = cur_work_code = cur_work_name = ''
for r in range(4, ws.max_row + 1):
    item = ws.cell(r, 2).value
    if item: cur_item = str(item).strip()
    ec = ws.cell(r, 4).value
    en = ws.cell(r, 6).value
    if ec not in (None, ''): cur_exp_code = fmt_num(ec)
    if en: cur_exp_name = str(en).strip()
    wc = ws.cell(r, 11).value
    wn = ws.cell(r, 13).value
    work_code = fmt_num(wc) if wc not in (None, '') else ''
    work_name = str(wn).strip() if wn else ''
    if work_name:
        cur_work_code, cur_work_name = work_code, work_name
    sc = ws.cell(r, 23).value
    sn = ws.cell(r, 25).value
    sub_code = fmt_num(sc) if sc not in (None, '') else ''
    sub_name = str(sn).strip() if sn else ''
    definition = ws.cell(r, 32).value
    definition = str(definition).strip() if definition else ''
    if not any([cur_item, cur_exp_code, cur_exp_name, cur_work_name, sub_name, definition]):
        continue
    code_rows.append({
        'list_category': 'code_row',
        'item_group': cur_item,
        'expense_code': cur_exp_code,
        'expense_name': cur_exp_name,
        'work_type_code': cur_work_code if work_name else work_code,
        'work_type_name': work_name,
        'sub_type_code': sub_code,
        'sub_type_name': sub_name,
        'definition': definition,
        'sort_order': len(code_rows) + 1,
        'source': 'code_xlsx',
    })

xls = [os.path.join(base, x) for x in os.listdir(base) if x.endswith('.xls') and not x.startswith('~')][0]
book = xlrd.open_workbook(xls)
sh = book.sheet_by_name('リスト')
list_rows = []
for r in range(5, sh.nrows):
    for col, cat in [(1, 'order_branch'), (3, 'department'), (5, 'girder_type'), (8, 'unit'), (10, 'tax_rate')]:
        v = sh.cell_value(r, col)
        if v is None or str(v).strip() == '': continue
        s = fmt_num(v) if cat == 'tax_rate' else str(v).strip()
        sub = ''
        if cat == 'girder_type' and col + 1 < sh.ncols:
            sub = str(sh.cell_value(r, col + 1)).strip()
        list_rows.append({
            'list_category': cat,
            'item_name': s,
            'item_sub_name': sub,
            'sort_order': len(list_rows) + 1,
            'source': 'list_xls',
        })

out = {'code_rows': len(code_rows), 'list_rows': len(list_rows), 'records': code_rows + list_rows}
print(json.dumps(out, ensure_ascii=False))
`;

const json = execFileSync('python', ['-c', py, codeDir], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const data = JSON.parse(json);
writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Wrote ${outPath} (${data.records.length} records: code=${data.code_rows} list=${data.list_rows})`);
