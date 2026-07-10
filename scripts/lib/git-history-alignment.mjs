/**
 * Git 履歴デグレード（先祖返り）防衛 — git-history-mcp 相当ロジック（§50-3-11 第12層・拡張案2）
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  git,
  parseFourElements,
  getCommitDetail,
} from './git-history-core.mjs';

export { git, parseFourElements, getCommitDetail };

const RED = '\x1b[31m';
const RESET = '\x1b[0m';
export const DEGRADE_BANNER =
  '【警告】過去規律とのデグレード（先祖返り）を検知しました。過去の合意ハッシュを確認し、設計を再調整してください';

export function loadGuardManifest(repoRoot) {
  const p = path.join(repoRoot, 'data/git-history-guard-manifest.json');
  if (!fs.existsSync(p)) return { protectedCommands: [], protectedPhrases: [], relaxationPatterns: [] };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** git log から governance 世代を発見（manifest 非参照 — sync 用） */
export function discoverGovernanceGenerationsFromGit(repoRoot, maxGenerations = 3) {
  const raw = git(
    repoRoot,
    ['log', '--oneline', '--max-count=60', '--', 'AGENTS.md', 'docs/', '.cursor/rules/', 'package.json'],
    { allowFail: true },
  );
  const hashes = [];
  const marker = /第\d+層|§50-3-11|feat\(cio\)|R19|R20|verify:kintone-live|verify:git-history/i;
  for (const line of (raw || '').split(/\r?\n/).filter(Boolean)) {
    if (!marker.test(line)) continue;
    const hash = line.split(/\s/)[0];
    if (hash && !hashes.includes(hash)) hashes.push(hash);
    if (hashes.length >= maxGenerations) break;
  }
  if (!hashes.length) {
    const fallback = git(repoRoot, ['log', '--oneline', `--max-count=${maxGenerations}`, '--', 'AGENTS.md'], {
      allowFail: true,
    });
    for (const line of (fallback || '').split(/\r?\n/).filter(Boolean)) {
      const hash = line.split(/\s/)[0];
      if (hash) hashes.push(hash);
    }
  }
  return hashes.slice(0, maxGenerations);
}

/** 過去3世代 — git 最新を優先し manifest を補完（manifest 古くても監査は最新世代を含む） */
export function getGovernanceGenerations(repoRoot, maxGenerations = 3) {
  const fresh = discoverGovernanceGenerationsFromGit(repoRoot, maxGenerations);
  const manifest = loadGuardManifest(repoRoot);
  const fromManifest = Array.isArray(manifest.generations)
    ? manifest.generations.map((g) => (typeof g === 'string' ? g : g.hash)).filter(Boolean)
    : [];

  const merged = [];
  for (const h of fresh) {
    if (h && !merged.includes(h)) merged.push(h);
  }
  for (const h of fromManifest) {
    if (h && !merged.includes(h)) merged.push(h);
  }
  return merged.slice(0, maxGenerations);
}

export function collectHistoricalConstraints(repoRoot, generations) {
  const manifest = loadGuardManifest(repoRoot);
  const constraints = {
    protectedCommands: new Set(manifest.protectedCommands || []),
    protectedPhrases: new Set(manifest.protectedPhrases || []),
    forbiddenRelaxations: [...(manifest.relaxationPatterns || [])],
    commitHashes: generations,
  };

  for (const hash of generations) {
    const detail = getCommitDetail(repoRoot, hash);
    const four = parseFourElements(detail.body);
    if (four.禁止) constraints.protectedPhrases.add(four.禁止.slice(0, 120));
    if (four.exit && /exit\s*1/i.test(four.exit)) {
      constraints.protectedPhrases.add('exit 1 ゲート');
    }
    const cmdMatches = detail.body.match(/npm run [a-z0-9:_-]+/gi) || [];
    for (const c of cmdMatches) constraints.protectedCommands.add(c.trim());
  }

  return constraints;
}

export function getWorkingDiffText(repoRoot) {
  const staged = git(repoRoot, ['diff', '--cached'], { allowFail: true });
  const unstaged = git(repoRoot, ['diff'], { allowFail: true });
  return `${staged}\n${unstaged}`;
}

/** handoff 用 — export 以降の commit + staged のみ（未 stage WIP は許容） */
export function getHandoffDiffText(repoRoot, sinceHash) {
  const parts = [];
  if (sinceHash) {
    parts.push(git(repoRoot, ['diff', `${sinceHash}..HEAD`], { allowFail: true }));
  }
  parts.push(git(repoRoot, ['diff', '--cached'], { allowFail: true }));
  return parts.filter(Boolean).join('\n');
}

