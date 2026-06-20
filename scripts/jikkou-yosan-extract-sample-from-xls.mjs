#!/usr/bin/env node
/**
 * 書式.xls → サンプル 2623001-001 JSON（Excel 正本）
 *   node scripts/jikkou-yosan-extract-sample-from-xls.mjs
 *   node scripts/jikkou-yosan-extract-sample-from-xls.mjs --code-dir "C:\\tmp\\実行予算書"
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const codeDir = process.argv.includes('--code-dir')
  ? process.argv[process.argv.indexOf('--code-dir') + 1]
  : 'C:\\tmp\\実行予算書';
const outPath = path.join(__dirname, 'data', 'jikkou-yosan-sample-2623001-extracted.json');

const py = `
# -*- coding: utf-8 -*-
import xlrd, os, json, re, sys
base = sys.argv[1]

def find_xls():
    for f in os.listdir(base):
        if f.endswith('.xls') and not f.startswith('~'):
            return os.path.join(base, f)
    raise SystemExit('xls not found in ' + base)

def fmt(v):
    if v is None or v == '': return ''
    if isinstance(v, float):
        if v == int(v): return str(int(v))
        return str(v)
    return str(v).strip()

def num(v):
    if v in ('', None): return 0
    try: return float(v)
    except: return 0

def reiwa_to_western(reiwa_y, m, d):
    y = int(float(reiwa_y)) + 2018
    return '%04d-%02d-%02d' % (y, int(float(m)), int(float(d)))

def normalize_code(s):
    tbl = str.maketrans('０１２３４５６７８９－', '0123456789-')
    return str(s).translate(tbl).strip()

def excel_date_parts(r, c_year, c_month, c_day):
    y = fmt(sh.cell_value(r, c_year))
    m = fmt(sh.cell_value(r, c_month))
    d = fmt(sh.cell_value(r, c_day))
    if not y or not m or not d: return ''
    return '%s-%02d-%02d' % (y, int(float(m)), int(float(d)))

def marker_from_note(note):
    m = re.search(r'…([②③④⑤⑥⑦⑧⑨①])', note or '')
    return m.group(1) if m else ''

def excel_border_role(rowx, c0):
    if rowx >= sh.nrows or sh.row_len(rowx) == 0:
        return 'standalone'
    cell = sh.cell(rowx, 0)
    if cell.xf_index is None:
        return 'group_subtotal' if c0 == '計' else 'standalone'
    b = book.xf_list[cell.xf_index].border
    top, bot = b.top_line_style, b.bottom_line_style
    if c0 == '計':
        return 'group_subtotal'
    if top >= 1 and bot >= 1:
        return 'standalone'
    if top >= 1 and bot == 0:
        return 'group_first'
    if top == 0 and bot == 0:
        return 'group_inner'
    if top == 0 and bot >= 1:
        return 'group_subtotal'
    return 'standalone'

def row_with_border(row, rowx, c0):
    row['excel_border_role'] = excel_border_role(rowx, c0)
    return row

xls = find_xls()
book = xlrd.open_workbook(xls, formatting_info=True)
sh = book.sheet_by_name('総括表')
shd = book.sheet_by_name('詳細表')

pc = normalize_code(fmt(sh.cell_value(9, 0)))
header = {
    'version_type': fmt(sh.cell_value(7, 1)) or '当初',
    'site_entry_date': excel_date_parts(7, 9, 13, 15),
    'draft_date': excel_date_parts(7, 32, 36, 38),
    'project_code': pc,
    'project_official_name': fmt(sh.cell_value(8, 14)),
    'project_name': fmt(sh.cell_value(9, 14)),
    'girder_type': fmt(sh.cell_value(9, 38)),
    'client_name': fmt(sh.cell_value(10, 3)),
    'safety_rule_88': '有',
    'start_date': reiwa_to_western(sh.cell_value(10, 24), sh.cell_value(10, 26), sh.cell_value(10, 28)),
    'end_date': reiwa_to_western(sh.cell_value(10, 34), sh.cell_value(10, 36), sh.cell_value(10, 38)),
    'status': '下書き',
    'note': '書式.xls サンプル %s 取込' % pc,
}

spec_lines = []
for r in range(12, 22):
    name = fmt(sh.cell_value(r, 0))
    if not name or name.startswith('仕') or name.startswith('合'):
        continue
    spec_lines.append({
        'spec_name': name,
        'spec_unit': fmt(sh.cell_value(r, 20)),
        'spec_qty': fmt(sh.cell_value(r, 22)),
        'spec_unit_price': fmt(sh.cell_value(r, 26)),
        'spec_amount': num(sh.cell_value(r, 30)),
        'spec_note': '',
    })

cost_lines = []
cur_wt = ''
for r in range(24, 67):
    c0 = fmt(sh.cell_value(r, 0))
    c1 = fmt(sh.cell_value(r, 1))
    c5 = fmt(sh.cell_value(r, 5))
    note = fmt(sh.cell_value(r, 27))
    marker = marker_from_note(note)
    tax = fmt(sh.cell_value(r, 12))
    unit = fmt(sh.cell_value(r, 14))
    qty = fmt(sh.cell_value(r, 16))
    price = fmt(sh.cell_value(r, 18))
    amt = fmt(sh.cell_value(r, 22))

    if c0 and c0 not in ('計',):
        cur_wt = c0

    if c0 == '計':
        sub_amt = num(c1) if num(c1) else num(amt)
        gkey = {
            '材料費': 'material',
            '工事管理者賃金': 'manager_wage',
            '工事管理者（保）賃金': 'manager_wage_ins',
            '線閉責任者': 'line_close',
            '列車見張員': 'train_watch',
            '交通整理員等': 'traffic',
            'レンタル': 'rental',
        }.get(cur_wt, cur_wt)
        if marker and c5:
            cost_lines.append({
                'cost_work_type': cur_wt,
                'cost_category': c5,
                'cost_row_kind': 'link',
                'cost_group_key': gkey,
                'cost_tax_rate': tax,
                'cost_unit': unit or '－',
                'cost_qty': qty or '－',
                'cost_unit_price': price or '－',
                'cost_amount': num(amt),
                'cost_basis_note': note,
                'detail_marker': marker,
                'excel_border_role': 'group_inner',
            })
        # Excel: 計行の種別列に（夜）等 → 明細行へ分離
        if c5 and ('（昼）' in c5 or '（夜）' in c5) and cur_wt:
            detail_amt = num(amt)
            if not detail_amt and num(qty) and num(price):
                detail_amt = num(qty) * num(price)
            cost_lines.append({
                'cost_work_type': cur_wt,
                'cost_category': c5,
                'cost_row_kind': 'detail',
                'cost_group_key': gkey,
                'cost_tax_rate': tax,
                'cost_unit': unit,
                'cost_qty': qty,
                'cost_unit_price': price,
                'cost_amount': detail_amt,
                'cost_basis_note': note if note and note != '計' else '',
                'detail_marker': '',
                'excel_border_role': 'group_inner',
            })
            c5 = ''
        elif c5 == 'その他' and gkey == 'rental':
            detail_amt = num(amt)
            if not detail_amt and num(qty) and num(price):
                detail_amt = num(qty) * num(price)
            if not detail_amt:
                detail_amt = num(price)
            cost_lines.append({
                'cost_work_type': '',
                'cost_category': 'その他',
                'cost_row_kind': 'detail',
                'cost_group_key': 'rental',
                'cost_tax_rate': tax,
                'cost_unit': unit or '式',
                'cost_qty': qty or '1',
                'cost_unit_price': price,
                'cost_amount': detail_amt,
                'cost_basis_note': note if note and note != '計' else '発電機等 カナモト',
                'detail_marker': '',
                'excel_border_role': 'group_inner',
            })
            c5 = ''
        cost_lines.append({
            'cost_work_type': '計',
            'cost_category': c5 if not marker else '',
            'cost_row_kind': 'subtotal',
            'cost_group_key': gkey,
            'cost_tax_rate': tax,
            'cost_unit': '',
            'cost_qty': '',
            'cost_unit_price': '',
            'cost_amount': 0,
            'cost_basis_note': '計',
            'detail_marker': '',
            'subtotal_display_amount': sub_amt,
            'excel_border_role': 'group_subtotal',
        })
        continue

    if not c5:
        continue

    row_kind = 'link' if marker else 'detail'
    wt = c0 if c0 else ''
    gkey = ''
    if wt in ('材料費', '工事管理者賃金', '工事管理者（保）賃金', '線閉責任者', '列車見張員', '交通整理員等', 'レンタル'):
        gkey = {'材料費': 'material', '工事管理者賃金': 'manager_wage', '工事管理者（保）賃金': 'manager_wage_ins',
                '線閉責任者': 'line_close', '列車見張員': 'train_watch', '交通整理員等': 'traffic', 'レンタル': 'rental'}[wt]
    base_row = {
        'cost_work_type': wt if wt else '',
        'cost_category': c5,
        'cost_row_kind': row_kind,
        'cost_group_key': gkey if gkey else (cur_wt if not wt else ''),
        'cost_tax_rate': tax,
        'cost_unit': unit,
        'cost_qty': qty,
        'cost_unit_price': price,
        'cost_amount': num(amt),
        'cost_basis_note': note,
        'detail_marker': marker,
    }
    if not wt and cur_wt:
        base_row['cost_group_key'] = gkey or {'材料費': 'material', 'レンタル': 'rental'}.get(cur_wt, cur_wt)
    if wt == '追加工事⑤':
        base_row['cost_group_key'] = 'addon5_excluded'
    if row_kind == 'detail' and '（昼・夜）' in c5:
        day_cat = c5.replace('（昼・夜）', '（昼）')
        night_cat = c5.replace('（昼・夜）', '（夜）')
        for idx, cat in enumerate([day_cat, night_cat]):
            row = dict(base_row)
            row['cost_category'] = cat
            if idx > 0:
                row['cost_qty'] = ''
                row['cost_unit_price'] = ''
                row['cost_amount'] = 0
                row['cost_basis_note'] = ''
            cost_lines.append(row_with_border(row, r, c0 if c0 else cur_wt))
        continue
    cost_lines.append(row_with_border(base_row, r, c0 if c0 else cur_wt))

mat_lines = []
cur_vendor = ''
cur_group = '塗料'
for r in range(7, shd.nrows):
    c0 = fmt(shd.cell_value(r, 0))
    c8 = fmt(shd.cell_value(r, 8))
    if c0 == '合\u3000計':
        if cur_group == '塗料':
            cur_group = 'その他'
            cur_vendor = ''
        continue
    if c0 == '仕入先':
        cur_vendor = ''
        continue
    if c0.startswith('【'):
        break
    if c0 and not c8 and '仕入' not in c0:
        cur_vendor = c0
        continue
    name = c8
    if c0 and c8:
        if '仕入' not in c0 and not c0.startswith('合'):
            cur_vendor = c0
    if not name:
        continue
    mat_lines.append({
        'mat_vendor': cur_vendor,
        'mat_name': name,
        'mat_capacity': fmt(shd.cell_value(r, 15)),
        'mat_maker': fmt(shd.cell_value(r, 19)),
        'mat_qty': fmt(shd.cell_value(r, 23)),
        'mat_unit_price': fmt(shd.cell_value(r, 26)),
        'mat_amount': num(shd.cell_value(r, 30)),
        'mat_group': cur_group,
        'mat_basis': '',
    })

BLOCK_MAP = {
    '【修繕工事】': 'repair',
    '【足場工事】': 'scaffold',
    '【塗装工事】': 'paint',
    '【労務費】': 'labor',
}

SUB_KIND = {
    '諸経費': 'overhead',
    '合\u3000計': 'block_total',
    '合計': 'block_total',
    '法定福利費': 'legal_welfare',
    '注\u3000文\u3000金\u3000額': 'order_amount',
    '注文金額': 'order_amount',
    '労務費': 'labor_total',
}

def sub_kind(line_type, block):
    if line_type in SUB_KIND:
        k = SUB_KIND[line_type]
        if k == 'block_total' and block == 'labor':
            return 'labor_total'
        return k
    if '保険' in line_type:
        return 'insurance'
    return 'detail'

subcontract_blocks = []
cur = None
for r in range(shd.nrows):
    c0 = fmt(shd.cell_value(r, 0))
    c8 = fmt(shd.cell_value(r, 8))
    c10 = fmt(shd.cell_value(r, 10))
    if c0.startswith('【') and c0.endswith('】'):
        cur = {'block': BLOCK_MAP.get(c0, c0), 'title': c0, 'vendor': '', 'lines': []}
        subcontract_blocks.append(cur)
        continue
    if not cur:
        continue
    if c0 and '会社名' not in c0 and not c0.startswith('【'):
        if c8:
            cur['vendor'] = c0
        else:
            cur['vendor'] = c0
            continue
    if '会社名' in c0 or (c8.startswith('種') and '別' in c8):
        continue
    line_type = c8
    sub_name = ''
    if c8 == 'その他' and c10:
        sub_name = c10
        line_type = c10
    elif not c8 and c10:
        line_type = c10
    if not line_type:
        continue
    unit = fmt(shd.cell_value(r, 15))
    qty = fmt(shd.cell_value(r, 17))
    price = fmt(shd.cell_value(r, 21))
    amt = num(shd.cell_value(r, 25))
    basis = fmt(shd.cell_value(r, 31))
    kind = sub_kind(c8 if c8 in SUB_KIND else line_type, cur['block'])
    if kind == 'detail' and c8 == 'その他' and c10:
        kind = 'detail'
    subcontract_blocks[-1]['lines'].append({
        'sub_row_kind': kind,
        'sub_line_type': line_type,
        'sub_unit': unit if unit else ('%' if line_type == '諸経費' else ('式' if amt or qty else '')),
        'sub_qty': qty if qty else ('0.1' if line_type == '諸経費' else ''),
        'sub_unit_price': price,
        'sub_amount': amt,
        'sub_basis': basis or ('上記金額合計の10%' if line_type == '諸経費' else ''),
        'parent_line': c8,
    })

out = {
    'source_file': os.path.basename(xls),
    'project_code': pc,
    'expected': {
        'contract_total_1': num(sh.cell_value(22, 30)),
        'mat_total_2': num([x for x in cost_lines if x.get('detail_marker') == '②'][0]['cost_amount']) if any(x.get('detail_marker') == '②' for x in cost_lines) else 0,
        'cost_total_8': num(sh.cell_value(67, 22)),
        'profit_9': num(sh.cell_value(68, 22)),
    },
    'header': header,
    'spec_lines': spec_lines,
    'mat_lines': mat_lines,
    'cost_lines': cost_lines,
    'subcontract_blocks': subcontract_blocks,
}
print(json.dumps(out, ensure_ascii=False))
`;

const json = execFileSync('python', ['-X', 'utf8', '-c', py, codeDir], {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});
const data = JSON.parse(json);
writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`  project=${data.project_code} spec=${data.spec_lines.length} mat=${data.mat_lines.length} cost=${data.cost_lines.length} sub_blocks=${data.subcontract_blocks.length}`);
