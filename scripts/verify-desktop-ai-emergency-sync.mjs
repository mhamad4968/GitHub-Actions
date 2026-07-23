#!/usr/bin/env node
/**
 * 浜田 Desktop「AI緊急用」の控えがリポ正本と一致するか検証する。
 * NEW-SESSION-STARTER ハブ: **当日 JST の 00-NEW-SESSION-STARTER_yyyymmdd.txt**（アーカイブ _2… は未検査）。
 * 分割 6 本: **`01`〜`06`-STARTER-…txt** をリポ `session-starter-parts/*.md` とバイト一致検査。
 * **`chat-sessions/desktop-ai-emergency-read-pack/`** の **`.txt` と `NN-*.md`** も Desktop 同名とバイト一致検査。
 * 成功時、**貼付推奨ファイル名**を 1 行で出す（項番 -1 / 案 D）。
 * **`24-handoff-log.md` / `25-checkpoint-latest.md`** … リポ `chat-sessions/` 正本とバイト一致（**AI 同期専用・メモ帳非推奨**）。
 * **`34-handoff-log-LITE.txt` / `35-checkpoint-latest-LITE.txt`** … 浜田用要約（生成内容一致）。
 *
 * @see scripts/lib/session-starter-desktop-dir.mjs（同期先パス解決）
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getJstYyyymmdd,
  recommendedStarterPasteFilename,
  starterCanonicalMatchesRepo,
} from './lib/session-starter-desktop.mjs';
import { SESSION_STARTER_PART_SYNC } from './lib/session-starter-parts.mjs';
import { SESSION_DESKTOP_MIRROR_FILES } from './lib/desktop-ai-emergency-session-docs.mjs';
import {
  SESSION_DESKTOP_MIRROR_LITE_SPECS,
  verifyMirrorLiteFile,
} from './lib/desktop-ai-emergency-mirror-lite.mjs';
import { resolveSessionStarterDesktopDir } from './lib/session-starter-desktop-dir.mjs';
import {
  EVENING_REFLECTION_SLOT_NAME,
  buildExpectedDesktopAiEmergencyFilenames,
  isReadPackFileSyncedToDesktop,
  verifyDesktopNumberingContinuity,
} from './lib/desktop-ai-emergency-expected-files.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const otherFiles = [
  ['chat-sessions/HANDOFF-AI-FIVE-BLOCKS.md', '07-HANDOFF-AI-FIVE-BLOCKS.md'],
  ['chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md', '21-SESSION-BOOTSTRAP-CHECKLIST.txt'],
  ['chat-sessions/HANDOFF-HUMAN.txt', '22-HANDOFF-HUMAN.txt'],
  ['chat-sessions/AI緊急用-README.txt', '23-AI緊急用-README.txt'],
  ...SESSION_DESKTOP_MIRROR_FILES,
];

function main() {
  if (process.env.SKIP_DESKTOP_AI_EMERGENCY_VERIFY === '1') {
    console.log('[verify-desktop-ai-emergency-sync] SKIP (SKIP_DESKTOP_AI_EMERGENCY_VERIFY=1)');
    process.exit(0);
  }

  let destDir;
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
    console.error(`[verify-desktop-ai-emergency-sync] 同期先解決エラー: ${e.message}`);
    process.exit(2);
  }
  if (!destDirExists) {
    console.log(
      `[verify-desktop-ai-emergency-sync] SKIP: 控えフォルダなし (${destDir})\n` +
        `  解決元: ${destDirSource === 'env' ? 'SESSION_STARTER_DESKTOP_DIR' : '既定候補'}\n` +
        `  試行パス:\n${destDirTried.map((p) => `    - ${p}`).join('\n')}\n` +
        '  セッション切替時: チャットに「AI緊急用は未照合（Desktop 同期先なし）」と 1 行。フォルダ作成または SESSION_STARTER_DESKTOP_DIR 設定後に sync + 本スクリプトを再実行。'
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

  const isoEvening = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
  const eveningSrc = path.join(root, 'docs/reports', `${isoEvening}-evening-reflection.md`);
  const eveningDestName = `26-evening-reflection-${isoEvening}.md`;
  const eveningDest = path.join(destDir, eveningDestName);
  const eveningSlotDest = path.join(destDir, EVENING_REFLECTION_SLOT_NAME);
  if (fs.existsSync(eveningSrc)) {
    if (!fs.existsSync(eveningDest)) {
      console.warn(
        `[verify-desktop-ai-emergency-sync] NG: Desktop に ${eveningDestName} が無い（夕反省レポートはリポに存在）\n` +
          '  先に: npm run session-starter:sync-desktop'
      );
      bad = true;
    } else {
      const a = fs.readFileSync(eveningSrc);
      const b = fs.readFileSync(eveningDest);
      if (!a.equals(b)) {
        console.warn(
          `[verify-desktop-ai-emergency-sync] NG: 不一致 docs/reports/${isoEvening}-evening-reflection.md ↔ ${eveningDestName}\n` +
            '  先に: npm run session-starter:sync-desktop'
        );
        bad = true;
      } else {
        console.log(`[verify-desktop-ai-emergency-sync] OK ${eveningDestName}（夕反省レポート一致）`);
      }
    }
    if (fs.existsSync(eveningSlotDest)) {
      console.warn(
        `[verify-desktop-ai-emergency-sync] NG: 夕反省ありなのに ${EVENING_REFLECTION_SLOT_NAME} が残っている\n` +
          '  先に: npm run session-starter:sync-desktop'
      );
      bad = true;
    }
  } else {
    const slotSrc = path.join(root, 'chat-sessions/desktop-ai-emergency-read-pack', EVENING_REFLECTION_SLOT_NAME);
    if (!fs.existsSync(slotSrc)) {
      console.warn(`[verify-desktop-ai-emergency-sync] NG: リポ側なし read-pack/${EVENING_REFLECTION_SLOT_NAME}`);
      bad = true;
    } else if (!fs.existsSync(eveningSlotDest)) {
      console.warn(
        `[verify-desktop-ai-emergency-sync] NG: Desktop に ${EVENING_REFLECTION_SLOT_NAME} が無い（26 番プレースホルダ）\n` +
          '  先に: npm run session-starter:sync-desktop'
      );
      bad = true;
    } else {
      const a = fs.readFileSync(slotSrc);
      const b = fs.readFileSync(eveningSlotDest);
      if (!a.equals(b)) {
        console.warn(
          `[verify-desktop-ai-emergency-sync] NG: 不一致 read-pack/${EVENING_REFLECTION_SLOT_NAME}\n` +
            '  先に: npm run session-starter:sync-desktop'
        );
        bad = true;
      } else {
        console.log(`[verify-desktop-ai-emergency-sync] OK ${EVENING_REFLECTION_SLOT_NAME}（夕反省未作成日・26 番）`);
      }
    }
  }

  for (const [rel, outName] of SESSION_STARTER_PART_SYNC) {
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
        `[verify-desktop-ai-emergency-sync] NG: 不一致 ${rel} ↔ ${outName}\n` +
          '  先に: npm run session-starter:sync-desktop'
      );
      bad = true;
    } else {
      console.log(`[verify-desktop-ai-emergency-sync] OK ${outName}`);
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

  for (const spec of SESSION_DESKTOP_MIRROR_LITE_SPECS) {
    const r = verifyMirrorLiteFile(root, destDir, spec);
    if (!r.ok) {
      console.warn(`[verify-desktop-ai-emergency-sync] NG: ${r.reason}\n  先に: npm run session-starter:sync-desktop`);
      bad = true;
    } else {
      console.log(`[verify-desktop-ai-emergency-sync] OK ${spec.destName}（浜田用 LITE 要約）`);
    }
  }

  /** `sync-session-starter-to-desktop.mjs` がコピーする read-pack とバイト一致（抜け・ズレ検知） */
  const readPackRelDir = 'chat-sessions/desktop-ai-emergency-read-pack';
  const readPackDir = path.join(root, readPackRelDir);
  if (fs.existsSync(readPackDir)) {
    // 26 SLOT / 過去日 dated md は evening 節で検査（Desktop は当日 26 のみ）
    const names = fs
      .readdirSync(readPackDir)
      .filter((n) => isReadPackFileSyncedToDesktop(n))
      .sort();
    for (const outName of names) {
      const src = path.join(readPackDir, outName);
      if (!fs.statSync(src).isFile()) continue;
      const dest = path.join(destDir, outName);
      if (!fs.existsSync(dest)) {
        console.warn(
          `[verify-desktop-ai-emergency-sync] NG: Desktop に ${outName} が無い（read-pack 同期漏れ）\n` +
            '  先に: npm run session-starter:sync-desktop'
        );
        bad = true;
        continue;
      }
      const a = fs.readFileSync(src);
      const b = fs.readFileSync(dest);
      if (!a.equals(b)) {
        console.warn(
          `[verify-desktop-ai-emergency-sync] NG: 不一致 ${readPackRelDir}/${outName} ↔ Desktop/${outName}\n` +
            '  先に: npm run session-starter:sync-desktop'
        );
        bad = true;
      } else {
        console.log(`[verify-desktop-ai-emergency-sync] OK read-pack ${outName}`);
      }
    }
  }

  const expected = buildExpectedDesktopAiEmergencyFilenames(root, ymd);
  const numbering = verifyDesktopNumberingContinuity(expected);
  if (!numbering.ok) {
    console.warn(
      `[verify-desktop-ai-emergency-sync] NG: 番号歯抜け 00〜36（欠番: ${numbering.missing.join(', ')}）\n` +
        '  先に: read-pack / sync を整備して session-starter:sync-desktop'
    );
    bad = true;
  } else {
    console.log('[verify-desktop-ai-emergency-sync] OK 番号 00〜36 連続（26=夕反省、28=ジャンル早見、31–33=METAチャーター、34–35=LITE、36=依頼compose）');
  }

  if (bad) {
    process.exit(2);
  }

  // タスクC — 方式B ゾンビ文書（Desktop 同期後の正本整合）
  const zombieScript = path.join(root, 'scripts/verify-mode-b-zombie-docs.mjs');
  if (fs.existsSync(zombieScript)) {
    const z = spawnSync(process.execPath, [zombieScript], { cwd: root, encoding: 'utf8' });
    if (z.status !== 0) {
      console.warn(z.stdout || z.stderr || '[verify-desktop-ai-emergency-sync] mode-b zombie NG');
      process.exit(2);
    }
    console.log('[verify-desktop-ai-emergency-sync] OK verify:mode-b-zombie-docs');
  }

  console.log('[verify-desktop-ai-emergency-sync] ✅ 全ファイル一致（AI緊急用メンテ確認済）');
  console.log(`[verify-desktop-ai-emergency-sync] 貼付推奨（項番-1）: ${pasteName}`);
  process.exit(0);
}

main();
