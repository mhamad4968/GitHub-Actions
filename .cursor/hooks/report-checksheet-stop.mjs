#!/usr/bin/env node
/**
 * stop — チェックシート欠落フラグがあるとき、1 回だけ自動ユーザメッセージを投入して再回答させる。
 *
 * @see every-turn-rules-confirm.mdc §1e
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stateDir = path.join(root, '.cursor/hooks/state');
const followPath = path.join(stateDir, 'checksheet-followup-needed.json');

const FOLLOWUP = `【hooks 自動フォロー】直前のユーザ発話は「報告」カテゴリでしたが、応答に必須の機械可読チェックシートがありませんでした。

\`every-turn-rules-confirm.mdc\` **§1e** および \`docs/session-report-checklist.md\` に従い、**同一内容を要約してよいので**、応答**末尾**に次の 3 行を**このまま連続**で含めて再出力してください（CHECKSHEET_OK は自己判定で yes のときだけ）:

【セッション報告チェックシート】
CHECKSHEET_VERSION: 1
CHECKSHEET_OK: yes

その上に §1 四行（ティア・【適用憲法】・[🎖️ 本セッション割当]・[ルール確認]）と、**チェックシート本文**（**`docs/session-report-checklist.md` §P** — **□A は常時**、**該当する節の □ のみ**。未該当は **`（該当なし: B,…）` 1 行**でよい）をチャットに貼付してください。`;

function main() {
  let input = {};
  try {
    const raw = fs.readFileSync(0, 'utf8');
    input = JSON.parse(raw || '{}');
  } catch {
    input = {};
  }

  const loopCount = typeof input.loop_count === 'number' ? input.loop_count : 0;
  const out = {};

  if (!fs.existsSync(followPath)) {
    process.stdout.write(`${JSON.stringify(out)}\n`);
    return;
  }

  if (loopCount >= 2) {
    try {
      fs.unlinkSync(followPath);
    } catch {
      /* noop */
    }
    process.stdout.write(`${JSON.stringify(out)}\n`);
    return;
  }

  if (input.status && input.status !== 'completed') {
    try {
      fs.unlinkSync(followPath);
    } catch {
      /* noop */
    }
    process.stdout.write(`${JSON.stringify(out)}\n`);
    return;
  }

  try {
    fs.unlinkSync(followPath);
  } catch {
    /* noop */
  }

  out.followup_message = FOLLOWUP;
  process.stdout.write(`${JSON.stringify(out)}\n`);
}

main();
