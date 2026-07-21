const DELIMITER = "|";

function requiredSegment(value, name) {
  if (typeof value !== "string") throw new TypeError(`${name} must be a string`);
  const normalized = value.trim();
  if (!normalized) throw new RangeError(`${name} must not be empty`);
  if (normalized.includes(DELIMITER)) {
    throw new RangeError(`${name} must not contain "${DELIMITER}"`);
  }
  return normalized;
}

function optionalSegment(value, name) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new TypeError(`${name} must be a string`);
  const normalized = value.trim();
  if (normalized.includes(DELIMITER)) {
    throw new RangeError(`${name} must not contain "${DELIMITER}"`);
  }
  return normalized;
}

function projectBusinessKeySegment(value) {
  if (typeof value !== "string") {
    throw new TypeError("projectBusinessKey must be a string");
  }
  const parts = value.split(DELIMITER);
  if (parts.length !== 2 || !parts[0]) {
    throw new RangeError("projectBusinessKey must be projectCode|projectBranch");
  }
  return `${requiredSegment(parts[0], "projectCode")}${DELIMITER}${optionalSegment(parts[1], "projectBranch")}`;
}

function generatedId(prefix, uuidFactory) {
  if (typeof uuidFactory !== "function") {
    throw new TypeError("uuidFactory must be a function");
  }
  return `${prefix}${requiredSegment(uuidFactory(), "uuid")}`;
}

const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";
const COMPACT_LENGTH = 16;

/**
 * kintone の unique 文字列フィールドは 64 文字上限。フル UUID の連結キー
 * （bv-…|row-… = 80文字）は入らないため、UUID を 16 文字 base36（約82.7bit）
 * に圧縮する。detail_record_key は 3+16+1+4+16 = 40 文字に収まる。
 */
export function compactUuid(uuid) {
  const hex = String(uuid).replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) {
    throw new TypeError("compactUuid requires a UUID string");
  }
  let n = BigInt(`0x${hex}`);
  let out = "";
  for (let i = 0; i < COMPACT_LENGTH; i += 1) {
    out = BASE36[Number(n % 36n)] + out;
    n /= 36n;
  }
  return out;
}

export function compactUuidFactory(baseFactory) {
  if (typeof baseFactory !== "function") {
    throw new TypeError("compactUuidFactory requires a base uuid factory");
  }
  return () => compactUuid(baseFactory());
}

export function projectBusinessKey(projectCode, projectBranch = "") {
  // TODO(P-43): No case, Unicode, or zero-padding normalization is specified.
  return `${requiredSegment(projectCode, "projectCode")}${DELIMITER}${optionalSegment(projectBranch, "projectBranch")}`;
}

export function createProjectId(uuidFactory) {
  return generatedId("prj-", uuidFactory);
}

export function createBudgetVersionId(uuidFactory) {
  return generatedId("bv-", uuidFactory);
}

export function createStableBlockId(uuidFactory) {
  return generatedId("blk-", uuidFactory);
}

export function createRowKey(uuidFactory) {
  return generatedId("row-", uuidFactory);
}

export function detailRecordKey(budgetVersionId, rowKey) {
  return `${requiredSegment(budgetVersionId, "budgetVersionId")}${DELIMITER}${requiredSegment(rowKey, "rowKey")}`;
}

export function versionRecordKey(projectId, versionSeq) {
  if (!Number.isSafeInteger(versionSeq) || versionSeq < 1) {
    throw new RangeError("versionSeq must be a positive safe integer");
  }
  return `${requiredSegment(projectId, "projectId")}${DELIMITER}${versionSeq}`;
}

export function seriesGuardKey({ initial, projectBusinessKey: businessKey, budgetVersionId }) {
  return initial
    ? `project${DELIMITER}${projectBusinessKeySegment(businessKey)}`
    : `version${DELIMITER}${requiredSegment(budgetVersionId, "budgetVersionId")}`;
}

export function actualRecordKey({
  projectId,
  stableBlockId,
  costCategoryKey,
  recordKind,
  targetMonth,
}) {
  const prefix = [
    requiredSegment(projectId, "projectId"),
    requiredSegment(stableBlockId, "stableBlockId"),
    requiredSegment(costCategoryKey, "costCategoryKey"),
  ];
  if (recordKind === "final_budget") {
    return [...prefix, "final"].join(DELIMITER);
  }
  if (recordKind !== "monthly_consumption") {
    throw new RangeError("recordKind must be monthly_consumption or final_budget");
  }
  const month = requiredSegment(targetMonth, "targetMonth");
  const match = /^(\d{4})-(0[1-9]|1[0-2])(?:-01)?$/.exec(month);
  if (!match) throw new RangeError("targetMonth must be YYYY-MM or YYYY-MM-01");
  return [...prefix, "monthly", `${match[1]}-${match[2]}`].join(DELIMITER);
}
