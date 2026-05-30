/**
 * 拡張案1 — bug-latest.md 3択自動実行
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { loadState, recordSuccess } from './cio-composer-escalation.mjs';
import { ticketPath, CHOICE_EXEC } from './cio-error-ticket.mjs';

export const CHOICE_PLAN = CHOICE_EXEC;

export function parseChoiceFromTicket(body, choice) {
  const blockRe = new RegExp(
    `<!--\\s*CIO-EXEC-CHOICE-${choice}\\s*-->([\\s\\S]*?)<!--\\s*/CIO-EXEC-CHOICE-${choice}\\s*-->`,
    'i',
  );
  const m = body.match(blockRe);
  if (m) {
    return m[1]
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  }
  return CHOICE_PLAN[choice] || [];
}

export function parseDiffBlocks(body, choice) {
  const re = new RegExp(
    `<!--\\s*CIO-DIFF-CHOICE-${choice}:([^>]+)\\s*-->\\s*\`\`\`(?:diff)?\\s*([\\s\\S]*?)\`\`\``,
    'gi',
  );
  const out = [];
  let m;
  while ((m = re.exec(body)) !== null) {
    out.push({ file: m[1].trim(), diff: m[2] });
  }
  return out;
}

export function applySimpleDiff(root, fileRel, diffText) {
  const p = path.join(root, fileRel);
  if (!fs.existsSync(p)) return false;
  const lines = diffText.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));
  if (!lines.length) return false;
  const additions = lines.map((l) => l.slice(1)).join('\n');
  fs.appendFileSync(p, '\n' + additions + '\n', 'utf8');
  return true;
}

export function runChoicePlan(root, choice) {
  const ticket = ticketPath(root);
  if (!fs.existsSync(ticket)) {
    throw new Error('bug-latest.md 無し — npm run cio:error:generate-ticket');
  }
  const body = fs.readFileSync(ticket, 'utf8');
  const cmds = parseChoiceFromTicket(body, choice);
  const diffs = parseDiffBlocks(body, choice);

  for (const d of diffs) {
    applySimpleDiff(root, d.file, d.diff);
  }

  const state = loadState(root);
  if (state.lastCmd && !cmds.includes(state.lastCmd)) {
    cmds.push(state.lastCmd);
  }

  for (const cmd of cmds) {
    execSync(cmd, { cwd: root, stdio: 'inherit', shell: true });
  }
  recordSuccess(root, cmds[cmds.length - 1]);
  return cmds;
}
