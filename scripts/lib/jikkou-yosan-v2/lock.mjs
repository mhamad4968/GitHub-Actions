export const LOCK_STATES = Object.freeze({
  EDITABLE: "editable",
  BUDGET_LOCKED: "budget_locked",
  FULL_LOCKED: "full_locked",
});

export const PARENT_LOCK_SNAPSHOTS = Object.freeze({
  EDITABLE: "editable",
  LOCKED: "locked",
});

const STATUS_DRAFT = "下書き";
const STATUS_CONFIRMED = "版確定";
const RANK = Object.freeze({
  [LOCK_STATES.EDITABLE]: 0,
  [LOCK_STATES.BUDGET_LOCKED]: 1,
  [LOCK_STATES.FULL_LOCKED]: 2,
});

export function deriveLockState({ status, newerVersionExists }) {
  if (typeof newerVersionExists !== "boolean") {
    throw new TypeError("newerVersionExists must be boolean");
  }
  if (status !== STATUS_DRAFT && status !== STATUS_CONFIRMED) {
    throw new RangeError("status must be 下書き or 版確定");
  }
  if (newerVersionExists) return LOCK_STATES.FULL_LOCKED;
  return status === STATUS_DRAFT
    ? LOCK_STATES.EDITABLE
    : LOCK_STATES.BUDGET_LOCKED;
}

export function parentLockSnapshot(lockState) {
  if (!(lockState in RANK)) throw new RangeError("Unknown lock state");
  return lockState === LOCK_STATES.EDITABLE
    ? PARENT_LOCK_SNAPSHOTS.EDITABLE
    : PARENT_LOCK_SNAPSHOTS.LOCKED;
}

export function allowedOperations(lockState) {
  if (!(lockState in RANK)) throw new RangeError("Unknown lock state");
  return Object.freeze({
    editBudget: lockState === LOCK_STATES.EDITABLE,
    editActuals: lockState !== LOCK_STATES.FULL_LOCKED,
    createNextVersion: lockState === LOCK_STATES.BUDGET_LOCKED,
  });
}

export function assertNoUnlockTransition(fromState, toState) {
  if (!(fromState in RANK) || !(toState in RANK)) {
    throw new RangeError("Unknown lock state");
  }
  if (RANK[toState] < RANK[fromState]) {
    throw new RangeError(`Unlock transition is forbidden: ${fromState} -> ${toState}`);
  }
  return toState;
}
