import {
  createBudgetVersionId,
  seriesGuardKey,
  versionRecordKey,
} from "./keys.mjs";
import { allowedOperations, deriveLockState } from "./lock.mjs";
import { planVersionBulkRequest } from "./planner.mjs";

// §10.0b (V2): version types are reused unchanged from Ver.01.
export const VERSION_TYPES = Object.freeze([
  "当初",
  "仕様変更",
  "価格変更",
  "仕様・価格変更",
  "その他",
]);

export const VERSION_STATUS_DRAFT = "下書き";
export const VERSION_STATUS_CONFIRMED = "版確定";

// P-29 dialog wording (schema design §7).
export const VERSION_DUPLICATE_MESSAGES = Object.freeze({
  "next-version":
    "この工事の実行予算書はすでに作成されています。次の版を作成しますか？",
  "open-draft":
    "この工事には編集中の下書きがあります。既存の下書きを開きますか？",
});

// §10.0k (V13) minimum lock-UI wording: budget lock vs actuals lock visible.
export const VERSION_LOCK_LABELS = Object.freeze({
  editable: "編集可（下書き）",
  budget_locked: "予算ロック（予実のみ編集可）",
  full_locked: "完全ロック（閲覧のみ）",
});

function versionFieldValue(record, code) {
  const field = record && record[code];
  return field && typeof field === "object" && "value" in field
    ? field.value
    : field;
}

function versionDefaultUuidFactory() {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }
  throw new Error("crypto.randomUUID unavailable — pass uuidFactory");
}

function normalizeVersionRecord(record, index) {
  const context = `versions[${index}]`;
  const projectId = versionFieldValue(record, "project_id");
  if (typeof projectId !== "string" || !projectId.trim()) {
    throw new TypeError(`${context}: project_id is required`);
  }
  const versionSeq = Number(versionFieldValue(record, "version_seq"));
  if (!Number.isSafeInteger(versionSeq) || versionSeq < 1) {
    throw new RangeError(`${context}: version_seq must be a positive safe integer`);
  }
  const status = versionFieldValue(record, "status");
  if (status !== VERSION_STATUS_DRAFT && status !== VERSION_STATUS_CONFIRMED) {
    throw new RangeError(`${context}: status must be 下書き or 版確定`);
  }
  const versionType = versionFieldValue(record, "version_type");
  if (!VERSION_TYPES.includes(versionType)) {
    throw new RangeError(
      `${context}: unknown version_type ${JSON.stringify(versionType)} (V2)`,
    );
  }
  const budgetVersionId = versionFieldValue(record, "budget_version_id");
  if (typeof budgetVersionId !== "string" || !budgetVersionId.trim()) {
    throw new TypeError(`${context}: budget_version_id is required`);
  }
  return {
    projectId: projectId.trim(),
    versionSeq,
    versionType,
    status,
    budgetVersionId: budgetVersionId.trim(),
  };
}

// One project series: V5 (single draft), V11b (any newer version — draft or
// confirmed — full-locks every older one). Lock is derived, never read from
// an is_locked cache (P-38); the only inputs are status + newer existence.
function annotateProjectVersions(projectId, versions) {
  const sorted = [...versions].sort((a, b) => a.versionSeq - b.versionSeq);
  const seen = new Set();
  for (const version of sorted) {
    if (seen.has(version.versionSeq)) {
      throw new RangeError(
        `project ${projectId}: duplicate version_seq ${version.versionSeq} (version_record_key must be unique)`,
      );
    }
    seen.add(version.versionSeq);
  }
  const maxSeq = sorted[sorted.length - 1].versionSeq;
  const drafts = sorted.filter((v) => v.status === VERSION_STATUS_DRAFT);
  if (drafts.length > 1) {
    throw new RangeError(`project ${projectId}: at most 1 下書き per series (V5)`);
  }
  if (drafts.length === 1 && drafts[0].versionSeq !== maxSeq) {
    throw new RangeError(
      `project ${projectId}: the 下書き must be the newest version (V11b)`,
    );
  }
  return Object.freeze(
    sorted.map((version) => {
      const newerVersionExists = version.versionSeq < maxSeq;
      const derivedLockState = deriveLockState({
        status: version.status,
        newerVersionExists,
      });
      return Object.freeze({
        ...version,
        versionRecordKey: versionRecordKey(version.projectId, version.versionSeq),
        newerVersionExists,
        derivedLockState,
        lockLabel: VERSION_LOCK_LABELS[derivedLockState],
        allowedOperations: allowedOperations(derivedLockState),
      });
    }),
  );
}

