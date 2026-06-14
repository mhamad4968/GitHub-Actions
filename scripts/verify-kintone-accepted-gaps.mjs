#!/usr/bin/env node
/**
 * kintone 許容ギャップの機械監視 — 「知ってるのに接続/台帳化忘れ」を deploy 前に NG
 * npm run verify:kintone-accepted-gaps
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAPS_PATH = path.join(root, 'data/kintone-accepted-gaps.json');
const REGISTRY_PATH = path.join(root, 'data/kintone-field-registry.json');

function hasCustomizeJs(appId) {
  const dir = path.join(root, 'customize', appId);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return false;
  return fs.readdirSync(dir).some((f) => f.endsWith('.js'));
}

function main() {
  if (!fs.existsSync(GAPS_PATH)) {
    console.error('[verify:kintone-accepted-gaps] NG missing data/kintone-accepted-gaps.json');
    process.exit(1);
  }
  const gapsDoc = JSON.parse(fs.readFileSync(GAPS_PATH, 'utf8'));
  const registry = fs.existsSync(REGISTRY_PATH)
    ? JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'))
    : { apps: {} };
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const issues = [];

  for (const gap of gapsDoc.gaps || []) {
    const appId = String(gap.appId || '').trim();
    if (!appId) continue;
    const deployKey = gap.requiredBeforeDeploy?.packageScript || `deploy:${appId}`;
    const preflightKey = gap.requiredBeforeDeploy?.preflightScript || `cio:preflight:${appId}`;
    const hasDeploy = Boolean(pkg.scripts?.[deployKey]);
    const hasPreflight = Boolean(pkg.scripts?.[preflightKey]);
    const reg = registry.apps?.[appId];
    const requiredRelated = gap.requiredBeforeDeploy?.registryRelatedAppFieldsFrom || [];
    const relatedOk = requiredRelated.every((id) => (reg?.relatedAppFieldsFrom || []).includes(String(id)));

    if (hasDeploy || hasPreflight) {
      if (!relatedOk) {
        issues.push(
          `${deployKey} または ${preflightKey} が package.json に存在 — registry ${appId}.relatedAppFieldsFrom に ${requiredRelated.join(',')} 必須`,
        );
      }
      if (hasDeploy && !hasPreflight) {
        issues.push(`${deployKey} あり — ${preflightKey} も package.json に追加すること`);
      }
      continue;
    }

    if (hasCustomizeJs(appId)) {
      console.log(
        `[verify:kintone-accepted-gaps] OK accepted gap app=${appId} (${gap.label || appId}) — ${gap.reason}`,
      );
      if (gap.docRel && !fs.existsSync(path.join(root, gap.docRel))) {
        issues.push(`accepted gap docRel 欠落: ${gap.docRel}`);
      }
    }
  }

  if (issues.length) {
    console.error(`[verify:kintone-accepted-gaps] NG ${issues.length} 件 — 許容ギャップ解消または deploy 接続前の台帳化`);
    for (const i of issues) console.error(`  - ${i}`);
    process.exit(1);
  }
  console.log('[verify:kintone-accepted-gaps] OK — 許容ギャップは監視中・deploy 接続時は自動 NG');
  process.exit(0);
}

main();
