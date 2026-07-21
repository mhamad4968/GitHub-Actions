#!/usr/bin/env node
/**
 * HARD ABORT stub — Phase5 hardening (H1).
 *
 * この名前（jikkou-yosan-v2-backfill）は Ver.02 の CLI 名前空間に見えるが、
 * 実体は Ver.01 App 736 のフィールドパッチだったため隔離した。
 * Ver.02（jikkou-yosan-v2-*）のスクリプトが App 736 に書き込める経路は存在しては
 * ならない。このスタブは環境変数を読まず、ネットワークにも一切アクセスせず、
 * 引数に関係なく必ず exit 1 で終了する。
 */
console.error(
  [
    "HARD ABORT: jikkou-yosan-v2-backfill.mjs is retired (Phase5 hardening H1).",
    "This was a Ver.01 App 736 field backfill, NOT part of Ver.02 (3-app / v2-*).",
    "Ver.02 scripts must never write App 736 (FORBIDDEN_APP_IDS: 735, 736).",
    "If you really need the Ver.01 736 backfill, run:",
    "  npm run jikkou-yosan:ver01-736-backfill -- --dry-run",
  ].join("\n"),
);
process.exit(1);
