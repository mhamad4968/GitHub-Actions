#!/usr/bin/env node
/**
 * 浜田 Desktop「AI緊急用」の .txt がリポ正本（chat-sessions/*.md / .txt）と一致するか検証する。
 * NEW-SESSION-STARTER は `NEW-SESSION-STARTER_yyyymmdd.txt` または `_yyyymmdd_N.txt` のいずれかが正本と一致すれば OK。
 *
 * - 控えフォルダが無い（WSL 未マウント等）: exit 0（メッセージのみ。CI / 純 Linux でも壊さない）
 * - フォルダはあるが中身がリポと不一致: exit 2（先に `npm run session-starter:sync-desktop` を実行）
 *
 * セッション切替時は checkpoint-latest.md 項番 0 および `session:bootstrap` から呼ばれる想定。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { starterDesktopMatchesRepo } from './lib/session-starter-desktop.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destDir =
  process.env.SESSION_STARTER_DESKTOP_DIR ||
  '/mnt/c/Users/mhamada202408224/Desktop/AI緊急用';

const otherFiles = [
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

  const starterSrc = path.join(root, 'chat-sessions/NEW-SESSION-STARTER.md');
  if (!fs.existsSync(starterSrc)) {
    console.warn('[verify-desktop-ai-emergency-sync] NG: リポ側なし chat-sessions/NEW-SESSION-STARTER.md');
    bad = true;
  } else {
    const a = fs.readFileSync(starterSrc);
    const { ok, matched } = starterDesktopMatchesRepo(destDir, a);
    if (!ok) {
      console.warn(
        '[verify-desktop-ai-emergency-sync] NG: Desktop に NEW-SESSION-STARTER_yyyymmdd*.txt で正本と一致する控えが無い\n' +
          '  先に: npm run session-starter:sync-desktop'
      );
      bad = true;
    } else {
      for (const name of matched) {
        console.log(`[verify-desktop-ai-emergency-sync] OK ${name} (NEW-SESSION-STARTER 正本一致)`);
      }
    }
  }

  for (const [rel, outName] of otherFiles) {
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
