#!/usr/bin/env node
/**
 * github-branch-protection-apply.mjs — GitHub REST で `main` の classic branch protection を設定
 *
 * 認証: 環境変数 **GITHUB_TOKEN** または **GH_TOKEN**（classic: `repo` / admin 相当。fine-grained: Administration 書き込み）
 * または **gh auth login** 済みで `gh api` が使える場合は `--gh-cli` で gh に委譲（トークン不要）。
 *
 * 既定動作（引数なし）: GET 現状を表示して終了（dry-run）。
 *
 * --baseline-apply … 「必須 status check なし」の安全な下限のみ適用:
 *   - required_linear_history: true（merge commit 直 push 禁止）
 *   - allow_force_pushes: false / allow_deletions: false
 *   - required_status_checks: null（マージ不能化を避ける）
 *   - required_pull_request_reviews / restrictions / enforce_admins: null
 *
 * 必須チェックを付けたい場合は API ではなく GitHub UI（docs/github-branch-protection.md §5）で追記する。
 *
 * @see https://docs.github.com/en/rest/branches/branch-protection#update-branch-protection
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const argv = process.argv.slice(2);
const USE_GH = argv.includes('--gh-cli');
const APPLY = argv.includes('--baseline-apply');

const BASELINE_BODY = {
  required_status_checks: null,
  enforce_admins: null,
  required_pull_request_reviews: null,
  restrictions: null,
  required_linear_history: true,
  allow_force_pushes: false,
  allow_deletions: false,
};

function parseRemote() {
  const r = spawnSync('git', ['remote', 'get-url', 'origin'], { cwd: ROOT, encoding: 'utf8' });
  const url = (r.stdout || '').trim();
  if (!url) return { owner: 'mhamad4968', repo: 'GitHub-Actions' };
  const m = url.match(/github\.com[:/]([^/]+)\/([^/.]+)/i);
  if (m) return { owner: m[1], repo: m[2] };
  return { owner: 'mhamad4968', repo: 'GitHub-Actions' };
}

const { owner, repo } = parseRemote();
const branch = process.env.GITHUB_BRANCH || 'main';
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

const apiUrl = `https://api.github.com/repos/${owner}/${repo}/branches/${branch}/protection`;
const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'kintone-ai-lab-github-branch-protection-apply',
};

function ghApi(method, path, body = null) {
  const args = ['api', '-X', method, path];
  const opts = {
    encoding: 'utf8',
    cwd: ROOT,
    maxBuffer: 10 * 1024 * 1024,
  };
  if (method === 'PUT' && body != null) {
    args.push('--input', '-');
    opts.input = JSON.stringify(body);
  }
  return spawnSync('gh', args, opts);
}

async function fetchJson(method, body) {
  if (USE_GH) {
    const pathRel = `repos/${owner}/${repo}/branches/${branch}/protection`;
    const r = ghApi(method, pathRel, method === 'PUT' ? body : null);
    const combined = `${r.stderr || ''}${r.stdout || ''}`;
    if (method === 'GET' && r.status !== 0 && /HTTP 404|Not Found|404:/i.test(combined)) {
      return null;
    }
    if (r.status !== 0) {
      throw new Error(`gh api failed (exit ${r.status}): ${r.stderr || r.stdout || '(no output)'}`);
    }
    try {
      return r.stdout?.trim() ? JSON.parse(r.stdout) : null;
    } catch {
      return r.stdout;
    }
  }
  if (!token) {
    throw new Error(
      'GITHUB_TOKEN または GH_TOKEN が未設定です。' +
        '管理者 PC で `gh auth login` 後に `node scripts/github-branch-protection-apply.mjs --gh-cli` を試すか、PAT を環境変数で渡してください。',
    );
  }
  const init = {
    method,
    headers: { ...headers, Authorization: `Bearer ${token}` },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(apiUrl, init);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (method === 'GET' && res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${typeof json === 'string' ? json : JSON.stringify(json)}`);
  }
  return json;
}

async function main() {
  console.log(`repo=${owner}/${repo} branch=${branch}`);
  console.log(`mode: ${APPLY ? 'PUT baseline' : 'GET only'} transport: ${USE_GH ? 'gh cli' : 'fetch + token'}\n`);

  if (USE_GH) {
    const which = spawnSync('gh', ['--version'], { encoding: 'utf8' });
    if (which.status !== 0) {
      console.error('❌ gh が PATH にありません。新しいターミナルを開くか、`Program Files\\GitHub CLI` を PATH に追加してください。');
      process.exit(2);
    }
    console.log(which.stdout.trim());
  }

  try {
    const current = await fetchJson('GET');
    if (current === null || (typeof current === 'object' && Object.keys(current).length === 0)) {
      console.log('GET: （本文なしまたは空）');
    } else {
      console.log('GET 結果（要約）:');
      console.log(JSON.stringify(current, null, 2).slice(0, 4000));
      if (JSON.stringify(current).length > 4000) console.log('\n…（省略）');
    }
  } catch (e) {
    if (String(e.message).includes('404')) {
      console.log('GET: 404 — まだ branch protection が無い状態です。');
    } else {
      console.error('GET 失敗:', e.message);
      process.exit(1);
    }
  }

  if (!APPLY) {
    console.log('\n適用するには: node scripts/github-branch-protection-apply.mjs --baseline-apply');
    console.log('gh 利用:       node scripts/github-branch-protection-apply.mjs --baseline-apply --gh-cli');
    process.exit(0);
  }

  console.log('\nPUT baseline body:', JSON.stringify(BASELINE_BODY, null, 2));
  const out = await fetchJson('PUT', BASELINE_BODY);
  console.log('\n✅ PUT 成功。応答要約:');
  console.log(JSON.stringify(out, null, 2).slice(0, 3000));
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
