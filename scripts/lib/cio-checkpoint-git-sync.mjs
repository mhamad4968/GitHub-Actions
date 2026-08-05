/**
 * checkpoint-latest.md の **Git** 行同期（R44）
 *
 * #S-CLOSE-UTF8-01（2026-08-05）: 書き込み後に必須キー assert。
 * PowerShell Set-Content / Out-File での編集は禁止（UTF-8 破壊）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CHECKPOINT_REL } from './cio-checkpoint-read.mjs';

// 2026-07-17 migration: accept an older descriptive label such as
// **Git（close records 作成前）**: and normalize it on the next sync.
const GIT_LINE_LABEL = String.raw`\*\*Git(?:（[^）\r\n]+）)?\*\*:`;
const GIT_LINE_RE = new RegExp(
  `${GIT_LINE_LABEL}\\s*\\*\\*\`([0-9a-f]+)\`\\*\\*\\s*=\\s*\`origin/main\``,
  'i',
);

/** S-CLOSE-UTF8-01 — checkpoint 必須キー（破壊検知） */
export const CHECKPOINT_UTF8_REQUIRED = [
  '**次の1手**:',
  'セッション切替後の自律復元',
  'Read より前',
  '項番 -0',
  '日終わり',
];

/**
 * @param {string} text
 * @param {string} [context]
 * @returns {{ ok: true } | { ok: false, missing: string[], message: string }}
 */
export function assertCheckpointUtf8Integrity(text, context = 'checkpoint') {
  const missing = CHECKPOINT_UTF8_REQUIRED.filter((k) => !text.includes(k));
  if (missing.length === 0) return { ok: true };
  return {
    ok: false,
    missing,
    message:
      `[S-CLOSE-UTF8-01] ${context} UTF-8/必須キー欠落: ${missing.join(', ')} — ` +
      'PowerShell Set-Content/Out-File 禁止。Node fs.writeFileSync(utf8) または cio:* のみ。書き込みを破棄して HEAD から復元',
  };
}

