export const FORBIDDEN_APP_IDS = Object.freeze([735, 736]);

export function assertAllowedAppId(appId, context = "write") {
  const n = Number(appId);
  if (!Number.isSafeInteger(n) || n <= 0) {
    throw new RangeError(`${context}: invalid appId ${JSON.stringify(appId)}`);
  }
  if (FORBIDDEN_APP_IDS.includes(n)) {
    throw new Error(
      `${context}: appId ${n} is FORBIDDEN (App 735/736 must never be touched)`,
    );
  }
  return n;
}

export function assertBulkRequestAllowedApps(requests, context = "bulkRequest") {
  if (!Array.isArray(requests)) {
    throw new TypeError(`${context}: requests must be an array`);
  }
  for (const [index, request] of requests.entries()) {
    const appId = request?.payload?.app;
    assertAllowedAppId(appId, `${context}[${index}]`);
  }
  return requests;
}
