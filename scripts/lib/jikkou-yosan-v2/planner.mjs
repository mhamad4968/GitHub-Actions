import { assertAllowedAppId } from "./guard.mjs";

export const RECORDS_PER_REQUEST = 100;
export const MAX_BULK_REQUESTS = 20;
export const MAX_VERSION_COPY_ROWS = 900;

const RECORDS_API = "/k/v1/records.json";

function assertArray(value, name) {
  if (!Array.isArray(value)) throw new TypeError(`${name} must be an array`);
  return value;
}

function hasRevision(value) {
  return (
    (typeof value === "string" && value.length > 0) ||
    (Number.isSafeInteger(value) && value >= 0)
  );
}

function fieldValue(record, fieldCode) {
  const field = record?.[fieldCode];
  return field && typeof field === "object" && "value" in field ? field.value : field;
}

function copyRequest(request, name) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new TypeError(`${name} must be a bulkRequest request object`);
  }
  if (typeof request.method !== "string" || typeof request.api !== "string") {
    throw new TypeError(`${name} must include method and api strings`);
  }
  if (!request.payload || typeof request.payload !== "object") {
    throw new TypeError(`${name} must include a payload object`);
  }
  assertAllowedAppId(request.payload.app, name);
  return Object.freeze({ ...request, payload: Object.freeze({ ...request.payload }) });
}

function assertWriteRevisions(request, name) {
  if (request.method === "POST") return request;
  if (request.method === "PUT" && Array.isArray(request.payload.records)) {
    for (const [index, record] of request.payload.records.entries()) {
      if (!hasRevision(record?.revision)) {
        throw new TypeError(`${name}.payload.records[${index}] requires revision`);
      }
    }
    return request;
  }
  if (request.method === "DELETE") {
    if (
      !Array.isArray(request.payload.ids) ||
      !Array.isArray(request.payload.revisions) ||
      request.payload.ids.length !== request.payload.revisions.length ||
      request.payload.revisions.some((revision) => !hasRevision(revision))
    ) {
      throw new TypeError(`${name} requires one revision per deleted record`);
    }
    return request;
  }
  if (request.method === "PUT" && hasRevision(request.payload.revision)) return request;
  throw new TypeError(`${name} must carry revision CAS for an existing record write`);
}

function makeRecordsRequest(method, appId, records) {
  return Object.freeze({
    method,
    api: RECORDS_API,
    payload: Object.freeze({ app: assertAllowedAppId(appId, "records request"), records }),
  });
}

function chunkRanges(rowCount) {
  const ranges = [];
  for (let start = 0, index = 0; start < rowCount; start += RECORDS_PER_REQUEST, index += 1) {
    const end = Math.min(start + RECORDS_PER_REQUEST, rowCount);
    ranges.push(Object.freeze({ index, start, end, count: end - start }));
  }
  return Object.freeze(ranges);
}

function assertBulkLimit(requests, operation) {
  if (requests.length > MAX_BULK_REQUESTS) {
    const error = new RangeError(
      `${operation}: ${requests.length} requests exceeds the ${MAX_BULK_REQUESTS}-request limit`,
    );
    error.operation = operation;
    error.requestCount = requests.length;
    throw error;
  }
  return requests;
}

function freezePlan(plan) {
  return Object.freeze({ ...plan, requests: Object.freeze(plan.requests) });
}

function chunkRecords(records, appId, method) {
  return chunkRanges(records.length).map(({ start, end }) =>
    makeRecordsRequest(method, appId, Object.freeze(records.slice(start, end))),
  );
}

export function versionBulkRequestCount(rowCount) {
  if (!Number.isSafeInteger(rowCount) || rowCount < 0) {
    throw new RangeError("rowCount must be a non-negative safe integer");
  }
  return 2 + 2 * Math.ceil(rowCount / RECORDS_PER_REQUEST);
}

export function planVersionBulkRequest(rowCount) {
  const requestCount = versionBulkRequestCount(rowCount);
  if (rowCount > MAX_VERSION_COPY_ROWS) {
    const error = new RangeError(
      `Cannot plan ${rowCount} rows: ${requestCount} requests exceeds the 20-request limit`,
    );
    error.rowCount = rowCount;
    error.requestCount = requestCount;
    throw error;
  }
  const chunks = Math.ceil(rowCount / RECORDS_PER_REQUEST);
  return Object.freeze({
    rowCount,
    recordsPerRequest: RECORDS_PER_REQUEST,
    copyRequestCount: chunks,
    lockRequestCount: chunks,
    fixedRequestCount: 2,
    requestCount,
  });
}

