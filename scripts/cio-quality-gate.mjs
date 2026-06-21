#!/usr/bin/env node
/**
 * 品質ゲート統合 — commit / push / deploy
 *
 *   npm run cio:quality-gate -- --commit
 *   npm run cio:quality-gate -- --push
 *   npm run cio:quality-gate -- --deploy 736
 *
 * @see docs/runbooks/push-deploy-quality-gates-v2.md
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runNpmScriptSync } from './lib/win-hidden-spawn.mjs';
import { printEslintCustomizeErrors } from './lib/cio-eslint-report-summary.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_REL = 'data/cio-app-quality-gates.json';

function loadManifest() {
  const p = path.join(root, MANIFEST_REL);
  if (!fs.existsSync(p)) {
    console.error(`[cio:quality-gate] NG missing ${MANIFEST_REL}`);
    process.exit(2);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function runStep(step, label) {
  console.log(`\n[cio:quality-gate] ▶ ${label}`);
  if (step.type === 'npm') {
    const r = runNpmScriptSync(root, step.script, [], { stdio: 'inherit' });
    if (r.status !== 0) return false;
    return true;
  }
  if (step.type === 'node') {
    const scriptPath = path.join(root, step.script);
    const r = spawnSync(process.execPath, [scriptPath, ...(step.args || [])], {
      cwd: root,
      stdio: 'inherit',
    });
    if (r.status !== 0) return false;
    return true;
  }
  console.error(`[cio:quality-gate] NG unknown step type: ${step.type}`);
  return false;
}

function runSteps(steps, phaseLabel) {
  const skipLint = process.env.CIO_QUALITY_GATE_SKIP_LINT === '1';
  const skipConstitution = process.env.CIO_QUALITY_GATE_SKIP_CONSTITUTION === '1';
  const filtered = steps.filter((step) => {
    if (skipLint && step.script === 'lint:customize') return false;
    if (skipConstitution && step.script === 'verify:constitution-handoff') return false;
    return true;
  });
  for (let i = 0; i < filtered.length; i += 1) {
    const step = filtered[i];
    const label = step.script + (step.args?.length ? ` ${step.args.join(' ')}` : '');
    if (!runStep(step, `${phaseLabel} [${i + 1}/${filtered.length}] ${label}`)) {
      if (step.script === 'lint:customize') {
        printEslintCustomizeErrors(root);
      }
      console.error(`\n[cio:quality-gate] ❌ NG phase=${phaseLabel} step=${label}`);
      process.exit(1);
    }
  }
}

function parseDeployApp() {
  const idx = process.argv.indexOf('--deploy');
  if (idx < 0) return null;
  const app = String(process.argv[idx + 1] || '').trim();
  if (!/^\d{3}$/.test(app)) {
    console.error('[cio:quality-gate] Usage: --deploy <appId>');
    process.exit(2);
  }
  return app;
}

function main() {
  const deployApp = parseDeployApp();
  const mode = deployApp ? 'deploy' : process.argv.includes('--push') ? 'push' : 'commit';
  const manifest = loadManifest();

  console.log('═══════════════════════════════════════');
  console.log(`  CIO quality-gate — mode=${mode}${deployApp ? ` app=${deployApp}` : ''}`);
  console.log('═══════════════════════════════════════');

  if (mode === 'commit') {
    runSteps(manifest.commitGate?.steps || [{ type: 'npm', script: 'lint:customize' }], 'commit');
  } else if (mode === 'push') {
    runSteps(manifest.pushGate?.steps || [], 'push');
  } else {
    const appDef = manifest.apps?.[deployApp];
    if (!appDef?.deployGate?.length) {
      console.log(`[cio:quality-gate] OK app=${deployApp} — deployGate 未定義（lint のみスキップ可）`);
      console.log('[cio:quality-gate] 汎用: npm run cio:preflight:' + deployApp + ' → deploy:' + deployApp);
      process.exit(0);
    }
    console.log(`[cio:quality-gate] app=${deployApp} label=${appDef.label || ''}`);
    runSteps(appDef.deployGate, `deploy:${deployApp}`);
  }

  console.log(`\n[cio:quality-gate] ✅ OK mode=${mode}${deployApp ? ` app=${deployApp}` : ''}`);
  process.exit(0);
}

main();
