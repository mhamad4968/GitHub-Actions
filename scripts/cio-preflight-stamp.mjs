#!/usr/bin/env node
/**
 * §35-7 連動: 本番 customize deploy の直前に「手を動かした」事実を logs に残す。
 * チャット規律の代替にはならないが、deploy を無思考連打しにくくする（最良対策の機械層）。
 *
 * @example npm run cio:preflight:674 -- --note "憲法3分+🎖️+§50-3-8突合済"
 * @example npm run cio:preflight:677 -- --note "同上" --with-git-diff-line
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const out = { app: '', note: '', withGitDiffLine: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--app' && argv[i + 1]) {
      out.app = String(argv[++i]).trim();
    } else if (argv[i] === '--note' && argv[i + 1]) {
      out.note = String(argv[++i]).trim();
    } else if (argv[i] === '--with-git-diff-line') {
      out.withGitDiffLine = true;
    }
  }
  return out;
}

/** `git diff --shortstat HEAD` の先頭 1 行（作業ツリー＋ index vs HEAD）。差分なしなら null */
function captureGitDiffShortstatLine() {
  const d = spawnSync('git', ['diff', '--no-color', '--shortstat', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
  });
  if (d.status !== 0 || !d.stdout) {
    return null;
  }
  const line = String(d.stdout).trim().split(/\r?\n/)[0];
  return line || null;
}

function main() {
  const { app, note, withGitDiffLine } = parseArgs(process.argv);
  if (!/^\d{3}$/.test(app)) {
    console.error('[cio-preflight-stamp] --app <3桁アプリID> が必要です（例: --app 674）');
    process.exit(2);
  }
  if (!note || note.length < 4) {
    console.error('[cio-preflight-stamp] --note "4文字以上" が必要です（チャット規律の一行要約）');
    process.exit(2);
  }

  const dir = path.join(root, 'logs', 'cio-preflight');
  fs.mkdirSync(dir, { recursive: true });

  let gitHead = '';
  const g = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  if (g.status === 0 && g.stdout) gitHead = String(g.stdout).trim();

  let gitDiffLine = null;
  if (withGitDiffLine) {
    gitDiffLine = captureGitDiffShortstatLine();
  }

  const payload = {
    app,
    stampedAt: new Date().toISOString(),
    note: note.slice(0, 500),
    gitHead: gitHead || null,
  };
  if (withGitDiffLine) {
    payload.gitDiffLine = gitDiffLine;
  }

  const dest = path.join(dir, `${app}.json`);
  fs.writeFileSync(dest, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`[cio-preflight-stamp] OK wrote ${path.relative(root, dest)}`);
  if (withGitDiffLine) {
    console.log(`[cio-preflight-stamp] gitDiffLine: ${gitDiffLine ?? '(差分なし・null で記録)'}`);
  }
  console.log(`[cio-preflight-stamp] このあと 45 分以内に deploy:${app} を実行してください。`);
  process.exit(0);
}

main();
