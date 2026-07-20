import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  MCP_CHAT_FILE_THRESHOLD,
  prepareMcpChatMessage,
  sanitizeMcpChatMessage,
  withOneRetry,
} from './mcp-chat-message-sanitize.mjs';

test('sanitize strips control chars and normalizes CRLF', () => {
  const out = sanitizeMcpChatMessage('a\r\nb\u0000c\td');
  assert.equal(out, 'a\nbc\td');
});

test('prepare keeps short messages inline', () => {
  const r = prepareMcpChatMessage('短い確認');
  assert.equal(r.usedFile, false);
  assert.equal(r.message, '短い確認');
  assert.equal(r.filePath, null);
});

test('prepare writes long messages to temp file', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-chat-test-'));
  const long = 'あ'.repeat(MCP_CHAT_FILE_THRESHOLD + 10);
  const r = prepareMcpChatMessage(long, { tmpDir, threshold: MCP_CHAT_FILE_THRESHOLD });
  assert.equal(r.usedFile, true);
  assert.ok(r.filePath);
  assert.ok(fs.existsSync(r.filePath));
  assert.equal(fs.readFileSync(r.filePath, 'utf8'), long);
  assert.match(r.message, /path:/);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('withOneRetry retries once on failure predicate', async () => {
  let n = 0;
  const { result, attempts } = await withOneRetry(
    () => {
      n += 1;
      return n === 1 ? 'fail' : 'ok';
    },
    { isFailure: (v) => v === 'fail' }
  );
  assert.equal(result, 'ok');
  assert.equal(attempts, 2);
});
