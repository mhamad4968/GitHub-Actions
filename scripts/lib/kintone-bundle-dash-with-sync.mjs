/**
 * sync → bundle → lint チェーン（R43 テンプレ — VPN 型）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/**
 * @param {object} opts
 * @param {string} opts.root
 * @param {string} opts.syncScriptRel — e.g. scripts/vpn-account-sync-dash-db-id.mjs
 * @param {string} opts.dashDirRel — e.g. customize/vpn-account-dash
 * @param {boolean} [opts.lint=true]
 */
export function bundleDashWithSync({ root, syncScriptRel, dashDirRel, lint = true }) {
  const sync = spawnSync(process.execPath, [path.join(root, syncScriptRel)], {
     cwd: root,
    encoding: 'utf8',
    shell: false,
  });
  if (sync.status !== 0) {
    console.error(sync.stdout || sync.stderr);
    throw new Error(`sync failed: ${syncScriptRel}`);
  }

  const dir = path.join(root, dashDirRel);
  const src = readFileSync(path.join(dir, 'desktop.src.js'), 'utf8');
  writeFileSync(path.join(dir, 'desktop.js'), src, 'utf8');
  console.log(`bundled ${dashDirRel}/desktop.js`);

  if (lint) {
    const lintRun = spawnSync('npm', ['run', 'lint:customize', '--silent'], {
      cwd: root,
      encoding: 'utf8',
      shell: true,
    });
    if (lintRun.status !== 0) {
      console.error('[bundle-dash-with-sync] lint:customize NG');
      throw new Error('lint:customize failed');
    }
    console.log('[bundle-dash-with-sync] lint:customize OK');
  }
}
