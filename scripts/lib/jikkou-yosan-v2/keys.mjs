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

// 予実（App758）unique actual_record_key は 64 文字上限。詳細行変種は同一
// (projectId, stableBlockId, cost, month) 群内で rowKey を 8 hex に圧縮した
// r{FNV1a} セグメントを付ける。segment 名も m/f に短縮し、月は YY-MM に
// 詰めることで、詳細変種の全体長を 64 文字以下に収める（レガシー変種は
// 影響を受けず、後方互換性を保つ）。
const DETAIL_ROW_HASH_LENGTH = 8;

/** 32-bit FNV-1a — Node/ブラウザどちらでも同一結果、ハッシュ長 8 hex。 */
function fnv1a32Hex(input) {
  const text = String(input);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(DETAIL_ROW_HASH_LENGTH, "0");
}

/**
 * 詳細行の rowKey（`row-…` など任意）から 8 hex を返す。決定的。
 * detail_row_key フィールドを介した保存往復では元の rowKey を保持するので、
 * この短縮値は actual_record_key の一意性確保にだけ使う。
 */
export function compactRowKeyHash(rowKey) {
  return fnv1a32Hex(requiredSegment(rowKey, "rowKey"));
}

export function actualRecordKey({
  projectId,
  stableBlockId,
  costCategoryKey,
  recordKind,
  targetMonth,
  rowKey = null,
}) {
  const prefix = [
    requiredSegment(projectId, "projectId"),
    requiredSegment(stableBlockId, "stableBlockId"),
    requiredSegment(costCategoryKey, "costCategoryKey"),
  ];
  const hasRow = rowKey !== null && rowKey !== undefined && rowKey !== "";
  const rowSegment = hasRow ? `r${compactRowKeyHash(rowKey)}` : null;
  let key;
  if (recordKind === "final_budget") {
    // 詳細変種は kind を `f` に、レガシーは `final` を維持（互換性）。
    key = hasRow
      ? [...prefix, "f", rowSegment].join(DELIMITER)
      : [...prefix, "final"].join(DELIMITER);
  } else if (recordKind === "monthly_consumption") {
    const month = requiredSegment(targetMonth, "targetMonth");
    const match = /^(\d{4})-(0[1-9]|1[0-2])(?:-01)?$/.exec(month);
    if (!match) throw new RangeError("targetMonth must be YYYY-MM or YYYY-MM-01");
    if (hasRow) {
      // 詳細変種: `m|YY-MM|r{8}` に詰めて 64 文字以内に収める。
      key = [
        ...prefix,
        "m",
        `${match[1].slice(-2)}-${match[2]}`,
        rowSegment,
      ].join(DELIMITER);
    } else {
      key = [...prefix, "monthly", `${match[1]}-${match[2]}`].join(DELIMITER);
    }
  } else {
    throw new RangeError("recordKind must be monthly_consumption or final_budget");
  }
  if (key.length > 64) {
    throw new RangeError(
      `actualRecordKey exceeds 64-char unique limit (${key.length}): ${key}`,
    );
  }
  return key;
}
