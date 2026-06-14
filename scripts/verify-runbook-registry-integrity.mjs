#!/usr/bin/env node
/**
 * R39 — runbook / registry JSON 整合（CI 安全・軽量）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REGISTRY_FILES = [
  'data/windows-canonical-paths.json',
  'data/c-tmp-workspace-registry.json',
  'data/kintone-customize-path-registry.json',
];

const RUNBOOKS = [
  'docs/runbooks/repo-workspace-lifecycle.md',
  'docs/runbooks/c-tmp-workspace-lifecycle.md',
  'docs/runbooks/kintone-project-close-gate.md',
];

function main() {
  const issues = [];

  for (const rel of REGISTRY_FILES) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      issues.push(`missing ${rel}`);
      continue;
    }
    try {
      JSON.parse(fs.readFileSync(abs, 'utf8'));
    } catch (e) {
      issues.push(`${rel} JSON parse error: ${e.message}`);
    }
  }

  for (const rel of RUNBOOKS) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) issues.push(`missing runbook ${rel}`);
  }

  const lifecycle = path.join(root, 'docs/runbooks/repo-workspace-lifecycle.md');
  if (fs.existsSync(lifecycle)) {
    const text = fs.readFileSync(lifecycle, 'utf8');
    for (const rel of REGISTRY_FILES) {
      const base = path.basename(rel);
      if (!text.includes(base)) {
        issues.push(`repo-workspace-lifecycle.md に ${base} 参照なし`);
      }
    }
    if (!text.includes('四半期')) {
      issues.push('repo-workspace-lifecycle.md に四半期スキャン（R40）記述なし');
    }
  }

  const customizeReg = path.join(root, 'data/kintone-customize-path-registry.json');
  if (fs.existsSync(customizeReg)) {
    const { mappings } = JSON.parse(fs.readFileSync(customizeReg, 'utf8'));
    for (const dir of Object.keys(mappings || {})) {
      const js = path.join(root, 'customize', dir, 'desktop.js');
      if (!fs.existsSync(js)) {
        issues.push(`customize/${dir}/desktop.js 不在（registry 参照）`);
      }
    }
  }

  if (issues.length) {
    console.error('[verify:runbook-registry-integrity] NG', issues.length);
    for (const i of issues) console.error('  -', i);
    process.exit(1);
  }
  console.log('[verify:runbook-registry-integrity] OK R39 runbook/registry');
  process.exit(0);
}

main();
