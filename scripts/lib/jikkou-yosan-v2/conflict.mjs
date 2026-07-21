export const CONFLICT_ACTIONS = Object.freeze({
  ABORT_RELOAD: "abort_reload",
});

const REVISION_MISMATCH_CODES = new Set(["GAIA_CO02"]);
const UNIQUE_COLLISION_CODES = new Set(["GAIA_DA02"]);

export class ConflictAbortError extends Error {
  constructor(message, reason, details = {}) {
    super(message);
    this.name = "ConflictAbortError";
    this.reason = reason;
    this.action = CONFLICT_ACTIONS.ABORT_RELOAD;
    this.autoRetry = false;
    Object.assign(this, details);
  }
}

function collectErrorCodes(value, output = new Set(), seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return output;
  seen.add(value);
  if (typeof value.code === "string") output.add(value.code);
  if (Array.isArray(value)) {
    for (const item of value) collectErrorCodes(item, output, seen);
  } else {
    for (const child of Object.values(value)) collectErrorCodes(child, output, seen);
  }
  return output;
}

function abortDecision(reason, details = {}) {
  return Object.freeze({
    reason,
    action: CONFLICT_ACTIONS.ABORT_RELOAD,
    autoRetry: false,
    ...details,
  });
}

export function isRevisionMismatch(error) {
  const codes = collectErrorCodes(error);
  return [...codes].some((code) => REVISION_MISMATCH_CODES.has(code));
}

export function revisionMismatchDecision(error) {
  return isRevisionMismatch(error) ? abortDecision("revision_mismatch") : null;
}

export function assertNoRevisionMismatch(error) {
  if (isRevisionMismatch(error)) {
    throw new ConflictAbortError(
      "Revision mismatch: abort the whole save and reload; automatic retry is forbidden",
      "revision_mismatch",
    );
  }
  return error;
}

export function classifyUniqueKeyCollision(error, uniqueKeyCodes = []) {
  if (!Array.isArray(uniqueKeyCodes)) {
    throw new TypeError("uniqueKeyCodes must be an array");
  }
  const codes = collectErrorCodes(error);
  if (![...codes].some((code) => UNIQUE_COLLISION_CODES.has(code))) return null;
  const text = JSON.stringify(error);
  const collidedKeys = uniqueKeyCodes.filter(
    (fieldCode) => typeof fieldCode === "string" && text.includes(fieldCode),
  );
  return abortDecision("unique_key_collision", {
    collidedKeys: Object.freeze(collidedKeys),
  });
}

export function assertActualsCurrentVersion({ screenVersionId, currentVersionId }) {
  if (
    typeof screenVersionId !== "string" ||
    screenVersionId.length === 0 ||
    typeof currentVersionId !== "string" ||
    currentVersionId.length === 0
  ) {
    throw new TypeError("screenVersionId and currentVersionId must be non-empty strings");
  }
  if (screenVersionId !== currentVersionId) {
    throw new ConflictAbortError(
      "Actuals save rejected: the screen version is no longer current",
      "screen_version_not_current",
      { screenVersionId, currentVersionId },
    );
  }
  return currentVersionId;
}
