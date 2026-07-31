#!/usr/bin/env node
/**
 * checkpoint-latest.md を圧縮 — 先頭（凍結+直近N件）を残し古い履歴をアーカイブ
 *
 * Usage:
 *   npm run cio:checkpoint:rollup
 *   npm run cio:checkpoint:rollup -- --keep 5 --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { validateCheckpointMandatoryRead } from './lib/cio-checkpoint-mandatory-read.mjs';
import {
  healCheckpointGitWorktree,
} from './lib/cio-checkpoint-git-sync.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECKPOINT = path.join(root, 'chat-sessions/checkpoint-latest.md');
const ARCHIVE_DIR = path.join(root, 'chat-sessions/checkpoints');

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  const keepIdx = process.argv.indexOf('--keep');
  const keep = keepIdx >= 0 ? Number(process.argv[keepIdx + 1]) : 5;
  return { dryRun, keep: Number.isFinite(keep) && keep > 0 ? keep : 5 };
}

/** CRLF→LF（Windows 保存後に `\n\n` が効かず compact が no-op になる再発防止） */
function toLf(s) {
  return String(s || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/** 凍結ゾーン行数超過の再発防止: 連続空行を1行に、末尾空行を除去（内容は落とさない） */
function compactPreambleBlankLines(preamble) {
  return toLf(preamble)
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n+$/g, '');
}

/**
 * FREEZE_MAX 超過時: 三重空行→二重→単一空行を順に除去。
 * それでも超える場合は HTML コメント行を除去（本文・表は保持）。
 * 2026-08-01: CRLF だと blank compact が no-op → WARN 残留していた真因を修正。
 */
function compactPreambleToMax(preamble, maxLines) {
  let p = compactPreambleBlankLines(preamble);
  const count = (s) => toLf(s).replace(/\n+$/g, '').split('\n').length;
  if (count(p) <= maxLines) return p;

  // 二重空行を1つずつ潰す（CRLF 正規化済み）
  while (count(p) > maxLines && /\n\n/.test(p)) {
    p = p.replace(/\n\n/, '\n');
  }
  if (count(p) <= maxLines) return p;

  // HTML コメント行を落とす（<!-- ... --> 単独行）
  const withoutComments = p
    .split('\n')
    .filter((l) => !/^\s*<!--.*-->\s*$/.test(l))
    .join('\n');
  if (count(withoutComments) < count(p)) {
    p = withoutComments;
  }
  return p.replace(/\n+$/g, '');
}

function splitSections(text) {
  const lines = toLf(text).split('\n');
  const headerEnd = lines.findIndex((l, i) => i > 0 && /^## \d{4}-\d{2}-\d{2}/.test(l));
  if (headerEnd < 0) {
    return { preamble: toLf(text).replace(/\n+$/g, ''), sections: [] };
  }
  const preamble = lines.slice(0, headerEnd).join('\n').trimEnd();
  const rest = lines.slice(headerEnd);
  const sections = [];
  let current = null;
  for (const line of rest) {
    if (/^## \d{4}-\d{2}-\d{2}/.test(line)) {
      if (current) sections.push(current);
      current = { title: line, body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) sections.push(current);
  return { preamble, sections };
}

function main() {
  const { dryRun, keep } = parseArgs();
  if (!fs.existsSync(CHECKPOINT)) {
    console.error('[cio:checkpoint:rollup] NG missing', CHECKPOINT);
    process.exit(1);
  }
  const raw = fs.readFileSync(CHECKPOINT, 'utf8');
  let { preamble, sections } = splitSections(raw);
  const FREEZE_MAX = 50;
  const preambleLinesBefore = preamble.split('\n').length;
  if (preambleLinesBefore > FREEZE_MAX) {
    const compacted = compactPreambleToMax(preamble, FREEZE_MAX);
    if (compacted !== preamble && !dryRun) {
      // 区切りは単一 \n（\n\n だと空行が preamble 行数に計上され max 超過が再発する）
      const rebuilt =
        compacted.replace(/\n+$/g, '') +
        '\n' +
        sections.map((s) => s.title + '\n' + s.body.join('\n')).join('\n\n') +
        '\n';
      fs.writeFileSync(CHECKPOINT, rebuilt, 'utf8');
      preamble = compacted.replace(/\n+$/g, '');
      console.log(
        `[cio:checkpoint:rollup] compacted preamble ${preambleLinesBefore} → ${preamble.split('\n').length}`,
      );
    } else if (compacted !== preamble && dryRun) {
      console.log(
        `[cio:checkpoint:rollup] dry-run would compact preamble ${preambleLinesBefore} → ${compacted.split('\n').length}`,
      );
    } else if (compacted === preamble) {
      console.warn(
        `[cio:checkpoint:rollup] WARN preamble still ${preambleLinesBefore} > ${FREEZE_MAX} — 手動短縮が必要`,
      );
    }
  }
  // preamble 圧縮だけでも書き込んだ場合、sections≤keep ならここで終了（再読で整合）
  if (sections.length <= keep) {
    const heal = healCheckpointGitWorktree(root, { target: 'origin' });
    if (heal.healed) {
      console.warn(
        `[cio:checkpoint:rollup] healed stale Git \`${heal.before}\` → \`${heal.hash}\` (no-op path / D-CHKPT-02)`,
      );
    }
    const afterLines = preamble.split('\n').length;
    if (afterLines > FREEZE_MAX) {
      console.warn(
        `[cio:checkpoint:rollup] OK sections=${sections.length} keep=${keep} but preamble=${afterLines} > ${FREEZE_MAX}`,
      );
    } else if (preambleLinesBefore > FREEZE_MAX && afterLines <= FREEZE_MAX) {
      console.log(
        `[cio:checkpoint:rollup] OK preamble-heal sections=${sections.length} keep=${keep} lines=${afterLines}`,
      );
    } else {
      console.log(`[cio:checkpoint:rollup] OK no-op sections=${sections.length} keep=${keep}`);
    }
    return;
  }
  const kept = sections.slice(0, keep);
  const archived = sections.slice(keep);
  const stamp = new Date().toISOString().slice(0, 10);
  const archiveName = `checkpoint-archive-${stamp}.md`;
  const archivePath = path.join(ARCHIVE_DIR, archiveName);

  const newCheckpoint =
    preamble.replace(/\n+$/g, '') +
    '\n' +
    kept.map((s) => s.title + '\n' + s.body.join('\n')).join('\n\n') +
    '\n\n<!-- 古い履歴: chat-sessions/checkpoints/' +
    archiveName +
    ' -->\n';

  const archiveDoc =
    `# checkpoint アーカイブ（${stamp}）\n\n` +
    `> rollup from checkpoint-latest.md — ${archived.length} sections\n\n` +
    archived.map((s) => s.title + '\n' + s.body.join('\n')).join('\n\n') +
    '\n';

  if (dryRun) {
    console.log('[cio:checkpoint:rollup] dry-run');
    console.log(`  sections total: ${sections.length}`);
    console.log(`  keep: ${keep}, archive: ${archived.length}`);
    console.log(`  new lines: ~${newCheckpoint.split('\n').length}`);
    console.log(`  archive: ${archivePath}`);
    return;
  }

  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  if (!fs.existsSync(archivePath)) {
    fs.writeFileSync(archivePath, archiveDoc, 'utf8');
  } else {
    fs.appendFileSync(archivePath, '\n\n---\n\n' + archiveDoc.split('\n').slice(2).join('\n'), 'utf8');
  }
  fs.writeFileSync(CHECKPOINT, newCheckpoint, 'utf8');
  // D-CHKPT-02: preamble 保持でも古い Git 行が残る場合は stamp（commit は WAKE heal / close-git）
  const heal = healCheckpointGitWorktree(root, { target: 'origin' });
  if (heal.healed) {
    console.warn(
      `[cio:checkpoint:rollup] healed stale Git \`${heal.before}\` → \`${heal.hash}\` (D-CHKPT-02 / S-CLOSE-01)`,
    );
  }
  const post = validateCheckpointMandatoryRead(root);
  if (!post.ok) {
    console.error('[cio:checkpoint:rollup] NG post-rollup mandatory-read:', post.issues.join('; '));
    process.exit(1);
  }
  console.log('[cio:checkpoint:rollup] OK');
  console.log(`  kept: ${keep} sections`);
  console.log(`  archived: ${archived.length} -> ${path.relative(root, archivePath)}`);
}

main();
