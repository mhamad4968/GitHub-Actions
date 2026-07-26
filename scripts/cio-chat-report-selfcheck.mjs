#!/usr/bin/env node
/**
 * cio-chat-report-selfcheck.mjs — IDE 外・hooks 非経路でも回せる報告体裁ガード（CEO 2026-05-09 追補）
 *
 * 背景: Cursor チャットには hooks が届かない経路がある。報告確定前に本スクリプトで禁止語と
 * （任意）§1 先頭4行・V2 七行の有無を機械チェックし、IDE 自動判定と二重化する。
 *
 * Usage:
 *   **推奨（Run 承認 UI 最小化）**: `npm run cio:selfcheck:test`（パイプなし・内部で stdin 付与）／下書き検証は **`npm run cio:chat-report-selfcheck -- --file path/to/draft.md`**。
 *   非推奨: PowerShell の `"…" | node … --stdin`（行先頭が `"` になり `terminalAllowlist` の `node` プレフィックスに合致せず **Run** が出やすい）。
 *
 * Options:
 *   --strict-head          先頭 6500 文字に §1 四行（ティア・【適用憲法】・🎖️本セッション割当・[ルール確認]）必須
 *   --require-v2           本文に V2 チェックシート（VERSION:2 + OK:yes）必須
 *   --require-ceo-block    `CEO-MINIMUM-ABSOLUTE-BASELINE.txt` の非空行すべてが本文に含まれること（hooks の detectCeoMinimumBlock と同旨）
 *   --require-a1           §P □A1＋`ダブルチェック（誰`＋`ダブルチェック要約:`（report-checksheet-validate と同旨の最小検査）
 *   --check-medal-line     🎖️ 行が last-tier lane と不一致なら NG（exit 1）— #S-REPORT-01
 *                          lane 自動チェックのみのときは従来どおり WARN（exit 0）
 *
 * last-tier=strict 時は Goal/Touch/SPEC_TOUCHED 3 行を自動必須（D-1）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLastTier, expectedMedalLine } from './lib/cio-turn-start-tier.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TURN_HEAD_WINDOW = 6500;

const BAN = [
  {
    re: /心身の健康/,
    msg:
      '禁止: 「心身の健康」— 報告の「健康」は `npm run health-check`（scripts/health-check.mjs）の事実サマリに置換。人間の睡眠・水分・就寝一般論だけを健康節にしない。',
  },
  {
    re: /TSB-001[^\n]{0,60}心身|心身[^\n]{0,60}TSB-001/i,
    msg:
      '禁止: TSB-001（docs/troubleshooting.md の fileKey 孤児ラベル）と「心身」表記の併記 — 誤誘導のため削除し、用語正本（15-READ-07 §5・session-report-checklist）に従う。',
  },
];

function readAllInput(argv) {
  if (argv.includes('--stdin')) {
    return fs.readFileSync(0, 'utf8');
  }
  const i = argv.indexOf('--file');
  if (i !== -1 && argv[i + 1]) {
    const p = path.isAbsolute(argv[i + 1]) ? argv[i + 1] : path.join(root, argv[i + 1]);
    return fs.readFileSync(p, 'utf8');
  }
  return null;
}

function strictTurnHeadOk(text) {
  const head = String(text || '').slice(0, TURN_HEAD_WINDOW);
  const missing = [];
  if (!/\[\s*§1-2-3\s*ティア判定\s*:/.test(head)) missing.push('TIER_LINE');
  if (!/【\s*適用憲法\s*】/.test(head)) missing.push('CONSTITUTION_LINE');
  if (!/\[\s*\u{1F396}\uFE0F?\s*本セッション割当\s*\]/u.test(head)) missing.push('ASSIGN_LINE');
  if (!/\[ルール確認\]/.test(head)) missing.push('RULES_CONFIRM_LINE');
  return { ok: missing.length === 0, missing };
}

function requireV2Ok(text) {
  const t = String(text || '');
  const v2 =
    /【セッション報告チェックシート】[\s\S]*?CHECKSHEET_VERSION:\s*2[\s\S]*?CHECKSHEET_OK:\s*yes/i;
  return v2.test(t);
}

const ceoBaselinePath = path.join(root, 'chat-sessions', 'CEO-MINIMUM-ABSOLUTE-BASELINE.txt');

/** @returns {{ ok: boolean, missing: string[] }} */
function requireCeoBlockOk(text) {
  const t = String(text || '');
  if (!fs.existsSync(ceoBaselinePath)) {
    return { ok: false, missing: [`CEO file missing: ${ceoBaselinePath}`] };
  }
  const raw = (fs.readFileSync(ceoBaselinePath, 'utf8') || '').replace(/^\uFEFF/, '');
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const missing = [];
  for (const line of lines) {
    if (!t.includes(line)) missing.push(line.length > 80 ? `${line.slice(0, 80)}…` : line);
  }
  return { ok: missing.length === 0, missing };
}

