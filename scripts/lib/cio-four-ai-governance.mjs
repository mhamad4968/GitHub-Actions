/**
 * 方式B（固定4AI体制）自律統制 — 共有ロジック（タスクA/B/C）
 * @see docs/runbooks/cio-four-ai-governance.md
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** §1-2-2 / CEO 2026-05-21 タスクA — silent fallback 検知 */
export const RE_SWITCHED_TO_COMPOSER =
  /Switched\s+to\s+Composer(?:\s*(?:2(?:\.5)?|2\.5))?(?:\s+after\s+reaching\s+API\s+limit)?/i;

/** 単独駆動の疑い（ログ監査用・補助） */
export const RE_COMPOSER_SOLO_CONTEXT =
  /(?:composer[_\s-]?2(?:\.5)?|Composer\s*2\.5).{0,120}(?:単独|solo|without\s+(?:CIO|DeepSeek|§50-3-8))/i;

export const MODE_B_INTERLOCK_MESSAGE =
  '【警告】方式B違反：CIO（Claude Opus 4.7）の指揮、および残るメンバー（Kimi・DeepSeek）の検証を経ない単独保存・deployは憲法違反です';

/** §50-3-8 証跡（チャット貼付・ログ・スタンプ JSON） */
export const RE_5038_EVIDENCE =
  /(?:\[§50-3-8\]\s*実施済|§50-3-8\s*スキップ理由\s*:|§50-3-8\s*突合|約\s*3\s*行突合メモ|mcp_user-deepseek|DeepSeek\s*(?:検証|1\s*問|盲点)|\[役割:\s*CIO\s*セカンドオピニオン\s*\/\s*§50-3-8)/i;

/** 仕様意味に触れるパス（タスクB） */
export const SPEC_TOUCH_GLOBS = [
  /^customize\//,
  /\/SPEC\.md$/i,
  /spec\.md$/i,
  /docs\/plans\/.*-spec\.md$/i,
];

export const MODE_B_CANONICAL_PATHS = [
  'chat-sessions/session-starter-parts/part-A-constitution-kernel.md',
  '.cursor/rules/deepseek-cursor-spec-division.mdc',
  'AGENTS.md',
  '.cursor/rules/cio-constitution.mdc',
  'docs/plans/2026-05-21-cio-session-model-override.md',
];

/** ゾンビ検知（方式Bと矛盾する「旧1行実務=Kimiコード」等） */
export const ZOMBIE_PATTERNS = [
  {
    id: 'TABLE_KIMI_SOLE_CODE',
    pattern: /\|\s*\*\*実務担当\*\*\s*\|\s*\*\*Kimi\*\*[^|\n]*\|\s*コード\/長文/,
    hint: '実務担当を Composer 2.5（コード）+ Kimi（長文）に分割',
  },
  {
    id: 'MCP_DELEGATION_CODE_KIMI',
    pattern: /MCP\s*厳格委譲\*\*\s*=\s*コード=Kimi/,
    hint: 'コード diff=Composer 2.5 Subagent に更新',
  },
  {
    id: 'IMAGE_GEN_MCP_NOT_DEFERRED',
    pattern: /(?:画像生成\s*MCP\s*(?:を)?(?:導入|採用|有効化)|dall-?e-mcp|stable-?diffusion-mcp)/i,
    hint: '画像生成 MCP は見送り（GenerateImage + assets/images/ のみ）',
  },
];

export const PRUNE_SAFE_REPLACEMENTS = [
  {
    id: 'MCP_DELEGATION_CODE_KIMI',
    pattern: /(\*\*MCP 厳格委譲\*\* = )コード=Kimi/g,
    replacement: '$1**コード diff=Composer 2.5 Subagent** / 長文=Kimi',
  },
  {
    id: 'READ_PACK_ALWAYSAPPLY_TRUE',
    pattern: /deepseek-cursor-spec-division\.mdc`\*\*（`alwaysApply: true`）/g,
    replacement: 'deepseek-cursor-spec-division.mdc`（`alwaysApply: false` + `globs`）',
  },
];

const LOG_SCAN_REL = [
  'logs/report-turn-head-audit.log',
  'logs/report-precheck.log',
  'logs/report-checksheet-violations.log',
  'logs/session-start-hook.log',
  'logs/mcp-chat-stamp-latest.txt',
  '.cursor/hooks/state/report-pipeline-current.json',
  '.cursor/hooks/state/report-precheck-last.json',
  '.cursor/hooks/state/pending-report-checksheet.json',
];

export function governanceDir(root) {
  return path.join(root, 'logs', 'cio-four-ai-governance');
}

export function evidence5038Path(root) {
  return path.join(governanceDir(root), '5038-stamp.json');
}

export function composerScanPath(root) {
  return path.join(governanceDir(root), 'composer-violations.log');
}

export function listLogSources(root) {
  const out = [];
  for (const rel of LOG_SCAN_REL) {
    const abs = path.join(root, rel);
    if (fs.existsSync(abs)) out.push(abs);
  }
  const govDir = governanceDir(root);
  if (fs.existsSync(govDir)) {
    for (const n of fs.readdirSync(govDir)) {
      const abs = path.join(govDir, n);
      if (fs.statSync(abs).isFile()) out.push(abs);
    }
  }
  const logsDir = path.join(root, 'logs');
  if (fs.existsSync(logsDir)) {
    for (const n of fs.readdirSync(logsDir)) {
      if (!n.endsWith('.log') && !n.endsWith('.txt')) continue;
      const abs = path.join(logsDir, n);
      if (!out.includes(abs) && fs.statSync(abs).isFile()) out.push(abs);
    }
  }
  return out;
}

export function scanTextForComposerViolation(text, sourceLabel = '') {
  const hits = [];
  const lines = String(text || '').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (RE_SWITCHED_TO_COMPOSER.test(line)) {
      hits.push({ source: sourceLabel, line: i + 1, excerpt: line.trim().slice(0, 200), kind: 'silent_fallback' });
    }
    if (RE_COMPOSER_SOLO_CONTEXT.test(line)) {
      hits.push({ source: sourceLabel, line: i + 1, excerpt: line.trim().slice(0, 200), kind: 'solo_context' });
    }
  }
  return hits;
}

