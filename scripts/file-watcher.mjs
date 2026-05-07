#!/usr/bin/env node
/**
 * file-watcher.mjs — リアルタイムファイル監視（fs.watch / inotify ベース）
 *
 * 目的:
 *   - 重要ファイルの変更を全て記録
 *   - 0 byte 化（wipe）検知時に即時警告 + emergency-backup から自動復元
 *
 * 起動:
 *   nohup node scripts/file-watcher.mjs > logs/file-watcher/watcher.log 2>&1 &
 *
 * 停止:
 *   pkill -f file-watcher.mjs
 *
 * 監視対象（CRITICAL_FILES）:
 *   - scripts/ 直下の主要 .mjs / .sh
 *   - リポルートの主要 .md（憲法・索引）
 *
 * ログ出力:
 *   - logs/file-watcher/<日付>.log（全変更履歴）
 *   - logs/file-watcher/wipe-incidents.log（wipe 検知時のみ・追記専用）
 *   - logs/file-watcher/agents-md-changes.jsonl（K-3 / §51-3 段階 3: 憲法 5 ファイルの SHA256 変化・commit 前並列編集検知）
 *
 * 自動復元:
 *   - ~/.cursor-emergency-backup/ にミラーがある場合、wipe 検知後 5 秒待って復元
 *   - 5 秒待つ理由: 編集中の保存（一旦 0 byte → 内容書き込み）を誤判定しないため
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const EMERGENCY_BACKUP = path.join(os.homedir(), '.cursor-emergency-backup');
const LOG_DIR = path.join(REPO_ROOT, 'logs', 'file-watcher');
const WIPE_LOG = path.join(LOG_DIR, 'wipe-incidents.log');
/** K-3: verify-breaking と同じ 5 憲法ファイル（working tree 変化を SHA256 で記録） */
const PROTECTED_RULE_FILES = new Set([
  'AGENTS.md',
  'RULES-INDEX.md',
  'WORKFLOW.md',
  'CLAUDE.md',
  'kintone-apps.md',
]);
const RULE_CHANGES_JSONL = path.join(LOG_DIR, 'agents-md-changes.jsonl');
/** 起動直後はエディタ初期読込等で誤警報しやすい → 60s は stderr ベルを抑止（jsonl は常に記録） */
const RULE_CHANGE_GRACE_MS = 60_000;

fs.mkdirSync(LOG_DIR, { recursive: true });

const WATCHER_START_MS = Date.now();

function sha256File(rel) {
  const full = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(full)) return null;
  try {
    const buf = fs.readFileSync(full);
    return crypto.createHash('sha256').update(buf).digest('hex');
  } catch {
    return null;
  }
}

const CRITICAL_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'WORKFLOW.md',
  'RULES-INDEX.md',
  'kintone-apps.md',
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
  'docs/troubleshooting.md',
  'docs/approved-changes/README.md',
  'chat-sessions/checkpoint-latest.md',
  'chat-sessions/NEW-SESSION-STARTER.md',
  'chat-sessions/session-starter-parts/part-A-constitution-kernel.md',
  'chat-sessions/session-starter-parts/part-B-ritual-and-changelog.md',
  'chat-sessions/session-starter-parts/part-C-full-paste-core.md',
  'chat-sessions/session-starter-parts/part-D-checklists-and-one-liners.md',
  'chat-sessions/session-starter-parts/part-E-proofs-and-incidents.md',
  'chat-sessions/session-starter-parts/part-F-path-table-footer.md',
];

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

function logToFile(line) {
  const day = today();
  const file = path.join(LOG_DIR, `${day}.log`);
  fs.appendFileSync(file, line + '\n');
}

function logWipe(line) {
  fs.appendFileSync(WIPE_LOG, line + '\n');
}

function nowIso() {
  return new Date().toISOString();
}

console.log(`[${nowIso()}] file-watcher 起動 (PID ${process.pid})`);
console.log(`[${nowIso()}] 監視対象: ${CRITICAL_FILES.length} ファイル (K-3: 憲法 5 ファイル SHA256 → ${path.relative(REPO_ROOT, RULE_CHANGES_JSONL)})`);
console.log(`[${nowIso()}] emergency-backup: ${EMERGENCY_BACKUP}`);

