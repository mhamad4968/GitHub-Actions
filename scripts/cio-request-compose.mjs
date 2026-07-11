#!/usr/bin/env node
/**
 * 依頼効率化 — チャット貼付ブロック生成（浜田はチャット経由 · AI が実行）
 *
 *   npm run cio:request:compose -- --list
 *   npm run cio:request:compose -- --lane kintone --intent "736 PH1d" --app 736
 *   npm run cio:request:compose -- --lane doc-lane --intent "経営会議 7月" --copy
 *
 * @see docs/runbooks/cio-request-compose.md
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  buildComposeBlock,
  listLaneIds,
  loadRequestComposeTemplates,
} from './lib/cio-request-compose.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function copyWindows(text) {
  try {
    execSync('clip', { input: text, encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const out = {
    lane: '',
    intent: '',
    app: null,
    noTouch: [],
    goWait: null,
    withCeoBaseline: false,
    copy: false,
    json: false,
    list: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--lane') out.lane = argv[++i] || '';
    else if (a === '--intent') out.intent = argv[++i] || '';
    else if (a === '--app') out.app = argv[++i] || null;
    else if (a === '--no-touch') out.noTouch.push(argv[++i] || '');
    else if (a === '--go-wait') out.goWait = argv[++i] || null;
    else if (a === '--with-ceo-baseline') out.withCeoBaseline = true;
    else if (a === '--copy') out.copy = true;
    else if (a === '--json') out.json = true;
    else if (a === '--list') out.list = true;
    else if (!a.startsWith('-') && !out.intent) out.intent = a;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const templates = loadRequestComposeTemplates(root);

  if (args.list) {
    console.log('[cio:request:compose] レーン一覧:\n');
    for (const id of listLaneIds(templates)) {
      const lane = templates.lanes[id];
      const req = lane.requiredApp ? '（--app 必須）' : '';
      console.log(`  ${id}${req} → ${lane.label}`);
    }
    console.log(`\n正本: ${templates.canonicalRunbook}`);
    return;
  }

  if (!args.lane || !args.intent) {
    console.error(
      'Usage: npm run cio:request:compose -- --lane <kintone|doc-lane|constitution|ops|report> --intent "<一行>" [--app NNN] [--no-touch X] [--go-wait "..."] [--with-ceo-baseline] [--copy] [--json] [--list]'
    );
    process.exit(1);
  }

  try {
    const result = buildComposeBlock(root, {
      laneId: args.lane,
      intent: args.intent,
      app: args.app,
      noTouch: args.noTouch.filter(Boolean),
      goWait: args.goWait,
      withCeoBaseline: args.withCeoBaseline,
    });

    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('━━ 依頼ブロック（浜田確認用 · OK 後に本題）━━\n');
      console.log(result.block);
      console.log('\n━━ 運用 ━━');
      console.log('1. 上記を浜田に提示');
      console.log('2. 浜田 OK（または修正1行）');
      console.log('3. OK 後のみ pre-implement / tool:route / 実装へ');
      if (result.ceoBaseline) {
        console.log('\n（CEO最低基準全文を末尾に同梱済）');
      }
    }

    if (args.copy) {
      if (copyWindows(result.pasteText)) {
        console.log('\n✅ クリップボードにコピーしました');
      } else {
        console.log('\n⚠ clip 失敗 — 手動コピー');
      }
    }
  } catch (e) {
    console.error('[cio:request:compose] NG:', e.message);
    process.exit(2);
  }
}

main();
