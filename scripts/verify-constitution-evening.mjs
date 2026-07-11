#!/usr/bin/env node
/**
 * 憲法夜レーン + lifecycle-v2 検証 — 2026-07-11
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const E1_E9_JSON = path.join(root, 'data', 'cio-e1-e9-needles.json');

function loadE1E9AgentsNeedles() {
  if (!fs.existsSync(E1_E9_JSON)) return null;
  const data = JSON.parse(fs.readFileSync(E1_E9_JSON, 'utf8'));
  return data.agentsNeedles || null;
}

const RETIRED_IDS = ['H0', 'H3', 'H4', 'H6', 'H7', 'C3'];

function fail(msg) {
  console.error(`[verify:constitution-evening] ❌ ${msg}`);
  process.exit(2);
}

function readJson(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) fail(`missing ${rel}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function runNpm(script) {
  const r = spawnSync('npm', ['run', script], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe',
    shell: true,
  });
  if ((r.status ?? 1) !== 0 && r.stderr) {
    console.warn(`[verify:constitution-evening] ${script} stderr:`, r.stderr.slice(0, 200));
  }
  return (r.status ?? 1) === 0;
}

function main() {
  const lifecycleSpec = path.join(root, 'docs/plans/2026-07-11-constitution-lifecycle-v2-spec.md');
  if (!fs.existsSync(lifecycleSpec)) fail('missing lifecycle-v2 spec');

  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  if (!agents.includes('data/cio-rule-entry-points.json')) {
    fail('AGENTS.md missing 3-entrance TOC pointer');
  }
  if (!agents.includes('mandatory_reads') && !agents.includes('免除しない')) {
    fail('AGENTS.md missing mandatory_reads / 免除しない');
  }
  if (!agents.includes('doc-lane lite')) fail('AGENTS.md missing H8 doc-lane lite row');
  if (!agents.includes('27-constitution-navigation-charter')) {
    fail('AGENTS.md missing navigation charter pointer');
  }

  const e1e9Needles = loadE1E9AgentsNeedles();
  if (!e1e9Needles) fail('missing data/cio-e1-e9-needles.json agentsNeedles');
  for (const { id, needle } of e1e9Needles) {
    if (!agents.includes(needle)) fail(`E1-E9: AGENTS.md missing ${id} needle "${needle}"`);
  }

  if (!runNpm('verify:constitution-e1-e9-needles')) {
    fail('verify:constitution-e1-e9-needles failed (Phase 1 .mdc anchors)');
  }

  for (const rel of [
    'docs/constitution/26-formalization-lifecycle-charter.md',
    'docs/constitution/27-constitution-navigation-charter.md',
  ]) {
    if (!fs.existsSync(path.join(root, rel))) fail(`missing ${rel}`);
  }

  const formal = readJson('data/cio-formalization-registry.json');
  if (!Array.isArray(formal.items) || formal.items.length > 8) {
    fail(`registry must be lean (≤8 items, got ${formal.items?.length})`);
  }
  for (const id of RETIRED_IDS) {
    if (formal.items.some((i) => i.id === id)) fail(`retired id ${id} still in registry`);
  }
  for (const id of ['H8', 'H1', 'C1']) {
    if (!formal.items.some((i) => i.id === id)) fail(`formalization missing ${id}`);
  }
  for (const item of formal.items) {
    if (!item.gate || !item.verifyProbe) {
      fail(`registry ${item.id} missing gate or verifyProbe`);
    }
    if (item.reviewDate && !item.reviewSpec) {
      fail(`registry ${item.id} has reviewDate but missing reviewSpec`);
    }
    const probe = String(item.verifyProbe);
    if (!probe.startsWith('verify:') && !probe.startsWith('cio:')) {
      fail(`registry ${item.id} invalid verifyProbe`);
    }
  }

  const entries = readJson('data/cio-rule-entry-points.json');
  if (!Array.isArray(entries.entrances) || entries.entrances.length !== 3) {
    fail('cio-rule-entry-points must have exactly 3 entrances');
  }
  const raw = JSON.stringify(entries);
  if (raw.includes('"replaces"')) fail('entry-points must not use replaces');
  const e1 = entries.entrances.find((e) => e.id === 'E1-every-turn');
  if (!e1?.mandatory_reads?.wake_once_per_session?.length) {
    fail('E1 missing mandatory_reads.wake_once_per_session');
  }
  if (!entries.phase1Essence?.needles?.includes('cio-e1-e9-needles.json')) {
    fail('entry-points missing phase1Essence needles pointer');
  }

  const charter = path.join(root, 'docs/constitution/25-constitution-no-replacement-charter.md');
  if (!fs.existsSync(charter)) fail('missing 25-constitution-no-replacement-charter.md');

  const lock = readJson('data/rules-interpretation-lock.json');
  if (!lock.locks?.some((l) => l.id === 'I11')) fail('missing I11 in interpretation lock');
  const i11 = lock.locks.find((l) => l.id === 'I11');
  if (String(i11.summary).includes('削除しない')) {
    fail('I11 still says 削除しない — update to lifecycle-v2');
  }

  const matrix = readJson('data/cio-turn-start-tier-lane-matrix.json');
  if (!String(matrix.version || '').includes('evening')) {
    fail('tier matrix version missing evening bump');
  }

  const turnStart = fs.readFileSync(path.join(root, 'scripts/cio-turn-start.mjs'), 'utf8');
  if (!turnStart.includes('doc-lane-lite')) fail('cio-turn-start missing doc-lane-lite template');

  const gitScope = fs.readFileSync(
    path.join(root, 'scripts/lib/cio-team-ops-git-scope.mjs'),
    'utf8',
  );
  if (!gitScope.includes('LITE_FORBIDDEN_CONSTITUTION_PREFIXES')) {
    fail('git-scope missing constitution lite forbidden prefixes');
  }

  const liteScopePath = path.join(root, 'data/cio-doc-lane-lite-scope.json');
  if (!fs.existsSync(liteScopePath)) fail('missing data/cio-doc-lane-lite-scope.json');

  if (!runNpm('verify:doc-lane-lite-scope')) {
    fail('verify:doc-lane-lite-scope failed');
  }

  if (!runNpm('verify:formalization-registry-probes')) {
    fail('verify:formalization-registry-probes failed (registry probe spawn)');
  }

  if (!runNpm('verify:mandatory-reads-stamp')) {
    fail('verify:mandatory-reads-stamp failed (mandatory_reads cold-start wiring)');
  }

  if (!runNpm('verify:constitution-meta-charters-desktop')) {
    fail('verify:constitution-meta-charters-desktop failed (Desktop META 26–28)');
  }

  if (!runNpm('verify:constitution-spec-integration')) {
    fail('verify:constitution-spec-integration failed (spec index · DoD 6)');
  }

  if (!runNpm('verify:formalization-h9-review')) {
    fail('verify:formalization-h9-review failed (H9 review wiring)');
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const rulesOpt = pkg.scripts?.['verify:rules-optimization'] || '';
  if (!rulesOpt.includes('verify-constitution-evening')) {
    fail('verify:rules-optimization missing verify-constitution-evening');
  }

  const chain = readJson('data/cio-session-close-chain.json');
  if (!chain.fullClose?.steps?.some((s) => s.npm === 'verify:constitution-evening')) {
    fail('cio-session-close-chain.fullClose missing verify:constitution-evening step');
  }

  const agenda = fs.readFileSync(
    path.join(root, 'docs/plans/2026-07-11-constitution-evening-agenda.md'),
    'utf8',
  );
  if (agenda.includes('| [ ] |')) {
    console.warn('[verify:constitution-evening] WARN agenda 締め行未 [x]');
  }

  console.log('[verify:constitution-evening] ✅ OK (lifecycle-v2 · probes · E1-E9)');
  process.exit(0);
}

main();
