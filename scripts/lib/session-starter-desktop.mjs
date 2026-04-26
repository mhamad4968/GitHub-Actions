/**
 * Desktop「AI緊急用」の NEW-SESSION-STARTER 控え（メンテ日ベース）。
 *
 * 方針（案 C 確定版）:
 * - **常に** `NEW-SESSION-STARTER_yyyymmdd.txt`（JST）へ正本を書く＝**貼付推奨もこの 1 名だけ**（案 D）。
 * - 同日に**内容が変わる** sync のときだけ、上書き前の旧 `yyyymmdd.txt` を **`_2` `_3`…** に退避（枝番＝履歴）。
 * - `_N` はアーカイブのみ。検証は **当日の yyyymmdd.txt が正本と一致**すれば OK。
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
 * 次に使うアーカイブファイル名（`NEW-SESSION-STARTER_${d}_N.txt`、N>=2）。
 * @param {string} destDir
 * @param {string} d yyyymmdd
 */
export function nextStarterArchiveFilename(destDir, d) {
  let k = 2;
  while (k < 100000) {
    const name = `NEW-SESSION-STARTER_${d}_${k}.txt`;
    if (!fs.existsSync(path.join(destDir, name))) {
      return name;
    }
    k += 1;
  }
  throw new Error('[session-starter-desktop] アーカイブ枝番が上限に達しました');
}

/**
 * 正本 MD を Desktop の **当日 canonical** へ同期。内容変更時は旧 canonical をアーカイブ。
 * @param {string} destDir
 * @param {string} srcPath リポの NEW-SESSION-STARTER.md 絶対パス
 * @returns {{ basePath: string, archived: string | null, ymd: string }}
 */
export function syncStarterToDesktopCanonical(destDir, srcPath) {
  const ymd = getJstYyyymmdd();
  const basePath = path.join(destDir, `NEW-SESSION-STARTER_${ymd}.txt`);
  const srcBuf = fs.readFileSync(srcPath);

  let archived = null;
  if (fs.existsSync(basePath)) {
    const prev = fs.readFileSync(basePath);
    if (!prev.equals(srcBuf)) {
      const arcName = nextStarterArchiveFilename(destDir, ymd);
      const arcPath = path.join(destDir, arcName);
      fs.copyFileSync(basePath, arcPath);
      archived = arcName;
    }
  }

  fs.copyFileSync(srcPath, basePath);
  return { basePath, archived, ymd };
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
 * 指定 JST 日の **canonical** パス（ファイルが無ければ null）。
 */
export function starterCanonicalPath(destDir, ymd = getJstYyyymmdd()) {
  const p = path.join(destDir, `NEW-SESSION-STARTER_${ymd}.txt`);
  return fs.existsSync(p) ? p : null;
}

/** 項番 -1 用のファイル名（当日 JST） */
export function recommendedStarterPasteFilename(ymd = getJstYyyymmdd()) {
  return `NEW-SESSION-STARTER_${ymd}.txt`;
}

/**
 * @deprecated 互換: evening-reflect 等。canonical のみ返す。
 */
export function pickLatestStarterDesktopPathForDate(destDir, ymd = getJstYyyymmdd()) {
  return starterCanonicalPath(destDir, ymd);
}

/**
 * 当日 canonical が正本と一致するか（アーカイブは検証しない）。
 */
export function starterCanonicalMatchesRepo(destDir, srcBuf, ymd = getJstYyyymmdd()) {
  const p = path.join(destDir, `NEW-SESSION-STARTER_${ymd}.txt`);
  if (!fs.existsSync(p)) {
    return { ok: false, path: p, reason: 'missing' };
  }
  const disk = fs.readFileSync(p);
  if (!disk.equals(srcBuf)) {
    return { ok: false, path: p, reason: 'mismatch' };
  }
  return { ok: true, path: p };
}
