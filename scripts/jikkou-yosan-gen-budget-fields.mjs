#!/usr/bin/env node
/** Generate scripts/data/jikkou-yosan-budget-fields.json */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function dd(code, label, options, required = false) {
  const opts = {};
  options.forEach((o, i) => {
    opts[o] = { label: o, index: String(i) };
  });
  return { type: 'DROP_DOWN', code, label, required, options: opts };
}

function txt(code, label, required = false) {
  return { type: 'SINGLE_LINE_TEXT', code, label, required, noLabel: false, defaultValue: '' };
}

function num(code, label) {
  return {
    type: 'NUMBER',
    code,
    label,
    required: false,
    digit: false,
    displayScale: '0',
    unit: '',
    unitPosition: 'BEFORE',
  };
}

function sub(code, label, fields) {
  return { type: 'SUBTABLE', code, label, fields };
}

const specFields = {
  spec_name: txt('spec_name', '仕様'),
  spec_unit: txt('spec_unit', '単位'),
  spec_qty: num('spec_qty', '数量'),
  spec_unit_price: num('spec_unit_price', '単価'),
  spec_amount: num('spec_amount', '金額'),
  spec_note: txt('spec_note', '備考'),
};

const costFields = {
  cost_work_type_code: txt('cost_work_type_code', '工種コード'),
  cost_work_type: txt('cost_work_type', 'システム入力工種'),
  cost_category_code: txt('cost_category_code', '種別コード'),
  cost_category: txt('cost_category', '種別'),
  cost_row_kind: dd('cost_row_kind', '行種別', ['明細', '小計', '見出し', '連携']),
  cost_group_key: txt('cost_group_key', 'グループキー'),
  cost_tax_rate: num('cost_tax_rate', '消費税'),
  cost_unit: txt('cost_unit', '単位'),
  cost_qty: num('cost_qty', '数量'),
  cost_unit_price: num('cost_unit_price', '単価'),
  cost_amount: num('cost_amount', '金額（税抜）'),
  cost_basis_note: txt('cost_basis_note', '計算基準・備考'),
  detail_marker: dd('detail_marker', '詳細', ['なし', '②', '③', '④', '⑤', '⑥', '⑦']),
  cost_ratio: num('cost_ratio', '率'),
};

const matFields = {
  mat_vendor: txt('mat_vendor', '仕入先'),
  mat_name: txt('mat_name', '品名'),
  mat_capacity: num('mat_capacity', '容量'),
  mat_maker: txt('mat_maker', 'メーカー'),
  mat_qty: num('mat_qty', '所要量'),
  mat_unit_price: num('mat_unit_price', '単価'),
  mat_amount: num('mat_amount', '金額'),
  mat_group: dd('mat_group', '材料区分', ['塗料', 'その他']),
  mat_basis: txt('mat_basis', '計算基準'),
};

const subFields = {
  subcontract_block: dd('subcontract_block', 'ブロック', ['repair', 'scaffold', 'paint', 'labor']),
  sub_row_kind: dd('sub_row_kind', '行種別', ['vendor', 'detail', 'overhead', 'insurance', 'block_total', 'legal_welfare', 'order_amount', 'labor_total']),
  sub_vendor: txt('sub_vendor', '会社名'),
  sub_line_type: txt('sub_line_type', '種別'),
  sub_unit: txt('sub_unit', '単位'),
  sub_qty: num('sub_qty', '数量'),
  sub_unit_price: num('sub_unit_price', '単価'),
  sub_amount: num('sub_amount', '金額（税抜）'),
  sub_basis: txt('sub_basis', '計算基準'),
};

const properties = {
  version_type: dd('version_type', '版種別', ['当初'], true),
  site_entry_date: { type: 'DATE', code: 'site_entry_date', label: '現場入場予定日', required: false },
  draft_date: { type: 'DATE', code: 'draft_date', label: '立案日', required: false },
  project_code: txt('project_code', '工事コード', true),
  project_official_name: txt('project_official_name', '工事正式名称'),
  project_name: txt('project_name', '工事名称'),
  girder_type: txt('girder_type', '桁種別'),
  order_branch: txt('order_branch', '発注支社'),
  department: txt('department', '部門'),
  client_name: txt('client_name', '発注者'),
  safety_rule_88: {
    type: 'RADIO_BUTTON',
    code: 'safety_rule_88',
    label: '安衛則88条',
    required: false,
    options: { 有: { label: '有', index: '0' }, 無: { label: '無', index: '1' } },
  },
  start_date: { type: 'DATE', code: 'start_date', label: '着手日', required: false },
  end_date: { type: 'DATE', code: 'end_date', label: '竣工日', required: false },
  status: dd('status', 'ステータス', ['下書き', '初版確定']),
  note: { type: 'MULTI_LINE_TEXT', code: 'note', label: '備考', required: false },
  contract_total_1: num('contract_total_1', '契約合計（①）'),
  mat_total_2: num('mat_total_2', '材料合計（②）'),
  mat_total_3: num('mat_total_3', '材料合計（③）'),
  sub_repair_order_amount: num('sub_repair_order_amount', '外注・修繕・注文金額'),
  sub_scaffold_order_amount: num('sub_scaffold_order_amount', '外注・足場・注文金額'),
  sub_paint_order_amount: num('sub_paint_order_amount', '外注・塗装・注文金額'),
  sub_labor_total: num('sub_labor_total', '外注・労務・合計'),
  cost_total_8: num('cost_total_8', '工事原価額（⑧）'),
  profit_9: num('profit_9', '粗利額（⑨）'),
  profit_rate: num('profit_rate', '粗利率'),
  spec_lines: sub('spec_lines', '仕様明細', specFields),
  cost_lines: sub('cost_lines', '原価行', costFields),
  mat_lines: sub('mat_lines', '材料明細', matFields),
  subcontract_lines: sub('subcontract_lines', '外注明細', subFields),
};

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'jikkou-yosan-budget-fields.json');
writeFileSync(out, JSON.stringify({ properties }, null, 2), 'utf8');
console.log('Wrote', out, Object.keys(properties).length, 'fields');
