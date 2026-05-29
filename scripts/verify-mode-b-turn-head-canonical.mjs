#!/usr/bin/env node
/**
 * .mdc 先頭4行 discipline + AI-KERNEL 4要素構造検証
 * @see .cursor/rules/mode-b-canonical.mdc
 * @see data/ai-kernel-mdc-manifest.json
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULES_DIR = path.join(root, '.cursor', 'rules');
const MANIFEST = path.join(root, 'data', 'ai-kernel-mdc-manifest.json');

const TURN_HEAD_EXEMPT = new Set(['mode-b-canonical.mdc', 'constitution.mdc']);
const REF = /mode-b-canonical\.mdc/;
const TURN_HEAD_TOPIC =
  /(?:毎ターン|先頭\s*4\s*行|§1-2-3\s*ティア|\[§1-2-3\s*ティア判定|🎖️\s*本セッション割当)/;

const FENCED_FULL_TEMPLATE =
  /```[\s\S]{0,800}?\[§1-2-3\s*ティア判定:[^\n]+\n【適用憲法】[^\n]+\n\[🎖️\s*本セッション割当\][^\n]+\n\[ルール確認\][^\n]*\n```/;

const KERNEL_HEADINGS = {
  premise: /##\s*前提条件/,
  procedure: /##\s*実行手順/,
  forbidden: /##\s*禁止事項/,
  exit: /##\s*判定コード/,
};

function listMdc() {
  return fs.readdirSync(RULES_DIR).filter((n) => n.endsWith('.mdc'));
}

function bodyAfterFrontmatter(raw) {
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return m ? m[1] : raw;
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const required = new Set(manifest.required || []);
  const exempt = new Set(manifest.exempt || []);
  const issues = [];

  for (const name of listMdc()) {
    const rel = `.cursor/rules/${name}`;
    const raw = fs.readFileSync(path.join(RULES_DIR, name), 'utf8');
    const content = bodyAfterFrontmatter(raw);

    if (!TURN_HEAD_EXEMPT.has(name)) {
      if (FENCED_FULL_TEMPLATE.test(raw)) {
        issues.push({ file: rel, id: 'DUPLICATE_FENCED_TEMPLATE', hint: '4行テンプレをコピーせず mode-b-canonical.mdc 参照のみ' });
      }
      if (TURN_HEAD_TOPIC.test(raw) && !REF.test(raw)) {
        issues.push({
          file: rel,
          id: 'MISSING_MODE_B_CANONICAL_REF',
          hint: '先頭4行・ティア言及あり → mode-b-canonical.mdc 参照行を追加',
        });
      }
    }

    if (required.has(name)) {
      for (const [key, re] of Object.entries(KERNEL_HEADINGS)) {
        if (!re.test(content)) {
          issues.push({
            file: rel,
            id: 'AI_KERNEL_MISSING_HEADING',
            hint: `ルールの記述が冗長です。4要素に構造化してください（欠落: ${key} → ## 前提条件/実行手順/禁止事項/判定コード）`,
          });
        }
      }
    } else if (!exempt.has(name)) {
      issues.push({
        file: rel,
        id: 'AI_KERNEL_UNCLASSIFIED',
        hint: 'data/ai-kernel-mdc-manifest.json の required または exempt に登録すること',
      });
    }
  }

  if (issues.length === 0) {
    console.log('[verify-mode-b-turn-head-canonical] OK (.mdc turn-head + AI-KERNEL discipline)');
    process.exit(0);
  }

  console.error('[verify-mode-b-turn-head-canonical] NG', issues.length);
  for (const i of issues) console.error(`  - ${i.file} [${i.id}] ${i.hint}`);
  process.exit(1);
}

main();
