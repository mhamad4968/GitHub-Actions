#!/usr/bin/env node
/**
 * beforeSubmitPrompt — 「報告」系ユーザ発話のとき、afterAgentResponse 用フラグを立てる。
 * ユーザ送信はブロックしない（continue: true 固定）。
 *
 * @see every-turn-rules-confirm.mdc §1e
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stateDir = path.join(root, '.cursor/hooks/state');
const pendingPath = path.join(stateDir, 'pending-report-checksheet.json');

function isReportIntentPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') return false;
  const p = prompt.trim();
  if (/CHECKSHEET|チェックシート|完了報告|日終わり|セッション終了|本日のまとめ|本日の成果|本日の報告/i.test(p)) return true;
  if (/(報告して|報告を|報告に|報告で|報告の|報告:|報告：|完了報告|中間報告)/.test(p)) return true;
  if (/中間報告|締めくくり|成果.*反省|状況.*まとめ/i.test(p)) return true;
  if (/まとめ/.test(p) && /(セッション|本日|今日)/.test(p)) return true;
  return false;
}

function main() {
  let input = {};
  try {
    const raw = fs.readFileSync(0, 'utf8');
    input = JSON.parse(raw || '{}');
  } catch {
    input = {};
  }

  const prompt = input.prompt ?? '';
  const out = { continue: true };

  if (!isReportIntentPrompt(prompt)) {
    process.stdout.write(`${JSON.stringify(out)}\n`);
    return;
  }

  try {
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(
      pendingPath,
      JSON.stringify(
        {
          ts: Date.now(),
          promptPreview: String(prompt).slice(0, 400),
        },
        null,
        2
      ),
      'utf8'
    );
  } catch {
    /* noop */
  }

  process.stdout.write(`${JSON.stringify(out)}\n`);
}

main();
