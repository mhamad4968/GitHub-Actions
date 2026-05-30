/**
 * kintone customize/** からフィールドコード候補を抽出（confidence 付き）
 */
import fs from 'node:fs';
import path from 'node:path';

const RED = '\x1b[31m';
const RESET = '\x1b[0m';

const HIGH_PATTERNS = [
  { re: /record\s*\[\s*['"]([a-z][a-z0-9_]*)['"]\s*\]/gi, confidence: 'high' },
  { re: /record\.([a-z][a-z0-9_]{2,})\b/g, confidence: 'high' },
  { re: /['"]([a-z][a-z0-9_]{2,})['"]\s*:\s*(?:record|value|\.value)/gi, confidence: 'high' },
  { re: /(?:monthly_breakdown|payment_breakdown)\.value\[(\d+)\]\.value\.([a-z][a-z0-9_]*)/gi, confidence: 'high' },
  { re: /\.value\.([a-z][a-z0-9_]{2,})\b/g, confidence: 'medium' },
  { re: /fields\.([a-z][a-z0-9_]{2,})/gi, confidence: 'medium' },
  { re: /fieldCode\s*[:=]\s*['"]([a-z][a-z0-9_]*)['"]/gi, confidence: 'high' },
  { re: /getFieldElement\s*\(\s*['"]([a-z][a-z0-9_]*)['"]\s*\)/gi, confidence: 'high' },
  { re: /setFieldShown\s*\(\s*['"]([a-z][a-z0-9_]*)['"]/gi, confidence: 'high' },
];

export function loadAllowlist(root) {
  const p = path.join(root, 'data/kintone-field-allowlist.json');
  if (!fs.existsSync(p)) return { global: [], excludeFiles: [], excludeDirs: [] };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function loadRegistry(root) {
  const p = path.join(root, 'data/kintone-field-registry.json');
  if (!fs.existsSync(p)) throw new Error('missing data/kintone-field-registry.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function resolveAppFields(registry, appId) {
  const app = registry.apps?.[appId];
  if (!app) return { recordFields: new Set(), subtables: {} };
  const recordFields = new Set(app.recordFields || []);
  let subtables = { ...(app.subtables || {}) };
  if (app.inheritsRecordFieldsFrom) {
    const parent = registry.apps[app.inheritsRecordFieldsFrom];
    if (parent?.recordFields) for (const f of parent.recordFields) recordFields.add(f);
  }
  if (app.inheritsSubtablesFrom) {
    const parent = registry.apps[app.inheritsSubtablesFrom];
    if (parent?.subtables) subtables = { ...parent.subtables, ...subtables };
  }
  return { recordFields, subtables };
}

function globSimple(name, patterns) {
  for (const pat of patterns) {
    const re = new RegExp('^' + pat.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$', 'i');
    if (re.test(name.replace(/\\/g, '/'))) return true;
  }
  return false;
}

export function listCustomizeJsFiles(root, allowlist, appDir) {
  const base = path.join(root, 'customize', appDir);
  if (!fs.existsSync(base)) return [];
  const out = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const rel = path.relative(root, full).replace(/\\/g, '/');
      if (fs.statSync(full).isDirectory()) {
        if (allowlist.excludeDirs?.some((d) => rel.includes(d))) continue;
        walk(full);
        continue;
      }
      if (!/\.js$/i.test(name)) continue;
      if (globSimple(rel, allowlist.excludeFiles || [])) continue;
      out.push(rel);
    }
  }
  walk(base);
  return out;
}

function extractFromText(text, file, allowGlobal) {
  const hits = new Map();
  function add(code, confidence, line) {
    if (!code || allowGlobal.has(code)) return;
    if (/^\d+$/.test(code)) return;
    if (code.startsWith('y678') || code.startsWith('gaia') || code.startsWith('cybozu')) return;
    const prev = hits.get(code);
    const rank = { high: 3, medium: 2, low: 1 };
    if (!prev || rank[confidence] > rank[prev.confidence]) {
      hits.set(code, { code, confidence, file, line });
    }
  }

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;
    for (const { re, confidence } of HIGH_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line))) {
        const code = m[m.length - 1];
        if (code) add(code, confidence, i + 1);
      }
    }
  }

  return [...hits.values()];
}

export function extractFromFile(root, rel, allowGlobal) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  return extractFromText(text, rel, allowGlobal);
}

export function auditApp(root, registry, appId, options = {}) {
  const allowlist = loadAllowlist(root);
  const allowGlobal = new Set([...(allowlist.global || []), ...(options.extraAllow || [])]);
  const app = registry.apps[appId];
  if (!app) return { ok: true, skipped: true, issues: [] };

  const { recordFields, subtables } = resolveAppFields(registry, appId);
  const allRegistered = new Set(recordFields);
  for (const cols of Object.values(subtables)) for (const c of cols) allRegistered.add(c);

  const issues = [];
  const dirs = app.customizeDirs || [appId];
  const files = [];
  for (const d of dirs) files.push(...listCustomizeJsFiles(root, allowlist, d));

  if (!files.length) {
    return { ok: true, issues: [], files: [], appId, warning: `customize/${dirs[0]} に JS 無し` };
  }

  const seen = new Map();
  for (const rel of files) {
    for (const hit of extractFromFile(root, rel, allowGlobal)) {
      const prev = seen.get(hit.code);
      if (!prev || hit.confidence === 'high') seen.set(hit.code, hit);
    }
  }

  for (const hit of seen.values()) {
    if (allRegistered.has(hit.code)) continue;
    const severity = hit.confidence === 'high' ? 'error' : 'warn';
    issues.push({
      ...hit,
      severity,
      message: `未登録フィールド \`${hit.code}\` (${hit.confidence}) — registry 台帳に無し`,
    });
  }

  const blocking = issues.filter((i) => i.severity === 'error' || (options.mediumFail && i.severity === 'warn'));
  return { ok: blocking.length === 0, issues, blocking, files, appId, registered: [...allRegistered] };
}

export function printFieldIssues(issues) {
  for (const i of issues) {
    console.error(`${RED}[verify:kintone-fields] ${i.message}${RESET}`);
    console.error(`  at ${i.file}:${i.line} (${i.confidence})`);
  }
}
