/**
 * 3重インターロック型コンテキスト強制解体 — 共有定数・bridge I/O
 */
import fs from 'node:fs';
import path from 'node:path';
import { lastFailuresArrayOk } from './cio-bridge-last-failures.mjs';

export const BRIDGE_REL = 'docs/handoff/latest-session-bridge.json';
export const STATE_REL = 'logs/cio-session-dissolution/state.json';
export const MAX_TURNS = 15;
export const MAX_TOKEN_ESTIMATE = 40_000;
export const MAX_DIFF_LOOP = 3;
export const MAX_ZOMBIE_RETRY = 3;

export function repoRoot(fromUrl) {
  return path.resolve(path.dirname(fromUrl), '../..');
}

export function bridgePath(root) {
  return path.join(root, BRIDGE_REL);
}

export function statePath(root) {
  return path.join(root, STATE_REL);
}

export function readJson(p, fallback = null) {
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    /* noop */
  }
  return fallback;
}

export function writeJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function defaultState() {
  return {
    turnCount: 0,
    exported: false,
    diffLoops: {},
    retryCounts: {},
    updatedAt: new Date().toISOString(),
  };
}

export function loadState(root) {
  return { ...defaultState(), ...readJson(statePath(root), {}) };
}

export function saveState(root, state) {
  state.updatedAt = new Date().toISOString();
  writeJson(statePath(root), state);
}

export function loadBridge(root) {
  return readJson(bridgePath(root));
}

export function bridgeSchemaOk(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return (
    typeof obj.exportedAt === 'string' &&
    typeof obj.gitHead === 'string' &&
    Array.isArray(obj.nextFiles) &&
    typeof obj.nextTask === 'string' &&
    lastFailuresArrayOk(obj.lastFailures)
  );
}
