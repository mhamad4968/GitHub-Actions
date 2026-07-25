#!/usr/bin/env node
/**
 * verify-ceo-minimum-baseline.mjs — CEO 最低基準ブロック欠落を検出
 *
 * - リポ正本: chat-sessions/CEO-MINIMUM-ABSOLUTE-BASELINE.txt
 * - read-pack: chat-sessions/desktop-ai-emergency-read-pack/18-重要確認.txt にも **ミラー各行**が含まれること
 * - Desktop `＃重要確認事項.txt` は 2026-06-30 廃止（存在時のみ同期検査・R-0630-02 GO）
 *
 * 終了: 0=OK / 2=NG（例外なし）
 *
 * 緊急のみ: SKIP_CEO_MINIMUM_BASELINE=1（CI では使わないこと）
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const mirrorPath = path.join(root, 'chat-sessions', 'CEO-MINIMUM-ABSOLUTE-BASELINE.txt');

/** ミラー改竄検知（ファイルが空化・要約化されても検出） */
const REQUIRED_ANCHORS = [
  '最低基準（絶対条件）例外はみとめない',
  '1. 報告違反ゼロ',
  '§1 先頭 4 行',
  '§M-2 V2 チェックシート 7 行',
  'hooks が機械検証',
  'cio:report-verify-response',
  '未経路の二重化',
  '依頼文に本ブロック全文が含まれる場合',
  'チャットに入っている＝読み飛ばし可',
  'IDE チャット',
  '2. CIO 体制で取り組む',
  'DeepSeek / Kimi / OpenRouter',
  '3. 2 名以上のチェック',
  'SPEC_TOUCHED: yes のターンで SECOND_REVIEWER',
  'none(reason=純メタ)',
  '適用範囲（CEO',
  '締め・GO 仰ぎ',
  '通常応答・通常報告',
];

function desktopCandidates() {
  const h = os.homedir();
  return [
    path.join(h, 'Desktop', '＃重要確認事項.txt'),
    'C:\\Users\\mhamada202408224\\Desktop\\＃重要確認事項.txt',
  ];
}

function readUtf8(p) {
  try {
    return fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
  } catch {
    return null;
  }
}

function main() {
  if (process.env.SKIP_CEO_MINIMUM_BASELINE === '1') {
    console.warn('[verify-ceo-minimum-baseline] SKIP_CEO_MINIMUM_BASELINE=1 — 検査を省略（本番・CI 非推奨）');
    process.exit(0);
  }

  const errors = [];

  if (!fs.existsSync(mirrorPath)) {
    errors.push(`ミラー欠落: ${mirrorPath}`);
    console.error(errors.join('\n'));
    process.exit(2);
  }

  const mirror = readUtf8(mirrorPath);
  if (!mirror || mirror.trim().length < 80) {
    errors.push('ミラー本文が異常に短い');
  }

  for (const a of REQUIRED_ANCHORS) {
    if (!mirror.includes(a)) {
      errors.push(`ミラーにアンカー欠落: ${a}`);
    }
  }

  const mirrorLines = mirror
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let desktopPath = null;
  let desktop = null;
  for (const p of desktopCandidates()) {
    if (fs.existsSync(p)) {
      desktopPath = p;
      desktop = readUtf8(p);
      break;
    }
  }

  if (desktopPath && desktop) {
    for (const line of mirrorLines) {
      if (!desktop.includes(line)) {
        errors.push(`Desktop にミラー行が無い（同期ずれ）: ${line.slice(0, 72)}${line.length > 72 ? '…' : ''}`);
      }
    }
    for (const a of REQUIRED_ANCHORS) {
      if (!desktop.includes(a)) {
        errors.push(`Desktop にアンカー欠落: ${a}`);
      }
    }
  } else {
    console.warn(
      '[verify-ceo-minimum-baseline] Desktop ＃重要確認事項.txt 不在 — ミラー＋アンカーのみ合格扱い（CI 想定）'
    );
  }

  const readPack18 = path.join(root, 'chat-sessions', 'desktop-ai-emergency-read-pack', '18-重要確認.txt');
  if (fs.existsSync(readPack18)) {
    const rp = readUtf8(readPack18);
    if (!rp) {
      errors.push('18-重要確認.txt が読めない');
    } else {
      for (const line of mirrorLines) {
        if (!rp.includes(line)) {
          errors.push(
            `read-pack 18-重要確認.txt に CEO ミラー行欠落: ${line.slice(0, 72)}${line.length > 72 ? '…' : ''}`
          );
        }
      }
    }
  } else {
    errors.push('read-pack 欠落: chat-sessions/desktop-ai-emergency-read-pack/18-重要確認.txt');
  }

  if (errors.length) {
    console.error('[verify-ceo-minimum-baseline] NG:\n' + errors.join('\n'));
    process.exit(2);
  }

  console.log(
    `[verify-ceo-minimum-baseline] OK mirror=${path.relative(root, mirrorPath)}` +
      (desktopPath ? ` desktop=${desktopPath}` : ' (desktop skipped)')
  );
  process.exit(0);
}

main();
