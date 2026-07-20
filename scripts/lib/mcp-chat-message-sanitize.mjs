/**
 * MCP chat / chat_completion 向けメッセージ準備（#S-MCP-01）
 * - 改行・制御文字を正規化して JSON 直埋め壊れを減らす
 * - 長文は一時ファイル化し短い参照メッセージにする
 * - 呼び出し失敗時は1回リトライしてから MCPスキップ を検討
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** この文字数を超えたら一時ファイル化を推奨 */
export const MCP_CHAT_FILE_THRESHOLD = 1200;

/**
 * @param {string} text
 * @returns {string}
 */
export function sanitizeMcpChatMessage(text) {
  if (text == null) return '';
  let s = String(text);
  // 生の改行は JSON 手組みで壊れやすい → 実改行は残しつつ前後空白を整理
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // ヌル・その他制御文字（タブ・改行以外）を除去
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return s.trim();
}

/**
 * CallMcpTool 用に短い安全な message を返す。
 * 長文は tmp に書き、参照パスだけを message にする。
 *
 * @param {string} text
 * @param {{ threshold?: number, tmpDir?: string, prefix?: string }} [opts]
 * @returns {{ message: string, usedFile: boolean, filePath: string | null, originalLength: number }}
 */
export function prepareMcpChatMessage(text, opts = {}) {
  const threshold = opts.threshold ?? MCP_CHAT_FILE_THRESHOLD;
  const sanitized = sanitizeMcpChatMessage(text);
  const originalLength = sanitized.length;

  if (originalLength <= threshold) {
    return {
      message: sanitized,
      usedFile: false,
      filePath: null,
      originalLength,
    };
  }

  const tmpDir = opts.tmpDir ?? os.tmpdir();
  const prefix = opts.prefix ?? 'mcp-chat-';
  const filePath = path.join(
    tmpDir,
    `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`
  );
  fs.writeFileSync(filePath, sanitized, 'utf8');

  const message = [
    '長いプロンプトは一時ファイルに書きました。内容を読んでから回答してください。',
    `path: ${filePath}`,
    '（読み取れない場合は短い要約だけ返し、MCPスキップ前に1回リトライしてください）',
  ].join(' ');

  return {
    message,
    usedFile: true,
    filePath,
    originalLength,
  };
}

/**
 * 1回リトライ用ラッパ。fn が throw / 偽値なら1回だけ再実行。
 * @template T
 * @param {() => Promise<T> | T} fn
 * @param {{ isFailure?: (result: T) => boolean }} [opts]
 * @returns {Promise<{ result: T, attempts: number }>}
 */
export async function withOneRetry(fn, opts = {}) {
  const isFailure = opts.isFailure ?? (() => false);
  let attempts = 1;
  let result = await fn();
  if (isFailure(result)) {
    attempts = 2;
    result = await fn();
  }
  return { result, attempts };
}
