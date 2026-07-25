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
import { buildNgRecoverySuffix, setNgGate } from './ng-recovery-gate.mjs';

function withNgRecovery(msg) {
  return msg + buildNgRecoverySuffix();
}

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

その上に §1 四行（ティア・【適用憲法】・[🎖️ 本セッション割当]・[ルール確認]）と、**チェックシート本文**（\`docs/session-report-checklist.md\` §P — **□A は常時**、**□A1（ダブルチェック：誰と・結果・\`ダブルチェック要約:\` 1 行）は報告常時**、**該当する節の □ のみ**。未該当は \`（該当なし: B,…）\` 1 行でよい）をチャットに貼付してください。`;

const FOLLOWUP_V1 = `【hooks 自動フォロー】応答末尾に **VERSION: 1（3 行のみ）** が検出されました。**報告ターンでは V2（7 行）が必須**です（CEO 命令・厳格モード）。

応答**末尾**を **§M-2 の 7 行**に差し替えてください（\`CHECKSHEET_VERSION: 2\` ＋ 四キーすべて）。§1 四行・**§P の □A1（ダブルチェック誰と結果）**を含む □ 本文も欠かさないこと。`;

const FOLLOWUP_V2 = `【hooks 自動フォロー】**V2 チェックシートの矛盾**が検出されました（例: \`SPEC_TOUCHED: yes\` と第2者 \`none(reason=…)\` の実質空、破壊級と \`DRY_RUN_TO_APPLY_GAP: same-turn\` の併存、四キーの欠落など）。

**事実と整合する値**に直し、**矛盾ゼロ**になったら \`CHECKSHEET_OK: yes\` にしてください。同一応答内で §1・§P（**□A1 ダブルチェック誰と結果**を含む）・末尾 7 行を**まとめて**再出力してください。`;

const FOLLOWUP_CEO_MINIMUM = `【hooks 自動フォロー】**CEO 最低基準ブロック全文**が応答本文に **一行も欠けず**検出されませんでした（\`chat-sessions/CEO-MINIMUM-ABSOLUTE-BASELINE.txt\` / read-pack \`18-重要確認.txt\` と同一）。

**同一応答内**に、\`CEO-MINIMUM-ABSOLUTE-BASELINE.txt\` の **非空行すべて**を **そのままの文字列**で含めてください（要約・「同上」・一部省略は **すべて NG**）。§P の前後どこでもよいが **V2 七行・§1 四行と同じターンの応答本文に必須**。

そのうえで §1 四行・§P（□A1 含む）・末尾 **V2 七行**を **まとめて**再出力してください。`;

const FOLLOWUP_DOUBLE_CHECK = `【hooks 自動フォロー】**§P □A1（ダブルチェック：誰と・結果）**または **\`ダブルチェック要約:\` 行**が不足しているか、**誰が**第2者チェックしたか（または **無／非該当／スキップ**）が機械検査に通りませんでした（\`docs/session-report-checklist.md\` §P A1）。

**必須**: \`□ A1\` 見出し行に **\`ダブルチェック（誰と・結果）\`** を含める。**別行**に \`ダブルチェック要約:\` を付け、**DeepSeek／Kimi／OpenRouter／両名／第2者／無（…）／非該当／§50-3-8 スキップ**のいずれかを **要約本文に明示**する（**曖昧な一行のみ禁止**）。

§1 四行・CEO 最低基準全文・§P（□A 含む）・末尾 **V2 七行**を **まとめて**再出力してください。`;

const FOLLOWUP_TURN_HEAD = `【hooks 自動フォロー】**報告ターン厳格モード**: 応答**先頭付近**（機械検査ウィンドウ）に **§1 四行**のいずれかが欠けていました（\`every-turn-rules-confirm.mdc\` §1・浜田 CEO 受付ゲート）。

**同一応答の最上段付近**に、次を **この順で各 1 行**（省略なし）で出してから、§P の □ 本文と末尾 **V2 七行**を再出力してください:

1. \`[§1-2-3 ティア判定: L1|L2|L3]\`（根拠 1 語以上）
2. \`【適用憲法】\`（§ 列挙の 1 行）
3. \`[🎖️ 本セッション割当]\`（割当の 1 行）
4. \`[ルール確認]\`（Read 済みパス等の 1 行）

そのうえで **§P の □ 本文**に **□A1（ダブルチェック：誰と・結果）** と **\`ダブルチェック要約:\` 1 行**を含めてください（\`docs/session-report-checklist.md\` §P A1）。

**判定ログ**: 各検証で \`logs/report-turn-head-audit.log\` に 1 行 JSON が追記されます（抜けコード: TIER_LINE / CONSTITUTION_LINE / ASSIGN_LINE / RULES_CONFIRM_LINE）。`;

/** 非報告ターン（head-only）: §1 四行のみ再出力。V2・§P・CEO全文は不要。 */
const FOLLOWUP_TURN_HEAD_ONLY = `【hooks 自動フォロー】**全ターン検証（head-only）**: 応答**先頭付近**に **§1 四行**のいずれかが欠けていました。

**同一応答の最上段**（ツール結果や長文の**前**）に、次を **この順で各 1 行**で出し直してください（**V2 七行・チェックシート本文はこのフォローでは不要**）:

1. \`[§1-2-3 ティア判定: L1|L2|L3]\`（根拠 1 語以上）
2. \`【適用憲法】\`（§ 列挙の 1 行）
3. \`[🎖️ 本セッション割当]\`（割当の 1 行）
4. \`[ルール確認]\`（Read 済みパス等の 1 行）

**埋もれ対策**: 長いログやコードを出す場合でも、**最初のブロックを §1 四行にすること**（ウィンドウ先頭のみ機械検査）。`;

function main() {
  let input = {};
  try {
    const raw = (fs.readFileSync(0, 'utf8') || '').replace(/^\uFEFF/, '');
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
    setNgGate('FAILED_MAX_LOOPS', { loopCount });
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
    out.followup_message = withNgRecovery(FOLLOWUP_V1);
  } else if (reason === 'V2_VIOLATION') {
    out.followup_message = withNgRecovery(FOLLOWUP_V2);
  } else if (reason === 'CEO_MINIMUM_BLOCK' || reason === 'CEO_MINIMUM_ACK') {
    out.followup_message = withNgRecovery(FOLLOWUP_CEO_MINIMUM);
  } else if (reason === 'DOUBLE_CHECK_ATTRIBUTION') {
    out.followup_message = withNgRecovery(FOLLOWUP_DOUBLE_CHECK);
  } else if (reason === 'TURN_HEAD_ONLY') {
    out.followup_message = withNgRecovery(FOLLOWUP_TURN_HEAD_ONLY);
  } else if (reason === 'TURN_HEAD_VIOLATION') {
    out.followup_message = withNgRecovery(FOLLOWUP_TURN_HEAD);
  } else {
    out.followup_message = withNgRecovery(FOLLOWUP_MISSING);
  }
  process.stdout.write(`${JSON.stringify(out)}\n`);
}

main();
