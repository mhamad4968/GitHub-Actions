/**
 * Desktop「AI緊急用」の NEW-SESSION-STARTER 控えファイル名（メンテ日ベース）。
 * 正本: chat-sessions/NEW-SESSION-STARTER.md 冒頭・checkpoint-latest 項番 -1
 *
 * 命名: NEW-SESSION-STARTER_yyyymmdd.txt（JST の日付）
 * 同一日内で内容が変わったら: NEW-SESSION-STARTER_yyyymmdd_2.txt, _3.txt, …
 */
import fs from 'node:fs';
import path from 'node:path';

/** @returns {string} 例: 20260426 */
export function getJstYyyymmdd(now = new Date()) {
  const iso = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  return iso.replace(/-/g, '');
}

export const STARTER_DESKTOP_RE = /^NEW-SESSION-STARTER_(\d{8})(?:_(\d+))?\.txt$/;

/**
 * 次に書き込む Desktop パス（同一内容なら既存ファイルを上書きするパスを返す）。
 * @param {string} destDir
 * @param {Buffer} srcBuf
 */
export function pickStarterWritePath(destDir, srcBuf) {
  const d = getJstYyyymmdd();
  const base = path.join(destDir, `NEW-SESSION-STARTER_${d}.txt`);
  if (!fs.existsSync(base)) {
    return base;
  }
  if (fs.readFileSync(base).equals(srcBuf)) {
    return base;
  }
  let k = 2;
  while (k < 1000) {
    const p = path.join(destDir, `NEW-SESSION-STARTER_${d}_${k}.txt`);
    if (!fs.existsSync(p)) {
      return p;
    }
    if (fs.readFileSync(p).equals(srcBuf)) {
      return p;
    }
    k += 1;
  }
  throw new Error('[session-starter-desktop] 枝番が上限に達しました');
}

/**
 * @param {string} destDir
 * @returns {string[]}
 */
export function listStarterDesktopFiles(destDir) {
  if (!fs.existsSync(destDir)) {
    return [];
  }
  return fs.readdirSync(destDir).filter((name) => STARTER_DESKTOP_RE.test(name));
}

/**
 * リポ正本とバイト一致する控えが 1 つ以上あるか。
 * @param {string} destDir
 * @param {Buffer} srcBuf
 * @returns {{ ok: boolean, matched: string[] }}
 */
/**
 * 指定 JST 日の控えのうち、枝番が最大のファイルの絶対パス（無ければ null）。
 * @param {string} destDir
 * @param {string} [ymd] getJstYyyymmdd() 形式
 */
export function pickLatestStarterDesktopPathForDate(destDir, ymd = getJstYyyymmdd()) {
  const names = listStarterDesktopFiles(destDir).filter((n) => {
    const m = n.match(STARTER_DESKTOP_RE);
    return m && m[1] === ymd;
  });
  if (names.length === 0) {
    return null;
  }
  let bestName = names[0];
  let bestBranch = 0;
  for (const n of names) {
    const m = n.match(STARTER_DESKTOP_RE);
    const branch = m[2] ? parseInt(m[2], 10) : 1;
    if (branch > bestBranch) {
      bestBranch = branch;
      bestName = n;
    }
  }
  return path.join(destDir, bestName);
}

export function starterDesktopMatchesRepo(destDir, srcBuf) {
  const names = listStarterDesktopFiles(destDir);
  const matched = [];
  for (const name of names) {
    const p = path.join(destDir, name);
    try {
      if (fs.readFileSync(p).equals(srcBuf)) {
        matched.push(name);
      }
    } catch {
      /* ignore */
    }
  }
  return { ok: matched.length > 0, matched };
}
