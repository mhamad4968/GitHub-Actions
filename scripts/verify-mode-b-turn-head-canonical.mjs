#!/usr/bin/env node
/**
 * タスク3 — .mdc の先頭4行テンプレ重複禁止 / mode-b-canonical.mdc 参照義務
 * @see .cursor/rules/mode-b-canonical.mdc
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULES_DIR = path.join(root, '.cursor', 'rules');

const EXEMPT = new Set(['mode-b-canonical.mdc', 'constitution.mdc']);
const REF = /mode-b-canonical\.mdc/;
const TURN_HEAD_TOPIC =
  /(?:毎ターン|先頭\s*4\s*行|§1-2-3\s*ティア|\[§1-2-3\s*ティア判定|🎖️\s*本セッション割当)/;

/** mode-b-canonical と同一の4行コードフェンス（重複コピー） */
const FENCED_FULL_TEMPLATE =
  /```[\s\S]{0,800}?\[§1-2-3\s*ティア判定:[^\n]+\n【適用憲法】[^\n]+\n\[🎖️\s*本セッション割当\][^\n]+\n\[ルール確認\][^\n]*\n```/;

function listMdc() {
  return fs.readdirSync(RULES_DIR).filter((n) => n.endsWith('.mdc'));
}

function main() {
  const issues = [];
  for (const name of listMdc()) {
    const rel = `.cursor/rules/${name}`;
    const content = fs.readFileSync(path.join(RULES_DIR, name), 'utf8');

    if (EXEMPT.has(name)) continue;

    if (FENCED_FULL_TEMPLATE.test(content)) {
      issues.push({ file: rel, id: 'DUPLICATE_FENCED_TEMPLATE', hint: '4行テンプレをコピーせず mode-b-canonical.mdc 参照のみ' });
    }

    if (TURN_HEAD_TOPIC.test(content) && !REF.test(content)) {
      issues.push({
        file: rel,
        id: 'MISSING_MODE_B_CANONICAL_REF',
        hint: '先頭4行・ティア言及あり → `mode-b-canonical.mdc` 参照行を追加',
      });
    }
  }

  if (issues.length === 0) {
    console.log('[verify-mode-b-turn-head-canonical] OK (.mdc turn-head discipline)');
    process.exit(0);
  }

  console.error('[verify-mode-b-turn-head-canonical] NG', issues.length);
  for (const i of issues) console.error(`  - ${i.file} [${i.id}] ${i.hint}`);
  process.exit(1);
}

main();
