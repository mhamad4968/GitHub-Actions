#!/usr/bin/env node
/**
 * formalization registry の全 verifyProbe を実実行（自己参照 probe は除外）
 * @see docs/plans/2026-07-11-constitution-round3-master-spec.md R3-3
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readRegistryProbes,
  spawnRegistryProbes,
} from './lib/cio-formalization-probe-spawn.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** H8: verify:constitution-evening は本スクリプトの呼び出し元が probe 本体 */
const SKIP_SELF = ['verify:constitution-evening'];

function fail(msg) {
  console.error(`[verify:formalization-registry-probes] ❌ ${msg}`);
  process.exit(2);
}

function main() {
  const registryPath = path.join(root, 'data/cio-formalization-registry.json');
  const expected = readRegistryProbes(registryPath).filter((x) => !SKIP_SELF.includes(x.probe));
  const { ok, results } = spawnRegistryProbes({
    root,
    skipProbes: SKIP_SELF,
    fail,
    logPrefix: '[verify:formalization-registry-probes]',
  });
  if (!ok) process.exit(2);

  const ran = results.map((r) => r.probe).join(', ');
  console.log(
    `[verify:formalization-registry-probes] ✅ OK (${results.length}/${expected.length} probes · skip ${SKIP_SELF.join(', ')})`,
  );
  console.log(`  ran: ${ran}`);
  process.exit(0);
}

main();
