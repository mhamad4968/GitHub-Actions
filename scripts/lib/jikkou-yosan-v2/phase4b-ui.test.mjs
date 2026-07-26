import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { displayInteger } from "./calc.mjs";
import {
  COMMON_UNITS,
  CONTRACT_SECTIONS,
  SALARY_DEFAULT_UNIT,
  SALARY_TAX_DISPLAY,
  contractLineAmount,
  createContractSalaryModel,
} from "./contract-salary-model.mjs";
import { LOCK_STATES } from "./lock.mjs";
import {
  SUMMARY_DEFAULT_TAX_RATE,
  regenerateSummaryCostLines,
} from "./projection.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function protected736Digest() {
  const hash = createHash("sha256");
  for (const name of ["desktop.js", "desktop.reorder.js", "desktop.ui.js"]) {
    hash.update(name);
    hash.update(read(`customize/736/${name}`));
  }
  return hash.digest("hex");
}

function sequentialUuidFactory() {
  let counter = 0;
  return () => `uuid-${++counter}`;
}

function editableModel(overrides = {}) {
  return createContractSalaryModel({
    lockState: LOCK_STATES.EDITABLE,
    uuidFactory: sequentialUuidFactory(),
    ...overrides,
  });
}

function mockBlock(overrides = {}) {
  return {
    stableBlockId: "blk-a",
    status: "active",
    costCategory: "施工",
    total: "800",
    ...overrides,
  };
}

test("contract line amount is an unrounded decimal; only the display rounds (P-36)", () => {
  const model = editableModel({
    contractLines: [
      {
        section: "施工",
        workName: "けた橋ペイント",
        unit: "㎡",
        quantity: "1639.6",
        unitPrice: "123.45",
      },
      { section: "保安", workName: "列車見張員", quantity: "2.5", unitPrice: "100.1" },
    ],
  });
  const snapshot = model.snapshot();
  const construction = snapshot.contractSections["施工"][0];
  assert.equal(construction.amount, "202408.62");
  assert.equal(construction.amountDisplay, "202409");
  const safety = snapshot.contractSections["保安"][0];
  assert.equal(safety.amount, "250.25");
  assert.equal(safety.amountDisplay, "250");
  assert.equal(snapshot.totals.construction, "202408.62");
  assert.equal(snapshot.totals.safety, "250.25");
  assert.equal(snapshot.totals.total1, "202658.87");
  assert.equal(displayInteger(snapshot.totals.total1), "202659");
});

test("contract line without 契約工種 shows blank amount and is excluded from ① (D-21)", () => {
  const line = { workName: null, quantity: "3", unitPrice: "100" };
  assert.equal(contractLineAmount(line), null);
  const model = editableModel({
    contractLines: [
      { section: "施工", workName: "足場工", quantity: "2", unitPrice: "1000" },
      { section: "施工", workName: "", quantity: "9", unitPrice: "9999" },
    ],
  });
  assert.equal(model.snapshot().totals.total1, "2000");
});

test("common units dropdown and salary defaults follow D-29/X7", () => {
  assert.deepEqual(COMMON_UNITS, ["㎡", "式", "回", "人", "日", "箇月", "－"]);
  assert.deepEqual(CONTRACT_SECTIONS, ["施工", "保安"]);
  assert.equal(SALARY_DEFAULT_UNIT, "箇月");
  assert.equal(SALARY_TAX_DISPLAY, "－");
  const model = editableModel();
  assert.equal(model.snapshot().salaryLines[0].unit, "箇月");
});

test("salary person name spaces normalize to one fullwidth space", () => {
  const model = editableModel();
  const rowKey = model.snapshot().salaryLines[0].rowKey;
  model.updateSalaryLine(rowKey, { personName: "山田  太郎" });
  assert.equal(model.snapshot().salaryLines[0].personName, "山田　太郎");

  model.updateSalaryLine(rowKey, { personName: "山田太郎" });
  assert.equal(model.snapshot().salaryLines[0].personName, "山田太郎");
});

test("each contract section and salary keep a minimum of 1 row (D-16/D-30)", () => {
  const model = editableModel();
  const snapshot = model.snapshot();
  assert.equal(snapshot.contractSections["施工"].length, 1);
  assert.equal(snapshot.contractSections["保安"].length, 1);
  assert.equal(snapshot.salaryLines.length, 1);

  for (const section of CONTRACT_SECTIONS) {
    const only = model.snapshot().contractSections[section][0].rowKey;
    assert.throws(() => model.removeContractLine(only), /最低1行|at least 1 row/);
    const added = model.addContractLine(section);
    model.removeContractLine(added);
    assert.equal(model.snapshot().contractSections[section].length, 1);
  }
  const onlySalary = model.snapshot().salaryLines[0].rowKey;
  assert.throws(() => model.removeSalaryLine(onlySalary), /at least 1 row/);
});