export function scanDiffForRegression(diffText, constraints) {
  const issues = [];
  if (!diffText.trim()) return issues;

  for (const cmd of constraints.protectedCommands) {
    const esc = cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const removed = (diffText.match(new RegExp(`^-\\s*.*${esc}`, 'gm')) || []).length;
    const added = (diffText.match(new RegExp(`^\\+\\s*.*${esc}`, 'gm')) || []).length;
    if (removed > added) {
      issues.push({ code: 'CMD_REMOVED', message: `過去合意コマンド削除の疑い: ${cmd}` });
    }
  }

  for (const pat of constraints.forbiddenRelaxations) {
    try {
      const re = new RegExp(pat, 'i');
      for (const line of diffText.split('\n')) {
        if (!line.startsWith('+') || line.startsWith('+++')) continue;
        if (re.test(line)) {
          issues.push({ code: 'RELAXATION', message: `規律緩和パターン検知: /${pat}/` });
          break;
        }
      }
    } catch {
      /* skip bad pattern */
    }
  }

  const weakenLines = [
    [/^\+\s*.*exit\s*0\s*.*(?:was|旧|以前).*exit\s*1/im, 'exit 1 → exit 0 への緩和'],
    [/^\-\s*.*必須.*\n\+\s*.*任意/im, '必須→任意への緩和'],
    [/^\+\s*.*SKIP.*always/im, '常時 SKIP 追加'],
    [/^\-\s*.*非置換/im, '非置換条項の削除'],
  ];
  for (const [re, label] of weakenLines) {
    if (re.test(diffText)) issues.push({ code: 'WEAKEN', message: label });
  }

  return issues;
}

export function scanSpecContradiction(repoRoot) {
  const issues = [];
  const specPaths = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/SPEC\.md$/i.test(name)) specPaths.push(full);
    }
  }
  walk(path.join(repoRoot, 'docs/plans'));
  walk(path.join(repoRoot, 'templates'));

  for (const specPath of specPaths) {
    const rel = path.relative(repoRoot, specPath).replace(/\\/g, '/');
    const diff = git(repoRoot, ['diff', 'HEAD', '--', rel], { allowFail: true });
    if (!diff) continue;
    if (/^\+\s*- \[ \]/m.test(diff) && /^\-\s*- \[x\]/im.test(diff)) {
      issues.push({
        code: 'SPEC_REGRESSION',
        message: `${rel} — 完了済みチェックを未完了へ先祖返り`,
      });
    }
    if (/^\+\s*.*(?:deprecated|obsolete|不要|削除可)/im.test(diff) && /verify:|exit 1|禁止/im.test(diff)) {
      issues.push({
        code: 'SPEC_RELAX',
        message: `${rel} — 検証/禁止条項の緩和記述を検知`,
      });
    }
  }
  return issues;
}

export function validateManifestGenerations(repoRoot, generations) {
  const manifest = loadGuardManifest(repoRoot);
  const issues = [];
  if (!Array.isArray(manifest.generations) || !manifest.generations.length) {
    return issues;
  }
  for (const entry of manifest.generations) {
    const hash = typeof entry === 'string' ? entry : entry.hash;
    if (!hash) continue;
    try {
      git(repoRoot, ['cat-file', '-t', hash]);
    } catch {
      issues.push({
        code: 'GEN_MISSING',
        message: `manifest.generations の hash ${hash} がリポに存在しません`,
      });
    }
  }
  return issues;
}

export function runAlignmentAudit(repoRoot, options = {}) {
  const generations = getGovernanceGenerations(repoRoot, options.generations ?? 3);
  const constraints = collectHistoricalConstraints(repoRoot, generations);
  const diffText = options.handoffMode
    ? getHandoffDiffText(repoRoot, options.sinceHash)
    : getWorkingDiffText(repoRoot);
  const issues = [
    ...validateManifestGenerations(repoRoot, generations),
    ...scanDiffForRegression(diffText, constraints),
    ...(options.checkSpec !== false ? scanSpecContradiction(repoRoot) : []),
  ];

  return {
    ok: issues.length === 0,
    issues,
    generations,
    constraints: {
      commandCount: constraints.protectedCommands.size,
      phraseCount: constraints.protectedPhrases.size,
    },
  };
}

export function printRegressionIssues(issues, { handoffMode = false } = {}) {
  console.error(`${RED}${DEGRADE_BANNER}${RESET}`);
  for (const i of issues) {
    console.error(`${RED}[verify:git-history-alignment] ${i.code}: ${i.message}${RESET}`);
  }
  if (handoffMode) {
    console.error(`${RED}[verify:git-history-alignment] handoff 修復手順:${RESET}`);
    console.error('  1) 規律削除 diff を取り消す / 2) 先に commit してから import 再実行');
    console.error('  3) 緊急のみ SKIP_CIO_GIT_HISTORY_HANDOFF=1 + チャット理由1行');
  }
}
