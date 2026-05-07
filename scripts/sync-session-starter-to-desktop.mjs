#!/usr/bin/env node
/**
 * リポの儀式ファイルを Windows Desktop「AI緊急用」へコピーする。
 * NEW-SESSION-STARTER **ハブ**は **JST の 00-NEW-SESSION-STARTER_yyyymmdd.txt** に常に同期（内容変更時のみ旧版を _2… に退避）。
 * **分割 6 本**（`session-starter-parts/part-*.md`）は **`01`〜`06`-STARTER-…txt** へ同名バイト同期（**00 からの連番**、抜けなし）。
 * README（正本 `chat-sessions/AI緊急用-README.txt`）は Desktop **`19-AI緊急用-README.txt`** に同期。
 * `chat-sessions/desktop-ai-emergency-read-pack/*.txt`（番号付き貼付控え）も **同名で** Desktop へコピーする。
 * 同フォルダの **`NN-*.md`（先頭 2 桁が数字）** も **同名で** Desktop へコピーする（例: **`22-SESSION-ONE-REPORT-…md`**）。
 * **当日 JST** の `docs/reports/YYYY-MM-DD-evening-reflection.md` があれば **`24-evening-reflection-YYYY-MM-DD.md`** として Desktop へコピーする。
 * 同期の最後に **旧番号ファイル**（`00p01`〜、旧 read-pack `02`〜`19` 帯、旧 **`14-evening-…`** 等）を Desktop から削除する。
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

/** Desktop に残ると verify 混乱の原因になる旧ファイル名（2026-05-07 連番化以前） */
const LEGACY_DESKTOP_AI_EMERGENCY_FILES = [
  '00p01-STARTER-part-A-constitution.txt',
  '00p02-STARTER-part-B-ritual.txt',
  '00p03-STARTER-part-C-full-paste.txt',
  '00p04-STARTER-part-D-checklists.txt',
  '00p05-STARTER-part-E-incidents.txt',
  '00p06-STARTER-part-F-paths.txt',
  '01-HANDOFF-AI-FIVE-BLOCKS.md',
  '02-INDEX.txt',
  '03-READ-01.txt',
  '04-READ-02.txt',
  '05-READ-03.txt',
  '06-READ-04.txt',
  '07-READ-05.txt',
  '08-READ-06.txt',
  '09-READ-07.txt',
  '10-README-read-pack.txt',
  '11-SESSION-BOOTSTRAP-CHECKLIST.txt',
  '12-HANDOFF-HUMAN.txt',
  '13-README.txt',
  '15-HISTORY-2026-05-06-read-pack-and-tools.txt',
  '16-重要確認.txt',
  '18-SESSION-ONE-REPORT-2026-05-06.md',
  '19-SESSION-REPORT-CHECKLIST.txt',
];

const otherFiles = [
  ['chat-sessions/HANDOFF-AI-FIVE-BLOCKS.md', '07-HANDOFF-AI-FIVE-BLOCKS.md'],
  ['chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md', '17-SESSION-BOOTSTRAP-CHECKLIST.txt'],
  ['chat-sessions/HANDOFF-HUMAN.txt', '18-HANDOFF-HUMAN.txt'],
  ['chat-sessions/AI緊急用-README.txt', '19-AI緊急用-README.txt'],
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
  const destName = `24-evening-reflection-${iso}.md`;
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

/** @param {string} dir */
function pruneLegacyDesktopAiEmergency(dir) {
  for (const n of LEGACY_DESKTOP_AI_EMERGENCY_FILES) {
    const p = path.join(dir, n);
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        fs.unlinkSync(p);
        console.log(`[sync-session-starter-to-desktop] 旧番号削除: ${n}`);
      }
    } catch (e) {
      console.warn(`[sync-session-starter-to-desktop] 旧ファイル削除失敗 ${n}: ${e.message}`);
    }
  }
  try {
    for (const n of fs.readdirSync(dir)) {
      if (/^14-evening-reflection-.+\.md$/i.test(n)) {
        fs.unlinkSync(path.join(dir, n));
        console.log(`[sync-session-starter-to-desktop] 旧夕反省削除: ${n}`);
      }
    }
  } catch (_) {
    /* ignore */
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
  pruneLegacyDesktopAiEmergency(destDir);
  // `process.exit(0)` は使わない: stdout の末尾が欠け read-pack 同期ログが見えず、未コピーと誤認され得る（自然終了で flush）
  process.exitCode = 0;
}

main();
