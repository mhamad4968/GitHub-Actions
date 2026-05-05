#!/usr/bin/env node
/**
 * [ルール確認] 用の貼付1行: チャット内 MCP（call_mcp_tool）は hook/CLI からは疎通不可のため
 * 「MCPスキップ: 未接続」形式で明示し、mcp.json の定義数だけ参考表示する。
 *
 * @see .cursor/rules/every-turn-rules-confirm.mdc（MCPスキップ:）
 * @see .cursor/hooks/session-start-autopilot.mjs（additional_context 注入）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @returns {string} 改行なし1行 */
export function buildMcpChatStampLine() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const mcpPath = path.join(home, '.cursor', 'mcp.json');
  if (!home || !fs.existsSync(mcpPath)) {
    return 'MCPスキップ: 未接続（~/.cursor/mcp.json 不在・チャット経路は未検証）';
  }
  try {
    const raw = fs.readFileSync(mcpPath, 'utf8');
    const j = JSON.parse(raw);
    const servers = j.mcpServers && typeof j.mcpServers === 'object' ? j.mcpServers : {};
    let active = 0;
    let disabled = 0;
    for (const cfg of Object.values(servers)) {
      if (cfg && cfg.disabled === true) disabled += 1;
      else active += 1;
    }
    return `MCPスキップ: 未接続（チャット経路は sessionStart 時点で未検証｜mcp.json 定義 active=${active} disabled=${disabled}）`;
  } catch {
    return 'MCPスキップ: 未接続（mcp.json 読取/JSON失敗・チャット経路は未検証）';
  }
}

function writeLatest(line) {
  const logDir = path.join(root, 'logs');
  try {
    fs.mkdirSync(logDir, { recursive: true });
    const out = `[${new Date().toISOString()}] ${line}\n`;
    fs.writeFileSync(path.join(logDir, 'mcp-chat-stamp-latest.txt'), out, 'utf8');
  } catch {
    /* noop */
  }
}

function main() {
  const line = buildMcpChatStampLine();
  writeLatest(line);
  process.stdout.write(`${line}\n`);
}

const selfAbs = path.resolve(fileURLToPath(import.meta.url));
const argvAbs = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (argvAbs === selfAbs) {
  main();
}
