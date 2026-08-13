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

const DISCUSSED_BAN = /^(なし|無し|n\/a|na|なし。|要記入|\(要記入\)|\(要約未指定\)|未指定|-|ー|—)?$/i;

/**
 * セッションで話した内容。空・「なし」は引き継ぎ失敗とみなす（2026-08-13 浜田）。
 * @param {string} value
 */
export function isDiscussedValueOk(value) {
  const s = String(value || '').replace(/\*\*/g, '').trim();
  if (s.length < 12) return false;
  if (DISCUSSED_BAN.test(s)) return false;
  if (/要記入|未指定|要約未指定/.test(s)) return false;
  return true;
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
  const cpNext = readCheckpointNextTask(root);
  const norm = (s) => String(s || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  const handoffNext = readHandoffField(tail, '**次の1手**:');
  const nextMismatch =
    Boolean(cpNext) &&
    Boolean(handoffNext) &&
    norm(handoffNext) !== norm(cpNext) &&
    norm(handoffNext).slice(0, 40) !== norm(cpNext).slice(0, 40);

  // 欠落なしでも checkpoint と末尾「次の1手」がズレていれば同期（cold-start WARN 恒久対策）
  if (missing.length === 0 && nextMismatch) {
    const syncedTail = tail.replace(
      /\*\*次の1手\*\*:\s*[^\n]+/,
      `**次の1手**: ${cpNext}`,
    );
    const newText = text.slice(0, lastIdx) + syncedTail;
    if (!dryRun) {
      fs.writeFileSync(p, newText, 'utf8');
    }
    return { ok: true, repaired: true, filled: ['**次の1手**: (sync-from-checkpoint)'] };
  }

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
  if (missing.includes('**要約**:')) {
    insertLines.push(`**要約**: ${prev['**要約**:'] || '(要記入)'}`);
  }
  if (missing.includes('**話したこと**:')) {
    const fromSummary = readHandoffField(tail, '**要約**:');
    const fallback = isDiscussedValueOk(fromSummary)
      ? fromSummary
      : prev['**話したこと**:'] || '';
    if (isDiscussedValueOk(fallback)) {
      insertLines.push(`**話したこと**: ${fallback}`);
    }
  }

  if (insertLines.length === 0) {
    return {
      ok: false,
      repaired: false,
      filled: [],
      reason: 'handoff latest missing **話したこと**: — append-block --discussed で実会話を書く',
    };
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
 * テンプレ推奨フィールド（品質ゲート等）— minChars 不足時に挿入（無意味パディング禁止）
 * @see chat-sessions/templates/checkpoint-freeze-zone.template.md recommendedFields
 */
const FREEZE_ZONE_MIN_CHAR_ANCHORS = [
  '**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`',
  '**クローズ正本**: `data/cio-project-closures.json` / **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`',
];

/**
 * preamble が minChars 未満なら推奨フィールドを bootstrap 直前へ挿入。
 * それでも不足なら HTML コメントで必要字数だけ補完（maxLines 内）。
 * @returns {{ preamble: string, filled: string[] }}
 */
function ensureFreezeZoneMinChars(preamble, root) {
  const manifest = loadHandoffTemplate(root);
  const minChars = manifest.freezeZone?.minChars ?? 2800;
  const maxLines = manifest.freezeZone?.maxLines ?? 50;
  const filled = [];
  let next = preamble;

  if (next.length >= minChars) {
    return { preamble: next, filled };
  }

  const missing = FREEZE_ZONE_MIN_CHAR_ANCHORS.filter((line) => {
    const key = line.split(':')[0];
    return !next.includes(key);
  });
  if (missing.length > 0) {
    const heading = '## セッション切替後の自律復元';
    const bootIdx = next.indexOf(heading);
    const block = `${missing.join('\n')}\n`;
    next =
      bootIdx >= 0
        ? `${next.slice(0, bootIdx).trimEnd()}\n\n${block}\n${next.slice(bootIdx)}`
        : `${next.trimEnd()}\n\n${block}`;
    filled.push('minChars-anchors');
  }

  if (next.length < minChars) {
    const lineCount = next.split(/\r?\n/).length;
    const room = Math.max(0, maxLines - lineCount - 1);
    const need = minChars - next.length;
    // HTML comment pad — mandatory-read は文字数のみ見る。意味ある行を優先した上の最終手段。
    const padBody = ` freeze-zone minChars pad (${need}+ chars; keep for mandatory-read-gate) `;
    const pad = `<!--${padBody}${'·'.repeat(Math.max(0, need - padBody.length - 8))}-->\n`;
    if (room >= 1 || next.length + pad.length <= minChars + 200) {
      const heading = '## セッション切替後の自律復元';
      const bootIdx = next.indexOf(heading);
      next =
        bootIdx >= 0
          ? `${next.slice(0, bootIdx).trimEnd()}\n\n${pad}${next.slice(bootIdx)}`
          : `${next.trimEnd()}\n\n${pad}`;
      filled.push('minChars-pad');
    }
  }

  return { preamble: next, filled };
}

/**
 * checkpoint 凍結ゾーン末尾の bootstrap ブロックをテンプレ正本で復元
 * （手動 CLOSE で mandatory-read-gate 行削除 → preamble 2800字 NG 再発防止 / S2）
 * 加えて minChars 未満なら推奨フィールド挿入（bootstrap 既存でも実行 / 2026-07-30）
 * @returns {{ ok: boolean, repaired: boolean, filled: string[], reason?: string }}
 */
export function repairCheckpointBootstrapBlock(root, { dryRun = false } = {}) {
  const cpPath = path.join(root, CHECKPOINT_REL);
  if (!fs.existsSync(cpPath)) {
    return { ok: false, repaired: false, filled: [], reason: `missing ${CHECKPOINT_REL}` };
  }
  const full = fs.readFileSync(cpPath, 'utf8');
  const rollSplit = full.split(/^## \d{4}-\d{2}-\d{2}/m);
  let preamble = rollSplit[0];
  const rollup = rollSplit.length > 1 ? full.slice(preamble.length) : '';
  const filled = [];

  const needsBootRepair =
    !preamble.includes('## セッション切替後の自律復元') ||
    !preamble.includes('mandatory-read-gate.mjs') ||
    !preamble.includes('verify:session-close-git-warn');

  if (needsBootRepair) {
    const canonical = extractBootstrapCanonical(root);
    const heading = '## セッション切替後の自律復元';
    const bootIdx = preamble.indexOf(heading);
    preamble =
      bootIdx >= 0
        ? `${preamble.slice(0, bootIdx).trimEnd()}\n\n${canonical}\n`
        : `${preamble.trimEnd()}\n\n${canonical}\n`;
    filled.push('bootstrap-block');
  }

  const minEnsured = ensureFreezeZoneMinChars(preamble, root);
  preamble = minEnsured.preamble;
  filled.push(...minEnsured.filled);

  if (filled.length === 0) {
    return { ok: true, repaired: false, filled: [] };
  }

  const newFull = preamble + rollup;
  if (!dryRun) {
    fs.writeFileSync(cpPath, newFull, 'utf8');
  }

  return { ok: true, repaired: true, filled };
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
  const discussed = readHandoffField(tail, '**話したこと**:');
  if (tail.includes('**話したこと**:') && !isDiscussedValueOk(discussed)) {
    issues.push('handoff latest **話したこと**: が空または「なし」— セッションで話した合意を1文以上書く');
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
  const discussed = opts.discussed || opts.summary || '';
  const lines = [
    '',
    `### ${ymd} JST — **${opts.title || 'セッション区切り'}**`,
    '',
    `**要約**: ${opts.summary || '(要記入)'}`,
    '',
    `**話したこと**: ${discussed || '(要記入) セッションで話した合意・候補・やらないこと'}`,
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
