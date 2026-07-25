#!/usr/bin/env node
/**
 * checkpoint の Lifecycle 必須トークンを正本テンプレから復元する。
 * 長文の手編集ルールを増やさず、生成→検証で constitution-handoff を守る。
 */
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { repairCheckpointBootstrapBlock } from './lib/cio-handoff-template.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = repairCheckpointBootstrapBlock(root);
console.log(
  result.repaired
    ? `[cio:checkpoint:render-lifecycle] repaired: ${result.filled.join(', ')}`
    : '[cio:checkpoint:render-lifecycle] OK no changes',
);

const verify = spawnSync(process.execPath, [
  path.join(root, 'scripts', 'verify-constitution-handoff.mjs'),
], {
  cwd: root,
  stdio: 'inherit',
});
process.exit(verify.status ?? 1);
