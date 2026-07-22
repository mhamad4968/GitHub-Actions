import assert from "node:assert/strict";
import test from "node:test";

import { compactUuidFactory } from "./keys.mjs";
import {
  buildMigrationPayload,
  migrationIdempotencyQuery,
} from "./migrate-from-736-payload.mjs";

const uuidFactory = compactUuidFactory(() => "11111111-1111-4111-8111-111111111111");

function cell(value, type = "SINGLE_LINE_TEXT") {
  return { type, value };
}

function subtable(rows) {
  return {
    type: "SUBTABLE",
    value: rows.map((fields) => ({
      id: "x",
      value: Object.fromEntries(
        Object.entries(fields).map(([k, v]) => [k, cell(v)]),
      ),
    })),
  };
}

test("buildMigrationPayload creates App1+App2 shapes with shared keys", () => {
  const record = {
    $id: cell("9", "__ID__"),
    project_code: cell("2623001-001"),
    project_name: cell("テスト橋"),
    version_seq: cell("1", "NUMBER"),
    version_type: cell("当初", "DROP_DOWN"),
    status: cell("版確定", "DROP_DOWN"),
    safety_rule_88: cell("無", "RADIO_BUTTON"),
    contract_total_1: cell("100", "NUMBER"),
    cost_total_8: cell("40", "NUMBER"),
    profit_9: cell("60", "NUMBER"),
    spec_lines: subtable([
      {
        spec_row_key: "rk1",
        spec_name: "請負A",
        spec_category: "施工",
        spec_unit: "式",
        spec_qty: "1",
        spec_unit_price: "100",
        spec_amount: "100",
        spec_note: "",
      },
    ]),
    cost_lines: subtable([
      {
        cost_row_key: "ck1",
        cost_row_kind: "明細",
        cost_budget_category: "施工",
        cost_work_type: "塗装",
        cost_tax_rate: "0.1",
        cost_amount: "40",
      },
      {
        cost_row_key: "ck2",
        cost_row_kind: "明細",
        cost_budget_category: "給与手当",
        cost_work_type: "現場代理人",
        cost_unit: "箇月",
        cost_qty: "1",
        cost_unit_price: "10",
        cost_amount: "10",
      },
    ]),
    subcontract_lines: subtable([
      {
        sub_row_key: "sr1",
        subcontract_block: "B1",
        sub_row_kind: "vendor",
        sub_vendor: "業者A",
        sub_line_type: "",
        sub_unit: "",
        sub_qty: "",
        sub_unit_price: "",
        sub_amount: "",
        sub_basis: "",
      },
      {
        sub_row_key: "sr2",
        subcontract_block: "B1",
        sub_row_kind: "detail",
        sub_vendor: "",
        sub_line_type: "明細1",
        sub_unit: "式",
        sub_qty: "1",
        sub_unit_price: "40",
        sub_amount: "40",
        sub_basis: "",
      },
    ]),
    mat_lines: subtable([
      {
        mat_row_key: "mr1",
        mat_vendor: "塗料店",
        mat_name: "下塗",
        mat_capacity: "20",
        mat_maker: "日本ペイント",
        mat_qty: "2",
        mat_unit_price: "1000",
        mat_amount: "2000",
        mat_basis: "",
        mat_group: "塗料",
      },
    ]),
  };

  const payload = buildMigrationPayload(record, {
    uuidFactory,
    newerVersionExists: true,
  });

  assert.match(payload.projectId, /^prj-/);
  assert.match(payload.budgetVersionId, /^bv-/);
  assert.equal(payload.projectBusinessKey, "2623001|001");
  assert.equal(payload.app1Record.project_code.value, "2623001");
  assert.equal(payload.app1Record.project_branch.value, "001");
  assert.equal(payload.app1Record.source_record_id.value, "9");
  assert.equal(payload.app1Record.derived_lock_state.value, "full_locked");
  assert.match(payload.app1Record.note.value, /\[mig736:#9\]/);
  assert.equal(payload.app1Record.contract_lines.value.length, 1);
  assert.equal(payload.app1Record.salary_lines.value.length, 1);
  assert.equal(payload.app1Record.summary_cost_lines.value.length, 1);
  assert.equal(
    payload.app1Record.summary_cost_lines.value[0].value.summary_tax_rate.value,
    "10％",
  );
  assert.equal(payload.app2Rows.length, 4);
  assert.equal(payload.app2Rows[0].row_kind, "block_header");
  assert.equal(payload.app2Rows[1].row_kind, "detail");
  const matHeader = payload.app2Rows.find(
    (row) => row.row_kind === "block_header" && row.name_spec_group === "塗料",
  );
  const matDetail = payload.app2Rows.find(
    (row) => row.row_kind === "detail" && String(row.name_3 || "").includes("下塗"),
  );
  assert.ok(matHeader);
  assert.equal(matHeader.cost_category_key, "施工");
  assert.ok(matDetail);
  assert.equal(matDetail.cost_category_key, "施工");
  assert.equal(matDetail.name_1, "材料費");
  assert.equal(matDetail.name_2, "塗料");
  assert.equal(matDetail.name_spec_group, "材料費");
});

test("mapApp2Unit aliases percent and month via subcontract unit", () => {
  const record = {
    $id: cell("8", "__ID__"),
    project_code: cell("P-1"),
    version_seq: cell("1", "NUMBER"),
    version_type: cell("当初", "DROP_DOWN"),
    status: cell("下書き", "DROP_DOWN"),
    safety_rule_88: cell("無", "RADIO_BUTTON"),
    spec_lines: subtable([]),
    cost_lines: subtable([]),
    mat_lines: subtable([]),
    subcontract_lines: subtable([
      {
        sub_row_key: "a",
        subcontract_block: "B",
        sub_row_kind: "detail",
        sub_vendor: "",
        sub_line_type: "x",
        sub_unit: "%",
        sub_qty: "1",
        sub_unit_price: "1",
        sub_amount: "1",
        sub_basis: "",
      },
      {
        sub_row_key: "b",
        subcontract_block: "B",
        sub_row_kind: "detail",
        sub_vendor: "",
        sub_line_type: "y",
        sub_unit: "月",
        sub_qty: "1",
        sub_unit_price: "1",
        sub_amount: "1",
        sub_basis: "",
      },
    ]),
  };
  const payload = buildMigrationPayload(record, { uuidFactory });
  assert.equal(payload.app2Rows[0].unit, "％");
  assert.equal(payload.app2Rows[1].unit, "箇月");
});

test("migrationIdempotencyQuery uses mig736 note tag", () => {
  assert.equal(migrationIdempotencyQuery("12"), 'note like "[mig736:#12]"');
  assert.throws(() => migrationIdempotencyQuery('1"2'), /numeric/);
});

test("#S-MIG-01 subcontract detail lands in name_2 (not name_1-only empty name_2)", () => {
  const record = {
    $id: cell("21", "__ID__"),
    project_code: cell("2623001-001"),
    version_seq: cell("1", "NUMBER"),
    version_type: cell("当初", "DROP_DOWN"),
    status: cell("下書き", "DROP_DOWN"),
    safety_rule_88: cell("無", "RADIO_BUTTON"),
    spec_lines: subtable([]),
    cost_lines: subtable([]),
    mat_lines: subtable([]),
    subcontract_lines: subtable([
      {
        sub_row_key: "vh",
        subcontract_block: "B1",
        sub_row_kind: "vendor",
        sub_vendor: "業者A",
        sub_line_type: "",
        sub_unit: "",
        sub_qty: "",
        sub_unit_price: "",
        sub_amount: "",
        sub_basis: "",
      },
      {
        sub_row_key: "d1",
        subcontract_block: "B1",
        sub_row_kind: "detail",
        sub_vendor: "",
        sub_line_type: "事前打合せ費等",
        sub_unit: "式",
        sub_qty: "1",
        sub_unit_price: "10",
        sub_amount: "10",
        sub_basis: "",
      },
      {
        sub_row_key: "d2",
        subcontract_block: "B1",
        sub_row_kind: "detail",
        sub_vendor: "",
        sub_line_type: "塗装工事一式",
        sub_unit: "式",
        sub_qty: "1",
        sub_unit_price: "20",
        sub_amount: "20",
        sub_basis: "",
      },
    ]),
  };
  const payload = buildMigrationPayload(record, { uuidFactory });
  const details = payload.app2Rows.filter((r) => r.row_kind === "detail");
  assert.ok(details.length >= 2);
  for (const row of details) {
    // 細目が name_1 だけに残り name_2 空、という回帰を禁止
    const onlyName1 =
      String(row.name_1 || "") !== "" && String(row.name_2 || "") === "";
    if (onlyName1) {
      assert.fail(
        `#S-MIG-01 regression: detail-only-in-name_1 empty name_2: ${JSON.stringify(row)}`,
      );
    }
  }
  const meet = details.find((r) => r.name_2 === "事前打合せ費等");
  assert.ok(meet, "事前打合せ費等 must be in name_2");
  assert.equal(meet.name_1, "工具･機械使用料");
  const paint = details.find((r) => r.name_2 === "塗装工事一式");
  assert.ok(paint);
  assert.equal(paint.name_1, "材料費");
});
