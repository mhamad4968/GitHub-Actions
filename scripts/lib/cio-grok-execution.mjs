/**
 * Grok 4.5 L2b — 実行契約スタンプ・C モード回数・失敗記録
 * @see docs/runbooks/cio-grok-execution-loop.md
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const STATE_REL = 'logs/cio-grok-execution/state.json';
export const STAMPS_DIR = 'logs/cio-grok-execution/stamps';
export const MAX_C_PER_SESSION = 2;
export const MAX_SAME_ERROR = 3;
export const MAX_TOOL_CALLS = 15;

const FORBIDDEN_DIFF_PATTERNS = [
  { re: /\bgit\s+push\b/i, label: 'git push' },
  { re: /\bdeploy:[\w-]+/i, label: 'deploy:* npm script' },
  { re: /\bcurl\b[^;\n]*-X\s*(PUT|POST|DELETE)\b/i, label: 'curl PUT/POST/DELETE' },
  { re: /\bkintone\b[^;\n]*(PUT|POST|DELETE)\b/i, label: 'kintone REST write' },
  { re: /\bcybozu\.com\/k\/\d+\/record\.json\b/i, label: 'kintone record REST' },
];

export function validateDoneWhen(doneWhen) {
  const s = String(doneWhen || '').trim();
  if (!/^npm run [a-z0-9:_-]+/i.test(s)) {
    return { ok: false, reason: 'doneWhen は "npm run <script>" 形式必須' };
  }
  if (/[;&|]/.test(s)) {
    return { ok: false, reason: 'doneWhen にシェル連結（; & |）禁止' };
  }
  return { ok: true };
}

export function validateInScope(inScope) {
  const s = String(inScope || '').trim();
  if (!s) return { ok: false, reason: 'inScope が空' };
  if (/[*?]/.test(s) || /\.\./.test(s)) {
    return { ok: false, reason: 'inScope にワイルドカード・.. 禁止' };
  }
  return { ok: true };
}

export function hashContract({ mode, goal, doneWhen, inScope }) {
  const payload = JSON.stringify({
    mode: mode || 'B',
    goal: goal || '',
    doneWhen: doneWhen || '',
    inScope: inScope || '',
  });
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

function gitDiff(root) {
  const r = spawnSync('git', ['diff', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  const staged = spawnSync('git', ['diff', '--cached'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  return `${r.stdout || ''}\n${staged.stdout || ''}`;
}

export function scanDiffForForbidden(root) {
  const diff = gitDiff(root);
  const hits = [];
  if (!diff.trim()) return { ok: true, hits };
  for (const line of diff.split(/\r?\n/)) {
    if (!line.startsWith('+') || line.startsWith('+++')) continue;
    const body = line.slice(1);
    for (const { re, label } of FORBIDDEN_DIFF_PATTERNS) {
      if (re.test(body)) hits.push({ label, line: body.trim().slice(0, 120) });
    }
  }
  return { ok: hits.length === 0, hits };
}

export function repoRoot(fromUrl) {
  return path.resolve(path.dirname(fromUrl), '../..');
}

export function statePath(root) {
  return path.join(root, STATE_REL);
}

export function defaultState() {
  return {
    sessionCRuns: 0,
    lastMode: null,
    lastGoal: null,
    lastDoneWhen: null,
    lastInScope: null,
    lastContractHash: null,
    lastFailReason: null,
    composerFirstDiffDone: false,
    section5038Done: false,
    history: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadState(root) {
  try {
    const p = statePath(root);
    if (fs.existsSync(p)) {
      return { ...defaultState(), ...JSON.parse(fs.readFileSync(p, 'utf8')) };
    }
  } catch {
    /* noop */
  }
  return defaultState();
}

export function saveState(root, state) {
  state.updatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(statePath(root)), { recursive: true });
  fs.writeFileSync(statePath(root), JSON.stringify(state, null, 2) + '\n', 'utf8');
}

export function stampPath(root, id) {
  return path.join(root, STAMPS_DIR, `${id}.json`);
}

export function writeStamp(root, payload) {
  const id = `${Date.now()}`;
  const full = {
    id,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  fs.mkdirSync(path.join(root, STAMPS_DIR), { recursive: true });
  fs.writeFileSync(stampPath(root, id), JSON.stringify(full, null, 2) + '\n', 'utf8');
  return full;
}

export function recordStamp(root, { mode, goal, doneWhen, inScope, note = '' }) {
  const state = loadState(root);
  const contractHash = hashContract({ mode, goal, doneWhen, inScope });
  const stamp = writeStamp(root, {
    mode: mode || 'B',
    goal: goal || '',
    doneWhen: doneWhen || '',
    inScope: inScope || '',
    note,
    contractHash,
  });
  state.lastMode = stamp.mode;
  state.lastGoal = stamp.goal;
  state.lastDoneWhen = stamp.doneWhen;
  state.lastInScope = stamp.inScope;
  state.lastContractHash = stamp.contractHash;
  if (stamp.mode === 'C') {
    state.sessionCRuns += 1;
    state.history.push({ t: stamp.createdAt, event: 'c-start', goal: stamp.goal });
  }
  saveState(root, state);
  return { state, stamp };
}

export function recordSuccess(root) {
  const state = defaultState();
  saveState(root, state);
  return state;
}

export function recordFail(root, reason = '') {
  const state = loadState(root);
  state.lastFailReason = String(reason).slice(0, 2000);
  state.history.push({ t: state.updatedAt, event: 'fail', reason: state.lastFailReason });
  saveState(root, state);
  return state;
}

export function cReadyChecklist(state) {
  const doneOk = validateDoneWhen(state.lastDoneWhen).ok;
  const scopeOk = validateInScope(state.lastInScope || '').ok;
  const items = [
    { id: 'C1', label: '§50-3-8 実施済み or 非該当理由', ok: state.section5038Done },
    { id: 'C2', label: 'Composer 初回 Diff 済み', ok: state.composerFirstDiffDone },
    { id: 'C3', label: `Grok C セッション回数 < ${MAX_C_PER_SESSION}`, ok: state.sessionCRuns < MAX_C_PER_SESSION },
    { id: 'C4', label: 'doneWhen が npm run 形式（stamp 済み）', ok: doneOk },
    { id: 'C5', label: 'inScope パス固定（stamp 済み）', ok: scopeOk },
    { id: 'C6', label: '契約 contractHash 記録済み', ok: Boolean(state.lastContractHash) },
  ];
  return items;
}

export function formatCReadyReport(state) {
  const items = cReadyChecklist(state);
  const lines = ['[cio:grok:execution-guard] C-ready checklist:', ''];
  for (const it of items) {
    lines.push(`  ${it.ok ? '✅' : '❌'} ${it.id}: ${it.label}`);
  }
  lines.push('');
  lines.push(`  sessionCRuns: ${state.sessionCRuns}/${MAX_C_PER_SESSION}`);
  if (state.lastMode) lines.push(`  lastMode: ${state.lastMode} goal=${state.lastGoal || '(none)'}`);
  return lines.join('\n');
}