/** @returns {string|null} */
export function readCheckpointGitHead(root) {
  const p = path.join(root, CHECKPOINT_REL);
  if (!fs.existsSync(p)) return null;
  const text = fs.readFileSync(p, 'utf8');
  const m = text.match(GIT_LINE_RE);
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
  const beforeAssert = assertCheckpointUtf8Integrity(text, 'before Git stamp');
  if (!beforeAssert.ok) {
    throw new Error(beforeAssert.message);
  }
  const line = `**Git**: **\`${hash}\`** = \`origin/main\` — ${suffix}`;
  const lineRe = new RegExp(`^${GIT_LINE_LABEL}.*$`, 'm');
  if (!lineRe.test(text)) return false;
  const updated = text.replace(lineRe, line);
  if (updated === text) return false;
  // *.md = eol=crlf（.gitattributes）。LF 書戻しは cio-eol-check で wake commit を落とす
  const out = updated.includes('\r\n')
    ? updated
    : updated.replace(/\r?\n/g, '\r\n');
  const afterAssert = assertCheckpointUtf8Integrity(out, 'after Git stamp');
  if (!afterAssert.ok) {
    throw new Error(afterAssert.message);
  }
  fs.writeFileSync(p, out, 'utf8');
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
 * push 成功後: origin/main（= 直前 push の HEAD）で **Git** 行を stamp
 * @returns {{ changed: boolean, hash: string|null }}
 */
export function syncCheckpointGitAfterPush(root, { suffix = 'push 済' } = {}) {
  const hash = gitOriginMainShort(root) || gitShortHead(root);
  if (!hash) return { changed: false, hash: null };
  const changed = updateCheckpointGitHead(root, { hash, suffix });
  return { changed, hash };
}

/** @returns {string|null} short hash of origin/main */
export function gitOriginMainShort(root) {
  const r = spawnSync('git', ['rev-parse', '--short', 'origin/main'], { cwd: root, encoding: 'utf8' });
  const h = (r.stdout || '').trim();
  return h && !h.includes('fatal') ? h : null;
}

/** checkpoint に **Git** 行が複数あるか（手動編集・二重更新検知 #S3） */
export function countCheckpointGitLines(root) {
  const p = path.join(root, CHECKPOINT_REL);
  if (!fs.existsSync(p)) return 0;
  const text = fs.readFileSync(p, 'utf8');
  return (text.match(new RegExp(`^${GIT_LINE_LABEL}`, 'gm')) || []).length;
}

/**
 * origin/main の親（短ハッシュ）。取得失敗時 null。
 * @returns {string|null}
 */
export function gitOriginMainParentShort(root) {
  const origin = gitOriginMainShort(root);
  if (!origin) return null;
  const parent = spawnSync('git', ['rev-parse', '--short', `${origin}^`], {
    cwd: root,
    encoding: 'utf8',
  });
  const h = (parent.stdout || '').trim();
  return h && !h.includes('fatal') ? h : null;
}

/**
 * S-CLOSE-01 — checkpoint Git 行が origin/main より古い（先祖返り）か
 *
 * 許容:
 *   - Git === origin（完全一致）
 *   - Git === origin^1（#S-CHKPT-PARENT-01 — R44 off-by-one。subject 不問）
 * 非許容:
 *   - Git が origin の2世代以上前 / 分岐
 *
 * @returns {{ ok: boolean, regression?: boolean, offByOne?: boolean, message?: string, cpHash?: string, origin?: string }}
 */
export function checkCheckpointGitRegression(root) {
  const cpHash = readCheckpointGitHead(root);
  if (!cpHash) return { ok: true };
  const origin = gitOriginMainShort(root);
  if (!origin) return { ok: true };
  if (cpHash === origin) return { ok: true };
  // #S-CHKPT-PARENT-01: tip^1 は sync subject でなくても正常（1世代ラグ）
  const parentEarlyShort = gitOriginMainParentShort(root);
  if (parentEarlyShort && parentEarlyShort === cpHash) {
    return { ok: true, offByOne: true, cpHash, origin };
  }
  const anc = spawnSync('git', ['merge-base', '--is-ancestor', cpHash, origin], { cwd: root });
  if (anc.status === 0) {
    return {
      ok: false,
      regression: true,
      cpHash,
      origin,
      message:
        `checkpoint Git \`${cpHash}\` が origin/main \`${origin}\` より古い — \`npm run cio:checkpoint:git-heal -- --commit\` または close-git で再 sync（手動 **Git** 行編集禁止 / S-CLOSE-01）`,
    };
  }
  // S-CHKPT-CLOSE-01: 先祖でも off-by-one でもない = 陳腐化
  return {
    ok: false,
    regression: true,
    cpHash,
    origin,
    diverged: true,
    message:
      `checkpoint Git \`${cpHash}\` が origin/main \`${origin}\` と不一致（先祖でもない）— \`npm run cio:checkpoint:git-heal -- --commit\` で再 sync（S-CHKPT-CLOSE-01）`,
  };
}

/**
 * 作業ツリーの **Git** 行を是正（commit はしない）。
 * @param {string} root
 * @param {{ target?: 'head' | 'origin', suffix?: string }} [opts]
 * @returns {{ healed: boolean, skipped: boolean, hash: string|null, before: string|null, reason?: string }}
 */
export function healCheckpointGitWorktree(root, { target = 'head', suffix = 'push 済' } = {}) {
  const before = readCheckpointGitHead(root);
  const reg = checkCheckpointGitRegression(root);
  if (reg.ok) {
    return { healed: false, skipped: true, hash: before, before, reason: reg.offByOne ? 'off-by-one-ok' : 'exact-or-missing' };
  }
  const hash =
    target === 'origin' ? gitOriginMainShort(root) || gitShortHead(root) : gitShortHead(root) || gitOriginMainShort(root);
  if (!hash) {
    return { healed: false, skipped: false, hash: null, before, reason: 'no-hash' };
  }
  const changed = updateCheckpointGitHead(root, { hash, suffix });
  return { healed: changed, skipped: false, hash, before, reason: changed ? 'stamped' : 'unchanged' };
}

/**
 * S-CHKPT-CLOSE-01 — checkpoint **Git** 行が origin/main と完全一致するか（終端検証用）
 * @returns {{ ok: boolean, skip?: boolean, cpHash?: string, origin?: string, message?: string }}
 */
export function checkCheckpointGitExactMatch(root) {
  const cpHash = readCheckpointGitHead(root);
  if (!cpHash) return { ok: true, skip: true };
  const origin = gitOriginMainShort(root);
  if (!origin) return { ok: true, skip: true };
  if (cpHash === origin) return { ok: true, cpHash, origin };
  return {
    ok: false,
    cpHash,
    origin,
    message:
      `checkpoint Git \`${cpHash}\` ≠ origin/main \`${origin}\` — \`npm run cio:session:close-git\` 終端 stamp を再実行（S-CHKPT-CLOSE-01）`,
  };
}
