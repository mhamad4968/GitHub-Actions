#!/usr/bin/env node
/**
 * verify-thin-rule-messaging.mjs — 薄型憲法メッセージ整合（本文の誤表記検出）
 *
 * 方針: `alwaysApply: true` は `.cursor/rules/cio-constitution.mdc` の frontmatter のみ。
 * 他 `.mdc` や索引を「常時 true」「alwaysApply: true と同一」と書くと AI が誤読するため、
 * 代表パス（本文）からその表現を排除する。
 *
 * @see .cursor/rules/cio-constitution.mdc（薄型憲法スタック）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rulesDir = path.join(root, '.cursor/rules');
const rulesIndex = path.join(root, 'RULES-INDEX.md');

function fail(msg) {
  console.error(`[verify-thin-rule-messaging] ❌ ${msg}`);
  process.exit(2);
}

/** @param {string} raw */
function bodyAfterFirstFrontmatter(raw) {
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return m ? m[1] : raw;
}

/**
 * @param {string} rel
 * @param {string} body
 * @returns {{ line: number; text: string }[]}
 */
function scanBody(rel, body) {
  const lines = body.split(/\r?\n/);
  /** @type {{ line: number; text: string }[]} */
  const hits = [];
  const reTrue = /alwaysApply:\s*true/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!reTrue.test(line)) continue;

    if (/cio-constitution\.mdc/.test(line)) continue;
    if (/verify-ci-rule-integrity/.test(line)) continue;
    if (/唯一の[`']?alwaysApply:\s*true/.test(line)) continue;
    if (/常時\s*true\s*核は\s*`?cio-constitution/.test(line)) continue;
    if (/常時\s*true\s*枠は\s*`?cio-constitution/.test(line)) continue;
    if (/`alwaysApply:\s*true`\s*枠は/.test(line) && /cio-constitution/.test(line)) continue;
    if (rel.includes('cio-constitution.mdc') && /本ファイルのみ/.test(line)) continue;
    if (rel.includes('cio-constitution.mdc') && /^##\s*`alwaysApply:\s*true`/.test(line.trim())) continue;

    hits.push({ line: i + 1, text: line.trim().slice(0, 220) });
  }
  return hits;
}

if (!fs.existsSync(rulesDir)) fail(`missing ${rulesDir}`);

const allHits = [];

for (const f of fs.readdirSync(rulesDir).filter((x) => x.endsWith('.mdc'))) {
  if (f === 'constitution.mdc') continue;
  const rel = path.join('.cursor/rules', f);
  const raw = fs.readFileSync(path.join(root, rel), 'utf8');
  const body = bodyAfterFirstFrontmatter(raw);
  const h = scanBody(rel, body);
  for (const x of h) allHits.push({ file: rel, ...x });
}

if (fs.existsSync(rulesIndex)) {
  const raw = fs.readFileSync(rulesIndex, 'utf8');
  const h = scanBody('RULES-INDEX.md', raw);
  for (const x of h) allHits.push({ file: 'RULES-INDEX.md', ...x });
}

if (allHits.length) {
  const msg = allHits
    .map((h) => `  ${h.file}:${h.line}: ${h.text}`)
    .join('\n');
  fail(
    `本文に「alwaysApply: true」があり、cio-constitution 以外を常時 true と誤読しうる表記が残っています（薄型憲法と矛盾）。\n${msg}\n\n修正後: npm run rules:regenerate-constitution（網羅ミラー追随）`,
  );
}

console.log('[verify-thin-rule-messaging] ✅ OK（分割 .mdc / RULES-INDEX 本文に誤った alwaysApply:true 表記なし）');
process.exit(0);
