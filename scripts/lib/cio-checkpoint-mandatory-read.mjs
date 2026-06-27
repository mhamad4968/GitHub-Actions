/**
 * checkpoint-latest.md — mandatory-read-gate 向け凍結ゾーン検証（正本）
 *
 * v2 凍結ゾーン（≤50 行 preamble）と rollup 後の正当な短さを両立する。
 * 全文 4000 字固定は廃止 — preamble 構造 + minChars/minLines で空化・欠落を検知。
 *
 * @see scripts/mandatory-read-gate.mjs
 * @see docs/runbooks/checkpoint-handoff-template-v2.md
 */
import {
  CHECKPOINT_REL,
  readCheckpointPreamble,
  readCheckpointPreambleLineCount,
} from './cio-checkpoint-read.mjs';
import { loadHandoffTemplate, validateCheckpointFreezeZone } from './cio-handoff-template.mjs';

/** @returns {{ ok: boolean, issues: string[], preambleChars: number, preambleLines: number, finalUpdateLine: string|null }} */
export function validateCheckpointMandatoryRead(root) {
  const issues = [];
  const preamble = readCheckpointPreamble(root);
  const preambleLines = readCheckpointPreambleLineCount(root);
  const preambleChars = preamble.length;

  if (!preamble) {
    return { ok: false, issues: [`missing ${CHECKPOINT_REL}`], preambleChars: 0, preambleLines: 0, finalUpdateLine: null };
  }

  const manifest = loadHandoffTemplate(root);
  const minChars = manifest.freezeZone?.minChars ?? 2800;
  const minLines = manifest.freezeZone?.minLines ?? 35;

  if (preambleChars < minChars) {
    issues.push(`preamble unexpectedly short (${preambleChars} chars < ${minChars}; rollup 後も凍結ゾーン minChars を満たすこと)`);
  }
  if (preambleLines < minLines) {
    issues.push(`preamble too few lines (${preambleLines} < ${minLines})`);
  }

  const fz = validateCheckpointFreezeZone(root);
  for (const i of fz.issues) {
    if (!i.startsWith('WARN')) issues.push(i);
  }

  if (!preamble.includes('## セッション切替後の自律復元')) {
    issues.push('missing "## セッション切替後の自律復元"');
  }
  if (!preamble.includes('mandatory-read-gate.mjs')) {
    issues.push('missing "mandatory-read-gate.mjs" (bootstrap 手順の記載を確認)');
  }

  const mFinal = preamble.match(/^\*\*最終更新\*\*:\s*(.+)$/m);
  let finalUpdateLine = null;
  if (!mFinal) {
    issues.push('missing **最終更新**: line');
  } else {
    finalUpdateLine = mFinal[0].trim();
    if (!/20\d\d-\d\d-\d{2}/.test(finalUpdateLine)) {
      issues.push('**最終更新** has no YYYY-MM-DD');
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    preambleChars,
    preambleLines,
    finalUpdateLine,
  };
}
