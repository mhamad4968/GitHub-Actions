/**
 * Desktop「AI緊急用」で期待する番号付きファイル名の集合（00〜30・歯抜けなし）。
 * @see scripts/sync-session-starter-to-desktop.mjs
 * @see scripts/verify-desktop-ai-emergency-sync.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { getJstYyyymmdd } from './session-starter-desktop.mjs';
import { SESSION_STARTER_PART_SYNC } from './session-starter-parts.mjs';
import { SESSION_DESKTOP_MIRROR_FILES } from './desktop-ai-emergency-session-docs.mjs';
import { mirrorLiteExpectedDestNames } from './desktop-ai-emergency-mirror-lite.mjs';

/** 夕反省レポートが無い日に Desktop へ置くプレースホルダ（read-pack 正本） */
export const EVENING_REFLECTION_SLOT_NAME = '26-evening-reflection-SLOT.txt';

const OTHER_DESKTOP_NAMES = [
  '07-HANDOFF-AI-FIVE-BLOCKS.md',
  '21-SESSION-BOOTSTRAP-CHECKLIST.txt',
  '22-HANDOFF-HUMAN.txt',
  '23-AI緊急用-README.txt',
];

/** @param {string} ymd 例 20260521 */
export function jstYmdToIso(ymd) {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

/**
 * 当日 sync 後に Desktop に存在すべき `NN-…` ファイル名（00 アーカイブ _2… は含めない）。
 * @param {string} root リポルート
 * @param {string} [ymd]
 * @returns {Set<string>}
 */
export function buildExpectedDesktopAiEmergencyFilenames(root, ymd = getJstYyyymmdd()) {
  const expected = new Set();
  expected.add(`00-NEW-SESSION-STARTER_${ymd}.txt`);
  for (const [, outName] of SESSION_STARTER_PART_SYNC) {
    expected.add(outName);
  }
  for (const name of OTHER_DESKTOP_NAMES) {
    expected.add(name);
  }
  for (const [, outName] of SESSION_DESKTOP_MIRROR_FILES) {
    expected.add(outName);
  }
  for (const liteName of mirrorLiteExpectedDestNames()) {
    expected.add(liteName);
  }

  const readPackDir = path.join(root, 'chat-sessions/desktop-ai-emergency-read-pack');
  if (fs.existsSync(readPackDir)) {
    for (const n of fs.readdirSync(readPackDir)) {
      if (!fs.statSync(path.join(readPackDir, n)).isFile()) continue;
      if (n.endsWith('.txt') || /^\d{2}-.+\.md$/i.test(n)) {
        if (n === EVENING_REFLECTION_SLOT_NAME) continue;
        expected.add(n);
      }
    }
  }

  const iso = jstYmdToIso(ymd);
  const eveningSrc = path.join(root, 'docs/reports', `${iso}-evening-reflection.md`);
  if (fs.existsSync(eveningSrc)) {
    expected.add(`26-evening-reflection-${iso}.md`);
  } else {
    expected.add(EVENING_REFLECTION_SLOT_NAME);
  }

  return expected;
}

/**
 * 期待外の `NN-…` を削除（文字化け複製・旧 .txt 重複等）。
 * @param {string} destDir
 * @param {Set<string>} expected
 * @returns {string[]}
 */
export function pruneUnexpectedNumberedDesktopFiles(destDir, expected) {
  const removed = [];
  if (!fs.existsSync(destDir)) return removed;
  for (const n of fs.readdirSync(destDir)) {
    if (!/^\d{2}-/.test(n)) continue;
    if (expected.has(n)) continue;
    if (/^00-NEW-SESSION-STARTER_\d{8}_\d+\.txt$/.test(n)) continue;
    const p = path.join(destDir, n);
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        fs.unlinkSync(p);
        removed.push(n);
      }
    } catch (e) {
      console.warn(`[desktop-ai-emergency] 期待外削除失敗 ${n}: ${e.message}`);
    }
  }
  return removed;
}

/**
 * Explorer 名前順で 00〜30 が揃っているか（26 は md または SLOT）。
 * @param {Set<string>} expected
 * @returns {{ ok: boolean, missing: number[] }}
 */
export function verifyDesktopNumberingContinuity(expected) {
  const prefixes = new Set();
  for (const n of expected) {
    const m = /^(\d{2})-/.exec(n);
    if (m) prefixes.add(Number(m[1], 10));
  }
  const missing = [];
  for (let i = 0; i <= 30; i += 1) {
    if (!prefixes.has(i)) missing.push(i);
  }
  return { ok: missing.length === 0, missing };
}
