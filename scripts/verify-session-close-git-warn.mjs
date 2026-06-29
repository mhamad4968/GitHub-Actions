#!/usr/bin/env node
/**
 * セッション締め時の未コミット・未 push 検査（S2 / B4 / 2026-05-30〜31）
 * デフォルト: 未コミットまたは origin より ahead なら exit 1（締め禁止）。
 * --warn-only … 警告のみ exit 0
 * --skip-push-check … push 未実施チェックをスキップ（通常は使わない）
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { isSessionCloseTempPath } from './lib/cio-session-close-temp-paths.mjs';
import { checkHoldLaneDirtyFiles } from './lib/cio-project-closure.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const warnOnly = process.argv.includes('--warn-only');
const skipPushCheck = process.argv.includes('--skip-push-check');

function git(args) {
  const res = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return (res.stdout || '').trim();
}

function failOrWarn(msg, detailLines = []) {
  if (warnOnly) {
    console.warn(msg.replace(' NG ', ' WARN '));
    for (const line of detailLines) console.warn(line);
    return false;
  }
  console.error(msg);
  for (const line of detailLines) console.error(line);
  return true;
}

function classifyUncommittedPath(rel) {
  if (/^docs\/reports\//.test(rel) || /evening-reflection/.test(rel)) return 'reports';
  if (/^chat-sessions\//.test(rel)) return 'session';
  if (/^customize\//.test(rel) || /^scripts\//.test(rel)) return 'code';
  if (/^docs\//.test(rel)) return 'docs';
  if (/^\.rag\//.test(rel)) return 'rag';
  return 'other';
}

function formatUncommittedClassification(lines) {
  const buckets = {};
  for (const line of lines) {
    const rel = line.slice(3).trim().replace(/^"(.*)"$/, '$1');
    const bucket = classifyUncommittedPath(rel);
    buckets[bucket] = (buckets[bucket] || 0) + 1;
  }
  const parts = Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, count]) => `${bucket}=${count}`);
  return parts.length ? [`  分類（S-ML-01）: ${parts.join(', ')}`] : [];
}

function checkUncommitted() {
  const status = git(['status', '--short']);
  if (!status) return { ok: true };
  const lines = status.split(/\r?\n/).filter(Boolean).filter((line) => {
    const rel = line.slice(3).trim().replace(/^"(.*)"$/, '$1');
    return !isSessionCloseTempPath(rel);
  });
  if (lines.length === 0) return { ok: true };
  const msg = `[verify:session-close-git-warn] NG 未コミット ${lines.length} 件 — セッション締め前に commit 必須（B1）`;
  const detail = [
    ...formatUncommittedClassification(lines),
    ...lines.slice(0, 15),
  ];
  if (lines.length > 15) detail.push(`  …他 ${lines.length - 15} 件`);
  const hard = failOrWarn(msg, detail);
  return { ok: false, hard };
}

function checkHoldLaneDirty() {
  if (process.env.CIO_ALLOW_HOLD_LANE_DIRTY === '1') {
    console.log('[verify:session-close-git-warn] SKIP hold-lane（CIO_ALLOW_HOLD_LANE_DIRTY=1）');
    return { ok: true };
  }
  const status = git(['status', '--short']);
  if (!status) return { ok: true };
  const relPaths = status.split(/\r?\n/).filter(Boolean).map((line) => {
    const raw = line.slice(3).trim().replace(/^"(.*)"$/, '$1');
    return raw;
  }).filter((rel) => rel && !isSessionCloseTempPath(rel));
  const { ok, issues } = checkHoldLaneDirtyFiles(root, relPaths);
  if (ok) return { ok: true };
  const msg = `[verify:session-close-git-warn] NG 保留レーン ${issues.length} 件 — restore または CIO_ALLOW_HOLD_LANE_DIRTY=1（R58）`;
  const detail = issues.slice(0, 10).map((i) => `  ${i.path} ← ${i.label}`);
  if (issues.length > 10) detail.push(`  …他 ${issues.length - 10} 件`);
  const hard = failOrWarn(msg, detail);
  return { ok: false, hard };
}

function checkUnpushed() {
  if (skipPushCheck) {
    console.log('[verify:session-close-git-warn] SKIP push チェック（--skip-push-check）');
    return { ok: true };
  }
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const upstream = git(['rev-parse', '--abbrev-ref', '@{u}']);
  if (!upstream || upstream.includes('fatal')) {
    console.warn('[verify:session-close-git-warn] WARN upstream 未設定 — push チェック省略');
    return { ok: true };
  }
  const counts = git(['rev-list', '--left-right', '--count', `${upstream}...HEAD`]);
  const parts = counts.split(/\s+/).map((x) => Number.parseInt(x, 10));
  const behind = parts[0] || 0;
  const ahead = parts[1] || 0;
  if (ahead === 0) return { ok: true };
  const msg = `[verify:session-close-git-warn] NG origin より ${ahead} commit ahead — 締め前に git push 必須（B4）`;
  const detail = [`  branch: ${branch} → ${upstream}`, behind > 0 ? `  behind: ${behind}（pull 要検討）` : ''].filter(Boolean);
  const hard = failOrWarn(msg, detail);
  return { ok: false, hard };
}

function checkRulesIndexDirty() {
  const diff = git(['diff', '--name-only', 'HEAD', '--', 'RULES-INDEX.md']);
  if (!diff) return { ok: true };
  const msg =
    '[verify:session-close-git-warn] WARN RULES-INDEX.md が dirty（R67）— 意図しない巻き戻しの可能性。`npm run rules:sync-section-mdc` で再生成するか restore';
  if (warnOnly) {
    console.warn(msg);
    return { ok: true };
  }
  console.error(msg);
  console.error('  緊急: --warn-only または意図的変更なら commit に含める');
  return { ok: false, hard: true };
}

function main() {
  const inside = git(['rev-parse', '--is-inside-work-tree']);
  if (inside !== 'true') {
    console.log('[verify:session-close-git-warn] SKIP（git レポ外）');
    process.exit(0);
  }

  const uncommitted = checkUncommitted();
  if (!uncommitted.ok) {
    process.exit(warnOnly ? 0 : 1);
  }

  const holdDirty = checkHoldLaneDirty();
  if (!holdDirty.ok) {
    process.exit(warnOnly ? 0 : 1);
  }

  const rulesIndex = checkRulesIndexDirty();
  if (!rulesIndex.ok) {
    process.exit(1);
  }

  const unpushed = checkUnpushed();
  if (!unpushed.ok) {
    process.exit(warnOnly ? 0 : 1);
  }

  if (!process.argv.includes('--skip-gh-ci')) {
    const gh = spawnSync('npm', ['run', 'verify:github-constitution-gates', '--silent'], {
      cwd: root,
      encoding: 'utf8',
      shell: true,
    });
    if (gh.status !== 0 && !warnOnly) {
      process.exit(1);
    }
    if (gh.status !== 0 && warnOnly) {
      console.warn('[verify:session-close-git-warn] WARN github constitution-gates NG');
    }
  }

  if (!process.argv.includes('--skip-deploy-ledger')) {
    const ledger = spawnSync('npm', ['run', 'verify:cio-deploy-ledger-gate', '--silent'], {
      cwd: root,
      encoding: 'utf8',
      shell: true,
    });
    if (ledger.status !== 0 && !warnOnly) {
      process.exit(1);
    }
    if (ledger.status !== 0 && warnOnly) {
      console.warn('[verify:session-close-git-warn] WARN deploy ledger gate NG（R21）');
    }
  }

  if (!process.argv.includes('--skip-rag-mirror')) {
    const rag = spawnSync('npm', ['run', 'verify:rag-mirror-canonical', '--silent'], {
      cwd: root,
      encoding: 'utf8',
      shell: true,
    });
    if (rag.status !== 0 && !warnOnly) {
      process.exit(1);
    }
    if (rag.status !== 0 && warnOnly) {
      console.warn('[verify:session-close-git-warn] WARN RAG mirror NG（R56）');
    }
  }

  if (!process.argv.includes('--skip-session-builds')) {
    const builds = spawnSync('npm', ['run', 'cio:audit:session-builds:strict', '--silent'], {
      cwd: root,
      encoding: 'utf8',
      shell: true,
    });
    if (builds.status !== 0 && !warnOnly) {
      process.exit(1);
    }
    if (builds.status !== 0 && warnOnly) {
      console.warn('[verify:session-close-git-warn] WARN session BUILD audit NG（R55）');
    }
  }

  console.log('[verify:session-close-git-warn] OK（未コミットなし・push 済または ahead 0）');
  process.exit(0);
}

main();
