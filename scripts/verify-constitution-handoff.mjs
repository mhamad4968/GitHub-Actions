#!/usr/bin/env node
/**
 * verify-constitution-handoff.mjs — 憲法級ハンドオフ物理ガードの存否検証（TSB-024 連動）
 *
 * 目的:
 *   会話要約や大規模編集で §35-1 / TSB-024 系の文言がドキュから消えたときに
 *   `npm run session:bootstrap`（smoke-test）で即検知する。
 *
 * 正本:
 *   - docs/troubleshooting.md TSB-024 / TSB-031（§35-6 連動）
 *   - chat-sessions/NEW-SESSION-STARTER.md 冒頭 🚨 ブロック
 *   - chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md フェーズ 7 第 7 項
 *
 * 終了コード: 0 = 全 OK / 2 = 1 件以上 NG
 *
 * @see docs/troubleshooting.md ## TSB-024
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {string} rel
 * @param {number} [headChars] 先頭 N 文字のみ検査（大ファイル向け）
 */
function readSlice(rel, headChars) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    return { ok: false, text: '', err: `missing file: ${rel}` };
  }
  const raw = fs.readFileSync(abs, 'utf8');
  const text = typeof headChars === 'number' ? raw.slice(0, headChars) : raw;
  return { ok: true, text, err: '' };
}

const suites = [
  {
    id: 'starter-head',
    rel: 'chat-sessions/NEW-SESSION-STARTER.md',
    headChars: 5200,
    needles: [
      'TSB-024',
      '§35-1',
      '§56-1a',
      '(7) 役割宣言',
      '再デプロイしてください',
      '🚫 AI が絶対に書いてはいけない禁句',
      '[§1-2-3 ティア判定',
      '§1-2-3-1',
      '§35-6',
      '§35-7',
      'HANDOFF-AI-FIVE-BLOCKS',
      'cio:preflight:674',
      '674 本番 deploy 機械ゲート',
      '独断で消さない',
      'session:clock:clear',
    ],
  },
  {
    id: 'handoff-five-blocks',
    rel: 'chat-sessions/HANDOFF-AI-FIVE-BLOCKS.md',
    needles: ['ブロック 1', 'ブロック 2', '規律ゲート', '§35-7', 'HANDOFF-AI-FIVE-BLOCKS', '改定履歴'],
  },
  {
    id: 'package-deploy-674-preflight',
    rel: 'package.json',
    needles: ['cio-deploy-preflight-guard.mjs 674', 'cio:preflight:674'],
  },
  {
    id: 'agents-35-6',
    rel: 'AGENTS.md',
    needles: [
      'セッション成果物の削除と「古い」整理のゲート',
      'セッション日報・長文ログの正本は `chat-sessions/` に置きコミット',
      '§35-7',
      '規律先行',
    ],
  },
  {
    id: 'bootstrap-phase7',
    rel: 'chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md',
    needles: [
      '役割宣言（TSB-024',
      '(7) 役割宣言:',
      '§35-1',
      '§56-1a',
      '§1-2-3-1 ティア宣言',
      '[§1-2-3 ティア判定',
      'verify-desktop-ai-emergency-sync',
      '3b.',
      '貼付推奨',
      '日終わり',
      '§35-6',
      'TSB-031',
    ],
  },
  {
    id: 'tsb024-body',
    rel: 'docs/troubleshooting.md',
    needles: ['## TSB-024', '真因', '禁句'],
  },
  {
    id: 'tsb031-body',
    rel: 'docs/troubleshooting.md',
    needles: ['## TSB-031', '§35-6', 'SESSION-DAILY-REPORT_20260503'],
  },
  {
    id: 'rules-index-tsb024',
    rel: 'RULES-INDEX.md',
    needles: ['TSB-024', 'verify:constitution-handoff'],
  },
  {
    id: 'handoff-anchor',
    rel: 'chat-sessions/handoff-log.md',
    needles: ['verify-constitution-handoff-anchor', 'TSB-024'],
  },
  {
    id: 'hooks-json-session-autopilot',
    rel: '.cursor/hooks.json',
    needles: [
      'sessionStart',
      'session-start-autopilot.mjs',
      'session:clock:set',
      '§51-6-2 壁時計',
      '黙実行禁止',
      'セッション切替直後',
    ],
  },
  {
    id: 'cursor-rule-gate',
    rel: '.cursor/rules/constitution-handoff-gate.mdc',
    needles: [
      'TSB-024',
      '§35-1',
      '§1-2-3-1',
      'alwaysApply: false',
      '[§1-2-3 ティア判定:',
      '浜田（確認）',
      '§51-6-2 壁時計',
      '言葉に出す',
      'SESSION-CLOCK-TICKER',
      'セッション切替で新チャット',
      'Desktop「AI緊急用」同期',
      '§35-6',
    ],
  },
  {
    id: 'session-handoff-tsb',
    rel: '.cursor/rules/session-handoff.mdc',
    needles: ['TSB-024', '§35-1'],
  },
  {
    id: 'checkpoint-bootstrap-order',
    rel: 'chat-sessions/checkpoint-latest.md',
    needles: [
      'verify:constitution-handoff',
      'セッション切替後の自律復元',
      'session:bootstrap',
      'Read より前',
      '項番 0',
      '項番 -1',
      '項番 -0',
      '00-NEW-SESSION-STARTER_yyyymmdd',
      'session-starter:sync-desktop',
      'verify:desktop-ai-emergency-sync',
      'C:\\Users\\mhamada202408224\\Desktop\\AI緊急用',
      '項番 0.9',
      'OK が返るまで',
      '着手しない',
      '貼付推奨',
      '日終わり',
      '13-README.txt',
      'mandatory-read-gate.mjs',
      'verify:session-clock-health',
      'SESSION-SPLIT-REMINDER.md',
      'SESSION-CLOCK.md',
      'session:clock:set',
      'session:split-check',
      'session:clock:watch',
      '§35-6',
      '§35-7',
      'HANDOFF-AI-FIVE-BLOCKS',
      'TSB-031',
    ],
  },
];

const failures = [];

for (const s of suites) {
  const slice = readSlice(s.rel, s.headChars);
  if (!slice.ok) {
    failures.push(`${s.id}: ${slice.err}`);
    continue;
  }
  for (const n of s.needles) {
    if (!slice.text.includes(n)) {
      failures.push(`${s.id}: "${n}" not found in ${s.rel}${s.headChars ? ` (head ${s.headChars} chars)` : ''}`);
    }
  }
}

if (failures.length > 0) {
  console.error('[verify-constitution-handoff] ❌ NG');
  for (const f of failures) console.error(`  - ${f}`);
  console.error('');
  console.error('修正ヒント: docs/troubleshooting.md TSB-024 と chat-sessions/NEW-SESSION-STARTER.md 冒頭 🚨 を復元する。');
  process.exit(2);
}

console.log('[verify-constitution-handoff] ✅ OK (憲法級ハンドオフ物理ガード健在)');
process.exit(0);
