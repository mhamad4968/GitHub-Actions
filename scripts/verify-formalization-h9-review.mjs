#!/usr/bin/env node
/**
 * H9 review 配線検証 — 2026-07-25 判定インフラ
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateH9Review, loadH9ReviewSpec } from './lib/cio-formalization-h9-review.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const issues = [];
  const spec = loadH9ReviewSpec(root);
  if (!spec) issues.push('missing data/cio-formalization-h9-review.json');

  const registryPath = path.join(root, 'data/cio-formalization-registry.json');
  if (!fs.existsSync(registryPath)) {
    issues.push('missing cio-formalization-registry.json');
  } else {
    const reg = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const h9 = reg.items?.find((i) => i.id === 'H9');
    if (!h9) issues.push('registry missing H9');
    else {
      if (h9.reviewDate !== spec?.reviewDate) issues.push('H9 reviewDate mismatch');
      if (!h9.reviewSpec?.includes('cio-formalization-h9-review.json')) {
        issues.push('H9 missing reviewSpec pointer');
      }
      if (h9.gate !== 'evening #S-OPS-STRICT-AUDIT') {
        issues.push('H9 gate must be evening #S-OPS-STRICT-AUDIT');
      }
    }
  }

  const runbook = path.join(root, spec?.runbook || '');
  if (!fs.existsSync(runbook)) issues.push(`missing runbook ${spec?.runbook}`);

  const metrics = fs.readFileSync(path.join(root, 'scripts/cio-team-ops-metrics.mjs'), 'utf8');
  if (!metrics.includes('S-OPS-STRICT-AUDIT')) {
    issues.push('cio-team-ops-metrics missing S-OPS-STRICT-AUDIT');
  }
  if (!metrics.includes('appendMetricsDaily')) {
    issues.push('cio-team-ops-metrics missing appendMetricsDaily');
  }

  const charter = path.join(root, 'docs/constitution/26-formalization-lifecycle-charter.md');
  if (fs.existsSync(charter)) {
    const body = fs.readFileSync(charter, 'utf8');
    if (!body.includes('cio-formalization-h9-review')) {
      issues.push('26-charter missing H9 review pointer');
    }
  }

  const lifecycle = path.join(
    root,
    'docs/plans/2026-07-11-constitution-lifecycle-v2-spec.md',
  );
  if (fs.existsSync(lifecycle)) {
    const body = fs.readFileSync(lifecycle, 'utf8');
    if (!body.includes('cio-formalization-h9-review')) {
      issues.push('lifecycle-v2-spec missing H9 review pointer');
    }
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (!pkg.scripts?.['verify:formalization-h9-review']) {
    issues.push('package.json missing verify:formalization-h9-review');
  }
  if (!pkg.scripts?.['cio:formalization-h9-review']) {
    issues.push('package.json missing cio:formalization-h9-review');
  }

  if (issues.length) {
    console.error('[verify:formalization-h9-review] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }

  const evalResult = evaluateH9Review(root);
  if (evalResult.phase === 'scheduled') {
    console.log(
      `[verify:formalization-h9-review] OK wired · scheduled (${evalResult.daysUntil}d until ${evalResult.reviewDate})`,
    );
  } else {
    console.log(
      `[verify:formalization-h9-review] OK due · advisory=${evalResult.advisory} samples=${evalResult.sampleCount}`,
    );
  }
  process.exit(0);
}

main();
