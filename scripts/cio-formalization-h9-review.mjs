#!/usr/bin/env node
/**
 * H9 review — CEO 評価 CLI（2026-07-25 以降）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateH9Review, loadH9ReviewSpec } from './lib/cio-formalization-h9-review.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const args = process.argv.slice(2);
  const result = evaluateH9Review(root);

  if (!result.ok) {
    console.error('[cio:formalization-h9-review] NG', result.error);
    process.exit(1);
  }

  if (args.includes('--status') || args.length === 0) {
    console.log('[cio:formalization-h9-review] status');
    console.log(`  phase=${result.phase} reviewDate=${result.reviewDate}`);
    if (result.daysUntil != null) console.log(`  daysUntil=${result.daysUntil}`);
    if (result.sampleCount != null) console.log(`  sampleCount=${result.sampleCount}`);
    if (result.advisory) console.log(`  advisory=${result.advisory} redMetricDays=${result.redMetricDays ?? 'n/a'}`);
    if (result.ceoDecision) console.log(`  ceoDecision=${result.ceoDecision}`);
    process.exit(0);
  }

  if (args.includes('--evaluate')) {
    if (result.phase === 'scheduled') {
      console.log(`[cio:formalization-h9-review] 未到期 — ${result.reviewDate} 以降に再実行`);
      process.exit(0);
    }
    console.log('[cio:formalization-h9-review] evaluate');
    console.log(`  advisory=${result.advisory}`);
    console.log(`  samples=${result.sampleCount} redMetricDays=${result.redMetricDays}`);
    if (result.advisory === 'GREEN') {
      console.log('  → 候補: registry から H9 削除（CEO G3 GO 後）');
    } else if (result.advisory === 'RED') {
      console.log('  → 候補: gate 昇格（CEO G3 GO 後）');
    } else {
      console.log('  → データ不足または境界 — CEO 手動判定');
    }
    process.exit(0);
  }

  const recordIdx = args.indexOf('--record-decision');
  if (recordIdx >= 0) {
    const decision = args[recordIdx + 1];
    if (!['green', 'red', 'defer'].includes(decision)) {
      console.error('[cio:formalization-h9-review] usage: --record-decision green|red|defer');
      process.exit(1);
    }
    const spec = loadH9ReviewSpec(root);
    const p = path.join(root, 'data/cio-formalization-h9-review.json');
    spec.ceoDecision = decision;
    spec.ceoDecisionAt = new Date().toISOString();
    spec.status = decision === 'defer' ? 'deferred' : 'decided';
    fs.writeFileSync(p, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');
    console.log(`[cio:formalization-h9-review] recorded ceoDecision=${decision}`);
    process.exit(0);
  }

  console.error('[cio:formalization-h9-review] usage: [--status] [--evaluate] [--record-decision green|red|defer]');
  process.exit(1);
}

main();
