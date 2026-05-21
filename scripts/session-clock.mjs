#!/usr/bin/env node
/**
 * session-clock.mjs — §51-6-2「時間軸」用の JST 壁時計（1 ファイル・1 行）
 *
 *   npm run session:clock:set   — chat-sessions/SESSION-CLOCK.md の「開始」を現在の Asia/Tokyo に更新
 *   npm run session:split-check — 開始から 4 時間経過なら exit 2（未満なら 0）
 *   npm run session:clock:clear — 「開始:」を **未設定** に戻し §51-6-2 の時間軸判定を止める（セッション終了時）
 *   node scripts/session-clock.mjs check-json — 1 行 JSON（watch 用・exit は check と同じ）
 *   node scripts/session-clock.mjs prompt-hook — 1 行 JSON（Cursor beforeSubmitPrompt 用・経過/残りを additional_context）
 *   node scripts/session-clock.mjs write-ticker — `SESSION-CLOCK-TICKER.md` を更新（人間がエディタで見る用）
 *
 * 「開始」が未設定のときは check をスキップ（警告のみ）— 一度 set すると以降は機械判定が効く。
 * TICKER 本文生成は `scripts/lib/session-clock-write-ticker.mjs` と共有（WEB は in-process 呼び出し）。
 *
 * @see chat-sessions/SESSION-CLOCK.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  pathsFromRoot,
  parseClock,
  fmtDuration,
  nowTokyoYYYYMMDDHHmm,
  FOUR_H_MS,
} from './lib/session-clock-core.mjs';
import { writeTickerFile } from './lib/session-clock-write-ticker.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { clockAbs } = pathsFromRoot(root);
const clockRel = 'chat-sessions/SESSION-CLOCK.md';

const HEADER =
  '# セッション壁時計（JST）\n\n' +
  '同一 Cursor 会話の **§51-6-2 時間軸（4 時間）** を機械判定する。\n\n' +
  '**2026-05-17（浜田 CEO）**: **Cursor を閉じると自動停止**（`sessionEnd` hook → `session:clock:clear` ＋ watch/web 停止）。**Cursor を開くと自動起動**（`sessionStart` hook → set ＋ watch ＋ web ＋ **URL を additional_context 表示**）。手動: `npm run session:clock:stop` / `docs/runbooks/session-clock-cursor-lifecycle.md`。\n\n' +
  '**2026-04-29（浜田 CIO）**: セッション切替のたびに壁時計をリセットする運用（上記 hook に統合）。**この HEADER に永続化済（TSB-026）**。**人間注意書きの追記はここ（scripts/session-clock.mjs の HEADER 定数）に行うこと。**\n\n' +
  '**チャットから AI に依頼**（浜田が手で npm を打たなくてよい）: 「**壁時計をいまの時刻でセットして**（`npm run session:clock:set`）」→ AI が実行（§35-1）。依頼文の一覧は `chat-sessions/SESSION-SPLIT-REMINDER.md` の **浜田 → AI 依頼文**。\n\n' +
  '**人間向けの経過表示（エディタ）**: **`SESSION-CLOCK-TICKER.md`** をタブで開いて固定（自動生成・git 追跡外）。`session:clock:watch` 稼働中は **既定 2 分ごと**に更新、`set` の直後も更新。`npm run session:clock:prompt-hook` は不要。\n\n' +
  '```bash\n' +
  'npm run session:clock:set\n' +
  'npm run session:clock:web-url\n' +
  '```\n\n' +
  '**ターミナルに URL だけ出す**（サーバは立てずポート試行のみ）: 上の `session:clock:web-url`。**実際にブラウザで見る**ときは `npm run session:clock:web` のログ先頭の「開く:」を正とする（既に Web が動いている別ターミナルがあればそちらの URL）。\n\n' +
  '## 開始（この1行だけを書き換えればよい）\n\n' +
  '開始: ';

const alertFlagAbs = path.join(root, 'logs', '.session-clock-split-alerted');

function writeClock() {
  const line = nowTokyoYYYYMMDDHHmm();
  const body = `${HEADER}${line}\n`;
  fs.mkdirSync(path.dirname(clockAbs), { recursive: true });
  fs.writeFileSync(clockAbs, body, 'utf8');
  try {
    if (fs.existsSync(alertFlagAbs)) fs.unlinkSync(alertFlagAbs);
  } catch {
    /* noop */
  }
  console.log(`[session-clock] ✅ set → ${clockRel}`);
  console.log(`  開始: ${line} (Asia/Tokyo)`);
  writeTickerFile(root);
}

/** §51-6-2 時間軸を止める（開始を未設定に。次チャットでは set から再開） */
function clearClock() {
  const body = `${HEADER}未設定\n`;
  fs.mkdirSync(path.dirname(clockAbs), { recursive: true });
  fs.writeFileSync(clockAbs, body, 'utf8');
  try {
    if (fs.existsSync(alertFlagAbs)) fs.unlinkSync(alertFlagAbs);
  } catch {
    /* noop */
  }
  console.log(`[session-clock] ✅ clear → ${clockRel}（開始: 未設定 / split-check は未検査）`);
  writeTickerFile(root);
}

