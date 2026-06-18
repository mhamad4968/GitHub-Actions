#!/usr/bin/env node
/**
 * サンプル 2623001-001 → 【実行予算書】736 投入
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-import-sample.mjs
 *   npx dotenv -e .env -e .env.proxy -- node scripts/jikkou-yosan-import-sample.mjs --dry-run
 */
import 'dotenv/config';
import { buildSample2623001, verifySample, EXPECTED } from './jikkou-yosan-sample-2623001.mjs';

const PROJECT_CODE = '2623001-001';

function requireEnv(key) {
  const v = process.env[key];
  if (!v || String(v).trim() === '') throw new Error(`Missing env var: ${key}`);
  return String(v).trim();
}

function parseAppId() {
  const i = process.argv.indexOf('--app');
  if (i >= 0 && process.argv[i + 1]) return Number(process.argv[i + 1]);
  const env = process.env.JIKKOU_YOSAN_BUDGET_APP_ID;
  if (env) return Number(env);
  return 736;
}

let baseUrl = requireEnv('KINTONE_BASE_URL').replace(/\/+$/, '').replace(/\/k$/i, '');
const headers = {
  'X-Cybozu-Authorization': Buffer.from(`${requireEnv('KINTONE_USERNAME')}:${requireEnv('KINTONE_PASSWORD')}`, 'utf8').toString('base64'),
  'Content-Type': 'application/json',
};

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`HTTP ${res.status} ${JSON.stringify(json).slice(0, 1200)}`);
  return json;
}

const KIND_TO_KINTONE = { link: '連携', detail: '明細', subtotal: '小計', group_header: '見出し' };

function txt(v) {
  if (v == null || v === '') return { value: '' };
  return { value: String(v) };
}

function stateToRecord(s) {
  const body = {};
  body.version_type = { value: s.version_type };
  body.site_entry_date = { value: s.site_entry_date || null };
  body.draft_date = { value: s.draft_date || null };
  body.project_code = { value: s.project_code };
  body.project_official_name = { value: s.project_official_name };
  body.project_name = { value: s.project_name };
  body.girder_type = { value: s.girder_type };
  body.order_branch = { value: s.order_branch || '' };
  body.department = { value: s.department || '' };
  body.client_name = { value: s.client_name };
  body.safety_rule_88 = { value: s.safety_rule_88 };
  body.start_date = { value: s.start_date || null };
  body.end_date = { value: s.end_date || null };
  body.status = { value: s.status };
  body.note = { value: s.note };
  body.contract_total_1 = { value: String(s.contract_total_1) };
  body.mat_total_2 = { value: String(s.mat_total_2) };
  body.mat_total_3 = { value: String(s.mat_total_3) };
  body.sub_repair_order_amount = { value: String(s.sub_repair_order_amount) };
  body.sub_scaffold_order_amount = { value: String(s.sub_scaffold_order_amount) };
  body.sub_paint_order_amount = { value: String(s.sub_paint_order_amount) };
  body.sub_labor_total = { value: String(s.sub_labor_total) };
  body.cost_total_8 = { value: String(s.cost_total_8) };
  body.profit_9 = { value: String(s.profit_9) };
  body.profit_rate = { value: String(s.profit_rate) };
  body.spec_lines = {
    value: s.spec_lines.map(function (r) {
      return {
        value: {
          spec_name: txt(r.spec_name),
          spec_unit: txt(r.spec_unit),
          spec_qty: txt(r.spec_qty),
          spec_unit_price: txt(r.spec_unit_price),
          spec_amount: txt(r.spec_amount),
          spec_note: txt(r.spec_note),
        },
      };
    }),
  };
  body.cost_lines = {
    value: s.cost_lines.map(function (r) {
      const mk = KIND_TO_KINTONE[r.cost_row_kind] || r.cost_row_kind;
      return {
        value: {
          cost_work_type_code: txt(r.cost_work_type_code),
          cost_work_type: txt(r.cost_work_type),
          cost_category_code: txt(r.cost_category_code),
          cost_category: txt(r.cost_category),
          cost_row_kind: txt(mk === 'link' ? '連携' : mk === 'detail' ? '明細' : mk === 'subtotal' ? '小計' : mk),
          cost_group_key: txt(r.cost_group_key),
          cost_tax_rate: txt(r.cost_tax_rate),
          cost_unit: txt(r.cost_unit),
          cost_qty: txt(r.cost_qty),
          cost_unit_price: txt(r.cost_unit_price),
          cost_amount: txt(r.cost_amount),
          cost_basis_note: txt(r.cost_basis_note),
          detail_marker: txt(r.detail_marker || 'なし'),
          cost_ratio: txt(r.cost_ratio),
        },
      };
    }),
  };
  body.mat_lines = {
    value: s.mat_lines.map(function (r) {
      return {
        value: {
          mat_vendor: txt(r.mat_vendor),
          mat_name: txt(r.mat_name),
          mat_capacity: txt(r.mat_capacity),
          mat_maker: txt(r.mat_maker),
          mat_qty: txt(r.mat_qty),
          mat_unit_price: txt(r.mat_unit_price),
          mat_amount: txt(r.mat_amount),
          mat_group: txt(r.mat_group),
          mat_basis: txt(r.mat_basis),
        },
      };
    }),
  };
  body.subcontract_lines = {
    value: s.subcontract_lines.map(function (r) {
      return {
        value: {
          subcontract_block: txt(r.subcontract_block),
          sub_row_kind: txt(r.sub_row_kind),
          sub_vendor: txt(r.sub_vendor),
          sub_line_type: txt(r.sub_line_type),
          sub_unit: txt(r.sub_unit),
          sub_qty: txt(r.sub_qty),
          sub_unit_price: txt(r.sub_unit_price),
          sub_amount: txt(r.sub_amount),
          sub_basis: txt(r.sub_basis),
        },
      };
    }),
  };
  return body;
}