export function scanLogsForComposerViolations(root, { maxBytesPerFile = 512_000 } = {}) {
  const all = [];
  for (const abs of listLogSources(root)) {
    try {
      const stat = fs.statSync(abs);
      const buf = fs.readFileSync(abs);
      const slice = buf.length > maxBytesPerFile ? buf.subarray(buf.length - maxBytesPerFile) : buf;
      const text = slice.toString('utf8');
      const rel = path.relative(root, abs).replace(/\\/g, '/');
      all.push(...scanTextForComposerViolation(text, rel));
    } catch {
      /* skip */
    }
  }
  return all;
}

export function read5038Stamp(root) {
  const p = evidence5038Path(root);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

export function write5038Stamp(root, payload) {
  const dir = governanceDir(root);
  fs.mkdirSync(dir, { recursive: true });
  const data = {
    stampedAt: new Date().toISOString(),
    ...payload,
  };
  fs.writeFileSync(evidence5038Path(root), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return data;
}

export function has5038EvidenceInText(text) {
  return RE_5038_EVIDENCE.test(String(text || ''));
}

export function collect5038EvidenceFromLogs(root) {
  const sources = [];
  for (const abs of listLogSources(root)) {
    try {
      const text = fs.readFileSync(abs, 'utf8');
      if (has5038EvidenceInText(text)) {
        sources.push(path.relative(root, abs).replace(/\\/g, '/'));
      }
    } catch {
      /* skip */
    }
  }
  const stamp = read5038Stamp(root);
  if (stamp?.stampedAt && (stamp.text || stamp.skipReason || stamp.mode === 'deepseek')) {
    sources.push('logs/cio-four-ai-governance/5038-stamp.json');
  }
  return sources;
}

export function isSpecTouchPath(relPath) {
  const p = relPath.replace(/\\/g, '/');
  return SPEC_TOUCH_GLOBS.some((re) => re.test(p));
}

export function listStagedSpecPaths(root) {
  try {
    const out = execSync('git diff --cached --name-only', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter(isSpecTouchPath);
  } catch {
    return [];
  }
}

const ZOMBIE_SCAN_DIRS = [
  '.cursor/rules',
  'chat-sessions/session-starter-parts',
  'chat-sessions/desktop-ai-emergency-read-pack',
  'docs/plans',
  'docs/runbooks',
];

export function collectZombieScanFiles(root) {
  const files = [];
  for (const relDir of ZOMBIE_SCAN_DIRS) {
    const absDir = path.join(root, relDir);
    if (!fs.existsSync(absDir)) continue;
    const walk = (dir, prefix) => {
      for (const name of fs.readdirSync(dir)) {
        const abs = path.join(dir, name);
        const rel = `${prefix}/${name}`.replace(/\\/g, '/');
        if (fs.statSync(abs).isDirectory()) {
          if (name === 'node_modules' || name === '.git') continue;
          walk(abs, rel);
          continue;
        }
        if (/\.(mdc|md|txt)$/.test(name) && !rel.includes('constitution.mdc')) {
          files.push(rel);
        }
      }
    };
    walk(absDir, relDir);
  }
  return files;
}

export function scanFileForZombies(relPath, content) {
  const issues = [];
  const text = String(content || '');

  for (const z of ZOMBIE_PATTERNS) {
    if (z.pattern.test(text)) {
      issues.push({ id: z.id, hint: z.hint, relPath });
    }
  }

  if (MODE_B_CANONICAL_PATHS.includes(relPath) && !text.includes('Composer 2.5')) {
    issues.push({ id: 'MISSING_COMPOSER_25_IN_CANON', hint: 'Composer 2.5 表記なし', relPath });
  }

  if (MODE_B_CANONICAL_PATHS.includes(relPath)) {
    if (!/方式B|§1-2-3-4|2026-05-21/.test(text) && relPath.includes('part-A')) {
      issues.push({ id: 'MISSING_MODE_B_MARKER', hint: '方式B / §1-2-3-4 参照を追記', relPath });
    }
  }

  return issues;
}

export function scanRepoForZombies(root) {
  const all = [];
  for (const rel of collectZombieScanFiles(root)) {
    const abs = path.join(root, rel);
    const content = fs.readFileSync(abs, 'utf8');
    all.push(...scanFileForZombies(rel, content));
  }
  return all;
}

export function applySafePruneToFile(content) {
  let next = content;
  let changed = false;
  for (const r of PRUNE_SAFE_REPLACEMENTS) {
    if (r.pattern.test(next)) {
      next = next.replace(r.pattern, r.replacement);
      changed = true;
    }
  }
  return { content: next, changed };
}

export function emitInterlockFailure(kind, detail = '') {
  console.error('');
  console.error(MODE_B_INTERLOCK_MESSAGE);
  if (kind) console.error(`  種別: ${kind}`);
  if (detail) console.error(`  詳細: ${detail}`);
  console.error('  → CIO（Opus 4.7）: DeepSeek へ盲点チェック（§50-3-8）→ 約3行突合メモ → Composer Subagent 起用を 🎖️ に明記');
  console.error('  緊急のみ: SKIP_CIO_MODE_B_INTERLOCK=1（浜田 GO + チャット理由1行）');
  console.error('');
}
