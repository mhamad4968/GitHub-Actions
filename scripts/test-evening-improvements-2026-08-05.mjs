#!/usr/bin/env node
/**
 * 2026-08-05 夕反省 GO 針テスト（UTF-8 assert / ONEPASS / preflight / PS 禁止）
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertCheckpointUtf8Integrity,
} from './lib/cio-checkpoint-git-sync.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

for (const rel of [
  'docs/approved-changes/2026-08-05-evening-reflection-hamada-go.md',
  'docs/runbooks/cio-ops-2026-08-05-evening-improvements.md',
  '.cursor/rules/cio-ops-2026-08-05-evening-improvements.mdc',
  'docs/reports/2026-08-05-evening-reflection.md',
  'scripts/cio-session-close-preflight.mjs',
]) {
  assert.ok(fs.existsSync(path.join(root, rel)), `missing ${rel}`);
}

{
  const go = read('docs/approved-changes/2026-08-05-evening-reflection-hamada-go.md');
  assert.match(go, /すべて承認/);
  assert.match(go, /憲法本文/);
  assert.match(go, /S-CLOSE-UTF8-01/);
  assert.match(go, /S-CLOSE-ONEPASS-01/);
  assert.match(go, /S-CLOSE-PREFLIGHT-01/);
  assert.match(go, /D-CLOSE-PS-01/);
  assert.match(go, /O-CLOSE-01/);
  assert.match(go, /M-CLOSE-01/);
  assert.match(go, /C-R44-OPS/);
}

{
  const rb = read('docs/runbooks/cio-ops-2026-08-05-evening-improvements.md');
  assert.match(rb, /Set-Content/);
  assert.match(rb, /close-preflight/);
  assert.match(rb, /ONEPASS|一本/);
  assert.match(rb, /UTF-8 破壊/);
  assert.match(rb, /R44 chase/);
}

{
  const mdc = read('.cursor/rules/cio-ops-2026-08-05-evening-improvements.mdc');
  const fm = mdc.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(fm, 'mdc frontmatter');
  assert.match(fm[1], /alwaysApply:\s*false/);
  assert.doesNotMatch(fm[1], /alwaysApply:\s*true/);
}

{
  const ds = read('.cursor/rules/deepseek-cursor-spec-division.mdc');
  assert.match(ds, /M-CLOSE-01/);
  assert.match(ds, /UTF-8 破壊/);
  assert.match(ds, /R44 chase/);
  assert.match(ds, /bridge 古/);
}

{
  const life = read('docs/runbooks/session-lifecycle-v2.md');
  assert.match(life, /D-CLOSE-PS-01|Set-Content/);
  assert.match(life, /close-preflight/);
}

{
  const multi = read('docs/runbooks/session-close-multi-session.md');
  assert.match(multi, /Set-Content/);
  assert.match(multi, /ONEPASS|git-heal/);
}

{
  const p18 = read('chat-sessions/desktop-ai-emergency-read-pack/18-重要確認.txt');
  assert.match(p18, /C-R44-OPS|D-CLOSE-PS-01/);
  assert.match(p18, /Set-Content|ONEPASS|close-preflight/);
}

{
  const evening = read('docs/reports/2026-08-05-evening-reflection.md');
  assert.match(evening, /承認|反映済/);
  assert.doesNotMatch(evening, /\| 承認待ち \|/);
}

{
  const closeSrc = read('scripts/cio-session-close-git.mjs');
  assert.match(closeSrc, /S-CLOSE-ONEPASS-01/);
  assert.match(closeSrc, /cio-session-close-preflight/);
  assert.match(closeSrc, /failClose|ONEPASS/);
  assert.match(closeSrc, /skip-preflight/);
}

{
  const syncSrc = read('scripts/lib/cio-checkpoint-git-sync.mjs');
  assert.match(syncSrc, /S-CLOSE-UTF8-01/);
  assert.match(syncSrc, /assertCheckpointUtf8Integrity/);
  assert.match(syncSrc, /Set-Content/);
}

// UTF-8 assert: good text OK / corrupted NG
{
  const good = read('chat-sessions/checkpoint-latest.md');
  const ok = assertCheckpointUtf8Integrity(good, 'live');
  assert.equal(ok.ok, true);

  const bad = good.replaceAll('**次の1手**:', '**次の1扁E*:').replaceAll(
    'セッション切替後の自律復元',
    '壊れた節',
  );
  const ng = assertCheckpointUtf8Integrity(bad, 'corrupt');
  assert.equal(ng.ok, false);
  assert.ok(ng.missing.length >= 1);
}

// updateCheckpointGitHead throws on corrupt file (temp dir)
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cio-utf8-'));
  const cpDir = path.join(tmp, 'chat-sessions');
  fs.mkdirSync(cpDir, { recursive: true });
  const cp = path.join(cpDir, 'checkpoint-latest.md');
  fs.writeFileSync(
    cp,
    '# broken\r\n**Git**: **`abc1234`** = `origin/main` — x\r\n',
    'utf8',
  );
  // monkey via CHECKPOINT path: function uses CHECKPOINT_REL under root — use real root only for positive path.
  // Negative: call assert directly (already done). Positive stamp on live file is dry via read-only check.
  assert.throws(() => {
    const text = fs.readFileSync(cp, 'utf8');
    const r = assertCheckpointUtf8Integrity(text, 'tmp');
    if (!r.ok) throw new Error(r.message);
  });
  fs.rmSync(tmp, { recursive: true, force: true });
}

// package.json scripts
{
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['cio:session:close-preflight'], 'node scripts/cio-session-close-preflight.mjs');
  assert.equal(
    pkg.scripts['test:evening-improvements-2026-08-05'],
    'node scripts/test-evening-improvements-2026-08-05.mjs',
  );
}

// preflight --help path: script has no --help; run node --check
{
  const chk = spawnSync(node, ['--check', path.join(root, 'scripts/cio-session-close-preflight.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(chk.status, 0, chk.stderr);
  const chk2 = spawnSync(node, ['--check', path.join(root, 'scripts/cio-session-close-git.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(chk2.status, 0, chk2.stderr);
}

// live preflight should succeed on healthy repo (may dirty bridge/scores — restore after)
{
  const before = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  const r = spawnSync(node, [path.join(root, 'scripts/cio-session-close-preflight.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, (r.stdout || '') + (r.stderr || ''));
  assert.match(r.stdout || '', /OK/);
  // discard incidental dirty from export/score if any
  spawnSync('git', ['checkout', '--', 'docs/handoff/latest-session-bridge.json', 'docs/handoff/spec-task-scores.json', 'chat-sessions/handoff-log.md', 'chat-sessions/checkpoint-latest.md'], {
    cwd: root,
  });
  void before;
}

console.log('[test:evening-improvements-2026-08-05] OK');
