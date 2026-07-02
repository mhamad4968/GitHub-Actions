/**
 * checkpoint-latest.md の **Git** 行同期（R44）
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CHECKPOINT_REL } from './cio-checkpoint-read.mjs';

const GIT_LINE_RE = /\*\*Git\*\*:\s*\*\*`([0-9a-f]+)`\*\*\s*=\s*`origin\/main`/i;

/** @returns {string|null} */
export function readCheckpointGitHead(root) {
  const p = path.join(root, CHECKPOINT_REL);
  if (!fs.existsSync(p)) return null;
  const head = fs.readFileSync(p, 'utf8').slice(0, 1200);
  const m = head.match(GIT_LINE_RE);
  return m ? m[1] : null;
}

/**
 * @param {string} root
 * @param {{ hash: string, suffix?: string }} opts
 * @returns {boolean} changed
 */
export function updateCheckpointGitHead(root, { hash, suffix = 'push 済' }) {
  const p = path.join(root, CHECKPOINT_REL);
  if (!fs.existsSync(p)) return false;
  const text = fs.readFileSync(p, 'utf8');
  const line = `**Git**: **\`${hash}\`** = \`origin/main\` — ${suffix}`;
  const lineRe = /^\*\*Git\*\*:.*$/m;
  if (!lineRe.test(text)) return false;
  const updated = text.replace(lineRe, line);
  if (updated === text) return false;
  fs.writeFileSync(p, updated, 'utf8');
  return true;
}

/** @returns {string|null} short hash of most recent [CLOSE] commit */
export function findRecentCloseCommitHash(root) {
  const r = spawnSync('git', ['log', '-1', '--grep=\\[CLOSE\\]', '--format=%h'], {
    cwd: root,
    encoding: 'utf8',
  });
  const h = (r.stdout || '').trim();
  return h || null;
}

/** @returns {string} */
export function gitShortHead(root) {
  const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' });
  return (r.stdout || '').trim();
}

/**
 * push 成功後: [CLOSE] コミットがあればその hash、なければ HEAD
 * @returns {{ changed: boolean, hash: string|null }}
 */
export function syncCheckpointGitAfterPush(root, { suffix } = {}) {
  const closeHash = findRecentCloseCommitHash(root);
  const hash = closeHash || gitShortHead(root);
  if (!hash) return { changed: false, hash: null };
  const defaultSuffix = closeHash ? 'v1 CLOSED push 済' : 'push 済';
  const changed = updateCheckpointGitHead(root, { hash, suffix: suffix || defaultSuffix });
  return { changed, hash };
}

/** @returns {string|null} short hash of origin/main */
export function gitOriginMainShort(root) {
  const r = spawnSync('git', ['rev-parse', '--short', 'origin/main'], { cwd: root, encoding: 'utf8' });
  const h = (r.stdout || '').trim();
  return h && !h.includes('fatal') ? h : null;
}

/**
 * S-CLOSE-01 — checkpoint Git 行が origin/main より古い（先祖返り）か
 * @returns {{ ok: boolean, regression?: boolean, message?: string, cpHash?: string, origin?: string }}
 */
export function checkCheckpointGitRegression(root) {
  const cpHash = readCheckpointGitHead(root);
  if (!cpHash) return { ok: true };
  const origin = gitOriginMainShort(root);
  if (!origin) return { ok: true };
  if (cpHash === origin) return { ok: true };
  const anc = spawnSync('git', ['merge-base', '--is-ancestor', cpHash, origin], { cwd: root });
  if (anc.status === 0) {
    return {
      ok: false,
      regression: true,
      cpHash,
      origin,
      message:
        `checkpoint Git \`${cpHash}\` が origin/main \`${origin}\` より古い — \`npm run cio:session:close-git\` で再 sync（手動 **Git** 行編集禁止 / S-CLOSE-01）`,
    };
  }
  return { ok: true };
}