function attemptRestore(rel) {
  const src = path.join(EMERGENCY_BACKUP, rel);
  const dst = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(src)) {
    return { ok: false, reason: 'emergency-backup にミラーなし' };
  }
  const srcSize = fs.statSync(src).size;
  if (srcSize === 0) {
    return { ok: false, reason: 'emergency-backup も 0 byte（同様に被害）' };
  }
  try {
    fs.copyFileSync(src, dst);
    return { ok: true, restoredBytes: srcSize };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

const lastSizes = new Map();
for (const rel of CRITICAL_FILES) {
  const full = path.join(REPO_ROOT, rel);
  try {
    lastSizes.set(rel, fs.statSync(full).size);
  } catch {
    lastSizes.set(rel, -1);
  }
}

const lastRuleHashes = new Map();
for (const rel of PROTECTED_RULE_FILES) {
  lastRuleHashes.set(rel, sha256File(rel));
}
const ruleChangeDebounce = new Map();

const watchers = [];
for (const rel of CRITICAL_FILES) {
  const full = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(full)) {
    logToFile(`[${nowIso()}] [WARN] 監視対象不在: ${rel}`);
    continue;
  }
  try {
    const w = fs.watch(full, { persistent: true }, (eventType) => {
      const newSize = fs.existsSync(full) ? fs.statSync(full).size : -1;
      const oldSize = lastSizes.get(rel) ?? -1;
      logToFile(`[${nowIso()}] [${eventType}] ${rel}  size: ${oldSize} → ${newSize}`);

      // K-3 / §51-3 段階 3: 憲法 5 ファイルの SHA256 変化（post-commit より前の並列編集を検知）
      if (PROTECTED_RULE_FILES.has(rel)) {
        const prevT = ruleChangeDebounce.get(rel);
        if (prevT) clearTimeout(prevT);
        ruleChangeDebounce.set(
          rel,
          setTimeout(() => {
            ruleChangeDebounce.delete(rel);
            const newHash = sha256File(rel);
            if (newHash == null) return;
            const prevHash = lastRuleHashes.get(rel);
            if (newHash === prevHash) return;
            lastRuleHashes.set(rel, newHash);
            const inGrace = Date.now() - WATCHER_START_MS < RULE_CHANGE_GRACE_MS;
            const rec = {
              time: nowIso(),
              file: rel,
              eventType,
              sha256: newHash,
              previous_sha256: prevHash,
              watcher_pid: process.pid,
              in_grace: inGrace,
            };
            try {
              fs.appendFileSync(RULE_CHANGES_JSONL, JSON.stringify(rec) + '\n');
            } catch (e) {
              console.error(`[${nowIso()}] RULE-CHANGE jsonl 追記失敗: ${e.message}`);
            }
            logToFile(
              `[${nowIso()}] [RULE-CHANGE] ${rel} sha256 ${(prevHash || 'null').slice(0, 8)}→${newHash.slice(0, 8)} grace=${inGrace}`,
            );
            if (!inGrace) {
              console.error(
                `\x07[${nowIso()}] ⚠️ §51-3 K-3 憲法ファイル変更検知: ${rel} (並列セッション疑い / TSB-017) — see logs/file-watcher/agents-md-changes.jsonl`,
              );
            }
          }, 500),
        );
      }

      // wipe 検知: 1KB 以上 → 0 byte
      if (oldSize > 1024 && newSize === 0) {
        const incident = {
          time: nowIso(),
          file: rel,
          old_size: oldSize,
          new_size: 0,
          parent_pid: process.ppid,
          self_pid: process.pid,
        };
        logWipe(JSON.stringify(incident));
        console.error(`🚨 [${nowIso()}] WIPE 検知: ${rel} (${oldSize} → 0)`);

        // 5 秒待ってから復元（編集中の保存中間状態を誤判定しないため）
        setTimeout(() => {
          const stillEmpty = fs.existsSync(full) && fs.statSync(full).size === 0;
          if (!stillEmpty) {
            console.log(`[${nowIso()}] ${rel} は 5 秒以内に内容が戻った（誤検知 = 通常の保存）`);
            return;
          }
          const restore = attemptRestore(rel);
          if (restore.ok) {
            console.log(`✅ [${nowIso()}] 自動復元成功: ${rel} (${restore.restoredBytes} bytes)`);
            logWipe(`[RESTORE OK] ${rel} ← emergency-backup (${restore.restoredBytes} bytes)`);
          } else {
            console.error(`❌ [${nowIso()}] 自動復元失敗: ${rel}: ${restore.reason}`);
            logWipe(`[RESTORE FAIL] ${rel}: ${restore.reason}`);
          }
        }, 5000);
      }
      lastSizes.set(rel, newSize);
    });
    watchers.push({ rel, w });
  } catch (e) {
    logToFile(`[${nowIso()}] [ERROR] watch 失敗 ${rel}: ${e.message}`);
  }
}

console.log(`[${nowIso()}] ${watchers.length} ファイルの監視開始`);

// 終了処理
function shutdown() {
  console.log(`[${nowIso()}] file-watcher 終了 (PID ${process.pid})`);
  for (const t of ruleChangeDebounce.values()) {
    try { clearTimeout(t); } catch { /* skip */ }
  }
  ruleChangeDebounce.clear();
  for (const { w } of watchers) {
    try { w.close(); } catch { /* skip */ }
  }
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// keep alive
setInterval(() => {
  // 1 時間ごとに heartbeat ログ
  logToFile(`[${nowIso()}] heartbeat alive (PID ${process.pid})`);
}, 3600_000);