test("salary totals and ⑧⑨ combine salary with active App2 block totals only", () => {
  const model = editableModel({
    contractLines: [
      { section: "施工", workName: "足場工", quantity: "2", unitPrice: "1000" },
    ],
    salaryLines: [
      { role: "現場代理人", quantity: "3", unitPrice: "500000" },
      { role: "主任技術者", quantity: "1.5", unitPrice: "200000" },
    ],
  });
  assert.equal(model.snapshot().totals.salary, "1800000");

  const blocks = [
    mockBlock({ stableBlockId: "blk-a", total: "800" }),
    mockBlock({ stableBlockId: "blk-b", costCategory: "保安", total: "200" }),
    mockBlock({ stableBlockId: "blk-r", total: "99999", status: "retired" }),
  ];
  const totals = model.totals(blocks);
  assert.equal(totals.total1, "2000");
  assert.equal(totals.costConstruction, "800");
  assert.equal(totals.costSafety, "200");
  assert.equal(totals.salary, "1800000");
  assert.equal(totals.total8, "1801000");
  assert.equal(totals.profit9, "-1799000");
  // Retired blocks count as current budget 0 (P-39).
  assert.deepEqual(model.totals(blocks.filter((b) => b.status === "active")), totals);
});

test("editBudget=false freezes every contract/salary mutation", () => {
  for (const lockState of [LOCK_STATES.BUDGET_LOCKED, LOCK_STATES.FULL_LOCKED]) {
    const model = createContractSalaryModel({
      lockState,
      uuidFactory: sequentialUuidFactory(),
      contractLines: [
        { section: "施工", workName: "足場工", quantity: "2", unitPrice: "1000" },
      ],
      salaryLines: [{ role: "現場代理人", quantity: "1", unitPrice: "100" }],
    });
    const contractKey = model.snapshot().contractSections["施工"][0].rowKey;
    const salaryKey = model.snapshot().salaryLines[0].rowKey;
    const locked = /budget is locked/;
    assert.throws(() => model.addContractLine("施工"), locked);
    assert.throws(() => model.updateContractLine(contractKey, { quantity: "9" }), locked);
    assert.throws(() => model.removeContractLine(contractKey), locked);
    assert.throws(() => model.moveContractLine(contractKey, 1), locked);
    assert.throws(() => model.addSalaryLine(), locked);
    assert.throws(() => model.updateSalaryLine(salaryKey, { quantity: "9" }), locked);
    assert.throws(() => model.removeSalaryLine(salaryKey), locked);
    assert.throws(() => model.moveSalaryLine(salaryKey, -1), locked);
    // Display stays available while locked.
    assert.equal(model.snapshot().totals.total1, "2000");
  }
  const editable = editableModel();
  const rowKey = editable.addContractLine("施工");
  editable.updateContractLine(rowKey, { workName: "工種", quantity: "1", unitPrice: "5" });
  assert.equal(editable.snapshot().totals.total1, "5");
});

test("mutations reject band-crossing patches and unknown fields", () => {
  const model = editableModel();
  const rowKey = model.snapshot().contractSections["施工"][0].rowKey;
  assert.throws(() => model.updateContractLine(rowKey, { section: "保安" }), /not editable/);
  assert.throws(() => model.updateContractLine(rowKey, { amount: "1" }), /not editable/);
  assert.throws(() => model.addContractLine("給与"), /施工 or 保安/);
});

