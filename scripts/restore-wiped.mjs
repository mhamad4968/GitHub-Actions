#!/usr/bin/env node
/**
 * restore-wiped.mjs — 手動復元コマンド（人間が走らせる）
 *
 * 実行: npm run restore:wiped
 *       npm run restore:wiped -- --dry      （ドライラン）
 *       npm run restore:wiped -- --all      （CRITICAL リスト全部を強制再ミラー）
 *
 * wipe-guard.mjs と違って:
 *   - 出力が人間向け markdown
 *   - --all で全件強制復元（普段は使わない）
 *   - 復元元の選択肢を全部見せて、何が選ばれたか明示
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const EMERGENCY_BACKUP = path.join(os.homedir(), '.cursor-emergency-backup');
const BACKUPS_ROOT = path.join(REPO_ROOT, 'backups');

const DRY = process.argv.includes('--dry');
const ALL = process.argv.includes('--all');

const CRITICAL = [
  'AGENTS.md', 'CLAUDE.md', 'WORKFLOW.md', 'RULES-INDEX.md', 'kintone-apps.md',
  'scripts/daily-morning-prep.mjs', 'scripts/health-check.mjs', 'scripts/auto-heal.mjs',
  'scripts/version-up.mjs', 'scripts/apply-approved-changes.mjs', 'scripts/evening-reflect.mjs',
  'scripts/audit-rules.mjs', 'scripts/scan-plans.mjs', 'scripts/skysea-recon.mjs',
  'scripts/file-watcher.mjs', 'scripts/wipe-guard.mjs', 'scripts/emergency-mirror.mjs',
  'scripts/restore-wiped.mjs', 'scripts/install-morning-cron.sh', 'scripts/debug-skysea-fields.mjs',
  'docs/troubleshooting.md', 'docs/approved-changes/README.md', 'docs/agent-restore-checkpoint.md',
  'chat-sessions/checkpoint-latest.md',
  'chat-sessions/NEW-SESSION-STARTER.md',
  'chat-sessions/session-starter-parts/part-A-constitution-kernel.md',
  'chat-sessions/session-starter-parts/part-B-ritual-and-changelog.md',
  'chat-sessions/session-starter-parts/part-C-full-paste-core.md',
  'chat-sessions/session-starter-parts/part-D-checklists-and-one-liners.md',
  'chat-sessions/session-starter-parts/part-E-proofs-and-incidents.md',
  'chat-sessions/session-starter-parts/part-F-path-table-footer.md',
];

function findCandidates(rel) {
  const candidates = [];

  // 1) emergency-mirror
  const em = path.join(EMERGENCY_BACKUP, rel);
  if (fs.existsSync(em) && fs.statSync(em).size > 0) {
    candidates.push({ source: 'emergency-mirror', path: em, size: fs.statSync(em).size, mtime: fs.statSync(em).mtime });
  }

  // 2) workspace backups（時刻順、新しいものから）
  if (fs.existsSync(BACKUPS_ROOT)) {
    const dirs = fs.readdirSync(BACKUPS_ROOT)
      .filter((d) => /^\d{4}-\d{2}-\d{2}-\d{6}$/.test(d))
      .sort()
      .reverse();
    for (const d of dirs.slice(0, 5)) {  // 直近 5 世代まで
      const candidate = path.join(BACKUPS_ROOT, d, rel);
      if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
        candidates.push({
          source: `workspace-backup/${d}`,
          path: candidate,
          size: fs.statSync(candidate).size,
          mtime: fs.statSync(candidate).mtime,
        });
      }
    }
  }

  // 3) .backup.* ファイル（タイムスタンプ付き）
  const dir = path.dirname(path.join(REPO_ROOT, rel));
  const baseName = path.basename(rel);
  if (fs.existsSync(dir)) {
    try {
      const sibs = fs.readdirSync(dir).filter((f) => f.startsWith(`${baseName}.backup.`));
      for (const s of sibs) {
        const sp = path.join(dir, s);
        if (fs.statSync(sp).size > 0) {
          candidates.push({
            source: `inline .backup`,
            path: sp,
            size: fs.statSync(sp).size,
            mtime: fs.statSync(sp).mtime,
          });
        }
      }
    } catch { /* skip */ }
  }

  return candidates;
}

console.log('# 🔧 restore-wiped 実行レポート');
console.log('');
console.log(`- 実行モード: ${DRY ? 'DRY-RUN' : '本番実行'}${ALL ? ' / --all (全件強制)' : ''}`);
console.log(`- 対象 CRITICAL ファイル: ${CRITICAL.length}`);
console.log('');

const issues = [];
const ok = [];
for (const rel of CRITICAL) {
  const full = path.join(REPO_ROOT, rel);
  const exists = fs.existsSync(full);
  const size = exists ? fs.statSync(full).size : -1;
  if (!exists || size === 0 || ALL) {
    issues.push({ rel, exists, size });
  } else {
    ok.push({ rel, size });
  }
}

console.log(`## 状態`);
console.log('');
console.log(`- ✅ 健全: ${ok.length} ファイル`);
console.log(`- 🚨 ${ALL ? '強制復元対象' : '異常'}: ${issues.length} ファイル`);
console.log('');

if (issues.length === 0) {
  console.log('_異常なし。復元不要。_');
  process.exit(0);
}

console.log('## 復元アクション');
console.log('');

let restored = 0;
let failed = 0;
for (const i of issues) {
  console.log(`### \`${i.rel}\``);
  console.log(`- 現在: ${i.exists ? `${i.size} bytes` : 'MISSING'}`);

  const candidates = findCandidates(i.rel);
  if (candidates.length === 0) {
    console.log(`- ❌ 復元元なし`);
    console.log('');
    failed++;
    continue;
  }

  console.log(`- 復元候補:`);
  for (const c of candidates.slice(0, 5)) {
    console.log(`  - \`${c.source}\`: ${c.size} bytes (${c.mtime.toISOString()})`);
  }

  const chosen = candidates[0];  // 最優先（emergency-mirror → workspace 新しい順）
  console.log(`- 選択: \`${chosen.source}\` (${chosen.size} bytes)`);

  if (!DRY) {
    try {
      const dst = path.join(REPO_ROOT, i.rel);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(chosen.path, dst);
      console.log(`- ✅ 復元完了`);
      restored++;
    } catch (e) {
      console.log(`- ❌ 復元失敗: ${e.message}`);
      failed++;
    }
  } else {
    console.log(`- (DRY-RUN: 実行スキップ)`);
  }
  console.log('');
}

console.log('---');
console.log('');
console.log(`## 結果: 復元 ${restored} / 失敗 ${failed} / DRY 中=${DRY}`);

process.exit(failed === 0 ? 0 : 1);
