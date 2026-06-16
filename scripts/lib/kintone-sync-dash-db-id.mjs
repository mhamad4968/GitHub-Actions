/**
 * DB app ID を dash desktop.src.js の APP_DB 等に同期（R43 テンプレ）
 */
import { readFileSync, writeFileSync } from 'node:fs';

/**
 * @param {object} opts
 * @param {string} opts.dashSrcPath
 * @param {number|string} opts.dbAppId
 * @param {string} [opts.varName='APP_DB']
 */
export function patchAppDbInDashSrc({ dashSrcPath, dbAppId, varName = 'APP_DB' }) {
  if (!dbAppId || Number(dbAppId) === 0) {
    throw new Error(`${varName}: dbAppId is missing or 0 — APP_DB は 0 禁止`);
  }
  let s = readFileSync(dashSrcPath, 'utf8');
  const re = new RegExp(`var ${varName} = \\d+;`);
  if (!re.test(s)) {
    throw new Error(`${varName} pattern not found in ${dashSrcPath}`);
  }
  s = s.replace(re, `var ${varName} = ${dbAppId};`);
  writeFileSync(dashSrcPath, s, 'utf8');
  return { varName, dbAppId: Number(dbAppId) };
}

/**
 * @param {string} jsonPath
 * @param {{ dbKey?: string, dashKey?: string }} [keys]
 */
export function loadAppIdsFromJson(jsonPath, keys = {}) {
  const dbKey = keys.dbKey || 'dbAppId';
  const dashKey = keys.dashKey || 'dashAppId';
  const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
  return {
    dbAppId: raw[dbKey] ?? raw.db ?? raw.dbAppId,
    dashAppId: raw[dashKey] ?? raw.dash ?? raw.dashAppId,
    raw,
  };
}
