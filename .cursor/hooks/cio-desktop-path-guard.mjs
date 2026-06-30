#!/usr/bin/env node
/**
 * CIO 三重防御・層1 — デスクトップ正本パスの実在検査（Windows 浜田 PC 既定）。
 * @see .cursor/rules/cio-constitution.mdc
 */
import fs from 'node:fs';

/** @type {readonly { label: string; path: string }[]} */
export const CIO_DESKTOP_PATH_CHECKS = [
  { label: 'AI緊急用', path: 'C:\\Users\\mhamada202408224\\Desktop\\AI緊急用' },
];

/**
 * @returns {{ ok: boolean; missing: string[] }}
 */
export function verifyCioDesktopPaths() {
  const missing = [];
  for (const { label, path: p } of CIO_DESKTOP_PATH_CHECKS) {
    try {
      if (!fs.existsSync(p)) missing.push(`${label} missing: ${p}`);
    } catch {
      missing.push(`${label} check failed: ${p}`);
    }
  }
  return { ok: missing.length === 0, missing };
}

/** sessionStart / additional_context 用の短い日本語ブロック */
export function buildCioDesktopPathGuardBlock() {
  const { ok, missing } = verifyCioDesktopPaths();
  if (ok) {
    return '【CIO三重・層1】Desktop 正本パス実在: OK（`AI緊急用`）。CEO 最低基準は `CEO-MINIMUM-ABSOLUTE-BASELINE.txt` / read-pack `18-重要確認.txt`（Desktop `＃重要確認事項.txt` は 2026-06-30 廃止）。';
  }
  return '【CIO三重・層1】**NG** — ' + missing.join(' | ') + '（報告・タスク完了前にパス復旧）。';
}
