#!/usr/bin/env node
/**
 * R736-CAL-01 — 736-july-2026-schedule.md 必須行の存在検査（誤削除防止）
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'docs/runbooks/736-july-2026-schedule.md');
const text = readFileSync(file, 'utf8');

const required = [
  { id: 'PH1b-7/11', pattern: /7\/11.*PH1b|PH1b.*7\/11/ },
  { id: 'PH1a', pattern: /PH1a/ },
  { id: 'Phase0c', pattern: /Phase 0c/ },
  { id: 'SKYSEA-7月', pattern: /SKYSEA.*着手なし|着手なし.*SKYSEA/ },
];

const missing = required.filter((r) => !r.pattern.test(text));
if (missing.length) {
  console.error(`[verify:736-july-schedule] NG 必須行欠落 ${missing.length} 件`);
  for (const m of missing) console.error(`  - ${m.id}`);
  process.exit(1);
}
console.log('[verify:736-july-schedule] OK — 必須行あり');
