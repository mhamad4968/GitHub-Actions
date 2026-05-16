#!/usr/bin/env node
/**
 * CIO 三重・層1 の手動テスト用: デスクトップ正本パス実在確認。
 * @see .cursor/rules/cio-constitution.mdc
 */
import { verifyCioDesktopPaths, CIO_DESKTOP_PATH_CHECKS } from '../.cursor/hooks/cio-desktop-path-guard.mjs';

const r = verifyCioDesktopPaths();
// eslint-disable-next-line no-console
console.log(JSON.stringify({ checks: CIO_DESKTOP_PATH_CHECKS, ok: r.ok, missing: r.missing }, null, 2));
process.exit(r.ok ? 0 : 2);
