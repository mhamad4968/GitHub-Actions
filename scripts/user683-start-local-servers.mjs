#!/usr/bin/env node
/**
 * 683 用ローカルサーバをまとめて起動（Windows は .bat で別ウィンドウ）。
 *
 *   npm run user683:local-servers
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bat = path.join(root, 'scripts', 'windows', 'user683-start-local-servers.bat');

if (process.platform === 'win32' && fs.existsSync(bat)) {
  const r = spawnSync(bat, [], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  process.exit(r.status === null ? 1 : r.status ?? 0);
}

console.error('[user683:local-servers] この OS では .bat を使えません。次を別ターミナルで起動してください:');
console.error('  npm run user683:claude-relay');
console.error('  npm run user683:monthly-pdf:serve');
console.error('  docs/runbooks/user683-claude-relay.md も参照。');
process.exit(1);
