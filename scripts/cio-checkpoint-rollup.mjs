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

/** 凍結ゾーン行数超過の再発防止: 連続空行を1行に、末尾空行を除去（内容は落とさない） */
function compactPreambleBlankLines(preamble) {
  return String(preamble || '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n+$/g, '');
}

function splitSections(text) {
  const lines = text.split('\n');
  const headerEnd = lines.findIndex((l, i) => i > 0 && /^## \d{4}-\d{2}-\d{2}/.test(l));
  if (headerEnd < 0) {
    return { preamble: text, sections: [] };
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
    const compacted = compactPreambleBlankLines(preamble);
    if (compacted !== preamble && !dryRun) {
      const rebuilt =
        compacted +
        '\n\n' +
        sections.map((s) => s.title + '\n' + s.body.join('\n')).join('\n\n') +
        (raw.endsWith('\n') ? '\n' : '');
      fs.writeFileSync(CHECKPOINT, rebuilt, 'utf8');
      preamble = compacted;
      console.log(
        `[cio:checkpoint:rollup] compacted preamble blanks ${preambleLinesBefore} → ${preamble.split('\n').length}`,
      );
    } else if (compacted !== preamble && dryRun) {
      console.log(
        `[cio:checkpoint:rollup] dry-run would compact preamble ${preambleLinesBefore} → ${compacted.split('\n').length}`,
      );
    }
  }
  if (sections.length <= keep) {
    const heal = healCheckpointGitWorktree(root, { target: 'origin' });
    if (heal.healed) {
      console.warn(
        `[cio:checkpoint:rollup] healed stale Git \`${heal.before}\` → \`${heal.hash}\` (no-op path / D-CHKPT-02)`,
      );
    }
    console.log(`[cio:checkpoint:rollup] OK no-op sections=${sections.length} keep=${keep}`);
    return;
  }
  const kept = sections.slice(0, keep);
  const archived = sections.slice(keep);
  const stamp = new Date().toISOString().slice(0, 10);
  const archiveName = `checkpoint-archive-${stamp}.md`;
  const archivePath = path.join(ARCHIVE_DIR, archiveName);

  const newCheckpoint =
    preamble +
    '\n\n' +
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
