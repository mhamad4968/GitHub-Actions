#!/usr/bin/env node
/**
 * リポの儀式ファイルを Windows Desktop「AI緊急用」へコピーする。
 * NEW-SESSION-STARTER は **JST の 00-NEW-SESSION-STARTER_yyyymmdd.txt** に常に同期（内容変更時のみ旧版を _2… に退避）。
 * README.txt（正本 chat-sessions/AI緊急用-README.txt）も同期する。
 * `chat-sessions/desktop-ai-emergency-read-pack/*.txt`（番号付き貼付控え）も **同名で** Desktop へコピーする。
 *
 * @see chat-sessions/NEW-SESSION-STARTER.md 冒頭
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  pruneNonCanonicalStarterDesktopFiles,
  recommendedStarterPasteFilename,
  syncStarterToDesktopCanonical,
} from './lib/session-starter-desktop.mjs';

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
function syncReadPackToDesktop() {
  const readPackDir = path.join(root, readPackRelDir);
  if (!fs.existsSync(readPackDir)) {
    console.log(`[sync-session-starter-to-desktop] read-pack スキップ: フォルダなし ${readPackRelDir}`);
    return;
  }
  const names = fs
    .readdirSync(readPackDir)
    .filter((n) => n.endsWith('.txt'))
    .sort();
  for (const n of names) {
    const src = path.join(readPackDir, n);
    if (!fs.statSync(src).isFile()) continue;
    const dest = path.join(destDir, n);
    fs.copyFileSync(src, dest);
    console.log(`[sync-session-starter-to-desktop] OK ${readPackRelDir}/${n} -> ${dest}`);
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
  // `process.exit(0)` は使わない: stdout の末尾が欠け read-pack 同期ログが見えず、未コピーと誤認され得る（自然終了で flush）
  process.exitCode = 0;
}

main();
