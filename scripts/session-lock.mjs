#!/usr/bin/env node
/**
 * session-lock.mjs — 並列 Cursor セッション検知 + 排他制御 (L-1 / 2026-04-25)
 *
 * 目的:
 *   TSB-017 (別 Cursor セッションが現セッション AI の B-7 提案を勝手に実行) の再発防止。
 *   §51 並列禁止を物理的に enforce する基盤。
 *
 * 設計:
 *   - .session-state/ai-session.lock に lock file を作成 (pid + start_time + holder)
 *   - lock acquire 時、既存 lock の pid が生きていれば「別セッション稼働中」を検知
 *   - 段階 1 (現状): 検知 = 警告 + 自分側 abort (= 自衛)
 *   - 段階 2 (将来 / L-6): 検知 = 既存セッションを kill (浜田 GO 後 / 誤殺リスク要検討)
 *
 * 使い方:
 *   node scripts/session-lock.mjs acquire [--holder=<id>] [--force]
 *     成功: exit 0 / lock 取得
 *     失敗: exit 2 / 別セッション検知 (pid + holder 表示)
 *
 *   node scripts/session-lock.mjs release
 *     lock file 削除 (idempotent)
 *
 *   node scripts/session-lock.mjs status
 *     現在の lock 状態を表示 (JSON)
 *
 *   node scripts/session-lock.mjs check
 *     並列セッションがあれば exit 2 / なければ exit 0 (acquire しない)
 *
 * オプション:
 *   --holder=<id>  lock holder 識別子 (default: 環境変数 USER + pid)
 *   --force        既存 lock を強制上書き (誤殺リスクあり / 浜田 GO 必須)
 *   --json         JSON 出力
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const LOCK_DIR = path.join(REPO_ROOT, '.session-state');
const LOCK_FILE = path.join(LOCK_DIR, 'ai-session.lock');

const argv = process.argv.slice(2);
const cmd = argv[0] || 'status';
const ARG_FORCE = argv.includes('--force');
const ARG_JSON = argv.includes('--json');
const ARG_MANUAL = argv.includes('--manual');
const HOLDER_ARG = argv.find((a) => a.startsWith('--holder='));
const HOLDER = HOLDER_ARG ? HOLDER_ARG.split('=')[1] : `${os.userInfo().username}:${process.pid}`;

function ensureDir() {
  if (!fs.existsSync(LOCK_DIR)) fs.mkdirSync(LOCK_DIR, { recursive: true });
}

function readLock() {
  if (!fs.existsSync(LOCK_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
  } catch (e) {
    return { _corrupt: true, error: e.message, raw: fs.readFileSync(LOCK_FILE, 'utf8') };
  }
}

function writeLock(data) {
  ensureDir();
  fs.writeFileSync(LOCK_FILE, JSON.stringify(data, null, 2) + '\n');
}

function isPidAlive(pid) {
  if (!pid || pid === process.pid) return false;
  try {
    process.kill(pid, 0); // signal 0 = check existence without killing
    return true;
  } catch (e) {
    return e.code === 'EPERM'; // EPERM = exists but no permission to signal
  }
}

function isLockActive(lock) {
  if (!lock || lock._corrupt) return false;
  if (lock.is_manual === true) return true; // manual lock = release されるまで常に有効
  return isPidAlive(lock.pid);
}

function output(obj, exitCode = 0) {
  if (ARG_JSON) {
    console.log(JSON.stringify(obj, null, 2));
  } else {
    if (obj.status === 'ok') {
      console.log(`[session-lock] ✅ ${obj.message}`);
      if (obj.holder) console.log(`  holder: ${obj.holder}`);
      if (obj.pid) console.log(`  pid: ${obj.pid}`);
    } else if (obj.status === 'conflict') {
      console.error(`[session-lock] ⚠️  ${obj.message}`);
      console.error(`  既存 lock holder: ${obj.existing_holder}`);
      console.error(`  既存 pid: ${obj.existing_pid} (alive: ${obj.existing_alive})`);
      console.error(`  既存 開始時刻: ${obj.existing_started_at}`);
      console.error('');
      console.error('  → §51 並列セッション禁止違反の疑い');
      console.error('  → 既存セッションを停止してから再実行するか、--force で上書き (浜田 GO 必須)');
    } else if (obj.status === 'released') {
      console.log(`[session-lock] ✅ ${obj.message}`);
    } else if (obj.status === 'idle') {
      console.log(`[session-lock] (no lock)`);
    } else {
      console.log(`[session-lock] ${obj.status}: ${obj.message}`);
    }
  }
  process.exit(exitCode);
}

if (cmd === 'acquire') {
  const existing = readLock();
  if (existing && !existing._corrupt) {
    const active = isLockActive(existing);
    if (active && !ARG_FORCE) {
      output({
        status: 'conflict',
        message: '別セッションが lock を保有中 (acquire 拒否)',
        existing_holder: existing.holder,
        existing_pid: existing.pid,
        existing_alive: active,
        existing_is_manual: !!existing.is_manual,
        existing_started_at: existing.started_at,
      }, 2);
    }
    // pid 死亡 (manual=false) or --force = 上書き
  }
  const data = {
    holder: HOLDER,
    pid: process.pid,
    started_at: new Date().toISOString(),
    cwd: process.cwd(),
    is_manual: ARG_MANUAL,
    overwritten_existing: !!existing,
  };
  writeLock(data);
  output({ status: 'ok', message: `lock 取得成功${ARG_MANUAL ? ' (manual mode)' : ''}`, ...data }, 0);
}

if (cmd === 'release') {
  const existing = readLock();
  if (!existing) output({ status: 'idle', message: 'lock 不在 (idempotent)' }, 0);
  if (existing._corrupt) {
    fs.unlinkSync(LOCK_FILE);
    output({ status: 'released', message: '破損 lock を削除' }, 0);
  }
  fs.unlinkSync(LOCK_FILE);
  output({ status: 'released', message: `lock 解放 (holder=${existing.holder})` }, 0);
}

if (cmd === 'status') {
  const existing = readLock();
  if (!existing) output({ status: 'idle', message: 'lock 不在' }, 0);
  if (existing._corrupt) output({ status: 'corrupt', ...existing }, 1);
  const alive = isLockActive(existing);
  output({ status: 'ok', message: 'lock 保有中', alive, ...existing }, 0);
}

if (cmd === 'check') {
  const existing = readLock();
  if (!existing || existing._corrupt) output({ status: 'idle', message: '並列セッションなし' }, 0);
  const active = isLockActive(existing);
  if (active) {
    output({
      status: 'conflict',
      message: '並列セッション検知',
      existing_holder: existing.holder,
      existing_pid: existing.pid,
      existing_alive: true,
      existing_is_manual: !!existing.is_manual,
      existing_started_at: existing.started_at,
    }, 2);
  }
  output({ status: 'idle', message: 'lock 保持者は dead pid (並列なし)' }, 0);
}

console.error(`[session-lock] unknown command: ${cmd}`);
console.error(`使い方: node scripts/session-lock.mjs <acquire|release|status|check> [--holder=<id>] [--force] [--json]`);
process.exit(1);
