import {
  add,
  compare,
  divideAndRound,
  multiply,
  round,
  subtract,
  sum,
} from "./decimal.mjs";

function present(value) {
  return value !== undefined && value !== null && value !== "";
}

function amounts(items) {
  return items.map((item) => (typeof item === "string" ? item : item.amount));
}

export function decimalLineAmount(quantity, unitPrice) {
  if (!present(quantity) || !present(unitPrice)) return null;
  return multiply(quantity, unitPrice);
}

export function displayInteger(decimalAmount) {
  return decimalAmount === null ? null : round(decimalAmount, 0);
}

export function detailLineAmount({ quantity, unitPrice, unit }) {
  if (!present(quantity) || !present(unitPrice)) return null;
  const raw =
    unit === "％"
      ? divideAndRound(multiply(unitPrice, quantity), "100", 0)
      : round(multiply(quantity, unitPrice), 0);
  return raw;
}

export function contractTotals(lines) {
  const calculated = lines.map((line) => ({
    section: line.section,
    amount: decimalLineAmount(line.quantity, line.unitPrice),
  }));
  const sectionTotal = (section) =>
    sum(
      calculated
        .filter((line) => line.section === section && line.amount !== null)
        .map((line) => line.amount),
    );
  const construction = sectionTotal("施工");
  const safety = sectionTotal("保安");
  return {
    construction,
    safety,
    total1: add(construction, safety),
  };
}

export function salaryTotal(lines) {
  return sum(
    lines
      .map((line) => decimalLineAmount(line.quantity, line.unitPrice))
      .filter((amount) => amount !== null),
  );
}

export function blockTotals({
  detailAmounts,
  overhead = null,
  insurance = null,
  legalWelfare = null,
}) {
  const optional = (value) => (present(value) ? value : "0");
  const subtotal = sum([
    ...amounts(detailAmounts),
    optional(overhead),
    optional(insurance),
  ]);
  return {
    subtotal,
    total: add(subtotal, optional(legalWelfare)),
  };
}

// R-11 (依頼者回答 2026-07-26): 諸経費 = ROUND(明細金額合計 × 率, 0)。
// 「上段の各経費の合計の10%」= 直上の明細行合計の10%。明細金額が1つも無い
// ときは空欄（null）。率は 0.1 を既定とする（諸経費率10%）。
export function overheadFromDetails(detailAmounts, rate) {
  const present_ = amounts(detailAmounts).filter((value) => present(value));
  if (present_.length === 0) return null;
  return round(multiply(sum(present_), rate), 0);
}

export function taxInclusive(exclusiveAmount, taxRate) {
  return round(multiply(exclusiveAmount, add("1", taxRate)), 0);
}

export function taxInclusiveTotal(lines) {
  return sum(
    lines.map((line) => taxInclusive(line.amountExclTax, line.taxRate)),
  );
}

export function ratio(amount, base, { zero = "zero" } = {}) {
  if (compare(base, "0") === 0) {
    if (zero === "not_applicable") return null;
    if (zero === "zero") return "0";
    throw new RangeError("zero must be zero or not_applicable");
  }
  // ROUND(amount / base * 100, 1) / 100 is ratio rounded to 3 places.
  return divideAndRound(amount, base, 3);
}

export function summaryTotals({
  contract,
  blocks,
  salaryLines = [],
}) {
  const contractResult = contractTotals(contract);
  const activeBlocks = blocks.filter((block) => block.status === "active");
  const blockSectionTotal = (category) =>
    sum(
      activeBlocks
        .filter((block) => block.costCategory === category)
        .map((block) => block.total),
    );
  const costConstruction = blockSectionTotal("施工");
  const costSafety = blockSectionTotal("保安");
  const salaries = salaryTotal(salaryLines);
  const total8 = sum([costConstruction, costSafety, salaries]);
  return {
    ...contractResult,
    costConstruction,
    costSafety,
    salary: salaries,
    total8,
    profit9: subtract(contractResult.total1, total8),
  };
}

export function projectBlockTotals(blocks) {
  return sum(
    blocks
      .filter((block) => block.status === "active")
      .map((block) => block.total),
  );
}

export function actualMetrics({
  monthlyAmounts,
  currentBudget,
  finalBudget,
}) {
  const actual = sum(monthlyAmounts);
  const overFinal = subtract(actual, finalBudget);
  return {
    actual,
    remainingBudget: subtract(currentBudget, actual),
    futureRequired: compare(overFinal, "0") > 0 ? overFinal : "0",
    consumptionRatio: ratio(actual, currentBudget, {
      zero: "not_applicable",
    }),
  };
}
