/**
 * kintone レコード clone → REST POST 用の純関数（2026-08-11 夕反省 R3）
 *
 * ブラウザ側（674 desktop.js）と同趣旨の除外集合をここに正本化し、
 * 針テストで desktop.js 文字列と一致を検証する。
 */

/** GET レコードに載るが POST で拒否される type */
export const SKIP_CLONE_FIELD_TYPES = Object.freeze([
  'CALC',
  'FILE',
  'RECORD_ID',
  'RECORD_NUMBER',
  'CREATOR',
  'CREATED_TIME',
  'MODIFIER',
  'UPDATED_TIME',
  'STATUS',
  'STATUS_ASSIGNEE',
  'CATEGORY',
]);

/** 日本語ラベル code でも除外（環境差吸収） */
export const SKIP_CLONE_FIELD_CODES = Object.freeze([
  'レコード番号',
  '作成者',
  '作成日時',
  '更新者',
  '更新日時',
  'ステータス',
  'カテゴリー',
  '作業者',
]);

const SKIP_TYPE_SET = new Set(SKIP_CLONE_FIELD_TYPES);
const SKIP_CODE_SET = new Set(SKIP_CLONE_FIELD_CODES);

export function shouldSkipCloneField(code, cell) {
  if (!cell || typeof cell !== 'object') return true;
  if (String(code || '').startsWith('$')) return true;
  if (SKIP_CODE_SET.has(code)) return true;
  if (SKIP_TYPE_SET.has(cell.type)) return true;
  return false;
}

/** 空スカラーは CB_VA01 になり得るため POST から省略 */
export function shouldOmitEmptyScalar(type, value) {
  if (type !== 'DATE' && type !== 'DATETIME' && type !== 'TIME' && type !== 'NUMBER') {
    return false;
  }
  return value === '' || value == null;
}

/**
 * type 付きレコード → POST 用 { code: { value } }
 */
export function toApiRecordValuesOnly(typedRecord) {
  const out = {};
  for (const code of Object.keys(typedRecord || {})) {
    const cell = typedRecord[code];
    if (!cell || typeof cell !== 'object') continue;
    if (!Object.prototype.hasOwnProperty.call(cell, 'value')) continue;
    if (shouldOmitEmptyScalar(cell.type, cell.value)) continue;
    out[code] = { value: cell.value };
  }
  return out;
}

/**
 * 必須 DROP_DOWN を空にしない（未設定なら初期値を入れる）
 */
export function ensureRequiredDropdown(typedRecord, fieldCode, initialValue) {
  const out = { ...(typedRecord || {}) };
  const code = String(fieldCode || '').trim();
  const v = String(initialValue ?? '').trim();
  if (!code || !v) return out;
  if (out[code] && typeof out[code] === 'object') {
    out[code] = { ...out[code], type: out[code].type || 'DROP_DOWN', value: v };
  } else {
    out[code] = { type: 'DROP_DOWN', value: v };
  }
  return out;
}

/**
 * clone 元から POST 下地を作る（システム項目除外・SUBTABLE 空）。業務クリアは呼び出し側。
 */
export function buildClonePostBase(srcRecord) {
  const out = {};
  for (const code of Object.keys(srcRecord || {})) {
    const cell = srcRecord[code];
    if (shouldSkipCloneField(code, cell)) continue;
    if (cell.type === 'SUBTABLE') {
      out[code] = { type: 'SUBTABLE', value: [] };
      continue;
    }
    out[code] = JSON.parse(JSON.stringify(cell));
  }
  return out;
}
