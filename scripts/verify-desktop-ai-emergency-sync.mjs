#!/usr/bin/env node
/**
 * 浜田 Desktop「AI緊急用」の .txt がリポ正本（chat-sessions/*.md / .txt）と一致するか検証する。
 * @see scripts/sync-session-starter-to-desktop.mjs（同一マッピング）
 *
 * - 控えフォルダが無い（WSL 未マウント等）: exit 0（メッセージのみ。CI / 純 Linux でも壊さない）
 * - フォルダはあるが中身がリポと不一致: exit 2（先に `npm run session-starter:sync-desktop` を実行）
 *
 * セッション切替時は checkpoint-latest.md 項番 0 および `session:bootstrap` から呼ばれる想定。
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
  ['chat-sessions/HANDOFF-HUMAN.txt', 'HANDOFF-HUMAN.txt'],
];

function main() {
  if (process.env.SKIP_DESKTOP_AI_EMERGENCY_VERIFY === '1') {
    console.log('[verify-desktop-ai-emergency-sync] SKIP (SKIP_DESKTOP_AI_EMERGENCY_VERIFY=1)');
    process.exit(0);
  }

  if (!fs.existsSync(destDir)) {
    console.log(
      `[verify-desktop-ai-emergency-sync] SKIP: 控えフォルダなし (${destDir})\n` +
        '  セッション切替時: チャットに「AI緊急用は未照合（/mnt/c なし）」と 1 行。/mnt/c 復帰後に sync + 本スクリプトを再実行。'
    );
    process.exit(0);
  }

  let bad = false;
  for (const [rel, outName] of files) {
    const src = path.join(root, rel);
    const dest = path.join(destDir, outName);
    if (!fs.existsSync(src)) {
      console.warn(`[verify-desktop-ai-emergency-sync] NG: リポ側なし ${rel}`);
      bad = true;
      continue;
    }
    if (!fs.existsSync(dest)) {
      console.warn(`[verify-desktop-ai-emergency-sync] NG: Desktop に ${outName} が無い`);
      bad = true;
      continue;
    }
    const a = fs.readFileSync(src);
    const b = fs.readFileSync(dest);
    if (!a.equals(b)) {
      console.warn(
        `[verify-desktop-ai-emergency-sync] NG: 不一致 ${rel} ↔ ${dest}\n` +
          '  先に: npm run session-starter:sync-desktop'
      );
      bad = true;
    } else {
      console.log(`[verify-desktop-ai-emergency-sync] OK ${outName}`);
    }
  }

  if (bad) {
    process.exit(2);
  }
  console.log('[verify-desktop-ai-emergency-sync] ✅ 全ファイル一致（AI緊急用メンテ確認済）');
  process.exit(0);
}

main();
