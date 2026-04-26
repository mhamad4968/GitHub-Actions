#!/usr/bin/env node
/**
 * リポの儀式ファイルを Windows Desktop「AI緊急用」控えへコピーする。
 * WSL で /mnt/c/... が見える環境でのみ実際に書き込む。無ければスキップ（exit 0）。
 *
 * 既定先: SESSION_STARTER_DESKTOP_DIR または
 *   /mnt/c/Users/mhamada202408224/Desktop/AI緊急用
 *
 * @see chat-sessions/NEW-SESSION-STARTER.md 冒頭「控え」
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destDir =
  process.env.SESSION_STARTER_DESKTOP_DIR ||
  '/mnt/c/Users/mhamada202408224/Desktop/AI緊急用';

const files = [
  ['chat-sessions/NEW-SESSION-STARTER.md', 'NEW-SESSION-STARTER.txt'],
  ['chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md', 'SESSION-BOOTSTRAP-CHECKLIST.txt'],
];

function main() {
  if (!fs.existsSync(destDir)) {
    console.log(
      `[sync-session-starter-to-desktop] スキップ: 控えフォルダが無い (${destDir})\n` +
        '  WSL 以外、または /mnt/c 未マウント。リポ内 MD が正本。'
    );
    process.exit(0);
  }

  for (const [rel, outName] of files) {
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