function runCheckJson() {
  const r = parseClock(clockAbs);
  const payload = {
    mode: r.mode,
    startLine: r.line ?? null,
    elapsedMs: r.elapsedMs ?? null,
    elapsedHuman: typeof r.elapsedMs === 'number' ? fmtDuration(r.elapsedMs) : null,
  };
  console.log(JSON.stringify(payload));
  if (r.mode === 'missing' || r.mode === 'skip' || r.mode === 'ok') process.exit(0);
  if (r.mode === 'bad' || r.mode === 'over') process.exit(2);
  process.exit(0);
}

/** Cursor `beforeSubmitPrompt`: 毎プロンプトで経過/残りを 1 行表示 */
function runPromptHook() {
  const r = parseClock(clockAbs);
  let msg;
  if (r.mode === 'missing') {
    msg =
      '⏱ **セッション時計**: `SESSION-CLOCK.md` がまだない。新チャットの sessionStart か `npm run session:clock:set` で開始を記録すると、ここに経過と 4h までの残りが出る。';
  } else if (r.mode === 'skip') {
    msg =
      '⏱ **セッション時計**: 開始が「未設定」。**チャットで**「壁時計をいまの時刻でセットして」と **AI に依頼**（`session:clock:set`）するか、新チャットの sessionStart を待つと経過タイマーが表示される。';
  } else if (r.mode === 'bad') {
    msg = `⏱ **セッション時計**: 開始行の形式が不正（\`${String(r.line ?? '').slice(0, 80)}\`）。\`chat-sessions/SESSION-CLOCK.md\` を直してほしい。`;
  } else if (r.mode === 'over') {
    msg = `⏱ **セッション時計**: **4 時間超**（開始 **${r.line}** JST・経過 **${fmtDuration(r.elapsedMs)}**）。§51-6-2 に従い **新チャット**を推奨。`;
  } else {
    const elapsed = fmtDuration(r.elapsedMs);
    const leftMs = Math.max(0, FOUR_H_MS - r.elapsedMs);
    const left = fmtDuration(leftMs);
    msg = `⏱ **セッション時計**（§51-6-2）: 開始 **${r.line}** JST → 経過 **${elapsed}** / **4h まであと ${left}**（人間向け常時表示は \`chat-sessions/SESSION-CLOCK-TICKER.md\`）`;
  }
  process.stdout.write(`${JSON.stringify({ additional_context: msg })}\n`);
  process.exit(0);
}

function runCheck() {
  const r = parseClock(clockAbs);
  if (r.mode === 'missing') {
    console.warn(`[session-clock] ⚠ ${clockRel} がありません。新規作成: npm run session:clock:set`);
    process.exit(0);
  }
  if (r.mode === 'bad') {
    console.error(`[session-clock] ❌ 「開始:」の形式が不正です: ${r.line ?? '(行なし)'}`);
    console.error('  期待: 開始: YYYY-MM-DD HH:mm（例 開始: 2026-04-28 11:49）または 未設定');
    process.exit(2);
  }
  if (r.mode === 'skip') {
    console.warn(`[session-clock] ⚠ 開始が「${r.line}」のため §51-6-2 時間軸は未検査。客観化するには: npm run session:clock:set`);
    process.exit(0);
  }
  if (r.mode === 'over') {
    console.error('[session-clock] ❌ §51-6-2 時間軸: 同一セッション開始から 4 時間以上経過');
    console.error(`  開始(JST): ${r.line}（経過 ${fmtDuration(r.elapsedMs)}）`);
    console.error('  → 新チャットで区切り、再度 npm run session:clock:set を実行してから bootstrap してください。');
    process.exit(2);
  }
  console.log(`[session-clock] ✅ 経過 ${fmtDuration(r.elapsedMs)} / 上限 4h00m（開始 ${r.line} JST）`);
  process.exit(0);
}

const cmd = process.argv[2];
if (cmd === 'set') {
  try {
    writeClock();
    process.exit(0);
  } catch (e) {
    console.error('[session-clock] ❌', e.message);
    process.exit(2);
  }
}
if (cmd === 'clear') {
  try {
    clearClock();
    process.exit(0);
  } catch (e) {
    console.error('[session-clock] ❌', e.message);
    process.exit(2);
  }
}
if (cmd === 'check') {
  runCheck();
}
if (cmd === 'check-json') {
  runCheckJson();
}
if (cmd === 'prompt-hook') {
  runPromptHook();
}
if (cmd === 'write-ticker') {
  try {
    writeTickerFile(root);
    process.exit(0);
  } catch (e) {
    console.error('[session-clock] ❌ write-ticker', e.message);
    process.exit(2);
  }
}

console.error('Usage: node scripts/session-clock.mjs set|clear|check|check-json|prompt-hook|write-ticker');
process.exit(2);
