/**
 * 改善案3 — 3択提案付き自律エラーチケット
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadState } from './cio-composer-escalation.mjs';

export const CHOICE_EXEC = {
  1: [
    'npm run cio:env:self-healing',
    'npm run verify:cio-env-integrity',
    'npm run cio:composer:escalation-guard -- --record-success',
    'npm run verify:cio-environment-infra',
  ],
  2: [
    'npm run cio:composer:escalation-guard -- --record-success',
    'npm run verify:cio-four-ai-governance',
  ],
  3: [
    'npm run verify:session-handoff-integrity -- --import',
    'npm run cio:composer:escalation-guard -- --record-success',
  ],
};

export const TICKET_REL = 'docs/issues/bug-latest.md';
export const TICKET_STATE_REL = 'logs/cio-error-ticket/last.json';

export function ticketPath(root) {
  return path.join(root, TICKET_REL);
}

export function buildApproaches(state) {
  const heals = (state.history || []).filter((h) => h.event === 'self-heal');
  const fails = (state.history || []).filter((h) => h.event === 'fail');
  const approaches = [];
  for (let i = 0; i < Math.min(3, heals.length); i++) {
    approaches.push(`Self-Heal #${i + 1}: verify 再実行（${state.lastCmd || 'unknown'}）`);
  }
  while (approaches.length < 3 && fails.length) {
    const n = approaches.length + 1;
    approaches.push(`失敗検知 #${n}: ${fails[Math.min(n - 1, fails.length - 1)]?.cmd || state.lastCmd}`);
  }
  while (approaches.length < 3) {
    approaches.push(`（記録不足 — 手動調査 #${approaches.length + 1}）`);
  }
  return approaches.slice(0, 3);
}

export function buildThreeOptions(state, deepSeekHypothesis = '') {
  const cmd = state.lastCmd || 'npm run verify:*';
  return [
    {
      n: 1,
      title: '環境変数・MCP 鍵の再整備',
      action: `npm run verify:cio-env-integrity を実行し不足キーを .env / mcp.json に配備後、${cmd} を再実行`,
    },
    {
      n: 2,
      title: 'エスカレーション状態リセット + 限定再試行',
      action:
        'npm run cio:composer:escalation-guard -- --record-success でロック解除 → DeepSeek §50-3-8 1問 → 修正1件のみ再適用',
    },
    {
      n: 3,
      title: 'CIO(Opus 4.8) 深検証セッションへ切替',
      action:
        'New Chat + verify:session-handoff-integrity --import → Opus 4.8 割当明示 → 根本原因調査（実装レーン凍結維持）',
    },
  ];
}

export function generateTicketMarkdown(root, opts = {}) {
  const state = opts.state || loadState(root);
  const approaches = buildApproaches(state);
  const options = buildThreeOptions(state, opts.deepSeekHypothesis);
  const log = (state.lastLog || opts.log || '(empty)').slice(-2500);
  const hypothesis =
    opts.deepSeekHypothesis ||
    '§50-3-8 未実施または verify 連鎖の設定 drift（env/MCP/registry）が根本原因の可能性が高い。';

  return [
    '# 自律エラーチケット（bug-latest）',
    '',
    `**生成**: \`npm run cio:error:generate-ticket\``,
    `**時刻**: ${new Date().toISOString()}`,
    `**ロック理由**: ${state.lockReason || 'cio-escalation'}`,
    '',
    '## 前提条件',
    '',
    '- Self-Heal **3回**上限到達 — Composer ロック中',
    '- 実装レーン凍結（customize/deploy 禁止）維持',
    '- CEO は **3択から1つ**を選択',
    '',
    '## 1）エラー発生箇所とログ',
    '',
    `- **コマンド**: \`${state.lastCmd || 'unknown'}\``,
    '',
    '```',
    log,
    '```',
    '',
    '## 2）失敗した修正アプローチ（最大3）',
    '',
    ...approaches.map((a, i) => `${i + 1}. ${a}`),
    '',
    '## 3）DeepSeek §50-3-8 根本原因仮説',
    '',
    hypothesis,
    '',
    '## 4）CEO 向け解決策 3択',
    '',
    ...options.flatMap((o) => {
      const cmds = CHOICE_EXEC[o.n] || [];
      return [
        `### 選択肢${o.n}: ${o.title}`,
        '',
        o.action,
        '',
        `<!-- CIO-EXEC-CHOICE-${o.n} -->`,
        ...cmds,
        `<!-- /CIO-EXEC-CHOICE-${o.n} -->`,
        '',
      ];
    }),
    '',
    '## CEO 1行承認プロトコル（第8層）',
    '',
    '浜田が「選択肢1/2/3で実行」と指示 → `npm run cio:error:apply-ticket-choice -- --choice N`',
    '',
    '## 実行手順（CIO）',
    '',
    '1. 本ファイルを CEO に提示',
    '2. 選択肢 1/2/3 のいずれかを待つ',
    '3. 指示後のみ `--record-success` または New Chat',
    '',
    '## 禁止事項',
    '',
    '- 指示待ち中の customize/deploy',
    '- 3択以外の独断 GO',
    '',
    '## 判定コード',
    '',
    '| 状態 | 条件 |',
    '|------|------|',
    '| exit 0 | チケット生成 + `docs/issues/bug-latest.md` 存在 |',
    '| 待機 | チャット1行: エスカレーション限界…3択ご指示を |',
    '',
  ].join('\n');
}

export function writeTicket(root, opts = {}) {
  const body = generateTicketMarkdown(root, opts);
  const out = ticketPath(root);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, body, 'utf8');
  fs.mkdirSync(path.dirname(path.join(root, TICKET_STATE_REL)), { recursive: true });
  fs.writeFileSync(
    path.join(root, TICKET_STATE_REL),
    JSON.stringify({ writtenAt: new Date().toISOString(), ticket: TICKET_REL }, null, 2) + '\n',
    'utf8',
  );
  return out;
}

export const CHAT_WAIT_LINE =
  'エスカレーション限界につき自律エラーチケット（docs/issues/bug-latest.md）を発行しました。3択の選択肢からご指示をお願いします';