async function findExisting(appId) {
  const q = encodeURIComponent(`project_code = "${PROJECT_CODE}" order by $id asc limit 1`);
  const resp = await fetchJson(`${baseUrl}/k/v1/records.json?app=${appId}&query=${q}`, {
    headers: { ...headers, 'Content-Type': undefined },
  });
  return resp.records && resp.records[0] ? resp.records[0] : null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const appId = parseAppId();
  const state = buildSample2623001();
  const fails = verifySample(state);
  if (fails.length) {
    console.error('Calc verify failed:', fails);
    process.exit(1);
  }

  const record = stateToRecord(state);
  const existing = await findExisting(appId);

  if (dryRun) {
    console.log(JSON.stringify({
      appId,
      project_code: PROJECT_CODE,
      action: existing ? 'update' : 'create',
      existingId: existing ? existing.$id.value : null,
      totals: EXPECTED,
      specRows: state.spec_lines.length,
      costRows: state.cost_lines.length,
      matRows: state.mat_lines.length,
      subRows: state.subcontract_lines.length,
    }, null, 2));
    return;
  }

  if (existing) {
    const id = existing.$id.value;
    const revision = existing.$revision.value;
    const resp = await fetchJson(`${baseUrl}/k/v1/record.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ app: appId, id, record, revision }),
    });
    console.log('Updated sample', PROJECT_CODE, 'id=', id, 'revision=', resp.revision);
    console.log('URL:', `${baseUrl}/k/${appId}/show#record=${id}`);
  } else {
    const resp = await fetchJson(`${baseUrl}/k/v1/record.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ app: appId, record }),
    });
    console.log('Created sample', PROJECT_CODE, 'id=', resp.id);
    console.log('URL:', `${baseUrl}/k/${appId}/show#record=${resp.id}`);
  }
  console.log('Verified totals:', EXPECTED);
}

main().catch(function (e) {
  console.error(e.message);
  process.exit(1);
});
