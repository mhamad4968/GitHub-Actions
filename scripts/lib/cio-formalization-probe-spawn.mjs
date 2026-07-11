/**
 * cio-formalization-registry.json の verifyProbe を実実行する。
 * @see docs/constitution/26-formalization-lifecycle-charter.md L1/L5
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/**
 * @param {string} registryPath
 * @returns {{ id: string, probe: string }[]}
 */
export function readRegistryProbes(registryPath) {
  const data = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const out = [];
  const seen = new Set();
  for (const item of data.items || []) {
    const probe = String(item.verifyProbe || '').trim();
    if (!probe || seen.has(probe)) continue;
    seen.add(probe);
    out.push({ id: item.id, probe });
  }
  return out;
}

/**
 * @param {object} opts
 * @param {string} opts.root
 * @param {string[]} [opts.skipProbes] npm script 名（例 verify:constitution-evening）
 * @param {(msg: string) => void} [opts.fail]
 * @param {string} [opts.logPrefix]
 */
export function spawnRegistryProbes({ root, skipProbes = [], fail, logPrefix = '[formalization-probe]' }) {
  const registryPath = path.join(root, 'data/cio-formalization-registry.json');
  if (!fs.existsSync(registryPath)) {
    fail?.('missing data/cio-formalization-registry.json');
    return { ok: false, results: [] };
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const scripts = pkg.scripts || {};
  const probes = readRegistryProbes(registryPath).filter((x) => !skipProbes.includes(x.probe));
  const results = [];

  for (const { id, probe } of probes) {
    if (!probe.startsWith('verify:') && !probe.startsWith('cio:')) {
      fail?.(`registry ${id}: invalid verifyProbe "${probe}"`);
      return { ok: false, results };
    }
    if (!scripts[probe]) {
      fail?.(`registry ${id}: package.json missing npm script "${probe}"`);
      return { ok: false, results };
    }

    const r = spawnSync('npm', ['run', probe], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
      shell: true,
    });
    const ok = (r.status ?? 1) === 0;
    results.push({ id, probe, ok });
    if (!ok) {
      const tail = [r.stdout, r.stderr].filter(Boolean).join('\n').slice(-800);
      if (tail) console.error(`${logPrefix} ${probe} output:\n${tail}`);
      fail?.(`registry ${id} probe ${probe} failed`);
      return { ok: false, results };
    }
  }

  return { ok: true, results };
}
