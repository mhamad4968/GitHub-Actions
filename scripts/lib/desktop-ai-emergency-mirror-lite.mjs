/**
 * Desktop 24/25 全文ミラーに加え、浜田がメモ帳で開く **LITE 要約**（専用番号 34/35）を生成する。
 * 全文 .md は AI 同期専用（メモ帳非推奨 — Application Hang 再発防止）。
 *
 * @see scripts/sync-session-starter-to-desktop.mjs
 * @see scripts/verify-desktop-ai-emergency-sync.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

/** @typedef {'head' | 'tail'} MirrorLiteSliceMode */

/** 要約に含める本文行数（ヘッダー行は別） */
export const MIRROR_LITE_BODY_LINE_LIMIT = 100;

/** LITE 1 ファイル上限（全文 mirror 誤配置検知 / S3） */
export const MIRROR_LITE_MAX_BYTES = 32 * 1024;

/**
 * @type {Array<{
 *   srcRel: string;
 *   destName: string;
 *   fullMirrorDestName: string;
 *   slice: MirrorLiteSliceMode;
 *   headerNote: string;
 * }>}
 */
export const SESSION_DESKTOP_MIRROR_LITE_SPECS = [
  {
    srcRel: 'chat-sessions/handoff-log.md',
    destName: '34-handoff-log-LITE.txt',
    fullMirrorDestName: '24-handoff-log.md',
    slice: 'tail',
    headerNote:
      '抽出: **末尾100行**（直近引き継ぎブロック）。全文は chat-sessions/handoff-log.md（AI Read）',
  },
  {
    srcRel: 'chat-sessions/checkpoint-latest.md',
    destName: '35-checkpoint-latest-LITE.txt',
    fullMirrorDestName: '25-checkpoint-latest.md',
    slice: 'head',
    headerNote: '抽出: **先頭100行**（最新 checkpoint 表）。全文は chat-sessions/checkpoint-latest.md（AI Read）',
  },
];

/**
 * @param {string} fullMirrorDestName 例 24-handoff-log.md
 */
function bannerLines(fullMirrorDestName, headerNote) {
  return [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '【浜田用要約】メモ帳で開くのは **本 LITE ファイルのみ**',
    `【AI同期専用・メモ帳非推奨】${fullMirrorDestName}`,
    '  → sync 上書き中にメモ帳で開くと固まりやすい（Application Hang 再発防止）',
    headerNote,
    '【生成】npm run session-starter:sync-desktop',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
  ];
}

/**
 * @param {string} text
 * @param {MirrorLiteSliceMode} slice
 * @param {number} limit
 */
export function sliceBodyLines(text, slice, limit = MIRROR_LITE_BODY_LINE_LIMIT) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length <= limit) return lines;
  return slice === 'tail' ? lines.slice(-limit) : lines.slice(0, limit);
}

/**
 * @param {string} root リポルート
 * @param {{ srcRel: string; destName: string; slice: MirrorLiteSliceMode; headerNote: string }} spec
 * @param {string} destDir Desktop AI緊急用
 */
export function buildMirrorLiteContent(root, spec) {
  const srcPath = path.join(root, spec.srcRel);
  const raw = fs.readFileSync(srcPath, 'utf8');
  const fullMirror = spec.fullMirrorDestName || path.basename(spec.destName).replace(/-LITE\.txt$/i, '.md');
  const body = sliceBodyLines(raw, spec.slice);
  return [...bannerLines(fullMirror, spec.headerNote), ...body].join('\n');
}

/**
 * @param {string} root
 * @param {string} destDir
 * @returns {string[]} 書き込んだ dest ファイル名
 */
export function syncMirrorLiteFiles(root, destDir) {
  const written = [];
  for (const spec of SESSION_DESKTOP_MIRROR_LITE_SPECS) {
    const srcPath = path.join(root, spec.srcRel);
    if (!fs.existsSync(srcPath)) {
      console.warn(`[mirror-lite] スキップ: 正本なし ${spec.srcRel}`);
      continue;
    }
    const content = buildMirrorLiteContent(root, spec);
    const dest = path.join(destDir, spec.destName);
    fs.writeFileSync(dest, content, 'utf8');
    written.push(spec.destName);
    console.log(`[sync-session-starter-to-desktop] OK ${spec.srcRel} -> ${dest}（LITE・${spec.slice} ${MIRROR_LITE_BODY_LINE_LIMIT}行）`);
  }
  return written;
}

/**
 * @param {string} root
 * @param {string} destDir
 * @param {{ srcRel: string; destName: string; slice: MirrorLiteSliceMode; headerNote: string }} spec
 */
export function verifyMirrorLiteFile(root, destDir, spec) {
  const srcPath = path.join(root, spec.srcRel);
  const destPath = path.join(destDir, spec.destName);
  if (!fs.existsSync(srcPath)) {
    return { ok: false, reason: `正本なし ${spec.srcRel}` };
  }
  if (!fs.existsSync(destPath)) {
    return { ok: false, reason: `Desktop に ${spec.destName} が無い` };
  }
  const expected = buildMirrorLiteContent(root, spec);
  const actual = fs.readFileSync(destPath, 'utf8');
  if (expected !== actual) {
    return { ok: false, reason: `${spec.destName} が生成内容と不一致（sync 再実行）` };
  }
  const size = Buffer.byteLength(actual, 'utf8');
  if (size > MIRROR_LITE_MAX_BYTES) {
    return {
      ok: false,
      reason: `${spec.destName} が ${size} bytes（上限 ${MIRROR_LITE_MAX_BYTES}）— 行数上限見直しか全文混入`,
    };
  }
  return { ok: true };
}

/** @returns {Set<string>} expected Desktop filenames */
export function mirrorLiteExpectedDestNames() {
  return new Set(SESSION_DESKTOP_MIRROR_LITE_SPECS.map((s) => s.destName));
}
