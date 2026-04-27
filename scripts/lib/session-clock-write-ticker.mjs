/**
 * SESSION-CLOCK-TICKER.md 生成（set / write-ticker / watch / WEB から利用）
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseClock, fmtDuration, nowTokyoYYYYMMDDHHmm, FOUR_H_MS, pathsFromRoot } from './session-clock-core.mjs';

/**
 * @param {string} root リポジトリルート絶対パス
 */
export function writeTickerFile(root) {
  const { clockAbs, tickerAbs } = pathsFromRoot(root);
  const displayUpdateJst = nowTokyoYYYYMMDDHHmm();
  const r = parseClock(clockAbs);
  let body = '# セッション時計（人間向け・自動）\n\n';
  body +=
    '> **自動生成**（手で直さない）。**経過／4h までの残り**を表示。正本の `開始:` は [`SESSION-CLOCK.md`](./SESSION-CLOCK.md)。\n\n';
  body += `- **この表示の更新(JST)**: ${displayUpdateJst}\n`;
  if (r.mode === 'missing') {
    body += '- **状態**: `SESSION-CLOCK.md` がまだない → `cd ~/kintone-ai-lab && npm run session:clock:set`\n';
  } else if (r.mode === 'skip') {
    body += `- **開始**: 未設定 → 新チャットの hook か AI 依頼で \`session:clock:set\`\n`;
  } else if (r.mode === 'bad') {
    body += `- **開始行**: 形式不正 → \`SESSION-CLOCK.md\` の \`開始:\` を \`YYYY-MM-DD HH:mm\` に\n`;
  } else if (r.mode === 'over') {
    body += `- **開始(JST)**: ${r.line}\n`;
    body += `- **経過**: **${fmtDuration(r.elapsedMs)}**（**4h 超**）→ 新 Composer 推奨（§51-6-2）\n`;
  } else {
    const leftMs = Math.max(0, FOUR_H_MS - r.elapsedMs);
    body += `- **開始(JST)**: ${r.line}\n`;
    body += `- **経過**: **${fmtDuration(r.elapsedMs)}**\n`;
    body += `- **4h まであと**: **${fmtDuration(leftMs)}**\n`;
  }
  body += '\n';
  try {
    fs.mkdirSync(path.dirname(tickerAbs), { recursive: true });
    fs.writeFileSync(tickerAbs, body, 'utf8');
  } catch (e) {
    console.warn(`[session-clock] ⚠ write-ticker: ${e.message}`);
  }
}
