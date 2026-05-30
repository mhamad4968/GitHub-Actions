/**
 * 拡張案3 — デッドコード（未使用 export 関数）検出・退避
 * 凍結中: scripts/** のみ（customize/** は Q36 GO 前スキャンのみ・変更なし）
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export const ARCHIVE_REL = 'docs/archive/dead-codes';
export const SKIP_NAMES = new Set([
  'main',
  'defaultState',
  'repoRoot',
  'loadState',
  'saveState',
  'walk',
  'run',
  'auditEnvIntegrity',
  'selfHealEnv',
]);

export function listSourceFiles(root, dirs) {
  const out = [];
  for (const dir of dirs) {
    const base = path.join(root, dir);
    if (!fs.existsSync(base)) continue;
    function walk(d) {
      for (const name of fs.readdirSync(d)) {
        if (name === 'node_modules' || name === 'archive') continue;
        const p = path.join(d, name);
        const st = fs.statSync(p);
        if (st.isDirectory()) walk(p);
        else if (/\.(mjs|js)$/.test(name)) out.push(path.relative(root, p).replace(/\\/g, '/'));
      }
    }
    walk(base);
  }
  return out;
}

export function extractExportedFunctions(text) {
  const names = [];
  const re =
    /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|export\s*\{\s*([^}]+)\s*\}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m[1]) names.push(m[1]);
    if (m[2]) {
      for (const part of m[2].split(',')) {
        const n = part.trim().split(/\s+as\s+/)[0].trim();
        if (n) names.push(n);
      }
    }
  }
  return names.filter((n) => !SKIP_NAMES.has(n));
}

export function scanDeadCode(root, { includeCustomize = false } = {}) {
  const dirs = ['scripts'];
  if (includeCustomize) dirs.push('customize');
  const files = listSourceFiles(root, dirs);
  const corpus = files
    .map((rel) => fs.readFileSync(path.join(root, rel), 'utf8'))
    .join('\n');

  const hits = [];
  for (const rel of files) {
    const base = path.basename(rel, '.mjs');
    const imported = new RegExp(`['"][^'"]*${base}\\.mjs['"]`).test(corpus);
    if (imported) continue;

    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    for (const fn of extractExportedFunctions(text)) {
      const useRe = new RegExp(`\\b${fn}\\b`, 'g');
      const matches = corpus.match(useRe) || [];
      if (matches.length <= 1) {
        hits.push({ file: rel, fn, reason: 'unreferenced-export' });
      }
    }
  }
  return hits;
}

export function archiveDeadCode(root, hits, { apply = false } = {}) {
  const moved = [];
  const archiveRoot = path.join(root, ARCHIVE_REL);
  if (apply) fs.mkdirSync(archiveRoot, { recursive: true });

  const byFile = new Map();
  for (const h of hits) {
    if (!byFile.has(h.file)) byFile.set(h.file, []);
    byFile.get(h.file).push(h);
  }

  for (const [rel, fns] of byFile) {
    const src = path.join(root, rel);
    const snippet = [
      `/** Archived dead code — ${new Date().toISOString()} */`,
      `/** Functions: ${fns.map((f) => f.fn).join(', ')} */`,
      fs.readFileSync(src, 'utf8'),
    ].join('\n');
    const destRel = path.join(ARCHIVE_REL, rel).replace(/\\/g, '/');
    const dest = path.join(root, destRel);
    if (apply) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, snippet, 'utf8');
      for (const fn of fns) {
        const re = new RegExp(
          `(export\\s+(?:async\\s+)?function\\s+${fn}[\\s\\S]*?^})`,
          'm',
        );
        let body = fs.readFileSync(src, 'utf8');
        body = body.replace(re, `/* [WEEKEND-DEAD-CODE-PURGE] moved ${fn} → ${destRel} */\n`);
        fs.writeFileSync(src, body, 'utf8');
      }
      moved.push({ from: rel, to: destRel, fns: fns.map((f) => f.fn) });
    } else {
      moved.push({ from: rel, to: destRel, fns: fns.map((f) => f.fn), dryRun: true });
    }
  }
  return moved;
}

export function weekendCommitPush(root, moved) {
  if (!moved.length) return false;
  execSync('git add docs/archive/dead-codes scripts', { cwd: root, stdio: 'inherit', shell: true });
  execSync(
    'git commit -m "[WEEKEND-DEAD-CODE-PURGE] archive unreferenced exports" -m "Kimi×Composer weekend dead-code purge."',
    { cwd: root, stdio: 'inherit', shell: true },
  );
  return true;
}
