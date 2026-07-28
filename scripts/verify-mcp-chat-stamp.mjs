#!/usr/bin/env node
/**
 * verify-mcp-chat-stamp.mjs — P3 定義検証の軽量回帰
 */
import assert from 'node:assert/strict';
import {
  buildMcpChatStamp,
  extractRagPaths,
  toWindowsPath,
} from './mcp-chat-stamp.mjs';

assert.equal(
  toWindowsPath('/mnt/c/Users/mhamada202408224/kintone-ai-lab/.rag/lancedb'),
  'C:\\Users\\mhamada202408224\\kintone-ai-lab\\.rag\\lancedb',
);

const sample = {
  args: [
    '-lc',
    'export DB_PATH=/mnt/c/Users/x/lab/.rag/lancedb BASE_DIR=/mnt/c/Users/x/lab && exec npx',
  ],
};
const paths = extractRagPaths(sample);
assert.equal(paths.dbPath, '/mnt/c/Users/x/lab/.rag/lancedb');
assert.equal(paths.baseDir, '/mnt/c/Users/x/lab');

const stamp = buildMcpChatStamp();
assert.ok(stamp.line.length > 10);
assert.ok(
  stamp.line.startsWith('MCP定義検証:') || stamp.line.startsWith('MCPスキップ:'),
  stamp.line,
);
console.log(`[verify-mcp-chat-stamp] OK ${stamp.line}`);
