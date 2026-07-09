/**
 * checkpoint / handoff / bridge テンプレ — 共有 I/O と検証
 * @see data/cio-handoff-template.json
 * @see docs/runbooks/checkpoint-handoff-template-v2.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  CHECKPOINT_REL,
  readCheckpointGitLine,
  readCheckpointNextTask,
  readCheckpointPreambleLineCount,
} from './cio-checkpoint-read.mjs';

export const TEMPLATE_MANIFEST_REL = 'data/cio-handoff-template.json';
export const HANDOFF_LOG_REL = 'chat-sessions/handoff-log.md';

const HANDOFF_HEADING_RE = /^###\s+(\d{4}-\d{2}-\d{2}.+)$/gm;

function gitHeadShort(root) {
  const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' });
  return r.status === 0 ? String(r.stdout).trim() : 'unknown';
}

/** @returns {string|null} */
function readHandoffField(block, key) {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = block.match(new RegExp(`${esc}\\s*([^\\n]+)`));
  return m ? m[1].trim() : null;
}

/** @returns {{ headings: RegExpMatchArray[], text: string, path: string }|null} */
function loadHandoffLog(root) {
  const p = path.join(root, HANDOFF_LOG_REL);
  if (!fs.existsSync(p)) return null;
  const text = fs.readFileSync(p, 'utf8');
  const headings = [...text.matchAll(HANDOFF_HEADING_RE)];
  return { headings, text, path: p };
}

/**
 * 末尾 ### ブロックに必須キーが欠けていれば checkpoint / 直前完全ブロック / git から補完
 * （夕反省 GO スタンプ等の短い追記で cold-start が落ちる再発防止）
 * @returns {{ ok: boolean, repaired: boolean, filled: string[], reason?: string }}
 */
export function repairHandoffLatestBlock(root, { dryRun = false } = {}) {
  const manifest = loadHandoffTemplate(root);
  const loaded = loadHandoffLog(root);
  if (!loaded) {
    return { ok: false, repaired: false, filled: [], reason: `missing ${HANDOFF_LOG_REL}` };
  }

  const { headings, text, path: p } = loaded;
  const requiredKeys = manifest.handoffBlock?.requiredKeys || [];
  if (headings.length === 0) {
    return { ok: false, repaired: false, filled: [], reason: 'handoff-log: no ### blocks' };
  }

  const lastHeading = headings[headings.length - 1][0];
  const lastIdx = text.lastIndexOf(lastHeading);
  const tail = text.slice(lastIdx);
  const missing = requiredKeys.filter((k) => !tail.includes(k));
  if (missing.length === 0) {
    return { ok: true, repaired: false, filled: [] };
  }

  /** @type {Record<string, string>} */
  const prev = {};
  for (let i = headings.length - 2; i >= 0; i--) {
    const start = text.indexOf(headings[i][0]);
    const end = i + 1 < headings.length ? text.indexOf(headings[i + 1][0], start + 1) : lastIdx;
    const block = text.slice(start, end);
    if (requiredKeys.every((k) => block.includes(k))) {
      for (const k of requiredKeys) {
        const v = readHandoffField(block, k);
        if (v) prev[k] = v;
      }
      break;
    }
  }

  const cpNext = readCheckpointNextTask(root);
  const cpGit = readCheckpointGitLine(root);
  const isGoStamp = /浜田 GO/i.test(tail) && /実装完了|§3/i.test(tail);

  /** @type {string[]} */
  const insertLines = [];
  if (missing.includes('**次の1手**:')) {
    insertLines.push(`**次の1手**: ${cpNext || prev['**次の1手**:'] || '(checkpoint と同期)'}`);
  }
  if (missing.includes('**Git**:')) {
    insertLines.push(
      `**Git**: ${cpGit || prev['**Git**:'] || `\`${gitHeadShort(root)}\` — (auto-repair)`}`,
    );
  }
  if (missing.includes('**GO待ち**:')) {
    insertLines.push(`**GO待ち**: ${isGoStamp ? 'なし' : prev['**GO待ち**:'] || 'なし'}`);
  }

  const insertText = `\n\n${insertLines.join('\n\n')}\n`;
  const dashIdx = tail.search(/\n---\s*$/);
  const newTail =
    dashIdx >= 0
      ? `${tail.slice(0, dashIdx)}${insertText}${tail.slice(dashIdx)}`
      : `${tail.replace(/\s*$/, '')}${insertText}\n---\n`;
  const newText = text.slice(0, lastIdx) + newTail;

  if (!dryRun) {
    fs.writeFileSync(p, newText, 'utf8');
  }

  return { ok: true, repaired: true, filled: missing };
}

/** テンプレ正本から bootstrap ブロック（## セッション切替後…）を抽出 */
function extractBootstrapCanonical(root) {
  const tpl = fs.readFileSync(
    resolveTemplatePath(root, 'checkpoint-freeze-zone.template.md'),
    'utf8',
  );
  const codeMatch = tpl.match(/```markdown\r?\n([\s\S]*?)```/);
  if (!codeMatch) {
    throw new Error('checkpoint-freeze-zone.template.md: missing ```markdown block');
  }
  const inner = codeMatch[1];
  const heading = '## セッション切替後の自律復元';
  const bootIdx = inner.indexOf(heading);
  if (bootIdx < 0) {
    throw new Error('checkpoint-freeze-zone.template.md: missing bootstrap heading');
  }
  return inner.slice(bootIdx).trimEnd();
}