test("projection maps only active block totals into summary_cost_lines cache rows", () => {
  const blocks = [
    mockBlock({
      stableBlockId: "blk-b",
      costCategory: "保安",
      total: "200",
      blockSortOrder: 2,
      workTypeCode: "S-2",
      workTypeName: "保安設備",
    }),
    mockBlock({ stableBlockId: "blk-r", status: "retired", total: "99999" }),
    mockBlock({ stableBlockId: "blk-a", total: "800", blockSortOrder: 1 }),
  ];
  const before = JSON.stringify(blocks);
  const rows = regenerateSummaryCostLines(blocks, { contractTotal1: "2000" });

  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((row) => row.summary_stable_block_id),
    ["blk-a", "blk-b"],
  );
  assert.deepEqual(rows.map((row) => row.summary_block_no), [1, 2]);
  assert.deepEqual(rows.map((row) => row.summary_sort_order), [1, 2]);

  const [first, second] = rows;
  assert.equal(first.summary_amount_excl_tax, "800");
  assert.equal(first.summary_tax_rate, SUMMARY_DEFAULT_TAX_RATE);
  assert.equal(first.summary_amount_incl_tax, "880");
  assert.equal(first.summary_rate_to_1, "0.4");
  // Mixed/unknown units project as 式 × 1 × block_total (Q8).
  assert.equal(first.summary_unit, "式");
  assert.equal(first.summary_qty, "1");
  assert.equal(first.summary_unit_price, "800");
  assert.equal(second.summary_cost_category, "保安");
  assert.equal(second.summary_work_type_code, "S-2");
  assert.equal(second.summary_rate_to_1, "0.1");

  // Input blocks were not mutated (no reverse sync into App2 shapes).
  assert.equal(JSON.stringify(blocks), before);
});

test("projection rows are frozen, summary_*-only, and carry manual columns forward", () => {
  const rows = regenerateSummaryCostLines([mockBlock()], {
    previousLines: [
      {
        summary_stable_block_id: "blk-a",
        summary_line_type: "手入力種別",
        summary_calc_basis: "計算基準メモ",
        summary_note: "備考メモ",
      },
    ],
  });
  assert.equal(Object.isFrozen(rows), true);
  assert.equal(Object.isFrozen(rows[0]), true);
  assert.throws(() => {
    rows[0].summary_amount_excl_tax = "0";
  }, TypeError);
  for (const key of Object.keys(rows[0])) {
    assert.match(key, /^summary_/);
  }
  for (const app2Field of ["amount", "block_total", "subtotal", "quantity", "unit_price"]) {
    assert.equal(app2Field in rows[0], false);
  }
  assert.equal(rows[0].summary_line_type, "手入力種別");
  assert.equal(rows[0].summary_calc_basis, "計算基準メモ");
  assert.equal(rows[0].summary_note, "備考メモ");
  // D-26/D-43: manual summary_tax_rate in previousLines wins over block/default.
  const [taxRow] = regenerateSummaryCostLines([mockBlock()], {
    previousLines: [
      {
        summary_stable_block_id: "blk-a",
        summary_tax_rate: "0.08",
      },
    ],
  });
  assert.equal(taxRow.summary_tax_rate, "0.08");
  assert.equal(taxRow.summary_amount_incl_tax, "864");
  // App1 DROP_DOWN「10％」が previousLines に残っていても計算できる。
  const [labelTaxRow] = regenerateSummaryCostLines([mockBlock()], {
    previousLines: [
      {
        summary_stable_block_id: "blk-a",
        summary_tax_rate: "10％",
      },
    ],
  });
  assert.equal(labelTaxRow.summary_tax_rate, "0.1");
  assert.equal(labelTaxRow.summary_amount_incl_tax, "880");
  // ① omitted → rate stays null; ①=0 → rate 0 (Q12).
  assert.equal(rows[0].summary_rate_to_1, null);
  assert.equal(
    regenerateSummaryCostLines([mockBlock()], { contractTotal1: "0" })[0]
      .summary_rate_to_1,
    "0",
  );
});

test("projection validates block shape and uniform-unit passthrough", () => {
  assert.throws(() => regenerateSummaryCostLines("x"), /must be an array/);
  assert.throws(
    () => regenerateSummaryCostLines([mockBlock({ status: "deleted" })]),
    /active or retired/,
  );
  assert.throws(
    () => regenerateSummaryCostLines([mockBlock({ total: undefined })]),
    /block_total/,
  );
  const [uniform] = regenerateSummaryCostLines([
    mockBlock({ unit: "㎡", quantity: "10", unitPrice: "80", total: "800" }),
  ]);
  assert.equal(uniform.summary_unit, "㎡");
  assert.equal(uniform.summary_qty, "10");
  assert.equal(uniform.summary_unit_price, "80");
  assert.equal(uniform.summary_amount_excl_tax, "800");
});

