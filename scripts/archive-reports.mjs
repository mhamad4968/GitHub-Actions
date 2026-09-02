#!/usr/bin/env node
/**
 * Z-3: docs/reports/ の先月分 *.md を docs/reports/archive/YYYY-MM/ へ移動し 1 commit する。
 * CI 針（test-evening-improvements-*）は live パスをハードコードしうる。
 * 移動後も 1 実体で解決する: scripts/lib/resolve-archived-report.mjs
 * @see docs/plans/2026-04-26-Z3-reports-archive-design.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(REPO_ROOT, 'docs', 'reports');

/** @returns {{ year: number, month: number, day: number }} JST 暦 */
export function jstCalendarParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

export function previousMonthLabel(year, month) {
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}

function git(args) {
  return spawnSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
}

function isGitTracked(relPosix) {
  const r = git(['ls-files', '--error-unmatch', relPosix]);
  return r.status === 0;
}

/**
 * @param {{ dryRun?: boolean, force?: boolean, logger?: (s: string) => void }} opts
 * @returns {Record<string, unknown>}
 */
export function maybeArchivePreviousMonth(opts = {}) {
  const { dryRun = false, force = false, logger = () => {} } = opts;
  const log = (m) => {
    try {
      logger(m);
    } catch {
      /* ignore */
    }
  };

  const jst = jstCalendarParts();
  if (!force && jst.day !== 1) {
    return { skipped: true, reason: 'not-JST-first-of-month', jst };
  }

  const prevLabel = previousMonthLabel(jst.year, jst.month);
  const archiveDirAbs = path.join(REPORT_DIR, 'archive', prevLabel);
  const archiveRel = `docs/reports/archive/${prevLabel}`;

  if (fs.existsSync(archiveDirAbs)) {
    const entries = fs.readdirSync(archiveDirAbs).filter((x) => x.endsWith('.md') && x !== '.gitkeep');
    if (entries.length > 0) {
      return { skipped: true, reason: 'archive-already-has-md', dest: archiveRel, jst, files: entries.length };
    }
  }

  const all = fs.readdirSync(REPORT_DIR);
  const prefix = `${prevLabel}-`;
  const candidates = all.filter(
    (f) => f.endsWith('.md') && f.startsWith(prefix) && f !== 'README.md',
  );
  candidates.sort();

  log(
    `[archive-reports] INFO ${candidates.length} files → ${archiveRel}/ (CI live pins: scripts/lib/resolve-archived-report.mjs)`,
  );

  if (candidates.length === 0) {
    return { skipped: true, reason: 'no-matching-files', prevLabel, jst };
  }

  if (dryRun) {
    log(`[archive-reports] dry-run: ${candidates.length} files → ${archiveRel}/`);
    return {
      skipped: false,
      dryRun: true,
      moved: candidates.length,
      dest: archiveRel,
      files: candidates,
      jst,
    };
  }

  fs.mkdirSync(archiveDirAbs, { recursive: true });

  const movedNames = [];
  for (const name of candidates) {
    const fromRel = path.posix.join('docs', 'reports', name);
    const toRel = path.posix.join('docs', 'reports', 'archive', prevLabel, name);

    if (isGitTracked(fromRel)) {
      const st = git(['mv', fromRel, toRel]);
      if (st.status !== 0) {
        log(`[archive-reports] git mv FAIL ${name}: ${st.stderr || st.stdout}`);
        return { ok: false, error: st.stderr || st.stdout, moved: movedNames.length, file: name };
      }
    } else {
      const fromAbs = path.join(REPORT_DIR, name);
      const toAbs = path.join(archiveDirAbs, name);
      try {
        fs.renameSync(fromAbs, toAbs);
      } catch (e) {
        return { ok: false, error: `rename ${name}: ${e.message}`, moved: movedNames.length };
      }
      const ad = git(['add', toRel]);
      if (ad.status !== 0) {
        return { ok: false, error: ad.stderr || ad.stdout, moved: movedNames.length, file: name };
      }
    }
    movedNames.push(name);
  }

  const stAdd = git(['add', archiveRel]);
  if (stAdd.status !== 0) {
    return { ok: false, error: stAdd.stderr || stAdd.stdout, moved: movedNames.length };
  }

  const msg = `[CHORE] archive: docs/reports/${prevLabel}-* (${movedNames.length} files) — Z-3`;
  // 他ディレクトリに先行 stage があるリポでも docs/reports 配下だけをこのコミットに閉じる
  const c = git(['commit', '-m', msg, '--', 'docs/reports']);
  if (c.status !== 0) {
    log(`[archive-reports] commit: ${c.stdout} ${c.stderr}`);
    return {
      ok: false,
      error: c.stderr || c.stdout || 'commit failed',
      moved: movedNames.length,
      committed: false,
    };
  }

  const abbrev = git(['rev-parse', '--short', 'HEAD']);
  const commitAbbrev = (abbrev.stdout || '').trim();

  return {
    skipped: false,
    moved: movedNames.length,
    dest: archiveRel,
    prevLabel,
    jst,
    commitAbbrev,
    files: movedNames,
  };
}

const ranAsCli =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (ranAsCli) {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const r = maybeArchivePreviousMonth({ dryRun, force, logger: console.log });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.ok === false ? 2 : 0);
}
