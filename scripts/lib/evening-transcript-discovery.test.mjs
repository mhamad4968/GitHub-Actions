#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { discoverRecentTranscripts } from './evening-transcript-discovery.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'evening-transcripts-'));
try {
  const nested = path.join(root, 'project', 'agent-transcripts');
  fs.mkdirSync(nested, { recursive: true });
  fs.writeFileSync(path.join(nested, 'old.jsonl'), '{}\n', 'utf8');
  fs.writeFileSync(path.join(nested, 'new.jsonl'), '{}\n{}\n', 'utf8');
  fs.writeFileSync(path.join(nested, 'ignore.txt'), 'x', 'utf8');
  const oldTime = new Date(Date.now() - 86_400_000);
  fs.utimesSync(path.join(nested, 'old.jsonl'), oldTime, oldTime);

  const found = discoverRecentTranscripts({
    roots: [root],
    sinceMs: Date.now() - 60_000,
    limit: 5,
  });
  assert.deepEqual(found.map((item) => path.basename(item.path)), ['new.jsonl']);
  assert.equal(found[0].bytes, 6);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log('[test:evening-transcript-discovery] OK');