test("App 1 summary tab renders 請負/給与/投影 tables and ①⑧⑨ footer with jy2 prefix", () => {
  const source = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.match(source, /jy2-contract-table/);
  assert.match(source, /jy2-salary-table/);
  assert.match(source, /氏名（入力）/);
  assert.match(source, /personName/);
  assert.match(source, /jy2MarkSalaryNameSpaceWarning/);
  assert.match(source, /姓と名の間に全角スペースを入力してください/);
  assert.match(source, /jy2-projection-table/);
  assert.match(source, /jy2-summary-footer/);
  assert.match(source, /jy2-budget-summary/);
  assert.match(source, /区分別サマリー/);
  // M1 (Phase5): contract-line 対①率 is computed via ratio, no longer a stub.
  assert.doesNotMatch(source, /jy2-rate-stub/);
  assert.match(source, /jy2Percent\(rateTo1\(line\.amount\)\)/);
  assert.match(source, /jy2-header-stub/);
  assert.match(source, /jy2-pane/);
  assert.match(source, /regenerateSummaryCostLines/);
  assert.match(source, /createContractSalaryModel/);
  assert.match(source, /① 請負金額合計/);
  assert.match(source, /⑧ 工事原価合計/);
  assert.match(source, /⑨ 差引（①－⑧）/);
  assert.doesNotMatch(source, /className\s*=\s*["']jy-/);
  assert.doesNotMatch(source, /請負編集|内訳編集|管理者グループ/);
});

test("new modules never target customize/736 or App 735/736 as write targets", () => {
  for (const relativePath of [
    "scripts/lib/jikkou-yosan-v2/projection.mjs",
    "scripts/lib/jikkou-yosan-v2/contract-salary-model.mjs",
  ]) {
    const source = read(relativePath);
    assert.doesNotMatch(source, /customize\/736/);
    assert.doesNotMatch(source, /\b73[56]\b/);
    assert.doesNotMatch(source, /kintone\.api|bulkRequest/);
  }
  // Phase C-2b: the UI now owns a save path, but only via the executor —
  // never a raw kintone.api record write, and never Apps 735/736.
  const uiSource = read("customize/jikkou-yosan-v2-app1/desktop.ui.js");
  assert.doesNotMatch(uiSource, /customize\/736/);
  assert.doesNotMatch(uiSource, /\b73[56]\b/);
  assert.match(uiSource, /executePlan\(/);
  assert.match(uiSource, /createKintoneApiClient\(/);
  assert.doesNotMatch(uiSource, /kintone\.api\((["'])\/k\/v1\/record\.json/);
  assert.match(
    read("scripts/jikkou-yosan-v2-build-desktop.mjs"),
    /Ver\.02 build must never write customize\/736/,
  );
});

test("rebuild bundles the 4b modules and leaves customize/736 untouched", () => {
  const state = JSON.parse(read("scripts/data/jikkou-yosan-v2-app-ids.json"));
  for (const key of ["app1", "app2", "app3"]) {
    const appId = state.apps[key].appId;
    assert.ok(appId === null || (Number.isSafeInteger(appId) && appId > 0), key);
    assert.ok(appId !== 735 && appId !== 736, `${key}: appId must never be 735/736`);
  }
  const before736 = protected736Digest();
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "jy2-phase4b-"));
  const tempBundle = path.join(tempDirectory, "desktop.js");
  try {
    execFileSync(
      process.execPath,
      [path.join(root, "scripts/jikkou-yosan-v2-build-desktop.mjs")],
      {
        cwd: root,
        stdio: "pipe",
        env: { ...process.env, JIKKOU_YOSAN_V2_OUTPUT: tempBundle },
      },
    );
    const bundle = readFileSync(tempBundle, "utf8");
    for (const marker of ["APP1", "APP2", "APP3"]) {
      const m = bundle.match(new RegExp(`/\\* @JY_V2_${marker} \\*/ (null|\\d+)`));
      assert.ok(m, `${marker} marker must be present`);
      assert.ok(m[1] !== "735" && m[1] !== "736", `${marker} must never be 735/736`);
    }
    for (const symbol of [
      "regenerateSummaryCostLines",
      "createContractSalaryModel",
      "COMMON_UNITS",
      "jy2RenderSummaryPane",
    ]) {
      assert.match(bundle, new RegExp(symbol));
    }
    assert.doesNotMatch(bundle, /kintone\.mjs/);
    assert.doesNotMatch(bundle, /APP[123]_ID\s*=\s*(?:735|736)\b/);
    // Bundle order: modules land before the UI shell source.
    assert.ok(
      bundle.indexOf("function regenerateSummaryCostLines") <
        bundle.indexOf("function jy2RenderShell"),
    );
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
  assert.equal(protected736Digest(), before736);
});
