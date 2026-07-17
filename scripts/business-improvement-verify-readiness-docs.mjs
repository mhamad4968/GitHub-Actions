#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = {
  spec: 'docs/plans/2026-05-23-business-improvement-proposal-spec.md',
  runbook: 'docs/runbooks/business-improvement-closed-v1-ux.md',
  report: 'docs/reports/2026-07-17-business-improvement-operation-readiness.md',
  apps: 'kintone-apps.md',
  closures: 'data/cio-project-closures.json',
  builds: 'data/cio-live-builds.json',
  app700: 'customize/business-improvement-proposal/desktop.js',
};

function parseArgs(argv) {
  let root = repoRoot;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root' && argv[i + 1]) root = path.resolve(argv[++i]);
    else if (argv[i] === '--help') {
      console.log('Usage: node scripts/business-improvement-verify-readiness-docs.mjs [--root <dir>]');
      process.exit(0);
    } else {
      throw new Error(`unknown or incomplete argument: ${argv[i]}`);
    }
  }
  return root;
}

function main() {
  let root;
  try {
    root = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[business-improvement:verify-readiness-docs] NG args: ${error.message}`);
    process.exit(1);
  }

  const issues = [];
  const texts = {};
  const json = {};
  for (const [key, rel] of Object.entries(FILES)) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) {
      issues.push(`${rel}: missing`);
      continue;
    }
    try {
      texts[key] = fs.readFileSync(full, 'utf8');
      if (key === 'closures' || key === 'builds') json[key] = JSON.parse(texts[key]);
    } catch (error) {
      issues.push(`${rel}: read/parse failed: ${error.message}`);
    }
  }

  const requireText = (key, needle, label) => {
    if (texts[key] !== undefined && !texts[key].includes(needle)) {
      issues.push(`${FILES[key]}: missing ${label}: ${JSON.stringify(needle)}`);
    }
  };
  const requirePattern = (key, pattern, label) => {
    if (texts[key] !== undefined && !pattern.test(texts[key])) {
      issues.push(`${FILES[key]}: missing ${label}`);
    }
  };

  const closure = json.closures?.closures?.find((item) => item.id === 'business-improvement');
  const closureExpected = {
    status: 'closed-v1',
    operationReadiness: 'system-side-ready',
    operationReadinessAt: '2026-07-17',
    operationReadinessReport:
      'docs/reports/2026-07-17-business-improvement-operation-readiness.md',
  };
  if (!closure) {
    if (texts.closures !== undefined) issues.push(`${FILES.closures}: closure business-improvement missing`);
  } else {
    for (const [field, expected] of Object.entries(closureExpected)) {
      if (closure[field] !== expected) {
        issues.push(
          `${FILES.closures}: business-improvement.${field} expected ${JSON.stringify(expected)}, got ${JSON.stringify(closure[field])}`,
        );
      }
    }
  }

  requireText('report', 'SYSTEM_SIDE_OPERATION_READINESS: OK', 'readiness OK marker');

  const canonicalDocs = ['spec', 'runbook', 'report', 'apps'];
  const liveApps = ['698', '699', '700', '713'];
  for (const appId of liveApps) {
    const live = json.builds?.apps?.[appId];
    if (!live?.build || !live?.revision) {
      if (texts.builds !== undefined) issues.push(`${FILES.builds}: app ${appId} build/revision missing`);
      continue;
    }
    for (const key of canonicalDocs) {
      requirePattern(
        key,
        new RegExp(
          `(?:\\*\\*)?${appId}(?:\\*\\*)?[^\\n]*${live.build.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\n]*(?:rev(?:ision)?\\s*\\*\\*?)?${live.revision}|` +
            `(?:\\*\\*)?${appId}(?:\\*\\*)?[^\\n]*(?:rev(?:ision)?\\s*\\*\\*?)?${live.revision}[^\\n]*${live.build.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
          'i',
        ),
        `App ${appId} current BUILD ${live.build} and revision ${live.revision} on one canonical row`,
      );
    }
  }

  for (const key of canonicalDocs) {
    requirePattern(key, /697[^\n]*(?:rev(?:ision)?\s*)?(?:\*\*)?11/i, 'App 697 revision 11');
    requirePattern(
      key,
      /32件[^\n]*(?:本番)?30部署[^\n]*(?:管理者専用|admin専用)[^\n]*(?:WF\s*テスト|WFテスト)[^\n]*1件[^\n]*共通[^\n]*1件/i,
      'App 697 32-record composition (30 production + 1 admin WF test + 1 common)',
    );
  }

  for (const key of ['spec', 'runbook', 'report']) {
    requirePattern(key, /定期リマインド[^\n]*設定しない/, 'approved no-periodic-reminder decision');
    requireText(key, '【WFテスト】開発検証用', 'admin-only WF test department name');
    requirePattern(key, /担当者[^\n]*(?:はじめに[・／]申請編|はじめに・申請編)/, 'App 699 staff navigation');
    requirePattern(key, /評価者[^\n]*(?:評価編|はじめに・申請編・評価編)/, 'App 699 reviewer navigation');
    requireText(key, '評価待ちはありません', 'App 699 zero-count pending behavior');
  }

  requireText('app700', "var WF_TEST_DEPARTMENT = '【WFテスト】開発検証用';", 'App 700 WF test constant');
  requireText('app700', "var ADMIN_LOGIN_CODE = 'admin';", 'App 700 admin login guard');

  for (const key of ['spec', 'runbook', 'report']) {
    if (texts[key] === undefined) continue;
    const current =
      key === 'spec'
        ? texts[key].split(/^## 1\./m)[0]
        : key === 'runbook'
          ? texts[key].split(/^## 1\./m)[0]
          : texts[key];
    current.split(/\r?\n/).forEach((line, index) => {
      if (!/リマインド/.test(line)) return;
      const claimsActive = /(?:3日おき|有効|稼働|設定する|実施する)/.test(line);
      const negatedOrHistorical =
        /(?:設定しない|廃止|旧|履歴|deprecated|置換|過去|削除済み)/i.test(line);
      if (claimsActive && !negatedOrHistorical) {
        issues.push(`${FILES[key]}:${index + 1}: current section claims periodic reminder is active`);
      }
    });
  }

  if (issues.length) {
    console.error(`[business-improvement:verify-readiness-docs] NG (${issues.length})`);
    issues.forEach((issue) => console.error(`  - ${issue}`));
    process.exit(1);
  }
  console.log('[business-improvement:verify-readiness-docs] OK');
}

main();
