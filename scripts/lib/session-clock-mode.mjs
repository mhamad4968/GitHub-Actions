/**
 * 壁時計起動方式 — auto（hook）| manual-desktop（Desktop bat）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_WATCH_MS } from './session-clock-core.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRootFromLib = path.resolve(here, '../..');

export function sessionClockModePath(root = repoRootFromLib) {
  return path.join(root, '.cio', 'session-clock-mode.json');
}

/** @returns {{ mode: 'auto'|'manual-desktop', watchMs: number, openBrowserOnStart: boolean, note?: string }} */
export function readSessionClockMode(root = repoRootFromLib) {
  const fallback = {
    mode: 'auto',
    watchMs: DEFAULT_WATCH_MS,
    openBrowserOnStart: true,
  };
  try {
    const p = sessionClockModePath(root);
    if (!fs.existsSync(p)) return fallback;
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    const mode = j.mode === 'manual-desktop' ? 'manual-desktop' : 'auto';
    const watchMs = Math.max(
      60_000,
      Number(j.watchMs || process.env.SESSION_CLOCK_WATCH_MS || DEFAULT_WATCH_MS),
    );
    return {
      mode,
      watchMs,
      openBrowserOnStart: j.openBrowserOnStart !== false,
      note: typeof j.note === 'string' ? j.note : undefined,
    };
  } catch {
    return fallback;
  }
}

export function isManualDesktopMode(root = repoRootFromLib) {
  return readSessionClockMode(root).mode === 'manual-desktop';
}
