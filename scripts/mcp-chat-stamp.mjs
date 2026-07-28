#!/usr/bin/env node
/**
 * [ルール確認] 用の貼付1行。
 * sessionStart / CLI からは Cursor の call_mcp_tool 疎通は不可だが、
 * mcp.json 定義と rag の BASE_DIR/DB_PATH 実在は軽量検証できる（P3）。
 *
 * @see .cursor/rules/every-turn-rules-confirm.mdc
 * @see .cursor/hooks/session-start-autopilot.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** @param {string} mntOrWin */
export function toWindowsPath(mntOrWin) {
  if (!mntOrWin) return '';
  const m = String(mntOrWin).match(/^\/mnt\/([a-z])\/(.*)$/i);
  if (m) {
    return `${m[1].toUpperCase()}:\\${m[2].replace(/\//g, '\\')}`;
  }
  return mntOrWin;
}

/** @param {object} ragCfg */
export function extractRagPaths(ragCfg) {
  const blob = JSON.stringify(ragCfg || {});
  const db = blob.match(/DB_PATH=([^\s"'\\]+)/)?.[1] || '';
  const base = blob.match(/BASE_DIR=([^\s"'\\]+)/)?.[1] || '';
  return { dbPath: db, baseDir: base };
}

/**
 * @returns {{ line: string, ok: boolean, active: number, disabled: number, ragOk: boolean|null }}
 */
export function buildMcpChatStamp() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const mcpPath = path.join(home, '.cursor', 'mcp.json');
  if (!home || !fs.existsSync(mcpPath)) {
    return {
      line: 'MCPスキップ: 未接続（~/.cursor/mcp.json 不在・定義検証不可）',
      ok: false,
      active: 0,
      disabled: 0,
      ragOk: null,
    };
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

    let ragOk = null;
    const rag = servers.rag || servers['user-rag'] || null;
    if (rag) {
      const { dbPath, baseDir } = extractRagPaths(rag);
      const winDb = toWindowsPath(dbPath);
      const winBase = toWindowsPath(baseDir);
      const dbExists = winDb ? fs.existsSync(winDb) : false;
      const baseExists = winBase ? fs.existsSync(winBase) : false;
      ragOk = Boolean((!dbPath || dbExists) && (!baseDir || baseExists));
    }

    if (active === 0) {
      return {
        line: 'MCPスキップ: 未接続（mcp.json active=0）',
        ok: false,
        active,
        disabled,
        ragOk,
      };
    }

    if (ragOk === false) {
      return {
        line: `MCP定義検証: WARN active=${active} disabled=${disabled}｜ragPath欠｜チャット経路=Cursor MCP（CLI未疎通）`,
        ok: false,
        active,
        disabled,
        ragOk,
      };
    }

    const ragPart = ragOk === true ? 'ragPath=OK' : 'rag=未定義';
    return {
      line: `MCP定義検証: OK active=${active} disabled=${disabled}｜${ragPart}｜チャット経路=Cursor MCP（CLI未疎通）`,
      ok: true,
      active,
      disabled,
      ragOk,
    };
  } catch {
    return {
      line: 'MCPスキップ: 未接続（mcp.json 読取/JSON失敗・定義検証不可）',
      ok: false,
      active: 0,
      disabled: 0,
      ragOk: null,
    };
  }
}

/** @returns {string} 改行なし1行 */
export function buildMcpChatStampLine() {
  return buildMcpChatStamp().line;
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
