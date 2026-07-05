/**
 * 仕様進捗・checkpoint・kintone-apps の鏡像矛盾検知（先祖返り防止）
 * 正本: data/cio-spec-progress-sync-rules.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { parsePortfolioMachineBuild } from './cio-kintone-apps-portfolio-build.mjs';
import { CHECKPOINT_REL } from './cio-checkpoint-read.mjs';

const RULES_REL = 'data/cio-spec-progress-sync-rules.json';
const KINTONE_APPS_REL = 'kintone-apps.md';

function readUtf8(root, rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

function sectionSlice(text, headingPrefix) {
  const re = new RegExp(`^#{2,4}\\s+[^\\n]*${headingPrefix}[^\\n]*$`, 'm');
  const m = text.match(re);
  if (!m) return '';
  const start = m.index;
  const rest = text.slice(start + m[0].length);
  const next = rest.search(/^#{2,4}\s+/m);
  return next >= 0 ? rest.slice(0, next) : rest;
}

function lineHasLabel(line, label) {
  return line.includes(label);
}

function checkMirrorNoStale(root, rule) {
  const issues = [];
  const text = readUtf8(root, rule.file);
  if (!text) {
    issues.push({ rule: rule.id, message: `file missing: ${rule.file}` });
    return issues;
  }
  const canonical = sectionSlice(text, rule.canonicalHeading);
  let mirror = '';
  for (const h of rule.mirrorHeadings) {
    mirror += sectionSlice(text, h);
  }
  for (const item of rule.items) {
    const canonLines = canonical.split(/\r?\n/).filter((l) => lineHasLabel(l, item.label));
    const done = canonLines.some((l) => item.doneInCanonical.some((d) => l.includes(d)));
    if (!done) continue;
    for (const mLine of mirror.split(/\r?\n/)) {
      if (!lineHasLabel(mLine, item.label)) continue;
      for (const bad of item.forbiddenInMirror) {
        if (mLine.includes(bad)) {
          issues.push({
            rule: rule.id,
            message: `鏡像が古い: ${rule.file} §${rule.mirrorHeadings.join('/')} — "${item.label}" に ${bad}（§${rule.canonicalHeading} は完了/live）`,
            fix: `§${rule.mirrorHeadings.join('/')} を §${rule.canonicalHeading} に追随（§9.2.3）`,
          });
        }
      }
    }
  }
  return issues;
}

function checkKintoneAppsRequiresSpecRow(root, rule) {
  const issues = [];
  const apps = readUtf8(root, KINTONE_APPS_REL);
  const spec = readUtf8(root, rule.specFile);
  if (!apps || !spec) return issues;

  const detailRe = new RegExp(`\\*\\*${rule.appId}\\*\\*[^\\n]*`, 'm');
  const detail = apps.match(detailRe)?.[0] || '';
  const machine = parsePortfolioMachineBuild(apps, rule.appId) || '';
  const hay = `${detail} ${machine}`;
  if (!rule.kintoneAppsMustContainAny.some((k) => hay.includes(k))) return issues;

  const rowRe = new RegExp(`\\|\\s*\\*\\*${rule.specRowId}\\*\\*[^\\n]*`, 'm');
  const row = spec.match(rowRe)?.[0] || '';
  if (!row) {
    issues.push({
      rule: rule.id,
      message: `${rule.specFile} に ${rule.specRowId} 行なし（kintone-apps 736 は実装済み示唆）`,
      fix: `§9.2.2 に ${rule.specRowId} を追加または状態更新`,
    });
    return issues;
  }
  for (const bad of rule.specForbiddenStates) {
    if (row.includes(bad)) {
      issues.push({
        rule: rule.id,
        message: `${rule.specFile} ${rule.specRowId} が ${bad} のまま（kintone-apps=${rule.appId} は live 示唆）`,
        fix: '§9.2.2 状態列を完了に更新 + §8.6 追随',
      });
    }
  }
  return issues;
}

function parseCheckpointBuild(checkpoint, label) {
  const re = new RegExp(`\\|\\s*\\*\\*[^|]*${escapeRe(label)}[^|]*\\|\\s*([^|]+)\\|`, 'm');
  const m = checkpoint.match(re);
  if (!m) return null;
  const cell = m[1];
  const buildM = cell.match(/BUILD=`([^`]+)`/);
  const revM = cell.match(/rev\s*\*?\*?(\d+)/i);
  return {
    build: buildM ? buildM[1] : null,
    rev: revM ? revM[1] : null,
    raw: cell.trim(),
  };
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function checkCheckpointBuildVsApps(root, rule) {
  const issues = [];
  const checkpoint = readUtf8(root, CHECKPOINT_REL);
  const apps = readUtf8(root, KINTONE_APPS_REL);
  if (!checkpoint || !apps) return issues;

  const cp = parseCheckpointBuild(checkpoint, rule.checkpointLabel);
  if (!cp?.build) return issues;

  const kaBuild = parsePortfolioMachineBuild(apps, rule.appId);
  if (!kaBuild) {
    issues.push({
      rule: rule.id,
      message: `kintone-apps 機械表に app ${rule.appId} BUILD なし（checkpoint は ${cp.build}）`,
      fix: `npm run sync:kintone-apps-build -- ${rule.appId}`,
    });
    return issues;
  }
  if (cp.build !== kaBuild) {
    issues.push({
      rule: rule.id,
      message: `checkpoint BUILD=${cp.build} ≠ kintone-apps ${rule.appId} BUILD=${kaBuild}（先祖返りリスク）`,
      fix: 'checkpoint 先頭表または kintone-apps を正本に合わせて同期',
    });
  }
  return issues;
}

function checkCheckpointClosedLane(root, rule) {
  const issues = [];
  const checkpoint = readUtf8(root, CHECKPOINT_REL);
  if (!checkpoint) return issues;

  const activeBlock = checkpoint.match(/### 本日アクティブ[\s\S]*?(?=^## |\Z)/m)?.[0] || '';
  const re = new RegExp(
    `\\|\\s*\\*\\*[^|]*${escapeRe(rule.checkpointLabel)}[^|]*\\|\\s*([^|]+)\\|`,
    'm',
  );
  const m = activeBlock.match(re);
  if (!m) return issues;

  const contentCell = m[1];
  if (!rule.mustContainAny.some((k) => contentCell.includes(k))) {
    issues.push({
      rule: rule.id,
      message: `checkpoint アクティブ表に ${rule.checkpointLabel} が CLOSED なしで残存`,
      fix: 'クローズ済みなら CLOSED 表記またはアクティブ表から除外',
    });
  }
  return issues;
}

export function runSpecProgressSyncChecks(root) {
  const rulesPath = path.join(root, RULES_REL);
  if (!fs.existsSync(rulesPath)) {
    return [{ rule: 'rules-file', message: `missing ${RULES_REL}` }];
  }
  const { rules } = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  const issues = [];

  for (const rule of rules) {
    switch (rule.type) {
      case 'mirror_no_stale':
        issues.push(...checkMirrorNoStale(root, rule));
        break;
      case 'kintone_apps_requires_spec_row':
        issues.push(...checkKintoneAppsRequiresSpecRow(root, rule));
        break;
      case 'checkpoint_build_vs_apps':
        issues.push(...checkCheckpointBuildVsApps(root, rule));
        break;
      case 'checkpoint_closed_lane':
        issues.push(...checkCheckpointClosedLane(root, rule));
        break;
      default:
        issues.push({ rule: rule.id, message: `unknown rule type: ${rule.type}` });
    }
  }
  return issues;
}
