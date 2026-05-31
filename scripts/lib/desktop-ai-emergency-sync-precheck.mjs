/**
 * Desktop sync 前の Notepad / RAM 警告（C2 / E1 / 2026-05-31 承認）
 * @see docs/runbooks/session-close-multi-session.md
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/** 浜田向け: sync 前に Notepad 全終了を推奨する RAM 閾値（%） */
export const RAM_WARN_PERCENT = 80;

/** AI 同期専用 — メモ帳非推奨（Application Hang 再発防止） */
export const NOTEPAD_MIRROR_MD_NAMES = ['24-handoff-log.md', '25-checkpoint-latest.md'];

/**
 * @returns {number} 0–100
 */
export function getRamUsedPercent() {
  const total = os.totalmem();
  const free = os.freemem();
  if (!total) return 0;
  return Math.round(((total - free) / total) * 1000) / 10;
}

/**
 * @param {string} filePath
 * @returns {boolean}
 */
export function isFileOpenLocked(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const fd = fs.openSync(filePath, 'r+');
    fs.closeSync(fd);
    return false;
  } catch (e) {
    return e.code === 'EBUSY' || e.code === 'EPERM' || e.code === 'EACCES';
  }
}

/**
 * @returns {number}
 */
export function countNotepadProcesses() {
  if (process.platform !== 'win32') return 0;
  const r = spawnSync(
    'powershell',
    ['-NoProfile', '-Command', '(Get-Process notepad -ErrorAction SilentlyContinue).Count'],
    { encoding: 'utf8' }
  );
  const n = Number.parseInt(String(r.stdout || '').trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {string} destDir Desktop AI緊急用
 * @param {{ strict?: boolean }} [opts]
 * @returns {boolean} false = strict で NG
 */
export function runDesktopSyncPrecheck(destDir, { strict = false } = {}) {
  const warns = [];
  const ram = getRamUsedPercent();
  const notepadCount = countNotepadProcesses();

  if (ram >= RAM_WARN_PERCENT) {
    warns.push(`RAM ${ram}% ≥ ${RAM_WARN_PERCENT}% — sync 前に Notepad をすべて閉じる（E1）`);
  }
  if (notepadCount > 0) {
    warns.push(
      `Notepad ${notepadCount} 件稼働 — 24/25 .md 開放時は Application Hang リスク（C2）`
    );
  }
  for (const name of NOTEPAD_MIRROR_MD_NAMES) {
    const p = path.join(destDir, name);
    if (isFileOpenLocked(p)) {
      warns.push(`${name} ロック検知 — メモ帳を閉じてから sync（C2）`);
    }
  }

  if (warns.length === 0) {
    console.log(`[desktop-sync-precheck] OK RAM=${ram}% Notepad=${notepadCount}`);
    return true;
  }

  for (const w of warns) {
    console.warn(`[desktop-sync-precheck] WARN ${w}`);
  }
  console.warn(
    '[desktop-sync-precheck] 浜田: メモ帳で開くのは **24-handoff-log-LITE.txt** / **25-checkpoint-latest-LITE.txt** のみ'
  );

  if (strict) {
    console.error('[desktop-sync-precheck] NG — --precheck-strict（Notepad 閉じるまで sync 中止）');
    return false;
  }
  return true;
}
