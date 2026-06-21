/**
 * JBIS 所属・拠点の表示並び（R68 正本 JSON 参照）
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'data');

export const LOCATION_SORT_PATH = path.join(DATA, 'jbis-location-sort-master.json');
export const DEPT_BLOCK_ORDER_PATH = path.join(DATA, 'business-improvement-annual-department-order.json');
export const DEPT_FLAT_ORDER_PATH = path.join(DATA, 'vpn-account-depts.json');

export function loadLocationSortMaster() {
  return JSON.parse(readFileSync(LOCATION_SORT_PATH, 'utf8'));
}

export function loadDepartmentBlockOrder() {
  return JSON.parse(readFileSync(DEPT_BLOCK_ORDER_PATH, 'utf8'));
}

export function loadDepartmentFlatOrder() {
  return JSON.parse(readFileSync(DEPT_FLAT_ORDER_PATH, 'utf8'));
}

/** @param {string} name */
export function departmentFlatSortKey(name) {
  const n = String(name || '').trim();
  if (!n) return [9, ''];
  const flat = loadDepartmentFlatOrder();
  const exact = flat.indexOf(n);
  if (exact >= 0) return [0, exact, ''];
  for (let i = 0; i < flat.length; i++) {
    const base = flat[i];
    if (n.startsWith(`${base}-`) || n.startsWith(`${base}－`)) {
      return [0, i, n.slice(base.length + 1)];
    }
  }
  const block = loadDepartmentBlockOrder();
  const ho = block.headOffice.indexOf(n);
  if (ho >= 0) return [1, 0, ho, ''];
  const br = block.branchesAndOffices.indexOf(n);
  if (br >= 0) return [1, 1, br, ''];
  return [2, n];
}

/** @param {string} a @param {string} b */
export function compareDepartmentNames(a, b) {
  const ka = departmentFlatSortKey(a);
  const kb = departmentFlatSortKey(b);
  const len = Math.max(ka.length, kb.length);
  for (let i = 0; i < len; i++) {
    const va = ka[i] ?? '';
    const vb = kb[i] ?? '';
    if (va === vb) continue;
    if (typeof va === 'number' && typeof vb === 'number') return va - vb;
    return String(va).localeCompare(String(vb), 'ja');
  }
  return 0;
}

/** @param {string[]} names */
export function sortDepartmentNames(names) {
  return [...names].sort(compareDepartmentNames);
}

/** @param {string} locationName */
export function locationSortKey(locationName) {
  const n = String(locationName || '').trim();
  const master = loadLocationSortMaster();
  const hit = (master.locations || []).find((x) => x.location_name === n);
  if (hit) return [0, Number(hit.sort_no) || 0, n];
  return [1, n];
}

/** @param {string} a @param {string} b */
export function compareLocationNames(a, b) {
  const ka = locationSortKey(a);
  const kb = locationSortKey(b);
  for (let i = 0; i < 3; i++) {
    if (ka[i] === kb[i]) continue;
    if (typeof ka[i] === 'number' && typeof kb[i] === 'number') return ka[i] - kb[i];
    return String(ka[i]).localeCompare(String(kb[i]), 'ja');
  }
  return 0;
}
