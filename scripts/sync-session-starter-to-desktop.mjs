#!/usr/bin/env node
/**
 * リポの儀式ファイルを Windows Desktop「AI緊急用」へコピーする。
 * NEW-SESSION-STARTER は **メンテ日入りファイル名**（JST `NEW-SESSION-STARTER_yyyymmdd.txt`、同日複数は `_2` 以降）で出力する。
 * 浜田運用ではここが毎回の参照先のため、儀式 MD を編集したターンで必ず実行する想定。
 * セッション切替時は `npm run verify:desktop-ai-emergency-sync` でバイト一致を機械確認する（`session:bootstrap` 内包）。
 * WSL で /mnt/c/... が見える環境でのみ実際に書き込む。無ければスキップ（exit 0）。
 *
 * 既定先: SESSION_STARTER_DESKTOP_DIR または
 *   /mnt/c/Users/mhamada202408224/Desktop/AI緊急用
 *
 * @see chat-sessions/NEW-SESSION-STARTER.md 冒頭
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getJstYyyymmdd, pickStarterWritePath } from './lib/session-starter-desktop.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destDir =
  process.env.SESSION_STARTER_DESKTOP_DIR ||
  '/mnt/c/Users/mhamada202408224/Desktop/AI緊急用';

const otherFiles = [
  ['chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md', 'SESSION-BOOTSTRAP-CHECKLIST.txt'],
  ['chat-sessions/HANDOFF-HUMAN.txt', 'HANDOFF-HUMAN.txt'],
];

function main() {
  if (!fs.existsSync(destDir)) {
    console.log(
      `[sync-session-starter-to-desktop] スキップ: 控えフォルダが無い (${destDir})\n` +
        '  WSL 以外、または /mnt/c 未マウント。浜田の参照先 AI緊急用は未更新のまま。' +
        ' /mnt/c 復帰後に npm run session-starter:sync-desktop を再実行すること。'
    );
    process.exit(0);
  }

  const starterSrc = path.join(root, 'chat-sessions/NEW-SESSION-STARTER.md');
  if (!fs.existsSync(starterSrc)) {
    console.warn('[sync-session-starter-to-desktop] スキップ: 元ファイルなし chat-sessions/NEW-SESSION-STARTER.md');
  } else {
    const srcBuf = fs.readFileSync(starterSrc);
    const dest = pickStarterWritePath(destDir, srcBuf);
    fs.copyFileSync(starterSrc, dest);
    const ymd = getJstYyyymmdd();
    console.log(
      `[sync-session-starter-to-desktop] OK chat-sessions/NEW-SESSION-STARTER.md -> ${dest} (JST メンテ日 ${ymd}、項番 -1 はこのファイル名を開いて全文貼付)`
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
  process.exit(0);
}

main();
