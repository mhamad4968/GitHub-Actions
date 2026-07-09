#!/usr/bin/env node
/**
 * Grok L2b ハイブリッド — インフラ・憲法追補の存在検証
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  hashContract,
  validateDoneWhen,
  validateInScope,
} from './lib/cio-grok-execution.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'docs/plans/2026-07-09-grok-l2b-hybrid-spec.md',
  'docs/runbooks/cio-grok-execution-loop.md',
  'templates/grok-execution-contract.template.md',
  'scripts/lib/cio-grok-execution.mjs',
  'scripts/cio-grok-execution-guard.mjs',
  '.cursor/skills/grok-execution-loop/SKILL.md',
];

const MARKERS = [
  { file: 'AGENTS.md', needles: ['Grok 4.5 L2b', 'cio-grok-execution-loop'] },
  { file: 'docs/runbooks/cio-fable5-escalation.md', needles: ['Grok L2b', 'L2b'] },
  { file: 'data/cio-mcp-four-ai-matrix.json', needles: ['"grok"', 'eslint-mcp', 'mcpReadOnly'] },
  { file: 'data/cio-ai-team-tool-routing.json', needles: ['grok-verify-loop', 'eslint-mcp'] },
  { file: '.cursor/rules/mode-b-canonical.mdc', needles: ['Grok', 'L2b'] },
  { file: '.cursor/rules/mcp-server-use-triggers.mdc', needles: ['Grok L2b', 'eslint-mcp'] },
  { file: 'docs/runbooks/session-lifecycle-v2.md', needles: ['Grok L2b', 'validate-diff'] },
  { file: 'docs/runbooks/ai-team-tool-routing-v2.md', needles: ['grok-verify-loop'] },
  { file: 'scripts/cio-session-cold-start.mjs', needles: ['--session-reset', 'GROK-SESSION-RESET'] },
  { file: 'data/cio-project-lanes.json', needles: ['grok-verify-loop'] },
  { file: 'data/cio-handoff-template.json', needles: ['cio-grok-execution-loop'] },
  { file: 'docs/mcp-status.md', needles: ['L2b Grok'] },
  { file: 'docs/runbooks/push-deploy-quality-gates-v2.md', needles: ['Grok L2b'] },
];

function main() {
  const issues = [];
  for (const rel of FILES) {
    if (!fs.existsSync(path.join(root, rel))) issues.push(`missing: ${rel}`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const s of ['cio:grok:execution-guard', 'cio:grok:session-reset', 'verify:cio-grok-execution-infra']) {
    if (!pkg.scripts?.[s]) issues.push(`package.json scripts.${s}`);
  }
  const gov = pkg.scripts?.['verify:cio-four-ai-governance'] || '';
  if (!gov.includes('verify-cio-grok-execution-infra')) {
    issues.push('verify:cio-four-ai-governance に verify-cio-grok-execution-infra 未連結');
  }
  for (const { file, needles } of MARKERS) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) {
      issues.push(`missing marker file: ${file}`);
      continue;
    }
    const text = fs.readFileSync(p, 'utf8');
    for (const n of needles) {
      if (!text.includes(n)) issues.push(`${file} missing: ${n}`);
    }
  }

  if (!validateDoneWhen('npm run lint:customize').ok) issues.push('validateDoneWhen regression');
  if (validateDoneWhen('echo ok').ok) issues.push('validateDoneWhen should reject non-npm');
  if (!validateInScope('customize/736/desktop.js').ok) issues.push('validateInScope regression');
  if (validateInScope('**/*').ok) issues.push('validateInScope should reject wildcard');
  const h = hashContract({ mode: 'C', goal: 'g', doneWhen: 'npm run x', inScope: 'a.js' });
  if (!/^[a-f0-9]{64}$/.test(h)) issues.push('hashContract invalid');

  if (issues.length) {
    console.error('[verify:cio-grok-execution-infra] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:cio-grok-execution-infra] OK Grok L2b hybrid infra');
  process.exit(0);
}

main();
