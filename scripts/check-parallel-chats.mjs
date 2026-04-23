#!/usr/bin/env node
/**
 * check-parallel-chats.mjs — 並行 Cursor チャット検知 (TSB-011 連動)
 *
 * 検査内容:
 *   1. ~/.cursor/projects/PROJECT/agent-transcripts/UUID/UUID.jsonl のうち
 *      過去 24h 以内に書込みあったものを列挙
 *   2. git log --since='24 hours ago' --grep='Made-with: Cursor' で同期間の
 *      Cursor 経由 commit を列挙
 *   3. transcript が 2 件以上 + 同期間の Cursor commit が 2 件以上あれば ⚠
 *      (= 並行チャットが同じリポを触っていた可能性)
 *
 * 出力:
 *   - stdout markdown サマリ (朝ブリーフィング埋め込み想定)
 *   - --json で JSON のみ
 *
 * 出口コード:
 *   - 0: 並行なし or 警告なし
 *   - 1: 警告あり (並行 Cursor チャット痕跡)
 *
 * 背景: 2026-04-22 21:48 並行 Cursor チャット騒動
 *   - 浜田が無自覚で Cursor 別窓に同じ「実装手順」テンプレを貼っていた
 *   - 並行チャットが私のミス (R13 半角→全角) を発見・fix (68d1765)
 *   - 良性で済んだが、悪性化すると merge conflict / トークン 2 倍消費 / 競合の温床
 *   - TSB-011 として記録 + 朝 cron で検知する仕組みを本スクリプトで実現
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const ARG_JSON = process.argv.includes('--json');

function out(msg) { if (!ARG_JSON) console.log(msg); }

// ───── 1. transcript 列挙 ─────
const projectsDir = path.join(os.homedir(), '.cursor', 'projects');
const now = Date.now();
const since = now - 24 * 3600 * 1000;

const transcripts = [];
if (fs.existsSync(projectsDir)) {
  for (const proj of fs.readdirSync(projectsDir)) {
    const transcriptsDir = path.join(projectsDir, proj, 'agent-transcripts');
    if (!fs.existsSync(transcriptsDir)) continue;
    for (const uuid of fs.readdirSync(transcriptsDir)) {
      const file = path.join(transcriptsDir, uuid, `${uuid}.jsonl`);
      if (!fs.existsSync(file)) continue;
      const stat = fs.statSync(file);
      if (stat.mtimeMs >= since) {
        transcripts.push({
          project: proj,
          uuid: uuid.slice(0, 8),
          full_uuid: uuid,
          size: stat.size,
          mtime: new Date(stat.mtimeMs).toISOString(),
        });
      }
    }
  }
}

// ───── 2. git commit 列挙 ─────
const gitRes = spawnSync(
  'git',
  ['log', '--since=24 hours ago', '--grep=Made-with: Cursor', '--format=%h|%ai|%s'],
  { cwd: REPO_ROOT, encoding: 'utf8' }
);
const commits = (gitRes.stdout || '')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [hash, date, ...subjectParts] = line.split('|');
    return { hash, date, subject: subjectParts.join('|') };
  });

// ───── 3. 警告判定 ─────
const warn = transcripts.length >= 2 && commits.length >= 2;

const result = {
  generated_at: new Date().toISOString(),
  window_hours: 24,
  transcripts_count: transcripts.length,
  commits_count: commits.length,
  warning: warn,
  transcripts,
  commits,
};

if (ARG_JSON) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(warn ? 1 : 0);
}

out('## 🪟 並行 Cursor チャット検知 (過去 24h)');
out('');
out(`**transcripts**: ${transcripts.length} 件 / **Cursor commit**: ${commits.length} 件`);
out('');

if (transcripts.length === 0 && commits.length === 0) {
  out('✅ 過去 24h で Cursor チャット活動なし。');
  process.exit(0);
}

if (transcripts.length > 0) {
  out('### アクティブ transcript');
  out('');
  out('| UUID (先頭 8) | サイズ | 最終書込 |');
  out('|---|---|---|');
  for (const t of transcripts) {
    out(`| ${t.uuid} | ${(t.size / 1024).toFixed(1)} KB | ${t.mtime} |`);
  }
  out('');
}

if (commits.length > 0) {
  out('### Cursor 経由 commit (Made-with: Cursor)');
  out('');
  out('| hash | 日時 | subject |');
  out('|---|---|---|');
  for (const c of commits) {
    out(`| ${c.hash} | ${c.date} | ${c.subject.slice(0, 80)} |`);
  }
  out('');
}

if (warn) {
  out('### ⚠ 並行 Cursor チャット可能性');
  out('');
  out('過去 24h 以内に **2 件以上の transcript + 2 件以上の Cursor 経由 commit** を検知。');
  out('並行 Cursor チャットが同じリポを触っていた可能性あり (TSB-011 / 2026-04-22 R13 半角→全角バグ事件と同型)。');
  out('');
  out('**確認**: Cursor の窓を全部見て、意図しない並行チャットがあれば閉じる。');
  out('**対策**: 1 リポ 1 チャット原則。明示的に役割分担している場合のみ並行可。');
  out('');
}

process.exit(warn ? 1 : 0);
