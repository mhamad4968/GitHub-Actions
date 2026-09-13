import assert from "node:assert/strict";
import test from "node:test";

import {
  cmv2ActualRecordKey,
  cmv2AdoptedMonth,
  cmv2ApplyFirstConfirmLock,
  cmv2ForecastMonthEditable,
  cmv2ForecastMonthFilled,
  cmv2IncludeWorkType,
  cmv2MergeMasterWorkTypes,
  cmv2MonthActual,
  cmv2ParseActuals,
  cmv2ParseBudget,
  cmv2SeedIncludedWorkTypes,
  cmv2Sentinel758Fields,
  cmv2WorkTypeIsListed,
  cmv2WorkTypeRow,
} from "./cost-mgmt-v2-model.mjs";

const masterItem = {
  section: "施工",
  workTypeCode: "10100",
  systemWorkType: "材料費",
  himoku: "材料費",
  workType: "塗料",
  workTypeKey: "10100|塗料",
  dayNight: false,
};

test("0 yen is actual; empty months fall back to forecast", () => {
  const actuals = cmv2ParseActuals({
    companies: [
      {
        workTypeKey: "10100|塗料",
        company: "今岡塗装",
        months: [0, null, null, null, null, null, null, null, null, null, null, null],
      },
    ],
  });
  const april = cmv2MonthActual(actuals.companies, "10100|塗料", 0);
  assert.equal(april.has, true);
  assert.equal(april.value, 0);
  assert.equal(cmv2AdoptedMonth(april.has, april.value, 100), 0);
  const may = cmv2MonthActual(actuals.companies, "10100|塗料", 1);
  assert.equal(may.has, false);
  assert.equal(cmv2AdoptedMonth(may.has, may.value, 50), 50);
  assert.equal(cmv2AdoptedMonth(false, null, null), 0);
  assert.equal(cmv2ForecastMonthEditable(true), false);
  assert.equal(cmv2ForecastMonthEditable(false), true);
  assert.equal(cmv2ForecastMonthFilled(null), false);
  assert.equal(cmv2ForecastMonthFilled(""), false);
  assert.equal(cmv2ForecastMonthFilled(0), true);
  assert.equal(cmv2ForecastMonthFilled(50), true);
});

test("same company two contracts sum on the work type month", () => {
  const actuals = cmv2ParseActuals({
    companies: [
      { workTypeKey: "10100|塗料", company: "今岡塗装", months: [100, null] },
      { workTypeKey: "10100|塗料", company: "今岡塗装", months: [30, null] },
    ],
  });
  const april = cmv2MonthActual(actuals.companies, "10100|塗料", 0);
  assert.equal(april.value, 130);
});

test("remaining subtracts March; rate hidden when current is 0", () => {
  const budget = cmv2ParseBudget({
    workTypes: {
      "10100|塗料": {
        current: 1000,
        forecast: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 400],
      },
    },
  });
  const actuals = cmv2ParseActuals({ companies: [] });
  const row = cmv2WorkTypeRow(masterItem, budget, actuals);
  assert.equal(row.adopted[11], 400);
  assert.equal(row.adoptedSum, 400);
  assert.equal(row.remaining, 600);
  const zeroBudget = cmv2ParseBudget({
    workTypes: { "10100|塗料": { current: 0 } },
  });
  const zeroRow = cmv2WorkTypeRow(masterItem, zeroBudget, actuals);
  assert.equal(zeroRow.rate, null);
});

test("first confirm copies current to initial once", () => {
  const first = cmv2ApplyFirstConfirmLock({
    workTypes: { "10100|塗料": { current: 800 }, "10800|仮設材･鉄道器材レンタル": {} },
  });
  assert.equal(first.initialCopied, true);
  assert.equal(first.workTypes["10100|塗料"].initial, 800);
  assert.equal(first.workTypes["10800|仮設材･鉄道器材レンタル"].initial, null);
  first.workTypes["10800|仮設材･鉄道器材レンタル"].current = 50;
  const second = cmv2ApplyFirstConfirmLock(first);
  assert.equal(second.workTypes["10800|仮設材･鉄道器材レンタル"].initial, null);
});

test("master merge adds missing work types without dropping saved ones", () => {
  const budget = cmv2MergeMasterWorkTypes(
    { workTypes: { "10100|塗料": { current: 1 } } },
    [masterItem, { ...masterItem, workType: "鋼材", workTypeKey: "10100|鋼材" }],
  );
  assert.equal(budget.workTypes["10100|塗料"].current, 1);
  assert.equal(budget.workTypes["10100|鋼材"].current, null);
});

test("758 sentinel amount is never the calc input", () => {
  const fields = cmv2Sentinel758Fields({ projectId: "p1", projectBusinessKey: "bk" });
  assert.equal(fields.amount, "0");
  assert.equal(cmv2ActualRecordKey("p1"), "cmv2|p1");
  assert.match(fields.actual_record_key, /^cmv2\|/);
});

test("count adopted ignores countForecast; listed only with actuals or include", () => {
  const nightItem = { ...masterItem, dayNight: true, workType: "昼間", workTypeKey: "20100|昼間" };
  const budget = cmv2ParseBudget({
    workTypes: {
      "20100|昼間": { countPlan: 12, countForecast: [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9] },
    },
  });
  const actuals = cmv2ParseActuals({
    countActual: { "20100|昼間": [2, null] },
  });
  const row = cmv2WorkTypeRow(nightItem, budget, actuals);
  assert.equal(row.countAdopted[0], 2);
  assert.equal(row.countAdopted[1], 0);
  assert.equal(row.countRemaining, 10);

  const emptyBudget = cmv2MergeMasterWorkTypes({}, [masterItem, nightItem]);
  const seeded = cmv2SeedIncludedWorkTypes({
    workTypes: { "10100|塗料": { current: 100 } },
  });
  assert.deepEqual(seeded.includedWorkTypeKeys, ["10100|塗料"]);
  assert.equal(cmv2WorkTypeIsListed("10100|塗料", emptyBudget, cmv2ParseActuals({})), false);
  assert.equal(
    cmv2WorkTypeIsListed("10100|塗料", seeded, cmv2ParseActuals({})),
    true,
  );
  const withActual = cmv2ParseActuals({
    companies: [{ workTypeKey: "10100|塗料", company: "A", months: [1] }],
  });
  assert.equal(cmv2WorkTypeIsListed("10100|塗料", emptyBudget, withActual), true);
  const included = cmv2IncludeWorkType(emptyBudget, "20100|昼間");
  assert.equal(cmv2WorkTypeIsListed("20100|昼間", included, cmv2ParseActuals({})), true);
});
