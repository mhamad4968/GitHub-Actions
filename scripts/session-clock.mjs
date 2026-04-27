#!/usr/bin/env node
/**
 * session-clock.mjs — §51-6-2「時間軸」用の JST 壁時計（1 ファイル・1 行）
 *
 *   npm run session:clock:set   — chat-sessions/SESSION-CLOCK.md の「開始」を現在の Asia/Tokyo に更新
 *   npm run session:split-check — 開始から 4 時間経過なら exit 2（未満なら 0）
 *   node scripts/session-clock.mjs check-json — 1 行 JSON（watch 用・exit は check と同じ）
 *   node scripts/session-clock.mjs prompt-hook — 1 行 JSON（Cursor beforeSubmitPrompt 用・経過/残りを additional_context）
 *   node scripts/session-clock.mjs write-ticker — `SESSION-CLOCK-TICKER.md` を更新（人間がエディタで見る用）
 *
 * 「開始」が未設定のときは check をスキップ（警告のみ）— 一度 set すると以降は機械判定が効く。
 *
 * @see chat-sessions/SESSION-CLOCK.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOKYO = 'Asia/Tokyo';
const FOUR_H_MS = 4 * 60 * 60 * 1000;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clockRel = 'chat-sessions/SESSION-CLOCK.md';
const clockAbs = path.join(root, clockRel);
const tickerRel = 'chat-sessions/SESSION-CLOCK-TICKER.md';
const tickerAbs = path.join(root, tickerRel);

/** @returns {string} */
function nowTokyoYYYYMMDDHHmm() {
  const s = new Date().toLocaleString('sv-SE', {
    timeZone: TOKYO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  // sv-SE + Tokyo: "2026-04-28 11:49:03" または "2026-04-28 11:49"
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})/);
  if (!m) throw new Error(`unexpected tokyo locale string: ${s}`);
  const hh = m[2].padStart(2, '0');
  return `${m[1]} ${hh}:${m[3]}`;
}

const HEADER =
  '# セッション壁時計（JST）\n\n' +
  '同一 Cursor 会話の **§51-6-2 時間軸（4 時間）** を機械判定する。**新チャット直後**または**作業再開時**に次を1回実行する。\n\n' +
  '**チャットから AI に依頼**（浜田が手で npm を打たなくてよい）: 「**壁時計をいまの時刻でセットして**（`npm run session:clock:set`）」→ AI が実行（§35-1）。依頼文の一覧は `chat-sessions/SESSION-SPLIT-REMINDER.md` の **浜田 → AI 依頼文**。\n\n' +
  '**人間向けの経過表示（エディタ）**: **`SESSION-CLOCK-TICKER.md`** をタブで開いて固定（自動生成・git 追跡外）。`session:clock:watch` 稼働中は **既定 2 分ごと**に更新、`set` の直後も更新。`npm run session:clock:prompt-hook` は不要。\n\n' +
  '```bash\n' +
  'npm run session:clock:set\n' +
  '```\n\n' +
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
  writeTickerFile();
}

/**
 * @returns {{ mode: 'ok'|'skip'|'over'|'bad'|'missing', line?: string, elapsedMs?: number, start?: Date }}
 */
function parseClock() {
  if (!fs.existsSync(clockAbs)) {
    return { mode: 'missing' };
  }
  const raw = fs.readFileSync(clockAbs, 'utf8');
  const m = raw.match(/^\s*開始:\s*(.+)$/m);
  if (!m) return { mode: 'bad', line: undefined };
  const val = m[1].trim();
  if (/未設定|\(未設定\)|TBD|未登録/i.test(val)) {
    return { mode: 'skip', line: val };
  }
  const dm = val.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})$/);
  if (!dm) return { mode: 'bad', line: val };
  const y = Number(dm[1]);
  const mo = Number(dm[2]);
  const d = Number(dm[3]);
  const h = Number(dm[4]);
  const mi = Number(dm[5]);
  const start = new Date(Date.UTC(y, mo - 1, d, h - 9, mi, 0, 0));
  if (Number.isNaN(start.getTime())) return { mode: 'bad', line: val };
  const elapsedMs = Date.now() - start.getTime();
  if (elapsedMs >= FOUR_H_MS) return { mode: 'over', line: val, elapsedMs, start };
  return { mode: 'ok', line: val, elapsedMs, start };
}

function fmtDuration(ms) {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h${String(mm).padStart(2, '0')}m`;
}

/** 浜田がエディタで開く用（gitignore）。watch の tick からも更新 */
function writeTickerFile() {
  const displayUpdateJst = nowTokyoYYYYMMDDHHmm();
  const r = parseClock();
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

function runCheckJson() {
  const r = parseClock();
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
  const r = parseClock();
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
  const r = parseClock();
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
    writeTickerFile();
    process.exit(0);
  } catch (e) {
    console.error('[session-clock] ❌ write-ticker', e.message);
    process.exit(2);
  }
}

console.error('Usage: node scripts/session-clock.mjs set|check|check-json|prompt-hook|write-ticker');
process.exit(2);
