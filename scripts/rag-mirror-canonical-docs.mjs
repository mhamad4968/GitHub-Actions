#!/usr/bin/env node
/**
 * rag-mirror-canonical-docs.mjs — RAG ingest 用に正本を .rag/extra-docs へコピー（§2 正本主義 / §57-10）
 *
 * 対象: RULES-INDEX.md, kintone-apps.md, AGENTS.md, WORKFLOW.md（package.json の rag:ingest:rules と整合）
 *
 * 使い方:
 *   node scripts/rag-mirror-canonical-docs.mjs           # ルート → .rag/extra-docs へ上書きコピー
 *   node scripts/rag-mirror-canonical-docs.mjs --check   # 差分があれば exit 1（CI / verify:agent-env）
 *   node scripts/rag-mirror-canonical-docs.mjs --dry-run # コピーせず差分のみ表示
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEST_DIR = path.join(ROOT, '.rag', 'extra-docs');
const FILES = ['RULES-INDEX.md', 'kintone-apps.md', 'AGENTS.md', 'WORKFLOW.md'];

const PROJECT_DOCS_MIRROR = [
  {
    src: 'docs/plans/2026-05-23-business-improvement-proposal-spec.md',
    dest: 'business-improvement-proposal-spec-2026-05-23.md',
  },
];

/** Phase 2-B: 憲法ナビ（正本4の追加ではなく .rag/extra-docs/constitution/ へミラー） */
const CONSTITUTION_MIRROR = [
  { src: 'docs/constitution/00-rule-hierarchy.md', dest: 'constitution/00-rule-hierarchy.md' },
  { src: 'docs/constitution/17-four-ai-mode-b.md', dest: 'constitution/17-four-ai-mode-b.md' },
  { src: 'docs/constitution/18-ai-team-read-map.md', dest: 'constitution/18-ai-team-read-map.md' },
];

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const DRY = argv.includes('--dry-run');

function readBuf(rel) {
  const p = path.join(ROOT, rel);
  return fs.readFileSync(p);
}

function readDest(name) {
  const p = path.join(DEST_DIR, name);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p);
}

let exit = 0;
const diffs = [];

for (const name of FILES) {
  const src = readBuf(name);
  const dst = readDest(name);
  if (dst === null || !src.equals(dst)) {
    diffs.push(name);
    if (CHECK) {
      exit = 1;
      continue;
    }
    if (!DRY) {
      fs.mkdirSync(DEST_DIR, { recursive: true });
      fs.copyFileSync(path.join(ROOT, name), path.join(DEST_DIR, name));
    }
  }
}

const projectDiffs = [];
for (const { src, dest } of PROJECT_DOCS_MIRROR) {
  const srcPath = path.join(ROOT, src);
  const destPath = path.join(DEST_DIR, dest);
  if (!fs.existsSync(srcPath)) {
    projectDiffs.push(`${src} (missing source)`);
    exit = 1;
    continue;
  }
  const srcBuf = fs.readFileSync(srcPath);
  const dstBuf = fs.existsSync(destPath) ? fs.readFileSync(destPath) : null;
  if (dstBuf === null || !srcBuf.equals(dstBuf)) {
    projectDiffs.push(dest);
    if (CHECK) {
      exit = 1;
      continue;
    }
    if (!DRY) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const constitutionDiffs = [];
for (const { src, dest } of CONSTITUTION_MIRROR) {
  const srcPath = path.join(ROOT, src);
  const destPath = path.join(DEST_DIR, dest);
  if (!fs.existsSync(srcPath)) {
    constitutionDiffs.push(`${src} (missing source)`);
    exit = 1;
    continue;
  }
  const srcBuf = fs.readFileSync(srcPath);
  const dstBuf = fs.existsSync(destPath) ? fs.readFileSync(destPath) : null;
  if (dstBuf === null || !srcBuf.equals(dstBuf)) {
    constitutionDiffs.push(dest);
    if (CHECK) {
      exit = 1;
      continue;
    }
    if (!DRY) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (CHECK) {
  if (exit !== 0) {
    console.error('❌ rag-mirror-canonical-docs: 正本と .rag/extra-docs が一致しません:');
    for (const n of diffs) console.error(`   - ${n}`);
    for (const n of constitutionDiffs) console.error(`   - constitution/${n}`);
    for (const n of projectDiffs) console.error(`   - project/${n}`);
    console.error('   対応: npm run rag:mirror:canonical-docs');
    process.exit(1);
  }
  console.log('✅ rag-mirror-canonical-docs: 4 正本 + constitution + project ミラー一致');
  process.exit(0);
}

if (DRY) {
  if (diffs.length === 0) console.log('(dry-run) 差分なし');
  else console.log('(dry-run) 更新対象:', diffs.join(', '));
  process.exit(0);
}

if (diffs.length === 0 && constitutionDiffs.length === 0 && projectDiffs.length === 0) {
  console.log('rag-mirror-canonical-docs: 既に一致（スキップ）');
} else {
  if (diffs.length) console.log('rag-mirror-canonical-docs: コピー完了 →', diffs.join(', '));
  if (projectDiffs.length) {
    console.log('rag-mirror-canonical-docs: project ミラー →', projectDiffs.join(', '));
  }
  if (constitutionDiffs.length) {
    console.log('rag-mirror-canonical-docs: constitution ミラー →', constitutionDiffs.join(', '));
  }
}
