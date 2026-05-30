/**
 * 方針1 — Composer 2.5 自律エスカレーション（DeepSeek → Self-Heal → CIO）
 */
import fs from 'node:fs';
import path from 'node:path';

export const STATE_REL = 'logs/cio-composer-escalation/state.json';
export const MAX_CONSECUTIVE_FAIL = 2;
export const MAX_SELF_HEAL = 3;

export function repoRoot(fromUrl) {
  return path.resolve(path.dirname(fromUrl), '../..');
}

export function statePath(root) {
  return path.join(root, STATE_REL);
}

export function defaultState() {
  return {
    consecutiveFailures: 0,
    selfHealAttempts: 0,
    locked: false,
    lockReason: null,
    lastCmd: null,
    lastLog: null,
    deepSeekPrompted: false,
    cioEscalated: false,
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

export function recordFailure(root, cmd, logSnippet = '') {
  const state = loadState(root);
  state.consecutiveFailures += 1;
  state.lastCmd = cmd;
  state.lastLog = String(logSnippet).slice(0, 4000);
  state.history.push({ t: state.updatedAt, event: 'fail', cmd });
  if (state.consecutiveFailures >= MAX_CONSECUTIVE_FAIL) {
    state.locked = true;
    state.lockReason = 'deepseek-escalation';
  }
  saveState(root, state);
  return state;
}

export function recordSelfHealAttempt(root) {
  const state = loadState(root);
  state.selfHealAttempts += 1;
  state.history.push({ t: state.updatedAt, event: 'self-heal', n: state.selfHealAttempts });
  if (state.selfHealAttempts >= MAX_SELF_HEAL) {
    state.locked = true;
    state.lockReason = 'cio-escalation';
    state.cioEscalated = true;
  }
  saveState(root, state);
  return state;
}

export function recordSuccess(root, cmd = null) {
  const state = defaultState();
  if (cmd) state.lastCmd = cmd;
  saveState(root, state);
  return state;
}

export function deepSeekPromptBlock(state) {
  return [
    '【Composer エスカレーション — §50-3-8 強制再実行】',
    `失敗コマンド: ${state.lastCmd || '(unknown)'}`,
    'エラーログ（末尾）:',
    '```',
    (state.lastLog || '(empty)').slice(-1500),
    '```',
    '要求: 盲点3点 + 修正ヒント（Composer 2.5 向け・具体）+ 突合3行',
  ].join('\n');
}
