#!/usr/bin/env node
/**
 * 浜田 Desktop「AI緊急用」の .txt がリポ正本と一致するか検証する。
 * NEW-SESSION-STARTER: **当日 JST の 00-NEW-SESSION-STARTER_yyyymmdd.txt** のみ正とする（アーカイブ _2… は未検査）。
 * 成功時、**貼付推奨ファイル名**を 1 行で出す（項番 -1 / 案 D）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getJstYyyymmdd,
  recommendedStarterPasteFilename,
  starterCanonicalMatchesRepo,
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
  const ymd = getJstYyyymmdd();
  const pasteName = recommendedStarterPasteFilename(ymd);

  const starterSrc = path.join(root, 'chat-sessions/NEW-SESSION-STARTER.md');
  if (!fs.existsSync(starterSrc)) {
    console.warn('[verify-desktop-ai-emergency-sync] NG: リポ側なし chat-sessions/NEW-SESSION-STARTER.md');
    bad = true;
  } else {
    const a = fs.readFileSync(starterSrc);
    const r = starterCanonicalMatchesRepo(destDir, a, ymd);
    if (!r.ok) {
      console.warn(
        `[verify-desktop-ai-emergency-sync] NG: ${pasteName} が無いか正本と不一致 (${r.reason})\n` +
          '  先に: npm run session-starter:sync-desktop'
      );
      bad = true;
    } else {
      console.log(`[verify-desktop-ai-emergency-sync] OK ${pasteName} (NEW-SESSION-STARTER 正本一致)`);
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
  console.log(`[verify-desktop-ai-emergency-sync] 貼付推奨（項番-1）: ${pasteName}`);
  process.exit(0);
}

main();
