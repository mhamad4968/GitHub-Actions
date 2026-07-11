#!/usr/bin/env node
/**
 * 憲法 spec 統合 — index ↔ 各 spec ↔ verify 整合
 * @see docs/plans/2026-07-11-constitution-round3-master-spec.md R3-8
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_REL = 'data/cio-constitution-spec-index.json';

function main() {
  const issues = [];
  const indexPath = path.join(root, INDEX_REL);
  if (!fs.existsSync(indexPath)) {
    console.error('[verify:constitution-spec-integration] NG missing', INDEX_REL);
    process.exit(1);
  }
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  for (const spec of index.specs || []) {
    const abs = path.join(root, spec.path);
    if (!fs.existsSync(abs)) issues.push(`missing spec file: ${spec.path}`);
  }

  const tracker = path.join(root, index.canonicalTracker || '');
  if (!fs.existsSync(tracker)) issues.push('missing canonicalTracker');
  else {
    const t = fs.readFileSync(tracker, 'utf8');
    if (!t.includes('cio-constitution-spec-index.json')) {
      issues.push('round3-master missing spec-index pointer');
    }
    for (const id of ['R3-1', 'R3-2', 'R3-3', 'R3-4', 'R3-5', 'R3-6', 'R3-7', 'R3-8', 'R3-9', 'R3-10']) {
      const row = t.split('\n').find((line) => {
        const normalized = line.replace(/\r$/, '');
        return normalized.startsWith(`| ${id} |`);
      });
      if (!row) {
        issues.push(`round3-master missing row ${id}`);
        continue;
      }
      const marks = (row.match(/\[x\]/g) || []).length;
      if (marks < 3) issues.push(`round3-master ${id} incomplete (${marks}/3 [x])`);
    }
  }

  const lifecycle = fs.readFileSync(
    path.join(root, 'docs/plans/2026-07-11-constitution-lifecycle-v2-spec.md'),
    'utf8',
  );
  if (!lifecycle.includes('cio-constitution-spec-index.json')) {
    issues.push('lifecycle-v2-spec missing spec-index pointer');
  }
  if (!lifecycle.includes('round3-master-spec')) {
    issues.push('lifecycle-v2-spec missing round3-master pointer');
  }

  const evening = fs.readFileSync(
    path.join(root, 'docs/plans/2026-07-11-constitution-evening-spec.md'),
    'utf8',
  );
  if (!evening.includes('cio-constitution-spec-index.json')) {
    issues.push('evening-spec missing spec-index pointer');
  }

  const agenda = fs.readFileSync(
    path.join(root, 'docs/plans/2026-07-11-constitution-evening-agenda.md'),
    'utf8',
  );
  if (agenda.includes('| [ ] |')) {
    issues.push('evening-agenda has unchecked rows');
  }

  const dod = index.dodSaikou || [];
  if (dod.length !== 6) issues.push(`dodSaikou must be 6 items (got ${dod.length})`);

  for (const d of dod) {
    for (const v of String(d.verify || '').split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!pkg.scripts?.[v]) issues.push(`package.json missing verify ${v} (DoD ${d.id})`);
    }
  }

  for (const v of index.verifyPackConstitution || []) {
    if (!pkg.scripts?.[v]) issues.push(`package.json missing ${v}`);
  }

  const e1e9 = path.join(root, 'data/cio-e1-e9-needles.json');
  if (!fs.existsSync(e1e9)) issues.push('missing cio-e1-e9-needles.json');

  const h9Review = path.join(root, 'data/cio-formalization-h9-review.json');
  if (!fs.existsSync(h9Review)) issues.push('missing cio-formalization-h9-review.json');

  if (issues.length) {
    console.error('[verify:constitution-spec-integration] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log(
    `[verify:constitution-spec-integration] OK (${index.specs?.length} specs · DoD ${dod.length} · tracker)`,
  );
  process.exit(0);
}

main();