/**
 * checkpoint 凍結ゾーン末尾の bootstrap ブロックをテンプレ正本で復元
 * （手動 CLOSE で mandatory-read-gate 行削除 → preamble 2800字 NG 再発防止 / S2）
 * @returns {{ ok: boolean, repaired: boolean, filled: string[], reason?: string }}
 */
export function repairCheckpointBootstrapBlock(root, { dryRun = false } = {}) {
  const cpPath = path.join(root, CHECKPOINT_REL);
  if (!fs.existsSync(cpPath)) {
    return { ok: false, repaired: false, filled: [], reason: `missing ${CHECKPOINT_REL}` };
  }
  const full = fs.readFileSync(cpPath, 'utf8');
  const rollSplit = full.split(/^## \d{4}-\d{2}-\d{2}/m);
  const preamble = rollSplit[0];
  const rollup = rollSplit.length > 1 ? full.slice(preamble.length) : '';

  const needsRepair =
    !preamble.includes('## セッション切替後の自律復元') ||
    !preamble.includes('mandatory-read-gate.mjs') ||
    !preamble.includes('verify:session-close-git-warn');

  if (!needsRepair) {
    return { ok: true, repaired: false, filled: [] };
  }

  const canonical = extractBootstrapCanonical(root);
  const heading = '## セッション切替後の自律復元';
  const bootIdx = preamble.indexOf(heading);
  const newPreamble =
    bootIdx >= 0
      ? `${preamble.slice(0, bootIdx).trimEnd()}\n\n${canonical}\n`
      : `${preamble.trimEnd()}\n\n${canonical}\n`;
  const newFull = newPreamble + rollup;

  if (!dryRun) {
    fs.writeFileSync(cpPath, newFull, 'utf8');
  }

  return { ok: true, repaired: true, filled: ['bootstrap-block'] };
}

/** @returns {object} */
export function loadHandoffTemplate(root) {
  const p = path.join(root, TEMPLATE_MANIFEST_REL);
  if (!fs.existsSync(p)) {
    throw new Error(`missing ${TEMPLATE_MANIFEST_REL}`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** テンプレートファイル解決 — manifest.templateDir 相対、フォールバックなし */
export function resolveTemplatePath(root, filename) {
  const manifest = loadHandoffTemplate(root);
  const dir = manifest.templateDir || 'chat-sessions/templates';
  const abs = path.join(root, dir, filename);
  if (!fs.existsSync(abs)) {
    throw new Error(`template missing: ${path.join(dir, filename)}`);
  }
  return abs;
}

export function getDefaultBridgeNextFiles(root) {
  const manifest = loadHandoffTemplate(root);
  return [...(manifest.bridgeNextFiles || [])];
}

/** @returns {{ ok: boolean, issues: string[] }} */
export function validateCheckpointFreezeZone(root) {
  const manifest = loadHandoffTemplate(root);
  const p = path.join(root, CHECKPOINT_REL);
  const issues = [];
  if (!fs.existsSync(p)) {
    return { ok: false, issues: [`missing ${CHECKPOINT_REL}`] };
  }
  const preamble = fs.readFileSync(p, 'utf8').split('\n');
  const sectionIdx = preamble.findIndex((l, i) => i > 0 && /^## \d{4}-\d{2}-\d{2}/.test(l));
  const head = (sectionIdx < 0 ? preamble : preamble.slice(0, sectionIdx)).join('\n');

  for (const field of manifest.freezeZone?.requiredFields || []) {
    if (!head.includes(field)) issues.push(`freeze missing field: ${field}`);
  }
  for (const heading of manifest.freezeZone?.requiredHeadings || []) {
    if (!head.includes(heading)) issues.push(`freeze missing heading: ${heading}`);
  }
  const lines = readCheckpointPreambleLineCount(root);
  const max = manifest.freezeZone?.maxLines ?? 50;
  if (lines > max + 15) {
    issues.push(`freeze preamble ${lines} lines > ${max + 15} — rollup 必須`);
  } else if (lines > max) {
    issues.push(`WARN freeze preamble ${lines} lines > ${max}`);
  }
  if (!readCheckpointNextTask(root)) {
    issues.push('freeze missing parseable **次の1手**');
  }
  return { ok: issues.filter((i) => !i.startsWith('WARN')).length === 0, issues };
}

/** handoff-log 末尾ブロック検証 */
export function validateHandoffLatestBlock(root) {
  const manifest = loadHandoffTemplate(root);
  const loaded = loadHandoffLog(root);
  const issues = [];
  if (!loaded) {
    return { ok: false, issues: [`missing ${HANDOFF_LOG_REL}`] };
  }
  const { headings, text } = loaded;
  if (headings.length === 0) {
    issues.push('handoff-log: no ### YYYY-MM-DD blocks');
    return { ok: false, issues };
  }
  const lastIdx = text.lastIndexOf(headings[headings.length - 1][0]);
  const tail = text.slice(lastIdx, lastIdx + 2500);
  for (const key of manifest.handoffBlock?.requiredKeys || []) {
    if (!tail.includes(key)) issues.push(`handoff latest block missing: ${key}`);
  }
  const cpTask = readCheckpointNextTask(root);
  if (cpTask && tail.includes('**次の1手**:')) {
    const m = tail.match(/\*\*次の1手\*\*:\s*([^\n]+)/);
    if (m) {
      const norm = (s) => String(s).replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
      if (norm(m[1]) !== norm(cpTask) && norm(m[1]).slice(0, 40) !== norm(cpTask).slice(0, 40)) {
        issues.push('WARN handoff 次の1手 ≠ checkpoint（要同期）');
      }
    }
  }
  return { ok: issues.filter((i) => !i.startsWith('WARN')).length === 0, issues };
}

/** @returns {{ ok: boolean, issues: string[] }} */
export function validateHandoffTemplate(root, { strict = false } = {}) {
  const manifest = loadHandoffTemplate(root);
  const issues = [];
  if (!manifest.version) issues.push('manifest missing version');

  for (const fname of [
    'checkpoint-freeze-zone.template.md',
    'handoff-log-block.template.md',
    'HANDOFF-HUMAN-block.template.txt',
  ]) {
    try {
      resolveTemplatePath(root, fname);
    } catch (e) {
      issues.push(String(e.message));
    }
  }

  const fz = validateCheckpointFreezeZone(root);
  issues.push(...fz.issues);

  const hb = validateHandoffLatestBlock(root);
  issues.push(...hb.issues);

  const hard = issues.filter((i) => !i.startsWith('WARN'));
  if (strict && issues.some((i) => i.startsWith('WARN'))) {
    return { ok: false, issues };
  }
  return { ok: hard.length === 0, issues };
}

/**
 * handoff-log 末尾に標準ブロックを追記
 * @param {object} opts
 */
export function formatHandoffBlock(opts) {
  const ymd = opts.date || new Date().toISOString().slice(0, 10);
  const lines = [
    '',
    `### ${ymd} JST — **${opts.title || 'セッション区切り'}**`,
    '',
    `**要約**: ${opts.summary || '(要記入)'}`,
    '',
    `**次の1手**: ${opts.nextTask || '(checkpoint と同期)'}`,
    '',
    `**Git**: \`${opts.gitHash || 'unknown'}\` — ${opts.gitMsg || ''}`,
  ];
  if (opts.build) lines.push('', `**BUILD**: ${opts.build}`);
  lines.push('', `**GO待ち**: ${opts.goWait ?? 'なし'}`);
  lines.push('', `**触らない**: ${opts.doNotTouch ?? '（保留表参照）'}`);
  lines.push('', '---', '');
  return lines.join('\n');
}

export function appendHandoffBlock(root, blockText) {
  const p = path.join(root, HANDOFF_LOG_REL);
  fs.appendFileSync(p, blockText.startsWith('\n') ? blockText : `\n${blockText}`, 'utf8');
}

/**
 * 必須キー欠落時は追記前に warn（append-block 経由なら通常到達しない）
 * @param {string} blockText
 * @param {object} manifest
 */
export function assertHandoffBlockComplete(blockText, manifest) {
  const required = manifest?.handoffBlock?.requiredKeys || [];
  const missing = required.filter((k) => !blockText.includes(k));
  if (missing.length > 0) {
    throw new Error(
      `handoff block missing required keys: ${missing.join(' ')} — use formatHandoffBlock / cio:handoff:append-block`,
    );
  }
}
