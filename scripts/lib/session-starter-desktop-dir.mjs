/**
 * Desktop「AI緊急用」同期先ディレクトリの解決（Windows ネイティブ / WSL / 明示 env 共通）。
 *
 * - 既定は **浜田端末の Desktop 配下 `AI緊急用`**（リポ文書と同じ絶対パス系）。
 * - 未設定時は **win32**: `%USERPROFILE%\Desktop\AI緊急用`・**OneDrive 系（`OneDrive*` フォルダ配下の Desktop）**・**`%PUBLIC%\Desktop\AI緊急用`** 等を候補に試行。
 * - **`SESSION_STARTER_DESKTOP_DIR`** があれば最優先（**Desktop 系直下の `AI緊急用` のみ**許可してトラバーサル抑止）。
 *
 * @see chat-sessions/AI緊急用-README.txt 項目 6
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const FOLDER_NAME = 'AI緊急用';

/** WSL から Windows Desktop へ出る既定（未マウント時は存在しない） */
const DEFAULT_WSL_WINDOWS_DESKTOP = '/mnt/c/Users/mhamada202408224/Desktop/AI緊急用';

/**
 * @param {string} rawFromEnv
 * @returns {string} 正規化済み絶対パス
 */
export function assertSafeSessionStarterDesktopDir(rawFromEnv) {
  const trimmed = String(rawFromEnv || '').trim();
  if (!trimmed) {
    throw new Error('[session-starter-desktop-dir] SESSION_STARTER_DESKTOP_DIR が空です');
  }
  const resolved = path.resolve(trimmed);
  const norm = path.normalize(resolved);
  if (path.basename(norm) !== FOLDER_NAME) {
    throw new Error(
      `[session-starter-desktop-dir] SESSION_STARTER_DESKTOP_DIR の最終ディレクトリ名は「${FOLDER_NAME}」である必要があります: ${norm}`
    );
  }
  const parent = path.basename(path.dirname(norm));
  const parentOk = /^(desktop|デスクトップ)$/i.test(parent);
  if (!parentOk) {
    throw new Error(
      `[session-starter-desktop-dir] SESSION_STARTER_DESKTOP_DIR は Desktop（またはデスクトップ）直下の「${FOLDER_NAME}」のみ許可されています: ${norm}`
    );
  }
  return norm;
}

/**
 * Windows: OneDrive 商用名（`OneDrive - Contoso` 等）と Public Desktop を候補に追加。
 * @param {string} home
 * @param {string[]} raw
 */
function pushWindowsExtraDesktopCandidates(home, raw) {
  if (process.platform !== 'win32') return;
  const pub = process.env.PUBLIC || path.join(path.dirname(home), 'Public');
  try {
    raw.push(path.join(pub, 'Desktop', FOLDER_NAME));
    raw.push(path.join(pub, 'デスクトップ', FOLDER_NAME));
  } catch {
    /* ignore */
  }
  try {
    if (!fs.existsSync(home)) return;
    for (const ent of fs.readdirSync(home, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      if (!/^OneDrive/i.test(ent.name)) continue;
      raw.push(path.join(home, ent.name, 'Desktop', FOLDER_NAME));
      raw.push(path.join(home, ent.name, 'デスクトップ', FOLDER_NAME));
    }
  } catch {
    /* ignore: 権限・一時的 I/O 失敗 */
  }
}

/** @returns {string[]} 重複なし・存在確認は呼び出し側 */
export function sessionStarterDesktopDirCandidates() {
  const h = os.homedir();
  const raw = [];
  if (process.platform === 'win32') {
    raw.push(path.join(h, 'Desktop', FOLDER_NAME));
    raw.push(path.join(h, 'デスクトップ', FOLDER_NAME));
    raw.push(path.join(h, 'OneDrive', 'Desktop', FOLDER_NAME));
    raw.push(path.join(h, 'OneDrive', 'デスクトップ', FOLDER_NAME));
    pushWindowsExtraDesktopCandidates(h, raw);
  }
  raw.push(DEFAULT_WSL_WINDOWS_DESKTOP);
  if (process.platform !== 'win32') {
    raw.push(path.join(h, 'Desktop', FOLDER_NAME));
    raw.push(path.join(h, 'デスクトップ', FOLDER_NAME));
  }
  const seen = new Set();
  const out = [];
  for (const p of raw) {
    const r = path.resolve(p);
    if (!seen.has(r)) {
      seen.add(r);
      out.push(r);
    }
  }
  return out;
}

/**
 * @param {{ requireExists?: boolean }} [opts]
 * @returns {{ dir: string, source: 'env' | 'candidate', exists: boolean, tried: string[] }}
 */
export function resolveSessionStarterDesktopDir(opts = {}) {
  const requireExists = opts.requireExists !== false;
  const tried = [];

  if (process.env.SESSION_STARTER_DESKTOP_DIR) {
    const dir = assertSafeSessionStarterDesktopDir(process.env.SESSION_STARTER_DESKTOP_DIR);
    tried.push(`${dir} (SESSION_STARTER_DESKTOP_DIR)`);
    let exists = false;
    try {
      exists = fs.existsSync(dir) && fs.statSync(dir).isDirectory();
    } catch {
      exists = false;
    }
    if (requireExists && !exists) {
      return { dir, source: 'env', exists: false, tried };
    }
    return { dir, source: 'env', exists, tried };
  }

  for (const c of sessionStarterDesktopDirCandidates()) {
    tried.push(c);
    try {
      if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
        return { dir: path.resolve(c), source: 'candidate', exists: true, tried };
      }
    } catch {
      /* ignore */
    }
  }

  const fallback = sessionStarterDesktopDirCandidates()[0];
  return { dir: path.resolve(fallback), source: 'candidate', exists: false, tried };
}
