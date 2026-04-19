#!/usr/bin/env node
/**
 * version-up.mjs — §46 Phase 4: バージョンアップ対応
 *
 * 入力: npm outdated --json
 * 処理:
 *   - patch: Phase 3 の audit fix で対応済み（カウントのみ）
 *   - minor: V カテゴリ proposal を docs/approved-changes/<明日>/V<N>-<pkg>.proposal.json に書込
 *   - major: manual_only proposal で破壊的変更レビュー必須
 *
 * 重複防止: pending / approved / processed / rejected を全走査して既存の同パッケージ提案を skip
 *
 * 出力: stdout に markdown サマリ
 * 出口コード: 常に 0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const APPROVED_ROOT = path.join(REPO_ROOT, 'docs', 'approved-changes');

const tomorrow = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const TOMORROW_DIR = path.join(APPROVED_ROOT, tomorrow);
const PENDING_DIR = path.join(APPROVED_ROOT, 'pending');
fs.mkdirSync(TOMORROW_DIR, { recursive: true });
fs.mkdirSync(PENDING_DIR, { recursive: true });

// 既存提案 (重複防止用)
function collectExistingPackages() {
  const set = new Set();
  const dirs = [APPROVED_ROOT, path.join(APPROVED_ROOT, 'pending'), path.join(APPROVED_ROOT, 'processed'), path.join(APPROVED_ROOT, 'rejected')];
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    const stack = [d];
    while (stack.length) {
      const p = stack.pop();
      try {
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          for (const f of fs.readdirSync(p)) stack.push(path.join(p, f));
        } else if (p.endsWith('.proposal.json')) {
          try {
            const j = JSON.parse(fs.readFileSync(p, 'utf8'));
            if (j.package) set.add(`${j.package}:${j.target_version || ''}`);
          } catch { /* skip */ }
        }
      } catch { /* skip */ }
    }
  }
  return set;
}

const existing = collectExistingPackages();

const outRes = spawnSync('bash', ['-lc', 'npm outdated --json 2>/dev/null || true'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
  timeout: 60_000,
});

let outdated = {};
try {
  outdated = JSON.parse(outRes.stdout || '{}');
} catch {
  outdated = {};
}

const counts = { patch: 0, minor: 0, major: 0 };
const proposals = { new: 0, dup: 0 };

function semver(v) {
  const m = String(v).match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function classify(currentV, latestV) {
  const c = semver(currentV);
  const l = semver(latestV);
  if (!c || !l) return 'unknown';
  if (l.major > c.major) return 'major';
  if (l.minor > c.minor) return 'minor';
  if (l.patch > c.patch) return 'patch';
  return 'same';
}

let proposalIdx = 1;
for (const [pkg, info] of Object.entries(outdated)) {
  const cls = classify(info.current, info.latest);
  if (cls === 'patch') {
    counts.patch++;
    continue;
  }
  if (cls === 'minor' || cls === 'major') {
    counts[cls]++;
    const key = `${pkg}:${info.latest}`;
    if (existing.has(key)) {
      proposals.dup++;
      continue;
    }
    const id = `V${proposalIdx++}`;
    const filePath = path.join(PENDING_DIR, `${tomorrow}-${id}-${pkg.replace(/[^a-zA-Z0-9]/g, '_')}.proposal.json`);
    const proposal = {
      id,
      category: 'V',
      type: 'run_command',
      package: pkg,
      current_version: info.current,
      target_version: info.latest,
      classification: cls,
      command: cls === 'minor' ? `npm update ${pkg}` : '# major manual review required',
      manual_only: cls === 'major',
      created_at: new Date().toISOString(),
      note: cls === 'minor'
        ? `${pkg} ${info.current} → ${info.latest} (minor)`
        : `${pkg} ${info.current} → ${info.latest} (major / 破壊的変更レビュー必須)`,
    };
    fs.writeFileSync(filePath, JSON.stringify(proposal, null, 2), 'utf8');
    proposals.new++;
  }
}

console.log('## 📦 Phase 4: バージョンアップ対応');
console.log('');
console.log(`**検出**: patch ${counts.patch} / minor ${counts.minor} / major ${counts.major}`);
console.log(`**proposal 化**: 新規 ${proposals.new} / 重複スキップ ${proposals.dup}`);
console.log('');

if (counts.minor === 0 && counts.major === 0) {
  console.log('_Phase 3 の patch 対応のみで完結。新規 proposal なし。_');
}

process.exit(0);
