#!/usr/bin/env node
// =============================================================================
// l3-guard.mjs — Cursor beforeShellExecution Hook
// 制定: 2026-04-22 (改善案 #1 段階 1)
// 役割: AGENTS.md §47 L3 (絶対禁止) 操作を検知し、浜田に必ず ask 形式で確認する
// 依存: Node.js のみ (jq 不要)
// 動作: stdin から JSON 受領 → コマンドを正規表現マッチ → stdout に JSON 返却
// =============================================================================

// ── L3 操作の正規表現パターン (誤検知最小化のため空白等を厳密にマッチ) ──
const L3_PATTERNS = [
  { pattern: /\brm\s+-rf?\s/, label: 'rm -rf / rm -r' },
  { pattern: /\brmdir\s/, label: 'rmdir' },
  { pattern: /\bfind\b.*-delete\b/, label: 'find -delete' },
  { pattern: /\bgit\s+push\s+(--force|-f)\b/, label: 'git push --force' },
  { pattern: /\bgit\s+reset\s+--hard\b/, label: 'git reset --hard' },
  { pattern: /\bgit\s+clean\s+-[a-zA-Z]*f[a-zA-Z]*\b/, label: 'git clean -f' },
  { pattern: /\bgit\s+branch\s+-D\b/, label: 'git branch -D (force delete)' },
  { pattern: /\bgh\s+release\s+(create|delete)\b/, label: 'gh release create/delete' },
  { pattern: /\bgh\s+api\b.*-X\s+DELETE\b/, label: 'gh api DELETE' },
  { pattern: /\bnpm\s+(publish|unpublish)\b/, label: 'npm publish/unpublish' },
  { pattern: /\bcrontab\s+-e\b/, label: 'crontab -e (cron 配信編集)' },
  // 本番 DB / SQL 破壊系
  { pattern: /\bDROP\s+(TABLE|DATABASE|INDEX)\b/i, label: 'DROP TABLE/DATABASE/INDEX' },
  { pattern: /\bTRUNCATE\s+TABLE\b/i, label: 'TRUNCATE TABLE' },
  // kintone bulk delete API (URL 経由 / 順序問わずマッチさせるため 2 パターン)
  { pattern: /\b(DELETE|delete)\b.*\/k\/v1\/records/, label: 'kintone bulk delete API (DELETE → records)' },
  { pattern: /\/k\/v1\/records.*\b(DELETE|delete)\b/, label: 'kintone bulk delete API (records → DELETE)' },
  { pattern: /\/k\/v1\/records\/cursor\.json/i, label: 'kintone cursor.json (delete モード可能性)' },
];

// ── 入力読み込み (stdin から JSON) ──
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw || '{}');
  } catch (e) {
    // JSON parse 失敗 → fail-open (Hook 自体のバグで shell を止めない)
    console.log(JSON.stringify({ permission: 'allow' }));
    process.exit(0);
  }

  const command = String(input.command || '');

  // ── L3 パターンマッチング ──
  for (const { pattern, label } of L3_PATTERNS) {
    if (pattern.test(command)) {
      const userMsg =
        `⚠ L3 操作を検知しました\n` +
        `  検知パターン: ${label}\n` +
        `  実行コマンド: ${command}\n\n` +
        `本当に実行しますか? AGENTS.md §47 (L3 ガード) により浜田の明示承認が必要です。`;
      const agentMsg =
        `L3 操作 (${label}) を検知しました。改善案 #1 (L3 ガード) により浜田の承認待ちです。` +
        `承認されたら同じコマンドを再実行してください。`;
      console.log(JSON.stringify({
        permission: 'ask',
        user_message: userMsg,
        agent_message: agentMsg,
      }));
      process.exit(0);
    }
  }

  // ── パターンに該当しない → 通常通り実行許可 ──
  console.log(JSON.stringify({ permission: 'allow' }));
  process.exit(0);
});