// Offline in-memory series over App1-shaped version records. No network.
export function createVersionSeriesModel({
  records = [],
  uuidFactory = versionDefaultUuidFactory,
} = {}) {
  if (!Array.isArray(records)) {
    throw new TypeError("records must be an array");
  }
  const byProject = new Map();
  const budgetVersionIds = new Set();
  records.map(normalizeVersionRecord).forEach((version) => {
    if (budgetVersionIds.has(version.budgetVersionId)) {
      throw new RangeError(
        `duplicate budget_version_id ${version.budgetVersionId} (unique in App1)`,
      );
    }
    budgetVersionIds.add(version.budgetVersionId);
    if (!byProject.has(version.projectId)) byProject.set(version.projectId, []);
    byProject.get(version.projectId).push(version);
  });
  const series = new Map(
    [...byProject].map(([projectId, versions]) => [
      projectId,
      annotateProjectVersions(projectId, versions),
    ]),
  );

  function listVersions(projectId) {
    return series.get(projectId) ?? Object.freeze([]);
  }

  // V11: 最新の確定版 = the confirmed version with the largest version_seq.
  function latestConfirmed(projectId) {
    const confirmed = listVersions(projectId).filter(
      (version) => version.status === VERSION_STATUS_CONFIRMED,
    );
    return confirmed.length > 0 ? confirmed[confirmed.length - 1] : null;
  }

  function draftVersion(projectId) {
    return (
      listVersions(projectId).find(
        (version) => version.status === VERSION_STATUS_DRAFT,
      ) ?? null
    );
  }

  function findByBudgetVersionId(budgetVersionId) {
    for (const versions of series.values()) {
      const match = versions.find(
        (version) => version.budgetVersionId === budgetVersionId,
      );
      if (match) return match;
    }
    return null;
  }

  // V7 planning only: derive the keys/meta of the next draft WITHOUT any
  // network call. Uses the same P-34 sizing as planVersionCopy, so 901+
  // detail rows abort before anything would be sent.
  function planNextVersionDraft(fromConfirmedVersion, detailRowCount, options = {}) {
    const sourceId =
      typeof fromConfirmedVersion === "string"
        ? fromConfirmedVersion
        : fromConfirmedVersion && fromConfirmedVersion.budgetVersionId;
    const from = findByBudgetVersionId(sourceId);
    if (!from) {
      throw new RangeError(
        `planNextVersionDraft: unknown source version ${JSON.stringify(sourceId)}`,
      );
    }
    if (!from.allowedOperations.createNextVersion) {
      throw new Error(
        `planNextVersionDraft: createNextVersion is not allowed from ${from.derivedLockState} (V5/V7/V9)`,
      );
    }
    // P-28/V3b: actuals stay 工事帰属 — copying them is never plannable.
    if (options.copyActuals) {
      throw new RangeError(
        "planNextVersionDraft: actuals are never copied to a new version (P-28/V3b)",
      );
    }
    const sizing = planVersionBulkRequest(detailRowCount);
    const budgetVersionId = createBudgetVersionId(uuidFactory);
    const versionSeq = from.versionSeq + 1;
    return Object.freeze({
      operation: "next_version_draft",
      network: false,
      projectId: from.projectId,
      sourceBudgetVersionId: from.budgetVersionId,
      sourceVersionSeq: from.versionSeq,
      budgetVersionId,
      versionSeq,
      versionRecordKey: versionRecordKey(from.projectId, versionSeq),
      seriesGuardKey: seriesGuardKey({ initial: false, budgetVersionId }),
      status: VERSION_STATUS_DRAFT,
      detailRowCount,
      sizing,
      copies: Object.freeze({ detailRows: detailRowCount, actualRows: 0 }),
      actualsCopied: false,
    });
  }

  return Object.freeze({
    projectIds: () => Object.freeze([...series.keys()]),
    listVersions,
    latestConfirmed,
    draftVersion,
    planNextVersionDraft,
  });
}

// P-29 duplicate-creation dialog decision (pure). `existingVersions` is the
// series search result for the entered 工事コード＋枝番 (project_business_key);
// `accepted` is the user's dialog answer. Saving never proceeds without an
// explicit「はい」, and the copy source of a next version is always the
// latest confirmed version (never the new-record screen input).
export function duplicateSeriesDecision({
  existingVersions = [],
  accepted = false,
} = {}) {
  if (!Array.isArray(existingVersions)) {
    throw new TypeError("existingVersions must be an array");
  }
  if (existingVersions.length === 0) {
    return Object.freeze({
      seriesExists: false,
      dialog: null,
      message: null,
      outcome: "create-initial",
    });
  }
  const normalized = existingVersions.map(normalizeVersionRecord);
  const projectIds = new Set(normalized.map((version) => version.projectId));
  if (projectIds.size !== 1) {
    throw new RangeError(
      "duplicateSeriesDecision: search result must be a single series (1工事1系列, P-29)",
    );
  }
  const annotated = annotateProjectVersions([...projectIds][0], normalized);
  const draft = annotated.find(
    (version) => version.status === VERSION_STATUS_DRAFT,
  );
  if (draft) {
    // V5: never create a second draft; open the existing one instead.
    return Object.freeze({
      seriesExists: true,
      dialog: "open-draft",
      message: VERSION_DUPLICATE_MESSAGES["open-draft"],
      outcome: accepted === true ? "open-draft" : "save-blocked",
      draftBudgetVersionId: draft.budgetVersionId,
    });
  }
  const copySource = annotated[annotated.length - 1];
  return Object.freeze({
    seriesExists: true,
    dialog: "next-version",
    message: VERSION_DUPLICATE_MESSAGES["next-version"],
    outcome: accepted === true ? "next-version" : "save-blocked",
    copySourceBudgetVersionId: copySource.budgetVersionId,
  });
}