export function planAtomicBudgetSave({
  parentPut,
  detailAppId,
  detailAdds = [],
  detailUpdates = [],
  detailDeletes = [],
  projectionPut = null,
}) {
  assertArray(detailAdds, "detailAdds");
  assertArray(detailUpdates, "detailUpdates");
  assertArray(detailDeletes, "detailDeletes");
  const appId = assertAllowedAppId(detailAppId, "planAtomicBudgetSave.detailAppId");
  const requests = [
    assertWriteRevisions(copyRequest(parentPut, "parentPut"), "parentPut"),
    ...chunkRecords(detailAdds, appId, "POST"),
    ...chunkRecords(detailUpdates, appId, "PUT").map((request, index) =>
      assertWriteRevisions(request, `detailUpdates[chunk ${index}]`),
    ),
  ];
  for (const [index, deletion] of detailDeletes.entries()) {
    if (!deletion || deletion.id == null || !hasRevision(deletion.revision)) {
      throw new TypeError(`detailDeletes[${index}] requires id and revision`);
    }
  }
  for (const { start, end } of chunkRanges(detailDeletes.length)) {
    const chunk = detailDeletes.slice(start, end);
    requests.push(
      assertWriteRevisions(
        Object.freeze({
          method: "DELETE",
          api: RECORDS_API,
          payload: Object.freeze({
            app: appId,
            ids: Object.freeze(chunk.map(({ id }) => id)),
            revisions: Object.freeze(chunk.map(({ revision }) => revision)),
          }),
        }),
        `detailDeletes[${start}:${end}]`,
      ),
    );
  }
  if (projectionPut != null) {
    requests.push(
      assertWriteRevisions(copyRequest(projectionPut, "projectionPut"), "projectionPut"),
    );
  }
  assertBulkLimit(requests, "atomic budget save");
  return freezePlan({ operation: "atomic_budget_save", requestCount: requests.length, requests });
}

export function planVersionCopy({
  oldParentLock,
  newParentCreate,
  detailAppId,
  newDetailRecords,
  oldDetailLockUpdates,
}) {
  assertArray(newDetailRecords, "newDetailRecords");
  assertArray(oldDetailLockUpdates, "oldDetailLockUpdates");
  if (newDetailRecords.length !== oldDetailLockUpdates.length) {
    throw new RangeError("newDetailRecords and oldDetailLockUpdates must have equal lengths");
  }
  const rowCount = newDetailRecords.length;
  const sizing = planVersionBulkRequest(rowCount);
  for (const [index, update] of oldDetailLockUpdates.entries()) {
    if (fieldValue(update?.record, "parent_lock_snapshot") !== "locked") {
      throw new TypeError(
        `oldDetailLockUpdates[${index}] must set parent_lock_snapshot to locked`,
      );
    }
  }
  const appId = assertAllowedAppId(detailAppId, "planVersionCopy.detailAppId");
  const boundaries = chunkRanges(rowCount);
  const copyRequests = chunkRecords(newDetailRecords, appId, "POST");
  const lockRequests = chunkRecords(oldDetailLockUpdates, appId, "PUT").map(
    (request, index) => assertWriteRevisions(request, `oldDetailLockUpdates[chunk ${index}]`),
  );
  const requests = [
    assertWriteRevisions(copyRequest(oldParentLock, "oldParentLock"), "oldParentLock"),
    copyRequest(newParentCreate, "newParentCreate"),
    ...copyRequests,
    ...lockRequests,
  ];
  if (requests[1].method !== "POST") {
    throw new TypeError("newParentCreate must be a POST request");
  }
  if (Number(requests[0].payload.app) !== Number(requests[1].payload.app)) {
    throw new RangeError("oldParentLock and newParentCreate must target the same parent app");
  }
  assertBulkLimit(requests, "version copy");
  return freezePlan({
    operation: "version_copy",
    rowCount,
    requestCount: sizing.requestCount,
    requests,
    chunks: Object.freeze({
      copy: boundaries,
      parentLockSnapshot: boundaries,
    }),
  });
}

export function planActualsSave({ actualWriteSeqPut, actualAppId, actualWrites = [] }) {
  assertArray(actualWrites, "actualWrites");
  const appId = assertAllowedAppId(actualAppId, "planActualsSave.actualAppId");
  const casPut = assertWriteRevisions(
    copyRequest(actualWriteSeqPut, "actualWriteSeqPut"),
    "actualWriteSeqPut",
  );
  if (fieldValue(casPut.payload.record, "actual_write_seq") == null) {
    throw new TypeError("actualWriteSeqPut must update actual_write_seq");
  }
  const writes = actualWrites.map((request, index) => {
    const checked = assertWriteRevisions(
      copyRequest(request, `actualWrites[${index}]`),
      `actualWrites[${index}]`,
    );
    if (Number(checked.payload.app) !== appId) {
      throw new RangeError(`actualWrites[${index}] must target actualAppId ${appId}`);
    }
    return checked;
  });
  const requests = [casPut, ...writes];
  assertBulkLimit(requests, "actuals save");
  return freezePlan({ operation: "actuals_save", requestCount: requests.length, requests });
}
