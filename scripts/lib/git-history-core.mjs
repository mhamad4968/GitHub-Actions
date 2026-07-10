/**
 * git-history 共通コア — MCP と verify:git-history-alignment の単一正本（O2）
 */
import { spawnSync } from 'node:child_process';

export function git(repoRoot, args, opts = {}) {
  const r = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    ...opts,
  });
  if (r.status !== 0 && !opts.allowFail) {
    throw new Error((r.stderr || r.stdout || 'git failed').trim());
  }
  return (r.stdout || '').trim();
}

export function parseFourElements(body) {
  const keys = ['前提', '手順', '禁止', 'exit'];
  const out = {};
  for (const k of keys) {
    const re = new RegExp(`^${k}[:：]\\s*(.+)$`, 'm');
    const m = body.match(re);
    out[k] = m ? m[1].trim() : null;
  }
  return out;
}

export function getCommitDetail(repoRoot, hash) {
  const subject = git(repoRoot, ['log', '-1', '--format=%s', hash]);
  const body = git(repoRoot, ['log', '-1', '--format=%b', hash]);
  const files = git(repoRoot, ['show', '--name-only', '--format=', hash]).split(/\r?\n/).filter(Boolean);
  return { hash, subject, body, files };
}

export function searchGitLog(repoRoot, { grep, since, path: filePath, maxCount = 30 } = {}) {
  const args = ['log', '--oneline', `--max-count=${Math.min(maxCount || 30, 200)}`];
  if (since) args.push(`--since=${since}`);
  if (grep) args.push(`--grep=${grep}`);
  if (filePath) args.push('--', filePath);
  return git(repoRoot, args).split(/\r?\n/).filter(Boolean);
}

export function searchConstitutionLayers(repoRoot, { layer, maxCount = 20 } = {}) {
  const pattern = layer ? `第${layer}層` : '§50-3-11';
  return git(repoRoot, [
    'log',
    '--oneline',
    `--max-count=${Math.min(maxCount || 20, 100)}`,
    `--grep=${pattern}`,
    '--',
    'AGENTS.md',
  ])
    .split(/\r?\n/)
    .filter(Boolean);
}

export function searchR19R20Ritual(repoRoot, { maxCount = 30 } = {}) {
  const patterns = ['R19', 'R20', 'session:close-git', 'cio:session:close-git'];
  const out = {};
  for (const p of patterns) {
    out[p] = git(repoRoot, [
      'log',
      '--oneline',
      `--max-count=${Math.min(maxCount || 30, 100)}`,
      `--grep=${p}`,
    ])
      .split(/\r?\n/)
      .filter(Boolean);
  }
  return out;
}

export function analyzeCommitFourElements(repoRoot, hash) {
  const body = git(repoRoot, ['log', '-1', '--format=%b', hash]);
  return { hash, fourElements: parseFourElements(body), rawBody: body };
}
