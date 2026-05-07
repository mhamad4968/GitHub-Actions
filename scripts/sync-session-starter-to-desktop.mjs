#!/usr/bin/env node
/**
 * リポの儀式ファイルを Windows Desktop「AI緊急用」へコピーする。
 * NEW-SESSION-STARTER **ハブ**は **JST の 00-NEW-SESSION-STARTER_yyyymmdd.txt** に常に同期（内容変更時のみ旧版を _2… に退避）。
 * **分割 6 本**（`session-starter-parts/part-*.md`）は **00p01〜00p06** の .txt へ同名バイト同期。
 * README.txt（正本 chat-sessions/AI緊急用-README.txt）も同期する。
 * `chat-sessions/desktop-ai-emergency-read-pack/*.txt`（番号付き貼付控え）も **同名で** Desktop へコピーする。
 * 同フォルダの **`NN-*.md`（N は数字 2 桁）** も **同名で** Desktop へコピーする（例: **一本報告** `18-SESSION-ONE-REPORT-2026-05-06.md`）。
 * **当日 JST** の `docs/reports/YYYY-MM-DD-evening-reflection.md` があれば **`14-evening-reflection-YYYY-MM-DD.md`** として Desktop へコピー（Windows から開きやすくする）。
 *
 * @see chat-sessions/NEW-SESSION-STARTER.md 冒頭
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getJstYyyymmdd,
  pruneNonCanonicalStarterDesktopFiles,
  recommendedStarterPasteFilename,
  syncStarterToDesktopCanonical,
} from './lib/session-starter-desktop.mjs';
import { SESSION_STARTER_PART_SYNC } from './lib/session-starter-parts.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destDir =
  process.env.SESSION_STARTER_DESKTOP_DIR ||
  '/mnt/c/Users/mhamada202408224/Desktop/AI緊急用';

const otherFiles = [
  ['chat-sessions/HANDOFF-AI-FIVE-BLOCKS.md', '01-HANDOFF-AI-FIVE-BLOCKS.md'],
  ['chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md', '11-SESSION-BOOTSTRAP-CHECKLIST.txt'],
  ['chat-sessions/HANDOFF-HUMAN.txt', '12-HANDOFF-HUMAN.txt'],
  ['chat-sessions/AI緊急用-README.txt', '13-README.txt'],
];

const readPackRelDir = 'chat-sessions/desktop-ai-emergency-read-pack';

/** read-pack の *.txt（ファイル名先頭 2 桁＝Explorer での読取順）を Desktop へ同名コピー */
/** @param {string} ymd 例 20260505 */
function copyReadPackFileToDesktop(readPackDir, name) {
  const src = path.join(readPackDir, name);
  if (!fs.statSync(src).isFile()) return;
  const dest = path.join(destDir, name);
  fs.copyFileSync(src, dest);
  console.log(`[sync-session-starter-to-desktop] OK ${readPackRelDir}/${name} -> ${dest}`);
}

/** @param {string} ymd 例 20260505 */
function jstYmdToIso(ymd) {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

/** 当日の夕反省レポートを Desktop へ（存在時のみ） */
function syncEveningReflectionToDesktop() {
  const ymd = getJstYyyymmdd();
  const iso = jstYmdToIso(ymd);
  const src = path.join(root, 'docs/reports', `${iso}-evening-reflection.md`);
  if (!fs.existsSync(src)) {
    console.log(
      `[sync-session-starter-to-desktop] 夕反省レポートなし（スキップ）: docs/reports/${iso}-evening-reflection.md`
    );
    return;
  }
  const destName = `14-evening-reflection-${iso}.md`;
  const dest = path.join(destDir, destName);
  fs.copyFileSync(src, dest);
  console.log(`[sync-session-starter-to-desktop] OK docs/reports/${iso}-evening-reflection.md -> ${dest}`);
  console.log(
    `[sync-session-starter-to-desktop] Windows: C:\\Users\\mhamada202408224\\Desktop\\AI緊急用\\${destName}`
  );
}

function syncReadPackToDesktop() {
  const readPackDir = path.join(root, readPackRelDir);
  if (!fs.existsSync(readPackDir)) {
    console.log(`[sync-session-starter-to-desktop] read-pack スキップ: フォルダなし ${readPackRelDir}`);
    return;
  }
  const txtNames = fs.readdirSync(readPackDir).filter((n) => n.endsWith('.txt')).sort();
  for (const n of txtNames) {
    copyReadPackFileToDesktop(readPackDir, n);
  }
  const mdNames = fs
    .readdirSync(readPackDir)
    .filter((n) => /^\d{2}-.+\.md$/.test(n))
    .sort();
  for (const n of mdNames) {
    copyReadPackFileToDesktop(readPackDir, n);
  }
}

function main() {
  if (!fs.existsSync(destDir)) {
    console.log(
      `[sync-session-starter-to-desktop] スキップ: 控えフォルダが無い (${destDir})\n` +
        '  WSL 以外、または /mnt/c 未マウント。浜田の参照先 AI緊急用は未更新のまま。' +
        ' /mnt/c 復帰後に npm run session-starter:sync-desktop を再実行すること。'
    );
    process.exitCode = 0;
    return;
  }

  const starterSrc = path.join(root, 'chat-sessions/NEW-SESSION-STARTER.md');
  if (!fs.existsSync(starterSrc)) {
    console.warn('[sync-session-starter-to-desktop] スキップ: 元ファイルなし chat-sessions/NEW-SESSION-STARTER.md');
  } else {
    const { basePath, archived, ymd } = syncStarterToDesktopCanonical(destDir, starterSrc);
    const paste = recommendedStarterPasteFilename(ymd);
    console.log(`[sync-session-starter-to-desktop] OK chat-sessions/NEW-SESSION-STARTER.md -> ${basePath}`);
    if (archived) {
      console.log(`[sync-session-starter-to-desktop] アーカイブ退避: -> ${path.join(destDir, archived)}`);
    }
    const pruned = pruneNonCanonicalStarterDesktopFiles(destDir, ymd);
    for (const n of pruned) {
      console.log(`[sync-session-starter-to-desktop] 旧ファイル削除: ${n}`);
    }
    console.log(
      `[sync-session-starter-to-desktop] 貼付推奨（項番-1）: ${paste}（Windows: C:\\Users\\mhamada202408224\\Desktop\\AI緊急用\\${paste}）`
    );
  }

  for (const [rel, outName] of SESSION_STARTER_PART_SYNC) {
    const src = path.join(root, rel);
    if (!fs.existsSync(src)) {
      console.warn(`[sync-session-starter-to-desktop] スキップ: 分割パートなし ${rel}`);
      continue;
    }
    const dest = path.join(destDir, outName);
    fs.copyFileSync(src, dest);
    console.log(`[sync-session-starter-to-desktop] OK ${rel} -> ${dest}`);
  }

  for (const [rel, outName] of otherFiles) {
    const src = path.join(root, rel);
    if (!fs.existsSync(src)) {
      console.warn(`[sync-session-starter-to-desktop] スキップ: 元ファイルなし ${rel}`);
      continue;
    }
    const dest = path.join(destDir, outName);
    fs.copyFileSync(src, dest);
    console.log(`[sync-session-starter-to-desktop] OK ${rel} -> ${dest}`);
  }
  syncReadPackToDesktop();
  syncEveningReflectionToDesktop();
  // `process.exit(0)` は使わない: stdout の末尾が欠け read-pack 同期ログが見えず、未コピーと誤認され得る（自然終了で flush）
  process.exitCode = 0;
}

main();
