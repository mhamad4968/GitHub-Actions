#!/usr/bin/env node
/**
 * 枠リマインダ — 印刷のみ。exit 0 固定。verify / cold-start 必須化禁止。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/cio-ops-frame.json'), 'utf8'));

function jstParts() {
  const iso = new Date(Date.now() + 9 * 3600 * 1000).toISOString();
  const date = iso.slice(0, 10);
  const dow = new Date(`${date}T12:00:00+09:00`).getDay();
  return { date, dow, day: Number(date.slice(8, 10)) };
}

function due(item, { dow, day }) {
  if (item.when === 'every-session') return true;
  if (item.when === 'friday') return dow === 5;
  if (item.when === 'weekly') return dow === 1 || dow === 5;
  if (item.when === 'monthly') return day <= 10;
  return false;
}

function main() {
  const now = jstParts();
  const lines = [
    `# 運用枠 ${now.date} JST`,
    '',
    '**正**: 項番 -0 が勝つ。skip 可。この印刷でセッションを止めない。',
    '',
  ];
  for (const item of manifest.items || []) {
    const mark = due(item, now) ? '今日の枠' : '枠（必須ではない）';
    lines.push(`- [${mark}] ${item.label}${item.npm?.length ? ` — \`npm run ${item.npm[0]}\`` : ''}`);
  }
  lines.push('', '本日の本題は浜田指示。枠を崩してよい。');
  const text = `${lines.join('\n')}\n`;
  console.log(text);
  const out = path.join(root, 'chat-sessions/ops-frame-latest.md');
  fs.writeFileSync(out, text, 'utf8');
  process.exit(0);
}

main();
