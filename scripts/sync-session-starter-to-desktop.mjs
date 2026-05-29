#!/usr/bin/env node
/**
 * リポの儀式ファイルを Windows Desktop「AI緊急用」へコピーする。
 * NEW-SESSION-STARTER **ハブ**は **JST の 00-NEW-SESSION-STARTER_yyyymmdd.txt** に常に同期（内容変更時のみ旧版を _2… に退避）。
 * **分割 6 本**（`session-starter-parts/part-*.md`）は **`01`〜`06`-STARTER-…txt** へ同名バイト同期（**00 からの連番**、抜けなし）。
 * README（正本 `chat-sessions/AI緊急用-README.txt`）は Desktop **`23-AI緊急用-README.txt`** に同期。
 * `chat-sessions/desktop-ai-emergency-read-pack/*.txt`（番号付き貼付控え）も **同名で** Desktop へコピーする。
 * 同フォルダの **`NN-*.md`（先頭 2 桁が数字）** も **同名で** Desktop へコピーする（例: **`19-SESSION-ONE-REPORT-…md`**）。
 * **`SESSION_DESKTOP_MIRROR_FILES`**（`handoff-log.md`→**`24-handoff-log.md`**、`checkpoint-latest.md`→**`25-checkpoint-latest.md`**）も Desktop へコピーする。
 * **26**: 当日夕反省 `docs/reports/YYYY-MM-DD-evening-reflection.md` があれば **`26-evening-reflection-YYYY-MM-DD.md`**。無い日は **`26-evening-reflection-SLOT.txt`**（read-pack 正本）で **25→27 の歯抜けを防ぐ**。
 * 同期の最後に **旧番号ファイル**（`00p01`〜、旧 read-pack `02`〜`19` 帯、旧 **`14-evening-…`** 等）を Desktop から削除する。
 *
 * @see chat-sessions/NEW-SESSION-STARTER.md 冒頭
 * @see scripts/lib/session-starter-desktop-dir.mjs（Desktop 同期先の解決・Windows ネイティブ対応）
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
import { SESSION_DESKTOP_MIRROR_FILES } from './lib/desktop-ai-emergency-session-docs.mjs';
import { resolveSessionStarterDesktopDir } from './lib/session-starter-desktop-dir.mjs';
import {
  EVENING_REFLECTION_SLOT_NAME,
  buildExpectedDesktopAiEmergencyFilenames,
  jstYmdToIso,
  pruneUnexpectedNumberedDesktopFiles,
} from './lib/desktop-ai-emergency-expected-files.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** `main()` で解決後にセット（ヘルパーが参照） */
let destDir = '';

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
  '17-SESSION-BOOTSTRAP-CHECKLIST.txt',
  '18-HANDOFF-HUMAN.txt',
  '19-AI緊急用-README.txt',
  '20-HISTORY-2026-05-06-read-pack-and-tools.txt',
  '21-重要確認.txt',
  '22-SESSION-ONE-REPORT-2026-05-06.md',
  '23-SESSION-REPORT-CHECKLIST.txt',
  '15-HISTORY-2026-05-06-read-pack-and-tools.txt',
  '16-重要確認.txt',
  '18-SESSION-ONE-REPORT-2026-05-06.md',
  '19-SESSION-REPORT-CHECKLIST.txt',
  '19-SESSION-ONE-REPORT-2026-05-19.txt',
  '19-SESSION-ONE-REPORT-2026-05-19.md',
  '25-handoff-log.md',
  '26-checkpoint-latest.md',
];

