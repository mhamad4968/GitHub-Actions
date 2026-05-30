#!/usr/bin/env node
/**
 * 暗号化 .env バックアップ作成（ローカル・CEO/浜田のみ）
 * 用法: CIO_ENV_MASTER_KEY=… npm run cio:env:encrypt-backup
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadEnvFile } from './lib/cio-env-integrity.mjs';
import {
  ENC_META_REL,
  ENC_REL,
  encryptEnvPayload,
  getMasterKey,
} from './lib/cio-env-self-healing.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const masterKey = getMasterKey();
  if (!masterKey) {
    console.error('[cio:env:encrypt-backup] NG CIO_ENV_MASTER_KEY 必須');
    process.exit(1);
  }
  const envMap = loadEnvFile(path.join(root, '.env'));
  if (!Object.keys(envMap).length) {
    console.error('[cio:env:encrypt-backup] NG .env 空または無し');
    process.exit(1);
  }
  const blob = encryptEnvPayload(envMap, masterKey);
  const encDir = path.join(root, path.dirname(ENC_REL));
  fs.mkdirSync(encDir, { recursive: true });
  fs.writeFileSync(path.join(root, ENC_REL), JSON.stringify(blob, null, 2) + '\n', 'utf8');
  fs.writeFileSync(
    path.join(root, ENC_META_REL),
    JSON.stringify(
      { version: 1, keys: Object.keys(envMap).sort(), updatedAt: new Date().toISOString() },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  console.log('[cio:env:encrypt-backup] OK', ENC_REL, `(${Object.keys(envMap).length} keys, values not logged)`);
  process.exit(0);
}

main();
