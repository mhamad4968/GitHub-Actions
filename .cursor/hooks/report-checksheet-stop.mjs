#!/usr/bin/env node
/**
 * stop — チェックシート欠落フラグがあるとき、自動ユーザメッセージを投入して再回答させる。
 * `status !== completed` の stop では **フォロー要件を消さない**（completed まで `followPath` を保持）。
 *
 * @see every-turn-rules-confirm.mdc §1e
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipelineStep, setOutcome } from './report-pipeline-audit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stateDir = path.join(root, '.cursor/hooks/state');
const followPath = path.join(stateDir, 'checksheet-followup-needed.json');

const FOLLOWUP_MISSING = `【hooks 自動フォロー】直前のユーザ発話は「報告」カテゴリでしたが、応答に必須の機械可読チェックシートがありませんでした。

\`every-turn-rules-confirm.mdc\` **§1e** および \`docs/session-report-checklist.md\` **§M-2** に従い、**同一内容を要約してよいので**、応答**末尾**に次の **7 行**を**この順のまま**含めて再出力してください（\`CHECKSHEET_OK: yes\` は自己判定で **本当に充足**のときだけ。虚偽は憲法違反）:

【セッション報告チェックシート】
CHECKSHEET_VERSION: 2
CHECKSHEET_OK: yes
SECOND_REVIEWER: deepseek|kimi|openrouter|none(reason=...)
SPEC_TOUCHED: yes|no
DESTRUCTIVE_OPS: none|<列挙>
DRY_RUN_TO_APPLY_GAP: same-turn|>=1-turn|n/a

その上に §1 四行（ティア・【適用憲法】・[🎖️ 本セッション割当]・[ルール確認]）と、**チェックシート本文**（\`docs/session-report-checklist.md\` §P — **□A は常時**、**該当する節の □ のみ**。未該当は \`（該当なし: B,…）\` 1 行でよい）をチャットに貼付してください。`;

const FOLLOWUP_V1 = `【hooks 自動フォロー】応答末尾に **VERSION: 1（3 行のみ）** が検出されました。**報告ターンでは V2（7 行）が必須**です（CEO 命令・厳格モード）。

応答**末尾**を **§M-2 の 7 行**に差し替えてください（\`CHECKSHEET_VERSION: 2\` ＋ 四キーすべて）。§1 四行と §P の □ 本文も欠かさないこと。`;

const FOLLOWUP_V2 = `【hooks 自動フォロー】**V2 チェックシートの矛盾**が検出されました（例: \`SPEC_TOUCHED: yes\` と第2者 \`none(reason=…)\` の実質空、破壊級と \`DRY_RUN_TO_APPLY_GAP: same-turn\` の併存、四キーの欠落など）。

**事実と整合する値**に直し、**矛盾ゼロ**になったら \`CHECKSHEET_OK: yes\` にしてください。同一応答内で §1・§P・末尾 7 行を**まとめて**再出力してください。`;

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

  let followMeta = {};
  try {
    followMeta = JSON.parse(fs.readFileSync(followPath, 'utf8'));
  } catch {
    followMeta = {};
  }
  const correlationId =
    typeof followMeta.correlationId === 'string' && followMeta.correlationId
      ? followMeta.correlationId
      : null;

  /** hooks.json の loop_limit と整合（フォロー回数の上限） */
  if (loopCount >= 5) {
    if (correlationId) {
      setOutcome(correlationId, 'FAILED_MAX_LOOPS', { loopCount });
    }
    try {
      fs.unlinkSync(followPath);
    } catch {
      /* noop */
    }
    process.stdout.write(`${JSON.stringify(out)}\n`);
    return;
  }

  if (input.status && input.status !== 'completed') {
    if (correlationId) {
      pipelineStep(correlationId, 'STOP_HOOK_DEFERRED_NOT_COMPLETED', {
        status: input.status,
        loopCount,
      });
    }
    process.stdout.write(`${JSON.stringify(out)}\n`);
    return;
  }

  if (correlationId) {
    pipelineStep(correlationId, 'FOLLOWUP_MESSAGE_ISSUED', { loopCount });
  }

  try {
    fs.unlinkSync(followPath);
  } catch {
    /* noop */
  }

  const reason = typeof followMeta.reason === 'string' ? followMeta.reason : 'MISSING_CHECKSHEET';
  if (reason === 'V1_REQUIRE_V2') {
    out.followup_message = FOLLOWUP_V1;
  } else if (reason === 'V2_VIOLATION') {
    out.followup_message = FOLLOWUP_V2;
  } else {
    out.followup_message = FOLLOWUP_MISSING;
  }
  process.stdout.write(`${JSON.stringify(out)}\n`);
}

main();