/** report-checksheet-validate.mjs detectDoubleCheckAttribution と同条件 */
function requireA1Ok(text) {
  const t = String(text || '');
  if (!/□\s*A1\b/i.test(t)) return false;
  if (!/ダブルチェック\s*[（(]\s*誰/i.test(t)) return false;
  const m = t.match(/ダブルチェック要約\s*:\s*([^\n\r]+)/i);
  if (!m) return false;
  const summary = (m[1] || '').trim();
  if (summary.length < 6) return false;
  return /(DeepSeek|Kimi|OpenRouter|両名|第2者|無\s*[（(]|非該当|スキップ理由|§50-3-8|着手前ダブルチェック|検証締めダブルチェック)/i.test(
    summary
  );
}

function requireTurnContractOk(text) {
  const t = String(text || '');
  const missing = [];
  if (!/^Goal:\s*.+/m.test(t)) missing.push('Goal');
  if (!/^Touch:\s*.+/m.test(t)) missing.push('Touch');
  if (!/^SPEC_TOUCHED:\s*(yes|no)/im.test(t)) missing.push('SPEC_TOUCHED');
  return { ok: missing.length === 0, missing };
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help')) {
    console.error(`cio-chat-report-selfcheck — 報告下書きの禁止語・§1/V2／CEO 全文／□A1 検査

  Get-Content draft.md -Raw | node scripts/cio-chat-report-selfcheck.mjs --stdin
  node scripts/cio-chat-report-selfcheck.mjs --file draft.md

  報告・締め・GO 前の一発ゲート（package.json の cio:report-verify-response と同フラグ）:
    npm run cio:report-verify-response -- --file draft.md

  Options:
    --strict-head --require-v2 --require-ceo-block --require-a1
`);
    process.exit(0);
  }

  if (argv.length === 0) {
    console.error('[cio-chat-report-selfcheck] 引数が空です。--help または --file / --stdin を指定');
    process.exit(1);
  }

  const body = readAllInput(argv);
  if (body === null) {
    console.error('[cio-chat-report-selfcheck] need --stdin or --file <path>');
    process.exit(1);
  }

  let ng = 0;
  for (const { re, msg } of BAN) {
    if (re.test(body)) {
      console.error(`[cio-chat-report-selfcheck] NG: ${msg}`);
      ng++;
    }
  }

  if (argv.includes('--strict-head')) {
    const th = strictTurnHeadOk(body);
    if (!th.ok) {
      console.error(
        `[cio-chat-report-selfcheck] NG --strict-head missing: ${th.missing.join(', ')} (先頭 ${TURN_HEAD_WINDOW} 文字ウィンドウ)`
      );
      ng++;
    }
  }

  if (argv.includes('--require-v2')) {
    if (!requireV2Ok(body)) {
      console.error(
        '[cio-chat-report-selfcheck] NG --require-v2: 【セッション報告チェックシート】+ CHECKSHEET_VERSION: 2 + CHECKSHEET_OK: yes が必要'
      );
      ng++;
    }
  }

  if (argv.includes('--require-ceo-block')) {
    const ceo = requireCeoBlockOk(body);
    if (!ceo.ok) {
      console.error(
        '[cio-chat-report-selfcheck] NG --require-ceo-block: CEO-MINIMUM-ABSOLUTE-BASELINE.txt の次の行が本文に欠落:'
      );
      for (const m of ceo.missing) console.error(`  - ${m}`);
      ng++;
    }
  }

  if (argv.includes('--require-a1')) {
    if (!requireA1Ok(body)) {
      console.error(
        '[cio-chat-report-selfcheck] NG --require-a1: □A1・ダブルチェック（誰と・結果）・ダブルチェック要約:（6文字以上・許容語）が必要（docs/session-report-checklist.md §P A1）'
      );
      ng++;
    }
  }

  const lastTier = readLastTier(root);
  const requireContract =
    argv.includes('--require-turn-contract') || lastTier?.tier === 'strict';
  if (requireContract) {
    const tc = requireTurnContractOk(body);
    if (!tc.ok) {
      console.error(
        `[cio-chat-report-selfcheck] NG turn-contract missing: ${tc.missing.join(', ')} (strict tier)`
      );
      ng++;
    }
  }

  if (argv.includes('--check-medal-line') || lastTier?.lane) {
    const lane = lastTier?.lane || 'default';
    const expected = expectedMedalLine(lane);
    const medalRe = /\[🎖️\s*本セッション割当\][^\n]*/u;
    const m = body.match(medalRe);
    if (m && m[0].trim() !== expected) {
      const strictMedal = argv.includes('--check-medal-line');
      const lines = [
        `[cio-chat-report-selfcheck] ${strictMedal ? 'NG' : 'WARN'} medal-line mismatch (expected lane=${lane})`,
        `  expected: ${expected}`,
        `  found:    ${m[0].trim()}`,
      ];
      if (strictMedal) {
        // #S-REPORT-01: 報告経路（--check-medal-line）は不一致で失敗
        for (const line of lines) console.error(line);
        ng++;
      } else {
        for (const line of lines) console.warn(line);
      }
    }
  }

  if (ng > 0) {
    console.error(`[cio-chat-report-selfcheck] 失敗 ${ng} 件 — 修正して再実行`);
    process.exit(1);
  }

  console.log('[cio-chat-report-selfcheck] OK');
  process.exit(0);
}

main();