const otherFiles = [
  ['chat-sessions/HANDOFF-AI-FIVE-BLOCKS.md', '07-HANDOFF-AI-FIVE-BLOCKS.md'],
  ['chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md', '21-SESSION-BOOTSTRAP-CHECKLIST.txt'],
  ['chat-sessions/HANDOFF-HUMAN.txt', '22-HANDOFF-HUMAN.txt'],
  ['chat-sessions/AI緊急用-README.txt', '23-AI緊急用-README.txt'],
  ...SESSION_DESKTOP_MIRROR_FILES,
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

/** 26 番: 夕反省 md または SLOT プレースホルダ（歯抜けなし） */
function eveningReflectionReadPackMd(iso) {
  return path.join(root, readPackRelDir, `26-evening-reflection-${iso}.md`);
}

function hasTodayEveningReflection(iso) {
  const docs = path.join(root, 'docs/reports', `${iso}-evening-reflection.md`);
  return fs.existsSync(docs) || fs.existsSync(eveningReflectionReadPackMd(iso));
}

function syncEveningReflectionToDesktop() {
  const ymd = getJstYyyymmdd();
  const iso = jstYmdToIso(ymd);
  const eveningSrc = path.join(root, 'docs/reports', `${iso}-evening-reflection.md`);
  const readPackEvening = eveningReflectionReadPackMd(iso);
  const slotSrc = path.join(root, readPackRelDir, EVENING_REFLECTION_SLOT_NAME);
  const destName = `26-evening-reflection-${iso}.md`;
  const dest = path.join(destDir, destName);
  if (fs.existsSync(eveningSrc)) {
    fs.copyFileSync(eveningSrc, dest);
    console.log(`[sync-session-starter-to-desktop] OK docs/reports/${iso}-evening-reflection.md -> ${dest}`);
  } else if (fs.existsSync(readPackEvening)) {
    fs.copyFileSync(readPackEvening, dest);
    console.log(`[sync-session-starter-to-desktop] OK ${readPackRelDir}/${destName} -> ${dest}`);
  } else if (fs.existsSync(slotSrc)) {
    const slotDest = path.join(destDir, EVENING_REFLECTION_SLOT_NAME);
    fs.copyFileSync(slotSrc, slotDest);
    console.log(
      `[sync-session-starter-to-desktop] OK ${readPackRelDir}/${EVENING_REFLECTION_SLOT_NAME} -> ${slotDest}（夕反省未作成日）`
    );
    return;
  } else {
    console.warn(
      `[sync-session-starter-to-desktop] 夕反省 SLOT 正本なし: ${readPackRelDir}/${EVENING_REFLECTION_SLOT_NAME}`
    );
    return;
  }
  const slotDest = path.join(destDir, EVENING_REFLECTION_SLOT_NAME);
  if (fs.existsSync(slotDest)) {
    fs.unlinkSync(slotDest);
    console.log(`[sync-session-starter-to-desktop] 夕反省ありのため SLOT 削除: ${EVENING_REFLECTION_SLOT_NAME}`);
  }
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
      if (/^24-evening-reflection-.+\.md$/i.test(n)) {
        fs.unlinkSync(path.join(dir, n));
        console.log(`[sync-session-starter-to-desktop] 旧夕反省番号削除(24→26): ${n}`);
      }
    }
    pruneStaleEveningReflectionOnDesktop(dir);
  } catch (_) {
    /* ignore */
  }
}

/** 26 番: 当日以外の夕反省 md を削除。夕反省なし日は md を全削除（SLOT は sync が配置）。 */
function pruneStaleEveningReflectionOnDesktop(dir) {
  const ymd = getJstYyyymmdd();
  const iso = jstYmdToIso(ymd);
  const keepMd = `26-evening-reflection-${iso}.md`;
  const hasToday = hasTodayEveningReflection(iso);
  try {
    for (const n of fs.readdirSync(dir)) {
      if (/^26-evening-reflection-.+\.md$/i.test(n)) {
        if (!hasToday || n !== keepMd) {
          fs.unlinkSync(path.join(dir, n));
          console.log(`[sync-session-starter-to-desktop] 旧夕反省 md 削除: ${n}`);
        }
      }
    }
  } catch (e) {
    console.warn(`[sync-session-starter-to-desktop] 夕反省 prune 失敗: ${e.message}`);
  }
}

function main() {
  let destDirExists;
  let destDirSource;
  let destDirTried;
  try {
    const r = resolveSessionStarterDesktopDir();
    destDir = r.dir;
    destDirExists = r.exists;
    destDirSource = r.source;
    destDirTried = r.tried;
  } catch (e) {
    console.error(`[sync-session-starter-to-desktop] 同期先解決エラー: ${e.message}`);
    process.exitCode = 2;
    return;
  }
  if (!destDirExists) {
    const srcHint =
      destDirSource === 'env'
        ? 'SESSION_STARTER_DESKTOP_DIR を指すフォルダを作成するか、正しい絶対パスに修正してください。'
        : 'Windows では %USERPROFILE%\\Desktop\\AI緊急用（または OneDrive\\Desktop・Public\\Desktop）を作成するか、SESSION_STARTER_DESKTOP_DIR で明示してください。';
    console.log(
      `[sync-session-starter-to-desktop] スキップ: 控えフォルダが無い (${destDir})\n` +
        `  解決元: ${destDirSource === 'env' ? 'SESSION_STARTER_DESKTOP_DIR' : '既定候補の列挙'}\n` +
        `  試行パス:\n${destDirTried.map((p) => `    - ${p}`).join('\n')}\n` +
        `  ${srcHint}`
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
    console.log(`[sync-session-starter-to-desktop] 貼付推奨（項番-1）: ${paste}（フルパス: ${path.join(destDir, paste)}）`);
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
  const expected = buildExpectedDesktopAiEmergencyFilenames(root);
  for (const n of pruneUnexpectedNumberedDesktopFiles(destDir, expected)) {
    console.log(`[sync-session-starter-to-desktop] 期待外番号ファイル削除: ${n}`);
  }
  // `process.exit(0)` は使わない: stdout の末尾が欠け read-pack 同期ログが見えず、未コピーと誤認され得る（自然終了で flush）
  process.exitCode = 0;
}

main();
