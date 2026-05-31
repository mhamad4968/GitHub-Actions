/**
 * §51-6-2 壁時計 — 時刻解析・表示用の共有ロジック（CLI / WEB / watch から利用）
 */
import fs from 'node:fs';
import path from 'node:path';

export const TOKYO = 'Asia/Tokyo';
export const FOUR_H_MS = 4 * 60 * 60 * 1000;
/** watch ポーリング既定（10 分）。上書き: 環境変数 SESSION_CLOCK_WATCH_MS */
export const DEFAULT_WATCH_MS = 600_000;

/** @param {string} root リポジトリルート絶対パス */
export function pathsFromRoot(root) {
  return {
    clockAbs: path.join(root, 'chat-sessions', 'SESSION-CLOCK.md'),
    tickerAbs: path.join(root, 'chat-sessions', 'SESSION-CLOCK-TICKER.md'),
  };
}

/** @returns {string} */
export function nowTokyoYYYYMMDDHHmm() {
  const s = new Date().toLocaleString('sv-SE', {
    timeZone: TOKYO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})/);
  if (!m) throw new Error(`unexpected tokyo locale string: ${s}`);
  const hh = m[2].padStart(2, '0');
  return `${m[1]} ${hh}:${m[3]}`;
}

/**
 * @param {string} clockAbs
 * @returns {{ mode: 'ok'|'skip'|'over'|'bad'|'missing', line?: string, elapsedMs?: number, start?: Date }}
 */
export function parseClock(clockAbs) {
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

/**
 * 分単位に切り捨てた表示用文字列（経過・残りは別々に floor するため、
 * 表示上「経過の分 + 残りの分」がぴったり 240 分にならない秒境界がありうる。判定は常に raw の elapsedMs）。
 * @param {number} ms
 * @returns {string}
 */
export function fmtDuration(ms) {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h${String(mm).padStart(2, '0')}m`;
}
