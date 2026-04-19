#!/usr/bin/env node
/**
 * emergency-mirror.mjs — 重要ファイルを ~/.cursor-emergency-backup/ にミラー
 *
 * 目的:
 *   - リポ内のスクリプト wipe 事件に備え、別パス（リポ外）に常に最新コピーを保持
 *   - file-watcher.mjs の自動復元元として機能
 *
 * 実行:
 *   node scripts/emergency-mirror.mjs        # 通常実行
 *   node scripts/emergency-mirror.mjs --dry  # ドライラン
 *
 * 推奨: 1 時間ごと cron / または apply-approved-changes 後 / または手動
 *
 * 出力: stdout に同期結果サマリ
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const EMERGENCY_BACKUP = path.join(os.homedir(), '.cursor-emergency-backup');

const DRY = process.argv.includes('--dry');

// 監視・ミラー対象（file-watcher.mjs と同じリスト + α）
const MIRRORED = [
  // 憲法・索引
  'AGENTS.md',
  'CLAUDE.md',
  'WORKFLOW.md',
  'RULES-INDEX.md',
  'kintone-apps.md',
  // 自動化スクリプト
  'scripts/daily-morning-prep.mjs',
  'scripts/health-check.mjs',
  'scripts/auto-heal.mjs',
  'scripts/version-up.mjs',
  'scripts/apply-approved-changes.mjs',
  'scripts/evening-reflect.mjs',
  'scripts/audit-rules.mjs',
  'scripts/scan-plans.mjs',
  'scripts/skysea-recon.mjs',
  'scripts/install-morning-cron.sh',
  'scripts/file-watcher.mjs',
  'scripts/wipe-guard.mjs',
  'scripts/restore-wiped.mjs',
  'scripts/emergency-mirror.mjs',
  'scripts/backup-mcp.sh',
  'scripts/check-mcp.sh',
  'scripts/restore-mcp.sh',
  'scripts/backup-workspace.js',
  // ドキュメント
  'docs/troubleshooting.md',
  'docs/approved-changes/README.md',
  'docs/agent-restore-checkpoint.md',
  // セッション
  'chat-sessions/checkpoint-latest.md',
  'chat-sessions/NEW-SESSION-STARTER.md',
  'chat-sessions/README.md',
  // package
  'package.json',
];

fs.mkdirSync(EMERGENCY_BACKUP, { recursive: true });

let copied = 0;
let skipped = 0;
let zeroBlocked = 0;
let missing = 0;

for (const rel of MIRRORED) {
  const src = path.join(REPO_ROOT, rel);
  const dst = path.join(EMERGENCY_BACKUP, rel);

  if (!fs.existsSync(src)) {
    missing++;
    console.log(`  ⏭ MISSING: ${rel}`);
    continue;
  }

  const srcSize = fs.statSync(src).size;
  // 安全装置: src が 0 byte ならミラーしない（0 byte で上書きすると emergency-backup も死ぬ）
  if (srcSize === 0) {
    zeroBlocked++;
    console.log(`  🚫 BLOCKED (src=0byte): ${rel}`);
    continue;
  }

  // 既存と同じなら skip（mtime 比較で軽量化）
  if (fs.existsSync(dst)) {
    const dstSize = fs.statSync(dst).size;
    const srcMtime = fs.statSync(src).mtimeMs;
    const dstMtime = fs.statSync(dst).mtimeMs;
    if (dstSize === srcSize && srcMtime <= dstMtime) {
      skipped++;
      continue;
    }
  }

  if (DRY) {
    console.log(`  [DRY] would copy: ${rel} (${srcSize} bytes)`);
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    copied++;
  }
}

const summary = {
  generated_at: new Date().toISOString(),
  total: MIRRORED.length,
  copied,
  skipped_unchanged: skipped,
  blocked_zero_byte: zeroBlocked,
  missing,
  dst_root: EMERGENCY_BACKUP,
};

fs.writeFileSync(path.join(EMERGENCY_BACKUP, 'MIRROR-MANIFEST.json'), JSON.stringify(summary, null, 2));

console.log('');
console.log(`📦 emergency-mirror 完了: 更新 ${copied} / 不変 ${skipped} / 拒否 ${zeroBlocked} / 不在 ${missing}`);
console.log(`   ミラー先: ${EMERGENCY_BACKUP}`);
