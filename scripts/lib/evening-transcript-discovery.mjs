import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function cursorTranscriptRoots(env = process.env) {
  const roots = [];
  if (env.CURSOR_AGENT_TRANSCRIPTS_DIR) roots.push(path.resolve(env.CURSOR_AGENT_TRANSCRIPTS_DIR));
  roots.push(path.join(os.homedir(), '.cursor', 'projects'));
  return [...new Set(roots)];
}

export function discoverRecentTranscripts({
  roots = cursorTranscriptRoots(),
  sinceMs,
  limit = 5,
} = {}) {
  const found = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const stack = [root];
    while (stack.length) {
      const dir = stack.pop();
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
          continue;
        }
        if (!entry.isFile() || !entry.name.endsWith('.jsonl')) continue;
        const stat = fs.statSync(fullPath);
        if (Number.isFinite(sinceMs) && stat.mtimeMs < sinceMs) continue;
        found.push({ path: fullPath, bytes: stat.size, mtimeMs: stat.mtimeMs });
      }
    }
  }
  return found.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, limit);
}
