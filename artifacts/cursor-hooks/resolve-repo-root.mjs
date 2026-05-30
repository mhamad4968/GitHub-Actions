/**
 * User-global hook delegate 用 — kintone-ai-lab ルート解決
 * CURSOR_PROJECT_DIR が temp ワークスペースのときも autopilot を見つける
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const MARKER = path.join('.cursor', 'hooks', 'session-start-autopilot.mjs');

export function resolveKintoneAiLabRoot() {
  const seeds = [
    process.env.CURSOR_PROJECT_DIR,
    process.env.CLAUDE_PROJECT_DIR,
    process.cwd(),
  ].filter(Boolean);

  let dir = process.cwd();
  for (let i = 0; i < 12; i += 1) {
    seeds.push(dir);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  seeds.push(path.join(os.homedir(), 'kintone-ai-lab'));

  const seen = new Set();
  for (const root of seeds) {
    const norm = path.resolve(root);
    if (seen.has(norm)) continue;
    seen.add(norm);
    if (fs.existsSync(path.join(norm, MARKER))) return norm;
  }
  return '';
}
